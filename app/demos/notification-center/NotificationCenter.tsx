import { useEffect, useState, useSyncExternalStore, type FormEvent } from "react";
import {
  DEMO_USER_ID,
  KUDOS_PRESETS,
  PEOPLE,
  VIEWER_IDS,
  fullName,
  getDepartment,
  getPerson,
  getTeam,
  type IntranetNotification,
} from "~/fixtures/intranet";
import { useRepeatableAnnouncement } from "~/lib/announce";
import {
  RESET_ANNOUNCEMENT,
  describeAudience,
  describeKudos,
  describeMarkAll,
  describeMarkRead,
  describeViewer,
  feedItemText,
  seenFor,
  unseenFor,
  type KudosField,
  type NotificationState,
} from "./notifications";
import { notificationStore } from "./store";
import styles from "./NotificationCenter.module.css";

function useNotificationState(): NotificationState {
  return useSyncExternalStore(
    notificationStore.subscribe,
    notificationStore.getSnapshot,
    notificationStore.getServerSnapshot,
  );
}

interface FocusRequest {
  ids: readonly string[];
  seq: number;
}

function teamNameOf(personId: string): string {
  const person = getPerson(personId);
  return person ? (getTeam(person.teamId)?.name ?? "") : "";
}

/**
 * Illustrative notification centre: notifications addressed to everyone, teams or named people, a
 * "Viewing as" selector, unseen/seen lists, mark as read, peer kudos and an activity feed. State
 * lives in memory (see ./store.ts) — nothing is saved anywhere.
 */
export function NotificationCenter() {
  const state = useNotificationState();
  const [message, announce] = useRepeatableAnnouncement();
  const [recipient, setRecipient] = useState("");
  const [presetId, setPresetId] = useState("");
  const [kudosError, setKudosError] = useState<{ field: KudosField; message: string } | null>(null);
  const [focusRequest, setFocusRequest] = useState<FocusRequest | null>(null);

  // Focus moves only after explicit actions: the first requested id that exists in the DOM wins.
  useEffect(() => {
    if (!focusRequest) return;
    for (const id of focusRequest.ids) {
      const element = document.getElementById(id);
      if (element) {
        element.focus();
        return;
      }
    }
  }, [focusRequest]);

  function requestFocus(ids: readonly string[]) {
    setFocusRequest((previous) => ({ ids, seq: (previous?.seq ?? 0) + 1 }));
  }

  const viewerId = state.viewerId;
  const viewer = getPerson(viewerId)!;
  const viewerTeam = getTeam(viewer.teamId)!;
  const viewerDepartment = getDepartment(viewer.departmentId)!;
  const unseen = unseenFor(state, viewerId);
  const seen = seenFor(state, viewerId);
  const recipientError = kudosError?.field === "recipient";
  const messageError = kudosError?.field === "message";

  function markOne(id: string) {
    const before = unseen.map((n) => n.id);
    const index = before.indexOf(id);
    const result = notificationStore.markRead(id);
    announce(describeMarkRead(result));
    if (result.ok) {
      const nextId = before[index + 1] ?? before[index - 1];
      requestFocus(nextId ? [`nc-mark-${nextId}`, "nc-unseen-heading"] : ["nc-unseen-heading"]);
    }
  }

  function markAll() {
    const result = notificationStore.markAllRead();
    announce(describeMarkAll(result, viewerId));
    if (result.ok) requestFocus(["nc-unseen-heading"]);
  }

  function submitKudos(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = notificationStore.sendKudos(recipient, presetId);
    const text = describeKudos(result);
    announce(text);
    if (result.ok) {
      setRecipient("");
      setPresetId("");
      setKudosError(null);
    } else {
      setKudosError({ field: result.field, message: text });
      requestFocus([result.field === "message" ? "nc-kudos-preset-high-five" : "nc-kudos-recipient"]);
    }
  }

  function renderMeta(n: IntranetNotification) {
    return (
      <p className={styles.meta}>
        {n.kind === "news" ? "News post" : "Notification"} from {n.from} · {n.dateLabel} · Sent to:{" "}
        {describeAudience(n, viewerId)}
      </p>
    );
  }

  return (
    <div className={styles.root} data-demo="notification-center">
      <p className={styles.note}>
        Sample data: every person, team and message here is fictional, and nothing is saved. Changes are kept only
        while you browse this site; refreshing the page or choosing Reset demo restores the sample notifications.
      </p>

      <div className={styles.toolbar}>
        <div className={styles.field}>
          <label htmlFor="nc-viewer">Viewing as</label>
          <select
            id="nc-viewer"
            className={styles.select}
            value={viewerId}
            onChange={(e) => {
              const value = e.target.value;
              announce(describeViewer(notificationStore.setViewer(value)));
              setKudosError(null);
              if (recipient === value) setRecipient("");
            }}
          >
            {VIEWER_IDS.map((id) => {
              const p = getPerson(id)!;
              return (
                <option key={id} value={id}>
                  {`${fullName(p)}${id === DEMO_USER_ID ? " (you)" : ""}, ${teamNameOf(id)} team`}
                </option>
              );
            })}
          </select>
        </div>
        <button
          type="button"
          className={styles.reset}
          onClick={() => {
            notificationStore.reset();
            setRecipient("");
            setPresetId("");
            setKudosError(null);
            announce(RESET_ANNOUNCEMENT);
          }}
        >
          Reset demo
        </button>
      </div>

      <p className={styles.status} role="status" aria-live="polite" aria-atomic="true" data-testid="notification-status">
        {message}
      </p>

      <section className={styles.section} aria-labelledby="nc-inbox-heading">
        <div className={styles.inboxHeader}>
          <h2 id="nc-inbox-heading" className={styles.heading}>
            {`Notifications for ${fullName(viewer)}`}
          </h2>
          <p className={styles.badge} data-testid="unread-count">
            {`${unseen.length} unread`}
          </p>
        </div>
        <p className={styles.muted}>
          {viewer.firstName} is on the {viewerTeam.name} team in {viewerDepartment.name}. Each notification is
          addressed to everyone, to whole teams or to named people.
        </p>

        <div className={styles.listHeader}>
          <h3 id="nc-unseen-heading" tabIndex={-1} className={styles.subheading}>
            Unseen
          </h3>
          <button type="button" id="nc-mark-all" className={styles.button} onClick={markAll}>
            Mark all as read
          </button>
        </div>
        {unseen.length === 0 ? (
          <p className={styles.muted} data-testid="unseen-empty">
            {"You're all caught up."}
          </p>
        ) : (
          <ul className={styles.list} data-testid="unseen-list" aria-labelledby="nc-unseen-heading">
            {unseen.map((n) => (
              <li key={n.id} className={styles.item}>
                <h4 className={styles.itemTitle}>{n.title}</h4>
                <p className={styles.body}>{n.body}</p>
                {renderMeta(n)}
                <button
                  type="button"
                  id={`nc-mark-${n.id}`}
                  className={styles.button}
                  aria-label={`Mark as read: ${n.title}`}
                  onClick={() => markOne(n.id)}
                >
                  Mark as read
                </button>
              </li>
            ))}
          </ul>
        )}

        <h3 id="nc-seen-heading" className={styles.subheading}>
          Seen
        </h3>
        {seen.length === 0 ? (
          <p className={styles.muted}>Nothing read yet.</p>
        ) : (
          <ul className={styles.list} data-testid="seen-list" aria-labelledby="nc-seen-heading">
            {seen.map((n) => (
              <li key={n.id} className={styles.item}>
                <h4 className={styles.itemTitle}>{n.title}</h4>
                <p className={styles.body}>{n.body}</p>
                {renderMeta(n)}
                <span className={styles.readTag}>Read</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className={styles.section} aria-labelledby="nc-kudos-heading">
        <h2 id="nc-kudos-heading" className={styles.heading}>
          Send kudos
        </h2>
        <p className={styles.muted}>Send a colleague a quick thank-you. It appears in the activity feed below.</p>
        <form id="nc-kudos-form" className={styles.form} noValidate onSubmit={submitKudos}>
          <div className={styles.field}>
            <label htmlFor="nc-kudos-recipient">Colleague</label>
            <select
              id="nc-kudos-recipient"
              className={styles.select}
              value={recipient}
              aria-invalid={recipientError || undefined}
              aria-describedby={recipientError ? "nc-kudos-error" : undefined}
              onChange={(e) => setRecipient(e.target.value)}
            >
              <option value="">Choose a colleague</option>
              {PEOPLE.filter((p) => p.id !== viewerId).map((p) => (
                <option key={p.id} value={p.id}>
                  {`${fullName(p)} (${teamNameOf(p.id)})`}
                </option>
              ))}
            </select>
          </div>
          <fieldset className={styles.fieldset} aria-describedby={messageError ? "nc-kudos-error" : undefined}>
            <legend>Message</legend>
            <div className={styles.presets}>
              {KUDOS_PRESETS.map((preset) => (
                <label key={preset.id} className={styles.preset}>
                  <input
                    type="radio"
                    name="nc-kudos-preset"
                    id={`nc-kudos-preset-${preset.id}`}
                    value={preset.id}
                    checked={presetId === preset.id}
                    aria-invalid={messageError || undefined}
                    onChange={() => setPresetId(preset.id)}
                  />{" "}
                  {preset.label}
                </label>
              ))}
            </div>
          </fieldset>
          {kudosError ? (
            <p id="nc-kudos-error" className={styles.error}>
              {kudosError.message}
            </p>
          ) : null}
          <div>
            <button type="submit" className={styles.button}>
              Send kudos
            </button>
          </div>
        </form>
      </section>

      <section className={styles.section} aria-labelledby="nc-feed-heading">
        <h2 id="nc-feed-heading" className={styles.heading}>
          Activity feed
        </h2>
        <p className={styles.muted}>Kudos and company announcements, newest first.</p>
        <ul className={styles.feed} data-testid="activity-feed">
          {state.feed.map((item) => (
            <li key={item.id}>
              <span className={item.kind === "kudos" ? styles.kindKudos : styles.kindAnnouncement}>
                {item.kind === "kudos" ? "Kudos" : "Announcement"}
              </span>{" "}
              <span>{feedItemText(item)}</span> <span className={styles.feedDate}>{item.dateLabel}</span>
            </li>
          ))}
        </ul>
      </section>

      <p className={styles.rule}>
        In the real intranet, administrators addressed each notification to everyone, to whole teams or to named
        people. Saving it added it to each recipient&rsquo;s unseen list, and marking it as read moved it to their seen
        list. Change Viewing as to see how targeting changes what each person gets.
      </p>
    </div>
  );
}

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import {
  DEPARTMENTS,
  MAP_HEIGHT,
  MAP_OUTLINE_PATH,
  MAP_WIDTH,
  PEOPLE,
  fullName,
  getDepartment,
  getPerson,
  getTeam,
  type Person,
  type PersonId,
} from "~/fixtures/intranet";
import { useRepeatableAnnouncement } from "~/lib/announce";
import {
  RESET_ANNOUNCEMENT,
  describeFilter,
  describeLocation,
  getDirectReports,
  getManager,
  isDemoUser,
  markerLabel,
  markerPosition,
  summaryLabel,
  visiblePeople,
  type MapState,
} from "./employee-map";
import { employeeMapStore } from "./store";
import styles from "./InteractiveRemoteEmployeeMap.module.css";

function useMapState(): MapState {
  return useSyncExternalStore(
    employeeMapStore.subscribe,
    employeeMapStore.getSnapshot,
    employeeMapStore.getServerSnapshot,
  );
}

type OpenedFrom = "marker" | "list" | "card";

interface FocusRequest {
  ids: readonly string[];
  seq: number;
}

const cx = (...names: (string | false | undefined)[]) => names.filter(Boolean).join(" ");

/**
 * Illustrative remote employee map: HTML button markers over a decorative outline, a profile card, a
 * department filter and a table alternative. Everything is fictional and approximate; state lives in
 * memory (see ./store.ts) — nothing is saved anywhere.
 */
export function InteractiveRemoteEmployeeMap() {
  const state = useMapState();
  const [message, announce] = useRepeatableAnnouncement();
  const openedFrom = useRef<OpenedFrom>("marker");
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

  function open(id: PersonId, source: OpenedFrom) {
    const result = employeeMapStore.selectPerson(id);
    if (result.ok) {
      openedFrom.current = source;
      requestFocus(["map-profile-heading"]);
    }
  }

  function close() {
    const id = state.selectedId;
    employeeMapStore.closeProfile();
    if (id) {
      requestFocus(
        openedFrom.current === "list"
          ? [`map-row-${id}`, `map-marker-${id}`, "map-department"]
          : [`map-marker-${id}`, `map-row-${id}`, "map-department"],
      );
    }
  }

  const people = visiblePeople(state);
  const selected = state.selectedId ? getPerson(state.selectedId) : undefined;

  function personButton(p: Person) {
    return (
      <button
        type="button"
        className={styles.linkButton}
        aria-label={`View profile: ${fullName(p)}`}
        onClick={() => open(p.id, "card")}
      >
        {fullName(p)}
      </button>
    );
  }

  function renderCard(p: Person) {
    const manager = getManager(p);
    const reports = getDirectReports(p);
    return (
      <>
        <h2 id="map-profile-heading" tabIndex={-1} className={styles.cardHeading}>
          {fullName(p)}
          {isDemoUser(p) ? " (you)" : ""}
        </h2>
        <dl className={styles.details}>
          <div>
            <dt>Title</dt>
            <dd>{p.title}</dd>
          </div>
          <div>
            <dt>Department</dt>
            <dd>{getDepartment(p.departmentId)?.name}</dd>
          </div>
          <div>
            <dt>Team</dt>
            <dd>{getTeam(p.teamId)?.name}</dd>
          </div>
          <div>
            <dt>Location</dt>
            <dd>{describeLocation(p)} (approximate)</dd>
          </div>
          <div>
            <dt>Manager</dt>
            <dd>{manager ? personButton(manager) : "No manager listed"}</dd>
          </div>
          <div>
            <dt>Direct reports</dt>
            <dd>
              {reports.length > 0 ? (
                <ul className={styles.reports}>
                  {reports.map((r) => (
                    <li key={r.id}>{personButton(r)}</li>
                  ))}
                </ul>
              ) : (
                "None"
              )}
            </dd>
          </div>
        </dl>
        <button type="button" id="map-close-profile" className={styles.button} onClick={close}>
          Close profile
        </button>
      </>
    );
  }

  return (
    <div className={styles.root} data-demo="interactive-remote-employee-map">
      <p className={styles.note}>
        Sample data: every person and place on this map is fictional, and nothing is saved. Locations are approximate by
        design: each marker shows roughly where someone is based, never an address.
      </p>

      <div className={styles.toolbar}>
        <div className={styles.field}>
          <label htmlFor="map-department">Department</label>
          <select
            id="map-department"
            className={styles.select}
            value={state.department}
            onChange={(e) => announce(describeFilter(employeeMapStore.setDepartment(e.target.value)))}
          >
            <option value="all">{`All departments (${PEOPLE.length})`}</option>
            {DEPARTMENTS.map((d) => (
              <option key={d.id} value={d.id}>
                {`${d.name} (${PEOPLE.filter((p) => p.departmentId === d.id).length})`}
              </option>
            ))}
          </select>
        </div>
        <p className={styles.summary} data-testid="map-summary">
          {summaryLabel(state)}
        </p>
        <button
          type="button"
          className={styles.reset}
          onClick={() => {
            employeeMapStore.reset();
            announce(RESET_ANNOUNCEMENT);
          }}
        >
          Reset demo
        </button>
      </div>

      <p className={styles.status} role="status" aria-live="polite" aria-atomic="true" data-testid="map-status">
        {message}
      </p>

      <div className={styles.layout}>
        <div
          className={styles.map}
          role="group"
          aria-label="Map of approximate employee locations"
          data-testid="map-markers"
        >
          <svg
            className={styles.outline}
            viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
            aria-hidden="true"
            focusable="false"
          >
            <path d={MAP_OUTLINE_PATH} />
          </svg>
          {people.map((p) => {
            const you = isDemoUser(p);
            const isSelected = state.selectedId === p.id;
            return (
              <button
                key={p.id}
                type="button"
                id={`map-marker-${p.id}`}
                className={cx(styles.marker, you && styles.markerYou, isSelected && styles.markerSelected)}
                style={markerPosition(p)}
                aria-label={markerLabel(p)}
                aria-current={isSelected ? "true" : undefined}
                onClick={() => open(p.id, "marker")}
              >
                {you ? "You" : <span className={styles.dot} aria-hidden="true" />}
              </button>
            );
          })}
        </div>

        <section className={styles.card} aria-labelledby="map-profile-heading" data-testid="profile-card">
          {selected ? (
            renderCard(selected)
          ) : (
            <>
              <h2 id="map-profile-heading" className={styles.cardHeading}>
                Profile
              </h2>
              <p className={styles.muted}>Choose a person on the map or in the people list to see their profile.</p>
            </>
          )}
        </section>
      </div>

      <section className={styles.list} aria-labelledby="map-list-heading">
        <h2 id="map-list-heading" className={styles.cardHeading}>
          People list
        </h2>
        <p className={styles.muted}>The same people as the map, in a table.</p>
        <div className={styles.scroller} role="region" aria-label="People list" tabIndex={0}>
          <table className={styles.table}>
            <caption className={styles.visuallyHidden}>
              Fictional colleagues and their approximate locations. Choose a name to open their profile.
            </caption>
            <thead>
              <tr>
                <th scope="col">Name</th>
                <th scope="col">Title</th>
                <th scope="col">Department</th>
                <th scope="col">Team</th>
                <th scope="col">Location</th>
              </tr>
            </thead>
            <tbody>
              {people.map((p) => {
                const you = isDemoUser(p);
                return (
                  <tr key={p.id}>
                    <th scope="row">
                      <button
                        type="button"
                        id={`map-row-${p.id}`}
                        className={styles.linkButton}
                        aria-label={`View profile: ${fullName(p)}${you ? " (you)" : ""}`}
                        onClick={() => open(p.id, "list")}
                      >
                        {fullName(p)}
                        {you && <span className={styles.youTag}>You</span>}
                      </button>
                    </th>
                    <td>{p.title}</td>
                    <td>{getDepartment(p.departmentId)?.name}</td>
                    <td>{getTeam(p.teamId)?.name}</td>
                    <td>{describeLocation(p)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <ul className={styles.legend} aria-label="Legend">
        <li>
          <span className={cx(styles.swatch, styles.swatchDot)} aria-hidden="true" />
          Colleague (round marker)
        </li>
        <li>
          <span className={cx(styles.swatch, styles.swatchYou)} aria-hidden="true" />
          You (marker labelled You)
        </li>
        <li>
          <span className={cx(styles.swatch, styles.swatchSelected)} aria-hidden="true" />
          Selected profile (ringed marker)
        </li>
      </ul>

      <p className={styles.rule}>
        In the real intranet, each person&rsquo;s city and state were geocoded on the server when their profile changed,
        markers were offset slightly so no exact location was shown, and the map loaded only when it scrolled into view.
        Selecting a marker opened that person&rsquo;s profile.
      </p>
    </div>
  );
}

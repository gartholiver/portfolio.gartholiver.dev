import { useSyncExternalStore } from "react";
import {
  DAYS,
  DESKS,
  FLOOR_LABEL,
  WEEK_LONG_LABEL,
} from "~/fixtures/office-booking-calendar";
import {
  RESET_ANNOUNCEMENT,
  describeCancel,
  describeReserve,
  findReservation,
  getDeskName,
  yourReservationOnDay,
  yourReservations,
  type BookingState,
} from "./booking";
import { useRepeatableAnnouncement } from "~/lib/announce";
import { bookingStore } from "./store";
import styles from "./OfficeBookingCalendar.module.css";

function useBookingState(): BookingState {
  return useSyncExternalStore(
    bookingStore.subscribe,
    bookingStore.getSnapshot,
    bookingStore.getServerSnapshot,
  );
}

/**
 * Illustrative office desk booking: 4 desks x 5 weekdays in one fixed sample week, with fictional
 * reservations. Reservations live in memory (see ./store.ts) — nothing is saved anywhere.
 */
export function OfficeBookingCalendar() {
  const state = useBookingState();
  const [message, announce] = useRepeatableAnnouncement();
  const mine = yourReservations(state).length;

  return (
    <div className={styles.root} data-demo="office-booking-calendar">
      <p className={styles.note}>
        Sample data: every name and reservation here is fictional, and nothing
        is saved. Reservations are kept only while you browse this site;
        refreshing the page or choosing Reset demo restores the starting week.
      </p>

      <div className={styles.toolbar}>
        <p className={styles.summary} data-testid="booking-summary">
          {`You have ${mine} ${mine === 1 ? "reservation" : "reservations"} this week`}
        </p>
        <button
          type="button"
          className={styles.reset}
          onClick={() => {
            bookingStore.reset();
            announce(RESET_ANNOUNCEMENT);
          }}
        >
          Reset demo
        </button>
      </div>

      <p
        className={styles.status}
        role="status"
        aria-live="polite"
        aria-atomic="true"
        data-testid="booking-status"
      >
        {message}
      </p>

      <div
        className={styles.scroller}
        role="region"
        aria-label={`Desk reservations, ${WEEK_LONG_LABEL}`}
        tabIndex={0}
      >
        <table className={styles.table}>
          <caption className={styles.visuallyHidden}>
            Desk reservations for the {WEEK_LONG_LABEL}, {FLOOR_LABEL}. Choose
            Reserve to book a free desk or Cancel to release one of yours.
          </caption>
          <thead>
            <tr>
              <th scope="col" className={styles.corner}>
                <span className={styles.visuallyHidden}>Desk</span>
              </th>
              {DAYS.map((day) => (
                <th key={day.id} scope="col" className={styles.dayHeader}>
                  <span className={styles.dayName}>{day.short}</span>
                  <span className={styles.dayDate}>{day.dateLabel}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {DESKS.map((desk) => (
              <tr key={desk.id}>
                <th scope="row" className={styles.deskHeader}>
                  {desk.name}
                </th>
                {DAYS.map((day) => {
                  const reservation = findReservation(state, desk.id, day.id);
                  const moveFrom =
                    reservation === undefined
                      ? yourReservationOnDay(state, day.id)
                      : undefined;

                  if (reservation && reservation.owner === "other") {
                    return (
                      <td key={day.id} className={styles.td}>
                        <div className={`${styles.cell} ${styles.others}`}>
                          <span className={styles.cellStatus}>Reserved</span>
                          <span className={styles.cellName}>
                            {reservation.holder}
                          </span>
                        </div>
                      </td>
                    );
                  }

                  // "Yours" and "available" share one element structure (status slot + button) so the
                  // button is updated in place and keeps keyboard focus when its action flips.
                  const isYours = reservation !== undefined;
                  return (
                    <td key={day.id} className={styles.td}>
                      <div
                        className={`${styles.cell} ${isYours ? styles.yours : styles.available}`}
                      >
                        {isYours ? (
                          <span className={styles.cellStatus}>
                            <span aria-hidden="true">✓ </span>Yours
                          </span>
                        ) : null}
                        <button
                          type="button"
                          className={styles.action}
                          aria-label={
                            isYours
                              ? `Cancel your reservation of ${desk.name} on ${day.longLabel}`
                              : moveFrom
                                ? `Move here: reserve ${desk.name} on ${day.longLabel} instead of ${getDeskName(moveFrom.deskId)}`
                                : `Reserve ${desk.name} on ${day.longLabel}`
                          }
                          onClick={() =>
                            announce(
                              isYours
                                ? describeCancel(
                                    bookingStore.cancel(desk.id, day.id),
                                  )
                                : describeReserve(
                                    bookingStore.reserve(desk.id, day.id),
                                  ),
                            )
                          }
                        >
                          {isYours
                            ? "Cancel"
                            : moveFrom
                              ? "Move here"
                              : "Reserve"}
                        </button>
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className={styles.legend} aria-label="Legend">
        <li>
          <span
            className={`${styles.swatch} ${styles.swatchAvailable}`}
            aria-hidden="true"
          />
          Available (Reserve)
        </li>
        <li>
          <span
            className={`${styles.swatch} ${styles.swatchYours}`}
            aria-hidden="true"
          />
          ✓ Yours (Cancel)
        </li>
        <li>
          <span
            className={`${styles.swatch} ${styles.swatchOthers}`}
            aria-hidden="true"
          />
          Reserved by someone else
        </li>
      </ul>

      <p className={styles.rule}>
        One desk per day: if you already have a desk on a day, choosing another
        desk that day moves your reservation (the button says &ldquo;Move
        here&rdquo;). Reservations held by others can&rsquo;t be changed.
      </p>
    </div>
  );
}

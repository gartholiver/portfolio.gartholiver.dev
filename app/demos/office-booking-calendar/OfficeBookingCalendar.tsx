import styles from "./OfficeBookingCalendar.module.css";

/**
 * TEMPORARY placeholder mounted inside <DemoFrame>. The office-booking-calendar task replaces
 * this component (and may add fixtures under app/fixtures/office-booking-calendar/). Keep the
 * default export of ./index.ts a component with no props.
 */
export function OfficeBookingCalendar() {
  return (
    <div className={styles.placeholder} data-demo="office-booking-calendar">
      <p className={styles.text}>
        [Placeholder] The interactive office booking calendar will be mounted here. It will use fictional sample data only.
      </p>
    </div>
  );
}

/**
 * Fixtures for the office booking calendar demo (app/demos/office-booking-calendar/).
 *
 * Everything here is fictional sample data: four desks, one fixed Monday–Friday week and a handful
 * of reservations held by invented people. Dates are hard-coded so the page renders the same in
 * the prerendered HTML and in the browser regardless of "today" or the visitor's time zone.
 */

export const DEMO_USER_NAME = "You (demo user)";
export const WEEK_LABEL = "Week of 2 Nov 2026";
export const WEEK_LONG_LABEL = "week of Monday 2 November 2026";
export const FLOOR_LABEL = "Floor 2";

export const DESKS = [
  { id: "A1", name: "Desk A1" },
  { id: "A2", name: "Desk A2" },
  { id: "B1", name: "Desk B1" },
  { id: "B2", name: "Desk B2" },
] as const;

export const DAYS = [
  {
    id: "mon",
    date: "2026-11-02",
    weekday: "Monday",
    short: "Mon",
    dateLabel: "2 Nov",
    longLabel: "Monday 2 November",
  },
  {
    id: "tue",
    date: "2026-11-03",
    weekday: "Tuesday",
    short: "Tue",
    dateLabel: "3 Nov",
    longLabel: "Tuesday 3 November",
  },
  {
    id: "wed",
    date: "2026-11-04",
    weekday: "Wednesday",
    short: "Wed",
    dateLabel: "4 Nov",
    longLabel: "Wednesday 4 November",
  },
  {
    id: "thu",
    date: "2026-11-05",
    weekday: "Thursday",
    short: "Thu",
    dateLabel: "5 Nov",
    longLabel: "Thursday 5 November",
  },
  {
    id: "fri",
    date: "2026-11-06",
    weekday: "Friday",
    short: "Fri",
    dateLabel: "6 Nov",
    longLabel: "Friday 6 November",
  },
] as const;

export type DeskId = (typeof DESKS)[number]["id"];
export type DayId = (typeof DAYS)[number]["id"];

export interface FixtureReservation {
  deskId: DeskId;
  dayId: DayId;
  /** Fictional person who "holds" the desk. */
  holder: string;
}

/** Reservations that exist when the demo loads (and after "Reset demo"). Fictional names only. */
export const INITIAL_RESERVATIONS: readonly FixtureReservation[] = [
  { deskId: "A2", dayId: "mon", holder: "A. Rivera" },
  { deskId: "A1", dayId: "tue", holder: "J. Okafor" },
  { deskId: "B2", dayId: "tue", holder: "M. Tanaka" },
  { deskId: "A2", dayId: "wed", holder: "A. Rivera" },
  { deskId: "B1", dayId: "wed", holder: "L. Brandt" },
  { deskId: "A1", dayId: "thu", holder: "M. Tanaka" },
  { deskId: "A1", dayId: "fri", holder: "L. Brandt" },
  { deskId: "B2", dayId: "fri", holder: "J. Okafor" },
];

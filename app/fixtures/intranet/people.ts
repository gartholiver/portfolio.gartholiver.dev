/**
 * Fictional people, teams and departments shared by the onboarding, notification and map demos.
 * Every name, title and place is invented: towns sit on a fictional landmass, never a real city.
 */

export const DEPARTMENTS = [
  { id: "design", name: "Product Design" },
  { id: "engineering", name: "Engineering" },
  { id: "people-culture", name: "People & Culture" },
  { id: "operations", name: "Operations" },
  { id: "support", name: "Customer Support" },
] as const;
export type DepartmentId = (typeof DEPARTMENTS)[number]["id"];
export type Department = (typeof DEPARTMENTS)[number];

export const TEAMS = [
  { id: "design-systems", name: "Design Systems", departmentId: "design" },
  { id: "platform", name: "Platform", departmentId: "engineering" },
  { id: "web", name: "Web", departmentId: "engineering" },
  { id: "talent", name: "Talent & Onboarding", departmentId: "people-culture" },
  { id: "workplace-it", name: "Workplace & IT", departmentId: "operations" },
  { id: "support-desk", name: "Support Desk", departmentId: "support" },
] as const satisfies readonly { id: string; name: string; departmentId: DepartmentId }[];
export type TeamId = (typeof TEAMS)[number]["id"];
export type Team = (typeof TEAMS)[number];

export const REGIONS = ["Northern Region", "Central Region", "Coastal Region", "Southern Region"] as const;
export type Region = (typeof REGIONS)[number];

export const PERSON_IDS = [
  "p-avery",
  "p-sam",
  "p-priya",
  "p-marcus",
  "p-tomas",
  "p-lena",
  "p-grace",
  "p-noah",
  "p-hana",
  "p-diego",
  "p-ruth",
  "p-jordan",
] as const;
export type PersonId = (typeof PERSON_IDS)[number];

export interface Person {
  id: PersonId;
  firstName: string;
  lastName: string;
  title: string;
  departmentId: DepartmentId;
  teamId: TeamId;
  managerId: PersonId | null;
  /** Fictional town. */
  city: string;
  region: Region;
  /** Pre-offset (already generalised) marker position in map viewBox units (see map.ts). */
  map: { readonly x: number; readonly y: number };
}

function person(
  id: PersonId,
  firstName: string,
  lastName: string,
  title: string,
  departmentId: DepartmentId,
  teamId: TeamId,
  managerId: PersonId | null,
  city: string,
  region: Region,
  x: number,
  y: number,
): Person {
  return Object.freeze({
    id,
    firstName,
    lastName,
    title,
    departmentId,
    teamId,
    managerId,
    city,
    region,
    map: Object.freeze({ x, y }),
  });
}

export const PEOPLE: readonly Person[] = Object.freeze([
  person("p-avery", "Avery", "Lin", "Head of Product Design", "design", "design-systems", null, "Harbor City", "Coastal Region", 80, 120),
  person("p-sam", "Sam", "Okafor", "Senior Product Designer", "design", "design-systems", "p-avery", "Westmoor", "Coastal Region", 110, 230),
  person("p-priya", "Priya", "Raman", "Head of Engineering", "engineering", "platform", null, "Northfield", "Northern Region", 250, 70),
  person("p-marcus", "Marcus", "Webb", "Platform Engineer", "engineering", "platform", "p-priya", "Pine Ridge", "Northern Region", 360, 100),
  person("p-tomas", "Tomas", "Ortega", "Web Team Lead", "engineering", "web", "p-priya", "Lakeview", "Central Region", 200, 160),
  person("p-lena", "Lena", "Kowalski", "Front-End Developer", "engineering", "web", "p-tomas", "Riverton", "Central Region", 300, 190),
  person("p-grace", "Grace", "Mensah", "Head of People & Culture", "people-culture", "talent", null, "Eastbrook", "Northern Region", 480, 80),
  person("p-noah", "Noah", "Fischer", "Onboarding Coordinator", "people-culture", "talent", "p-grace", "Granite Falls", "Central Region", 430, 200),
  person("p-hana", "Hana", "Sato", "Head of Operations", "operations", "workplace-it", null, "Southport", "Southern Region", 180, 320),
  person("p-diego", "Diego", "Alvarez", "IT Support Analyst", "operations", "workplace-it", "p-hana", "Coral Bay", "Southern Region", 300, 300),
  person("p-ruth", "Ruth", "Adeyemi", "Head of Customer Support", "support", "support-desk", null, "Highland Springs", "Southern Region", 420, 330),
  person("p-jordan", "Jordan", "Reyes", "Support Specialist", "support", "support-desk", "p-ruth", "Maple Grove", "Central Region", 520, 260),
]);

/** The person the demos treat as "you". */
export const DEMO_USER_ID: PersonId = "p-jordan";

export function getPerson(id: string): Person | undefined {
  return PEOPLE.find((p) => p.id === id);
}
export function getTeam(id: string): Team | undefined {
  return TEAMS.find((t) => t.id === id);
}
export function getDepartment(id: string): Department | undefined {
  return DEPARTMENTS.find((d) => d.id === id);
}
export function fullName(person: Pick<Person, "firstName" | "lastName">): string {
  return `${person.firstName} ${person.lastName}`;
}
export function isPersonId(id: string): id is PersonId {
  return (PERSON_IDS as readonly string[]).includes(id);
}
export function isDepartmentId(id: string): id is DepartmentId {
  return DEPARTMENTS.some((d) => d.id === id);
}

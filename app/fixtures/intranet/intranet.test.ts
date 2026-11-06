import { describe, expect, it } from "vitest";
import {
  DASHBOARD_NAV_ITEMS,
  DEPARTMENTS,
  INITIAL_FEED,
  INITIAL_SEEN,
  KUDOS_PRESETS,
  MAP_EDGE_MARGIN,
  MAP_HEIGHT,
  MAP_WIDTH,
  NOTIFICATIONS,
  ONBOARDING_STEPS,
  PEOPLE,
  PERSON_IDS,
  TEAMS,
  VIEWER_IDS,
  getDepartment,
  getPerson,
  getTeam,
} from "./index";

describe("intranet fixtures: people", () => {
  it("references valid teams, departments and managers", () => {
    expect(PEOPLE.map((p) => p.id)).toEqual([...PERSON_IDS]);
    for (const p of PEOPLE) {
      const team = getTeam(p.teamId);
      expect(team, p.id).toBeDefined();
      expect(getDepartment(p.departmentId), p.id).toBeDefined();
      expect(team!.departmentId, p.id).toBe(p.departmentId);
      if (p.managerId !== null) {
        const manager = getPerson(p.managerId);
        expect(manager, p.id).toBeDefined();
        expect(manager!.departmentId, p.id).toBe(p.departmentId);
        expect(manager!.id).not.toBe(p.id);
      }
      let cursor: string | null = p.managerId;
      let steps = 0;
      while (cursor !== null && steps <= 12) {
        cursor = getPerson(cursor)!.managerId;
        steps += 1;
      }
      expect(cursor, `${p.id} manager chain terminates`).toBeNull();
      expect(steps).toBeLessThanOrEqual(12);
    }
  });

  it("has the expected department counts", () => {
    const counts = Object.fromEntries(DEPARTMENTS.map((d) => [d.id, PEOPLE.filter((p) => p.departmentId === d.id).length]));
    expect(counts).toEqual({ design: 2, engineering: 4, "people-culture": 2, operations: 2, support: 2 });
    expect(PEOPLE).toHaveLength(12);
  });

  it("spaces markers for 24px targets", () => {
    for (let i = 0; i < PEOPLE.length; i += 1) {
      for (let j = i + 1; j < PEOPLE.length; j += 1) {
        const a = PEOPLE[i]!;
        const b = PEOPLE[j]!;
        const dx = Math.abs(a.map.x - b.map.x);
        const dy = Math.abs(a.map.y - b.map.y);
        const involvesYou = a.id === "p-jordan" || b.id === "p-jordan";
        const ok = involvesYou ? dx >= 80 || dy >= 60 : dx >= 70 || dy >= 60;
        expect(ok, `${a.id} / ${b.id} (dx ${dx}, dy ${dy})`).toBe(true);
      }
    }
  });

  it("keeps markers inside the map", () => {
    for (const p of PEOPLE) {
      expect(Number.isInteger(p.map.x) && Number.isInteger(p.map.y), p.id).toBe(true);
      expect(p.map.x).toBeGreaterThanOrEqual(MAP_EDGE_MARGIN);
      expect(p.map.x).toBeLessThanOrEqual(MAP_WIDTH - MAP_EDGE_MARGIN);
      expect(p.map.y).toBeGreaterThanOrEqual(MAP_EDGE_MARGIN);
      expect(p.map.y).toBeLessThanOrEqual(MAP_HEIGHT - MAP_EDGE_MARGIN);
    }
  });
});

describe("intranet fixtures: notifications", () => {
  it("has valid audiences", () => {
    const ids = NOTIFICATIONS.map((n) => n.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const n of NOTIFICATIONS) {
      const a = n.audience;
      expect(a.everyone || a.teamIds.length > 0 || a.personIds.length > 0, n.id).toBe(true);
      for (const t of a.teamIds) expect(getTeam(t), `${n.id} team ${t}`).toBeDefined();
      for (const p of a.personIds) expect(getPerson(p), `${n.id} person ${p}`).toBeDefined();
    }
  });

  it("only marks targeted notifications as initially seen, for viewers on three distinct teams", () => {
    for (const viewerId of VIEWER_IDS) {
      const viewer = getPerson(viewerId)!;
      for (const id of INITIAL_SEEN[viewerId]) {
        const n = NOTIFICATIONS.find((x) => x.id === id);
        expect(n, id).toBeDefined();
        const a = n!.audience;
        expect(a.everyone || a.personIds.includes(viewerId) || a.teamIds.includes(viewer.teamId), `${viewerId} ${id}`).toBe(true);
      }
    }
    expect(new Set(VIEWER_IDS.map((v) => getPerson(v)!.teamId)).size).toBe(3);
  });
});

describe("intranet fixtures: content", () => {
  it("contains nothing sensitive", () => {
    const json = JSON.stringify({ PEOPLE, TEAMS, DEPARTMENTS, NOTIFICATIONS, INITIAL_FEED, ONBOARDING_STEPS, DASHBOARD_NAV_ITEMS, KUDOS_PRESETS });
    // "Design tokens" is a front-end term (a notification about a component library), not a credential.
    const withoutDesignTokens = json.replace(/design[- ]tokens?/gi, "");
    expect(withoutDesignTokens).not.toMatch(/@|https?:|password|secret|token|api[_ -]?key/i);
  });

  it("has complete onboarding content", () => {
    expect(ONBOARDING_STEPS).toHaveLength(5);
    expect(new Set(ONBOARDING_STEPS.map((s) => s.id)).size).toBe(5);
    for (const s of ONBOARDING_STEPS) {
      expect(s.title.length).toBeGreaterThan(0);
      expect(s.paragraphs.length).toBeGreaterThan(0);
      for (const p of s.paragraphs) expect(p.length).toBeGreaterThan(0);
    }
    expect(DASHBOARD_NAV_ITEMS).toHaveLength(6);
    expect(new Set(DASHBOARD_NAV_ITEMS.map((i) => i.id)).size).toBe(6);
  });
});

import { describe, expect, it } from "vitest";
import { stack } from "~/data/stack";
import { buildStackLines, lineText } from "./stack-lines";

describe("buildStackLines", () => {
  const lines = buildStackLines(stack);
  const text = lines.map((l) => `${"  ".repeat(l.depth)}${lineText(l)}`).join("\n");

  it("produces valid JSON that mirrors the stack data", () => {
    const parsed = JSON.parse(text);
    expect(parsed.name).toBe(stack.name);
    expect(Object.keys(parsed.stack)).toEqual(stack.groups.map((g) => g.key));
    expect(parsed.ai.status).toBe("pending");
  });

  it("numbers lines consecutively from 1", () => {
    expect(lines.map((l) => l.number)).toEqual(lines.map((_, i) => i + 1));
  });

  it("keeps AI preferences visibly pending", () => {
    const ai = lines.filter((l) => /"status"/.test(lineText(l)));
    expect(ai).toHaveLength(1);
    expect(lineText(ai[0]!)).toBe('"status": "pending",');
    expect(ai[0]!.note).toMatch(/pending/i);
  });

  it("has a plain-language note for every group header", () => {
    for (const group of stack.groups) {
      const header = lines.find((l) => lineText(l) === `${JSON.stringify(group.key)}: {`);
      expect(header?.note).toBe(group.explanation);
    }
  });

  it("marks every curated item as a placeholder", () => {
    for (const group of stack.groups) {
      for (const item of group.items) {
        expect(item.name).toMatch(/placeholder/i);
        expect(item.note).toMatch(/placeholder/i);
      }
    }
  });
});

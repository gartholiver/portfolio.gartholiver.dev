import type { StackData } from "~/data/stack";

/** Syntax classes for the JSON view. Brace/comma/string use the amber value colour per the design. */
export type StackTokenKind = "key" | "punct" | "value";

export interface StackToken {
  kind: StackTokenKind;
  text: string;
}

export interface StackLine {
  /** 1-based line number. */
  number: number;
  /** Nesting depth (0 = top level); the view indents 20px per level. */
  depth: number;
  tokens: StackToken[];
  /** Plain-language explanation shown in the note column. */
  note?: string;
}

const key = (name: string): StackToken => ({ kind: "key", text: JSON.stringify(name) });
const colon: StackToken = { kind: "punct", text: ": " };
const str = (value: string): StackToken => ({ kind: "value", text: JSON.stringify(value) });
const brace = (text: string): StackToken => ({ kind: "value", text });

/**
 * Turn the curated stack data into the lines of a JSON document. Only strings and objects are
 * used, so the output parses back to `{ name, description, stack: {…}, ai: {…} }`.
 */
export function buildStackLines(data: StackData): StackLine[] {
  const lines: StackLine[] = [];
  const push = (depth: number, tokens: StackToken[], note?: string) =>
    lines.push({ number: lines.length + 1, depth, tokens, note });

  push(0, [brace("{")], data.notes.root);
  push(1, [key("name"), colon, str(data.name), brace(",")], data.notes.name);
  push(1, [key("description"), colon, str(data.description), brace(",")], data.notes.description);

  push(1, [key("stack"), colon, brace("{")], data.notes.stack);
  data.groups.forEach((group, gi) => {
    push(2, [key(group.key), colon, brace("{")], group.explanation);
    group.items.forEach((item, ii) => {
      const comma = ii < group.items.length - 1 ? "," : "";
      push(3, [key(item.name), colon, str(item.value), ...(comma ? [brace(comma)] : [])], item.note);
    });
    push(2, [brace(gi < data.groups.length - 1 ? "}," : "}")]);
  });
  push(1, [brace("},")]);

  push(1, [key("ai"), colon, brace("{")], data.notes.ai);
  push(2, [key("status"), colon, str(data.aiPreferences.status), brace(",")], data.aiPreferences.statusNote);
  push(2, [key("note"), colon, str(data.aiPreferences.note)], data.aiPreferences.noteNote);
  push(1, [brace("}")]);

  push(0, [brace("}")]);
  return lines;
}

/** The plain text of a line (what a screen reader hears and what you'd copy). */
export function lineText(line: StackLine): string {
  return line.tokens.map((t) => t.text).join("");
}

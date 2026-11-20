import { describe, it, expect } from "vitest";
import { parseText } from "../parse-text";

describe("weave explicit test", () => {
  const cases: { pat: string; expected: string }[] = [
    { pat: "weave: 2/2 TWL", expected: "2/2 Twill" },
    { pat: "2/2 TWL weave", expected: "2/2 Twill" },
    { pat: "TWL 2/2", expected: "2/2 Twill" },
    { pat: "weave\n2/2 TWL", expected: "2/2 Twill" },
    { pat: "PLN weave", expected: "Plain" },
    { pat: "weave PLN.", expected: "Plain" },
    { pat: "3/1 DRL;", expected: "3/1 Drill" },
    { pat: "MATT 2/2", expected: "2/2 Matty" },
  ];

  for (const c of cases) {
    it(`tests pattern: ${c.pat.replace(/\n/g, "\\n")}`, () => {
      const text = `100% cotton; ${c.pat}; 58 inches; 5000 m.`;
      const [line] = parseText(text);
      expect(line.draft.weaveType).toBe(c.expected);
    });
  }
});

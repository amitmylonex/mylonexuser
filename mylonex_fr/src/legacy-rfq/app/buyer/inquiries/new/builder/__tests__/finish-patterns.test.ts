import { describe, it, expect } from "vitest";
import { parseText } from "../parse-text";

describe("finish pattern tests", () => {
  const patterns = [
    "finish: ENZ + SIL",
    "ENZ + SIL finish",
    "finish\nENZ + SIL",
  ];

  for (const pat of patterns) {
    it(`tests finish: ${pat.replace(/\n/g, "\\n")}`, () => {
      const text = `100% cotton; plain; 58 inches; 5000 m; ${pat}.`;
      const [line] = parseText(text);
      expect(line.finish).toBe("Enzyme wash + Silicone");
    });
  }
});

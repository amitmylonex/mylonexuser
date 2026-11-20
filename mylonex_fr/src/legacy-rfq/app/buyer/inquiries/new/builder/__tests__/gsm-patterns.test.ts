import { describe, it, expect } from "vitest";
import { parseText } from "../parse-text";

describe("gsm pattern tests", () => {
  const patterns = [
    "GSM: 180",
    "180 GSM",
    "G.S.M. 180",
    "180 g/m²",
  ];

  for (const pat of patterns) {
    it(`tests GSM: ${pat}`, () => {
      const text = `100% cotton; plain; 58 inches; 5000 m; ${pat}.`;
      const lines = parseText(text);
      expect(lines).toHaveLength(1);
      expect(lines[0].draft.gsm).toBe(180);
    });
  }
});

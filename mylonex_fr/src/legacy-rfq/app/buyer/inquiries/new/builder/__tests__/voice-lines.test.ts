import { describe, expect, it } from "vitest";
import { voiceLines, hasVoiceSource } from "../voice-lines";
import { missingRequired } from "../draft";
import { normalizeImageExtraction } from "../../../../../../src/domains/rfq/image/normalize";

describe("voice drafts reuse builder rules", () => {
  it("leaves uncertain specs blank, preserves transcript and exposes existing missing fields", () => {
    const transcript = "cotton, maybe 120 gsm, 58 inches, 2000 metres";
    const data = normalizeImageExtraction({ rawText: transcript, warnings: [], requirements: [{ label: "Cotton", colors: [], warnings: [], fields: [
      { key: "gsm", value: "120", uncertain: true }, { key: "width", value: "58 inches", uncertain: false },
      { key: "quantity", value: "2000 m", uncertain: false },
    ] }] });
    const [line] = voiceLines(data, transcript, "recording-id");
    expect(line.draft.gsm).toBeUndefined(); expect(line.blend).toBe("");
    expect(line.original).toBe(transcript); expect(line.draft.quantity).toBe(2000);
    expect(missingRequired(line)).toContain("GSM");
    expect(line.warnings.some(item => item.includes("gsm"))).toBe(true);
    expect(hasVoiceSource([line], "recording-id")).toBe(true);
  });
  it("keeps multiple fabrics and shades distinct and avoids silently treating cm as inches", () => {
    const data = normalizeImageExtraction({ rawText: "source", warnings: [], requirements: [
      { label: "Cotton", fields: [{ key: "width", value: "150 cm", uncertain: false }], colors: [{ color: "navy", quantity: "100 m", uncertain: false }], warnings: [] },
      { label: "Linen", fields: [], colors: [], warnings: [] },
    ] });
    const lines = voiceLines(data, "source", "source-id");
    expect(lines).toHaveLength(2); expect(lines[0].draft.width).toBeUndefined();
    expect(lines[0].colours[0]).toMatchObject({ name: "navy", metres: "100" });
    expect(lines[0].draft.quantity).toBeUndefined(); expect(lines[0].id).not.toBe(lines[1].id);
  });
});

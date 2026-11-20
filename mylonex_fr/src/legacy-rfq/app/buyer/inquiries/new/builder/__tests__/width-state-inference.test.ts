import { describe, expect, it } from "vitest";
import { readRequirements } from "../read-requirements";
import { confirmTextCandidate } from "../TextCandidateReview";
import { applySourceChanges, rereadSource } from "../source-review";
import { missingRequired } from "../draft";

const read = async (source: string) => (await readRequirements(source, false))[0];
const suggestion = (line: Awaited<ReturnType<typeof read>>) =>
  line.textCandidates?.find(item => item.field === "fabricState" && item.kind === "inferred");

describe("Paste lines fabric state suggestions", () => {
  it.each([
    ["100% cotton twill, 63″, 2,000 m", "greige"],
    ["100% cotton poplin, 58″, 1,000 m", "finished"],
    ["97% cotton / 3% elastane, 69″, 800 m", "greige"],
    ["97% cotton / 3% elastane, 56″, 800 m", "finished"],
    ["100% cotton twill, 160.02 cm, 2,000 m", "greige"],
    ["100% cotton twill, 147.32 cm, 2,000 m", "finished"],
    ["97% cotton / 3% elastane, 170.18 cm, 800 m", "greige"],
    ["97% cotton / 3% elastane, 144.78 cm, 800 m", "finished"],
  ])("suggests the matching state for %s", async (text, state) => {
    const line = await read(text);
    const candidate = suggestion(line);
    expect(candidate).toMatchObject({ value: state, kind: "inferred", status: "review" });
    expect(line.widthProvenance).toBe("extracted");
    expect(line.draft.fabricState).toBe(state);
    expect(line.fabricStateInferred).toBe(true);
    expect(missingRequired(line)).not.toContain("fabric state");
    expect(confirmTextCandidate(line, candidate!).fabricStateInferred).toBe(false);
  });

  it.each([
    ["54", "finished"], ["57", "finished"], ["67", "greige"], ["72", "greige"],
    ["53.99", undefined], ["57.01", undefined], ["66.99", undefined], ["72.01", undefined],
  ])("uses inclusive stretch endpoints at %s inches", async (width, state) => {
    const line = await read("97% cotton / 3% spandex, " + width + " inches, 800 m");
    expect(suggestion(line)?.value).toBe(state);
    expect(line.draft.width).toBe(width + " inches");
  });

  it.each(["57.99", "58.01", "62.99", "63.01"])("does not round %s inches into a non-stretch suggestion", async width => {
    expect(suggestion(await read(`100% cotton twill, ${width} inches, 800 m`))).toBeUndefined();
  });

  it.each([
    "100% cotton poplin, 63″ greige width, 1,000 m",
    "100% cotton poplin, 58″ finished width, 1,000 m",
    "100% cotton twill, greige width 63″, finished width 58″",
    "100% cotton twill, 63″ or 58″, 1,000 m",
    "97% cotton / 3% Lycra, 67–72 inches, 800 m",
    "100% cotton twill, about 63″, 1,000 m",
    "Twill, 58″, 1,000 m, blend TBC",
    "Cotton / elastane blend, 56″, 800 m",
  ])("leaves state open for %s", async text => {
    const line = await read(text);
    expect(line.draft.fabricState).toBeUndefined();
    expect(suggestion(line)).toBeUndefined();
  });

  it("preserves explicitly stated Finished at a width that suggests Greige", async () => {
    const line = await read("100% cotton twill, 63″, state: Finished");
    expect(line.draft.fabricState).toBe("finished");
    expect(line.fabricStateInferred).toBeFalsy();
    expect(suggestion(line)).toBeUndefined();
  });

  it.each([
    "Navy dyed cotton twill, 63″, 1,000 m",
    "100% cotton twill, yarn-dyed, 63″, 1,000 m",
    "100% cotton twill, Navy, 63″, 1,000 m",
  ])("keeps the independent state cue in %s", async text => {
    const line = await read(text);
    expect(line.draft.fabricState).toBe("dyed");
    expect(line.draft.width).toBe("63 inches");
    expect(suggestion(line)).toBeUndefined();
  });

  it.each([
    ["100% cotton", "greige", "63 inches"],
    ["100% cotton", "rfd", "58 inches"],
    ["100% cotton", "finished", "58 inches"],
    ["97% cotton / 3% Lycra", "greige", "67–72 inches"],
    ["97% cotton / 3% Lycra", "printed", "54–57 inches"],
  ])("keeps the state-to-width default for %s and %s", async (blend, state, width) => {
    const line = await read(blend + " twill, state: " + state + ", 800 m");
    expect(line.draft).toMatchObject({ fabricState: state, width });
    expect(line.widthProvenance).toBe("default");
    expect(suggestion(line)).toBeUndefined();
  });

  it("keeps state editable when re-reading a draft source", async () => {
    const current = await read('100% cotton twill, 63", 800 m, dyed');
    const proposal = rereadSource('100% cotton twill, 63", 800 m');
    expect(applySourceChanges(current, proposal, []).draft.fabricState).toBe("dyed");
    const accepted = applySourceChanges(current, proposal, ["fabricState"]);
    expect(accepted.draft.fabricState).toBe("greige");
    expect(accepted.fabricStateInferred).toBe(true);
  });
});

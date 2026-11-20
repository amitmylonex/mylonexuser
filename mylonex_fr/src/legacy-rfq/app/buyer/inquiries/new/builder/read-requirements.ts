import { builderFetch } from '../../../../../adapters/http'
import { parseText } from "./parse-text";
import type { RfqLine } from "./draft";
import { textInputSchema } from "../../../../../src/domains/rfq/text/grouping";
import { textExtractionResponseSchema } from "../../../../../src/domains/rfq/text/ai-schema";
import { validateAiExtraction } from "../../../../../src/domains/rfq/text/ai-validation";
import { localTextDrafts, reconcileTextDrafts } from "./reconcile-text";

export async function readRequirements(text: string, useAI: boolean): Promise<RfqLine[]> {
  textInputSchema.parse({ text, useAI });
  const localLines = parseText(text);
  const local = (reason: string) => localTextDrafts(localLines, reason);
  if (!useAI) return local("Local extraction used. AI assistance was not selected.");
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 35_000);
  try {
    const response = await builderFetch("/api/buyer/inquiries/extract-text", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text, useAI }), signal: controller.signal,
    });
    if (!response.ok) throw new Error("Extraction unavailable");
    const json = await response.json();
    const data = textExtractionResponseSchema.parse(json.data);
    if (data.mode === "deterministic") return local(data.reason);
    const validated = validateAiExtraction(text, { fabrics: data.fabrics });
    return reconcileTextDrafts(text, localLines, validated.fabrics, data.proposals);
  } catch {
    return local("AI extraction could not complete or validate its source evidence. Local extraction used; review every draft.");
  } finally { clearTimeout(timer); }
}

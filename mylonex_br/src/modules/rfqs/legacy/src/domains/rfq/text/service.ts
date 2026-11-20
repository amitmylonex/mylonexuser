import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import { env } from "../../../../../extraction-env.js";
import { aiExtractionSchema } from "./ai-schema.js";
import { TEXT_EXTRACTION_PROMPT } from "./ai-prompt.js";
import { validateAiExtraction } from "./ai-validation.js";
import { groundAiSources, TextGroupingConflict } from "./ai-sources.js";

export const TEXT_EXTRACTION_MODEL = "gpt-5-mini";
/** Shared by the service and the synthetic live-provider verification harness. */
export async function requestTextExtraction(text: string, signal?: AbortSignal) {
  const client = new OpenAI({ apiKey: env.server.OPENAI_API_KEY, timeout: 25_000, maxRetries: 0 });
  const response = await client.chat.completions.parse({
    model: TEXT_EXTRACTION_MODEL, store: false, reasoning_effort: "low", max_completion_tokens: 12000,
    messages: [{ role: "system", content: TEXT_EXTRACTION_PROMPT }, { role: "user", content: text }],
    response_format: zodResponseFormat(aiExtractionSchema, "buyer_fabric_requirements"),
  }, { signal });
  const choice = response.choices[0];
  if (!choice || choice.finish_reason !== "stop" || choice.message.refusal || !choice.message.parsed) throw new Error("Incomplete extraction");
  return choice.message.parsed;
}
export async function extractBuyerRequirements(text: string, useAI: boolean, signal?: AbortSignal) {
  if (!useAI) return { mode: "deterministic" as const, reason: "Local extraction used. AI assistance was not selected." };
  if (!env.server.OPENAI_API_KEY) return { mode: "deterministic" as const, reason: "AI extraction is not configured. Local extraction used; review every draft." };
  try {
    const raw = await requestTextExtraction(text, signal);
    const proposals = groundAiSources(text, raw);
    const validated = validateAiExtraction(text, proposals);
    return { mode: "ai-assisted" as const, fabrics: validated.fabrics, proposals: proposals.fabrics };
  } catch (error) {
    // Never log source text, provider payloads, credentials or provider errors.
    return { mode: "deterministic" as const, reason: error instanceof TextGroupingConflict ? error.message : "AI extraction could not complete or validate its source evidence. Local extraction used; review every draft." };
  }
}

import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import { env } from "../../../../../extraction-env.js";
import { VOICE_EXTRACTION_PROMPT } from "./prompt.js";
import { visionResultSchema } from "../image/schema.js";
import { normalizeImageExtraction } from "../image/normalize.js";
import { transcriptSchema, VoiceError } from "./schema.js";
import { englishVoiceReview } from "./english-review.js";

function client() {
  if (!env.server.OPENAI_API_KEY) throw new VoiceError("Voice processing is not configured. Use Paste lines or fill the form manually.", 503);
  return new OpenAI({ apiKey: env.server.OPENAI_API_KEY, timeout: 45_000, maxRetries: 0 });
}

/** Transient extraction only. No persistence, matching or notifications. */
export async function transcribeAudio(audio: File, signal?: AbortSignal) {
  try {
    const bytes = new Uint8Array(await audio.arrayBuffer());
    const webm = bytes[0] === 0x1a && bytes[1] === 0x45 && bytes[2] === 0xdf && bytes[3] === 0xa3;
    const mp4 = String.fromCharCode(...bytes.slice(4, 8)) === "ftyp";
    const isWebm = audio.type.split(";")[0] === "audio/webm";
    if (!(isWebm ? webm : mp4)) throw new VoiceError("This recording is not valid WebM/MP4 audio. Record again or type your requirement.");
    const file = new File([bytes], isWebm ? "requirement.webm" : "requirement.mp4", { type: isWebm ? "audio/webm" : "audio/mp4" });
    const result = await client().audio.transcriptions.create({ file, model: "gpt-transcribe" }, { signal });
    const checked = transcriptSchema.safeParse(result.text);
    if (!checked.success) throw new VoiceError("No usable speech was returned. Speak clearly, record a shorter requirement, or type it below.");
    return { transcript: checked.data };
  } catch (error) { throw failure(error); }
}

export async function extractVoiceTranscript(transcript: string, signal?: AbortSignal) {
  try {
    const result = await client().chat.completions.parse({
      model: "gpt-5-mini", store: false, reasoning_effort: "minimal", max_completion_tokens: 8000,
      messages: [
        { role: "system", content: VOICE_EXTRACTION_PROMPT },
        { role: "user", content: transcript },
      ],
      response_format: zodResponseFormat(visionResultSchema, "voice_requirement_review"),
    }, { signal });
    const choice = result.choices[0];
    if (!choice || choice.finish_reason !== "stop" || choice.message.refusal || !choice.message.parsed)
      throw new VoiceError("Could not extract complete fabric details. Edit your transcript and try again.");
    const data = englishVoiceReview(normalizeImageExtraction({ ...choice.message.parsed, rawText: transcript }));
    return { ...data, warnings: data.warnings.map(text => text.replace(/image/gi, "transcript")),
      requirements: data.requirements.map(item => ({ ...item, warnings: item.warnings.map(text => text.replace(/image/gi, "transcript")) })) };
  } catch (error) { throw failure(error); }
}

function failure(error: unknown) {
  if (error instanceof VoiceError) return error;
  if (error instanceof OpenAI.APIConnectionTimeoutError || (error instanceof Error && error.name === "AbortError"))
    return new VoiceError("Voice processing timed out. Your transcript is retained; retry or type your requirement.", 504);
  return new VoiceError("Voice processing failed. Retry, edit the transcript, or use Paste lines.", 502);
}

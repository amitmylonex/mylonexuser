import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import { env } from "../../../../../extraction-env.js";
import { ImageImportError } from "./errors.js";
import { EXTRACTION_TIMEOUT_MS } from "./limits.js";
import { normalizeImageExtraction } from "./normalize.js";
import { IMAGE_EXTRACTION_PROMPT } from "./prompt.js";
import { imageTranscriptSchema, visionResultSchema } from "./schema.js";
import { IMAGE_TRANSCRIPTION_PROMPT } from "./transcription-prompt.js";
import { validateImage, type ImageUpload } from "./validate-image.js";

/** Extraction only: intentionally has no repository, storage, matching or notification dependencies. */
export async function extractInquiryImage(upload: ImageUpload, signal?: AbortSignal, mode?: "transcribe") {
    const image = await validateImage(upload);
    const apiKey = env.server.OPENAI_API_KEY;
    if (!apiKey) throw new ImageImportError("EXTRACTION_UNAVAILABLE", "Image extraction is not configured. You can still fill the form manually.", 503);
    try {
        const client = new OpenAI({ apiKey, timeout: EXTRACTION_TIMEOUT_MS, maxRetries: 0 });
        const result = await client.chat.completions.parse({
            model: "gpt-5-mini", store: false, reasoning_effort: "minimal", max_completion_tokens: 8000,
            messages: [
                { role: "system", content: mode === "transcribe" ? IMAGE_TRANSCRIPTION_PROMPT : IMAGE_EXTRACTION_PROMPT },
                { role: "user", content: [{ type: "text", text: mode === "transcribe" ? "Read the writing faithfully for buyer review." : "Transcribe and extract the written requirement(s) for buyer review." },
                    { type: "image_url", image_url: { url: `data:${image.type};base64,${image.bytes.toString("base64")}`, detail: "high" } }] },
            ],
            response_format: mode === "transcribe" ? zodResponseFormat(imageTranscriptSchema, "inquiry_image_text")
                : zodResponseFormat(visionResultSchema, "inquiry_image_review"),
        }, { signal });
        const choice = result.choices[0];
        if (!choice || choice.finish_reason !== "stop" || choice.message.refusal || !choice.message.parsed) {
            throw new ImageImportError("EXTRACTION_FAILED", "The image could not be read completely. Try a clearer image or fill the form manually.", 422);
        }
        if (mode === "transcribe") return { ...imageTranscriptSchema.parse(choice.message.parsed), requirements: [] };
        return normalizeImageExtraction(choice.message.parsed);
    } catch (error) {
        if (error instanceof ImageImportError) throw error;
        if (error instanceof OpenAI.APIConnectionTimeoutError || signal?.aborted) {
            throw new ImageImportError("EXTRACTION_TIMEOUT", "Image extraction timed out or was cancelled. Try again or fill the form manually.", 504);
        }
        // Never log provider errors/responses: they may contain the image or personal details.
        throw new ImageImportError("EXTRACTION_FAILED", "Image extraction failed. Try again or fill the form manually.", 502);
    }
}

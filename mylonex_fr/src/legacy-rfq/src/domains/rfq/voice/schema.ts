import { z } from "zod";

export const MAX_AUDIO_BYTES = 10 * 1024 * 1024;
export const MAX_RECORDING_MS = 120_000;
export const transcriptSchema = z.string().trim().min(1).max(16000);
export const voiceTextSchema = z.object({
  transcript: transcriptSchema,
  consent: z.literal("openai-voice-extraction"),
}).strict();
export const voiceUploadSchema = z.object({
  audio: z.instanceof(File).refine(file => file.size > 100 && file.size <= MAX_AUDIO_BYTES, "Record between 1 second and 2 minutes, up to 10 MB.")
    .refine(file => ["audio/webm", "audio/mp4"].includes(file.type.split(";")[0]), "Use a WebM or MP4 recording."),
  consent: z.literal("openai-voice-extraction"),
}).strict();

export class VoiceError extends Error {
  status: number;
  constructor(message: string, status = 422) { super(message); this.status = status; }
}

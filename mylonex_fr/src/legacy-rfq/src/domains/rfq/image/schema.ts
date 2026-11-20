import { z } from "zod";
import { IMAGE_FIELD_KEYS, imageDraftSchema } from "./fields";

const warning = z.string().max(500);
export const imageTranscriptSchema = z.object({
    rawText: z.string().max(16000),
    warnings: z.array(z.string().max(160)).max(3),
}).strict();
export const imageColorSchema = z.object({
    color: z.string().trim().min(1).max(200),
    quantity: z.string().max(100).nullable(),
    uncertain: z.boolean(),
}).strict();

// No tools, URLs, model instructions, arbitrary draft properties, or attachments.
export const visionResultSchema = z.object({
    rawText: z.string().max(16000),
    warnings: z.array(warning).max(30),
    requirements: z.array(z.object({
        label: z.string().max(120),
        fields: z.array(z.object({
            key: z.enum(IMAGE_FIELD_KEYS), value: z.string().max(1000), uncertain: z.boolean(),
        }).strict()).max(70),
        colors: z.array(imageColorSchema).max(50),
        warnings: z.array(warning).max(30),
    }).strict()).max(10),
}).strict();

export const imageExtractionSchema = z.object({
    rawText: z.string().max(16000),
    warnings: z.array(warning).max(100),
    requirements: z.array(z.object({
        label: z.string().max(120), draft: imageDraftSchema,
        colors: z.array(imageColorSchema).max(50), warnings: z.array(warning).max(100),
    }).strict()).max(10),
}).strict();

export type VisionResult = z.infer<typeof visionResultSchema>;
export type ImageExtraction = z.infer<typeof imageExtractionSchema>;
export type ImageRequirement = ImageExtraction["requirements"][number];

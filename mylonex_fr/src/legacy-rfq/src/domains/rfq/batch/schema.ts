import { z } from "zod";
import { createRfqSubmissionSchema } from "../schema";
import { PRODUCTION_CYCLES } from "../constants";
import { isValidWidth } from "../text/width-bounds";

export class BatchConflictError extends Error {}

export const batchInquirySchema = createRfqSubmissionSchema.and(
  z.object({
    selectedPath: z.literal("production"),
    productionCycle: z.enum(PRODUCTION_CYCLES),
    quantity: z.number().int().positive().max(2_147_483_647),
    width: z
      .string()
      .trim()
      .regex(
        /^(?:\d+(?:\.\d+)?|\d+(?:\.\d+)?\s*(?:[-–—]|\bto\b)\s*\d+(?:\.\d+)?)(?:\s*(?:inches|inch|ins?|inchs|["″”]))?$/i,
        "Enter a positive width or width range in inches"
      )
      .refine(isValidWidth, "Width must be positive"),
    referenceImageUrls: z
      .array(
        z
          .string()
          .url()
          .max(2048)
          .regex(/^https?:\/\//i, "Reference photos must use HTTP or HTTPS")
      )
      .max(5)
      .default([]),
    requiredDeliveryDate: z
      .string()
      .optional()
      .refine(
        (value) => !value || (Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value),
        "Enter a real calendar date in YYYY-MM-DD format"
      ),
  })
);

export const batchSubmissionSchema = z
  .object({
    idempotencyKey: z.string().uuid(),
    lines: z
      .array(
        z
          .object({
            lineId: z.string().uuid(),
            inquiry: batchInquirySchema,
          })
          .strict()
      )
      .min(1)
      .max(200),
  })
  .strict()
  .superRefine((data, ctx) => {
    if (new Set(data.lines.map((line) => line.lineId)).size !== data.lines.length) {
      ctx.addIssue({ code: "custom", path: ["lines"], message: "Each line must have a unique ID" });
    }
  });

export const batchResultSchema = z.object({
  batchId: z.string(),
  lines: z.array(z.object({ lineId: z.string(), inquiryId: z.string(), rfqNumber: z.string() })),
});
export type BatchSubmission = z.output<typeof batchSubmissionSchema>;
export type BatchInquiry = z.output<typeof batchInquirySchema>;
export type BatchResult = z.output<typeof batchResultSchema>;

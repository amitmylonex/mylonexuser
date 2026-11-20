import { z } from "zod";
import { AI_FIELDS } from "./ai-schema.js";

export const textCandidateSchema = z.object({
  field: z.enum(AI_FIELDS), value: z.string().min(1).max(32000),
  origin: z.enum(["local", "ai"]), kind: z.enum(["explicit", "inferred", "unresolved"]),
  reportedKind: z.enum(["explicit", "inferred", "conflicting"]).optional(),
  sourcePhrases: z.array(z.string().min(1).max(32000)).min(1).max(20),
  unit: z.string().max(60).optional(), qualifier: z.string().max(200).optional(),
  status: z.enum(["accepted", "review", "unsupported"]), reason: z.string().max(1500).optional(),
  confirmed: z.boolean().optional(),
}).strict();
export type TextCandidate = z.infer<typeof textCandidateSchema>;

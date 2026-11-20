import { z } from "zod";
import { calculatePriceValidUntil, priceValiditySchema, quotePriceBasisSchema } from "./quote-validity.js";

export const whatsAppQuoteMetadataSchema = z.object({
    version: z.literal(1).optional(), // Accept earlier JSON notes for display, too.
    submittedVia: z.literal("whatsapp"),
    source: z.enum(["FLOW", "TEXT"]),
    priceBasis: quotePriceBasisSchema,
    priceValidity: priceValiditySchema.optional(),
    priceValidUntil: z.string().datetime().optional(),
    moqPerColour: z.number().int().positive(),
    sampleStatus: z.enum(["AVAILABLE", "TO_BE_MADE", "NOT_REQUIRED"]),
    sampleYardageM: z.number().positive().nullable(),
    sampleLeadTimeDays: z.number().int().positive().nullable(),
    samplingPrice: z.number().nonnegative().nullable(),
    remarks: z.string().nullable(),
    submittedAt: z.string().datetime(),
    inboundMessageId: z.string().min(1),
});

/** Ordinary website notes stay unchanged; recognized WhatsApp data must validate. */
export function prepareWhatsAppQuoteMetadata(notes: string | undefined, now: Date = new Date()) {
    if (!notes) return notes;
    let decoded: unknown;
    try { decoded = JSON.parse(notes); } catch { return notes; }
    if (typeof decoded !== "object" || decoded === null ||
        !("submittedVia" in decoded) || decoded.submittedVia !== "whatsapp") return notes;
    const metadata = whatsAppQuoteMetadataSchema.parse(decoded);
    const submittedAt = now.toISOString();
    return JSON.stringify({
        ...metadata,
        submittedAt,
        // Never trust a client-provided expiry, or invent one for legacy quotes.
        priceValidUntil: metadata.priceValidity
            ? calculatePriceValidUntil(metadata.priceValidity, submittedAt) : undefined,
    });
}

export function readWhatsAppQuoteMetadata(notes: string | null | undefined) {
    if (!notes) return null;
    try {
        const parsed = whatsAppQuoteMetadataSchema.safeParse(JSON.parse(notes));
        return parsed.success ? parsed.data : null;
    } catch { return null; } // Ordinary website notes are free text, not JSON.
}

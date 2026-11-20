const SAMPLE_THRESHOLD_M = 10000;
import { PRICE_VALIDITY_ERROR, priceValiditySchema, quotePriceBasisSchema, type PriceValidity } from "./quote-validity.js";

export interface RawSupplierQuoteInput {
    source: "FLOW" | "TEXT";
    rfqNumber?: string;
    flowToken?: string;
    price_per_m?: number | string | null;
    price_basis?: string | null; // Delivered remains supported for older submissions.
    price_validity?: unknown;
    moq_total?: number | string | null;
    moq_per_colour?: number | string | null;
    lead_time_days?: number | string | null;
    sample_available?: string | boolean | null; // "Yes" | "No" | true | false
    sample_yardage_m?: number | string | null;
    sample_lead_time_days?: number | string | null;
    sampling_price?: number | string | null;
    remarks?: string | null;
}

export interface ValidatedSupplierQuote {
    source: "FLOW" | "TEXT";
    rfqNumber?: string;
    price_per_m: number;
    price_basis: "Indicative" | "Ex-mill" | "Delivered";
    price_validity?: PriceValidity;
    moq_total: number;
    moq_per_colour: number;
    lead_time_days: number;
    sample_status: "AVAILABLE" | "TO_BE_MADE" | "NOT_REQUIRED";
    sample_yardage_m: number | null;
    sample_lead_time_days: number | null;
    sampling_price: number | null;
    remarks: string | null;
    sample_summary: string;
}

export type QuoteValidationResult =
    | { valid: true; quote: ValidatedSupplierQuote }
    | { valid: false; errors: string[] };

/**
 * Strips currency symbols (₹, Rs, Rs., INR), unit markers (m, mtr, meters, days, /m),
 * commas, and whitespace before parsing as float.
 */
export function cleanNumeric(val: unknown): number | null {
    if (typeof val === "number" && !isNaN(val)) return val;
    if (typeof val !== "string") return null;

    const cleaned = val
        .replace(/[₹$€£]/g, "")
        .replace(/\brs\.?\s*/gi, "")
        .replace(/\binr\b\s*/gi, "")
        .replace(/\b(?:mtrs?|meters?|days?|\/m(?:tr)?)\b/gi, "")
        .replace(/,/g, "")
        .trim();

    if (!cleaned) return null;
    const num = parseFloat(cleaned);
    return isNaN(num) ? null : num;
}


/**
 * Validates a supplier quote against business rules from the specification:
 * - Positive price_per_m, moq_total, and lead_time_days.
 * - Positive moq_per_colour (MCQ) and moq_per_colour <= moq_total.
 * - Sampling strictly required if RFQ total quantity <= 10,000 m.
 * - Sampling ignored if RFQ total quantity > 10,000 m.
 */
export function validateSupplierQuote(
    raw: RawSupplierQuoteInput,
    totalRfqQuantity: number
): QuoteValidationResult {
    const errors: string[] = [];

    // 1. Price
    const price = cleanNumeric(raw.price_per_m);
    if (price === null || price <= 0) {
        errors.push("PRICE must be a positive number");
    }

    // 2. MOQ Total
    const moqTotal = cleanNumeric(raw.moq_total);
    if (moqTotal === null || moqTotal <= 0) {
        errors.push("MOQ must be a positive number");
    }

    // 3. MOQ Per Colour (MCQ)
    const moqPerColour = cleanNumeric(raw.moq_per_colour);
    if (moqPerColour === null || moqPerColour <= 0) {
        errors.push("PER COLOUR / MCQ must be a positive number");
    } else if (moqTotal !== null && moqTotal > 0 && moqPerColour > moqTotal) {
        errors.push("PER COLOUR cannot exceed total MOQ");
    }

    // 4. Lead Time
    const leadTime = cleanNumeric(raw.lead_time_days);
    if (leadTime === null || leadTime <= 0) {
        errors.push("LEAD TIME must be a positive number of days");
    }

    // 5. Price basis
    const suppliedBasis = raw.price_basis?.trim().toLowerCase();
    const basis = quotePriceBasisSchema.safeParse(!suppliedBasis ? "Ex-mill" :
        suppliedBasis === "ex-mill" ? "Ex-mill" : suppliedBasis === "delivered" ? "Delivered" :
            suppliedBasis === "indicative" ? "Indicative" : raw.price_basis);
    if (!basis.success) errors.push("PRICE BASIS must be Indicative or Ex-mill (Delivered supported for older quotes)");
    const validity = priceValiditySchema.optional().safeParse(raw.price_validity);
    if (!validity.success) errors.push(PRICE_VALIDITY_ERROR);

    // 6. Sampling validation
    let sampleStatus: "AVAILABLE" | "TO_BE_MADE" | "NOT_REQUIRED" = "NOT_REQUIRED";
    let sampleYardage: number | null = null;
    let sampleLeadDays: number | null = null;
    let samplePrice: number | null = null;
    let sampleSummary = "Sample: Not required";

    const isYes =
        raw.sample_available === true ||
        (typeof raw.sample_available === "string" &&
            ["yes", "y", "available"].includes(raw.sample_available.trim().toLowerCase()));

    const isNo =
        raw.sample_available === false ||
        (typeof raw.sample_available === "string" &&
            ["no", "n", "to_be_made", "not_available"].includes(raw.sample_available.trim().toLowerCase()));

    if (totalRfqQuantity <= SAMPLE_THRESHOLD_M) {
        if (!isYes && !isNo) {
            errors.push("SAMPLE availability is required (YES or NO) for quantities under 10,000 m");
        } else if (isYes) {
            sampleYardage = cleanNumeric(raw.sample_yardage_m);
            samplePrice = cleanNumeric(raw.sampling_price);
            if (sampleYardage === null || sampleYardage <= 0) {
                errors.push("SAMPLE YARDAGE must be positive when sample is available");
            }
            if (samplePrice === null || samplePrice < 0) {
                errors.push("SAMPLE PRICE must be zero or greater when sample is available");
            }
            if (sampleYardage !== null && sampleYardage > 0 && samplePrice !== null && samplePrice >= 0) {
                sampleStatus = "AVAILABLE";
                sampleSummary = samplePrice === 0
                    ? `Sample: ${sampleYardage} m available (Free sample)`
                    : `Sample: ${sampleYardage} m available @ ₹${samplePrice}/m`;
            }
        } else if (isNo) {
            sampleLeadDays = cleanNumeric(raw.sample_lead_time_days);
            samplePrice = cleanNumeric(raw.sampling_price);
            if (sampleLeadDays === null || sampleLeadDays <= 0) {
                errors.push("SAMPLE LEAD TIME must be positive when no sample is available");
            }
            if (samplePrice === null || samplePrice < 0) {
                errors.push("SAMPLE PRICE must be zero or greater when no sample is available");
            }
            if (sampleLeadDays !== null && sampleLeadDays > 0 && samplePrice !== null && samplePrice >= 0) {
                sampleStatus = "TO_BE_MADE";
                sampleSummary = samplePrice === 0
                    ? `Sample: ${sampleLeadDays} days (Free sample)`
                    : `Sample: ${sampleLeadDays} days @ ₹${samplePrice}/m`;
            }
        }
    } else {
        // Bulk enquiry (> 10,000 m)
        if (isYes) {
            sampleYardage = cleanNumeric(raw.sample_yardage_m);
            samplePrice = cleanNumeric(raw.sampling_price);
            if (sampleYardage !== null && sampleYardage > 0 && samplePrice !== null && samplePrice >= 0) {
                sampleStatus = "AVAILABLE";
                sampleSummary = samplePrice === 0
                    ? `Sample: ${sampleYardage} m available (Free sample)`
                    : `Sample: ${sampleYardage} m available @ ₹${samplePrice}/m`;
            } else {
                sampleStatus = "NOT_REQUIRED";
                sampleSummary = "Sample: Not required for bulk enquiry";
            }
        } else if (isNo) {
            sampleLeadDays = cleanNumeric(raw.sample_lead_time_days);
            samplePrice = cleanNumeric(raw.sampling_price);
            if (sampleLeadDays !== null && sampleLeadDays > 0 && samplePrice !== null && samplePrice >= 0) {
                sampleStatus = "TO_BE_MADE";
                sampleSummary = samplePrice === 0
                    ? `Sample: ${sampleLeadDays} days (Free sample)`
                    : `Sample: ${sampleLeadDays} days @ ₹${samplePrice}/m`;
            } else {
                sampleStatus = "NOT_REQUIRED";
                sampleSummary = "Sample: Not required for bulk enquiry";
            }
        } else {
            sampleStatus = "NOT_REQUIRED";
            sampleSummary = "Sample: Not required for bulk enquiry";
        }
    }

    if (errors.length > 0) {
        return { valid: false, errors };
    }

    return {
        valid: true,
        quote: {
            source: raw.source,
            rfqNumber: raw.rfqNumber?.trim() || undefined,
            price_per_m: price!,
            price_basis: basis.success ? basis.data : "Ex-mill",
            ...(validity.success && validity.data ? { price_validity: validity.data } : {}),
            moq_total: Math.round(moqTotal!),
            moq_per_colour: Math.round(moqPerColour!),
            lead_time_days: Math.round(leadTime!),
            sample_status: sampleStatus,
            sample_yardage_m: sampleStatus === "AVAILABLE" && sampleYardage ? Math.round(sampleYardage) : null,
            sample_lead_time_days: sampleStatus === "TO_BE_MADE" && sampleLeadDays ? Math.round(sampleLeadDays) : null,
            sampling_price: sampleStatus !== "NOT_REQUIRED" ? samplePrice : null,
            remarks: raw.remarks?.trim() || null,
            sample_summary: sampleSummary,
        },
    };
}

/**
 * Parses a plain-text quote string according to the specification format:
 * QUOTE RFQ-2041
 * PRICE: 142
 * MOQ: 3000
 * PER COLOUR: 500
 * LEAD TIME: 25
 * SAMPLE: YES 30 (or NO)
 * SAMPLE LEAD TIME: 7
 * SAMPLE PRICE: 180
 */
export function parsePlainTextQuote(text: string): RawSupplierQuoteInput | null {
    if (!text || typeof text !== "string") return null;

    const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    if (lines.length === 0) return null;

    const fullUpper = text.toUpperCase();
    const hasPrice = fullUpper.includes("PRICE") || fullUpper.includes("RATE");
    const hasMoq = fullUpper.includes("MOQ");
    const isQuoteAttempt =
        fullUpper.includes("QUOTE") ||
        (hasPrice && hasMoq) ||
        (fullUpper.includes("RFQ") && hasPrice);

    if (!isQuoteAttempt) {
        return null;
    }


    const raw: RawSupplierQuoteInput = {
        source: "TEXT",
    };

    for (const line of lines) {
        const colonIdx = line.indexOf(":");
        let key = "";
        let val = "";

        if (colonIdx !== -1) {
            key = line.slice(0, colonIdx).trim().toUpperCase();
            val = line.slice(colonIdx + 1).trim();
        } else {
            const parts = line.split(/\s+/);
            key = parts[0].toUpperCase();
            val = parts.slice(1).join(" ").trim();
        }

        if (key.includes("QUOTE") || key === "RFQ") {
            const match = (val || line).match(/RFQ-[A-Z0-9-]+/i);
            if (match) {
                raw.rfqNumber = match[0].toUpperCase();
            }
        } else if (key.includes("PER COLOUR") || key.includes("PER COLOR") || key === "MCQ") {
            raw.moq_per_colour = val;
        } else if (key === "PRICE" || key === "RATE") {
            raw.price_per_m = val;
        } else if (key === "MOQ" || key.includes("MINIMUM ORDER")) {
            raw.moq_total = val;
        } else if (key.includes("LEAD TIME") || key.includes("DELIVERY")) {
            if (key.includes("SAMPLE")) {
                raw.sample_lead_time_days = val;
            } else {
                raw.lead_time_days = val;
            }
        } else if (key.includes("SAMPLE PRICE") || key.includes("SAMPLE RATE") || key.includes("SAMPLE COST")) {
            raw.sampling_price = val;
        } else if (key.includes("SAMPLE LEAD")) {
            raw.sample_lead_time_days = val;
        } else if (key === "SAMPLE" || key === "SAMPLING") {
            const valUpper = val.toUpperCase();
            if (valUpper.includes("YES") || valUpper.includes("AVAILABLE")) {
                raw.sample_available = "Yes";
                const numMatch = val.match(/\d+/);
                if (numMatch) {
                    raw.sample_yardage_m = numMatch[0];
                }
            } else if (valUpper.includes("NO") || valUpper.includes("NOT")) {
                raw.sample_available = "No";
            }
        } else if (key === "VALIDITY" || key === "PRICE VALIDITY") {
            raw.price_validity = val;
        } else if (key.includes("BASIS")) {
            raw.price_basis = val;
        } else if (key.includes("REMARK") || key.includes("NOTE")) {
            raw.remarks = val;
        }
    }

    return raw;
}

/**
 * Decodes and standardizes response JSON received from a native WhatsApp Flow (nfm_reply).
 */
export function parseFlowQuote(
    responseJson: string | Record<string, unknown>
): RawSupplierQuoteInput {
    let data: Record<string, unknown>;
    if (typeof responseJson === "string") {
        try {
            data = JSON.parse(responseJson);
        } catch {
            data = {};
        }
    } else if (typeof responseJson === "object" && responseJson !== null) {
        data = responseJson;
    } else {
        data = {};
    }

    const normalizeOptionalString = (val: unknown): string | undefined => {
        if (typeof val === "string") {
            const trimmed = val.trim();
            return trimmed.length > 0 ? trimmed : undefined;
        }
        return undefined;
    };

    return {
        source: "FLOW",
        rfqNumber: normalizeOptionalString(data.rfq_id),
        flowToken: normalizeOptionalString(data.flow_token),
        price_per_m: data.price_per_m as any,
        price_basis: typeof data.price_basis === "string" ? data.price_basis : undefined,
        price_validity: data.price_validity,
        moq_total: data.moq_total as any,
        moq_per_colour: data.moq_per_colour as any,
        lead_time_days: data.lead_time_days as any,
        sample_available: data.sample_available as any,
        sample_yardage_m: data.sample_yardage_m as any,
        sample_lead_time_days: data.sample_lead_time_days as any,
        sampling_price: data.sampling_price as any,
        remarks: normalizeOptionalString(data.remarks),
    };
}

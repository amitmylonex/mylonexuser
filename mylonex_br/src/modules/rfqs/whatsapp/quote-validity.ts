import { z } from "zod";

const HOURS_PER_UNIT = { hour: 1, day: 24, week: 168 } as const;
export const PRICE_VALIDITY_ERROR =
    "PRICE VALIDITY must be a positive whole number of hours, days or weeks (maximum 365 days), e.g. 48 hours, 3 days or 1 week";

export const priceValiditySchema = z.string({ error: PRICE_VALIDITY_ERROR })
    .max(64, { error: PRICE_VALIDITY_ERROR })
    .transform((value, ctx) => {
        const match = /^(\d+)\s+(hours?|days?|weeks?)$/i.exec(value.trim());
        const count = match ? Number(match[1]) : 0;
        const unit = match?.[2].toLowerCase().replace(/s$/, "") as keyof typeof HOURS_PER_UNIT;
        if (!match || !Number.isSafeInteger(count) || count <= 0 || count * HOURS_PER_UNIT[unit] > 365 * 24) {
            ctx.addIssue({ code: "custom", message: PRICE_VALIDITY_ERROR });
            return z.NEVER;
        }
        return `${count} ${unit}${count === 1 ? "" : "s"}`;
    });
export type PriceValidity = z.infer<typeof priceValiditySchema>;
export const quotePriceBasisSchema = z.enum(["Indicative", "Ex-mill", "Delivered"]);

export function calculatePriceValidUntil(validity: PriceValidity, submittedAt: string): string {
    const [count, unit] = priceValiditySchema.parse(validity).split(" ");
    const hours = Number(count) * HOURS_PER_UNIT[unit.replace(/s$/, "") as keyof typeof HOURS_PER_UNIT];
    return new Date(Date.parse(submittedAt) + hours * 60 * 60 * 1000).toISOString();
}

export function isQuotePriceExpired(validUntil: string, now: number = Date.now()): boolean {
    return now >= Date.parse(validUntil);
}

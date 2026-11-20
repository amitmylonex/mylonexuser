import { createHmac, timingSafeEqual } from "node:crypto";
import { z } from "zod";

const claimsSchema = z.tuple([
    z.string().min(1),
    z.string().min(1),
    z.string().min(1),
    z.number().int().positive(),
]);
const TOKEN_LIFETIME_SECONDS = 30 * 24 * 60 * 60;

function getSecret(): string | undefined {
    return process.env.WHATSAPP_APP_SECRET;
}

function signature(payload: string, secret: string) {
    return createHmac("sha256", secret).update(`mylonex:supplier-quote:v1:${payload}`).digest("base64url");
}

export function createSupplierQuoteFlowToken(matchId: string, supplierId: string, requestId: string) {
    const secret = getSecret();
    if (!secret) throw new Error("WhatsApp app secret is required for quote Flow tokens");
    const claims = claimsSchema.parse([
        matchId,
        supplierId,
        requestId,
        Math.floor(Date.now() / 1000) + TOKEN_LIFETIME_SECONDS,
    ]);
    const payload = Buffer.from(JSON.stringify(claims)).toString("base64url");
    return `v1.${payload}.${signature(payload, secret)}`;
}

export function verifySupplierQuoteFlowToken(token: string | undefined) {
    const secret = getSecret();
    if (!secret || !token || token.length > 256) return null;
    const parts = token.split(".");
    if (parts.length !== 3 || parts[0] !== "v1" || !/^[\w-]+$/.test(parts[1])) return null;
    const expected = Buffer.from(signature(parts[1], secret));
    const actual = Buffer.from(parts[2]);
    if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return null;
    try {
        const claims = claimsSchema.safeParse(JSON.parse(Buffer.from(parts[1], "base64url").toString()));
        if (!claims.success || claims.data[3] <= Math.floor(Date.now() / 1000)) return null;
        const [matchId, supplierId, requestId] = claims.data;
        return { matchId, supplierId, requestId };
    } catch {
        return null;
    }
}

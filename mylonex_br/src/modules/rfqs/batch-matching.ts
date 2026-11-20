import type { Prisma } from '@prisma/client';

async function getActiveCatalogListingsForMatching(db: Prisma.TransactionClient) {
  const [catalogEntries, wovenProducts] = await Promise.all([
    db.supplierCatalog.findMany({ where: { isActive: true, supplier: { status: 'APPROVED' } }, include: { supplier: true } }),
    db.wovenProduct.findMany({ where: { isActive: true, supplier: { status: 'APPROVED' } }, include: { supplier: true, specs: true } }),
  ]);
  return { catalogEntries, wovenProducts };
}

// ── Types ──────────────────────────────────────────────────

type RequestSpecPayload = {
    composition?: string;
    fabricStructure?: string;
    data?: {
        materialType?: "pure" | "blend";
        blendComposition?: string;
        weaveType?: string;
        knitType?: string;
        fabricState?: string;
        yarnType?: string;
        gsm?: number;
        gsmMin?: number;
        gsmMax?: number;
        width?: string;
        openWidthIn?: number;
        diaIn?: number;
        quantity?: number;
        deliveryPincode?: string;
        deliveryState?: string;
        deliveryCity?: string;
        deliveryCountry?: string;
        templateSpecs?: Array<{
            specKey: string;
            valueNum?: number;
            valueText?: string;
        }>;
    };
};

type NormalizedListing = {
    sourceType: "supplier_catalog" | "woven_product";
    sourceId: string;
    supplierId: string;
    supplierName: string;
    supplierCity?: string | null;
    supplierState?: string | null;
    supplierUserId?: string | null;
    composition: string;
    weave: string;
    gsm: number;
    width: number;
    moq: number;
    leadTimeDays: number;
    pricePerMeter: number;
    listingType: string;
    materialPurity?: string | null;
    blendDescription?: string | null;
    // New fields for upgraded matching
    fabricCategory: "woven" | "knits";
    dyedState: string | null;
    yarnType: string | null;
    warpCount: number | null;
    weftCount: number | null;
    epi: number | null;
    ppi: number | null;
    raw: Record<string, unknown>;
};

type MatchRequirement = {
    composition: string;
    weave: string;
    gsmMin: number;
    gsmMax: number;
    width: number;
    quantity: number;
    deliveryState: string | null;
    materialType: string | null;
    blendComposition: string | null;
    // New fields for upgraded matching
    fabricStructure: string | null;
    fabricState: string | null;
    yarnType: string | null;
    warpCount: number | null;
    weftCount: number | null;
    epi: number | null;
    ppi: number | null;
    hasConstructionSpecs: boolean;
};

// ── Utility helpers ────────────────────────────────────────

function normalizeText(value: string) {
    return value.trim().toLowerCase();
}

function firstNumericToken(value?: string) {
    if (!value) return null;
    const match = value.match(/\d+(?:\.\d+)?/);
    return match ? Number(match[0]) : null;
}

/**
 * Extracts the leading numeric value from a yarn count/ply string.
 * Examples: "40s/1" → 40, "30s OE" → 30, "20/2" → 20, "60" → 60
 */
function parseCountNumeric(value?: string | null): number | null {
    if (!value) return null;
    const match = value.match(/(\d+(?:\.\d+)?)/);
    return match ? Number(match[1]) : null;
}

/**
 * Extracts the yarn type from a yarn count/ply string.
 * Looks for known keywords: ring spun, oe, compact, filament, carded, combed.
 * Examples: "40s/1 Compact" → "compact", "30s OE" → "oe"
 */
function extractYarnTypeFromCountText(value?: string | null): string | null {
    if (!value) return null;
    const lower = value.toLowerCase();

    // Order matters — check multi-word patterns first
    if (lower.includes("ring spun") || lower.includes("ring-spun")) return "ring spun";
    if (lower.includes("compact")) return "compact";
    if (lower.includes("filament")) return "filament";
    if (lower.includes("combed")) return "combed";
    if (lower.includes("carded")) return "carded";
    // "OE" is short for open-end
    if (/\boe\b/.test(lower) || lower.includes("open end") || lower.includes("open-end")) return "oe";

    return null;
}

// ── Dyed state equivalence ─────────────────────────────────

/**
 * Checks if buyer's dyed state is compatible with supplier's listing.
 * Rules from spec:
 * - Greige ↔ RFD are interchangeable (bidirectional)
 * - Greige/RFD cannot match Dyed or Printed
 * - Dyed cannot match Printed
 */
function areDyedStatesCompatible(buyerState: string, listingState: string): boolean {
    const buyer = normalizeText(buyerState);
    const listing = normalizeText(listingState);

    if (buyer === listing) return true;

    // Greige and RFD are interchangeable
    const greigeRfdGroup = new Set(["greige", "rfd"]);
    if (greigeRfdGroup.has(buyer) && greigeRfdGroup.has(listing)) return true;

    // Everything else is an exact-match requirement
    return false;
}

// ── Composition percentage parsing ─────────────────────────

type CompositionComponent = { percentage: number; fiber: string };

/**
 * Parses composition strings like "65/35 PC", "70/30 Cotton Polyester",
 * "100% Cotton", "60% Cotton 40% Polyester" into percentage + fiber pairs.
 * Returns null if the string can't be parsed as percentages.
 */
function parseCompositionPercentages(raw: string): CompositionComponent[] | null {
    const text = raw.trim();

    // Pattern 1: "65/35 PC" or "80/20 CVC" — ratio + short code
    const ratioMatch = text.match(/^(\d+)\s*\/\s*(\d+)\b/);
    if (ratioMatch) {
        const p1 = Number(ratioMatch[1]);
        const p2 = Number(ratioMatch[2]);
        if (p1 + p2 >= 95 && p1 + p2 <= 105) {
            // Extract fiber names from remainder
            const remainder = text.slice(ratioMatch[0].length).trim();
            return [
                { percentage: p1, fiber: remainder || "primary" },
                { percentage: p2, fiber: "secondary" },
            ];
        }
    }

    // Pattern 2: "60% Cotton 40% Polyester" or "100% Cotton"
    const pctPattern = /(\d+(?:\.\d+)?)\s*%\s*([A-Za-z][A-Za-z\s]*?)(?=\s*\d|$)/g;
    const components: CompositionComponent[] = [];
    let m;
    while ((m = pctPattern.exec(text)) !== null) {
        components.push({ percentage: Number(m[1]), fiber: m[2].trim() });
    }

    if (components.length > 0) {
        return components;
    }

    return null;
}

/**
 * Checks if two compositions are compatible within ±5 percentage points
 * per component. Returns null if either can't be parsed as percentages
 * (caller should fall back to substring matching).
 */
function compositionsMatchByPercentage(
    buyerComp: string,
    listingComp: string,
    tolerancePct: number = 5
): { matched: boolean; explanation: string } | null {
    const buyerParsed = parseCompositionPercentages(buyerComp);
    const listingParsed = parseCompositionPercentages(listingComp);

    if (!buyerParsed || !listingParsed) return null;

    // Different number of components → can't match by percentage
    if (buyerParsed.length !== listingParsed.length) {
        return { matched: false, explanation: "Component count mismatch" };
    }

    // Sort by percentage desc so we match largest components
    const buyer = [...buyerParsed].sort((a, b) => b.percentage - a.percentage);
    const listing = [...listingParsed].sort((a, b) => b.percentage - a.percentage);

    for (let i = 0; i < buyer.length; i++) {
        const diff = Math.abs(buyer[i].percentage - listing[i].percentage);
        if (diff > tolerancePct) {
            return {
                matched: false,
                explanation: `Component ${i + 1} differs by ${diff}% (max ${tolerancePct}%)`,
            };
        }
    }

    return { matched: true, explanation: "Composition percentages within tolerance" };
}

// ── Tolerance check helper ─────────────────────────────────

/**
 * Checks if a value is within tolerance of a target.
 * Uses the MORE GENEROUS of absolute or percentage tolerance.
 */
function isWithinTolerance(
    actual: number,
    targetMin: number,
    targetMax: number,
    absoluteTolerance: number,
    percentTolerance: number
): boolean {
    const midpoint = (targetMin + targetMax) / 2;
    const pctAllowance = midpoint * (percentTolerance / 100);
    const allowance = Math.max(absoluteTolerance, pctAllowance);
    return actual >= targetMin - allowance && actual <= targetMax + allowance;
}

// ── Pincode → state inference ──────────────────────────────

function inferStateFromPincode(pincode?: string | null) {
    if (!pincode) {
        return null;
    }

    const clean = pincode.replace(/\D/g, "");
    if (clean.length < 2) {
        return null;
    }

    const prefix = clean.slice(0, 2);
    const map: Record<string, string> = {
        "11": "Delhi",
        "12": "Haryana",
        "13": "Punjab",
        "14": "Punjab",
        "15": "Punjab",
        "16": "Chandigarh",
        "17": "Himachal Pradesh",
        "18": "Jammu and Kashmir",
        "19": "Jammu and Kashmir",
        "20": "Uttar Pradesh",
        "21": "Uttar Pradesh",
        "22": "Uttar Pradesh",
        "23": "Uttar Pradesh",
        "24": "Uttar Pradesh",
        "25": "Uttar Pradesh",
        "26": "Uttar Pradesh",
        "27": "Uttar Pradesh",
        "28": "Uttar Pradesh",
        "30": "Rajasthan",
        "31": "Rajasthan",
        "32": "Rajasthan",
        "33": "Rajasthan",
        "34": "Rajasthan",
        "36": "Gujarat",
        "37": "Gujarat",
        "38": "Gujarat",
        "39": "Gujarat",
        "40": "Maharashtra",
        "41": "Maharashtra",
        "42": "Maharashtra",
        "43": "Maharashtra",
        "44": "Maharashtra",
        "45": "Madhya Pradesh",
        "46": "Madhya Pradesh",
        "47": "Madhya Pradesh",
        "48": "Chhattisgarh",
        "49": "Chhattisgarh",
        "50": "Telangana",
        "51": "Telangana",
        "52": "Andhra Pradesh",
        "53": "Andhra Pradesh",
        "56": "Karnataka",
        "57": "Karnataka",
        "58": "Karnataka",
        "59": "Karnataka",
        "60": "Tamil Nadu",
        "61": "Tamil Nadu",
        "62": "Tamil Nadu",
        "63": "Tamil Nadu",
        "64": "Tamil Nadu",
        "67": "Kerala",
        "68": "Kerala",
        "69": "Kerala",
        "70": "West Bengal",
        "71": "West Bengal",
        "72": "West Bengal",
        "73": "Sikkim",
        "74": "West Bengal",
        "75": "Odisha",
        "76": "Odisha",
        "78": "Assam",
        "79": "Assam",
        "80": "Bihar",
        "81": "Bihar",
        "82": "Jharkhand",
        "83": "Jharkhand",
        "84": "Bihar",
        "85": "Bihar",
        "90": "Armed Forces",
    };

    return map[prefix] ?? null;
}

// ── Listing normalizers ────────────────────────────────────

function normalizedListingFromCatalog(entry: Awaited<ReturnType<typeof getActiveCatalogListingsForMatching>>["catalogEntries"][number]): NormalizedListing {
    return {
        sourceType: "supplier_catalog",
        sourceId: entry.id,
        supplierId: entry.supplierId,
        supplierName: entry.supplier.companyName,
        supplierCity: entry.city ?? entry.supplier.city,
        supplierState: entry.locationState,
        supplierUserId: entry.supplier.userId,
        composition: entry.compositionText ?? entry.fabricType ?? "",
        weave: entry.weaveType,
        gsm: entry.gsm,
        width: Number(entry.widthInches ?? 0),
        moq: entry.minimumOrderQuantity,
        leadTimeDays: entry.leadTimeDays,
        pricePerMeter: Number(entry.pricePerMeter),
        listingType: entry.productionCycle,
        materialPurity: entry.materialPurity,
        blendDescription: entry.blendDescription,
        // SupplierCatalog is implicitly woven; no explicit dyed state or yarn type fields
        fabricCategory: "woven",
        dyedState: null,
        yarnType: null,
        warpCount: null,
        weftCount: null,
        epi: null,
        ppi: null,
        raw: {
            id: entry.id,
            fabricName: entry.fabricName,
            description: entry.description,
            colorOptions: entry.colorOptions,
            finishOptions: entry.finishOptions,
            imageUrls: entry.imageUrls,
            sourceType: "supplier_catalog",
        },
    };
}

function normalizedListingFromWoven(entry: Awaited<ReturnType<typeof getActiveCatalogListingsForMatching>>["wovenProducts"][number]): NormalizedListing {
    // Extract construction specs from WovenProductSpec rows
    const specs = "specs" in entry ? (entry as any).specs as Array<{ specKey: string; valueNum?: any; valueText?: string }> : [];
    const warpSpec = specs.find((s) => s.specKey === "warp_count_ply" || s.specKey === "warp_count" || s.specKey === "warp_count_value");
    const weftSpec = specs.find((s) => s.specKey === "weft_count_ply" || s.specKey === "weft_count" || s.specKey === "weft_count_value");
    const epiSpec = specs.find((s) => s.specKey === "epi" || s.specKey === "epi_optional");
    const ppiSpec = specs.find((s) => s.specKey === "ppi" || s.specKey === "ppi_optional");

    // Extract numeric count values and yarn type from text specs
    const warpCountText = warpSpec?.valueText ?? (warpSpec?.valueNum !== undefined ? String(warpSpec.valueNum) : null);
    const weftCountText = weftSpec?.valueText ?? (weftSpec?.valueNum !== undefined ? String(weftSpec.valueNum) : null);

    // Try to infer yarn type from warp count text (e.g. "40s/1 Compact" → "compact")
    const yarnType = extractYarnTypeFromCountText(warpCountText) ?? extractYarnTypeFromCountText(weftCountText);

    return {
        sourceType: "woven_product",
        sourceId: entry.id,
        supplierId: entry.supplierId,
        supplierName: entry.supplier.companyName,
        supplierCity: entry.city ?? entry.supplier.city,
        supplierState: entry.locationState,
        supplierUserId: entry.supplier.userId,
        composition: entry.compositionText,
        weave: entry.weaveType,
        gsm: entry.gsmFinished,
        width: Number(entry.widthFinishedIn),
        moq: entry.moqMeters,
        leadTimeDays: entry.leadTimeDays,
        pricePerMeter: Number(entry.priceInrPerM),
        listingType: entry.listingType,
        // WovenProduct has finishCategory (greige/dyed/printed/finished/coated/laminated)
        fabricCategory: (entry.structure === "knits" ? "knits" : "woven") as "woven" | "knits",
        dyedState: entry.finishCategory ?? null,
        yarnType,
        warpCount: parseCountNumeric(warpCountText),
        weftCount: parseCountNumeric(weftCountText),
        epi: epiSpec?.valueNum != null ? Number(epiSpec.valueNum) : null,
        ppi: ppiSpec?.valueNum != null ? Number(ppiSpec.valueNum) : null,
        raw: {
            id: entry.id,
            millName: entry.millName,
            notes: entry.notes,
            images: entry.images,
            structure: entry.structure,
            sourceType: "woven_product",
        },
    };
}

// ── Requirement parser ─────────────────────────────────────

function parseRequirementFromRequest(specPayload: unknown, deliveryPincode?: string | null): MatchRequirement {
    const payload = (specPayload ?? {}) as RequestSpecPayload;
    const composition = payload.composition ?? "";
    const weave = payload.data?.weaveType ?? payload.data?.knitType ?? "";

    const gsmMin = payload.data?.gsmMin ?? payload.data?.gsm ?? 0;
    const gsmMax = payload.data?.gsmMax ?? payload.data?.gsm ?? 0;

    const width = payload.data?.openWidthIn ?? payload.data?.diaIn ?? firstNumericToken(payload.data?.width) ?? 0;
    const quantity = payload.data?.quantity ?? 0;
    const requestedDeliveryState = payload.data?.deliveryState?.trim();

    // Extract construction specs from buyer's templateSpecs
    const templateSpecs = payload.data?.templateSpecs ?? [];
    const buyerEpiSpec = templateSpecs.find((s) => s.specKey === "epi");
    const buyerPpiSpec = templateSpecs.find((s) => s.specKey === "ppi");
    const buyerWarpSpec = templateSpecs.find((s) => s.specKey === "warp_count_ply" || s.specKey === "warp_count_value");
    const buyerWeftSpec = templateSpecs.find((s) => s.specKey === "weft_count_ply" || s.specKey === "weft_count_value");

    const epi = buyerEpiSpec?.valueNum ?? null;
    const ppi = buyerPpiSpec?.valueNum ?? null;
    const warpCount = buyerWarpSpec?.valueNum ?? parseCountNumeric(buyerWarpSpec?.valueText) ?? null;
    const weftCount = buyerWeftSpec?.valueNum ?? parseCountNumeric(buyerWeftSpec?.valueText) ?? null;

    // Buyer has construction specs if any of EPI, PPI, warp, or weft is provided
    const hasConstructionSpecs = epi != null || ppi != null || warpCount != null || weftCount != null;

    return {
        composition,
        weave,
        gsmMin,
        gsmMax,
        width,
        quantity,
        deliveryState: requestedDeliveryState || inferStateFromPincode(deliveryPincode),
        materialType: payload.data?.materialType ?? null,
        blendComposition: payload.data?.blendComposition ?? null,
        fabricStructure: payload.fabricStructure ?? null,
        fabricState: payload.data?.fabricState ?? null,
        yarnType: payload.data?.yarnType ?? null,
        warpCount,
        weftCount,
        epi,
        ppi,
        hasConstructionSpecs,
    };
}

// ── Core scoring function ──────────────────────────────────

function scoreListingMatch(
    listing: NormalizedListing,
    requirement: MatchRequirement
) {
    const reasons: string[] = [];
    let score = 0;

    // ═══════════════════════════════════════════════════
    // HARD GATES — any failure → instant rejection
    // ═══════════════════════════════════════════════════

    // Gate 1: Fabric Category (Woven ≠ Knit)
    if (requirement.fabricStructure) {
        const buyerCategory = normalizeText(requirement.fabricStructure) === "knits" ? "knits" : "woven";
        if (listing.fabricCategory !== buyerCategory) {
            return null;
        }
    }

    // Gate 2: Weave Type — exact match (case-insensitive)
    if (normalizeText(listing.weave) !== normalizeText(requirement.weave)) {
        return null;
    }
    score += 25;
    reasons.push("Weave matched");

    // Gate 3: Composition — percentage tolerance or substring fallback
    const listingComposition = normalizeText(listing.composition);
    const requirementComposition = normalizeText(requirement.composition);
    let compositionMatched = false;

    // Try percentage-based matching first
    const pctResult = compositionsMatchByPercentage(requirement.composition, listing.composition);
    if (pctResult !== null) {
        if (pctResult.matched) {
            score += 30;
            reasons.push("Composition percentages aligned");
            compositionMatched = true;
        } else {
            // Percentages parsed but outside tolerance → hard reject
            return null;
        }
    } else {
        // Fallback: substring matching (for non-percentage compositions like "100% Cotton")
        if (listingComposition.includes(requirementComposition) || requirementComposition.includes(listingComposition)) {
            score += 30;
            reasons.push("Composition aligned");
            compositionMatched = true;
        } else {
            const headToken = requirementComposition.split(" ")[0];
            if (headToken && listingComposition.includes(headToken)) {
                score += 15;
                reasons.push("Composition partially aligned");
                compositionMatched = true;
            }
        }
    }

    // Hard gate: reject if composition did not match at any level
    if (!compositionMatched) {
        return null;
    }

    // Gate 4: Dyed State — exact match with Greige ↔ RFD equivalence
    // Only enforced when both sides provide a value
    if (requirement.fabricState && listing.dyedState) {
        if (!areDyedStatesCompatible(requirement.fabricState, listing.dyedState)) {
            return null;
        }
        score += 10;
        reasons.push("Dyed state compatible");
    }

    // Gate 5: Yarn Type — exact match when both sides provide
    if (requirement.yarnType && listing.yarnType) {
        if (normalizeText(requirement.yarnType) !== normalizeText(listing.yarnType)) {
            return null;
        }
        score += 5;
        reasons.push("Yarn type matched");
    }

    // ═══════════════════════════════════════════════════
    // TOLERANCE CHECKS — reject outside tolerance
    // ═══════════════════════════════════════════════════

    // GSM: ±5 GSM or ±3% (whichever is more generous)
    // If buyer has no construction specs, GSM is a hard gate.
    // If buyer has construction specs, GSM is soft scoring.
    const gsmInTolerance = isWithinTolerance(listing.gsm, requirement.gsmMin, requirement.gsmMax, 5, 3);

    if (!requirement.hasConstructionSpecs) {
        // No construction specs → GSM must match (hard gate)
        if (!gsmInTolerance) {
            return null;
        }
        score += 20;
        reasons.push("GSM within tolerance");
    } else {
        // Construction specs provided → GSM is soft scoring
        if (gsmInTolerance) {
            score += 15;
            reasons.push("GSM within tolerance");
        }
    }

    // Width: ±2" tolerance (hard reject outside)
    if (listing.width > 0 && requirement.width > 0) {
        const widthDiff = Math.abs(listing.width - requirement.width);
        if (widthDiff > 2) {
            return null;
        }
        if (widthDiff === 0) {
            score += 15;
            reasons.push("Width exact");
        } else {
            score += 8;
            reasons.push("Width near");
        }
    }

    // ═══════════════════════════════════════════════════
    // SOFT SCORING — additive points, no rejection
    // ═══════════════════════════════════════════════════

    // Construction specs: warp count, weft count, EPI, PPI (±5% tolerance each)
    if (requirement.warpCount != null && requirement.warpCount > 0 && listing.warpCount != null) {
        const diff = Math.abs(listing.warpCount - requirement.warpCount);
        if (diff <= requirement.warpCount * 0.05) {
            score += 5;
            reasons.push("Warp count matched");
        }
    }

    if (requirement.weftCount != null && requirement.weftCount > 0 && listing.weftCount != null) {
        const diff = Math.abs(listing.weftCount - requirement.weftCount);
        if (diff <= requirement.weftCount * 0.05) {
            score += 5;
            reasons.push("Weft count matched");
        }
    }

    if (requirement.epi != null && requirement.epi > 0 && listing.epi != null) {
        const diff = Math.abs(listing.epi - requirement.epi);
        if (diff <= requirement.epi * 0.05) {
            score += 5;
            reasons.push("EPI matched");
        }
    }

    if (requirement.ppi != null && requirement.ppi > 0 && listing.ppi != null) {
        const diff = Math.abs(listing.ppi - requirement.ppi);
        if (diff <= requirement.ppi * 0.05) {
            score += 5;
            reasons.push("PPI matched");
        }
    }

    // MOQ satisfied
    if (requirement.quantity >= listing.moq) {
        score += 5;
        reasons.push("MOQ satisfied");
    }

    // Lead time favorable
    if (listing.leadTimeDays <= 21) {
        score += 3;
        reasons.push("Lead time favorable");
    }

    // State proximity
    if (requirement.deliveryState && listing.supplierState && normalizeText(requirement.deliveryState) === normalizeText(listing.supplierState)) {
        score += 7;
        reasons.push("State proximity matched");
    } else if (requirement.deliveryState && listing.supplierCity) {
        score += 2;
        reasons.push("Location data available for heuristic routing");
    }

    // Material purity scoring: buyer materialType vs supplier materialPurity
    if (requirement.materialType && listing.materialPurity) {
        const buyerPurity = normalizeText(requirement.materialType);
        const supplierPurity = normalizeText(listing.materialPurity);
        // Normalize: buyer uses "blend", supplier uses "blended"
        const buyerIsBlend = buyerPurity === "blend" || buyerPurity === "blended";
        const supplierIsBlend = supplierPurity === "blend" || supplierPurity === "blended";

        if (buyerIsBlend === supplierIsBlend) {
            score += 10;
            reasons.push("Material purity aligned");

            // For blended: token-match buyer's blendComposition against supplier's blendDescription
            if (buyerIsBlend && requirement.blendComposition && listing.blendDescription) {
                const buyerTokens = normalizeText(requirement.blendComposition)
                    .replace(/[^a-z\s]/g, " ")
                    .split(/\s+/)
                    .filter((t) => t.length > 2);
                const supplierText = normalizeText(listing.blendDescription);
                const matched = buyerTokens.filter((token) => supplierText.includes(token));

                if (matched.length === buyerTokens.length && buyerTokens.length > 0) {
                    score += 8;
                    reasons.push("Blend composition fully matched");
                } else if (matched.length > 0) {
                    score += 4;
                    reasons.push("Blend composition partially matched");
                }
            }
        }
    }

    // Minimum threshold to qualify as a match
    if (score < 20) {
        return null;
    }

    return {
        score: Math.min(score, 100),
        explanation: reasons.join(". ") + ".",
    };
}

// ── Main matching orchestrator ─────────────────────────────

export async function generateMatchesForCommunicationRequest(db: Prisma.TransactionClient, communicationRequestId: string) {
    const request = await db.communicationRequest.findUnique({
        where: { id: communicationRequestId },
    });

    if (!request) {
        throw new Error(`CommunicationRequest ${communicationRequestId} not found`);
    }

    const isFabricQuickRfq = (request.specPayload as any)?.origin === "fabric_quick_rfq";
    if (isFabricQuickRfq) {
        // Exact catalog inquiries are deliberately not similarity-matched.
        // This also keeps the admin re-match action from broadening the request later.
        return [];
    }

    const requirement = parseRequirementFromRequest(request.specPayload, request.deliveryPincode);
    if (!requirement.composition || !requirement.weave || !requirement.gsmMin || !requirement.gsmMax || !requirement.width) {
        return [];
    }
    const { catalogEntries, wovenProducts } = await getActiveCatalogListingsForMatching(db);

    const normalizedListings: NormalizedListing[] = [
        ...catalogEntries.map(normalizedListingFromCatalog),
        ...wovenProducts.map(normalizedListingFromWoven),
    ];
    const eligibleListings = request.requesterRole === "SUPPLIER"
        ? normalizedListings.filter((listing) => listing.supplierUserId !== request.buyerId)
        : normalizedListings;

    const scoredCandidates = eligibleListings
        .map((listing) => {
            const result = scoreListingMatch(listing, requirement);
            if (!result) {
                return null;
            }

            return {
                communicationRequestId: request.id,
                supplierId: listing.supplierId,
                sourceType: listing.sourceType,
                sourceId: listing.sourceId,
                status: "PENDING_ADMIN_REVIEW" as const,
                score: result.score,
                explanation: result.explanation,
                listingSnapshot: {
                    ...listing.raw,
                    supplierName: listing.supplierName,
                    composition: listing.composition,
                    weave: listing.weave,
                    gsm: listing.gsm,
                    width: listing.width,
                    moq: listing.moq,
                    leadTimeDays: listing.leadTimeDays,
                    pricePerMeter: listing.pricePerMeter,
                    listingType: listing.listingType,
                },
                routeMeta: {
                    deliveryState: requirement.deliveryState,
                    supplierCity: listing.supplierCity,
                    supplierState: listing.supplierState,
                },
            };
        })
        .filter((item): item is NonNullable<typeof item> => Boolean(item))
        .sort((a, b) => b.score - a.score);

    const scored = scoredCandidates.slice(0, 8);

    await db.communicationRequestMatch.createMany({ data: scored, skipDuplicates: true });

    return scored;
}



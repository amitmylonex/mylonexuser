import type { CreateRfqInput } from "./schema.js";
import { isFieldDisabled } from "../../config/field-visibility.js";

export function getComposition(data: CreateRfqInput) {
    if (data.materialType === "pure") {
        return `100% ${data.pureFiber}`;
    }

    return data.blendComposition ?? "";
}

export function getFabricName(data: CreateRfqInput) {
    if (data.fabricStructure === "woven" && data.customFabricName?.trim()) {
        return data.customFabricName.trim();
    }

    const composition = getComposition(data);
    return `${composition} ${data.weaveType}`;
}

export function getNominalGsm(data: CreateRfqInput) {
    return Math.round(data.gsm);
}

function buildWovenSpecSummary(data: Extract<CreateRfqInput, { fabricStructure: "woven" }>) {
    const parts = [
        `Structure: Woven (${data.weaveType})`,
        `GSM: ${data.gsm}`,
        `Width: ${data.width}`,
        ...(!isFieldDisabled("yarnType") && data.yarnType ? [`Yarn Type: ${data.yarnType}`] : []),
    ];

    if (data.countSystem) {
        parts.push(`Count System: ${data.countSystem === "custom" ? data.customCountUnit ?? "custom" : data.countSystem.toUpperCase()}`);
    }

    if (data.templateSpecs.length > 0) {
        const specSummary = data.templateSpecs
            .map((spec) => `${spec.specKey}=${spec.valueText ?? spec.valueNum ?? "-"}`)
            .join(", ");
        parts.push(`Technical Specs: ${specSummary}`);
    }

    if (data.additionalSpecs) {
        parts.push(`Additional Specs: ${data.additionalSpecs}`);
    }

    return parts.join(" | ");
}


function buildFabricStateSummary(data: CreateRfqInput) {
    const parts = [`Fabric State: ${data.fabricState}`];

    // Merge all color entries into a single display string
    const allColors = [
        ...(data.colorInfo?.trim() ? [data.colorInfo.trim()] : []),
        ...((data as Record<string, unknown>).colorInfoList as string[] ?? [])
            .map((c: string) => c.trim()).filter(Boolean),
    ];
    // Deduplicate (colorInfo duplicates colorInfoList[0])
    const uniqueColors = [...new Set(allColors)];
    if (uniqueColors.length > 0) {
        parts.push(`Color: ${uniqueColors.join(", ")}`);
    }

    if (!isFieldDisabled("dyeMethod") && data.dyeMethod) {
        parts.push(`Dye Method: ${data.dyeMethod}`);
    }

    if (data.printMethod) {
        parts.push(`Print Method: ${data.printMethod}`);
    }

    if (data.finishTags?.length) {
        parts.push(`Finishes: ${data.finishTags.join(", ")}`);
    }

    if (data.dyeColorType) {
        parts.push(`Dye Color Type: ${data.dyeColorType}`);
    }

    if (data.printBaseType) {
        parts.push(`Print Base: ${data.printBaseType.toUpperCase()}`);
    }

    parts.push(`End Use: ${data.endUse}`);

    return parts.join(" | ");
}

function buildPathSummary(data: CreateRfqInput) {
    if (data.selectedPath === "production") {
        const parts = [
            "Path: Production",
            `Quantity: ${data.quantity}m`,
            `Delivery Pincode: ${data.deliveryPincode}`,
            `Delivery City: ${data.deliveryCity}`,
            `Delivery State: ${data.deliveryState}`,
            `Delivery Country: ${data.deliveryCountry}`,
        ];

        if (data.targetPriceMin || data.targetPriceMax) {
            const min = data.targetPriceMin ?? "-";
            const max = data.targetPriceMax ?? "-";
            parts.push(`Target Price INR: ${min} - ${max}`);
        }

        if (data.requiredDeliveryDate) {
            parts.push(`Required Delivery Date: ${data.requiredDeliveryDate}`);
        }

        if (data.productionCycle) {
            parts.push(`Production Cycle: ${data.productionCycle}`);
        }

        if (data.deliveryAddress) {
            parts.push(`Street Address: ${data.deliveryAddress}`);
        }

        appendDeliveryRequirements(parts, data);

        return parts.join(" | ");
    }

    const parts = [
        "Path: Sampling",
        `Sample Type: ${data.sampleType}`,
        `Address: ${data.deliveryAddress}`,
        `City: ${data.sampleCity}`,
        `State: ${data.sampleState}`,
        `Country: ${data.sampleCountry}`,
        `Pincode: ${data.samplePincode}`,
    ];

    if (data.sampleType === "yardage") {
        parts.push(`Yardage Quantity: ${data.yardageQuantity ?? 5}m`);
    } else {
        parts.push("Swatch Quantity: 0.9m (free)");
    }

    if (data.contactPhone) {
        parts.push(`Contact Phone: ${data.contactPhone}`);
    }

    if (data.sampleNotes) {
        parts.push(`Notes: ${data.sampleNotes}`);
    }

    appendDeliveryRequirements(parts, data);

    return parts.join(" | ");
}

function appendDeliveryRequirements(parts: string[], data: CreateRfqInput) {
    if (data.certifications.length > 0) {
        parts.push(`Certifications: ${data.certifications.join(", ")}`);
    }

    parts.push(`Counter Sample: ${data.sendCounterSample ? "Yes" : "No"}`);

    if (data.deliveryNotes) {
        parts.push(`Delivery Notes: ${data.deliveryNotes}`);
    }
}

export function buildSpecSummary(data: CreateRfqInput) {
    const composition = getComposition(data);

    const sections = [
        `Composition: ${composition}`,
        data.fabricStructure === "woven" ? buildWovenSpecSummary(data) : "(unsupported structure)",
        buildFabricStateSummary(data),
        buildPathSummary(data),
    ];

    return sections.join("\n");
}

export function buildAnonymizedRequesterReference(requesterId: string, requesterRole: "BUYER" | "SUPPLIER") {
    const prefix = requesterRole === "SUPPLIER" ? "SUP" : "BUY";
    return `${prefix}-${requesterId.slice(0, 8).toUpperCase()}`;
}

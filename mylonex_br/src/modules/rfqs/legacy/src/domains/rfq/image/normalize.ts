import { imageDraftSchema, imageFieldSchemas, IMAGE_NUMBER_FIELDS, type ImageFieldKey } from "./fields.js";
import { imageExtractionSchema, visionResultSchema } from "./schema.js";

export function meters(value: string): number | undefined {
    const match = value.trim().match(/^(?:(?:quantity\s*[:=]?\s*)|(?:need\s+))?((?:\d+|\d{1,3}(?:,\d{3})+)(?:\.\d+)?)\s*(m|mtr|mtrs|meter|meters|metre|metres|yd|yds|yard|yards)$/i);
    if (!match) return undefined;
    const count = Number(match[1].replace(/,/g, ""));
    return count > 0 && Number.isFinite(count) ? count * (/^(yd|yard)/i.test(match[2]) ? 0.9144 : 1) : undefined;
}

function scalar(key: ImageFieldKey, value: string): unknown {
    if (key === "quantity" || key === "yardageQuantity") return meters(value);
    if (key === "width" && !/^\d+(?:\.\d+)?\s*(?:inches|inch|in|cm|mm|\")$/i.test(value)) return undefined;
    if (key === "targetPriceMin" || key === "targetPriceMax") {
        const match = value.match(/^(?:INR|Rs\.?|₹)\s*(\d+(?:\.\d+)?)\s*(?:\/|per)\s*(?:m|meter|metre)$/i)
            ?? value.match(/^(\d+(?:\.\d+)?)\s*(?:INR|Rs\.?|₹)\s*(?:\/|per)\s*(?:m|meter|metre)$/i);
        return match ? Number(match[1]) : undefined;
    }
    if (IMAGE_NUMBER_FIELDS.includes(key)) return Number(value.replace(/\s*gsm$/i, ""));
    return value;
}

/** Unknown, unclear and unitless values never become defaults in the inquiry. */
export function normalizeImageExtraction(input: unknown) {
    const source = visionResultSchema.parse(input);
    return imageExtractionSchema.parse({ ...source, requirements: source.requirements.map((requirement, index) => {
        const warnings = [...requirement.warnings];
        const draft: Record<string, unknown> = {};
        const seen = new Map<ImageFieldKey, string>();
        const blocked = new Set<ImageFieldKey>();
        for (const field of requirement.fields) {
            const value = field.value.trim();
            if (!value) continue;
            if (field.uncertain || (seen.has(field.key) && seen.get(field.key) !== value)) {
                blocked.add(field.key);
                warnings.push(`Unclear or conflicting ${field.key}: ${value}. Please enter the correct value.`);
            }
            seen.set(field.key, value);
            const result = imageFieldSchemas[field.key].safeParse(scalar(field.key, value));
            if (result.success) draft[field.key] = result.data;
            else warnings.push(`Review ${field.key}: “${value}” is unsupported or has ambiguous units; left blank.`);
        }
        for (const key of blocked) delete draft[key];
        const colors = requirement.colors;
        const acceptedColors = colors.filter(color => !color.uncertain);
        if (colors.some(color => color.uncertain)) warnings.push("Unclear colour text was left blank; check the original image.");
        if (acceptedColors.length) draft.colorInfoList = acceptedColors.map(color => `${color.color}${color.quantity ? ` (${color.quantity})` : ""}`);
        const quantities = acceptedColors.map(color => color.quantity ? meters(color.quantity) : undefined);
        if (acceptedColors.some((color, i) => color.quantity && quantities[i] === undefined)) warnings.push("Colour quantities have ambiguous units. Confirm each quantity in the review.");
        if (quantities.length && quantities.every((q): q is number => q !== undefined) && typeof draft.quantity === "number") {
            const total = quantities.reduce((sum, q) => sum + q, 0);
            if (Math.abs(total - draft.quantity) > 0.01) warnings.push(`Conflicting quantities: colour total ${total} meters; stated total ${draft.quantity} meters. Correct before submitting.`);
        }
        return { label: requirement.label || `Requirement ${index + 1}`, draft: imageDraftSchema.parse(draft), colors, warnings };
    }) });
}

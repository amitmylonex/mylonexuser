type WovenMaterialFamily = "cellulosic_cotton" | "cellulosic_bast" | "cellulosic_manmade" | "synthetic" | "wool_silk";

export type SpecValueType = "number" | "text";

export type WovenSpecDefinition = {
    key: string;
    label: string;
    valueType: SpecValueType;
    unit?: string;
    displayGroup: "Yarn" | "Density";
    isRequiredDefault?: boolean;
};

/**
 * Fixed set of 4 template specs used across all RFQ and woven listing forms.
 * Material-family-specific templates have been removed to simplify the form.
 */
export const WOVEN_SPEC_TEMPLATE: WovenSpecDefinition[] = [
    { key: "warp_count_ply", label: "Warp Count / Ply", valueType: "text", displayGroup: "Yarn", isRequiredDefault: true },
    { key: "weft_count_ply", label: "Weft Count / Ply", valueType: "text", displayGroup: "Yarn", isRequiredDefault: true },
    { key: "epi", label: "EPI", valueType: "number", displayGroup: "Density", isRequiredDefault: true },
    { key: "ppi", label: "PPI", valueType: "number", displayGroup: "Density", isRequiredDefault: true },
];

/**
 * Legacy per-family map kept for backward compatibility with WovenProduct DB writes.
 * All families now return the same 4 specs.
 */
export const WOVEN_SPEC_TEMPLATES: Record<WovenMaterialFamily, WovenSpecDefinition[]> = {
    cellulosic_cotton: WOVEN_SPEC_TEMPLATE,
    cellulosic_bast: WOVEN_SPEC_TEMPLATE,
    cellulosic_manmade: WOVEN_SPEC_TEMPLATE,
    synthetic: WOVEN_SPEC_TEMPLATE,
    wool_silk: WOVEN_SPEC_TEMPLATE,
};

/** Returns the fixed set of allowed spec keys (always the same 4). */
export function getTemplateSpecKeys(_materialFamily?: WovenMaterialFamily | string): string[] {
    return WOVEN_SPEC_TEMPLATE.map((spec) => spec.key);
}

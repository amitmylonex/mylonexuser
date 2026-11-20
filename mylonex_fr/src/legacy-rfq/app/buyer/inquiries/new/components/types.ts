import {
    BUYER_FABRIC_STATES,
    DYE_COLOR_TYPES,
    DYE_METHODS,
    MATERIAL_TYPES,
    PRINT_BASE_TYPES,
    PRINT_METHODS,
    PRODUCTION_CYCLES,
    PURE_FIBERS,
    RFQ_CERTIFICATIONS,
    SAMPLE_TYPES,
    SELECTED_PATHS,
    WOVEN_END_USES,
} from "../../../../../src/domains/rfq/constants";

import type { Evidence } from "../../../../../src/domains/rfq/text/types";

export type WovenTemplateSpecDraft = {
    specKey: string;
    valueNum?: number;
    valueText?: string;
    unit?: string;
    system?: string;
    isRequired?: boolean;
    displayGroup?: string;
    source?: string;
};

/** Count unit system for warp/weft count specifications */
export type CountSystem = "ne" | "denier" | "custom";

export type RfqDraft = {
    extractionEvidence?: Evidence[];
    // Always woven (knits removed)
    fabricStructure?: "woven";

    // Material step
    materialType?: typeof MATERIAL_TYPES[number];
    pureFiber?: typeof PURE_FIBERS[number];
    blendComposition?: string;

    // Woven specs step
    customFabricName?: string;
    gsm?: number;
    width?: string;
    yarnType?: string; // Previously "construction"
    weaveType?: string;
    additionalSpecs?: string;
    templateSpecs?: WovenTemplateSpecDraft[];

    // Count system — NE/Denier for pure, custom text for blends
    countSystem?: CountSystem;
    customCountUnit?: string;

    // Fabric state step
    fabricState?: typeof BUYER_FABRIC_STATES[number];
    colorInfo?: string;           // Legacy single color (kept for compat)
    colorInfoList?: string[];     // Multi-color entries for dyed/printed
    dyeMethod?: typeof DYE_METHODS[number];
    dyeColorType?: typeof DYE_COLOR_TYPES[number]; // vat/reactive — shown when piece_dyed
    printMethod?: typeof PRINT_METHODS[number];
    printBaseType?: typeof PRINT_BASE_TYPES[number]; // rfd/dyed — shown when printed
    finishing?: boolean;          // Whether finishing is requested (dyed/printed only)
    finishTags?: string[];

    endUse?: typeof WOVEN_END_USES[number];

    // Path step
    selectedPath?: typeof SELECTED_PATHS[number];

    // Production details
    quantity?: number;
    deliveryPincode?: string;
    deliveryCountry?: string;
    deliveryState?: string;
    deliveryCity?: string;
    targetPriceMin?: number;
    targetPriceMax?: number;
    requiredDeliveryDate?: string;
    productionCycle?: typeof PRODUCTION_CYCLES[number];
    contactPhone?: string;
    certifications?: typeof RFQ_CERTIFICATIONS[number][];
    sendCounterSample?: boolean;
    deliveryNotes?: string;

    // Sampling details
    sampleType?: typeof SAMPLE_TYPES[number];
    yardageQuantity?: number;
    deliveryAddress?: string;
    sampleCountry?: string;
    sampleState?: string;
    sampleCity?: string;
    samplePincode?: string;
    sampleNotes?: string;

    // Reference images (uploaded in step 5)
    referenceImageUrls?: string[];
};

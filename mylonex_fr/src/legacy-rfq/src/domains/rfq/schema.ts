import { z } from "zod";
import { isFieldDisabled } from "../../config/field-visibility";
import {
    BUYER_FABRIC_STATES,
    BUYER_PRINT_METHODS,
    COUNT_SYSTEMS,
    DYE_COLOR_TYPES,
    DYE_METHODS,
    FABRIC_STRUCTURES,
    FINISH_TAGS,
    MATERIAL_TYPES,
    PRINT_BASE_TYPES,
    PRINT_METHODS,
    PRODUCTION_CYCLES,
    PURE_FIBERS,
    RFQ_CERTIFICATIONS,
    SAMPLE_TYPES,
    SELECTED_PATHS,
    WOVEN_END_USES,
} from "./constants";
import { getTemplateSpecKeys } from "../catalog/templates";
import { evidenceSchema } from "./text/types";

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format");

export const contactPhoneSchema = z.string({ error: "Contact phone is required" }).trim().min(10, "Contact phone is required");

// Structure step removed — always woven now
export const structureStepSchema = z.object({
    fabricStructure: z.enum(FABRIC_STRUCTURES),
});

const optionalNonEmptyString = z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
    z.string().trim().min(1).optional()
);

export const materialStepSchema = z.object({
    materialType: z.enum(MATERIAL_TYPES, { error: "Material type is required" }),
    pureFiber: z.enum(PURE_FIBERS).optional(),
    blendComposition: optionalNonEmptyString,
}).superRefine((data, ctx) => {
    if (data.materialType === "pure" && !data.pureFiber) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["pureFiber"],
            message: "Pure fiber is required",
        });
    }

    if (data.materialType === "blend" && !data.blendComposition) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["blendComposition"],
            message: "Blend composition is required",
        });
    }
});

export const wovenSpecsStepSchema = z.object({
    extractionEvidence: z.array(evidenceSchema).max(2000).optional(),
    customFabricName: z.string().trim().optional(),
    gsm: z.number({ error: "GSM is required" }).positive("GSM must be positive"),
    width: z.string({ error: "Width is required" }).trim().min(1, "Width is required").regex(/\d/, "Width must include a numeric value"),
    yarnType: z.string().trim().optional(),
    weaveType: z.string({ error: "Weave type is required" }).trim().min(1, "Weave type is required")
        .max(200, "Weave must be 200 characters or fewer").regex(/^[^\u0000-\u001f\u007f]*$/, "Weave must not contain control characters"),
    additionalSpecs: z.string().trim().optional(),
    countSystem: z.enum(COUNT_SYSTEMS).optional(),
    customCountUnit: z.string().trim().optional(),
    templateSpecs: z.array(z.object({
        specKey: z.string().trim().min(1),
        valueNum: z.preprocess((v) => (v === "" || v === undefined ? undefined : v), z.coerce.number().optional()),
        valueText: z.preprocess(
            (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
            z.string().trim().optional()
        ),
        unit: z.preprocess(
            (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
            z.string().trim().optional()
        ),
        system: z.preprocess(
            (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
            z.string().trim().optional()
        ),
        isRequired: z.boolean().optional(),
        displayGroup: z.preprocess(
            (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
            z.string().trim().optional()
        ),
        source: z.preprocess(
            (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
            z.string().trim().optional()
        ),
    })).default([]),
}).superRefine((data, ctx) => {
    const allowed = new Set(getTemplateSpecKeys());
    for (const spec of data.templateSpecs) {
        if (!allowed.has(spec.specKey)) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ["templateSpecs"],
                message: `spec_key ${spec.specKey} is not allowed`,
            });
            break;
        }
        if (spec.valueNum === undefined && !spec.valueText) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ["templateSpecs"],
                message: `spec_key ${spec.specKey} requires valueNum or valueText`,
            });
            break;
        }
    }
});

const fabricStateBaseSchema = z.object({
    fabricState: z.enum(BUYER_FABRIC_STATES, { error: "Fabric state is required" }),
    colorInfo: z.string().trim().optional(),
    colorInfoList: z.array(z.string().trim()).optional(),
    dyeMethod: z.enum(DYE_METHODS).optional(),
    dyeColorType: z.enum(DYE_COLOR_TYPES).optional(),
    printMethod: z.enum(PRINT_METHODS).optional(),
    printBaseType: z.enum(PRINT_BASE_TYPES).optional(),
    finishing: z.boolean().optional(),
    finishTags: z.array(z.string()).optional(),
});

function validateFabricState(
    data: {
        fabricState: string;
        colorInfo?: string;
        colorInfoList?: string[];
        dyeMethod?: string;
        dyeColorType?: string;
        printMethod?: string;
        printBaseType?: string;
        finishing?: boolean;
        finishTags?: string[];
    },
    ctx: z.RefinementCtx
) {
    // Collect all color entries: legacy single + multi-color list
    const colorEntries = [
        ...(data.colorInfo?.trim() ? [data.colorInfo.trim()] : []),
        ...(data.colorInfoList?.map(c => c.trim()).filter(Boolean) ?? []),
    ];
    const hasColor = colorEntries.length > 0;

    if (data.fabricState === "dyed") {
        if (!hasColor) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ["colorInfo"],
                message: "At least one color is required for dyed fabrics",
            });
        }

        if (!isFieldDisabled("dyeMethod")) {
            if (!data.dyeMethod) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    path: ["dyeMethod"],
                    message: "Dye method is required for dyed fabrics",
                });
            }

            // Validate dye method is in buyer-allowed list (no dope_dyed)
            if (data.dyeMethod && !(BUYER_PRINT_METHODS as readonly string[]).includes(data.dyeMethod) && data.dyeMethod === "dope_dyed") {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    path: ["dyeMethod"],
                    message: "Dope dyed is not available for buyer RFQs",
                });
            }

            // Piece dyed requires dye color type (vat or reactive)
            if (data.dyeMethod === "piece_dyed" && !data.dyeColorType) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    path: ["dyeColorType"],
                    message: "Dye color type (vat/reactive) is required for piece dyed fabrics",
                });
            }
        }

        // Validate finish tags if finishing is selected
        if (data.finishing && data.finishTags) {
            for (const tag of data.finishTags) {
                if (!FINISH_TAGS.includes(tag as never)) {
                    ctx.addIssue({
                        code: z.ZodIssueCode.custom,
                        path: ["finishTags"],
                        message: `Invalid finish tag: ${tag}`,
                    });
                    break;
                }
            }
        }
    }

    if (data.fabricState === "printed") {
        if (!hasColor) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ["colorInfo"],
                message: "At least one color is required for printed fabrics",
            });
        }

        if (!data.printMethod) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ["printMethod"],
                message: "Print method is required for printed fabrics",
            });
        }

        // Validate print method is in buyer-allowed list (digital/rotary/reactive)
        if (data.printMethod && !(BUYER_PRINT_METHODS as readonly string[]).includes(data.printMethod)) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ["printMethod"],
                message: `Print method must be one of: ${BUYER_PRINT_METHODS.join(", ")}`,
            });
        }

        // Print base type (rfd/dyed) is required for printed fabrics
        if (!data.printBaseType) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ["printBaseType"],
                message: "Print base type (RFD/Dyed) is required for printed fabrics",
            });
        }

        // Validate finish tags if finishing is selected
        if (data.finishing && data.finishTags) {
            for (const tag of data.finishTags) {
                if (!FINISH_TAGS.includes(tag as never)) {
                    ctx.addIssue({
                        code: z.ZodIssueCode.custom,
                        path: ["finishTags"],
                        message: `Invalid finish tag: ${tag}`,
                    });
                    break;
                }
            }
        }
    }
}

export const wovenFabricStateStepSchema = fabricStateBaseSchema.merge(z.object({
    endUse: z.enum(WOVEN_END_USES, { error: "End use is required" }),
})).superRefine((data, ctx) => {
    validateFabricState(data, ctx);
});

export const pathStepSchema = z.object({
    selectedPath: z.enum(SELECTED_PATHS, { error: "Choose production or sampling" }),
});

const productionPathSchema = z.object({
    selectedPath: z.literal("production"),
});

const samplingPathSchema = z.object({
    selectedPath: z.literal("sampling"),
});

export const productionOrderStepSchema = z.object({
    quantity: z.number({ error: "Quantity is required" }).positive("Quantity must be positive"),
    targetPriceMin: z.number().positive("Target price min must be positive").optional(),
    targetPriceMax: z.number().positive("Target price max must be positive").optional(),
    requiredDeliveryDate: dateSchema.optional(),
    productionCycle: z.enum(PRODUCTION_CYCLES).optional(),
}).superRefine((data, ctx) => {
    if (data.targetPriceMin && data.targetPriceMax && data.targetPriceMax < data.targetPriceMin) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["targetPriceMax"],
            message: "Target price max must be greater than or equal to target price min",
        });
    }
});

const requestDeliveryMetadataSchema = z.object({
    certifications: z.array(z.enum(RFQ_CERTIFICATIONS)).default([]),
    sendCounterSample: z.boolean().default(false),
    deliveryNotes: z.string().trim().max(1000, "Notes must be 1000 characters or fewer").optional(),
});

export const productionDeliveryStepSchema = z.object({
    deliveryAddress: z.string().trim().max(500, "Street address must be 500 characters or fewer").optional(),
    deliveryPincode: z.string({ error: "Delivery pincode is required" }).trim().min(3, "Delivery pincode is required"),
    deliveryCountry: z.string({ error: "Delivery country is required" }).trim().min(1, "Delivery country is required"),
    deliveryState: z.string({ error: "Delivery state is required" }).trim().min(1, "Delivery state is required"),
    deliveryCity: z.string({ error: "Delivery city is required" }).trim().min(1, "Delivery city is required"),
    contactPhone: contactPhoneSchema,
}).and(requestDeliveryMetadataSchema);

export const productionDetailsStepSchema = productionOrderStepSchema.and(productionDeliveryStepSchema);

export const samplingOrderStepSchema = z.object({
    sampleType: z.enum(SAMPLE_TYPES, { error: "Sample type is required" }),
    yardageQuantity: z.number().positive("Yardage quantity must be positive").optional(),
}).superRefine((data, ctx) => {
    if (data.sampleType === "yardage" && !data.yardageQuantity) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["yardageQuantity"],
            message: "Yardage quantity is required for yardage samples",
        });
    }
});

export const samplingDeliveryStepSchema = z.object({
    deliveryAddress: z.string({ error: "Street address is required" }).trim().min(1, "Street address is required"),
    sampleCountry: z.string({ error: "Sample delivery country is required" }).trim().min(1, "Sample delivery country is required"),
    sampleState: z.string({ error: "Sample delivery state is required" }).trim().min(1, "Sample delivery state is required"),
    sampleCity: z.string({ error: "Sample delivery city is required" }).trim().min(1, "Sample delivery city is required"),
    samplePincode: z.string({ error: "Pincode is required" }).trim().min(3, "Pincode is required"),
    contactPhone: contactPhoneSchema,
    sampleNotes: z.string().trim().optional(),
}).and(requestDeliveryMetadataSchema);

export const samplingDetailsStepSchema = samplingOrderStepSchema.and(samplingDeliveryStepSchema);

// Woven-only base schema (knits removed from RFQ flow)
const wovenBaseSchema = z.object({
    fabricStructure: z.literal("woven"),
})
    .and(materialStepSchema)
    .and(wovenSpecsStepSchema)
    .and(wovenFabricStateStepSchema);

const wovenProductionSchema = wovenBaseSchema.and(productionPathSchema).and(productionDetailsStepSchema).superRefine((data, ctx) => {
    validateFabricState(data, ctx);
});

const wovenSamplingSchema = wovenBaseSchema.and(samplingPathSchema).and(samplingDetailsStepSchema).superRefine((data, ctx) => {
    validateFabricState(data, ctx);
});

// Only woven schemas — knits are no longer offered
export const createRfqSubmissionSchema = z.union([
    wovenProductionSchema,
    wovenSamplingSchema,
]);

const optionalReferenceImageUrls = z.array(z.string().url()).max(5, "Maximum 5 reference images allowed").optional();
const MAX_DATABASE_INTEGER = 2_147_483_647;
const optionalSelectedShadeIds = z.array(z.string().trim().min(1))
    .min(1, "Select at least one shade")
    .max(100, "A maximum of 100 shades can be selected")
    .refine((ids) => new Set(ids).size === ids.length, "Selected shades must be unique")
    .optional();

const createFabricQuickProductionSchema = z.object({
    selectedPath: z.literal("production"),
    fabricId: z.string().uuid(),
    quantity: z.number()
        .int("Quantity must be a whole number of meters")
        .positive("Quantity must be positive")
        .max(MAX_DATABASE_INTEGER, "Quantity is too large"),
    deliveryPincode: z.string().trim().min(3, "Delivery pincode is required"),
    deliveryCountry: z.string().trim().min(1).optional(),
    deliveryState: z.string().trim().min(1).optional(),
    deliveryCity: z.string().trim().min(1).optional(),
    contactPhone: contactPhoneSchema,
    targetPriceMin: z.number().positive("Target price min must be positive").optional(),
    targetPriceMax: z.number().positive("Target price max must be positive").optional(),
    requiredDeliveryDate: dateSchema.optional(),
    productionCycle: z.enum(PRODUCTION_CYCLES).optional(),
    buyerMessage: z.string().trim().max(500).optional(),
    referenceImageUrls: optionalReferenceImageUrls,
    selectedShadeIds: optionalSelectedShadeIds,
}).superRefine((data, ctx) => {
    if (data.targetPriceMin && data.targetPriceMax && data.targetPriceMax < data.targetPriceMin) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["targetPriceMax"],
            message: "Target price max must be greater than or equal to target price min",
        });
    }
});

const createFabricQuickSamplingSchema = z.object({
    selectedPath: z.literal("sampling"),
    fabricId: z.string().uuid(),
    sampleType: z.enum(SAMPLE_TYPES),
    yardageQuantity: z.number().positive("Yardage quantity must be positive").optional(),
    deliveryAddress: z.string().trim().min(1, "Street address is required"),
    sampleCountry: z.string().trim().min(1, "Sample delivery country is required"),
    sampleState: z.string().trim().min(1, "Sample delivery state is required"),
    sampleCity: z.string().trim().min(1, "Sample delivery city is required"),
    samplePincode: z.string().trim().min(3, "Pincode is required"),
    contactPhone: contactPhoneSchema,
    sampleNotes: z.string().trim().max(500).optional(),
    referenceImageUrls: optionalReferenceImageUrls,
    selectedShadeIds: optionalSelectedShadeIds,
}).superRefine((data, ctx) => {
    if (data.sampleType === "yardage" && !data.yardageQuantity) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["yardageQuantity"],
            message: "Yardage quantity is required for yardage samples",
        });
    }
});

export const createFabricQuickRequestSchema = z.discriminatedUnion("selectedPath", [
    createFabricQuickProductionSchema,
    createFabricQuickSamplingSchema,
]);

export const createFabricQuickRfqSchema = createFabricQuickRequestSchema;

export type CreateRfqInput = z.infer<typeof createRfqSubmissionSchema>;
export type CreateFabricQuickRequestInput = z.infer<typeof createFabricQuickRequestSchema>;
export type CreateFabricQuickRfqInput = CreateFabricQuickRequestInput;

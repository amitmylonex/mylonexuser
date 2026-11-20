import { z } from "zod";
import {
    BUYER_FABRIC_STATES, BUYER_DYED_DYE_METHODS, BUYER_PRINT_METHODS, DYE_COLOR_TYPES,
    MATERIAL_TYPES, PRINT_BASE_TYPES, PRODUCTION_CYCLES, PURE_FIBERS, SAMPLE_TYPES,
    SELECTED_PATHS, WEAVE_TYPES, WOVEN_END_USES,
} from "../constants.js";

const text = z.string().trim().min(1).max(500);
const number = z.number().finite().positive().max(2_147_483_647);

/** Only editable scalar fields already supported by the inquiry form. */
export const imageFieldSchemas = {
    customFabricName: text, materialType: z.enum(MATERIAL_TYPES), pureFiber: z.enum(PURE_FIBERS),
    blendComposition: text, gsm: number, width: text, weaveType: z.enum(WEAVE_TYPES), yarnType: text,
    additionalSpecs: text, fabricState: z.enum(BUYER_FABRIC_STATES), endUse: z.enum(WOVEN_END_USES),
    dyeMethod: z.enum(BUYER_DYED_DYE_METHODS), dyeColorType: z.enum(DYE_COLOR_TYPES),
    printMethod: z.enum(BUYER_PRINT_METHODS), printBaseType: z.enum(PRINT_BASE_TYPES),
    selectedPath: z.enum(SELECTED_PATHS), quantity: number, targetPriceMin: number, targetPriceMax: number,
    requiredDeliveryDate: z.iso.date(), productionCycle: z.enum(PRODUCTION_CYCLES),
    deliveryCountry: text, deliveryState: text, deliveryCity: text, deliveryPincode: text,
    deliveryAddress: text, contactPhone: text, deliveryNotes: z.string().trim().min(1).max(1000),
    sampleType: z.enum(SAMPLE_TYPES), yardageQuantity: number, sampleCountry: text,
    sampleState: text, sampleCity: text, samplePincode: text, sampleNotes: text,
};

export type ImageFieldKey = keyof typeof imageFieldSchemas;
export const IMAGE_FIELD_KEYS = Object.keys(imageFieldSchemas) as [ImageFieldKey, ...ImageFieldKey[]];
export const imageDraftSchema = z.object({ ...imageFieldSchemas,
    colorInfoList: z.array(text).max(50),
}).partial().strict();

export const IMAGE_FIELD_LABELS: Record<ImageFieldKey, string> = {
    customFabricName: "Fabric name", materialType: "Material type", pureFiber: "Pure fiber",
    blendComposition: "Blend composition", gsm: "GSM", width: "Width (include unit)", weaveType: "Weave",
    yarnType: "Yarn type", additionalSpecs: "Additional specifications", fabricState: "Fabric state",
    endUse: "End use", dyeMethod: "Dye method", dyeColorType: "Dye colour type", printMethod: "Print method",
    printBaseType: "Print base", selectedPath: "Request type", quantity: "Quantity (meters)",
    targetPriceMin: "Minimum price (INR/m)", targetPriceMax: "Maximum price (INR/m)",
    requiredDeliveryDate: "Delivery date", productionCycle: "Production cycle", deliveryCountry: "Country",
    deliveryState: "State", deliveryCity: "City", deliveryPincode: "Pincode", deliveryAddress: "Street address",
    contactPhone: "Contact phone", deliveryNotes: "Notes", sampleType: "Sample type",
    yardageQuantity: "Sample quantity (meters)", sampleCountry: "Sample country", sampleState: "Sample state",
    sampleCity: "Sample city", samplePincode: "Sample pincode", sampleNotes: "Sample notes",
};

export const IMAGE_NUMBER_FIELDS: ImageFieldKey[] = ["gsm", "quantity", "yardageQuantity", "targetPriceMin", "targetPriceMax"];

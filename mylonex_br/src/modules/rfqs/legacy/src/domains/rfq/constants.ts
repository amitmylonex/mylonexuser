export const FABRIC_STRUCTURES = ["woven", "knits"] as const;
export const MATERIAL_TYPES = ["pure", "blend"] as const;
export const PURE_FIBERS = [
    "Cotton",
    "Polyester",
    "Viscose",
    "Linen",
    "Silk",
    "Wool",
    "Nylon",
    "Tencel",
    "Modal",
    "Hemp",
] as const;

export const WEAVE_TYPES = [
    "Plain",
    "Twill",
    "Satin",
    "Dobby",
    "Jacquard",
    "Oxford",
    "Canvas",
    "Poplin",
    "Other",
] as const;

export const WOVEN_MATERIAL_FAMILIES = [
    "cellulosic_cotton",
    "cellulosic_bast",
    "cellulosic_manmade",
    "synthetic",
    "wool_silk",
] as const;

export const KNIT_BLEND_OPTIONS = [
    "100% Cotton",
    "PC",
    "100% Polyester",
    "Viscose",
    "Modal",
    "Tencel/Lyocell",
    "Cotton Lycra",
    "Poly Lycra",
    "Other",
] as const;

export const GSM_MODES = ["exact", "range"] as const;

export const KNIT_TYPES = [
    "Single Jersey",
    "Rib 1x1",
    "Rib 2x2",
    "Interlock",
    "Pique",
    "Fleece",
    "French Terry",
    "Lycra Jersey",
    "Jacquard Knit",
    "Spacer",
    "Other",
] as const;

export const FABRIC_FORMS = ["tubular", "open_width"] as const;
export const KNIT_GAUGES = ["18", "20", "24", "26", "28", "32", "any"] as const;

export const FABRIC_STATES = [
    "greige",
    "rfd",
    "dyed",
    "printed",
    "finished",
    "coated_laminated",
] as const;

/** Buyer-facing fabric states. Coated/laminated is outside the buyer RFQ. */
export const BUYER_FABRIC_STATES = [
    "greige",
    "rfd",
    "dyed",
    "printed",
    "finished",
] as const;

export const DYE_METHODS = ["yarn_dyed", "piece_dyed", "dope_dyed"] as const;

/** Dye methods shown for "dyed" fabric state (no dope_dyed) */
export const BUYER_DYED_DYE_METHODS = ["yarn_dyed", "piece_dyed"] as const;


/** Color type shown when dye method is piece_dyed */
export const DYE_COLOR_TYPES = ["vat", "reactive"] as const;

export const PRINT_METHODS = [
    "rotary",
    "flat_screen",
    "digital",
    "sublimation",
    "discharge",
    "block",
    "reactive",
] as const;

/** Buyer-facing print methods (digital, rotary, reactive only) */
export const BUYER_PRINT_METHODS = ["digital", "rotary", "reactive"] as const;

/** Base type option for printed fabrics */
export const PRINT_BASE_TYPES = ["rfd", "dyed"] as const;

export const COATING_TYPES = ["pu", "pvc", "acrylic", "silicone", "ptfe", "tpu", "other"] as const;

export const FINISH_TAGS = [
    "water_repellent",
    "flame_retardant",
    "uv_protection",
    "anti_microbial",
    "wrinkle_resistant",
    "peach_finish",
    "stentered",
    "calendered",
    "anti_static",
    "quick_dry",
] as const;

export const KNIT_FINISHES = [
    "compacted",
    "bio_washed",
    "silicone_softener",
    "enzyme_wash",
    "brushed",
    "sueded",
    "anti_pilling",
    "heat_set",
    "moisture_wicking",
] as const;

export const WOVEN_END_USES = [
    "Shirting",
    "Suiting",
    "Bottom Wear",
    "Uniform",
    "Home Textile",
    "Industrial",
    "Lining",
    "Other",
] as const;

export const KNIT_END_USES = [
    "T-Shirts",
    "Polo Shirts",
    "Hoodies/Sweatshirts",
    "Sportswear",
    "Innerwear",
    "Loungewear",
    "Other",
] as const;

export const SELECTED_PATHS = ["production", "sampling"] as const;
export const SAMPLE_TYPES = ["swatch", "yardage"] as const;
export const PRODUCTION_CYCLES = ["ready_stock", "running_production", "made_to_order"] as const;

/** Buyer-requested certifications reviewed during the existing admin approval flow. */
export const RFQ_CERTIFICATIONS = [
    "GOTS",
    "OEKO-TEX 100",
    "BCI",
    "GRS",
    "RCS",
    "OCS",
    "RegenAgri",
] as const;

/** Count measurement systems for warp/weft yarn count */
export const COUNT_SYSTEMS = ["ne", "denier", "custom"] as const;

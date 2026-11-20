export type BrowseMode = "fabric" | "collection";

export type ListingTypeKey = "all" | "ready_stock" | "running_production" | "made_to_order";

export const BROWSE_MODES: Array<{ key: BrowseMode; label: string; caption: string }> = [
    {
        key: "collection",
        label: "Collections",
        caption: "Curated sets of fabrics grouped by seasonal demand and application.",
    },
    {
        key: "fabric",
        label: "Fabrics",
        caption: "Individual fabrics with live specifications, MOQ, lead time, and pricing signals.",
    },
];

export const LISTING_TYPES: Array<{ key: ListingTypeKey; label: string }> = [
    { key: "all", label: "All" },
    { key: "ready_stock", label: "Ready Stock" },
    { key: "running_production", label: "Running Production" },
    { key: "made_to_order", label: "Made to Order" },
];

export const listingBadgeClasses: Record<string, string> = {
    ready_stock: "bg-[#dff8ed] text-[#047857]",
    running_production: "bg-[#e6eeff] text-[#2f5fe3]",
    made_to_order: "bg-[#ffedd5] text-[#c2410c]",
};

export function formatProductionCycle(value?: string | null) {
    if (!value) {
        return "Not specified";
    }

    return value.replace(/_/g, " ");
}

export function formatPricePerMeter(price: unknown) {
    if (price === null || price === undefined || price === "") {
        return null;
    }

    if (typeof price === "number") {
        return `INR ${price.toLocaleString("en-IN")} / m`;
    }

    if (typeof price === "string") {
        return `INR ${price} / m`;
    }

    if (typeof price === "object" && price && "toString" in price && typeof price.toString === "function") {
        const value = price.toString();
        return value ? `INR ${value} / m` : null;
    }

    return null;
}

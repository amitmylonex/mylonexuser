import type { CreateRfqInput } from "./schema.js";

export type AutoRoutedTo = "mill" | "dealer" | "manual_sourcing";

export type RoutingDecision = {
    autoRoutedTo: AutoRoutedTo;
    routingTargets: Array<"mill" | "dealer">;
    routingReason: string;
};

function inferStateFromPincode(pincode: string) {
    const prefix = pincode.trim().slice(0, 2);
    const stateByPrefix: Record<string, string> = {
        "11": "Delhi",
        "12": "Haryana",
        "20": "Uttar Pradesh",
        "30": "Rajasthan",
        "36": "Gujarat",
        "40": "Maharashtra",
        "50": "Telangana",
        "56": "Karnataka",
        "60": "Tamil Nadu",
        "67": "Kerala",
        "70": "West Bengal",
        "75": "Odisha",
        "80": "Bihar",
    };
    return stateByPrefix[prefix] ?? null;
}

type RoutingInput = Pick<Extract<CreateRfqInput, { selectedPath: "production" }>, "deliveryPincode" | "productionCycle" | "quantity">;

export function determineRouting(data: RoutingInput): RoutingDecision {
    const inferredState = inferStateFromPincode(data.deliveryPincode);
    const stateSuffix = inferredState ? `; delivery state inferred as ${inferredState}` : "; delivery state unavailable from pincode";

    if (data.productionCycle === "ready_stock") {
        return {
            autoRoutedTo: "manual_sourcing",
            routingTargets: ["mill", "dealer"],
            routingReason: `ready_stock requests are routed to both mill and dealer pools${stateSuffix}`,
        };
    }

    if (data.productionCycle === "made_to_order" || data.productionCycle === "running_production") {
        return {
            autoRoutedTo: "mill",
            routingTargets: ["mill"],
            routingReason: `production cycle ${data.productionCycle} is mill-first${stateSuffix}`,
        };
    }

    if (data.quantity >= 1000) {
        return {
            autoRoutedTo: "mill",
            routingTargets: ["mill"],
            routingReason: `quantity >= 1000 meters routes to mill${stateSuffix}`,
        };
    }

    return {
        autoRoutedTo: "dealer",
        routingTargets: ["dealer"],
        routingReason: `quantity < 1000 meters routes to dealer${stateSuffix}`,
    };
}

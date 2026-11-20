import { z } from "zod";

const storedShadeSchema = z.object({
    id: z.string().trim().min(1),
    name: z.string().trim().min(1),
    colorHex: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
    millCode: z.string().trim().min(1).optional(),
    imageUrl: z.string().url().optional(),
});

export type SelectedFabricShade = z.infer<typeof storedShadeSchema>;

export function parseStoredFabricShades(value: unknown): SelectedFabricShade[] {
    if (!Array.isArray(value)) return [];

    const parsed: SelectedFabricShade[] = [];
    const seenIds = new Set<string>();
    for (const candidate of value) {
        const result = storedShadeSchema.safeParse(candidate);
        if (result.success && !seenIds.has(result.data.id)) {
            parsed.push(result.data);
            seenIds.add(result.data.id);
        }
    }
    return parsed;
}

export function resolveSelectedFabricShades(
    storedValue: unknown,
    selectedShadeIds: string[] | undefined,
): SelectedFabricShade[] {
    const availableShades = parseStoredFabricShades(storedValue);

    if (availableShades.length === 0) {
        if (selectedShadeIds?.length) {
            throw new Error("VALIDATION_ERROR: selectedShadeIds: This fabric has no selectable shades");
        }
        return [];
    }

    if (!selectedShadeIds?.length) {
        throw new Error("VALIDATION_ERROR: selectedShadeIds: Select at least one shade");
    }

    const shadesById = new Map(availableShades.map((shade) => [shade.id, shade]));
    const selected = selectedShadeIds.map((id) => shadesById.get(id));

    if (selected.some((shade) => !shade)) {
        throw new Error("VALIDATION_ERROR: selectedShadeIds: One or more selected shades are unavailable");
    }

    return selected as SelectedFabricShade[];
}

export function toSelectedShadeSnapshot(shades: SelectedFabricShade[]) {
    return shades.map((shade) => ({
        id: shade.id,
        name: shade.name,
        colorHex: shade.colorHex ?? null,
        millCode: shade.millCode ?? null,
        imageUrl: shade.imageUrl ?? null,
    }));
}

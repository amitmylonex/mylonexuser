export const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const MAX_IMAGE_PIXELS = 16_000_000;
export const MAX_IMAGE_DIMENSION = 8192;
export const EXTRACTION_TIMEOUT_MS = 45_000;

export function imageFileError(file: { type: string; size: number }): string | null {
    if (!(IMAGE_TYPES as readonly string[]).includes(file.type)) return "Choose one JPG, PNG, or WebP image.";
    if (file.size <= 0 || file.size > MAX_IMAGE_BYTES) return "Image must be between 1 byte and 5 MB.";
    return null;
}

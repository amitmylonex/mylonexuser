import sharp from "sharp";
import { z } from "zod";
import { imageFileError, MAX_IMAGE_BYTES, MAX_IMAGE_DIMENSION, MAX_IMAGE_PIXELS } from "./limits.js";
import { ImageImportError } from "./errors.js";

export const imageUploadSchema = z.object({
    type: z.enum(["image/jpeg", "image/png", "image/webp"]),
    bytes: z.custom<Uint8Array>(value => value instanceof Uint8Array).refine(bytes => bytes.length > 0 && bytes.length <= MAX_IMAGE_BYTES),
}).strict();
export type ImageUpload = z.infer<typeof imageUploadSchema>;

/** Full decode rejects forged MIME types, truncated data, animation and decompression bombs. */
export async function validateImage(input: ImageUpload) {
    const upload = imageUploadSchema.parse(input);
    const invalid = () => new ImageImportError("VALIDATION_ERROR", "Invalid image. Use a readable, static JPG, PNG, or WebP up to 5 MB, 8192px per side and 16 megapixels.", 400);
    if (imageFileError({ type: upload.type, size: upload.bytes.length })) throw invalid();
    try {
        const decoder = sharp(upload.bytes, { limitInputPixels: MAX_IMAGE_PIXELS, failOn: "warning", animated: true });
        const metadata = await decoder.metadata();
        const format = { "image/jpeg": "jpeg", "image/png": "png", "image/webp": "webp" }[upload.type];
        if (metadata.format !== format || !metadata.width || !metadata.height || (metadata.pages ?? 1) > 1
            || metadata.width > MAX_IMAGE_DIMENSION || metadata.height > MAX_IMAGE_DIMENSION) throw invalid();
        // Re-encoding validates pixels and strips EXIF/GPS and other metadata before external transfer.
        const buffer = await decoder.rotate().resize({ width: 2400, height: 2400, fit: "inside", withoutEnlargement: true })
            .timeout({ seconds: 5 }).png().toBuffer();
        return { bytes: buffer, type: "image/png" as const };
    } catch {
        throw invalid();
    }
}

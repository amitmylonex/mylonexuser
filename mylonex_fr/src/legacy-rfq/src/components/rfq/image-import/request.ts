import { builderFetch } from '../../../../adapters/http'
import { imageExtractionSchema } from "../../../domains/rfq/image/schema";

/** Only the existing same-origin endpoint receives image bytes. Never expose transport/provider details. */
export async function requestImageExtraction(endpoint: string, file: File, signal: AbortSignal, transcriptionOnly = false) {
    if (endpoint !== "/api/buyer/inquiries/extract-image") throw new Error("Image extraction is unavailable on this page. Reload and try again.");
    const body = new FormData();
    body.append("image", file); body.append("consent", "openai-image-extraction");
    if (transcriptionOnly) body.append("mode", "transcribe");
    let response: Response;
    try {
        response = await builderFetch(endpoint, { method: "POST", body, signal, credentials: "same-origin" });
    } catch {
        throw new Error(signal.aborted ? "Image extraction timed out. Try again or fill the form manually."
            : "Could not reach image extraction. Check your connection and try again. If running locally, make sure the MyloNex server is running. Your inquiry draft is unchanged.");
    }
    if (response.redirected || response.status === 401) throw new Error("Your session may have expired. Sign in again, then retry image extraction.");
    if (!response.headers.get("content-type")?.includes("application/json")) {
        throw new Error(response.status === 404 ? "The image extraction route is unavailable. Reload and try again."
            : "The server returned an unexpected response. Retry image extraction or fill the form manually.");
    }
    let json;
    try { json = await response.json(); }
    catch { throw new Error("The extraction response could not be read. Try again or fill the form manually."); }
    if (!response.ok || json?.ok !== true) {
        // API messages are controlled server-side; do not render arbitrary HTML or network errors.
        const message = json?.error?.message;
        throw new Error(typeof message === "string" && message.length <= 500 ? message : "Image extraction failed. Try again or fill the form manually.");
    }
    const parsed = imageExtractionSchema.safeParse(json.data);
    if (!parsed.success) throw new Error("The extraction response could not be validated. Try again or fill the form manually.");
    return parsed.data;
}

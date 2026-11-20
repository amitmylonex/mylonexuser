"use client";

import { useEffect, useRef, useState } from "react";
import { type ImageExtraction } from "../../../domains/rfq/image/schema";
import { EXTRACTION_TIMEOUT_MS, imageFileError, MAX_IMAGE_DIMENSION, MAX_IMAGE_PIXELS } from "../../../domains/rfq/image/limits";
import { requestImageExtraction } from "./request";

export function useImageExtraction(endpoint: string, transcriptionOnly = false) {
    const generation = useRef(0);
    const request = useRef<AbortController | null>(null);
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState("");
    const [analysis, setAnalysis] = useState<ImageExtraction | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);

    useEffect(() => () => { generation.current++; request.current?.abort(); }, []);
    useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

    function cancel() {
        generation.current++;
        request.current?.abort();
        request.current = null;
        setBusy(false);
    }

    async function select(nextFile: File | null) {
        cancel();
        const current = generation.current;
        setFile(null); setAnalysis(null); setError(null); setPreview("");
        if (!nextFile) return;
        const problem = imageFileError(nextFile);
        if (problem) { setError(problem); return; }
        try {
            const bitmap = await createImageBitmap(nextFile);
            const invalid = bitmap.width > MAX_IMAGE_DIMENSION || bitmap.height > MAX_IMAGE_DIMENSION || bitmap.width * bitmap.height > MAX_IMAGE_PIXELS;
            bitmap.close();
            if (current !== generation.current) return;
            if (invalid) { setError("Image must be at most 8192px per side and 16 megapixels."); return; }
            setFile(nextFile); setPreview(URL.createObjectURL(nextFile));
        } catch {
            if (current === generation.current) setError("This image cannot be read. Choose a valid JPG, PNG or WebP, or fill the form manually.");
        }
    }

    async function extract() {
        if (!file || busy) return;
        cancel();
        const current = generation.current;
        const controller = new AbortController();
        request.current = controller;
        setBusy(true); setError(null); setAnalysis(null);
        const timer = setTimeout(() => controller.abort(), EXTRACTION_TIMEOUT_MS + 15_000);
        try {
            const data = await requestImageExtraction(endpoint, file, controller.signal, transcriptionOnly);
            if (current !== generation.current) return;
            setAnalysis(data);
        } catch (caught) {
            if (current === generation.current) setError(controller.signal.aborted ? "Image extraction timed out. Try again or fill the form manually." : caught instanceof Error ? caught.message : "Image extraction failed. Fill the form manually.");
        } finally {
            clearTimeout(timer);
            if (current === generation.current) { setBusy(false); request.current = null; }
        }
    }

    return { file, preview, analysis, error, busy, select, extract, cancel, setAnalysis };
}

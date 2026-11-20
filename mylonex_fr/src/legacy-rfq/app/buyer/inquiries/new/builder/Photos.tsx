import { builderFetch } from '../../../../../adapters/http'
"use client";
import { useRef, useState } from "react";
import Image from "../../../../../adapters/SiteImage";
import styles from "./styles";

export function PhotoUpload({
  urls,
  onChange,
  onBusy,
  swatch,
  onSwatch,
}: {
  urls: string[];
  onChange: (_urls: string[]) => void;
  onBusy: (_busy: boolean) => void;
  swatch?: boolean;
  onSwatch?: (_url: string) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  async function upload(files: FileList | null) {
    if (!files?.length) return;
    const selected = Array.from(files);
    if (selected.length + urls.length > 5) {
      setError("Use up to five photos per line, including swatches.");
      return;
    }
    if (
      selected.some((file) => !["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 5 * 1024 * 1024 || !file.size)
    ) {
      setError("Choose JPG, PNG or WebP photos, up to 5 MB each.");
      return;
    }
    setError("");
    setUploading(true);
    onBusy(true);
    try {
      const data = new FormData();
      selected.forEach((file) => data.append("files", file));
      // Reference storage only. Never invokes image extraction or the image-to-RFQ workflow.
      const response = await builderFetch("/api/buyer/inquiries/upload", { method: "POST", body: data });
      const json = await response.json();
      if (!response.ok || !Array.isArray(json.data?.urls) || !json.data.urls.length)
        throw new Error(json.error?.message || "The photo upload could not be confirmed. Try again.");
      onChange([...urls, ...json.data.urls]);
      if (swatch) onSwatch?.(json.data.urls[0]);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Could not upload the photos.");
    } finally {
      setUploading(false);
      onBusy(false);
      if (input.current) input.current.value = "";
    }
  }
  return (
    <div>
      <input
        ref={input}
        className={styles.fileInput}
        aria-label={swatch ? "Upload colour swatch photo" : "Upload reference photos"}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple={!swatch}
        onChange={(event) => void upload(event.target.files)}
      />
      <button type="button" className={styles.dashedButton} disabled={uploading || urls.length >= 5} onClick={() => input.current?.click()}>
        {uploading ? "Uploading…" : swatch ? "+ Add swatch photo" : "+ Add photos"}
      </button>
      {error && (
        <p role="alert" className={styles.errorText}>
          {error}
        </p>
      )}
    </div>
  );
}
export function PhotoGallery({ urls, onRemove }: { urls: string[]; onRemove: (_url: string) => void }) {
  return (
    <div className={styles.photos}>
      {urls.map((url, index) => (
        <div key={url}>
          <Image unoptimized src={url} width={64} height={64} alt={`Reference ${index + 1}`} />
          <button type="button" aria-label={`Remove reference ${index + 1}`} onClick={() => onRemove(url)}>
            ×
          </button>
        </div>
      ))}
    </div>
  );
}

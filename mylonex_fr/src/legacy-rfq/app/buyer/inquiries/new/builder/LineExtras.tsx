import {
  WOVEN_END_USES,
  BUYER_DYED_DYE_METHODS,
  DYE_COLOR_TYPES,
  BUYER_PRINT_METHODS,
  PRINT_BASE_TYPES,
} from "../../../../../src/domains/rfq/constants";
import { isFieldDisabled } from "../../../../../src/config/field-visibility";
import type { RfqLine } from "./draft";
import { Field, Select } from "./Fields";
import Colours from "./Colours";
import { PhotoGallery, PhotoUpload } from "./Photos";
import CounterSample from "./CounterSample";
import styles from "./styles";

export default function LineExtras({
  line,
  onChange,
  onBusy,
  lineNumber,
}: {
  line: RfqLine;
  onChange: (_line: RfqLine) => void;
  onBusy: (_busy: boolean) => void;
  lineNumber: number;
}) {
  const d = line.draft;
  const patch = (draft: Partial<RfqLine["draft"]>) => onChange({ ...line, draft: { ...d, ...draft } });
  return (
    <div className={styles.extras}>
      {<Colours line={line} onChange={onChange} onBusy={onBusy} />}
      {((!isFieldDisabled("dyeMethod") && d.fabricState === "dyed") || d.fabricState === "printed") && (
        <section className={styles.section}>
          <h3>
            Processing details <span>· required by the existing inquiry workflow</span>
          </h3>
          <div className={styles.twoColumns}>
            {d.fabricState === "dyed" ? (
              <>
                {!isFieldDisabled("dyeMethod") && (
                  <Select
                    label="Dye method"
                    value={d.dyeMethod}
                    options={BUYER_DYED_DYE_METHODS}
                    onChange={(value) => patch({ dyeMethod: (value as typeof d.dyeMethod) || undefined })}
                  />
                )}
                {!isFieldDisabled("dyeMethod") && d.dyeMethod === "piece_dyed" && (
                  <Select
                    label="Dye type"
                    value={d.dyeColorType}
                    options={DYE_COLOR_TYPES}
                    onChange={(value) => patch({ dyeColorType: (value as typeof d.dyeColorType) || undefined })}
                  />
                )}
              </>
            ) : (
              <>
                <Select
                  label="Print method"
                  value={d.printMethod}
                  options={BUYER_PRINT_METHODS}
                  onChange={(value) => patch({ printMethod: (value as typeof d.printMethod) || undefined })}
                />
                <Select
                  label="Print base"
                  value={d.printBaseType}
                  options={PRINT_BASE_TYPES}
                  onChange={(value) => patch({ printBaseType: (value as typeof d.printBaseType) || undefined })}
                />
              </>
            )}
          </div>
        </section>
      )}
      <section className={styles.section}>
        <h3>
          Technical details <span>· optional, captured for mills</span>
        </h3>
        <div className={styles.technicalGrid}>
          <Field label="Count · warp × weft">
            <input
              value={line.count}
              placeholder="20s × 16s + 70D"
              onChange={(event) => onChange({ ...line, count: event.target.value })}
            />
          </Field>
          <Field label="Construction · EPI × PPI">
            <input
              value={line.construction}
              placeholder="108 × 56"
              onChange={(event) => onChange({ ...line, construction: event.target.value })}
            />
          </Field>
          <Field label="Finish">
            <input
              value={line.finish}
              placeholder="e.g. Peach finish"
              onChange={(event) => onChange({ ...line, finish: event.target.value, finishConfirmed: true })}
            />
          </Field>
          {!isFieldDisabled("yarnType") && (
            <Field label="Yarn type">
              <input
                value={d.yarnType || ""}
                placeholder="Combed compact, open-end, filament"
                onChange={(event) => patch({ yarnType: event.target.value || undefined })}
              />
            </Field>
          )}
          {!isFieldDisabled("weaveDetail") && (
            <Field label="Weave detail">
              <input
                value={line.weaveDetail}
                placeholder="e.g. 2/1 twill, ripstop detail"
                onChange={(event) => onChange({ ...line, weaveDetail: event.target.value })}
              />
            </Field>
          )}
        </div>
        <p className={styles.hint}>
          Sent as given. Count and EPI/PPI map to the existing technical specs when unambiguous; other text is retained in additional
          specifications.
        </p>
      </section>
      <section className={styles.section}>
        <h3>
          Target delivery <span>· optional</span>
        </h3>
        <Field label="Deliver by">
          <input
            type="date"
            value={d.requiredDeliveryDate || ""}
            onChange={(event) => patch({ requiredDeliveryDate: event.target.value || undefined })}
          />
        </Field>
      </section>
      <details className={styles.moreDetails} open={!d.endUse}>
        <summary>
          More details <span>End use required · target price and fabric name optional</span>
        </summary>
        <div className={styles.twoColumns}>
          <Select
            label="End use"
            value={d.endUse}
            options={WOVEN_END_USES}
            onChange={(value) => patch({ endUse: (value as typeof d.endUse) || undefined })}
          />
          <Field
            label={
              line.targetPriceCurrencyUnresolved
                ? `Target price · ${line.targetPriceCurrencySymbol || "$"}`
                : line.targetPriceCurrency && line.targetPriceCurrency !== "INR"
                ? `Target price · ${line.targetPriceCurrency}/${line.targetPriceBasis === "per_metre" ? "m" : line.targetPriceBasis || "unit"}`
                : line.targetPriceBasis === "unspecified"
                ? "Target price (basis unconfirmed)"
                : line.targetPriceBasis === "per_kg"
                ? "Target price · ₹/kg"
                : "Target price · ₹/m"
            }
            hint={
              line.targetPriceCurrencyUnresolved
                ? "Confirm currency ($ alone does not establish USD)."
                : line.targetPriceCurrency && line.targetPriceCurrency !== "INR"
                ? `Stated in ${line.targetPriceCurrency}. Conversion to ₹/m is not automatic.`
                : line.targetPriceBasis === "unspecified"
                ? (line.targetPriceQualifier || "Confirm price basis (e.g. per metre ₹/m).")
                : (line.targetPriceQualifier || (d.targetPriceMax ? `Target: ₹${d.targetPriceMax}/m` : undefined))
            }
          >
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={line.targetPriceAmount ?? d.targetPriceMax ?? ""}
              aria-label={
                line.targetPriceBasis === "unspecified"
                  ? "Target price"
                  : line.targetPriceCurrency && line.targetPriceCurrency !== "INR"
                  ? `Target price · ${line.targetPriceCurrency}`
                  : "Target price · ₹/m"
              }
              placeholder="e.g. 285"
              onChange={(event) => {
                const val = event.target.value ? Number(event.target.value) : undefined;
                if (!val) {
                  onChange({
                    ...line,
                    targetPriceAmount: undefined,
                    targetPriceQualifier: undefined,
                    targetPriceConfirmed: true,
                    draft: { ...d, targetPriceMax: undefined },
                  });
                } else if (line.targetPriceBasis === "per_metre" && (!line.targetPriceCurrency || line.targetPriceCurrency === "INR")) {
                  onChange({
                    ...line,
                    targetPriceAmount: val,
                    targetPriceConfirmed: true,
                    draft: { ...d, targetPriceMax: val },
                  });
                } else {
                  onChange({
                    ...line,
                    targetPriceAmount: val,
                    targetPriceConfirmed: true,
                  });
                }
              }}
            />
            {((line.targetPriceBasis === "unspecified" || line.targetPriceCurrencyUnresolved || (line.targetPriceCurrency && line.targetPriceCurrency !== "INR")) && (line.targetPriceAmount || d.targetPriceMax)) && (
              <div style={{ marginTop: "6px", display: "flex", flexWrap: "wrap", gap: "8px", alignItems: "center" }}>
                <span style={{ fontSize: "0.75rem", color: "#2563eb", fontWeight: 500 }}>
                  {line.targetPriceQualifier || (line.targetPriceCurrencyUnresolved ? "Confirm currency" : "Confirm price basis")}
                </span>
                {line.targetPriceBasis === "unspecified" && (
                  <button
                    type="button"
                    className={styles.textButton}
                    onClick={() => {
                      const amt = line.targetPriceAmount ?? d.targetPriceMax;
                      onChange({
                        ...line,
                        targetPriceAmount: amt,
                        targetPriceBasis: "per_metre",
                        targetPriceCurrency: "INR",
                        targetPriceCurrencyUnresolved: false,
                        targetPriceQualifier: line.targetPriceIndicative ? `Indicative target: ₹${amt}/m` : `Target: ₹${amt}/m`,
                        targetPriceConfirmed: true,
                        draft: { ...d, targetPriceMax: amt },
                      });
                    }}
                    style={{ fontSize: "0.75rem", padding: "2px 8px", backgroundColor: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: "4px" }}
                  >
                    Confirm as ₹/m
                  </button>
                )}
                {line.targetPriceCurrencyUnresolved && (
                  <button
                    type="button"
                    className={styles.textButton}
                    onClick={() => {
                      onChange({
                        ...line,
                        targetPriceCurrency: "USD",
                        targetPriceCurrencyUnresolved: false,
                        targetPriceConfirmed: true,
                      });
                    }}
                    style={{ fontSize: "0.75rem", padding: "2px 8px", backgroundColor: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: "4px" }}
                  >
                    Confirm as USD
                  </button>
                )}
                <button
                  type="button"
                  className={styles.textButton}
                  onClick={() => {
                    onChange({
                      ...line,
                      targetPriceAmount: undefined,
                      targetPriceQualifier: undefined,
                      targetPriceConfirmed: true,
                      draft: { ...d, targetPriceMax: undefined },
                    });
                  }}
                  style={{ fontSize: "0.75rem", color: "#64748b" }}
                >
                  Clear price
                </button>
              </div>
            )}
          </Field>
          <Field label="Your fabric name">
            <input value={d.customFabricName || ""} onChange={(event) => patch({ customFabricName: event.target.value || undefined })} />
          </Field>
        </div>
      </details>
      <section className={styles.section}>
        <h3>
          References <span>· optional</span>
        </h3>
        <div className={styles.twoColumns}>
          <div className={styles.referenceBox}>
            <p className={styles.fieldLabel}>
              Photos <span>{(d.referenceImageUrls ?? []).length} / 5</span>
            </p>
            <p className={styles.hint}>Swatch, colour reference or sketch. JPG, PNG or WebP, up to 5 MB each.</p>
            <PhotoUpload urls={d.referenceImageUrls ?? []} onChange={(urls) => patch({ referenceImageUrls: urls })} onBusy={onBusy} />
            <PhotoGallery
              urls={d.referenceImageUrls ?? []}
              onRemove={(url) =>
                onChange({
                  ...line,
                  draft: { ...d, referenceImageUrls: (d.referenceImageUrls ?? []).filter((item) => item !== url) },
                  colours: line.colours.map((colour) => (colour.swatchUrl === url ? { ...colour, swatchUrl: undefined } : colour)),
                })
              }
            />
          </div>
          <CounterSample line={line} lineNumber={lineNumber} onChange={onChange} />
        </div>
      </section>
      <Field label="Notes for this line · optional">
        <textarea
          maxLength={1000}
          rows={3}
          value={d.deliveryNotes || ""}
          placeholder="e.g. Soft hand feel, low shrinkage in the trial lot."
          onChange={(event) => patch({ deliveryNotes: event.target.value || undefined })}
        />
      </Field>
      {line.original && (
        <details className={styles.original}>
          <summary>Original imported description · retained with the inquiry</summary>
          <p>{line.original}</p>
          {d.additionalSpecs && (
            <div style={{ marginTop: "8px", fontSize: "0.8125rem", color: "var(--rfq-ink)" }}>
              <strong>Retained sourcing specifications:</strong>
              <p style={{ whiteSpace: "pre-wrap", marginTop: "4px" }}>{d.additionalSpecs}</p>
            </div>
          )}
          {!!line.sourceEvidence?.length && <ul aria-label="Source phrases for extracted fields">{line.sourceEvidence.map((item, index) =>
            <li key={index}><strong>{item.field} ({item.kind || "explicit"}):</strong> {item.text}{item.reason ? ` — ${item.reason}` : ""}</li>
          )}</ul>}
        </details>
      )}
    </div>
  );
}

import { builderFetch } from '../../../../../adapters/http'
"use client";
import { useEffect, useRef, useState } from "react";
import { z } from "zod";
import { batchResultSchema, batchSubmissionSchema } from "../../../../../src/domains/rfq/batch/schema";
import { EMPTY_DESTINATION, buildBatch, newLine, type RfqLine, type Destination } from "./draft";
import { blendState, initializeBlend } from "./blend-state";
import { fibreRowSchema } from "../../../../../src/domains/rfq/blend/rows";
import { weaveDetectionSchema } from "../../../../../src/domains/rfq/weave/vocabulary";
import { evidenceSchema } from "../../../../../src/domains/rfq/text/types";
import { textCandidateSchema } from "../../../../../src/domains/rfq/text/proposals";
import { referenceReviewIssues } from "./reference-review";

const draftSchema = z.object({
  fabricStructure: z.literal("woven").optional(),
  selectedPath: z.literal("production").optional(),
  gsm: z.number().optional(),
  width: z.string().optional(),
  quantity: z.number().optional(),
  weaveType: z.string().optional(),
  fabricState: z.string().optional(),
  productionCycle: z.string().optional(),
  customFabricName: z.string().optional(),
  endUse: z.string().optional(),
  dyeMethod: z.string().optional(),
  dyeColorType: z.string().optional(),
  printMethod: z.string().optional(),
  printBaseType: z.string().optional(),
  yarnType: z.string().optional(),
  additionalSpecs: z.string().optional(),
  requiredDeliveryDate: z.string().optional(),
  targetPriceMin: z.number().optional(),
  targetPriceMax: z.number().optional(),
  deliveryNotes: z.string().optional(),
  sendCounterSample: z.boolean().optional(),
  referenceImageUrls: z.array(z.string()).optional(),
  templateSpecs: z.array(z.object({ specKey: z.string(), valueText: z.string().optional(), valueNum: z.number().optional() })).optional(),
});
const savedSchema = z.object({
  lines: z
    .array(
      z.object({
        id: z.string().uuid(),
        plainTextSource: z.boolean().optional(),
        textExtractionMode: z.enum(["ai-assisted", "deterministic"]).optional(),
        textCandidates: z.array(textCandidateSchema).max(500).optional(),
        voiceSourceId: z.string().uuid().optional(),
        weaveDetection: weaveDetectionSchema.optional(),
        sourceEvidence: z.array(evidenceSchema).optional(),
        compositionUncertain: z.boolean().optional(),
        blend: z.string(),
        blendRows: z.array(fibreRowSchema).optional(),
        blendLegacyText: z.string().optional(),
        draft: draftSchema,
        fabricStateInferred: z.boolean().optional(),
        colours: z.array(
          z.object({
            id: z.string(),
            name: z.string(),
            metres: z.string(),
            swatchUrl: z.string().optional(),
            sourceText: z.string().optional(),
          })
        ),
        unsureColours: z.boolean(),
        count: z.string(),
        construction: z.string(),
        finish: z.string(),
        weaveDetail: z.string(),
        weaveAlternatives: z.array(z.string()).optional(),
        weaveExclusions: z.array(z.string()).optional(),
        weaveNotes: z.array(z.string()).optional(),
        warnings: z.array(z.string()),
        original: z.string(),
        counterSamplePreference: z.enum(["exact", "closest"]).optional(),
        counterSampleCourier: z.string().max(200).optional(),
        sourcingAlternatives: z
          .array(
            z.object({
              id: z.string(),
              label: z.string(),
              rawText: z.string(),
              description: z.string(),
              fibre: z.string().optional(),
              percentage: z.string().optional(),
              rows: z.array(z.object({
                id: z.string(),
                description: z.string(),
                fibre: z.string().optional(),
                percentage: z.string(),
              })).optional(),
              qualifierNote: z.string().optional(),
            })
          )
          .optional(),
        selectedAlternativeId: z.string().optional(),
        widthBasis: z.enum(["greige", "finished", "cuttable", "unqualified"]).optional(),
        widthQualifier: z.string().optional(),
        widthProvenance: z.enum(["extracted", "manual", "default", "cleared"]).optional(),
        widthDefaultNote: z.string().optional(),
        widthMin: z.number().optional(),
        widthMax: z.number().optional(),
        gsmProvenance: z.enum(["extracted", "derived", "manual", "cleared"]).optional(),
        gsmDerivedReason: z.string().optional(),
        gsmDefaultWidthUsed: z.boolean().optional(),
        gsmWidthUsed: z.string().optional(),
        weightInput: z
          .object({
            value: z.number(),
            unit: z.enum(["glm", "oz/yd2", "oz/m2", "bare_oz", "gsm"]),
            rawText: z.string(),
            rawUnit: z.string(),
            min: z.number().optional(),
            max: z.number().optional(),
            tolerance: z.number().optional(),
            basis: z.string().optional(),
          })
          .optional(),
        targetPriceAmount: z.number().optional(),
        targetPriceCurrency: z.string().optional(),
        targetPriceCurrencySymbol: z.string().optional(),
        targetPriceCurrencyUnresolved: z.boolean().optional(),
        targetPriceBasis: z.enum(["per_metre", "per_yard", "per_kg", "per_piece", "per_roll", "unspecified"]).optional(),
        targetPriceQualifier: z.string().optional(),
        targetPriceIndicative: z.boolean().optional(),
        targetPriceOperator: z.enum([">", ">=", "<", "<="]).optional(),
        targetPriceStatus: z.enum(["exact", "range", "approximate", "indicative", "tolerance", "alternatives", "bound"]).optional(),
        targetPriceMin: z.number().optional(),
        targetPriceMax: z.number().optional(),
        targetPriceTolerance: z.number().optional(),
        targetPriceCommercialQualifiers: z.array(z.string()).optional(),
        targetPriceConfirmed: z.boolean().optional(),
        metadataNotes: z.array(z.string()).optional(),
        gsmMin: z.number().optional(),
        gsmMax: z.number().optional(),
        gsmQualifier: z.string().optional(),
        gsmTolerance: z.number().optional(),
        gsmAlternatives: z.array(z.number()).optional(),
        gsmBound: z.object({
          value: z.number(),
          operator: z.enum([">", ">=", "<", "<="]),
          label: z.string(),
        }).optional(),
        quantityBound: z.object({
          value: z.number(),
          operator: z.enum([">", ">=", "<", "<="]),
          label: z.string(),
        }).optional(),
        quantityQualifier: z.string().optional(),
        finishQualifiers: z.array(z.string()).optional(),
        finishExclusions: z.array(z.string()).optional(),
        finishAlternatives: z.array(z.string()).optional(),
        finishConfirmed: z.boolean().optional(),
        colourExclusions: z.array(z.string()).optional(),
        colourAlternatives: z.array(z.string()).optional(),
        colourReferences: z.array(z.string()).optional(),
        coloursConfirmed: z.boolean().optional(),
      })
    )
    .max(200),
  destination: z.object({
    deliveryCountry: z.string().optional(),
    deliveryState: z.string().optional(),
    deliveryCity: z.string().optional(),
    deliveryPincode: z.string().optional(),
    deliveryAddress: z.string().optional(),
    contactPhone: z.string().optional(),
  }),
  pending: batchSubmissionSchema.nullable(),
  result: batchResultSchema.extend({ dispatch: z.object({ claimed: z.number(), completed: z.number(), failed: z.number() }) }).nullable(),
});
type Pending = z.output<typeof batchSubmissionSchema>;
type Receipt = z.output<typeof savedSchema>["result"];
type State = { lines: RfqLine[]; destination: Destination; pending: Pending | null; result: Receipt };

export function useBuilder(buyerId: string) {
  const storageKey = `mylonex-rfq-builder-v1:${buyerId}`;
  const [state, setState] = useState<State>({ lines: [], destination: EMPTY_DESTINATION, pending: null, result: null });
  const [hydrated, setHydrated] = useState(false);
  const [error, setError] = useState("");
  const [storageError, setStorageError] = useState("");
  const [busy, setBusy] = useState(false);
  const sending = useRef(false);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed = savedSchema.safeParse(JSON.parse(raw));
        if (!parsed.success) throw new Error("Stored draft format is invalid");
        const restored = parsed.data as State;
        // Retain immutable pending payloads/keys; hydrate only their draft representation.
        setState({ ...restored, lines: restored.lines.map(initializeBlend) });
      } else setState({ lines: [newLine()], destination: EMPTY_DESTINATION, pending: null, result: null });
    } catch {
      setStorageError("Your saved draft could not be read. It has been kept in browser storage; clear it explicitly to start again.");
    }
    setHydrated(true);
  }, [storageKey]);
  useEffect(() => {
    if (!hydrated || storageError) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify(state));
    } catch {
      setStorageError("This browser could not save your draft. Free browser storage before submitting so the retry key can be retained.");
    }
  }, [hydrated, state, storageKey, storageError]);
  function update(patch: Partial<State>) {
    setState((previous) => (previous.pending || previous.result ? previous : { ...previous, ...patch }));
  }
  function updateDestination(patch: Partial<Destination>) {
    setState((previous) =>
      previous.pending || previous.result ? previous : { ...previous, destination: { ...previous.destination, ...patch } }
    );
  }
  async function submit() {
    if (sending.current || state.result || storageError) return;
    if (!state.pending && state.lines.some(line => referenceReviewIssues(line).length)) {
      setError("Confirm ambiguous colour or finish references before sending.");
      return;
    }
    if (!state.pending && state.lines.some((line) => blendState(line).state !== "complete")) {
      setError("Complete each fibre row, correct duplicate/invalid percentages, and reach 100% before sending.");
      return;
    }
    const parsed = batchSubmissionSchema.safeParse(state.pending ?? buildBatch(state.lines, state.destination, crypto.randomUUID()));
    if (!parsed.success) {
      setError("Review every line and complete the delivery details before sending.");
      return;
    }
    const pending = parsed.data;
    const submittedState = { ...state, pending };
    try {
      localStorage.setItem(storageKey, JSON.stringify(submittedState));
    } catch {
      setStorageError("The submission key could not be saved. No inquiries were sent. Free browser storage and retry.");
      return;
    }
    sending.current = true;
    setBusy(true);
    setError("");
    setState(submittedState);
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 120_000);
    try {
      const response = await builderFetch("/api/buyer/inquiries/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pending),
        signal: controller.signal,
      });
      let json;
      try {
        json = await response.json();
      } catch {
        throw new Error("We could not confirm this batch. Retry safely to retrieve the original inquiries.");
      }
      if (!response.ok) {
        if (response.status === 400 || response.status === 413) setState((previous) => ({ ...previous, pending: null }));
        throw new Error(json.error?.message || "We could not confirm this batch. Retry safely with the same submission key.");
      }
      const checked = savedSchema.shape.result.unwrap().safeParse(json.data);
      if (!checked.success) throw new Error("The batch acknowledgement was incomplete. Retry safely to retrieve the original inquiries.");
      const result = checked.data;
      setState((previous) => ({ ...previous, pending: null, result }));
      localStorage.setItem(storageKey, JSON.stringify({ ...submittedState, pending: null, result }));
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Submission status is uncertain. Retry safely to retrieve the original inquiries."
      );
    } finally {
      window.clearTimeout(timeout);
      sending.current = false;
      setBusy(false);
    }
  }
  function reset() {
    const fresh: State = { lines: [newLine()], destination: EMPTY_DESTINATION, pending: null, result: null };
    try {
      localStorage.setItem(storageKey, JSON.stringify(fresh));
      setStorageError("");
      setError("");
      setState(fresh);
    } catch {
      setStorageError("Browser storage is unavailable. Enable it or free space before continuing.");
    }
  }
  return {
    ...state,
    update,
    updateDestination,
    submit,
    reset,
    hydrated,
    busy,
    error,
    storageError,
    locked: !!state.pending || !!state.result || busy,
  };
}

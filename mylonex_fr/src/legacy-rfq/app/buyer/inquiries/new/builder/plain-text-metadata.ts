import { z } from "zod";
import { isFieldDisabled } from "../../../../../src/config/field-visibility";
import { BUYER_DYED_DYE_METHODS, DYE_COLOR_TYPES, WOVEN_END_USES } from "../../../../../src/domains/rfq/constants";
import { PER_COLOUR } from "../../../../../src/domains/rfq/text/plain-colours";
import { evidence } from "../../../../../src/domains/rfq/text/types";
import type { RfqLine } from "./draft";
import { FIBRE_PATTERN, fibreName } from "../../../../../src/domains/rfq/text/fibres";
import { serializeBlend } from "../../../../../src/domains/rfq/blend/rows";
import { TextAnalysis } from "../../../../../src/domains/rfq/text/analysis";
import { technicalPhrases } from "../../../../../src/domains/rfq/text/technical-phrases";
import { extractTargetPrice } from "../../../../../src/domains/rfq/text/price";
import { extractFinish } from "../../../../../src/domains/rfq/text/finish";
import { explicitWeaveContext } from "../../../../../src/domains/rfq/weave/context";
import { supplyStates } from "../../../../../src/domains/rfq/text/supply-state";
import { ringSpunCode } from "../../../../../src/domains/rfq/text/intent";

/** Plain-paste adapter only: leave image, spreadsheet and submission policies alone. */
export function applyPlainMetadata(text: string, line: RfqLine) {
  if (line.warnings.some(item => /named fibres lack percentages/i.test(item))) {
    // The legacy string parser can treat '100% Cotton / Polyester' as one custom
    // fibre. Keep a separate, incomplete row for each explicitly named component.
    let previousEnd = 0;
    line.blendRows = [...line.blend.matchAll(new RegExp(`\\b(${FIBRE_PATTERN})\\b`, "gi"))].map((match, index) => {
      const percentage = line.blend.slice(previousEnd, match.index).match(/(\d+(?:\.\d+)?)\s*%\s*$/)?.[1] || "";
      previousEnd = match.index! + match[0].length;
      return { id: `fibre-${index}`, fibre: fibreName(match[1]), percentage };
    });
    if (line.blendRows.length) line.blend = serializeBlend(line.blendRows);
  }
  const record = (field: string, match: RegExpMatchArray) => line.sourceEvidence!.push(evidence(field, match));
  const labelled = (label: string) => [...text.matchAll(new RegExp(`\\b(?:${label})\\s*[:=]\\s*([^,;\\n.]+)`, "gi"))];
  const setLabel = (field: "customFabricName" | "yarnType", label: string) => {
    const matches = labelled(label);
    if (new Set(matches.map(match => match[1].trim().toLowerCase())).size > 1) line.warnings.push(`Conflicting ${field} wording; confirm it in notes.`);
    else if (matches.length) { line.draft[field] = matches[0][1].trim(); record(field, matches[0]); }
  };
  setLabel("customFabricName", "fabric name|name");
  setLabel("yarnType", "yarn type");
  extractFinish(text, line, record);

  // Explicit states and cycles are independent. 'Ready for dyeing' is never Ready stock.
  let negatedState = false;
  negatedState = /\b(?:not|no|without)\s+(?:dyed|printed|greige|rfd|pfd|finished)\b/i.test(text);
  if (negatedState) line.warnings.push("Negated fabric state was not selected; confirm the intended state.");
  const states = supplyStates(text, true).filter(({ match }) => !(/^grey$/i.test(match[0]) &&
    line.sourceEvidence?.some(item => item.field === "colour" && item.start <= match.index! && match.index! < item.end)));
  const explicit = [...new Set(states.map(state => state.value))];
  delete line.draft.fabricState;
  if (explicit.length === 1) { line.draft.fabricState = explicit[0]; states.forEach(({ match }) => record("fabricState", match)); }
  else if (explicit.length > 1) line.warnings.push("Conflicting explicit fabric states; choose one after reviewing the source.");
  const perColour = text.match(PER_COLOUR);
  if (perColour && !explicit.length && !negatedState) {
    const reason = `Dyed inferred from ‘${perColour[0]}’.`;
    line.warnings.push(reason);
    line.sourceEvidence!.push({ ...evidence("fabricState", perColour), kind: "inferred", reason });
  } else if (perColour && (line.draft.fabricState === "rfd" || line.draft.fabricState === "greige")) {
    line.warnings.push(`Explicit ${line.draft.fabricState.toUpperCase()} was preserved. Colour-wise wording may describe future processing; confirm the intended state.`);
  }

  const solidMatch = text.match(/\bsolid\s+([a-zA-Z\s]+?)\s+(?:fabric|quality|twill|poplin|material)?\b/i);
  if (solidMatch && !explicit.length && !negatedState && !perColour) {
    const reason = `Dyed inferred from ‘${solidMatch[0].trim()}’.`;
    line.warnings.push(reason);
    line.sourceEvidence!.push({ ...evidence("fabricState", solidMatch), kind: "inferred", reason });
  }

  const futureSource = line.original || text;
  const futureMatch = futureSource.match(/\b(?:final\s+shade|final\s+colou?r|shade\s+after\s+approval)\s+([a-zA-Z\s]+?)(?:\s+after\s+approval|[;,.\n]|$)/i);
  if (futureMatch) {
    const futureShade = futureMatch[1].trim();
    const note = `Intended future shade: ${futureShade} (after approval).`;
    line.metadataNotes = line.metadataNotes || [];
    line.metadataNotes.push(note);
    line.draft.additionalSpecs = [line.draft.additionalSpecs, note].filter(Boolean).join("\n");
  }
  // Resolve labelled currency phrases before the RS stock abbreviation. Other
  // explicit fields own their text too (for example a fabric named "RS").
  extractPlainPrice(text, line, record);

  const rawCycles = [...text.matchAll(/\b(?:ready(?: stock)?(?!\s+for\s+dyeing)|RS|RDY|RTS|ready\s+to\s+ship|running(?: production| quality)?|RNG|made[ _-]+to[ _-]+order|MTO|development|DEV)\b/gi)];
  const cycles = rawCycles.filter(match => {
    if (/^RS$/i.test(match[0]) && explicitWeaveContext(text, match.index!, match.index! + match[0].length)) return false;
    if (/^RS$/i.test(match[0]) && ringSpunCode(text, match.index!, match.index! + match[0].length)) return false;
    if (line.sourceEvidence!.some(item => item.start <= match.index! && item.end >= match.index! + match[0].length)) return false;
    const before = text.slice(Math.max(0, match.index! - 40), match.index!);
    const isNegated = /\b(?:not|no|without|never|neither|do not assume|don't assume|cannot assume|must not assume|should not assume|do not consider|avoid)\b[^.;\n]*$/i.test(before);
    if (isNegated) {
      line.warnings.push(`Negated production cycle “${match[0]}” was not selected; confirm availability.`);
      return false;
    }
    return true;
  });
  const cycleOf = (value: string) => /^(?:ready|RS$|RDY|RTS)/i.test(value) ? "ready_stock" : /^(?:running|RNG)/i.test(value) ? "running_production" : "made_to_order";
  delete line.draft.productionCycle;
  if (new Set(cycles.map(match => cycleOf(match[0]))).size === 1) {
    line.draft.productionCycle = cycleOf(cycles[0][0]); cycles.forEach(match => record("productionCycle", match));
  } else if (cycles.length) line.warnings.push("Conflicting production cycles; select Ready, Running production or Made to order.");

  const uses = labelled("end use");
  if (uses.length) {
    const mapped = uses.map(match => WOVEN_END_USES.find(option => option.toLowerCase() === match[1].trim().toLowerCase()));
    if (mapped.every(Boolean) && new Set(mapped).size === 1) { line.draft.endUse = mapped[0]; uses.forEach(match => record("endUse", match)); }
    else { delete line.draft.endUse; line.warnings.push("End use is unsupported or conflicting; choose an existing option."); }
  }
  const methods = [...text.matchAll(/\b(?:yarn[ _-]+dyed|piece[ _-]+dyed)\b/gi),
    ...states.filter(({ match }) => /^(?:P|Y)\s*\/\s*D$/i.test(match[0])).map(({ match }) => match)];
  const methodNames = methods.map(match => /^P\s*\/\s*D$/i.test(match[0]) ? "piece_dyed"
    : /^Y\s*\/\s*D$/i.test(match[0]) ? "yarn_dyed" : match[0].toLowerCase().replace(/[ -]+/g, "_"));
  if (new Set(methodNames).size === 1) {
    line.draft.dyeMethod = BUYER_DYED_DYE_METHODS.find(option => option === methodNames[0]); methods.forEach(match => record("dyeMethod", match));
  } else if (methods.length && !isFieldDisabled("dyeMethod")) line.warnings.push("Conflicting dye methods; confirm processing details.");
  const dyes = [...text.matchAll(/\b(?:dye type\s*[:=]\s*(?:vat|reactive)|(?:vat|reactive)\s+dyed)\b/gi)];
  const dyeNames = dyes.map(match => /reactive/i.test(match[0]) ? "reactive" : "vat");
  if (new Set(dyeNames).size === 1) {
    line.draft.dyeColorType = DYE_COLOR_TYPES.find(option => option === dyeNames[0]); dyes.forEach(match => record("dyeColorType", match));
  } else if (dyes.length) line.warnings.push("Conflicting dye types; confirm processing details.");

  delete line.draft.requiredDeliveryDate;
  const dateAnalysis = new TextAnalysis(text);
  const countSpans = technicalPhrases(dateAnalysis).pairs.filter(pair => pair.separator === "by").map(pair => dateAnalysis.span(pair.start, pair.end));
  const dateText = text.split("").map((char, index) => countSpans.some(span => span.start <= index && index < span.end) ? " " : char).join("");
  const dates = [...dateText.matchAll(/\b(?:deliver(?:y)?(?: date)?|target delivery(?: date)?|deliver by|by)\s*[:=]?\s*(\d{4}-\d{2}-\d{2})\b/gi)];
  if (dates.length && new Set(dates.map(match => match[1])).size === 1 && z.iso.date().safeParse(dates[0][1]).success) {
    line.draft.requiredDeliveryDate = dates[0][1]; dates.forEach(match => record("requiredDeliveryDate", match));
  } else if (dates.length > 1) {
    line.warnings.push("Conflicting delivery dates; confirm the intended date.");
  } else {
    const relativeDelivery = text.match(/\b(?:(?:deliver(?:y)?|lead[ -]?time|dispatch)\s+(?:within|in)\s+|(?:estimated|est\.?|approx\.?|around)\s+)(\d+\s*(?:days?|weeks?|months?)(?:\s+of\s+[^.,;\n]+)?)/i);
    if (relativeDelivery) {
      const isEst = /^(?:estimated|est|approx|around)/i.test(relativeDelivery[0]);
      const relNote = isEst ? `Timeline: ${relativeDelivery[0].trim()}` : `Delivery: ${relativeDelivery[0].replace(/^delivery\s*[:=]?\s*/i, "").trim()}`;
      line.metadataNotes = line.metadataNotes || [];
      line.metadataNotes.push(relNote);
      if (!line.draft.additionalSpecs?.includes(relNote)) {
        line.draft.additionalSpecs = [line.draft.additionalSpecs, relNote].filter(Boolean).join("\n");
      }
    } else if (/\b(?:deliver(?:y)?\s*date|deliver\s+by)\s*[:=]?\s*(?!\d{4}-\d{2}-\d{2})\b/i.test(dateText) && !/\b(?:need|ask|request)\s+price\s+n\s+delivery\b/i.test(dateText)) {
      line.warnings.push("Confirm a single real target delivery date, including its year, in YYYY-MM-DD format.");
    }
  }

  // Certifications
  const certMatches = [...text.matchAll(/\b(?:GOTS|OEKO(?:-TEX)?(?: Standard 100)?|GRS|RCS|OCS|BCI|FSC|ZDHC)\b/gi)];
  for (const match of certMatches) {
    const note = `Certification requirement: ${match[0].toUpperCase()}`;
    line.metadataNotes = line.metadataNotes || [];
    if (!line.metadataNotes.includes(note)) line.metadataNotes.push(note);
    if (!line.draft.additionalSpecs?.includes(note)) {
      line.draft.additionalSpecs = [line.draft.additionalSpecs, note].filter(Boolean).join("\n");
    }
  }

  // Testing requirements
  const testMatches = [...text.matchAll(/\b(?:AATCC|AZO[ -]?FREE|CFL|CFR|CFW|ISO\s+\d+|pilling test|shrinkage test)\b/gi)];
  for (const match of testMatches) {
    const note = `Testing requirement: ${match[0]}`;
    line.metadataNotes = line.metadataNotes || [];
    if (!line.metadataNotes.includes(note)) line.metadataNotes.push(note);
    if (!line.draft.additionalSpecs?.includes(note)) {
      line.draft.additionalSpecs = [line.draft.additionalSpecs, note].filter(Boolean).join("\n");
    }
  }

  // Sample requests
  const sampleMatches = [...text.matchAll(/\b(?:swatch(?:es)?|hanger(?:s)?|header(?:s)?|sample card|lab dip(?:s)?|strike[ -]?off(?:s)?|top of production|counter sample(?:s)?)\b/gi)];
  for (const match of sampleMatches) {
    const note = `Sample requirement: ${match[0]}`;
    line.metadataNotes = line.metadataNotes || [];
    if (!line.metadataNotes.includes(note)) line.metadataNotes.push(note);
    if (!line.draft.additionalSpecs?.includes(note)) {
      line.draft.additionalSpecs = [line.draft.additionalSpecs, note].filter(Boolean).join("\n");
    }
  }
}

function extractPlainPrice(text: string, line: RfqLine, record: (_field: string, _match: RegExpMatchArray) => void) {
  extractTargetPrice(text, line, record);
}

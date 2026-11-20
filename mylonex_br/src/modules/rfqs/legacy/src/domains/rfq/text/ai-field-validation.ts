import { BUYER_FABRIC_STATES, PRODUCTION_CYCLES, BUYER_DYED_DYE_METHODS, DYE_COLOR_TYPES, BUYER_PRINT_METHODS, PRINT_BASE_TYPES, WOVEN_END_USES } from "../constants.js";
import { wovenSpecsStepSchema } from "../schema.js";
import { TextAnalysis } from "./analysis.js";
import { technicalPhrases } from "./technical-phrases.js";
import { canonicalBlend, measurements, metres, perColourMetres, normalize, numbersSupported, sourceCompositionResult, emptyFields } from "./ai-grounding.js";
import type { AiField } from "./ai-schema.js";
import { extractDescriptive } from "./descriptive.js";
import { NUMBER, numeric } from "./measurements.js";
import { widthPhrases } from "./width-phrases.js";
import { excludedFibres, finishValue } from "./plain-context.js";
import { fibreKey } from "../blend/rows.js";
import { normalizeColour } from "./colours.js";
import { conflictingWeaves, normalizedWeave, weaveDisplay } from "../weave/phrases.js";
import { detectWovenWeaves } from "../weave/detect.js";
import { explicitWeaveContext } from "../weave/context.js";
import { extractFinish, FINISH_VOCABULARY } from "./finish.js";
import { supplyStates } from "./supply-state.js";
import { inactiveMention, ringSpunCode } from "./intent.js";
import { extractPlainColours } from "./colours.js";

export function greigeWidth(source: string) { return /\b(?:greige|griege|grey)\s+width\b|\bwidth\s*[:=]?\s*(?:greige|griege|grey)\b/i.test(source); }
export function validAiField(candidate: AiField, fabricSource: string): string | undefined {
  const { field, value, sourcePhrases } = candidate;
  const proof = sourcePhrases.join("\n");
  if (field === "gsm") {
    const expected = measurements(proof).gsm || measurements(fabricSource).gsm;
    return expected && expected === Number(value) && wovenSpecsStepSchema.shape.gsm.safeParse(expected).success ? String(expected) : undefined;
  }
  if (field === "width") {
    const qualified = widthPhrases(fabricSource).some(width => width.basis === "greige" && sourcePhrases.some(phrase => {
      const start = fabricSource.indexOf(phrase); return width.start <= start && start + phrase.length <= width.end;
    }));
    if (greigeWidth(proof) || qualified) return undefined;
    const expected = measurements(proof).width, proposed = /^\d+(?:\.\d+)?$/.test(value) ? `${Number(value)} inches` : measurements(value).width;
    return expected && expected === proposed ? expected : undefined;
  }
  if (field === "quantity" || field === "perColourQuantity") {
    const proposed = metres(value);
    const actual = field === "quantity" ? metres(proof) : perColourMetres(proof);
    if (field === "perColourQuantity" && !/\b(?:per[ -]+colou?r|per[ -]+col|each|colou?r[ -]*wise)\b/i.test(proof)) return undefined;
    const full = field === "quantity" ? metres(fabricSource) : actual;
    return proposed && proposed === actual && (field !== "quantity" || proposed === full) ? `${proposed} m` : undefined;
  }
  if (field === "blend") {
    const grounded = sourceCompositionResult(proof);
    if (grounded.compositionReview) return undefined;
    const overall = sourceCompositionResult(fabricSource);
    if (overall.compositionReview || /conflicting|alternative/i.test(overall.warnings.join(" "))) return undefined;
    const parsed = canonicalBlend(value), source = canonicalBlend(grounded.blend);
    if (parsed.rows.some(row => excludedFibres(fabricSource).includes(fibreKey(row.fibre)))) return undefined;
    return parsed.value && normalize(parsed.value) === normalize(source.value) ? parsed.value : undefined;
  }
  if (!numbersSupported(value, proof)) return undefined;
  if (field === "count") {
    if (!/\bcount\s*[:=]?/i.test(proof) && (/\b(?:gsm|metres?|meters?|mtrs?|mts|width|price)\b|\d\s*\(?M\)?\b|[”″"]/i.test(proof))) return undefined;
    const parsed = technicalPhrases(new TextAnalysis(`count: ${value}`)).candidates.find(item => item.field === "count");
    const words = value.replace(/[x×*]/gi, " ").match(/[a-z]+/gi) || [];
    return parsed && normalize(parsed.value) === normalize(value.replace(/\bby\b/gi, "×")) && words.every(word => normalize(proof).includes(word.toLowerCase())) ? parsed.value : undefined;
  }
  if (field === "construction") {
    const parsed = technicalPhrases(new TextAnalysis(`construction: ${value}`)).candidates.find(item => item.field === "construction");
    return parsed && normalize(parsed.value) === normalize(value.replace(/\bby\b/gi, "×")) && (!/\b(?:twill|matty|drill|weave)\b/i.test(proof) || normalize(proof).includes(normalize(value))) ? parsed.value : undefined;
  }
  if (field === "weaveType") {
    if (!wovenSpecsStepSchema.shape.weaveType.safeParse(value).success || /\b(?:order\s+qty|quantity|gsm|width|blend|construction)\s*[:=]/i.test(value)) return undefined;
    const detection = detectWovenWeaves(fabricSource);
    if (conflictingWeaves(fabricSource, detection.mentions)) return undefined;
    const known = detection.mentions.some(mention => mention.status === "recognized" &&
      normalizedWeave(mention.matchedTerm) === normalizedWeave(value) && sourcePhrases.some(phrase =>
        normalizedWeave(phrase).includes(normalizedWeave(mention.matchedTerm))));
    // Existing qualifier handling retains e.g. (OL) for explicit human review.
    const base = value.replace(/\s+\([^)]+\)$/, "");
    const qualified = base !== value && normalize(proof).includes(normalize(value)) &&
      detectWovenWeaves(base).mentions.some(mention => mention.status === "recognized" && normalizedWeave(mention.matchedTerm) === normalizedWeave(base));
    return known || qualified ? weaveDisplay(value) : undefined;
  }
  if (field === "colour") {
    if (/^(?:\d+\s*)?colou?rs?$/i.test(value.trim())) return undefined;
    const active = emptyFields(); extractPlainColours(fabricSource, active);
    if (!active.colours.some(c => normalizeColour(c.name).name.toLowerCase() === normalizeColour(value).name.toLowerCase())) return undefined;
    // A short shade-looking code may instead belong to an explicit weave field.
    const weaveOnlyProof = sourcePhrases.every(phrase => {
      if (!/^[\p{L}\p{N}/.-]{1,8}$/u.test(phrase)) return false;
      let start = fabricSource.indexOf(phrase);
      if (start < 0) return false;
      while (start >= 0) {
        if (!explicitWeaveContext(fabricSource, start, start + phrase.length)) return false;
        start = fabricSource.indexOf(phrase, start + phrase.length);
      }
      return true;
    });
    if (weaveOnlyProof) return undefined;
    const normProof = normalizeColour(proof).name.toLowerCase();
    const normVal = normalizeColour(value).name.toLowerCase();
    if (normProof === normVal || normalize(proof).includes(normalize(value)) || normProof.includes(normVal)) return value;
  }
  if (field === "yarnType" && excludedFibres(fabricSource).includes(fibreKey(value))) return undefined;
  if (field === "finish") {
    const active = emptyFields(); extractFinish(fabricSource, active);
    if (active.finishAlternatives?.length) return undefined;
    const activeProof = sourcePhrases.some(phrase => {
      if (/\b(?:no|not|without|later|future|optional|or)\b/i.test(phrase)) return false;
      let start = fabricSource.indexOf(phrase);
      while (start >= 0) {
        if (!inactiveMention(fabricSource, start, start + phrase.length)) return true;
        start = fabricSource.indexOf(phrase, start + phrase.length);
      }
      return false;
    });
    if (!active.finish && !activeProof) return undefined;
    const canonical = finishValue(value);
    const stated = emptyFields(); extractFinish(proof, stated);
    const proposed = FINISH_VOCABULARY[value.trim().toLowerCase()]?.canonical || canonical;
    if (active.finish && !normalize(active.finish).includes(normalize(proposed))) return undefined;
    if (stated.finish && normalize(stated.finish) === normalize(proposed)) return proposed;
    return normalize(proof).includes(normalize(value)) || normalize(proof).includes(normalize(canonical)) ? canonical : undefined;
  }
  const enums = { fabricState: BUYER_FABRIC_STATES, productionCycle: PRODUCTION_CYCLES, dyeMethod: BUYER_DYED_DYE_METHODS, dyeColorType: DYE_COLOR_TYPES, printMethod: BUYER_PRINT_METHODS, printBaseType: PRINT_BASE_TYPES, endUse: WOVEN_END_USES };
  if (field in enums) {
    const options = enums[field as keyof typeof enums] as readonly string[];
    if (!options.includes(value)) return undefined;
    if (field === "fabricState") {
      const states = supplyStates(fabricSource);
      if (new Set(states.map(s => s.value)).size !== 1 || states[0]?.value !== value) return undefined;
      return supplyStates(proof).some(s => s.value === value) ? value : undefined;
    }
    if (field === "productionCycle") {
      if (value === "ready_stock" && /^RS$/i.test(proof.trim())) {
        const supported = [...fabricSource.matchAll(/\bRS\b/gi)].some(m => !ringSpunCode(fabricSource, m.index!, m.index! + m[0].length) && !inactiveMention(fabricSource, m.index!, m.index! + m[0].length));
        if (!supported) return undefined;
      }
      if (value === "ready_stock" && /\bRS\b/i.test(proof) && !/\bready(?: stock)?\b(?!\s+for\s+dyeing)/i.test(proof) && ![...fabricSource.matchAll(/\bRS\b/gi)].some(match =>
        !explicitWeaveContext(fabricSource, match.index!, match.index! + match[0].length))) return undefined;
      const expression = value === "ready_stock" ? /\b(?:ready(?: stock)?|RS)\b(?!\s+for\s+dyeing)/i : value === "running_production" ? /\brunning(?: production)?\b/i : /\bmade[ -]+to[ -]+order\b/i;
      return expression.test(proof) && !/\b(?:price|INR)\b|(?:\/|per)\s*m\b/i.test(proof) ? value : undefined;
    }
    if (field === "endUse") {
      const stated = emptyFields(); extractDescriptive(proof, stated);
      return stated.endUse === value || normalize(proof).includes(normalize(value)) ? value : undefined;
    }
    return normalize(proof).includes(normalize(value.replace(/_/g, " "))) ? value : undefined;
  }
  if (field === "requiredDeliveryDate") return /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value && proof.includes(value) ? value : undefined;
  if (field === "targetPriceMax") {
    const prices = [...proof.matchAll(new RegExp(`(?:(?:INR|Rs\\.?|₹)\\s*(${NUMBER})|(${NUMBER})\\s*(?:INR|Rs\\.?|₹|rupees?)|\\b(?:target(?:\\s*price)?|budget|rate)\\s*[:=—–-]?\\s*(?:INR|Rs\\.?|₹)?\\s*(${NUMBER}))`, "gi"))]
      .map(match => numeric(match[1] || match[2] || match[3]));
    return Number(value) > 0 && prices.length > 0 && prices.every(price => price === Number(value)) ? value : undefined;
  }
  if (field === "customFabricName" && !/\b(?:name|named|called)\b/i.test(proof)) return undefined;
  return normalize(proof).includes(normalize(value)) ? value : undefined;
}

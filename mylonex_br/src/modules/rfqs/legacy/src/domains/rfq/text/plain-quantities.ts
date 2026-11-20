import { NUMBER, numeric } from "./measurements.js";
import { COLOUR, PER_COLOUR } from "./plain-colours.js";
import { evidence, type TextFields } from "./types.js";
import { fitsQuantityBound, quantityRelation, quantityRelationLabel } from "./quantity-relations.js";
import { hasIncompleteColourList, reconcileColourTotal } from "./colour-totals.js";
import { pantoneMentions, normalizePantone } from "./pantone.js";
import { normalizeColour } from "./colours.js";
import { applyPackageQuantities, readPackageQuantities } from "./package-quantity.js";
export type QuantityBound = { value: number; operator: ">" | ">=" | "<" | "<="; source: string; start: number; end: number };

/** Total metres and per-shade amounts are distinct roles, never competing scalars. */
export function extractPlainQuantities(text: string, result: TextFields, boundPhrases?: QuantityBound[], includePackages = false) {
  const source = text;
  const packaging = includePackages ? readPackageQuantities(text) : undefined;
  if (packaging) text = packaging.text;
  const unit = "(?:(?:linear|running)\\s+)?(?:metres?|meters?|mtrs?|mts|m|yards?|yds?)";
  const expression = new RegExp(`(?<![\\w./−-])(${NUMBER})(?:\\s*([-–—]|to)\\s*${NUMBER})?\\s*(?:\\(\\s*(${unit})\\s*\\)|(${unit}))(?![\\w²2])`, "gi");
  const totals: { value: number; match: RegExpMatchArray; explicitTotal: boolean }[] = [];
  const colourQuantities: { value: number; match: RegExpMatchArray; isPartial: boolean; colour: string }[] = [];
  const perColour: { value: number; match: RegExpMatchArray }[] = [];
  let sharedColourAmount: number | undefined;
  const unclearSplits: number[] = [];
  const bounds: { value: number; operator: ">" | ">=" | "<" | "<=" }[] = [];
  let ambiguousTotal = false, ambiguousSplit = false;
  for (const match of text.matchAll(expression)) {
    const before = text.slice(0, match.index!).split(/[;\n!?]|\.(?=\s|$)/).pop()!;
    const after = text.slice(match.index! + match[0].length);
    const nearBefore = before.slice(-60);
    if (/\b(?:moq|available(?: stock)?|sample|swatch|stock quantity|yardage)\b[^,()]*$/i.test(nearBefore)
      || /\b(?:price|rate|cost|budget)\b[^,()]*$/i.test(nearBefore)
      || /\b(?:stock|delivery|dispatch|width|length|count|EPI|PPI)\s*[:=]?\s*$/i.test(nearBefore)
      || /^\s*(?:wide|width|long|length)\b/i.test(after)) continue;
    const beforeEnd = before.trim();
    const pantoneBefore = pantoneMentions(before).pop();
    const colourBeforeMatch = before.match(new RegExp(`\\b(${COLOUR})\\s*[:=–—-]?\\s*$`, "i"));
    const individualBefore = !!colourBeforeMatch || (!!pantoneBefore && beforeEnd.endsWith(pantoneBefore[0]));

    // Check if shade/colour/pantone follows the quantity (e.g. "600 m shade Pantone 19 4052 TCX", "400 M shade 13-1023TCX", "100 m Red")
    const afterFirstClause = after.split(/[;\n!?]|\.(?=\s|$)/)[0];
    const pantoneAfter = pantoneMentions(afterFirstClause)[0];
    const colourAfterMatch = afterFirstClause.match(new RegExp(`^\\s*(?:[:=–—-]\\s*|(?:in|of|for|shade|colou?r|shade\\s*[:=–—-]\\s*|colou?r\\s*[:=–—-]\\s*)\\s*)(${COLOUR})\\b`, "i"));
    const pantoneAfterValid = !!pantoneAfter && /^\s*(?:[:=–—-]|\s*(?:in|of|for|shade|colou?r))\b/i.test(afterFirstClause.slice(0, pantoneAfter.index! + pantoneAfter[0].length));
    const individualAfter = !!colourAfterMatch || !!pantoneAfterValid;

    const individual = individualBefore || individualAfter;
    const split = PER_COLOUR.test(after.match(/^[^,;.()\n]*/)?.[0] || "") && /^\s*(?:per|colou?r)/i.test(after)
      || /\b(?:per[ -]+colou?r|per[ -]+col|colou?r[ -]*wise)\s*[:=]?\s*$/i.test(before)
      || /^\s*(?:each|for each colou?r)\b/i.test(after);
    const unclearSplit = /^\s*per\s+sol\b/i.test(after);
    const total = /^\s*(?:in\s+total|total(?:\s+requirement)?|overall)\b/i.test(after)
      || /\b(?:total(?:\s+(?:requirement|order|quantity|qty|need|volume|meters?|metres?|mtrs?))?(?:\s+(?:is|of))?|overall(?:\s+(?:requirement|order|quantity|qty|need|volume))?(?:\s+(?:is|of))?)\s*[:=—–-]?\s*$/i.test(before);
    const amount = numeric(match[1]) * (/^(?:yard|yd)/i.test(match[3] || match[4]) ? 0.9144 : 1);
    const immediateBefore = before.split(",").pop() || "";
    const immediateAfter = after.split(",")[0] || "";
    const uncertain = !!match[2] || /(?:±|\+\/-|\babout\b|\bapprox(?:imately)?\b)/i.test(immediateBefore.slice(-15) + match[0] + immediateAfter.slice(0, 20));
    const relation = quantityRelation(before, after, match.index!, match.index! + match[0].length);
    if (relation && !uncertain && Number.isInteger(amount) && amount > 0 && amount <= 2_147_483_647) {
      bounds.push({ value: amount, operator: relation.operator });
      boundPhrases?.push({ value: amount, operator: relation.operator, source: text.slice(relation.start, relation.end), start: relation.start, end: relation.end });
      const label = quantityRelationLabel(relation.operator);
      result.quantityBound = { value: amount, operator: relation.operator, label };
      result.quantityQualifier = relation.operator;
      const reason = `Quantity ${relation.operator} ${amount} m is a bound, not an exact order quantity. Confirm an exact quantity before entering it.`;
      result.evidence.push({
        field: "quantity",
        text: text.slice(relation.start, relation.end),
        start: relation.start,
        end: relation.end,
        kind: "unresolved",
        value: amount,
        unit: "m",
        reason,
      });
      result.warnings.push(reason);
      continue;
    }
    if (uncertain || !Number.isInteger(amount) || amount <= 0 || amount > 2_147_483_647) {
      result.warnings.push(`Quantity “${match[0]}” needs review: use positive whole metres and confirm ranges/tolerances.`);
      if (split || individual || unclearSplit) ambiguousSplit = true; else ambiguousTotal = true;
      result.evidence.push({ ...evidence("quantity", match), kind: "unresolved" }); continue;
    }
    if (/\b(?:both|all fabrics)\b/i.test(`${nearBefore} ${after.split(/[.;\n]/)[0]}`) && !/\beach\b/i.test(`${nearBefore} ${after.split(/[.;\n]/)[0]}`)) {
      ambiguousTotal = true; result.warnings.push("Shared quantity scope is unclear; confirm combined total versus per fabric."); continue;
    }
    if (unclearSplit) {
      unclearSplits.push(amount);
      result.warnings.push(`“per sol” is ambiguous. Confirm whether ${match[1]} m means per colour; no fabric state or colour quantities were inferred.`);
      result.evidence.push({ ...evidence("per-colour quantity", match), kind: "unresolved", value: amount, unit: "m", reason: "‘per sol’ is not established as ‘per colour’." });
      continue;
    }
    if (individual) {
      let matchedShade = "";
      if (individualBefore) {
        matchedShade = colourBeforeMatch ? colourBeforeMatch[1] : pantoneBefore ? normalizePantone(pantoneBefore[0]) || "" : "";
      } else {
        matchedShade = colourAfterMatch ? colourAfterMatch[1] : pantoneAfter ? normalizePantone(pantoneAfter[0]) || "" : "";
      }
      const isPartial = /\b(?:including|incl\.?|such as|e\.g\.)\s*$/i.test(before.replace(new RegExp(`\\b(${COLOUR})\\s*[:=–—-]\\s*$`, "i"), ""));
      if (matchedShade) {
        const normMatched = normalizePantone(matchedShade) || normalizeColour(matchedShade).name;
        const targetColour = result.colours.find(c => {
          const cNorm = normalizePantone(c.name) || normalizeColour(c.name).name;
          const cSrcNorm = c.sourceText ? (normalizePantone(c.sourceText) || normalizeColour(c.sourceText).name) : "";
          return cNorm.toLowerCase() === normMatched.toLowerCase() || cSrcNorm.toLowerCase() === normMatched.toLowerCase();
        });
        if (targetColour && !targetColour.metres) targetColour.metres = String(amount);
        result.evidence.push({ ...evidence("colour quantity", match), text: `${matchedShade}: ${match[0]}`, value: amount, unit: "m" });
      }
      colourQuantities.push({ value: amount, match, isPartial, colour: matchedShade });
      continue;
    }
    if (split && !total) perColour.push({ value: amount, match });
    else totals.push({ value: amount, match, explicitTotal: total });
  }
  if (!ambiguousTotal && totals.length) {
    // Check for superseded totals (e.g. preceded by "replacing", "instead of", "not", "earlier")
    const isSuperseded = (item: { match: RegExpMatchArray }) => {
      const beforeMatch = text.slice(Math.max(0, item.match.index! - 40), item.match.index!);
      return /\b(?:replacing|replace|instead of|not|earlier)\s*$/i.test(beforeMatch);
    };

    const isExplicitCorrection = (item: { match: RegExpMatchArray }) => {
      const beforeMatch = text.slice(Math.max(0, item.match.index! - 60), item.match.index!);
      return /\b(?:final(?:\s+order)?\s+quantity|revised(?:\s+order)?\s+quantity|new\s+quantity|should be|change(?:\s+order)?\s+quantity\s+to|revise(?:\s+order)?\s+quantity\s+to)\b/i.test(beforeMatch);
    };

    const hasCorrectionSection = /\b(?:actually|instead|correct(?:ion|ed)?|rather|revised?|update|replac(?:ing|e)|final\s+(?:order\s+)?quantity|change)\b/i.test(text);

    const supersededValues = new Set(totals.filter(isSuperseded).map(item => item.value));
    const validTotals = totals.filter(item => !isSuperseded(item) && !supersededValues.has(item.value));

    const correctionCandidates = validTotals.filter(isExplicitCorrection);
    const chosenCorrection = correctionCandidates.length === 1 ? correctionCandidates[0] : (validTotals.length === 1 && hasCorrectionSection ? validTotals[0] : undefined);

    if (chosenCorrection && hasCorrectionSection) {
      result.quantity = chosenCorrection.value;
      result.evidence.push(evidence("quantity", chosenCorrection.match));
      for (const superseded of totals.filter(item => item !== chosenCorrection)) {
        result.evidence.push({ ...evidence("quantity", superseded.match), kind: "unresolved", reason: "Superseded by explicit quantity correction." });
      }
      result.warnings.push("Explicit quantity correction applied; review the original source.");
    } else {
      const explicitTotals = totals.filter(item => item.explicitTotal);
      if (explicitTotals.length > 0) {
        const explicitValues = new Set(explicitTotals.map(item => item.value));
        if (explicitValues.size === 1) {
          result.quantity = explicitTotals[0].value;
          result.evidence.push(evidence("quantity", explicitTotals[0].match));
        } else {
          result.warnings.push("Conflicting total quantities; confirm the intended total in metres.");
          result.evidence.push(...totals.map(item => ({ ...evidence("quantity", item.match), kind: "unresolved" as const })));
        }
      } else if (new Set(totals.map(item => item.value)).size === 1) {
        result.quantity = totals[0].value;
        result.evidence.push(...totals.map(item => evidence("quantity", item.match)));
      } else {
        // Preserve the existing explicit correction behavior.
        const nonSupersededTotals = totals.filter(t => !isSuperseded(t));
        const last = nonSupersededTotals[nonSupersededTotals.length - 1] || totals[totals.length - 1];
        const correction = /\b(?:actually|instead|correct(?:ion|ed)?|rather|revised?|update|replac(?:ing|e)|should be|change)\b/i.test(text.slice(totals[0].match.index! + totals[0].match[0].length, last.match.index));
        if (correction) {
          result.quantity = last.value; result.evidence.push(evidence("quantity", last.match));
          result.warnings.push("Explicit quantity correction applied; review the original source.");
        } else {
          result.warnings.push("Conflicting total quantities; confirm the intended total in metres.");
          result.evidence.push(...totals.map(item => ({ ...evidence("quantity", item.match), kind: "unresolved" as const })));
        }
      }
    }
  }
  if (!ambiguousTotal && totals.length === 0 && colourQuantities.length > 0) {
    if (colourQuantities.length === 1) {
      const single = colourQuantities[0];
      result.quantity = single.value;
      result.evidence.push(evidence("quantity", single.match));
    } else {
      const hasAlternatives = (result.colourAlternatives && result.colourAlternatives.length > 0)
        || /\b(?:either\s+)?(?:[a-zA-Z\s]+?)\s+or\s+(?:[a-zA-Z\s]+?)\b/i.test(text);
      const hasPartial = colourQuantities.some(c => c.isPartial) || /\b(?:including|incl\.?|such as|partial(?:ly)?)\b/i.test(text);
      const completeSplits = result.colours.length === 0 || (result.colours.length > 0 && result.colours.every(c => c.metres && Number(c.metres) > 0));

      if (completeSplits && !hasAlternatives && !hasPartial) {
        const sum = colourQuantities.reduce((acc, c) => acc + c.value, 0);
        result.quantity = sum;
        const componentsText = result.colours.length > 0
          ? result.colours.map(c => `${c.name} ${c.metres} m`).join(" + ")
          : colourQuantities.map(c => `${c.colour ? `${c.colour} ` : ""}${c.value} m`).join(" + ");
        result.evidence.push({
          field: "quantity",
          kind: "inferred",
          value: sum,
          unit: "m",
          text: colourQuantities.map(c => c.match[0]).join(", "),
          reason: `Calculated total ${sum} m from colour quantities (${componentsText}).`,
          start: colourQuantities[0].match.index!,
          end: colourQuantities[colourQuantities.length - 1].match.index! + colourQuantities[colourQuantities.length - 1].match[0].length,
        });
        const summaryText = result.colours.length > 0
          ? result.colours.map(c => `${c.name}: ${c.metres} m`).join(", ")
          : colourQuantities.map(c => `${c.colour ? `${c.colour}: ` : ""}${c.value} m`).join(", ");
        result.warnings.push(`Total quantity calculated as ${sum} m from colour breakdown (${summaryText}).`);
      }
    }
  }
  if (!ambiguousSplit && perColour.length) {
    if (new Set(perColour.map(item => item.value)).size > 1) {
      result.warnings.push("Conflicting per-colour quantities; confirm the source amounts.");
    } else {
      const amount = perColour[0].value;
      sharedColourAmount = amount;
      for (const colour of result.colours) {
        if (!colour.metres) colour.metres = String(amount);
        else if (Number(colour.metres) !== amount) result.warnings.push(`Per-colour amount disagrees with ${colour.name}'s explicit quantity; both source values need review.`);
      }
      result.evidence.push(...perColour.map(item => evidence("per-colour quantity", item.match)));
      if (!result.quantity && result.colours.length && !totals.length && !ambiguousTotal)
        result.warnings.push(`Proposed total: ${amount * result.colours.length} m (${result.colours.length} colours × ${amount} m). Enter it only after confirmation.`);
    }
  }
  if (result.quantity && bounds.some(bound => bound.value !== result.quantity && !fitsQuantityBound(result.quantity!, bound.value, bound.operator))) {
    delete result.quantity;
    for (const item of result.evidence.filter(item => item.field === "quantity")) item.kind = "unresolved";
    result.warnings.push("Conflicting exact quantity and quantity bound; confirm the intended order amount.");
  }
  const completeSplits = result.colours.length > 0 && result.colours.every(item => item.metres);
  const isPartialColourList = colourQuantities.some(c => c.isPartial) || hasIncompleteColourList(text);
  if (result.quantity && completeSplits && !isPartialColourList) {
    const sum = result.colours.reduce((total, item) => total + Number(item.metres), 0);
    if (sum !== result.quantity) result.warnings.push(`Quantity mismatch: colour quantities total ${sum} m; explicit total is ${result.quantity} m. Both values were preserved.`);
  }
  const reconciled = reconcileColourTotal(text, result);
  if (!reconciled && sharedColourAmount !== undefined) {
    result.warnings.push(`Per-colour quantity: ${sharedColourAmount} m. Confirm the colour list and total quantity.`);
  }
  if (packaging) applyPackageQuantities(source, result, packaging.packages, totals.length > 0 || bounds.length > 0 || ambiguousTotal);
  if (unclearSplits.length === 1 && result.colours.length) {
    const calculated = unclearSplits[0] * result.colours.length;
    result.warnings.push(`Only if “per sol” means per colour: ${result.colours.length} colours × ${unclearSplits[0]} m = ${calculated} m${result.quantity ? calculated === result.quantity ? ", matching the explicit total" : `, a mismatch with the explicit ${result.quantity} m total` : ""}. Confirm the phrase before using this calculation.`);
  }
}
export function quantityBounds(text: string): QuantityBound[] {
  const result: TextFields = { blend: "", count: "", construction: "", finish: "", colours: [], notes: "", warnings: [], evidence: [] };
  const bounds: QuantityBound[] = []; extractPlainQuantities(text, result, bounds); return bounds;
}

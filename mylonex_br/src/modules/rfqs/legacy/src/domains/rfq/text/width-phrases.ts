import { TextAnalysis } from "./analysis.js";
import { NUMBER, extractMeasurements, fractionComponent } from "./measurements.js";
import type { TextFields } from "./types.js";

/** Measurements have a basis as well as a unit. Never coerce greige to cuttable. */
export function widthPhrases(source: string) {
  const analysis = new TextAnalysis(source);
  const units = '(?:["″”]|inches|inch|ins|inchs|in|cm|centimetres?|centimeters?)';
  const expression = new RegExp(`(?<![\\d.−-])${NUMBER}(?:\\s*(?:-|to)\\s*${NUMBER})?\\s*${units}(?![\\p{L}])`, "giu");
  return [...analysis.text.matchAll(expression)].filter(match => !fractionComponent(analysis.text, match.index!)).map(match => {
    const start = match.index!, end = start + match[0].length;
    const before = analysis.text.slice(0, start).match(/\b((?:greige|griege|grey|finished|cuttable|CW|full|FW)(?:\s+width)?)\s*[:=]?\s*$/i);
    const after = analysis.text.slice(end).match(/^\s*((?:greige|griege|grey|finished|cuttable|CW|full|FW)(?:\s+width)?)\b/i);
    const begin = before ? start - before[0].length : start, finish = after ? end + after[0].length : end;
    const qualifier = before?.[1] || after?.[1];
    const fields: TextFields = { blend: "", count: "", construction: "", finish: "", colours: [], notes: "", warnings: [], evidence: [] };
    extractMeasurements(match[0], fields, true);
    const rawVal = fields.width ? fields.width.replace(/\s*(?:inches|inch|in|")\s*$/i, "").trim() : "";
    const span = analysis.span(begin, finish);
    return { ...span, text: source.slice(span.start, span.end), value: rawVal,
      basis: qualifier && /greige|griege|grey/i.test(qualifier) ? "greige" : qualifier && /finished|cuttable|\bcw\b/i.test(qualifier) ? "finished" : qualifier && /full|\bfw\b/i.test(qualifier) ? "full" : "unqualified",
      qualifier: qualifier ? analysis.phrase(before ? begin : end + after![0].indexOf(after![1]), before ? begin + before[1].length : finish) : undefined };
  });
}

export function qualifyPlainWidths(analysis: TextAnalysis, fields: TextFields) {
  const facts = widthPhrases(analysis.remaining());
  if (!facts.length) return;
  const greigeFacts = facts.filter(fact => fact.basis === "greige");
  const finishedFacts = facts.filter(fact => fact.basis === "finished");
  if (!greigeFacts.length && !finishedFacts.length) return;

  fields.warnings = fields.warnings.filter(warning => !warning.startsWith("width:"));

  if (finishedFacts.length) {
    if (finishedFacts.every(fact => fact.value && fact.value === finishedFacts[0].value)) {
      fields.width = `${finishedFacts[0].value} inches`;
    } else {
      fields.warnings.push("Conflicting finished/cuttable widths; confirm the intended value.");
    }
  } else if (greigeFacts.length) {
    if (greigeFacts.every(fact => fact.value && fact.value === greigeFacts[0].value)) {
      fields.width = `${greigeFacts[0].value} inches`;
    } else {
      fields.warnings.push("Conflicting greige widths; confirm the intended value.");
    }
  }

  fields.evidence = fields.evidence.filter(item => item.field !== "width");
  for (const fact of facts) {
    fields.evidence.push({
      field: "width",
      start: fact.start,
      end: fact.end,
      text: fact.text,
      kind: "explicit",
      unit: "inches",
      ...(fact.value ? { value: parseFloat(fact.value) } : {}),
      reason: fact.basis === "greige" ? "greige width" : fact.basis === "finished" ? "finished width" : undefined,
    });
  }
}

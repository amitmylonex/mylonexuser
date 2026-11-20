import type { TextAnalysis } from "./analysis";
import { FIBRE_PATTERN, fibreName } from "./fibres";
import { FIBRE_MODIFIERS_PATTERN } from "./composition";

export type AlternativeFibreRow = {
  id: string;
  description: string;
  fibre?: string;
  percentage: string;
};

export type SourcingAlternative = {
  id: string;
  label: string;
  rawText: string;
  description: string;
  fibre?: string;
  percentage?: string;
  rows?: AlternativeFibreRow[];
  qualifierNote?: string;
};

/** Numbered OPTION clauses are choices within a fabric, not chosen field values. */
export function reserveAlternatives(analysis: TextAnalysis) {
  const markers = analysis.tokens.filter((token, index) => token.text === "option" && analysis.tokens[index + 1]?.kind === "number");
  if (markers.length < 2) return false;
  const inline = inlineOptions(analysis.text);
  for (let index = 0; index < markers.length; index++) {
    let end: number;
    if (markers[index + 1]) {
      end = markers[index + 1].start;
    } else {
      const rest = analysis.text.slice(markers[index].start);
      const nextLineBreak = rest.search(/\r?\n(?!\s{2,})/);
      end = nextLineBreak >= 0 ? markers[index].start + nextLineBreak : analysis.text.length;
    }
    const choice = inline.find(item => item.start === markers[index].start);
    if (choice) end = choice.end;
    analysis.claim(analysis.evidence({ field: "alternatives", start: markers[index].start, end, text: "", kind: "unresolved",
      reason: "An OPTION alternative is retained for buyer selection; it was not assigned to a field." }));
  }
  return true;
}

// Inline “OPTION 1: blend or OPTION 2: blend, weave, ...” lists choices
// before the shared fabric specs. Keep the multiline option scope intact.
function inlineOptions(text: string) {
  const pair = /\b(option[ \t]+\d+:[ \t]*[^,;\r\n]+?)[ \t]+or[ \t]+(option[ \t]+\d+:[ \t]*[^,;\r\n]+)/gi;
  return [...text.matchAll(pair)].flatMap(match => {
    const first = match.index!, second = first + match[0].lastIndexOf(match[2]);
    return [{ start: first, end: first + match[1].length }, { start: second, end: second + match[2].length }];
  });
}

export function detectSourcingAlternatives(text: string): SourcingAlternative[] {
  const inline = inlineOptions(text);
  const lines = inline.length ? inline.map(({start, end}) => text.slice(start, end)) : text.split(/(?:\r?\n|;|\s*–\s*(?=OPTION\b))/i);
  const results: SourcingAlternative[] = [];
  const optionRegex = /^[ \t]*(OPTION\s+[0-9A-Z]+)[:\s.-]*(.*)$/i;

  for (let i = 0; i < lines.length; i++) {
    const match = lines[i].match(optionRegex);
    if (!match) continue;
    const label = match[1].trim().toUpperCase();
    const rawText = lines[i].trim();
    const description = match[2].trim().replace(/[.;]+$/, "");

    // 1. Multiple percentage-fibre pairs: e.g. "80% cotton / 20% recycled polyester"
    const pctMatches = [...description.matchAll(/(\d+(?:\.\d+)?)\s*%\s*[,/;-]?\s*([a-zA-Z\s-]+?)(?=\s*(?:[/,;+]\s*)?\d+(?:\.\d+)?\s*%|$)/gi)];
    if (pctMatches.length > 1) {
      const rows: AlternativeFibreRow[] = pctMatches.map((m, rIdx) => {
        const pct = m[1];
        const desc = m[2].trim().replace(/^[/,;+-]+|[/,;+-]+$/g, "").trim();
        const fibreMatch = desc.match(new RegExp(`\\b(${FIBRE_PATTERN})\\b`, "i"));
        const fibre = fibreMatch ? fibreName(fibreMatch[1]) : undefined;
        const cleanDesc = desc ? desc.charAt(0).toUpperCase() + desc.slice(1) : (fibre || "Fibre");
        return {
          id: `alt-${results.length + 1}-fibre-${rIdx + 1}`,
          description: cleanDesc,
          fibre,
          percentage: pct,
        };
      });

      results.push({
        id: `option-${results.length + 1}`,
        label: `Alternative ${results.length + 1}`,
        rawText,
        description: rows.map(r => `${r.percentage}% ${r.description}`).join(" / "),
        rows,
        qualifierNote: `${label} specification: ${description}`,
      });
      continue;
    }

    // 2. Percentage-first with optional modifiers: e.g. "100% organic cotton", "100% GOTS NOP-certified organic cotton"
    const pctMatch = description.match(new RegExp(`(\\d+(?:\\.\\d+)?)\\s*%\\s*[,/;-]?\\s*${FIBRE_MODIFIERS_PATTERN}(${FIBRE_PATTERN})\\b`, "i"));
    if (pctMatch) {
      const percentage = pctMatch[1];
      const fibre = fibreName(pctMatch[2]);
      const cleanDesc = description.replace(new RegExp(`^\\s*${percentage}\\s*%\\s*[,/;-]?\\s*`, "i"), "").trim();
      const displayDesc = cleanDesc ? cleanDesc.charAt(0).toUpperCase() + cleanDesc.slice(1) : fibre;
      const hasOrganic = /organic|gots|nop/i.test(description);
      const qualifierNote = hasOrganic 
        ? `Organic requirement preserved: ${description}`
        : `${label} specification: ${description}`;
      results.push({
        id: `option-${results.length + 1}`,
        label: `Alternative ${results.length + 1}`,
        rawText,
        description: displayDesc,
        fibre,
        percentage,
        rows: [{
          id: `alt-${results.length + 1}-fibre-1`,
          description: displayDesc,
          fibre,
          percentage,
        }],
        qualifierNote,
      });
      continue;
    }

    // 3. Fibre without percentage or with unstated percentage: e.g. "BCI cotton", "Regen Agri Cotton"
    const fibreMatch = description.match(new RegExp(`\\b(${FIBRE_PATTERN})\\b`, "i"));
    if (fibreMatch) {
      const fibre = fibreName(fibreMatch[1]);
      const isBci = /bci/i.test(description);
      const qualifierNote = isBci
        ? `BCI cotton requirement (unstated percentage to be confirmed): ${description}`
        : `${label} requirement (unstated percentage to be confirmed): ${description}`;
      results.push({
        id: `option-${results.length + 1}`,
        label: `Alternative ${results.length + 1}`,
        rawText,
        description: description.trim(),
        fibre,
        percentage: "", // Explicitly unstated!
        rows: [{
          id: `alt-${results.length + 1}-fibre-1`,
          description: description.trim(),
          fibre,
          percentage: "",
        }],
        qualifierNote,
      });
      continue;
    }

    // Generic fallback
    results.push({
      id: `option-${results.length + 1}`,
      label: `Alternative ${results.length + 1}`,
      rawText,
      description: description.trim(),
      percentage: "",
      rows: [{
        id: `alt-${results.length + 1}-fibre-1`,
        description: description.trim(),
        percentage: "",
      }],
      qualifierNote: `${label}: ${description}`,
    });
  }

  return results.length >= 2 ? results : [];
}

export type AlternativesBlendAnalysis = {
  commonFibre?: string;
  commonPercentage?: string;
  conflict: boolean;
  alts: { fibre?: string; percentage?: string }[];
};

export function analyzeAlternativesComposition(alternatives: SourcingAlternative[]): AlternativesBlendAnalysis {
  if (!alternatives.length) return { conflict: false, alts: [] };

  const parsed = alternatives.map(alt => {
    if (alt.rows && alt.rows.length > 1) {
      return { fibre: alt.rows.map(r => r.fibre || r.description).join(" / "), percentage: alt.rows.map(r => r.percentage).join("/") };
    }
    let fibre = alt.fibre;
    let percentage = alt.percentage;
    if (!fibre) {
      const m = alt.description.match(new RegExp(`\\b(${FIBRE_PATTERN})\\b`, "i"));
      if (m) fibre = fibreName(m[1]);
    }
    return { fibre, percentage: percentage ?? "" };
  });

  const fibres = parsed.map(p => p.fibre).filter(Boolean) as string[];
  const uniqueFibres = new Set(fibres.map(f => f.toLowerCase()));
  if (fibres.length !== alternatives.length || uniqueFibres.size > 1) {
    return { conflict: true, alts: parsed };
  }

  const commonFibre = fibres[0];
  const percentages = parsed.map(p => p.percentage);
  const allHaveSamePercentage = percentages.every(p => p && p === percentages[0]);
  const commonPercentage = allHaveSamePercentage ? percentages[0] : undefined;

  return {
    commonFibre,
    commonPercentage,
    conflict: false,
    alts: parsed,
  };
}

export type AlternativesValidation = {
  state: "complete" | "prompt" | "error";
  summary: string;
  error?: string;
};

export function validateAlternatives(alternatives: SourcingAlternative[]): AlternativesValidation {
  if (!alternatives.length) return { state: "prompt", summary: "Add fibre names and percentages." };

  const analysis = analyzeAlternativesComposition(alternatives);
  if (analysis.conflict) {
    return {
      state: "prompt",
      summary: "Alternatives have differing fibres. Select an alternative or confirm the intended fibre.",
    };
  }

  for (let i = 0; i < alternatives.length; i++) {
    const alt = alternatives[i];
    const rows = alt.rows && alt.rows.length > 0
      ? (alt.rows.length === 1 && alt.percentage !== undefined
          ? [{ ...alt.rows[0], percentage: alt.percentage, description: alt.description || alt.rows[0].description }]
          : alt.rows)
      : [{
          id: `${alt.id}-1`,
          description: alt.description,
          percentage: alt.percentage ?? "",
        }];

    for (const r of rows) {
      const pct = r.percentage?.trim();
      if (pct) {
        const num = Number(pct);
        if (isNaN(num) || num < 0 || num > 100) {
          return {
            state: "error",
            summary: `Alternative ${i + 1}: percentage must be between 0 and 100%`,
            error: `Alternative ${i + 1}: percentages cannot exceed 100%.`,
          };
        }
      }
    }

    const hasUnstated = rows.some(r => !r.percentage?.trim());
    if (hasUnstated) {
      return {
        state: "prompt",
        summary: `1 alternative has unstated percentage. Confirm 100% per alternative.`,
      };
    }

    const altSum = rows.reduce((sum, r) => sum + Number(r.percentage || 0), 0);
    if (altSum > 100) {
      return {
        state: "error",
        summary: `Alternative ${i + 1}: percentages total ${altSum}%, which exceeds 100%`,
        error: `Alternative ${i + 1}: percentages cannot exceed 100%.`,
      };
    }
    if (altSum < 100) {
      return {
        state: "prompt",
        summary: `Alternative ${i + 1}: percentages total ${altSum}%. Complete rows to reach 100%.`,
      };
    }
  }

  return {
    state: "complete",
    summary: "All alternatives confirmed at 100% · Complete",
  };
}

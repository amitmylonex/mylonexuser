import type { TextAnalysis } from "../../../../../src/domains/rfq/text/analysis";
import type { NumericPair } from "../../../../../src/domains/rfq/text/technical-phrases";
import { canonicalBlend, sourceComposition } from "../../../../../src/domains/rfq/text/ai-grounding";
import { parseBlendRows, fibreKey } from "../../../../../src/domains/rfq/blend/rows";
import { fibreName } from "../../../../../src/domains/rfq/text/fibres";
import type { RfqLine } from "./draft";

function isCompatibleBlend(overall: string, yarnBlend: string): boolean {
  if (canonicalBlend(overall).value === yarnBlend) return true;
  const p1 = parseBlendRows(overall).rows;
  const p2 = parseBlendRows(yarnBlend).rows;
  if (p1.length !== p2.length) return false;
  const base = (k: string) => fibreKey(k).toLowerCase().replace(/^(?:recycled?\s*|recycle\s*)/, "");
  return p1.every((r1, i) => {
    const r2 = p2[i];
    const b1 = base(r1.fibre);
    const b2 = base(r2.fibre);
    return b1 === b2 && r1.percentage.trim() === r2.percentage.trim();
  });
}

/** Directional compositions are separate statements, never additive percentages. */
export function applyPlainYarns(analysis: TextAnalysis, pairs: NumericPair[], line: RfqLine) {
  const seen = new Set<number>();
  const yarns = pairs.flatMap(pair => pair.yarns || []).filter(span => {
    if (seen.has(span.start)) return false;
    seen.add(span.start); return true;
  }).map(span => ({ span, source: analysis.phrase(span.start, span.end) }))
    .map(yarn => ({ ...yarn, blend: canonicalBlend(sourceComposition(yarn.source)) }));

  const hasYarnFibres = yarns.some(yarn => yarn.blend.rows.some(row => row.fibre !== "" || row.percentage !== ""));
  if (!hasYarnFibres) return [];

  if (yarns.some(yarn => yarn.blend.rows.some(row => row.percentage !== ""))) {
    const values = new Set(yarns.map(yarn => yarn.blend.value));
    if (yarns.length === 2 && values.size === 1 && yarns.every(yarn => yarn.blend.state === "complete")) {
      if (!line.blend) {
        line.blend = yarns[0].blend.value;
      } else if (isCompatibleBlend(line.blend, yarns[0].blend.value)) {
        // The separate fabric-level statement is authoritative and may provide more detailed sourcing wording.
        // Retain line.blend without conflict.
      } else {
        line.blend = "";
        line.warnings.push("Explicit overall and yarn compositions conflict; confirm the intended blend.");
      }
    } else {
      if (!line.blend) {
        line.blend = "";
        line.warnings.push("Warp/weft compositions differ or need confirmation. Overall composition was not averaged or added.");
      }
    }
  } else {
    // Directional yarns present without percentage blends (e.g. Case B when percentages are explicitly noted as unavailable)
    const hasUnstatedBlendNarrative = /\b(?:percentages?\s+not\s+available|not\s+available|to\s+be\s+confirmed|tbc|tba|details\s+awaited|please\s+confirm)\b/i.test(line.original || "");
    if (hasUnstatedBlendNarrative && (!line.blend || !line.blend.includes("%"))) {
      const fibreWords = /\b(?:poly(?:ester)?|cotton|viscose|nylon|linen|bamboo|silk|modal|tencel|lyocell|lyocel|elastane|spandex|acrylic|wool|rayon)\b/gi;
      const namedFibres = new Set<string>();
      for (const y of yarns) {
        for (const m of y.source.matchAll(fibreWords)) {
          namedFibres.add(fibreName(m[0]));
        }
      }
      if (namedFibres.size > 0) {
        line.blend = [...namedFibres].join(" / ");
        line.blendRows = [...namedFibres].map((f, i) => ({ id: `fibre-${i}`, fibre: f, percentage: "" }));
        line.blendLegacyText = line.blendLegacyText || "Blend percentages not available";
        if (!line.warnings.some(w => /fibre percentages|named fibres/i.test(w))) {
          line.warnings.push("Confirm fibre percentages. Named fibres do not imply purity or proportions.");
        }
      }
    } else if (!line.blend) {
      line.blend = "";
      line.warnings.push("Warp/weft compositions differ or need confirmation. Overall composition was not averaged or added.");
    }
  }
  for (const yarn of yarns) analysis.claim(analysis.evidence({ field: "blend", ...yarn.span, text: "",
    kind: line.blend ? "explicit" : "unresolved", reason: line.blend ? undefined : "Directional composition retained separately for review." }), ["count"]);
  return yarns.map((yarn, index) => {
    const cleanSource = yarn.source.replace(/^(?:warp|weft)\s*[:=-]\s*/i, "").trim();
    return `${index === 0 ? "Warp" : "Weft"} yarn source: ${cleanSource}`;
  });
}

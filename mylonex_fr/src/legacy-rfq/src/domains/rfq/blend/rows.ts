import { z } from "zod";
import { FIBRES } from "../text/fibres";
import { orderedCompositions } from "../text/composition-lists";
import { TextAnalysis } from "../text/analysis";

export const fibreRowSchema = z.object({ id: z.string(), fibre: z.string(), percentage: z.string() });
export type FibreRow = z.infer<typeof fibreRowSchema>;
export type BlendRows = { rows: FibreRow[]; legacyText?: string };
const normalize = (text: string) => text.normalize("NFKC").normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().replace(/\s+/g, " ").trim();
export function fibreKey(text: string): string {
  const parts = text.split(/\s*[/]\s*/).map(normalize);
  const keys = parts.map(part => {
    if (/^rpe[st]$/.test(part)) return "recycled polyester";
    if (/^(?:recycled?\s*poly(?:ester)?|recycle\s*poly)$/i.test(part)) return "recycled polyester";
    return Object.entries(FIBRES).find(([, aliases]) => aliases.some(alias => normalize(alias) === part))?.[0];
  });
  return keys.every(Boolean) && new Set(keys).size === 1 ? keys[0]! : normalize(text);
}
export const FIBRE_SUGGESTIONS = [...Object.keys(FIBRES), "Elastane", "Lycra / Elastane", "Recycled Polyester"];
const row = (fibre: string, percentage = "", index = 0): FibreRow => ({ id: `fibre-${index}`, fibre: fibre.trim(), percentage: percentage.trim() });
const clean = (text: string) => text.replace(/^[\s,;|/]+|[\s,;|/]+$/g, "").trim();
const technicalOrUncertain = /[?~]|\b(?:or|either|about|approximately|approx|roughly|gsm|inches|width|twill|weave|count|days|price)\b/i;
const number = "[+-]?(?:\\d+(?:\\.\\d+)?|\\.\\d+)";

/** Parse only supported, unambiguous string forms. Never infer purity or discard a remainder. */
export function parseBlendRows(text: string): BlendRows {
  if (!text.trim()) return { rows: [row("")] };
  const legacy = (): BlendRows => ({ rows: [row("")], legacyText: text });
  if (technicalOrUncertain.test(text)) return legacy();
  const normalized = new TextAnalysis(text).text;
  const lists = orderedCompositions(normalized);
  if (lists.length === 1 && !lists[0].review && /^[\s()[\]]*$/.test(normalized.slice(0, lists[0].start)) &&
    /^[\s()[\]]*$/.test(normalized.slice(lists[0].end))) {
    return { rows: lists[0].components.map((component, index) => row(component.displayName, component.percentage, index)) };
  }
  const ratio = text.trim().match(new RegExp(`^(${number}(?:\\s*/\\s*${number})+)\\s*(.*)$`));
  if (ratio) {
    return legacy();
  }
  const percents = [...text.matchAll(new RegExp(`(${number})\\s*%`, "g"))];
  if (percents.length) {
    const prefix = !clean(text.slice(0, percents[0].index));
    const rows = percents.map((match, i) => {
      const name = prefix ? text.slice(match.index! + match[0].length, percents[i + 1]?.index ?? text.length)
        : text.slice(i ? percents[i - 1].index! + percents[i - 1][0].length : 0, match.index);
      const label = percents.length > 1 ? clean(name).replace(/^and\s+|\s+and$/gi, "") : clean(name);
      return row(displayName(label), match[1], i);
    });
    if ((!prefix && clean(text.slice(percents[percents.length - 1].index! + percents[percents.length - 1][0].length))) || rows.some(value => /[\d%]/.test(value.fibre) && !Object.keys(FIBRES).includes(fibreKey(value.fibre)))) return legacy();
    return { rows };
  }
  if (/[\d%]/.test(text)) return legacy();
  // Recognize a complete alias (including Lycra / Elastane) as one component.
  if (Object.keys(FIBRES).includes(fibreKey(text))) return { rows: [row(displayName(text))] };
  const narrative = /\b(?:percentages?\s+not\s+available|not\s+available|to\s+be\s+confirmed|tbc|tba|tbd|unknown|not\s+known|details\s+awaited|please\s+confirm|confirm)\b/i;
  if (narrative.test(text)) return legacy();
  const separated = text.split(/\s*[,;|/]\s*|\s+-\s+|-/).map(clean).filter(Boolean);
  if (separated.length > 1) {
    if (separated.some(part => narrative.test(part))) return legacy();
    return { rows: separated.map((name, i) => row(displayName(name), "", i)) };
  }
  const words = text.trim().split(/\s+/).filter(word => word.toLowerCase() !== "and");
  if (words.length > 1 && words.every(word => Object.keys(FIBRES).includes(fibreKey(word))))
    return { rows: words.map((word, i) => row(displayName(word), "", i)) };
  // A single custom fibre name is editable without inventing a percentage.
  return { rows: [row(displayName(text))] };
}
function displayName(name: string) {
  const key = fibreKey(name);
  if (key === "Spandex") return name.trim().includes("/") ? name.trim() : name.trim().replace(/^./, char => char.toUpperCase());
  if (key === "recycled polyester") return "Recycled Polyester";
  return Object.keys(FIBRES).includes(key) ? key : name;
}
export function serializeBlend(rows: FibreRow[], canonical = false): string {
  return rows.map(value => {
    const name = canonical && Object.keys(FIBRES).includes(fibreKey(value.fibre)) ? fibreKey(value.fibre) : value.fibre.trim();
    return `${value.percentage.trim() ? `${value.percentage.trim()}% ` : ""}${name}`.trim();
  }).join(" ");
}

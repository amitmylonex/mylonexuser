import { fibreKey, type FibreRow } from "./rows.js";
export const BLEND_PERCENTAGE_ERROR = "Blend percentages cannot exceed 100%.";
export type BlendPercentages = { state: "prompt" | "incomplete" | "complete" | "error"; total: string | null; remaining: string | null; summary: string; error: string | null };
const decimal = (value: bigint, places: number) => {
  if (!places) return value.toString();
  const digits = value.toString().padStart(places + 1, "0");
  const fraction = digits.slice(-places).replace(/0+$/, "");
  return digits.slice(0, -places) + (fraction ? `.${fraction}` : "");
};
export function validateBlendRows(rows: FibreRow[], legacyText?: string): BlendPercentages {
  const valid = (value: string) => value.length <= 30 && /^(?:\d+(?:\.\d+)?|\.\d+)$/.test(value);
  const percentages = rows.map(value => value.percentage.trim());
  const invalid = percentages.some(value => value && !valid(value));
  const values = percentages.filter(value => valid(value));
  const places = Math.max(0, ...values.map(value => value.split(".")[1]?.length || 0));
  const totalUnits = values.reduce((sum, value) => {
    const [whole, fraction = ""] = value.split(".");
    return sum + BigInt((whole || "0") + fraction.padEnd(places, "0"));
  }, BigInt(0));
  const hundred = BigInt(100) * BigInt(10) ** BigInt(places);
  const total = decimal(totalUnits, places);
  const remaining = totalUnits <= hundred ? decimal(hundred - totalUnits, places) : null;
  const keys = rows.filter(value => value.fibre.trim()).map(value => fibreKey(value.fibre));
  const duplicate = new Set(keys).size !== keys.length;
  const error = totalUnits > hundred ? BLEND_PERCENTAGE_ERROR : invalid ? "Enter valid non-negative decimal percentages."
    : duplicate ? "Duplicate fibre components: combine or correct the rows without changing the stated total." : null;
  if (error) return { state: "error", total, remaining, summary: `${total}% / 100% · ${totalUnits > hundred ? "Above 100%" : "Check rows"}`, error };
  const filled = rows.length > 0 && rows.every(value => value.fibre.trim() && valid(value.percentage.trim()));
  if (filled && totalUnits === hundred && !legacyText) return { state: "complete", total, remaining, summary: "100% / 100% · Complete", error: null };
  if (!values.length) return { state: "prompt", total: null, remaining: null, summary: "Add fibre names and percentages.", error: null };
  return { state: "incomplete", total, remaining, summary: `${total}% / 100% · ${totalUnits === hundred ? legacyText ? "Review saved blend text" : "Incomplete rows" : `${remaining}% remaining`}`, error: null };
}

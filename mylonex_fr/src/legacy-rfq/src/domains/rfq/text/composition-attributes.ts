import { fibreName } from "./fibres";

export const FIBRE_MODIFIERS_PATTERN = "(?:(?:(?:pre|post)[- ]consumer|organic|bci|pscp|certified|gots(?:[- ]certified)?|nop(?:[- ]certified)?|grs|rcs|recycled|recycle|regenerated|regen(?:erative)?|combed|carded|compact|pima|supima|giza|icc|rco(?=\\s+(?:cotton|co|ctn)\\b)|ecovero|livaeco|tencel(?=\\s+(?:modal|lyocell)\\b)|virgin|pure|natural|bio)[\\w-]*\\s+)*";
const nonQualifiers = /\b(?:gsm|width|count|construction|const|density|weave|price|target|rate|delivery|qty|quantity|order|weight|inch|inches|mtrs|meters|metres|yards|kg|need|want|require|please|quote|greige|rfd|ready|dyed|twill|plain|satin|fabric|finish)\b/i;
export function cleanQualifier(raw?: string): string | undefined {
  if (!raw) return undefined;
  const value = raw.trim().split(/\s+/).filter(word => !/^(?:and|or|with|of|in|for|the|a|an)$/i.test(word)).join(" ");
  return value && !nonQualifiers.test(value) ? value : undefined;
}
export function resolveFibreCandidate(alias: string, rawQualifier?: string) {
  const baseFibre = fibreName(alias);
  const qualifier = cleanQualifier(rawQualifier);
  const recycled = /^rpe[st]$/i.test(alias) || !!qualifier && /\brecycl(?:e|ed)\b/i.test(qualifier);
  const displayName = recycled && /^(?:Polyester|Recycled Polyester)$/.test(baseFibre) ? "Recycled Polyester" : baseFibre;
  const qualifierNote = /^rco$/i.test(alias) ? `Cotton qualifier: ${[qualifier, "recycled (rCO)"].filter(Boolean).join("; ")}`
    : qualifier || /^rpe[st]$/i.test(alias) ? `${baseFibre === "Recycled Polyester" ? "Polyester" : baseFibre} qualifier: ${qualifier || `recycled (${/^rpes$/i.test(alias) ? "rPES" : "rPET"})`}` : undefined;
  return { baseFibre, displayName, qualifierNote };
}

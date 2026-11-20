// Shared natural-language fibre vocabulary; aliases never imply a percentage.
export const FIBRES: Record<string, readonly string[]> = {
  Cotton: ["cotton", "cot", "cott", "cotto", "cottn", "coton", "ctn", "cotn", "co", "rco"],
  Polyester: ["polyester", "poly", "polyestér", "polyster", "polyestr", "polies ter", "pes", "pet", "rpet", "rpes", "tery", "terylene", "pfy", "psf", "pl"],
  Viscose: ["viscose rayon", "viscose", "visc", "vis", "visco", "cv", "vi", "vfy", "vsf", "ryn"], Rayon: ["rayon"], Linen: ["linen", "flax", "lin", "li", "ln"], Bamboo: ["bamboo", "bam"],
  Spandex: ["spandex", "elastane", "lycra", "elastan", "spand ex", "spx", "spdx", "el", "ea", "lyc", "spndx", "pu", "p.u", "p.u.", "sp"], Nylon: ["nylon", "polyamide", "pa", "pa6", "pa66", "nyl", "nfy", "ny"],
  Silk: ["silk", "slk", "se", "tasar", "tussar", "tussore", "st"], Wool: ["wool", "wo", "wln"], Tencel: ["tencel", "tncl"], Lyocell: ["lyocell", "lyocel", "lycell", "lyo", "cly"], Modal: ["modal", "cmd", "mod"], Hemp: ["hemp", "ha"], Acrylic: ["acrylic", "acr", "pan"],
  Ramie: ["ramie", "ra"], Acetate: ["acetate", "ac", "ace", "ca"], Cupro: ["cupro", "cup"],
  Jute: ["jute", "ju"], Coir: ["coir", "cc"], Sisal: ["sisal", "si"], Abaca: ["abaca", "ab"], Kapok: ["kapok", "kp"],
  Mohair: ["mohair", "wm"], Cashmere: ["cashmere", "ws"], Angora: ["angora", "wa"], "Camel Hair": ["camel hair", "wk"],
  Alpaca: ["alpaca", "wp"], Vicuna: ["vicuna", "vicuña", "wg"], Yak: ["yak", "wy"], Melamine: ["melamine", "mel"],
  T400: ["t400"],
  Triacetate: ["triacetate", "cta"], Aramid: ["aramid", "ar"],
  Polypropylene: ["polypropylene", "pp"], Polyethylene: ["polyethylene", "pe"],
  Alginate: ["alginate", "alg"], Chlorofibre: ["chlorofibre", "clf"], Rubber: ["rubber", "elastodiene", "ed"],
  Elastolefin: ["elastolefin", "ele"], Multiester: ["multiester", "elastomultiester", "eme"], Modacrylic: ["modacrylic", "mac"],
  PBT: ["pbt"], PLA: ["polylactide", "pla"], PTT: ["ptt"], PTFE: ["ptfe"],
  Glass: ["glass", "glass fibre", "gf"], Carbon: ["carbon", "carbon fibre", "cf"], Metallic: ["metallic", "metal fibre", "metal", "mtf", "me", "met", "lurex", "zari"],
};
export const normalizeFibre = (text: string) => text.normalize("NFKC").normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().replace(/\s+/g, " ").trim();
export const FIBRE_PATTERN = Object.values(FIBRES).flat().sort((a, b) => b.length - a.length)
  .map(alias => alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\s+/g, "\\s+")).join("|");
export const fibreName = (alias: string) => /^(?:lycra|elastane|spandex)$/i.test(alias)
  ? alias.replace(/^./, value => value.toUpperCase())
  : /^rpe[st]$/i.test(alias) ? "Recycled Polyester"
  : Object.entries(FIBRES).find(([, values]) => values.some(value => normalizeFibre(value) === normalizeFibre(alias)))?.[0] || alias;

// Codes have meaning inside a composition expression, never as arbitrary prose.
export const contextualFibreCode = (alias: string) => /^(?:ptfe|t400|pl|pu|p\.u\.?|sp|ny|wp|mel|rco|pes|pet|pa|el|rpet|rpes|cotn|co|cv|vi|vfy|vsf|li|ln|bam|ea|lyc|spndx|pa6|pa66|nyl|nfy|slk|se|wo|wln|tncl|cly|cmd|mod|ha|acr|pan|ra|ac|ace|ca|cup|ju|cta|ar|pp|pe|tery|pfy|psf|alg|ryn|st|wa|wg|wk|wm|ws|wy|cc|si|ab|kp|clf|ed|ele|eme|mac|pbt|pla|ptt|gf|cf|mtf|me|met)$/i.test(alias);
export const BLEND_CODES: Record<string, readonly string[]> = {
  pc: ["Polyester", "Cotton"], pv: ["Polyester", "Viscose"], cp: ["Cotton", "Polyester"],
  cs: ["Cotton", "Spandex"], ps: ["Polyester", "Spandex"], ns: ["Nylon", "Spandex"],
  vl: ["Viscose", "Linen"], vs: ["Viscose", "Spandex"],
  pcs: ["Polyester", "Cotton", "Spandex"], pvs: ["Polyester", "Viscose", "Spandex"],
  tc: ["Polyester", "Cotton"], tr: ["Polyester", "Viscose"], trs: ["Polyester", "Viscose", "Spandex"],
  lc: ["Linen", "Cotton"], ct: ["Cotton", "Lyocell"], cm: ["Cotton", "Modal"], cvc: ["Cotton", "Polyester"],
};
export const BLEND_CODE_PATTERN = Object.keys(BLEND_CODES).sort((a, b) => b.length - a.length)
  .map(code => [...code].join("\\s*/?\\s*")).join("|");

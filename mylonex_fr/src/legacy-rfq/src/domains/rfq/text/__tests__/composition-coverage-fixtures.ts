export const orderedCompositions = [
  "63/34/3 poly-cotton-lyo", "poly-cotton-lyo 63/34/3", "63/34/3\npoly-cotton-lyo", "poly/cotton/lyo\n63/34/3",
  "Composition: poly / cotton / lyo\nRatio: 63 / 34 / 3", "Blend ratio: 63/34/3\nFibres: poly-cotton-lyo",
  "(poly/cotton/lyo) (63/34/3)", "63% / 34% / 3% polyester / cotton / lyocell",
  "poly-cotton-lyo 63-34-3", "poly/cotton/lyo = 63/34/3", "Polyester, Cotton, Lyocell: 63, 34, 3",
  "63/34/3 [poly/cotton/lyo]", "Polyester + Cotton + Lyocell: 63 + 34 + 3",
  "Composition: Polyester Cotton Lyocell 63 34 3", "６３／３４／３ poly－cotton－lyo",
];
export const aliasCases: [string, string][] = [
  ...["cotton", "cot", "cott", "cotto", "cottn", "coton", "ctn"].map(alias => [alias, "Cotton"] as [string, string]),
  ...["polyester", "poly", "polyster", "polyestr", "polies ter", "PES", "PET"].map(alias => [alias, "Polyester"] as [string, string]),
  ...["viscose", "visc", "vis", "visco", "viscose rayon"].map(alias => [alias, "Viscose"] as [string, string]),
  ...["elastane", "elastan", "spandex", "spand ex", "spx", "spdx", "lycra", "EL"].map(alias => [alias, "Spandex"] as [string, string]),
  ...["lyocell", "lyocel", "lycell", "lyo"].map(alias => [alias, "Lyocell"] as [string, string]),
  ["linen", "Linen"], ["flax", "Linen"], ["nylon", "Nylon"], ["polyamide", "Nylon"], ["PA", "Nylon"],
  ["acrylic", "Acrylic"], ["modal", "Modal"], ["wool", "Wool"], ["silk", "Silk"], ["hemp", "Hemp"],
  ["ramie", "Ramie"], ["acetate", "Acetate"], ["cupro", "Cupro"], ["rayon", "Rayon"], ["bamboo", "Bamboo"],
];
export const completeCompositionInquiry = (phrase: string) => `Please quote ${phrase}; 2/1 Twill; Count: 30s x 30s; Construction: 100 x 72; 180 GSM; 58 inches width; Order 3000 mtrs in navy, made to order.`;
export const EXACT_ORDERED_INQUIRY = 'Need 63/34/3 poly-cotton-lyo, 2/1 twill,\n30s x 30s / 100 x 72, 180 GSM, 58" width.\nOrder 3000 mtrs in navy, made to order.';

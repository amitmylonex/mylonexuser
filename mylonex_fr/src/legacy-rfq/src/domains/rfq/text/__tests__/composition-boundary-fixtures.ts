export const compositionFailures = [
  {
    id: "A",
    source: "Please quote poly-cotton-lyo 63/34/3. Plain weave, 150 GSM,\n58 inches, black, 2000 metres, running production.",
    phrase: "poly-cotton-lyo 63/34/3",
    pairs: [["Polyester", "63"], ["Cotton", "34"], ["Lyocell", "3"]],
    weave: "Plain", gsm: 150, width: "58", quantity: 2000,
  },
  {
    id: "B",
    source: 'Need cot/poly/spx 60/37/3, 3/1 drill, 240 GSM,\n60" cuttable width. Beige, 1800 metres, made to order.',
    phrase: "cot/poly/spx 60/37/3",
    pairs: [["Cotton", "60"], ["Polyester", "37"], ["Spandex", "3"]],
    weave: "3/1 Drill", gsm: 240, width: "60", quantity: 1800,
  },
  {
    id: "C",
    source: "Composition: polyester/cotton/lyocell/spandex = 45/30/22/3.\nNeed 2/2 twill, 210 GSM, 60 inches, charcoal,\n3500 metres, made to order.",
    phrase: "polyester/cotton/lyocell/spandex = 45/30/22/3",
    pairs: [["Polyester", "45"], ["Cotton", "30"], ["Lyocell", "22"], ["Spandex", "3"]],
    weave: "2/2 Twill", gsm: 210, width: "60", quantity: 3500,
  },
];

export const requestedOrderedForms: [string, string[][]][] = [
  ["80:20 cot lin", [["Cotton", "80"], ["Linen", "20"]]],
  ["80:20 lin cot", [["Linen", "80"], ["Cotton", "20"]]],
  ["55:45 lin:cot", [["Linen", "55"], ["Cotton", "45"]]],
  ["55 45 cot lin", [["Cotton", "55"], ["Linen", "45"]]],
  ["55 45\ncot lin", [["Cotton", "55"], ["Linen", "45"]]],
  ...["cot spx\n45 55", "cot:spx\n45 55", "cot spx\n45:55", "cot spx\n45 :55", "cot spx\n45: 55"].map(phrase => [phrase, [["Cotton", "45"], ["Spandex", "55"]]] as [string, string[][]]),
  ...["Blend: cot lin = 80:20", "Cotton:Linen (80:20)", "80 / 20 cotton linen", "cot + lin: 80 + 20"].map(phrase => [phrase, [["Cotton", "80"], ["Linen", "20"]]] as [string, string[][]]),
  ["62.5 34.5 3 poly cot spx", [["Polyester", "62.5"], ["Cotton", "34.5"], ["Spandex", "3"]]],
  ["poly cot lyo\n63 : 34 : 3", [["Polyester", "63"], ["Cotton", "34"], ["Lyocell", "3"]]],
];

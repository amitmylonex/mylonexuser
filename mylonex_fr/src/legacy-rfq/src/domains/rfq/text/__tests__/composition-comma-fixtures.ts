export const buyerCommaForms: [string, string[][]][] = [
  ["55,45 cot poly", [["Cotton", "55"], ["Polyester", "45"]]],
  ["55, 45 cot, poly", [["Cotton", "55"], ["Polyester", "45"]]],
  ...["cot, poly 97 3", "cot , poly 97 3", "cot,poly 97 3", "cot ,poly 97,3", "cot, poly\n97 3"].map(phrase =>
    [phrase, [["Cotton", "97"], ["Polyester", "3"]]] as [string, string[][]]),
  ["lin , lyocel\n55,45", [["Linen", "55"], ["Lyocell", "45"]]],
  ["97 3 viscose rayon, spdx", [["Viscose", "97"], ["Spandex", "3"]]],
  ["55, 45 silk , wool", [["Silk", "55"], ["Wool", "45"]]],
  ["modal,hemp,PA 50, 30,20", [["Modal", "50"], ["Hemp", "30"], ["Nylon", "20"]]],
  ["acetate ,cupro,ramie,spx 40 30 27 3", [["Acetate", "40"], ["Cupro", "30"], ["Ramie", "27"], ["Spandex", "3"]]],
];
export const decimalCommaForms: [string, string[][]][] = [
  ["cot, poly 62,5/37,5", [["Cotton", "62.5"], ["Polyester", "37.5"]]],
  ["62,5 34,5 3 poly, cot, spx", [["Polyester", "62.5"], ["Cotton", "34.5"], ["Spandex", "3"]]],
  ["62,5% cotton / 37,5% polyester", [["Cotton", "62.5"], ["Polyester", "37.5"]]],
  ["Cotton 62,5%, Polyester 37,5%", [["Cotton", "62.5"], ["Polyester", "37.5"]]],
  ["cot, poly 62,5%,37,5%", [["Cotton", "62.5"], ["Polyester", "37.5"]]],
];
export const ambiguousCommaForms = [
  "cot, poly 60,20,20", "cot, poly, spx 50,25,25,0", "cot, poly 62,5,37,5", "cot, poly 62,5, 37,5, 3",
  "cot, poly 60, 20, 20", "cot, poly 97", "cot, poly, unknown-fibre 97,3",
  "55,45 cot, unknown-fibre", "cot, poly 55,45 or 60,40", "cot, poly Count: 55,45",
  "cot, poly 30s x 30s / 100 x 72", "cot, poly 2/1 twill", "cot, poly 165.1 cm",
  "62, 5% cotton / 37, 5% polyester", "Cotton 62, 5%, Polyester 37, 5%", "62,5,3% cotton / polyester",
];
export const commaInquiry = (phrase: string) => `Please quote ${phrase}, 3/1 drill, 220 GSM, 60 inches width, navy, 2500 metres, made to order.`;

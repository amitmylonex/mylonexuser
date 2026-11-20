import { inactiveMention } from "./intent.js";
import { widthPhrases } from "./width-phrases.js";

export function supplyStates(text: string, plainPaste = false): { match: RegExpMatchArray; value: "rfd" | "greige" | "printed" | "dyed" | "finished" }[] {
  const widths = widthPhrases(text);
  return [...text.matchAll(/\b(?:(?:fabric\s+)?state\s*[:=]\s*finished|^finished$|ready\s+for\s+dyeing|prepared\s+for\s+dyeing|RFD|PFD|greige|griege|grey|GRG|loomstate|dyed|printed|PFP|RFP|Y\s*\/\s*D|YD|S\s*\/\s*D|P\s*\/\s*D|AOP)\b/gi)]
    .filter(match => {
      const start = match.index!, end = start + match[0].length;
      if (inactiveMention(text, start, end)) return false;
      const width = widths.find(w => w.start <= start && start < w.end && w.qualifier);
      if (width && !(plainPaste && width.end === end && /^gr(?:ei|ie)ge$/i.test(match[0])
        && /^\s+\d[\d,.]*\s*(?:m|meters?|metres?|mtrs?)\b/i.test(text.slice(end)))) return false;
      const before = text.slice(Math.max(0, start - 40), start);
      if (/\b(?:print base|base|colou?r|shade)\s*[:=]?\s*$/i.test(before)) return false;
      if (/^YD$/i.test(match[0]) && /\d\s*$/i.test(before)) return false;
      return true;
    }).map(match => ({ match, value: /\bfinished\b/i.test(match[0]) ? "finished"
      : /rfd|pfd|(?:ready|prepared)\s+for\s+dyeing/i.test(match[0]) ? "rfd"
      : /greige|griege|grey|grg|loomstate/i.test(match[0]) ? "greige"
        : /pfp|rfp|^printed$|aop/i.test(match[0]) ? "printed" : "dyed" }));
}

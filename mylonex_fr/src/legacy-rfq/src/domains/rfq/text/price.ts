export type CurrencyCode = "INR" | "USD" | "EUR" | "GBP";

export type CurrencyInfo = {
  code?: CurrencyCode;
  symbol: string;
  isAmbiguousSymbol?: boolean;
  name: string;
};

export const CURRENCY_REGISTRY: Record<string, CurrencyInfo> = {
  inr: { code: "INR", symbol: "₹", name: "Indian Rupee" },
  rs: { code: "INR", symbol: "₹", name: "Indian Rupee" },
  "rs.": { code: "INR", symbol: "₹", name: "Indian Rupee" },
  rupee: { code: "INR", symbol: "₹", name: "Indian Rupee" },
  rupees: { code: "INR", symbol: "₹", name: "Indian Rupee" },
  "₹": { code: "INR", symbol: "₹", name: "Indian Rupee" },
  usd: { code: "USD", symbol: "$", name: "US Dollar" },
  eur: { code: "EUR", symbol: "€", name: "Euro" },
  euro: { code: "EUR", symbol: "€", name: "Euro" },
  euros: { code: "EUR", symbol: "€", name: "Euro" },
  "€": { code: "EUR", symbol: "€", name: "Euro" },
  gbp: { code: "GBP", symbol: "£", name: "British Pound" },
  pound: { code: "GBP", symbol: "£", name: "British Pound" },
  pounds: { code: "GBP", symbol: "£", name: "British Pound" },
  "£": { code: "GBP", symbol: "£", name: "British Pound" },
  // Standalone '$' is an ambiguous symbol (USD, CAD, AUD, NZD, etc.)
  "$": { code: undefined, symbol: "$", isAmbiguousSymbol: true, name: "Dollar (unresolved currency)" },
};

/**
 * Currency symbol and code patterns.
 * Explicit currency codes (INR, USD, EUR, GBP) take priority over bare symbols.
 */
export const CURRENCY_SYMBOL_PATTERN = "(?:₹|\\$|€|£|Rs\\.?|Rupees?|INR|USD|EUR|GBP)";

export const TARGET_PRICE_LABEL =
  "(?:(?:indicative\\s+)?(?:our\\s+)?(?:target\\s+(?:fabric\\s+)?price|target\\s+(?:fabric\\s+)?rate|budget\\s+price|buying\\s+target|expected\\s+price|expected\\s+rate|looking\\s+at|our\\s+target|our\\s+budget|target|budget))";

export const PRICE_NUMBER_PATTERN =
  "(?:\\d{1,2}(?:,\\d{2})+,\\d{3}(?:\\.\\d{1,2})?|\\d{1,3}(?:[.,]\\d{3})+(?:[.,]\\d{1,2})?|\\d+(?:[.,]\\d+)?)(?:k)?";

export type PriceBasis = "per_metre" | "per_yard" | "per_kg" | "per_piece" | "per_roll" | "unspecified";

/**
 * Parses numeric price string handling:
 * - standard decimal: 200.50
 * - European comma decimal: EUR 200,50 -> 200.5, EUR 1.200,50 -> 1200.5
 * - Indian grouping: INR 1,20,000 -> 120000
 * - US/UK grouping: USD 1,200.50 -> 1200.5
 * - price shorthand: 1.2k -> 1200
 */
export function parsePriceNumber(raw: string | undefined, currencyCode?: CurrencyCode | string): number | undefined {
  if (!raw) return undefined;
  let clean = raw.trim();

  // Multiplier shorthand: e.g. 1.2k, 12k
  let multiplier = 1;
  if (/k$/i.test(clean)) {
    multiplier = 1000;
    clean = clean.replace(/k$/i, "").trim();
  }

  // European format: dot as thousands separator and comma as decimal separator
  const isEuroLocale = currencyCode === "EUR" || /€/i.test(currencyCode || "");
  const hasEuroCommaDecimal = /^\d{1,3}(?:\.\d{3})+,\d{1,2}$/.test(clean);
  const hasSimpleCommaDecimal = /^\d+,\d{1,2}$/.test(clean) && (isEuroLocale || !clean.includes("."));

  if (hasEuroCommaDecimal || (isEuroLocale && hasSimpleCommaDecimal)) {
    clean = clean.replace(/\./g, "").replace(/,/g, ".");
  } else {
    // Standard / Indian: remove comma grouping
    clean = clean.replace(/,/g, "");
  }

  const num = Number(clean);
  if (!Number.isFinite(num) || num <= 0) return undefined;
  return Number((num * multiplier).toFixed(2));
}

/**
 * Detects currency from leading or trailing unit tokens.
 * Explicit currency codes take precedence over symbols.
 */
export function resolveCurrency(text: string): { currency?: CurrencyCode; symbol: string; unresolved?: boolean } {
  const normalized = text.trim();
  // Check explicit codes first
  if (/\bINR\b/i.test(normalized)) return { currency: "INR", symbol: "₹" };
  if (/\bUSD\b/i.test(normalized)) return { currency: "USD", symbol: "$" };
  if (/\bEUR\b/i.test(normalized)) return { currency: "EUR", symbol: "€" };
  if (/\bGBP\b/i.test(normalized)) return { currency: "GBP", symbol: "£" };

  // Check aliases that map to documented default currency INR
  if (/\b(?:Rs\.?|Rupees?)\b/i.test(normalized) || /₹/.test(normalized)) {
    return { currency: "INR", symbol: "₹" };
  }

  if (/€/.test(normalized) || /\beuros?\b/i.test(normalized)) {
    return { currency: "EUR", symbol: "€" };
  }
  if (/£/.test(normalized) || /\bpounds?\b/i.test(normalized)) {
    return { currency: "GBP", symbol: "£" };
  }

  // Standalone '$': does not establish USD by itself
  if (/\$/.test(normalized)) {
    return { currency: undefined, symbol: "$", unresolved: true };
  }

  // Default when currency notation is /-, @, or unspecified in Indian marketplace context
  return { currency: "INR", symbol: "₹" };
}

/**
 * Checks whether a candidate slash expression is actually a textile count,
 * construction, blend, weave, or date rather than a price ending in '/'.
 */
export function isTextileSlashNotation(before: string, matchText: string, after: string): boolean {
  if (/\/\s*$/.test(matchText) && /^\s*\d/.test(after)) return true;
  // If the slash is immediately followed by digits: e.g. 20/1, 100/56, 65/35, 2/2
  if (/^\s*\/\s*\d/.test(after) || /\d+\s*\/\s*\d/.test(matchText)) {
    return true;
  }
  // Date format: e.g. 15/04/2026
  if (/\b\d{1,2}\/\d{1,2}\/\d{2,4}\b/.test(before + matchText + after)) {
    return true;
  }
  return false;
}

/**
 * Parses commercial qualifiers from surrounding price context.
 */
export function parseCommercialQualifiers(text: string): string[] {
  const qualifiers: string[] = [];
  if (/\b(?:excl(?:uding)?\.?\s*GST|plus\s*GST|\+\s*GST)\b/i.test(text)) qualifiers.push("excluding GST");
  if (/\b(?:incl(?:uding)?\.?\s*GST|with\s*GST)\b/i.test(text)) qualifiers.push("including GST");
  if (/\b(?:ex[ -]?mill|ex[ -]?factory)\b/i.test(text)) qualifiers.push("ex mill");
  if (/\b(?:delivered|landed|door\s+delivery)\b/i.test(text)) qualifiers.push("delivered");
  if (/\b(?:freight\s+extra|plus\s+freight|\+\s*freight)\b/i.test(text)) qualifiers.push("freight extra");
  if (/\bFOB\b/i.test(text)) qualifiers.push("FOB");
  if (/\bCIF\b/i.test(text)) qualifiers.push("CIF");
  if (/\b(?:negotiable|neg\.?)\b/i.test(text)) qualifiers.push("negotiable");
  return qualifiers;
}

/**
 * Normalizes pricing basis from text context.
 */
export function detectPricingBasis(unitText: string | undefined, fullContext: string): PriceBasis {
  if (/\b(?:price\s+)?basis\s+(?:is\s+)?not\s+specified\b|\bbasis\s+(?:unstated|unknown|pending|to\s+be\s+confirmed)\b/i.test(fullContext)) {
    return "unspecified";
  }
  if (!unitText) {
    if (/(?:\/|per)\s*(?:metres?|meters?|mtrs?|m)\b/i.test(fullContext)) return "per_metre";
    if (/(?:\/|per)\s*(?:yards?|yds?)\b/i.test(fullContext)) return "per_yard";
    if (/(?:\/|per)\s*(?:kg|kilo|kilograms?)\b/i.test(fullContext)) return "per_kg";
    if (/(?:\/|per)\s*(?:pieces?|pcs?)\b/i.test(fullContext)) return "per_piece";
    if (/(?:\/|per)\s*(?:rolls?)\b/i.test(fullContext)) return "per_roll";
    return "unspecified";
  }

  const u = unitText.toLowerCase().trim();
  if (/metres?|meters?|mtrs?|^m$/.test(u)) return "per_metre";
  if (/yards?|yds?|^yd$/.test(u)) return "per_yard";
  if (/kg|kilo|kilograms?/.test(u)) return "per_kg";
  if (/pieces?|pcs?|^pc$/.test(u)) return "per_piece";
  if (/rolls?/.test(u)) return "per_roll";
  return "unspecified";
}

/**
 * Formats a clean, readable target price qualifier label.
 */
export function formatPriceQualifier(opts: {
  amount?: number;
  min?: number;
  max?: number;
  currencySymbol: string;
  currencyCode?: CurrencyCode;
  currencyUnresolved?: boolean;
  basis: PriceBasis;
  status: string;
  operator?: string;
  tolerance?: number;
  qualifiers: string[];
  purpose?: string;
}): string {
  const { amount, min, max, currencySymbol, currencyCode, currencyUnresolved, basis, status, operator, tolerance, qualifiers, purpose } = opts;
  const sym = currencyUnresolved ? currencySymbol : (currencyCode && currencyCode !== "INR" ? `${currencyCode} ` : currencySymbol);

  let basisStr = "";
  if (basis === "per_metre") basisStr = "/m";
  else if (basis === "per_yard") basisStr = "/yd";
  else if (basis === "per_kg") basisStr = "/kg";
  else if (basis === "per_piece") basisStr = "/pc";
  else if (basis === "per_roll") basisStr = "/roll";
  else basisStr = " · price basis not specified";

  let mainStr = "";
  if (status === "range" && min !== undefined && max !== undefined) {
    mainStr = `Target: ${sym}${min}–${sym}${max}${basisStr}`;
  } else if (status === "tolerance" && amount !== undefined && tolerance !== undefined) {
    mainStr = `Target: ${sym}${amount} ±${tolerance}${basisStr}`;
  } else if (status === "bound" && amount !== undefined && operator) {
    const opLabel = operator === "<" ? "Below" : operator === "<=" ? "Up to" : operator === ">" ? "Above" : "At least";
    mainStr = `${opLabel} ${sym}${amount}${basisStr}`;
  } else if (status === "approximate" && amount !== undefined) {
    mainStr = `Approximate target: ${sym}${amount}${basisStr}`;
  } else if (status === "indicative" && amount !== undefined) {
    mainStr = `Indicative target: ${sym}${amount}${basisStr}`;
  } else if (amount !== undefined) {
    if (purpose && /budget/i.test(purpose)) {
      mainStr = `Budget: ${sym}${amount}${basisStr}`;
    } else if (purpose && /target|expected|rate/i.test(purpose)) {
      mainStr = `Target: ${sym}${amount}${basisStr}`;
    } else if (basis === "unspecified") {
      mainStr = `Target: ${sym}${amount}${basisStr}`;
    } else {
      mainStr = `${sym}${amount}${basisStr}`;
    }
  } else {
    mainStr = "Target price specified";
  }

  if (currencyUnresolved) {
    mainStr += " · confirm currency";
  }

  if (qualifiers.length) {
    mainStr += ` · ${qualifiers.join(" · ")}`;
  }
  return mainStr.trim();
}

/**
 * Modular target-price extractor for the buyer RFQ plain-text flow.
 */
export function extractTargetPrice(text: string, target: any, recordEvidence?: (_field: string, _match: RegExpMatchArray) => void): void {
  if (target.targetPriceConfirmed) return;

  // 1. Filter out queries like "Price?", "send best price", "what is the price", "need price n delivery"
  if (/\b(?:need|please\s+(?:send|share)|send|share|quote|request|ask|what\s+is\s+the|tell|confirm)\s+(?:the\s+)?(?:best\s+)?(?:price|pricing|rate|quotation)(?:\s+(?:n|and|&)\s+delivery)?\s*[?.]?/i.test(text) &&
      !/\b(?:target|budget|our\s+target|expected\s+rate|expected\s+price)\s*[:=—–-]?\s*[@₹$€£\d]/i.test(text)) {
    return;
  }
  if (/\bprice\s+not\s+decided\b|\bno\s+target\s+price\b|\bprice\s+open\b/i.test(text)) {
    return;
  }

  // 2. Separate out non-fabric charges (courier ₹200, sample charge ₹100, freight)
  let cleanText = text;

  // Mask standard date formats so date components (e.g. 2026-12-20, 20/12/2026) cannot be mistaken for numbers or ranges
  cleanText = cleanText.replace(/\b\d{4}-\d{2}-\d{2}\b/g, match => " ".repeat(match.length));
  cleanText = cleanText.replace(/\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b/g, match => " ".repeat(match.length));

  const nonFabricRegex = /\b(?:courier|sample|shipping|freight|handling)\s*(?:charge|cost|fee)?\s*[:=]?\s*(?:INR|USD|EUR|GBP|Rs\.?|Rupees?|₹|\$|€|£)?\s*\d+(?:[.,]\d+)?\s*(?:\/-)?/gi;
  for (const match of text.matchAll(nonFabricRegex)) {
    const note = `Non-fabric charge: ${match[0].trim()}`;
    target.metadataNotes = target.metadataNotes || [];
    target.metadataNotes.push(note);
    if (!target.draft.additionalSpecs?.includes(note)) {
      target.draft.additionalSpecs = [target.draft.additionalSpecs, note].filter(Boolean).join("\n");
    }
  }
  cleanText = cleanText.replace(nonFabricRegex, match => " ".repeat(match.length));

  // 3. Separate out supplier quotes: e.g. "Supplier quoted ₹220/m; our target ₹200/m"
  const supplierQuoteRegex = /\b(?:supplier|vendor|mill)\s+(?:quoted|quote|offered|offer|price)\s*[:=—–-]?\s*((?:INR|USD|EUR|GBP|Rs\.?|Rupees?|₹|\$|€|£)?\s*\d+(?:[.,]\d+)?\s*(?:\/-)?(?:\s*(?:\/|per)\s*(?:metres?|meters?|mtrs?|m|yards?|yds?|kg|kilo))?)/gi;
  const supplierQuotes = [...cleanText.matchAll(supplierQuoteRegex)];
  if (supplierQuotes.length) {
    const rawQuotePart = supplierQuotes[0][1]?.trim() || supplierQuotes[0][0].trim();
    const formattedQuote = /^[₹$€£]|^(?:INR|USD|EUR|GBP|Rs)/i.test(rawQuotePart) ? rawQuotePart : `₹${rawQuotePart}`;
    const sNote = `Supplier quote: ${formattedQuote}`;
    target.metadataNotes = target.metadataNotes || [];
    target.metadataNotes.push(sNote);
    if (!target.draft.additionalSpecs?.includes(sNote)) {
      target.draft.additionalSpecs = [target.draft.additionalSpecs, sNote].filter(Boolean).join("\n");
    }
    cleanText = cleanText.replace(supplierQuoteRegex, match => " ".repeat(match.length));
  }

  // 4. TOLERANCE: e.g. ₹200 ±5/m, 200 +/- 5 INR/m
  const tolerancePattern = new RegExp(
    `(?<![\\w])(?:(${TARGET_PRICE_LABEL})\\s*[:=—–-]\\s*)?(?:@\\s*)?(${CURRENCY_SYMBOL_PATTERN})?\\s*(${PRICE_NUMBER_PATTERN})\\s*(?:±|\\+\\/-)\\s*(${CURRENCY_SYMBOL_PATTERN})?\\s*(${PRICE_NUMBER_PATTERN})(?:\\s*(?:\\/|per)\\s*(metres?|meters?|mtrs?|m|yards?|yds?|kg|kilo))?`,
    "iu"
  );
  const toleranceMatch = cleanText.match(tolerancePattern);
  if (toleranceMatch) {
    const hasPriceContext = Boolean(toleranceMatch[1] || toleranceMatch[2] || toleranceMatch[4] || toleranceMatch[6]);
    if (hasPriceContext) {
      const currStr = [toleranceMatch[2], toleranceMatch[4]].filter(Boolean).join(" ");
      const { currency, symbol, unresolved } = resolveCurrency(currStr || cleanText);
      const nominal = parsePriceNumber(toleranceMatch[3], currency);
      const tol = parsePriceNumber(toleranceMatch[5], currency);
      const unit = toleranceMatch[6];
      const basis = detectPricingBasis(unit, cleanText);
      const qualifiers = parseCommercialQualifiers(cleanText);

      if (nominal !== undefined && tol !== undefined) {
        target.targetPriceAmount = nominal;
        target.targetPriceTolerance = tol;
        target.targetPriceCurrency = currency;
        target.targetPriceCurrencySymbol = symbol;
        target.targetPriceCurrencyUnresolved = unresolved;
        target.targetPriceBasis = basis;
        target.targetPriceStatus = "tolerance";
        target.targetPriceCommercialQualifiers = qualifiers;
        target.targetPriceQualifier = formatPriceQualifier({
          amount: nominal,
          tolerance: tol,
          currencySymbol: symbol,
          currencyCode: currency,
          currencyUnresolved: unresolved,
          basis,
          status: "tolerance",
          qualifiers,
          purpose: toleranceMatch[1],
        });

        target.warnings.push(`Target price ${nominal} has a ±${tol} tolerance; confirm exact price.`);
        if (!target.draft.additionalSpecs?.includes(target.targetPriceQualifier)) {
          target.draft.additionalSpecs = [target.draft.additionalSpecs, target.targetPriceQualifier].filter(Boolean).join("\n");
        }
        return;
      }
    }
  }

  // 5. CONDITIONAL ALTERNATIVES: e.g. "Target ₹190 or ₹200 depending on finish"
  const altPattern = new RegExp(
    `(?<![\\w])(?:(${TARGET_PRICE_LABEL})\\s*[:=—–-]\\s*)?(?:@\\s*)?(${CURRENCY_SYMBOL_PATTERN})?\\s*(${PRICE_NUMBER_PATTERN})\\s+(?:or)\\s+(${CURRENCY_SYMBOL_PATTERN})?\\s*(${PRICE_NUMBER_PATTERN})(?:\\s*(?:\\/|per)\\s*(metres?|meters?|mtrs?|m|yards?|yds?|kg|kilo))?`,
    "iu"
  );
  const altMatch = cleanText.match(altPattern);
  if (altMatch && !/\b(?:to|-|–|—)\b/.test(altMatch[0])) {
    const hasPriceContext = Boolean(altMatch[1] || altMatch[2] || altMatch[4] || altMatch[6]);
    if (hasPriceContext) {
      const currStr = [altMatch[2], altMatch[4]].filter(Boolean).join(" ");
      const { currency, symbol, unresolved } = resolveCurrency(currStr || cleanText);
      const val1 = parsePriceNumber(altMatch[3], currency);
      const val2 = parsePriceNumber(altMatch[5], currency);
      const unit = altMatch[6];
      const basis = detectPricingBasis(unit, cleanText);
      const qualifiers = parseCommercialQualifiers(cleanText);

      if (val1 && val2) {
        target.targetPriceCurrency = currency;
        target.targetPriceCurrencySymbol = symbol;
        target.targetPriceCurrencyUnresolved = unresolved;
        target.targetPriceBasis = basis;
        target.targetPriceStatus = "alternatives";
        target.targetPriceCommercialQualifiers = qualifiers;
        target.targetPriceQualifier = `Target alternatives: ${symbol}${val1} or ${symbol}${val2}${basis === "per_metre" ? "/m" : ""}`;
        target.warnings.push(`Target price has alternatives (${val1} or ${val2}); confirm the intended price.`);
        if (!target.draft.additionalSpecs?.includes(target.targetPriceQualifier)) {
          target.draft.additionalSpecs = [target.draft.additionalSpecs, target.targetPriceQualifier].filter(Boolean).join("\n");
        }
        return;
      }
    }
  }

  // 6. RANGE: e.g. "Target ₹280–285/m" or "Target 280 to 285 INR/m" or "₹190–200/m"
  const rangePattern = new RegExp(
    `(?<![\\w])(?:(?:our\\s+)?(${TARGET_PRICE_LABEL})\\s*[:=—–-]?\\s*)?(?:below|under|upto|up to|around|@)?\\s*(${CURRENCY_SYMBOL_PATTERN})?\\s*(${PRICE_NUMBER_PATTERN})\\s*(?:[-–—]|to)\\s*(${CURRENCY_SYMBOL_PATTERN})?\\s*(${PRICE_NUMBER_PATTERN})\\s*(?:\\/[-–—])?(?:\\s*(?:\\/|per)\\s*(metres?|meters?|mtrs?|m|yards?|yds?|kg|kilo))?`,
    "iu"
  );
  const rangeMatch = cleanText.match(rangePattern);
  if (rangeMatch && !isTextileSlashNotation(cleanText.slice(0, rangeMatch.index!), rangeMatch[0], cleanText.slice(rangeMatch.index! + rangeMatch[0].length))) {
    const hasPriceContext = Boolean(rangeMatch[1] || rangeMatch[2] || rangeMatch[4] || rangeMatch[6]);
    if (hasPriceContext) {
      const currStr = [rangeMatch[2], rangeMatch[4]].filter(Boolean).join(" ");
      const { currency, symbol, unresolved } = resolveCurrency(currStr || cleanText);
      const minVal = parsePriceNumber(rangeMatch[3], currency);
      const maxVal = parsePriceNumber(rangeMatch[5], currency);
      const unitMatch = rangeMatch[6];
      const basis = detectPricingBasis(unitMatch, cleanText);
      const qualifiers = parseCommercialQualifiers(cleanText);

      if (minVal !== undefined && maxVal !== undefined && minVal > 0 && maxVal > 0) {
        target.targetPriceAmount = maxVal;
        target.targetPriceMin = minVal;
        target.targetPriceMax = maxVal;
        target.targetPriceCurrency = currency;
        target.targetPriceCurrencySymbol = symbol;
        target.targetPriceCurrencyUnresolved = unresolved;
        target.targetPriceBasis = basis;
        target.targetPriceStatus = "range";
        target.targetPriceCommercialQualifiers = qualifiers;
        target.targetPriceQualifier = formatPriceQualifier({
          min: minVal,
          max: maxVal,
          currencySymbol: symbol,
          currencyCode: currency,
          currencyUnresolved: unresolved,
          basis,
          status: "range",
          qualifiers,
          purpose: rangeMatch[1],
        });

        if (basis === "per_metre" && currency === "INR" && !unresolved) {
          target.draft.targetPriceMin = minVal;
          target.draft.targetPriceMax = maxVal;
          if (recordEvidence) recordEvidence("targetPriceMax", rangeMatch);
        }

        if (!target.draft.additionalSpecs?.includes(target.targetPriceQualifier)) {
          target.draft.additionalSpecs = [target.draft.additionalSpecs, target.targetPriceQualifier].filter(Boolean).join("\n");
        }
        return;
      }
    }
  }

  // 7. SINGLE PRICE CANDIDATE COLLECTION
  type RawCandidate = {
    amount: number;
    currency?: CurrencyCode;
    currencySymbol: string;
    currencyUnresolved?: boolean;
    basis: PriceBasis;
    status: "exact" | "approximate" | "indicative" | "bound";
    operator?: ">" | ">=" | "<" | "<=";
    qualifiers: string[];
    match: RegExpMatchArray;
    index: number;
    rawText: string;
    isLabelled: boolean;
    purpose?: string;
  };

  const candidates: RawCandidate[] = [];

  // A. Labelled target / rate:
  //    Target price - 200, Target price: INR 200, Target price = 200, Target price — 200,
  //    Target price - @200/-, Target price - ₹200/-, Expected rate 200, Budget INR 1.2k per metre
  const labelledRegex = new RegExp(
    `(?<![\\w])(${TARGET_PRICE_LABEL})\\s*[:=—–-]?\\s*(?:(below|under|upto|up to|less than|max(?:imum)?|above|more than|greater than|at least|min(?:imum)?|around|approx(?:imately)?|at|@)\\s+)?(?:@\\s*)?(${CURRENCY_SYMBOL_PATTERN})?\\s*(${PRICE_NUMBER_PATTERN})\\s*(${CURRENCY_SYMBOL_PATTERN})?\\s*(?:\\/[-–—]|\\/(?![\\w\\d]))?(?:\\s*(?:\\/|per)\\s*(metres?|meters?|mtrs?|m|yards?|yds?|kg|kilo|pieces?|pcs?|rolls?))?`,
    "giu"
  );

  for (const match of cleanText.matchAll(labelledRegex)) {
    const before = cleanText.slice(Math.max(0, match.index! - 20), match.index!);
    const after = cleanText.slice(match.index! + match[0].length, match.index! + match[0].length + 20);
    if (isTextileSlashNotation(before, match[0], after)) continue;

    const relWord = match[2]?.toLowerCase();
    const currStr = [match[3], match[5]].filter(Boolean).join(" ");
    const { currency, symbol, unresolved } = resolveCurrency(currStr || cleanText);
    const amount = parsePriceNumber(match[4], currency);
    if (!amount) continue;

    const unit = match[6];
    const basis = detectPricingBasis(unit, cleanText);
    const qualifiers = parseCommercialQualifiers(cleanText);

    let op: ">" | ">=" | "<" | "<=" | undefined = undefined;
    let st: RawCandidate["status"] = "exact";
    if (relWord) {
      if (/below|under|less than/.test(relWord)) { op = "<"; st = "bound"; }
      else if (/upto|up to|max(?:imum)?|at most/.test(relWord)) { op = "<="; st = "bound"; }
      else if (/above|more than|greater than/.test(relWord)) { op = ">"; st = "bound"; }
      else if (/at least|min(?:imum)?/.test(relWord)) { op = ">="; st = "bound"; }
      else if (/around|approx/.test(relWord)) { st = "approximate"; }
    }
    if (/indicative|tentative/i.test(before + match[0])) st = "indicative";

    candidates.push({
      amount,
      currency,
      currencySymbol: symbol,
      currencyUnresolved: unresolved,
      basis,
      status: st,
      operator: op,
      qualifiers,
      match,
      index: match.index!,
      rawText: match[0],
      isLabelled: true,
      purpose: match[1],
    });
  }

  // B. Relational expressions without explicit "target":
  //    below ₹200/m, up to ₹200/m, above ₹200/m, at least ₹200/m
  const relationalRegex = new RegExp(
    `(?<![\\w])(below|under|less than|upto|up to|at most|max(?:imum)?|above|more than|greater than|at least|min(?:imum)?)\\s+(?:@\\s*)?(${CURRENCY_SYMBOL_PATTERN})?\\s*(${PRICE_NUMBER_PATTERN})\\s*(?:\\/[-–—]|\\/(?![\\w\\d]))?(?:\\s*(?:\\/|per)\\s*(metres?|meters?|mtrs?|m|yards?|yds?|kg|kilo|pieces?|pcs?|rolls?))?`,
    "giu"
  );

  for (const match of cleanText.matchAll(relationalRegex)) {
    if (candidates.some(c => Math.abs(c.index - match.index!) < 15)) continue;
    const before = cleanText.slice(Math.max(0, match.index! - 20), match.index!);
    const after = cleanText.slice(match.index! + match[0].length, match.index! + match[0].length + 20);
    if (isTextileSlashNotation(before, match[0], after)) continue;

    const relWord = match[1].toLowerCase();
    const currStr = match[2] || "";
    const { currency, symbol, unresolved } = resolveCurrency(currStr || cleanText);
    const amount = parsePriceNumber(match[3], currency);
    if (!amount) continue;

    const unit = match[4];
    const basis = detectPricingBasis(unit, cleanText);
    const qualifiers = parseCommercialQualifiers(cleanText);

    let op: ">" | ">=" | "<" | "<=" | undefined = undefined;
    let st: RawCandidate["status"] = "bound";
    if (/below|under|less than/.test(relWord)) op = "<";
    else if (/upto|up to|max(?:imum)?|at most/.test(relWord)) op = "<=";
    else if (/above|more than|greater than/.test(relWord)) op = ">";
    else if (/at least|min(?:imum)?/.test(relWord)) op = ">=";

    candidates.push({
      amount,
      currency,
      currencySymbol: symbol,
      currencyUnresolved: unresolved,
      basis,
      status: st,
      operator: op,
      qualifiers,
      match,
      index: match.index!,
      rawText: match[0],
      isLabelled: false,
    });
  }

  // C. Unambiguous Price Notations:
  //    200/-, ₹200, ₹200/-, @200, @200/-, @₹200, @₹200/-, @ ₹ 200 /-
  //    Rs. 200, Rs 200/-, Rupees 200, INR 200, 200 INR, 200 rupees, £200, €200, $200,
  //    GBP 200, EUR 200, USD 200, 200 GBP, 200 EUR, 200 USD
  const priceNotationRegex = new RegExp(
    `(?:` +
      // Option 1: @ prefixed notation: @200, @200/-, @₹200, @ ₹ 200 /-
      `(?<![\\w])@\\s*(${CURRENCY_SYMBOL_PATTERN})?\\s*(${PRICE_NUMBER_PATTERN})\\s*(?:\\/\\s*[-–—]|\\/(?![\\w\\d]))?` +
      `|` +
      // Option 2: Currency prefixed notation: ₹200, ₹200/-, Rs. 200, INR 200, $200, €200, £200
      `(?<![\\w])(${CURRENCY_SYMBOL_PATTERN})\\s*(${PRICE_NUMBER_PATTERN})\\s*(?:\\/\\s*[-–—]|\\/(?![\\w\\d]))?` +
      `|` +
      // Option 3: Currency suffixed notation: 200 INR, 200 rupees, 200 USD, 200 EUR, 200 GBP
      `(?<![\\w.])(${PRICE_NUMBER_PATTERN})\\s*(${CURRENCY_SYMBOL_PATTERN})(?![\\w])` +
      `|` +
      // Option 4: Standalone number with /- ending: 200/-, 200 /-
      `(?<![\\w.])(${PRICE_NUMBER_PATTERN})\\s*\\/\\s*[-–—]` +
    `)(?:\\s*(?:\\/|per)\\s*(metres?|meters?|mtrs?|m|yards?|yds?|kg|kilo|pieces?|pcs?|rolls?))?`,
    "giu"
  );

  for (const match of cleanText.matchAll(priceNotationRegex)) {
    if (candidates.some(c => Math.abs(c.index - match.index!) < 10)) continue;
    const before = cleanText.slice(Math.max(0, match.index! - 25), match.index!);
    const after = cleanText.slice(match.index! + match[0].length, match.index! + match[0].length + 25);
    if (isTextileSlashNotation(before, match[0], after)) continue;

    const rawAmt = match[2] || match[4] || match[5] || match[7];
    const currStr = match[1] || match[3] || match[6] || "";
    const unit = match[8];

    const { currency, symbol, unresolved } = resolveCurrency(currStr || cleanText);
    const amount = parsePriceNumber(rawAmt, currency);
    if (!amount) continue;

    const basis = detectPricingBasis(unit, cleanText);
    const qualifiers = parseCommercialQualifiers(cleanText);
    const isIndicative = /indicative|tentative|approx|around/i.test(before + match[0]);
    const detectedPurpose = /\bbudget\b/i.test(before) ? "Budget" : /\btarget\b/i.test(before) ? "Target" : undefined;

    candidates.push({
      amount,
      currency,
      currencySymbol: symbol,
      currencyUnresolved: unresolved,
      basis,
      status: isIndicative ? "indicative" : "exact",
      qualifiers,
      match,
      index: match.index!,
      rawText: match[0],
      isLabelled: Boolean(detectedPurpose),
      purpose: detectedPurpose,
    });
  }

  // D. Standalone "200/" WITH price context:
  const slashEndingRegex = /(?<![\w.])(\d+(?:[.,]\d+)?(?:k)?)\s*\/(?![\w\d])/gi;
  for (const match of cleanText.matchAll(slashEndingRegex)) {
    if (candidates.some(c => Math.abs(c.index - match.index!) < 10)) continue;
    const before = cleanText.slice(Math.max(0, match.index! - 35), match.index!);
    const after = cleanText.slice(match.index! + match[0].length, match.index! + match[0].length + 35);
    if (isTextileSlashNotation(before, match[0], after)) continue;

    const hasPriceContext = new RegExp(`\\b(?:${TARGET_PRICE_LABEL}|price|rate|cost)\\b|@|₹|Rs\\.?|INR`, "i").test(before + after);
    if (!hasPriceContext) continue;

    const { currency, symbol, unresolved } = resolveCurrency(before + after);
    const amount = parsePriceNumber(match[1], currency);
    if (!amount) continue;

    const basis = detectPricingBasis(undefined, cleanText);
    const qualifiers = parseCommercialQualifiers(cleanText);
    const detectedPurpose = /\bbudget\b/i.test(before) ? "Budget" : /\btarget\b/i.test(before) ? "Target" : undefined;

    candidates.push({
      amount,
      currency,
      currencySymbol: symbol,
      currencyUnresolved: unresolved,
      basis,
      status: "exact",
      qualifiers,
      match,
      index: match.index!,
      rawText: match[0],
      isLabelled: Boolean(detectedPurpose),
      purpose: detectedPurpose,
    });
  }

  if (!candidates.length) return;

  // 8. RESOLVE MULTIPLE CANDIDATES (Revisions, Historical Superseded Values, Conflicting Values)
  candidates.sort((a, b) => a.index - b.index);

  let chosen: RawCandidate | undefined = undefined;
  const uniqueAmounts = new Set(candidates.map(c => c.amount));

  if (uniqueAmounts.size === 1) {
    chosen = candidates[0];
  } else {
    // Check for explicit revision or supersede:
    const revisedCandidate = candidates.find(c => {
      const beforeMatch = cleanText.slice(Math.max(0, c.index - 45), c.index);
      return /\b(?:revised(?:\s+our)?|updated?|new|final|now)\s*$/i.test(beforeMatch) ||
             /\b(?:revised(?:\s+our)?|updated?|new|final)\s+target/i.test(c.rawText);
    });

    const hasRevisionKeywords = /\b(?:actually|instead|correct(?:ion|ed)?|rather|replac(?:ing|e)|ignore(?: the)? earlier|revised?|updated?)\b/i.test(cleanText);

    if (revisedCandidate) {
      chosen = revisedCandidate;
      target.warnings.push(`Explicit target price revision applied: ${chosen.amount}. Earlier wording preserved in source.`);
    } else if (hasRevisionKeywords) {
      chosen = candidates[candidates.length - 1];
      const earlier = candidates[0];
      target.warnings.push(`Target price updated to ${chosen.amount} (replacing earlier ${earlier.amount}).`);
    } else {
      const labelledCandidates = candidates.filter(c => c.isLabelled);
      if (labelledCandidates.length === 1) {
        chosen = labelledCandidates[0];
      } else {
        target.warnings.push("Conflicting target prices detected; confirm the intended target price.");
        return;
      }
    }
  }

  if (!chosen) return;

  const { amount, currency, currencySymbol, currencyUnresolved, basis, status, operator, qualifiers, match, purpose } = chosen;

  const beforeChosen = cleanText.slice(Math.max(0, chosen.index - 30), chosen.index);
  const isIndicative = status === "indicative" || /indicative|tentative/i.test(beforeChosen + chosen.rawText);
  const effectiveStatus = (status === "exact" && isIndicative) ? "indicative" : status;

  target.targetPriceAmount = amount;
  target.targetPriceCurrency = currency;
  target.targetPriceCurrencySymbol = currencySymbol;
  target.targetPriceCurrencyUnresolved = currencyUnresolved;
  target.targetPriceBasis = basis;
  target.targetPriceStatus = effectiveStatus;
  target.targetPriceOperator = operator;
  target.targetPriceIndicative = isIndicative;
  target.targetPriceCommercialQualifiers = qualifiers;

  target.targetPriceQualifier = formatPriceQualifier({
    amount,
    currencySymbol,
    currencyCode: currency,
    currencyUnresolved,
    basis,
    status: effectiveStatus,
    operator,
    qualifiers,
    purpose,
  });

  // Safe mapping to RFQ field targetPriceMax:
  // ONLY map to draft.targetPriceMax when basis is confirmed per_metre AND currency is INR without unresolved ambiguity!
  if (basis === "per_metre" && currency === "INR" && !currencyUnresolved && (status === "exact" || operator === "<=" || operator === "<")) {
    target.draft.targetPriceMax = amount;
    if (recordEvidence) recordEvidence("targetPriceMax", match);
  } else {
    delete target.draft.targetPriceMax;
  }

  // Provide clear hints based on what is missing
  if (currencyUnresolved) {
    target.warnings.push("Confirm currency: '$' alone does not establish USD. Currency was not assumed.");
  } else if (currency && currency !== "INR") {
    target.warnings.push(`Target price stated in foreign currency (${currency}). Conversion to ₹/m is not performed automatically.`);
  }

  if (basis === "unspecified") {
    target.warnings.push("Target price basis was not specified (e.g. per metre or per kg). Confirm the pricing basis before ordering.");
  } else if (basis === "per_kg") {
    const kgNote = `Price stated as ${currencySymbol}${amount}/kg`;
    target.metadataNotes = target.metadataNotes || [];
    target.metadataNotes.push(kgNote);
    if (!target.draft.additionalSpecs?.includes(kgNote)) {
      target.draft.additionalSpecs = [target.draft.additionalSpecs, kgNote].filter(Boolean).join("\n");
    }
    target.warnings.push("Target price was stated per kg rather than per metre; retained in notes without filling the ₹/m field.");
  }

  if (!target.draft.additionalSpecs?.includes(target.targetPriceQualifier)) {
    target.draft.additionalSpecs = [target.draft.additionalSpecs, target.targetPriceQualifier].filter(Boolean).join("\n");
  }
}

const reference = /\b(?:original|reference|existing(?: fabric)?|current fabric)\b/i;
const requested = /\b(?:we\s+(?:need|want)|buyer(?:['’]s)?\s+(?:needs?|requested)|requested(?:\s+(?:blend|composition|specification))?|replacement blend)\b/i;
const suggestion = /\b(?:suggest(?:ion|ions)?|suggested|alternatives?|options?|replace(?:ment)?\s+for|replacement\s+of|like|linen\s+and\s+bemberg)\b/i;
export const unclearImageText = /\[unclear[^\]]*\]|[?~]|\b(?:uncertain|unreadable|unconfirmed|maybe|possibly|approximately|approx|about|either|or|tbc|tbd)\b/i;

/** Scope only this image importer. Paste/Excel parsing and numeric inference are unchanged. */
export function imageTextScope(text: string) {
  const usable: string[] = [];
  const uncertain: string[] = [];
  let context = false;
  // Separate same-line reference → requested transitions before excluding context.
  const passages = text.replace(/\b(?:but\s+)?(?=we\s+(?:need|want)\b|buyer(?:['’]s)?\s+(?:needs?|requested)\b|requested\s+(?:blend|composition|specification)\b)/gi, "\n")
    .split(/\n|;|,(?!\d)|\.(?!\d)(?=\s|$)/).map(value => value.trim()).filter(Boolean);
  for (const passage of passages) {
    if (reference.test(passage)) {
      context = true;
      continue;
    }
    if (requested.test(passage)) context = false;
    else if (suggestion.test(passage) || /\b(?:send|production)\s+(?:production\s+)?pric(?:e|ing)\b/i.test(passage)) context = true;
    if (context) continue;
    if (unclearImageText.test(passage)) uncertain.push(passage);
    else usable.push(passage);
  }
  return { text: usable.join("\n"), uncertain };
}

import { imageExtractionSchema, type ImageExtraction } from "../image/schema.js";

// A script guard is a fail-closed backstop, not a language detector: Latin-script
// Hinglish is translated by the voice prompt. Never silently transliterate specs.
const hasUntranslatedScript = (value: string) => /(?=\p{L})\P{Script=Latin}/u.test(value);

export function englishVoiceReview(input: ImageExtraction): ImageExtraction {
  const data = imageExtractionSchema.parse(input);
  const warnings = (values: string[]) => values.map(value => hasUntranslatedScript(value)
    ? "An extracted detail needs English translation. Check the source transcript and enter the confirmed value in English."
    : value);
  return {
    ...data,
    warnings: warnings(data.warnings),
    requirements: data.requirements.map((requirement, index) => {
      const notes = warnings(requirement.warnings);
      const draft = { ...requirement.draft };
      for (const key of Object.keys(draft) as (keyof typeof draft)[]) {
        const value = draft[key];
        if ((typeof value === "string" && hasUntranslatedScript(value)) ||
          (Array.isArray(value) && value.some(hasUntranslatedScript))) {
          delete draft[key];
          notes.push(`Confirm ${key} in English; untranslated text was left blank.`);
        }
      }
      const colors = requirement.colors.flatMap(color => {
        if (hasUntranslatedScript(color.color)) {
          notes.push("Confirm the colour in English; untranslated colour text was left blank.");
          return [];
        }
        if (color.quantity && hasUntranslatedScript(color.quantity)) {
          notes.push("Confirm the colour quantity and units; untranslated quantity was left blank.");
          return [{ ...color, quantity: null }];
        }
        return [color];
      });
      return { ...requirement, label: hasUntranslatedScript(requirement.label) ? `Requirement ${index + 1}` : requirement.label,
        draft, colors, warnings: notes };
    }),
  };
}

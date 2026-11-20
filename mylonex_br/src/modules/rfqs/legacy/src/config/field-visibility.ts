/**
 * Configuration for temporarily hiding / disabling specific RFQ fields across the application.
 *
 * To disable a field: set its value to `true`.
 * - Hides its inputs, labels, and help text.
 * - Hides its display rows in summaries, previews, and detail views.
 * - Relaxes required-field validation and readiness blockers.
 * - Suppresses warnings or follow-up prompts requesting the field.
 * - Preserves existing saved/loaded values without overwriting them.
 *
 * To re-enable: change the value back to `false` (or remove the key).
 */
export const DISABLED_RFQ_FIELDS = {
  yarnType: true,
  weaveDetail: true,
  dyeMethod: true,
} as const;

export type DisabledRfqField = keyof typeof DISABLED_RFQ_FIELDS;

/**
 * Returns true if the specified field is currently disabled / hidden.
 */
export function isFieldDisabled(field: string): boolean {
  return Boolean(DISABLED_RFQ_FIELDS[field as DisabledRfqField]);
}

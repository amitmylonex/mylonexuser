import { z } from 'zod';

const optionalText = (max: number) => z.string().trim().max(max).nullable();
export const profilePatch = z.object({
  fullName: z.string().trim().min(1, 'Enter your full name.').max(200),
  company: optionalText(200),
  phone: z.string().trim().max(50).transform(value => value.replace(/[\s().-]/g, '')).pipe(z.string().regex(/^\+?[1-9]\d{9,14}$/, 'Use 10–15 digits with an optional + prefix.')).nullable(),
  designation: optionalText(100),
  gstNumber: z.string().trim().toUpperCase().regex(/^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[A-Z0-9]$/, 'Enter a valid GSTIN.').nullable(),
  address: optionalText(1000), state: optionalText(100), city: optionalText(100),
  pincode: z.string().trim().regex(/^[1-9]\d{5}$/, 'Enter a six-digit Indian pincode.').nullable(),
}).partial().strict().refine(value => Object.keys(value).length > 0, 'Supply at least one profile field.');
export type ProfilePatch = z.infer<typeof profilePatch>;
export const passwordChange = z.object({
  currentPassword: z.string().min(1).max(128),
  newPassword: z.string().min(12, 'Use at least 12 characters.').max(128),
}).strict().refine(value => value.currentPassword !== value.newPassword, 'Choose a different password.');
export const MAX_AVATAR_BYTES = 2 * 1024 * 1024;
export const avatarMime = z.enum(['image/jpeg', 'image/png', 'image/webp']);

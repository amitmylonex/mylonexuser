import { z } from 'zod'
const optional = (max: number) => z.string().trim().max(max).nullable()
export const profileSchema = z.object({
  fullName: z.string().trim().min(1, 'Enter your full name.').max(200),
  company: optional(200), designation: optional(100), address: optional(1000), state: optional(100), city: optional(100),
  phone: z.string().trim().max(50).transform(value => value.replace(/[\s().-]/g, '')).pipe(z.string().regex(/^\+?[1-9]\d{9,14}$/, 'Mobile number must contain 10–15 digits, with an optional + prefix.')).nullable(),
  pincode: z.string().regex(/^[1-9]\d{5}$/, 'Enter a six-digit Indian pincode.').nullable(),
  gstNumber: z.string().regex(/^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[A-Z0-9]$/, 'Enter a valid GSTIN.').nullable(),
}).strict().refine(value => !value.city || !!value.state, { path: ['state'], message: 'Select the state for this city.' })
export type ProfileInput = z.infer<typeof profileSchema>

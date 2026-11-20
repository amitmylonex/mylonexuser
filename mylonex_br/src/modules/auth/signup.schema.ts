import { z } from 'zod';
import { buyerProfileFields } from '../accounts/buyer-profile.schema.js';

export const signupSchema = z.strictObject({
  email: z.email().max(254).transform(email => email.toLowerCase()),
  password: z.string().min(6).max(1024),
  ...buyerProfileFields,
  agreedToTerms: z.literal(true),
});

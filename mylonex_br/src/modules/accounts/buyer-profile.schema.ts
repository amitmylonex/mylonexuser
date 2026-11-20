import { z } from 'zod';

export const buyerProfileFields = {
  fullName: z.string().trim().min(1).max(200),
  company: z.string().trim().min(1).max(200),
  phone: z.string().trim().min(1).max(50),
  gstNumber: z.string().trim().max(50).optional(),
};

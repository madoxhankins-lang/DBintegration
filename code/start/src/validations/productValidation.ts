import { z } from 'zod';

export const productSchema = z.object({
  name: z.string().trim().min(1).max(100),
  price: z.number().finite().nonnegative(),
  stock: z.number().int().min(0).max(2147483647),
  category: z.string().trim().min(1).max(100).nullable().optional(),
}).strict();

export const updateProductSchema = productSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  { message: 'Include at least one product field to update.' },
);

export const productIdSchema = z.coerce.number().int().positive().max(2147483647);

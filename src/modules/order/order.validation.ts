import { z } from 'zod';

export const createOrderValidationSchema = z.object({
  body: z.object({
    items: z
      .array(
        z.object({
          productId: z.string().min(1, 'Product id is required'),
          quantity: z.number().int().min(1, 'Quantity must be at least 1'),
        }),
      )
      .min(1, 'At least one item is required'),
  }),
});

export const orderIdParamValidationSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Order id is required'),
  }),
});

import { z } from 'zod';

export const checkoutBodySchema = z
  .object({
    shippingAddressId: z
      .uuid('Shipping address id must be a valid UUID')
      .optional(),
  })
  .default({});

export type CheckoutInput = z.infer<typeof checkoutBodySchema>;

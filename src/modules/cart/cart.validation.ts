import { z } from 'zod';

export const cartItemIdParamsSchema = z.object({
  itemId: z.uuid('Cart item id must be a valid UUID'),
});

export const addCartItemBodySchema = z.object({
  productId: z.uuid('Product id must be a valid UUID'),

  quantity: z.coerce
    .number()
    .int()
    .positive('Quantity must be greater than 0')
    .max(100, 'Quantity cannot exceed 100 per item'),
});

export const updateCartItemBodySchema = z.object({
  quantity: z.coerce
    .number()
    .int()
    .positive('Quantity must be greater than 0')
    .max(100, 'Quantity cannot exceed 100 per item'),
});

export type CartItemIdParams = z.infer<typeof cartItemIdParamsSchema>;
export type AddCartItemInput = z.infer<typeof addCartItemBodySchema>;
export type UpdateCartItemInput = z.infer<typeof updateCartItemBodySchema>;

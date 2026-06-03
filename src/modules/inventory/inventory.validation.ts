import { InventoryMovementType } from '@prisma/client';
import { z } from 'zod';

export const stockAdjustmentTypeSchema = z.enum([
  'INCREASE',
  'DECREASE',
  'SET',
]);

export const adjustStockBodySchema = z
  .object({
    productId: z.uuid('Product id must be a valid UUID'),

    adjustmentType: stockAdjustmentTypeSchema,

    quantity: z.coerce.number().int().positive().optional(),

    newStock: z.coerce.number().int().nonnegative().optional(),

    reason: z
      .string()
      .trim()
      .min(3, 'Reason must be at least 3 characters')
      .max(500, 'Reason must be at most 500 characters'),
  })
  .superRefine((data, ctx) => {
    if (
      (data.adjustmentType === 'INCREASE' ||
        data.adjustmentType === 'DECREASE') &&
      data.quantity === undefined
    ) {
      ctx.addIssue({
        code: 'custom',
        path: ['quantity'],
        message: 'Quantity is required for INCREASE or DECREASE adjustment',
      });
    }

    if (data.adjustmentType === 'SET' && data.newStock === undefined) {
      ctx.addIssue({
        code: 'custom',
        path: ['newStock'],
        message: 'newStock is required for SET adjustment',
      });
    }
  });

export const listInventoryMovementsQuerySchema = z.object({
  productId: z.uuid('Product id must be a valid UUID').optional(),

  type: z
    .enum([
      InventoryMovementType.STOCK_IN,
      InventoryMovementType.STOCK_OUT,
      InventoryMovementType.ORDER_RESERVED,
      InventoryMovementType.ORDER_DEDUCTED,
      InventoryMovementType.ORDER_CANCELLED_ADJUSTMENT,
      InventoryMovementType.MANUAL_ADJUSTMENT,
    ])
    .optional(),

  page: z.coerce.number().int().positive().default(1),

  limit: z.coerce.number().int().positive().max(100).default(10),
});

export type AdjustStockInput = z.infer<typeof adjustStockBodySchema>;
export type ListInventoryMovementsQuery = z.infer<
  typeof listInventoryMovementsQuerySchema
>;

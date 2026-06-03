import { z } from 'zod';

export const paymentIdParamsSchema = z.object({
  id: z.uuid('Payment id must be a valid UUID'),
});

export const mockPaymentSuccessBodySchema = z
  .object({
    providerRef: z
      .string()
      .trim()
      .min(3, 'Provider reference must be at least 3 characters')
      .max(120, 'Provider reference must be at most 120 characters')
      .optional(),
  })
  .default({});

export const mockPaymentFailureBodySchema = z
  .object({
    reason: z
      .string()
      .trim()
      .min(3, 'Failure reason must be at least 3 characters')
      .max(500, 'Failure reason must be at most 500 characters')
      .optional(),
  })
  .default({});

export type PaymentIdParams = z.infer<typeof paymentIdParamsSchema>;
export type MockPaymentSuccessInput = z.infer<
  typeof mockPaymentSuccessBodySchema
>;
export type MockPaymentFailureInput = z.infer<
  typeof mockPaymentFailureBodySchema
>;

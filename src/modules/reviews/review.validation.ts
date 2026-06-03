import { ReviewStatus } from '@prisma/client';
import { z } from 'zod';

export const productReviewParamsSchema = z.object({
  id: z.uuid('Product id must be a valid UUID'),
});

export const reviewIdParamsSchema = z.object({
  id: z.uuid('Review id must be a valid UUID'),
});

export const createReviewBodySchema = z.object({
  rating: z.coerce
    .number()
    .int()
    .min(1, 'Rating must be at least 1')
    .max(5, 'Rating must be at most 5'),

  comment: z
    .string()
    .trim()
    .min(3, 'Comment must be at least 3 characters')
    .max(1000, 'Comment must be at most 1000 characters')
    .optional(),
});

export const listProductReviewsQuerySchema = z.object({
  rating: z.coerce.number().int().min(1).max(5).optional(),

  page: z.coerce.number().int().positive().default(1),

  limit: z.coerce.number().int().positive().max(100).default(10),
});

export const listMyReviewsQuerySchema = z.object({
  status: z
    .enum([ReviewStatus.PENDING, ReviewStatus.APPROVED, ReviewStatus.REJECTED])
    .optional(),

  page: z.coerce.number().int().positive().default(1),

  limit: z.coerce.number().int().positive().max(100).default(10),
});

export const listAdminReviewsQuerySchema = z.object({
  status: z
    .enum([ReviewStatus.PENDING, ReviewStatus.APPROVED, ReviewStatus.REJECTED])
    .optional(),

  productId: z.uuid('Product id must be a valid UUID').optional(),

  userId: z.uuid('User id must be a valid UUID').optional(),

  rating: z.coerce.number().int().min(1).max(5).optional(),

  page: z.coerce.number().int().positive().default(1),

  limit: z.coerce.number().int().positive().max(100).default(10),
});

export const updateReviewStatusBodySchema = z.object({
  status: z.enum([
    ReviewStatus.PENDING,
    ReviewStatus.APPROVED,
    ReviewStatus.REJECTED,
  ]),
});

export type ProductReviewParams = z.infer<typeof productReviewParamsSchema>;
export type ReviewIdParams = z.infer<typeof reviewIdParamsSchema>;
export type CreateReviewInput = z.infer<typeof createReviewBodySchema>;
export type ListProductReviewsQuery = z.infer<
  typeof listProductReviewsQuerySchema
>;
export type ListMyReviewsQuery = z.infer<typeof listMyReviewsQuerySchema>;
export type ListAdminReviewsQuery = z.infer<typeof listAdminReviewsQuerySchema>;
export type UpdateReviewStatusInput = z.infer<
  typeof updateReviewStatusBodySchema
>;

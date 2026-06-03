import { z } from 'zod';

export const categoryIdParamsSchema = z.object({
  id: z.uuid('Category id must be a valid UUID'),
});

export const createCategoryBodySchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Category name must be at least 2 characters')
    .max(120, 'Category name must be at most 120 characters'),

  parentId: z.uuid('Parent category id must be a valid UUID').optional(),
});

export const updateCategoryBodySchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, 'Category name must be at least 2 characters')
      .max(120, 'Category name must be at most 120 characters')
      .optional(),

    parentId: z
      .union([z.uuid('Parent category id must be a valid UUID'), z.null()])
      .optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field is required',
  });

export const listCategoriesQuerySchema = z.object({
  parentId: z
    .union([
      z.uuid('Parent category id must be a valid UUID'),
      z.literal('root'),
    ])
    .optional(),

  includeChildren: z
    .enum(['true', 'false'])
    .default('false')
    .transform((value) => value === 'true'),
});

export type CategoryIdParams = z.infer<typeof categoryIdParamsSchema>;
export type CreateCategoryInput = z.infer<typeof createCategoryBodySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategoryBodySchema>;
export type ListCategoriesQuery = z.infer<typeof listCategoriesQuerySchema>;

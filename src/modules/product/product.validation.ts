import { z } from 'zod';

export const createProductValidationSchema = z.object({
  body: z.object({
    title: z.string().min(1, 'Title is required').max(150, 'Title is too long'),
    description: z
      .string()
      .min(1, 'Description is required')
      .max(2000, 'Description is too long'),
    price: z.number().positive('Price must be greater than 0'),
    stock: z.number().int().min(0, 'Stock cannot be negative'),
  }),
});

export const updateProductValidationSchema = z.object({
  body: z.object({
    title: z
      .string()
      .min(1, 'Title is required')
      .max(150, 'Title is too long')
      .optional(),
    description: z
      .string()
      .min(1, 'Description is required')
      .max(2000, 'Description is too long')
      .optional(),
    price: z.number().positive('Prices must be be greater than 0').optional(),
    stock: z.number().int().min(0, 'stock cannot be negative').optional(),
  }),
});

export const productIdParamValidationSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Product id is required'),
  }),
});

export const getAllProductValidationSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
    search: z.string().optional(),
    minPrice: z.coerce.number().min(0).optional(),
    maxPrice: z.coerce.number().min(0).optional(),
    sortBy: z.enum(['createdAt', 'price', 'title']).optional(),
    sortOrder: z.enum(['asc', 'desc']).optional(),
  }),
});

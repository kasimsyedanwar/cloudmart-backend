import { ProductStatus } from '@prisma/client';
import { z } from 'zod';

const productImageSchema = z.object({
  url: z.url('Product image URL must be valid'),
  altText: z
    .string()
    .trim()
    .max(200, 'Alt text must be at most 200 characters')
    .optional(),
  sortOrder: z.coerce.number().int().nonnegative().default(0),
});

export const productIdParamsSchema = z.object({
  id: z.uuid('Product id must be a valid UUID'),
});

export const createProductBodySchema = z.object({
  categoryId: z.uuid('Category id must be a valid UUID').optional(),
  title: z
    .string()
    .trim()
    .min(2, 'Product title must be at least 2 characters')
    .max(200, 'Product title must be at most 200 characters'),
  description: z
    .string()
    .trim()
    .max(5000, 'Description must be at most 5000 characters')
    .optional(),
  price: z.coerce
    .number()
    .positive('Price must be greater than 0')
    .max(999999999, 'Price is too large'),
  lowStockThreshold: z.coerce.number().int().nonnegative().default(5),
  status: z
    .enum([ProductStatus.DRAFT, ProductStatus.ACTIVE])
    .default(ProductStatus.DRAFT),
  images: z.array(productImageSchema).max(10).optional(),
});

export const updateProductBodySchema = z
  .object({
    categoryId: z
      .union([z.uuid('Category id must be a valid UUID'), z.null()])
      .optional(),
    title: z
      .string()
      .trim()
      .min(2, 'Product title must be at least 2 characters')
      .max(200, 'Product title must be at most 200 characters')
      .optional(),
    description: z
      .string()
      .trim()
      .max(5000, 'Description must be at most 5000 characters')
      .optional(),
    price: z.coerce
      .number()
      .positive('Price must be greater than 0')
      .max(999999999, 'Price is too large')
      .optional(),

    lowStockThreshold: z.coerce.number().int().nonnegative().optional(),
    status: z
      .enum([
        ProductStatus.DRAFT,
        ProductStatus.ACTIVE,
        ProductStatus.OUT_OF_STOCK,
        ProductStatus.ARCHIVED,
      ])
      .optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field is required',
  });

export const updateProductStatusBodySchema = z.object({
  status: z.enum([
    ProductStatus.DRAFT,
    ProductStatus.ACTIVE,
    ProductStatus.OUT_OF_STOCK,
    ProductStatus.ARCHIVED,
  ]),
});

export const listPublicProductsQuerySchema = z
  .object({
    search: z.string().trim().min(1).max(100).optional(),

    categoryId: z.uuid('Category id must be a valid UUID').optional(),

    vendorId: z.uuid('Vendor id must be a valid UUID').optional(),

    minPrice: z.coerce.number().nonnegative().optional(),

    maxPrice: z.coerce.number().positive().optional(),

    sortBy: z.enum(['createdAt', 'price', 'title']).default('createdAt'),

    sortOrder: z.enum(['asc', 'desc']).default('desc'),

    page: z.coerce.number().int().positive().default(1),

    limit: z.coerce.number().int().positive().max(100).default(10),
  })
  .refine(
    (data) =>
      data.minPrice === undefined ||
      data.maxPrice === undefined ||
      data.minPrice <= data.maxPrice,
    {
      message: 'minPrice must be less than or equal to maxPrice',
      path: ['minPrice'],
    },
  );

export const listVendorProductsQuerySchema = z.object({
  status: z
    .enum([
      ProductStatus.DRAFT,
      ProductStatus.ACTIVE,
      ProductStatus.OUT_OF_STOCK,
      ProductStatus.ARCHIVED,
    ])
    .optional(),

  search: z.string().trim().min(1).max(100).optional(),

  page: z.coerce.number().int().positive().default(1),

  limit: z.coerce.number().int().positive().max(100).default(10),
});

export const listAdminProductsQuerySchema = z.object({
  status: z
    .enum([
      ProductStatus.DRAFT,
      ProductStatus.ACTIVE,
      ProductStatus.OUT_OF_STOCK,
      ProductStatus.ARCHIVED,
    ])
    .optional(),

  vendorId: z.uuid('Vendor id must be a valid UUID').optional(),

  search: z.string().trim().min(1).max(100).optional(),

  page: z.coerce.number().int().positive().default(1),

  limit: z.coerce.number().int().positive().max(100).default(10),
});

export type ProductIdParams = z.infer<typeof productIdParamsSchema>;
export type CreateProductInput = z.infer<typeof createProductBodySchema>;
export type UpdateProductInput = z.infer<typeof updateProductBodySchema>;
export type UpdateProductStatusInput = z.infer<
  typeof updateProductStatusBodySchema
>;
export type ListPublicProductsQuery = z.infer<
  typeof listPublicProductsQuerySchema
>;
export type ListVendorProductsQuery = z.infer<
  typeof listVendorProductsQuerySchema
>;
export type ListAdminProductsQuery = z.infer<
  typeof listAdminProductsQuerySchema
>;

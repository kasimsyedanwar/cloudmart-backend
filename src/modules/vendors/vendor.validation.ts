import { VendorStatus } from '@prisma/client';
import { z } from 'zod';

export const registerVendorBodySchema = z.object({
  storeName: z
    .string()
    .trim()
    .min(2, 'Store name must be at least 2 characters')
    .max(150, 'Store name must be at most 150 characters'),

  description: z
    .string()
    .trim()
    .max(1000, 'Description must be at most 1000 characters')
    .optional(),
});

export const updateVendorBodySchema = z.object({
  storeName: z
    .string()
    .trim()
    .min(2, 'Store name must be at least 2 characters')
    .max(150, 'Store name must be at most 150 characters')
    .optional(),

  description: z
    .string()
    .trim()
    .max(1000, 'Description must be at most 1000 characters')
    .optional(),
});

export const vendorIdParamsSchema = z.object({
  id: z.uuid('Vendor id must be a valid UUID'),
});

export const updateVendorStatusBodySchema = z.object({
  status: z.enum([
    VendorStatus.APPROVED,
    VendorStatus.REJECTED,
    VendorStatus.SUSPENDED,
  ]),
});

export const listVendorsQuerySchema = z.object({
  status: z
    .enum([
      VendorStatus.PENDING,
      VendorStatus.APPROVED,
      VendorStatus.REJECTED,
      VendorStatus.SUSPENDED,
    ])
    .optional(),

  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
});

export type RegisterVendorInput = z.infer<typeof registerVendorBodySchema>;
export type UpdateVendorInput = z.infer<typeof updateVendorBodySchema>;
export type VendorIdParams = z.infer<typeof vendorIdParamsSchema>;
export type UpdateVendorStatusInput = z.infer<
  typeof updateVendorStatusBodySchema
>;
export type ListVendorsQuery = z.infer<typeof listVendorsQuerySchema>;

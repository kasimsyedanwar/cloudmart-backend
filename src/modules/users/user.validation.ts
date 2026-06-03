import { AddressType, UserRole, UserStatus } from '@prisma/client';
import { z } from 'zod';

export const updateMeBodySchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, 'Name must be at least 2 characters')
      .max(120, 'Name must be at most 120 characters')
      .optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field is required',
  });

const addressBaseSchema = {
  type: z
    .enum([AddressType.SHIPPING, AddressType.BILLING])
    .default(AddressType.SHIPPING),

  fullName: z
    .string()
    .trim()
    .min(2, 'Full name must be at least 2 characters')
    .max(120, 'Full name must be at most 120 characters')
    .optional(),

  phone: z
    .string()
    .trim()
    .min(5, 'Phone must be at least 5 characters')
    .max(30, 'Phone must be at most 30 characters')
    .optional(),

  line1: z
    .string()
    .trim()
    .min(3, 'Address line 1 must be at least 3 characters')
    .max(255, 'Address line 1 must be at most 255 characters'),

  line2: z
    .string()
    .trim()
    .max(255, 'Address line 2 must be at most 255 characters')
    .optional(),

  city: z
    .string()
    .trim()
    .min(2, 'City must be at least 2 characters')
    .max(100, 'City must be at most 100 characters'),

  state: z
    .string()
    .trim()
    .min(2, 'State must be at least 2 characters')
    .max(100, 'State must be at most 100 characters'),

  postalCode: z
    .string()
    .trim()
    .min(3, 'Postal code must be at least 3 characters')
    .max(20, 'Postal code must be at most 20 characters'),

  country: z
    .string()
    .trim()
    .min(2, 'Country must be at least 2 characters')
    .max(100, 'Country must be at most 100 characters')
    .default('India'),

  isDefault: z.boolean().default(false),
};

export const createAddressBodySchema = z.object(addressBaseSchema);

export const updateAddressBodySchema = z
  .object({
    type: z.enum([AddressType.SHIPPING, AddressType.BILLING]).optional(),
    fullName: addressBaseSchema.fullName,
    phone: addressBaseSchema.phone,
    line1: addressBaseSchema.line1.optional(),
    line2: addressBaseSchema.line2,
    city: addressBaseSchema.city.optional(),
    state: addressBaseSchema.state.optional(),
    postalCode: addressBaseSchema.postalCode.optional(),
    country: addressBaseSchema.country.optional(),
    isDefault: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field is required',
  });

export const addressIdParamsSchema = z.object({
  addressId: z.uuid('Address id must be a valid UUID'),
});

export const userIdParamsSchema = z.object({
  id: z.uuid('User id must be a valid UUID'),
});

export const listUsersQuerySchema = z.object({
  role: z.enum([UserRole.ADMIN, UserRole.VENDOR, UserRole.CUSTOMER]).optional(),

  status: z
    .enum([UserStatus.ACTIVE, UserStatus.BLOCKED, UserStatus.DELETED])
    .optional(),

  search: z.string().trim().min(1).max(100).optional(),

  page: z.coerce.number().int().positive().default(1),

  limit: z.coerce.number().int().positive().max(100).default(10),
});

export const updateUserStatusBodySchema = z.object({
  status: z.enum([UserStatus.ACTIVE, UserStatus.BLOCKED, UserStatus.DELETED]),
});

export type UpdateMeInput = z.infer<typeof updateMeBodySchema>;
export type CreateAddressInput = z.infer<typeof createAddressBodySchema>;
export type UpdateAddressInput = z.infer<typeof updateAddressBodySchema>;
export type AddressIdParams = z.infer<typeof addressIdParamsSchema>;
export type UserIdParams = z.infer<typeof userIdParamsSchema>;
export type ListUsersQuery = z.infer<typeof listUsersQuerySchema>;
export type UpdateUserStatusInput = z.infer<typeof updateUserStatusBodySchema>;

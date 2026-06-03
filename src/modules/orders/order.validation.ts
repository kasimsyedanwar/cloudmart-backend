import { OrderStatus, PaymentStatus } from '@prisma/client';
import { z } from 'zod';

export const checkoutBodySchema = z
  .object({
    shippingAddressId: z
      .uuid('Shipping address id must be a valid UUID')
      .optional(),
  })
  .default({});

export const orderIdParamsSchema = z.object({
  id: z.uuid('Order id must be a valid UUID'),
});

export const listMyOrdersQuerySchema = z.object({
  status: z
    .enum([
      OrderStatus.PENDING_PAYMENT,
      OrderStatus.PAID,
      OrderStatus.CONFIRMED,
      OrderStatus.SHIPPED,
      OrderStatus.DELIVERED,
      OrderStatus.CANCELLED,
      OrderStatus.REFUNDED,
    ])
    .optional(),

  paymentStatus: z
    .enum([
      PaymentStatus.PENDING,
      PaymentStatus.SUCCESS,
      PaymentStatus.FAILED,
      PaymentStatus.REFUNDED,
    ])
    .optional(),

  page: z.coerce.number().int().positive().default(1),

  limit: z.coerce.number().int().positive().max(100).default(10),
});

export const listVendorOrdersQuerySchema = z.object({
  status: z
    .enum([
      OrderStatus.PENDING_PAYMENT,
      OrderStatus.PAID,
      OrderStatus.CONFIRMED,
      OrderStatus.SHIPPED,
      OrderStatus.DELIVERED,
      OrderStatus.CANCELLED,
      OrderStatus.REFUNDED,
    ])
    .optional(),

  page: z.coerce.number().int().positive().default(1),

  limit: z.coerce.number().int().positive().max(100).default(10),
});

export const listAdminOrdersQuerySchema = z.object({
  status: z
    .enum([
      OrderStatus.PENDING_PAYMENT,
      OrderStatus.PAID,
      OrderStatus.CONFIRMED,
      OrderStatus.SHIPPED,
      OrderStatus.DELIVERED,
      OrderStatus.CANCELLED,
      OrderStatus.REFUNDED,
    ])
    .optional(),

  paymentStatus: z
    .enum([
      PaymentStatus.PENDING,
      PaymentStatus.SUCCESS,
      PaymentStatus.FAILED,
      PaymentStatus.REFUNDED,
    ])
    .optional(),

  customerId: z.uuid('Customer id must be a valid UUID').optional(),

  vendorId: z.uuid('Vendor id must be a valid UUID').optional(),

  search: z.string().trim().min(1).max(100).optional(),

  page: z.coerce.number().int().positive().default(1),

  limit: z.coerce.number().int().positive().max(100).default(10),
});

export const updateOrderStatusBodySchema = z.object({
  status: z.enum([
    OrderStatus.CONFIRMED,
    OrderStatus.SHIPPED,
    OrderStatus.DELIVERED,
    OrderStatus.CANCELLED,
    OrderStatus.REFUNDED,
  ]),
});

export type CheckoutInput = z.infer<typeof checkoutBodySchema>;
export type OrderIdParams = z.infer<typeof orderIdParamsSchema>;
export type ListMyOrdersQuery = z.infer<typeof listMyOrdersQuerySchema>;
export type ListVendorOrdersQuery = z.infer<typeof listVendorOrdersQuerySchema>;
export type ListAdminOrdersQuery = z.infer<typeof listAdminOrdersQuerySchema>;
export type UpdateOrderStatusInput = z.infer<
  typeof updateOrderStatusBodySchema
>;

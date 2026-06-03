import { randomBytes } from 'crypto';
import {
  OrderStatus,
  PaymentEventType,
  PaymentStatus,
  Prisma,
  ProductStatus,
  UserRole,
} from '@prisma/client';
import prisma from '../../config/prisma';
import { AppError } from '../../common/errors/app-error';
import { ErrorCodes } from '../../common/errors/error-codes';
import {
  MockPaymentFailureInput,
  MockPaymentSuccessInput,
} from './payment.validation';
import { paymentRepository, PaymentWithRelations } from './payment.repository';

type PaymentResponse = {
  id: string;
  orderId: string;
  provider: string;
  amount: string;
  currency: string;
  status: PaymentStatus;
  providerRef: string | null;
  paidAt: Date | null;
  order: {
    id: string;
    orderNumber: string;
    customerId: string;
    status: OrderStatus;
    paymentStatus: PaymentStatus;
    total: string;
    customer: {
      id: string;
      name: string;
      email: string;
      role: UserRole;
    };
    items: {
      id: string;
      productId: string;
      vendorId: string;
      quantity: number;
      priceSnapshot: string;
      lineTotal: string;
      product: {
        id: string;
        title: string;
        slug: string;
        stock: number;
        status: ProductStatus;
      };
      vendor: {
        id: string;
        name: string;
        email: string;
        storeName: string | null;
        storeSlug: string | null;
      };
    }[];
  };
  events: {
    id: string;
    eventType: PaymentEventType;
    rawPayload: Prisma.JsonValue | null;
    createdAt: Date;
  }[];
  createdAt: Date;
  updatedAt: Date;
};

const decimalToString = (value: Prisma.Decimal): string => {
  return value.toFixed(2);
};

const generateMockProviderRef = (prefix: 'SUCCESS' | 'FAILED'): string => {
  const timestamp = Date.now();
  const random = randomBytes(4).toString('hex').toUpperCase();

  return `MOCK-${prefix}-${timestamp}-${random}`;
};

const assertPaymentAccess = ({
  payment,
  actorId,
  actorRole,
}: {
  payment: PaymentWithRelations;
  actorId: string;
  actorRole: UserRole;
}): void => {
  if (actorRole === UserRole.ADMIN) {
    return;
  }

  if (payment.order.customerId !== actorId) {
    throw new AppError({
      message: 'Payment not found',
      statusCode: 404,
      code: ErrorCodes.NOT_FOUND,
    });
  }
};

const assertPaymentIsPending = (payment: PaymentWithRelations): void => {
  if (payment.status !== PaymentStatus.PENDING) {
    throw new AppError({
      message: 'Payment has already been processed',
      statusCode: 400,
      code: ErrorCodes.PAYMENT_ALREADY_PROCESSED,
    });
  }
};

const getProductStatusAfterRestore = ({
  currentStatus,
  stockAfter,
}: {
  currentStatus: ProductStatus;
  stockAfter: number;
}): ProductStatus => {
  if (currentStatus === ProductStatus.ARCHIVED) {
    return ProductStatus.ARCHIVED;
  }

  if (currentStatus === ProductStatus.DRAFT) {
    return ProductStatus.DRAFT;
  }

  if (stockAfter > 0 && currentStatus === ProductStatus.OUT_OF_STOCK) {
    return ProductStatus.ACTIVE;
  }

  return currentStatus;
};

const toPaymentResponse = (payment: PaymentWithRelations): PaymentResponse => {
  return {
    id: payment.id,
    orderId: payment.orderId,
    provider: payment.provider,
    amount: decimalToString(payment.amount),
    currency: payment.currency,
    status: payment.status,
    providerRef: payment.providerRef,
    paidAt: payment.paidAt,
    order: {
      id: payment.order.id,
      orderNumber: payment.order.orderNumber,
      customerId: payment.order.customerId,
      status: payment.order.status,
      paymentStatus: payment.order.paymentStatus,
      total: decimalToString(payment.order.total),
      customer: {
        id: payment.order.customer.id,
        name: payment.order.customer.name,
        email: payment.order.customer.email,
        role: payment.order.customer.role,
      },
      items: payment.order.items.map((item) => ({
        id: item.id,
        productId: item.productId,
        vendorId: item.vendorId,
        quantity: item.quantity,
        priceSnapshot: decimalToString(item.priceSnapshot),
        lineTotal: decimalToString(item.lineTotal),
        product: {
          id: item.product.id,
          title: item.product.title,
          slug: item.product.slug,
          stock: item.product.stock,
          status: item.product.status,
        },
        vendor: {
          id: item.vendor.id,
          name: item.vendor.name,
          email: item.vendor.email,
          storeName: item.vendor.vendorProfile?.storeName ?? null,
          storeSlug: item.vendor.vendorProfile?.slug ?? null,
        },
      })),
    },
    events: payment.events.map((event) => ({
      id: event.id,
      eventType: event.eventType,
      rawPayload: event.rawPayload,
      createdAt: event.createdAt,
    })),
    createdAt: payment.createdAt,
    updatedAt: payment.updatedAt,
  };
};

export const paymentService = {
  getPaymentById: async ({
    paymentId,
    actorId,
    actorRole,
  }: {
    paymentId: string;
    actorId: string;
    actorRole: UserRole;
  }): Promise<PaymentResponse> => {
    const payment = await paymentRepository.findPaymentById({
      paymentId,
    });

    if (!payment) {
      throw new AppError({
        message: 'Payment not found',
        statusCode: 404,
        code: ErrorCodes.NOT_FOUND,
      });
    }

    assertPaymentAccess({
      payment,
      actorId,
      actorRole,
    });

    return toPaymentResponse(payment);
  },

  markMockPaymentSuccess: async ({
    paymentId,
    actorId,
    actorRole,
    input,
  }: {
    paymentId: string;
    actorId: string;
    actorRole: UserRole;
    input: MockPaymentSuccessInput;
  }): Promise<PaymentResponse> => {
    const updatedPayment = await prisma.$transaction(async (tx) => {
      await paymentRepository.lockPaymentRow({
        paymentId,
        tx,
      });

      const payment = await paymentRepository.findPaymentById({
        paymentId,
        tx,
      });

      if (!payment) {
        throw new AppError({
          message: 'Payment not found',
          statusCode: 404,
          code: ErrorCodes.NOT_FOUND,
        });
      }

      assertPaymentAccess({
        payment,
        actorId,
        actorRole,
      });

      assertPaymentIsPending(payment);

      const providerRef =
        input.providerRef ?? generateMockProviderRef('SUCCESS');
      const paidAt = new Date();

      await paymentRepository.updatePayment({
        paymentId,
        status: PaymentStatus.SUCCESS,
        providerRef,
        paidAt,
        tx,
      });

      await paymentRepository.updateOrderPaymentState({
        orderId: payment.orderId,
        orderStatus: OrderStatus.PAID,
        paymentStatus: PaymentStatus.SUCCESS,
        tx,
      });

      await paymentRepository.createPaymentEvent({
        paymentId,
        eventType: PaymentEventType.SUCCESS,
        rawPayload: {
          source: 'mock',
          action: 'mock-success',
          providerRef,
          previousPaymentStatus: payment.status,
          newPaymentStatus: PaymentStatus.SUCCESS,
          previousOrderStatus: payment.order.status,
          newOrderStatus: OrderStatus.PAID,
        },
        tx,
      });

      const refreshedPayment = await paymentRepository.findPaymentById({
        paymentId,
        tx,
      });

      if (!refreshedPayment) {
        throw new AppError({
          message: 'Payment not found after update',
          statusCode: 404,
          code: ErrorCodes.NOT_FOUND,
        });
      }

      return refreshedPayment;
    });

    return toPaymentResponse(updatedPayment);
  },

  markMockPaymentFailure: async ({
    paymentId,
    actorId,
    actorRole,
    input,
  }: {
    paymentId: string;
    actorId: string;
    actorRole: UserRole;
    input: MockPaymentFailureInput;
  }): Promise<PaymentResponse> => {
    const updatedPayment = await prisma.$transaction(async (tx) => {
      await paymentRepository.lockPaymentRow({
        paymentId,
        tx,
      });

      const payment = await paymentRepository.findPaymentById({
        paymentId,
        tx,
      });

      if (!payment) {
        throw new AppError({
          message: 'Payment not found',
          statusCode: 404,
          code: ErrorCodes.NOT_FOUND,
        });
      }

      assertPaymentAccess({
        payment,
        actorId,
        actorRole,
      });

      assertPaymentIsPending(payment);

      const providerRef = generateMockProviderRef('FAILED');
      const failureReason = input.reason ?? 'Mock payment failed';

      await paymentRepository.updatePayment({
        paymentId,
        status: PaymentStatus.FAILED,
        providerRef,
        paidAt: null,
        tx,
      });

      await paymentRepository.updateOrderPaymentState({
        orderId: payment.orderId,
        orderStatus: OrderStatus.CANCELLED,
        paymentStatus: PaymentStatus.FAILED,
        tx,
      });

      await paymentRepository.createPaymentEvent({
        paymentId,
        eventType: PaymentEventType.FAILED,
        rawPayload: {
          source: 'mock',
          action: 'mock-failure',
          providerRef,
          reason: failureReason,
          previousPaymentStatus: payment.status,
          newPaymentStatus: PaymentStatus.FAILED,
          previousOrderStatus: payment.order.status,
          newOrderStatus: OrderStatus.CANCELLED,
        },
        tx,
      });

      const sortedItems = [...payment.order.items].sort((a, b) =>
        a.productId.localeCompare(b.productId),
      );

      for (const item of sortedItems) {
        await paymentRepository.lockProductRow({
          productId: item.productId,
          tx,
        });

        const product = await paymentRepository.findProductByIdForRestore({
          productId: item.productId,
          tx,
        });

        if (!product) {
          throw new AppError({
            message: 'Product not found during stock restore',
            statusCode: 404,
            code: ErrorCodes.NOT_FOUND,
          });
        }

        const stockBefore = product.stock;
        const stockAfter = stockBefore + item.quantity;

        await paymentRepository.updateProductStockAfterPaymentFailure({
          productId: product.id,
          stockAfter,
          status: getProductStatusAfterRestore({
            currentStatus: product.status,
            stockAfter,
          }),
          tx,
        });

        await paymentRepository.createStockRestoreMovement({
          productId: product.id,
          orderId: payment.orderId,
          actorId,
          quantity: item.quantity,
          reason: `Payment failed. Stock restored for order ${payment.order.orderNumber}`,
          stockBefore,
          stockAfter,
          tx,
        });
      }

      const refreshedPayment = await paymentRepository.findPaymentById({
        paymentId,
        tx,
      });

      if (!refreshedPayment) {
        throw new AppError({
          message: 'Payment not found after update',
          statusCode: 404,
          code: ErrorCodes.NOT_FOUND,
        });
      }

      return refreshedPayment;
    });

    return toPaymentResponse(updatedPayment);
  },
};

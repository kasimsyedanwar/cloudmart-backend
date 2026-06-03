import { randomBytes } from 'crypto';
import {
  Address,
  OrderStatus,
  PaymentStatus,
  Prisma,
  Product,
  ProductStatus,
} from '@prisma/client';
import prisma from '../../config/prisma';
import { AppError } from '../../common/errors/app-error';
import { ErrorCodes } from '../../common/errors/error-codes';
import { CheckoutInput } from './order.validation';
import {
  CheckoutOrderItemInput,
  orderRepository,
  OrderWithRelations,
} from './order.repository';

type CheckoutResponse = {
  order: {
    id: string;
    orderNumber: string;
    customerId: string;
    status: OrderStatus;
    paymentStatus: PaymentStatus;
    subtotal: string;
    tax: string;
    shippingFee: string;
    total: string;
    shippingAddressSnapshot: Prisma.JsonValue | null;
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
      };
      vendor: {
        id: string;
        name: string;
        email: string;
        storeName: string | null;
        storeSlug: string | null;
      };
    }[];
    payment: {
      id: string;
      provider: string;
      amount: string;
      currency: string;
      status: PaymentStatus;
    } | null;
    createdAt: Date;
  };
};

type StockDeductionPlan = {
  productId: string;
  stockBefore: number;
  stockAfter: number;
  quantity: number;
  nextStatus: ProductStatus;
};

const generateOrderNumber = (): string => {
  const timestamp = Date.now();
  const random = randomBytes(4).toString('hex').toUpperCase();

  return `CM-${timestamp}-${random}`;
};

const decimalToString = (value: Prisma.Decimal): string => {
  return value.toFixed(2);
};

const createShippingAddressSnapshot = (
  address: Address,
): Prisma.InputJsonValue => {
  return {
    id: address.id,
    type: address.type,
    fullName: address.fullName,
    phone: address.phone,
    line1: address.line1,
    line2: address.line2,
    city: address.city,
    state: address.state,
    postalCode: address.postalCode,
    country: address.country,
  };
};

const getNextProductStatusAfterCheckout = ({
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

  if (stockAfter <= 0) {
    return ProductStatus.OUT_OF_STOCK;
  }

  return currentStatus;
};

const assertProductCanCheckout = ({
  product,
  quantity,
}: {
  product: Product | null;
  quantity: number;
}): Product => {
  if (!product || product.status !== ProductStatus.ACTIVE) {
    throw new AppError({
      message: 'Product is not available for checkout',
      statusCode: 400,
      code: ErrorCodes.BAD_REQUEST,
    });
  }

  if (product.stock < quantity) {
    throw new AppError({
      message: `Insufficient stock for product ${product.title}. Available: ${product.stock}`,
      statusCode: 400,
      code: ErrorCodes.BAD_REQUEST,
    });
  }

  return product;
};

const toCheckoutResponse = (order: OrderWithRelations): CheckoutResponse => {
  return {
    order: {
      id: order.id,
      orderNumber: order.orderNumber,
      customerId: order.customerId,
      status: order.status,
      paymentStatus: order.paymentStatus,
      subtotal: decimalToString(order.subtotal),
      tax: decimalToString(order.tax),
      shippingFee: decimalToString(order.shippingFee),
      total: decimalToString(order.total),
      shippingAddressSnapshot: order.shippingAddressSnapshot,
      items: order.items.map((item) => ({
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
        },
        vendor: {
          id: item.vendor.id,
          name: item.vendor.name,
          email: item.vendor.email,
          storeName: item.vendor.vendorProfile?.storeName ?? null,
          storeSlug: item.vendor.vendorProfile?.slug ?? null,
        },
      })),
      payment: order.payment
        ? {
            id: order.payment.id,
            provider: order.payment.provider,
            amount: decimalToString(order.payment.amount),
            currency: order.payment.currency,
            status: order.payment.status,
          }
        : null,
      createdAt: order.createdAt,
    },
  };
};

export const orderService = {
  checkout: async ({
    userId,
    input,
  }: {
    userId: string;
    input: CheckoutInput;
  }): Promise<CheckoutResponse> => {
    const order = await prisma.$transaction(
      async (tx) => {
        const cart = await orderRepository.findActiveCartForCheckout({
          userId,
          tx,
        });

        if (!cart || cart.items.length === 0) {
          throw new AppError({
            message: 'Cart is empty',
            statusCode: 400,
            code: ErrorCodes.BAD_REQUEST,
          });
        }

        const shippingAddress = input.shippingAddressId
          ? await orderRepository.findAddressByIdForUser({
              userId,
              addressId: input.shippingAddressId,
              tx,
            })
          : await orderRepository.findDefaultShippingAddress({
              userId,
              tx,
            });

        if (!shippingAddress) {
          throw new AppError({
            message: 'Shipping address not found',
            statusCode: 400,
            code: ErrorCodes.BAD_REQUEST,
          });
        }

        const sortedCartItems = [...cart.items].sort((a, b) =>
          a.productId.localeCompare(b.productId),
        );

        const orderItems: CheckoutOrderItemInput[] = [];
        const stockDeductionPlans: StockDeductionPlan[] = [];
        let subtotal = new Prisma.Decimal(0);

        for (const item of sortedCartItems) {
          await orderRepository.lockProductRow({
            productId: item.productId,
            tx,
          });

          const product = await orderRepository.findProductByIdForCheckout({
            productId: item.productId,
            tx,
          });

          const activeProduct = assertProductCanCheckout({
            product,
            quantity: item.quantity,
          });

          const priceSnapshot = activeProduct.price;
          const lineTotal = priceSnapshot.mul(item.quantity);
          const stockBefore = activeProduct.stock;
          const stockAfter = stockBefore - item.quantity;

          subtotal = subtotal.add(lineTotal);

          orderItems.push({
            productId: activeProduct.id,
            vendorId: activeProduct.vendorId,
            quantity: item.quantity,
            priceSnapshot,
            lineTotal,
          });

          stockDeductionPlans.push({
            productId: activeProduct.id,
            stockBefore,
            stockAfter,
            quantity: item.quantity,
            nextStatus: getNextProductStatusAfterCheckout({
              currentStatus: activeProduct.status,
              stockAfter,
            }),
          });
        }

        const tax = new Prisma.Decimal(0);
        const shippingFee = new Prisma.Decimal(0);
        const total = subtotal.add(tax).add(shippingFee);
        const orderNumber = generateOrderNumber();

        const createdOrder = await orderRepository.createOrderWithPayment({
          customerId: userId,
          orderNumber,
          subtotal,
          tax,
          shippingFee,
          total,
          shippingAddressSnapshot:
            createShippingAddressSnapshot(shippingAddress),
          items: orderItems,
          tx,
        });

        for (const deduction of stockDeductionPlans) {
          await orderRepository.updateProductStockAfterCheckout({
            productId: deduction.productId,
            stockAfter: deduction.stockAfter,
            status: deduction.nextStatus,
            tx,
          });

          await orderRepository.createCheckoutInventoryMovement({
            productId: deduction.productId,
            orderId: createdOrder.id,
            actorId: userId,
            quantity: deduction.quantity,
            reason: `Checkout stock deduction for order ${orderNumber}`,
            stockBefore: deduction.stockBefore,
            stockAfter: deduction.stockAfter,
            tx,
          });
        }

        await orderRepository.clearAndCheckoutCart({
          cartId: cart.id,
          tx,
        });

        return createdOrder;
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
      },
    );

    return toCheckoutResponse(order);
  },
};

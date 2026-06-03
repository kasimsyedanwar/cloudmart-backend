import {
  Cart,
  CartItem,
  CartStatus,
  Prisma,
  ProductStatus,
} from '@prisma/client';
import prisma from '../../config/prisma';

type PrismaTransactionClient = Prisma.TransactionClient;
type PrismaClientLike = typeof prisma | PrismaTransactionClient;

const getClient = (tx?: PrismaTransactionClient): PrismaClientLike => {
  return tx ?? prisma;
};

const cartInclude = {
  items: {
    orderBy: {
      createdAt: 'desc',
    },
    include: {
      product: {
        include: {
          vendor: {
            select: {
              id: true,
              name: true,
              email: true,
              vendorProfile: {
                select: {
                  id: true,
                  storeName: true,
                  slug: true,
                  status: true,
                },
              },
            },
          },
          category: true,
          images: {
            orderBy: {
              sortOrder: 'asc',
            },
          },
        },
      },
    },
  },
} satisfies Prisma.CartInclude;

export type CartWithItems = Prisma.CartGetPayload<{
  include: typeof cartInclude;
}>;

export const cartRepository = {
  findActiveCartByUserId: async (
    userId: string,
    tx?: PrismaTransactionClient,
  ): Promise<CartWithItems | null> => {
    const client = getClient(tx);

    return client.cart.findFirst({
      where: {
        userId,
        status: CartStatus.ACTIVE,
      },
      include: cartInclude,
      orderBy: {
        createdAt: 'desc',
      },
    });
  },

  createActiveCart: async (
    userId: string,
    tx?: PrismaTransactionClient,
  ): Promise<Cart> => {
    const client = getClient(tx);

    return client.cart.create({
      data: {
        userId,
        status: CartStatus.ACTIVE,
      },
    });
  },

  findProductForCart: async (productId: string) => {
    return prisma.product.findUnique({
      where: {
        id: productId,
      },
      include: {
        vendor: {
          select: {
            id: true,
            name: true,
            vendorProfile: {
              select: {
                status: true,
              },
            },
          },
        },
      },
    });
  },

  findCartItemByCartAndProduct: async ({
    cartId,
    productId,
    tx,
  }: {
    cartId: string;
    productId: string;
    tx?: PrismaTransactionClient;
  }): Promise<CartItem | null> => {
    const client = getClient(tx);

    return client.cartItem.findUnique({
      where: {
        cartId_productId: {
          cartId,
          productId,
        },
      },
    });
  },

  findCartItemById: async (
    itemId: string,
  ): Promise<(CartItem & { cart: Cart }) | null> => {
    return prisma.cartItem.findUnique({
      where: {
        id: itemId,
      },
      include: {
        cart: true,
      },
    });
  },

  createCartItem: async ({
    cartId,
    productId,
    quantity,
    priceSnapshot,
    tx,
  }: {
    cartId: string;
    productId: string;
    quantity: number;
    priceSnapshot: Prisma.Decimal;
    tx?: PrismaTransactionClient;
  }): Promise<CartItem> => {
    const client = getClient(tx);

    return client.cartItem.create({
      data: {
        cartId,
        productId,
        quantity,
        priceSnapshot,
      },
    });
  },

  updateCartItem: async ({
    itemId,
    quantity,
    priceSnapshot,
    tx,
  }: {
    itemId: string;
    quantity: number;
    priceSnapshot?: Prisma.Decimal;
    tx?: PrismaTransactionClient;
  }): Promise<CartItem> => {
    const client = getClient(tx);

    return client.cartItem.update({
      where: {
        id: itemId,
      },
      data: {
        quantity,
        priceSnapshot,
      },
    });
  },

  deleteCartItem: async (
    itemId: string,
    tx?: PrismaTransactionClient,
  ): Promise<CartItem> => {
    const client = getClient(tx);

    return client.cartItem.delete({
      where: {
        id: itemId,
      },
    });
  },

  deleteCartItemsByCartId: async (
    cartId: string,
    tx?: PrismaTransactionClient,
  ): Promise<void> => {
    const client = getClient(tx);

    await client.cartItem.deleteMany({
      where: {
        cartId,
      },
    });
  },

  getCartByIdWithItems: async (
    cartId: string,
    tx?: PrismaTransactionClient,
  ): Promise<CartWithItems | null> => {
    const client = getClient(tx);

    return client.cart.findUnique({
      where: {
        id: cartId,
      },
      include: cartInclude,
    });
  },

  getProductActiveStatus: (): ProductStatus => {
    return ProductStatus.ACTIVE;
  },
};

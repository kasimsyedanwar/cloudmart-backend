import {
  CartItem,
  CartStatus,
  Prisma,
  Product,
  ProductStatus,
  VendorStatus,
} from '@prisma/client';
import prisma from '../../config/prisma';
import { AppError } from '../../common/errors/app-error';
import { ErrorCodes } from '../../common/errors/error-codes';
import { AddCartItemInput, UpdateCartItemInput } from './cart.validation';
import { cartRepository, CartWithItems } from './cart.repository';

type CartItemResponse = {
  id: string;
  productId: string;
  quantity: number;
  priceSnapshot: string;
  lineTotal: string;
  product: {
    id: string;
    title: string;
    slug: string;
    description: string | null;
    price: string;
    stock: number;
    status: ProductStatus;
    lowStockThreshold: number;
    imageUrl: string | null;
    vendor: {
      id: string;
      name: string;
      storeName: string | null;
      storeSlug: string | null;
      vendorStatus: VendorStatus | null;
    };
    category: {
      id: string;
      name: string;
      slug: string;
    } | null;
  };
  stockWarning: string | null;
  createdAt: Date;
  updatedAt: Date;
};

type CartResponse = {
  id: string;
  userId: string;
  status: CartStatus;
  items: CartItemResponse[];
  summary: {
    totalItems: number;
    uniqueItems: number;
    subtotal: string;
    hasStockIssues: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
};

const decimalToString = (value: Prisma.Decimal): string => {
  return value.toFixed(2);
};

const getLineTotal = ({
  price,
  quantity,
}: {
  price: Prisma.Decimal;
  quantity: number;
}): Prisma.Decimal => {
  return price.mul(quantity);
};

const getStockWarning = ({
  product,
  quantity,
}: {
  product: {
    stock: number;
    status: ProductStatus;
  };
  quantity: number;
}): string | null => {
  if (product.status !== ProductStatus.ACTIVE) {
    return 'Product is not currently available';
  }

  if (product.stock <= 0) {
    return 'Product is out of stock';
  }

  if (quantity > product.stock) {
    return `Only ${product.stock} unit(s) available`;
  }

  return null;
};

const toCartResponse = (cart: CartWithItems): CartResponse => {
  let subtotal = new Prisma.Decimal(0);
  let totalItems = 0;
  let hasStockIssues = false;

  const items = cart.items.map((item) => {
    const lineTotal = getLineTotal({
      price: item.priceSnapshot,
      quantity: item.quantity,
    });

    subtotal = subtotal.add(lineTotal);
    totalItems += item.quantity;

    const stockWarning = getStockWarning({
      product: item.product,
      quantity: item.quantity,
    });

    if (stockWarning) {
      hasStockIssues = true;
    }

    return {
      id: item.id,
      productId: item.productId,
      quantity: item.quantity,
      priceSnapshot: decimalToString(item.priceSnapshot),
      lineTotal: decimalToString(lineTotal),
      product: {
        id: item.product.id,
        title: item.product.title,
        slug: item.product.slug,
        description: item.product.description,
        price: decimalToString(item.product.price),
        stock: item.product.stock,
        status: item.product.status,
        lowStockThreshold: item.product.lowStockThreshold,
        imageUrl: item.product.images[0]?.url ?? null,
        vendor: {
          id: item.product.vendor.id,
          name: item.product.vendor.name,
          storeName: item.product.vendor.vendorProfile?.storeName ?? null,
          storeSlug: item.product.vendor.vendorProfile?.slug ?? null,
          vendorStatus: item.product.vendor.vendorProfile?.status ?? null,
        },
        category: item.product.category
          ? {
              id: item.product.category.id,
              name: item.product.category.name,
              slug: item.product.category.slug,
            }
          : null,
      },
      stockWarning,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };
  });

  return {
    id: cart.id,
    userId: cart.userId,
    status: cart.status,
    items,
    summary: {
      totalItems,
      uniqueItems: items.length,
      subtotal: decimalToString(subtotal),
      hasStockIssues,
    },
    createdAt: cart.createdAt,
    updatedAt: cart.updatedAt,
  };
};

const ensureProductCanBeAddedToCart = ({
  product,
  requestedQuantity,
}: {
  product: Product | null;
  requestedQuantity: number;
}): Product => {
  if (!product || product.status !== ProductStatus.ACTIVE) {
    throw new AppError({
      message: 'Product not found or not available',
      statusCode: 404,
      code: ErrorCodes.NOT_FOUND,
    });
  }

  if (product.stock <= 0) {
    throw new AppError({
      message: 'Product is out of stock',
      statusCode: 400,
      code: ErrorCodes.BAD_REQUEST,
    });
  }

  if (requestedQuantity > product.stock) {
    throw new AppError({
      message: `Only ${product.stock} unit(s) available`,
      statusCode: 400,
      code: ErrorCodes.BAD_REQUEST,
    });
  }

  return product;
};

const assertCartItemOwnership = ({
  cartItem,
  userId,
}: {
  cartItem:
    | (CartItem & { cart: { userId: string; status: CartStatus } })
    | null;
  userId: string;
}): CartItem & { cart: { userId: string; status: CartStatus } } => {
  if (
    !cartItem ||
    cartItem.cart.userId !== userId ||
    cartItem.cart.status !== CartStatus.ACTIVE
  ) {
    throw new AppError({
      message: 'Cart item not found',
      statusCode: 404,
      code: ErrorCodes.NOT_FOUND,
    });
  }

  return cartItem;
};

const getOrCreateActiveCart = async ({
  userId,
  tx,
}: {
  userId: string;
  tx: Prisma.TransactionClient;
}) => {
  const existingCart = await cartRepository.findActiveCartByUserId(userId, tx);

  if (existingCart) {
    return existingCart;
  }

  return cartRepository.createActiveCart(userId, tx);
};

const getRequiredCartResponse = async ({
  cartId,
  tx,
}: {
  cartId: string;
  tx?: Prisma.TransactionClient;
}): Promise<CartResponse> => {
  const cart = await cartRepository.getCartByIdWithItems(cartId, tx);

  if (!cart) {
    throw new AppError({
      message: 'Cart not found',
      statusCode: 404,
      code: ErrorCodes.NOT_FOUND,
    });
  }

  return toCartResponse(cart);
};

export const cartService = {
  getMyCart: async (userId: string): Promise<CartResponse> => {
    const cart = await cartRepository.findActiveCartByUserId(userId);

    if (!cart) {
      return {
        id: '',
        userId,
        status: CartStatus.ACTIVE,
        items: [],
        summary: {
          totalItems: 0,
          uniqueItems: 0,
          subtotal: '0.00',
          hasStockIssues: false,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }

    return toCartResponse(cart);
  },

  addItemToCart: async ({
    userId,
    input,
  }: {
    userId: string;
    input: AddCartItemInput;
  }): Promise<CartResponse> => {
    return prisma.$transaction(async (tx) => {
      const product = await cartRepository.findProductForCart(input.productId);

      const activeProduct = ensureProductCanBeAddedToCart({
        product,
        requestedQuantity: input.quantity,
      });

      const cart = await getOrCreateActiveCart({
        userId,
        tx,
      });

      const existingItem = await cartRepository.findCartItemByCartAndProduct({
        cartId: cart.id,
        productId: input.productId,
        tx,
      });

      if (existingItem) {
        const nextQuantity = existingItem.quantity + input.quantity;

        ensureProductCanBeAddedToCart({
          product: activeProduct,
          requestedQuantity: nextQuantity,
        });

        await cartRepository.updateCartItem({
          itemId: existingItem.id,
          quantity: nextQuantity,
          priceSnapshot: activeProduct.price,
          tx,
        });
      } else {
        await cartRepository.createCartItem({
          cartId: cart.id,
          productId: input.productId,
          quantity: input.quantity,
          priceSnapshot: activeProduct.price,
          tx,
        });
      }

      return getRequiredCartResponse({
        cartId: cart.id,
        tx,
      });
    });
  },

  updateCartItem: async ({
    userId,
    itemId,
    input,
  }: {
    userId: string;
    itemId: string;
    input: UpdateCartItemInput;
  }): Promise<CartResponse> => {
    return prisma.$transaction(async (tx) => {
      const cartItem = await cartRepository.findCartItemById(itemId);

      const ownedCartItem = assertCartItemOwnership({
        cartItem,
        userId,
      });

      const product = await cartRepository.findProductForCart(
        ownedCartItem.productId,
      );

      const activeProduct = ensureProductCanBeAddedToCart({
        product,
        requestedQuantity: input.quantity,
      });

      await cartRepository.updateCartItem({
        itemId,
        quantity: input.quantity,
        priceSnapshot: activeProduct.price,
        tx,
      });

      return getRequiredCartResponse({
        cartId: ownedCartItem.cartId,
        tx,
      });
    });
  },

  removeCartItem: async ({
    userId,
    itemId,
  }: {
    userId: string;
    itemId: string;
  }): Promise<CartResponse> => {
    return prisma.$transaction(async (tx) => {
      const cartItem = await cartRepository.findCartItemById(itemId);

      const ownedCartItem = assertCartItemOwnership({
        cartItem,
        userId,
      });

      await cartRepository.deleteCartItem(itemId, tx);

      return getRequiredCartResponse({
        cartId: ownedCartItem.cartId,
        tx,
      });
    });
  },

  clearMyCart: async (userId: string): Promise<CartResponse> => {
    return prisma.$transaction(async (tx) => {
      const cart = await cartRepository.findActiveCartByUserId(userId, tx);

      if (!cart) {
        return {
          id: '',
          userId,
          status: CartStatus.ACTIVE,
          items: [],
          summary: {
            totalItems: 0,
            uniqueItems: 0,
            subtotal: '0.00',
            hasStockIssues: false,
          },
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      }

      await cartRepository.deleteCartItemsByCartId(cart.id, tx);

      return getRequiredCartResponse({
        cartId: cart.id,
        tx,
      });
    });
  },
};

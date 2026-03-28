import { prisma } from '../../config/db';
import { AppError } from '../../common/errors/AppError';
import { redis } from '../../config/redis';

const PRODUCT_LIST_CACHE_PREFIX = 'products:list:';
const PRODUCT_SINGLE_CACHE_PREFIX = 'products:single:';

const buildProductListCacheKey = (query: Record<string, unknown>) => {
  return `${PRODUCT_LIST_CACHE_PREFIX}${JSON.stringify(query)}`;
};

const buildProductSingleCacheKey = (id: string) => {
  return `${PRODUCT_SINGLE_CACHE_PREFIX}${id}`;
};

const clearProductCache = async () => {
  const listKeys = await redis.keys(`${PRODUCT_LIST_CACHE_PREFIX}*`);
  const singleKeys = await redis.keys(`${PRODUCT_SINGLE_CACHE_PREFIX}*`);

  const keys = [...listKeys, ...singleKeys];

  if (keys.length > 0) {
    await redis.del(...keys);
  }
};

const createProduct = async (
  userId: string,
  payload: {
    title: string;
    description: string;
    price: number;
    stock: number;
  },
) => {
  const product = await prisma.product.create({
    data: {
      ...payload,
      vendorId: userId,
    },
  });

  await clearProductCache();

  return product;
};

const getAllProducts = async (query: {
  page?: number;
  limit?: number;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: 'createdAt' | 'price' | 'title';
  sortOrder?: 'asc' | 'desc';
}) => {
  const cacheKey = buildProductListCacheKey(query);
  const cachedData = await redis.get(cacheKey);

  if (cachedData) {
    return JSON.parse(cachedData);
  }

  const page = query.page ?? 1;
  const limit = query.limit ?? 10;
  const skip = (page - 1) * limit;

  const where: {
    AND: Array<Record<string, unknown>>;
  } = {
    AND: [],
  };

  if (query.search) {
    where.AND.push({
      OR: [
        {
          title: {
            contains: query.search,
            mode: 'insensitive',
          },
        },
        {
          description: {
            contains: query.search,
            mode: 'insensitive',
          },
        },
      ],
    });
  }

  if (query.minPrice !== undefined || query.maxPrice !== undefined) {
    where.AND.push({
      price: {
        gte: query.minPrice,
        lte: query.maxPrice,
      },
    });
  }

  const orderBy = {
    [query.sortBy ?? 'createdAt']: query.sortOrder ?? 'desc',
  };

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where: where.AND.length ? where : undefined,
      include: {
        vendor: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy,
      skip,
      take: limit,
    }),
    prisma.product.count({
      where: where.AND.length ? where : undefined,
    }),
  ]);

  const result = {
    meta: {
      page,
      limit,
      total,
      totalPage: Math.ceil(total / limit),
    },
    data: products,
  };

  await redis.set(cacheKey, JSON.stringify(result), 'EX', 60);

  return result;
};

const getSingleProduct = async (id: string) => {
  const cacheKey = buildProductSingleCacheKey(id);
  const cachedData = await redis.get(cacheKey);

  if (cachedData) {
    return JSON.parse(cachedData);
  }

  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      vendor: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  if (!product) {
    throw new AppError('Product not found', 404);
  }

  await redis.set(cacheKey, JSON.stringify(product), 'EX', 60);

  return product;
};

const updateProduct = async (
  userId: string,
  userRole: string,
  id: string,
  payload: Partial<{
    title: string;
    description: string;
    price: number;
    stock: number;
  }>,
) => {
  const product = await prisma.product.findUnique({
    where: { id },
  });

  if (!product) {
    throw new AppError('Product not found', 404);
  }

  if (product.vendorId !== userId && userRole !== 'ADMIN') {
    throw new AppError('You are not allowed to update this product', 403);
  }

  const updatedProduct = await prisma.product.update({
    where: { id },
    data: payload,
  });

  await clearProductCache();

  return updatedProduct;
};

const deleteProduct = async (userId: string, userRole: string, id: string) => {
  const product = await prisma.product.findUnique({
    where: { id },
  });

  if (!product) {
    throw new AppError('Product not found', 404);
  }

  if (product.vendorId !== userId && userRole !== 'ADMIN') {
    throw new AppError('You are not allowed to delete this product', 403);
  }

  await prisma.product.delete({
    where: { id },
  });

  await clearProductCache();

  return null;
};

export const ProductService = {
  createProduct,
  getAllProducts,
  getSingleProduct,
  updateProduct,
  deleteProduct,
};

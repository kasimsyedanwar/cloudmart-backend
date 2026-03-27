import { prisma } from '../../config/db';
import { AppError } from '../../common/errors/AppError';

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

  return product;
};

const getAllProducts = async () => {
  const products = await prisma.product.findMany({
    include: {
      vendor: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return products;
};

const getSingleProduct = async (id: string) => {
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

  return null;
};

export const ProductService = {
  createProduct,
  getAllProducts,
  getSingleProduct,
  updateProduct,
  deleteProduct,
};

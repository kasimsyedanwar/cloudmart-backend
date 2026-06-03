import {
  Prisma,
  Product,
  ProductStatus,
  VendorProfile,
  VendorStatus,
} from '@prisma/client';
import prisma from '../../config/prisma';
import { CreateProductInput } from './product.validation';

const productInclude = {
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
} satisfies Prisma.ProductInclude;

export type ProductWithRelations = Prisma.ProductGetPayload<{
  include: typeof productInclude;
}>;

export const productRepository = {
  findCategoryById: async (categoryId: string) => {
    return prisma.category.findUnique({
      where: {
        id: categoryId,
      },
    });
  },

  findVendorProfileByUserId: async (
    userId: string,
  ): Promise<VendorProfile | null> => {
    return prisma.vendorProfile.findUnique({
      where: {
        userId,
      },
    });
  },

  findProductById: async (id: string): Promise<ProductWithRelations | null> => {
    return prisma.product.findUnique({
      where: {
        id,
      },
      include: productInclude,
    });
  },

  findProductByVendorAndSlug: async ({
    vendorId,
    slug,
  }: {
    vendorId: string;
    slug: string;
  }): Promise<Product | null> => {
    return prisma.product.findUnique({
      where: {
        vendorId_slug: {
          vendorId,
          slug,
        },
      },
    });
  },

  createProduct: async ({
    vendorId,
    input,
    slug,
  }: {
    vendorId: string;
    input: CreateProductInput;
    slug: string;
  }): Promise<ProductWithRelations> => {
    return prisma.product.create({
      data: {
        vendor: {
          connect: {
            id: vendorId,
          },
        },
        category: input.categoryId
          ? {
              connect: {
                id: input.categoryId,
              },
            }
          : undefined,
        title: input.title,
        slug,
        description: input.description,
        price: new Prisma.Decimal(input.price),
        stock: 0,
        lowStockThreshold: input.lowStockThreshold,
        status: input.status,
        images: input.images?.length
          ? {
              create: input.images.map((image, index) => ({
                url: image.url,
                altText: image.altText,
                sortOrder: image.sortOrder || index + 1,
              })),
            }
          : undefined,
      },
      include: productInclude,
    });
  },

  updateProduct: async ({
    id,
    data,
  }: {
    id: string;
    data: Prisma.ProductUpdateInput;
  }): Promise<ProductWithRelations> => {
    return prisma.product.update({
      where: {
        id,
      },
      data,
      include: productInclude,
    });
  },

  archiveProduct: async (id: string): Promise<ProductWithRelations> => {
    return prisma.product.update({
      where: {
        id,
      },
      data: {
        status: ProductStatus.ARCHIVED,
      },
      include: productInclude,
    });
  },

  listProducts: async ({
    where,
    orderBy,
    skip,
    take,
  }: {
    where: Prisma.ProductWhereInput;
    orderBy: Prisma.ProductOrderByWithRelationInput;
    skip: number;
    take: number;
  }): Promise<ProductWithRelations[]> => {
    return prisma.product.findMany({
      where,
      include: productInclude,
      orderBy,
      skip,
      take,
    });
  },

  countProducts: async (where: Prisma.ProductWhereInput): Promise<number> => {
    return prisma.product.count({
      where,
    });
  },

  updateProductStatus: async ({
    id,
    status,
  }: {
    id: string;
    status: ProductStatus;
  }): Promise<ProductWithRelations> => {
    return prisma.product.update({
      where: {
        id,
      },
      data: {
        status,
      },
      include: productInclude,
    });
  },

  findApprovedVendorProfileByUserId: async (
    userId: string,
  ): Promise<VendorProfile | null> => {
    return prisma.vendorProfile.findFirst({
      where: {
        userId,
        status: VendorStatus.APPROVED,
      },
    });
  },
};

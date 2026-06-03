import { Category, Prisma } from '@prisma/client';
import prisma from '../../config/prisma';

type CategoryWithChildren = Category & {
  children: Category[];
  parent: Category | null;
};

export const categoryRepository = {
  findCategoryById: async (
    id: string,
  ): Promise<CategoryWithChildren | null> => {
    return prisma.category.findUnique({
      where: {
        id,
      },
      include: {
        parent: true,
        children: {
          orderBy: {
            name: 'asc',
          },
        },
      },
    });
  },

  findCategoryBySlug: async (slug: string): Promise<Category | null> => {
    return prisma.category.findUnique({
      where: {
        slug,
      },
    });
  },

  listCategories: async ({
    where,
    includeChildren,
  }: {
    where: Prisma.CategoryWhereInput;
    includeChildren: boolean;
  }): Promise<CategoryWithChildren[]> => {
    return prisma.category.findMany({
      where,
      include: {
        parent: true,
        children: includeChildren
          ? {
              orderBy: {
                name: 'asc',
              },
            }
          : false,
      },
      orderBy: {
        name: 'asc',
      },
    });
  },

  createCategory: async ({
    name,
    slug,
    parentId,
  }: {
    name: string;
    slug: string;
    parentId?: string;
  }): Promise<Category> => {
    return prisma.category.create({
      data: {
        name,
        slug,
        parentId,
      },
    });
  },

  updateCategory: async ({
    id,
    data,
  }: {
    id: string;
    data: Prisma.CategoryUpdateInput;
  }): Promise<Category> => {
    return prisma.category.update({
      where: {
        id,
      },
      data,
    });
  },

  deleteCategory: async (id: string): Promise<Category> => {
    return prisma.category.delete({
      where: {
        id,
      },
    });
  },

  countProductsInCategory: async (categoryId: string): Promise<number> => {
    return prisma.product.count({
      where: {
        categoryId,
      },
    });
  },

  countChildren: async (categoryId: string): Promise<number> => {
    return prisma.category.count({
      where: {
        parentId: categoryId,
      },
    });
  },
};

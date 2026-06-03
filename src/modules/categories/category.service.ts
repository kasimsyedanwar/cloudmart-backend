import { Category, Prisma } from '@prisma/client';
import { AppError } from '../../common/errors/app-error';
import { ErrorCodes } from '../../common/errors/error-codes';
import { createSlug } from '../../common/utils/slug';
import {
  CreateCategoryInput,
  ListCategoriesQuery,
  UpdateCategoryInput,
} from './category.validation';
import { categoryRepository } from './category.repository';

type CategoryResponse = {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  parent?: {
    id: string;
    name: string;
    slug: string;
  } | null;
  children?: {
    id: string;
    name: string;
    slug: string;
    parentId: string | null;
  }[];
  createdAt: Date;
  updatedAt: Date;
};

const toCategoryResponse = (
  category: Category & {
    parent?: Category | null;
    children?: Category[];
  },
): CategoryResponse => {
  return {
    id: category.id,
    name: category.name,
    slug: category.slug,
    parentId: category.parentId,
    parent: category.parent
      ? {
          id: category.parent.id,
          name: category.parent.name,
          slug: category.parent.slug,
        }
      : undefined,
    children: category.children?.map((child) => ({
      id: child.id,
      name: child.name,
      slug: child.slug,
      parentId: child.parentId,
    })),
    createdAt: category.createdAt,
    updatedAt: category.updatedAt,
  };
};

const ensureUniqueSlug = async ({
  slug,
  currentCategoryId,
}: {
  slug: string;
  currentCategoryId?: string;
}): Promise<void> => {
  const existingCategory = await categoryRepository.findCategoryBySlug(slug);

  if (existingCategory && existingCategory.id !== currentCategoryId) {
    throw new AppError({
      message: 'Category name is already taken',
      statusCode: 409,
      code: ErrorCodes.CONFLICT,
    });
  }
};

const ensureParentCategoryExists = async (
  parentId?: string | null,
): Promise<void> => {
  if (!parentId) {
    return;
  }

  const parentCategory = await categoryRepository.findCategoryById(parentId);

  if (!parentCategory) {
    throw new AppError({
      message: 'Parent category not found',
      statusCode: 404,
      code: ErrorCodes.NOT_FOUND,
    });
  }
};

export const categoryService = {
  listCategories: async (
    query: ListCategoriesQuery,
  ): Promise<CategoryResponse[]> => {
    const where: Prisma.CategoryWhereInput =
      query.parentId === 'root'
        ? {
            parentId: null,
          }
        : query.parentId
          ? {
              parentId: query.parentId,
            }
          : {};

    const categories = await categoryRepository.listCategories({
      where,
      includeChildren: query.includeChildren,
    });

    return categories.map(toCategoryResponse);
  },

  getCategoryById: async (id: string): Promise<CategoryResponse> => {
    const category = await categoryRepository.findCategoryById(id);

    if (!category) {
      throw new AppError({
        message: 'Category not found',
        statusCode: 404,
        code: ErrorCodes.NOT_FOUND,
      });
    }

    return toCategoryResponse(category);
  },

  createCategory: async (
    input: CreateCategoryInput,
  ): Promise<CategoryResponse> => {
    await ensureParentCategoryExists(input.parentId);

    const slug = createSlug(input.name);

    await ensureUniqueSlug({
      slug,
    });

    const category = await categoryRepository.createCategory({
      name: input.name,
      slug,
      parentId: input.parentId,
    });

    return toCategoryResponse(category);
  },

  updateCategory: async ({
    id,
    input,
  }: {
    id: string;
    input: UpdateCategoryInput;
  }): Promise<CategoryResponse> => {
    const existingCategory = await categoryRepository.findCategoryById(id);

    if (!existingCategory) {
      throw new AppError({
        message: 'Category not found',
        statusCode: 404,
        code: ErrorCodes.NOT_FOUND,
      });
    }

    if (input.parentId === id) {
      throw new AppError({
        message: 'Category cannot be its own parent',
        statusCode: 400,
        code: ErrorCodes.BAD_REQUEST,
      });
    }

    await ensureParentCategoryExists(input.parentId);

    const updateData: Prisma.CategoryUpdateInput = {};

    if (input.name) {
      const slug = createSlug(input.name);

      await ensureUniqueSlug({
        slug,
        currentCategoryId: id,
      });

      updateData.name = input.name;
      updateData.slug = slug;
    }

    if (input.parentId !== undefined) {
      updateData.parent = input.parentId
        ? {
            connect: {
              id: input.parentId,
            },
          }
        : {
            disconnect: true,
          };
    }

    const updatedCategory = await categoryRepository.updateCategory({
      id,
      data: updateData,
    });

    return toCategoryResponse(updatedCategory);
  },

  deleteCategory: async (id: string): Promise<void> => {
    const category = await categoryRepository.findCategoryById(id);

    if (!category) {
      throw new AppError({
        message: 'Category not found',
        statusCode: 404,
        code: ErrorCodes.NOT_FOUND,
      });
    }

    const [productCount, childCount] = await Promise.all([
      categoryRepository.countProductsInCategory(id),
      categoryRepository.countChildren(id),
    ]);

    if (productCount > 0) {
      throw new AppError({
        message: 'Category cannot be deleted because it has products',
        statusCode: 400,
        code: ErrorCodes.BAD_REQUEST,
      });
    }

    if (childCount > 0) {
      throw new AppError({
        message: 'Category cannot be deleted because it has child categories',
        statusCode: 400,
        code: ErrorCodes.BAD_REQUEST,
      });
    }

    await categoryRepository.deleteCategory(id);
  },
};

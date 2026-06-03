import { Request, Response } from 'express';
import { successResponse } from '../../common/utils/api-response';
import { categoryService } from './category.service';
import {
  CategoryIdParams,
  CreateCategoryInput,
  ListCategoriesQuery,
  UpdateCategoryInput,
} from './category.validation';

export const listCategories = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const result = await categoryService.listCategories(
    req.query as unknown as ListCategoriesQuery,
  );

  res.status(200).json(
    successResponse({
      message: 'Categories fetched successfully',
      requestId: req.requestId,
      data: result,
    }),
  );
};

export const getCategoryById = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const params = req.params as CategoryIdParams;

  const result = await categoryService.getCategoryById(params.id);

  res.status(200).json(
    successResponse({
      message: 'Category fetched successfully',
      requestId: req.requestId,
      data: result,
    }),
  );
};

export const createCategory = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const result = await categoryService.createCategory(
    req.body as CreateCategoryInput,
  );

  res.status(201).json(
    successResponse({
      message: 'Category created successfully',
      requestId: req.requestId,
      data: result,
    }),
  );
};

export const updateCategory = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const params = req.params as CategoryIdParams;

  const result = await categoryService.updateCategory({
    id: params.id,
    input: req.body as UpdateCategoryInput,
  });

  res.status(200).json(
    successResponse({
      message: 'Category updated successfully',
      requestId: req.requestId,
      data: result,
    }),
  );
};

export const deleteCategory = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const params = req.params as CategoryIdParams;

  await categoryService.deleteCategory(params.id);

  res.status(200).json(
    successResponse({
      message: 'Category deleted successfully',
      requestId: req.requestId,
    }),
  );
};

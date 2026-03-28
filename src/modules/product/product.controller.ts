import { Request, Response } from 'express';
import { ProductService } from '../product/product.service';
import { catchAsync } from '../../common/utils/catchAsync';
import { sendResponse } from '../../common/utils/sendResponse';

const createProduct = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user!.userId;

  const result = await ProductService.createProduct(userId, req.body);

  return sendResponse(res, 201, {
    success: true,
    message: 'Product created successfully',
    data: result,
  });
});

const getAllProducts = catchAsync(async (req: Request, res: Response) => {
  const query = {
    page: req.query.page ? Number(req.query.page) : undefined,
    limit: req.query.limit ? Number(req.query.limit) : undefined,
    search: req.query.search ? String(req.query.search) : undefined,
    minPrice: req.query.minPrice ? Number(req.query.minPrice) : undefined,
    maxPrice: req.query.maxPrice ? Number(req.query.maxPrice) : undefined,
    sortBy: req.query.sortBy
      ? (String(req.query.sortBy) as 'createdAt' | 'price' | 'title')
      : undefined,
    sortOrder: req.query.sortOrder
      ? (String(req.query.sortOrder) as 'asc' | 'desc')
      : undefined,
  };

  const result = await ProductService.getAllProducts(query);

  return sendResponse(res, 200, {
    success: true,
    message: 'Products retrieved successfully',
    data: result.data,
    meta: result.meta,
  });
});

const getSingleProduct = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;

  const result = await ProductService.getSingleProduct(id);

  return sendResponse(res, 200, {
    success: true,
    message: 'Product retrieved successfully',
    data: result,
  });
});

const updateProduct = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const userRole = req.user!.role;
  const id = req.params.id as string;

  const result = await ProductService.updateProduct(
    userId,
    userRole,
    id,
    req.body,
  );

  return sendResponse(res, 200, {
    success: true,
    message: 'Product updated successfully',
    data: result,
  });
});

const deleteProduct = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const userRole = req.user!.role;
  const id = req.params.id as string;

  await ProductService.deleteProduct(userId, userRole, id);

  return sendResponse(res, 200, {
    success: true,
    message: 'Product deleted successfully',
  });
});

export const ProductController = {
  createProduct,
  getAllProducts,
  getSingleProduct,
  updateProduct,
  deleteProduct,
};

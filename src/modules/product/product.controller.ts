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

const getAllProducts = catchAsync(async (_req: Request, res: Response) => {
  const result = await ProductService.getAllProducts();

  return sendResponse(res, 200, {
    success: true,
    message: 'Products retrieved successfully',
    data: result,
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

import { Request, Response } from 'express';
import { successResponse } from '../../common/utils/api-response';
import { productService } from './product.service';
import {
  CreateProductInput,
  ListAdminProductsQuery,
  ListPublicProductsQuery,
  ListVendorProductsQuery,
  ProductIdParams,
  UpdateProductInput,
  UpdateProductStatusInput,
} from './product.validation';

export const listPublicProducts = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const result = await productService.listPublicProducts(
    req.query as unknown as ListPublicProductsQuery,
  );

  res.status(200).json(
    successResponse({
      message: 'Products fetched successfully',
      requestId: req.requestId,
      data: result,
    }),
  );
};

export const getPublicProductById = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const params = req.params as ProductIdParams;

  const result = await productService.getPublicProductById(params.id);

  res.status(200).json(
    successResponse({
      message: 'Product fetched successfully',
      requestId: req.requestId,
      data: result,
    }),
  );
};

export const createVendorProduct = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const result = await productService.createVendorProduct({
    vendorId: req.user!.id,
    input: req.body as CreateProductInput,
  });

  res.status(201).json(
    successResponse({
      message: 'Product created successfully',
      requestId: req.requestId,
      data: result,
    }),
  );
};

export const listVendorProducts = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const result = await productService.listVendorProducts({
    vendorId: req.user!.id,
    query: req.query as unknown as ListVendorProductsQuery,
  });

  res.status(200).json(
    successResponse({
      message: 'Vendor products fetched successfully',
      requestId: req.requestId,
      data: result,
    }),
  );
};

export const updateVendorProduct = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const params = req.params as ProductIdParams;

  const result = await productService.updateVendorProduct({
    vendorId: req.user!.id,
    productId: params.id,
    input: req.body as UpdateProductInput,
  });

  res.status(200).json(
    successResponse({
      message: 'Product updated successfully',
      requestId: req.requestId,
      data: result,
    }),
  );
};

export const archiveVendorProduct = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const params = req.params as ProductIdParams;

  const result = await productService.archiveVendorProduct({
    vendorId: req.user!.id,
    productId: params.id,
  });

  res.status(200).json(
    successResponse({
      message: 'Product archived successfully',
      requestId: req.requestId,
      data: result,
    }),
  );
};

export const listProductsForAdmin = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const result = await productService.listProductsForAdmin(
    req.query as unknown as ListAdminProductsQuery,
  );

  res.status(200).json(
    successResponse({
      message: 'Admin products fetched successfully',
      requestId: req.requestId,
      data: result,
    }),
  );
};

export const updateProductStatusForAdmin = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const params = req.params as ProductIdParams;

  const result = await productService.updateProductStatusForAdmin({
    productId: params.id,
    input: req.body as UpdateProductStatusInput,
  });

  res.status(200).json(
    successResponse({
      message: 'Product status updated successfully',
      requestId: req.requestId,
      data: result,
    }),
  );
};

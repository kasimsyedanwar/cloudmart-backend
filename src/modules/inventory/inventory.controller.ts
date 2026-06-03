import { Request, Response } from 'express';
import { successResponse } from '../../common/utils/api-response';
import { inventoryService } from './inventory.service';
import {
  AdjustStockInput,
  ListInventoryMovementsQuery,
} from './inventory.validation';

export const adjustVendorProductStock = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const result = await inventoryService.adjustVendorProductStock({
    vendorId: req.user!.id,
    actorId: req.user!.id,
    input: req.body as AdjustStockInput,
  });

  res.status(200).json(
    successResponse({
      message: 'Stock adjusted successfully',
      requestId: req.requestId,
      data: result,
    }),
  );
};

export const listVendorInventoryMovements = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const result = await inventoryService.listVendorInventoryMovements({
    vendorId: req.user!.id,
    query: req.query as unknown as ListInventoryMovementsQuery,
  });

  res.status(200).json(
    successResponse({
      message: 'Inventory movements fetched successfully',
      requestId: req.requestId,
      data: result,
    }),
  );
};

export const listAdminInventoryMovements = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const result = await inventoryService.listAdminInventoryMovements(
    req.query as unknown as ListInventoryMovementsQuery,
  );

  res.status(200).json(
    successResponse({
      message: 'Admin inventory movements fetched successfully',
      requestId: req.requestId,
      data: result,
    }),
  );
};

export const listVendorLowStockProducts = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const result = await inventoryService.listVendorLowStockProducts(
    req.user!.id,
  );

  res.status(200).json(
    successResponse({
      message: 'Low stock products fetched successfully',
      requestId: req.requestId,
      data: result,
    }),
  );
};

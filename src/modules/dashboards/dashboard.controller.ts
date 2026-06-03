import { Request, Response } from 'express';
import { successResponse } from '../../common/utils/api-response';
import { dashboardService } from './dashboard.service';

export const getAdminDashboard = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const result = await dashboardService.getAdminDashboard();

  res.status(200).json(
    successResponse({
      message: 'Admin dashboard fetched successfully',
      requestId: req.requestId,
      data: result,
    }),
  );
};

export const getVendorDashboard = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const result = await dashboardService.getVendorDashboard(req.user!.id);

  res.status(200).json(
    successResponse({
      message: 'Vendor dashboard fetched successfully',
      requestId: req.requestId,
      data: result,
    }),
  );
};

export const createAdminDashboardSnapshot = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const result = await dashboardService.createAdminSnapshot();

  res.status(201).json(
    successResponse({
      message: 'Admin dashboard snapshot created successfully',
      requestId: req.requestId,
      data: result,
    }),
  );
};

export const createVendorDashboardSnapshot = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const result = await dashboardService.createVendorSnapshot(req.user!.id);

  res.status(201).json(
    successResponse({
      message: 'Vendor dashboard snapshot created successfully',
      requestId: req.requestId,
      data: result,
    }),
  );
};

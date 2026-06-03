import { Request, Response } from 'express';
import { successResponse } from '../../common/utils/api-response';

export const authenticatedOnly = (req: Request, res: Response): void => {
  res.status(200).json(
    successResponse({
      message: 'Authenticated route access granted',
      requestId: req.requestId,
      data: {
        user: req.user,
      },
    }),
  );
};

export const adminOnly = (req: Request, res: Response): void => {
  res.status(200).json(
    successResponse({
      message: 'Admin route access granted',
      requestId: req.requestId,
      data: {
        user: req.user,
      },
    }),
  );
};

export const vendorOnly = (req: Request, res: Response): void => {
  res.status(200).json(
    successResponse({
      message: 'Vendor route access granted',
      requestId: req.requestId,
      data: {
        user: req.user,
      },
    }),
  );
};

export const customerOnly = (req: Request, res: Response): void => {
  res.status(200).json(
    successResponse({
      message: 'Customer route access granted',
      requestId: req.requestId,
      data: {
        user: req.user,
      },
    }),
  );
};

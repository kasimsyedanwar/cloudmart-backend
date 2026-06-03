import { VendorStatus } from '@prisma/client';
import { RequestHandler } from 'express';

import prisma from '../../config/prisma';
import { AppError } from '../errors/app-error';
import { ErrorCodes } from '../errors/error-codes';

export const requireApprovedVendor: RequestHandler = async (
  req,
  _res,
  next,
) => {
  try {
    if (!req.user) {
      throw new AppError({
        message: 'Authentication is required',
        statusCode: 401,
        code: ErrorCodes.UNAUTHORIZED,
      });
    }

    const vendorProfile = await prisma.vendorProfile.findUnique({
      where: {
        userId: req.user.id,
      },
      select: {
        id: true,
        status: true,
      },
    });

    if (!vendorProfile) {
      throw new AppError({
        message: 'Vendor profile not found',
        statusCode: 404,
        code: ErrorCodes.NOT_FOUND,
      });
    }

    if (vendorProfile.status !== VendorStatus.APPROVED) {
      throw new AppError({
        message: 'Vendor account is not approved',
        statusCode: 403,
        code: ErrorCodes.VENDOR_NOT_APPROVED,
      });
    }

    next();
  } catch (error) {
    next(error);
  }
};

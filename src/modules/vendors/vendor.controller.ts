import { Request, Response } from 'express';
import { successResponse } from '../../common/utils/api-response';
import { vendorService } from './vendor.service';
import {
  ListVendorsQuery,
  RegisterVendorInput,
  UpdateVendorInput,
  UpdateVendorStatusInput,
  VendorIdParams,
} from './vendor.validation';

export const registerVendor = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const result = await vendorService.registerVendor({
    userId: req.user!.id,
    input: req.body as RegisterVendorInput,
  });

  res.status(201).json(
    successResponse({
      message: 'Vendor application submitted successfully',
      requestId: req.requestId,
      data: result,
    }),
  );
};

export const getMyVendorProfile = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const result = await vendorService.getMyVendorProfile(req.user!.id);

  res.status(200).json(
    successResponse({
      message: 'Vendor profile fetched successfully',
      requestId: req.requestId,
      data: result,
    }),
  );
};

export const updateMyVendorProfile = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const result = await vendorService.updateMyVendorProfile({
    userId: req.user!.id,
    input: req.body as UpdateVendorInput,
  });

  res.status(200).json(
    successResponse({
      message: 'Vendor profile updated successfully',
      requestId: req.requestId,
      data: result,
    }),
  );
};

export const listVendorsForAdmin = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const result = await vendorService.listVendorsForAdmin(
    req.query as unknown as ListVendorsQuery,
  );

  res.status(200).json(
    successResponse({
      message: 'Vendors fetched successfully',
      requestId: req.requestId,
      data: result,
    }),
  );
};

export const approveVendor = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const params = req.params as VendorIdParams;

  const result = await vendorService.approveVendor(params.id);

  res.status(200).json(
    successResponse({
      message: 'Vendor approved successfully',
      requestId: req.requestId,
      data: result,
    }),
  );
};

export const updateVendorStatus = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const params = req.params as VendorIdParams;

  const result = await vendorService.updateVendorStatus({
    vendorId: params.id,
    input: req.body as UpdateVendorStatusInput,
  });

  res.status(200).json(
    successResponse({
      message: 'Vendor status updated successfully',
      requestId: req.requestId,
      data: result,
    }),
  );
};

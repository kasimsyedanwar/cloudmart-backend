import { Request, Response } from 'express';
import { successResponse } from '../../common/utils/api-response';
import { userService } from './user.service';
import {
  AddressIdParams,
  CreateAddressInput,
  ListUsersQuery,
  UpdateAddressInput,
  UpdateMeInput,
  UpdateUserStatusInput,
  UserIdParams,
} from './user.validation';

export const getMe = async (req: Request, res: Response): Promise<void> => {
  const result = await userService.getMe(req.user!.id);

  res.status(200).json(
    successResponse({
      message: 'User profile fetched successfully',
      requestId: req.requestId,
      data: result,
    }),
  );
};

export const updateMe = async (req: Request, res: Response): Promise<void> => {
  const result = await userService.updateMe({
    userId: req.user!.id,
    input: req.body as UpdateMeInput,
  });

  res.status(200).json(
    successResponse({
      message: 'User profile updated successfully',
      requestId: req.requestId,
      data: result,
    }),
  );
};

export const listMyAddresses = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const result = await userService.listMyAddresses(req.user!.id);

  res.status(200).json(
    successResponse({
      message: 'Addresses fetched successfully',
      requestId: req.requestId,
      data: result,
    }),
  );
};

export const getMyAddressById = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const params = req.params as AddressIdParams;

  const result = await userService.getMyAddressById({
    userId: req.user!.id,
    addressId: params.addressId,
  });

  res.status(200).json(
    successResponse({
      message: 'Address fetched successfully',
      requestId: req.requestId,
      data: result,
    }),
  );
};

export const createMyAddress = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const result = await userService.createMyAddress({
    userId: req.user!.id,
    input: req.body as CreateAddressInput,
  });

  res.status(201).json(
    successResponse({
      message: 'Address created successfully',
      requestId: req.requestId,
      data: result,
    }),
  );
};

export const updateMyAddress = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const params = req.params as AddressIdParams;

  const result = await userService.updateMyAddress({
    userId: req.user!.id,
    addressId: params.addressId,
    input: req.body as UpdateAddressInput,
  });

  res.status(200).json(
    successResponse({
      message: 'Address updated successfully',
      requestId: req.requestId,
      data: result,
    }),
  );
};

export const deleteMyAddress = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const params = req.params as AddressIdParams;

  await userService.deleteMyAddress({
    userId: req.user!.id,
    addressId: params.addressId,
  });

  res.status(200).json(
    successResponse({
      message: 'Address deleted successfully',
      requestId: req.requestId,
    }),
  );
};

export const listUsersForAdmin = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const result = await userService.listUsersForAdmin(
    req.query as unknown as ListUsersQuery,
  );

  res.status(200).json(
    successResponse({
      message: 'Users fetched successfully',
      requestId: req.requestId,
      data: result,
    }),
  );
};

export const updateUserStatusForAdmin = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const params = req.params as UserIdParams;

  const result = await userService.updateUserStatusForAdmin({
    adminUserId: req.user!.id,
    targetUserId: params.id,
    input: req.body as UpdateUserStatusInput,
  });

  res.status(200).json(
    successResponse({
      message: 'User status updated successfully',
      requestId: req.requestId,
      data: result,
    }),
  );
};

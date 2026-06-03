import { UserRole, VendorProfile, VendorStatus } from '@prisma/client';
import prisma from '../../config/prisma';
import { AppError } from '../../common/errors/app-error';
import { ErrorCodes } from '../../common/errors/error-codes';
import { createSlug } from '../../common/utils/slug';
import {
  ListVendorsQuery,
  RegisterVendorInput,
  UpdateVendorInput,
  UpdateVendorStatusInput,
} from './vendor.validation';
import { vendorRepository } from './vendor.repository';

type VendorProfileResponse = {
  id: string;
  userId: string;
  storeName: string;
  slug: string;
  description: string | null;
  status: VendorStatus;
  approvedAt: Date | null;
  rejectedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

const toVendorProfileResponse = (
  vendorProfile: VendorProfile,
): VendorProfileResponse => {
  return {
    id: vendorProfile.id,
    userId: vendorProfile.userId,
    storeName: vendorProfile.storeName,
    slug: vendorProfile.slug,
    description: vendorProfile.description,
    status: vendorProfile.status,
    approvedAt: vendorProfile.approvedAt,
    rejectedAt: vendorProfile.rejectedAt,
    createdAt: vendorProfile.createdAt,
    updatedAt: vendorProfile.updatedAt,
  };
};

const ensureUniqueSlug = async ({
  slug,
  currentVendorId,
}: {
  slug: string;
  currentVendorId?: string;
}): Promise<void> => {
  const existingVendor = await vendorRepository.findVendorProfileBySlug(slug);

  if (existingVendor && existingVendor.id !== currentVendorId) {
    throw new AppError({
      message: 'Store name is already taken',
      statusCode: 409,
      code: ErrorCodes.CONFLICT,
    });
  }
};

export const vendorService = {
  registerVendor: async ({
    userId,
    input,
  }: {
    userId: string;
    input: RegisterVendorInput;
  }): Promise<VendorProfileResponse> => {
    const existingVendorProfile =
      await vendorRepository.findVendorProfileByUserId(userId);

    if (existingVendorProfile) {
      throw new AppError({
        message: 'Vendor profile already exists for this user',
        statusCode: 409,
        code: ErrorCodes.CONFLICT,
      });
    }

    const slug = createSlug(input.storeName);

    await ensureUniqueSlug({
      slug,
    });

    const vendorProfile = await prisma.$transaction(async (tx) => {
      await vendorRepository.updateUserRoleToVendor(userId, tx);

      return vendorRepository.createVendorProfile(
        {
          userId,
          storeName: input.storeName,
          slug,
          description: input.description,
        },
        tx,
      );
    });

    return toVendorProfileResponse(vendorProfile);
  },

  getMyVendorProfile: async (
    userId: string,
  ): Promise<VendorProfileResponse> => {
    const vendorProfile =
      await vendorRepository.findVendorProfileByUserId(userId);

    if (!vendorProfile) {
      throw new AppError({
        message: 'Vendor profile not found',
        statusCode: 404,
        code: ErrorCodes.NOT_FOUND,
      });
    }

    return toVendorProfileResponse(vendorProfile);
  },

  updateMyVendorProfile: async ({
    userId,
    input,
  }: {
    userId: string;
    input: UpdateVendorInput;
  }): Promise<VendorProfileResponse> => {
    const vendorProfile =
      await vendorRepository.findVendorProfileByUserId(userId);

    if (!vendorProfile) {
      throw new AppError({
        message: 'Vendor profile not found',
        statusCode: 404,
        code: ErrorCodes.NOT_FOUND,
      });
    }

    const updateData: {
      storeName?: string;
      slug?: string;
      description?: string;
    } = {};

    if (input.storeName) {
      const slug = createSlug(input.storeName);

      await ensureUniqueSlug({
        slug,
        currentVendorId: vendorProfile.id,
      });

      updateData.storeName = input.storeName;
      updateData.slug = slug;
    }

    if (input.description !== undefined) {
      updateData.description = input.description;
    }

    const updatedVendorProfile = await vendorRepository.updateVendorProfile({
      id: vendorProfile.id,
      data: updateData,
    });

    return toVendorProfileResponse(updatedVendorProfile);
  },

  listVendorsForAdmin: async (query: ListVendorsQuery) => {
    const page = query.page;
    const limit = query.limit;
    const skip = (page - 1) * limit;

    const [vendors, total] = await Promise.all([
      vendorRepository.listVendors({
        status: query.status,
        skip,
        take: limit,
      }),
      vendorRepository.countVendors(query.status),
    ]);

    return {
      vendors,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  approveVendor: async (vendorId: string): Promise<VendorProfileResponse> => {
    const vendorProfile =
      await vendorRepository.findVendorProfileById(vendorId);

    if (!vendorProfile) {
      throw new AppError({
        message: 'Vendor profile not found',
        statusCode: 404,
        code: ErrorCodes.NOT_FOUND,
      });
    }

    if (vendorProfile.user.role !== UserRole.VENDOR) {
      throw new AppError({
        message: 'User is not a vendor',
        statusCode: 400,
        code: ErrorCodes.BAD_REQUEST,
      });
    }

    const updatedVendorProfile = await vendorRepository.updateVendorStatus({
      id: vendorId,
      status: VendorStatus.APPROVED,
    });

    return toVendorProfileResponse(updatedVendorProfile);
  },

  updateVendorStatus: async ({
    vendorId,
    input,
  }: {
    vendorId: string;
    input: UpdateVendorStatusInput;
  }): Promise<VendorProfileResponse> => {
    const vendorProfile =
      await vendorRepository.findVendorProfileById(vendorId);

    if (!vendorProfile) {
      throw new AppError({
        message: 'Vendor profile not found',
        statusCode: 404,
        code: ErrorCodes.NOT_FOUND,
      });
    }

    const updatedVendorProfile = await vendorRepository.updateVendorStatus({
      id: vendorId,
      status: input.status,
    });

    return toVendorProfileResponse(updatedVendorProfile);
  },
};

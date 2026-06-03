import { Address, Prisma, User, UserRole, UserStatus } from '@prisma/client';
import prisma from '../../config/prisma';
import { AppError } from '../../common/errors/app-error';
import { ErrorCodes } from '../../common/errors/error-codes';
import {
  buildPaginationMeta,
  getPagination,
} from '../../common/utils/pagination';
import {
  CreateAddressInput,
  ListUsersQuery,
  UpdateAddressInput,
  UpdateMeInput,
  UpdateUserStatusInput,
} from './user.validation';
import { userRepository } from './user.repository';

type SafeUserResponse = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  createdAt: Date;
  updatedAt: Date;
};

type AddressResponse = {
  id: string;
  userId: string;
  type: string;
  fullName: string | null;
  phone: string | null;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
};

const toSafeUserResponse = (user: User): SafeUserResponse => {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
};

const toAddressResponse = (address: Address): AddressResponse => {
  return {
    id: address.id,
    userId: address.userId,
    type: address.type,
    fullName: address.fullName,
    phone: address.phone,
    line1: address.line1,
    line2: address.line2,
    city: address.city,
    state: address.state,
    postalCode: address.postalCode,
    country: address.country,
    isDefault: address.isDefault,
    createdAt: address.createdAt,
    updatedAt: address.updatedAt,
  };
};

const assertAddressOwnership = ({
  address,
  userId,
}: {
  address: Address | null;
  userId: string;
}): Address => {
  if (!address || address.userId !== userId) {
    throw new AppError({
      message: 'Address not found',
      statusCode: 404,
      code: ErrorCodes.NOT_FOUND,
    });
  }

  return address;
};

export const userService = {
  getMe: async (userId: string): Promise<SafeUserResponse> => {
    const user = await userRepository.findUserById(userId);

    if (!user) {
      throw new AppError({
        message: 'User not found',
        statusCode: 404,
        code: ErrorCodes.NOT_FOUND,
      });
    }

    return toSafeUserResponse(user);
  },

  updateMe: async ({
    userId,
    input,
  }: {
    userId: string;
    input: UpdateMeInput;
  }): Promise<SafeUserResponse> => {
    const user = await userRepository.updateUserProfile({
      id: userId,
      name: input.name,
    });

    return toSafeUserResponse(user);
  },

  listMyAddresses: async (userId: string): Promise<AddressResponse[]> => {
    const addresses = await userRepository.listAddressesByUserId(userId);

    return addresses.map(toAddressResponse);
  },

  getMyAddressById: async ({
    userId,
    addressId,
  }: {
    userId: string;
    addressId: string;
  }): Promise<AddressResponse> => {
    const address = await userRepository.findAddressById(addressId);

    const ownedAddress = assertAddressOwnership({
      address,
      userId,
    });

    return toAddressResponse(ownedAddress);
  },

  createMyAddress: async ({
    userId,
    input,
  }: {
    userId: string;
    input: CreateAddressInput;
  }): Promise<AddressResponse> => {
    const addressCount = await userRepository.countAddressesByUserId(userId);

    const shouldSetAsDefault = input.isDefault || addressCount === 0;

    const createdAddress = await prisma.$transaction(async (tx) => {
      if (shouldSetAsDefault) {
        await userRepository.unsetDefaultAddresses(userId, tx);
      }

      return userRepository.createAddress({
        userId,
        input: {
          ...input,
          isDefault: shouldSetAsDefault,
        },
        tx,
      });
    });

    return toAddressResponse(createdAddress);
  },

  updateMyAddress: async ({
    userId,
    addressId,
    input,
  }: {
    userId: string;
    addressId: string;
    input: UpdateAddressInput;
  }): Promise<AddressResponse> => {
    const address = await userRepository.findAddressById(addressId);

    assertAddressOwnership({
      address,
      userId,
    });

    const updatedAddress = await prisma.$transaction(async (tx) => {
      if (input.isDefault) {
        await userRepository.unsetDefaultAddresses(userId, tx);
      }

      return userRepository.updateAddress({
        id: addressId,
        input,
        tx,
      });
    });

    return toAddressResponse(updatedAddress);
  },

  deleteMyAddress: async ({
    userId,
    addressId,
  }: {
    userId: string;
    addressId: string;
  }): Promise<void> => {
    const address = await userRepository.findAddressById(addressId);

    const ownedAddress = assertAddressOwnership({
      address,
      userId,
    });

    await prisma.$transaction(async (tx) => {
      await userRepository.deleteAddress({
        id: addressId,
        tx,
      });

      if (ownedAddress.isDefault) {
        const nextDefaultAddress =
          await userRepository.findLatestAddressByUserId({
            userId,
            tx,
          });

        if (nextDefaultAddress) {
          await userRepository.updateAddress({
            id: nextDefaultAddress.id,
            input: {
              isDefault: true,
            },
            tx,
          });
        }
      }
    });
  },

  listUsersForAdmin: async (query: ListUsersQuery) => {
    const { page, limit, skip, take } = getPagination({
      page: query.page,
      limit: query.limit,
    });

    const where: Prisma.UserWhereInput = {
      role: query.role,
      status: query.status,
      OR: query.search
        ? [
            {
              name: {
                contains: query.search,
              },
            },
            {
              email: {
                contains: query.search,
              },
            },
          ]
        : undefined,
    };

    const [users, total] = await Promise.all([
      userRepository.listUsers({
        where,
        skip,
        take,
      }),
      userRepository.countUsers(where),
    ]);

    return {
      users: users.map(toSafeUserResponse),
      pagination: buildPaginationMeta({
        page,
        limit,
        total,
      }),
    };
  },

  updateUserStatusForAdmin: async ({
    adminUserId,
    targetUserId,
    input,
  }: {
    adminUserId: string;
    targetUserId: string;
    input: UpdateUserStatusInput;
  }): Promise<SafeUserResponse> => {
    const targetUser = await userRepository.findUserById(targetUserId);

    if (!targetUser) {
      throw new AppError({
        message: 'User not found',
        statusCode: 404,
        code: ErrorCodes.NOT_FOUND,
      });
    }

    if (targetUser.id === adminUserId && input.status !== UserStatus.ACTIVE) {
      throw new AppError({
        message: 'Admin cannot block or delete their own account',
        statusCode: 400,
        code: ErrorCodes.BAD_REQUEST,
      });
    }

    const updatedUser = await userRepository.updateUserStatus({
      id: targetUserId,
      status: input.status,
    });

    return toSafeUserResponse(updatedUser);
  },
};

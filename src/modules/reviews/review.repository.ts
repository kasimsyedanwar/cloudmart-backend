import {
  OrderStatus,
  PaymentStatus,
  Prisma,
  Review,
  ReviewStatus,
} from '@prisma/client';
import prisma from '../../config/prisma';
import { CreateReviewInput } from './review.validation';

const reviewInclude = {
  product: {
    select: {
      id: true,
      title: true,
      slug: true,
      vendorId: true,
      images: {
        orderBy: {
          sortOrder: 'asc',
        },
        take: 1,
      },
    },
  },
  user: {
    select: {
      id: true,
      name: true,
      email: true,
    },
  },
} satisfies Prisma.ReviewInclude;

export type ReviewWithRelations = Prisma.ReviewGetPayload<{
  include: typeof reviewInclude;
}>;

export const reviewRepository = {
  findProductById: async (productId: string) => {
    return prisma.product.findUnique({
      where: {
        id: productId,
      },
      select: {
        id: true,
        title: true,
        slug: true,
        vendorId: true,
        status: true,
      },
    });
  },

  hasUserPurchasedProduct: async ({
    userId,
    productId,
  }: {
    userId: string;
    productId: string;
  }): Promise<boolean> => {
    const count = await prisma.orderItem.count({
      where: {
        productId,
        order: {
          customerId: userId,
          paymentStatus: PaymentStatus.SUCCESS,
          status: {
            in: [
              OrderStatus.PAID,
              OrderStatus.CONFIRMED,
              OrderStatus.SHIPPED,
              OrderStatus.DELIVERED,
            ],
          },
        },
      },
    });

    return count > 0;
  },

  findReviewByProductAndUser: async ({
    productId,
    userId,
  }: {
    productId: string;
    userId: string;
  }): Promise<Review | null> => {
    return prisma.review.findUnique({
      where: {
        productId_userId: {
          productId,
          userId,
        },
      },
    });
  },

  createReview: async ({
    productId,
    userId,
    input,
  }: {
    productId: string;
    userId: string;
    input: CreateReviewInput;
  }): Promise<ReviewWithRelations> => {
    return prisma.review.create({
      data: {
        productId,
        userId,
        rating: input.rating,
        comment: input.comment,
        status: ReviewStatus.PENDING,
      },
      include: reviewInclude,
    });
  },

  listReviews: async ({
    where,
    skip,
    take,
  }: {
    where: Prisma.ReviewWhereInput;
    skip: number;
    take: number;
  }): Promise<ReviewWithRelations[]> => {
    return prisma.review.findMany({
      where,
      include: reviewInclude,
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take,
    });
  },

  countReviews: async (where: Prisma.ReviewWhereInput): Promise<number> => {
    return prisma.review.count({
      where,
    });
  },

  getProductReviewStats: async (productId: string) => {
    return prisma.review.aggregate({
      where: {
        productId,
        status: ReviewStatus.APPROVED,
      },
      _avg: {
        rating: true,
      },
      _count: {
        rating: true,
      },
    });
  },

  findReviewById: async (
    reviewId: string,
  ): Promise<ReviewWithRelations | null> => {
    return prisma.review.findUnique({
      where: {
        id: reviewId,
      },
      include: reviewInclude,
    });
  },

  updateReviewStatus: async ({
    reviewId,
    status,
  }: {
    reviewId: string;
    status: ReviewStatus;
  }): Promise<ReviewWithRelations> => {
    return prisma.review.update({
      where: {
        id: reviewId,
      },
      data: {
        status,
      },
      include: reviewInclude,
    });
  },
};

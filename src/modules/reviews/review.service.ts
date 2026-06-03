import { Prisma, ProductStatus, ReviewStatus } from '@prisma/client';
import { AppError } from '../../common/errors/app-error';
import { ErrorCodes } from '../../common/errors/error-codes';
import {
  buildPaginationMeta,
  getPagination,
} from '../../common/utils/pagination';
import {
  CreateReviewInput,
  ListAdminReviewsQuery,
  ListMyReviewsQuery,
  ListProductReviewsQuery,
  UpdateReviewStatusInput,
} from './review.validation';
import { reviewRepository, ReviewWithRelations } from './review.repository';

type ReviewResponse = {
  id: string;
  productId: string;
  userId: string;
  rating: number;
  comment: string | null;
  status: ReviewStatus;
  product: {
    id: string;
    title: string;
    slug: string;
    vendorId: string;
    imageUrl: string | null;
  };
  user: {
    id: string;
    name: string;
    email?: string;
  };
  createdAt: Date;
  updatedAt: Date;
};

const toReviewResponse = ({
  review,
  exposeUserEmail = false,
}: {
  review: ReviewWithRelations;
  exposeUserEmail?: boolean;
}): ReviewResponse => {
  return {
    id: review.id,
    productId: review.productId,
    userId: review.userId,
    rating: review.rating,
    comment: review.comment,
    status: review.status,
    product: {
      id: review.product.id,
      title: review.product.title,
      slug: review.product.slug,
      vendorId: review.product.vendorId,
      imageUrl: review.product.images[0]?.url ?? null,
    },
    user: {
      id: review.user.id,
      name: review.user.name,
      email: exposeUserEmail ? review.user.email : undefined,
    },
    createdAt: review.createdAt,
    updatedAt: review.updatedAt,
  };
};

export const reviewService = {
  createProductReview: async ({
    productId,
    userId,
    input,
  }: {
    productId: string;
    userId: string;
    input: CreateReviewInput;
  }): Promise<ReviewResponse> => {
    const product = await reviewRepository.findProductById(productId);

    if (!product || product.status === ProductStatus.ARCHIVED) {
      throw new AppError({
        message: 'Product not found',
        statusCode: 404,
        code: ErrorCodes.NOT_FOUND,
      });
    }

    if (product.vendorId === userId) {
      throw new AppError({
        message: 'Vendor cannot review their own product',
        statusCode: 400,
        code: ErrorCodes.BAD_REQUEST,
      });
    }

    const hasPurchased = await reviewRepository.hasUserPurchasedProduct({
      userId,
      productId,
    });

    if (!hasPurchased) {
      throw new AppError({
        message: 'Only customers who purchased this product can review it',
        statusCode: 403,
        code: ErrorCodes.FORBIDDEN,
      });
    }

    const existingReview = await reviewRepository.findReviewByProductAndUser({
      productId,
      userId,
    });

    if (existingReview) {
      throw new AppError({
        message: 'You have already reviewed this product',
        statusCode: 409,
        code: ErrorCodes.CONFLICT,
      });
    }

    const review = await reviewRepository.createReview({
      productId,
      userId,
      input,
    });

    return toReviewResponse({
      review,
      exposeUserEmail: false,
    });
  },

  listApprovedProductReviews: async ({
    productId,
    query,
  }: {
    productId: string;
    query: ListProductReviewsQuery;
  }) => {
    const product = await reviewRepository.findProductById(productId);

    if (!product || product.status === ProductStatus.ARCHIVED) {
      throw new AppError({
        message: 'Product not found',
        statusCode: 404,
        code: ErrorCodes.NOT_FOUND,
      });
    }

    const { page, limit, skip, take } = getPagination({
      page: query.page,
      limit: query.limit,
    });

    const where: Prisma.ReviewWhereInput = {
      productId,
      status: ReviewStatus.APPROVED,
      rating: query.rating,
    };

    const [reviews, total, stats] = await Promise.all([
      reviewRepository.listReviews({
        where,
        skip,
        take,
      }),
      reviewRepository.countReviews(where),
      reviewRepository.getProductReviewStats(productId),
    ]);

    return {
      reviews: reviews.map((review) =>
        toReviewResponse({
          review,
          exposeUserEmail: false,
        }),
      ),
      summary: {
        averageRating: stats._avg.rating
          ? Number(stats._avg.rating.toFixed(2))
          : 0,
        totalApprovedReviews: stats._count.rating,
      },
      pagination: buildPaginationMeta({
        page,
        limit,
        total,
      }),
    };
  },

  listMyReviews: async ({
    userId,
    query,
  }: {
    userId: string;
    query: ListMyReviewsQuery;
  }) => {
    const { page, limit, skip, take } = getPagination({
      page: query.page,
      limit: query.limit,
    });

    const where: Prisma.ReviewWhereInput = {
      userId,
      status: query.status,
    };

    const [reviews, total] = await Promise.all([
      reviewRepository.listReviews({
        where,
        skip,
        take,
      }),
      reviewRepository.countReviews(where),
    ]);

    return {
      reviews: reviews.map((review) =>
        toReviewResponse({
          review,
          exposeUserEmail: false,
        }),
      ),
      pagination: buildPaginationMeta({
        page,
        limit,
        total,
      }),
    };
  },

  listReviewsForAdmin: async (query: ListAdminReviewsQuery) => {
    const { page, limit, skip, take } = getPagination({
      page: query.page,
      limit: query.limit,
    });

    const where: Prisma.ReviewWhereInput = {
      status: query.status,
      productId: query.productId,
      userId: query.userId,
      rating: query.rating,
    };

    const [reviews, total] = await Promise.all([
      reviewRepository.listReviews({
        where,
        skip,
        take,
      }),
      reviewRepository.countReviews(where),
    ]);

    return {
      reviews: reviews.map((review) =>
        toReviewResponse({
          review,
          exposeUserEmail: true,
        }),
      ),
      pagination: buildPaginationMeta({
        page,
        limit,
        total,
      }),
    };
  },

  updateReviewStatusForAdmin: async ({
    reviewId,
    input,
  }: {
    reviewId: string;
    input: UpdateReviewStatusInput;
  }): Promise<ReviewResponse> => {
    const review = await reviewRepository.findReviewById(reviewId);

    if (!review) {
      throw new AppError({
        message: 'Review not found',
        statusCode: 404,
        code: ErrorCodes.NOT_FOUND,
      });
    }

    const updatedReview = await reviewRepository.updateReviewStatus({
      reviewId,
      status: input.status,
    });

    return toReviewResponse({
      review: updatedReview,
      exposeUserEmail: true,
    });
  },
};

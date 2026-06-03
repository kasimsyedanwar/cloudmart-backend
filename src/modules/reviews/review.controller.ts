import { Request, Response } from 'express';
import { successResponse } from '../../common/utils/api-response';
import { reviewService } from './review.service';
import {
  CreateReviewInput,
  ListAdminReviewsQuery,
  ListMyReviewsQuery,
  ListProductReviewsQuery,
  ProductReviewParams,
  ReviewIdParams,
  UpdateReviewStatusInput,
} from './review.validation';

export const createProductReview = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const params = req.params as ProductReviewParams;

  const result = await reviewService.createProductReview({
    productId: params.id,
    userId: req.user!.id,
    input: req.body as CreateReviewInput,
  });

  res.status(201).json(
    successResponse({
      message: 'Review submitted successfully and is pending moderation',
      requestId: req.requestId,
      data: result,
    }),
  );
};

export const listApprovedProductReviews = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const params = req.params as ProductReviewParams;

  const result = await reviewService.listApprovedProductReviews({
    productId: params.id,
    query: req.query as unknown as ListProductReviewsQuery,
  });

  res.status(200).json(
    successResponse({
      message: 'Product reviews fetched successfully',
      requestId: req.requestId,
      data: result,
    }),
  );
};

export const listMyReviews = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const result = await reviewService.listMyReviews({
    userId: req.user!.id,
    query: req.query as unknown as ListMyReviewsQuery,
  });

  res.status(200).json(
    successResponse({
      message: 'My reviews fetched successfully',
      requestId: req.requestId,
      data: result,
    }),
  );
};

export const listReviewsForAdmin = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const result = await reviewService.listReviewsForAdmin(
    req.query as unknown as ListAdminReviewsQuery,
  );

  res.status(200).json(
    successResponse({
      message: 'Admin reviews fetched successfully',
      requestId: req.requestId,
      data: result,
    }),
  );
};

export const updateReviewStatusForAdmin = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const params = req.params as ReviewIdParams;

  const result = await reviewService.updateReviewStatusForAdmin({
    reviewId: params.id,
    input: req.body as UpdateReviewStatusInput,
  });

  res.status(200).json(
    successResponse({
      message: 'Review status updated successfully',
      requestId: req.requestId,
      data: result,
    }),
  );
};

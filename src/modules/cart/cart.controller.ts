import { Request, Response } from 'express';
import { successResponse } from '../../common/utils/api-response';
import { cartService } from './cart.service';
import {
  AddCartItemInput,
  CartItemIdParams,
  UpdateCartItemInput,
} from './cart.validation';

export const getMyCart = async (req: Request, res: Response): Promise<void> => {
  const result = await cartService.getMyCart(req.user!.id);

  res.status(200).json(
    successResponse({
      message: 'Cart fetched successfully',
      requestId: req.requestId,
      data: result,
    }),
  );
};

export const addItemToCart = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const result = await cartService.addItemToCart({
    userId: req.user!.id,
    input: req.body as AddCartItemInput,
  });

  res.status(200).json(
    successResponse({
      message: 'Item added to cart successfully',
      requestId: req.requestId,
      data: result,
    }),
  );
};

export const updateCartItem = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const params = req.params as CartItemIdParams;

  const result = await cartService.updateCartItem({
    userId: req.user!.id,
    itemId: params.itemId,
    input: req.body as UpdateCartItemInput,
  });

  res.status(200).json(
    successResponse({
      message: 'Cart item updated successfully',
      requestId: req.requestId,
      data: result,
    }),
  );
};

export const removeCartItem = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const params = req.params as CartItemIdParams;

  const result = await cartService.removeCartItem({
    userId: req.user!.id,
    itemId: params.itemId,
  });

  res.status(200).json(
    successResponse({
      message: 'Cart item removed successfully',
      requestId: req.requestId,
      data: result,
    }),
  );
};

export const clearMyCart = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const result = await cartService.clearMyCart(req.user!.id);

  res.status(200).json(
    successResponse({
      message: 'Cart cleared successfully',
      requestId: req.requestId,
      data: result,
    }),
  );
};

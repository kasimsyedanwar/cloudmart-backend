import { Router } from 'express';
import { ProductController } from './product.controller';
import {
  createProductValidationSchema,
  productIdParamValidationSchema,
  updateProductValidationSchema,
} from './product.validation';
import { validateRequest } from '../../middlewares/validate.middleware';
import { auth } from '../../middlewares/auth.middleware';

const router = Router();

router.get('/', ProductController.getAllProducts);

router.get(
  '/:id',
  validateRequest(productIdParamValidationSchema),
  ProductController.getSingleProduct,
);

router.post(
  '/',
  auth('VENDOR', 'ADMIN'),
  validateRequest(createProductValidationSchema),
  ProductController.createProduct,
);

router.patch(
  '/:id',
  auth('VENDOR', 'ADMIN'),
  validateRequest(updateProductValidationSchema),
  ProductController.updateProduct,
);

router.delete(
  '/:id',
  auth('VENDOR', 'ADMIN'),
  validateRequest(productIdParamValidationSchema),
  ProductController.deleteProduct,
);

export const ProductRoutes = router;

import { Router } from 'express';
import { successResponse } from '../common/utils/api-response';
import authRoutes from '../modules/auth/auth.routes';
import healthRoutes from '../modules/health/health.routes';
import rbacRoutes from '../modules/rbac/rbac.routes';
import cartRoutes from '../modules/cart/cart.routes';
import userRoutes from '../modules/users/user.routes';
import orderRoutes from '../modules/orders/order.routes';
import vendorRoutes from '../modules/vendors/vendor.routes';
import paymentRoutes from '../modules/payments/payment.routes';
import categoryRoutes from '../modules/categories/category.routes';
import productRoutes from '../modules/products/product.routes';
import inventoryRoutes from '../modules/inventory/inventory.routes';

const router = Router();

router.use('/', healthRoutes);

router.get('/api/v1', (req, res) => {
  res.status(200).json(
    successResponse({
      message: 'CloudMart API v1 is ready',
      requestId: req.requestId,
      data: {
        version: 'v1',
      },
    }),
  );
});

router.use('/api/v1/auth', authRoutes);
router.use('/api/v1/rbac', rbacRoutes);
router.use('/api/v1', vendorRoutes);
router.use('/api/v1', userRoutes);
router.use('/api/v1', categoryRoutes);
router.use('/api/v1', productRoutes);
router.use('/api/v1', inventoryRoutes);
router.use('/api/v1', cartRoutes);
router.use('/api/v1', orderRoutes);
router.use('/api/v1', paymentRoutes);

export default router;

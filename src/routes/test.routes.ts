import { Router } from 'express';
import { auth } from '../middlewares/auth.middleware';
import { sendResponse } from '../common/utils/sendResponse';

const router = Router();

router.get('/private', auth(), (req, res) => {
  return sendResponse(res, 200, {
    success: true,
    message: 'Private route accessed successfuly',
    data: {
      user: req.user,
    },
  });
});

router.get('/admin', auth('ADMIN'), (req, res) => {
  return sendResponse(res, 200, {
    success: true,
    message: 'Admin route accessed successfuly',
    data: {
      user: req.user,
    },
  });
});

router.get('/vendor-or-admin', auth('VENDOR', 'ADMIN'), (req, res) => {
  return sendResponse(res, 200, {
    success: true,
    message: 'Vendor/Admin route accessed successfuly',
    data: {
      user: req.user,
    },
  });
});

export const TestRoutes = router;

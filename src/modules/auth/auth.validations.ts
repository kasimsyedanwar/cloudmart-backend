import { z } from 'zod';

export const registerValidationSchema = z.object({
  body: z.object({
    name: z.string().min(3, 'Name is required').max(50, 'Name is too long'),
    email: z.email('Invalid email address'),
    password: z
      .string()
      .min(6, 'Password must be atleast 6 Characters')
      .max(50, 'Password is too long'),
  }),
});

export const loginValidationSchema = z.object({
  body: z.object({
    email: z.email('Invalid email Address'),
    password: z.string().min(1, 'Password is required'),
  }),
});

export const refreshTokenValidationSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(1, 'Refresh token is expired'),
  }),
});

export const logoutValidationSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(1, 'Refresh token is expired'),
  }),
});

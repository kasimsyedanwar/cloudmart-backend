import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']),
  PORT: z.coerce.number().int().positive(),
  CORS_ORIGIN: z.string().min(1, 'CORS_ORIGIN is required'),
  LOG_LEVEL: z
    .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'])
    .default('info'),

  DATABASE_URL: z
    .string()
    .min(1, 'DATABASE_URL is required')
    .refine(
      (value) =>
        value.startsWith('postgresql://') || value.startsWith('postgres://'),
      {
        message:
          'DATABASE_URL must be valid PostgreSQL connection string starting with postgresql:// or postgres://',
      },
    ),
  REDIS_URL: z
    .string()
    .min(1, 'Redis URL is required')
    .refine((value) => value.startsWith('redis://'), {
      message:
        'REDIS_URL must be valid Redis connection string starting with redis://',
    }),
  JWT_ACCESS_SECRET: z
    .string()
    .min(32, 'JWT_ACCESS_SECRET must be atleast 32 Characters'),
  JWT_ACCESS_EXPIRES_IN: z.string().min(1, 'JWT_ACCESS_EXPIRES_IN is required'),
});

const parsedEnv = envSchema.safeParse(process.env);
if (!parsedEnv.success) {
  (console.error('Invalid environment variables:'),
    console.error(z.flattenError(parsedEnv.error).fieldErrors));
  process.exit(1);
}

const env = parsedEnv.data;
export default env;

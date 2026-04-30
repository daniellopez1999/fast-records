import { z } from 'zod';

export const envSchema = z.object({
  // Server
  NODE_ENV: z.enum(['development', 'production', 'test']),
  PORT: z.coerce.number(),

  // Database
  DB_HOST: z.string(),
  DB_PORT: z.coerce.number(),
  DB_USER: z.string(),
  DB_PASSWORD: z.string(),
  DB_NAME: z.string(),

  // JWT
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_EXPIRATION: z.string(),

  // Minio/S3
  MINIO_ENDPOINT: z.string(),
  MINIO_PORT: z.coerce.number(),
  MINIO_USE_SSL: z.coerce.boolean(),
  MINIO_ACCESS_KEY: z.string(),
  MINIO_SECRET_KEY: z.string(),
  MINIO_BUCKET_NAME: z.string(),

  // API
  API_URL: z.string().url().optional(),
  CORS_ORIGIN: z.string().optional(),

  // Logging
  LOG_LEVEL: z.enum(['error', 'warn', 'log', 'debug', 'verbose']),
});

export type EnvConfig = z.infer<typeof envSchema>;

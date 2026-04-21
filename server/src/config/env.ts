import 'dotenv/config'
import { z } from 'zod'

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),

  MONGO_URI: z.string().min(1, 'MONGO_URI is required'),
  MONGO_DB_NAME: z.string().default('main_db'),

  REDIS_URL: z.string().default('redis://localhost:6379'),
  REDIS_ENABLED: z
    .string()
    .default('true')
    .transform((v) => v === 'true'),
  CACHE_TTL_SECONDS: z.coerce.number().int().positive().default(600),

  ADMIN_USER: z.string().default('admin'),
  ADMIN_PASSWORD: z.string().min(8, 'ADMIN_PASSWORD must be at least 8 characters'),

  CORS_ORIGIN: z
    .string()
    .default('http://localhost:5173')
    .transform((v) => v.split(',').map((s) => s.trim()).filter(Boolean)),

  AUDIOBOOKS_DIR: z.string().default('./audiobooks'),
  UPLOADS_DIR: z.string().default('./uploads'),

  HF_HOME: z.string().optional(),
  TRANSLATION_ENABLED: z
    .string()
    .default('true')
    .transform((v) => v === 'true'),
  TRANSLATION_DTYPE: z.enum(['fp32', 'fp16', 'q8', 'q4']).default('q8'),

  PUBLIC_BASE_URL: z.string().default('http://localhost:4000'),

  SENTRY_DSN: z.string().optional(),
  SENTRY_RELEASE: z.string().optional(),

  // Nightly DB backup (emailed as gzipped JSON). Disabled by default so local
  // dev does not try to send mail unless explicitly configured.
  BACKUP_ENABLED: z
    .string()
    .default('false')
    .transform((v) => v === 'true'),
  BACKUP_CRON: z.string().default('0 2 * * *'),
  BACKUP_TIMEZONE: z.string().default('Europe/Berlin'),
  BACKUP_EMAIL_TO: z.string().default('littlebiblestories.app@gmail.com'),
  BACKUP_EMAIL_FROM: z.string().optional(),

  SMTP_HOST: z.string().default('smtp.gmail.com'),
  SMTP_PORT: z.coerce.number().int().positive().default(465),
  SMTP_SECURE: z
    .string()
    .default('true')
    .transform((v) => v === 'true'),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional()
})

const parsed = schema.safeParse(process.env)

if (!parsed.success) {
  console.error('❌ Invalid environment configuration:')
  for (const issue of parsed.error.issues) {
    console.error(`  - ${issue.path.join('.')}: ${issue.message}`)
  }
  process.exit(1)
}

export const env = parsed.data
export type Env = typeof env

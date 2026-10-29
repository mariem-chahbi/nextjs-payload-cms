import { z } from 'zod'

/** Empty strings in .env files mean "not set". */
const optional = <T extends z.ZodType>(schema: T) =>
  z.preprocess((v) => (v === '' ? undefined : v), schema.optional())

/** Any host on amazonaws.com (incl. regional/China endpoints like *.amazonaws.com.cn). */
export const isAwsHost = (hostname: string): boolean => /(^|\.)amazonaws\.com(\.cn)?$/i.test(hostname)

const minioEndpoint = z
  .url({ error: 'MINIO_ENDPOINT must be a full URL such as http://localhost:9200' })
  .refine((value) => !isAwsHost(new URL(value).hostname), {
    error: 'MINIO_ENDPOINT points to AWS (amazonaws.com). This project stores files on local MinIO only.',
  })

export const envSchema = z
  .object({
    DATABASE_URL: z.string().regex(/^postgres(ql)?:\/\//, 'DATABASE_URL must be a postgres:// URL'),
    PAYLOAD_SECRET: z.string().min(32, 'PAYLOAD_SECRET must be at least 32 characters'),
    NEXT_PUBLIC_SERVER_URL: z.url().default('http://localhost:3000'),

    MINIO_ENDPOINT: minioEndpoint,
    MINIO_REGION: z.string().min(1).default('us-east-1'),
    MINIO_ACCESS_KEY: z.string().min(3),
    MINIO_SECRET_KEY: z.string().min(8),
    MINIO_BUCKET: z.string().min(3).default('payload-playground'),
    // Optional folder in the bucket, so two databases (dev and the Docker app) never share files.
    MINIO_PREFIX: optional(z.string().regex(/^[a-z0-9-]+$/, 'MINIO_PREFIX: lowercase letters, digits and dashes')),

    SMTP_HOST: z.string().min(1).default('localhost'),
    SMTP_PORT: z.coerce.number().int().positive().default(1025),
    SMTP_USER: optional(z.string()),
    SMTP_PASS: optional(z.string()),
    SMTP_FROM_ADDRESS: z.email().default('no-reply@payload-playground.local'),
    SMTP_FROM_NAME: z.string().default('Payload Playground'),

    TRANSLATE_PROVIDER: z.enum(['libretranslate', 'deepl']).default('libretranslate'),
    LIBRETRANSLATE_URL: z.url().default('http://localhost:5000'),
    DEEPL_API_KEY: optional(z.string()),
  })
  .refine((env) => env.TRANSLATE_PROVIDER !== 'deepl' || Boolean(env.DEEPL_API_KEY), {
    error: 'TRANSLATE_PROVIDER=deepl requires DEEPL_API_KEY',
    path: ['DEEPL_API_KEY'],
  })

export type Env = z.infer<typeof envSchema>

/** Validates an env source. Throws one readable error listing every problem. */
export const parseEnv = (source: Record<string, string | undefined>): Env => {
  const result = envSchema.safeParse(source)
  if (!result.success) {
    const problems = result.error.issues
      .map((issue) => `  - ${issue.path.join('.') || 'env'}: ${issue.message}`)
      .join('\n')
    throw new Error(`Invalid environment configuration:\n${problems}`)
  }
  return result.data
}

let cached: Env | undefined

/** Server-only. Validated on first use; payload.config.ts calls it at startup. */
export const getEnv = (): Env => {
  cached ??= parseEnv(process.env)
  return cached
}

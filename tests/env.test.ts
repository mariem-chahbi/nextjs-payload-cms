import { describe, expect, it } from 'vitest'

import { isAwsHost, parseEnv } from '@/env'

const validEnv = {
  DATABASE_URL: 'postgres://payload:payload@localhost:5434/payload_playground',
  PAYLOAD_SECRET: 'x'.repeat(32),
  MINIO_ENDPOINT: 'http://localhost:9200',
  MINIO_ACCESS_KEY: 'payload-playground-app',
  MINIO_SECRET_KEY: 'payload-playground-app-secret',
}

describe('env validation', () => {
  it('accepts a local MinIO setup and fills defaults', () => {
    const env = parseEnv(validEnv)
    expect(env.MINIO_ENDPOINT).toBe('http://localhost:9200')
    expect(env.MINIO_BUCKET).toBe('payload-playground')
    expect(env.MINIO_REGION).toBe('us-east-1')
    expect(env.TRANSLATE_PROVIDER).toBe('libretranslate')
    expect(env.SMTP_PORT).toBe(1025)
  })

  it('refuses to start without MINIO_ENDPOINT', () => {
    const { MINIO_ENDPOINT: _omit, ...rest } = validEnv
    expect(() => parseEnv(rest)).toThrow(/MINIO_ENDPOINT/)
  })

  it.each([
    'https://s3.amazonaws.com',
    'https://s3.eu-west-1.amazonaws.com',
    'https://my-bucket.s3.us-east-1.amazonaws.com',
    'https://s3.cn-north-1.amazonaws.com.cn',
    'https://S3.AMAZONAWS.COM',
  ])('rejects the AWS endpoint %s', (endpoint) => {
    expect(() => parseEnv({ ...validEnv, MINIO_ENDPOINT: endpoint })).toThrow(/amazonaws\.com/)
  })

  it('does not mistake look-alike hosts for AWS', () => {
    expect(isAwsHost('notamazonaws.com.example.org')).toBe(false)
    expect(isAwsHost('minio')).toBe(false)
    expect(isAwsHost('host.docker.internal')).toBe(false)
  })

  it('requires DEEPL_API_KEY only when DeepL is the provider', () => {
    expect(() => parseEnv({ ...validEnv, TRANSLATE_PROVIDER: 'deepl' })).toThrow(/DEEPL_API_KEY/)
    expect(parseEnv({ ...validEnv, TRANSLATE_PROVIDER: 'deepl', DEEPL_API_KEY: 'k' }).DEEPL_API_KEY).toBe('k')
    expect(parseEnv({ ...validEnv, DEEPL_API_KEY: '' }).DEEPL_API_KEY).toBeUndefined()
  })

  it('rejects a non-Postgres database and a short secret', () => {
    expect(() => parseEnv({ ...validEnv, DATABASE_URL: 'mongodb://localhost/x' })).toThrow(/DATABASE_URL/)
    expect(() => parseEnv({ ...validEnv, PAYLOAD_SECRET: 'short' })).toThrow(/PAYLOAD_SECRET/)
  })
})

import { s3Storage } from '@payloadcms/storage-s3'
import type { Plugin } from 'payload'

import { getEnv } from './env'

/**
 * All file storage lives here: local MinIO, reached through the S3 protocol.
 *
 * `@payloadcms/storage-s3` is only the protocol connector. There is no AWS account, no AWS
 * credentials and no amazonaws.com endpoint: `getEnv()` refuses to start otherwise.
 */
export const storagePlugin = (): Plugin => {
  const env = getEnv()
  // e.g. MINIO_PREFIX=app → app/media/... and app/documents/... (dev keeps media/ and documents/).
  const folder = (name: string) => (env.MINIO_PREFIX ? `${env.MINIO_PREFIX}/${name}` : name)

  return s3Storage({
    // Keep the `prefix` column in the schema in every environment (stable migrations).
    alwaysInsertFields: true,
    bucket: env.MINIO_BUCKET,
    config: {
      endpoint: env.MINIO_ENDPOINT,
      // MinIO serves buckets as http://host:port/<bucket>, not <bucket>.host.
      forcePathStyle: true,
      // Required by the SDK's request signer; MinIO ignores the value.
      region: env.MINIO_REGION,
      credentials: {
        accessKeyId: env.MINIO_ACCESS_KEY,
        secretAccessKey: env.MINIO_SECRET_KEY,
      },
    },
    // The browser PUTs files straight to MinIO with a presigned URL (no 200 MB body through Next).
    clientUploads: true,
    collections: {
      // Public: served through Payload's /api/media/file/... route, which applies `read` access.
      media: {
        prefix: folder('media'),
      },
      // Private: Payload checks `read` access, then redirects to a short-lived presigned MinIO URL.
      documents: {
        prefix: folder('documents'),
        signedDownloads: {
          shouldUseSignedURL: () => true,
          expiresIn: 60 * 5,
        },
      },
    },
  })
}

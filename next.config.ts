import { withPayload } from '@payloadcms/next/withPayload'
import type { NextConfig } from 'next'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(__filename)

/** next/image may load straight from MinIO (signed or public URLs), so allow its host. */
const minioPattern = (() => {
  try {
    const url = new URL(process.env.MINIO_ENDPOINT || 'http://localhost:9200')
    return {
      protocol: url.protocol.replace(':', '') as 'http' | 'https',
      hostname: url.hostname,
      port: url.port,
      pathname: '/**',
    }
  } catch {
    return undefined
  }
})()

const nextConfig: NextConfig = {
  output: 'standalone',
  images: {
    // Media is normally served through Payload (/api/media/file/...), which enforces access control.
    localPatterns: [{ pathname: '/api/media/file/**' }],
    remotePatterns: minioPattern ? [minioPattern] : [],
    // MinIO runs on localhost in this project; Next 16 blocks private IPs unless allowed.
    dangerouslyAllowLocalIP: true,
    deviceSizes: [480, 768, 1024, 1280, 1536, 1920, 2560],
  },
  webpack: (webpackConfig) => {
    webpackConfig.resolve.extensionAlias = {
      '.cjs': ['.cts', '.cjs'],
      '.js': ['.ts', '.tsx', '.js', '.jsx'],
      '.mjs': ['.mts', '.mjs'],
    }
    return webpackConfig
  },
  turbopack: {
    root: path.resolve(dirname),
  },
}

export default withPayload(nextConfig, { devBundleServerPackages: false })

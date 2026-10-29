'use client'

import { RefreshRouteOnSave } from '@payloadcms/live-preview-react'
import { useRouter } from 'next/navigation'

/**
 * Live Preview (server-side rendering): every autosave in the admin (0.8 s) re-renders the route
 * with the latest draft, so the preview follows the editor while typing.
 */
export function LivePreviewListener() {
  const router = useRouter()
  const serverURL = typeof window !== 'undefined' ? window.location.origin : (process.env.NEXT_PUBLIC_SERVER_URL ?? '')
  return <RefreshRouteOnSave refresh={() => router.refresh()} serverURL={serverURL} />
}

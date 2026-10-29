import { draftMode } from 'next/headers'
import { redirect } from 'next/navigation'

import { getPayload } from '@/utilities/getPayload'

/**
 * Turns on Next draft mode for a logged-in admin user, then opens the page.
 * Used by the admin "Preview" button and the Live Preview iframe (same origin → admin cookie is sent).
 */
export async function GET(request: Request): Promise<Response> {
  const path = new URL(request.url).searchParams.get('path') ?? '/'
  if (!path.startsWith('/') || path.startsWith('//')) {
    return new Response('Invalid path', { status: 400 })
  }

  const payload = await getPayload()
  const { user } = await payload.auth({ headers: request.headers })
  if (!user) {
    return new Response('Log in to the admin panel to preview drafts.', { status: 403 })
  }

  ;(await draftMode()).enable()
  redirect(path)
}

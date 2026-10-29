import { revalidateTag } from 'next/cache'
import type { CollectionAfterChangeHook, CollectionAfterDeleteHook, GlobalAfterChangeHook } from 'payload'

import { TAGS } from '@/utilities/cacheTags'

/**
 * Expires cached site data right away so edits show without a rebuild.
 * Outside a Next.js request (seed script, CLI) there is no cache to expire: ignore.
 */
const expire = (tag: string, context: Record<string, unknown>) => {
  if (context.disableRevalidate) return
  try {
    revalidateTag(tag, { expire: 0 })
  } catch {
    // Not running inside Next.js.
  }
}

export const revalidateCollection =
  (tag: string): CollectionAfterChangeHook =>
  ({ doc, context }) => {
    expire(tag, context)
    return doc
  }

export const revalidateCollectionDelete =
  (tag: string): CollectionAfterDeleteHook =>
  ({ doc, context }) => {
    expire(tag, context)
    return doc
  }

export const revalidateGlobal: GlobalAfterChangeHook = ({ doc, global, context }) => {
  expire(TAGS.global(global.slug), context)
  return doc
}

import type { CollectionConfig, GlobalConfig, Plugin } from 'payload'

import { applyTranslatorFieldAccess, createTranslatorGuard, translatorBeforeOperation } from '@/access/translator'

/** Collections whose saves go through the structure guard (globals always do). */
const GUARDED_COLLECTIONS = new Set(['pages', 'forms', 'media'])

/**
 * Collections with per-field rules (shown read-only to translators in the admin). Kept small on
 * purpose: Payload evaluates every field access function on every admin request.
 */
const FIELD_RULE_COLLECTIONS = new Set(['translations'])

/** Auth and Payload-internal collections keep their own rules. */
const isExcluded = (collection: CollectionConfig) =>
  Boolean(collection.auth) || collection.slug.startsWith('payload-')

const hasDrafts = (config: CollectionConfig | GlobalConfig) =>
  Boolean(config.versions && typeof config.versions === 'object' && config.versions.drafts)

const withGuard = <T extends CollectionConfig | GlobalConfig>(config: T): T => {
  const hooks = config.hooks ?? {}
  return {
    ...config,
    hooks: {
      ...hooks,
      beforeOperation: [translatorBeforeOperation as never, ...(hooks.beforeOperation ?? [])],
      beforeChange: [createTranslatorGuard(config.fields, { drafts: hasDrafts(config) }) as never, ...(hooks.beforeChange ?? [])],
    },
  }
}

/**
 * Must be the LAST plugin, so it also covers fields added by other plugins (SEO meta, form builder).
 * Translators are limited by collection access (non-default locale only) plus the structure guard,
 * which rejects any change to a shared (non-localized) value, block structure, or publishing.
 */
export const translatorAccessPlugin = (): Plugin => (config) => {
  return {
    ...config,
    collections: (config.collections ?? []).map((collection) => {
      if (isExcluded(collection)) return collection
      const withAccess = FIELD_RULE_COLLECTIONS.has(collection.slug)
        ? { ...collection, fields: applyTranslatorFieldAccess(collection.fields) }
        : collection
      return GUARDED_COLLECTIONS.has(collection.slug) ? withGuard(withAccess) : withAccess
    }),
    globals: (config.globals ?? []).map((global) => withGuard(global)),
  }
}

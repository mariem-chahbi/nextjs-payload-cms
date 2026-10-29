import type { CollectionConfig, GlobalConfig, Plugin } from 'payload'

import { createTranslationStatusHook, TRANSLATION_FIELD, translationStatusField } from '@/translation/status'

/** Collections with translation status (globals always have it). */
export const TRANSLATABLE_COLLECTIONS = ['pages', 'translations'] as const

const TRANSLATE_BUTTON = '/components/admin/TranslateButton#TranslateButton'

const withStatusField = <T extends CollectionConfig | GlobalConfig>(entity: T): T => {
  const hooks = entity.hooks ?? {}
  return {
    ...entity,
    fields: [...entity.fields, translationStatusField()],
    hooks: {
      ...hooks,
      beforeChange: [...(hooks.beforeChange ?? []), createTranslationStatusHook(entity.fields) as never],
    },
  }
}

const withCollectionUI = (collection: CollectionConfig): CollectionConfig => {
  const admin = collection.admin ?? {}
  const components = admin.components ?? {}
  return {
    ...collection,
    admin: {
      ...admin,
      // Status badges per locale in the list view.
      defaultColumns: [...(admin.defaultColumns ?? []), TRANSLATION_FIELD],
      components: {
        ...components,
        edit: {
          ...components.edit,
          beforeDocumentControls: [...(components.edit?.beforeDocumentControls ?? []), TRANSLATE_BUTTON],
        },
      },
    },
  }
}

const withGlobalUI = (global: GlobalConfig): GlobalConfig => {
  const admin = global.admin ?? {}
  const components = admin.components ?? {}
  return {
    ...global,
    admin: {
      ...admin,
      components: {
        ...components,
        elements: {
          ...components.elements,
          beforeDocumentControls: [...(components.elements?.beforeDocumentControls ?? []), TRANSLATE_BUTTON],
        },
      },
    },
  }
}

/**
 * Adds the per-locale translation status (field + hook), the "Translate" button and list badges.
 * Runs after the SEO plugin (so SEO texts count as source text) and before the translator rules.
 */
export const translationStatusPlugin = (): Plugin => (config) => ({
  ...config,
  collections: (config.collections ?? []).map((c) => {
    if (!(TRANSLATABLE_COLLECTIONS as readonly string[]).includes(c.slug)) return c
    const withField = withStatusField(c)
    return c.slug === 'pages' ? withCollectionUI(withField) : { ...withField, admin: { ...withField.admin, defaultColumns: [...(withField.admin?.defaultColumns ?? []), TRANSLATION_FIELD] } }
  }),
  globals: (config.globals ?? []).map((g) => withGlobalUI(withStatusField(g))),
})

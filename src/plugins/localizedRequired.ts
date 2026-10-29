import type { Block, Field, Plugin, Validate } from 'payload'
import { email, number, relationship, select, text, textarea, upload } from 'payload/shared'

import { isEmptyValue } from '@/i18n/fallback'
import { DEFAULT_LOCALE } from '@/i18n/locales'

/**
 * Region and translation locales store only what differs; everything else is inherited through
 * the fallback chain. So a localized field marked `required` is required in the default locale
 * only — otherwise ar-TN could never be saved without copying every text.
 */
const DEFAULT_VALIDATORS: Partial<Record<Field['type'], Validate>> = {
  text: text as Validate,
  textarea: textarea as Validate,
  email: email as Validate,
  number: number as Validate,
  select: select as Validate,
  upload: upload as Validate,
  relationship: relationship as Validate,
}

export const requiredInLocale = (locale: unknown): boolean => !locale || locale === DEFAULT_LOCALE || locale === 'all'

const relaxRequired = (field: Field): Field => {
  const base = DEFAULT_VALIDATORS[field.type]
  const custom = 'validate' in field ? (field.validate as Validate | undefined) : undefined
  const validate: Validate = async (value, options) => {
    const required = requiredInLocale(options.req?.locale)
    if (required && isEmptyValue(value)) return options.req?.t ? options.req.t('validation:required') : 'This field is required.'
    if (custom) return custom(value, { ...options, required })
    if (base) return base(value, { ...options, required })
    return true
  }
  return { ...field, required: false, validate } as Field
}

const mapBlocks = (blocks: Block[]): Block[] => blocks.map((b) => ({ ...b, fields: relaxLocalizedRequired(b.fields) }))

export const relaxLocalizedRequired = (fields: Field[], insideLocalized = false): Field[] =>
  fields.map((field): Field => {
    const localized = 'localized' in field && field.localized === true
    if (localized && !insideLocalized && 'required' in field && field.required && !('fields' in field) && field.type !== 'blocks') {
      return relaxRequired(field)
    }
    const childInside = insideLocalized || localized
    switch (field.type) {
      case 'tabs':
        return {
          ...field,
          tabs: field.tabs.map((tab) => ({
            ...tab,
            fields: relaxLocalizedRequired(tab.fields, childInside || ('localized' in tab && tab.localized === true)),
          })),
        }
      case 'blocks':
        return childInside ? field : { ...field, blocks: mapBlocks(field.blocks ?? []) }
      case 'array':
      case 'group':
      case 'row':
      case 'collapsible':
        return { ...field, fields: relaxLocalizedRequired(field.fields, childInside) } as Field
      default:
        return field
    }
  })

export const localizedRequiredPlugin = (): Plugin => (config) => ({
  ...config,
  collections: (config.collections ?? []).map((c) => ({ ...c, fields: relaxLocalizedRequired(c.fields) })),
  globals: (config.globals ?? []).map((g) => ({ ...g, fields: relaxLocalizedRequired(g.fields) })),
})

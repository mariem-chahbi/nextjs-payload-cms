import type { Block, Field } from 'payload'

import { styleFields } from '@/fields/style'
import { l } from '@/i18n/labels'
import { fitIdentifier, toSnake } from '@/utilities/dbNames'

/**
 * Every select gets an enum name that fits Postgres' 63-char limit. Block tables already carry long
 * prefixes (`_pages_v_blocks_testimonials_...`), so default names would overflow.
 * Arrays and nested blocks start a new table, so the column path restarts there.
 */
const assignEnumNames = (fields: Field[], path: string[]): Field[] =>
  fields.map((field): Field => {
    switch (field.type) {
      case 'select': {
        if (field.hasMany || field.enumName) return field
        const column = [...path, field.name].map(toSnake).join('_')
        return { ...field, enumName: ({ tableName }) => fitIdentifier(`enum_${tableName}_${column}`) }
      }
      case 'group':
        return { ...field, fields: assignEnumNames(field.fields, 'name' in field && field.name ? [...path, field.name] : path) }
      case 'row':
      case 'collapsible':
        return { ...field, fields: assignEnumNames(field.fields, path) }
      case 'tabs':
        return {
          ...field,
          tabs: field.tabs.map((tab) => ({
            ...tab,
            fields: assignEnumNames(tab.fields, 'name' in tab && tab.name ? [...path, tab.name] : path),
          })),
        }
      case 'array':
        return { ...field, fields: assignEnumNames(field.fields, []) }
      case 'blocks':
        return { ...field, blocks: (field.blocks ?? []).map((b) => ({ ...b, fields: assignEnumNames(b.fields, []) })) }
      default:
        return field
    }
  })

type DefineBlockArgs = {
  slug: string
  interfaceName: string
  labels: { singular: Record<string, string>; plural: Record<string, string> }
  fields: Field[]
  imageAltText?: string
}

/** A page-builder block: a "Content" tab with the block's own fields and the shared "Style" tab. */
export const defineBlock = ({ slug, interfaceName, labels, fields }: DefineBlockArgs): Block => ({
  slug,
  interfaceName,
  labels,
  fields: assignEnumNames(
    [
      {
        type: 'tabs',
        tabs: [
          { label: l('Content', 'المحتوى'), fields },
          { name: 'style', label: l('Style', 'التنسيق'), fields: styleFields() },
        ],
      },
    ],
    [],
  ),
})

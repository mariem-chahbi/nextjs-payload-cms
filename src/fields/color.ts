import type { TextField } from 'payload'

import { COLOR_VALUE_PATTERN } from './colorTokens'

type ColorFieldArgs = {
  name: string
  label?: TextField['label']
  defaultValue?: string
  required?: boolean
  /** Theme globals store raw hex only (they define the tokens). */
  hexOnly?: boolean
  admin?: TextField['admin']
}

const HEX_ONLY = /^#[0-9a-fA-F]{6}([0-9a-fA-F]{2})?$/

/** A text field with a color picker (theme swatches + custom color). */
export const colorField = ({ name, label, defaultValue, required, hexOnly, admin }: ColorFieldArgs): TextField => ({
  name,
  type: 'text',
  label,
  defaultValue,
  required,
  validate: (value: unknown) => {
    if (value === null || value === undefined || value === '') return required ? 'Pick a color.' : true
    const pattern = hexOnly ? HEX_ONLY : COLOR_VALUE_PATTERN
    return typeof value === 'string' && pattern.test(value) ? true : 'Use a theme color or a hex color like #1e40af.'
  },
  admin: {
    ...admin,
    components: {
      Field: {
        path: '/components/admin/ColorField#ColorField',
        clientProps: { hexOnly: Boolean(hexOnly) },
      },
    },
  },
})

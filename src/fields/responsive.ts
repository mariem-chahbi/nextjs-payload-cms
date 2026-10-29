import type { Field, GroupField, NumberField, SelectField } from 'payload'

import { l } from '@/i18n/labels'

export const BREAKPOINTS = ['desktop', 'tablet', 'mobile'] as const
export type Breakpoint = (typeof BREAKPOINTS)[number]

export const BREAKPOINT_LABELS: Record<Breakpoint, Record<'en' | 'ar', string>> = {
  desktop: l('Desktop', 'سطح المكتب'),
  tablet: l('Tablet', 'جهاز لوحي'),
  mobile: l('Mobile', 'الجوال'),
}

/** Spacing scale shared by padding, margin, gaps and spacers. Values map to CSS variables. */
export const SPACE_SCALE = ['none', 'xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl'] as const
export type SpaceToken = (typeof SPACE_SCALE)[number]

export const spaceOptions = (withInherit: boolean) => [
  ...(withInherit ? [{ value: 'inherit', label: l('Same as larger screen', 'مثل الشاشة الأكبر') }] : []),
  ...SPACE_SCALE.map((value) => ({ value, label: value })),
]

/**
 * One value per breakpoint, side by side: { desktop, tablet, mobile }.
 * Tablet and mobile may inherit the next larger breakpoint (empty / "inherit").
 */
export const responsiveNumber = (
  name: string,
  label: GroupField['label'],
  options: { min?: number; max?: number; step?: number; defaultValue?: number; description?: Record<string, string> } = {},
): GroupField => ({
  name,
  type: 'group',
  label,
  admin: { description: options.description, hideGutter: true },
  fields: [
    {
      type: 'row',
      fields: BREAKPOINTS.map(
        (bp): NumberField => ({
          name: bp,
          type: 'number',
          label: BREAKPOINT_LABELS[bp],
          min: options.min,
          max: options.max,
          defaultValue: bp === 'desktop' ? options.defaultValue : undefined,
          admin: {
            step: options.step,
            width: '33%',
            placeholder: bp === 'desktop' ? undefined : 'inherit',
          },
        }),
      ),
    },
  ],
})

export const responsiveSpace = (name: string, label: GroupField['label'], defaultValue: SpaceToken = 'none'): GroupField => ({
  name,
  type: 'group',
  label,
  admin: { hideGutter: true },
  fields: [
    {
      type: 'row',
      fields: BREAKPOINTS.map(
        (bp): SelectField => ({
          name: bp,
          type: 'select',
          label: BREAKPOINT_LABELS[bp],
          defaultValue: bp === 'desktop' ? defaultValue : 'inherit',
          options: spaceOptions(bp !== 'desktop'),
          admin: { width: '33%' },
        }),
      ),
    },
  ],
})

/** Group of the same fields repeated per breakpoint, in collapsible sections. */
export const perBreakpoint = (name: string, label: GroupField['label'], fields: (bp: Breakpoint) => Field[]): GroupField => ({
  name,
  type: 'group',
  label,
  fields: BREAKPOINTS.map((bp) => ({
    name: bp,
    type: 'group',
    label: BREAKPOINT_LABELS[bp],
    admin: { hideGutter: true },
    fields: fields(bp),
  })),
})

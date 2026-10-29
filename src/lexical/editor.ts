import {
  BlocksFeature,
  FixedToolbarFeature,
  HeadingFeature,
  lexicalEditor,
  LinkFeature,
  TextStateFeature,
  UploadFeature,
} from '@payloadcms/richtext-lexical'
import type { Block } from 'payload'

import { colorField } from '@/fields/color'
import { BUTTON_SIZES, BUTTON_VARIANTS, linkFields } from '@/fields/link'
import { l } from '@/i18n/labels'

import { ICON_OPTIONS } from './icons'
import { textStateConfig } from './textState'

/** Inline button inside a paragraph. Lives in the localized rich-text JSON. */
export const InlineButtonBlock: Block = {
  slug: 'inlineButton',
  interfaceName: 'InlineButtonBlock',
  labels: { singular: l('Button', 'زر'), plural: l('Buttons', 'أزرار') },
  fields: [
    { name: 'label', type: 'text', required: true, label: l('Label', 'النص') },
    ...linkFields({ localizedUrl: false }),
    {
      type: 'row',
      fields: [
        {
          name: 'variant',
          type: 'select',
          defaultValue: 'primary',
          label: l('Style', 'النمط'),
          options: BUTTON_VARIANTS.map((value) => ({ value, label: value })),
        },
        {
          name: 'size',
          type: 'select',
          defaultValue: 'sm',
          label: l('Size', 'الحجم'),
          options: BUTTON_SIZES.map((value) => ({ value, label: value })),
        },
      ],
    },
  ],
}

export const InlineIconBlock: Block = {
  slug: 'inlineIcon',
  interfaceName: 'InlineIconBlock',
  labels: { singular: l('Icon', 'أيقونة'), plural: l('Icons', 'أيقونات') },
  fields: [
    {
      type: 'row',
      fields: [
        { name: 'icon', type: 'select', required: true, defaultValue: 'star', options: ICON_OPTIONS, label: l('Icon', 'الأيقونة') },
        {
          name: 'size',
          type: 'select',
          defaultValue: '1em',
          label: l('Size', 'الحجم'),
          options: ['1em', '1.25em', '1.5em', '2em', '3em'].map((value) => ({ value, label: value })),
        },
      ],
    },
    colorField({ name: 'color', label: l('Color', 'اللون') }),
  ],
}

/**
 * The one rich-text editor used everywhere (config default).
 * Default features already include bold/italic/underline/strike, sub/superscript, inline code,
 * headings, alignment, indent, bullet/numbered/check lists, quote, horizontal rule, links,
 * uploads and the inline toolbar. Added here: fixed toolbar, text color/highlight/size, inline blocks.
 */
export const defaultEditor = lexicalEditor({
  features: ({ defaultFeatures }) => [
    ...defaultFeatures.filter((f) => !['heading', 'link', 'upload'].includes(f.key)),
    HeadingFeature({ enabledHeadingSizes: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'] }),
    LinkFeature({ enabledCollections: ['pages'] }),
    // Inline images *and* videos from the media collection.
    UploadFeature({
      collections: {
        media: {
          fields: [
            {
              name: 'size',
              type: 'select',
              defaultValue: 'full',
              options: ['small', 'medium', 'full'].map((value) => ({ value, label: value })),
            },
          ],
        },
      },
    }),
    FixedToolbarFeature(),
    TextStateFeature({ state: textStateConfig }),
    BlocksFeature({ inlineBlocks: [InlineButtonBlock, InlineIconBlock] }),
  ],
})

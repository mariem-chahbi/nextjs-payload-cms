import type { SerializedEditorState, SerializedLexicalNode } from '@payloadcms/richtext-lexical/lexical'
import {
  type JSXConvertersFunction,
  LinkJSXConverter,
  RichText as LexicalRichText,
} from '@payloadcms/richtext-lexical/react'
import type { CSSProperties, ReactNode } from 'react'

import { colorToCSS } from '@/fields/colorTokens'
import type { LocaleCode } from '@/i18n/locales'
import { textStateToStyle } from '@/lexical/textState'
import type { Media as MediaDoc } from '@/payload-types'
import { pageHref } from '@/utilities/links'

import { CMSLink, type ButtonSize, type ButtonVariant } from './CMSLink'
import { Icon } from './Icon'
import { Media } from './Media'

/** Lexical alignment → logical CSS, so "left" in English becomes the start side in Arabic. */
export const logicalAlign = (format: unknown): CSSProperties['textAlign'] | undefined => {
  switch (format) {
    case 'left':
    case 'start':
      return 'start'
    case 'right':
    case 'end':
      return 'end'
    case 'center':
      return 'center'
    case 'justify':
      return 'justify'
    default:
      return undefined
  }
}

type BlockNode = { node: { fields: Record<string, unknown> } }
type Element = SerializedLexicalNode & { format?: unknown; indent?: number; children?: SerializedLexicalNode[]; tag?: string }

const blockStyle = (node: Element): CSSProperties | undefined => {
  const style: CSSProperties = {}
  const align = logicalAlign(node.format)
  if (align) style.textAlign = align
  if (node.indent) style.marginInlineStart = `${node.indent * 2}em`
  return Object.keys(style).length ? style : undefined
}

const converters =
  (locale: LocaleCode, homePageId?: number | string | null): JSXConvertersFunction =>
  ({ defaultConverters }) => ({
    ...defaultConverters,
    ...LinkJSXConverter({
      internalDocToHref: ({ linkNode }) => {
        const doc = linkNode.fields.doc?.value
        return typeof doc === 'object' ? pageHref(doc as never, locale, homePageId) : `/${locale}`
      },
    }),

    // Bold/italic/... from the default converter, plus text color, highlight and size (TextStateFeature).
    text: (args) => {
      const base = (defaultConverters.text as (a: typeof args) => ReactNode)(args)
      const style = textStateToStyle((args.node as { $?: Record<string, unknown> }).$)
      return Object.keys(style).length ? <span style={style}>{base}</span> : base
    },

    paragraph: ({ node, nodesToJSX }) => {
      const children = nodesToJSX({ nodes: (node as Element).children ?? [] })
      return <p style={blockStyle(node as Element)}>{children.length ? children : <br />}</p>
    },

    heading: ({ node, nodesToJSX }) => {
      const Tag = ((node as Element).tag ?? 'h2') as 'h1'
      return <Tag style={blockStyle(node as Element)}>{nodesToJSX({ nodes: (node as Element).children ?? [] })}</Tag>
    },

    // Inline images and videos from the media collection.
    upload: ({ node }) => {
      const value = (node as { value?: MediaDoc | number }).value
      if (!value || typeof value !== 'object') return null
      const size = (node as { fields?: { size?: string } }).fields?.size ?? 'full'
      return (
        <figure className={`rt-media rt-media-${size}`}>
          <Media media={value} controls sizes="(min-width: 1024px) 800px, 100vw" />
          {value.caption ? <figcaption>{value.caption}</figcaption> : null}
        </figure>
      )
    },

    inlineBlocks: {
      inlineButton: ({ node }: BlockNode) => {
        const f = node.fields as { label?: string; variant?: ButtonVariant; size?: ButtonSize } & Record<string, unknown>
        return (
          <CMSLink link={f as never} locale={locale} homePageId={homePageId} variant={f.variant ?? 'primary'} size={f.size ?? 'sm'} className="rt-inline-button">
            {f.label}
          </CMSLink>
        )
      },
      inlineIcon: ({ node }: BlockNode) => {
        const f = node.fields as { icon?: string; size?: string; color?: string }
        return <Icon name={f.icon} size={f.size ?? '1em'} color={colorToCSS(f.color)} />
      },
    },
  })

type RichTextProps = {
  data: unknown
  locale: LocaleCode
  homePageId?: number | string | null
  className?: string
}

/** Rich text from Lexical with full styling. Direction comes from the page (<html dir>). */
export function RichText({ data, locale, homePageId, className }: RichTextProps) {
  if (!data || typeof data !== 'object' || !('root' in data)) return null
  return (
    <LexicalRichText
      data={data as SerializedEditorState}
      converters={converters(locale, homePageId)}
      className={['rich-text', className].filter(Boolean).join(' ')}
    />
  )
}

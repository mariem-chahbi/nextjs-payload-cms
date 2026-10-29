import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { type AnyBlock, RenderBlocks } from '@/blocks/RenderBlocks'
import { blockComponents } from '@/blocks/registry'
import type { RenderContext } from '@/blocks/types'
import { BLOCK_SLUGS } from '@/blocks'

const image = { id: 1, url: 'http://localhost:3000/api/media/file/photo.jpg?prefix=media', alt: 'Photo', width: 1600, height: 900, mimeType: 'image/jpeg', focalX: 30, focalY: 70 }
const video = { id: 2, url: 'http://localhost:3000/api/media/file/clip.mp4?prefix=media', alt: 'Clip', mimeType: 'video/mp4' }
const page = { id: 5, title: 'About', path: 'about-us' }

/** Lexical state with one paragraph: bold + italic + colored text, centered. */
const rich = (text: string, format = 'center') => ({
  root: {
    type: 'root', direction: null, format: '', indent: 0, version: 1,
    children: [
      {
        type: 'paragraph', direction: null, format, indent: 0, version: 1, textFormat: 0,
        children: [{ type: 'text', text, format: 3, detail: 0, mode: 'normal', style: '', version: 1, $: { color: 'theme-primary', size: 'xl' } }],
      },
    ],
  },
})

const ctx = (overrides: Partial<RenderContext> = {}): RenderContext => ({
  locale: 'en',
  dir: 'ltr',
  region: { id: 1, code: 'intl', currency: 'USD', numberFormat: 'latn', dateFormat: 'long', timezone: 'UTC' } as never,
  homePageId: 1,
  strings: {},
  ...overrides,
})

const sample: Record<string, AnyBlock> = {
  hero: { blockType: 'hero', content: rich('Welcome hero'), height: 'large', contentPosition: 'bottom-end', media: { type: 'image', image, overlayColor: 'theme:text', overlayOpacity: 40 }, buttons: [{ label: 'Start now', type: 'page', page, variant: 'primary' }] },
  richText: { blockType: 'richText', content: rich('Rich body'), textColumns: '2' },
  columns: { blockType: 'columns', gap: 'md', columns: [{ width: { desktop: 8, tablet: 6 }, mobileOrder: 2, content: [{ blockType: 'richText', content: rich('Inside column') }] }, { width: { desktop: 4 }, content: [] }] },
  mediaText: { blockType: 'mediaText', media: image, mediaPosition: 'end', ratio: '1/3', content: rich('Beside media') },
  image: { blockType: 'image', image, size: 'medium', align: 'end', rounded: 'lg', shadow: 'md', caption: 'A caption' },
  video: { blockType: 'video', source: 'youtube', url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', autoplay: true, muted: true, aspectRatio: '16/9' },
  gallery: { blockType: 'gallery', layout: 'grid', lightbox: true, columns: { desktop: 4 }, images: [{ image, caption: 'Gallery one' }] },
  cards: { blockType: 'cards', heading: 'Our services', columns: { desktop: 3 }, cards: [{ title: 'Card title', text: 'Card text', icon: 'star', linkLabel: 'Read more', link: { type: 'page', page } }] },
  buttons: { blockType: 'buttons', layout: 'row', justify: 'center', buttons: [{ label: 'Contact', type: 'url', url: 'https://example.com', newTab: true, variant: 'outline' }] },
  stats: { blockType: 'stats', heading: 'In numbers', stats: [{ value: 12500, format: 'compact', label: 'Users' }, { value: 30, format: 'currency', label: 'Price' }] },
  testimonials: { blockType: 'testimonials', layout: 'slider', items: [{ quote: 'Great product', author: 'Sara', role: 'CTO', rating: 4 }] },
  faq: { blockType: 'faq', heading: 'FAQ', openFirst: true, items: [{ question: 'Is it free?', answer: rich('Yes') }, { question: 'Second?', answer: rich('No') }] },
  logos: { blockType: 'logos', heading: 'Trusted by', autoScroll: true, logos: [{ image, name: 'Acme' }] },
  cta: { blockType: 'cta', layout: 'split', content: rich('Ready?'), buttons: [{ label: 'Go', type: 'url', url: '/en/go' }] },
  form: { blockType: 'form', heading: 'Contact us', form: { id: 9, fields: [{ blockType: 'text', name: 'name', label: 'Your name', required: true }, { blockType: 'email', name: 'email', label: 'Email' }], submitButtonLabel: 'Send it', confirmationType: 'message', confirmationMessage: rich('Thanks') } },
  spacer: { blockType: 'spacer', height: { desktop: 80, mobile: 24 }, showDivider: true, dividerStyle: 'dashed', dividerColor: 'theme:accent' },
  freeLayout: { blockType: 'freeLayout', height: { desktop: 500 }, stackOnMobile: true, mirrorInRTL: true, items: [{ type: 'text', text: rich('Floating text'), position: { desktop: { x: 10, y: 20, width: 40, rotate: 5 } } }, { type: 'button', button: { label: 'Canvas button', type: 'url', url: '/x' }, position: { desktop: { x: 60, y: 70 } } }] },
}

const render = (blocks: AnyBlock[], context = ctx()) => renderToStaticMarkup(<RenderBlocks blocks={blocks} ctx={context} />)

describe('block rendering', () => {
  it('has a component for every block in the page builder', () => {
    expect(Object.keys(blockComponents).sort()).toEqual([...BLOCK_SLUGS].sort())
    expect(Object.keys(sample).sort()).toEqual([...BLOCK_SLUGS].sort())
  })

  const expectations: Record<string, (html: string) => void> = {
    hero: (h) => {
      expect(h).toContain('Welcome hero')
      expect(h).toContain('data-v="bottom"')
      expect(h).toContain('data-h="end"')
      expect(h).toContain('href="/en/about-us"')
      expect(h).toContain('object-position:30% 70%')
    },
    richText: (h) => {
      expect(h).toContain('<em><strong>Rich body</strong></em>')
      expect(h).toContain('color:var(--color-primary)')
      expect(h).toContain('font-size:1.5em')
      expect(h).toContain('text-align:center')
    },
    columns: (h) => {
      expect(h).toContain('--w-d:8')
      expect(h).toContain('--w-t:6')
      expect(h).toContain('--order-m:2')
      expect(h).toContain('Inside column')
    },
    mediaText: (h) => expect(h).toMatch(/media-text-end[\s\S]*Beside media/),
    image: (h) => {
      expect(h).toContain('image-align-end')
      expect(h).toContain('A caption')
      expect(h).toContain('/_next/image?url=%2Fapi%2Fmedia%2Ffile%2Fphoto.jpg')
    },
    video: (h) => expect(h).toContain('https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?autoplay=1&amp;mute=1'),
    gallery: (h) => {
      expect(h).toContain('--cols-d:4')
      expect(h).toContain('Gallery one')
    },
    cards: (h) => {
      expect(h).toContain('Card title')
      expect(h).toContain('icon-mirror')
    },
    buttons: (h) => {
      expect(h).toContain('btn-outline')
      expect(h).toContain('target="_blank"')
    },
    stats: (h) => {
      expect(h).toContain('12.5K')
      expect(h).toContain('$30')
    },
    testimonials: (h) => expect(h).toContain('Great product'),
    faq: (h) => {
      expect(h).toContain('<details name="faq-')
      expect(h).toMatch(/<details[^>]*open=""[^>]*><summary>Is it free\?/)
    },
    logos: (h) => expect(h).toContain('logos-marquee'),
    cta: (h) => expect(h).toContain('cta-split'),
    form: (h) => {
      expect(h).toContain('Your name')
      expect(h).toContain('Send it')
      expect(h).toContain('type="email"')
    },
    spacer: (h) => {
      expect(h).toContain('--h-d:80px')
      expect(h).toContain('border-top-style:dashed')
    },
    freeLayout: (h) => {
      expect(h).toContain('--x-d:10%')
      expect(h).toContain('Floating text')
      expect(h).toContain('Canvas button')
    },
  }

  it.each(Object.keys(sample))('renders %s', (type) => {
    const html = render([sample[type]!])
    expect(html).toContain(`block-${type}`)
    expectations[type]!(html)
  })

  it('applies the Style tab: background, text color, spacing per breakpoint, visibility, anchor, animation', () => {
    const html = render([
      {
        ...sample.richText!,
        style: {
          background: { type: 'gradient', gradientFrom: 'theme:primary', gradientTo: '#ff0000', gradientAngle: 90 },
          textColor: 'theme:background',
          font: 'cairo',
          textAlign: 'justify',
          maxWidth: 'narrow',
          spacing: { desktop: { paddingTop: 'xl', paddingBottom: 'lg' }, tablet: { paddingTop: 'inherit' }, mobile: { paddingTop: 'sm' } },
          hideOnMobile: true,
          animation: 'fade',
          anchorId: 'intro',
          cssClass: 'custom-x',
        },
      },
    ])
    expect(html).toContain('id="intro"')
    expect(html).toContain('linear-gradient(90deg, var(--color-primary), #ff0000)')
    expect(html).toContain('color:var(--color-background)')
    expect(html).toContain("font-family:&#x27;Cairo&#x27;")
    expect(html).toContain('--pt-d:var(--space-xl)')
    expect(html).toContain('--pt-m:var(--space-sm)')
    expect(html).not.toContain('--pt-t')
    expect(html).toContain('hide-mobile')
    expect(html).toContain('custom-x')
    expect(html).toContain('container-narrow')
    expect(html).toContain('data-anim="fade"')
  })

  it('hides blocks outside their regions ("Show in regions")', () => {
    const promo = { ...sample.cta!, style: { showInRegions: [{ id: 2, code: 'tn' }] } }
    expect(render([promo], ctx())).toBe('')
    expect(render([promo], ctx({ region: { id: 2, code: 'tn' } as never }))).toContain('block-cta')
    expect(render([sample.cta!], ctx({ region: undefined }))).toContain('block-cta')
  })

  it('formats numbers for the region (Arabic-Indic digits, TND)', () => {
    const html = render([sample.stats!], ctx({ locale: 'ar-TN', dir: 'rtl', region: { id: 2, code: 'tn', currency: 'TND', numberFormat: 'arab' } as never }))
    expect(html).toMatch(/[٠-٩]/)
    expect(html).toContain('د.ت')
  })

  it('renders an uploaded video with its playback options', () => {
    const html = render([{ blockType: 'video', source: 'upload', video, autoplay: true, loop: true, muted: true, controls: false }])
    const tag = html.match(/<video[^>]*>/)?.[0] ?? ''
    expect(tag).toContain('src="/api/media/file/clip.mp4?prefix=media"')
    expect(tag).toContain('autoPlay=""')
    expect(tag).toContain('loop=""')
    expect(tag).toContain('playsInline=""')
    expect(tag).not.toContain('controls')
  })

  it('shows any image in the chosen shape (cover crops around the focal point, contain shows it whole)', () => {
    const square = render([{ blockType: 'image', image, imageRatio: '1/1', imageFit: 'cover' }])
    expect(square).toContain('class="media-frame" style="aspect-ratio:1/1"')
    expect(square).toContain('object-fit:cover')
    expect(square).toContain('object-position:30% 70%')
    const whole = render([{ blockType: 'image', image, imageRatio: '16/9', imageFit: 'contain' }])
    expect(whole).toContain('aspect-ratio:16/9')
    expect(whole).toContain('object-fit:contain')
    // "Original" keeps the uploaded proportions (no frame).
    expect(render([{ blockType: 'image', image, imageRatio: 'original' }])).not.toContain('media-frame')
    // Cards and gallery default to 16:10 and 4:3 for every image, whatever its size.
    expect(render([{ ...sample.cards!, cards: [{ title: 'Photo card', image }] }])).toContain('aspect-ratio:16/10')
    expect(render([sample.gallery!])).toContain('aspect-ratio:4/3')
  })

  it('ignores unknown block types', () => {
    expect(render([{ blockType: 'nope' }])).toBe('')
  })
})

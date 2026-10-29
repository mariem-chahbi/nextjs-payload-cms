import type { ComponentType } from 'react'

import { ButtonsComponent } from './Buttons/Component'
import { CardsComponent } from './Cards/Component'
import { ColumnsComponent } from './Columns/Component'
import { CTAComponent } from './CTA/Component'
import { FAQComponent } from './FAQ/Component'
import { FormComponent } from './Form/Component'
import { FreeLayoutComponent } from './FreeLayout/Component'
import { GalleryComponent } from './Gallery/Component'
import { HeroComponent } from './Hero/Component'
import { ImageComponent } from './Image/Component'
import { LogosComponent } from './Logos/Component'
import { MediaTextComponent } from './MediaText/Component'
import { RichTextComponent } from './RichText/Component'
import { SpacerComponent } from './Spacer/Component'
import { StatsComponent } from './Stats/Component'
import { TestimonialsComponent } from './Testimonials/Component'
import type { RenderContext } from './types'
import { VideoComponent } from './Video/Component'

type BlockComponent = ComponentType<{ block: never; ctx: RenderContext; index: number }>

/** blockType → component. `bleed`: the block manages its own width (full-bleed visuals). */
export const blockComponents: Record<string, { Component: BlockComponent; bleed?: boolean }> = {
  hero: { Component: HeroComponent as BlockComponent, bleed: true },
  richText: { Component: RichTextComponent as BlockComponent },
  columns: { Component: ColumnsComponent as BlockComponent },
  mediaText: { Component: MediaTextComponent as BlockComponent },
  image: { Component: ImageComponent as BlockComponent },
  video: { Component: VideoComponent as BlockComponent },
  gallery: { Component: GalleryComponent as BlockComponent },
  cards: { Component: CardsComponent as BlockComponent },
  buttons: { Component: ButtonsComponent as BlockComponent },
  stats: { Component: StatsComponent as BlockComponent },
  testimonials: { Component: TestimonialsComponent as BlockComponent },
  faq: { Component: FAQComponent as BlockComponent },
  logos: { Component: LogosComponent as BlockComponent },
  cta: { Component: CTAComponent as BlockComponent },
  form: { Component: FormComponent as BlockComponent },
  spacer: { Component: SpacerComponent as BlockComponent },
  freeLayout: { Component: FreeLayoutComponent as BlockComponent },
}

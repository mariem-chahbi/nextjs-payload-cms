import type { Block } from 'payload'

import { ButtonsBlock } from './Buttons/config'
import { CardsBlock } from './Cards/config'
import { columnsBlock } from './Columns/config'
import { CTABlock } from './CTA/config'
import { FAQBlock } from './FAQ/config'
import { FormBlock } from './Form/config'
import { FreeLayoutBlock } from './FreeLayout/config'
import { GalleryBlock } from './Gallery/config'
import { HeroBlock } from './Hero/config'
import { ImageBlock } from './Image/config'
import { LogosBlock } from './Logos/config'
import { MediaTextBlock } from './MediaText/config'
import { RichTextBlock } from './RichText/config'
import { SpacerBlock } from './Spacer/config'
import { StatsBlock } from './Stats/config'
import { TestimonialsBlock } from './Testimonials/config'
import { VideoBlock } from './Video/config'

/** Blocks allowed inside a column (no nested Columns, so the schema stays finite). */
export const nestedBlocks: Block[] = [
  RichTextBlock,
  ImageBlock,
  VideoBlock,
  MediaTextBlock,
  ButtonsBlock,
  CardsBlock,
  StatsBlock,
  TestimonialsBlock,
  FAQBlock,
  GalleryBlock,
  LogosBlock,
  CTABlock,
  FormBlock,
  SpacerBlock,
  FreeLayoutBlock,
]
/**
 * Every block of the page builder, in the order shown in the "Add block" drawer.
 * (Not Payload block references: in Postgres they break when the same block is used in both the
 * shared layout and the localized per-language layout.)
 */
export const layoutBlocks: Block[] = [
  HeroBlock,
  RichTextBlock,
  columnsBlock(nestedBlocks),
  MediaTextBlock,
  ImageBlock,
  VideoBlock,
  GalleryBlock,
  CardsBlock,
  ButtonsBlock,
  StatsBlock,
  TestimonialsBlock,
  FAQBlock,
  LogosBlock,
  CTABlock,
  FormBlock,
  SpacerBlock,
  FreeLayoutBlock,
]

export const BLOCK_SLUGS = layoutBlocks.map((block) => block.slug)

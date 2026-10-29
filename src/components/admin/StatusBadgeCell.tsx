'use client'

import { useTranslation } from '@payloadcms/ui'
import type { DefaultCellComponentProps } from 'payload'

import type { TranslationMeta } from '@/translation/statusTypes'

import { StatusBadges } from './shared'

/** List view cell: one badge per translation locale (missing / needs review / done). */
export function StatusBadgeCell({ cellData }: DefaultCellComponentProps) {
  const { i18n } = useTranslation()
  return <StatusBadges meta={cellData as TranslationMeta | null} lang={i18n.language} />
}

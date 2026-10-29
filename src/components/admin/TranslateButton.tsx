'use client'

import { useDocumentInfo, useLocale, useTranslation } from '@payloadcms/ui'

import { DEFAULT_LOCALE } from '@/i18n/locales'

import styles from './admin.module.css'
import { pick } from './shared'

/** "Translate" next to Save/Publish: opens the side-by-side Translation view for this document. */
export function TranslateButton() {
  const { id, collectionSlug, globalSlug } = useDocumentInfo()
  const { code } = useLocale()
  const { i18n } = useTranslation()
  if (!globalSlug && !id) return null
  const target = code && code !== DEFAULT_LOCALE ? code : 'ar'
  const href = globalSlug ? `/admin/translate/global/${globalSlug}?target=${target}` : `/admin/translate/collection/${collectionSlug}/${id}?target=${target}`
  return (
    <a href={href} className={styles.button} style={{ textDecoration: 'none', whiteSpace: 'nowrap' }}>
      🌐 {pick(i18n.language, 'Translate', 'ترجمة')}
    </a>
  )
}

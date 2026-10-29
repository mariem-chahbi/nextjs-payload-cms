import Link from 'next/link'
import type { ServerProps } from 'payload'

import styles from './admin.module.css'
import { pick } from './shared'

/** Extra links in the admin navigation, after the collections and globals. */
export function TranslationNavLinks({ i18n }: ServerProps) {
  // Only rendered inside the logged-in admin navigation.
  const lang = i18n?.language
  return (
    <nav className={styles.navLinks} aria-label={pick(lang, 'Translation tools', 'أدوات الترجمة')}>
      <strong className={styles.muted}>{pick(lang, 'Translation', 'الترجمة')}</strong>
      <Link href="/admin/ui-strings">{pick(lang, 'UI strings grid', 'جدول نصوص الواجهة')}</Link>
      <Link href="/admin/translation-tools">{pick(lang, 'Import / export', 'استيراد / تصدير')}</Link>
      <Link href="/admin/translation-progress">{pick(lang, 'Translation progress', 'تقدم الترجمة')}</Link>
    </nav>
  )
}

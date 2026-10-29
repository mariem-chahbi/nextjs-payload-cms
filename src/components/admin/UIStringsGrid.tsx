import { DefaultTemplate } from '@payloadcms/next/templates'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import type { AdminViewServerProps } from 'payload'

import { isContentManager } from '@/access/roles'

import styles from './admin.module.css'
import { pick } from './shared'
import { UIStringsGridClient } from './UIStringsGridClient'

/** /admin/ui-strings — every UI string key as a row, one column per locale, inline editing. */
export async function UIStringsView({ initPageResult, params, searchParams }: AdminViewServerProps) {
  const { req, permissions, locale, visibleEntities } = initPageResult
  const { payload, user, i18n } = req
  if (!user) redirect('/admin/login')
  const lang = i18n.language

  return (
    <DefaultTemplate
      i18n={i18n}
      locale={locale}
      params={params}
      payload={payload}
      permissions={permissions}
      searchParams={searchParams}
      user={user}
      visibleEntities={visibleEntities}
    >
      <div className={`gutter--left gutter--right ${styles.page}`}>
        <header className={styles.header}>
          <div>
            <h1>{pick(lang, 'UI strings', 'نصوص الواجهة')}</h1>
            <p className={styles.muted}>
              {pick(
                lang,
                'Grey text = inherited through the fallback chain (ar-TN → ar → en, en-TN → en). Edits save when you leave the cell.',
                'النص الرمادي = موروث عبر سلسلة البدائل (ar-TN → ar → en، en-TN → en). يُحفظ التعديل عند مغادرة الخانة.',
              )}
            </p>
          </div>
          <Link className={styles.button} href="/admin/collections/translations" style={{ textDecoration: 'none' }}>
            {pick(lang, 'List view', 'عرض القائمة')}
          </Link>
        </header>
        <UIStringsGridClient lang={lang} canCreate={isContentManager(user as never)} />
      </div>
    </DefaultTemplate>
  )
}

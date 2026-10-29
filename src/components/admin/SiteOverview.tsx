import Link from 'next/link'
import type { Payload } from 'payload'

import { getLocaleDefinition, type LocaleCode } from '@/i18n/locales'
import { getActiveRegionLocales } from '@/utilities/activeLocales'
import type { ContentState, SiteGlobal } from '@/utilities/siteOverview'
import { getSiteOverview } from '@/utilities/siteOverviewCache'

import styles from './admin.module.css'
import { pick, timeAgo } from './shared'

const GLOBAL_LABELS: Record<SiteGlobal, [string, string]> = {
  'site-settings': ['Site settings', 'إعدادات الموقع'],
  header: ['Header', 'الترويسة'],
  footer: ['Footer', 'التذييل'],
  theme: ['Theme', 'السمة'],
}

const STATE: Record<ContentState, { className: string; label: [string, string] }> = {
  published: { className: 'badge-done', label: ['published', 'منشورة'] },
  changed: { className: 'badge-needs-review', label: ['unpublished changes', 'تعديلات غير منشورة'] },
  draft: { className: 'badge-inherited', label: ['draft', 'مسودة'] },
}

const PAGE_ROWS = 8

function StateBadge({ state, lang }: { state: ContentState; lang?: string }) {
  return <span className={`${styles.badge} ${styles[STATE[state].className]}`}>{pick(lang, ...STATE[state].label)}</span>
}

type Props = { payload: Payload; lang?: string; canEdit: boolean; fresh?: boolean; refreshHref: string }

/** Content dashboard: quick actions, site numbers, pages that need attention and the latest edits. */
export async function SiteOverview({ payload, lang, canEdit, fresh = false, refreshHref }: Props) {
  // Titles and URLs in the admin language (Arabic falls back to English where untranslated).
  const locale: LocaleCode = lang === 'ar' ? 'ar' : 'en'
  const [overview, siteLocales] = await Promise.all([getSiteOverview(payload, locale, { fresh }), getActiveRegionLocales(payload)])
  const { counts } = overview
  const pageURL = (page: { id: number | string; path: string }, code: string) =>
    String(page.id) === String(overview.homePageId) ? `/${code}` : page.path ? `/${code}/${page.path}` : null

  return (
    <section className={styles.section}>
      <div className={styles.sectionHeader}>
        <h2>{pick(lang, 'Your site', 'موقعك')}</h2>
        <span className={styles.muted}>
          {pick(lang, 'Updated', 'آخر تحديث')} {timeAgo(overview.generatedAt, lang)} ·{' '}
          <Link href={refreshHref}>{pick(lang, 'Refresh', 'تحديث')}</Link>
        </span>
      </div>

      <div className={styles.actions}>
        {canEdit ? (
          <>
            <Link className={`${styles.button} ${styles.primary}`} href="/admin/collections/pages/create">
              + {pick(lang, 'New page', 'صفحة جديدة')}
            </Link>
            {overview.homePageId ? (
              <Link className={styles.button} href={`/admin/collections/pages/${overview.homePageId}`}>
                {pick(lang, 'Edit home page', 'تحرير الصفحة الرئيسية')}
              </Link>
            ) : null}
            {overview.globals.map((g) => (
              <Link key={g.slug} className={styles.button} href={`/admin/globals/${g.slug}`}>
                {pick(lang, ...GLOBAL_LABELS[g.slug])}
              </Link>
            ))}
            <Link className={styles.button} href="/admin/collections/media/create">
              {pick(lang, 'Upload media', 'رفع وسائط')}
            </Link>
          </>
        ) : (
          <>
            <Link className={`${styles.button} ${styles.primary}`} href="/admin/translation-tools">
              {pick(lang, 'Import / export translations', 'استيراد / تصدير الترجمات')}
            </Link>
            <Link className={styles.button} href="/admin/ui-strings">
              {pick(lang, 'UI strings grid', 'جدول نصوص الواجهة')}
            </Link>
          </>
        )}
        <span className={styles.actionsSite}>
          <span className={styles.muted}>{pick(lang, 'Open the site:', 'فتح الموقع:')}</span>
          {siteLocales.map((code) => (
            <a key={code} className={styles.chip} href={`/${code}`} target="_blank" rel="noopener noreferrer">
              {pick(lang, getLocaleDefinition(code as LocaleCode).label, getLocaleDefinition(code as LocaleCode).nativeLabel)} ↗
            </a>
          ))}
        </span>
      </div>

      <div className={styles.stats}>
        <Link className={styles.stat} href="/admin/collections/pages">
          <span className={styles.statValue}>{counts.pages}</span>
          <span>{pick(lang, 'Pages', 'الصفحات')}</span>
          <span className={styles.muted}>
            {counts.published} {pick(lang, 'published', 'منشورة')} · {counts.drafts} {pick(lang, 'drafts', 'مسودات')} · {counts.changed}{' '}
            {pick(lang, 'with unpublished changes', 'بتعديلات غير منشورة')}
          </span>
        </Link>
        <Link className={styles.stat} href="/admin/collections/media">
          <span className={styles.statValue}>{counts.media}</span>
          <span>{pick(lang, 'Media files', 'ملفات الوسائط')}</span>
          <span className={styles.muted}>{pick(lang, 'Images, videos, logos', 'صور، فيديو، شعارات')}</span>
        </Link>
        <Link className={styles.stat} href="/admin/collections/documents">
          <span className={styles.statValue}>{counts.documents}</span>
          <span>{pick(lang, 'Private documents', 'مستندات خاصة')}</span>
          <span className={styles.muted}>{pick(lang, 'Signed download links', 'روابط تنزيل موقّعة')}</span>
        </Link>
        <Link className={styles.stat} href="/admin/collections/form-submissions">
          <span className={styles.statValue}>{counts.submissions}</span>
          <span>{pick(lang, 'Form submissions', 'إرسالات النماذج')}</span>
          <span className={styles.muted}>
            {overview.latestSubmissionAt
              ? `${pick(lang, 'Latest', 'الأحدث')} ${timeAgo(overview.latestSubmissionAt, lang)}`
              : pick(lang, 'None yet', 'لا يوجد بعد')}
          </span>
        </Link>
      </div>

      <div className={styles.columns}>
        <div>
          <h3>{pick(lang, 'Pages', 'الصفحات')}</h3>
          {overview.pages.length ? (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>{pick(lang, 'Page', 'الصفحة')}</th>
                  <th>{pick(lang, 'Status', 'الحالة')}</th>
                  <th>{pick(lang, 'Edited', 'آخر تعديل')}</th>
                  <th aria-label={pick(lang, 'Actions', 'إجراءات')} />
                </tr>
              </thead>
              <tbody>
                {overview.pages.slice(0, PAGE_ROWS).map((page) => {
                  const url = pageURL(page, locale)
                  return (
                    <tr key={page.id}>
                      <td>
                        <Link href={`/admin/collections/pages/${page.id}`}>{page.title}</Link>
                        <div className={styles.muted} dir="ltr">
                          {String(page.id) === String(overview.homePageId) ? pick(lang, 'Home page', 'الصفحة الرئيسية') : `/${page.path}`}
                        </div>
                      </td>
                      <td>
                        <StateBadge state={page.state} lang={lang} />
                      </td>
                      <td className={styles.muted}>{timeAgo(page.updatedAt, lang)}</td>
                      <td>
                        {url && page.state !== 'draft' ? (
                          <a href={url} target="_blank" rel="noopener noreferrer">
                            {pick(lang, 'View ↗', 'عرض ↗')}
                          </a>
                        ) : null}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          ) : (
            <p className={styles.notice}>{pick(lang, 'No pages yet.', 'لا توجد صفحات بعد.')}</p>
          )}
          {overview.pages.length > PAGE_ROWS ? (
            <Link href="/admin/collections/pages">
              {pick(lang, `All ${overview.pages.length} pages →`, `كل الصفحات (${overview.pages.length}) ←`)}
            </Link>
          ) : null}
        </div>

        <div>
          <h3>{pick(lang, 'Recently edited', 'آخر التعديلات')}</h3>
          <ul className={styles.recent}>
            {overview.recent.map((edit) => (
              <li key={edit.kind === 'page' ? `page-${edit.id}` : edit.slug}>
                <Link href={edit.kind === 'page' ? `/admin/collections/pages/${edit.id}` : `/admin/globals/${edit.slug}`}>
                  {edit.kind === 'page' ? edit.title : pick(lang, ...GLOBAL_LABELS[edit.slug])}
                </Link>
                <span className={styles.muted}>
                  {edit.kind === 'page' ? pick(lang, 'Page', 'صفحة') : pick(lang, 'Site', 'الموقع')} · {timeAgo(edit.updatedAt, lang)}
                </span>
                {edit.state !== 'published' ? <StateBadge state={edit.state} lang={lang} /> : null}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}

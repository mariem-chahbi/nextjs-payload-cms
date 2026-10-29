import { DefaultTemplate } from '@payloadcms/next/templates'
import { redirect } from 'next/navigation'
import type { AdminViewServerProps, CollectionSlug, GlobalSlug } from 'payload'

import { DEFAULT_LOCALE, getDirection, getLanguage, isLocale, LOCALES, type LocaleCode } from '@/i18n/locales'
import { entityKey, type EntityRef } from '@/translation/entities'
import { defaultSourceFor, getTranslationRows } from '@/translation/service'

import styles from './admin.module.css'
import { pick, StatusBadges } from './shared'
import { TranslationEditor } from './TranslationEditor'

/** /admin/translate/collection/pages/12?target=ar  —  /admin/translate/global/header?target=ar-TN */
const parseRef = (segments: string[]): EntityRef | undefined => {
  const [, kind, slug, id] = segments
  if (kind === 'global' && slug) return { kind, slug: slug as GlobalSlug }
  if (kind === 'collection' && slug && id) return { kind, slug: slug as CollectionSlug, id }
  return undefined
}

/**
 * Side-by-side translation of every localized field: source | target (RTL for Arabic), with
 * missing and inherited ("inherited from ar") fields marked, inline edit, auto-translate, status.
 */
export async function TranslationView({
  initPageResult,
  params,
  searchParams,
}: AdminViewServerProps) {
  const { req, permissions, locale, visibleEntities } = initPageResult
  const { payload, user, i18n } = req
  if (!user) redirect('/admin/login')
  const lang = i18n.language

  const segments = (params?.segments as string[] | undefined) ?? []
  const ref = parseRef(segments)
  const rawTarget = typeof searchParams?.target === 'string' ? searchParams.target : 'ar'
  const target: LocaleCode = isLocale(rawTarget) ? rawTarget : 'ar'
  const rawSource = typeof searchParams?.source === 'string' ? searchParams.source : undefined
  const source: LocaleCode =
    isLocale(rawSource) && rawSource !== target ? rawSource : defaultSourceFor(target)

  // Load first, render after: errors in data loading show as a message.
  let data: Awaited<ReturnType<typeof getTranslationRows>> | undefined
  let loadError: string | undefined
  if (!ref) loadError = pick(lang, 'Unknown document.', 'مستند غير معروف.')
  else {
    try {
      data = await getTranslationRows(payload, req, ref, source, target)
    } catch (error) {
      loadError = (error as Error).message
    }
  }

  let content: React.ReactNode
  if (!ref || !data) {
    content = <p className={`${styles.notice} ${styles.error}`}>{loadError}</p>
  } else {
    const { rows, meta, title } = data
    const editURL =
      ref.kind === 'global'
        ? `/admin/globals/${ref.slug}`
        : `/admin/collections/${ref.slug}/${ref.id}`
    const base =
      ref.kind === 'global'
        ? `/admin/translate/global/${ref.slug}`
        : `/admin/translate/collection/${ref.slug}/${ref.id}`
    {
      content = (
        <>
          <header className={styles.header}>
            <div>
              <p className={styles.muted}>
                <a href={editURL}>← {pick(lang, 'Back to the editor', 'العودة إلى المحرر')}</a>
              </p>
              <h1>
                {pick(lang, 'Translate', 'ترجمة')}: {title}
              </h1>
              <StatusBadges meta={meta} lang={lang} />
            </div>
            <form className={styles.toolbar} method="get" action={base}>
              <label>
                {pick(lang, 'From', 'من')}{' '}
                <select className={styles.select} name="source" defaultValue={source}>
                  {LOCALES.map((l) => (
                    <option key={l.code} value={l.code}>
                      {l.nativeLabel} ({l.code})
                    </option>
                  ))}
                </select>
              </label>
              <label>
                {pick(lang, 'To', 'إلى')}{' '}
                <select className={styles.select} name="target" defaultValue={target}>
                  {LOCALES.map((l) => (
                    <option key={l.code} value={l.code}>
                      {l.nativeLabel} ({l.code})
                    </option>
                  ))}
                </select>
              </label>
              <button className={styles.button} type="submit">
                {pick(lang, 'Show', 'عرض')}
              </button>
            </form>
          </header>
          <TranslationEditor
            entity={entityKey(ref)}
            rows={rows}
            source={source}
            target={target}
            targetDir={getDirection(target)}
            sourceDir={getDirection(source)}
            status={meta?.locales?.[target]?.status ?? 'missing'}
            canAutoTranslate={getLanguage(source) !== getLanguage(target)}
            isDefaultTarget={target === DEFAULT_LOCALE}
            lang={lang}
          />
        </>
      )
    }
  }

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
      <div className={`gutter--left gutter--right ${styles.page}`}>{content}</div>
    </DefaultTemplate>
  )
}

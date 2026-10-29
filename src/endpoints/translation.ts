import type { Endpoint, PayloadRequest } from 'payload'

import { canAccessAdminPanel } from '@/access/roles'
import { isLocale, isRTL, type LocaleCode } from '@/i18n/locales'
import { toCSV, parseCSV } from '@/translation/csv'
import { parseEntityKey } from '@/translation/entities'
import { EXPORT_HEADERS, exportFileName } from '@/translation/exchange'
import { getTranslationProgress } from '@/translation/progressCache'
import { autoTranslateEntity, defaultSourceFor, exportLocale, importLocale, saveTranslationValues } from '@/translation/service'
import { TRANSLATION_STATUSES, type TranslationStatus } from '@/translation/status'
import { parseXLSX, toXLSX } from '@/translation/xlsx'

/**
 * Translation tools API (admin panel users only; every write runs with the user's own access,
 * so translator rules and the structure guard apply).
 *   POST /api/translation/auto     { entity, from, to, overwrite? }
 *   POST /api/translation/save     { entity, locale, values: {path: value}, status?, publish? }
 *   GET  /api/translation/export?locale=ar&format=csv|xlsx|json&missingOnly=1
 *   POST /api/translation/import   multipart: file, locale, publish?
 *   GET  /api/translation/progress
 */
const fail = (status: number, error: string) => Response.json({ error }, { status })

const guard = (req: PayloadRequest) => (canAccessAdminPanel({ req }) ? undefined : fail(403, 'Admin panel users only.'))

const readJSON = async (req: PayloadRequest): Promise<Record<string, unknown>> => {
  try {
    return (await req.json?.()) ?? {}
  } catch {
    return {}
  }
}

const asLocale = (value: unknown): LocaleCode | undefined => (isLocale(value) ? value : undefined)

export const translationEndpoints: Endpoint[] = [
  {
    path: '/translation/auto',
    method: 'post',
    handler: async (req) => {
      const denied = guard(req)
      if (denied) return denied
      const body = await readJSON(req)
      const ref = parseEntityKey(String(body.entity ?? ''))
      const from = asLocale(body.from)
      const to = asLocale(body.to)
      if (!ref || !from || !to) return fail(400, 'Expected { entity, from, to }.')
      try {
        return Response.json(await autoTranslateEntity({ payload: req.payload, req, ref, from, to, overwrite: Boolean(body.overwrite) }))
      } catch (error) {
        return fail(422, (error as Error).message)
      }
    },
  },
  {
    path: '/translation/save',
    method: 'post',
    handler: async (req) => {
      const denied = guard(req)
      if (denied) return denied
      const body = await readJSON(req)
      const ref = parseEntityKey(String(body.entity ?? ''))
      const locale = asLocale(body.locale)
      const status = TRANSLATION_STATUSES.includes(body.status as TranslationStatus) ? (body.status as TranslationStatus) : undefined
      if (!ref || !locale || typeof body.values !== 'object' || body.values === null) return fail(400, 'Expected { entity, locale, values }.')
      try {
        await saveTranslationValues({ payload: req.payload, req, ref, locale, values: body.values as Record<string, unknown>, status, publish: Boolean(body.publish) })
        return Response.json({ ok: true })
      } catch (error) {
        return fail(422, (error as Error).message)
      }
    },
  },
  {
    path: '/translation/export',
    method: 'get',
    handler: async (req) => {
      const denied = guard(req)
      if (denied) return denied
      const params = new URL(req.url ?? 'http://x').searchParams
      const locale = asLocale(params.get('locale'))
      const format = params.get('format') ?? 'csv'
      const missingOnly = params.get('missingOnly') === '1'
      if (!locale || !['csv', 'xlsx', 'json'].includes(format)) return fail(400, 'Expected ?locale=<code>&format=csv|xlsx|json')

      const rows = await exportLocale(req.payload, req, locale, missingOnly)
      const filename = exportFileName(locale, format, missingOnly)
      const disposition = `attachment; filename="${filename}"`
      if (format === 'json') {
        const body = JSON.stringify({ locale, source: defaultSourceFor(locale), exportedAt: new Date().toISOString(), rows }, null, 2)
        return new Response(body, { headers: { 'Content-Type': 'application/json; charset=utf-8', 'Content-Disposition': disposition } })
      }
      if (format === 'xlsx') {
        const buffer = await toXLSX(rows, { rtlTarget: isRTL(locale), sheetName: locale })
        return new Response(new Uint8Array(buffer), {
          headers: { 'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'Content-Disposition': disposition },
        })
      }
      return new Response(toCSV([...EXPORT_HEADERS], rows), { headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': disposition } })
    },
  },
  {
    path: '/translation/import',
    method: 'post',
    handler: async (req) => {
      const denied = guard(req)
      if (denied) return denied
      const form = await req.formData?.()
      const file = form?.get('file')
      const locale = asLocale(form?.get('locale'))
      if (!locale || !file || typeof file === 'string') return fail(400, 'Send a file and a locale.')
      const name = file.name.toLowerCase()

      let rows: Record<string, string>[]
      try {
        if (name.endsWith('.xlsx')) rows = await parseXLSX(await file.arrayBuffer())
        else if (name.endsWith('.json')) {
          const parsed = JSON.parse(await file.text()) as { rows?: Record<string, string>[]; locale?: string } | Record<string, string>[]
          rows = Array.isArray(parsed) ? parsed : (parsed.rows ?? [])
        } else rows = parseCSV(await file.text())
      } catch (error) {
        return fail(400, `Could not read the file: ${(error as Error).message}`)
      }
      if (rows.length === 0 || !('key' in rows[0]!) || !('target' in rows[0]!)) {
        return fail(400, 'The file needs "key" and "target" columns (use an exported file).')
      }
      return Response.json(await importLocale({ payload: req.payload, req, target: locale, rows, publish: form?.get('publish') === '1' }))
    },
  },
  {
    path: '/translation/progress',
    method: 'get',
    handler: async (req) => {
      const denied = guard(req)
      if (denied) return denied
      const fresh = new URL(req.url ?? 'http://x').searchParams.get('fresh') === '1'
      return Response.json(await getTranslationProgress(req.payload, { fresh }))
    },
  },
]

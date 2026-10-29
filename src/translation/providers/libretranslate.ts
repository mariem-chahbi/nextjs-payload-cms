import { TranslationProviderError, type TranslationProvider } from './types'

/** LibreTranslate running locally in Docker (free, offline). POST /translate with an array of texts. */
export const libreTranslateProvider = (baseURL: string, fetchImpl: typeof fetch = fetch): TranslationProvider => ({
  name: 'libretranslate',
  translate: async (texts, from, to) => {
    if (texts.length === 0) return []
    let res: Response
    try {
      res = await fetchImpl(`${baseURL.replace(/\/+$/, '')}/translate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ q: texts, source: from, target: to, format: 'text' }),
        signal: AbortSignal.timeout(120_000),
      })
    } catch (error) {
      throw new TranslationProviderError('LibreTranslate', `not reachable at ${baseURL} (${(error as Error).message}). Is the container running?`)
    }
    if (!res.ok) {
      throw new TranslationProviderError('LibreTranslate', `HTTP ${res.status} ${await res.text().catch(() => '')}`.trim())
    }
    const body = (await res.json()) as { translatedText?: string | string[] }
    const out = Array.isArray(body.translatedText) ? body.translatedText : [body.translatedText ?? '']
    if (out.length !== texts.length) throw new TranslationProviderError('LibreTranslate', 'unexpected response length')
    return out
  },
})

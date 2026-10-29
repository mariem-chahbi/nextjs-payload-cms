import { TranslationProviderError, type TranslationProvider } from './types'

/** DeepL (optional, only when DEEPL_API_KEY is set). Free keys end with ":fx" and use api-free. */
export const deeplProvider = (apiKey: string, fetchImpl: typeof fetch = fetch): TranslationProvider => ({
  name: 'deepl',
  translate: async (texts, from, to) => {
    if (texts.length === 0) return []
    const host = apiKey.endsWith(':fx') ? 'https://api-free.deepl.com' : 'https://api.deepl.com'
    const res = await fetchImpl(`${host}/v2/translate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `DeepL-Auth-Key ${apiKey}` },
      body: JSON.stringify({ text: texts, source_lang: from.toUpperCase(), target_lang: to === 'en' ? 'EN-US' : to.toUpperCase() }),
      signal: AbortSignal.timeout(60_000),
    })
    if (!res.ok) throw new TranslationProviderError('DeepL', `HTTP ${res.status}`)
    const body = (await res.json()) as { translations?: { text: string }[] }
    return (body.translations ?? []).map((t) => t.text)
  },
})

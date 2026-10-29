import { getEnv } from '@/env'

import { deeplProvider } from './deepl'
import { libreTranslateProvider } from './libretranslate'
import type { TranslationProvider } from './types'

export type { ProviderLanguage, TranslationProvider } from './types'

/** Provider from TRANSLATE_PROVIDER: LibreTranslate (default, local) or DeepL (needs DEEPL_API_KEY). */
export const getTranslationProvider = (): TranslationProvider => {
  const env = getEnv()
  if (env.TRANSLATE_PROVIDER === 'deepl' && env.DEEPL_API_KEY) return deeplProvider(env.DEEPL_API_KEY)
  return libreTranslateProvider(env.LIBRETRANSLATE_URL)
}

export type ProviderLanguage = 'en' | 'ar'

/** A machine-translation backend. Batches keep order: output[i] translates input[i]. */
export type TranslationProvider = {
  name: string
  translate: (texts: string[], from: ProviderLanguage, to: ProviderLanguage) => Promise<string[]>
}

export class TranslationProviderError extends Error {
  constructor(provider: string, message: string) {
    super(`${provider}: ${message}`)
    this.name = 'TranslationProviderError'
  }
}

/**
 * Allowed Google fonts. No package imports: used by the Theme global (options), the layout
 * (<link> builder) and ThemeStyle (CSS variables).
 *
 * `weights` lists only weights the family actually has, because Google Fonts rejects the whole
 * request when one requested weight does not exist.
 */
export type FontDefinition = {
  value: string
  label: string
  family: string
  weights: number[]
  fallback: string
}

const SANS = 'system-ui, -apple-system, "Segoe UI", sans-serif'
const SERIF = 'Georgia, "Times New Roman", serif'
const ARABIC_SANS = '"Segoe UI", Tahoma, "Noto Sans Arabic", sans-serif'
const ARABIC_SERIF = '"Times New Roman", "Noto Naskh Arabic", serif'

export const LATIN_FONTS: FontDefinition[] = [
  { value: 'inter', label: 'Inter', family: 'Inter', weights: [400, 500, 600, 700], fallback: SANS },
  { value: 'poppins', label: 'Poppins', family: 'Poppins', weights: [400, 500, 600, 700], fallback: SANS },
  { value: 'roboto', label: 'Roboto', family: 'Roboto', weights: [400, 500, 700], fallback: SANS },
  { value: 'montserrat', label: 'Montserrat', family: 'Montserrat', weights: [400, 500, 600, 700], fallback: SANS },
  { value: 'open-sans', label: 'Open Sans', family: 'Open Sans', weights: [400, 600, 700], fallback: SANS },
  { value: 'playfair-display', label: 'Playfair Display', family: 'Playfair Display', weights: [400, 600, 700], fallback: SERIF },
  { value: 'merriweather', label: 'Merriweather', family: 'Merriweather', weights: [400, 700], fallback: SERIF },
  { value: 'lora', label: 'Lora', family: 'Lora', weights: [400, 500, 600, 700], fallback: SERIF },
]

/** Every Arabic choice has Arabic glyphs (most also include Latin). */
export const ARABIC_FONTS: FontDefinition[] = [
  { value: 'cairo', label: 'Cairo', family: 'Cairo', weights: [400, 500, 600, 700], fallback: ARABIC_SANS },
  { value: 'tajawal', label: 'Tajawal', family: 'Tajawal', weights: [400, 500, 700], fallback: ARABIC_SANS },
  { value: 'noto-kufi-arabic', label: 'Noto Kufi Arabic', family: 'Noto Kufi Arabic', weights: [400, 500, 600, 700], fallback: ARABIC_SANS },
  { value: 'almarai', label: 'Almarai', family: 'Almarai', weights: [400, 700], fallback: ARABIC_SANS },
  { value: 'ibm-plex-sans-arabic', label: 'IBM Plex Sans Arabic', family: 'IBM Plex Sans Arabic', weights: [400, 500, 600, 700], fallback: ARABIC_SANS },
  { value: 'readex-pro', label: 'Readex Pro', family: 'Readex Pro', weights: [400, 500, 600, 700], fallback: ARABIC_SANS },
  { value: 'noto-naskh-arabic', label: 'Noto Naskh Arabic', family: 'Noto Naskh Arabic', weights: [400, 500, 600, 700], fallback: ARABIC_SERIF },
  { value: 'amiri', label: 'Amiri', family: 'Amiri', weights: [400, 700], fallback: ARABIC_SERIF },
]

export const ALL_FONTS: FontDefinition[] = [...LATIN_FONTS, ...ARABIC_FONTS]

export const DEFAULT_FONTS = {
  latinHeading: 'playfair-display',
  latinBody: 'inter',
  arabicHeading: 'cairo',
  arabicBody: 'tajawal',
} as const

export const findFont = (value: string | null | undefined): FontDefinition | undefined =>
  ALL_FONTS.find((font) => font.value === value)

export const fontOptions = (fonts: FontDefinition[]) => fonts.map(({ value, label }) => ({ value, label }))

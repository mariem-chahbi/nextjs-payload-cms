/** URL-safe slug that keeps Arabic (and any other) letters: "من نحن؟" → "من-نحن", "About Us" → "about-us". */
export const slugify = (value: string): string =>
  value
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[ً-ٰٟ]/g, '') // Arabic diacritics (tashkeel)
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '')

/** Joins a parent path and a slug: ('company', 'team') → 'company/team'. */
export const joinPath = (parentPath: string | null | undefined, slug: string): string =>
  [parentPath?.replace(/^\/+|\/+$/g, ''), slug].filter(Boolean).join('/')

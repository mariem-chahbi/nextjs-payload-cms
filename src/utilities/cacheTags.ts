/** Cache tags shared by the data layer (readers) and the revalidation hooks (writers). */
export const TAGS = {
  pages: 'pages',
  regions: 'regions',
  translations: 'translations',
  forms: 'forms',
  media: 'media',
  global: (slug: string) => `global:${slug}`,
} as const

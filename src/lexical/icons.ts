/**
 * Small built-in icon set (24×24 stroke icons, Lucide-style). No package imports.
 * `mirror: true` icons flip horizontally in RTL (arrows); symbols like stars never flip.
 */
export type IconDefinition = { label: string; paths: string[]; mirror?: boolean }

export const ICONS = {
  'arrow-right': { label: 'Arrow', paths: ['M5 12h14', 'm12 5 7 7-7 7'], mirror: true },
  'chevron-right': { label: 'Chevron', paths: ['m9 18 6-6-6-6'], mirror: true },
  check: { label: 'Check', paths: ['M20 6 9 17l-5-5'] },
  x: { label: 'Close', paths: ['M18 6 6 18', 'm6 6 12 12'] },
  star: { label: 'Star', paths: ['m12 2 3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z'] },
  heart: { label: 'Heart', paths: ['M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z'] },
  phone: { label: 'Phone', paths: ['M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z'] },
  mail: { label: 'Mail', paths: ['M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z', 'm22 6-10 7L2 6'] },
  globe: { label: 'Globe', paths: ['M12 2a10 10 0 1 0 0 20 10 10 0 1 0 0-20z', 'M2 12h20', 'M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z'] },
  info: { label: 'Info', paths: ['M12 2a10 10 0 1 0 0 20 10 10 0 1 0 0-20z', 'M12 16v-4', 'M12 8h.01'] },
  play: { label: 'Play', paths: ['m6 3 14 9-14 9V3z'] },
  download: { label: 'Download', paths: ['M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4', 'm7 10 5 5 5-5', 'M12 15V3'] },
  calendar: { label: 'Calendar', paths: ['M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z', 'M16 2v4', 'M8 2v4', 'M3 10h18'] },
  'map-pin': { label: 'Location', paths: ['M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z', 'M12 7a3 3 0 1 0 0 6 3 3 0 1 0 0-6z'] },
  sparkles: { label: 'Sparkles', paths: ['m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3z'] },
  shield: { label: 'Shield', paths: ['M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z'] },
} satisfies Record<string, IconDefinition>

export type IconName = keyof typeof ICONS

export const ICON_OPTIONS = (Object.entries(ICONS) as [IconName, IconDefinition][]).map(([value, def]) => ({
  value,
  label: def.label,
}))

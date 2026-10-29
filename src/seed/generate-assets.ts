/**
 * Generates the sample files in seed-assets/ (run once; the output is kept in the repo so
 * `pnpm seed` needs neither ffmpeg nor network). Re-run with: pnpm seed:assets
 *   - images: abstract SVG artwork rendered to JPG/PNG/WebP with sharp
 *   - logos: SVG wordmarks
 *   - video: 5-second MP4 rendered with ffmpeg (lavfi), plus its poster frame
 */
import { execFileSync } from 'child_process'
import { mkdirSync, writeFileSync } from 'fs'
import path from 'path'
import sharp from 'sharp'

const out = path.resolve(process.cwd(), 'seed-assets')
mkdirSync(out, { recursive: true })

type Palette = [string, string, string]

const artwork = (w: number, h: number, [a, b, c]: Palette, seed: number) => {
  const circles = Array.from({ length: 7 }, (_, i) => {
    const x = ((seed * 97 + i * 211) % 100) / 100
    const y = ((seed * 61 + i * 137) % 100) / 100
    const r = 0.08 + (((seed + i) * 53) % 30) / 100
    return `<circle cx="${(x * w).toFixed(0)}" cy="${(y * h).toFixed(0)}" r="${(r * Math.min(w, h)).toFixed(0)}" fill="${i % 2 ? b : c}" fill-opacity="0.35"/>`
  }).join('')
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
      <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs>
      <rect width="100%" height="100%" fill="url(#g)"/>${circles}
      <path d="M0 ${h * 0.78} Q ${w * 0.3} ${h * 0.62} ${w * 0.55} ${h * 0.8} T ${w} ${h * 0.72} V ${h} H 0 Z" fill="${c}" fill-opacity="0.45"/>
    </svg>`,
  )
}

const images: { name: string; w: number; h: number; palette: Palette; seed: number; format: 'jpg' | 'png' | 'webp' }[] = [
  { name: 'hero', w: 1920, h: 1080, palette: ['#1d4ed8', '#0f766e', '#f59e0b'], seed: 1, format: 'jpg' },
  { name: 'hero-tunisia', w: 1920, h: 1080, palette: ['#b91c1c', '#f97316', '#fde68a'], seed: 7, format: 'jpg' },
  { name: 'feature-1', w: 1200, h: 800, palette: ['#0ea5e9', '#6366f1', '#a7f3d0'], seed: 3, format: 'jpg' },
  { name: 'feature-2', w: 1200, h: 800, palette: ['#14b8a6', '#065f46', '#fef3c7'], seed: 5, format: 'webp' },
  { name: 'feature-3', w: 1200, h: 800, palette: ['#9333ea', '#db2777', '#fde68a'], seed: 9, format: 'png' },
  { name: 'gallery-1', w: 1200, h: 900, palette: ['#f97316', '#be123c', '#fef9c3'], seed: 11, format: 'jpg' },
  { name: 'gallery-2', w: 1200, h: 900, palette: ['#0f766e', '#1e3a8a', '#99f6e4'], seed: 13, format: 'jpg' },
  { name: 'gallery-3', w: 1200, h: 900, palette: ['#4338ca', '#0ea5e9', '#e0e7ff'], seed: 17, format: 'jpg' },
  { name: 'gallery-4', w: 1200, h: 900, palette: ['#15803d', '#ca8a04', '#fef08a'], seed: 19, format: 'jpg' },
  { name: 'avatar-1', w: 400, h: 400, palette: ['#fbbf24', '#f97316', '#fff7ed'], seed: 23, format: 'jpg' },
  { name: 'avatar-2', w: 400, h: 400, palette: ['#38bdf8', '#2563eb', '#eff6ff'], seed: 29, format: 'jpg' },
  { name: 'avatar-3', w: 400, h: 400, palette: ['#a78bfa', '#7c3aed', '#f5f3ff'], seed: 31, format: 'jpg' },
  { name: 'social', w: 1200, h: 630, palette: ['#111827', '#1d4ed8', '#f59e0b'], seed: 37, format: 'jpg' },
]

const run = async () => {
  for (const img of images) {
    const pipeline = sharp(artwork(img.w, img.h, img.palette, img.seed))
    const file = path.join(out, `${img.name}.${img.format}`)
    if (img.format === 'jpg') await pipeline.jpeg({ quality: 82, mozjpeg: true }).toFile(file)
    else if (img.format === 'png') await pipeline.png({ compressionLevel: 9 }).toFile(file)
    else await pipeline.webp({ quality: 80 }).toFile(file)
  }

  // Logo + favicon
  writeFileSync(
    path.join(out, 'logo.svg'),
    `<svg xmlns="http://www.w3.org/2000/svg" width="220" height="48" viewBox="0 0 220 48"><rect x="0" y="6" width="36" height="36" rx="10" fill="#1d4ed8"/><path d="M11 33V15h9a6 6 0 0 1 0 12h-9" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round"/><text x="46" y="32" font-family="Verdana, sans-serif" font-size="20" font-weight="700" fill="#111827">playground</text></svg>`,
  )
  await sharp(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><rect width="64" height="64" rx="16" fill="#1d4ed8"/><path d="M20 48V16h14a10 10 0 0 1 0 20H20" fill="none" stroke="#fff" stroke-width="7" stroke-linecap="round"/></svg>`))
    .png()
    .toFile(path.join(out, 'favicon.png'))

  // Partner logos for the logos strip
  ;['Acme', 'Globex', 'Initech', 'Umbrella', 'Hooli'].forEach((name, i) => {
    const hue = (i * 67) % 360
    writeFileSync(
      path.join(out, `partner-${i + 1}.svg`),
      `<svg xmlns="http://www.w3.org/2000/svg" width="180" height="48" viewBox="0 0 180 48"><circle cx="22" cy="24" r="14" fill="hsl(${hue} 70% 45%)"/><text x="44" y="31" font-family="Verdana, sans-serif" font-size="20" font-weight="700" fill="#1f2937">${name}</text></svg>`,
    )
  })

  // 5-second video (H.264, faststart) and its poster frame
  const video = path.join(out, 'intro.mp4')
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'lavfi', '-i', 'mandelbrot=s=960x540:rate=25', '-t', '5', '-pix_fmt', 'yuv420p', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '30', '-movflags', '+faststart', video])
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-ss', '2', '-i', video, '-frames:v', '1', '-q:v', '4', path.join(out, 'intro-poster.jpg')])

  console.log(`Seed assets written to ${out}`)
}

await run()

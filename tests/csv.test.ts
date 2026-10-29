import ExcelJS from 'exceljs'
import { describe, expect, it } from 'vitest'

import { parseCSV, toCSV, UTF8_BOM } from '@/translation/csv'
import { applyImportRows, buildExportRows, EXPORT_HEADERS, parseRowKey } from '@/translation/exchange'
import { extractTextSegments } from '@/translation/lexical'
import { parseXLSX, toXLSX } from '@/translation/xlsx'

import { pageArEmpty, pageEn, pageFields, richEn } from './translation-fixtures'

const ENTITY = 'collection:pages:1'

describe('CSV round trip with Arabic', () => {
  it('writes UTF-8 with BOM and CRLF, quotes what needs quoting, and reads it back unchanged', () => {
    const rows = [
      { key: 'a|title', context: 'Page › Title', type: 'text', source: 'Hello, "world"', target: 'مرحبا، "يا عالم"' },
      { key: 'a|body', context: 'multi\nline', type: 'textarea', source: 'Line 1\nLine 2', target: 'سطر ١\r\nسطر ٢' },
      { key: 'a|space', context: '', type: 'text', source: ' padded ', target: '' },
    ]
    const csv = toCSV([...EXPORT_HEADERS], rows)
    expect(csv.startsWith(UTF8_BOM)).toBe(true)
    expect(csv).toContain('\r\n')
    expect(csv).toContain('"مرحبا، ""يا عالم"""')
    expect(parseCSV(csv)).toEqual(rows)
  })

  it('reads files saved by Excel (BOM, CRLF) and plain LF files', () => {
    expect(parseCSV(`${UTF8_BOM}key,target\r\nx|title,الرئيسية\r\n`)).toEqual([{ key: 'x|title', target: 'الرئيسية' }])
    expect(parseCSV('key,target\nx|title,Home\n\n')).toEqual([{ key: 'x|title', target: 'Home' }])
  })

  it('export → edit target in "Excel" → import updates the Arabic page, rich text formatting included', () => {
    const rows = buildExportRows({ fields: pageFields, entity: ENTITY, title: 'Home', source: pageEn(), target: pageArEmpty() })
    expect(rows.map((r) => r.key)).toEqual([
      'collection:pages:1|title',
      'collection:pages:1|layout.0.content#0',
      'collection:pages:1|layout.0.content#1',
      'collection:pages:1|layout.0.content#2',
      'collection:pages:1|layout.0.content#3',
      'collection:pages:1|layout.0.content#4',
      'collection:pages:1|layout.0.buttons.0.label',
      'collection:pages:1|layout.1.items.0.question',
      'collection:pages:1|meta.description',
    ])

    // A translator fills the "target" column (through a real CSV file).
    const arabic: Record<string, string> = {
      title: 'الرئيسية',
      'layout.0.content#0': 'أهلًا',
      'layout.0.content#1': 'ابنِ ',
      'layout.0.content#2': 'بسرعة',
      'layout.0.content#3': ' اليوم.',
      'layout.0.buttons.0.label': 'ابدأ',
    }
    const edited = parseCSV(toCSV([...EXPORT_HEADERS], rows.map((r) => ({ ...r, target: arabic[r.key.split('|')[1]!] ?? '' }))))
    const parsed = edited.map((r, i) => ({ row: i + 2, key: r.key!, ...parseRowKey(r.key!)!, value: r.target! }))

    const result = applyImportRows({ fields: pageFields, source: pageEn(), target: pageArEmpty(), rows: parsed })
    expect(result.problems).toEqual([])
    expect(result.applied).toBe(6)
    const data = result.data as ReturnType<typeof pageEn>
    expect(data.title).toBe('الرئيسية')
    expect(data.layout[0]!.buttons![0]!.label).toBe('ابدأ')
    // Untranslated segment (the link text) keeps the source; structure and formatting are the source's.
    expect(extractTextSegments(data.layout[0]!.content)).toEqual(['أهلًا', 'ابنِ ', 'بسرعة', ' اليوم.', 'Learn more'])
    const paragraph = (data.layout[0]!.content as ReturnType<typeof richEn>).root.children[1]!
    expect(paragraph.children.map((n) => [n.type, (n as { format?: number }).format])).toEqual([
      ['text', 1],
      ['text', 2],
      ['text', 0],
      ['link', undefined],
    ])
    // Empty cells never erase anything.
    expect(data.layout[1]!.items![0]!.question).toBeNull()
  })

  it('validates keys and reports errors with row numbers', () => {
    const rows = [
      { row: 2, key: `${ENTITY}|layout.9.content#0`, path: 'layout.9.content', segment: 0, value: 'x' },
      { row: 3, key: `${ENTITY}|layout.0.content#99`, path: 'layout.0.content', segment: 99, value: 'x' },
      { row: 4, key: `${ENTITY}|layout.0.buttons.0.url`, path: 'layout.0.buttons.0.url', value: 'https://evil.example' },
      { row: 5, key: `${ENTITY}|title#1`, path: 'title', segment: 1, value: 'x' },
    ]
    const result = applyImportRows({ fields: pageFields, source: pageEn(), target: pageArEmpty(), rows })
    expect(result.applied).toBe(0)
    expect(result.problems.map((p) => [p.row, p.message.split(':')[0]!.split('(')[0]!.trim()])).toEqual([
      [2, 'Unknown field'],
      [3, 'Rich text needs a segment number between 0 and 4.'],
      [4, 'This field is not translatable'],
      [5, 'Segment numbers are only valid for rich text.'],
    ])
  })

  it('re-importing an unchanged export changes nothing (documents are not touched)', () => {
    const translated = { ...pageArEmpty(), title: 'الرئيسية' }
    const rows = buildExportRows({ fields: pageFields, entity: ENTITY, title: 'Home', source: pageEn(), target: translated })
    const parsed = rows.map((r, i) => ({ row: i + 2, key: r.key, ...parseRowKey(r.key)!, value: r.target }))
    const result = applyImportRows({ fields: pageFields, source: pageEn(), target: translated, rows: parsed })
    expect(result.applied).toBe(0)
    expect(result.problems).toEqual([])
  })

  it('"missing only" exports just the empty targets', () => {
    const partly = { ...pageArEmpty(), title: 'الرئيسية' }
    const rows = buildExportRows({ fields: pageFields, entity: ENTITY, title: 'Home', source: pageEn(), target: partly, missingOnly: true })
    expect(rows.some((r) => r.key.endsWith('|title'))).toBe(false)
    expect(rows.length).toBeGreaterThan(0)
  })

  it('XLSX round trip keeps Arabic text and marks the target column right-to-left', async () => {
    const rows = [{ key: 'k|title', context: 'Title', type: 'text', source: 'Home', target: 'الرئيسية' }]
    const buffer = await toXLSX(rows, { rtlTarget: true, sheetName: 'ar' })
    const bytes = new Uint8Array(buffer)
    expect(await parseXLSX(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength))).toEqual(rows)
    const wb = new ExcelJS.Workbook()
    await wb.xlsx.load(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength))
    expect(wb.worksheets[0]!.getColumn('E').alignment?.readingOrder).toBe('rtl')
  })
})

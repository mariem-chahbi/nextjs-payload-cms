/**
 * RFC 4180 CSV. Written as UTF-8 *with BOM* and CRLF, so Excel opens Arabic text correctly.
 * No package imports.
 */
export const UTF8_BOM = '﻿'

const escapeCell = (value: unknown): string => {
  const text = value === undefined || value === null ? '' : String(value)
  return /[",\r\n]/.test(text) || /^\s|\s$/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

export const toCSV = (headers: string[], rows: Record<string, unknown>[]): string =>
  UTF8_BOM + [headers.map(escapeCell).join(','), ...rows.map((row) => headers.map((h) => escapeCell(row[h])).join(','))].join('\r\n') + '\r\n'

/** Parses CSV (with or without BOM, CRLF or LF, quoted fields with commas/newlines/quotes). */
export const parseCSV = (input: string): Record<string, string>[] => {
  const text = input.startsWith(UTF8_BOM) ? input.slice(1) : input
  const records: string[][] = []
  let field = ''
  let record: string[] = []
  let quoted = false

  for (let i = 0; i < text.length; i++) {
    const ch = text[i]!
    if (quoted) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"'
          i++
        } else quoted = false
      } else field += ch
      continue
    }
    if (ch === '"' && field === '') quoted = true
    else if (ch === ',') {
      record.push(field)
      field = ''
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++
      record.push(field)
      records.push(record)
      record = []
      field = ''
    } else field += ch
  }
  if (field !== '' || record.length) {
    record.push(field)
    records.push(record)
  }

  const [header, ...body] = records.filter((r) => r.length > 1 || r[0] !== '')
  if (!header) return []
  return body.map((r) => Object.fromEntries(header.map((h, i) => [h.trim(), r[i] ?? ''])))
}

import ExcelJS from 'exceljs'

import type { ExchangeRow } from './exchange'

/** XLSX with a frozen header, wide text columns, and right-to-left cells for Arabic targets. */
export const toXLSX = async (rows: ExchangeRow[], { rtlTarget, sheetName }: { rtlTarget: boolean; sheetName: string }) => {
  const workbook = new ExcelJS.Workbook()
  const sheet = workbook.addWorksheet(sheetName.slice(0, 31), { views: [{ state: 'frozen', ySplit: 1 }] })
  sheet.columns = [
    { header: 'key', key: 'key', width: 42 },
    { header: 'context', key: 'context', width: 48 },
    { header: 'type', key: 'type', width: 10 },
    { header: 'source', key: 'source', width: 60 },
    { header: 'target', key: 'target', width: 60 },
  ]
  sheet.getRow(1).font = { bold: true }
  for (const row of rows) sheet.addRow(row)
  sheet.getColumn('source').alignment = { wrapText: true, vertical: 'top' }
  sheet.getColumn('target').alignment = { wrapText: true, vertical: 'top', readingOrder: rtlTarget ? 'rtl' : 'ltr', horizontal: rtlTarget ? 'right' : 'left' }
  return Buffer.from(await workbook.xlsx.writeBuffer())
}

export const parseXLSX = async (buffer: ArrayBuffer): Promise<Record<string, string>[]> => {
  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.load(buffer)
  const sheet = workbook.worksheets[0]
  if (!sheet) return []
  const header = (sheet.getRow(1).values as unknown[]).slice(1).map((v) => String(v ?? '').trim())
  const out: Record<string, string>[] = []
  sheet.eachRow((row, index) => {
    if (index === 1) return
    const values = (row.values as unknown[]).slice(1)
    const cell = (v: unknown) =>
      v === null || v === undefined ? '' : typeof v === 'object' && 'richText' in (v as object)
        ? ((v as { richText: { text: string }[] }).richText.map((p) => p.text).join(''))
        : String(v)
    out.push(Object.fromEntries(header.map((h, i) => [h, cell(values[i])])))
  })
  return out
}

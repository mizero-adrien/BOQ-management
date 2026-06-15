import * as XLSX from 'xlsx'

export interface ParsedBOQRow {
  description: string
  unit: string
  quantity: number
  unit_rate: number
}

export interface ParsedBOQSection {
  title: string
  items: ParsedBOQRow[]
}

const DESC  = ['description', 'item description', 'work item', 'description of works', 'works', 'activity', 'particulars', 'details']
const UNIT  = ['unit', 'units', 'u/m', 'u.m.', 'unit of measure']
const QTY   = ['quantity', 'qty', 'no.', 'nos', 'number', 'volume', 'qty.']
const RATE  = ['unit rate', 'unit price', 'rate', 'price', 'cost per unit']
const SKIP  = ['amount', 'total', 'subtotal', 'sum', 'extended', 'rwf amount', 'total amount']

function norm(v: unknown): string { return String(v ?? '').toLowerCase().trim() }
function matches(h: string, list: string[]): boolean { return list.some((l) => h === l || h.startsWith(l + ' ') || h.endsWith(' ' + l) || h.includes(l)) }
function toNum(v: unknown): number {
  if (typeof v === 'number') return v
  const n = parseFloat(String(v ?? '').replace(/[,\s]/g, ''))
  return isNaN(n) || n < 0 ? 0 : n
}

function detectHeader(rows: unknown[][]): { rowIdx: number; desc: number; unit: number; qty: number; rate: number } | null {
  for (let i = 0; i < Math.min(rows.length, 12); i++) {
    const row = rows[i]
    let d = -1, u = -1, q = -1, r = -1
    row.forEach((cell, j) => {
      const h = norm(cell)
      if (d === -1 && matches(h, DESC) && !matches(h, SKIP)) d = j
      else if (u === -1 && matches(h, UNIT)) u = j
      else if (q === -1 && matches(h, QTY)) q = j
      else if (r === -1 && matches(h, RATE) && !matches(h, SKIP)) r = j
    })
    if (d !== -1 && (q !== -1 || r !== -1)) return { rowIdx: i, desc: d, unit: u, qty: q, rate: r }
  }
  return null
}

export async function parseExcel(file: File): Promise<ParsedBOQSection[]> {
  const buffer = await file.arrayBuffer()
  const wb = XLSX.read(buffer, { type: 'array' })
  const sheetName = wb.SheetNames[0]
  const rows = XLSX.utils.sheet_to_json<unknown[]>(wb.Sheets[sheetName], { header: 1, defval: '' })

  const header = detectHeader(rows)
  if (!header) {
    throw new Error(
      'Could not detect BOQ columns. Ensure your spreadsheet has column headers for Description, Quantity, and Unit Rate.'
    )
  }

  const { rowIdx, desc: dCol, unit: uCol, qty: qCol, rate: rCol } = header
  const sections: ParsedBOQSection[] = []
  let current: ParsedBOQSection = { title: sheetName, items: [] }

  for (let i = rowIdx + 1; i < rows.length; i++) {
    const row = rows[i]
    const descVal = String(row[dCol] ?? '').trim()
    if (!descVal) continue

    const qty  = qCol !== -1 ? toNum(row[qCol]) : 0
    const rate = rCol !== -1 ? toNum(row[rCol]) : 0
    const unit = uCol !== -1 ? String(row[uCol] ?? '').trim() : ''

    const looksLikeTotalRow = matches(descVal.toLowerCase(), SKIP) && qty === 0 && rate === 0
    if (looksLikeTotalRow) continue

    const isSectionHeader = qty === 0 && rate === 0 && !unit && descVal.length > 2
    if (isSectionHeader) {
      if (current.items.length > 0) sections.push(current)
      current = { title: descVal, items: [] }
      continue
    }

    if (qty > 0 || rate > 0) {
      current.items.push({ description: descVal, unit, quantity: qty, unit_rate: rate })
    }
  }

  if (current.items.length > 0) sections.push(current)
  if (sections.length === 0) {
    throw new Error('No valid BOQ items found. Make sure rows have non-zero Quantity or Unit Rate values.')
  }
  return sections
}

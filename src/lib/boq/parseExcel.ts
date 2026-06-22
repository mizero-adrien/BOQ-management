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

export interface ColumnMap {
  headerRowIdx: number
  desc: number
  unit: number
  qty: number
  rate: number
}

export interface RawHeaderCandidate {
  rowIdx: number
  headers: string[]
}

const DESC  = ['description', 'item description', 'work item', 'description of works', 'works', 'activity', 'particulars', 'details', 'item', 'work description', 'scope', 'scope of works', 'trade', 'element', 'labour description', 'material description', 'desc']
const UNIT  = ['unit', 'units', 'u/m', 'u.m.', 'unit of measure', 'uom', 'measure']
const QTY   = ['quantity', 'qty', 'no.', 'nos', 'number', 'volume', 'qty.', 'count', 'q\'ty', 'quant']
const RATE  = ['unit rate', 'unit price', 'rate', 'price', 'cost per unit', 'rate (rwf)', 'unit cost', 'p/unit', 'rate/unit', 'labour rate', 'material rate']
const SKIP  = ['amount', 'total', 'subtotal', 'sum', 'extended', 'rwf amount', 'total amount', 'line total', 'ext price']

function norm(v: unknown): string { return String(v ?? '').toLowerCase().replace(/[^a-z0-9 ./]/g, '').trim() }
function matches(h: string, list: string[]): boolean { return list.some((l) => h === l || h.startsWith(l + ' ') || h.endsWith(' ' + l) || h.includes(l)) }
function toNum(v: unknown): number {
  if (typeof v === 'number') return v
  const n = parseFloat(String(v ?? '').replace(/[,\s]/g, ''))
  return isNaN(n) || n < 0 ? 0 : n
}

function detectHeader(rows: unknown[][]): ColumnMap | null {
  for (let i = 0; i < Math.min(rows.length, 30); i++) {
    const row = rows[i]
    let d = -1, u = -1, q = -1, r = -1
    row.forEach((cell, j) => {
      const h = norm(cell)
      if (!h) return
      if (d === -1 && matches(h, DESC) && !matches(h, SKIP)) d = j
      else if (u === -1 && matches(h, UNIT)) u = j
      else if (q === -1 && matches(h, QTY)) q = j
      else if (r === -1 && matches(h, RATE) && !matches(h, SKIP)) r = j
    })
    if (d !== -1 && (q !== -1 || r !== -1)) return { headerRowIdx: i, desc: d, unit: u, qty: q, rate: r }
  }
  return null
}

function readRows(file: File | ArrayBuffer): Promise<{ sheetName: string; rows: unknown[][] }> {
  return new Promise((resolve) => {
    const process = (buffer: ArrayBuffer) => {
      const wb = XLSX.read(buffer, { type: 'array' })
      const sheetName = wb.SheetNames[0]
      const rows = XLSX.utils.sheet_to_json<unknown[]>(wb.Sheets[sheetName], { header: 1, defval: '' })
      resolve({ sheetName, rows })
    }
    if (file instanceof ArrayBuffer) { process(file); return }
    file.arrayBuffer().then(process)
  })
}

function buildSections(rows: unknown[][], map: ColumnMap, sheetName: string): ParsedBOQSection[] {
  const { headerRowIdx, desc: dCol, unit: uCol, qty: qCol, rate: rCol } = map
  const sections: ParsedBOQSection[] = []
  let current: ParsedBOQSection = { title: sheetName, items: [] }

  for (let i = headerRowIdx + 1; i < rows.length; i++) {
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
  return sections
}

export async function getCandidateHeaders(file: File): Promise<RawHeaderCandidate[]> {
  const { rows } = await readRows(file)
  const candidates: RawHeaderCandidate[] = []
  for (let i = 0; i < Math.min(rows.length, 30); i++) {
    const headers = rows[i].map((c) => String(c ?? '').trim()).filter(Boolean)
    if (headers.length >= 2) candidates.push({ rowIdx: i, headers: rows[i].map((c) => String(c ?? '').trim()) })
  }
  return candidates
}

export async function parseExcelWithMap(file: File, map: ColumnMap): Promise<ParsedBOQSection[]> {
  const { sheetName, rows } = await readRows(file)
  const sections = buildSections(rows, map, sheetName)
  if (sections.length === 0) {
    throw new Error('No valid BOQ items found. Make sure rows have non-zero Quantity or Unit Rate values.')
  }
  return sections
}

export async function parseExcel(file: File): Promise<ParsedBOQSection[]> {
  const { sheetName, rows } = await readRows(file)

  const header = detectHeader(rows)
  if (!header) {
    throw new Error(
      'Could not detect BOQ columns. Ensure your spreadsheet has column headers for Description, Quantity, and Unit Rate.'
    )
  }

  const sections = buildSections(rows, header, sheetName)
  if (sections.length === 0) {
    throw new Error('No valid BOQ items found. Make sure rows have non-zero Quantity or Unit Rate values.')
  }
  return sections
}

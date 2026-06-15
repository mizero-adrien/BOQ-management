import type { ParsedBOQRow, ParsedBOQSection } from './parseExcel'

interface GridItem { x: number; y: number; text: string }
type ColField = 'description' | 'unit' | 'qty' | 'rate'
interface ColDef { field: ColField; x: number }

// "no." / "nos" are intentionally excluded — they match item-number columns (leftmost "#"),
// not quantity columns. Including them causes the real "Qty" header to be skipped.
const DESC_T = ['description', 'item', 'work', 'activity', 'particulars', 'details', 'specification', 'scope', 'element']
const UNIT_T = ['unit', 'u/m', 'uom', 'u.m']
const QTY_T  = ['qty', 'quantity', 'volume', 'number of']
const RATE_T = ['unit rate', 'unit price', 'unit cost', 'rate', 'price', 'cost']
const SKIP_T = ['total', 'subtotal', 'sub total', 'amount', 'extended', 'sum']

function norm(s: string) { return s.toLowerCase().trim() }
function toNum(s: string) {
  const n = parseFloat(s.replace(/[,\s]/g, ''))
  return isNaN(n) || n < 0 ? 0 : n
}
function isItemNumber(s: string) { return /^\d{1,3}[a-z]?\.?$|^[a-z]\d{0,2}\.?$/i.test(s.trim()) }

function matchesAny(h: string, list: string[]): boolean {
  return list.some((t) => h === t || h.startsWith(t + ' ') || h.endsWith(' ' + t) || h.includes(' ' + t + ' ') || h === t)
}

// Group text items into rows using page-local y coordinates.
// Each page must be processed independently to avoid y-coordinate collisions between pages.
function groupByY(items: GridItem[], gap = 8): GridItem[][] {
  const rows: GridItem[][] = []
  for (const item of [...items].sort((a, b) => b.y - a.y)) {
    const row = rows.find((r) => Math.abs(r[0].y - item.y) <= gap)
    if (row) row.push(item)
    else rows.push([item])
  }
  return rows.map((r) => r.sort((a, b) => a.x - b.x))
}

// Keyword-based column detection. Scans a single header row.
// RATE_T is checked before UNIT_T so "Unit Rate" / "Unit Price" match rate, not unit.
function detectColsKeyword(row: GridItem[]): ColDef[] {
  const cols: ColDef[] = []
  for (const item of row) {
    const h = norm(item.text)
    if (matchesAny(h, SKIP_T)) continue
    if (!cols.find(c => c.field === 'description') && matchesAny(h, DESC_T)) {
      cols.push({ field: 'description', x: item.x })
    } else if (!cols.find(c => c.field === 'rate') && matchesAny(h, RATE_T)) {
      cols.push({ field: 'rate', x: item.x })
    } else if (!cols.find(c => c.field === 'qty') && matchesAny(h, QTY_T)) {
      cols.push({ field: 'qty', x: item.x })
    } else if (!cols.find(c => c.field === 'unit') && matchesAny(h, UNIT_T)) {
      cols.push({ field: 'unit', x: item.x })
    }
  }
  return cols
}

// Positional fallback: treat data row structure to infer columns.
// Works when headers are non-standard. Uses the first data-like row with 2+ numbers.
function detectColsPositional(rows: GridItem[][]): ColDef[] | null {
  for (const row of rows) {
    const nums = row.filter(i => !isNaN(parseFloat(i.text.replace(/,/g, ''))) && parseFloat(i.text.replace(/,/g, '')) > 0)
    const texts = row.filter(i => isNaN(parseFloat(i.text.replace(/,/g, ''))) && i.text.length > 2)
    if (nums.length < 2 || texts.length === 0) continue

    // Sort numeric items by x. The rightmost is usually the total (skip it).
    // Second-from-right is rate, third-from-right is qty.
    const sortedNums = [...nums].sort((a, b) => a.x - b.x)
    const rateItem = sortedNums[sortedNums.length - 2]
    const qtyItem  = sortedNums.length >= 3 ? sortedNums[sortedNums.length - 3] : sortedNums[0]

    // Leftmost long text that is not a pure item-number is description.
    const descItem = texts.find(t => !isItemNumber(t.text))
    if (!descItem || !rateItem) continue

    const cols: ColDef[] = [
      { field: 'description', x: descItem.x },
      { field: 'rate', x: rateItem.x },
    ]
    if (qtyItem && qtyItem.x !== rateItem.x) cols.push({ field: 'qty', x: qtyItem.x })

    // Short text between description and first number could be unit
    const unitCandidate = texts.find(t => t.x > descItem.x && t.x < sortedNums[0].x && t.text.length <= 5)
    if (unitCandidate) cols.push({ field: 'unit', x: unitCandidate.x })

    return cols
  }
  return null
}

function nearestCol(x: number, cols: ColDef[]): ColField {
  return cols.reduce((best, c) => Math.abs(c.x - x) < Math.abs(best.x - x) ? c : best).field
}

function parseDataRow(row: GridItem[], cols: ColDef[]): ParsedBOQRow | null {
  const fields: Partial<Record<ColField, string>> = {}
  for (const item of row) {
    const t = item.text.trim()
    if (!t) continue
    const field = nearestCol(item.x, cols)
    // Skip pure item-numbers going into the description field
    if (field === 'description' && isItemNumber(t)) continue
    fields[field] = fields[field] ? fields[field] + ' ' + t : t
  }
  const desc = (fields.description ?? '').trim()
  const qty  = toNum(fields.qty ?? '0')
  const rate = toNum(fields.rate ?? '0')
  const unit = (fields.unit ?? '').trim()
  if (!desc || (qty === 0 && rate === 0)) return null
  return { description: desc, unit, quantity: qty, unit_rate: rate }
}

export async function parsePDF(file: File): Promise<ParsedBOQSection[]> {
  const pdfjsLib = await import('pdfjs-dist')
  if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
    pdfjsLib.GlobalWorkerOptions.workerSrc =
      `https://unpkg.com/pdfjs-dist@${(pdfjsLib as unknown as { version: string }).version}/build/pdf.worker.min.mjs`
  }

  const buffer = await file.arrayBuffer()
  const doc = await pdfjsLib.getDocument({ data: buffer }).promise

  let cols: ColDef[] | null = null
  const sections: ParsedBOQSection[] = []
  let current: ParsedBOQSection = { title: file.name.replace(/\.pdf$/i, ''), items: [] }

  for (let p = 1; p <= doc.numPages; p++) {
    const page = await doc.getPage(p)
    const content = await page.getTextContent()

    // Collect items with page-local y coordinates (do NOT mix coordinates across pages).
    const pageItems: GridItem[] = []
    for (const raw of content.items) {
      const item = raw as { str: string; transform: number[] }
      const text = item.str.trim()
      if (text) pageItems.push({ x: item.transform[4], y: item.transform[5], text })
    }

    const pageRows = groupByY(pageItems)

    // On the first page, try to find column headers if not yet detected.
    if (!cols) {
      for (const row of pageRows) {
        const detected = detectColsKeyword(row)
        const hasDesc = detected.some(c => c.field === 'description')
        const hasNum  = detected.some(c => c.field === 'qty' || c.field === 'rate')
        if (hasDesc && hasNum) { cols = detected; break }
      }
      // Positional fallback: analyse the first several rows for number patterns.
      if (!cols) cols = detectColsPositional(pageRows.slice(0, 20))
      if (!cols) continue
    }

    // Process data rows. Skip the header row itself if we just found cols on this page.
    for (const row of pageRows) {
      const combined = row.map(i => i.text).join(' ').toLowerCase()

      // Skip footer / total rows
      const looksLikeTotal = matchesAny(combined, ['total', 'subtotal', 'grand total', 'sub-total'])
        && row.some(i => !isNaN(parseFloat(i.text.replace(/,/g, ''))) && parseFloat(i.text.replace(/,/g, '')) > 0)
      if (looksLikeTotal) continue

      // Detect section headers: rows that have text but no positive numbers
      const hasPositiveNum = row.some(i => {
        const n = parseFloat(i.text.replace(/,/g, ''))
        return !isNaN(n) && n > 0
      })
      if (!hasPositiveNum) {
        const label = row.filter(i => !isItemNumber(i.text)).map(i => i.text.trim()).join(' ').trim()
        if (label.length > 3) {
          // Could be a section header or a re-printed column header from the next page
          const isHeaderRepeat = detectColsKeyword(row).length >= 2
          if (!isHeaderRepeat) {
            if (current.items.length > 0) sections.push(current)
            current = { title: label, items: [] }
          }
        }
        continue
      }

      const parsed = parseDataRow(row, cols)
      if (parsed) current.items.push(parsed)
    }
  }

  if (current.items.length > 0) sections.push(current)

  if (sections.length === 0) {
    const pageInfo = `${doc.numPages} page${doc.numPages !== 1 ? 's' : ''}`
    throw new Error(
      `Could not extract BOQ data from this PDF (${pageInfo} scanned). ` +
      `Make sure the PDF is text-based (not a scanned image) and has column headers for Description, Quantity, and Unit Rate. ` +
      `Exporting to Excel from your BOQ software gives more reliable results.`
    )
  }

  return sections
}

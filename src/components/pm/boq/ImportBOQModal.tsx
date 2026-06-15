'use client'

import { useState } from 'react'
import type { ParsedBOQSection } from '@/lib/boq/parseExcel'
import ImportDropZone from './ImportDropZone'
import ImportPreview from './ImportPreview'

interface Props {
  onImport: (sections: ParsedBOQSection[]) => Promise<void>
  onClose: () => void
}

type Step = 'select' | 'preview'

export default function ImportBOQModal({ onImport, onClose }: Props) {
  const [step, setStep]       = useState<Step>('select')
  const [parsing, setParsing] = useState(false)
  const [error, setError]     = useState<string | null>(null)
  const [sections, setSections] = useState<ParsedBOQSection[]>([])

  async function handleFile(file: File) {
    setParsing(true)
    setError(null)
    try {
      const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
      let parsed: ParsedBOQSection[]
      if (ext === 'pdf') {
        const { parsePDF } = await import('@/lib/boq/parsePDF')
        parsed = await parsePDF(file)
      } else {
        const { parseExcel } = await import('@/lib/boq/parseExcel')
        parsed = await parseExcel(file)
      }
      setSections(parsed)
      setStep('preview')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse file.')
    } finally {
      setParsing(false)
    }
  }

  async function handleImport(secs: ParsedBOQSection[]) {
    await onImport(secs)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="bg-white rounded-2xl w-full" style={{ maxWidth: '680px', maxHeight: '90vh', overflowY: 'auto', border: '0.5px solid #EEEEEE' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b" style={{ borderColor: '#EEEEEE' }}>
          <div>
            <h2 className="font-semibold" style={{ color: '#111111', fontSize: '18px' }}>Import BOQ</h2>
            <p className="text-xs mt-0.5" style={{ color: '#666666' }}>
              {step === 'select' ? 'Supported: PDF, Excel (.xlsx, .xls), CSV' : 'Review detected items before importing'}
            </p>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg" style={{ color: '#BBBBBB' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          {step === 'select' ? (
            <>
              <ImportDropZone onFile={handleFile} parsing={parsing} error={error} />
              {!parsing && !error && (
                <div className="mt-5 rounded-xl px-4 py-3" style={{ backgroundColor: '#F5F6FA', border: '1px solid #EEEEEE' }}>
                  <p className="text-xs font-semibold mb-1" style={{ color: '#111111' }}>Column requirements</p>
                  <p className="text-xs leading-relaxed" style={{ color: '#666666' }}>
                    Your file must have columns for <strong>Description</strong>, <strong>Unit</strong>, <strong>Quantity</strong>, and <strong>Unit Rate</strong>.
                    Column names are detected automatically — common variations like &quot;Qty&quot;, &quot;Rate&quot;, &quot;Item&quot; are all recognised.
                    The Amount / Total column is ignored (it is computed automatically).
                  </p>
                </div>
              )}
            </>
          ) : (
            <ImportPreview sections={sections} onImport={handleImport} onBack={() => { setStep('select'); setError(null) }} />
          )}
        </div>
      </div>
    </div>
  )
}

'use client'

import { useState } from 'react'
import type { ParsedBOQSection, RawHeaderCandidate, ColumnMap } from '@/lib/boq/parseExcel'
import ImportDropZone from './ImportDropZone'
import ImportPreview from './ImportPreview'
import ColumnMappingStep from './ColumnMappingStep'

interface Props {
  onImport: (sections: ParsedBOQSection[], onProgress: (done: number, total: number) => void) => Promise<void>
  onClose: () => void
}

type Step = 'select' | 'map-columns' | 'preview'

export default function ImportBOQModal({ onImport, onClose }: Props) {
  const [step, setStep]             = useState<Step>('select')
  const [parsing, setParsing]       = useState(false)
  const [error, setError]           = useState<string | null>(null)
  const [sections, setSections]     = useState<ParsedBOQSection[]>([])
  const [candidates, setCandidates] = useState<RawHeaderCandidate[]>([])
  const [pendingFile, setPendingFile] = useState<File | null>(null)

  async function handleFile(file: File) {
    setParsing(true)
    setError(null)
    try {
      const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
      if (ext === 'pdf') {
        const { parsePDF } = await import('@/lib/boq/parsePDF')
        const parsed = await parsePDF(file)
        setSections(parsed)
        setStep('preview')
        return
      }

      const { parseExcel, getCandidateHeaders } = await import('@/lib/boq/parseExcel')
      try {
        const parsed = await parseExcel(file)
        setSections(parsed)
        setStep('preview')
      } catch (autoErr) {
        const msg = autoErr instanceof Error ? autoErr.message : ''
        if (msg.startsWith('Could not detect')) {
          const found = await getCandidateHeaders(file)
          if (found.length === 0) {
            throw new Error('Your file appears empty or has no readable rows.')
          }
          setPendingFile(file)
          setCandidates(found)
          setStep('map-columns')
        } else {
          throw autoErr
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse file.')
    } finally {
      setParsing(false)
    }
  }

  async function handleManualMap(map: ColumnMap) {
    if (!pendingFile) return
    setParsing(true)
    setError(null)
    try {
      const { parseExcelWithMap } = await import('@/lib/boq/parseExcel')
      const parsed = await parseExcelWithMap(pendingFile, map)
      setSections(parsed)
      setStep('preview')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse file.')
      setStep('select')
    } finally {
      setParsing(false)
    }
  }

  async function handleImport(secs: ParsedBOQSection[], onProgress: (done: number, total: number) => void) {
    await onImport(secs, onProgress)
    onClose()
  }

  function goBack() {
    setStep('select')
    setError(null)
    setPendingFile(null)
    setCandidates([])
  }

  const subtitle =
    step === 'select'      ? 'Supported: PDF, Excel (.xlsx, .xls), CSV' :
    step === 'map-columns' ? 'Map your spreadsheet columns to BOQ fields' :
                             'Review detected items before importing'

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="bg-white rounded-2xl w-full"
        style={{ maxWidth: '680px', maxHeight: '90vh', overflowY: 'auto', border: '0.5px solid #EEEEEE' }}
      >
        <div className="flex items-center justify-between px-6 py-5 border-b" style={{ borderColor: '#EEEEEE' }}>
          <div>
            <h2 className="font-semibold" style={{ color: '#111111', fontSize: '18px' }}>Import BOQ</h2>
            <p className="text-xs mt-0.5" style={{ color: '#666666' }}>{subtitle}</p>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg" style={{ color: '#BBBBBB' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="px-6 py-5">
          {step === 'select' && (
            <>
              <ImportDropZone onFile={handleFile} parsing={parsing} error={error} />
              {!parsing && !error && (
                <div className="mt-5 rounded-xl px-4 py-3" style={{ backgroundColor: '#F5F6FA', border: '1px solid #EEEEEE' }}>
                  <p className="text-xs font-semibold mb-1" style={{ color: '#111111' }}>Column requirements</p>
                  <p className="text-xs leading-relaxed" style={{ color: '#666666' }}>
                    Your file must have columns for <strong>Description</strong>, <strong>Unit</strong>, <strong>Quantity</strong>, and <strong>Unit Rate</strong>.
                    Column names are detected automatically — common variations like &quot;Qty&quot;, &quot;Rate&quot;, &quot;Item&quot; are all recognised.
                    If detection fails, you can map columns manually. The Amount / Total column is ignored.
                  </p>
                </div>
              )}
            </>
          )}

          {step === 'map-columns' && (
            <ColumnMappingStep
              candidates={candidates}
              onConfirm={handleManualMap}
              onBack={goBack}
            />
          )}

          {step === 'preview' && (
            <ImportPreview
              sections={sections}
              onImport={handleImport}
              onBack={goBack}
            />
          )}
        </div>
      </div>
    </div>
  )
}

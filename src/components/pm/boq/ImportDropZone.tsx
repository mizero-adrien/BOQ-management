'use client'

import { useRef, useState } from 'react'

interface Props {
  onFile: (file: File) => void
  parsing: boolean
  error: string | null
}

const ACCEPT = '.pdf,.xlsx,.xls,.csv'
const LABEL_MAP: Record<string, string> = { pdf: 'PDF', xlsx: 'Excel', xls: 'Excel', csv: 'CSV' }

function extOf(f: File) { return f.name.split('.').pop()?.toLowerCase() ?? '' }
function isSupported(f: File) { return Object.keys(LABEL_MAP).includes(extOf(f)) }

export default function ImportDropZone({ onFile, parsing, error }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return
    const file = files[0]
    if (!isSupported(file)) {
      return
    }
    onFile(file)
  }

  return (
    <div>
      <div
        className="rounded-xl flex flex-col items-center justify-center text-center cursor-pointer transition-colors"
        style={{
          border: `2px dashed ${dragging ? '#00236F' : '#EEEEEE'}`,
          backgroundColor: dragging ? '#E4E9FA' : '#F5F6FA',
          padding: '48px 24px',
        }}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files) }}
      >
        <UploadIcon />
        <p className="font-semibold mt-3 mb-1" style={{ color: '#111111', fontSize: '15px' }}>
          Drop your BOQ file here
        </p>
        <p className="text-sm mb-4" style={{ color: '#666666' }}>or click to browse</p>
        <div className="flex items-center gap-2">
          {Object.entries(LABEL_MAP).map(([ext, label]) => (
            <span key={ext} className="text-xs px-2.5 py-1 rounded-full font-medium"
              style={{ backgroundColor: '#FFFFFF', border: '1px solid #EEEEEE', color: '#666666' }}>
              {label}
            </span>
          ))}
        </div>
      </div>

      <input ref={inputRef} type="file" accept={ACCEPT} className="hidden"
        onChange={(e) => handleFiles(e.target.files)} />

      {parsing && (
        <div className="mt-4 flex items-center gap-2 text-sm" style={{ color: '#00236F' }}>
          <span className="animate-spin inline-block w-4 h-4 border-2 rounded-full"
            style={{ borderColor: '#00236F', borderTopColor: 'transparent' }} />
          Parsing file...
        </div>
      )}

      {error && (
        <div className="mt-4 rounded-lg px-4 py-3 text-sm" style={{ backgroundColor: '#FFF5F5', color: '#E24B4A', border: '1px solid #FFCCCC' }}>
          {error}
        </div>
      )}
    </div>
  )
}

function UploadIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#00236F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  )
}

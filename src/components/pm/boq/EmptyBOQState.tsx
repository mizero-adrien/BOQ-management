'use client'

interface Props {
  onAdd: () => void
  onImport: () => void
}

export default function EmptyBOQState({ onAdd, onImport }: Props) {
  return (
    <div className="bg-white rounded-xl p-10 text-center" style={{ border: '0.5px solid #EEEEEE' }}>
      <div
        className="mx-auto mb-4 flex items-center justify-center rounded-full"
        style={{ width: '56px', height: '56px', backgroundColor: '#E4E9FA' }}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <rect x="3" y="5" width="18" height="14" rx="2" stroke="#00236F" strokeWidth="1.5" />
          <path d="M3 9h18" stroke="#00236F" strokeWidth="1.5" />
          <path d="M8 13h8M8 16h5" stroke="#00236F" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </div>
      <p className="font-semibold mb-2" style={{ color: '#111111', fontSize: '16px' }}>No BOQ sections yet</p>
      <p className="text-sm mb-5" style={{ color: '#666666', maxWidth: '360px', margin: '0 auto 20px' }}>
        Add sections manually or import from a PDF or Excel file.
      </p>
      <div className="flex items-center justify-center gap-3">
        <button
          type="button"
          onClick={onImport}
          className="px-5 py-2.5 rounded-lg text-sm font-semibold"
          style={{ border: '1px solid #00236F', color: '#00236F' }}
        >
          Import file
        </button>
        <button
          type="button"
          onClick={onAdd}
          className="px-5 py-2.5 rounded-lg text-sm font-semibold text-white"
          style={{ backgroundColor: '#00236F' }}
        >
          Add first section
        </button>
      </div>
    </div>
  )
}

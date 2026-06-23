'use client'

import { useState, useRef, useEffect } from 'react'
import Spinner from '@/components/shared/Spinner'

interface Props {
  projectId: string
  onSave: (title: string, projectId: string) => Promise<string | null>
  onCancel: () => void
}

export default function AddSectionForm({ projectId, onSave, onCancel }: Props) {
  const [title, setTitle] = useState('')
  const [saving, setSaving] = useState(false)
  const ref = useRef<HTMLInputElement>(null)

  useEffect(() => { ref.current?.focus() }, [])

  async function handleSave() {
    if (!title.trim() || saving) return
    setSaving(true)
    await onSave(title.trim(), projectId)
    setSaving(false)
    onCancel()
  }

  return (
    <div className="rounded-xl p-4 mb-2" style={{ backgroundColor: '#FFFFFF', border: '1.5px solid #00236F' }}>
      <p className="text-sm font-semibold mb-3" style={{ color: '#111111' }}>New section</p>
      <input
        ref={ref}
        type="text"
        placeholder="e.g. Block Masonry"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') onCancel() }}
        className="w-full px-3 py-2.5 text-sm rounded-lg outline-none mb-3"
        style={{ backgroundColor: '#F5F6FA', border: '1px solid #EEEEEE', color: '#111111' }}
      />
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || !title.trim()}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white rounded-lg disabled:opacity-50"
          style={{ backgroundColor: '#00236F' }}
        >
          {saving && <Spinner size={12} />}
          {saving ? 'Saving…' : 'Save section'}
        </button>
        <button type="button" onClick={onCancel} className="px-3 py-2 text-xs rounded-lg" style={{ color: '#666666' }}>
          Cancel
        </button>
      </div>
    </div>
  )
}

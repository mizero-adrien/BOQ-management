'use client'

import { useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Props {
  projectId: string
  onPlanUploaded: (url: string) => void
}

export default function PlanUpload({ projectId, onPlanUploaded }: Props) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFile(file: File) {
    if (file.size > 20 * 1024 * 1024) { setError('File exceeds 20MB limit'); return }
    setUploading(true)
    setError('')
    const supabase = createClient()
    const ext = file.name.split('.').pop() ?? 'jpg'
    const path = `${projectId}/plan.${ext}`
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('plan-images').upload(path, file, { upsert: true })
    if (uploadError) { setError('Upload failed. Please try again.'); setUploading(false); return }
    const { data: urlData } = supabase.storage.from('plan-images').getPublicUrl(uploadData.path)
    await supabase.from('projects').update({ plan_image_url: urlData.publicUrl }).eq('id', projectId)
    onPlanUploaded(urlData.publicUrl)
    setUploading(false)
  }

  return (
    <div>
      <input ref={inputRef} type="file" accept="image/*,application/pdf" className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
      <div onClick={() => inputRef.current?.click()}
        className="flex flex-col items-center justify-center rounded-xl p-20 cursor-pointer"
        style={{ border: '2px dashed #EEEEEE', backgroundColor: '#FAFAFA' }}>
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#BBBBBB"
          strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mb-3">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" y1="3" x2="12" y2="15" />
        </svg>
        <p className="font-medium text-sm mb-1" style={{ color: '#111111' }}>Upload floor plan</p>
        <p className="text-xs" style={{ color: '#BBBBBB' }}>PDF or image file, max 20MB</p>
        {uploading && <p className="text-xs mt-3" style={{ color: '#00236F' }}>Uploading...</p>}
      </div>
      {error && <p className="text-sm mt-2" style={{ color: '#E24B4A' }}>{error}</p>}
    </div>
  )
}

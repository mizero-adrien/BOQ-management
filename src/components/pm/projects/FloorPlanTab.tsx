'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Project, PlanZone } from '@/types/database'

interface Props {
  project: Project
  onPlanUpdated: (url: string) => void
}

export default function FloorPlanTab({ project, onPlanUpdated }: Props) {
  const [zones, setZones] = useState<PlanZone[]>([])
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.from('plan_zones').select('*').eq('project_id', project.id)
      .then(({ data }) => setZones((data as PlanZone[]) ?? []))
  }, [project.id])

  async function handleFile(file: File) {
    if (file.size > 20 * 1024 * 1024) { setError('File exceeds 20MB limit'); return }
    setUploading(true)
    setError('')
    const supabase = createClient()
    const ext = file.name.split('.').pop() ?? 'jpg'
    const path = `${project.id}/plan.${ext}`
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('plan-images').upload(path, file, { upsert: true })
    if (uploadError) { setError('Upload failed. Please try again.'); setUploading(false); return }
    const { data: urlData } = supabase.storage.from('plan-images').getPublicUrl(uploadData.path)
    await supabase.from('projects').update({ plan_image_url: urlData.publicUrl }).eq('id', project.id)
    onPlanUpdated(urlData.publicUrl)
    setUploading(false)
  }

  return (
    <div>
      <input ref={inputRef} type="file" accept="image/*,application/pdf" className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />

      {!project.plan_image_url ? (
        <div>
          <div onClick={() => inputRef.current?.click()}
            className="flex flex-col items-center justify-center rounded-xl p-20 cursor-pointer"
            style={{ border: '2px dashed #EEEEEE', backgroundColor: '#FAFAFA' }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#BBBBBB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mb-3">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
            <p className="font-medium text-sm mb-1" style={{ color: '#111111' }}>Upload floor plan</p>
            <p className="text-xs" style={{ color: '#BBBBBB' }}>PDF or image file, max 20MB</p>
            {uploading && <p className="text-xs mt-3" style={{ color: '#00236F' }}>Uploading...</p>}
          </div>
          {error && <p className="text-sm mt-2" style={{ color: '#E24B4A' }}>{error}</p>}
        </div>
      ) : (
        <div>
          <div className="relative rounded-xl overflow-hidden" style={{ border: '1px solid #EEEEEE' }}>
            <img src={project.plan_image_url} alt="Floor plan" className="w-full h-auto block" />
            {zones.map((zone) => (
              <div key={zone.id} className="absolute rounded" style={{
                left: `${zone.x_pct}%`, top: `${zone.y_pct}%`,
                width: `${zone.width_pct}%`, height: `${zone.height_pct}%`,
                backgroundColor: `${zone.color}40`, border: `2px solid ${zone.color}`,
              }}>
                <span className="text-xs px-1 font-medium" style={{ color: zone.color }}>{zone.name}</span>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2 mt-3">
            <button type="button" onClick={() => inputRef.current?.click()}
              className="px-3 py-2 text-xs rounded-lg" style={{ border: '1px solid #EEEEEE', color: '#666666' }}>
              Replace image
            </button>
            <button type="button" className="px-3 py-2 text-xs rounded-lg"
              style={{ border: '1px solid #EEEEEE', color: '#666666' }}>
              Zone drawing coming soon
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

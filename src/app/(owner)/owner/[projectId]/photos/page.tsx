'use client'

export const dynamic = 'force-dynamic'

import { use, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatDate } from '@/lib/utils/index'

interface Photo {
  id: string
  url: string
  caption: string | null
  uploaded_at: string
}

export default function OwnerPhotosPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = use(params)
  const [photos, setPhotos] = useState<Photo[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Photo | null>(null)

  useEffect(() => {
    const supabase = createClient()
    // Get report ids for project, then photos
    supabase.from('daily_reports').select('id').eq('project_id', projectId)
      .then(async ({ data: reports }) => {
        if (!reports || reports.length === 0) { setLoading(false); return }
        const reportIds = reports.map((r) => r.id as string)
        const { data } = await supabase.from('report_photos').select('*')
          .in('report_id', reportIds).order('uploaded_at', { ascending: false }).limit(100)
        setPhotos((data ?? []) as Photo[])
        setLoading(false)
      })
  }, [projectId])

  return (
    <div className="px-4 py-5 md:px-8 md:py-8" style={{ maxWidth: '900px', margin: '0 auto' }}>
      <h1 className="text-xl font-semibold mb-5" style={{ color: '#111111' }}>Site Photos</h1>
      {loading ? (
        <div className="grid grid-cols-3 gap-2">
          {[...Array(9)].map((_, i) => <div key={i} className="aspect-square rounded-xl animate-pulse" style={{ backgroundColor: '#EEEEEE' }} />)}
        </div>
      ) : photos.length === 0 ? (
        <div className="bg-white rounded-xl p-8 text-center" style={{ border: '0.5px solid #EEEEEE' }}>
          <p className="text-sm" style={{ color: '#BBBBBB' }}>No photos uploaded yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
          {photos.map((photo) => (
            <button key={photo.id} type="button" onClick={() => setSelected(photo)}
              className="aspect-square rounded-xl overflow-hidden" style={{ border: '0.5px solid #EEEEEE' }}>
              <img src={photo.url} alt={photo.caption ?? 'Site photo'} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.8)' }}
          onClick={() => setSelected(null)}>
          <div className="max-w-2xl w-full" onClick={(e) => e.stopPropagation()}>
            <img src={selected.url} alt={selected.caption ?? ''} className="w-full rounded-xl" />
            {selected.caption && <p className="text-white text-sm mt-2 text-center">{selected.caption}</p>}
            <p className="text-center mt-1" style={{ color: '#BBBBBB', fontSize: '12px' }}>{formatDate(selected.uploaded_at)}</p>
          </div>
        </div>
      )}
    </div>
  )
}

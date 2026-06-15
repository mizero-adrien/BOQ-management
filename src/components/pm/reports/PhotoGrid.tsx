'use client'

import { useState } from 'react'
import type { ReportPhoto } from '@/types/database'

export default function PhotoGrid({ photos }: { photos: ReportPhoto[] }) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  if (photos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 rounded-xl"
        style={{ border: '1.5px dashed #EEEEEE' }}>
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" style={{ color: '#BBBBBB' }}>
          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <circle cx="12" cy="13" r="4" stroke="currentColor" strokeWidth="1.5"/>
        </svg>
        <p className="mt-2 text-sm" style={{ color: '#BBBBBB' }}>No photos attached</p>
      </div>
    )
  }

  const current = lightboxIndex !== null ? photos[lightboxIndex] : null

  function prev(e: React.MouseEvent) {
    e.stopPropagation()
    setLightboxIndex((i) => (i !== null ? (i - 1 + photos.length) % photos.length : null))
  }

  function next(e: React.MouseEvent) {
    e.stopPropagation()
    setLightboxIndex((i) => (i !== null ? (i + 1) % photos.length : null))
  }

  return (
    <>
      <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
        {photos.map((photo, idx) => (
          <div key={photo.id} className="cursor-pointer rounded-lg overflow-hidden"
            style={{ aspectRatio: '1 / 1' }}
            onClick={() => setLightboxIndex(idx)}>
            <img src={photo.url} alt={photo.caption ?? ''} className="w-full h-full object-cover" />
          </div>
        ))}
      </div>

      {current && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center"
          style={{ backgroundColor: 'rgba(0,0,0,0.9)' }}
          onClick={() => setLightboxIndex(null)}>
          {/* Close */}
          <button type="button" className="absolute top-4 right-4 text-white p-2 rounded-full"
            style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}
            onClick={() => setLightboxIndex(null)}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
          {/* Prev */}
          {photos.length > 1 && (
            <button type="button" className="absolute left-4 text-white p-2 rounded-full"
              style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}
              onClick={prev}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
          )}
          {/* Image */}
          <img src={current.url} alt={current.caption ?? ''} onClick={(e) => e.stopPropagation()}
            className="rounded-xl" style={{ maxWidth: '90vw', maxHeight: '80vh', objectFit: 'contain' }} />
          {/* Caption / counter */}
          <div className="mt-3 text-center" onClick={(e) => e.stopPropagation()}>
            {current.caption && <p className="text-sm text-white mb-1">{current.caption}</p>}
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
              {(lightboxIndex ?? 0) + 1} / {photos.length}
            </p>
          </div>
          {/* Next */}
          {photos.length > 1 && (
            <button type="button" className="absolute right-4 text-white p-2 rounded-full"
              style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}
              onClick={next}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
          )}
        </div>
      )}
    </>
  )
}

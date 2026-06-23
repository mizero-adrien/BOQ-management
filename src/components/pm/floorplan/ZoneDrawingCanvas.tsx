'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { PlanZone } from '@/types/database'

const ZONE_COLOURS = ['#778EDE', '#00236F', '#5DCAA5', '#EF9F27', '#E24B4A', '#7F77DD']

interface Props {
  projectId: string
  planImageUrl: string
  zones: PlanZone[]
  onZoneAdded: (zone: PlanZone) => void
  onZoneDeleted: (zoneId: string) => void
}

type Rect = { x: number; y: number; w: number; h: number }

function normalizeRect(r: Rect): Rect {
  return { x: r.w < 0 ? r.x + r.w : r.x, y: r.h < 0 ? r.y + r.h : r.y, w: Math.abs(r.w), h: Math.abs(r.h) }
}

export default function ZoneDrawingCanvas({ projectId, planImageUrl, zones, onZoneAdded, onZoneDeleted }: Props) {
  const [mode, setMode] = useState<'view' | 'draw'>('view')
  const [drawing, setDrawing] = useState<Rect | null>(null)
  const [pending, setPending] = useState<Rect | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [newName, setNewName] = useState('')
  const [saving, setSaving] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  function toPercent(e: React.MouseEvent) {
    const r = containerRef.current!.getBoundingClientRect()
    return {
      x: Math.max(0, Math.min(100, ((e.clientX - r.left) / r.width) * 100)),
      y: Math.max(0, Math.min(100, ((e.clientY - r.top) / r.height) * 100)),
    }
  }

  function onMouseDown(e: React.MouseEvent) {
    if (mode !== 'draw') return
    const { x, y } = toPercent(e)
    setDrawing({ x, y, w: 0, h: 0 })
  }

  function onMouseMove(e: React.MouseEvent) {
    if (!drawing) return
    const { x, y } = toPercent(e)
    setDrawing((d) => d ? { ...d, w: x - d.x, h: y - d.y } : null)
  }

  function onMouseUp() {
    if (!drawing) return
    const rect = normalizeRect(drawing)
    setDrawing(null)
    if (rect.w < 3 || rect.h < 3) return
    setPending(rect)
    setNewName('')
  }

  async function saveZone() {
    if (!pending || !newName.trim()) return
    setSaving(true)
    const color = ZONE_COLOURS[zones.length % ZONE_COLOURS.length]
    const supabase = createClient()
    const { data } = await supabase.from('plan_zones').insert({
      project_id: projectId, name: newName.trim(),
      x_pct: pending.x, y_pct: pending.y, width_pct: pending.w, height_pct: pending.h,
      color, status: 'active', progress_pct: 0,
    }).select().single()
    if (data) onZoneAdded(data as PlanZone)
    setPending(null)
    setNewName('')
    setSaving(false)
    setMode('view')
  }

  async function deleteSelected() {
    if (!selectedId) return
    const supabase = createClient()
    await supabase.from('plan_zones').delete().eq('id', selectedId)
    onZoneDeleted(selectedId)
    setSelectedId(null)
    setConfirmDelete(false)
  }

  const drawRect = drawing ? normalizeRect(drawing) : null

  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        {(['draw', 'view'] as const).map((m) => (
          <button key={m} type="button" onClick={() => { setMode(m); setSelectedId(null); setConfirmDelete(false) }}
            className="px-3 py-1.5 text-xs rounded-lg font-medium"
            style={{ backgroundColor: mode === m ? '#00236F' : '#F5F6FA', color: mode === m ? '#FFFFFF' : '#111111', border: '1px solid #EEEEEE' }}>
            {m === 'draw' ? 'Draw zone' : 'Select'}
          </button>
        ))}
        {selectedId && !confirmDelete && (
          <button type="button" onClick={() => setConfirmDelete(true)}
            className="px-3 py-1.5 text-xs rounded-lg font-medium"
            style={{ backgroundColor: '#FFF5F5', color: '#E24B4A', border: '1px solid #E24B4A' }}>
            Delete zone
          </button>
        )}
        {selectedId && confirmDelete && (
          <div className="flex items-center gap-2">
            <span className="text-xs" style={{ color: '#E24B4A' }}>Delete this zone?</span>
            <button type="button" onClick={deleteSelected}
              className="px-2.5 py-1.5 text-xs font-semibold rounded-lg text-white"
              style={{ backgroundColor: '#E24B4A' }}>
              Delete
            </button>
            <button type="button" onClick={() => setConfirmDelete(false)}
              className="px-2.5 py-1.5 text-xs rounded-lg"
              style={{ color: '#666666', border: '1px solid #EEEEEE' }}>
              Cancel
            </button>
          </div>
        )}
      </div>

      <div ref={containerRef} className="relative rounded-xl overflow-hidden select-none"
        style={{ border: '1px solid #EEEEEE', cursor: mode === 'draw' ? 'crosshair' : 'default' }}
        onMouseDown={onMouseDown} onMouseMove={onMouseMove} onMouseUp={onMouseUp}>
        <img src={planImageUrl} alt="Floor plan" className="w-full h-auto block" />
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none" style={{ pointerEvents: mode === 'view' ? 'auto' : 'none' }}>
          {zones.map((zone) => (
            <g key={zone.id} style={{ cursor: 'pointer' }}
              onClick={(e) => { e.stopPropagation(); setSelectedId((id) => id === zone.id ? null : zone.id); setConfirmDelete(false) }}>
              <rect x={zone.x_pct} y={zone.y_pct} width={zone.width_pct} height={zone.height_pct}
                fill={`${zone.color}40`} stroke={selectedId === zone.id ? '#E24B4A' : zone.color}
                strokeWidth={selectedId === zone.id ? '0.8' : '0.5'} />
              <text x={zone.x_pct + zone.width_pct / 2} y={zone.y_pct + zone.height_pct / 2}
                textAnchor="middle" dominantBaseline="middle" fill={zone.color} fontSize="2" fontWeight="600">
                {zone.name}
              </text>
            </g>
          ))}
          {drawRect && (
            <rect x={drawRect.x} y={drawRect.y} width={drawRect.w} height={drawRect.h}
              fill="#00236F22" stroke="#00236F" strokeWidth="0.5" strokeDasharray="2" />
          )}
        </svg>
      </div>

      {pending && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}>
          <div className="bg-white rounded-2xl p-6 w-full" style={{ maxWidth: '320px' }}>
            <p className="text-sm font-semibold mb-3" style={{ color: '#111111' }}>Name this zone</p>
            <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && saveZone()}
              className="w-full px-3 py-2 rounded-lg text-sm mb-4"
              style={{ border: '1px solid #EEEEEE', outline: 'none', color: '#111111', backgroundColor: '#F5F6FA' }}
              autoFocus />
            <div className="flex gap-2">
              <button type="button" onClick={() => { setPending(null); setNewName('') }}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium"
                style={{ border: '1px solid #EEEEEE', color: '#666666' }}>Cancel</button>
              <button type="button" onClick={saveZone} disabled={saving || !newName.trim()}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white"
                style={{ backgroundColor: newName.trim() ? '#00236F' : '#BBBBBB' }}>
                {saving ? 'Saving...' : 'Save zone'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

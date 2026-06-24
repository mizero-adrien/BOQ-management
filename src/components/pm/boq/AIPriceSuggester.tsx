'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency } from '@/lib/utils'
import Spinner from '@/components/shared/Spinner'

interface PriceHistory {
  project_name: string
  unit: string
  actual_unit_cost: number
}

interface AISuggestion {
  suggested_rate: number
  confidence: string
  reasoning: string
  price_range: { min: number; max: number }
  trend: string
}

export default function AIPriceSuggester({ itemDescription, onAccept, autoFetch = false, onClose }: { itemDescription: string; onAccept: (rate: number) => void; autoFetch?: boolean; onClose?: () => void }) {
  const [open, setOpen] = useState(autoFetch)
  const [loading, setLoading] = useState(false)
  const hasFetched = useRef(false)
  const [suggestion, setSuggestion] = useState<AISuggestion | null>(null)
  const [history, setHistory] = useState<PriceHistory[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (autoFetch && !hasFetched.current) {
      hasFetched.current = true
      void fetchSuggestion()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function fetchSuggestion() {
    if (itemDescription.trim().length < 3) return
    setLoading(true); setError(null); setSuggestion(null); setOpen(true)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const { data: member } = user
      ? await supabase.from('company_members').select('company_id').eq('user_id', user.id).single()
      : { data: null }

    let priceHistory: PriceHistory[] = []
    if (member?.company_id) {
      const { data } = await supabase.rpc('get_material_price_history', {
        p_company_id: member.company_id,
        p_search_term: itemDescription.split(' ')[0],
      })
      priceHistory = (data ?? []) as PriceHistory[]
    }
    setHistory(priceHistory)

    if (priceHistory.length === 0) {
      setError('No price history found for this item. Enter a rate manually.')
      setLoading(false); return
    }

    try {
      const prompt = `You are a construction cost estimator for projects in Rwanda. All prices are in RWF.\n\nThe PM is adding BOQ item: "${itemDescription}"\n\nHistorical prices from past projects:\n${JSON.stringify(priceHistory, null, 2)}\n\nRespond ONLY with valid JSON, no other text:\n{"suggested_rate":<number>,"confidence":"low|medium|high","reasoning":"<one sentence>","price_range":{"min":<number>,"max":<number>},"trend":"rising|stable|falling"}`
      const res = await fetch('/api/ai', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt, max_tokens: 400 }) })
      if (!res.ok) throw new Error('API error')
      const { text } = await res.json() as { text: string }
      setSuggestion(JSON.parse(text.replace(/```json|```/g, '').trim()) as AISuggestion)
    } catch {
      setError('Could not generate suggestion. Use the price history below as reference.')
    }
    setLoading(false)
  }

  if (!open) {
    return (
      <button type="button" onClick={fetchSuggestion}
        style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 10px', backgroundColor: '#E4E9FA', color: '#00236F', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        AI price
      </button>
    )
  }

  return (
    <div style={{ backgroundColor: '#E4E9FA', borderRadius: '10px', padding: '14px', marginTop: '8px', border: '0.5px solid #C8D4F8' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <p style={{ fontSize: '13px', fontWeight: 600, color: '#00236F' }}>AI price suggestion</p>
        <button type="button" onClick={() => { setOpen(false); onClose?.() }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#BBBBBB', fontSize: '16px', lineHeight: 1 }}>x</button>
      </div>
      {loading && <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Spinner size={14} color="blue" /><p style={{ fontSize: '13px', color: '#00236F' }}>Analysing price history...</p></div>}
      {error && <p style={{ fontSize: '13px', color: '#E24B4A' }}>{error}</p>}
      {suggestion && !loading && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <div>
              <p style={{ fontSize: '22px', fontWeight: 700, color: '#00236F', marginBottom: '2px' }}>{formatCurrency(suggestion.suggested_rate)}</p>
              <p style={{ fontSize: '11px', color: '#778EDE' }}>
                {formatCurrency(suggestion.price_range.min)} — {formatCurrency(suggestion.price_range.max)} · {suggestion.trend} · {suggestion.confidence} confidence
              </p>
            </div>
            <button type="button" onClick={() => { onAccept(suggestion.suggested_rate); setOpen(false) }}
              style={{ padding: '8px 16px', backgroundColor: '#00236F', color: '#FFFFFF', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
              Use this rate
            </button>
          </div>
          <p style={{ fontSize: '12px', color: '#00236F', lineHeight: 1.5 }}>{suggestion.reasoning}</p>
        </div>
      )}
      {history.length > 0 && !loading && (
        <div style={{ marginTop: '10px', borderTop: '0.5px solid #C8D4F8', paddingTop: '10px' }}>
          <p style={{ fontSize: '11px', fontWeight: 600, color: '#778EDE', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Price history</p>
          {history.slice(0, 3).map((h, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#00236F', marginBottom: '3px' }}>
              <span>{h.project_name} — {h.unit}</span>
              <span style={{ fontWeight: 500 }}>{formatCurrency(h.actual_unit_cost)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

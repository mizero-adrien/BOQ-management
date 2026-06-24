'use client'

import { useState } from 'react'
import Spinner from '@/components/shared/Spinner'

export interface CalculatedItem {
  description: string
  unit: string
  quantity: number
  unit_rate_estimate: number
  notes: string
}

export default function AIQuantityCalculator({ onAddItems }: { onAddItems: (items: CalculatedItem[]) => Promise<void> }) {
  const [description, setDescription] = useState('')
  const [results, setResults] = useState<CalculatedItem[]>([])
  const [calculating, setCalculating] = useState(false)
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function calculate() {
    if (description.trim().length < 10) { setError('Describe the work in at least 10 characters.'); return }
    setCalculating(true); setError(null); setResults([])
    try {
      const prompt = `You are a BOQ (Bill of Quantities) expert for construction projects in Rwanda. All monetary estimates are in RWF.\n\nGenerate a detailed BOQ for this construction work:\n"${description}"\n\nRespond ONLY with a valid JSON array. No preamble or markdown outside the JSON.\n\nEach item: { "description": "<material or labour item>", "unit": "<m2|m3|m|kg|no.|hr|ls>", "quantity": <number>, "unit_rate_estimate": <number in RWF>, "notes": "<brief note on assumptions>" }\n\nBe realistic and specific. Include 5-12 items covering materials AND labour.`
      const res = await fetch('/api/ai', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt, max_tokens: 1200 }) })
      if (!res.ok) throw new Error('API error')
      const { text } = await res.json() as { text: string }
      const parsed = JSON.parse(text.replace(/```json|```/g, '').trim()) as CalculatedItem[]
      setResults(parsed)
    } catch {
      setError('Could not generate quantities. Please try again or be more specific.')
    }
    setCalculating(false)
  }

  async function handleAddAll() {
    setAdding(true)
    await onAddItems(results)
    setAdding(false)
    setResults([])
    setDescription('')
  }

  const totalEst = results.reduce((s, r) => s + r.quantity * r.unit_rate_estimate, 0)

  return (
    <div style={{ backgroundColor: '#FFFFFF', borderRadius: '14px', border: '0.5px solid #EEEEEE', padding: '20px' }}>
      <p style={{ fontSize: '14px', fontWeight: 600, color: '#111111', marginBottom: '4px' }}>AI Quantity Calculator</p>
      <p style={{ fontSize: '12px', color: '#666666', marginBottom: '12px' }}>Describe the construction work and AI will generate a full BOQ with quantities and estimated rates.</p>
      <div style={{ display: 'flex', gap: '10px', marginBottom: '12px' }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontSize: '12px', fontWeight: 600, color: '#111111', letterSpacing: '0.01em' }}>
            Work description
          </label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2}
            placeholder="e.g. Build a 6m x 8m reinforced concrete slab, 150mm thick, for a residential floor"
            style={{ padding: '10px 12px', fontSize: '13px', borderRadius: '8px', border: '1px solid #EEEEEE', resize: 'none', outline: 'none', backgroundColor: '#F5F6FA', color: '#111111', lineHeight: 1.5 }} />
        </div>
        <button type="button" onClick={calculate} disabled={calculating || description.trim().length < 10}
          style={{ alignSelf: 'flex-end', padding: '10px 20px', backgroundColor: calculating ? '#BBBBBB' : '#00236F', color: '#FFFFFF', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: 600, cursor: calculating ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '8px' }}>
          {calculating && <Spinner size={14} />}
          {calculating ? 'Calculating...' : 'Calculate BOQ'}
        </button>
      </div>
      {error && <p style={{ fontSize: '13px', color: '#E24B4A', marginBottom: '12px' }}>{error}</p>}
      {results.length > 0 && (
        <div>
          <div style={{ borderRadius: '8px', border: '0.5px solid #EEEEEE', overflow: 'hidden', marginBottom: '12px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
              <thead>
                <tr style={{ backgroundColor: '#F5F6FA' }}>
                  {['Description', 'Unit', 'Qty', 'Est. Rate (RWF)', 'Total (RWF)', 'Notes'].map((h) => (
                    <th key={h} style={{ padding: '8px 10px', textAlign: h === 'Description' || h === 'Notes' ? 'left' : 'right', color: '#666666', fontWeight: 600, borderBottom: '0.5px solid #EEEEEE' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {results.map((r, i) => (
                  <tr key={i} style={{ backgroundColor: i % 2 === 0 ? '#FFFFFF' : '#F9FAFB' }}>
                    <td style={{ padding: '8px 10px', color: '#111111', maxWidth: '220px' }}>{r.description}</td>
                    <td style={{ padding: '8px 10px', color: '#666666', textAlign: 'right' }}>{r.unit}</td>
                    <td style={{ padding: '8px 10px', color: '#111111', textAlign: 'right' }}>{r.quantity}</td>
                    <td style={{ padding: '8px 10px', color: '#111111', textAlign: 'right' }}>{r.unit_rate_estimate.toLocaleString()}</td>
                    <td style={{ padding: '8px 10px', color: '#00236F', fontWeight: 500, textAlign: 'right' }}>{(r.quantity * r.unit_rate_estimate).toLocaleString()}</td>
                    <td style={{ padding: '8px 10px', color: '#BBBBBB', maxWidth: '200px', fontStyle: 'italic' }}>{r.notes}</td>
                  </tr>
                ))}
                <tr style={{ backgroundColor: '#E4E9FA' }}>
                  <td colSpan={4} style={{ padding: '8px 10px', fontWeight: 600, color: '#00236F' }}>Total estimate</td>
                  <td style={{ padding: '8px 10px', fontWeight: 700, color: '#00236F', textAlign: 'right' }}>{totalEst.toLocaleString()}</td>
                  <td />
                </tr>
              </tbody>
            </table>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button type="button" onClick={() => { setResults([]); setDescription('') }}
              style={{ padding: '8px 16px', backgroundColor: '#F5F6FA', color: '#666666', border: '0.5px solid #EEEEEE', borderRadius: '8px', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}>
              Discard
            </button>
            <button type="button" onClick={handleAddAll} disabled={adding}
              style={{ padding: '8px 20px', backgroundColor: adding ? '#BBBBBB' : '#00236F', color: '#FFFFFF', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: adding ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
              {adding && <Spinner size={13} />}
              {adding ? 'Adding...' : `Add all ${results.length} items to BOQ`}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

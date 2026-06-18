'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, use, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useProfile } from '@/hooks/useProfile'
import { useBOQItems } from '@/hooks/useBOQItems'
import { createClient } from '@/lib/supabase/client'
import LogItemInput from '@/components/boq/LogItemInput'

export default function LogUsagePage({
  params,
}: {
  params: Promise<{ sectionId: string }>
}) {
  const { sectionId } = use(params)
  const router = useRouter()
  const supabase = createClient()
  const { profile } = useProfile()
  const { items, loading } = useBOQItems(sectionId)
  const [sectionTitle, setSectionTitle] = useState('')

  useEffect(() => {
    async function fetchSection() {
      const { data } = await supabase
        .from('boq_sections')
        .select('title')
        .eq('id', sectionId)
        .single()
      if (data) {
        setSectionTitle(data.title)
      }
    }
    fetchSection()
  }, [sectionId, supabase])

  const [quantities, setQuantities] = useState<Record<string, number>>({})
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleQuantityChange = useCallback(
    (itemId: string, value: number) => {
      setQuantities((prev) => ({ ...prev, [itemId]: value }))
    },
    []
  )

  const sectionName = sectionTitle || 'Loading...'

  const totalCostToday = items.reduce((sum, item) => {
    const qty = quantities[item.id] ?? 0
    return sum + qty * Number(item.unit_rate)
  }, 0)

  const hasAnyQuantity = Object.values(quantities).some((q) => q > 0)

  async function handleSubmit() {
    setError(null)

    if (!hasAnyQuantity) {
      setError('Enter at least one quantity before submitting')
      return
    }

    setSubmitting(true)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user || !profile) {
        setError('You must be signed in to submit')
        setSubmitting(false)
        return
      }

      // Get section to find project_id
      const { data: section } = await supabase
        .from('boq_sections')
        .select('project_id')
        .eq('id', sectionId)
        .single()

      if (!section) {
        setError('Section not found')
        setSubmitting(false)
        return
      }

      // Try to find today's submitted daily report
      const today = new Date().toISOString().split('T')[0]
      const { data: report } = await supabase
        .from('daily_reports')
        .select('id')
        .eq('project_id', section.project_id)
        .eq('engineer_id', user.id)
        .eq('report_date', today)
        .eq('status', 'submitted')
        .maybeSingle()

      const reportId = report?.id ?? null

      // Insert material logs
      const logs = items
        .filter((item) => (quantities[item.id] ?? 0) > 0)
        .map((item) => {
          const qty = quantities[item.id] ?? 0
          return {
            report_id: reportId,
            boq_item_id: item.id,
            quantity_used: qty,
            cost_rwf: qty * Number(item.unit_rate),
            notes: notes || null,
          }
        })

      const { error: insertError } = await supabase
        .from('material_logs')
        .insert(logs)

      if (insertError) {
        setError(insertError.message)
        setSubmitting(false)
        return
      }

      setSuccess(true)
      setTimeout(() => {
        router.push(`/boq/${sectionId}`)
        router.refresh()
      }, 1500)
    } catch {
      setError('Something went wrong. Please try again.')
      setSubmitting(false)
    }
  }

  if (loading) {
    return <LogSkeleton />
  }

  if (success) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center px-4 md:px-0"
        style={{ backgroundColor: '#F5F6FA' }}
      >
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
          style={{ backgroundColor: '#00236F' }}
        >
          <CheckIcon />
        </div>
        <p className="text-sm font-semibold" style={{ color: '#111111' }}>
          Usage logged successfully
        </p>
        <p className="text-xs mt-1" style={{ color: '#666666' }}>
          Redirecting back to section...
        </p>
      </div>
    )
  }

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: '#F5F6FA' }}
    >
      <div className="flex-1 px-4 pt-6 pb-28 md:pb-6 md:px-0">
        {/* Header */}
        <div className="mb-5">
          <Link
            href={`/boq/${sectionId}`}
            className="inline-flex items-center gap-1.5 text-sm mb-3"
            style={{ color: '#666666' }}
          >
            <BackArrowIcon />
            Back to section
          </Link>
          <h1 className="text-lg font-semibold" style={{ color: '#111111' }}>
            Log today's usage
          </h1>
          <p className="text-sm mt-0.5" style={{ color: '#666666' }}>
            {sectionName}
          </p>
        </div>

        {/* Error */}
        {error && (
          <div
            className="mb-4 px-4 py-3 rounded-lg border text-sm"
            style={{
              borderColor: '#E24B4A',
              backgroundColor: '#FFF5F5',
              color: '#E24B4A',
            }}
          >
            {error}
          </div>
        )}

        {/* Items */}
        {items.length === 0 ? (
          <div
            className="bg-white rounded-xl p-5 text-center border"
            style={{ borderColor: '#EEEEEE' }}
          >
            <p className="text-sm font-medium" style={{ color: '#111111' }}>
              No items in this section yet
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <LogItemInput
                key={item.id}
                item={item}
                quantity={quantities[item.id] ?? 0}
                onChange={(val) => handleQuantityChange(item.id, val)}
              />
            ))}
          </div>
        )}

        {/* Notes */}
        <div className="mt-5">
          <label
            htmlFor="notes"
            className="block text-sm font-medium mb-1.5"
            style={{ color: '#111111' }}
          >
            Any notes for today (optional)
          </label>
          <textarea
            id="notes"
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Used extra cement due to foundation issues"
            className="w-full px-4 py-3 text-sm rounded-lg outline-none resize-none transition-colors"
            style={{
              backgroundColor: '#F5F6FA',
              border: '1px solid #EEEEEE',
              color: '#111111',
            }}
          />
        </div>

        {/* Cost summary */}
        {hasAnyQuantity && (
          <div
            className="mt-5 bg-white rounded-xl border p-4"
            style={{ borderColor: '#EEEEEE' }}
          >
            <div className="flex items-center justify-between">
              <p className="text-sm" style={{ color: '#666666' }}>
                Total cost today
              </p>
              <p
                className="text-lg font-bold"
                style={{ color: '#00236F' }}
              >
                {totalCostToday.toLocaleString()} RWF
              </p>
            </div>
          </div>
        )}

        {/* Submit */}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full py-4 rounded-xl text-sm font-semibold text-white text-center mt-5 transition-opacity disabled:opacity-60"
          style={{ backgroundColor: '#00236F' }}
        >
          {submitting ? 'Submitting...' : 'Submit usage log'}
        </button>
      </div>
    </div>
  )
}

function LogSkeleton() {
  return (
    <div
      className="min-h-screen animate-pulse px-4 pt-6 md:pt-0"
      style={{ backgroundColor: '#F5F6FA' }}
    >
      <div className="space-y-2 mb-5">
        <div className="h-4 w-24 rounded" style={{ backgroundColor: '#EEEEEE' }} />
        <div className="h-5 w-40 rounded" style={{ backgroundColor: '#EEEEEE' }} />
      </div>
      <div className="space-y-3">
        {[1, 2].map((i) => (
          <div key={i} className="h-24 rounded-xl" style={{ backgroundColor: '#EEEEEE' }} />
        ))}
      </div>
    </div>
  )
}

function BackArrowIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m12 19-7-7 7-7" />
      <path d="M19 12H5" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="white"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

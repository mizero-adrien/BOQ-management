'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, use } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useBOQItems } from '@/hooks/useBOQItems'
import { formatCurrency } from '@/lib/utils'
import ItemRow from '@/components/boq/ItemRow'
import BudgetProgressBar from '@/components/boq/BudgetProgressBar'
import TodayLogsSection from '@/components/boq/TodayLogsSection'

export default function SectionDetailPage({
  params,
}: {
  params: Promise<{ sectionId: string }>
}) {
  const { sectionId } = use(params)
  const supabase = createClient()
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

  const sectionBudget = items.reduce(
    (s, item) => s + Number(item.budgeted_total),
    0
  )
  const sectionUsed = items.reduce(
    (s, item) => s + Number(item.used_total),
    0
  )
  const usagePct =
    sectionBudget > 0
      ? Math.round((sectionUsed / sectionBudget) * 1000) / 10
      : 0

  if (loading) {
    return <SectionSkeleton />
  }

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: '#F5F6FA' }}
    >
      <div className="flex-1 px-4 pt-6 pb-24 md:pb-6 md:px-0">
        {/* Header with back */}
        <div className="mb-5">
          <Link
            href="/boq"
            className="inline-flex items-center gap-1.5 text-sm mb-3"
            style={{ color: '#666666' }}
          >
            <BackArrowIcon />
            Back to BOQ
          </Link>
          <h1 className="text-lg font-semibold" style={{ color: '#111111' }}>
            {sectionTitle || 'Section'}
          </h1>
        </div>

        {/* Budget summary */}
        <div
          className="bg-white rounded-xl border p-4 mb-5"
          style={{ borderColor: '#EEEEEE' }}
        >
          <div className="grid grid-cols-2 gap-4 mb-3">
            <div>
              <p className="text-xs" style={{ color: '#666666' }}>
                Budget total
              </p>
              <p className="text-sm font-semibold mt-0.5" style={{ color: '#111111' }}>
                {formatCurrency(sectionBudget)}
              </p>
            </div>
            <div>
              <p className="text-xs" style={{ color: '#666666' }}>
                Used total
              </p>
              <p className="text-sm font-semibold mt-0.5" style={{ color: '#111111' }}>
                {formatCurrency(sectionUsed)}
              </p>
            </div>
          </div>
          <BudgetProgressBar used={sectionUsed} total={sectionBudget} />
          {usagePct >= 80 && (
            <p
              className="text-xs font-medium mt-1.5"
              style={{ color: '#E24B4A' }}
            >
              {usagePct >= 100
                ? 'Over budget'
                : `${usagePct}% used — near limit`}
            </p>
          )}
        </div>

        <TodayLogsSection sectionId={sectionId} />

        {/* Items list */}
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
              <ItemRow key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>

      <div className="fixed bottom-20 left-0 right-0 px-4 pb-2 md:static md:px-0 md:pb-0 md:mt-4 z-10">
        <Link
          href={`/boq/${sectionId}/log`}
          className="block w-full py-4 rounded-xl text-sm font-semibold text-white text-center transition-opacity active:opacity-80"
          style={{ backgroundColor: '#00236F' }}
        >
          Log usage for today
        </Link>
      </div>
    </div>
  )
}

function SectionSkeleton() {
  return (
    <div
      className="min-h-screen animate-pulse px-4 pt-6 md:pt-0"
      style={{ backgroundColor: '#F5F6FA' }}
    >
      <div className="space-y-2 mb-5">
        <div className="h-4 w-24 rounded" style={{ backgroundColor: '#EEEEEE' }} />
        <div className="h-5 w-40 rounded" style={{ backgroundColor: '#EEEEEE' }} />
      </div>
      <div className="h-24 rounded-xl mb-5" style={{ backgroundColor: '#EEEEEE' }} />
      <div className="space-y-3">
        {[1, 2].map((i) => (
          <div key={i} className="h-32 rounded-xl" style={{ backgroundColor: '#EEEEEE' }} />
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

'use client'

export const dynamic = 'force-dynamic'

import { useState, useMemo } from 'react'
import { useActiveProject } from '@/hooks/useActiveProject'
import { useMaterialLogs } from '@/hooks/useMaterialLogs'
import { formatDate, formatCurrency } from '@/lib/utils/index'
import type { MaterialLogEntry } from '@/hooks/useMaterialLogs'

type SortKey = 'date' | 'cost'

function exportCSV(logs: MaterialLogEntry[], projectName: string) {
  const header = 'Date,Item,Unit,Quantity Used,Cost RWF,Logged By\n'
  const rows = logs.map((l) =>
    [formatDate(l.loggedAt), `"${l.itemDescription}"`, l.unit, l.quantityUsed, l.costRwf, `"${l.engineerName}"`].join(',')
  ).join('\n')
  const blob = new Blob([header + rows], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `cost-report-${projectName.replace(/\s+/g, '-')}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export default function QSCostsPage() {
  const { project } = useActiveProject()
  const { logs, loading } = useMaterialLogs(project?.id)
  const [sortKey, setSortKey] = useState<SortKey>('date')

  const sorted = useMemo(() => {
    return [...logs].sort((a, b) =>
      sortKey === 'date'
        ? new Date(b.loggedAt).getTime() - new Date(a.loggedAt).getTime()
        : b.costRwf - a.costRwf
    )
  }, [logs, sortKey])

  const total = logs.reduce((s, l) => s + l.costRwf, 0)

  return (
    <div className="px-4 py-5 md:px-8 md:py-8" style={{ maxWidth: '900px', margin: '0 auto' }}>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-semibold mb-0.5" style={{ color: '#111111' }}>Cost Report</h1>
          <p className="text-sm" style={{ color: '#666666' }}>{project?.name}</p>
        </div>
        <button type="button" onClick={() => project && exportCSV(sorted, project.name)}
          className="px-4 py-2 rounded-lg text-sm font-medium"
          style={{ border: '1px solid #00236F', color: '#00236F' }}>
          Export CSV
        </button>
      </div>

      <div className="flex gap-2 mb-4">
        {(['date', 'cost'] as SortKey[]).map((k) => (
          <button key={k} type="button" onClick={() => setSortKey(k)}
            className="px-3 py-1.5 rounded-full text-xs font-semibold"
            style={{ backgroundColor: sortKey === k ? '#00236F' : '#F5F6FA', color: sortKey === k ? '#FFFFFF' : '#666666' }}>
            Sort by {k === 'date' ? 'Date' : 'Cost'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="animate-pulse space-y-2">
          {[1,2,3,4,5].map((i) => <div key={i} className="h-14 rounded-xl" style={{ backgroundColor: '#EEEEEE' }} />)}
        </div>
      ) : (
        <>
          <div className="bg-white rounded-xl overflow-hidden mb-3" style={{ border: '0.5px solid #EEEEEE' }}>
            <div className="hidden md:grid grid-cols-6 px-4 py-2 border-b text-xs font-semibold uppercase tracking-wider"
              style={{ borderColor: '#EEEEEE', color: '#BBBBBB', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 2fr' }}>
              <span>Item</span><span>Unit</span><span>Qty</span><span>Unit Rate</span><span>Total</span><span>Logged by</span>
            </div>
            {sorted.map((log, i) => (
              <div key={log.id} className={`flex md:grid items-center gap-3 px-4 py-3 ${i < sorted.length - 1 ? 'border-b' : ''}`}
                style={{ borderColor: '#EEEEEE', backgroundColor: i % 2 === 0 ? '#FFFFFF' : '#F5F6FA', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 2fr' }}>
                <div className="flex-1 md:contents">
                  <p className="text-xs font-medium" style={{ color: '#111111' }}>{log.itemDescription}</p>
                  <p className="text-xs" style={{ color: '#666666' }}>{log.unit}</p>
                  <p className="text-xs" style={{ color: '#666666' }}>{log.quantityUsed}</p>
                  <p className="text-xs" style={{ color: '#666666' }}>—</p>
                  <p className="text-xs font-semibold" style={{ color: '#00236F' }}>{formatCurrency(log.costRwf)}</p>
                  <p className="text-xs" style={{ color: '#666666' }}>{log.engineerName} · {formatDate(log.loggedAt)}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="bg-white rounded-xl px-4 py-3 flex items-center justify-between" style={{ border: '0.5px solid #EEEEEE' }}>
            <p className="text-sm font-semibold" style={{ color: '#111111' }}>Total cost</p>
            <p className="text-base font-bold" style={{ color: '#00236F' }}>{formatCurrency(total)}</p>
          </div>
        </>
      )}
    </div>
  )
}

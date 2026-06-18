'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import Link from 'next/link'
import { usePurchaseRequests } from '@/hooks/usePurchaseRequests'
import type { PurchaseRequestStatus } from '@/hooks/usePurchaseRequests'
import RequestCard from '@/components/procurement/RequestCard'

const TABS: Array<PurchaseRequestStatus | 'all'> = [
  'all', 'draft', 'pending_approval', 'approved', 'rejected', 'ordered', 'delivered',
]

const TAB_LABELS: Record<PurchaseRequestStatus | 'all', string> = {
  all: 'All', draft: 'Draft', pending_approval: 'Pending',
  approved: 'Approved', rejected: 'Rejected', ordered: 'Ordered',
  partially_delivered: 'Partial', delivered: 'Delivered', cancelled: 'Cancelled',
}

export default function RequestsPage() {
  const [activeTab, setActiveTab] = useState<PurchaseRequestStatus | 'all'>('all')
  const { requests, loading } = usePurchaseRequests()

  const filtered = activeTab === 'all'
    ? requests
    : requests.filter((r) => r.status === activeTab)

  return (
    <div style={{ backgroundColor: '#F5F6FA', minHeight: '100vh', padding: '32px 20px' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: '600', color: '#111111', marginBottom: '4px' }}>
              Purchase Requests
            </h1>
            <p style={{ fontSize: '14px', color: '#666666' }}>{requests.length} total</p>
          </div>
          <Link
            href="/procurement/requests/new"
            style={{ padding: '10px 20px', backgroundColor: '#00236F', color: '#FFFFFF',
              borderRadius: '10px', fontSize: '14px', fontWeight: '600', textDecoration: 'none' }}
          >
            New request
          </Link>
        </div>

        <div style={{ display: 'flex', gap: '4px', marginBottom: '20px', overflowX: 'auto', paddingBottom: '4px' }}>
          {TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              style={{ padding: '7px 14px', borderRadius: '20px', fontSize: '13px', whiteSpace: 'nowrap',
                fontWeight: activeTab === tab ? '600' : '400',
                backgroundColor: activeTab === tab ? '#00236F' : '#FFFFFF',
                color: activeTab === tab ? '#FFFFFF' : '#666666',
                border: activeTab === tab ? 'none' : '1px solid #EEEEEE', cursor: 'pointer' }}
            >
              {TAB_LABELS[tab]}
            </button>
          ))}
        </div>

        {loading ? (
          [1, 2, 3].map((i) => (
            <div key={i} className="rounded-xl animate-pulse mb-3" style={{ height: '100px', backgroundColor: '#EEEEEE' }} />
          ))
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <p style={{ color: '#BBBBBB', fontSize: '14px' }}>No requests found</p>
            <Link
              href="/procurement/requests/new"
              style={{ display: 'inline-block', marginTop: '12px', color: '#00236F', fontSize: '14px' }}
            >
              Create your first request
            </Link>
          </div>
        ) : (
          filtered.map((r) => (
            <RequestCard key={r.id} request={r} href={`/procurement/requests/${r.id}`} />
          ))
        )}
      </div>
    </div>
  )
}

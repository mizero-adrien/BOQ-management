'use client'

import { useState } from 'react'

interface Props {
  requestId: string
  onApprove: (id: string) => Promise<void>
  onReject: (id: string, reason: string) => Promise<void>
}

export default function ApprovalPanel({ requestId, onApprove, onReject }: Props) {
  const [rejecting, setRejecting] = useState(false)
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleApprove() {
    setLoading(true)
    await onApprove(requestId)
    setLoading(false)
  }

  async function handleReject() {
    if (!reason.trim()) return
    setLoading(true)
    await onReject(requestId, reason.trim())
    setLoading(false)
    setRejecting(false)
    setReason('')
  }

  return (
    <div className="bg-white rounded-xl px-5 py-4" style={{ border: '1px solid #EEEEEE' }}>
      <p className="text-sm font-semibold mb-3" style={{ color: '#111111' }}>Approval decision</p>

      {rejecting ? (
        <div>
          <p className="text-xs mb-2" style={{ color: '#666666' }}>Provide a reason for rejection:</p>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            placeholder="Explain why this request is being rejected..."
            className="w-full px-3 py-2.5 text-sm rounded-lg outline-none resize-none mb-3"
            style={{ backgroundColor: '#F5F6FA', border: '1px solid #EEEEEE', color: '#111111' }}
          />
          <div className="flex gap-3">
            <button type="button" onClick={() => { setRejecting(false); setReason('') }}
              className="flex-1 py-2.5 rounded-lg text-sm font-medium"
              style={{ border: '1px solid #EEEEEE', color: '#666666' }}>
              Cancel
            </button>
            <button type="button" onClick={handleReject} disabled={loading || !reason.trim()}
              className="flex-1 py-2.5 rounded-lg text-sm font-medium text-white disabled:opacity-50"
              style={{ backgroundColor: '#E24B4A' }}>
              {loading ? 'Rejecting...' : 'Confirm rejection'}
            </button>
          </div>
        </div>
      ) : (
        <div className="flex gap-3">
          <button type="button" onClick={() => setRejecting(true)} disabled={loading}
            className="flex-1 py-2.5 rounded-lg text-sm font-medium"
            style={{ border: '1px solid #E24B4A', color: '#E24B4A' }}>
            Reject
          </button>
          <button type="button" onClick={handleApprove} disabled={loading}
            className="flex-1 py-2.5 rounded-lg text-sm font-medium text-white disabled:opacity-50"
            style={{ backgroundColor: '#00236F' }}>
            {loading ? 'Approving...' : 'Approve'}
          </button>
        </div>
      )}
    </div>
  )
}

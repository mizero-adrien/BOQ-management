'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { usePurchaseRequests } from '@/hooks/usePurchaseRequests'
import type { NewRequestItem } from '@/hooks/usePurchaseRequests'
import RequestDetailsStep from '@/components/procurement/RequestDetailsStep'
import type { RequestDetails } from '@/components/procurement/RequestDetailsStep'
import LineItemsStep from '@/components/procurement/LineItemsStep'

const INITIAL_DETAILS: RequestDetails = {
  title: '', projectId: '', requiredByDate: '', description: '',
}

export default function NewRequestPage() {
  const router = useRouter()
  const { createRequest, submitForApproval } = usePurchaseRequests()
  const [step, setStep] = useState(1)
  const [details, setDetails] = useState<RequestDetails>(INITIAL_DETAILS)
  const [items, setItems] = useState<NewRequestItem[]>([])
  const [saving, setSaving] = useState(false)

  async function handleSave(thenSubmit = false) {
    if (items.length === 0) return
    setSaving(true)
    const id = await createRequest({
      projectId: details.projectId,
      title: details.title,
      description: details.description || undefined,
      requiredByDate: details.requiredByDate || undefined,
      items,
    })
    if (id && thenSubmit) {
      await submitForApproval(id)
    }
    setSaving(false)
    if (id) router.push('/procurement/requests')
  }

  return (
    <div style={{ backgroundColor: '#F5F6FA', minHeight: '100vh', padding: '32px 20px' }}>
      <div style={{ maxWidth: '640px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
          <button
            type="button"
            onClick={() => step > 1 ? setStep(1) : router.back()}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#666666', display: 'flex', padding: 0 }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m12 19-7-7 7-7" /><path d="M19 12H5" />
            </svg>
          </button>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: '600', color: '#111111' }}>New Purchase Request</h1>
            <p style={{ fontSize: '13px', color: '#666666' }}>Step {step} of 2</p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
          {[1, 2].map((s) => (
            <div key={s} style={{ flex: 1, height: '3px', borderRadius: '2px',
              backgroundColor: s <= step ? '#00236F' : '#EEEEEE' }} />
          ))}
        </div>

        {step === 1 && (
          <RequestDetailsStep
            details={details}
            onChange={setDetails}
            onNext={() => setStep(2)}
          />
        )}

        {step === 2 && (
          <>
            <div className="bg-white rounded-xl px-4 py-3 mb-4" style={{ border: '1px solid #EEEEEE' }}>
              <p style={{ fontSize: '13px', color: '#666666' }}>
                {details.title} &nbsp;&middot;&nbsp; Required by {new Date(details.requiredByDate).toLocaleDateString()}
              </p>
            </div>
            <LineItemsStep
              items={items}
              onChange={setItems}
              onBack={() => setStep(1)}
              onSubmit={() => handleSave(false)}
              saving={saving}
            />
            {items.length > 0 && (
              <button
                type="button"
                onClick={() => handleSave(true)}
                disabled={saving}
                style={{ width: '100%', marginTop: '12px', padding: '14px', backgroundColor: '#5DCAA5',
                  color: '#FFFFFF', border: 'none', borderRadius: '10px', fontSize: '14px',
                  fontWeight: '600', cursor: 'pointer' }}
              >
                Save and submit for approval
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
}

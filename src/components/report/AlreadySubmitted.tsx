'use client'

import { useRouter } from 'next/navigation'

export default function AlreadySubmitted() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6">
      <div
        className="w-[72px] h-[72px] rounded-full flex items-center justify-center mb-5"
        style={{ backgroundColor: '#E4E9FA' }}
      >
        <svg
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#00236F"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>
      <h1 className="text-xl font-semibold mb-2" style={{ color: '#111111' }}>
        Report submitted
      </h1>
      <p
        className="text-sm text-center mb-8 max-w-xs"
        style={{ color: '#666666' }}
      >
        You have already submitted your report for today. Come back tomorrow.
      </p>
      <button
        type="button"
        onClick={() => router.push('/report/history')}
        className="w-full max-w-xs py-3.5 rounded-xl text-sm font-semibold mb-3 transition-opacity active:opacity-80"
        style={{
          color: '#00236F',
          border: '1.5px solid #00236F',
          backgroundColor: '#FFFFFF',
        }}
      >
        View submitted report
      </button>
      <button
        type="button"
        onClick={() => router.push('/dashboard')}
        className="w-full max-w-xs py-3.5 rounded-xl text-sm font-semibold text-white transition-opacity active:opacity-80"
        style={{ backgroundColor: '#00236F' }}
      >
        Go to dashboard
      </button>
    </div>
  )
}

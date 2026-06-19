'use client'

import { useSyncPendingReports } from '@/hooks/useSyncPendingReports'

export default function OfflineSyncBanner() {
  const { pendingCount, syncing, syncAll } = useSyncPendingReports()

  if (pendingCount === 0 && !syncing) return null

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '88px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 200,
        backgroundColor: syncing ? '#00236F' : '#EF9F27',
        color: '#FFFFFF',
        borderRadius: '24px',
        padding: '10px 18px',
        fontSize: '13px',
        fontWeight: 600,
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        boxShadow: '0 4px 16px rgba(0,0,0,0.18)',
        whiteSpace: 'nowrap',
        transition: 'background-color 0.2s',
      }}
    >
      {syncing ? (
        <>
          <div
            style={{
              width: '14px',
              height: '14px',
              borderRadius: '50%',
              border: '2px solid rgba(255,255,255,0.4)',
              borderTopColor: '#FFFFFF',
              animation: 'spin 0.7s linear infinite',
              flexShrink: 0,
            }}
          />
          Syncing reports...
        </>
      ) : (
        <>
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ flexShrink: 0 }}
          >
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <line x1="2" y1="2" x2="22" y2="22" />
          </svg>
          {pendingCount} offline report{pendingCount > 1 ? 's' : ''} pending
          <button
            type="button"
            onClick={syncAll}
            style={{
              background: 'rgba(255,255,255,0.25)',
              border: 'none',
              color: '#FFFFFF',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '12px',
              padding: '3px 10px',
              borderRadius: '12px',
            }}
          >
            Sync now
          </button>
        </>
      )}
    </div>
  )
}

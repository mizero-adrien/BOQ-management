'use client'

export const dynamic = 'force-dynamic'

import NotificationsContent from '@/components/shared/NotificationsContent'

export default function OwnerNotificationsPage() {
  return (
    <div style={{ maxWidth: '700px', margin: '0 auto', padding: '32px 20px' }}>
      <h1 style={{ fontSize: '22px', fontWeight: '600', color: '#111111', marginBottom: '20px' }}>
        Notifications
      </h1>
      <NotificationsContent />
    </div>
  )
}

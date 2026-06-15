'use client'

import { useProfile } from '@/hooks/useProfile'
import { useSignOut } from '@/hooks/useSignOut'

export default function MobileProfileCard() {
  const { profile } = useProfile()
  const { signOut } = useSignOut()

  const initials = profile?.full_name
    ?.split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() ?? ''

  return (
    <div className="md:hidden mt-8 border-t pt-5" style={{ borderColor: '#EEEEEE' }}>
      <div className="flex items-center gap-3 mb-4">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: '#E4E9FA' }}
        >
          <span className="text-sm font-bold" style={{ color: '#00236F' }}>
            {initials}
          </span>
        </div>
        <div>
          <p className="text-sm font-medium" style={{ color: '#111111' }}>
            {profile?.full_name ?? 'Loading...'}
          </p>
          <p className="text-xs mt-0.5" style={{ color: '#666666' }}>Project Manager</p>
        </div>
      </div>
      <button
        type="button"
        onClick={signOut}
        className="w-full py-3 rounded-xl text-sm font-medium transition-opacity active:opacity-80"
        style={{ border: '1.5px solid #EEEEEE', color: '#E24B4A' }}
      >
        Sign out
      </button>
    </div>
  )
}

import type { Metadata } from 'next'
import ToastContainer from '@/components/shared/ToastContainer'

export const metadata: Metadata = {
  title: 'Set up your account — BOQ Management',
}

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-5 py-12"
      style={{ backgroundColor: '#F5F6FA' }}
    >
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center mb-3"
            style={{ backgroundColor: '#00236F' }}
          >
            <BuildingIcon />
          </div>
          <p className="text-sm font-medium" style={{ color: '#00236F' }}>
            BOQ Management
          </p>
        </div>
        {children}
      </div>
      <ToastContainer />
    </div>
  )
}

function BuildingIcon() {
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
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M9 22V12h6v10" />
      <path d="M9 7h1" />
      <path d="M14 7h1" />
      <path d="M9 11h1" />
      <path d="M14 11h1" />
    </svg>
  )
}

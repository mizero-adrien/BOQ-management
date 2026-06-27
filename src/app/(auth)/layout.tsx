import ToastContainer from '@/components/shared/ToastContainer'
import BrandContent from '@/components/auth/BrandContent'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
    }}>

      {/* LEFT SIDE — Form */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px 24px',
          backgroundColor: '#FFFFFF',
        }}
        className="w-full flex-none md:w-[40%]"
      >
        <div style={{ width: '100%', maxWidth: '380px' }}>
          {children}
        </div>
      </div>

      {/* RIGHT SIDE — Brand content — hidden on mobile */}
      <div
        className="hidden md:flex"
        style={{
          flex: 1,
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '60px 48px',
          backgroundColor: '#F4F6F8',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <BrandContent />
      </div>

      <ToastContainer />
    </div>
  )
}

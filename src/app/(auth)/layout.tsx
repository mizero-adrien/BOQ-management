import ToastContainer from '@/components/shared/ToastContainer'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main style={{ minHeight: '100vh', backgroundColor: '#F4F6F8', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
      <div style={{ width: '100%', maxWidth: '400px', backgroundColor: '#FFFFFF', border: '0.5px solid #DDE3E8', borderRadius: '8px', padding: '32px' }}>
        {children}
      </div>
      <ToastContainer />
    </main>
  )
}

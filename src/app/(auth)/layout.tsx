import ToastContainer from '@/components/shared/ToastContainer'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <main className="min-h-screen bg-white flex flex-col items-center justify-center px-5 py-10">
      <div className="w-full max-w-sm">
        {children}
      </div>
      <ToastContainer />
    </main>
  )
}

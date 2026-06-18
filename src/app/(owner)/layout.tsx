import { NotificationProvider } from '@/contexts/NotificationContext'
import PageErrorBoundary from '@/components/shared/PageErrorBoundary'
import ToastContainer from '@/components/shared/ToastContainer'
import OwnerNav from '@/components/layout/OwnerNav'

export default function OwnerLayout({ children }: { children: React.ReactNode }) {
  return (
    <PageErrorBoundary>
      <NotificationProvider>
        <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#F5F6FA' }}>
          <OwnerNav />
          <main className="flex-1 min-w-0 w-full">
            {children}
          </main>
        </div>
        <ToastContainer />
      </NotificationProvider>
    </PageErrorBoundary>
  )
}

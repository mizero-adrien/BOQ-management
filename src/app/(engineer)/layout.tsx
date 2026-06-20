import Sidebar from '@/components/layout/Sidebar'
import BottomNav from '@/components/layout/BottomNav'
import MobileTopBar from '@/components/layout/MobileTopBar'
import { NotificationProvider } from '@/contexts/NotificationContext'
import PageErrorBoundary from '@/components/shared/PageErrorBoundary'
import ToastContainer from '@/components/shared/ToastContainer'
import OfflineSyncBanner from '@/components/shared/OfflineSyncBanner'

export default function EngineerLayout({ children }: { children: React.ReactNode }) {
  return (
    <PageErrorBoundary>
      <NotificationProvider>
        <div className="min-h-screen flex flex-col md:flex-row" style={{ backgroundColor: '#F5F6FA' }}>
          <MobileTopBar messagesHref="/messages" notificationsHref="/notifications" />
          <Sidebar />
          <main className="flex-1 min-w-0 w-full pb-20 pt-14 md:pt-0 md:pb-0 md:max-w-[720px] md:mx-auto md:px-6 md:py-6">
            {children}
          </main>
          <BottomNav />
        </div>
        <OfflineSyncBanner />
        <ToastContainer />
      </NotificationProvider>
    </PageErrorBoundary>
  )
}

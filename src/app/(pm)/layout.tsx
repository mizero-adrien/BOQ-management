import PMSidebar from '@/components/layout/PMSidebar'
import PMBottomNav from '@/components/layout/PMBottomNav'
import MobileTopBar from '@/components/layout/MobileTopBar'
import { NotificationProvider } from '@/contexts/NotificationContext'
import PageErrorBoundary from '@/components/shared/PageErrorBoundary'
import ToastContainer from '@/components/shared/ToastContainer'

export default function PMLayout({ children }: { children: React.ReactNode }) {
  return (
    <PageErrorBoundary>
      <NotificationProvider>
        <div className="min-h-screen flex flex-col md:flex-row" style={{ backgroundColor: '#F5F6FA' }}>
          <MobileTopBar messagesHref="/pm/messages" />
          <PMSidebar />
          <main className="flex-1 min-w-0 w-full pb-20 pt-14 md:pt-0 md:pb-0">
            {children}
          </main>
          <PMBottomNav />
        </div>
        <ToastContainer />
      </NotificationProvider>
    </PageErrorBoundary>
  )
}

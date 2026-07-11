import AdminSidebar from '@/components/admin/AdminSidebar'
import AdminMobileNav from '@/components/admin/AdminMobileNav'
import PageErrorBoundary from '@/components/shared/PageErrorBoundary'
import ToastContainer from '@/components/shared/ToastContainer'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <PageErrorBoundary>
      <div className="min-h-screen flex flex-col md:flex-row" style={{ backgroundColor: '#F4F6F8' }}>
        <AdminSidebar />
        <div className="flex-1 min-w-0 w-full flex flex-col">
          <AdminMobileNav />
          <main className="flex-1 min-w-0 w-full">
            {children}
          </main>
        </div>
      </div>
      <ToastContainer />
    </PageErrorBoundary>
  )
}

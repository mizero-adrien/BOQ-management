import OwnerSidebarWrapper from '@/components/layout/OwnerSidebarWrapper'

export default function OwnerLayout({ children }: { children: React.ReactNode }) {
  return <OwnerSidebarWrapper>{children}</OwnerSidebarWrapper>
}

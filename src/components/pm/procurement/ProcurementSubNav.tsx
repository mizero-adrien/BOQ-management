'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const tabs = [
  { label: 'Overview', href: '/pm/procurement' },
  { label: 'All Requests', href: '/pm/procurement/requests' },
  { label: 'Orders', href: '/pm/procurement/orders' },
  { label: 'Price Variance', href: '/pm/procurement/variance' },
]

export default function ProcurementSubNav() {
  const pathname = usePathname()

  return (
    <div style={{ backgroundColor: '#FFFFFF', borderBottom: '1px solid #EEEEEE' }}>
      <div
        style={{
          maxWidth: '960px',
          margin: '0 auto',
          padding: '0 24px',
          display: 'flex',
          overflowX: 'auto',
        }}
      >
        {tabs.map((tab) => {
          const isActive =
            tab.href === '/pm/procurement'
              ? pathname === '/pm/procurement'
              : pathname.startsWith(tab.href)

          return (
            <Link
              key={tab.href}
              href={tab.href}
              style={{
                display: 'block',
                padding: '14px 16px',
                fontSize: '14px',
                fontWeight: isActive ? '600' : '400',
                color: isActive ? '#00236F' : '#666666',
                textDecoration: 'none',
                borderBottom: isActive ? '2px solid #00236F' : '2px solid transparent',
                whiteSpace: 'nowrap',
                flexShrink: 0,
              }}
            >
              {tab.label}
            </Link>
          )
        })}
      </div>
    </div>
  )
}

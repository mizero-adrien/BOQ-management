import Link from 'next/link'
import type { ReactNode } from 'react'

interface Props {
  pageTitle: string
  pageSubtitle: string
  icon: ReactNode
  body: string
  secondaryBody?: string
}

export default function NoProjectsEmptyState({ pageTitle, pageSubtitle, icon, body, secondaryBody }: Props) {
  return (
    <div style={{ padding: '32px 24px', maxWidth: '960px', margin: '0 auto' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '600', color: '#111111', marginBottom: '4px' }}>
          {pageTitle}
        </h1>
        <p style={{ fontSize: '14px', color: '#666666' }}>{pageSubtitle}</p>
      </div>

      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          border: '0.5px solid #EEEEEE',
          padding: '64px 32px',
          textAlign: 'center',
          boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
        }}
      >
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            backgroundColor: '#E4E9FA',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
          }}
        >
          {icon}
        </div>

        <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#111111', marginBottom: '8px' }}>
          No projects yet
        </h2>

        <p
          style={{
            fontSize: '14px',
            color: '#666666',
            maxWidth: '380px',
            margin: '0 auto 8px',
            lineHeight: '1.6',
          }}
        >
          {body}
        </p>

        {secondaryBody ? (
          <p
            style={{
              fontSize: '13px',
              color: '#BBBBBB',
              maxWidth: '380px',
              margin: '8px auto 28px',
              lineHeight: '1.6',
            }}
          >
            {secondaryBody}
          </p>
        ) : (
          <div style={{ height: '20px' }} />
        )}

        <Link
          href="/pm/projects/new"
          style={{
            display: 'inline-block',
            padding: '13px 28px',
            backgroundColor: '#00236F',
            color: '#FFFFFF',
            borderRadius: '10px',
            fontSize: '14px',
            fontWeight: '600',
            textDecoration: 'none',
          }}
        >
          Create your first project
        </Link>

        <p style={{ fontSize: '12px', color: '#BBBBBB', marginTop: '16px' }}>
          Or go to{' '}
          <Link href="/pm/projects" style={{ color: '#00236F', textDecoration: 'none', fontWeight: '500' }}>
            Projects
          </Link>
          {' '}to manage existing ones
        </p>
      </div>
    </div>
  )
}

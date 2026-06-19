'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useConversations } from '@/hooks/useDirectMessages'
import ProjectBoard from './ProjectBoard'
import DirectMessagesPanel from './DirectMessagesPanel'

interface Props {
  projectId: string
  userId: string
}

export default function MessagesPage({ projectId, userId }: Props) {
  const [tab, setTab] = useState<'board' | 'dm'>('board')
  const [projectName, setProjectName] = useState('')
  const { conversations } = useConversations(projectId, userId)
  const totalUnread = conversations.reduce((sum, c) => sum + c.unread_count, 0)

  useEffect(() => {
    if (!projectId) return
    const supabase = createClient()
    supabase.from('projects').select('name').eq('id', projectId).single()
      .then(({ data }) => { if (data) setProjectName(data.name) })
  }, [projectId])

  function tabBtn(active: boolean): React.CSSProperties {
    return {
      flex: 1,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '6px',
      padding: '11px 0',
      fontSize: '14px',
      fontWeight: active ? 700 : 500,
      color: active ? '#00236F' : '#666666',
      backgroundColor: 'transparent',
      border: 'none',
      borderBottom: `2px solid ${active ? '#00236F' : 'transparent'}`,
      cursor: 'pointer',
      transition: 'color 0.15s, border-color 0.15s',
    }
  }

  return (
    <div
      className="h-[calc(100svh-120px)] md:h-full"
      style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
    >
      {/* Header */}
      <div style={{ backgroundColor: '#FFFFFF', borderBottom: '1px solid #EEEEEE', flexShrink: 0 }}>
        {projectName ? (
          <div style={{ padding: '10px 16px 4px', fontSize: '11px', fontWeight: 600, color: '#BBBBBB', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            {projectName}
          </div>
        ) : null}
        <div style={{ display: 'flex' }}>
          <button type="button" style={tabBtn(tab === 'board')} onClick={() => setTab('board')}>
            Project Board
          </button>
          <button type="button" style={tabBtn(tab === 'dm')} onClick={() => setTab('dm')}>
            Direct Messages
            {totalUnread > 0 && (
              <span style={{
                backgroundColor: '#E24B4A',
                color: '#FFFFFF',
                borderRadius: '10px',
                padding: '0 5px',
                fontSize: '10px',
                fontWeight: 700,
                lineHeight: '16px',
                minWidth: '16px',
                textAlign: 'center',
                display: 'inline-block',
              }}>
                {totalUnread}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Content */}
      <div style={{ display: 'flex', flex: 1, minHeight: 0, overflow: 'hidden' }}>
        {tab === 'board' ? (
          <ProjectBoard projectId={projectId} userId={userId} />
        ) : (
          <DirectMessagesPanel projectId={projectId} userId={userId} conversations={conversations} />
        )}
      </div>
    </div>
  )
}

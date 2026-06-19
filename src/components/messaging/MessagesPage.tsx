'use client'

import { useState } from 'react'
import ProjectBoard from './ProjectBoard'
import DirectMessagesPanel from './DirectMessagesPanel'

interface Props {
  projectId: string
  userId: string
}

export default function MessagesPage({ projectId, userId }: Props) {
  const [tab, setTab] = useState<'board' | 'dm'>('board')

  function tabStyle(active: boolean): React.CSSProperties {
    return {
      flex: 1,
      padding: '11px 0',
      fontSize: '14px',
      fontWeight: active ? 700 : 500,
      color: active ? '#00236F' : '#666666',
      backgroundColor: 'transparent',
      border: 'none',
      borderBottom: `2px solid ${active ? '#00236F' : 'transparent'}`,
      cursor: 'pointer',
      transition: 'all 0.15s',
    }
  }

  return (
    <div
      className="h-[calc(100svh-120px)] md:h-full"
      style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
    >
      {/* Tab bar */}
      <div
        style={{
          display: 'flex',
          borderBottom: '1px solid #EEEEEE',
          backgroundColor: '#FFFFFF',
          flexShrink: 0,
        }}
      >
        <button type="button" style={tabStyle(tab === 'board')} onClick={() => setTab('board')}>
          Project Board
        </button>
        <button type="button" style={tabStyle(tab === 'dm')} onClick={() => setTab('dm')}>
          Direct Messages
        </button>
      </div>

      {/* Content */}
      <div style={{ display: 'flex', flex: 1, minHeight: 0, overflow: 'hidden' }}>
        {tab === 'board' ? (
          <ProjectBoard projectId={projectId} userId={userId} />
        ) : (
          <DirectMessagesPanel projectId={projectId} userId={userId} />
        )}
      </div>
    </div>
  )
}

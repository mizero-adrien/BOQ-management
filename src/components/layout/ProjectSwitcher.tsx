'use client'

import { useState, useRef, useEffect } from 'react'
import { useActiveProjectContext } from '@/contexts/ActiveProjectContext'
import { formatRole } from '@/lib/utils/roleLabels'

export default function ProjectSwitcher() {
  const { activeProject, allProjects, loading, switchProject } = useActiveProjectContext()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', onOutside)
    return () => document.removeEventListener('mousedown', onOutside)
  }, [open])

  if (loading) {
    return (
      <div style={{ margin: '8px', padding: '10px 12px', borderRadius: '6px', backgroundColor: '#162535', height: '52px' }} />
    )
  }

  if (!activeProject && allProjects.length === 0) {
    return (
      <div style={{ margin: '8px', padding: '10px 12px', borderRadius: '6px', backgroundColor: '#162535' }}>
        <p style={{ fontSize: '12px', color: '#8FA3B3', margin: 0 }}>No active project</p>
      </div>
    )
  }

  return (
    <div ref={ref} style={{ position: 'relative', margin: '8px' }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', padding: '10px 12px',
          backgroundColor: '#162535', border: '1px solid #1A2E3D',
          borderRadius: '6px', cursor: 'pointer', textAlign: 'left',
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: '12px', fontWeight: 600, color: '#FFFFFF', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: '0 0 2px' }}>
            {activeProject?.project_name ?? 'Select project'}
          </p>
          <p style={{ fontSize: '11px', color: '#8FA3B3', margin: 0 }}>
            {activeProject ? formatRole(activeProject.user_role) : ''}
          </p>
        </div>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8FA3B3"
          strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          style={{ flexShrink: 0, marginLeft: '8px', transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.15s' }}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0,
          backgroundColor: '#1A2E3D', border: '1px solid #1A2E3D',
          borderRadius: '8px', boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
          zIndex: 200, overflow: 'hidden',
        }}>
          <p style={{ padding: '8px 12px 6px', fontSize: '10px', fontWeight: 600, color: '#4A6072', textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>
            Your projects
          </p>

          {allProjects.map((project) => {
            const isActive = project.project_id === activeProject?.project_id
            return (
              <ProjectRow
                key={project.project_id}
                project={project}
                isActive={isActive}
                onSelect={() => { setOpen(false); switchProject(project.project_id) }}
              />
            )
          })}

          <div style={{ borderTop: '1px solid #0D1F2D', padding: '8px 12px' }}>
            <p style={{ fontSize: '11px', color: '#4A6072', margin: 0, lineHeight: '1.5' }}>
              Ask your PM for an invite link to join another project.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

interface RowProps {
  project: { project_id: string; project_name: string; user_role: string; company_name: string }
  isActive: boolean
  onSelect: () => void
}

function ProjectRow({ project, isActive, onSelect }: RowProps) {
  const [hovered, setHovered] = useState(false)
  return (
    <button
      type="button"
      onClick={onSelect}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 12px', border: 'none', cursor: 'pointer', textAlign: 'left',
        backgroundColor: isActive ? '#1565D8' : hovered ? '#162535' : 'transparent',
        transition: 'background-color 0.1s',
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: '13px', fontWeight: isActive ? 600 : 400, color: '#FFFFFF', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: '0 0 2px' }}>
          {project.project_name}
        </p>
        <p style={{ fontSize: '11px', color: isActive ? 'rgba(255,255,255,0.7)' : '#8FA3B3', margin: 0 }}>
          {formatRole(project.user_role)} — {project.company_name}
        </p>
      </div>
      {isActive && (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginLeft: '8px' }}>
          <polyline points="20 6 9 17 4 12" />
        </svg>
      )}
    </button>
  )
}

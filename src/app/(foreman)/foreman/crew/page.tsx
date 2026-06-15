'use client'

import { useState, useEffect } from 'react'
import { useActiveProject } from '@/hooks/useActiveProject'
import { useProjectMembers } from '@/hooks/useProjectMembers'
import { createClient } from '@/lib/supabase/client'

interface AttendanceState {
  [userId: string]: { present: boolean; notes: string }
}

function MemberRow({
  member,
  state,
  onChange,
}: {
  member: { userId: string; fullName: string }
  state: { present: boolean; notes: string }
  onChange: (userId: string, field: 'present' | 'notes', value: boolean | string) => void
}) {
  const initials = member.fullName.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
  return (
    <div className="bg-white rounded-xl p-4 mb-2" style={{ border: '0.5px solid #EEEEEE' }}>
      <div className="flex items-center gap-3 mb-3">
        <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#E4E9FA' }}>
          <span className="text-xs font-bold" style={{ color: '#00236F' }}>{initials}</span>
        </div>
        <p className="text-sm font-medium flex-1" style={{ color: '#111111' }}>{member.fullName}</p>
        <div className="flex gap-2">
          <button type="button" onClick={() => onChange(member.userId, 'present', true)}
            className="px-3 py-1.5 rounded-full text-xs font-semibold"
            style={{ backgroundColor: state.present ? '#00236F' : '#F5F6FA', color: state.present ? '#FFFFFF' : '#666666' }}>
            Present
          </button>
          <button type="button" onClick={() => onChange(member.userId, 'present', false)}
            className="px-3 py-1.5 rounded-full text-xs font-semibold"
            style={{ backgroundColor: !state.present ? '#E24B4A' : '#F5F6FA', color: !state.present ? '#FFFFFF' : '#666666' }}>
            Absent
          </button>
        </div>
      </div>
      <input type="text" placeholder="Notes (optional)" value={state.notes}
        onChange={(e) => onChange(member.userId, 'notes', e.target.value)}
        className="w-full px-3 py-2 text-sm rounded-lg outline-none"
        style={{ backgroundColor: '#F5F6FA', border: '1px solid #EEEEEE', color: '#111111' }} />
    </div>
  )
}

export default function CrewPage() {
  const { project } = useActiveProject()
  const { members, loading } = useProjectMembers(project?.id)
  const engineers = members.filter((m) => m.role === 'engineer')

  const [attendance, setAttendance] = useState<AttendanceState>({})
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    const init: AttendanceState = {}
    engineers.forEach((e) => { init[e.userId] = { present: true, notes: '' } })
    setAttendance(init)
  }, [members]) // eslint-disable-line react-hooks/exhaustive-deps

  function handleChange(userId: string, field: 'present' | 'notes', value: boolean | string) {
    setAttendance((prev) => ({ ...prev, [userId]: { ...prev[userId], [field]: value } }))
  }

  async function handleSave() {
    setSubmitting(true)
    const presentCount = Object.values(attendance).filter((a) => a.present).length
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user && project) {
      const todayStr = new Date().toISOString().slice(0, 10)
      await supabase.from('daily_reports').upsert({
        project_id: project.id, engineer_id: user.id,
        report_date: todayStr, workers_count: presentCount,
        status: 'draft', progress_pct: 0,
      }, { onConflict: 'project_id,engineer_id,report_date' })
    }
    setSubmitting(false)
    setSuccess(true)
    setTimeout(() => setSuccess(false), 3000)
  }

  return (
    <div className="px-4 py-5 md:px-8 md:py-8" style={{ maxWidth: '640px', margin: '0 auto' }}>
      <h1 className="text-xl font-semibold mb-1" style={{ color: '#111111' }}>My Crew</h1>
      <p className="text-sm mb-5" style={{ color: '#666666' }}>
        {project?.name ?? 'Loading...'} — mark attendance for today
      </p>
      {loading ? (
        <div className="animate-pulse space-y-2">
          {[1, 2, 3].map((i) => <div key={i} className="h-20 rounded-xl" style={{ backgroundColor: '#EEEEEE' }} />)}
        </div>
      ) : engineers.length === 0 ? (
        <p className="text-sm text-center py-8" style={{ color: '#BBBBBB' }}>No engineers assigned to this project yet.</p>
      ) : (
        <>
          {engineers.map((m) => (
            <MemberRow key={m.userId} member={m} state={attendance[m.userId] ?? { present: true, notes: '' }} onChange={handleChange} />
          ))}
          <div className="mt-4 flex items-center gap-3">
            <button type="button" onClick={handleSave} disabled={submitting}
              className="flex-1 py-3.5 rounded-xl text-sm font-semibold text-white disabled:opacity-60"
              style={{ backgroundColor: '#00236F' }}>
              {submitting ? 'Saving...' : 'Save attendance'}
            </button>
            {success && <p className="text-sm" style={{ color: '#00236F' }}>Saved</p>}
          </div>
        </>
      )}
    </div>
  )
}

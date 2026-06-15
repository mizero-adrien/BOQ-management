'use client'

import { useEffect, useState } from 'react'
import { usePlanZones } from '@/hooks/usePlanZones'
import { toLocalDateString } from '@/lib/utils/calendar'
import type { Profile, Project } from '@/types/database'
import type { CreateTaskParams, TaskWithEngineer } from '@/hooks/usePMTasks'

interface TaskFormProps {
  selectedDate: Date
  projects: Project[]
  engineers: Profile[]
  onCreateTask: (p: CreateTaskParams) => Promise<TaskWithEngineer>
}

const INPUT_STYLE: React.CSSProperties = {
  backgroundColor: '#F5F6FA',
  border: '1px solid #EEEEEE',
  borderRadius: '8px',
  padding: '12px',
  fontSize: '14px',
  color: '#111111',
  width: '100%',
  outline: 'none',
}

export default function TaskForm({
  selectedDate,
  projects,
  engineers,
  onCreateTask,
}: TaskFormProps) {
  const [title, setTitle] = useState('')
  const [assignedTo, setAssignedTo] = useState('')
  const [projectId, setProjectId] = useState('')
  const [zoneId, setZoneId] = useState('')
  const [dueDate, setDueDate] = useState(() => toLocalDateString(selectedDate))
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const { zones } = usePlanZones(projectId || undefined)

  useEffect(() => {
    setDueDate(toLocalDateString(selectedDate))
  }, [selectedDate])

  useEffect(() => {
    setZoneId('')
  }, [projectId])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim() || !assignedTo || !projectId || !dueDate) return

    setSubmitting(true)
    setFormError(null)

    const engineer = engineers.find((eng) => eng.id === assignedTo)
    const zone = zones.find((z) => z.id === zoneId)

    try {
      await onCreateTask({
        projectId,
        assignedTo,
        zoneId: zoneId || null,
        title: title.trim(),
        description: description.trim() || null,
        dueDate,
        engineerName: engineer?.full_name ?? '',
        zoneName: zone?.name ?? null,
      })
      setTitle('')
      setAssignedTo('')
      setProjectId('')
      setZoneId('')
      setDescription('')
      setSuccess(true)
      setTimeout(() => setSuccess(false), 4000)
    } catch (err) {
      console.error('Create task error:', err)
      setFormError('Failed to create task. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      <h2 className="font-semibold mb-4" style={{ color: '#111111', fontSize: '16px' }}>
        New task
      </h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium" style={{ color: '#666666' }}>Task title</span>
          <input
            type="text"
            placeholder="e.g. Pour concrete on column B3"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            style={INPUT_STYLE}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium" style={{ color: '#666666' }}>Assign to</span>
          <select value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)} required style={INPUT_STYLE}>
            <option value="">Select engineer</option>
            {engineers.map((eng) => (
              <option key={eng.id} value={eng.id}>{eng.full_name}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium" style={{ color: '#666666' }}>Project</span>
          <select value={projectId} onChange={(e) => setProjectId(e.target.value)} required style={INPUT_STYLE}>
            <option value="">Select project</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </label>
        {projectId && (
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium" style={{ color: '#666666' }}>Zone (optional)</span>
            <select value={zoneId} onChange={(e) => setZoneId(e.target.value)} style={INPUT_STYLE}>
              <option value="">Select zone</option>
              {zones.map((z) => (
                <option key={z.id} value={z.id}>{z.name}</option>
              ))}
            </select>
          </label>
        )}
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium" style={{ color: '#666666' }}>Due date</span>
          <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} required style={INPUT_STYLE} />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium" style={{ color: '#666666' }}>Details</span>
          <textarea
            rows={3}
            placeholder="Add details about what needs to be done"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            style={{ ...INPUT_STYLE, resize: 'none' }}
          />
        </label>
        <button
          type="submit"
          disabled={submitting}
          className="w-full py-3 rounded-lg text-sm font-medium text-white"
          style={{ backgroundColor: '#00236F' }}
        >
          {submitting ? 'Creating...' : 'Create task'}
        </button>
        {success && (
          <p className="text-center text-sm" style={{ color: '#00236F' }}>
            Task created and engineer notified
          </p>
        )}
        {formError && (
          <p className="text-center text-sm" style={{ color: '#E24B4A' }}>
            {formError}
          </p>
        )}
      </form>
    </div>
  )
}

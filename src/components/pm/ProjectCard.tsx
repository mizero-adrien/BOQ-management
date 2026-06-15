import { useRouter } from 'next/navigation'
import type { Project, ProjectStatus } from '@/types/database'
import { formatDate } from '@/lib/utils'

function StatusBadge({ status }: { status: ProjectStatus }) {
  if (status === 'active') {
    return (
      <span
        className="text-xs font-medium px-2.5 py-1 rounded-full text-white flex-shrink-0"
        style={{ backgroundColor: '#00236F' }}
      >
        Active
      </span>
    )
  }
  if (status === 'completed') {
    return (
      <span
        className="text-xs font-medium px-2.5 py-1 rounded-full text-white flex-shrink-0"
        style={{ backgroundColor: '#111111' }}
      >
        Completed
      </span>
    )
  }
  return (
    <span
      className="text-xs font-medium px-2.5 py-1 rounded-full flex-shrink-0"
      style={{ color: '#666666', border: '0.5px solid #EEEEEE' }}
    >
      On hold
    </span>
  )
}

export default function ProjectCard({ project }: { project: Project }) {
  const router = useRouter()

  return (
    <div
      className="bg-white rounded-xl p-4 cursor-pointer hover:shadow-sm transition-shadow"
      style={{ border: '0.5px solid #EEEEEE' }}
      onClick={() => router.push(`/pm/projects/${project.id}`)}
    >
      <div className="flex items-start justify-between mb-2 gap-3">
        <div className="flex-1 min-w-0">
          <p
            className="font-semibold truncate"
            style={{ color: '#111111', fontSize: '15px' }}
          >
            {project.name}
          </p>
          <p className="text-sm mt-0.5 truncate" style={{ color: '#666666' }}>
            {project.client_name}
          </p>
          <p className="text-xs mt-0.5 truncate" style={{ color: '#BBBBBB' }}>
            {project.location}
          </p>
        </div>
        <StatusBadge status={project.status} />
      </div>

      <div className="mt-3">
        <div
          className="w-full rounded-full"
          style={{ height: '6px', backgroundColor: '#EEEEEE' }}
        >
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${project.overall_progress}%`,
              backgroundColor: '#00236F',
            }}
          />
        </div>
        <p className="text-xs mt-1" style={{ color: '#666666' }}>
          {project.overall_progress}% complete
        </p>
      </div>

      <p className="text-xs mt-3" style={{ color: '#BBBBBB' }}>
        {formatDate(project.start_date)} — {formatDate(project.expected_end_date)}
      </p>
    </div>
  )
}

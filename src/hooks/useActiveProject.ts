'use client'

import { useActiveProjectContext } from '@/contexts/ActiveProjectContext'

export function useActiveProject() {
  const { activeProject, loading } = useActiveProjectContext()

  return {
    project: activeProject ? {
      id: activeProject.project_id,
      name: activeProject.project_name,
      status: activeProject.project_status,
      location: activeProject.project_location,
      overall_progress: activeProject.overall_progress,
      role: activeProject.user_role,
      pm_id: activeProject.pm_id,
    } : null,
    loading,
  }
}

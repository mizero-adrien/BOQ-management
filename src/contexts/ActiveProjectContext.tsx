'use client'

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export interface UserProject {
  project_id: string
  project_name: string
  project_status: string
  project_location: string
  overall_progress: number
  user_role: string
  assigned_at: string
  company_name: string
  pm_name: string
  pm_id: string
}

interface ActiveProjectContextValue {
  activeProject: UserProject | null
  allProjects: UserProject[]
  loading: boolean
  switchProject: (projectId: string) => Promise<void>
  refreshProjects: () => Promise<void>
}

const ActiveProjectContext = createContext<ActiveProjectContextValue>({
  activeProject: null,
  allProjects: [],
  loading: true,
  switchProject: async () => {},
  refreshProjects: async () => {},
})

export function ActiveProjectProvider({ children }: { children: ReactNode }) {
  const [activeProject, setActiveProject] = useState<UserProject | null>(null)
  const [allProjects, setAllProjects] = useState<UserProject[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  const fetchProjects = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }

    const { data: projects, error } = await supabase
      .rpc('get_user_projects', { p_user_id: user.id })

    if (error) {
      console.error('[ActiveProjectContext]', error.message)
      setLoading(false)
      return
    }

    const userProjects = (projects ?? []) as UserProject[]
    setAllProjects(userProjects)

    if (userProjects.length === 0) {
      setActiveProject(null)
      setLoading(false)
      return
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('last_active_project_id')
      .eq('id', user.id)
      .single()

    const lastActiveId = profile?.last_active_project_id as string | null
    const lastActive = lastActiveId
      ? userProjects.find((p) => p.project_id === lastActiveId)
      : null

    setActiveProject(lastActive ?? userProjects[0])
    setLoading(false)
  }, [])

  useEffect(() => { fetchProjects() }, [fetchProjects])

  async function switchProject(projectId: string) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const target = allProjects.find((p) => p.project_id === projectId)
    if (!target) return

    await supabase.rpc('set_active_project', {
      p_user_id: user.id,
      p_project_id: projectId,
    })

    setActiveProject(target)

    const dashboardMap: Record<string, string> = {
      pm: '/pm/dashboard',
      engineer: '/dashboard',
      foreman: '/foreman/dashboard',
      qs: '/qs/dashboard',
      storekeeper: '/storekeeper/dashboard',
      procurement: '/procurement/dashboard',
      owner: `/owner/${projectId}`,
    }

    router.push(dashboardMap[target.user_role] ?? '/dashboard')
  }

  return (
    <ActiveProjectContext.Provider value={{
      activeProject,
      allProjects,
      loading,
      switchProject,
      refreshProjects: fetchProjects,
    }}>
      {children}
    </ActiveProjectContext.Provider>
  )
}

export function useActiveProjectContext() {
  return useContext(ActiveProjectContext)
}

'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Project, UserRole } from '@/types/database'

export interface ProjectMemberItem {
  userId: string
  role: UserRole
  fullName: string
  avatarUrl: string | null
}

export interface ProjectDetail extends Project {
  members: ProjectMemberItem[]
  reportsThisWeek: number
  openIssues: number
}

type RawMember = {
  user_id: string
  role: UserRole
  profile: { full_name: string; avatar_url: string | null } | null
}

export function useProjectDetail(projectId: string) {
  const [project, setProject] = useState<ProjectDetail | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!projectId) return
    let cancelled = false
    setLoading(true)

    async function load() {
      const supabase = createClient()

      const [projResult, membersResult, reportsResult, issuesResult] = await Promise.all([
        supabase.from('projects').select('*').eq('id', projectId).single(),
        supabase.from('project_members').select('user_id, role, profile:profiles!user_id(full_name, avatar_url)').eq('project_id', projectId),
        supabase.from('daily_reports').select('*', { count: 'exact', head: true })
          .eq('project_id', projectId)
          .gte('report_date', getWeekStart()),
        supabase.from('daily_reports').select('id').eq('project_id', projectId).neq('issues', null).neq('issues', ''),
      ])

      if (projResult.error || !projResult.data) {
        console.error('useProjectDetail: project fetch error:', projResult.error?.message)
        if (!cancelled) setLoading(false)
        return
      }
      if (cancelled) return

      const rawMembers = ((membersResult.data ?? []) as unknown as RawMember[]).map((m) => ({
        userId: m.user_id,
        role: m.role,
        fullName: m.profile?.full_name ?? 'Unknown',
        avatarUrl: m.profile?.avatar_url ?? null,
      }))

      setProject({
        ...(projResult.data as Project),
        members: rawMembers,
        reportsThisWeek: reportsResult.count ?? 0,
        openIssues: (issuesResult.data ?? []).length,
      })
      setLoading(false)
    }

    load()
    return () => { cancelled = true }
  }, [projectId])

  async function updateProject(updates: Partial<Pick<Project, 'name' | 'location' | 'client_name' | 'start_date' | 'expected_end_date' | 'status' | 'overall_progress' | 'plan_image_url'>>) {
    if (!project) return
    const supabase = createClient()
    const { data, error } = await supabase.from('projects').update(updates).eq('id', projectId).select().single()
    if (error) { console.error('useProjectDetail: update error:', error.message); return }
    if (data) setProject((prev) => prev ? { ...prev, ...(data as Project) } : prev)
  }

  return { project, loading, updateProject }
}

function getWeekStart(): string {
  const now = new Date()
  const day = now.getDay()
  const diff = now.getDate() - day + (day === 0 ? -6 : 1)
  const monday = new Date(now.setDate(diff))
  return monday.toISOString().split('T')[0]
}

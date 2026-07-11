'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/types/database'
import ProfileHeaderCard from '@/components/shared/profile/ProfileHeaderCard'
import ProfileDetailsCard from '@/components/shared/profile/ProfileDetailsCard'
import ProfileSecurityCard from '@/components/shared/profile/ProfileSecurityCard'

interface ProjectInfo {
  projectName: string | null
  companyName: string | null
  projectRole: string | null
}

export default function ProfilePage() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [email, setEmail] = useState('')
  const [projectInfo, setProjectInfo] = useState<ProjectInfo>({ projectName: null, companyName: null, projectRole: null })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }

      setEmail(user.email ?? '')

      const [profileRes, memberRes, companyMemberRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('project_members').select('role, project:projects!project_members_project_id_fkey(name)').eq('user_id', user.id).order('created_at', { ascending: false }).limit(1).maybeSingle(),
        supabase.from('company_members').select('company:companies!company_members_company_id_fkey(name)').eq('user_id', user.id).limit(1).maybeSingle(),
      ])

      if (profileRes.data) {
        const dbProfile = profileRes.data as Profile
        const metaRole = user.user_metadata?.role as string | undefined
        if (metaRole && metaRole !== dbProfile.role) {
          supabase.from('profiles').update({ role: metaRole }).eq('id', user.id).then(() => {})
          setProfile({ ...dbProfile, role: metaRole as Profile['role'] })
        } else {
          setProfile(dbProfile)
        }
      }

      type ProjectJoin = { role: string; project: { name: string } | null }
      type CompanyJoin = { company: { name: string } | null }

      const pm = memberRes.data as ProjectJoin | null
      const cm = companyMemberRes.data as CompanyJoin | null

      setProjectInfo({
        projectName: pm?.project?.name ?? null,
        companyName: cm?.company?.name ?? null,
        projectRole: pm?.role ?? null,
      })

      setLoading(false)
    }
    load()
  }, [])

  async function signOut() {
    const supabase = createClient()
    await supabase.auth.signOut({ scope: 'local' })
    router.replace('/login')
  }

  if (loading) {
    return (
      <div className="px-6 pt-12 pb-8" style={{ maxWidth: '600px', margin: '0 auto' }}>
        <div className="animate-pulse">
          <div className="rounded-2xl h-40 mb-5" style={{ backgroundColor: '#EEEEEE' }} />
          <div className="h-4 w-32 rounded mb-3" style={{ backgroundColor: '#EEEEEE' }} />
          <div className="rounded-xl h-40 mb-5" style={{ backgroundColor: '#EEEEEE' }} />
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="px-6 pt-12 text-center">
        <p style={{ color: '#666666' }}>Could not load profile.</p>
      </div>
    )
  }

  return (
    <div className="px-6 pb-10" style={{ maxWidth: '600px', margin: '0 auto', paddingTop: '48px' }}>
      <ProfileHeaderCard profile={profile} email={email} />

      <ProfileDetailsCard
        profile={profile}
        email={email}
        projectInfo={projectInfo}
        onNameUpdated={(name) => setProfile((p) => p ? { ...p, full_name: name } : p)}
      />

      <ProfileSecurityCard />

      {/* Sign out */}
      <div className="mb-5">
        <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#BBBBBB' }}>
          Account
        </p>
        <div className="bg-white rounded-xl overflow-hidden" style={{ border: '1px solid #EEEEEE' }}>
          <button
            type="button"
            onClick={signOut}
            className="w-full flex items-center gap-3 px-4 py-3.5"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#E24B4A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            <span style={{ fontSize: '14px', fontWeight: 500, color: '#E24B4A' }}>Sign out</span>
          </button>
        </div>
      </div>

      {/* App info */}
      <div className="text-center pb-4">
        <p style={{ fontSize: '12px', color: '#BBBBBB' }}>Construction Manager</p>
        <p style={{ fontSize: '12px', color: '#BBBBBB' }}>Version 1.0.0</p>
      </div>
    </div>
  )
}

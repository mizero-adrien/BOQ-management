'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast } from '@/lib/toast'
import { saveOfflineReport } from '@/lib/offlineReports'
import type { Profile, Project } from '@/types/database'

interface SubmitData {
  project: Project
  profile: Profile
  userId: string
  zoneId: string | null
  workersCount: number
  progressPct: number
  weather: string | null
  notes: string
  issues: string
  photos: File[]
}

export function useSubmitReport() {
  const router = useRouter()
  const supabase = createClient()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(data: SubmitData) {
    setError(null)
    setSubmitting(true)

    // Offline path — save to IndexedDB and let useSyncPendingReports replay it when online
    if (!navigator.onLine) {
      try {
        const photoData = await Promise.all(
          data.photos.map(async (file) => ({
            name: file.name,
            type: file.type,
            data: await file.arrayBuffer(),
          }))
        )
        await saveOfflineReport({
          id: crypto.randomUUID(),
          savedAt: new Date().toISOString(),
          reportDate: new Date().toISOString().split('T')[0],
          projectId: data.project.id,
          projectName: data.project.name,
          pmId: data.project.pm_id,
          userId: data.userId,
          engineerName: data.profile.full_name,
          zoneId: data.zoneId,
          workersCount: data.workersCount,
          progressPct: data.progressPct,
          weather: data.weather,
          notes: data.notes,
          issues: data.issues,
          photos: photoData,
        })
        toast.success('Saved offline', 'Report queued — will sync when you reconnect')
        router.push('/dashboard')
      } catch {
        setError('Could not save report offline. Please try again.')
      }
      setSubmitting(false)
      return
    }

    try {
      const today = new Date().toISOString().split('T')[0]

      // upsert handles the case where a draft was saved earlier for today
      const { data: report, error: reportError } = await supabase
        .from('daily_reports')
        .upsert(
          {
            project_id: data.project.id,
            engineer_id: data.userId,
            zone_id: data.zoneId,
            report_date: today,
            workers_count: data.workersCount,
            progress_pct: data.progressPct,
            weather: data.weather,
            notes: data.notes || null,
            issues: data.issues || null,
            status: 'submitted',
            submitted_at: new Date().toISOString(),
          },
          { onConflict: 'project_id,engineer_id,report_date' }
        )
        .select('id')
        .single()

      if (reportError || !report) {
        setError('Something went wrong. Please try again.')
        setSubmitting(false)
        return
      }

      for (const file of data.photos) {
        const timestamp = Date.now()
        const path = `${data.project.id}/${report.id}/${timestamp}-${file.name}`

        const { error: uploadError } = await supabase.storage
          .from('report-photos')
          .upload(path, file)

        if (uploadError) continue

        const { data: urlData } = await supabase.storage
          .from('report-photos')
          .getPublicUrl(path)

        await supabase.from('report_photos').insert({
          report_id: report.id,
          url: urlData.publicUrl,
          file_size_kb: Math.round(file.size / 1024),
        })
      }

      await supabase.from('notifications').insert({
        user_id: data.project.pm_id,
        project_id: data.project.id,
        type: 'report_submitted',
        title: `${data.profile.full_name} submitted a report`,
        body: data.issues
          ? `Issues: ${data.issues.slice(0, 80)}`
          : `${data.workersCount} workers · ${data.progressPct}% progress`,
        read: false,
        action_url: `/pm/reports`,
      })

      toast.success('Report submitted', 'Your daily report has been saved')
      router.push('/dashboard')
      router.refresh()
    } catch {
      setError('Something went wrong. Please try again.')
      setSubmitting(false)
    }
  }

  return { submit, submitting, error, clearError: () => setError(null) }
}

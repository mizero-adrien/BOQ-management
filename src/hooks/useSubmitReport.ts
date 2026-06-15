'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
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

    try {
      const today = new Date().toISOString().split('T')[0]

      const { data: report, error: reportError } = await supabase
        .from('daily_reports')
        .insert({
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
        })
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

      router.push('/dashboard')
      router.refresh()
    } catch {
      setError('Something went wrong. Please try again.')
      setSubmitting(false)
    }
  }

  return { submit, submitting, error, clearError: () => setError(null) }
}

'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getOfflineReports, deleteOfflineReport } from '@/lib/offlineReports'
import { toast } from '@/lib/toast'

export function useSyncPendingReports() {
  const [pendingCount, setPendingCount] = useState(0)
  const [syncing, setSyncing] = useState(false)

  const refreshCount = useCallback(async () => {
    const reports = await getOfflineReports()
    setPendingCount(reports.length)
    return reports
  }, [])

  const syncAll = useCallback(async () => {
    const reports = await refreshCount()
    if (reports.length === 0 || syncing) return
    setSyncing(true)

    const supabase = createClient()
    let synced = 0

    for (const pending of reports) {
      try {
        const { data: report, error: reportError } = await supabase
          .from('daily_reports')
          .upsert(
            {
              project_id: pending.projectId,
              engineer_id: pending.userId,
              zone_id: pending.zoneId,
              report_date: pending.reportDate,
              workers_count: pending.workersCount,
              progress_pct: pending.progressPct,
              weather: pending.weather,
              notes: pending.notes || null,
              issues: pending.issues || null,
              status: 'submitted',
              submitted_at: new Date().toISOString(),
            },
            { onConflict: 'project_id,engineer_id,report_date' }
          )
          .select('id')
          .single()

        if (reportError || !report) continue

        for (const photo of pending.photos) {
          const blob = new Blob([photo.data], { type: photo.type })
          const file = new File([blob], photo.name, { type: photo.type })
          const path = `${pending.projectId}/${report.id}/${Date.now()}-${photo.name}`

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
            file_size_kb: Math.round(blob.size / 1024),
          })
        }

        await supabase.from('notifications').insert({
          user_id: pending.pmId,
          project_id: pending.projectId,
          type: 'report_submitted',
          title: `${pending.engineerName} submitted a report`,
          body: pending.issues
            ? `Issues: ${pending.issues.slice(0, 80)}`
            : `${pending.workersCount} workers · ${pending.progressPct}% progress`,
          read: false,
          action_url: `/pm/reports`,
        })

        await deleteOfflineReport(pending.id)
        synced++
      } catch {
        // leave in queue, will retry on next online event
      }
    }

    setSyncing(false)
    await refreshCount()

    if (synced > 0) {
      toast.success(
        `${synced} report${synced > 1 ? 's' : ''} synced`,
        'Your offline reports have been submitted'
      )
    }
  }, [syncing, refreshCount])

  useEffect(() => {
    refreshCount()

    function handleOnline() {
      syncAll()
    }

    window.addEventListener('online', handleOnline)

    // If already online on mount, attempt sync in case reports from a previous session are queued
    if (navigator.onLine) {
      syncAll()
    }

    return () => window.removeEventListener('online', handleOnline)
  }, []) // intentionally empty — we only want this to run once on mount

  return { pendingCount, syncing, syncAll }
}

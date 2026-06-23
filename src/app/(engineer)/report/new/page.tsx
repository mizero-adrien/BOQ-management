'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useActiveProject } from '@/hooks/useActiveProject'
import { useProfile } from '@/hooks/useProfile'
import { useTodayReport } from '@/hooks/useTodayReport'
import { usePlanZones } from '@/hooks/usePlanZones'
import { useSubmitReport } from '@/hooks/useSubmitReport'
import { createClient } from '@/lib/supabase/client'
import { toast } from '@/lib/toast'
import AlreadySubmitted from '@/components/report/AlreadySubmitted'
import StepIndicator from '@/components/report/StepIndicator'
import ZoneProgressStep from '@/components/report/ZoneProgressStep'
import WorkersWeatherStep from '@/components/report/WorkersWeatherStep'
import PhotosStep from '@/components/report/PhotosStep'
import IssuesNotesStep from '@/components/report/IssuesNotesStep'
import FormNavigation from '@/components/report/FormNavigation'

interface ReportFormState {
  zoneId: string | null
  zoneName: string
  progressPct: number
  workersCount: number
  weather: string | null
  photos: File[]
  issues: string
  notes: string
}

type DraftData = Omit<ReportFormState, 'photos'> & { step: number }

const initialForm: ReportFormState = {
  zoneId: null,
  zoneName: '',
  progressPct: 0,
  workersCount: 0,
  weather: null,
  photos: [],
  issues: '',
  notes: '',
}

function draftKey(projectId: string): string {
  const today = new Date().toISOString().slice(0, 10)
  return `report_draft_${projectId}_${today}`
}

function readDraft(projectId: string): DraftData | null {
  try {
    const raw = localStorage.getItem(draftKey(projectId))
    return raw ? (JSON.parse(raw) as DraftData) : null
  } catch {
    return null
  }
}

function writeDraft(projectId: string, data: DraftData) {
  try { localStorage.setItem(draftKey(projectId), JSON.stringify(data)) } catch {}
}

function clearDraft(projectId: string) {
  try { localStorage.removeItem(draftKey(projectId)) } catch {}
}

export default function NewReportPage() {
  const router = useRouter()
  const supabase = createClient()
  const { project, loading: projectLoading } = useActiveProject()
  const { profile, loading: profileLoading } = useProfile()
  const { submitted, loading: reportLoading } = useTodayReport(project?.id, profile?.id)
  const { zones } = usePlanZones(project?.id)
  const { submit, submitting, error } = useSubmitReport()

  const [step, setStep] = useState(1)
  const [stepDir, setStepDir] = useState<'fwd' | 'bwd'>('fwd')
  const [form, setForm] = useState<ReportFormState>(initialForm)
  const [savingDraft, setSavingDraft] = useState(false)
  const [draftRestored, setDraftRestored] = useState(false)

  // Restore draft once project is known
  useEffect(() => {
    if (!project) return
    const saved = readDraft(project.id)
    if (!saved) return
    setForm((f) => ({
      ...f,
      zoneId: saved.zoneId,
      zoneName: saved.zoneName,
      progressPct: saved.progressPct,
      workersCount: saved.workersCount,
      weather: saved.weather,
      issues: saved.issues,
      notes: saved.notes,
    }))
    setStep(saved.step ?? 1)
    setDraftRestored(true)
  }, [project?.id])

  // Autosave on every change (debounced 600ms); photos excluded — not serialisable
  useEffect(() => {
    if (!project) return
    const t = setTimeout(() => {
      const { photos: _, ...rest } = form
      writeDraft(project.id, { ...rest, step })
    }, 600)
    return () => clearTimeout(t)
  }, [form, step, project?.id])

  // Clear draft once today's report is confirmed submitted
  useEffect(() => {
    if (submitted && project) clearDraft(project.id)
  }, [submitted, project?.id])

  useEffect(() => {
    if (error) toast.error('Failed to submit report', error)
  }, [error])

  function update<K extends keyof ReportFormState>(k: K, v: ReportFormState[K]) {
    setForm((p) => ({ ...p, [k]: v }))
  }

  if (projectLoading || profileLoading || reportLoading) {
    return <div className="min-h-screen animate-pulse" style={{ backgroundColor: '#F5F6FA' }} />
  }

  if (submitted) {
    return <AlreadySubmitted />
  }

  function go(next: number) {
    setStepDir(next > step ? 'fwd' : 'bwd')
    setStep(next)
  }

  const zoneName = zones.find((z) => z.id === form.zoneId)?.name ?? form.zoneName

  async function handleSaveDraft() {
    if (!project || !profile) return
    setSavingDraft(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const todayStr = new Date().toISOString().slice(0, 10)
      await supabase.from('daily_reports').upsert(
        {
          project_id: project.id,
          engineer_id: user.id,
          report_date: todayStr,
          workers_count: form.workersCount,
          progress_pct: form.progressPct,
          weather: form.weather,
          notes: form.notes || null,
          issues: form.issues || null,
          zone_id: form.zoneId || null,
          status: 'draft',
        },
        { onConflict: 'project_id,engineer_id,report_date' }
      )
    } catch (err) {
      console.error('[report] draft save error:', err)
    } finally {
      setSavingDraft(false)
      if (project) clearDraft(project.id)
      router.push('/dashboard')
    }
  }

  async function handleSubmit() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || !project || !profile) return
    await submit({
      project,
      profile,
      userId: user.id,
      zoneId: form.zoneId,
      workersCount: form.workersCount,
      progressPct: form.progressPct,
      weather: form.weather,
      notes: form.notes,
      issues: form.issues,
      photos: form.photos,
    })
  }

  return (
    <div style={{ backgroundColor: '#F5F6FA' }}>
      {/* Header */}
      <div className="bg-white pt-12 pb-3 px-4 border-b flex items-center" style={{ borderColor: '#EEEEEE' }}>
        <button type="button" onClick={() => { step === 1 ? router.push('/dashboard') : go(step - 1) }} className="flex items-center justify-center w-8 h-8 -ml-1" aria-label="Go back">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#111111" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m15 18-6-6 6-6" />
          </svg>
        </button>
        <h1 className="flex-1 text-center text-base font-semibold -ml-8" style={{ color: '#111111' }}>Submit Report</h1>
        {step === 4 && (
          <button type="button" onClick={handleSaveDraft} disabled={savingDraft} className="text-sm" style={{ color: '#666666' }}>
            {savingDraft ? 'Saving...' : 'Save draft'}
          </button>
        )}
        {step < 4 && <div className="w-8" />}
      </div>

      <StepIndicator currentStep={step} />

      {draftRestored && (
        <div className="mx-4 mt-3 px-3 py-2 rounded-lg flex items-center justify-between gap-2"
          style={{ backgroundColor: '#E4E9FA', border: '1px solid #C8D4F8' }}>
          <p className="text-xs" style={{ color: '#00236F' }}>Draft restored — your progress from earlier today was saved.</p>
          <button type="button" onClick={() => setDraftRestored(false)} className="flex-shrink-0" style={{ color: '#00236F' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      )}

      <div key={step} style={{ animation: `${stepDir === 'fwd' ? 'step-in-right' : 'step-in-left'} 0.22s ease both` }}>
        {step === 1 && <ZoneProgressStep zones={zones} zoneId={form.zoneId} zoneName={form.zoneName} progressPct={form.progressPct} onZoneIdChange={(v) => update('zoneId', v)} onZoneNameChange={(v) => update('zoneName', v)} onProgressChange={(v) => update('progressPct', v)} />}
        {step === 2 && <WorkersWeatherStep workersCount={form.workersCount} weather={form.weather} onWorkersChange={(v) => update('workersCount', v)} onWeatherChange={(v) => update('weather', v)} />}
        {step === 3 && <PhotosStep photos={form.photos} onPhotosChange={(v) => update('photos', v)} />}
        {step === 4 && <IssuesNotesStep issues={form.issues} notes={form.notes} zoneName={zoneName} progressPct={form.progressPct} workersCount={form.workersCount} weather={form.weather} photosCount={form.photos.length} onIssuesChange={(v) => update('issues', v)} onNotesChange={(v) => update('notes', v)} />}
      </div>

      <FormNavigation step={step} submitting={submitting} onNext={() => go(step + 1)} onBack={() => go(step - 1)} onSubmit={handleSubmit} />
    </div>
  )
}

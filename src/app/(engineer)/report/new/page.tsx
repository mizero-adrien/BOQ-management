'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useActiveProject } from '@/hooks/useActiveProject'
import { useProfile } from '@/hooks/useProfile'
import { useTodayReport } from '@/hooks/useTodayReport'
import { usePlanZones } from '@/hooks/usePlanZones'
import { useSubmitReport } from '@/hooks/useSubmitReport'
import { createClient } from '@/lib/supabase/client'
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

export default function NewReportPage() {
  const router = useRouter()
  const supabase = createClient()
  const { project, loading: projectLoading } = useActiveProject()
  const { profile, loading: profileLoading } = useProfile()
  const { submitted, loading: reportLoading } = useTodayReport(project?.id, profile?.id)
  const { zones } = usePlanZones(project?.id)
  const { submit, submitting, error } = useSubmitReport()

  const [step, setStep] = useState(1)
  const [form, setForm] = useState<ReportFormState>(initialForm)

  function update<K extends keyof ReportFormState>(k: K, v: ReportFormState[K]) {
    setForm((p) => ({ ...p, [k]: v }))
  }

  if (projectLoading || profileLoading || reportLoading) {
    return <div className="min-h-screen animate-pulse" style={{ backgroundColor: '#F5F6FA' }} />
  }

  if (submitted) {
    return <AlreadySubmitted />
  }

  function go(next: number) { setStep(next) }

  const zoneName = zones.find((z) => z.id === form.zoneId)?.name ?? form.zoneName

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
        {step === 4 && <button type="button" onClick={() => router.push('/dashboard')} className="text-sm" style={{ color: '#666666' }}>Save draft</button>}
        {step < 4 && <div className="w-8" />}
      </div>

      <StepIndicator currentStep={step} />

      {error && (
        <div className="mx-4 mt-4 px-4 py-3 rounded-lg border text-sm" style={{ borderColor: '#E24B4A', backgroundColor: '#FFF5F5', color: '#E24B4A' }}>
          {error}
        </div>
      )}

      {step === 1 && <ZoneProgressStep zones={zones} zoneId={form.zoneId} zoneName={form.zoneName} progressPct={form.progressPct} onZoneIdChange={(v) => update('zoneId', v)} onZoneNameChange={(v) => update('zoneName', v)} onProgressChange={(v) => update('progressPct', v)} />}
      {step === 2 && <WorkersWeatherStep workersCount={form.workersCount} weather={form.weather} onWorkersChange={(v) => update('workersCount', v)} onWeatherChange={(v) => update('weather', v)} />}
      {step === 3 && <PhotosStep photos={form.photos} onPhotosChange={(v) => update('photos', v)} />}
      {step === 4 && <IssuesNotesStep issues={form.issues} notes={form.notes} zoneName={zoneName} progressPct={form.progressPct} workersCount={form.workersCount} weather={form.weather} photosCount={form.photos.length} onIssuesChange={(v) => update('issues', v)} onNotesChange={(v) => update('notes', v)} />}

      <FormNavigation step={step} submitting={submitting} onNext={() => go(step + 1)} onBack={() => go(step - 1)} onSubmit={handleSubmit} />
    </div>
  )
}

'use client'

import { Suspense, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import StepIndicator from '@/components/onboarding/StepIndicator'
import CompanyStep from '@/components/onboarding/CompanyStep'
import ProjectStep from '@/components/onboarding/ProjectStep'
import InviteStep from '@/components/onboarding/InviteStep'
import DemoProjectBanner from '@/components/onboarding/DemoProjectBanner'

export const dynamic = 'force-dynamic'

type Step = 1 | 2 | 3
type ExistingMembership = { company_id: string }

function OnboardingContent() {
  const router = useRouter()
  const [step, setStep] = useState<Step>(1)
  const [companyId, setCompanyId] = useState('')
  const [projectId, setProjectId] = useState('')
  const [demoLoaded, setDemoLoaded] = useState(false)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    async function checkExistingCompany() {
      try {
        const supabase = createClient()
        // getSession reads from local cache — no network call
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) { setChecking(false); return }

        const userId = session.user.id

        const { data } = await supabase
          .from('company_members')
          .select('company_id')
          .eq('user_id', userId)
          .limit(1)
          .maybeSingle()

        if (data) {
          // User already has a company — fix their metadata so the middleware
          // stops redirecting them to onboarding on future logins
          await supabase.auth.updateUser({
            data: { has_company: true, company_id: (data as ExistingMembership).company_id },
          }).catch(() => {})
          router.replace('/redirect')
          return
        }
      } catch {
        // network error — show the form anyway so the user is not stuck
      }
      setChecking(false)
    }
    checkExistingCompany()
  }, [router])

  if (checking) {
    return (
      <div className="flex flex-col gap-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="rounded-xl animate-pulse"
            style={{ height: '56px', backgroundColor: '#EEEEEE' }}
          />
        ))}
      </div>
    )
  }

  return (
    <>
      <StepIndicator currentStep={step} />
      {step === 1 && (
        <CompanyStep
          onComplete={(id) => {
            setCompanyId(id)
            setStep(2)
          }}
        />
      )}
      {step === 2 && (
        <>
          <DemoProjectBanner
            companyId={companyId}
            onLoaded={(id) => {
              setProjectId(id)
              setDemoLoaded(true)
              setStep(3)
            }}
          />
          <ProjectStep
            companyId={companyId}
            onComplete={(id) => {
              setProjectId(id)
              setStep(3)
            }}
          />
        </>
      )}
      {step === 3 && (
        <InviteStep companyId={companyId} projectId={projectId} demoLoaded={demoLoaded} />
      )}
    </>
  )
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={<div />}>
      <OnboardingContent />
    </Suspense>
  )
}

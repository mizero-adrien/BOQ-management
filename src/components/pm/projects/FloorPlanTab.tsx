'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Project, PlanZone } from '@/types/database'
import PlanUpload from '@/components/pm/floorplan/PlanUpload'
import ZoneDrawingCanvas from '@/components/pm/floorplan/ZoneDrawingCanvas'

interface Props {
  project: Project
  onPlanUpdated: (url: string) => void
}

export default function FloorPlanTab({ project, onPlanUpdated }: Props) {
  const [zones, setZones] = useState<PlanZone[]>([])
  const [replacing, setReplacing] = useState(false)
  const [currentPlan, setCurrentPlan] = useState(project.plan_image_url ?? '')

  useEffect(() => {
    if (!currentPlan) return
    const supabase = createClient()
    supabase.from('plan_zones').select('*').eq('project_id', project.id)
      .then(({ data }) => setZones((data as PlanZone[]) ?? []))
  }, [project.id, currentPlan])

  function handlePlanUploaded(url: string) {
    setCurrentPlan(url)
    setReplacing(false)
    onPlanUpdated(url)
  }

  if (!currentPlan || replacing) {
    return <PlanUpload projectId={project.id} onPlanUploaded={handlePlanUploaded} />
  }

  return (
    <div>
      <ZoneDrawingCanvas
        projectId={project.id}
        planImageUrl={currentPlan}
        zones={zones}
        onZoneAdded={(z) => setZones((prev) => [...prev, z])}
        onZoneDeleted={(id) => setZones((prev) => prev.filter((z) => z.id !== id))}
      />
      <button type="button" onClick={() => setReplacing(true)}
        className="mt-3 px-3 py-2 text-xs rounded-lg"
        style={{ border: '1px solid #EEEEEE', color: '#666666' }}>
        Replace image
      </button>
    </div>
  )
}

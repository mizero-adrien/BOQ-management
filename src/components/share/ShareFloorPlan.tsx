import type { PlanZone } from '@/types/database'

const ZONE_STATUS_COLOR: Record<string, string> = {
  not_started:   '#BBBBBB',
  in_progress:   '#778EDE',
  done:          '#00236F',
  issue_flagged: '#E24B4A',
}

interface Props {
  planImageUrl: string | null
  zones: PlanZone[]
}

export default function ShareFloorPlan({ planImageUrl, zones }: Props) {
  if (!planImageUrl) {
    return (
      <div className="bg-white rounded-xl p-5 mb-6" style={{ border: '0.5px solid #EEEEEE' }}>
        <p className="text-sm font-semibold mb-4" style={{ color: '#111111' }}>Floor Plan</p>
        <div className="flex flex-col items-center justify-center py-10 rounded-xl"
          style={{ border: '1.5px dashed #EEEEEE' }}>
          <p className="text-sm" style={{ color: '#BBBBBB' }}>No floor plan uploaded</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl p-5 mb-6" style={{ border: '0.5px solid #EEEEEE' }}>
      <p className="text-sm font-semibold mb-4" style={{ color: '#111111' }}>Floor Plan</p>
      <div className="relative rounded-lg overflow-hidden" style={{ aspectRatio: '4/3', backgroundColor: '#F5F6FA' }}>
        <img
          src={planImageUrl}
          alt="Floor plan"
          style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
        />
        {zones.map((zone) => {
          const color = ZONE_STATUS_COLOR[zone.status] ?? '#BBBBBB'
          return (
            <div
              key={zone.id}
              style={{
                position: 'absolute',
                left: `${zone.x_pct}%`,
                top: `${zone.y_pct}%`,
                width: `${zone.width_pct}%`,
                height: `${zone.height_pct}%`,
                backgroundColor: `${color}30`,
                border: `2px solid ${color}`,
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'flex-start',
                padding: '2px 4px',
                overflow: 'hidden',
              }}
            >
              <span style={{ fontSize: '9px', fontWeight: 600, color, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {zone.name}
              </span>
            </div>
          )
        })}
      </div>
      {zones.length > 0 && (
        <div className="flex flex-wrap gap-3 mt-3">
          {[
            { status: 'done', label: 'Done' },
            { status: 'in_progress', label: 'In progress' },
            { status: 'not_started', label: 'Not started' },
            { status: 'issue_flagged', label: 'Issue' },
          ].map(({ status, label }) => {
            const count = zones.filter((z) => z.status === status).length
            if (count === 0) return null
            return (
              <div key={status} className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: ZONE_STATUS_COLOR[status] }} />
                <span className="text-xs" style={{ color: '#666666' }}>{label}: {count}</span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

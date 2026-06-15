import type { PlanZone } from '@/types/database'

export default function ZoneProgressStep({
  zones,
  zoneId,
  zoneName,
  progressPct,
  onZoneIdChange,
  onZoneNameChange,
  onProgressChange,
}: {
  zones: PlanZone[]
  zoneId: string | null
  zoneName: string
  progressPct: number
  onZoneIdChange: (value: string | null) => void
  onZoneNameChange: (value: string) => void
  onProgressChange: (value: number) => void
}) {
  return (
    <div className="px-4 pt-5 space-y-6">
      <div>
        <p
          className="text-xs font-semibold uppercase tracking-wider mb-3"
          style={{ color: '#666666' }}
        >
          Where did you work today?
        </p>

        <label className="block text-sm font-medium mb-1.5" style={{ color: '#111111' }}>
          Work zone
        </label>

        {zones.length > 0 ? (
          <select
            value={zoneId ?? ''}
            onChange={(e) => onZoneIdChange(e.target.value || null)}
            className="w-full px-4 py-3 text-sm rounded-lg outline-none appearance-none transition-colors"
            style={{
              backgroundColor: '#F5F6FA',
              border: '1px solid #EEEEEE',
              color: '#111111',
            }}
          >
            <option value="">Select a zone</option>
            {zones.map((zone) => (
              <option key={zone.id} value={zone.id}>
                {zone.name}
              </option>
            ))}
          </select>
        ) : (
          <input
            type="text"
            value={zoneName}
            onChange={(e) => onZoneNameChange(e.target.value)}
            placeholder="Zone name (optional)"
            className="w-full px-4 py-3 text-sm rounded-lg outline-none transition-colors"
            style={{
              backgroundColor: '#F5F6FA',
              border: '1px solid #EEEEEE',
              color: '#111111',
            }}
          />
        )}
      </div>

      <div>
        <label className="block text-sm font-medium mb-4" style={{ color: '#111111' }}>
          Progress on this zone
        </label>

        <p
          className="text-5xl font-bold text-center mb-4"
          style={{ color: '#00236F' }}
        >
          {progressPct}%
        </p>

        <div className="relative h-8 flex items-center">
          <input
            type="range"
            min={0}
            max={100}
            step={1}
            value={progressPct}
            onChange={(e) => onProgressChange(Number(e.target.value))}
            className="w-full h-2 rounded-full appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to right, #00236F 0%, #00236F ${progressPct}%, #EEEEEE ${progressPct}%, #EEEEEE 100%)`,
            }}
          />
        </div>

        <div className="flex justify-between mt-1">
          <span className="text-xs" style={{ color: '#BBBBBB' }}>0%</span>
          <span className="text-xs" style={{ color: '#BBBBBB' }}>100%</span>
        </div>
      </div>
    </div>
  )
}

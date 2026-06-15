export default function IssuesNotesStep({
  issues,
  notes,
  zoneName,
  progressPct,
  workersCount,
  weather,
  photosCount,
  onIssuesChange,
  onNotesChange,
}: {
  issues: string
  notes: string
  zoneName: string
  progressPct: number
  workersCount: number
  weather: string | null
  photosCount: number
  onIssuesChange: (value: string) => void
  onNotesChange: (value: string) => void
}) {
  const weatherLabel = weather
    ? weather.charAt(0).toUpperCase() + weather.slice(1)
    : 'Not set'

  return (
    <div className="px-4 pt-5 space-y-5">
      <div>
        <label className="text-sm font-medium mb-1 flex items-center gap-1.5" style={{ color: '#111111' }}>
          Any issues today?
          <span className="text-xs" style={{ color: '#BBBBBB' }}>Optional</span>
        </label>
        <textarea
          value={issues}
          onChange={(e) => onIssuesChange(e.target.value)}
          rows={4}
          placeholder="Describe any problems, delays, or blockers on site"
          className="w-full px-4 py-3 text-sm rounded-lg outline-none resize-none transition-colors"
          style={{
            backgroundColor: '#F5F6FA',
            border: '1px solid #EEEEEE',
            color: '#111111',
          }}
        />
      </div>

      <div>
        <label className="text-sm font-medium mb-1 flex items-center gap-1.5" style={{ color: '#111111' }}>
          General notes
          <span className="text-xs" style={{ color: '#BBBBBB' }}>Optional</span>
        </label>
        <textarea
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
          rows={4}
          placeholder="Any other notes for the project manager"
          className="w-full px-4 py-3 text-sm rounded-lg outline-none resize-none transition-colors"
          style={{
            backgroundColor: '#F5F6FA',
            border: '1px solid #EEEEEE',
            color: '#111111',
          }}
        />
      </div>

      <div
        className="bg-white rounded-xl border p-4"
        style={{ borderColor: '#EEEEEE' }}
      >
        <p
          className="text-sm font-semibold mb-3"
          style={{ color: '#111111' }}
        >
          Report summary
        </p>
        <div className="space-y-2">
          <SummaryRow label="Zone" value={zoneName || 'None'} />
          <SummaryRow label="Progress" value={`${progressPct}%`} />
          <SummaryRow label="Workers" value={String(workersCount)} />
          <SummaryRow label="Weather" value={weatherLabel} />
          <SummaryRow label="Photos" value={`${photosCount} photo(s)`} />
        </div>
      </div>
    </div>
  )
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm" style={{ color: '#BBBBBB' }}>{label}</span>
      <span className="text-sm font-medium" style={{ color: '#111111' }}>{value}</span>
    </div>
  )
}

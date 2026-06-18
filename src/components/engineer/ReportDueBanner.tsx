export default function ReportDueBanner() {
  const hour = new Date().getHours()
  const isLate = hour >= 16

  return (
    <div
      className="rounded-xl px-4 py-3.5 border"
      style={{
        backgroundColor: isLate ? '#FFF5F5' : '#E4E9FA',
        borderColor: isLate ? '#E24B4A' : '#C8D4F8',
      }}
    >
      <p
        className="text-sm font-semibold"
        style={{ color: isLate ? '#B91C1C' : '#00236F' }}
      >
        {isLate
          ? 'Report overdue -- submit now'
          : 'Daily report due before 5:00 PM'}
      </p>
      <p
        className="text-xs mt-0.5"
        style={{ color: isLate ? '#EF4444' : '#778EDE' }}
      >
        {isLate
          ? 'Your project manager is waiting for your update'
          : 'Tap the button below when you are ready'}
      </p>
    </div>
  )
}

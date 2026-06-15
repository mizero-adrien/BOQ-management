const weatherOptions = ['Sunny', 'Cloudy', 'Rainy', 'Windy', 'Stormy']

export default function WorkersWeatherStep({
  workersCount,
  weather,
  onWorkersChange,
  onWeatherChange,
}: {
  workersCount: number
  weather: string | null
  onWorkersChange: (value: number) => void
  onWeatherChange: (value: string | null) => void
}) {
  return (
    <div className="px-4 pt-5 space-y-6">
      <div className="text-center">
        <label className="block text-sm font-medium mb-4 text-left" style={{ color: '#111111' }}>
          Workers on site today
        </label>

        <div className="flex items-center justify-center gap-6">
          <button
            type="button"
            onClick={() => onWorkersChange(Math.max(0, workersCount - 1))}
            disabled={workersCount <= 0}
            className="w-14 h-14 rounded-full flex items-center justify-center text-2xl font-semibold transition-colors disabled:opacity-30"
            style={{
              backgroundColor: '#FFFFFF',
              border: '1.5px solid #EEEEEE',
              color: '#111111',
            }}
            aria-label="Decrease workers"
          >
            -
          </button>

          <span
            className="text-5xl font-bold w-20 text-center"
            style={{ color: '#111111' }}
          >
            {workersCount}
          </span>

          <button
            type="button"
            onClick={() => onWorkersChange(workersCount + 1)}
            className="w-14 h-14 rounded-full flex items-center justify-center text-2xl font-semibold transition-colors"
            style={{
              backgroundColor: '#FFFFFF',
              border: '1.5px solid #EEEEEE',
              color: '#111111',
            }}
            aria-label="Increase workers"
          >
            +
          </button>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-3" style={{ color: '#111111' }}>
          Weather conditions
        </label>

        <div className="flex flex-wrap gap-2">
          {weatherOptions.map((option) => {
            const isSelected = weather === option.toLowerCase()
            return (
              <button
                key={option}
                type="button"
                onClick={() =>
                  onWeatherChange(isSelected ? null : option.toLowerCase())
                }
                className="px-5 py-2 rounded-full text-sm font-medium transition-colors"
                style={{
                  backgroundColor: isSelected ? '#00236F' : '#FFFFFF',
                  border: isSelected
                    ? '1px solid #00236F'
                    : '0.5px solid #EEEEEE',
                  color: isSelected ? '#FFFFFF' : '#666666',
                }}
              >
                {option}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

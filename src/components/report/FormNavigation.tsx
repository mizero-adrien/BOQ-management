export default function FormNavigation({
  step,
  submitting,
  onNext,
  onBack,
  onSubmit,
}: {
  step: number
  submitting: boolean
  onNext: () => void
  onBack: () => void
  onSubmit: () => void
}) {
  const nextLabels = [
    '',
    'workers and weather',
    'photos',
    'issues and notes',
  ]

  if (step < 4) {
    return (
      <div className="px-4 pt-6 pb-8">
        <button
          type="button"
          onClick={onNext}
          className="w-full py-4 rounded-xl text-sm font-semibold text-white transition-opacity active:opacity-80"
          style={{ backgroundColor: '#00236F' }}
        >
          Next &mdash; {nextLabels[step]}
        </button>
        {step > 1 && (
          <button
            type="button"
            onClick={onBack}
            className="w-full py-3.5 rounded-xl text-sm font-semibold mt-3 transition-opacity active:opacity-80"
            style={{
              color: '#00236F',
              border: '1.5px solid #00236F',
              backgroundColor: '#FFFFFF',
            }}
          >
            Back
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="px-4 pt-6 pb-8">
      <button
        type="button"
        onClick={onSubmit}
        disabled={submitting}
        className="w-full py-4 rounded-xl text-sm font-semibold text-white transition-opacity disabled:opacity-60"
        style={{ backgroundColor: '#00236F' }}
      >
        {submitting ? 'Submitting...' : 'Submit report'}
      </button>
      <button
        type="button"
        onClick={onBack}
        className="w-full py-3.5 rounded-xl text-sm font-semibold mt-3 transition-opacity active:opacity-80"
        style={{
          color: '#00236F',
          border: '1.5px solid #00236F',
          backgroundColor: '#FFFFFF',
        }}
      >
        Back
      </button>
    </div>
  )
}

export default function StepIndicator({
  currentStep,
}: {
  currentStep: number
}) {
  const labels = [
    'Zone and progress',
    'Workers and weather',
    'Photos',
    'Issues and notes',
  ]

  return (
    <div className="px-4 py-4" style={{ backgroundColor: '#FFFFFF' }}>
      <div className="flex items-center gap-1 mb-2">
        {[1, 2, 3, 4].map((step) => (
          <div key={step} className="flex items-center flex-1">
            <div
              className="h-1 rounded-full flex-1 transition-colors"
              style={{
                backgroundColor:
                  step <= currentStep ? '#00236F' : '#EEEEEE',
              }}
            />
            {step < 4 && (
              <div
                className="w-1 h-1 rounded-full flex-shrink-0"
                style={{
                  backgroundColor:
                    step < currentStep ? '#00236F' : '#EEEEEE',
                }}
              />
            )}
          </div>
        ))}
      </div>
      <p className="text-xs text-center" style={{ color: '#666666' }}>
        Step {currentStep} of 4 &mdash; {labels[currentStep - 1]}
      </p>
    </div>
  )
}

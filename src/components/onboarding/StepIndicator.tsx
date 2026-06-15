const LABELS = ['Company setup', 'First project', 'Invite team']

export default function StepIndicator({ currentStep }: { currentStep: number }) {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-1.5 mb-2.5">
        {[1, 2, 3].map((step) => (
          <div
            key={step}
            className="h-1 flex-1 rounded-full transition-colors"
            style={{
              backgroundColor: step <= currentStep ? '#00236F' : '#EEEEEE',
            }}
          />
        ))}
      </div>
      <p className="text-xs text-center" style={{ color: '#888888' }}>
        Step {currentStep} of 3 — {LABELS[currentStep - 1]}
      </p>
    </div>
  )
}

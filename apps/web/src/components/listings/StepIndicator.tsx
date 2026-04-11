import { FORM_STEPS, type FormStep } from "@/lib/listing-form";

type Props = {
  currentStep: FormStep;
  completedSteps: FormStep[];
};

export default function StepIndicator({
  currentStep,
  completedSteps,
}: Props) {
  return (
    <div className="flex items-center mb-8">
      {FORM_STEPS.map((step, i) => {
        const isActive = step.id === currentStep;
        const isComplete = completedSteps.includes(step.id as FormStep);
        const isLast = i === FORM_STEPS.length - 1;

        return (
          <div key={step.id} className="flex items-center flex-1 last:flex-none">
            <div className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-all flex-shrink-0"
                style={{
                  backgroundColor: isComplete
                    ? "var(--kunda-green)"
                    : isActive
                    ? "var(--kunda-green-light)"
                    : "#f1efe8",
                  color: isComplete
                    ? "white"
                    : isActive
                    ? "var(--kunda-green)"
                    : "#aaa",
                }}
              >
                {isComplete ? (
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <path
                      d="M5 12l4 4L19 7"
                      stroke="white"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                ) : (
                  i + 1
                )}
              </div>
              <span
                className="text-xs font-medium hidden sm:block"
                style={{
                  color: isActive
                    ? "var(--kunda-green)"
                    : isComplete
                    ? "#555"
                    : "#aaa",
                }}
              >
                {step.label}
              </span>
            </div>
            {!isLast && (
              <div
                className="flex-1 h-px mx-3"
                style={{
                  backgroundColor: isComplete
                    ? "var(--kunda-green)"
                    : "#e5e7eb",
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

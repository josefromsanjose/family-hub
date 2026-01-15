import { useCallback, useState } from "react";

interface WizardStep {
  id: string;
  title: string;
  optional?: boolean;
}

interface UseWizardOptions<T> {
  steps: WizardStep[];
  initialData: T;
  onComplete: (data: T) => void;
}

export function useWizard<T>({
  steps,
  initialData,
  onComplete,
}: UseWizardOptions<T>) {
  const [currentStep, setCurrentStep] = useState(0);
  const [data, setData] = useState<T>(initialData);

  const step = steps[currentStep];
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === steps.length - 1;
  const progress = ((currentStep + 1) / steps.length) * 100;

  const next = useCallback(() => {
    if (isLastStep) {
      onComplete(data);
    } else {
      setCurrentStep((prev) => prev + 1);
    }
  }, [isLastStep, data, onComplete]);

  const back = useCallback(() => {
    if (!isFirstStep) {
      setCurrentStep((prev) => prev - 1);
    }
  }, [isFirstStep]);

  const skip = useCallback(() => {
    if (step?.optional && !isLastStep) {
      setCurrentStep((prev) => prev + 1);
    }
  }, [step, isLastStep]);

  const updateData = useCallback((updates: Partial<T>) => {
    setData((prev) => ({ ...prev, ...updates }));
  }, []);

  const reset = useCallback(() => {
    setCurrentStep(0);
    setData(initialData);
  }, [initialData]);

  return {
    step,
    currentStep,
    totalSteps: steps.length,
    progress,
    data,
    isFirstStep,
    isLastStep,
    isOptional: step?.optional ?? false,
    next,
    back,
    skip,
    updateData,
    reset,
  };
}

export type WorkflowStep = 
  | "INIT"
  | "PARSED"
  | "ESTIMATED"
  | "MATCHED"
  | "CONFIRMED"
  | "COMPLETED"
  | "REVIEWED";

export interface WorkflowState {
  currentStep: WorkflowStep;
  bookingId?: string;
  driver?: any;
  fare?: any;
  reviewSentiment?: any;
}

export function getNextStep(current: WorkflowStep): WorkflowStep {
  const steps: WorkflowStep[] = ["INIT", "PARSED", "ESTIMATED", "MATCHED", "CONFIRMED", "COMPLETED", "REVIEWED"];
  const idx = steps.indexOf(current);
  if (idx < steps.length - 1) return steps[idx + 1];
  return current;
}

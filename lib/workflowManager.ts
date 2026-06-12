export type WorkflowStep = 
  | "INIT"
  | "PARSED"
  | "ESTIMATED"
  | "CONFIRMED"
  | "REVIEWED"
  // BookingStatus equivalents:
  | "REQUESTED"
  | "MATCHING"
  | "DRIVER_ASSIGNED"
  | "ACCEPTED"
  | "DRIVER_ARRIVING"
  | "OTP_PENDING"
  | "OTP_VERIFIED"
  | "TRIP_STARTED"
  | "TRIP_COMPLETED"
  | "REVIEW_PENDING"
  | "CLOSED"
  | "CANCELLED"
  | "DISPUTED";

export interface WorkflowState {
  currentStep: WorkflowStep;
  bookingId?: string;
  driver?: any;
  fare?: any;
  reviewSentiment?: any;
}

export function getNextStep(current: WorkflowStep): WorkflowStep {
  const steps: WorkflowStep[] = ["INIT", "PARSED", "ESTIMATED", "MATCHING", "CONFIRMED", "TRIP_COMPLETED", "REVIEWED"];
  const idx = steps.indexOf(current);
  if (idx < steps.length - 1) return steps[idx + 1];
  return current;
}

export interface NLPEntities {
  pickup: string | null;
  destination: string | null;
  date: string | null;
  time: string | null;
  serviceType: "DRIVER_ONLY" | "CAR_WITH_DRIVER" | null;
  passengers: string | number | null;
  priority: string | null;
  specialRequests: string | null;
  reviewText?: string | null;
}

export interface NLPResponse {
  intent: string;
  entities: NLPEntities;
  missingFields: string[];
  response: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "bot" | "system";
  content: string;
  timestamp: number;
  enrichedData?: {
    fareEstimate?: any;
    driverRecommendations?: any[];
    bookingConfirmed?: boolean;
    reviewAnalyzed?: any;
    recommendations?: any[];
  };
}

import { WorkflowState } from "../lib/workflowManager";

export interface ChatContext {
  messages: ChatMessage[];
  currentEntities: NLPEntities;
  workflowState?: WorkflowState;
  customerId?: string;
}

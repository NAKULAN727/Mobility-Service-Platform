// ─── Enums ────────────────────────────────────────────────────────────────────

export type VehicleType = "SEDAN" | "SUV" | "LUXURY" | "VAN" | "HATCHBACK";

export type AvailabilityStatus =
  | "AVAILABLE"
  | "BOOKED"
  | "MAINTENANCE"
  | "OUT_OF_SERVICE"
  | "DECOMMISSIONED";

export type BookingType = "DRIVER_ONLY" | "VEHICLE_AND_DRIVER";

export type BookingStatus =
  | "DRAFT"
  | "REQUESTED"
  | "MATCHING"
  | "ACCEPTED"
  | "ARRIVING"
  | "ARRIVED"
  | "ACTIVE"
  | "COMPLETED"
  | "CANCELLED"
  | "DISPUTED";

export type PaymentMethod = "UPI" | "CARD" | "CASH";
export type PaymentStatus = "PENDING" | "SUCCESS" | "FAILED";

// ─── Entity Interfaces ────────────────────────────────────────────────────────

export interface Vehicle {
  id: string;
  vehicleNumber: string;
  vehicleType: string;
  model: string;
  seatingCapacity: number;
  availabilityStatus: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface BookingLocation {
  id?: string;
  pickupLocation: string;
  destinationLocation: string;
  distance: number;
  estimatedDuration: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface BookingPayment {
  id?: string;
  bookingId?: string;
  amount?: number;
  paymentMethod: string;
  paymentStatus: string;
  transactionId: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface Booking {
  id: string;
  customerId?: string;
  driverId?: string | null;
  vehicleId?: string | null;
  bookingType: string;
  bookingStatus: string;
  bookingDate: string;
  bookingTime: string;
  fareAmount: number;
  otpCode: string;
  location: BookingLocation;
  payment: BookingPayment | null;
  vehicle?: Vehicle | null;
  actualStartTime?: string | null;
  actualEndTime?: string | null;
  createdAt: string;
  updatedAt?: string;
}

// ─── Payload Wrappers ─────────────────────────────────────────────────────────

export interface UserError {
  field: string[];
  message: string;
  code: string;
}

export interface BookingPayload {
  success: boolean;
  errors: UserError[];
  booking: Booking | null;
}

export interface VehiclePayload {
  success: boolean;
  errors: UserError[];
  vehicle: Vehicle | null;
}

export interface PaymentPayload {
  success: boolean;
  errors: UserError[];
  payment: BookingPayment | null;
}

// ─── GraphQL Pagination ───────────────────────────────────────────────────────

export interface PageInfo {
  hasNextPage: boolean;
  hasPreviousPage?: boolean;
  startCursor?: string | null;
  endCursor: string | null;
}

export interface BookingEdge {
  node: Booking;
  cursor: string;
}

export interface BookingConnection {
  edges: BookingEdge[];
  pageInfo: PageInfo;
  totalCount: number;
}

// ─── Fare Estimator ───────────────────────────────────────────────────────────

export interface FareEstimate {
  baseFare: number;
  distanceFare: number;
  serviceFee: number;
  totalFare: number;
  ratePerKm: number;
  distanceKm: number;
  estimatedDurationMin: number;
  vehicleType: string;
  bookingType: string;
}

export interface FareBreakdown {
  baseFare: number;
  distFare: number;
  serviceFee: number;
  total: number;
  ratePerKm: number;
}

// ─── Input Types ──────────────────────────────────────────────────────────────

export interface BookingCreateInput {
  customerId: string;
  bookingType: string;
  vehicleId?: string | null;
  pickupLocation: string;
  destinationLocation: string;
  distance: number;
  estimatedDuration: number;
  bookingDate: string;
  bookingTime: string;
  fareAmount: number;
}

export interface VehicleCreateInput {
  vehicleNumber: string;
  vehicleType: string;
  model: string;
  seatingCapacity: number;
  availabilityStatus?: string;
}

export interface VehicleUpdateInput {
  vehicleNumber?: string;
  vehicleType?: string;
  model?: string;
  seatingCapacity?: number;
  availabilityStatus?: string;
}

// ─── Status Groups ────────────────────────────────────────────────────────────

export const ACTIVE_BOOKING_STATES = [
  "REQUESTED",
  "MATCHING",
  "ACCEPTED",
  "ARRIVING",
  "ARRIVED",
  "ACTIVE",
];

export function isActiveBooking(status: string): boolean {
  return ACTIVE_BOOKING_STATES.includes(status.toUpperCase());
}

export function isTerminalBooking(status: string): boolean {
  return ["COMPLETED", "CANCELLED", "DISPUTED"].includes(status.toUpperCase());
}

// ─── UI Metadata ──────────────────────────────────────────────────────────────

export const VEHICLE_UI_META: Record<
  string,
  { icon: string; label: string; desc: string; color: string; rate: number }
> = {
  SEDAN:     { icon: "SEDAN", label: "Sedan",   desc: "Comfortable 4-seater",  color: "#10b981", rate: 3.50 },
  SUV:       { icon: "SUV", label: "SUV",     desc: "Spacious 6-seater",      color: "#3b82f6", rate: 4.20 },
  LUXURY:    { icon: "LUXURY", label: "Luxury",  desc: "Premium executive car",  color: "#a78bfa", rate: 5.80 },
  VAN:       { icon: "VAN", label: "Van",     desc: "Group travel up to 12",  color: "#f59e0b", rate: 5.00 },
  HATCHBACK: { icon: "HATCHBACK", label: "Compact", desc: "Eco city car",           color: "#2dd4bf", rate: 2.80 },
};

export const VEHICLE_RATES: Record<string, string> = {
  SEDAN: "$3.50/km",
  SUV: "$4.20/km",
  LUXURY: "$5.80/km",
  VAN: "$5.00/km",
  HATCHBACK: "$2.80/km",
};

export const STATUS_COLORS: Record<
  string,
  { bg: string; text: string; border: string; dot: string }
> = {
  AVAILABLE:      { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200/60", dot: "bg-emerald-600" },
  BOOKED:         { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200/60", dot: "bg-amber-600" },
  MAINTENANCE:    { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200/60", dot: "bg-blue-600" },
  OUT_OF_SERVICE: { bg: "bg-red-50",   text: "text-red-700",   border: "border-red-200/60",   dot: "bg-red-600"   },
  DECOMMISSIONED: { bg: "bg-slate-100",     text: "text-slate-600",  border: "border-slate-200",     dot: "bg-slate-500"  },
  COMPLETED:      { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200/60", dot: "bg-emerald-600" },
  CANCELLED:      { bg: "bg-red-50",    text: "text-red-700",   border: "border-red-200/60",   dot: "bg-red-600"   },
  REQUESTED:      { bg: "bg-amber-50",  text: "text-amber-700", border: "border-amber-200/60", dot: "bg-amber-600" },
  MATCHING:       { bg: "bg-amber-50",  text: "text-amber-700", border: "border-amber-200/60", dot: "bg-amber-600" },
  ACCEPTED:       { bg: "bg-amber-50",  text: "text-amber-700", border: "border-amber-200/60", dot: "bg-amber-600" },
  ARRIVING:       { bg: "bg-amber-50",  text: "text-amber-700", border: "border-amber-200/60", dot: "bg-amber-600" },
  ARRIVED:        { bg: "bg-amber-50",  text: "text-amber-700", border: "border-amber-200/60", dot: "bg-amber-600" },
  ACTIVE:         { bg: "bg-amber-50",  text: "text-amber-700", border: "border-amber-200/60", dot: "bg-amber-600" },
  DISPUTED:       { bg: "bg-red-50",   text: "text-red-700",   border: "border-red-200/60",   dot: "bg-red-600"   },
  DRAFT:          { bg: "bg-slate-100",  text: "text-slate-600",  border: "border-slate-200",     dot: "bg-slate-500"  },
};


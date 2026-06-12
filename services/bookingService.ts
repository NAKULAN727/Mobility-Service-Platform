/**
 * bookingService.ts
 * Client-side booking business logic: fare calculation, validation helpers,
 * booking payload builder, and status transition utilities.
 */

import { VEHICLE_UI_META } from "../lib/types";

// ─── Known Route Lookup ───────────────────────────────────────────────────────

export const KNOWN_ROUTES: Record<string, { dist: number; dur: number }> = {
  "JFK International Airport, New York|Times Square, Manhattan, NY":  { dist: 28.5, dur: 45 },
  "Brooklyn Bridge Park, New York|LaGuardia Airport, New York":        { dist: 16.8, dur: 30 },
  "Grand Central Terminal, New York|Metropolitan Museum of Art, NY":   { dist: 4.2,  dur: 15 },
  "JFK International Airport Terminal 4, NY|Times Square Manhattan, NY": { dist: 28.5, dur: 45 },
  "Grand Central Terminal, NY|Metropolitan Museum of Art, NY":           { dist: 4.2,  dur: 15 },
  "Brooklyn Bridge Park, NY|LaGuardia Airport Terminal B, NY":           { dist: 16.8, dur: 30 },
};

export const QUICK_ROUTES = [
  {
    label: "Airport → City",
    from: "JFK International Airport, New York",
    to: "Times Square, Manhattan, NY",
    dist: 28.5,
    dur: 45,
    fare: 105,
  },
  {
    label: "Bridge → Airport",
    from: "Brooklyn Bridge Park, New York",
    to: "LaGuardia Airport, New York",
    dist: 16.8,
    dur: 30,
    fare: 64,
  },
  {
    label: "Station → Museum",
    from: "Grand Central Terminal, New York",
    to: "Metropolitan Museum of Art, NY",
    dist: 4.2,
    dur: 15,
    fare: 22,
  },
];

// ─── Fare Calculation ─────────────────────────────────────────────────────────

export interface FareBreakdown {
  baseFare: number;
  distFare: number;
  serviceFee: number;
  total: number;
  ratePerKm: number;
}

const BASE_FARE = 5;
const SERVICE_PCT = 0.05;
const DRIVER_ONLY_RATE = 2.0;

export function calculateFare(
  distKm: number,
  vehicleType: string,
  serviceType: string
): FareBreakdown {
  const ratePerKm =
    serviceType === "CAR_WITH_DRIVER"
      ? (VEHICLE_UI_META[vehicleType.toUpperCase()]?.rate ?? 3.5)
      : DRIVER_ONLY_RATE;

  const distFare = parseFloat((distKm * ratePerKm).toFixed(2));
  const serviceFee = parseFloat(((BASE_FARE + distFare) * SERVICE_PCT).toFixed(2));
  const total = parseFloat((BASE_FARE + distFare + serviceFee).toFixed(2));

  return { baseFare: BASE_FARE, distFare, serviceFee, total, ratePerKm };
}

export function getRouteInfo(from: string, to: string): { dist: number; dur: number } {
  const key = `${from}|${to}`;
  return KNOWN_ROUTES[key] ?? { dist: 12, dur: 28 };
}

// ─── Input Validation ─────────────────────────────────────────────────────────

const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)(:([0-5]\d))?$/;

export interface ValidationErrors {
  [field: string]: string;
}

export function validateRouteStep(from: string, to: string): ValidationErrors {
  const errors: ValidationErrors = {};
  if (!from.trim() || from.trim().length < 5)
    errors.from = "Enter a pickup address (minimum 5 characters)";
  if (!to.trim() || to.trim().length < 5)
    errors.to = "Enter a destination (minimum 5 characters)";
  if (from.trim() && to.trim() && from.trim() === to.trim())
    errors.to = "Destination must be different from pickup";
  return errors;
}

export function validateDetailsStep(
  date: string,
  time: string,
  serviceType: string,
  selectedVehicleId: string
): ValidationErrors {
  const errors: ValidationErrors = {};
  if (!date) errors.date = "Please select a date";
  if (!time) errors.time = "Please select a time";
  if (!TIME_REGEX.test(time) && time) errors.time = "Time must be in HH:MM format";
  if (serviceType === "CAR_WITH_DRIVER" && !selectedVehicleId)
    errors.vehicle = "Please select a vehicle to continue";
  return errors;
}

// ─── Status Helpers ───────────────────────────────────────────────────────────

export const TRIP_STEPS = [
    { key: "REQUESTED",      label: "Requested",    desc: "Your ride is requested" },
    { key: "DRIVER_ASSIGNED",label: "Driver found", desc: "A driver accepted your ride" },
    { key: "DRIVER_ARRIVING",label: "Arriving",     desc: "Driver is on the way" },
    { key: "TRIP_STARTED",   label: "In ride",      desc: "You're on your way!" },
    { key: "TRIP_COMPLETED", label: "Completed",    desc: "You've arrived" },
  ];

export function getTripStepIndex(status: string): number {
  const s = status.toUpperCase();
  if (s === "REQUESTED" || s === "MATCHING") return 0;
  if (s === "DRIVER_ASSIGNED" || s === "ACCEPTED") return 1;
  if (s === "DRIVER_ARRIVING" || s === "OTP_PENDING" || s === "OTP_VERIFIED") return 2;
  if (s === "TRIP_STARTED") return 3;
  if (s === "TRIP_COMPLETED" || s === "REVIEW_PENDING" || s === "CLOSED") return 4;
  return -1;
}

export function canCancelBooking(status: string): boolean {
  return !["TRIP_COMPLETED", "REVIEW_PENDING", "CLOSED", "CANCELLED", "DISPUTED"].includes(
    status.toUpperCase()
  );
}

export function getStatusLabel(status: string): string {
  const statusMap: Record<string, string> = {
    REQUESTED:       "Requested",
    MATCHING:        "Finding Driver",
    DRIVER_ASSIGNED: "Driver Found",
    ACCEPTED:        "Driver Accepted",
    DRIVER_ARRIVING: "Driver Arriving",
    OTP_PENDING:     "Awaiting OTP",
    OTP_VERIFIED:    "OTP Verified",
    TRIP_STARTED:    "In Ride",
    TRIP_COMPLETED:  "Ride Finished",
    REVIEW_PENDING:  "Pending Review",
    CLOSED:          "Completed",
    CANCELLED:       "Cancelled",
    DISPUTED:        "Disputed",
  };
  return statusMap[status.toUpperCase()] ?? status;
}

// ─── GraphQL Fetch Helper ─────────────────────────────────────────────────────

export async function gqlFetch<T = any>(
  query: string,
  variables: Record<string, unknown>,
  authHeader: string
): Promise<{ data?: T; errors?: { message: string }[] }> {
  const res = await fetch("/api/graphql", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: authHeader,
    },
    body: JSON.stringify({ query, variables }),
  });
  return res.json();
}

// ─── Session Storage (deprecated — bookings persisted in PostgreSQL) ──────────

export function persistBookingToSession(_booking: any): void {
  // No-op: booking state is now persisted in the DB via GraphQL mutations.
}

export function getBookingFromSession(_id: string): any | null {
  // No-op: use GraphQL getBookingHistory query to retrieve bookings from DB.
  return null;
}

import { z } from "zod";

const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;
const PLATE_REGEX = /^[A-Z0-9-]{3,12}$/i;

// ── Booking form ──────────────────────────────────────────────────────────────
export const BookingFormSchema = z
  .object({
    serviceType: z.enum(["CAR_WITH_DRIVER", "DRIVER_ONLY"]),
    pickupLocation: z.string().min(5, "Enter a valid pickup address (min 5 chars)"),
    destinationLocation: z.string().min(5, "Enter a valid destination (min 5 chars)"),
    bookingDate: z.string().min(1, "Select a date"),
    bookingTime: z.string().regex(TIME_REGEX, "Enter a valid time in HH:MM format"),
    vehicleId: z.string().optional(),
    paymentMethod: z.enum(["CARD", "UPI", "CASH"]),
    distance: z.number().positive(),
    estimatedDuration: z.number().positive(),
    fareAmount: z.number().positive(),
  })
  .refine((d) => d.pickupLocation.trim() !== d.destinationLocation.trim(), {
    message: "Destination must differ from pickup",
    path: ["destinationLocation"],
  })
  .refine((d) => (d.serviceType === "CAR_WITH_DRIVER" ? !!d.vehicleId : true), {
    message: "Select a vehicle to continue",
    path: ["vehicleId"],
  });

export type BookingFormValues = z.infer<typeof BookingFormSchema>;

// ── Vehicle admin form ────────────────────────────────────────────────────────
export const VehicleFormSchema = z.object({
  registrationNumber: z.string().regex(PLATE_REGEX, "Enter a valid plate (3-12 alphanumeric chars)"),
  make: z.string().optional(),
  vehicleType: z.enum(["SEDAN", "SUV", "LUXURY", "VAN", "HATCHBACK"]),
  model: z.string().min(2, "Model name must be at least 2 characters"),
  seatingCapacity: z.coerce
    .number()
    .int()
    .min(1, "Capacity must be at least 1")
    .max(50, "Capacity seems too large"),
  availabilityStatus: z.enum(["AVAILABLE", "BOOKED", "MAINTENANCE", "OUT_OF_SERVICE", "DECOMMISSIONED"]),
});

export type VehicleFormValues = z.infer<typeof VehicleFormSchema>;

// ── Quick-book schema ─────────────────────────────────────────────────────────
export const QuickBookSchema = z
  .object({
    pickupLocation: z.string().min(5, "Enter a valid pickup address"),
    destinationLocation: z.string().min(5, "Enter a valid destination"),
    serviceType: z.enum(["CAR_WITH_DRIVER", "DRIVER_ONLY"]),
  })
  .refine((d) => d.pickupLocation.trim() !== d.destinationLocation.trim(), {
    message: "Destination must differ from pickup",
    path: ["destinationLocation"],
  });

export type QuickBookValues = z.infer<typeof QuickBookSchema>;

// ── Fare engine ───────────────────────────────────────────────────────────────
export const VEHICLE_RATES: Record<string, number> = {
  SEDAN: 3.5,
  SUV: 4.2,
  LUXURY: 5.8,
  VAN: 5.0,
  HATCHBACK: 2.8,
};

export const DRIVER_ONLY_RATE = 2.0;
export const BASE_FARE = 5;
export const SERVICE_FEE_PCT = 0.05;

export function calculateFare(
  distanceKm: number,
  vehicleType: string,
  serviceType: "CAR_WITH_DRIVER" | "DRIVER_ONLY"
) {
  const ratePerKm =
    serviceType === "CAR_WITH_DRIVER"
      ? (VEHICLE_RATES[vehicleType.toUpperCase()] ?? 3.5)
      : DRIVER_ONLY_RATE;
  const baseFare = BASE_FARE;
  const distFare = parseFloat((distanceKm * ratePerKm).toFixed(2));
  const serviceFee = parseFloat(((baseFare + distFare) * SERVICE_FEE_PCT).toFixed(2));
  const total = parseFloat((baseFare + distFare + serviceFee).toFixed(2));
  return { baseFare, distFare, serviceFee, total, ratePerKm };
}

// ── Known routes ──────────────────────────────────────────────────────────────
export const KNOWN_ROUTES: Record<string, { dist: number; dur: number }> = {
  "JFK International Airport, New York|Times Square, Manhattan, NY": { dist: 28.5, dur: 45 },
  "Brooklyn Bridge Park, New York|LaGuardia Airport, New York": { dist: 16.8, dur: 30 },
  "Grand Central Terminal, New York|Metropolitan Museum of Art, NY": { dist: 4.2, dur: 15 },
};

export function resolveRoute(from: string, to: string) {
  return KNOWN_ROUTES[`${from}|${to}`] ?? { dist: 12, dur: 28 };
}

export const POPULAR_ROUTES = [
  { label: "Airport → City",    from: "JFK International Airport, New York", to: "Times Square, Manhattan, NY",       dist: 28.5, dur: 45, fare: 105 },
  { label: "Bridge → Airport",  from: "Brooklyn Bridge Park, New York",      to: "LaGuardia Airport, New York",       dist: 16.8, dur: 30, fare: 64  },
  { label: "Station → Museum",  from: "Grand Central Terminal, New York",    to: "Metropolitan Museum of Art, NY",    dist: 4.2,  dur: 15, fare: 22  },
];

/**
 * vehicleService.ts
 * Client-side vehicle helpers: type metadata, availability checks,
 * status badge color mapping, and vehicle SVG path data.
 */

import { VEHICLE_UI_META, VEHICLE_RATES } from "../lib/types";

// ─── Re-exports for convenience ───────────────────────────────────────────────

export { VEHICLE_UI_META, VEHICLE_RATES };

// ─── Availability Helpers ─────────────────────────────────────────────────────

export function isVehicleAvailable(status: string): boolean {
  return status.toUpperCase() === "AVAILABLE";
}

export function getAvailabilityLabel(status: string): string {
  const labels: Record<string, string> = {
    AVAILABLE:      "Available",
    BOOKED:         "Booked",
    MAINTENANCE:    "In Maintenance",
    OUT_OF_SERVICE: "Out of Service",
    DECOMMISSIONED: "Decommissioned",
  };
  return labels[status.toUpperCase()] ?? status;
}

// ─── SVG Path Data per Vehicle Type ──────────────────────────────────────────

export interface VehicleSvgConfig {
  pathD: string;
  accentColor: string;
  glowColor: string;
  wheelLX: string;
  wheelRX: string;
  windowPath?: string;
}

export function getVehicleSvgConfig(type: string): VehicleSvgConfig {
  const normType = type.toUpperCase();

  switch (normType) {
    case "SUV":
      return {
        pathD: "M10 50 L25 42 L65 42 L85 46 L95 55 L95 62 L85 64 L75 64 A 8 8 0 0 1 59 64 L37 64 A 8 8 0 0 1 21 64 L10 64 Z",
        accentColor: "#10b981",
        glowColor: "rgba(16, 185, 129, 0.4)",
        wheelLX: "24",
        wheelRX: "74",
        windowPath: "M30 44 L45 44 L58 44 L58 49 L28 49 Z",
      };
    case "LUXURY":
      return {
        pathD: "M5 52 L30 45 L70 45 L90 48 L98 52 L98 62 L85 62 A 7 7 0 0 1 71 62 L29 62 A 7 7 0 0 1 15 62 L5 62 Z",
        accentColor: "#fbbf24",
        glowColor: "rgba(251, 191, 36, 0.4)",
        wheelLX: "28",
        wheelRX: "72",
        windowPath: "M34 47 L50 47 L65 47 L65 52 L31 52 Z",
      };
    case "VAN":
      return {
        pathD: "M8 40 L18 36 L78 36 L92 42 L95 54 L95 62 L82 62 A 8 8 0 0 1 66 62 L30 62 A 8 8 0 0 1 14 62 L8 62 Z",
        accentColor: "#3b82f6",
        glowColor: "rgba(59, 130, 246, 0.4)",
        wheelLX: "24",
        wheelRX: "74",
        windowPath: "M22 38 L48 38 L72 38 L72 45 L18 45 Z",
      };
    case "HATCHBACK":
      return {
        pathD: "M10 52 L22 45 L52 45 L70 47 L85 52 L90 56 L88 62 L74 62 A 6 6 0 0 1 62 62 L28 62 A 6 6 0 0 1 16 62 L10 62 Z",
        accentColor: "#ec4899",
        glowColor: "rgba(236, 72, 153, 0.4)",
        wheelLX: "28",
        wheelRX: "72",
        windowPath: "M26 47 L45 47 L58 47 L55 52 L24 52 Z",
      };
    default: // SEDAN
      return {
        pathD: "M8 52 L25 44 L60 44 L80 47 L92 53 L92 62 L80 62 A 7 7 0 0 1 66 62 L30 62 A 7 7 0 0 1 16 62 L8 62 Z",
        accentColor: "#a855f7",
        glowColor: "rgba(168, 85, 247, 0.4)",
        wheelLX: "28",
        wheelRX: "72",
        windowPath: "M28 46 L48 46 L60 46 L58 51 L26 51 Z",
      };
  }
}

// ─── Filter / Sort Helpers ────────────────────────────────────────────────────

export type VehicleSortKey = "MODEL_ASC" | "MODEL_DESC" | "CAPACITY_ASC" | "CAPACITY_DESC";

export function sortVehicles<T extends { model: string; seatingCapacity: number }>(
  vehicles: T[],
  sortBy: VehicleSortKey
): T[] {
  return [...vehicles].sort((a, b) => {
    switch (sortBy) {
      case "MODEL_ASC":      return a.model.localeCompare(b.model);
      case "MODEL_DESC":     return b.model.localeCompare(a.model);
      case "CAPACITY_ASC":   return a.seatingCapacity - b.seatingCapacity;
      case "CAPACITY_DESC":  return b.seatingCapacity - a.seatingCapacity;
      default:               return 0;
    }
  });
}

export function filterVehicles<
  T extends { model: string; vehicleNumber: string; vehicleType: string; availabilityStatus: string }
>(
  vehicles: T[],
  search: string,
  typeFilter: string,
  statusFilter: string
): T[] {
  const q = search.toLowerCase();
  return vehicles.filter((v) => {
    const matchSearch =
      !q ||
      v.model.toLowerCase().includes(q) ||
      v.vehicleNumber.toLowerCase().includes(q);
    const matchType   = typeFilter   === "ALL" || v.vehicleType.toUpperCase()         === typeFilter;
    const matchStatus = statusFilter === "ALL" || v.availabilityStatus.toUpperCase()  === statusFilter;
    return matchSearch && matchType && matchStatus;
  });
}

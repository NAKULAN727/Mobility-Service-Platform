import React from "react";
import { BOOKING_STATUS_UI_MAP } from "../../lib/types";

interface StatusBadgeProps {
  status: string;
  /** Optional: pulse animation for live/active states */
  pulse?: boolean;
  className?: string;
}

/**
 * StatusBadge — Renders a coloured pill badge for any booking or vehicle status.
 * Uses BOOKING_STATUS_UI_MAP from lib/types for consistent theming across the app.
 */
export default function StatusBadge({ status, pulse = false, className = "" }: StatusBadgeProps) {
  const key = status.toUpperCase();
  const colors = BOOKING_STATUS_UI_MAP[key] ?? {
    bg: "bg-zinc-800/50",
    text: "text-zinc-500",
    border: "border-zinc-700",
    dot: "bg-zinc-500",
  };

  const displayLabel = (() => {
    const labels: Record<string, string> = {
      DRAFT:          "Draft",
      REQUESTED:      "Searching",
      MATCHING:       "Matching",
      ACCEPTED:       "Accepted",
      ARRIVING:       "Driver Arriving",
      ARRIVED:        "Driver Here",
      ACTIVE:         "In Ride",
      COMPLETED:      "Completed",
      CANCELLED:      "Cancelled",
      DISPUTED:       "Disputed",
      AVAILABLE:      "Available",
      BOOKED:         "Booked",
      MAINTENANCE:    "Maintenance",
      OUT_OF_SERVICE: "Out of Service",
      DECOMMISSIONED: "Decommissioned",
    };
    return labels[key] ?? status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
  })();

  return (
    <span
      className={`inline-flex items-center gap-1.5 text-[10px] font-black px-2.5 py-1 rounded-full border ${colors.bg} ${colors.text} ${colors.border} ${className}`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${colors.dot} ${pulse ? "animate-pulse" : ""}`}
      />
      {displayLabel}
    </span>
  );
}

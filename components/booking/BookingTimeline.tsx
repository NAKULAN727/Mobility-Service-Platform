import React from "react";
import { getTripStepIndex, TRIP_STEPS } from "../../services/bookingService";

interface BookingTimelineProps {
  status: string;
  /** Optional accent color. Defaults to amber (#fbbf24). */
  color?: string;
}

/**
 * BookingTimeline — Horizontal 5-step trip progress tracker.
 * Extracted from bookings/page.tsx so it can be reused on the detail page too.
 */
export default function BookingTimeline({ status, color = "#d97706" }: BookingTimelineProps) {
  const currentIdx = getTripStepIndex(status);

  return (
    <div className="relative">
      {/* Track background */}
      <div className="absolute top-3 left-3 right-3 h-0.5 bg-slate-200" />
      {/* Track fill */}
      <div
        className="absolute top-3 left-3 h-0.5 transition-all duration-700"
        style={{
          width: `${Math.min(currentIdx * 25, 100)}%`,
          backgroundColor: color,
        }}
      />

      <div className="relative flex justify-between">
        {TRIP_STEPS.map((step, i) => {
          const done    = currentIdx > i;
          const current = currentIdx === i;
          return (
            <div key={step.key} className="flex flex-col items-center gap-2">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black transition-all ${
                  done
                    ? "text-white"
                    : current
                    ? "text-white ring-4 ring-offset-2"
                    : "bg-slate-200 text-slate-400"
                }`}
                style={
                  done || current
                    ? {
                        backgroundColor: color,
                        ...(current ? { ringColor: `${color}33` } : {}),
                      }
                    : {}
                }
              >
                {done ? "✓" : i + 1}
              </div>
              <span
                className={`text-[9px] font-bold text-center max-w-[52px] leading-tight ${
                  current ? "" : done ? "text-slate-500" : "text-slate-400"
                }`}
                style={current ? { color } : {}}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

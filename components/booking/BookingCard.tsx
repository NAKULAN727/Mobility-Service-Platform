"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Booking, ACTIVE_BOOKING_STATES } from "../../lib/types";
import { canCancelBooking } from "../../services/bookingService";
import StatusBadge from "./StatusBadge";

interface BookingCardProps {
  booking: Booking;
  onCancel?: (id: string) => void;
  cancellingId?: string | null;
  /** If true, shows the "Track" button instead of detail link */
  isActive?: boolean;
}

/**
 * BookingCard — Reusable card for a single booking.
 * Used in booking history list and as a search result item.
 */
export default function BookingCard({
  booking,
  onCancel,
  cancellingId,
  isActive = false,
}: BookingCardProps) {
  const router = useRouter();
  const status = booking.bookingStatus;
  const isCompleted = status === "COMPLETED";
  const isCancelled = status === "CANCELLED";
  const isLive      = ACTIVE_BOOKING_STATES.includes(status);

  const formattedDate = (() => {
    try {
      return new Date(booking.bookingDate).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return booking.bookingDate;
    }
  })();

  return (
    <div
      className={`bg-white border rounded-2xl p-5 transition-all hover:border-slate-350 hover:shadow-md cursor-pointer ${
        isLive ? "border-amber-500/30 bg-amber-500/[0.01]" : "border-slate-200"
      }`}
      onClick={() => router.push(`/bookings/${booking.id}`)}
    >
      <div className="flex items-start justify-between gap-4">
        {/* Left: route + meta */}
        <div className="flex flex-col gap-3 flex-1 min-w-0">
          {/* Status + date */}
          <div className="flex items-center gap-2 flex-wrap">
            <StatusBadge status={status} pulse={isLive} />
            <span className="text-xs text-slate-500">
              {formattedDate} · {booking.bookingTime}
            </span>
          </div>

          {/* Route */}
          <div className="flex items-start gap-3">
            <div className="flex flex-col items-center gap-1 mt-0.5 shrink-0">
              <div className="w-2 h-2 rounded-full bg-emerald-600" />
              <div className="w-px h-4 bg-slate-200" />
              <div className="w-2 h-2 bg-rose-500 rotate-45" />
            </div>
            <div className="flex flex-col gap-2 flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-700 truncate">
                {booking.location.pickupLocation.split(",")[0]}
              </p>
              <p className="text-sm font-bold text-slate-700 truncate">
                {booking.location.destinationLocation.split(",")[0]}
              </p>
            </div>
          </div>

          {/* Meta row */}
          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span>{booking.location.distance} km</span>
            <span>·</span>
            <span>~{booking.location.estimatedDuration} min</span>
            <span>·</span>
            <span>{booking.serviceType === "CAR_WITH_DRIVER" ? "Car + Driver" : "Driver Only"}</span>
            {booking.payment && (
              <>
                <span>·</span>
                <span>{booking.payment.paymentMethod}</span>
              </>
            )}
          </div>
        </div>

        {/* Right: fare + actions */}
        <div className="flex flex-col items-end gap-3 shrink-0">
          <div className="text-right">
            <p className="text-[10px] text-slate-400 uppercase font-bold">
              {isCompleted ? "Paid" : "Fare"}
            </p>
            <p className="text-lg font-black text-slate-900">${booking.fareAmount}</p>
          </div>

          {onCancel && canCancelBooking(status) && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onCancel(booking.id);
              }}
              disabled={cancellingId === booking.id}
              className="text-[11px] font-bold border border-red-200 bg-red-50/50 hover:bg-red-100/60 text-red-600 px-3 py-1.5 rounded-xl cursor-pointer transition-all disabled:opacity-50"
            >
              {cancellingId === booking.id ? "..." : "Cancel"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

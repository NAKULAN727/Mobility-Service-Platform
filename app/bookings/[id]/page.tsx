"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useParams } from "next/navigation";
import Navbar from "../../../components/ui/Navbar";
import PageLoader from "../../../components/ui/PageLoader";
import StatusBadge from "../../../components/booking/StatusBadge";
import BookingTimeline from "../../../components/booking/BookingTimeline";
import { customerAuthHeader, MOCK_CUSTOMER_ID } from "../../../lib/session";
import { useAuth } from "../../../app/providers";
import { Booking, ACTIVE_BOOKING_STATES } from "../../../lib/types";
import {
  canCancelBooking,
  gqlFetch,
  getBookingFromSession,
  persistBookingToSession,
} from "../../../services/bookingService";
import { GET_BOOKING_BY_ID_QUERY } from "../../../lib/graphql/queries";
import { CANCEL_BOOKING_MUTATION, CREATE_PAYMENT_MUTATION } from "../../../lib/graphql/mutations";

function BookingDetailInner() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const bookingId = params?.id ?? "";

  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [toast, setToast] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (bookingId) loadBooking();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookingId]);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(""), 4000);
  }

  async function loadBooking() {
    setLoading(true);
    try {
      const { data, errors } = await gqlFetch(
        GET_BOOKING_BY_ID_QUERY,
        { id: bookingId },
        customerAuthHeader()
      );
      if (errors?.length || !data?.getBookingById) {
        // Fallback to session storage
        const cached = getBookingFromSession(bookingId);
        if (cached) {
          setBooking(cached);
        } else {
          setNotFound(true);
        }
      } else {
        setBooking(data.getBookingById);
      }
    } catch {
      const cached = getBookingFromSession(bookingId);
      if (cached) {
        setBooking(cached);
      } else {
        setNotFound(true);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleCancel() {
    if (!booking) return;
    setCancelling(true);
    try {
      const { data } = await gqlFetch(
        CANCEL_BOOKING_MUTATION,
        { bookingId: booking.id, reason: "Customer requested cancellation" },
        customerAuthHeader()
      );
      const updated = data?.cancelBooking?.success
        ? { ...booking, bookingStatus: "CANCELLED" as const }
        : booking;
      setBooking(updated);
      persistBookingToSession(updated);
      showToast("Ride cancelled. Payment hold released.");
    } catch {
      showToast("Failed to cancel. Please try again.");
    } finally {
      setCancelling(false);
      setConfirmCancel(false);
    }
  }

  function copyOtp() {
    if (booking?.otpCode) {
      navigator.clipboard.writeText(booking.otpCode).catch(() => {});
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  if (loading) return <PageLoader message="Loading booking details..." />;

  if (notFound) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center gap-4 px-6">
          <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center">
            <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-black">Booking not found</h1>
          <p className="text-slate-500 text-sm text-center max-w-xs">
            This booking ID doesn't exist or you don't have permission to view it.
          </p>
          <button
            onClick={() => router.push("/bookings")}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-black px-6 py-3 rounded-xl cursor-pointer transition-all shadow-sm"
          >
            My Rides
          </button>
        </div>
      </div>
    );
  }

  if (!booking) return null;

  const status = booking.bookingStatus;
  const isLive = ACTIVE_BOOKING_STATES.includes(status);
  const isCompleted = status === "COMPLETED";
  const isCancelled = status === "CANCELLED";

  const formattedDate = (() => {
    try {
      return new Date(booking.bookingDate).toLocaleDateString("en-US", {
        weekday: "short",
        month: "long",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return booking.bookingDate;
    }
  })();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Cancel confirmation modal */}
      {confirmCancel && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/65 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
          onClick={() => setConfirmCancel(false)}
        >
          <div
            className="bg-white border border-slate-200 rounded-2xl p-6 w-full max-w-sm shadow-xl animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-black text-slate-950 mb-2">Cancel this ride?</h3>
            <p className="text-sm text-slate-500 mb-5">
              Any payment hold will be released immediately. You won't be charged.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmCancel(false)}
                className="flex-1 border border-slate-200 text-slate-500 font-bold py-3 rounded-xl cursor-pointer hover:bg-slate-50 transition-all"
              >
                Keep ride
              </button>
              <button
                onClick={handleCancel}
                disabled={cancelling}
                className="flex-1 bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 font-bold py-3 rounded-xl cursor-pointer transition-all disabled:opacity-60"
              >
                {cancelling ? "Cancelling..." : "Yes, cancel"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-white border border-emerald-200 text-emerald-700 text-sm font-bold px-5 py-3 rounded-2xl shadow-xl animate-fade-in whitespace-nowrap flex items-center gap-2">
          <svg className="w-4 h-4 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
          {toast}
        </div>
      )}

      <Navbar />

      <div className="pt-32 pb-16 px-6 max-w-2xl mx-auto animate-fade-in">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <button
              onClick={() => router.push("/bookings")}
              className="text-xs text-slate-500 hover:text-slate-800 transition-colors cursor-pointer flex items-center gap-1 mb-3"
            >
              ← My Rides
            </button>
            <h1 className="text-2xl font-black text-slate-900">Booking Details</h1>
            <p className="text-slate-400 text-sm mt-1 font-mono">#{booking.id.slice(0, 8).toUpperCase()}</p>
          </div>
          <StatusBadge status={status} pulse={isLive} className="mt-1" />
        </div>

        <div className="flex flex-col gap-4">
          {/* OTP Card — only for active bookings */}
          {isLive && booking.otpCode && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 flex items-center justify-between shadow-sm">
              <div>
                <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-1">
                  Your Boarding PIN
                </p>
                <p className="text-3xl font-black text-emerald-600 tracking-[0.35em] font-mono">
                  {booking.otpCode}
                </p>
                <p className="text-xs text-slate-450 mt-1">Tell this to your driver when they arrive</p>
              </div>
              <button
                onClick={copyOtp}
                className="text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 px-4 py-2 rounded-xl cursor-pointer transition-all"
              >
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
          )}

          {/* Trip Progress */}
          {!isCancelled && (
            <div className="bg-white border border-slate-200 rounded-2xl px-5 py-4 shadow-sm">
              <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-4">Trip Progress</p>
              <BookingTimeline status={status} color={isCompleted ? "#059669" : "#d97706"} />
            </div>
          )}

          {/* Route */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col gap-4 shadow-sm">
            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Route</p>
            <div className="flex items-start gap-3">
              <div className="flex flex-col items-center gap-1 mt-1 shrink-0">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                <div className="w-px h-8 bg-slate-200" />
                <div className="w-2.5 h-2.5 bg-rose-500 rotate-45" />
              </div>
              <div className="flex flex-col gap-3 flex-1">
                <div>
                  <p className="text-[10px] text-slate-400 uppercase font-bold">Pickup</p>
                  <p className="text-sm text-slate-800 font-bold">{booking.location.pickupLocation}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase font-bold">Drop-off</p>
                  <p className="text-sm text-slate-800 font-bold">{booking.location.destinationLocation}</p>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 border-t border-slate-100 pt-4">
              {[
                { label: "Distance", value: `${booking.location.distance} km` },
                { label: "Est. Time", value: `~${booking.location.estimatedDuration} min` },
                { label: "Ride Type", value: booking.serviceType === "VEHICLE_AND_DRIVER" ? "Car + Driver" : "Driver Only" },
              ].map((item) => (
                <div key={item.label} className="bg-slate-50 rounded-xl p-3 text-center">
                  <p className="text-[9px] text-slate-400 uppercase font-bold mb-1">{item.label}</p>
                  <p className="text-xs font-black text-slate-800">{item.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Schedule */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-3">Schedule</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-50 rounded-xl p-3">
                <p className="text-[9px] text-slate-400 uppercase font-bold mb-1">Date</p>
                <p className="text-sm font-black text-slate-800">{formattedDate}</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-3">
                <p className="text-[9px] text-slate-400 uppercase font-bold mb-1">Time</p>
                <p className="text-sm font-black text-slate-800">{booking.bookingTime}</p>
              </div>
              {booking.actualStartTime && (
                <div className="bg-slate-50 rounded-xl p-3">
                  <p className="text-[9px] text-slate-400 uppercase font-bold mb-1">Started At</p>
                  <p className="text-sm font-black text-slate-800">
                    {new Date(booking.actualStartTime).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              )}
              {booking.actualEndTime && (
                <div className="bg-slate-50 rounded-xl p-3">
                  <p className="text-[9px] text-slate-400 uppercase font-bold mb-1">Ended At</p>
                  <p className="text-sm font-black text-slate-800">
                    {new Date(booking.actualEndTime).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Payment */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col gap-3 shadow-sm">
            <p className="text-xs text-slate-400 uppercase font-bold tracking-widest">Payment</p>
            <div className="flex flex-col gap-2">
              {[
                { label: "Fare", value: `$${booking.fareAmount}` },
                ...(booking.payment
                  ? [
                      { label: "Method", value: booking.payment.paymentMethod },
                      { label: "Status", value: booking.payment.paymentStatus },
                      ...(booking.payment.transactionId
                        ? [{ label: "Transaction ID", value: booking.payment.transactionId }]
                        : []),
                    ]
                  : []),
              ].map((row) => (
                <div key={row.label} className="flex items-center justify-between text-sm">
                  <span className="text-slate-550">{row.label}</span>
                  <span className="font-bold text-slate-800 font-mono">{row.value}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-slate-100 pt-3 flex items-center justify-between">
              <span className="font-black text-slate-800">Total</span>
              <span className="text-xl font-black text-emerald-600 font-mono">${booking.fareAmount}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2 pt-2">
            {canCancelBooking(status) && (
              <button
                onClick={() => setConfirmCancel(true)}
                className="w-full bg-red-50 hover:bg-red-100/60 border border-red-200 text-red-600 font-bold py-4 rounded-xl cursor-pointer transition-all shadow-sm"
              >
                Cancel Ride
              </button>
            )}
            <button
              onClick={() => router.push("/booking")}
              className="w-full border border-slate-200 hover:bg-slate-100/50 text-slate-500 hover:text-slate-800 font-bold py-3 rounded-xl cursor-pointer transition-all text-sm shadow-sm"
            >
              Book Another Ride
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function BookingDetailPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  
  useEffect(() => {
    if (!loading && (!user || user.role === "DRIVER")) {
      router.push("/login");
    }
  }, [user, loading, router]);

  return (
    <Suspense fallback={<PageLoader message="Loading booking..." />}>
      <BookingDetailInner />
    </Suspense>
  );
}

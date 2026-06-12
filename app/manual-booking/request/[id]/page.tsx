"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useQuery, useMutation } from "@apollo/client/react";
import { gql } from "@apollo/client";
import Navbar from "../../../../components/ui/Navbar";
import { useAuth } from "../../../providers";
import {
  Loader2, User, MapPin, Clock, CheckCircle2, XCircle,
  AlertTriangle, RefreshCw, X, Phone,
} from "lucide-react";
import Link from "next/link";

const GET_BOOKING = gql`
  query GetManualBookingStatus($id: ID!) {
    getBookingById(id: $id) {
      id bookingStatus fareAmount serviceType bookingDate bookingTime
      location { pickupLocation destinationLocation distance estimatedDuration }
      driver { id fullName profileImage phone }
      customer { id fullName }
    }
  }
`;

const CANCEL_BOOKING = gql`
  mutation CancelManualRequest($bookingId: ID!) {
    cancelBooking(bookingId: $bookingId) {
      success
      errors { message }
      booking { id bookingStatus }
    }
  }
`;

const STATUS_UI: Record<string, { label: string; cls: string; icon: React.ReactNode }> = {
  PENDING_DRIVER_ACCEPTANCE: {
    label: "Waiting for driver confirmation...",
    cls: "text-amber-700 bg-amber-50 border-amber-200",
    icon: <Clock className="h-5 w-5 animate-pulse" />,
  },
  ACCEPTED: {
    label: "Driver accepted your request!",
    cls: "text-emerald-700 bg-emerald-50 border-emerald-200",
    icon: <CheckCircle2 className="h-5 w-5" />,
  },
  REJECTED: {
    label: "Driver declined your request",
    cls: "text-red-700 bg-red-50 border-red-200",
    icon: <XCircle className="h-5 w-5" />,
  },
  CANCELLED: {
    label: "Request cancelled",
    cls: "text-slate-600 bg-slate-50 border-slate-200",
    icon: <X className="h-5 w-5" />,
  },
};

export default function ManualBookingRequestPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const bookingId = params?.id ?? "";
  const { user, loading: authLoading } = useAuth();
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== "CUSTOMER")) {
      router.push(user ? "/" : "/login");
    }
  }, [user, authLoading, router]);

  const { data, loading, refetch } = useQuery(GET_BOOKING, {
    variables: { id: bookingId },
    skip: !bookingId || !user,
    pollInterval: 3000,
    fetchPolicy: "network-only",
  });

  const [cancelBooking] = useMutation(CANCEL_BOOKING);

  const booking = (data as any)?.getBookingById;
  const status = booking?.bookingStatus ?? "PENDING_DRIVER_ACCEPTANCE";
  const statusUi = STATUS_UI[status] ?? STATUS_UI.PENDING_DRIVER_ACCEPTANCE;

  useEffect(() => {
    if (status === "ACCEPTED") {
      const t = setTimeout(() => router.push(`/bookings/${bookingId}`), 2000);
      return () => clearTimeout(t);
    }
  }, [status, bookingId, router]);

  const handleCancel = async () => {
    setCancelling(true);
    try {
      await cancelBooking({ variables: { bookingId } });
      refetch();
    } finally {
      setCancelling(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <main className="max-w-lg mx-auto px-4 pt-28 text-center">
          <p className="font-bold text-slate-700">Booking not found</p>
          <Link href="/manual-booking" className="text-emerald-600 text-sm font-bold mt-4 inline-block">
            Back to Manual Booking
          </Link>
        </main>
      </div>
    );
  }

  const canCancel = status === "PENDING_DRIVER_ACCEPTANCE";

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar activePath="/manual-booking" />
      <main className="max-w-lg mx-auto px-4 pt-28 pb-16 space-y-6">

        <div className={`border rounded-2xl p-5 flex items-start gap-4 ${statusUi.cls}`}>
          <div className="shrink-0 mt-0.5">{statusUi.icon}</div>
          <div>
            <h1 className="font-black text-lg">{statusUi.label}</h1>
            <p className="text-xs mt-1 opacity-80">Updates automatically — no refresh needed</p>
          </div>
        </div>

        {/* Driver info */}
        {booking.driver && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full overflow-hidden border border-slate-200 bg-slate-50 flex items-center justify-center shrink-0">
                {booking.driver.profileImage ? (
                  <img src={booking.driver.profileImage} alt="" className="h-full w-full object-cover" />
                ) : (
                  <User className="h-7 w-7 text-slate-400" />
                )}
              </div>
              <div className="flex-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Selected Driver</p>
                <p className="font-black text-slate-900">{booking.driver.fullName}</p>
                <p className="text-xs text-slate-500 mt-0.5">Status: {status.replace(/_/g, " ")}</p>
              </div>
            </div>

            {/* Show driver contact and ETA when accepted */}
            {status === "ACCEPTED" && (
              <div className="space-y-3 border-t border-slate-100 pt-4">
                <div className="flex items-center gap-3">
                  <div className="bg-emerald-50 text-emerald-700 p-2 rounded-full">
                    <Phone className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Contact</p>
                    <p className="font-semibold text-slate-900">{booking.driver.phone || "Coming soon"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="bg-blue-50 text-blue-700 p-2 rounded-full">
                    <Clock className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Estimated Arrival</p>
                    <p className="font-semibold text-slate-900">{booking.location.estimatedDuration} minutes</p>
                  </div>
                </div>
                <Link
                  href={`/bookings/${bookingId}`}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl text-sm flex items-center justify-center gap-2"
                >
                  Track Ride
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Trip summary */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
          <h2 className="text-xs font-black text-slate-500 uppercase tracking-wider">Trip Summary</h2>
          <div className="space-y-3 text-sm">
            <p className="flex items-start gap-2">
              <MapPin className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
              <span><span className="font-bold text-slate-400 text-xs uppercase">Pickup · </span>{booking.location.pickupLocation}</span>
            </p>
            <p className="flex items-start gap-2">
              <MapPin className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
              <span><span className="font-bold text-slate-400 text-xs uppercase">Dropoff · </span>{booking.location.destinationLocation}</span>
            </p>
            <p className="flex items-center gap-2 text-slate-600">
              <Clock className="h-4 w-4 text-slate-400" />
              {booking.bookingDate} @ {booking.bookingTime}
            </p>
          </div>
          <div className="border-t border-slate-100 pt-3 flex justify-between items-center">
            <span className="text-xs font-bold text-slate-400 uppercase">Estimated Fare</span>
            <span className="text-xl font-black text-slate-900">₹{booking.fareAmount}</span>
          </div>
        </div>

        {status === "REJECTED" && (
          <div className="space-y-3">
            <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 text-amber-800 text-sm p-4 rounded-xl">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              Choose another driver or let AI recommend the best match.
            </div>
            <div className="flex gap-3">
              <Link
                href="/manual-booking"
                className="flex-1 text-center bg-black text-white font-bold py-3 rounded-xl text-sm hover:bg-slate-800"
              >
                Browse Drivers
              </Link>
              <Link
                href="/ai-assistant"
                className="flex-1 text-center bg-emerald-600 text-white font-bold py-3 rounded-xl text-sm hover:bg-emerald-700"
              >
                AI Assistant
              </Link>
            </div>
          </div>
        )}

        {status === "ACCEPTED" && (
          <p className="text-center text-sm text-emerald-600 font-bold">
            Redirecting to trip details...
          </p>
        )}

        <div className="flex gap-3">
          {canCancel && (
            <button
              onClick={handleCancel}
              disabled={cancelling}
              className="flex-1 flex items-center justify-center gap-2 border border-red-200 text-red-600 font-bold py-3 rounded-xl text-sm hover:bg-red-50 disabled:opacity-50"
            >
              {cancelling ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
              Cancel Request
            </button>
          )}
          <button
            onClick={() => refetch()}
            className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm font-bold hover:bg-slate-50"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </main>
    </div>
  );
}

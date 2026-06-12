"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../../components/ui/Navbar";
import { customerAuthHeader, MOCK_CUSTOMER_ID } from "../../lib/session";

const GET_BOOKING_HISTORY_QUERY = `
  query GetBookingHistory($customerId: ID!, $first: Int, $after: String) {
    getBookingHistory(customerId: $customerId, first: $first, after: $after) {
      edges {
        node {
          id bookingType bookingStatus bookingDate bookingTime fareAmount otpCode
          location { pickupLocation destinationLocation distance estimatedDuration }
          payment { paymentStatus paymentMethod transactionId }
          createdAt
        }
        cursor
      }
      pageInfo { hasNextPage endCursor }
      totalCount
    }
  }
`;

const CANCEL_BOOKING_MUTATION = `
  mutation CancelBooking($bookingId: ID!, $reason: String) {
    cancelBooking(bookingId: $bookingId, reason: $reason) {
      success
      errors { field message code }
      booking { id bookingStatus }
    }
  }
`;

interface Location { pickupLocation: string; destinationLocation: string; distance: number; estimatedDuration: number; }
interface Payment { paymentStatus: string; paymentMethod: string; transactionId: string | null; }
interface Booking {
  id: string; bookingType: string; bookingStatus: string; bookingDate: string;
  bookingTime: string; fareAmount: number; otpCode: string;
  location: Location; payment: Payment | null; createdAt: string;
}

const ACTIVE_STATES = ["REQUESTED", "MATCHING", "ACCEPTED", "ARRIVING", "ARRIVED", "ACTIVE"];

const TRIP_STEPS = [
  { key: "REQUESTED",  label: "Requested",   desc: "Looking for a driver" },
  { key: "ACCEPTED",   label: "Driver found", desc: "A driver accepted your ride" },
  { key: "ARRIVING",   label: "On the way",   desc: "Driver is heading to you" },
  { key: "ACTIVE",     label: "In ride",      desc: "You're on your way!" },
  { key: "COMPLETED",  label: "Arrived",      desc: "Trip complete" },
];

function activeStepIndex(status: string) {
  const s = status.toUpperCase();
  if (["REQUESTED","MATCHING"].includes(s)) return 0;
  if (s === "ACCEPTED")  return 1;
  if (["ARRIVING","ARRIVED"].includes(s)) return 2;
  if (s === "ACTIVE")    return 3;
  if (s === "COMPLETED") return 4;
  return -1;
}

// Mock data for when DB is unavailable
const MOCK_ACTIVE: Booking = {
  id: "book-active-uuid-101", bookingType: "VEHICLE_AND_DRIVER", bookingStatus: "ACCEPTED",
  bookingDate: new Date().toISOString().split("T")[0],
  bookingTime: new Date().toTimeString().slice(0, 5),
  fareAmount: 89.75, otpCode: "558822",
  location: { pickupLocation: "JFK International Airport, New York", destinationLocation: "Times Square, Manhattan, NY", distance: 28.5, estimatedDuration: 45 },
  payment: { paymentStatus: "PENDING", paymentMethod: "CARD", transactionId: "CARD-HOLD-998822" },
  createdAt: new Date().toISOString(),
};
const MOCK_PAST: Booking[] = [
  { id: "p001", bookingType: "VEHICLE_AND_DRIVER", bookingStatus: "COMPLETED", bookingDate: "2026-06-10", bookingTime: "08:30", fareAmount: 105, otpCode: "112233", location: { pickupLocation: "JFK International Airport, New York", destinationLocation: "Times Square, Manhattan, NY", distance: 28.5, estimatedDuration: 45 }, payment: { paymentStatus: "SUCCESS", paymentMethod: "CARD", transactionId: "TX-9922" }, createdAt: "2026-06-10T08:30:00Z" },
  { id: "p002", bookingType: "DRIVER_ONLY", bookingStatus: "CANCELLED", bookingDate: "2026-06-08", bookingTime: "12:00", fareAmount: 22, otpCode: "998877", location: { pickupLocation: "Grand Central Terminal, New York", destinationLocation: "Metropolitan Museum of Art, NY", distance: 4.2, estimatedDuration: 15 }, payment: { paymentStatus: "FAILED", paymentMethod: "UPI", transactionId: null }, createdAt: "2026-06-08T12:00:00Z" },
  { id: "p003", bookingType: "VEHICLE_AND_DRIVER", bookingStatus: "COMPLETED", bookingDate: "2026-06-05", bookingTime: "18:15", fareAmount: 64, otpCode: "665544", location: { pickupLocation: "Brooklyn Bridge Park, New York", destinationLocation: "LaGuardia Airport, New York", distance: 16.8, estimatedDuration: 30 }, payment: { paymentStatus: "SUCCESS", paymentMethod: "CARD", transactionId: "TX-5544" }, createdAt: "2026-06-05T18:15:00Z" },
];

function MyRidesInner() {
  const router = useRouter();

  const [activeRide, setActiveRide] = useState<Booking | null>(null);
  const [pastRides, setPastRides] = useState<Booking[]>([]);
  const [pageInfo, setPageInfo] = useState({ hasNextPage: false, endCursor: null as string | null });
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [filter, setFilter] = useState("ALL");
  const [toast, setToast] = useState("");

  useEffect(() => { loadData(); }, []);

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(""), 4000); }

  async function loadData() {
    setLoading(true);
    try {
      const res = await fetch("/api/graphql", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: customerAuthHeader() },
        body: JSON.stringify({ query: GET_BOOKING_HISTORY_QUERY, variables: { customerId: MOCK_CUSTOMER_ID, first: 10 } }),
      });
      const { data, errors } = await res.json();
      if (errors?.length) throw new Error(errors[0].message);
      const conn = data?.getBookingHistory;
      if (conn?.edges?.length > 0) {
        const allBookings: Booking[] = conn.edges.map((e: any) => e.node);
        const active = allBookings.find(b => ACTIVE_STATES.includes(b.bookingStatus));
        const past = allBookings.filter(b => !ACTIVE_STATES.includes(b.bookingStatus));
        setActiveRide(active || null);
        setPastRides(past);
        setPageInfo(conn.pageInfo);
      } else {
        useMock();
      }
    } catch (_) {
      useMock();
    } finally {
      setLoading(false);
    }
  }

  function useMock() {
    try {
      const stored = JSON.parse(sessionStorage.getItem("mock_booking_history") || "[]") as Booking[];
      const sa = stored.find(b => ACTIVE_STATES.includes(b.bookingStatus));
      setActiveRide(sa || MOCK_ACTIVE);
      setPastRides([...stored.filter(b => !ACTIVE_STATES.includes(b.bookingStatus)), ...MOCK_PAST]);
    } catch (_) {
      setActiveRide(MOCK_ACTIVE);
      setPastRides(MOCK_PAST);
    }
  }

  async function loadMore() {
    if (!pageInfo.hasNextPage || loadingMore) return;
    setLoadingMore(true);
    try {
      const res = await fetch("/api/graphql", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: customerAuthHeader() },
        body: JSON.stringify({ query: GET_BOOKING_HISTORY_QUERY, variables: { customerId: MOCK_CUSTOMER_ID, first: 10, after: pageInfo.endCursor } }),
      });
      const { data } = await res.json();
      const conn = data?.getBookingHistory;
      if (conn?.edges?.length) {
        setPastRides(p => [...p, ...conn.edges.filter((e: any) => !ACTIVE_STATES.includes(e.node.bookingStatus)).map((e: any) => e.node)]);
        setPageInfo(conn.pageInfo);
      }
    } catch (_) {}
    setLoadingMore(false);
  }

  async function doCancel(id: string) {
    setCancellingId(id);
    try {
      const res = await fetch("/api/graphql", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: customerAuthHeader() },
        body: JSON.stringify({ query: CANCEL_BOOKING_MUTATION, variables: { bookingId: id, reason: "Customer cancelled" } }),
      });
      const { data } = await res.json();
      if (!data?.cancelBooking?.success) throw new Error("Failed");
    } catch (_) {}
    // Always update UI
    if (activeRide?.id === id) setActiveRide(p => p ? { ...p, bookingStatus: "CANCELLED" } : null);
    setPastRides(p => p.map(b => b.id === id ? { ...b, bookingStatus: "CANCELLED", payment: b.payment ? { ...b.payment, paymentStatus: "FAILED" } : null } : b));
    setCancellingId(null);
    showToast("Ride cancelled. Your payment hold has been released.");
  }

  const filtered = pastRides.filter(b => {
    if (filter === "COMPLETED") return b.bookingStatus === "COMPLETED";
    if (filter === "CANCELLED") return b.bookingStatus === "CANCELLED";
    return true;
  });

  const isLiveRide = activeRide && activeRide.bookingStatus !== "CANCELLED" && activeRide.bookingStatus !== "COMPLETED";

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Cancel modal */}
      {confirmId && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4" onClick={() => setConfirmId(null)}>
          <div className="bg-white border border-slate-250 rounded-2xl p-6 w-full max-w-sm shadow-xl animate-scale-in" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-black text-slate-900 mb-2">Cancel this ride?</h3>
            <p className="text-sm text-slate-500 mb-5">Any payment hold will be released immediately. You won't be charged.</p>
            <div className="flex gap-2">
              <button onClick={() => setConfirmId(null)} className="flex-1 border border-slate-200 text-slate-500 font-bold py-3 rounded-xl cursor-pointer hover:bg-slate-50 transition-all">
                Keep ride
              </button>
              <button onClick={() => { const id = confirmId; setConfirmId(null); doCancel(id!); }}
                className="flex-1 bg-red-50 hover:bg-red-100/80 border border-red-200 text-red-600 font-bold py-3 rounded-xl cursor-pointer transition-all"
              >
                Yes, cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-white border border-emerald-200 text-emerald-700 text-sm font-bold px-5 py-3 rounded-2xl shadow-xl animate-fade-in whitespace-nowrap flex items-center gap-2">
          <svg className="w-4 h-4 text-emerald-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
          {toast}
        </div>
      )}

      {/* NAV */}
      <Navbar activePath="/bookings" />

      <div className="pt-32 pb-16 px-6 max-w-2xl mx-auto animate-fade-in">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-heading font-black text-slate-900">My Rides</h1>
          <p className="text-slate-500 text-sm mt-1">Track your current trip and view past journeys</p>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-3 text-slate-500">
            <div className="w-8 h-8 rounded-full border-2 border-emerald-600 border-t-transparent animate-spin" />
            <span className="text-sm font-bold">Loading your rides...</span>
          </div>
        ) : (
          <div className="flex flex-col gap-8">

            {/* ─── ACTIVE RIDE ─── */}
            {isLiveRide && (
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-amber-600 animate-pulse" />
                  <h2 className="text-xs font-black text-amber-700 uppercase tracking-widest font-mono">Live · Current ride</h2>
                </div>

                <div className="premium-glass-card overflow-hidden shadow-md border border-amber-500/20 bg-white">
                  {/* Route */}
                  <div className="p-5 flex flex-col gap-3">
                    <div className="flex items-start gap-3">
                      <div className="flex flex-col items-center gap-1 mt-1 shrink-0">
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                        <div className="w-px h-6 bg-slate-200" />
                        <div className="w-2.5 h-2.5 bg-rose-500 rotate-45" />
                      </div>
                      <div className="flex flex-col gap-2 flex-1 min-w-0">
                        <div>
                          <p className="text-[10px] text-slate-400 uppercase font-bold">Pickup</p>
                          <p className="text-sm text-slate-800 font-bold truncate">{activeRide!.location.pickupLocation}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-400 uppercase font-bold">Drop-off</p>
                          <p className="text-sm text-slate-800 font-bold truncate">{activeRide!.location.destinationLocation}</p>
                        </div>
                      </div>
                    </div>

                    {/* OTP */}
                    <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 flex items-center justify-between">
                      <div>
                        <p className="text-[10px] text-slate-400 uppercase font-bold mb-0.5">Your boarding PIN</p>
                        <p className="text-2xl font-black text-amber-700 tracking-[0.3em] font-mono">{activeRide!.otpCode}</p>
                      </div>
                      <button onClick={() => navigator.clipboard.writeText(activeRide!.otpCode)}
                        className="text-xs font-bold bg-slate-200 hover:bg-slate-300 text-slate-700 px-3 py-2 rounded-lg cursor-pointer transition-all">
                        Copy
                      </button>
                    </div>
                  </div>

                  {/* Progress steps */}
                  <div className="border-t border-slate-100 px-5 py-4">
                    <div className="relative">
                      {/* Track line */}
                      <div className="absolute top-3 left-3 right-3 h-0.5 bg-slate-200" />
                      <div
                        className="absolute top-3 left-3 h-0.5 bg-amber-600 transition-all duration-700"
                        style={{ width: `${Math.min(activeStepIndex(activeRide!.bookingStatus) * 25, 100)}%` }}
                      />
                      <div className="relative flex justify-between">
                        {TRIP_STEPS.map((s, i) => {
                          const idx = activeStepIndex(activeRide!.bookingStatus);
                          const done = idx > i;
                          const current = idx === i;
                          return (
                            <div key={i} className="flex flex-col items-center gap-2">
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black transition-all ${
                                done    ? "bg-amber-600 text-white"
                                : current ? "bg-amber-600 text-white ring-4 ring-offset-2 ring-amber-600/20"
                                : "bg-slate-200 text-slate-400"
                              }`}>
                                {done ? "✓" : i + 1}
                              </div>
                              <span className={`text-[9px] font-bold text-center max-w-[52px] leading-tight ${current ? "text-amber-750" : done ? "text-slate-500" : "text-slate-400"}`}>
                                {s.label}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="border-t border-slate-100 px-5 py-4 flex items-center justify-between bg-slate-50/50">
                    <div>
                      <p className="text-xs text-slate-400">Total fare</p>
                      <p className="text-xl font-black text-slate-800">${activeRide!.fareAmount}</p>
                    </div>
                    {!["ACTIVE", "COMPLETED"].includes(activeRide!.bookingStatus.toUpperCase()) && (
                      <button
                        onClick={() => setConfirmId(activeRide!.id)}
                        disabled={cancellingId === activeRide!.id}
                        className="bg-red-50 border border-red-200 hover:bg-red-100 text-red-600 text-sm font-bold px-5 py-2 rounded-xl cursor-pointer transition-all disabled:opacity-50"
                      >
                        {cancellingId === activeRide!.id ? "Cancelling..." : "Cancel ride"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ─── PAST RIDES ─── */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-black text-slate-900">Trip history</h2>
                <div className="flex gap-1 bg-slate-100 border border-slate-200 p-1 rounded-xl">
                  {["ALL", "COMPLETED", "CANCELLED"].map(f => (
                    <button key={f} onClick={() => setFilter(f)}
                      className={`text-[10px] font-black px-3 py-1.5 rounded-lg uppercase tracking-wider cursor-pointer transition-all ${filter === f ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              {filtered.length === 0 ? (
                <div className="text-center py-16 bg-white border border-slate-200 rounded-2xl flex flex-col items-center gap-3 shadow-sm">
                  <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center">
                    <svg className="w-7 h-7 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                    </svg>
                  </div>
                  <p className="font-bold text-slate-700">No rides yet</p>
                  <p className="text-xs text-slate-400">Your completed rides will appear here</p>
                  <button onClick={() => router.push("/booking")} className="bg-emerald-600 text-white font-bold text-sm px-5 py-2.5 rounded-xl cursor-pointer hover:bg-emerald-700 transition-all mt-1 shadow-sm">
                    Book your first ride
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {filtered.map(b => {
                    const isCompleted = b.bookingStatus === "COMPLETED";
                    const isCancelled = b.bookingStatus === "CANCELLED";
                    const isPending = ACTIVE_STATES.includes(b.bookingStatus);
                    return (
                      <div key={b.id} className="bg-white border border-slate-200 rounded-2xl p-5 hover:border-slate-350 transition-all shadow-sm">
                        <div className="flex items-start justify-between gap-4">
                          {/* Left */}
                          <div className="flex flex-col gap-3 flex-1 min-w-0">
                            {/* Status + date */}
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`inline-flex items-center gap-1.5 text-[10px] font-black px-2.5 py-1 rounded-full border ${
                                isCompleted ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                : isCancelled ? "border-red-200 bg-red-55/5 text-red-600"
                                : "border-amber-200 bg-amber-50 text-amber-700"
                              }`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${isCompleted ? "bg-emerald-600" : isCancelled ? "bg-red-500" : "bg-amber-600"}`} />
                                {isCompleted ? "Completed" : isCancelled ? "Cancelled" : b.bookingStatus.charAt(0) + b.bookingStatus.slice(1).toLowerCase()}
                              </span>
                              <span className="text-xs text-slate-500">
                                {new Date(b.bookingDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })} · {b.bookingTime}
                              </span>
                            </div>

                            {/* Route */}
                            <div className="flex items-start gap-3">
                              <div className="flex flex-col items-center gap-1 mt-0.5 shrink-0">
                                <div className="w-2 h-2 rounded-full bg-emerald-600" />
                                <div className="w-px h-4 bg-slate-250" />
                                <div className="w-2 h-2 bg-rose-500 rotate-45" />
                              </div>
                              <div className="flex flex-col gap-2 flex-1 min-w-0">
                                <p className="text-sm font-bold text-slate-700 truncate">{b.location.pickupLocation.split(",")[0]}</p>
                                <p className="text-sm font-bold text-slate-700 truncate">{b.location.destinationLocation.split(",")[0]}</p>
                              </div>
                            </div>

                            <div className="flex items-center gap-3 text-xs text-slate-500">
                              <span>{b.location.distance} km</span>
                              <span>·</span>
                              <span>~{b.location.estimatedDuration} min</span>
                              <span>·</span>
                              <span>{b.bookingType === "VEHICLE_AND_DRIVER" ? "Car + Driver" : "Driver Only"}</span>
                              {b.payment && <><span>·</span><span>{b.payment.paymentMethod}</span></>}
                            </div>
                          </div>

                          {/* Right: fare + action */}
                          <div className="flex flex-col items-end gap-3 shrink-0">
                            <div className="text-right">
                              <p className="text-[10px] text-slate-400 uppercase font-bold">{isCompleted ? "Paid" : "Fare"}</p>
                              <p className="text-lg font-black text-slate-900">${b.fareAmount}</p>
                            </div>
                            {isPending && !["ACTIVE", "COMPLETED", "CANCELLED"].includes(b.bookingStatus.toUpperCase()) && (
                              <button
                                onClick={() => setConfirmId(b.id)}
                                disabled={cancellingId === b.id}
                                className="text-[11px] font-bold border border-red-200 bg-red-50 hover:bg-red-100 text-red-650 px-3 py-1.5 rounded-xl cursor-pointer transition-all shadow-sm"
                              >
                                {cancellingId === b.id ? "..." : "Cancel"}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {pageInfo.hasNextPage && (
                    <button onClick={loadMore} disabled={loadingMore}
                      className="w-full border border-slate-200 hover:bg-slate-100/50 text-slate-500 hover:text-slate-800 font-bold py-3.5 rounded-xl text-sm cursor-pointer transition-all flex items-center justify-center gap-2"
                    >
                      {loadingMore ? <><div className="w-4 h-4 rounded-full border-2 border-slate-400 border-t-transparent animate-spin" /> Loading...</> : "Load more rides"}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function MyRidesPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-emerald-600 border-t-transparent animate-spin" />
      </div>
    }>
      <MyRidesInner />
    </Suspense>
  );
}

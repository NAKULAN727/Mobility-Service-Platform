"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Navbar from "../../components/ui/Navbar";
import { customerAuthHeader, MOCK_CUSTOMER_ID } from "../../lib/session";
import { useAuth } from "../../app/providers";
import VehicleIcon from "../../components/vehicles/VehicleIcon";

const GET_VEHICLES_QUERY = `
  query GetAvailableVehicles($type: VehicleType) {
    getAvailableVehicles(type: $type) {
      id registrationNumber make vehicleType model seatingCapacity availabilityStatus
    }
  }
`;

const CREATE_BOOKING_MUTATION = `
  mutation CreateBooking($input: BookingCreateInput!) {
    createBooking(input: $input) {
      success
      errors { field message code }
      booking {
        id serviceType bookingStatus bookingDate bookingTime fareAmount otpCode
        location { pickupLocation destinationLocation distance estimatedDuration }
      }
    }
  }
`;

const CREATE_PAYMENT_MUTATION = `
  mutation CreatePayment($input: PaymentCreateInput!) {
    createPayment(input: $input) {
      success
      errors { field message code }
      payment { id paymentStatus paymentMethod amount transactionId }
    }
  }
`;

interface Vehicle { id: string; registrationNumber: string; make?: string; vehicleType: string; model: string; seatingCapacity: number; availabilityStatus: string; }

const VEHICLES_UI = {
  SEDAN:     { icon: "SEDAN", label: "Sedan",   desc: "Comfortable 4-seater",    rate: 3.50, color: "#10b981" },
  SUV:       { icon: "SUV",     label: "SUV",     desc: "Spacious 6-seater",        rate: 4.20, color: "#3b82f6" },
  LUXURY:    { icon: "LUXURY",  label: "Luxury",  desc: "Premium executive car",    rate: 5.80, color: "#a78bfa" },
  VAN:       { icon: "VAN",     label: "Van",     desc: "Group travel up to 12",    rate: 5.00, color: "#f59e0b" },
  HATCHBACK: { icon: "HATCHBACK", label: "Compact", desc: "Eco city car",             rate: 2.80, color: "#2dd4bf" },
};

const KNOWN_ROUTES: Record<string, { dist: number; dur: number }> = {
  "JFK International Airport, New York|Times Square, Manhattan, NY": { dist: 28.5, dur: 45 },
  "Brooklyn Bridge Park, New York|LaGuardia Airport, New York":      { dist: 16.8, dur: 30 },
  "Grand Central Terminal, New York|Metropolitan Museum of Art, NY": { dist: 4.2,  dur: 15 },
};

interface BookingDetails {
  id: string;
  otpCode: string;
  bookingDate: string;
  bookingTime: string;
  fareAmount: number;
  location?: {
    pickupLocation: string;
    destinationLocation: string;
  };
  payment?: unknown;
}

export default function BookRidePage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  
  useEffect(() => {
    if (!loading && (!user || user.role === "DRIVER")) {
      router.push("/login");
    }
  }, [user, loading, router]);

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <BookingPageInner />
    </Suspense>
  );
}

function BookingPageInner() {
  const router = useRouter();
  const params = useSearchParams();

  const [step, setStep] = useState(1); // 1=Route, 2=Details, 3=Confirm, 4=Success

  // Step 1
  const [serviceType, setServiceType] = useState<"CAR_WITH_DRIVER" | "DRIVER_ONLY">("CAR_WITH_DRIVER");
  const [from, setFrom] = useState(params.get("from") || "");
  const [to, setTo] = useState(params.get("to") || "");

  // Step 2
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [vehicleTypeFilter, setVehicleTypeFilter] = useState(params.get("vehicleType")?.toUpperCase() || "SEDAN");
  const [selectedVehicleId, setSelectedVehicleId] = useState(params.get("vehicleId") || "");
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loadingVehicles, setLoadingVehicles] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"CARD" | "UPI" | "CASH">("CARD");

  // State
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [successData, setSuccessData] = useState<BookingDetails | null>(null);

  // Fare calculation
  const routeKey = `${from}|${to}`;
  const known = KNOWN_ROUTES[routeKey];
  const dist = known?.dist ?? 12;
  const dur  = known?.dur  ?? 28;
  const ui = VEHICLES_UI[vehicleTypeFilter as keyof typeof VEHICLES_UI] || VEHICLES_UI.SEDAN;
  const baseFare    = 5;
  const distFare    = parseFloat((dist * (serviceType === "CAR_WITH_DRIVER" ? ui.rate : 2.0)).toFixed(2));
  const serviceFee  = parseFloat(((baseFare + distFare) * 0.05).toFixed(2));
  const total       = parseFloat((baseFare + distFare + serviceFee).toFixed(2));

  useEffect(() => {
    const timer = setTimeout(() => {
      const now = new Date();
      setDate(now.toISOString().split("T")[0]);
      setTime(now.toTimeString().slice(0, 5));
    }, 0);
    return () => clearTimeout(timer);
  }, [setDate, setTime]);

  const fetchVehicles = React.useCallback(async () => {
    setLoadingVehicles(true);
    try {
      const res = await fetch("/api/graphql", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: customerAuthHeader() },
        body: JSON.stringify({ query: GET_VEHICLES_QUERY, variables: { type: vehicleTypeFilter || null } }),
      });
      const { data } = await res.json();
      const list = data?.getAvailableVehicles || [];
      setVehicles(list);
      if (selectedVehicleId && !selectedVehicle) {
        const found = list.find((v: Vehicle) => v.id === selectedVehicleId);
        if (found) setSelectedVehicle(found);
      }
    } catch {}
    setLoadingVehicles(false);
  }, [vehicleTypeFilter, selectedVehicleId, selectedVehicle, setLoadingVehicles, setVehicles, setSelectedVehicle]);

  useEffect(() => {
    if (step === 2 && serviceType === "CAR_WITH_DRIVER") {
      const timer = setTimeout(() => {
        fetchVehicles();
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [step, serviceType, fetchVehicles]);

  function goNext() {
    const e: Record<string, string> = {};
    if (step === 1) {
      if (!from.trim() || from.length < 5) e.from = "Enter a pickup address (min 5 chars)";
      if (!to.trim() || to.length < 5)   e.to   = "Enter a destination (min 5 chars)";
      if (from.trim() === to.trim() && from.trim().length > 0) e.to = "Destination must be different from pickup";
    }
    if (step === 2) {
      if (!date) e.date = "Pick a date";
      if (!time) e.time = "Pick a time";
      if (serviceType === "CAR_WITH_DRIVER" && !selectedVehicleId) e.vehicle = "Select a vehicle to continue";
    }
    setErrors(e);
    if (Object.keys(e).length === 0) setStep(p => p + 1);
  }

  async function handleConfirm(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setServerError("");
    try {
      const bookRes = await fetch("/api/graphql", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: customerAuthHeader() },
        body: JSON.stringify({
          query: CREATE_BOOKING_MUTATION,
          variables: {
            input: {
              customerId: MOCK_CUSTOMER_ID, serviceType: serviceType,
              vehicleId: serviceType === "CAR_WITH_DRIVER" ? selectedVehicleId || null : null,
              pickupLocation: from, destinationLocation: to,
              distance: dist, estimatedDuration: dur,
              bookingDate: date, bookingTime: time, fareAmount: total,
            },
          },
        }),
      });
      const bookJson = await bookRes.json();
      if (bookJson.errors?.length) throw new Error(bookJson.errors[0].message);
      const cb = bookJson.data?.createBooking;
      if (!cb?.success) throw new Error(cb?.errors?.[0]?.message || "Booking failed");

      const payRes = await fetch("/api/graphql", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: customerAuthHeader() },
        body: JSON.stringify({ query: CREATE_PAYMENT_MUTATION, variables: { input: { bookingId: cb.booking.id, amount: cb.booking.fareAmount, paymentMethod } } }),
      });
      const payJson = await payRes.json();
      const cp = payJson.data?.createPayment;

      setSuccessData({ ...cb.booking, payment: cp?.payment });
      setStep(4);
    } catch (err) {
      setServerError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  // ─── SUCCESS SCREEN ───
  if (step === 4 && successData) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900">
        <Navbar activePath="/booking" />
        <div className="pt-32 pb-16 px-6 max-w-xl mx-auto flex flex-col gap-6 animate-scale-in">
          <div className="text-center flex flex-col gap-2">
            <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto mb-2">
              <svg className="w-8 h-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-3xl font-black">Booking Confirmed!</h1>
            <p className="text-slate-500 text-sm">We&apos;ve dispatched a driver for your route.</p>
          </div>

          {/* OTP PIN */}
          <div className="bg-emerald-50/50 border border-emerald-200 rounded-2xl p-6 flex items-center justify-between shadow-sm">
            <div>
              <p className="text-xs text-slate-500 uppercase font-bold tracking-widest mb-1">Your Boarding PIN</p>
              <p className="text-3xl font-black text-emerald-600 tracking-[0.35em] font-mono">{successData.otpCode}</p>
              <p className="text-xs text-slate-400 mt-1">Tell this to your driver when they arrive</p>
            </div>
            <button
              onClick={() => navigator.clipboard.writeText(successData.otpCode)}
              className="text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 px-4 py-2 rounded-xl cursor-pointer transition-all"
            >
              Copy
            </button>
          </div>

          {/* Route summary */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col gap-3 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="flex flex-col items-center mt-1 gap-1">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                <div className="w-px h-6 bg-slate-200" />
                <div className="w-2.5 h-2.5 bg-rose-500 rotate-45" />
              </div>
              <div className="flex flex-col gap-3 flex-1">
                <div>
                  <p className="text-[10px] text-slate-400 uppercase font-bold">Pickup</p>
                  <p className="text-sm text-slate-800 font-bold">{successData.location?.pickupLocation}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase font-bold">Drop-off</p>
                  <p className="text-sm text-slate-800 font-bold">{successData.location?.destinationLocation}</p>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 border-t border-slate-100 pt-4">
              {[
                { l: "Date",  v: new Date(successData.bookingDate).toLocaleDateString("en-US", { month: "short", day: "numeric" }) },
                { l: "Time",  v: successData.bookingTime },
                { l: "Total", v: `$${successData.fareAmount}` },
              ].map((d, i) => (
                <div key={i} className="bg-slate-50 rounded-xl p-3 text-center">
                  <p className="text-[9px] text-slate-400 uppercase font-bold mb-1">{d.l}</p>
                  <p className="text-sm font-black text-slate-800 font-mono">{d.v}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <button onClick={() => router.push(successData?.id ? `/bookings/${successData.id}` : "/bookings")} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-4 rounded-xl cursor-pointer transition-all text-base shadow-sm">
              Track My Ride →
            </button>
            <button onClick={() => { setSuccessData(null); setStep(1); setFrom(""); setTo(""); }} className="w-full border border-slate-200 hover:bg-slate-100/50 text-slate-500 hover:text-slate-800 font-bold py-3 rounded-xl cursor-pointer transition-all text-sm">
              Book Another Ride
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── BOOKING WIZARD ───
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">

      {/* NAV */}
      <Navbar activePath="/booking" />

      <div className="pt-32 pb-16 px-6">
        <div className="max-w-xl lg:max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

            {/* Left Column - Live Routing Simulator */}
            <div className="order-2 lg:order-1 lg:col-span-6 xl:col-span-7 w-full lg:sticky lg:top-32">
              <div className="bg-white border border-slate-200/60 rounded-3xl p-6 shadow-xl flex flex-col gap-6">
                <div>
                  <h2 className="text-xl font-heading font-black text-slate-900">Live Dispatch Simulator</h2>
                  <p className="text-slate-500 text-xs mt-1">Real-time routing preview for your premium ride selection.</p>
                </div>

                {/* Live Routing Simulator Map Block */}
                <div className="relative w-full h-[280px] bg-slate-50/50 border border-slate-200/60 rounded-2xl p-4 shadow-inner overflow-hidden group">
                  <div className="absolute inset-0 opacity-[0.02] bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:16px_16px]" />
                  <div className="absolute top-3 right-3 flex items-center gap-1.5 text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Live Routing Simulator
                  </div>

                  <svg className="w-full h-full" viewBox="0 0 400 160">
                    <path d="M 0,40 L 400,40 M 0,100 L 400,100 M 0,140 L 400,140 M 80,0 L 80,160 M 180,0 L 180,160 M 300,0 L 300,160" stroke="#f1f5f9" strokeWidth="1.5" strokeDasharray="3 3" />
                    {from && to ? (
                      <>
                        <path 
                          d="M 60,120 L 180,120 L 180,60 L 320,60" 
                          fill="none" 
                          stroke="#059669" 
                          strokeWidth="4" 
                          strokeLinecap="round" 
                          strokeLinejoin="round"
                          strokeDasharray="400"
                          strokeDashoffset="400"
                          style={{ animation: 'drawPath 2.5s cubic-bezier(0.4, 0, 0.2, 1) forwards' }}
                        />
                        <g transform="translate(60,120)">
                          <circle r="12" fill="rgba(16, 185, 129, 0.15)" className="animate-ping" style={{ animationDuration: '3s' }} />
                          <circle r="6" fill="#10b981" stroke="#ffffff" strokeWidth="2" />
                          <text y="3" textAnchor="middle" fill="#ffffff" fontSize="8" fontWeight="bold" fontFamily="sans-serif">A</text>
                        </g>
                        <g transform="translate(320,60)">
                          <circle r="12" fill="rgba(244, 63, 94, 0.15)" className="animate-ping" style={{ animationDuration: '3s' }} />
                          <circle r="6" fill="#f43f5e" stroke="#ffffff" strokeWidth="2" />
                          <text y="3" textAnchor="middle" fill="#ffffff" fontSize="8" fontWeight="bold" fontFamily="sans-serif">B</text>
                        </g>
                        <foreignObject x="40" y="70" width="130" height="42">
                          <div className="bg-slate-900/90 text-white text-[9px] px-2.5 py-1.5 rounded-xl shadow-md border border-slate-700/40 backdrop-blur-sm animate-fade-in font-medium max-w-[120px]">
                            <p className="truncate font-black text-emerald-400">Pickup</p>
                            <p className="truncate text-[8px] text-slate-300">{from.split(',')[0]}</p>
                          </div>
                        </foreignObject>
                        <foreignObject x="210" y="15" width="130" height="42">
                          <div className="bg-slate-900/90 text-white text-[9px] px-2.5 py-1.5 rounded-xl shadow-md border border-slate-700/40 backdrop-blur-sm animate-fade-in font-medium max-w-[120px]">
                            <p className="truncate font-black text-rose-400">Destination</p>
                            <p className="truncate text-[8px] text-slate-300">{to.split(',')[0]}</p>
                          </div>
                        </foreignObject>
                      </>
                    ) : (
                      <>
                        <path d="M 60,120 L 180,120 L 180,60 L 320,60" fill="none" stroke="#e2e8f0" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                        <circle cx="60" cy="120" r="5" fill="#cbd5e1" stroke="#ffffff" strokeWidth="2" />
                        <circle cx="320" cy="60" r="5" fill="#cbd5e1" stroke="#ffffff" strokeWidth="2" />
                        <text x="200" y="85" textAnchor="middle" fill="#94a3b8" fontSize="10" fontWeight="bold">
                          Enter your route to preview dispatch
                        </text>
                      </>
                    )}
                  </svg>
                </div>

                <div className="flex items-center gap-6 text-xs text-slate-500 border-t border-slate-100 pt-4">
                  {["Verified drivers", "Fixed prices", "24/7 support"].map((t, i) => (
                    <span key={i} className="flex items-center gap-1.5 font-semibold">
                      <svg className="w-3.5 h-3.5 text-emerald-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column - Booking Form */}
            <div className="order-1 lg:order-2 lg:col-span-6 xl:col-span-5 w-full flex flex-col gap-6">
              {/* Progress bar */}
              <div className="flex items-center gap-0 bg-white/60 border border-slate-200/50 p-4 rounded-2xl shadow-sm backdrop-blur-md">
                {["Route", "Details", "Confirm"].map((label, i) => {
                  const n = i + 1;
                  const done = step > n;
                  const active = step === n;
                  return (
                    <React.Fragment key={n}>
                      <div className="flex flex-col items-center gap-1.5">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all duration-300 ${
                          done   ? "bg-emerald-600 text-white shadow-sm"
                          : active ? "bg-slate-950 text-white shadow-md shadow-slate-950/10"
                          : "bg-slate-200 text-slate-400"
                        }`}>
                          {done ? "✓" : n}
                        </div>
                        <span className={`text-[10px] font-black uppercase tracking-wider ${active ? "text-slate-900 font-extrabold" : done ? "text-emerald-600" : "text-slate-400"}`}>{label}</span>
                      </div>
                      {i < 2 && <div className={`flex-1 h-px mx-2 mb-4 transition-all ${step > n ? "bg-emerald-600/45" : "bg-slate-200"}`} />}
                    </React.Fragment>
                  );
                })}
              </div>

              {/* Stepper Card Body Wrapper */}
              <div className="premium-glass-card p-6 sm:p-8 bg-white border border-slate-200/50 shadow-xl">

              {/* Server error */}
              {serverError && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-655 text-sm mb-5 flex gap-2">
                  <svg className="w-5 h-5 text-red-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <span>{serverError}</span>
                </div>
              )}

              {/* ─── STEP 1: Route ─── */}
              {step === 1 && (
                <div className="flex flex-col gap-5 animate-fade-in">
                  <div>
                    <h1 className="text-2xl font-black">Where are you going?</h1>
                    <p className="text-slate-500 text-sm mt-1">Enter your pickup and drop-off location</p>
                  </div>

                  {/* Ride type */}
                  <div className="flex gap-2 bg-slate-100 border border-slate-200 p-1 rounded-xl">
                    {([
                      { val: "CAR_WITH_DRIVER", label: "Car & Driver" },
                      { val: "DRIVER_ONLY", label: "Driver Only" }
                    ] as const).map(opt => (
                      <button key={opt.val} type="button" onClick={() => setServiceType(opt.val)}
                        className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all cursor-pointer ${serviceType === opt.val ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
                        {opt.label}
                      </button>
                    ))}
                  </div>

                  {/* Pickup */}
                  <div>
                    <label className="text-xs text-slate-500 font-bold uppercase tracking-wider block mb-2">Pickup</label>
                    <input type="text" placeholder="Where should we pick you up?"
                      value={from} onChange={e => { setFrom(e.target.value); setErrors(p => ({ ...p, from: "" })); }}
                      className={`w-full bg-white border rounded-xl py-4 px-4 text-sm focus:outline-none transition-all ${errors.from ? "border-red-500/60" : "border-slate-200 focus:border-emerald-600"}`}
                    />
                    {errors.from && <p className="text-xs text-red-600 mt-1">{errors.from}</p>}
                  </div>

                  {/* Drop-off */}
                  <div>
                    <label className="text-xs text-slate-500 font-bold uppercase tracking-wider block mb-2">Drop-off</label>
                    <input type="text" placeholder="Where are you headed?"
                      value={to} onChange={e => { setTo(e.target.value); setErrors(p => ({ ...p, to: "" })); }}
                      className={`w-full bg-white border rounded-xl py-4 px-4 text-sm focus:outline-none transition-all ${errors.to ? "border-red-500/60" : "border-slate-200 focus:border-emerald-600"}`}
                    />
                    {errors.to && <p className="text-xs text-red-600 mt-1">{errors.to}</p>}
                  </div>

                  {/* Quick routes */}
                  <div>
                    <p className="text-xs text-slate-400 mb-2">Popular routes</p>
                    <div className="flex flex-col gap-2">
                      {[
                        { label: "Airport → City", from: "JFK International Airport, New York", to: "Times Square, Manhattan, NY", price: "$105" },
                        { label: "Bridge → Airport", from: "Brooklyn Bridge Park, New York", to: "LaGuardia Airport, New York", price: "$64" },
                        { label: "Station → Museum", from: "Grand Central Terminal, New York", to: "Metropolitan Museum of Art, NY", price: "$22" },
                      ].map((r, i) => (
                        <button key={i} type="button"
                          onClick={() => { setFrom(r.from); setTo(r.to); setErrors({ from: "", to: "" }); }}
                          className="flex items-center justify-between bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-350 rounded-xl px-4 py-3 cursor-pointer transition-all text-left"
                        >
                          <div className="flex flex-col gap-0.5">
                            <span className="text-sm font-bold text-slate-800">{r.label}</span>
                            <span className="text-xs text-slate-500 truncate max-w-[260px]">{r.from.split(",")[0]} → {r.to.split(",")[0]}</span>
                          </div>
                          <span className="text-sm font-black text-emerald-600 shrink-0 ml-4">{r.price}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <button type="button" onClick={goNext} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-4 rounded-xl text-base cursor-pointer transition-all mt-2 shadow-sm">
                    Continue →
                  </button>
                </div>
              )}

              {/* ─── STEP 2: Date, Time & Vehicle ─── */}
              {step === 2 && (
                <div className="flex flex-col gap-5 animate-fade-in">
                  <div>
                    <h1 className="text-2xl font-black">When do you need it?</h1>
                    <p className="text-slate-500 text-sm mt-1">Pick a date and time for your ride</p>
                  </div>

                  {/* Route summary bar */}
                  <div className="bg-white border border-slate-200 rounded-xl px-4 py-3 flex items-center gap-3 text-sm shadow-sm">
                    <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-600 shrink-0" />
                        <span className="text-slate-700 truncate">{from.split(",")[0]}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-rose-500 rotate-45 shrink-0" />
                        <span className="text-slate-700 truncate">{to.split(",")[0]}</span>
                      </div>
                    </div>
                    <button onClick={() => setStep(1)} className="text-xs text-slate-400 hover:text-slate-700 cursor-pointer transition-colors shrink-0">Edit</button>
                  </div>

                  {/* Date & Time */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-slate-500 font-bold uppercase tracking-wider block mb-2">Date</label>
                      <input type="date" value={date} min={new Date().toISOString().split("T")[0]}
                        onChange={e => { setDate(e.target.value); setErrors(p => ({ ...p, date: "" })); }}
                        className={`w-full bg-white border rounded-xl py-3.5 px-4 text-sm focus:outline-none transition-all ${errors.date ? "border-red-500/60" : "border-slate-200 focus:border-emerald-600"}`}
                      />
                      {errors.date && <p className="text-xs text-red-650 mt-1">{errors.date}</p>}
                    </div>
                    <div>
                      <label className="text-xs text-slate-500 font-bold uppercase tracking-wider block mb-2">Time</label>
                      <input type="time" value={time}
                        onChange={e => { setTime(e.target.value); setErrors(p => ({ ...p, time: "" })); }}
                        className={`w-full bg-white border rounded-xl py-3.5 px-4 text-sm focus:outline-none transition-all ${errors.time ? "border-red-500/60" : "border-slate-200 focus:border-emerald-600"}`}
                      />
                      {errors.time && <p className="text-xs text-red-650 mt-1">{errors.time}</p>}
                    </div>
                  </div>

                  {/* Vehicle type filter */}
                  {serviceType === "CAR_WITH_DRIVER" && (
                    <div className="flex flex-col gap-3">
                      <label className="text-xs text-slate-500 font-bold uppercase tracking-wider">Vehicle type</label>
                      <div className="grid grid-cols-5 gap-2">
                        {Object.entries(VEHICLES_UI).map(([key, v]) => (
                          <button key={key} type="button"
                            onClick={() => { setVehicleTypeFilter(key); setSelectedVehicleId(""); setSelectedVehicle(null); }}
                            className={`flex flex-col items-center gap-1 py-3 rounded-xl border text-center cursor-pointer transition-all ${vehicleTypeFilter === key ? "border-emerald-600 bg-emerald-50 text-emerald-800 shadow-sm" : "border-slate-200 text-slate-400 hover:border-slate-350 hover:text-slate-700"}`}
                          >
                            <VehicleIcon type={key} className="w-5 h-5" />
                            <span className="text-[10px] font-bold">{v.label}</span>
                          </button>
                        ))}
                      </div>

                      {/* Vehicle list */}
                      {errors.vehicle && <p className="text-xs text-red-600">{errors.vehicle}</p>}

                      {loadingVehicles ? (
                        <div className="flex items-center justify-center py-10 gap-3 text-slate-500 text-sm">
                          <div className="w-5 h-5 rounded-full border-2 border-emerald-600 border-t-transparent animate-spin" />
                          Looking for available vehicles...
                        </div>
                      ) : vehicles.length === 0 ? (
                        <div className="text-center py-8 border border-slate-200 rounded-xl">
                          <p className="text-slate-550 font-bold">No {ui.label}s available right now</p>
                          <p className="text-xs text-slate-400 mt-1">Try a different vehicle type</p>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-2">
                          {vehicles.map(v => {
                            const avail = v.availabilityStatus === "AVAILABLE";
                            const sel = selectedVehicleId === v.id;
                            return (
                              <div key={v.id} onClick={() => { if (avail) { setSelectedVehicleId(v.id); setSelectedVehicle(v); setErrors(p => ({ ...p, vehicle: "" })); } }}
                                className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${!avail ? "opacity-40 cursor-not-allowed border-slate-200 bg-slate-50" : sel ? "border-emerald-600 bg-emerald-50/50 cursor-pointer" : "border-slate-200 hover:border-slate-350 cursor-pointer hover:bg-slate-50"}`}
                              >
                                <VehicleIcon type={v.vehicleType} className="w-6 h-6 text-slate-700" />
                                <div className="flex-1">
                                  <p className="font-bold text-slate-800 text-sm">{v.model}</p>
                                  <p className="text-xs text-slate-500 mt-0.5">{v.registrationNumber} · {v.seatingCapacity} seats</p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${avail ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-slate-100 text-slate-500 border border-slate-200"}`}>
                                    {avail ? "Available" : "Busy"}
                                  </span>
                                  {sel && (
                                    <div className="w-5 h-5 rounded-full bg-emerald-600 flex items-center justify-center shrink-0">
                                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex gap-3 pt-2">
                    <button type="button" onClick={() => setStep(1)} className="border border-slate-200 hover:bg-slate-50 text-slate-500 font-bold px-5 py-3.5 rounded-xl text-sm cursor-pointer transition-all">
                      ← Back
                    </button>
                    <button type="button" onClick={goNext} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-black py-3.5 rounded-xl text-sm cursor-pointer transition-all shadow-sm">
                      Review Booking →
                    </button>
                  </div>
                </div>
              )}

              {/* ─── STEP 3: Confirm ─── */}
              {step === 3 && (
                <form onSubmit={handleConfirm} className="flex flex-col gap-5 animate-fade-in">
                  <div>
                    <h1 className="text-2xl font-black">Review & confirm</h1>
                    <p className="text-slate-500 text-sm mt-1">Check the details and choose your payment</p>
                  </div>

                  {/* Full route card */}
                  <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                    <div className="p-5 flex flex-col gap-4">
                      <div className="flex items-start gap-3">
                        <div className="flex flex-col items-center gap-1 mt-1">
                          <div className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                          <div className="w-px h-8 bg-slate-200" />
                          <div className="w-2.5 h-2.5 bg-rose-500 rotate-45" />
                        </div>
                        <div className="flex flex-col gap-3 flex-1">
                          <div>
                            <p className="text-[10px] text-slate-400 uppercase font-bold">Pickup</p>
                            <p className="text-sm text-slate-800 font-bold">{from}</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-slate-400 uppercase font-bold">Drop-off</p>
                            <p className="text-sm text-slate-800 font-bold">{to}</p>
                          </div>
                        </div>
                        <button type="button" onClick={() => setStep(1)} className="text-xs text-slate-450 hover:text-slate-700 cursor-pointer shrink-0">Edit</button>
                      </div>

                      <div className="grid grid-cols-3 gap-2 border-t border-slate-100 pt-4">
                        {[
                          { l: "Date", v: new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" }) },
                          { l: "Time", v: time },
                          { l: "Type", v: serviceType === "CAR_WITH_DRIVER" ? "Car+Driver" : "Driver Only" },
                        ].map((d, i) => (
                          <div key={i} className="bg-slate-50 rounded-xl p-3 text-center">
                            <p className="text-[9px] text-slate-400 uppercase font-bold mb-1">{d.l}</p>
                            <p className="text-xs font-black text-slate-800">{d.v}</p>
                          </div>
                        ))}
                      </div>

                       {selectedVehicle && (
                        <div className="flex items-center gap-3 border-t border-slate-100 pt-3">
                          <VehicleIcon type={selectedVehicle.vehicleType} className="w-6 h-6 text-slate-700" />
                          <div>
                            <p className="text-sm font-bold text-slate-800">{selectedVehicle.model}</p>
                            <p className="text-xs text-slate-500">{selectedVehicle.registrationNumber} · {selectedVehicle.seatingCapacity} seats</p>
                          </div>
                          <button type="button" onClick={() => setStep(2)} className="ml-auto text-xs text-slate-450 hover:text-slate-700 cursor-pointer">Change</button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Payment */}
                  <div>
                    <label className="text-xs text-slate-500 font-bold uppercase tracking-wider block mb-3">Payment method</label>
                    <div className="grid grid-cols-3 gap-2">
                      {([
                        { val: "CARD", label: "Card", sub: "Credit / Debit" },
                        { val: "UPI", label: "UPI", sub: "Instant transfer" },
                        { val: "CASH", label: "Cash", sub: "Pay on arrival" }
                      ] as const).map(opt => (
                        <button key={opt.val} type="button" onClick={() => setPaymentMethod(opt.val)}
                          className={`flex flex-col items-center gap-1 py-4 rounded-xl border font-bold text-sm cursor-pointer transition-all ${paymentMethod === opt.val ? "border-emerald-600 bg-emerald-50 text-emerald-800 shadow-sm" : "border-slate-200 text-slate-500 hover:border-slate-350 hover:text-slate-700"}`}
                        >
                          <span>{opt.label}</span>
                          <span className="text-[10px] font-medium opacity-60">{opt.sub}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Price breakdown */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col gap-2.5 shadow-sm">
                    <p className="text-xs text-slate-400 uppercase font-bold tracking-widest mb-1">Price breakdown</p>
                    {[
                      { label: "Base fare",      val: `$${baseFare.toFixed(2)}` },
                      { label: `Distance (${dist} km at $${serviceType === "CAR_WITH_DRIVER" ? ui.rate : 2.0}/km)`, val: `$${distFare}` },
                      { label: "Service fee (5%)", val: `$${serviceFee}` },
                    ].map((row, i) => (
                      <div key={i} className="flex items-center justify-between text-sm text-slate-500">
                        <span>{row.label}</span>
                        <span className="font-mono">{row.val}</span>
                      </div>
                    ))}
                    <div className="border-t border-slate-100 pt-2.5 flex items-center justify-between">
                      <span className="font-black text-slate-800">Total</span>
                      <span className="text-xl font-black text-emerald-600 font-mono">${total}</span>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button type="button" onClick={() => setStep(2)} className="border border-slate-200 hover:bg-slate-50 text-slate-500 font-bold px-5 py-4 rounded-xl text-sm cursor-pointer transition-all">
                      ← Back
                    </button>
                    <button type="submit" disabled={submitting} className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-black py-4 rounded-xl text-base cursor-pointer transition-all flex items-center justify-center gap-2 shadow-sm">
                      {submitting ? (
                        <><div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" /> Booking...</>
                      ) : (
                        `Confirm & Pay $${total}`
                      )}
                    </button>
                  </div>
                </form>
              )}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}



"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../../components/ui/Navbar";
import { customerAuthHeader } from "../../lib/session";
import { VEHICLE_UI_META } from "../../lib/types";
import { POPULAR_ROUTES, VEHICLE_RATES } from "../../lib/validations";
import VehicleIcon from "../../components/vehicles/VehicleIcon";

const ESTIMATE_FARE_QUERY = `
  query EstimateFare($distanceKm: Float!, $vehicleType: VehicleType!, $bookingType: BookingType!) {
    estimateFare(distanceKm: $distanceKm, vehicleType: $vehicleType, bookingType: $bookingType) {
      baseFare distanceFare serviceFee totalFare ratePerKm distanceKm estimatedDurationMin vehicleType bookingType
    }
  }
`;

export default function FareEstimatorPage() {
  const router = useRouter();
  const [vehicleType, setVehicleType] = useState("SEDAN");
  const [bookingType, setBookingType] = useState<"VEHICLE_AND_DRIVER" | "DRIVER_ONLY">("VEHICLE_AND_DRIVER");
  const [distance, setDistance] = useState(15);
  const [estimate, setEstimate] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchEstimate();
  }, [vehicleType, bookingType, distance]);

  async function fetchEstimate() {
    setLoading(true);
    try {
      const res = await fetch("/api/graphql", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: customerAuthHeader() },
        body: JSON.stringify({
          query: ESTIMATE_FARE_QUERY,
          variables: { distanceKm: distance, vehicleType, bookingType },
        }),
      });
      const { data } = await res.json();
      setEstimate(data?.estimateFare ?? null);
    } catch {
      // fallback: compute client-side
      const rate = bookingType === "VEHICLE_AND_DRIVER" ? (VEHICLE_RATES[vehicleType] ?? 3.5) : 2.0;
      const base = 5;
      const distFare = parseFloat((distance * rate).toFixed(2));
      const svc = parseFloat(((base + distFare) * 0.05).toFixed(2));
      setEstimate({ baseFare: base, distanceFare: distFare, serviceFee: svc, totalFare: parseFloat((base + distFare + svc).toFixed(2)), ratePerKm: rate, distanceKm: distance, estimatedDurationMin: Math.round(distance * 2.5) });
    } finally {
      setLoading(false);
    }
  }

  const meta = VEHICLE_UI_META[vehicleType] ?? VEHICLE_UI_META.SEDAN;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      <Navbar />
      <div className="pt-32 px-6 max-w-4xl mx-auto flex flex-col gap-8">

        {/* Header */}
        <div>
          <p className="text-xs text-emerald-600 uppercase font-bold tracking-widest mb-2">No surprises</p>
          <h1 className="text-3xl font-heading font-black text-slate-900">Fare Estimator</h1>
          <p className="text-slate-500 text-sm mt-1 leading-relaxed">Get an instant fare estimate before you book. Prices are fixed — no surge pricing.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* Controls */}
          <div className="flex flex-col gap-6">

            {/* Ride type */}
            <div className="premium-glass-card p-5 shadow-md border border-slate-200/50">
              <label className="text-xs text-slate-400 uppercase font-black tracking-wider block mb-3 font-heading">Ride Type</label>
              <div className="flex gap-2 bg-slate-100/80 p-1 rounded-xl border border-slate-200/40">
                {[
                  { val: "VEHICLE_AND_DRIVER", label: "Car + Driver" },
                  { val: "DRIVER_ONLY",        label: "Driver Only" },
                ].map((o) => (
                  <button
                    key={o.val}
                    onClick={() => setBookingType(o.val as any)}
                    className={`flex-1 py-2.5 text-xs font-black rounded-lg transition-all cursor-pointer ${
                      bookingType === o.val ? "bg-emerald-600 text-white shadow-sm" : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Vehicle type */}
            {bookingType === "VEHICLE_AND_DRIVER" && (
              <div className="premium-glass-card p-5 shadow-md border border-slate-200/50">
                <label className="text-xs text-slate-400 uppercase font-black tracking-wider block mb-3 font-heading">Vehicle Type</label>
                <div className="grid grid-cols-5 gap-2">
                  {Object.entries(VEHICLE_UI_META).map(([key, v]) => (
                    <button
                      key={key}
                      onClick={() => setVehicleType(key)}
                      className={`flex flex-col items-center gap-1.5 py-3 rounded-xl border text-center cursor-pointer transition-all duration-200 ${
                        vehicleType === key 
                          ? "border-slate-900 bg-slate-900 text-white shadow-md" 
                          : "border-slate-200/60 text-slate-600 hover:border-slate-400 hover:bg-slate-50"
                      }`}
                    >
                      <VehicleIcon type={key} className="w-5 h-5" />
                      <span className="text-[9px] font-black">{v.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Distance slider */}
            <div className="premium-glass-card p-5 shadow-md border border-slate-200/50">
              <label className="text-xs text-slate-400 uppercase font-black tracking-wider block mb-3 font-heading">
                Distance: <span className="text-emerald-600 font-black font-mono text-base">{distance} km</span>
              </label>
              <input
                type="range" min={1} max={100} value={distance}
                onChange={(e) => setDistance(Number(e.target.value))}
                className="w-full accent-emerald-600 cursor-pointer h-2 bg-slate-100 rounded-lg appearance-none"
              />
              <div className="flex justify-between text-[10px] font-bold text-slate-400 mt-2">
                <span>1 km</span>
                <span>50 km</span>
                <span>100 km</span>
              </div>
            </div>

            {/* Popular routes shortcut */}
            <div className="premium-glass-card p-5 shadow-md border border-slate-200/50">
              <p className="text-xs text-slate-400 uppercase font-black tracking-wider mb-3 font-heading">Popular Routes</p>
              <div className="flex flex-col gap-2">
                {POPULAR_ROUTES.map((r) => (
                  <button
                    key={r.label}
                    onClick={() => setDistance(r.dist)}
                    className="flex items-center justify-between bg-slate-50/50 hover:bg-slate-50 border border-slate-200/50 rounded-xl px-4 py-3 cursor-pointer transition-all duration-200 text-left hover:border-slate-350"
                  >
                    <div>
                      <p className="text-xs sm:text-sm font-bold text-slate-800">{r.label}</p>
                      <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5">{r.dist} km · ~{r.dur} min</p>
                    </div>
                    <span className="text-xs sm:text-sm font-black text-emerald-600 ml-4 shrink-0 font-mono">${r.fare}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Result card */}
          <div className="flex flex-col gap-5 sticky top-32">
            <div className="premium-glass-card p-6 shadow-xl border border-slate-200/50 flex flex-col gap-5 bg-white">
              <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-700">
                  <VehicleIcon type={vehicleType} className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                    {bookingType === "VEHICLE_AND_DRIVER" ? `${meta.label} · Car & Driver` : "Driver Only"}
                  </p>
                  <p className="text-base font-heading font-black text-slate-800">{distance} km Ride Estimate</p>
                </div>
              </div>

              {loading ? (
                <div className="flex items-center gap-2.5 text-slate-400 text-sm py-12 justify-center font-bold">
                  <div className="w-5 h-5 rounded-full border-2 border-emerald-600 border-t-transparent animate-spin" />
                  Calculating fare details...
                </div>
              ) : estimate ? (
                <div className="flex flex-col gap-5">
                  <div className="bg-slate-50/80 rounded-2xl p-5 flex flex-col gap-3 border border-slate-200/30">
                    {[
                      { label: "Base dispatch fare",                         val: `$${estimate.baseFare.toFixed(2)}` },
                      { label: `Distance rate (${distance} km × $${estimate.ratePerKm.toFixed(2)}/km)`, val: `$${estimate.distanceFare.toFixed(2)}` },
                      { label: "Platform service fee (5%)",                 val: `$${estimate.serviceFee.toFixed(2)}` },
                    ].map((r) => (
                      <div key={r.label} className="flex justify-between text-xs sm:text-sm text-slate-500">
                        <span>{r.label}</span>
                        <span className="font-mono font-bold text-slate-700">{r.val}</span>
                      </div>
                    ))}
                    
                    {/* Visual dashed separator line */}
                    <div className="border-t border-dashed border-slate-200 my-2 pt-4 flex justify-between items-center">
                      <span className="font-heading font-black text-slate-800">Guaranteed Fare</span>
                      <span className="text-3xl font-heading font-black text-emerald-600 font-mono">${estimate.totalFare.toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2.5 bg-emerald-50/30 border border-emerald-200/30 rounded-2xl p-4">
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <svg className="w-4 h-4 text-emerald-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      Estimated trip duration: <span className="font-bold text-slate-700 font-mono">~{estimate.estimatedDurationMin} mins</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <svg className="w-4 h-4 text-emerald-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                      Fixed upfront pricing — zero hidden charges
                    </div>
                  </div>

                  <button
                    onClick={() => router.push("/booking")}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm py-4 rounded-xl cursor-pointer transition-all duration-200 shadow-md shadow-emerald-600/10 hover:shadow-emerald-600/20 active:scale-[0.99]"
                  >
                    Proceed to Booking →
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

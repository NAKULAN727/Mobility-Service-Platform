"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../components/ui/Navbar";
import VehicleIcon from "../components/vehicles/VehicleIcon";
import { Shield, Car, Clock, UserPlus, CheckCircle, ArrowRight } from "lucide-react";

const QUICK_ROUTES = [
  { label: "Airport → City", from: "JFK International Airport, New York", to: "Times Square, Manhattan, NY", dist: 28.5, dur: 45, fare: 105 },
  { label: "Bridge → Airport", from: "Brooklyn Bridge Park, New York", to: "LaGuardia Airport, New York", dist: 16.8, dur: 30, fare: 64 },
  { label: "Station → Museum", from: "Grand Central Terminal, New York", to: "Metropolitan Museum of Art, NY", dist: 4.2, dur: 15, fare: 22 },
];

export default function HomePage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"RIDE" | "DRIVER" | "RENTALS">("RIDE");

  const handleBookNow = () => {
    const pickup = encodeURIComponent("Forum Mall, Koramangala");
    const dest = encodeURIComponent("MG Road Metro Station");
    const type = activeTab === "RIDE" ? "SEDAN" : activeTab === "DRIVER" ? "DRIVER_ONLY" : "SUV";
    router.push(`/booking?from=${pickup}&to=${dest}&vehicleType=${type}`);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 overflow-x-hidden font-sans flex flex-col">

      {/* COVID-19 Safety Banner */}
      <div className="bg-slate-950 text-white text-center py-2 px-4 text-xs font-semibold tracking-wider z-50">
        COVID-19 Safety Protocol: All drivers are fully vaccinated and wear masks.
      </div>

      {/* ─── NAVBAR ─── */}
      <Navbar />

      {/* ─── HERO ─── */}
      <section className="relative min-h-screen flex items-center justify-center px-6 pt-32 pb-20 overflow-hidden">
        {/* Mesh Background */}
        <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
        {/* Glow Effects */}
        <div className="absolute top-1/4 left-[5%] w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-[5%] w-[600px] h-[600px] bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none" />

        <div className="relative z-10 w-full max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column — Title & Map Simulation */}
          <div className="lg:col-span-7 flex flex-col gap-8 text-left">
            <div className="inline-flex items-center gap-1.5 bg-emerald-50 border border-emerald-200/50 text-emerald-700 text-xs font-bold px-4 py-2 rounded-full w-fit">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
              Drivers available near you now
            </div>

            <div className="flex flex-col gap-4">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-heading font-black leading-[1.05] tracking-tight text-slate-900">
                Go anywhere. <br />
                <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">Book a verified driver.</span>
              </h1>
              <p className="text-base sm:text-lg text-slate-500 max-w-xl leading-relaxed">
                Request rides and hire verified, background-checked personal drivers on demand. DriveMate connects you to top-rated mobility professionals with transparent pricing.
              </p>
            </div>

            {/* Live Routing Simulator Map Block */}
            <div className="relative w-full max-w-lg h-52 bg-white border border-slate-200/60 rounded-2xl overflow-hidden shadow-md group">
              <img
                src="/map_route.png"
                alt="Live Routing Simulator"
                className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/20 via-transparent to-transparent pointer-events-none" />
              <div className="absolute top-3 right-3 flex items-center gap-1.5 text-[10px] font-mono font-bold text-slate-700 bg-white/80 backdrop-blur-sm px-3 py-1.5 rounded-full uppercase tracking-wider shadow-sm border border-slate-200/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Routing Simulator
              </div>
            </div>

            <div className="flex items-center gap-6 text-sm text-slate-500">
              {["Verified drivers", "Fixed prices", "24/7 support"].map((t, i) => (
                <span key={i} className="flex items-center gap-1.5 font-semibold">
                  <svg className="w-4 h-4 text-emerald-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
                  {t}
                </span>
              ))}
            </div>
          </div>

          {/* Right Column — Uber/Ola Inspired Booking Widget */}
          <div className="lg:col-span-5 w-full bg-white border border-slate-200/80 rounded-3xl shadow-xl overflow-hidden premium-glass-card">
            
            {/* Widget Tabs */}
            <div className="flex border-b border-slate-100 bg-slate-50/50">
              <button
                onClick={() => setActiveTab("RIDE")}
                className={`flex-1 py-4 text-xs font-black transition-all duration-150 flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeTab === "RIDE" 
                    ? "bg-white border-b-2 border-emerald-600 text-emerald-700" 
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <Car className="h-4 w-4" />
                Ride
              </button>
              <button
                onClick={() => setActiveTab("DRIVER")}
                className={`flex-1 py-4 text-xs font-black transition-all duration-150 flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeTab === "DRIVER" 
                    ? "bg-white border-b-2 border-emerald-600 text-emerald-700" 
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <UserPlus className="h-4 w-4" />
                Rent Driver
              </button>
              <button
                onClick={() => setActiveTab("RENTALS")}
                className={`flex-1 py-4 text-xs font-black transition-all duration-150 flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeTab === "RENTALS" 
                    ? "bg-white border-b-2 border-emerald-600 text-emerald-700" 
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <Clock className="h-4 w-4" />
                Hourly
              </button>
            </div>

            {/* Widget Form Body */}
            <div className="p-6 space-y-5">
              <h3 className="font-extrabold text-slate-800 text-base">
                {activeTab === "RIDE" && "Request a ride now"}
                {activeTab === "DRIVER" && "Hire a professional driver"}
                {activeTab === "RENTALS" && "Book car and driver by the hour"}
              </h3>

              {/* Simulated Address Inputs */}
              <div className="space-y-3.5 relative">
                {/* Connector Line */}
                <div className="absolute left-5 top-8 bottom-8 w-0.5 bg-slate-200 z-0" />

                <div className="relative z-10 flex items-center gap-3 bg-slate-50 border border-slate-200/60 rounded-xl p-3">
                  <div className="h-3 w-3 rounded-full bg-emerald-500 shrink-0 mx-1 shadow-[0_0_0_2px_rgba(16,185,129,0.2)]" />
                  <input
                    type="text"
                    readOnly
                    value="Forum Mall, Koramangala"
                    className="bg-transparent text-sm w-full outline-none font-bold text-slate-700"
                  />
                </div>

                <div className="relative z-10 flex items-center gap-3 bg-slate-50 border border-slate-200/60 rounded-xl p-3">
                  <div className="h-3 w-3 rounded bg-rose-500 shrink-0 mx-1 shadow-[0_0_0_2px_rgba(244,63,94,0.2)]" />
                  <input
                    type="text"
                    readOnly
                    value="MG Road Metro Station"
                    className="bg-transparent text-sm w-full outline-none font-bold text-slate-700"
                  />
                </div>
              </div>

              {/* Ride Categories Selector */}
              <div className="space-y-2 pt-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Suggested Options</span>
                
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between p-3 border-2 border-emerald-600 rounded-2xl bg-emerald-50/20 cursor-pointer">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 bg-emerald-100/50 rounded-xl flex items-center justify-center shrink-0 border border-emerald-200/40">
                        <Car className="h-5 w-5 text-emerald-600" />
                      </div>
                      <div>
                        <span className="font-black text-slate-800 text-sm block">DriveMate Sedan</span>
                        <span className="text-slate-500 text-xs block">Top rated drivers • 3 mins away</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-black text-slate-900 block text-sm">₹180</span>
                      <span className="text-[9px] bg-yellow-400 font-bold px-1.5 py-0.5 rounded text-yellow-950 uppercase tracking-wide">Popular</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 border border-slate-200 hover:border-slate-300 rounded-2xl bg-white cursor-pointer transition-colors group">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 bg-slate-100 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-slate-200 transition-colors">
                        <Car className="h-5 w-5 text-slate-500" />
                      </div>
                      <div>
                        <span className="font-semibold text-slate-700 text-sm block">DriveMate XL</span>
                        <span className="text-slate-500 text-xs block">Spacious SUVs • 6 mins away</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-black text-slate-700 block text-sm">₹290</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Booking CTA Button */}
              <button 
                onClick={handleBookNow}
                className="w-full text-center bg-slate-900 hover:bg-slate-850 text-white font-black py-4 rounded-2xl text-sm transition-all duration-200 cursor-pointer active:scale-[0.99]"
              >
                Book Now with DriveMate
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section className="py-24 px-6 border-t border-slate-200 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-emerald-600 text-xs font-bold uppercase tracking-widest mb-3">Simple process</p>
            <h2 className="text-3xl sm:text-4xl font-heading font-black text-slate-900">Ride in 3 easy steps</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                n: "01",
                title: "Enter your route",
                body: "Type where you're starting from and where you want to go. Or pick from popular routes.",
                color: "#059669",
              },
              {
                n: "02",
                title: "Choose your vehicle",
                body: "Pick a car type — Sedan, SUV, Luxury, or Van. We match you with a nearby verified driver.",
                color: "#d97706",
              },
              {
                n: "03",
                title: "Sit back & ride",
                body: "Confirm with a secure 6-digit PIN when your driver arrives. Track the ride live.",
                color: "#7c3aed",
              },
            ].map((s, i) => (
              <div key={i} className="relative flex flex-col gap-4 p-6 bg-slate-50/50 hover:bg-slate-50 rounded-2xl border border-slate-200/60 transition-all duration-300 hover:shadow-md hover:shadow-slate-100/50 group">
                <span className="text-5xl font-heading font-black transition-transform duration-300 group-hover:translate-x-1" style={{ color: s.color, opacity: 0.18 }}>{s.n}</span>
                <div className="absolute top-6 left-6 w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs font-black shadow-md" style={{ backgroundColor: s.color }}>
                  {i + 1}
                </div>
                <div className="pt-2">
                  <h3 className="text-base font-heading font-black text-slate-800 mb-2">{s.title}</h3>
                  <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">{s.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── VEHICLE TYPES ─── */}
      <section className="py-24 px-6 border-t border-slate-200 bg-slate-50/50">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-12">
            <div>
              <p className="text-emerald-600 text-xs font-bold uppercase tracking-widest mb-3">Choose your style</p>
              <h2 className="text-3xl sm:text-4xl font-heading font-black text-slate-900">Vehicles for every need</h2>
            </div>
            <button onClick={() => router.push("/booking")} className="text-sm text-emerald-600 hover:text-emerald-700 font-bold cursor-pointer whitespace-nowrap group">
              Book a ride now <span className="inline-block transition-transform duration-200 group-hover:translate-x-1">→</span>
            </button>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { name: "Sedan",   desc: "4 seats · Daily commute",        price: "From ₹180", color: "#059669", type: "SEDAN" },
              { name: "SUV",     desc: "6 seats · Family trips",          price: "From ₹290", color: "#2563eb", type: "SUV" },
              { name: "Luxury",  desc: "4 seats · Executive travel",      price: "From ₹450", color: "#7c3aed", type: "LUXURY" },
              { name: "Van",     desc: "12 seats · Group travel",         price: "From ₹380", color: "#d97706", type: "VAN" },
            ].map((v) => (
              <div
                key={v.type}
                onClick={() => router.push(`/booking?vehicleType=${v.type}`)}
                className="group relative bg-white border border-slate-200/60 hover:border-slate-300 rounded-2xl p-5 cursor-pointer transition-all duration-300 hover:-translate-y-1.5 hover:shadow-lg flex flex-col gap-4"
              >
                <div className="p-3 bg-slate-50 rounded-xl w-fit border border-slate-100/80 transition-transform duration-300 group-hover:scale-105" style={{ color: v.color }}>
                  <VehicleIcon type={v.type} className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="font-heading font-black text-slate-800 text-sm sm:text-base">{v.name}</h3>
                  <p className="text-[11px] sm:text-xs text-slate-500 mt-1">{v.desc}</p>
                </div>
                <div className="mt-auto pt-2 flex items-center justify-between">
                  <span className="text-xs sm:text-sm font-black" style={{ color: v.color }}>{v.price}</span>
                  <span className="text-[10px] uppercase font-bold text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300">Book Now</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Highlights Grid (Member 1 integration) */}
      <section className="bg-white border-t border-slate-200 py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-emerald-600 text-xs font-bold uppercase tracking-widest mb-3">Security & Quality</p>
            <h2 className="text-3xl sm:text-4xl font-heading font-black text-slate-900">Uber & Ola Standards</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            <div className="space-y-3 p-5 rounded-2xl bg-slate-50/50 hover:bg-slate-50 transition-colors border border-slate-200/50">
              <div className="h-10 w-10 bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center rounded-xl shadow-sm">
                <Shield className="h-5 w-5" />
              </div>
              <h3 className="font-extrabold text-slate-800 text-base">Uber-Grade Verification</h3>
              <p className="text-slate-550 text-sm leading-relaxed">
                Every driver undergoes biometric checks, license registry matches, and criminal records reviews.
              </p>
            </div>

            <div className="space-y-3 p-5 rounded-2xl bg-slate-50/50 hover:bg-slate-50 transition-colors border border-slate-200/50">
              <div className="h-10 w-10 bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center rounded-xl shadow-sm">
                <Car className="h-5 w-5" />
              </div>
              <h3 className="font-extrabold text-slate-800 text-base">Ola-Inspired Category Mix</h3>
              <p className="text-slate-555 text-sm leading-relaxed">
                Book budget hatchbacks, executive sedans, hourly personal drivers, or commercial driver-only slots.
              </p>
            </div>

            <div className="space-y-3 p-5 rounded-2xl bg-slate-50/50 hover:bg-slate-50 transition-colors border border-slate-200/50">
              <div className="h-10 w-10 bg-purple-50 border border-purple-200 text-purple-600 flex items-center justify-center rounded-xl shadow-sm">
                <Clock className="h-5 w-5" />
              </div>
              <h3 className="font-extrabold text-slate-800 text-base">Rapido-Style Fast Dispatch</h3>
              <p className="text-slate-555 text-sm leading-relaxed">
                Dynamic matching algorithm pairs you instantly with the nearest background-checked driver.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── POPULAR ROUTES ─── */}
      <section className="py-24 px-6 border-t border-slate-200 bg-slate-50/50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-emerald-600 text-xs font-bold uppercase tracking-widest mb-3">No guessing</p>
            <h2 className="text-3xl sm:text-4xl font-heading font-black text-slate-900">Popular routes with set fares</h2>
            <p className="text-slate-500 text-sm mt-3 max-w-md mx-auto leading-relaxed">Know exactly what you&apos;ll pay before you book. No surge pricing, no surprises.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {QUICK_ROUTES.map((r, i) => (
              <div key={i} className="bg-white border border-slate-200/60 rounded-2xl overflow-hidden shadow-sm hover:shadow-md hover:border-slate-350 transition-all duration-300">
                <div className="p-5 flex flex-col gap-4">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2.5 text-sm">
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-600 border-2 border-white shadow-[0_0_0_1px_#059669] shrink-0" />
                      <span className="text-slate-800 font-semibold truncate">{r.from.split(",")[0]}</span>
                    </div>
                    <div className="ml-[4px] w-px h-5 bg-slate-200" />
                    <div className="flex items-center gap-2.5 text-sm">
                      <div className="w-2.5 h-2.5 bg-rose-500 rotate-45 border-2 border-white shadow-[0_0_0_1px_#f43f5e] shrink-0" />
                      <span className="text-slate-800 font-semibold truncate">{r.to.split(",")[0]}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                    <div className="flex flex-col">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">{r.dist} km · ~{r.dur} min</span>
                      <span className="text-2xl font-heading font-black text-slate-900 mt-0.5">₹{r.fare}</span>
                    </div>
                    <button
                      onClick={() => router.push(`/booking?from=${encodeURIComponent(r.from)}&to=${encodeURIComponent(r.to)}`)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black px-4 py-2.5 rounded-xl cursor-pointer transition-all duration-200 shadow-md shadow-emerald-600/10 hover:shadow-emerald-600/20 hover:scale-[1.02] border-none"
                    >
                      Book
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── TRUST SECTION ─── */}
      <section className="py-24 px-6 border-t border-slate-200 bg-white">
        <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
          <div className="lg:col-span-7 flex flex-col gap-6">
            <div>
              <p className="text-emerald-600 text-xs font-bold uppercase tracking-widest mb-3">Why DriveMate</p>
              <h2 className="text-3xl sm:text-4xl font-heading font-black text-slate-900">Safety and reliability, built in.</h2>
            </div>
            <div className="flex flex-col gap-4">
              {[
                { title: "Your payment is protected", body: "We hold payment securely until your ride completes. You're never charged for a ride that doesn't happen." },
                { title: "Drivers are background-checked", body: "Every driver on our platform passes identity verification, driving checks, and safety training." },
                { title: "OTP boarding security", body: "A unique 6-digit PIN is required before any trip starts — so only your driver can begin the ride." },
                { title: "Live location tracking", body: "Share your real-time ride with friends or family. Know exactly where you are at all times." },
              ].map((f, i) => (
                <div key={i} className="flex items-start gap-4 p-3 hover:bg-slate-50 hover:shadow-sm hover:border-slate-200 rounded-2xl border border-transparent transition-all duration-300">
                  <div className="w-6 h-6 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                    <svg className="w-3.5 h-3.5 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-heading font-bold text-slate-800">{f.title}</p>
                    <p className="text-xs sm:text-sm text-slate-500 mt-0.5 leading-relaxed">{f.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          {/* Stats */}
          <div className="lg:col-span-5 grid grid-cols-2 gap-4">
            {[
              { num: "10K+", label: "Rides completed", color: "text-emerald-600" },
              { num: "500+", label: "Verified drivers", color: "text-indigo-600" },
              { num: "4.9★", label: "Average rating", color: "text-amber-600" },
              { num: "24/7", label: "Customer support", color: "text-rose-600" },
            ].map((s, i) => (
              <div key={i} className="bg-white border border-slate-200/60 rounded-2xl p-6 flex flex-col gap-2 shadow-sm hover:shadow-md transition-shadow duration-300">
                <span className={`text-3xl font-heading font-black ${s.color}`}>{s.num}</span>
                <span className="text-[11px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="py-20 px-6 border-t border-slate-200 bg-white">
        <div className="max-w-4xl mx-auto bg-slate-900 rounded-3xl p-8 sm:p-12 text-center flex flex-col gap-6 relative overflow-hidden shadow-xl shadow-slate-950/10">
          {/* Decorative ambient background glows */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-600/10 rounded-full blur-[80px]" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-600/10 rounded-full blur-[80px]" />

          <div className="relative z-10 flex flex-col gap-3">
            <h2 className="text-3xl sm:text-4xl font-heading font-black text-white">Ready to experience DriveMate?</h2>
            <p className="text-slate-400 text-sm max-w-md mx-auto leading-relaxed">Book a ride in under 60 seconds with transparent upfront billing. No surge or hidden service charges.</p>
          </div>
          <div className="relative z-10 flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <button onClick={() => router.push("/booking")} className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm px-8 py-4 rounded-xl cursor-pointer transition-all duration-200 shadow-lg shadow-emerald-950/20 active:scale-[0.98] border-none">
              Book a Ride Now
            </button>
            <button onClick={() => router.push("/fare-estimator")} className="bg-slate-800 hover:bg-slate-700 border border-slate-700/60 text-white font-bold text-sm px-8 py-4 rounded-xl cursor-pointer transition-all duration-200 active:scale-[0.98]">
              Estimate Ride Fare
            </button>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="border-t border-slate-200/60 py-12 px-6 bg-slate-50/50 mt-auto">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-sm text-slate-500">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-xl bg-emerald-600 flex items-center justify-center shadow-md shadow-emerald-600/10">
              <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99z"/></svg>
            </div>
            <span className="font-heading font-black text-slate-800 text-base tracking-tight">DriveMate</span>
            <span className="text-xs text-slate-400">© {new Date().getFullYear()}</span>
          </div>
          <span className="text-xs text-slate-400 text-center md:text-right">
            Designed with reference to Uber, Ola, and Rapido design standards.
          </span>
          <div className="flex gap-6 text-xs font-semibold">
            {["Privacy Policy", "Terms of Use", "Help Support", "Careers"].map(l => (
              <a key={l} href="#" className="hover:text-slate-800 transition-colors">{l}</a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}

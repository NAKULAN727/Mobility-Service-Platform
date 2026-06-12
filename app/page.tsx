"use client";

import React from "react";
import { useRouter } from "next/navigation";
import Navbar from "../components/ui/Navbar";
import { Car, Navigation, ShieldCheck, Star } from "lucide-react";

export default function HomePage() {
  const router = useRouter();

  const handleDriveMyCar = () => {
    router.push("/ai-assistant?prompt=" + encodeURIComponent("I need a driver for my own car."));
  };

  const handleCarAndDriver = () => {
    router.push("/ai-assistant?prompt=" + encodeURIComponent("I need to book a complete ride with a car and driver."));
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 overflow-x-hidden font-sans flex flex-col">
      <Navbar />

      <section className="relative min-h-screen flex items-center justify-center px-6 pt-32 pb-20 overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
        <div className="absolute top-1/4 left-[10%] w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-[10%] w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="relative z-10 w-full max-w-5xl mx-auto flex flex-col items-center text-center gap-12">
          {/* Headline */}
          <div className="flex flex-col gap-6 max-w-3xl items-center">
            <div className="inline-flex items-center gap-2 bg-slate-900 text-white text-xs font-bold px-4 py-2 rounded-full shadow-lg">
              <Star className="h-3.5 w-3.5 text-yellow-400" />
              DriveMate: Smart Driver & Mobility Platform
            </div>
            <h1 className="text-5xl sm:text-6xl md:text-7xl font-heading font-black leading-[1.05] tracking-tight text-slate-900">
              Your Car. <br className="sm:hidden" />
              Our Driver. <br />
              <span className="bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">Or Both.</span>
            </h1>
            <p className="text-lg sm:text-xl text-slate-500 max-w-2xl leading-relaxed">
              Experience the next generation of mobility. Let our AI assistant orchestrate your perfect journey, whether you need a verified professional for your own vehicle or a complete chauffeur experience.
            </p>
          </div>

          {/* Action Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl">
            {/* Driver Only Card */}
            <div 
              onClick={handleDriveMyCar}
              className="bg-white border-2 border-emerald-100 hover:border-emerald-500 rounded-3xl p-8 text-left cursor-pointer transition-all duration-300 shadow-lg hover:shadow-emerald-500/20 group relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                <Car className="w-32 h-32 text-emerald-600" />
              </div>
              <div className="relative z-10">
                <div className="h-14 w-14 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mb-6 shadow-inner">
                  <Car className="h-7 w-7" />
                </div>
                <h3 className="text-3xl font-black text-slate-900 mb-2">Drive My Car</h3>
                <p className="text-slate-500 text-sm mb-8 pr-12">
                  Hire a verified, background-checked professional to drive your own vehicle. Perfect for when you're tired, attending events, or running errands.
                </p>
                <button className="flex items-center gap-2 bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold text-sm shadow-md hover:bg-emerald-700 transition-colors w-max">
                  Book Driver <Navigation className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Car + Driver Card */}
            <div 
              onClick={handleCarAndDriver}
              className="bg-white border-2 border-blue-100 hover:border-blue-500 rounded-3xl p-8 text-left cursor-pointer transition-all duration-300 shadow-lg hover:shadow-blue-500/20 group relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                <Navigation className="w-32 h-32 text-blue-600" />
              </div>
              <div className="relative z-10">
                <div className="h-14 w-14 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mb-6 shadow-inner">
                  <Navigation className="h-7 w-7" />
                </div>
                <h3 className="text-3xl font-black text-slate-900 mb-2">Car + Driver</h3>
                <p className="text-slate-500 text-sm mb-8 pr-12">
                  Book a complete premium ride. We provide both the vehicle and the driver for a seamless, comfortable chauffeur experience.
                </p>
                <button className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-bold text-sm shadow-md hover:bg-blue-700 transition-colors w-max">
                  Book Complete Ride <Navigation className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Trust Indicators */}
          <div className="flex flex-wrap justify-center gap-8 mt-4">
            {[
              { icon: <ShieldCheck className="w-5 h-5 text-emerald-600" />, text: "Background-checked Drivers" },
              { icon: <Car className="w-5 h-5 text-blue-600" />, text: "Premium Fleet" },
              { icon: <Star className="w-5 h-5 text-yellow-500" />, text: "Top Rated Service" },
            ].map((feature, idx) => (
              <div key={idx} className="flex items-center gap-2 text-sm font-bold text-slate-600 bg-white px-4 py-2 rounded-full border border-slate-200 shadow-sm">
                {feature.icon}
                {feature.text}
              </div>
            ))}
          </div>

        </div>
      </section>
    </div>
  );
}

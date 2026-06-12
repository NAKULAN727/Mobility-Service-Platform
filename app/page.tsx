"use client";

import Link from "next/link";
import { Navigation, Shield, Car, Clock, ArrowRight, UserPlus, CheckCircle, MapPin, Search, Star } from "lucide-react";
import { useAuth } from "./providers";
import React, { useState } from "react";

export default function Home() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"RIDE" | "DRIVER" | "RENTALS">("RIDE");

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-800 flex flex-col font-sans relative">
      {/* Top Banner Message */}
      <div className="bg-black text-white text-center py-2 px-4 text-xs font-semibold tracking-wider">
        COVID-19 Safety Protocol: All drivers are fully vaccinated and wear masks.
      </div>

      {/* Header Navigation */}
      <header className="sticky top-0 z-40 bg-white border-b border-zinc-200 px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 items-center justify-center rounded bg-black text-white flex shadow shadow-black/10">
              <Navigation className="h-4 w-4" />
            </div>
            <span className="font-black text-lg tracking-tight text-black">
              DriveMate
            </span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm font-bold text-zinc-650">
            <Link href="/" className="text-black">Ride</Link>
            <Link href="/register" className="hover:text-black transition-colors">Drive</Link>
            <Link href="/profile" className="hover:text-black transition-colors">Help</Link>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          {user ? (
            <Link
              href="/dashboard"
              className="flex items-center gap-1.5 text-xs bg-black hover:bg-zinc-805 text-white font-bold px-4 py-2 rounded-lg transition-all duration-200"
            >
              Go to Dashboard
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="text-xs font-bold text-zinc-650 hover:text-black transition-colors"
              >
                Log In
              </Link>
              <Link
                href="/register"
                className="flex items-center gap-1.5 text-xs bg-black hover:bg-zinc-900 text-white font-bold px-4 py-2.5 rounded-lg transition-all duration-200 shadow"
              >
                Sign Up
              </Link>
            </>
          )}
        </div>
      </header>

      {/* Hero and Booking Widget Column Layout */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-12 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        
        {/* Left Side: Ride Hailing Marketing Copy */}
        <div className="lg:col-span-7 space-y-6 text-left">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 border border-blue-200 px-3 py-1 text-xs font-bold text-blue-600 shadow-sm">
            <Shield className="h-3.5 w-3.5" />
            Fully Verified Partner Network
          </div>
          
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-tight text-zinc-900">
            Go anywhere. <br />
            <span className="text-blue-600">
              Book a verified driver.
            </span>
          </h1>

          <p className="text-zinc-600 text-base sm:text-lg leading-relaxed max-w-xl">
            Request rides and hire verified, background-checked personal drivers on demand. DriveMate connects you to top-rated mobility professionals with transparent pricing.
          </p>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-4 border-t border-zinc-200 pt-6 max-w-md">
            <div>
              <span className="block text-2xl font-black text-zinc-900">10k+</span>
              <span className="text-xs text-zinc-500 font-bold uppercase tracking-wider">Happy Riders</span>
            </div>
            <div>
              <span className="block text-2xl font-black text-zinc-900">500+</span>
              <span className="text-xs text-zinc-500 font-bold uppercase tracking-wider">Verified Drivers</span>
            </div>
            <div>
              <span className="block text-2xl font-black text-zinc-900">4.9/5</span>
              <span className="text-xs text-zinc-500 font-bold uppercase tracking-wider">Average Rating</span>
            </div>
          </div>
        </div>

        {/* Right Side: Uber/Ola Inspired Booking Widget */}
        <div className="lg:col-span-5 bg-white border border-zinc-200/80 rounded-2xl shadow-xl overflow-hidden">
          
          {/* Widget Tabs */}
          <div className="flex border-b border-zinc-200 bg-zinc-50">
            <button
              onClick={() => setActiveTab("RIDE")}
              className={`flex-1 py-3 text-xs font-bold transition-all duration-150 flex items-center justify-center gap-1.5 ${
                activeTab === "RIDE" 
                  ? "bg-white border-b-2 border-black text-black" 
                  : "text-zinc-500 hover:text-zinc-800"
              }`}
            >
              <Car className="h-4 w-4" />
              Ride
            </button>
            <button
              onClick={() => setActiveTab("DRIVER")}
              className={`flex-1 py-3 text-xs font-bold transition-all duration-150 flex items-center justify-center gap-1.5 ${
                activeTab === "DRIVER" 
                  ? "bg-white border-b-2 border-black text-black" 
                  : "text-zinc-500 hover:text-zinc-800"
              }`}
            >
              <UserPlus className="h-4 w-4" />
              Rent Driver
            </button>
            <button
              onClick={() => setActiveTab("RENTALS")}
              className={`flex-1 py-3 text-xs font-bold transition-all duration-150 flex items-center justify-center gap-1.5 ${
                activeTab === "RENTALS" 
                  ? "bg-white border-b-2 border-black text-black" 
                  : "text-zinc-500 hover:text-zinc-800"
              }`}
            >
              <Clock className="h-4 w-4" />
              Hourly
            </button>
          </div>

          {/* Widget Form Body */}
          <div className="p-6 space-y-4">
            <h3 className="font-extrabold text-zinc-950 text-base">
              {activeTab === "RIDE" && "Request a ride now"}
              {activeTab === "DRIVER" && "Hire a professional driver"}
              {activeTab === "RENTALS" && "Book car and driver by the hour"}
            </h3>

            {/* Simulated Address Inputs */}
            <div className="space-y-2 relative">
              {/* Connector Line */}
              <div className="absolute left-4.5 top-8 bottom-8 w-0.5 bg-zinc-200 z-0" />

              <div className="relative z-10 flex items-center gap-3 bg-zinc-50 border border-zinc-200 rounded-xl p-3">
                <div className="h-3 w-3 rounded-full bg-zinc-400 shrink-0 mx-1" />
                <input
                  type="text"
                  placeholder="Enter pickup location"
                  defaultValue="Forum Mall, Koramangala"
                  className="bg-transparent text-sm w-full outline-none font-semibold text-zinc-800 placeholder-zinc-500"
                />
              </div>

              <div className="relative z-10 flex items-center gap-3 bg-zinc-50 border border-zinc-200 rounded-xl p-3">
                <div className="h-3 w-3 rounded bg-zinc-900 shrink-0 mx-1" />
                <input
                  type="text"
                  placeholder="Enter destination"
                  defaultValue="MG Road Metro Station"
                  className="bg-transparent text-sm w-full outline-none font-semibold text-zinc-800 placeholder-zinc-500"
                />
              </div>
            </div>

            {/* Ride Categories Selector (Uber style) */}
            <div className="space-y-2 pt-2">
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">Suggested Options</span>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 border-2 border-black rounded-xl bg-zinc-50 cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-zinc-200 rounded-lg flex items-center justify-center shrink-0">
                      <Car className="h-6 w-6 text-zinc-700" />
                    </div>
                    <div>
                      <span className="font-bold text-zinc-900 text-sm block">DriveMate Sedan</span>
                      <span className="text-zinc-500 text-xs block">Top rated drivers • 3 mins away</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-zinc-950 block text-sm">₹180</span>
                    <span className="text-[10px] bg-yellow-400 font-bold px-1.5 py-0.5 rounded text-zinc-900">Popular</span>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 border border-zinc-200 hover:border-zinc-350 rounded-xl bg-white cursor-pointer transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-zinc-100 rounded-lg flex items-center justify-center shrink-0">
                      <Car className="h-6 w-6 text-zinc-500" />
                    </div>
                    <div>
                      <span className="font-semibold text-zinc-800 text-sm block">DriveMate XL</span>
                      <span className="text-zinc-500 text-xs block">Spacious SUVs • 6 mins away</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-zinc-700 block text-sm">₹290</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Booking CTA Button */}
            <Link 
              href="/register" 
              className="block w-full text-center bg-black hover:bg-zinc-800 text-white font-bold py-3.5 rounded-xl text-sm transition-colors mt-4"
            >
              Book Now with DriveMate
            </Link>
          </div>
        </div>
      </main>

      {/* Feature Highlights Grid */}
      <section className="bg-white border-t border-zinc-200 py-16 px-4">
        <div className="max-w-6xl w-full mx-auto grid grid-cols-1 sm:grid-cols-3 gap-8">
          <div className="space-y-3">
            <div className="h-10 w-10 bg-zinc-100 text-zinc-900 flex items-center justify-center rounded-lg border border-zinc-200 shadow-sm">
              <CheckCircle className="h-5 w-5" />
            </div>
            <h3 className="font-extrabold text-zinc-950 text-base">Uber-Grade Verification</h3>
            <p className="text-zinc-600 text-sm leading-relaxed">
              Every driver undergoes biometric checks, license registry matches, and criminal records reviews.
            </p>
          </div>

          <div className="space-y-3">
            <div className="h-10 w-10 bg-zinc-100 text-zinc-900 flex items-center justify-center rounded-lg border border-zinc-200 shadow-sm">
              <Car className="h-5 w-5" />
            </div>
            <h3 className="font-extrabold text-zinc-950 text-base">Ola-Inspired Category Mix</h3>
            <p className="text-zinc-600 text-sm leading-relaxed">
              Book budget hatchbacks, executive sedans, hourly personal drivers, or commercial driver-only slots.
            </p>
          </div>

          <div className="space-y-3">
            <div className="h-10 w-10 bg-zinc-100 text-zinc-900 flex items-center justify-center rounded-lg border border-zinc-200 shadow-sm">
              <Clock className="h-5 w-5" />
            </div>
            <h3 className="font-extrabold text-zinc-950 text-base">Rapido-Style Fast Dispatch</h3>
            <p className="text-zinc-600 text-sm leading-relaxed">
              Dynamic matching algorithm pairs you instantly with the nearest background-checked driver.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-200 py-6 text-center text-xs text-zinc-500 bg-zinc-50">
        &copy; {new Date().getFullYear()} DriveMate. Designed with reference to Uber, Ola, and Rapido design standards.
      </footer>
    </div>
  );
}

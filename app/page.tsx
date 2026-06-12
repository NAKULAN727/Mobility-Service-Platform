"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "@apollo/client/react";
import { gql } from "@apollo/client";
import Navbar from "../components/ui/Navbar";
import Link from "next/link";
import { useAuth } from "./providers";
import { generateRecommendations } from "../lib/recommendationEngine";
import {
  Car, Navigation, ShieldCheck, Star, MessageSquare, Clock,
  Sparkles, ArrowUpRight, RefreshCw, Loader2, User, Bell,
} from "lucide-react";

const GET_BOOKING_HISTORY = gql`
  query GetBookingHistory($customerId: ID!, $first: Int) {
    getBookingHistory(customerId: $customerId, first: $first) {
      edges {
        node {
          id serviceType location { pickupLocation destinationLocation }
          bookingDate bookingTime fareAmount bookingStatus otpCode
          review { rating sentiment }
        }
      }
    }
  }
`;

// ── Logged-in Customer Home ───────────────────────────────────────────────────
function CustomerHome({ user }: { user: any }) {
  const router = useRouter();
  const [recs, setRecs] = React.useState<any[]>([]);

  React.useEffect(() => {
    generateRecommendations(user.id).then(setRecs).catch(console.error);
  }, [user.id]);

  const { data, loading, refetch } = useQuery(GET_BOOKING_HISTORY, {
    variables: { customerId: user.id, first: 5 },
    fetchPolicy: "network-only",
  });

  const bookings = (data as any)?.getBookingHistory?.edges || [];
  const activeRide = bookings.find((e: any) =>
    ["REQUESTED", "MATCHING", "DRIVER_ASSIGNED", "ACCEPTED", "DRIVER_ARRIVING", "OTP_PENDING", "OTP_VERIFIED", "TRIP_STARTED"].includes(e.node.bookingStatus)
  )?.node;

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 pt-28 pb-10 space-y-8">

        {/* Welcome */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-zinc-900">Welcome back, {user.fullName.split(" ")[0]}!</h1>
            <p className="text-sm text-zinc-500 mt-0.5">What can we arrange for you today?</p>
          </div>
          <Link href="/profile" className="flex items-center gap-2 bg-white border border-zinc-200 rounded-xl px-3 py-2 text-xs font-bold text-zinc-700 hover:border-zinc-400 transition-colors shadow-sm">
            <User className="h-4 w-4" /> Profile
          </Link>
        </div>

        {/* Current Ride */}
        {activeRide && (
          <div className="bg-amber-50 border border-amber-300 rounded-2xl p-5 flex items-center justify-between gap-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse shrink-0" />
              <div>
                <p className="text-xs font-black text-amber-700 uppercase tracking-wider">Current Ride · {activeRide.bookingStatus.replace(/_/g, " ")}</p>
                <p className="text-sm font-bold text-zinc-800 mt-0.5 truncate max-w-xs">{activeRide.location.pickupLocation} → {activeRide.location.destinationLocation}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              {activeRide.otpCode && (
                <span className="text-xs font-mono font-black bg-amber-100 border border-amber-300 text-amber-800 px-2.5 py-1 rounded-lg">PIN: {activeRide.otpCode}</span>
              )}
              <Link href="/bookings" className="text-xs font-bold bg-amber-600 text-white px-3 py-1.5 rounded-xl hover:bg-amber-700 transition-colors">
                Track
              </Link>
            </div>
          </div>
        )}

        {/* Booking Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div
            onClick={() => router.push("/ai-assistant?prompt=" + encodeURIComponent("I need a driver for my own car."))}
            className="bg-emerald-900 text-white rounded-3xl p-8 overflow-hidden shadow-2xl cursor-pointer hover:opacity-95 transition-opacity relative"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
            <div className="relative z-10 space-y-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase bg-emerald-500/30 text-emerald-100 border border-emerald-500/50">
                <Car className="h-3 w-3" /> Drive My Car
              </span>
              <h2 className="text-2xl font-black">Hire a Driver</h2>
              <p className="text-emerald-100 text-sm leading-relaxed pb-2">A verified professional drives your own vehicle.</p>
              <div className="inline-flex items-center gap-2 bg-white text-emerald-900 font-bold px-4 py-2.5 rounded-xl text-sm">
                <MessageSquare className="h-4 w-4" /> Book via AI
              </div>
            </div>
          </div>

          <div
            onClick={() => router.push("/ai-assistant?prompt=" + encodeURIComponent("I need to book a complete ride with a car and driver."))}
            className="bg-blue-900 text-white rounded-3xl p-8 overflow-hidden shadow-2xl cursor-pointer hover:opacity-95 transition-opacity relative"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />
            <div className="relative z-10 space-y-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase bg-blue-500/30 text-blue-100 border border-blue-500/50">
                <Navigation className="h-3 w-3" /> Car + Driver
              </span>
              <h2 className="text-2xl font-black">Complete Ride</h2>
              <p className="text-blue-100 text-sm leading-relaxed pb-2">Premium car and driver for a seamless journey.</p>
              <div className="inline-flex items-center gap-2 bg-white text-blue-900 font-bold px-4 py-2.5 rounded-xl text-sm">
                <MessageSquare className="h-4 w-4" /> Book via AI
              </div>
            </div>
          </div>
        </div>

        {/* AI Assistant shortcut */}
        <Link
          href="/ai-assistant"
          className="flex items-center gap-4 bg-zinc-900 text-white rounded-2xl p-5 shadow-lg hover:bg-zinc-800 transition-colors group"
        >
          <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
            <Sparkles className="h-5 w-5 text-yellow-300" />
          </div>
          <div className="flex-1">
            <p className="font-black text-sm">AI Assistant</p>
            <p className="text-xs text-zinc-400 mt-0.5">Chat to book, manage, or review your rides</p>
          </div>
          <ArrowUpRight className="h-4 w-4 text-zinc-400 group-hover:text-white transition-colors" />
        </Link>

        {/* Smart Suggestions */}
        {recs.length > 0 && (
          <div>
            <h2 className="text-xs font-black text-zinc-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5" /> Smart Suggestions
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {recs.map((rec, idx) => (
                <div key={idx} className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm flex justify-between items-start gap-4">
                  <div className="space-y-1.5 flex-1">
                    <span className={`inline-block text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${rec.type === "habit" ? "bg-indigo-50 text-indigo-700 border border-indigo-200" : "bg-emerald-50 text-emerald-700 border border-emerald-200"}`}>
                      {rec.type}
                    </span>
                    <h3 className="font-extrabold text-zinc-900 text-sm">{rec.title}</h3>
                    <p className="text-xs text-zinc-500">{rec.description}</p>
                  </div>
                  <Link href="/ai-assistant" className="shrink-0 bg-zinc-900 text-white font-bold text-xs px-4 py-2.5 rounded-xl hover:bg-zinc-800 transition-all flex items-center gap-1">
                    {rec.actionText} <ArrowUpRight className="h-3 w-3" />
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Trips */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-xs font-black text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" /> Recent Trips
            </h2>
            <div className="flex items-center gap-3">
              <button onClick={() => refetch()} className="text-xs text-zinc-500 hover:text-black font-semibold flex items-center gap-1 transition-colors">
                <RefreshCw className="h-3 w-3" /> Refresh
              </button>
              <Link href="/bookings" className="text-xs font-bold text-emerald-700 hover:underline">View all</Link>
            </div>
          </div>

          {loading ? (
            <div className="bg-white border border-zinc-200 rounded-2xl p-8 text-center">
              <Loader2 className="h-5 w-5 animate-spin mx-auto text-zinc-900 mb-2" />
              <p className="text-xs text-zinc-400">Loading trips...</p>
            </div>
          ) : bookings.length === 0 ? (
            <div className="bg-white border border-zinc-200 rounded-2xl p-10 text-center flex flex-col items-center gap-2">
              <Car className="h-8 w-8 text-zinc-300" />
              <p className="font-bold text-sm text-zinc-600">No rides yet</p>
              <p className="text-xs text-zinc-400">Your trip history will appear here</p>
            </div>
          ) : (
            <div className="bg-white border border-zinc-200 rounded-2xl divide-y divide-zinc-100 shadow-sm overflow-hidden">
              {bookings.map((edge: any) => {
                const b = edge.node;
                return (
                  <div key={b.id} className="p-5 flex justify-between items-center gap-4 hover:bg-zinc-50/50 transition-all">
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-mono font-bold bg-zinc-100 border border-zinc-200 px-2 py-0.5 rounded text-zinc-600">
                          {b.id.slice(0, 8).toUpperCase()}
                        </span>
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${b.bookingStatus === "COMPLETED" ? "bg-emerald-50 text-emerald-700" : b.bookingStatus === "CANCELLED" ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700 animate-pulse"}`}>
                          {b.bookingStatus}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-500 truncate">{b.location.pickupLocation} → {b.location.destinationLocation}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-black text-zinc-950">₹{b.fareAmount}</p>
                      {b.review && (
                        <span className="text-[10px] font-bold text-amber-600 flex items-center gap-0.5 justify-end">
                          <Star className="h-3 w-3 fill-amber-500" /> {b.review.rating}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </main>
    </div>
  );
}

// ── Public Landing Page ───────────────────────────────────────────────────────
function LandingPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 overflow-x-hidden font-sans flex flex-col">
      <Navbar />

      <section className="relative min-h-screen flex items-center justify-center px-6 pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
        <div className="absolute top-1/4 left-[10%] w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-[10%] w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="relative z-10 w-full max-w-5xl mx-auto flex flex-col items-center text-center gap-12">
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl">
            <div
              onClick={() => router.push("/ai-assistant?prompt=" + encodeURIComponent("I need a driver for my own car."))}
              className="bg-white border-2 border-emerald-100 hover:border-emerald-500 rounded-3xl p-8 text-left cursor-pointer transition-all duration-300 shadow-lg hover:shadow-emerald-500/20 group relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                <Car className="w-32 h-32 text-emerald-600" />
              </div>
              <div className="relative z-10">
                <div className="h-14 w-14 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mb-6">
                  <Car className="h-7 w-7" />
                </div>
                <h3 className="text-3xl font-black text-slate-900 mb-2">Drive My Car</h3>
                <p className="text-slate-500 text-sm mb-8 pr-12">Hire a verified, background-checked professional to drive your own vehicle.</p>
                <button className="flex items-center gap-2 bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold text-sm shadow-md hover:bg-emerald-700 transition-colors w-max">
                  Book Driver <Navigation className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div
              onClick={() => router.push("/ai-assistant?prompt=" + encodeURIComponent("I need to book a complete ride with a car and driver."))}
              className="bg-white border-2 border-blue-100 hover:border-blue-500 rounded-3xl p-8 text-left cursor-pointer transition-all duration-300 shadow-lg hover:shadow-blue-500/20 group relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                <Navigation className="w-32 h-32 text-blue-600" />
              </div>
              <div className="relative z-10">
                <div className="h-14 w-14 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mb-6">
                  <Navigation className="h-7 w-7" />
                </div>
                <h3 className="text-3xl font-black text-slate-900 mb-2">Car + Driver</h3>
                <p className="text-slate-500 text-sm mb-8 pr-12">Book a complete premium ride with both vehicle and driver.</p>
                <button className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-bold text-sm shadow-md hover:bg-blue-700 transition-colors w-max">
                  Book Complete Ride <Navigation className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

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

// ── Entry Point ───────────────────────────────────────────────────────────────
export default function HomePage() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50">
        <Loader2 className="h-6 w-6 animate-spin text-zinc-900" />
      </div>
    );
  }

  if (user && user.role === "CUSTOMER") return <CustomerHome user={user} />;
  if (user && user.role === "ADMIN") return <CustomerHome user={user} />;
  return <LandingPage />;
}

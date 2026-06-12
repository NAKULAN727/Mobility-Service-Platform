"use client";

import React, { useState, useEffect, Suspense } from "react";
import Navbar from "../../components/ui/Navbar";
import PageLoader from "../../components/ui/PageLoader";
import { Booking } from "../../lib/types";
import { adminAuthHeader } from "../../lib/session";
import { gqlFetch } from "../../services/bookingService";
import { GET_ALL_BOOKINGS_QUERY } from "../../lib/graphql/queries";

// ─── Admin Dashboard Page ───────────────────────────────────────────────────

function AdminDashboardInner() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    loadBookings();
  }, []);

  async function loadBookings() {
    setLoading(true);
    try {
      const { data } = await gqlFetch(
        GET_ALL_BOOKINGS_QUERY,
        { limit: 200 },
        adminAuthHeader()
      );
      if (data?.getAllBookings?.length > 0) {
        setBookings(data.getAllBookings);
      } else {
        setBookings(MOCK_BOOKINGS);
      }
    } catch {
      setBookings(MOCK_BOOKINGS);
    } finally {
      setLoading(false);
    }
  }

  // ─── Computed ────────────────────────────────────────────────────────────────

  const uniqueUsers = new Set(bookings.map((b) => b.customerId).filter(Boolean)).size;
  const uniqueDrivers = new Set(bookings.map((b) => b.driverId).filter(Boolean)).size;
  const bookedCounter = bookings.length;
  const activeDispatch = bookings.filter((b) =>
    ["REQUESTED", "MATCHING", "ACCEPTED", "ARRIVING", "ARRIVED", "ACTIVE"].includes((b.bookingStatus || "").toUpperCase())
  ).length;
  const grossRevenue = bookings.reduce((sum, b) => sum + Number(b.fareAmount || 0), 0);

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-24">
      <Navbar />

      <div className="pt-32 pb-16 px-6 max-w-7xl mx-auto flex flex-col gap-8 animate-fade-in">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <p className="text-emerald-600 text-xs font-bold uppercase tracking-widest font-heading">Admin Operations Panel</p>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight font-heading">Dashboard Analytics</h1>
            <p className="text-slate-500 text-sm mt-1">Real-time user, driver, booking activity, and financial metrics supervision</p>
          </div>
        </div>

        {/* Stats Dashboard */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3 text-slate-400">
            <div className="w-8 h-8 rounded-full border-2 border-emerald-600 border-t-transparent animate-spin" />
            <span className="text-xs uppercase tracking-wider font-bold">Synchronizing dashboard logs...</span>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            {[
              {
                label: "Total Users",
                value: uniqueUsers,
                color: "text-indigo-600",
                bgColor: "bg-indigo-500/5",
                borderColor: "border-indigo-200/50",
                icon: (
                  <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.109A11.386 11.386 0 0110.089 20M4.121 18.548a9.337 9.337 0 014.121-.952 9.38 9.38 0 012.625.372M4.121 18.548A4.125 4.125 0 003 20.089v.109a11.386 11.386 0 005.089-1.432m0-1.432a9.07 9.07 0 01-1.39-1.078M10.5 7.5a3 3 0 11-6 0 3 3 0 016 0zm10.5 0a3 3 0 11-6 0 3 3 0 016 0zm-7.5 4a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
                  </svg>
                )
              },
              {
                label: "Active Drivers",
                value: uniqueDrivers,
                color: "text-teal-600",
                bgColor: "bg-teal-500/5",
                borderColor: "border-teal-200/50",
                icon: (
                  <svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                  </svg>
                )
              },
              {
                label: "Booked Rides",
                value: bookedCounter,
                color: "text-amber-600",
                bgColor: "bg-amber-500/5",
                borderColor: "border-amber-200/50",
                icon: (
                  <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12.75 12.75a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM7.5 15.75a.75.75 0 100-1.5.75.75 0 000 1.5zM16.5 15.75a.75.75 0 100-1.5.75.75 0 000 1.5zM7.5 9.75a.75.75 0 100-1.5.75.75 0 000 1.5zM16.5 9.75a.75.75 0 100-1.5.75.75 0 000 1.5zM12 18.75a.75.75 0 100-1.5.75.75 0 000 1.5zM12 9.75a.75.75 0 100-1.5.75.75 0 000 1.5zM12 6.75a.75.75 0 100-1.5.75.75 0 000 1.5zM2.25 12a9.75 9.75 0 1119.5 0 9.75 9.75 0 01-19.5 0z" />
                  </svg>
                )
              },
              {
                label: "Active Dispatch",
                value: activeDispatch,
                color: "text-rose-600",
                bgColor: "bg-rose-500/5",
                borderColor: "border-rose-200/50",
                icon: (
                  <svg className="w-5 h-5 text-rose-600" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.684A1.125 1.125 0 003 6.69v11.22c0 .425.24.815.622 1.006l4.875 2.437c.316.159.69.159 1.006 0l4.994-2.497c.317-.159.69-.159 1.006 0z" />
                  </svg>
                )
              },
              {
                label: "Gross Revenue",
                value: `$${grossRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                color: "text-emerald-600",
                bgColor: "bg-emerald-500/5",
                borderColor: "border-emerald-200/50",
                icon: (
                  <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.22.11a3.118 3.118 0 004.56-.035 3.118 3.118 0 00-.515-4.143l-3.203-2.542a3.118 3.118 0 01-.515-4.143 3.118 3.118 0 014.56.035l.22.11M3.75 6A2.25 2.25 0 016 3.75h12A2.25 2.25 0 0120.25 6v12A2.25 2.25 0 0118 20.25H6A2.25 2.25 0 013.75 18V6z" />
                  </svg>
                )
              },
            ].map((s) => (
              <div key={s.label} className={`premium-glass-card p-5 border ${s.borderColor} flex items-center justify-between shadow-sm group hover:-translate-y-1 hover:shadow-md transition-all duration-350`}>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest">{s.label}</p>
                  <p className={`text-2xl font-black mt-1 font-heading ${s.color} break-all`}>{s.value}</p>
                </div>
                <div className={`p-3 rounded-2xl ${s.bgColor} transition-transform duration-300 group-hover:scale-110 shrink-0`}>
                  {s.icon}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Mock data fallback ───────────────────────────────────────────────────────

const MOCK_BOOKINGS: Booking[] = [
  {
    id: "b1",
    customerId: "cust-uuid-001",
    driverId: "driver-uuid-101",
    vehicleId: "m1",
    bookingType: "VEHICLE_AND_DRIVER",
    bookingStatus: "COMPLETED",
    bookingDate: "2026-06-10",
    bookingTime: "08:30:00",
    fareAmount: 85.50,
    otpCode: "123456",
    location: {
      pickupLocation: "JFK International Airport Terminal 4, NY",
      destinationLocation: "Times Square Manhattan, NY",
      distance: 28.5,
      estimatedDuration: 45,
    },
    payment: {
      paymentMethod: "CARD",
      paymentStatus: "SUCCESS",
      transactionId: "CARD-TX-9922883344",
    },
    createdAt: "2026-06-10T08:30:00Z"
  },
  {
    id: "b2",
    customerId: "cust-uuid-002",
    driverId: "driver-uuid-102",
    vehicleId: null,
    bookingType: "DRIVER_ONLY",
    bookingStatus: "ACTIVE",
    bookingDate: "2026-06-12",
    bookingTime: "14:00:00",
    fareAmount: 35.00,
    otpCode: "234567",
    location: {
      pickupLocation: "Grand Central Terminal, NY",
      destinationLocation: "Metropolitan Museum of Art, NY",
      distance: 4.2,
      estimatedDuration: 15,
    },
    payment: {
      paymentMethod: "UPI",
      paymentStatus: "PENDING",
      transactionId: "UPI-TX-1122334455",
    },
    createdAt: "2026-06-12T14:00:00Z"
  },
  {
    id: "b3",
    customerId: "cust-uuid-003",
    driverId: null,
    vehicleId: "m4",
    bookingType: "VEHICLE_AND_DRIVER",
    bookingStatus: "REQUESTED",
    bookingDate: "2026-06-13",
    bookingTime: "18:15:00",
    fareAmount: 65.00,
    otpCode: "345678",
    location: {
      pickupLocation: "Brooklyn Bridge Park, NY",
      destinationLocation: "LaGuardia Airport Terminal B, NY",
      distance: 16.8,
      estimatedDuration: 30,
    },
    payment: {
      paymentMethod: "CARD",
      paymentStatus: "PENDING",
      transactionId: null,
    },
    createdAt: "2026-06-13T18:15:00Z"
  }
];

// ─── Export ───────────────────────────────────────────────────────────────────

export default function AdminDashboardPage() {
  return (
    <Suspense fallback={<PageLoader message="Loading admin dashboard..." />}>
      <AdminDashboardInner />
    </Suspense>
  );
}

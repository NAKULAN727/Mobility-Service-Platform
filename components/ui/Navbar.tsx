"use client";

import React from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "../../app/providers";

interface NavbarProps {
  /** Override the active link highlight. Defaults to current pathname. */
  activePath?: string;
}

export default function Navbar({ activePath }: NavbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const active = activePath ?? pathname;
  const { user, logout, loading } = useAuth();

  const baseNavLinks = [
    { href: "/", label: "Home", hideFromDriver: true },
    { href: "/ai-assistant", label: "AI Assistant", requiresCustomer: true },
    { href: "/ai-assistant?prompt=" + encodeURIComponent("I need a driver for my own car."), label: "Drive My Car", requiresCustomer: true },
    { href: "/ai-assistant?prompt=" + encodeURIComponent("I need to book a complete ride with a car and driver."), label: "Car + Driver", requiresCustomer: true },
    { href: "/bookings", label: "My Trips", requiresCustomer: true },
    { href: "/analytics", label: "Analytics", hideFromDriver: true },
  ];

  const navLinks = baseNavLinks.filter(l => {
    if (l.requiresCustomer && user?.role === "DRIVER") return false;
    if (l.hideFromDriver && user?.role === "DRIVER") return false;
    return true;
  });

  return (
    <div className="fixed top-4 inset-x-0 z-50 w-full px-4">
      <nav className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between bg-white/80 backdrop-blur-md border border-slate-200/50 rounded-2xl shadow-lg shadow-slate-100/40 transition-all duration-300">
        {/* Logo */}
        <button
          onClick={() => router.push("/")}
          className="flex items-center gap-2.5 cursor-pointer group"
          aria-label="Go to homepage"
        >
          <div className="w-8 h-8 rounded-xl bg-emerald-600 flex items-center justify-center group-hover:bg-emerald-700 group-hover:scale-105 group-hover:rotate-3 transition-all duration-300 shadow-md shadow-emerald-600/10">
            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z" />
            </svg>
          </div>
          <span className="font-heading font-black text-lg tracking-tight text-slate-900 group-hover:text-emerald-700 transition-colors">DriveMate</span>
        </button>

        {/* Nav Links + CTA */}
        <div className="flex items-center gap-1.5">
          {navLinks.map((link) => (
            <button
              key={link.href}
              onClick={() => router.push(link.href)}
              className={`text-xs sm:text-sm px-3.5 py-2 rounded-xl transition-all duration-200 cursor-pointer font-semibold ${
                active.startsWith(link.href)
                  ? "text-slate-900 bg-slate-100/80 font-bold"
                  : "text-slate-650 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              {link.label}
            </button>
          ))}
          
          {loading ? (
            <span className="text-xs text-slate-400 px-3">Loading...</span>
          ) : user ? (
            <>
              <button
                onClick={() => router.push(user.role === "ADMIN" ? "/admin" : "/dashboard")}
                className="text-xs sm:text-sm px-3.5 py-2 rounded-xl transition-all duration-200 cursor-pointer font-bold text-emerald-700 hover:bg-emerald-50"
              >
                Dashboard
              </button>
              <button
                onClick={logout}
                className="text-xs sm:text-sm px-3.5 py-2 rounded-xl transition-all duration-200 cursor-pointer font-semibold text-slate-600 hover:text-red-650 hover:bg-red-50/50"
              >
                Log Out
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => router.push("/login")}
                className="text-xs sm:text-sm px-3.5 py-2 rounded-xl transition-all duration-200 cursor-pointer font-semibold text-slate-650 hover:text-slate-900 hover:bg-slate-50"
              >
                Log In
              </button>
              <button
                onClick={() => router.push("/register")}
                className="text-xs sm:text-sm font-black bg-emerald-600 text-white px-5 py-2 rounded-xl hover:bg-emerald-700 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 cursor-pointer ml-1.5 shadow-md shadow-emerald-600/10"
              >
                Sign Up
              </button>
            </>
          )}
        </div>
      </nav>
    </div>
  );
}

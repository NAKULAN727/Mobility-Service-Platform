"use client";

import { useRouter, usePathname } from "next/navigation";

export default function Navbar() {
  const router = useRouter();
  const path = usePathname();

  return (
    <nav className="fixed top-0 inset-x-0 z-50 px-6 py-4 flex items-center justify-between bg-[#0b0c0e]/95 backdrop-blur-sm border-b border-white/5">
      <div className="flex items-center gap-2 cursor-pointer" onClick={() => router.push("/")}>
        <div className="w-7 h-7 rounded-full bg-[#10b981] flex items-center justify-center">
          <svg className="w-4 h-4 text-[#0b0c0e]" fill="currentColor" viewBox="0 0 24 24">
            <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z" />
          </svg>
        </div>
        <span className="font-black text-base tracking-tight text-white">DriveMate</span>
      </div>
      <div className="flex items-center gap-1">
        {[
          { href: "/bookings", label: "My Rides" },
        ].map((l) => (
          <button
            key={l.href}
            onClick={() => router.push(l.href)}
            className={`text-sm px-4 py-2 rounded-lg transition-all cursor-pointer ${
              path === l.href ? "text-white bg-white/5 font-bold" : "text-zinc-400 hover:text-white hover:bg-white/5"
            }`}
          >
            {l.label}
          </button>
        ))}
        <button
          onClick={() => router.push("/booking")}
          className="text-sm font-bold bg-[#10b981] text-black px-5 py-2 rounded-full hover:bg-emerald-400 transition-all cursor-pointer ml-2"
        >
          Book a Ride
        </button>
      </div>
    </nav>
  );
}

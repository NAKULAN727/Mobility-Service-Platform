"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Navigation, LogOut } from "lucide-react";

interface DriverNavbarProps {
  logout: () => void;
}

const NAV_LINKS = [
  { href: "/driver/dashboard", label: "Dashboard" },
  { href: "/driver/profile", label: "Profile" },
];

export default function DriverNavbar({ logout }: DriverNavbarProps) {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/driver/dashboard" ? pathname === href : pathname.startsWith(href);

  return (
    <>
      <header className="sticky top-0 z-40 bg-white border-b border-zinc-200 px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 flex items-center justify-center rounded bg-black text-white">
            <Navigation className="h-4 w-4" />
          </div>
          <span className="font-black text-lg tracking-tight">DriveMate</span>
        </div>

        <nav className="hidden md:flex items-center gap-6 text-sm font-bold text-zinc-600">
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={
                isActive(href)
                  ? "text-black border-b-2 border-black pb-1"
                  : "hover:text-black transition-colors"
              }
            >
              {label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <span className="hidden sm:inline text-[10px] bg-zinc-100 border border-zinc-200 px-2.5 py-1.5 rounded font-bold uppercase tracking-wider text-zinc-600">
            DRIVER
          </span>
          <button
            onClick={logout}
            className="flex items-center gap-2 text-xs border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 font-bold px-4 py-2.5 rounded shadow-sm transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </header>

      <div className="md:hidden flex bg-white border-b border-zinc-200 px-6 py-2 justify-center gap-6 text-xs font-bold shadow-sm">
        {NAV_LINKS.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className={isActive(href) ? "text-black" : "text-zinc-500 hover:text-black"}
          >
            {label}
          </Link>
        ))}
      </div>
    </>
  );
}

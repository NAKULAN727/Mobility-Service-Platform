"use client";

import { User, Star, MapPin, Clock, Car, CheckCircle } from "lucide-react";

export interface DriverCardData {
  id: string;
  userId: string;
  fullName: string;
  profileImage?: string | null;
  rating: number;
  experienceYears: number;
  serviceCapability: "DRIVER_ONLY" | "CAR_WITH_DRIVER" | "BOTH";
  vehicle?: {
    make: string;
    model: string;
    registrationNumber: string;
    vehicleType: string;
  } | null;
  distanceKm: number;
  etaMinutes: number;
  availabilityStatus: boolean;
  priceEstimate: number;
}

const CAPABILITY_BADGE: Record<string, { label: string; emoji: string; cls: string }> = {
  DRIVER_ONLY: { label: "Driver Only", emoji: "🚗", cls: "bg-blue-50 text-blue-700 border-blue-200" },
  CAR_WITH_DRIVER: { label: "Car + Driver", emoji: "🚖", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  BOTH: { label: "Both", emoji: "🚗🚖", cls: "bg-violet-50 text-violet-700 border-violet-200" },
};

interface Props {
  driver: DriverCardData;
  onBook: (driver: DriverCardData) => void;
  booking?: boolean;
  showVehicle?: boolean;
}

export default function ManualDriverCard({ driver, onBook, booking, showVehicle = false }: Props) {
  const badge = CAPABILITY_BADGE[driver.serviceCapability] ?? CAPABILITY_BADGE.DRIVER_ONLY;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-slate-300 transition-all flex flex-col">
      <div className="flex items-start gap-4">
        <div className="h-14 w-14 rounded-full overflow-hidden border border-slate-200 bg-slate-50 flex items-center justify-center shrink-0">
          {driver.profileImage ? (
            <img src={driver.profileImage} alt="" className="h-full w-full object-cover" />
          ) : (
            <User className="h-6 w-6 text-slate-400" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-black text-slate-900 truncate">{driver.fullName}</h3>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${badge.cls}`}>
              {badge.emoji} {badge.label}
            </span>
          </div>
          <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
            <span className="flex items-center gap-0.5 font-bold text-amber-600">
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              {driver.rating.toFixed(1)}
            </span>
            <span>{driver.experienceYears} yrs exp</span>
          </div>
        </div>
        <div className="text-right shrink-0">
          <p className="text-lg font-black text-slate-900">₹{driver.priceEstimate}</p>
          <p className="text-[10px] text-slate-400 font-bold uppercase">Est. fare</p>
        </div>
      </div>

      {showVehicle && driver.vehicle && (
        <div className="mt-3 flex items-center gap-2 text-xs text-slate-600 bg-slate-50 rounded-lg px-3 py-2 border border-slate-100">
          <Car className="h-3.5 w-3.5 text-slate-400 shrink-0" />
          <span className="truncate">
            {driver.vehicle.make} {driver.vehicle.model} · {driver.vehicle.registrationNumber}
          </span>
        </div>
      )}

      <div className="mt-3 grid grid-cols-3 gap-2 text-center">
        <div className="bg-slate-50 rounded-lg py-2 px-1">
          <p className="text-[10px] text-slate-400 font-bold uppercase">Distance</p>
          <p className="text-xs font-black text-slate-800 flex items-center justify-center gap-0.5">
            <MapPin className="h-3 w-3" /> {driver.distanceKm} km
          </p>
        </div>
        <div className="bg-slate-50 rounded-lg py-2 px-1">
          <p className="text-[10px] text-slate-400 font-bold uppercase">ETA</p>
          <p className="text-xs font-black text-slate-800 flex items-center justify-center gap-0.5">
            <Clock className="h-3 w-3" /> {driver.etaMinutes} min
          </p>
        </div>
        <div className="bg-slate-50 rounded-lg py-2 px-1">
          <p className="text-[10px] text-slate-400 font-bold uppercase">Status</p>
          <p className={`text-xs font-black ${driver.availabilityStatus ? "text-emerald-600" : "text-slate-400"}`}>
            {driver.availabilityStatus ? "Online" : "Offline"}
          </p>
        </div>
      </div>

      <button
        onClick={() => onBook(driver)}
        disabled={!driver.availabilityStatus || booking}
        className="mt-4 w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl text-sm flex items-center justify-center gap-2 transition-colors"
      >
        {booking ? (
          <>Sending request...</>
        ) : (
          <>
            <CheckCircle className="h-4 w-4" />
            Book Now
          </>
        )}
      </button>
    </div>
  );
}

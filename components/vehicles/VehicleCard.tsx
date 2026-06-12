"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Vehicle } from "../../lib/types";
import { isVehicleAvailable, VEHICLE_RATES } from "../../services/vehicleService";
import StatusBadge from "../booking/StatusBadge";
import VehicleTypeIcon from "./VehicleTypeIcon";

interface VehicleCardProps {
  vehicle: Vehicle;
  /** Optional: show admin action buttons (edit, delete) */
  adminMode?: boolean;
  onEdit?: (vehicle: Vehicle) => void;
  onDelete?: (id: string) => void;
}

/**
 * VehicleCard — Reusable card displaying vehicle info, SVG icon, status badge,
 * rate, and a Book/Unavailable button.
 */
export default function VehicleCard({
  vehicle,
  adminMode = false,
  onEdit,
  onDelete,
}: VehicleCardProps) {
  const router = useRouter();
  const available = isVehicleAvailable(vehicle.availabilityStatus);
  const rate = VEHICLE_RATES[vehicle.vehicleType.toUpperCase()] ?? "$3.50/km";

  return (
    <div className="glass-panel p-5 border-slate-200 bg-white hover:border-slate-350 hover:shadow-md flex flex-col justify-between gap-5 transition-all group">
      <div className="flex flex-col gap-4">
        {/* Visual icon */}
        <VehicleTypeIcon type={vehicle.vehicleType} />

        {/* Metadata */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400">
              {vehicle.vehicleType}
            </span>
            <StatusBadge status={vehicle.availabilityStatus} />
          </div>

          <h3 className="font-extrabold text-base text-slate-800 group-hover:text-slate-950 transition-colors leading-tight">
            {vehicle.model}
          </h3>

          <div className="grid grid-cols-2 gap-2 mt-2 text-[11px] text-slate-500 border-t border-slate-100 pt-3">
            <div className="flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              <span>{vehicle.seatingCapacity} Passengers</span>
            </div>
            <div className="flex items-center gap-1.5 justify-end">
              <span className="text-slate-400">Plate:</span>
              <span className="font-mono font-bold text-slate-600">{vehicle.registrationNumber}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Actions row */}
      <div className="border-t border-slate-100 pt-4 flex items-center justify-between gap-3">
        <div className="flex flex-col">
          <span className="text-[9px] uppercase font-bold text-slate-400">Estimated Rate</span>
          <span className="text-sm font-black text-emerald-600 font-mono">{rate}</span>
        </div>

        {adminMode ? (
          <div className="flex gap-2">
            <button
              onClick={() => onEdit?.(vehicle)}
              className="py-2 px-3 text-xs font-bold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer transition-all"
            >
              Edit
            </button>
            <button
              onClick={() => onDelete?.(vehicle.id)}
              className="py-2 px-3 text-xs font-bold rounded-lg bg-red-500/10 border border-red-500/20 text-red-600 hover:bg-red-500/20 cursor-pointer transition-all"
            >
              Delete
            </button>
          </div>
        ) : (
          <button
            onClick={() => {
              if (available) {
                router.push(`/booking?vehicleId=${vehicle.id}&vehicleType=${vehicle.vehicleType.toLowerCase()}`);
              }
            }}
            className={`py-2 px-4 text-xs font-bold rounded-lg transition-all ${
              available
                ? "bg-emerald-600 text-white hover:bg-emerald-750 cursor-pointer shadow-sm"
                : "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed"
            }`}
            disabled={!available}
          >
            {available ? "Book Ride Now" : "Unavailable"}
          </button>
        )}
      </div>
    </div>
  );
}

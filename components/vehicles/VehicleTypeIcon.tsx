import React from "react";
import { getVehicleSvgConfig } from "../../services/vehicleService";

interface VehicleTypeIconProps {
  type: string;
  /** Height class for the outer container. Defaults to h-32. */
  heightClass?: string;
}

/**
 * VehicleTypeIcon — Custom inline SVG vehicle silhouette icon.
 * Extracted from vehicles/page.tsx into a reusable component.
 * Each vehicle type has a distinct shape, colour, and glow aura.
 */
export default function VehicleTypeIcon({ type, heightClass = "h-32" }: VehicleTypeIconProps) {
  const cfg = getVehicleSvgConfig(type);
  const normType = type.toUpperCase();

  return (
    <div
      className={`w-full ${heightClass} flex items-center justify-center bg-slate-50 rounded-xl relative overflow-hidden border border-slate-200 group shadow-sm`}
    >
      {/* Dynamic glow aura */}
      <div
        className="absolute w-24 h-24 rounded-full blur-[30px] opacity-10 group-hover:scale-125 transition-transform duration-500"
        style={{ backgroundColor: cfg.accentColor, boxShadow: `0 0 40px 10px ${cfg.glowColor}` }}
      />

      <svg
        className="w-36 h-20 relative z-10 transition-transform duration-350 group-hover:scale-105"
        viewBox="0 0 100 80"
        fill="none"
      >
        <defs>
          <linearGradient id="carbon-body-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#475569" />
            <stop offset="100%" stopColor="#1e293b" />
          </linearGradient>
          <linearGradient id={`headlight-glow-${normType}`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={cfg.accentColor} stopOpacity="0.4" />
            <stop offset="100%" stopColor={cfg.accentColor} stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Ground shadow */}
        <ellipse cx="50" cy="67" rx="36" ry="3.5" fill="rgba(0,0,0,0.7)" />

        {/* Main body */}
        <path
          d={cfg.pathD}
          fill="url(#carbon-body-grad)"
          stroke={cfg.accentColor}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Window overlay */}
        {cfg.windowPath && (
          <path
            d={cfg.windowPath}
            fill="rgba(0,0,0,0.4)"
            stroke={cfg.accentColor}
            strokeWidth="1"
          />
        )}

        {/* Left wheel */}
        <circle cx={cfg.wheelLX} cy="62" r="7.5" fill="#17191d" stroke="#2e323a" strokeWidth="2.5" />
        <circle cx={cfg.wheelLX} cy="62" r="2.5" fill={cfg.accentColor} />

        {/* Right wheel */}
        <circle cx={cfg.wheelRX} cy="62" r="7.5" fill="#17191d" stroke="#2e323a" strokeWidth="2.5" />
        <circle cx={cfg.wheelRX} cy="62" r="2.5" fill={cfg.accentColor} />

        {/* Headlight beam */}
        <polygon
          points="90,51 100,45 100,61 90,55"
          fill={`url(#headlight-glow-${normType})`}
          className="opacity-85"
        />
      </svg>

      {/* Fleet watermark */}
      <div className="absolute bottom-2 right-3 text-[9px] uppercase font-bold tracking-wider opacity-30 text-slate-400 font-mono">
        DRIVE-MATE // FLEET
      </div>
    </div>
  );
}

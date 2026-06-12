import React from "react";

interface VehicleIconProps {
  type: string;
  className?: string;
}

export default function VehicleIcon({ type, className = "w-6 h-6" }: VehicleIconProps) {
  const normType = type.toUpperCase();

  switch (normType) {
    case "SUV":
      return (
        <svg
          className={className}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {/* SUV Outline */}
          <path d="M3 11V7a1 1 0 0 1 1-1h5.5a1 1 0 0 1 .78.37l2.25 3A1 1 0 0 0 14.3 10H20a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1h-1" />
          <path d="M14 16H8" />
          <circle cx="6.5" cy="16.5" r="2.5" />
          <circle cx="16.5" cy="16.5" r="2.5" />
        </svg>
      );
    case "LUXURY":
      return (
        <svg
          className={className}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {/* Luxury Sports Car Outline */}
          <path d="M2 17h3m14 0h3M3 13h18M5 13l2-5h9l2.5 5M2 15h20v2H2z" />
          <circle cx="7.5" cy="16" r="2" />
          <circle cx="16.5" cy="16" r="2" />
        </svg>
      );
    case "VAN":
      return (
        <svg
          className={className}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {/* Passenger Van Outline */}
          <path d="M14 18H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v7.5l-2.5 2.5Z" />
          <path d="M8 6v6M14 6v6" />
          <circle cx="7" cy="18" r="2" />
          <circle cx="17" cy="18" r="2" />
        </svg>
      );
    case "HATCHBACK":
      return (
        <svg
          className={className}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {/* Hatchback Outline */}
          <path d="M2 16c0-2 1.5-3.5 3.5-3.5h13c2 0 3.5 1.5 3.5 3.5v1H2z" />
          <path d="M6 12.5C7.5 10 9 6.5 11.5 6.5h4c1.5 0 2.5 1 3 2.5l1 3.5" />
          <circle cx="6.5" cy="16" r="2" />
          <circle cx="17.5" cy="16" r="2" />
        </svg>
      );
    default: // SEDAN
      return (
        <svg
          className={className}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {/* Sedan Outline */}
          <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" />
          <circle cx="7" cy="17" r="2" />
          <circle cx="17" cy="17" r="2" />
        </svg>
      );
  }
}

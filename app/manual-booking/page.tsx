"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "@apollo/client/react";
import { gql } from "@apollo/client";
import Navbar from "../../components/ui/Navbar";
import ManualDriverCard, { DriverCardData } from "../../components/manual-booking/DriverCard";
import { useAuth } from "../providers";
import {
  Search, SlidersHorizontal, Loader2, MapPin, Calendar, Clock,
  User, AlertTriangle, Users,
} from "lucide-react";

const GET_AVAILABLE_DRIVERS = gql`
  query GetAvailableDrivers(
    $serviceType: ServiceType!
    $pickupLocation: String
    $destinationLocation: String
    $distanceKm: Float
    $estimatedDurationMin: Int
  ) {
    getAvailableDrivers(
      serviceType: $serviceType
      pickupLocation: $pickupLocation
      destinationLocation: $destinationLocation
      distanceKm: $distanceKm
      estimatedDurationMin: $estimatedDurationMin
    ) {
      id userId fullName profileImage rating experienceYears
      serviceCapability canDriveCustomerVehicle canProvideOwnVehicle
      distanceKm etaMinutes availabilityStatus priceEstimate locationHint
      vehicle { make model registrationNumber vehicleType }
    }
  }
`;

const CREATE_MANUAL_BOOKING = gql`
  mutation CreateManualBooking($input: ManualBookingCreateInput!) {
    createManualBooking(input: $input) {
      success
      errors { message }
      booking { id bookingStatus }
    }
  }
`;

type ServiceType = "DRIVER_ONLY" | "CAR_WITH_DRIVER";
type SortKey = "rating" | "price_asc" | "distance" | "experience" | "eta";

const KNOWN_ROUTES: Record<string, { dist: number; dur: number }> = {
  "salem|Chennai": { dist: 345, dur: 360 },
  "Salem|Chennai": { dist: 345, dur: 360 },
  "JFK International Airport, New York|Times Square, Manhattan, NY": { dist: 28.5, dur: 45 },
};

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "rating", label: "Highest Rated" },
  { value: "price_asc", label: "Lowest Price" },
  { value: "distance", label: "Nearest" },
  { value: "eta", label: "Fastest ETA" },
  { value: "experience", label: "Most Experienced" },
];

function defaultDate() {
  return new Date().toISOString().split("T")[0];
}

function defaultTime() {
  const n = new Date();
  return `${String(n.getHours()).padStart(2, "0")}:${String(n.getMinutes()).padStart(2, "0")}`;
}

function hasActiveFilters(
  search: string,
  minRating: number,
  minExperience: number,
  maxPrice: number,
  vehicleTypeFilter: string,
  availabilityOnly: boolean
) {
  return (
    search.trim() !== "" ||
    minRating > 0 ||
    minExperience > 0 ||
    maxPrice < 5000 ||
    vehicleTypeFilter !== "ALL" ||
    availabilityOnly
  );
}

export default function ManualBookingPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [serviceType, setServiceType] = useState<ServiceType>("DRIVER_ONLY");
  const [pickup, setPickup] = useState("");
  const [destination, setDestination] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [search, setSearch] = useState("");
  const [minRating, setMinRating] = useState(0);
  const [minExperience, setMinExperience] = useState(0);
  const [vehicleTypeFilter, setVehicleTypeFilter] = useState("ALL");
  const [availabilityOnly, setAvailabilityOnly] = useState(false);
  const [maxPrice, setMaxPrice] = useState(5000);
  const [sortBy, setSortBy] = useState<SortKey>("rating");
  const [showFilters, setShowFilters] = useState(false);
  const [bookingDriverId, setBookingDriverId] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    setDate(defaultDate());
    setTime(defaultTime());
  }, []);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== "CUSTOMER")) {
      router.push(user ? "/" : "/login");
    }
  }, [user, authLoading, router]);

  const routeKey = `${pickup.trim()}|${destination.trim()}`;
  const known = KNOWN_ROUTES[routeKey];
  const distanceKm = known?.dist ?? (pickup && destination ? 12 : 12);
  const durationMin = known?.dur ?? 28;

  const tripReady = pickup.trim() && destination.trim() && date && time;

  const { data, loading: loadingDrivers, error: queryError } = useQuery(GET_AVAILABLE_DRIVERS, {
    variables: {
      serviceType,
      pickupLocation: pickup.trim() || undefined,
      destinationLocation: destination.trim() || undefined,
      distanceKm,
      estimatedDurationMin: durationMin,
    },
    skip: !user,
    fetchPolicy: "cache-and-network",
  });

  const [createManualBooking] = useMutation(CREATE_MANUAL_BOOKING);

  const rawDrivers: DriverCardData[] = (data as any)?.getAvailableDrivers ?? [];

  const filteredDrivers = useMemo(() => {
    let list = [...rawDrivers];
    const q = search.trim().toLowerCase();

    if (q) {
      list = list.filter((d) => {
        const haystack = [
          d.fullName,
          d.vehicle?.make,
          d.vehicle?.model,
          d.vehicle?.registrationNumber,
          pickup,
          destination,
          (d as any).locationHint,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return haystack.includes(q);
      });
    }

    if (minRating > 0) list = list.filter((d) => d.rating >= minRating);
    if (minExperience > 0) list = list.filter((d) => d.experienceYears >= minExperience);
    if (vehicleTypeFilter !== "ALL") {
      list = list.filter((d) => d.vehicle?.vehicleType === vehicleTypeFilter);
    }
    if (availabilityOnly) list = list.filter((d) => d.availabilityStatus);
    list = list.filter((d) => d.priceEstimate <= maxPrice);

    list.sort((a, b) => {
      switch (sortBy) {
        case "price_asc": return a.priceEstimate - b.priceEstimate;
        case "distance": return a.distanceKm - b.distanceKm;
        case "experience": return b.experienceYears - a.experienceYears;
        case "eta": return a.etaMinutes - b.etaMinutes;
        case "rating":
        default: return b.rating - a.rating;
      }
    });

    return list;
  }, [
    rawDrivers, search, minRating, minExperience,
    vehicleTypeFilter, availabilityOnly, maxPrice, sortBy, pickup, destination,
  ]);

  const filtersActive = hasActiveFilters(
    search, minRating, minExperience, maxPrice, vehicleTypeFilter, availabilityOnly
  );

  const handleBook = useCallback(async (driver: DriverCardData) => {
    if (!user) return;
    if (!tripReady) {
      setError("Please fill in pickup, destination, date, and time before booking.");
      return;
    }
    setError("");
    setBookingDriverId(driver.userId);

    try {
      const res = await createManualBooking({
        variables: {
          input: {
            customerId: user.id,
            driverId: driver.userId,
            serviceType,
            pickupLocation: pickup.trim(),
            destinationLocation: destination.trim(),
            distance: distanceKm,
            estimatedDuration: durationMin,
            bookingDate: date,
            bookingTime: time.length === 5 ? `${time}:00` : time,
            fareAmount: driver.priceEstimate,
          },
        },
      });

      const payload = (res.data as any)?.createManualBooking;
      if (!payload?.success) {
        setError(payload?.errors?.[0]?.message || "Could not send request");
        setBookingDriverId(null);
        return;
      }

      router.push(`/manual-booking/request/${payload.booking.id}`);
    } catch (e: any) {
      setError(e.message || "Booking failed");
      setBookingDriverId(null);
    }
  }, [
    user, tripReady, createManualBooking, serviceType, pickup, destination,
    distanceKm, durationMin, date, time, router,
  ]);

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
      </div>
    );
  }

  const showFilteredEmpty = !loadingDrivers && rawDrivers.length > 0 && filteredDrivers.length === 0;
  const showNoDriversInDb = !loadingDrivers && rawDrivers.length === 0;

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar activePath="/manual-booking" />
      <main className="max-w-6xl mx-auto px-4 pt-28 pb-16 space-y-6">

        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-black text-slate-900">Manual Booking</h1>
            <p className="text-sm text-slate-500 mt-1">
              {serviceType === "DRIVER_ONLY"
                ? "Choose a verified driver to drive your vehicle."
                : "Choose a driver who provides their own vehicle."}
            </p>
          </div>
          {!loadingDrivers && (
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5" />
              {rawDrivers.length} driver{rawDrivers.length !== 1 ? "s" : ""} available
            </p>
          )}
        </div>

        {/* Service type + trip */}
        <section className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex flex-wrap gap-2">
            {(["DRIVER_ONLY", "CAR_WITH_DRIVER"] as ServiceType[]).map((st) => (
              <button
                key={st}
                onClick={() => setServiceType(st)}
                className={`text-xs font-bold px-4 py-2 rounded-xl border transition-colors ${
                  serviceType === st
                    ? "bg-emerald-600 text-white border-emerald-600"
                    : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"
                }`}
              >
                {st === "DRIVER_ONLY" ? "🚗 Driver Only" : "🚖 Car + Driver"}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase">Pickup</label>
              <div className="relative mt-1">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <input
                  value={pickup}
                  onChange={(e) => setPickup(e.target.value)}
                  placeholder="e.g. Salem"
                  className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:border-emerald-500"
                />
              </div>
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase">Destination</label>
              <div className="relative mt-1">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <input
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  placeholder="e.g. Chennai"
                  className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:border-emerald-500"
                />
              </div>
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase">Date</label>
              <div className="relative mt-1">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:border-emerald-500"
                />
              </div>
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase">Time</label>
              <div className="relative mt-1">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>
          {!tripReady && (
            <p className="text-xs text-amber-600 font-semibold">
              Browse drivers below — complete trip details before clicking Book Now.
            </p>
          )}
        </section>

        {/* Search & sort — always visible */}
        <section className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, vehicle, registration, location..."
              className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm outline-none focus:border-emerald-500 shadow-sm"
            />
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortKey)}
            className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-semibold outline-none shadow-sm"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <button
            onClick={() => setShowFilters((v) => !v)}
            className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-bold shadow-sm transition-colors ${
              showFilters || filtersActive
                ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                : "border-slate-200 bg-white hover:bg-slate-50"
            }`}
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filters
          </button>
        </section>

        {showFilters && (
          <div className="bg-white border border-slate-200 rounded-2xl p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 shadow-sm">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase">Min Rating</label>
              <select
                value={minRating}
                onChange={(e) => setMinRating(Number(e.target.value))}
                className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-200 text-sm"
              >
                <option value={0}>Any</option>
                <option value={4}>4.0+</option>
                <option value={4.5}>4.5+</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase">Min Experience</label>
              <select
                value={minExperience}
                onChange={(e) => setMinExperience(Number(e.target.value))}
                className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-200 text-sm"
              >
                <option value={0}>Any</option>
                <option value={2}>2+ yrs</option>
                <option value={5}>5+ yrs</option>
                <option value={10}>10+ yrs</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase">Max Price (₹)</label>
              <input
                type="number"
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-200 text-sm"
              />
            </div>
            {serviceType === "CAR_WITH_DRIVER" && (
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">Vehicle Type</label>
                <select
                  value={vehicleTypeFilter}
                  onChange={(e) => setVehicleTypeFilter(e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-200 text-sm"
                >
                  <option value="ALL">All</option>
                  <option value="SEDAN">Sedan</option>
                  <option value="SUV">SUV</option>
                  <option value="LUXURY">Luxury</option>
                  <option value="HATCHBACK">Hatchback</option>
                  <option value="VAN">Van</option>
                </select>
              </div>
            )}
            <div className="flex items-end">
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={availabilityOnly}
                  onChange={(e) => setAvailabilityOnly(e.target.checked)}
                  className="rounded"
                />
                Online only
              </label>
            </div>
          </div>
        )}

        {(error || queryError) && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm p-4 rounded-xl">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            {error || queryError?.message}
          </div>
        )}

        {/* Driver marketplace */}
        {loadingDrivers && rawDrivers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="h-7 w-7 animate-spin text-emerald-600" />
            <p className="text-sm text-slate-500 font-semibold">Loading available drivers...</p>
          </div>
        ) : showNoDriversInDb ? (
          <div className="text-center py-16 bg-white border border-slate-200 rounded-2xl shadow-sm">
            <User className="h-10 w-10 mx-auto mb-3 text-slate-300" />
            <p className="font-bold text-slate-700">No eligible drivers in the marketplace yet</p>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              {serviceType === "DRIVER_ONLY"
                ? "No approved, available drivers with canDriveCustomerVehicle are registered."
                : "No approved drivers with their own vehicle are available."}
            </p>
          </div>
        ) : showFilteredEmpty ? (
          <div className="text-center py-16 bg-white border border-slate-200 rounded-2xl shadow-sm">
            <Search className="h-10 w-10 mx-auto mb-3 text-slate-300" />
            <p className="font-bold text-slate-700">No drivers found</p>
            <p className="text-xs text-slate-400 mt-1">Try adjusting your search or filters</p>
            <button
              onClick={() => {
                setSearch("");
                setMinRating(0);
                setMinExperience(0);
                setMaxPrice(5000);
                setVehicleTypeFilter("ALL");
                setAvailabilityOnly(false);
              }}
              className="mt-4 text-xs font-bold text-emerald-600 hover:underline"
            >
              Clear all filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDrivers.map((driver) => (
              <ManualDriverCard
                key={driver.userId}
                driver={driver}
                onBook={handleBook}
                booking={bookingDriverId === driver.userId}
                showVehicle={serviceType === "CAR_WITH_DRIVER"}
              />
            ))}
          </div>
        )}

        {!loadingDrivers && rawDrivers.length > 0 && (
          <p className="text-center text-xs text-slate-400">
            Showing {filteredDrivers.length} of {rawDrivers.length} drivers
            {pickup && destination ? ` · ${distanceKm} km · ~${durationMin} min` : ""}
          </p>
        )}
      </main>
    </div>
  );
}

"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@apollo/client/react";
import { gql } from "@apollo/client";
import { useAuth } from "../providers";
import Link from "next/link";

const REGISTER_CUSTOMER = gql`
  mutation RegisterCustomer($fullName: String!, $email: String!, $phone: String!, $password: String!) {
    registerCustomer(fullName: $fullName, email: $email, phone: $phone, password: $password) {
      token
      user { id fullName email phone role isVerified }
    }
  }
`;

const REGISTER_DRIVER = gql`
  mutation RegisterDriver(
    $fullName: String!, $email: String!, $phone: String!,
    $password: String!, $licenseNumber: String!, $experienceYears: Int!,
    $driverType: DriverType!, $ownsVehicle: Boolean!, $vehicleId: ID,
    $vehicleType: VehicleType, $vehicleMake: String, $vehicleModel: String,
    $vehicleRegistrationNumber: String, $vehicleSeatingCapacity: Int
  ) {
    registerDriver(
      fullName: $fullName, email: $email, phone: $phone,
      password: $password, licenseNumber: $licenseNumber, experienceYears: $experienceYears,
      driverType: $driverType, ownsVehicle: $ownsVehicle, vehicleId: $vehicleId,
      vehicleType: $vehicleType, vehicleMake: $vehicleMake, vehicleModel: $vehicleModel,
      vehicleRegistrationNumber: $vehicleRegistrationNumber,
      vehicleSeatingCapacity: $vehicleSeatingCapacity
    ) {
      token
      user {
        id fullName email phone role isVerified
        driverProfile {
          id userId licenseNumber experienceYears driverType
          ownsVehicle vehicleId availabilityStatus verificationStatus
          createdAt updatedAt
          documents { id driverId documentType documentUrl uploadedAt }
        }
      }
    }
  }
`;

const VEHICLE_TYPES = ["SEDAN", "SUV", "LUXURY", "VAN", "HATCHBACK"] as const;
type VehicleTypeVal = typeof VEHICLE_TYPES[number];

const VEHICLE_TYPE_LABELS: Record<VehicleTypeVal, { icon: string; label: string }> = {
  SEDAN:    { icon: "🚗", label: "Sedan" },
  SUV:      { icon: "🚙", label: "SUV" },
  LUXURY:   { icon: "🏎️", label: "Luxury" },
  VAN:      { icon: "🚐", label: "Van" },
  HATCHBACK:{ icon: "🚘", label: "Hatchback" },
};

export default function RegisterPage() {
  const router = useRouter();
  const { user, loading: authLoading, login } = useAuth();

  useEffect(() => {
    if (!authLoading && user) {
      router.push(user.role === "DRIVER" ? "/driver/dashboard" : "/");
    }
  }, [user, authLoading, router]);

  const [tab, setTab] = useState<"CUSTOMER" | "DRIVER">("CUSTOMER");

  // Common
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

  // Driver-specific
  const [licenseNumber, setLicenseNumber] = useState("");
  const [experienceYears, setExperienceYears] = useState("");
  const [driverType, setDriverType] = useState<"DRIVER_ONLY" | "DRIVER_WITH_VEHICLE">("DRIVER_ONLY");
  const [ownsVehicle, setOwnsVehicle] = useState(false);

  // Vehicle fields (shown when ownsVehicle = true)
  const [vehicleType, setVehicleType] = useState<VehicleTypeVal>("SEDAN");
  const [vehicleMake, setVehicleMake] = useState("");
  const [vehicleModel, setVehicleModel] = useState("");
  const [vehicleRegNumber, setVehicleRegNumber] = useState("");
  const [vehicleSeats, setVehicleSeats] = useState("");

  const [error, setError] = useState("");

  const onSuccess = (token: string, user: any) => login(token, user);
  const onError = (err: any) => setError(err.message || "Registration failed.");

  const [registerCustomer, { loading: cLoading }] = useMutation(REGISTER_CUSTOMER, {
    onCompleted: (d: any) => onSuccess(d.registerCustomer.token, d.registerCustomer.user),
    onError,
  });

  const [registerDriver, { loading: dLoading }] = useMutation(REGISTER_DRIVER, {
    onCompleted: (d: any) => onSuccess(d.registerDriver.token, d.registerDriver.user),
    onError,
  });

  const loading = cLoading || dLoading;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (tab === "CUSTOMER") {
      registerCustomer({ variables: { fullName, email, phone, password } });
    } else {
      if (!licenseNumber || !experienceYears) {
        setError("Please fill in license number and experience years.");
        return;
      }
      const exp = parseInt(experienceYears);
      if (isNaN(exp) || exp < 0) {
        setError("Experience years must be a valid positive number.");
        return;
      }
      if (ownsVehicle) {
        if (!vehicleModel.trim()) { setError("Please enter your vehicle model."); return; }
        if (!vehicleRegNumber.trim()) { setError("Please enter your vehicle registration number."); return; }
        const seats = parseInt(vehicleSeats);
        if (isNaN(seats) || seats < 1) { setError("Please enter a valid number of seats."); return; }
      }

      registerDriver({
        variables: {
          fullName, email, phone, password,
          licenseNumber, experienceYears: exp,
          driverType,
          ownsVehicle,
          vehicleId: null,
          ...(ownsVehicle && {
            vehicleType,
            vehicleMake: vehicleMake || null,
            vehicleModel,
            vehicleRegistrationNumber: vehicleRegNumber,
            vehicleSeatingCapacity: parseInt(vehicleSeats),
          }),
        },
      });
    }
  };

  const inputClass = "w-full border border-zinc-200 rounded-xl px-4 py-3 text-sm text-zinc-900 bg-zinc-50 focus:outline-none focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 transition-all";
  const labelClass = "block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5";

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-zinc-100 via-zinc-50 to-emerald-50/30 px-4 py-12">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-gradient-to-br from-zinc-900 to-zinc-700 mb-4 shadow-lg shadow-zinc-900/20">
            <svg className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h1 className="text-2xl font-black text-zinc-900">Create your account</h1>
          <p className="text-sm text-zinc-500 mt-1">Join DriveMate today</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-xl shadow-zinc-200/60 border border-zinc-100 p-8">
          {/* Tab switcher */}
          <div className="flex bg-zinc-100 rounded-xl p-1 mb-6">
            <button
              type="button"
              onClick={() => { setTab("CUSTOMER"); setError(""); }}
              className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${tab === "CUSTOMER" ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-700"}`}
            >
              Customer
            </button>
            <button
              type="button"
              onClick={() => { setTab("DRIVER"); setError(""); }}
              className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${tab === "DRIVER" ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-700"}`}
            >
              Driver Partner
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 font-medium">
                {error}
              </div>
            )}

            {/* Common Fields */}
            <div>
              <label className={labelClass}>Full Name</label>
              <input type="text" required value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="John Doe" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Email</label>
              <input type="email" required value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Phone</label>
              <input type="tel" required value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+919876543210" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Password</label>
              <input type="password" required value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters" className={inputClass} />
            </div>

            {/* ── Driver-only fields ── */}
            {tab === "DRIVER" && (
              <>
                <div className="pt-3 border-t border-zinc-100 space-y-4">
                  <div>
                    <label className={labelClass}>License Number</label>
                    <input type="text" required value={licenseNumber}
                      onChange={(e) => setLicenseNumber(e.target.value)}
                      placeholder="DL-XXXXXXXX" className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Experience (Years)</label>
                    <input type="number" required min="0" value={experienceYears}
                      onChange={(e) => setExperienceYears(e.target.value)}
                      placeholder="e.g. 3" className={inputClass} />
                  </div>

                  {/* Driver Type */}
                  <div>
                    <label className={labelClass}>Driver Type</label>
                    <div className="flex gap-2 bg-zinc-100 p-1 rounded-xl">
                      <button
                        type="button"
                        onClick={() => { setDriverType("DRIVER_ONLY"); setOwnsVehicle(false); }}
                        className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${driverType === "DRIVER_ONLY" ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-700"}`}
                      >
                        🚗 Driver Only
                      </button>
                      <button
                        type="button"
                        onClick={() => { setDriverType("DRIVER_WITH_VEHICLE"); setOwnsVehicle(true); }}
                        className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${driverType === "DRIVER_WITH_VEHICLE" ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-700"}`}
                      >
                        🚖 Driver + Vehicle
                      </button>
                    </div>
                    <p className="text-[11px] text-zinc-400 mt-1.5">
                      {driverType === "DRIVER_ONLY"
                        ? "You will drive customers in their own vehicles."
                        : "You will bring your own vehicle for bookings."}
                    </p>
                  </div>
                </div>

                {/* ── Vehicle Detail Fields (shown when ownsVehicle) ── */}
                {ownsVehicle && (
                  <div className="bg-emerald-50/60 border border-emerald-200/60 rounded-2xl p-5 space-y-4 mt-1">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="h-6 w-6 rounded-lg bg-emerald-500 flex items-center justify-center">
                        <svg className="h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <p className="text-xs font-bold text-emerald-700">Vehicle Details</p>
                    </div>

                    {/* Vehicle Type Grid */}
                    <div>
                      <label className={labelClass + " text-emerald-700/70"}>Vehicle Type</label>
                      <div className="grid grid-cols-5 gap-2">
                        {VEHICLE_TYPES.map((vt) => (
                          <button
                            key={vt}
                            type="button"
                            onClick={() => setVehicleType(vt)}
                            className={`flex flex-col items-center gap-1 py-2.5 rounded-xl border text-center cursor-pointer transition-all text-xs font-bold ${
                              vehicleType === vt
                                ? "bg-emerald-500 border-emerald-500 text-white shadow-sm"
                                : "bg-white border-zinc-200 text-zinc-600 hover:border-emerald-300"
                            }`}
                          >
                            <span className="text-base">{VEHICLE_TYPE_LABELS[vt].icon}</span>
                            <span className="text-[10px]">{VEHICLE_TYPE_LABELS[vt].label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Make & Model */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className={labelClass + " text-emerald-700/70"}>Make / Brand</label>
                        <input
                          type="text"
                          value={vehicleMake}
                          onChange={(e) => setVehicleMake(e.target.value)}
                          placeholder="e.g. Toyota"
                          className="w-full border border-zinc-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                        />
                      </div>
                      <div>
                        <label className={labelClass + " text-emerald-700/70"}>Model <span className="text-red-400">*</span></label>
                        <input
                          type="text"
                          required={ownsVehicle}
                          value={vehicleModel}
                          onChange={(e) => setVehicleModel(e.target.value)}
                          placeholder="e.g. Camry 2022"
                          className="w-full border border-zinc-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                        />
                      </div>
                    </div>

                    {/* Reg number & Seats */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className={labelClass + " text-emerald-700/70"}>Registration No. <span className="text-red-400">*</span></label>
                        <input
                          type="text"
                          required={ownsVehicle}
                          value={vehicleRegNumber}
                          onChange={(e) => setVehicleRegNumber(e.target.value)}
                          placeholder="e.g. TN-09-AB-1234"
                          className="w-full border border-zinc-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all font-mono"
                        />
                      </div>
                      <div>
                        <label className={labelClass + " text-emerald-700/70"}>No. of Seats <span className="text-red-400">*</span></label>
                        <input
                          type="number"
                          required={ownsVehicle}
                          min="1"
                          max="50"
                          value={vehicleSeats}
                          onChange={(e) => setVehicleSeats(e.target.value)}
                          placeholder="e.g. 5"
                          className="w-full border border-zinc-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                        />
                      </div>
                    </div>
                    <p className="text-[10px] text-emerald-600/70 mt-1">
                      Your vehicle will be added to the fleet and linked to your driver profile.
                    </p>
                  </div>
                )}
              </>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-zinc-900 text-white font-bold py-3.5 rounded-xl text-sm hover:bg-zinc-800 active:scale-[0.99] transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2 shadow-lg shadow-zinc-900/20"
            >
              {loading ? (
                <>
                  <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Creating account...
                </>
              ) : "Create Account"}
            </button>
          </form>

          <p className="text-center text-sm text-zinc-500 mt-6">
            Already have an account?{" "}
            <Link href="/login" className="text-zinc-900 font-bold hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

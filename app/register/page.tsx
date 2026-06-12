"use client";

import React, { useState } from "react";
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
    $password: String!, $licenseNumber: String!, $experienceYears: Int!
  ) {
    registerDriver(
      fullName: $fullName, email: $email, phone: $phone,
      password: $password, licenseNumber: $licenseNumber, experienceYears: $experienceYears
    ) {
      token
      user { id fullName email phone role isVerified }
    }
  }
`;

export default function RegisterPage() {
  const [tab, setTab] = useState<"CUSTOMER" | "DRIVER">("CUSTOMER");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [experienceYears, setExperienceYears] = useState("");
  const [error, setError] = useState("");
  const { login } = useAuth();

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
      registerDriver({ variables: { fullName, email, phone, password, licenseNumber, experienceYears: exp } });
    }
  };

  const inputClass = "w-full border border-zinc-200 rounded-lg px-4 py-2.5 text-sm text-zinc-900 bg-zinc-50 focus:outline-none focus:border-black focus:bg-white transition-colors";
  const labelClass = "block text-xs font-bold text-zinc-600 uppercase tracking-wide mb-1.5";

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-100 px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-12 w-12 rounded-xl bg-black mb-4">
            <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h1 className="text-2xl font-black text-zinc-900">Create your account</h1>
          <p className="text-sm text-zinc-500 mt-1">Join DriveMate today</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 p-8">
          {/* Tab switcher */}
          <div className="flex bg-zinc-100 rounded-lg p-1 mb-6">
            <button
              type="button"
              onClick={() => { setTab("CUSTOMER"); setError(""); }}
              className={`flex-1 py-2 text-xs font-bold rounded-md transition-all ${tab === "CUSTOMER" ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-700"}`}
            >
              Customer
            </button>
            <button
              type="button"
              onClick={() => { setTab("DRIVER"); setError(""); }}
              className={`flex-1 py-2 text-xs font-bold rounded-md transition-all ${tab === "DRIVER" ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-700"}`}
            >
              Driver Partner
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
                {error}
              </div>
            )}

            <div>
              <label className={labelClass}>Full Name</label>
              <input
                type="text" required value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="John Doe" className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>Email</label>
              <input
                type="email" required value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com" className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>Phone</label>
              <input
                type="tel" required value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+919876543210" className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>Password</label>
              <input
                type="password" required value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters" className={inputClass}
              />
            </div>

            {tab === "DRIVER" && (
              <>
                <div className="pt-2 border-t border-zinc-100">
                  <label className={labelClass}>License Number</label>
                  <input
                    type="text" required value={licenseNumber}
                    onChange={(e) => setLicenseNumber(e.target.value)}
                    placeholder="DL-XXXXXXXX" className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Experience (Years)</label>
                  <input
                    type="number" required min="0" value={experienceYears}
                    onChange={(e) => setExperienceYears(e.target.value)}
                    placeholder="e.g. 3" className={inputClass}
                  />
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-black text-white font-bold py-3 rounded-lg text-sm hover:bg-zinc-800 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
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
            <Link href="/login" className="text-black font-bold hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

"use client";

import React, { useState } from "react";
import { useMutation } from "@apollo/client/react";
import { gql } from "@apollo/client";
import { useAuth } from "../providers";
import Link from "next/link";
import { UserPlus, User, Car, Mail, Phone, Key, Award, FileText, AlertCircle } from "lucide-react";

const REGISTER_CUSTOMER = gql`
  mutation RegisterCustomer($fullName: String!, $email: String!, $phone: String!, $password: String!) {
    registerCustomer(fullName: $fullName, email: $email, phone: $phone, password: $password) {
      token
      user {
        id
        fullName
        email
        phone
        role
        isVerified
      }
    }
  }
`;

const REGISTER_DRIVER = gql`
  mutation RegisterDriver(
    $fullName: String!
    $email: String!
    $phone: String!
    $password: String!
    $licenseNumber: String!
    $experienceYears: Int!
  ) {
    registerDriver(
      fullName: $fullName
      email: $email
      phone: $phone
      password: $password
      licenseNumber: $licenseNumber
      experienceYears: $experienceYears
    ) {
      token
      user {
        id
        fullName
        email
        phone
        role
        isVerified
      }
    }
  }
`;

export default function RegisterPage() {
  const [role, setRole] = useState<"CUSTOMER" | "DRIVER">("CUSTOMER");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [experienceYears, setExperienceYears] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const { login } = useAuth();

  const [registerCustomer, { loading: customerLoading }] = useMutation(REGISTER_CUSTOMER, {
    onCompleted: (data: any) => {
      login(data.registerCustomer.token, data.registerCustomer.user);
    },
    onError: (error) => {
      setErrorMsg(error.message || "Registration failed. Try a different email.");
    },
  });

  const [registerDriver, { loading: driverLoading }] = useMutation(REGISTER_DRIVER, {
    onCompleted: (data: any) => {
      login(data.registerDriver.token, data.registerDriver.user);
    },
    onError: (error) => {
      setErrorMsg(error.message || "Driver registration failed.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!fullName || !email || !phone || !password) {
      setErrorMsg("Please fill in all common fields.");
      return;
    }

    if (password.length < 6) {
      setErrorMsg("Password must be at least 6 characters.");
      return;
    }

    if (role === "CUSTOMER") {
      registerCustomer({ variables: { fullName, email, phone, password } });
    } else {
      if (!licenseNumber || !experienceYears) {
        setErrorMsg("Please provide license details and experience.");
        return;
      }
      const expNum = parseInt(experienceYears);
      if (isNaN(expNum) || expNum < 0) {
        setErrorMsg("Experience years must be a positive number.");
        return;
      }
      registerDriver({
        variables: {
          fullName,
          email,
          phone,
          password,
          licenseNumber,
          experienceYears: expNum,
        },
      });
    }
  };

  const loading = customerLoading || driverLoading;

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-100 px-4 py-12 sm:px-6 lg:px-8 font-sans">
      <div className="w-full max-w-lg space-y-6">
        
        {/* Brand Header */}
        <div className="text-center">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded bg-black text-white shadow-sm mb-3">
            <UserPlus className="h-5 w-5" />
          </div>
          <h2 className="text-2xl font-black tracking-tight text-zinc-950">
            Create your account
          </h2>
          <p className="mt-1 text-xs text-zinc-550">
            Select account type to register on DriveMate
          </p>
        </div>

        {/* Tab Selection */}
        <div className="flex rounded bg-zinc-200 p-1 max-w-xs mx-auto">
          <button
            type="button"
            onClick={() => {
              setRole("CUSTOMER");
              setErrorMsg("");
            }}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded py-2 text-xs font-bold transition-all duration-150 ${
              role === "CUSTOMER"
                ? "bg-white text-zinc-900 shadow-sm"
                : "text-zinc-500 hover:text-zinc-800"
            }`}
          >
            <User className="h-4 w-4" />
            Customer
          </button>
          <button
            type="button"
            onClick={() => {
              setRole("DRIVER");
              setErrorMsg("");
            }}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded py-2 text-xs font-bold transition-all duration-150 ${
              role === "DRIVER"
                ? "bg-white text-zinc-900 shadow-sm"
                : "text-zinc-500 hover:text-zinc-800"
            }`}
          >
            <Car className="h-4 w-4" />
            Driver Partner
          </button>
        </div>

        {/* Flat White Card */}
        <div className="bg-white border border-zinc-200 rounded-lg p-8 shadow-sm">
          <form className="space-y-4" onSubmit={handleSubmit}>
            {errorMsg && (
              <div className="flex items-start gap-2.5 rounded bg-red-50 border border-red-200 p-3.5 text-xs text-red-650 font-semibold">
                <AlertCircle className="h-4.5 w-4.5 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Fields Grid */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-550 uppercase tracking-wider block">
                  Full Name
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <User className="h-4.5 w-4.5 text-zinc-400" />
                  </div>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="block w-full rounded border border-zinc-205 bg-zinc-50 py-2.5 pl-9 pr-3 text-zinc-800 placeholder-zinc-400 outline-none transition-colors focus:border-black focus:bg-white text-sm"
                    placeholder="John Doe"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-550 uppercase tracking-wider block">
                  Email Address
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Mail className="h-4.5 w-4.5 text-zinc-400" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full rounded border border-zinc-205 bg-zinc-50 py-2.5 pl-9 pr-3 text-zinc-800 placeholder-zinc-400 outline-none transition-colors focus:border-black focus:bg-white text-sm"
                    placeholder="john@example.com"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-550 uppercase tracking-wider block">
                  Phone Number
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Phone className="h-4.5 w-4.5 text-zinc-400" />
                  </div>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="block w-full rounded border border-zinc-205 bg-zinc-50 py-2.5 pl-9 pr-3 text-zinc-800 placeholder-zinc-400 outline-none transition-colors focus:border-black focus:bg-white text-sm"
                    placeholder="+919876543210"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-550 uppercase tracking-wider block">
                  Password
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Key className="h-4.5 w-4.5 text-zinc-400" />
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full rounded border border-zinc-205 bg-zinc-50 py-2.5 pl-9 pr-3 text-zinc-800 placeholder-zinc-400 outline-none transition-colors focus:border-black focus:bg-white text-sm"
                    placeholder="••••••••"
                  />
                </div>
              </div>
            </div>

            {/* Driver Details */}
            {role === "DRIVER" && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 pt-4 border-t border-zinc-100">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-550 uppercase tracking-wider block">
                    License Number
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <FileText className="h-4.5 w-4.5 text-zinc-400" />
                    </div>
                    <input
                      type="text"
                      required
                      value={licenseNumber}
                      onChange={(e) => setLicenseNumber(e.target.value)}
                      className="block w-full rounded border border-zinc-205 bg-zinc-50 py-2.5 pl-9 pr-3 text-zinc-800 placeholder-zinc-400 outline-none transition-colors focus:border-black focus:bg-white text-sm"
                      placeholder="DL-XXXXXXXX"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-550 uppercase tracking-wider block">
                    Experience (Years)
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <Award className="h-4.5 w-4.5 text-zinc-400" />
                    </div>
                    <input
                      type="number"
                      required
                      min="0"
                      value={experienceYears}
                      onChange={(e) => setExperienceYears(e.target.value)}
                      className="block w-full rounded border border-zinc-205 bg-zinc-50 py-2.5 pl-9 pr-3 text-zinc-800 placeholder-zinc-400 outline-none transition-colors focus:border-black focus:bg-white text-sm"
                      placeholder="e.g. 5"
                    />
                  </div>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center bg-black hover:bg-zinc-900 text-white font-bold py-3.5 px-4 rounded text-sm transition-colors active:scale-[0.99] disabled:opacity-50 mt-2"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border border-white border-t-transparent" />
                  <span>Registering...</span>
                </div>
              ) : (
                <span>Register Account</span>
              )}
            </button>
          </form>

          <div className="mt-6 text-center border-t border-zinc-100 pt-4">
            <p className="text-xs text-zinc-650 font-semibold">
              Already have an account?{" "}
              <Link
                href="/login"
                className="font-bold text-blue-600 hover:text-blue-500 transition-colors"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

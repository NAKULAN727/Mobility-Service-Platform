"use client";

import React, { useState } from "react";
import Link from "next/link";
import { KeyRound, Mail, ArrowLeft, CheckCircle2 } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    // Simulate API request delay
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 1500);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-100 px-4 py-12 sm:px-6 lg:px-8 font-sans">
      <div className="w-full max-w-md space-y-6">
        
        {/* Branding header */}
        <div className="text-center">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded bg-black text-white shadow-sm mb-3">
            <KeyRound className="h-5 w-5" />
          </div>
          <h2 className="text-2xl font-black tracking-tight text-zinc-950">
            Forgot Password
          </h2>
          <p className="mt-1 text-xs text-zinc-550">
            Enter your email to receive recovery instructions.
          </p>
        </div>

        {/* Flat White Card */}
        <div className="bg-white border border-zinc-200 rounded-lg p-8 shadow-sm">
          {submitted ? (
            <div className="text-center space-y-4 py-3">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 border border-emerald-250 text-emerald-600 mb-1">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-zinc-900">Check your email</h3>
              <p className="text-xs text-zinc-600 leading-relaxed font-semibold">
                We have sent a password reset link to <strong className="text-zinc-800">{email}</strong>. Please check your inbox.
              </p>
              <div className="pt-2">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-500 transition-colors"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Back to login
                </Link>
              </div>
            </div>
          ) : (
            <form className="space-y-5" onSubmit={handleSubmit}>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-550 uppercase tracking-wider block">
                  Email Address
                </label>
                <div className="relative shadow-sm rounded">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Mail className="h-4.5 w-4.5 text-zinc-400" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full rounded border border-zinc-205 bg-zinc-50 py-2.5 pl-9 pr-3 text-zinc-800 placeholder-zinc-500 outline-none transition-colors focus:border-black focus:bg-white text-sm"
                    placeholder="name@example.com"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center bg-black hover:bg-zinc-900 text-white font-bold py-3 px-4 rounded text-sm transition-colors active:scale-[0.99] disabled:opacity-50"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border border-white border-t-transparent" />
                    <span>Sending...</span>
                  </div>
                ) : (
                  <span>Send Reset Link</span>
                )}
              </button>

              <div className="text-center pt-2">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1 text-xs font-bold text-zinc-500 hover:text-zinc-800 transition-colors"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Back to sign in
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

"use client";

import React, { useState } from "react";
import { useMutation } from "@apollo/client/react";
import { gql } from "@apollo/client";
import { useAuth } from "../providers";
import Link from "next/link";
import { LogIn, Key, Mail, AlertCircle } from "lucide-react";

const LOGIN_MUTATION = gql`
  mutation Login($email: String!, $password: String!) {
    login(email: $email, password: $password) {
      token
      user {
        id
        fullName
        email
        phone
        role
        profileImage
        isVerified
      }
    }
  }
`;

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const { login } = useAuth();

  const [performLogin, { loading }] = useMutation(LOGIN_MUTATION, {
    onCompleted: (data: any) => {
      login(data.login.token, data.login.user);
    },
    onError: (error) => {
      setErrorMsg(error.message || "Invalid credentials. Please try again.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!email || !password) {
      setErrorMsg("Please fill in all fields.");
      return;
    }

    performLogin({ variables: { email, password } });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-100 px-4 py-12 sm:px-6 lg:px-8 font-sans">
      <div className="w-full max-w-md space-y-6">
        
        {/* Widget Brand */}
        <div className="text-center">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded bg-black text-white shadow-sm mb-3">
            <LogIn className="h-5 w-5" />
          </div>
          <h2 className="text-2xl font-black tracking-tight text-zinc-950">
            Sign In to DriveMate
          </h2>
          <p className="mt-1 text-xs text-zinc-550">
            Access your driver & ride booking dashboard
          </p>
        </div>

        {/* Uber-like Flat White Card */}
        <div className="bg-white border border-zinc-200 rounded-lg p-8 shadow-sm">
          <form className="space-y-5" onSubmit={handleSubmit}>
            {errorMsg && (
              <div className="flex items-start gap-2.5 rounded bg-red-50 border border-red-200 p-3.5 text-xs text-red-650 font-semibold">
                <AlertCircle className="h-4.5 w-4.5 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

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
                  placeholder="name@example.com"
                />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-bold text-zinc-550 uppercase tracking-wider block">
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-[10px] font-bold text-blue-600 hover:text-blue-500 transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
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

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center bg-black hover:bg-zinc-900 text-white font-bold py-3 px-4 rounded text-sm transition-colors active:scale-[0.99] disabled:opacity-50"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border border-white border-t-transparent" />
                  <span>Signing in...</span>
                </div>
              ) : (
                <span>Log In</span>
              )}
            </button>
          </form>

          <div className="mt-6 text-center border-t border-zinc-100 pt-4">
            <p className="text-xs text-zinc-650 font-semibold">
              New to DriveMate?{" "}
              <Link
                href="/register"
                className="font-bold text-blue-600 hover:text-blue-500 transition-colors"
              >
                Sign up now
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

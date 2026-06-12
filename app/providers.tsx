"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { ApolloProvider } from "@apollo/client/react";
import client from "../lib/apollo-client";
import { useRouter } from "next/navigation";

interface DriverDocument {
  id: string;
  driverId: string;
  documentType: "DRIVING_LICENSE" | "AADHAAR" | "PAN_CARD" | "VEHICLE_CERTIFICATE";
  documentUrl: string;
  uploadedAt: string;
}

interface DriverProfile {
  id: string;
  userId: string;
  licenseNumber: string;
  experienceYears: number;
  driverType?: "DRIVER_ONLY" | "DRIVER_WITH_VEHICLE";
  ownsVehicle?: boolean;
  vehicleId?: string | null;
  availabilityStatus: boolean;
  verificationStatus: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: string;
  updatedAt: string;
  documents: DriverDocument[];
}

export interface User {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: "CUSTOMER" | "DRIVER" | "ADMIN";
  profileImage?: string;
  isVerified: boolean;
  createdAt?: string;
  updatedAt?: string;
  driverProfile?: DriverProfile;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  refreshUser: (updated: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function getDashboardPath(role: string) {
  return role === "DRIVER" ? "/driver/dashboard" : "/";
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const savedToken = localStorage.getItem("token");
    const savedUser = localStorage.getItem("user");
    if (savedToken && savedUser) {
      try {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
      } catch (_) {}
    }
    setLoading(false);
  }, []);

  const login = (newToken: string, newUser: User) => {
    localStorage.setItem("token", newToken);
    localStorage.setItem("user", JSON.stringify(newUser));
    document.cookie = `token=${newToken}; path=/; max-age=${24 * 60 * 60}; SameSite=Lax`;
    setToken(newToken);
    setUser(newUser);
    router.push(getDashboardPath(newUser.role));
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax";
    setToken(null);
    setUser(null);
    client.clearStore();
    router.push("/login");
  };

  const refreshUser = (updated: Partial<User>) => {
    if (!user) return;
    const newUser = { ...user, ...updated };
    setUser(newUser);
    localStorage.setItem("user", JSON.stringify(newUser));
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ApolloProvider client={client}>
      <AuthProvider>{children}</AuthProvider>
    </ApolloProvider>
  );
}

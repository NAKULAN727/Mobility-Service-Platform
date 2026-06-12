"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { ApolloProvider, useLazyQuery } from "@apollo/client/react";
import { gql } from "@apollo/client";
import client from "../lib/apollo-client";
import { useRouter, usePathname } from "next/navigation";

// Define ME query
export const ME_QUERY = gql`
  query Me {
    me {
      id
      fullName
      email
      phone
      role
      profileImage
      isVerified
      createdAt
      updatedAt
      driverProfile {
        id
        userId
        licenseNumber
        experienceYears
        availabilityStatus
        verificationStatus
        createdAt
        updatedAt
        documents {
          id
          driverId
          documentType
          documentUrl
          uploadedAt
        }
      }
    }
  }
`;

interface User {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: "CUSTOMER" | "DRIVER" | "ADMIN";
  profileImage?: string;
  isVerified: boolean;
  driverProfile?: {
    id: string;
    userId: string;
    licenseNumber: string;
    experienceYears: number;
    availabilityStatus: boolean;
    verificationStatus: "PENDING" | "APPROVED" | "REJECTED";
    createdAt: string;
    updatedAt: string;
    documents: Array<{
      id: string;
      driverId: string;
      documentType: "DRIVING_LICENSE" | "AADHAAR" | "PAN_CARD" | "VEHICLE_CERTIFICATE";
      documentUrl: string;
      uploadedAt: string;
    }>;
  };
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const [fetchMe, { data: queryData, error: queryError, refetch }] = useLazyQuery(ME_QUERY, {
    fetchPolicy: "network-only",
  });

  useEffect(() => {
    if (queryData) {
      if ((queryData as any).me) {
        setUser((queryData as any).me);
      } else {
        setUser(null);
        handleLogoutLocal();
      }
      setLoading(false);
    }
  }, [queryData]);

  useEffect(() => {
    if (queryError) {
      handleLogoutLocal();
      setLoading(false);
    }
  }, [queryError]);

  useEffect(() => {
    // Check for token on mount
    const savedToken = localStorage.getItem("token");
    const savedUserJson = localStorage.getItem("user");

    if (savedToken) {
      setToken(savedToken);
      if (savedUserJson) {
        try {
          setUser(JSON.parse(savedUserJson));
        } catch (_) {}
      }
      fetchMe();
    } else {
      setLoading(false);
    }
  }, []);

  const login = (newToken: string, newUser: User) => {
    localStorage.setItem("token", newToken);
    localStorage.setItem("user", JSON.stringify(newUser));
    document.cookie = `token=${newToken}; path=/; max-age=${24 * 60 * 60}; SameSite=Lax`;

    setToken(newToken);
    setUser(newUser);

    if (newUser.role === "ADMIN") {
      router.push("/admin/drivers");
    } else if (newUser.role === "DRIVER") {
      router.push("/driver/verification");
    } else {
      router.push("/profile");
    }
  };

  const handleLogoutLocal = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax";
    setToken(null);
    setUser(null);
  };

  const logout = () => {
    handleLogoutLocal();
    client.clearStore().then(() => {
      router.push("/login");
    });
  };

  const refreshUser = async () => {
    if (refetch) {
      try {
        const { data } = await refetch();
        if ((data as any)?.me) {
          setUser((data as any).me);
          localStorage.setItem("user", JSON.stringify((data as any).me));
        }
      } catch (err) {
        console.error("Error refreshing user:", err);
      }
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ApolloProvider client={client}>
      <AuthProvider>
        {children}
      </AuthProvider>
    </ApolloProvider>
  );
}

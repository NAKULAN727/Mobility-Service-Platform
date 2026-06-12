"use client";

import React, { useState } from "react";
import { useQuery, useMutation } from "@apollo/client/react";
import { gql } from "@apollo/client";
import { useAuth } from "../../providers";
import { 
  User, Users, CheckCircle2, XCircle, Clock, Eye, AlertTriangle, 
  Loader2, Navigation, LogOut, Search, Filter, ShieldCheck,
  FileSpreadsheet, ExternalLink, RefreshCw
} from "lucide-react";
import Link from "next/link";

const GET_ALL_DRIVERS = gql`
  query GetAllDrivers {
    getAllDrivers {
      id
      userId
      licenseNumber
      experienceYears
      availabilityStatus
      verificationStatus
      createdAt
      updatedAt
      user {
        id
        fullName
        email
        phone
        profileImage
        isVerified
      }
      documents {
        id
        documentType
        documentUrl
        uploadedAt
      }
    }
  }
`;

const VERIFY_DRIVER = gql`
  mutation VerifyDriver($driverId: ID!) {
    verifyDriver(driverId: $driverId) {
      id
      verificationStatus
    }
  }
`;

const REJECT_DRIVER = gql`
  mutation RejectDriver($driverId: ID!) {
    rejectDriver(driverId: $driverId) {
      id
      verificationStatus
    }
  }
`;

interface Driver {
  id: string;
  userId: string;
  licenseNumber: string;
  experienceYears: number;
  availabilityStatus: boolean;
  verificationStatus: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    fullName: string;
    email: string;
    phone: string;
    profileImage?: string;
    isVerified: boolean;
  };
  documents: Array<{
    id: string;
    documentType: "DRIVING_LICENSE" | "AADHAAR" | "PAN_CARD" | "VEHICLE_CERTIFICATE";
    documentUrl: string;
    uploadedAt: string;
  }>;
}

export default function AdminDriversPage() {
  const { logout, loading: authLoading } = useAuth();
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [actionSuccess, setActionSuccess] = useState("");

  const { data, loading, error, refetch } = useQuery(GET_ALL_DRIVERS, {
    fetchPolicy: "network-only",
  });

  const [verifyDriver, { loading: verifying }] = useMutation(VERIFY_DRIVER, {
    onCompleted: () => {
      setActionSuccess("Driver verification approved successfully.");
      refetch().then(() => {
        // Refresh selected driver data
        if (selectedDriver) {
          const updated = (data as any)?.getAllDrivers?.find((d: Driver) => d.id === selectedDriver.id);
          if (updated) setSelectedDriver(updated);
        }
      });
      setTimeout(() => setActionSuccess(""), 4000);
    },
  });

  const [rejectDriver, { loading: rejecting }] = useMutation(REJECT_DRIVER, {
    onCompleted: () => {
      setActionSuccess("Driver credentials rejected.");
      refetch().then(() => {
        if (selectedDriver) {
          const updated = (data as any)?.getAllDrivers?.find((d: Driver) => d.id === selectedDriver.id);
          if (updated) setSelectedDriver(updated);
        }
      });
      setTimeout(() => setActionSuccess(""), 4000);
    },
  });

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 text-zinc-900">
        <Loader2 className="h-6 w-6 animate-spin text-zinc-900" />
      </div>
    );
  }

  const handleApprove = (driverId: string) => {
    verifyDriver({ variables: { driverId } });
  };

  const handleReject = (driverId: string) => {
    rejectDriver({ variables: { driverId } });
  };

  const drivers: Driver[] = (data as any)?.getAllDrivers || [];

  // Filtered and searched drivers
  const filteredDrivers = drivers.filter((driver) => {
    const matchesFilter = filterStatus === "ALL" || driver.verificationStatus === filterStatus;
    const matchesSearch = 
      driver.user.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      driver.user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      driver.licenseNumber.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-800 flex flex-col font-sans relative">

      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-zinc-200 px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 items-center justify-center rounded bg-black text-white flex shadow shadow-black/10">
            <Navigation className="h-4 w-4" />
          </div>
          <span className="font-black text-lg tracking-tight text-black">
            DriveMate
          </span>
        </div>

        <nav className="hidden md:flex items-center gap-6 text-sm font-bold text-zinc-650">
          <Link href="/profile" className="hover:text-black transition-colors">
            Profile
          </Link>
          <Link href="/admin/drivers" className="text-black border-b-2 border-black pb-1">
            Driver Verification Panel
          </Link>
        </nav>

        <div className="flex items-center gap-4">
          <span className="hidden sm:inline text-[10px] bg-zinc-100 border border-zinc-200 px-2.5 py-1.5 rounded font-bold uppercase tracking-wider text-zinc-655">
            Admin Portal
          </span>
          <button
            onClick={logout}
            className="flex items-center gap-2 text-xs bg-white hover:bg-zinc-550 border border-zinc-200 text-zinc-705 hover:bg-zinc-50 hover:text-black font-bold px-4 py-2.5 rounded transition-all duration-205 shadow-sm"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </header>

      {/* Mobile nav */}
      <div className="md:hidden flex bg-white border-b border-zinc-200 px-6 py-2 justify-center gap-6 text-xs font-bold shadow-sm">
        <Link href="/profile" className="text-zinc-500 hover:text-black">
          Profile
        </Link>
        <Link href="/admin/drivers" className="text-black border-b-2 border-black pb-1">
          Verifications
        </Link>
      </div>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-8 space-y-6 z-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-black text-zinc-950 flex items-center gap-2">
              <ShieldCheck className="h-6 w-6 text-black" />
              Driver Approval Desk
            </h1>
            <p className="text-zinc-600 text-sm">
              Review registered driver profiles, download or view uploaded identity cards, and manage verification status.
            </p>
          </div>

          <button
            onClick={() => refetch()}
            className="flex items-center justify-center gap-2 border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 font-bold px-4 py-2.5 rounded text-xs transition-all duration-200 shadow-sm"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh List
          </button>
        </div>

        {actionSuccess && (
          <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-sm text-emerald-600 shadow-sm">
            <CheckCircle2 className="h-5 w-5 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
        )}

        {/* Filters and Search */}
        <div className="bg-white border border-zinc-200 rounded-lg p-4 flex flex-col md:flex-row items-center gap-4 shadow-sm">
          <div className="relative w-full md:flex-1">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Search className="h-4 w-4 text-zinc-400" />
            </div>
            <input
              type="text"
              placeholder="Search by name, email, or license..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full rounded border border-zinc-200 bg-zinc-50 py-2.5 pl-9 pr-3 text-zinc-800 placeholder-zinc-500 outline-none transition-colors focus:border-black focus:bg-white text-sm"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <Filter className="h-4 w-4 text-zinc-400 shrink-0" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="block w-full md:w-44 rounded border border-zinc-200 bg-zinc-50 py-2.5 px-3 text-zinc-700 outline-none focus:border-black focus:bg-white text-xs font-bold"
            >
              <option value="ALL">All Drivers</option>
              <option value="PENDING">Pending Approval</option>
              <option value="APPROVED">Approved Only</option>
              <option value="REJECTED">Rejected Only</option>
            </select>
          </div>
        </div>

        {/* Content splits */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Driver List Table */}
          <div className="lg:col-span-2 bg-white border border-zinc-200 rounded-lg overflow-hidden shadow-sm flex flex-col min-h-[400px]">
            {loading ? (
              <div className="flex flex-1 items-center justify-center py-20 text-zinc-405">
                <Loader2 className="h-6 w-6 animate-spin text-zinc-900" />
              </div>
            ) : error ? (
              <div className="flex flex-1 flex-col items-center justify-center p-8 text-zinc-500 gap-2">
                <AlertTriangle className="h-8 w-8 text-red-600" />
                <p className="font-bold text-sm">Failed to load drivers database.</p>
                <p className="text-xs text-zinc-400">{error.message}</p>
              </div>
            ) : filteredDrivers.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center py-20 text-zinc-400">
                <Users className="h-10 w-10 mb-2 text-zinc-300" />
                <p className="text-sm font-semibold">No drivers found matching criteria.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-zinc-200 text-left text-sm">
                  <thead className="bg-zinc-50 text-xs text-zinc-650 font-bold uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-4 border-b border-zinc-200">Driver</th>
                      <th className="px-6 py-4 border-b border-zinc-200">License / Exp</th>
                      <th className="px-6 py-4 border-b border-zinc-200">Status</th>
                      <th className="px-6 py-4 border-b border-zinc-200 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 bg-white">
                    {filteredDrivers.map((driver) => (
                      <tr 
                        key={driver.id} 
                        onClick={() => setSelectedDriver(driver)}
                        className={`hover:bg-zinc-50 cursor-pointer transition-colors duration-150 ${
                          selectedDriver?.id === driver.id ? "bg-zinc-100" : ""
                        }`}
                      >
                        <td className="px-6 py-4 flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full overflow-hidden border border-zinc-200 bg-zinc-50 flex items-center justify-center">
                            {driver.user.profileImage ? (
                              <img src={driver.user.profileImage} alt="" className="h-full w-full object-cover" />
                            ) : (
                              <User className="h-5 w-5 text-zinc-400" />
                            )}
                          </div>
                          <div>
                            <span className="font-bold text-zinc-950 block">{driver.user.fullName}</span>
                            <span className="text-zinc-500 text-xs block">{driver.user.email}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-bold text-zinc-800 block text-xs">{driver.licenseNumber}</span>
                          <span className="text-zinc-550 text-xs block font-bold">{driver.experienceYears} Years Exp</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                            driver.verificationStatus === "APPROVED" ? "bg-emerald-100 text-emerald-700" :
                            driver.verificationStatus === "REJECTED" ? "bg-red-100 text-red-700" :
                            "bg-amber-100 text-amber-700"
                          }`}>
                            {driver.verificationStatus}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedDriver(driver);
                            }}
                            className="inline-flex items-center gap-1.5 bg-zinc-900 hover:bg-black text-white font-bold px-3 py-1.5 rounded text-xs transition-colors"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            Review
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Details Drawer Panel */}
          <div className="bg-white border border-zinc-200 rounded-lg p-6 shadow-sm flex flex-col justify-between min-h-[450px]">
            {selectedDriver ? (
              <div className="space-y-6 flex-1 flex flex-col justify-between">
                <div className="space-y-6">
                  <div className="flex items-center gap-3 border-b border-zinc-200 pb-4">
                    <div className="h-12 w-12 rounded-full overflow-hidden border border-zinc-200 bg-zinc-50 flex items-center justify-center">
                      {selectedDriver.user.profileImage ? (
                        <img src={selectedDriver.user.profileImage} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <User className="h-6 w-6 text-zinc-400" />
                      )}
                    </div>
                    <div>
                      <h2 className="text-base font-extrabold text-zinc-950">{selectedDriver.user.fullName}</h2>
                      <p className="text-zinc-650 text-xs font-bold">{selectedDriver.user.phone}</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-[10px] font-bold text-zinc-550 uppercase tracking-wider">Driver Credentials</h3>
                    
                    <div className="grid grid-cols-2 gap-4 bg-zinc-50 p-4 rounded border border-zinc-200 text-xs">
                      <div>
                        <span className="text-zinc-500 block mb-0.5 font-semibold">License Number</span>
                        <span className="font-extrabold text-zinc-800">{selectedDriver.licenseNumber}</span>
                      </div>
                      <div>
                        <span className="text-zinc-500 block mb-0.5 font-semibold">Experience</span>
                        <span className="font-extrabold text-zinc-800">{selectedDriver.experienceYears} Years</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h3 className="text-[10px] font-bold text-zinc-550 uppercase tracking-wider block">Uploaded Documents ({selectedDriver.documents?.length || 0})</h3>
                      {selectedDriver.documents?.length === 0 ? (
                        <div className="flex items-center justify-center p-6 border border-dashed border-zinc-200 rounded text-xs text-zinc-400">
                          No documents uploaded yet.
                        </div>
                      ) : (
                        <div className="space-y-2.5">
                          {selectedDriver.documents.map((doc) => (
                            <div 
                              key={doc.id}
                              className="flex items-center justify-between p-3 border border-zinc-200 bg-white rounded text-xs"
                            >
                              <div>
                                <span className="font-bold text-zinc-800 block">
                                  {doc.documentType.replace(/_/g, " ")}
                                </span>
                                <span className="text-zinc-500 text-[10px] block font-bold">
                                  Uploaded: {new Date(doc.uploadedAt).toLocaleDateString()}
                                </span>
                              </div>
                              <a
                                href={doc.documentUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="font-bold text-zinc-900 hover:text-black underline transition-colors"
                              >
                                View File
                              </a>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-zinc-200 flex items-center gap-3">
                  {selectedDriver.verificationStatus !== "APPROVED" && (
                    <button
                      onClick={() => handleApprove(selectedDriver.id)}
                      disabled={verifying || rejecting}
                      className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-4 rounded text-xs transition-colors disabled:opacity-50 active:scale-[0.99] shadow-sm"
                    >
                      {verifying ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      )}
                      Approve Driver
                    </button>
                  )}

                  {selectedDriver.verificationStatus !== "REJECTED" && (
                    <button
                      onClick={() => handleReject(selectedDriver.id)}
                      disabled={verifying || rejecting}
                      className="flex-1 flex items-center justify-center gap-1.5 bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 px-4 rounded text-xs transition-colors disabled:opacity-50 active:scale-[0.99] shadow-sm"
                    >
                      {rejecting ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <XCircle className="h-3.5 w-3.5" />
                      )}
                      Reject Driver
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-zinc-400 p-6">
                <FileSpreadsheet className="h-10 w-10 text-zinc-300 mb-2" />
                <p className="text-xs text-zinc-500 font-bold text-center leading-relaxed">
                  Select a driver from the approval desk to review files and issue certificates.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

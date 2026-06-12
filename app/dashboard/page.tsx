"use client";

import React from "react";
import { useMutation, useQuery } from "@apollo/client/react";
import { gql } from "@apollo/client";
import { useAuth } from "../providers";
import Link from "next/link";
import {
  Navigation, LogOut, User, Mail, Camera, Loader2,
  Save, Key, CheckCircle, AlertTriangle, UserCheck,
  Shield, Car, Clock, FileText, ShieldCheck, ArrowRight,
  CheckCircle2, XCircle, Upload, Users, Phone, Sparkles,
  MessageSquare, Star, ArrowUpRight, DollarSign, Calendar,
  MapPin, RefreshCw
} from "lucide-react";
import { generateRecommendations } from "../../lib/recommendationEngine";

const UPDATE_PROFILE = gql`
  mutation UpdateProfile($fullName: String, $phone: String, $profileImage: String) {
    updateProfile(fullName: $fullName, phone: $phone, profileImage: $profileImage) {
      id fullName phone profileImage
    }
  }
`;

const CHANGE_PASSWORD = gql`
  mutation ChangePassword($oldPassword: String!, $newPassword: String!) {
    changePassword(oldPassword: $oldPassword, newPassword: $newPassword)
  }
`;

const GET_ACTIVE_BOOKINGS = gql`
  query GetActiveBookings {
    getActiveBookings {
      id
      customerId
      driverId
      vehicleId
      serviceType
      location {
        id
        pickupLocation
        destinationLocation
        distance
        estimatedDuration
      }
      bookingDate
      bookingTime
      fareAmount
      bookingStatus
      otpCode
    }
  }
`;

const ACCEPT_BOOKING = gql`
  mutation AcceptBooking($bookingId: ID!, $driverId: ID!) {
    acceptBooking(bookingId: $bookingId, driverId: $driverId) {
      success
      errors {
        message
      }
      booking {
        id
        bookingStatus
        driverId
      }
    }
  }
`;

const REJECT_BOOKING = gql`
  mutation RejectBooking($bookingId: ID!, $driverId: ID!) {
    rejectBooking(bookingId: $bookingId, driverId: $driverId) {
      success
      errors { message }
      booking { id bookingStatus }
    }
  }
`;

const DRIVER_ARRIVING = gql`
  mutation DriverArriving($bookingId: ID!) {
    driverArriving(bookingId: $bookingId) {
      success
      errors { message }
      booking { id bookingStatus }
    }
  }
`;

const ARRIVE_AT_PICKUP = gql`
  mutation ArriveAtPickup($bookingId: ID!) {
    arriveAtPickup(bookingId: $bookingId) {
      success
      errors { message }
      booking { id bookingStatus }
    }
  }
`;

const VERIFY_OTP = gql`
  mutation VerifyOTP($bookingId: ID!, $otpCode: String!) {
    verifyOTP(bookingId: $bookingId, otpCode: $otpCode) {
      success
      errors { message }
      booking { id bookingStatus }
    }
  }
`;

const START_TRIP = gql`
  mutation StartTrip($bookingId: ID!) {
    startTrip(bookingId: $bookingId) {
      success
      errors { message }
      booking { id bookingStatus }
    }
  }
`;

const COMPLETE_TRIP = gql`
  mutation CompleteTrip($bookingId: ID!) {
    completeTrip(bookingId: $bookingId) {
      success
      errors { message }
      booking { id bookingStatus }
    }
  }
`;

const GET_BOOKING_HISTORY = gql`
  query GetBookingHistory($customerId: ID!, $first: Int) {
    getBookingHistory(customerId: $customerId, first: $first) {
      edges {
        node {
          id
          serviceType
          location {
            pickupLocation
            destinationLocation
            distance
            estimatedDuration
          }
          bookingDate
          bookingTime
          fareAmount
          bookingStatus
          otpCode
          review {
            rating
            reviewText
            sentiment
          }
        }
      }
      totalCount
    }
  }
`;

// ── Shared Navbar ─────────────────────────────────────────────────────────────
function Navbar({ user, logout }: { user: any; logout: () => void }) {
  return (
    <header className="sticky top-0 z-40 bg-white border-b border-zinc-200 px-6 py-4 flex items-center justify-between shadow-sm">
      <div className="flex items-center gap-3">
        <div className="h-8 w-8 flex items-center justify-center rounded bg-black text-white">
          <Navigation className="h-4 w-4" />
        </div>
        <span className="font-black text-lg tracking-tight">DriveMate</span>
      </div>

      <nav className="hidden md:flex items-center gap-6 text-sm font-bold text-zinc-600">
        <Link href="/dashboard" className="text-black border-b-2 border-black pb-1">Dashboard</Link>
        {user.role !== "DRIVER" && (
          <Link href="/ai-assistant" className="hover:text-black transition-colors">AI Booking</Link>
        )}
        {user.role !== "DRIVER" && (
          <Link href="/analytics" className="hover:text-black transition-colors">Analytics</Link>
        )}
        {user.role === "DRIVER" && (
          <Link href="/driver/verification" className="hover:text-black transition-colors">Driver Portal</Link>
        )}
        {user.role === "ADMIN" && (
          <Link href="/admin/drivers" className="hover:text-black transition-colors">Verification Desk</Link>
        )}
      </nav>

      <div className="flex items-center gap-3">
        <span className="hidden sm:inline text-[10px] bg-zinc-100 border border-zinc-200 px-2.5 py-1.5 rounded font-bold uppercase tracking-wider text-zinc-600">
          {user.role}
        </span>
        <button
          onClick={logout}
          className="flex items-center gap-2 text-xs border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 font-bold px-4 py-2.5 rounded shadow-sm transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>
      </div>
    </header>
  );
}

// ── Profile + Password Panel (shared) ─────────────────────────────────────────
function ProfilePanel({ user, refreshUser }: { user: any; refreshUser: (u: any) => void }) {
  const [fullName, setFullName] = React.useState(user.fullName);
  const [phone, setPhone] = React.useState(user.phone);
  const [uploading, setUploading] = React.useState(false);
  const [profileMsg, setProfileMsg] = React.useState<{ ok: boolean; text: string } | null>(null);

  const [oldPassword, setOldPassword] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [pwMsg, setPwMsg] = React.useState<{ ok: boolean; text: string } | null>(null);

  const flash = (set: (v: any) => void, v: any) => { set(v); setTimeout(() => set(null), 4000); };

  const [updateProfile, { loading: saving }] = useMutation(UPDATE_PROFILE, {
    onCompleted: (d: any) => { refreshUser(d.updateProfile); flash(setProfileMsg, { ok: true, text: "Profile updated." }); },
    onError: (e) => flash(setProfileMsg, { ok: false, text: e.message }),
  });

  const [changePassword, { loading: pwSaving }] = useMutation(CHANGE_PASSWORD, {
    onCompleted: () => { flash(setPwMsg, { ok: true, text: "Password changed." }); setOldPassword(""); setNewPassword(""); setConfirmPassword(""); },
    onError: (e) => flash(setPwMsg, { ok: false, text: e.message }),
  });

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const form = new FormData();
    form.append("file", file);
    try {
      const res = await fetch("/api/upload", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      await updateProfile({ variables: { profileImage: data.url } });
    } catch (err: any) {
      flash(setProfileMsg, { ok: false, text: err.message });
    } finally {
      setUploading(false);
    }
  };

  const inputCls = "block w-full rounded border border-zinc-200 bg-zinc-50 py-2.5 px-3 text-sm text-zinc-800 outline-none focus:border-black focus:bg-white transition-colors";
  const labelCls = "text-[10px] font-bold text-zinc-500 uppercase tracking-wider block mb-1.5";

  const Msg = ({ msg }: { msg: { ok: boolean; text: string } | null }) =>
    msg ? (
      <div className={`flex items-center gap-2 rounded p-3 text-xs font-semibold mb-3 ${msg.ok ? "bg-emerald-50 border border-emerald-200 text-emerald-700" : "bg-red-50 border border-red-200 text-red-700"}`}>
        {msg.ok ? <CheckCircle className="h-4 w-4 shrink-0" /> : <AlertTriangle className="h-4 w-4 shrink-0" />}
        {msg.text}
      </div>
    ) : null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Edit Profile */}
      <div className="bg-white border border-zinc-200 rounded-lg p-6 shadow-sm">
        <div className="flex items-center gap-2 border-b border-zinc-100 pb-3 mb-5">
          <Shield className="h-4 w-4 text-zinc-700" />
          <h2 className="text-sm font-extrabold text-zinc-950">Profile Details</h2>
        </div>

        <div className="flex items-center gap-4 mb-5">
          <div className="relative shrink-0">
            <div className="h-14 w-14 rounded-full overflow-hidden border border-zinc-200 bg-zinc-50 flex items-center justify-center">
              {user.profileImage
                ? <img src={user.profileImage} alt="" className="h-full w-full object-cover" />
                : <User className="h-6 w-6 text-zinc-400" />}
              {uploading && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center rounded-full">
                  <Loader2 className="h-4 w-4 animate-spin text-white" />
                </div>
              )}
            </div>
            <label className="absolute bottom-0 right-0 h-5 w-5 rounded-full bg-black text-white flex items-center justify-center cursor-pointer border border-white shadow">
              <Camera className="h-2.5 w-2.5" />
              <input type="file" accept="image/*" onChange={handleAvatarUpload} disabled={uploading} className="hidden" />
            </label>
          </div>
          <div>
            <p className="font-bold text-zinc-900 text-sm">{user.fullName}</p>
            <p className="text-xs text-zinc-500">{user.email}</p>
          </div>
        </div>

        <Msg msg={profileMsg} />

        <form onSubmit={(e) => { e.preventDefault(); updateProfile({ variables: { fullName, phone } }); }} className="space-y-4">
          <div>
            <label className={labelCls}>Full Name</label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <User className="h-4 w-4 text-zinc-400" />
              </div>
              <input type="text" required value={fullName} onChange={(e) => setFullName(e.target.value)} className={inputCls + " pl-9"} />
            </div>
          </div>
          <div>
            <label className={labelCls}>Phone</label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <Phone className="h-4 w-4 text-zinc-400" />
              </div>
              <input type="tel" required value={phone} onChange={(e) => setPhone(e.target.value)} className={inputCls + " pl-9"} />
            </div>
          </div>
          <button type="submit" disabled={saving} className="w-full flex items-center justify-center gap-2 bg-black text-white font-bold py-2.5 rounded text-xs hover:bg-zinc-800 disabled:opacity-50 transition-colors">
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            Save Changes
          </button>
        </form>
      </div>

      {/* Change Password */}
      <div className="bg-white border border-zinc-200 rounded-lg p-6 shadow-sm">
        <div className="flex items-center gap-2 border-b border-zinc-100 pb-3 mb-5">
          <Key className="h-4 w-4 text-zinc-700" />
          <h2 className="text-sm font-extrabold text-zinc-950">Change Password</h2>
        </div>

        <Msg msg={pwMsg} />

        <form onSubmit={(e) => {
          e.preventDefault();
          if (newPassword.length < 6) { flash(setPwMsg, { ok: false, text: "Min 6 characters." }); return; }
          if (newPassword !== confirmPassword) { flash(setPwMsg, { ok: false, text: "Passwords don't match." }); return; }
          changePassword({ variables: { oldPassword, newPassword } });
        }} className="space-y-4">
          {[
            { label: "Current Password", val: oldPassword, set: setOldPassword },
            { label: "New Password", val: newPassword, set: setNewPassword, placeholder: "Min 6 characters" },
            { label: "Confirm New Password", val: confirmPassword, set: setConfirmPassword },
          ].map(({ label, val, set, placeholder }) => (
            <div key={label}>
              <label className={labelCls}>{label}</label>
              <input type="password" required value={val} onChange={(e) => set(e.target.value)} placeholder={placeholder ?? "••••••••"} className={inputCls} />
            </div>
          ))}
          <button type="submit" disabled={pwSaving} className="w-full flex items-center justify-center gap-2 bg-black text-white font-bold py-2.5 rounded text-xs hover:bg-zinc-800 disabled:opacity-50 transition-colors">
            {pwSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Key className="h-3.5 w-3.5" />}
            Update Password
          </button>
        </form>
      </div>
    </div>
  );
}

// ── Customer Dashboard ────────────────────────────────────────────────────────
function CustomerDashboard({ user, logout, refreshUser }: any) {
  const [recs, setRecs] = React.useState<any[]>([]);

  React.useEffect(() => {
    generateRecommendations(user.id).then(setRecs).catch(console.error);
  }, [user.id]);

  const { data: historyData, loading: historyLoading, refetch: refetchHistory } = useQuery(GET_BOOKING_HISTORY, {
    variables: { customerId: user.id, first: 5 },
    fetchPolicy: "network-only"
  });
  const bookings = (historyData as any)?.getBookingHistory?.edges || [];

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col">
      <Navbar user={user} logout={logout} />
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-10 space-y-8">

        {/* Mode Selection Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="relative bg-emerald-900 text-white rounded-3xl p-8 overflow-hidden shadow-2xl flex flex-col justify-between">
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
            <div className="relative z-10 space-y-3 max-w-sm">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase bg-emerald-500/30 text-emerald-100 border border-emerald-500/50">
                <Car className="h-3 w-3" /> Drive My Car
              </span>
              <h2 className="text-2xl font-black tracking-tight sm:text-3xl leading-tight">
                Hire a Driver
              </h2>
              <p className="text-emerald-100 text-sm leading-relaxed pb-4">
                We'll send a verified, professional driver to drive your personal vehicle.
              </p>
              <Link 
                href="/ai-assistant?prompt=I%20need%20a%20driver%20for%20my%20own%20car." 
                className="inline-flex items-center gap-2 bg-white text-emerald-900 hover:bg-emerald-50 transition-all font-bold px-5 py-3 rounded-xl shadow-lg text-sm w-max"
              >
                <MessageSquare className="h-4 w-4" />
                Book via AI Assistant
              </Link>
            </div>
          </div>

          <div className="relative bg-blue-900 text-white rounded-3xl p-8 overflow-hidden shadow-2xl flex flex-col justify-between">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />
            <div className="relative z-10 space-y-3 max-w-sm">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase bg-blue-500/30 text-blue-100 border border-blue-500/50">
                <Navigation className="h-3 w-3" /> Car + Driver
              </span>
              <h2 className="text-2xl font-black tracking-tight sm:text-3xl leading-tight">
                Complete Ride
              </h2>
              <p className="text-blue-100 text-sm leading-relaxed pb-4">
                Book a premium car and a professional driver for a complete chauffeur experience.
              </p>
              <Link 
                href="/ai-assistant?prompt=I%20need%20to%20book%20a%20complete%20ride%20with%20a%20car%20and%20driver." 
                className="inline-flex items-center gap-2 bg-white text-blue-900 hover:bg-blue-50 transition-all font-bold px-5 py-3 rounded-xl shadow-lg text-sm w-max"
              >
                <MessageSquare className="h-4 w-4" />
                Book via AI Assistant
              </Link>
            </div>
          </div>
        </div>

        {/* Recommendations Panel */}
        {recs.length > 0 && (
          <div>
            <h2 className="text-xs font-black text-zinc-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-zinc-650" /> Smart Suggestions
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {recs.map((rec, idx) => (
                <div key={idx} className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm hover:border-zinc-300 transition-all flex justify-between items-start gap-4">
                  <div className="space-y-1.5 flex-1">
                    <span className={`inline-block text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                      rec.type === "habit" ? "bg-indigo-50 text-indigo-700 border border-indigo-200" : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    }`}>
                      {rec.type}
                    </span>
                    <h3 className="font-extrabold text-zinc-900 text-sm">{rec.title}</h3>
                    <p className="text-xs text-zinc-500 leading-relaxed">{rec.description}</p>
                  </div>
                  <Link 
                    href="/ai-assistant" 
                    className="shrink-0 bg-zinc-900 text-white font-bold text-xs px-4 py-2.5 rounded-xl hover:bg-zinc-800 transition-all flex items-center gap-1"
                  >
                    {rec.actionText} <ArrowUpRight className="h-3 w-3" />
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Real Ride History */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-xs font-black text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-zinc-650" /> Recent Bookings
            </h2>
            <button 
              onClick={() => refetchHistory()} 
              className="text-xs text-zinc-500 hover:text-black font-semibold flex items-center gap-1 transition-colors"
            >
              <RefreshCw className="h-3 w-3" /> Refresh
            </button>
          </div>

          {historyLoading ? (
            <div className="bg-white border border-zinc-200 rounded-2xl p-8 text-center text-zinc-400">
              <Loader2 className="h-5 w-5 animate-spin mx-auto text-zinc-900 mb-2" />
              <p className="text-xs">Loading booking history...</p>
            </div>
          ) : bookings.length === 0 ? (
            <div className="bg-white border border-zinc-200 rounded-2xl p-10 text-center text-zinc-500 flex flex-col items-center gap-2">
              <Car className="h-8 w-8 text-zinc-350" />
              <p className="font-bold text-sm">No rides booked yet</p>
              <p className="text-xs text-zinc-400 leading-relaxed max-w-[250px]">
                Your booking activity and history will appear here once you take your first ride.
              </p>
            </div>
          ) : (
            <div className="bg-white border border-zinc-200 rounded-2xl divide-y divide-zinc-100 shadow-sm overflow-hidden">
              {bookings.map((edge: any) => {
                const b = edge.node;
                return (
                  <div key={b.id} className="p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:bg-zinc-50/50 transition-all">
                    <div className="space-y-2 flex-1 min-w-0">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="text-[10px] font-mono font-bold bg-zinc-100 border border-zinc-200 px-2 py-0.5 rounded text-zinc-600">
                          ID: {b.id.slice(0, 8).toUpperCase()}
                        </span>
                        <span className="text-[10px] font-bold text-zinc-400 font-mono">
                          {b.bookingDate} @ {b.bookingTime}
                        </span>
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                          b.bookingStatus === "COMPLETED" ? "bg-emerald-50 text-emerald-700 border border-emerald-250" :
                          b.bookingStatus === "CANCELLED" ? "bg-red-50 text-red-700" :
                          "bg-amber-50 text-amber-700 border border-amber-200 animate-pulse"
                        }`}>
                          {b.bookingStatus}
                        </span>
                      </div>

                      {/* Pickup/Dropoff list */}
                      <div className="space-y-1.5 text-xs text-zinc-700">
                        <p className="flex items-center gap-2 truncate">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          <span className="font-bold text-zinc-400 uppercase text-[9px] shrink-0">Pickup:</span>
                          <span className="truncate">{b.location.pickupLocation}</span>
                        </p>
                        <p className="flex items-center gap-2 truncate">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                          <span className="font-bold text-zinc-400 uppercase text-[9px] shrink-0">Dropoff:</span>
                          <span className="truncate">{b.location.destinationLocation}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex sm:flex-col items-end justify-between sm:justify-center gap-2 w-full sm:w-auto shrink-0 border-t sm:border-t-0 pt-3 sm:pt-0 border-zinc-100">
                      <div className="text-right">
                        <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider">Fare Paid</p>
                        <p className="text-sm font-black text-zinc-950">₹{b.fareAmount}</p>
                      </div>

                      {b.bookingStatus === "COMPLETED" && (
                        b.review ? (
                          <div className="flex items-center gap-1.5 bg-zinc-50 border border-zinc-150 px-2.5 py-1 rounded-lg">
                            <span className="text-[10px] font-black text-amber-500 flex items-center gap-0.5">
                              <Star className="h-3 w-3 fill-amber-500" /> {b.review.rating}
                            </span>
                            <span className={`text-[9px] font-bold ${
                              b.review.sentiment === "Positive" ? "text-emerald-600" :
                              b.review.sentiment === "Negative" ? "text-rose-600" : "text-zinc-500"
                            }`}>
                              {b.review.sentiment}
                            </span>
                          </div>
                        ) : (
                          <Link 
                            href="/ai-assistant" 
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] px-3 py-1.5 rounded-lg transition-all shadow-sm flex items-center gap-1"
                          >
                            <MessageSquare className="h-3 w-3" /> Review Ride
                          </Link>
                        )
                      )}

                      {["REQUESTED", "MATCHING", "DRIVER_ASSIGNED", "ACCEPTED", "DRIVER_ARRIVING", "OTP_PENDING"].includes(b.bookingStatus) && (
                        <div className="flex items-center gap-1 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded text-[10px] font-mono font-bold text-amber-800">
                          PIN: {b.otpCode}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Quick actions removed */}

        {/* Account settings */}
        <div>
          <h2 className="text-xs font-black text-zinc-500 uppercase tracking-wider mb-3">Account Settings</h2>
          <ProfilePanel user={user} refreshUser={refreshUser} />
        </div>
      </main>
    </div>
  );
}

// ── Driver Dashboard ──────────────────────────────────────────────────────────
function DriverDashboard({ user, logout, refreshUser }: any) {
  const profile = user.driverProfile;
  const docsUploaded = profile?.documents?.length ?? 0;

  const [otpInput, setOtpInput] = React.useState("");
  const [actionError, setActionError] = React.useState("");
  const [actionSuccess, setActionSuccess] = React.useState("");

  const { data, loading: loadingBookings, refetch } = useQuery(GET_ACTIVE_BOOKINGS, {
    pollInterval: 4000,
    fetchPolicy: "network-only"
  });

  const [acceptBooking, { loading: accepting }] = useMutation(ACCEPT_BOOKING, {
    onCompleted: (res: any) => {
      if (res.acceptBooking?.success) {
        setActionSuccess("Ride successfully accepted! Proceed to pickup location.");
        setActionError("");
        refetch();
      } else {
        setActionError(res.acceptBooking?.errors?.[0]?.message || "Could not accept booking");
      }
    },
    onError: (e) => setActionError(e.message)
  });

  const [rejectBooking, { loading: rejecting }] = useMutation(REJECT_BOOKING, {
    onCompleted: (res: any) => {
      if (res.rejectBooking?.success) {
        setActionSuccess("Job rejected. Searching for others...");
        setActionError("");
        refetch();
      } else {
        setActionError(res.rejectBooking?.errors?.[0]?.message || "Could not reject");
      }
    },
    onError: (e) => setActionError(e.message)
  });

  const [driverArriving, { loading: markingArriving }] = useMutation(DRIVER_ARRIVING, {
    onCompleted: (res: any) => {
      if (res.driverArriving?.success) { setActionSuccess("Status updated to Arriving"); setActionError(""); refetch(); }
      else setActionError(res.driverArriving?.errors?.[0]?.message || "Error");
    },
    onError: (e) => setActionError(e.message)
  });

  const [arriveAtPickup, { loading: markingArrived }] = useMutation(ARRIVE_AT_PICKUP, {
    onCompleted: (res: any) => {
      if (res.arriveAtPickup?.success) { setActionSuccess("Arrived at pickup. Ask for OTP."); setActionError(""); refetch(); }
      else setActionError(res.arriveAtPickup?.errors?.[0]?.message || "Error");
    },
    onError: (e) => setActionError(e.message)
  });

  const [verifyOTP, { loading: verifying }] = useMutation(VERIFY_OTP, {
    onCompleted: (res: any) => {
      if (res.verifyOTP?.success) {
        setActionSuccess("OTP Verified! You may now start the trip.");
        setActionError(""); setOtpInput(""); refetch();
      } else setActionError(res.verifyOTP?.errors?.[0]?.message || "Invalid OTP code");
    },
    onError: (e) => setActionError(e.message)
  });

  const [startTrip, { loading: starting }] = useMutation(START_TRIP, {
    onCompleted: (res: any) => {
      if (res.startTrip?.success) { setActionSuccess("Trip started! Drive safely."); setActionError(""); refetch(); }
      else setActionError(res.startTrip?.errors?.[0]?.message || "Error");
    },
    onError: (e) => setActionError(e.message)
  });

  const [completeTrip, { loading: completing }] = useMutation(COMPLETE_TRIP, {
    onCompleted: (res: any) => {
      if (res.completeTrip?.success) { setActionSuccess("Trip completed successfully! Payment processed."); setActionError(""); refetch(); }
      else setActionError(res.completeTrip?.errors?.[0]?.message || "Error");
    },
    onError: (e) => setActionError(e.message)
  });

  const activeBookings = (data as any)?.getActiveBookings || [];

  // Filter: active by this driver
  const assignedRide = activeBookings.find(
    (b: any) => b.driverId === user.id && ["DRIVER_ASSIGNED", "ACCEPTED", "DRIVER_ARRIVING", "OTP_PENDING", "OTP_VERIFIED", "TRIP_STARTED"].includes(b.bookingStatus)
  );

  // Filter: requested and open
  const availableRequests = activeBookings.filter(
    (b: any) => ["REQUESTED", "MATCHING"].includes(b.bookingStatus) && (!b.driverId || b.driverId === user.id)
  );

  const statusConfigs = {
    APPROVED: { cls: "text-emerald-600 bg-emerald-50 border-emerald-200", icon: <CheckCircle2 className="h-3.5 w-3.5" /> },
    PENDING:  { cls: "text-amber-600 bg-amber-50 border-amber-200",   icon: <Clock className="h-3.5 w-3.5 animate-pulse" /> },
    REJECTED: { cls: "text-red-600 bg-red-50 border-red-200",         icon: <XCircle className="h-3.5 w-3.5" /> },
  };
  const statusCfg = statusConfigs[(profile?.verificationStatus ?? "PENDING") as keyof typeof statusConfigs] || statusConfigs.PENDING;

  const statusMsgs = {
    APPROVED: "Your account is approved. You can accept rides.",
    PENDING:  "Admin is reviewing your uploaded credentials.",
    REJECTED: "Verification failed. Please re-upload valid documents.",
  };
  const statusMsg = statusMsgs[(profile?.verificationStatus ?? "PENDING") as keyof typeof statusMsgs] || statusMsgs.PENDING;

  const handleVerifyOTP = (rideId: string) => {
    if (!otpInput.trim() || otpInput.length !== 6) { setActionError("Enter valid 6-digit OTP"); return; }
    verifyOTP({ variables: { bookingId: rideId, otpCode: otpInput } });
  };

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col">
      <Navbar user={user} logout={logout} />
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-10 space-y-8">

        {/* Hero card */}
        <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row items-center gap-5">
          <div className="h-16 w-16 rounded-full overflow-hidden border border-zinc-200 bg-zinc-50 flex items-center justify-center shrink-0">
            {user.profileImage
              ? <img src={user.profileImage} alt="" className="h-full w-full object-cover" />
              : <User className="h-8 w-8 text-zinc-400" />}
          </div>
          <div className="text-center sm:text-left flex-1">
            <h1 className="text-xl font-black text-zinc-950">Welcome, {user.fullName}!</h1>
            <p className="text-sm text-zinc-500 mt-0.5 flex items-center gap-1.5 justify-center sm:justify-start">
              <Mail className="h-3.5 w-3.5" /> {user.email}
            </p>
            {profile && (
              <p className="text-xs text-zinc-400 mt-1">
                License: <span className="font-bold text-zinc-700">{profile.licenseNumber}</span>
                {" · "}{profile.experienceYears} yrs exp
              </p>
            )}
          </div>
          <div className="shrink-0">
            <span className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full border ${statusCfg.cls}`}>
              {statusCfg.icon}
              {profile?.verificationStatus ?? "PENDING"}
            </span>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Documents", value: `${docsUploaded} / 4`,           icon: <FileText className="h-5 w-5" /> },
            { label: "Experience", value: `${profile?.experienceYears ?? 0} yrs`, icon: <Car className="h-5 w-5" /> },
            { label: "Availability", value: profile?.availabilityStatus ? "Active" : "Off", icon: <Clock className="h-5 w-5" /> },
            { label: "Account", value: user.isVerified ? "Verified" : "Pending", icon: <ShieldCheck className="h-5 w-5" /> },
          ].map((s) => (
            <div key={s.label} className="bg-white border border-zinc-200 rounded-xl p-4 shadow-sm">
              <div className="h-8 w-8 rounded bg-zinc-100 flex items-center justify-center text-zinc-650 mb-2">{s.icon}</div>
              <p className="text-lg font-black text-zinc-900">{s.value}</p>
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Feedback alerts */}
        {(actionError || actionSuccess) && (
          <div className="space-y-3">
            {actionError && (
              <div className="bg-red-50 border border-red-250 text-red-700 text-xs p-4 rounded-xl flex items-start gap-2 shadow-sm">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{actionError}</span>
              </div>
            )}
            {actionSuccess && (
              <div className="bg-emerald-50 border border-emerald-250 text-emerald-700 text-xs p-4 rounded-xl flex items-start gap-2 shadow-sm">
                <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{actionSuccess}</span>
              </div>
            )}
          </div>
        )}

        {/* Live Dispatch Jobs Panel */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-xs font-black text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
              <Navigation className="h-3.5 w-3.5 text-zinc-650" /> Live Dispatch Desk
            </h2>
            <button 
              onClick={() => refetch()} 
              className="text-xs text-zinc-500 hover:text-black font-semibold flex items-center gap-1 transition-colors"
            >
              <RefreshCw className="h-3 w-3" /> Scan Requests
            </button>
          </div>

          {loadingBookings && activeBookings.length === 0 ? (
            <div className="bg-white border border-zinc-200 rounded-2xl p-8 text-center text-zinc-400">
              <Loader2 className="h-5 w-5 animate-spin mx-auto text-zinc-900 mb-2" />
              <p className="text-xs">Scanning dispatch servers...</p>
            </div>
          ) : assignedRide ? (
            /* ACTIVE TRIP CARD */
            <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-xl space-y-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
              <div className="flex justify-between items-start flex-wrap gap-2">
                <div>
                  <span className="inline-block bg-emerald-500/20 text-emerald-400 text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border border-emerald-500/30">
                    Assigned Job Status: {assignedRide.bookingStatus}
                  </span>
                  <p className="text-xs text-slate-450 mt-1 font-mono">ID: {assignedRide.id.toUpperCase()}</p>
                </div>
                <div className="text-right">
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Fare Value</p>
                  <p className="text-lg font-black text-emerald-400">₹{assignedRide.fareAmount}</p>
                </div>
              </div>

              {/* Service Mode Alert */}
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 text-sm flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-[10px] font-bold text-amber-500 uppercase tracking-wider">
                    Service Mode: {assignedRide.serviceType === 'DRIVER_ONLY' ? 'Drive My Car' : 'Car + Driver'}
                  </p>
                  <p className="font-semibold text-amber-100 text-xs mt-0.5">
                    {assignedRide.serviceType === 'DRIVER_ONLY' 
                      ? "The customer has their own vehicle. Bring only yourself." 
                      : "Bring your assigned platform vehicle."}
                  </p>
                </div>
              </div>

              {/* Locations */}
              <div className="space-y-3 bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 text-sm">
                <div className="flex items-start gap-2.5">
                  <MapPin className="h-4.5 w-4.5 text-emerald-505 text-emerald-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[9px] font-bold text-slate-400 uppercase">Pickup Location</p>
                    <p className="font-semibold text-slate-100">{assignedRide.location.pickupLocation}</p>
                  </div>
                </div>
                <div className="h-4 w-0.5 bg-slate-750 bg-slate-700 ml-2" />
                <div className="flex items-start gap-2.5">
                  <Navigation className="h-4.5 w-4.5 text-rose-450 text-rose-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[9px] font-bold text-slate-400 uppercase">Dropoff Location</p>
                    <p className="font-semibold text-slate-100">{assignedRide.location.destinationLocation}</p>
                  </div>
                </div>
              </div>

              {/* Action State Flow */}
              <div className="pt-4 space-y-3">
                {assignedRide.bookingStatus === "DRIVER_ASSIGNED" && (
                  <button onClick={() => acceptBooking({ variables: { bookingId: assignedRide.id, driverId: user.id } })} disabled={accepting} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-xl text-xs flex justify-center items-center gap-2">
                    {accepting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />} ACCEPT JOB
                  </button>
                )}

                {assignedRide.bookingStatus === "ACCEPTED" && (
                  <button onClick={() => driverArriving({ variables: { bookingId: assignedRide.id } })} disabled={markingArriving} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl text-xs flex justify-center items-center gap-2">
                    {markingArriving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Navigation className="h-4 w-4" />} I'm On My Way
                  </button>
                )}

                {assignedRide.bookingStatus === "DRIVER_ARRIVING" && (
                  <button onClick={() => arriveAtPickup({ variables: { bookingId: assignedRide.id } })} disabled={markingArrived} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-xl text-xs flex justify-center items-center gap-2">
                    {markingArrived ? <Loader2 className="h-4 w-4 animate-spin" /> : <MapPin className="h-4 w-4" />} I Have Arrived
                  </button>
                )}

                {assignedRide.bookingStatus === "OTP_PENDING" && (
                  <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">Boarding Verification OTP</label>
                    <div className="flex gap-2">
                      <input type="text" maxLength={6} placeholder="Enter 6-digit PIN" value={otpInput} onChange={e => setOtpInput(e.target.value.replace(/[^0-9]/g, ""))} className="flex-1 bg-slate-950 border border-slate-700 rounded-xl py-3 px-4 text-sm outline-none focus:border-emerald-500 text-center font-bold font-mono text-white" disabled={verifying} />
                      <button onClick={() => handleVerifyOTP(assignedRide.id)} disabled={verifying || otpInput.length !== 6} className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white font-bold py-3 px-5 rounded-xl text-xs flex items-center gap-1.5">
                        {verifying ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />} Verify
                      </button>
                    </div>
                  </div>
                )}

                {assignedRide.bookingStatus === "OTP_VERIFIED" && (
                  <button onClick={() => startTrip({ variables: { bookingId: assignedRide.id } })} disabled={starting} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 px-4 rounded-xl text-xs flex justify-center items-center gap-2">
                    {starting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Car className="h-4 w-4" />} Start Trip
                  </button>
                )}

                {assignedRide.bookingStatus === "TRIP_STARTED" && (
                  <button onClick={() => completeTrip({ variables: { bookingId: assignedRide.id } })} disabled={completing} className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-4 px-4 rounded-xl text-xs flex justify-center items-center gap-2 shadow-md">
                    {completing ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />} Complete Trip
                  </button>
                )}
              </div>
            </div>
          ) : availableRequests.length === 0 ? (
            /* NO DISPATCH REQUESTS */
            <div className="bg-white border border-zinc-200 rounded-2xl p-10 text-center text-zinc-500 flex flex-col items-center gap-2 shadow-sm">
              <Car className="h-8 w-8 text-zinc-300 animate-pulse" />
              <p className="font-bold text-sm">Scanning for requests...</p>
              <p className="text-xs text-zinc-400 leading-relaxed max-w-[250px] mx-auto">
                No open trip requests found in your area. Open the customer chatbot to place a new ride request.
              </p>
            </div>
          ) : (
            /* AVAILABLE REQUESTS LIST */
            <div className="space-y-3">
              {availableRequests.map((req: any) => (
                <div key={req.id} className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-zinc-300 transition-all">
                  <div className="space-y-2 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[9px] font-mono font-bold bg-zinc-100 border border-zinc-150 px-2 py-0.5 rounded text-zinc-650 text-zinc-600">
                        REQ ID: {req.id.slice(0, 8).toUpperCase()}
                      </span>
                      <span className="text-[10px] text-zinc-400 font-bold uppercase font-mono">
                        {req.serviceType === 'DRIVER_ONLY' ? 'Drive My Car' : 'Car + Driver'} · {req.bookingDate} @ {req.bookingTime}
                      </span>
                    </div>

                    <div className="space-y-1.5 text-xs text-zinc-700">
                      <p className="flex items-center gap-2 truncate">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        <span className="font-bold text-zinc-400 uppercase text-[9px] shrink-0">Pickup:</span>
                        <span className="truncate">{req.location.pickupLocation}</span>
                      </p>
                      <p className="flex items-center gap-2 truncate">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                        <span className="font-bold text-zinc-400 uppercase text-[9px] shrink-0">Dropoff:</span>
                        <span className="truncate">{req.location.destinationLocation}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex md:flex-col items-end justify-between md:justify-center gap-2 w-full md:w-auto shrink-0 border-t md:border-t-0 pt-3 md:pt-0 border-zinc-100">
                    <div className="text-right">
                      <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider">Estimated Fare</p>
                      <p className="text-sm font-black text-zinc-950">₹{req.fareAmount}</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => acceptBooking({ variables: { bookingId: req.id, driverId: user.id } })} disabled={accepting} className="bg-black hover:bg-zinc-800 disabled:opacity-50 text-white font-bold text-xs px-5 py-2.5 rounded-xl flex items-center gap-1.5 cursor-pointer">
                        {accepting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle className="h-3.5 w-3.5" />} Accept
                      </button>
                      <button onClick={() => rejectBooking({ variables: { bookingId: req.id, driverId: user.id } })} disabled={rejecting} className="bg-white border border-zinc-300 hover:bg-zinc-50 text-zinc-800 font-bold text-xs px-4 py-2.5 rounded-xl">
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Existing Action cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link href="/driver/verification" className="bg-white border border-zinc-200 rounded-xl p-5 shadow-sm hover:border-zinc-400 transition-colors group flex items-center gap-4">
            <div className="h-10 w-10 rounded bg-zinc-100 flex items-center justify-center group-hover:bg-black group-hover:text-white transition-colors shrink-0 text-zinc-650">
              <Upload className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <h3 className="font-extrabold text-zinc-900 text-sm">Upload Documents</h3>
              <p className="text-xs text-zinc-500 mt-0.5">
                {docsUploaded < 4 ? `${4 - docsUploaded} document(s) still required` : "All documents uploaded ✓"}
              </p>
            </div>
            <ArrowRight className="h-4 w-4 text-zinc-400 shrink-0" />
          </Link>

          <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-sm flex items-center gap-4">
            <div className="h-10 w-10 rounded bg-zinc-100 flex items-center justify-center shrink-0 text-zinc-650">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-zinc-900 text-sm">Verification Status</h3>
              <p className="text-xs text-zinc-500 mt-0.5">{statusMsg}</p>
            </div>
          </div>
        </div>

        {/* Account settings */}
        <div>
          <h2 className="text-xs font-black text-zinc-500 uppercase tracking-wider mb-3">Account Settings</h2>
          <ProfilePanel user={user} refreshUser={refreshUser} />
        </div>
      </main>
    </div>
  );
}

// ── Admin Dashboard ───────────────────────────────────────────────────────────
function AdminDashboard({ user, logout, refreshUser }: any) {
  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col">
      <Navbar user={user} logout={logout} />
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-10 space-y-8">

        {/* Hero card */}
        <div className="bg-white border border-zinc-200 rounded-lg p-6 shadow-sm flex flex-col sm:flex-row items-center gap-5">
          <div className="h-16 w-16 rounded-full overflow-hidden border border-zinc-200 bg-zinc-50 flex items-center justify-center shrink-0">
            {user.profileImage
              ? <img src={user.profileImage} alt="" className="h-full w-full object-cover" />
              : <User className="h-8 w-8 text-zinc-400" />}
          </div>
          <div className="text-center sm:text-left flex-1">
            <h1 className="text-xl font-black text-zinc-950">Admin Portal — {user.fullName}</h1>
            <p className="text-sm text-zinc-500 mt-0.5 flex items-center gap-1.5 justify-center sm:justify-start">
              <Mail className="h-3.5 w-3.5" /> {user.email}
            </p>
          </div>
          <span className="text-xs font-bold text-white bg-black px-3 py-1.5 rounded-full shrink-0">
            System Admin
          </span>
        </div>

        {/* Admin actions */}
        <div>
          <h2 className="text-xs font-black text-zinc-500 uppercase tracking-wider mb-3">Admin Tools</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link href="/admin/drivers" className="bg-white border border-zinc-200 rounded-lg p-5 shadow-sm hover:border-zinc-400 transition-colors group flex items-center gap-4">
              <div className="h-10 w-10 rounded bg-zinc-100 flex items-center justify-center group-hover:bg-black group-hover:text-white transition-colors shrink-0 text-zinc-650">
                <Users className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <h3 className="font-extrabold text-zinc-900 text-sm">Driver Verification Panel</h3>
                <p className="text-xs text-zinc-500 mt-0.5">Review, approve, or reject driver applications</p>
              </div>
              <ArrowRight className="h-4 w-4 text-zinc-400 shrink-0" />
            </Link>

            <div className="bg-white border border-zinc-200 rounded-lg p-5 shadow-sm flex items-center gap-4">
              <div className="h-10 w-10 rounded bg-zinc-100 flex items-center justify-center shrink-0 text-zinc-650">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-zinc-900 text-sm">System Access</h3>
                <p className="text-xs text-zinc-500 mt-0.5">Full administrative privileges active</p>
              </div>
            </div>
          </div>
        </div>

        {/* Account settings */}
        <div>
          <h2 className="text-xs font-black text-zinc-500 uppercase tracking-wider mb-3">Account Settings</h2>
          <ProfilePanel user={user} refreshUser={refreshUser} />
        </div>
      </main>
    </div>
  );
}

// ── Entry Point ───────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { user, logout, refreshUser, loading } = useAuth();

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50">
        <Loader2 className="h-6 w-6 animate-spin text-zinc-900" />
      </div>
    );
  }

  if (user.role === "DRIVER") return <DriverDashboard user={user} logout={logout} refreshUser={refreshUser} />;
  if (user.role === "ADMIN")  return <AdminDashboard  user={user} logout={logout} refreshUser={refreshUser} />;
  return <CustomerDashboard user={user} logout={logout} refreshUser={refreshUser} />;
}

"use client";

import React from "react";
import { useMutation, useQuery } from "@apollo/client/react";
import { gql } from "@apollo/client";
import { useAuth } from "../../providers";
import { useRouter } from "next/navigation";
import Link from "next/link";
import DriverNavbar from "../../../components/driver/DriverNavbar";
import {
  User, Mail, Loader2, CheckCircle, AlertTriangle, Phone,
  Car, Clock, ShieldCheck, CheckCircle2, XCircle,
  Star, RefreshCw, MapPin, Navigation,
} from "lucide-react";

const TOGGLE_AVAILABILITY = gql`
  mutation ToggleDriverAvailability {
    toggleDriverAvailability {
      id availabilityStatus
    }
  }
`;

const GET_ACTIVE_BOOKINGS = gql`
  query GetActiveBookings {
    getActiveBookings {
      id customerId driverId vehicleId serviceType
      location { id pickupLocation destinationLocation distance estimatedDuration }
      bookingDate bookingTime fareAmount bookingStatus otpCode
      customer { id fullName profileImage }
    }
  }
`;

const ACCEPT_BOOKING = gql`
  mutation AcceptBooking($bookingId: ID!, $driverId: ID!) {
    acceptBooking(bookingId: $bookingId, driverId: $driverId) {
      success errors { message } booking { id bookingStatus driverId }
    }
  }
`;

const REJECT_BOOKING = gql`
  mutation RejectBooking($bookingId: ID!, $driverId: ID!) {
    rejectBooking(bookingId: $bookingId, driverId: $driverId) {
      success errors { message } booking { id bookingStatus }
    }
  }
`;

const DRIVER_ARRIVING = gql`
  mutation DriverArriving($bookingId: ID!) {
    driverArriving(bookingId: $bookingId) {
      success errors { message } booking { id bookingStatus }
    }
  }
`;

const ARRIVE_AT_PICKUP = gql`
  mutation ArriveAtPickup($bookingId: ID!) {
    arriveAtPickup(bookingId: $bookingId) {
      success errors { message } booking { id bookingStatus }
    }
  }
`;

const VERIFY_OTP = gql`
  mutation VerifyOTP($bookingId: ID!, $otpCode: String!) {
    verifyOTP(bookingId: $bookingId, otpCode: $otpCode) {
      success errors { message } booking { id bookingStatus }
    }
  }
`;

const START_TRIP = gql`
  mutation StartTrip($bookingId: ID!) {
    startTrip(bookingId: $bookingId) {
      success errors { message } booking { id bookingStatus }
    }
  }
`;

const COMPLETE_TRIP = gql`
  mutation CompleteTrip($bookingId: ID!) {
    completeTrip(bookingId: $bookingId) {
      success errors { message } booking { id bookingStatus }
    }
  }
`;

const ACTIVE_TRIP_STATUSES = [
  "DRIVER_ASSIGNED", "ACCEPTED", "DRIVER_ARRIVING",
  "OTP_PENDING", "OTP_VERIFIED", "TRIP_STARTED",
];

export default function DriverDashboardPage() {
  const { user, logout, refreshUser, loading } = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    if (!loading && (!user || user.role !== "DRIVER")) {
      router.push(user ? "/" : "/login");
    }
  }, [user, loading, router]);

  const [otpInput, setOtpInput] = React.useState("");
  const [actionError, setActionError] = React.useState("");
  const [actionSuccess, setActionSuccess] = React.useState("");
  const [togglingAvailability, setTogglingAvailability] = React.useState(false);

  const { data, loading: loadingBookings, refetch } = useQuery(GET_ACTIVE_BOOKINGS, {
    pollInterval: 4000,
    fetchPolicy: "network-only",
    skip: !user || user.role !== "DRIVER",
  });

  const [toggleAvailability] = useMutation(TOGGLE_AVAILABILITY, {
    onCompleted: (res: any) => {
      const updated = res.toggleDriverAvailability;
      if (user?.driverProfile) {
        refreshUser({
          driverProfile: {
            ...user.driverProfile,
            availabilityStatus: updated.availabilityStatus,
          },
        });
      }
      setTogglingAvailability(false);
    },
    onError: () => setTogglingAvailability(false),
  });

  const [acceptBooking, { loading: accepting }] = useMutation(ACCEPT_BOOKING, {
    onCompleted: (res: any) => {
      if (res.acceptBooking?.success) { setActionSuccess("Ride accepted! Proceed to pickup."); setActionError(""); refetch(); }
      else setActionError(res.acceptBooking?.errors?.[0]?.message || "Could not accept");
    },
    onError: (e) => setActionError(e.message),
  });

  const [rejectBooking, { loading: rejecting }] = useMutation(REJECT_BOOKING, {
    onCompleted: (res: any) => {
      if (res.rejectBooking?.success) { setActionSuccess("Job rejected."); setActionError(""); refetch(); }
      else setActionError(res.rejectBooking?.errors?.[0]?.message || "Could not reject");
    },
    onError: (e) => setActionError(e.message),
  });

  const [driverArriving, { loading: markingArriving }] = useMutation(DRIVER_ARRIVING, {
    onCompleted: (res: any) => {
      if (res.driverArriving?.success) { setActionSuccess("Status: Arriving"); setActionError(""); refetch(); }
      else setActionError(res.driverArriving?.errors?.[0]?.message || "Error");
    },
    onError: (e) => setActionError(e.message),
  });

  const [arriveAtPickup, { loading: markingArrived }] = useMutation(ARRIVE_AT_PICKUP, {
    onCompleted: (res: any) => {
      if (res.arriveAtPickup?.success) { setActionSuccess("Arrived at pickup. Ask for OTP."); setActionError(""); refetch(); }
      else setActionError(res.arriveAtPickup?.errors?.[0]?.message || "Error");
    },
    onError: (e) => setActionError(e.message),
  });

  const [verifyOTP, { loading: verifying }] = useMutation(VERIFY_OTP, {
    onCompleted: (res: any) => {
      if (res.verifyOTP?.success) { setActionSuccess("OTP Verified! Start the trip."); setActionError(""); setOtpInput(""); refetch(); }
      else setActionError(res.verifyOTP?.errors?.[0]?.message || "Invalid OTP");
    },
    onError: (e) => setActionError(e.message),
  });

  const [startTrip, { loading: starting }] = useMutation(START_TRIP, {
    onCompleted: (res: any) => {
      if (res.startTrip?.success) { setActionSuccess("Trip started! Drive safely."); setActionError(""); refetch(); }
      else setActionError(res.startTrip?.errors?.[0]?.message || "Error");
    },
    onError: (e) => setActionError(e.message),
  });

  const [completeTrip, { loading: completing }] = useMutation(COMPLETE_TRIP, {
    onCompleted: (res: any) => {
      if (res.completeTrip?.success) { setActionSuccess("Trip completed! Payment processed."); setActionError(""); refetch(); }
      else setActionError(res.completeTrip?.errors?.[0]?.message || "Error");
    },
    onError: (e) => setActionError(e.message),
  });

  if (loading || !user || user.role !== "DRIVER") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50">
        <Loader2 className="h-6 w-6 animate-spin text-zinc-900" />
      </div>
    );
  }

  const profile = user.driverProfile;
  const activeBookings = (data as any)?.getActiveBookings || [];

  const assignedRide = activeBookings.find(
    (b: any) => b.driverId === user.id && ACTIVE_TRIP_STATUSES.includes(b.bookingStatus)
  );

  const availableRequests = [
    ...activeBookings.filter(
      (b: any) => b.bookingStatus === "PENDING_DRIVER_ACCEPTANCE" && b.driverId === user.id
    ),
    ...activeBookings.filter(
      (b: any) => ["REQUESTED", "MATCHING"].includes(b.bookingStatus) && (!b.driverId || b.driverId === user.id)
    ),
  ];

  const isAvailable = profile?.availabilityStatus ?? false;
  const isVerified = profile?.verificationStatus === "APPROVED";

  const statusConfigs = {
    APPROVED: { cls: "text-emerald-600 bg-emerald-50 border-emerald-200", icon: <CheckCircle2 className="h-3.5 w-3.5" /> },
    PENDING:  { cls: "text-amber-600 bg-amber-50 border-amber-200", icon: <Clock className="h-3.5 w-3.5 animate-pulse" /> },
    REJECTED: { cls: "text-red-600 bg-red-50 border-red-200", icon: <XCircle className="h-3.5 w-3.5" /> },
  };
  const verificationStatus = profile?.verificationStatus ?? "PENDING";
  const statusCfg = statusConfigs[verificationStatus as keyof typeof statusConfigs] || statusConfigs.PENDING;

  const statusMsgs = {
    APPROVED: "Approved — you can accept rides.",
    PENDING:  "Documents under admin review.",
    REJECTED: "Verification failed — update documents in Profile.",
  };
  const statusMsg = statusMsgs[verificationStatus as keyof typeof statusMsgs] || statusMsgs.PENDING;

  const handleVerifyOTP = (rideId: string) => {
    if (!otpInput.trim() || otpInput.length !== 6) { setActionError("Enter valid 6-digit OTP"); return; }
    verifyOTP({ variables: { bookingId: rideId, otpCode: otpInput } });
  };

  const handleToggleAvailability = () => {
    setTogglingAvailability(true);
    toggleAvailability();
  };

  const renderTripActions = (ride: any) => (
    <div className="pt-4 space-y-3">
      {ride.bookingStatus === "DRIVER_ASSIGNED" && (
        <button onClick={() => acceptBooking({ variables: { bookingId: ride.id, driverId: user.id } })} disabled={accepting} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-xl text-xs flex justify-center items-center gap-2">
          {accepting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />} ACCEPT JOB
        </button>
      )}
      {ride.bookingStatus === "ACCEPTED" && (
        <button onClick={() => driverArriving({ variables: { bookingId: ride.id } })} disabled={markingArriving} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl text-xs flex justify-center items-center gap-2">
          {markingArriving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Navigation className="h-4 w-4" />} I'm On My Way
        </button>
      )}
      {ride.bookingStatus === "DRIVER_ARRIVING" && (
        <button onClick={() => arriveAtPickup({ variables: { bookingId: ride.id } })} disabled={markingArrived} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-xl text-xs flex justify-center items-center gap-2">
          {markingArrived ? <Loader2 className="h-4 w-4 animate-spin" /> : <MapPin className="h-4 w-4" />} I Have Arrived
        </button>
      )}
      {ride.bookingStatus === "OTP_PENDING" && (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 space-y-3">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">Boarding Verification OTP</label>
          <div className="flex gap-2">
            <input type="text" maxLength={6} placeholder="Enter 6-digit PIN" value={otpInput} onChange={(e) => setOtpInput(e.target.value.replace(/[^0-9]/g, ""))} className="flex-1 bg-slate-950 border border-slate-700 rounded-xl py-3 px-4 text-sm outline-none focus:border-emerald-500 text-center font-bold font-mono text-white" disabled={verifying} />
            <button onClick={() => handleVerifyOTP(ride.id)} disabled={verifying || otpInput.length !== 6} className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white font-bold py-3 px-5 rounded-xl text-xs flex items-center gap-1.5">
              {verifying ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />} Verify
            </button>
          </div>
        </div>
      )}
      {ride.bookingStatus === "OTP_VERIFIED" && (
        <button onClick={() => startTrip({ variables: { bookingId: ride.id } })} disabled={starting} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 px-4 rounded-xl text-xs flex justify-center items-center gap-2">
          {starting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Car className="h-4 w-4" />} Start Trip
        </button>
      )}
      {ride.bookingStatus === "TRIP_STARTED" && (
        <button onClick={() => completeTrip({ variables: { bookingId: ride.id } })} disabled={completing} className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-4 px-4 rounded-xl text-xs flex justify-center items-center gap-2 shadow-md">
          {completing ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />} Complete Trip
        </button>
      )}
    </div>
  );

  const renderTripCard = (ride: any, variant: "current" | "dispatch") => (
    <div key={ride.id} className={variant === "current"
      ? "bg-slate-900 text-white rounded-2xl p-6 shadow-xl space-y-6 relative overflow-hidden"
      : "bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-zinc-300 transition-all"
    }>
      {variant === "current" && (
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
      )}
      {variant === "current" ? (
        <>
          <div className="flex justify-between items-start flex-wrap gap-2">
            <div>
              <span className="inline-block bg-emerald-500/20 text-emerald-400 text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border border-emerald-500/30">
                Job Status: {ride.bookingStatus}
              </span>
              <p className="text-xs text-slate-400 mt-1 font-mono">ID: {ride.id.toUpperCase()}</p>
            </div>
            <div className="text-right">
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Fare Value</p>
              <p className="text-lg font-black text-emerald-400">₹{ride.fareAmount}</p>
            </div>
          </div>
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 text-sm flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-[10px] font-bold text-amber-500 uppercase tracking-wider">
                Service Mode: {ride.serviceType === "DRIVER_ONLY" ? "Drive My Car" : "Car + Driver"}
              </p>
              <p className="font-semibold text-amber-100 text-xs mt-0.5">
                {ride.serviceType === "DRIVER_ONLY"
                  ? "The customer has their own vehicle. Bring only yourself."
                  : "Bring your assigned platform vehicle."}
              </p>
            </div>
          </div>
          <div className="space-y-3 bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 text-sm">
            <div className="flex items-start gap-2.5">
              <MapPin className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-[9px] font-bold text-slate-400 uppercase">Pickup</p>
                <p className="font-semibold text-slate-100">{ride.location.pickupLocation}</p>
              </div>
            </div>
            <div className="h-4 w-0.5 bg-slate-700 ml-2" />
            <div className="flex items-start gap-2.5">
              <Navigation className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-[9px] font-bold text-slate-400 uppercase">Dropoff</p>
                <p className="font-semibold text-slate-100">{ride.location.destinationLocation}</p>
              </div>
            </div>
          </div>
          {renderTripActions(ride)}
        </>
      ) : (
        <>
          <div className="space-y-2 flex-1 min-w-0">
            {ride.customer?.fullName && (
              <p className="text-xs font-bold text-indigo-600 flex items-center gap-1.5">
                <User className="h-3.5 w-3.5" />
                {ride.customer.fullName}
                {ride.bookingStatus === "PENDING_DRIVER_ACCEPTANCE" && (
                  <span className="text-[9px] bg-indigo-50 border border-indigo-200 text-indigo-700 px-1.5 py-0.5 rounded uppercase">
                    Direct Request
                  </span>
                )}
              </p>
            )}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[9px] font-mono font-bold bg-zinc-100 border border-zinc-150 px-2 py-0.5 rounded text-zinc-600">
                REQ ID: {ride.id.slice(0, 8).toUpperCase()}
              </span>
              <span className="text-[10px] text-zinc-400 font-bold uppercase font-mono">
                {ride.serviceType === "DRIVER_ONLY" ? "Drive My Car" : "Car + Driver"} · {ride.bookingDate} @ {ride.bookingTime}
              </span>
            </div>
            <div className="space-y-1.5 text-xs text-zinc-700">
              <p className="flex items-center gap-2 truncate">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span className="font-bold text-zinc-400 uppercase text-[9px] shrink-0">Pickup:</span>
                <span className="truncate">{ride.location.pickupLocation}</span>
              </p>
              <p className="flex items-center gap-2 truncate">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                <span className="font-bold text-zinc-400 uppercase text-[9px] shrink-0">Dropoff:</span>
                <span className="truncate">{ride.location.destinationLocation}</span>
              </p>
            </div>
          </div>
          <div className="flex md:flex-col items-end justify-between gap-2 w-full md:w-auto shrink-0 border-t md:border-t-0 pt-3 md:pt-0 border-zinc-100">
            <div className="text-right">
              <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider">Estimated Fare</p>
              <p className="text-sm font-black text-zinc-950">₹{ride.fareAmount}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => acceptBooking({ variables: { bookingId: ride.id, driverId: user.id } })} disabled={accepting || (ride.bookingStatus !== "PENDING_DRIVER_ACCEPTANCE" && (!isAvailable || !isVerified))} className="bg-black hover:bg-zinc-800 disabled:opacity-50 text-white font-bold text-xs px-5 py-2.5 rounded-xl flex items-center gap-1.5">
                {accepting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle className="h-3.5 w-3.5" />} Accept
              </button>
              <button onClick={() => rejectBooking({ variables: { bookingId: ride.id, driverId: user.id } })} disabled={rejecting} className="bg-white border border-zinc-300 hover:bg-zinc-50 text-zinc-800 font-bold text-xs px-4 py-2.5 rounded-xl">
                Reject
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col">
      <DriverNavbar logout={logout} />
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-10 space-y-8">

        {/* Welcome card */}
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
              <p className="text-xs text-zinc-400 mt-1 flex items-center gap-1.5 justify-center sm:justify-start">
                <Phone className="h-3.5 w-3.5" />
                License: <span className="font-bold text-zinc-700">{profile.licenseNumber}</span>
                {" · "}{profile.experienceYears} yrs exp
              </p>
            )}
          </div>
        </div>

        {/* Availability & verification summary */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Availability</p>
                <p className="text-lg font-black text-zinc-900 mt-1">
                  {isAvailable ? "Online" : "Offline"}
                </p>
                <p className="text-xs text-zinc-500 mt-0.5">
                  {isAvailable ? "You will receive incoming requests." : "Toggle on to start receiving rides."}
                </p>
              </div>
              <button
                onClick={handleToggleAvailability}
                disabled={togglingAvailability || !!assignedRide}
                className={`relative w-14 h-8 rounded-full transition-colors disabled:opacity-50 ${
                  isAvailable ? "bg-emerald-500" : "bg-zinc-300"
                }`}
                aria-label="Toggle availability"
              >
                <span
                  className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow transition-transform ${
                    isAvailable ? "left-7" : "left-1"
                  }`}
                />
              </button>
            </div>
            {assignedRide && (
              <p className="text-[10px] text-amber-600 font-semibold mt-3">
                Availability locked while on an active trip.
              </p>
            )}
          </div>

          <Link href="/driver/profile" className="bg-white border border-zinc-200 rounded-xl p-5 shadow-sm hover:border-zinc-400 transition-colors group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Verification Status</p>
                <p className="text-xs text-zinc-500 mt-1">{statusMsg}</p>
              </div>
              <span className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full border ${statusCfg.cls}`}>
                {statusCfg.icon}
                {verificationStatus}
              </span>
            </div>
            <p className="text-[10px] font-bold text-zinc-400 mt-3 group-hover:text-zinc-700 transition-colors">
              Manage documents in Profile →
            </p>
          </Link>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Status", value: isAvailable ? "Online" : "Offline", icon: <Clock className="h-5 w-5" /> },
            { label: "Open Requests", value: availableRequests.length, icon: <Navigation className="h-5 w-5" /> },
            { label: "Active Trip", value: assignedRide ? "In Progress" : "None", icon: <Car className="h-5 w-5" /> },
            { label: "Experience", value: `${profile?.experienceYears ?? 0} yrs`, icon: <Star className="h-5 w-5" /> },
          ].map((s) => (
            <div key={s.label} className="bg-white border border-zinc-200 rounded-xl p-4 shadow-sm">
              <div className="h-8 w-8 rounded bg-zinc-100 flex items-center justify-center text-zinc-600 mb-2">{s.icon}</div>
              <p className="text-lg font-black text-zinc-900">{s.value}</p>
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Feedback alerts */}
        {(actionError || actionSuccess) && (
          <div className="space-y-3">
            {actionError && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-4 rounded-xl flex items-start gap-2 shadow-sm">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{actionError}</span>
              </div>
            )}
            {actionSuccess && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs p-4 rounded-xl flex items-start gap-2 shadow-sm">
                <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{actionSuccess}</span>
              </div>
            )}
          </div>
        )}

        {/* Current trip */}
        {assignedRide && (
          <div>
            <h2 className="text-xs font-black text-zinc-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Car className="h-3.5 w-3.5" /> Current Trip
            </h2>
            {renderTripCard(assignedRide, "current")}
          </div>
        )}

        {/* Incoming requests */}
        {!assignedRide && (
          <div>
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-xs font-black text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
                <Navigation className="h-3.5 w-3.5" /> Incoming Requests
              </h2>
              <button onClick={() => refetch()} className="text-xs text-zinc-500 hover:text-black font-semibold flex items-center gap-1 transition-colors">
                <RefreshCw className="h-3 w-3" /> Refresh
              </button>
            </div>
            {loadingBookings && activeBookings.length === 0 ? (
              <div className="bg-white border border-zinc-200 rounded-2xl p-8 text-center text-zinc-400">
                <Loader2 className="h-5 w-5 animate-spin mx-auto text-zinc-900 mb-2" />
                <p className="text-xs">Scanning for requests...</p>
              </div>
            ) : availableRequests.length === 0 ? (
              <div className="bg-white border border-zinc-200 rounded-2xl p-10 text-center text-zinc-500 flex flex-col items-center gap-2 shadow-sm">
                <Car className="h-8 w-8 text-zinc-300 animate-pulse" />
                <p className="font-bold text-sm">No open requests</p>
                <p className="text-xs text-zinc-400 leading-relaxed max-w-[250px] mx-auto">
                  {isAvailable
                    ? "New rides will appear here automatically."
                    : "Go online to start receiving ride requests."}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {availableRequests.map((req: any) => renderTripCard(req, "dispatch"))}
              </div>
            )}
          </div>
        )}

        {/* Live dispatch */}
        <div>
          <h2 className="text-xs font-black text-zinc-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <RefreshCw className="h-3.5 w-3.5" /> Live Dispatch
          </h2>
          <div className="bg-white border border-zinc-200 rounded-xl p-4 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-zinc-900">
                {assignedRide ? "Trip in progress" : availableRequests.length > 0 ? `${availableRequests.length} request(s) waiting` : "Standing by"}
              </p>
              <p className="text-xs text-zinc-500 mt-0.5">
                Auto-refreshing every 4 seconds
              </p>
            </div>
            <button
              onClick={() => refetch()}
              className="flex items-center gap-1.5 text-xs font-bold bg-black text-white px-4 py-2.5 rounded-lg hover:bg-zinc-800 transition-colors"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Scan Now
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

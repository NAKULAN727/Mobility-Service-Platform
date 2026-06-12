"use client";

import React from "react";
import { useMutation } from "@apollo/client/react";
import { gql } from "@apollo/client";
import { useAuth } from "../providers";
import Link from "next/link";
import {
  Navigation, LogOut, User, Mail, Camera, Loader2,
  Save, Key, CheckCircle, AlertTriangle, UserCheck,
  Shield, Car, Clock, FileText, ShieldCheck, ArrowRight,
  CheckCircle2, XCircle, Upload, Users, Phone,
} from "lucide-react";

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
    onCompleted: (d) => { refreshUser(d.updateProfile); flash(setProfileMsg, { ok: true, text: "Profile updated." }); },
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
            <h1 className="text-xl font-black text-zinc-950">Welcome back, {user.fullName}!</h1>
            <p className="text-sm text-zinc-500 mt-0.5 flex items-center gap-1.5 justify-center sm:justify-start">
              <Mail className="h-3.5 w-3.5" /> {user.email}
            </p>
          </div>
          <div className="shrink-0">
            {user.isVerified ? (
              <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-full">
                <UserCheck className="h-3.5 w-3.5" /> Verified
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-xs font-bold text-amber-600 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-full">
                <AlertTriangle className="h-3.5 w-3.5" /> Unverified
              </span>
            )}
          </div>
        </div>

        {/* Quick actions */}
        <div>
          <h2 className="text-xs font-black text-zinc-500 uppercase tracking-wider mb-3">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { icon: <Car className="h-5 w-5" />, title: "Book a Ride", desc: "Request verified drivers instantly", href: "/" },
              { icon: <Clock className="h-5 w-5" />, title: "Hourly Driver", desc: "Hire a personal driver by the hour", href: "/" },
              { icon: <Shield className="h-5 w-5" />, title: "Safety Center", desc: "View trip safety features", href: "/" },
            ].map((a) => (
              <Link key={a.title} href={a.href} className="bg-white border border-zinc-200 rounded-lg p-5 shadow-sm hover:border-zinc-400 transition-colors group">
                <div className="h-9 w-9 rounded bg-zinc-100 flex items-center justify-center mb-3 group-hover:bg-black group-hover:text-white transition-colors text-zinc-600">
                  {a.icon}
                </div>
                <h3 className="font-extrabold text-zinc-900 text-sm">{a.title}</h3>
                <p className="text-xs text-zinc-500 mt-1">{a.desc}</p>
                <span className="flex items-center gap-1 text-xs font-bold text-black mt-3">
                  Get Started <ArrowRight className="h-3 w-3" />
                </span>
              </Link>
            ))}
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

// ── Driver Dashboard ──────────────────────────────────────────────────────────
function DriverDashboard({ user, logout, refreshUser }: any) {
  const profile = user.driverProfile;
  const docsUploaded = profile?.documents?.length ?? 0;

  const statusCfg = {
    APPROVED: { cls: "text-emerald-600 bg-emerald-50 border-emerald-200", icon: <CheckCircle2 className="h-3.5 w-3.5" /> },
    PENDING:  { cls: "text-amber-600 bg-amber-50 border-amber-200",   icon: <Clock className="h-3.5 w-3.5 animate-pulse" /> },
    REJECTED: { cls: "text-red-600 bg-red-50 border-red-200",         icon: <XCircle className="h-3.5 w-3.5" /> },
  }[profile?.verificationStatus ?? "PENDING"];

  const statusMsg = {
    APPROVED: "Your account is approved. You can accept rides.",
    PENDING:  "Admin is reviewing your uploaded credentials.",
    REJECTED: "Verification failed. Please re-upload valid documents.",
  }[profile?.verificationStatus ?? "PENDING"];

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
            <div key={s.label} className="bg-white border border-zinc-200 rounded-lg p-4 shadow-sm">
              <div className="h-8 w-8 rounded bg-zinc-100 flex items-center justify-center text-zinc-600 mb-2">{s.icon}</div>
              <p className="text-lg font-black text-zinc-900">{s.value}</p>
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Action cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link href="/driver/verification" className="bg-white border border-zinc-200 rounded-lg p-5 shadow-sm hover:border-zinc-400 transition-colors group flex items-center gap-4">
            <div className="h-10 w-10 rounded bg-zinc-100 flex items-center justify-center group-hover:bg-black group-hover:text-white transition-colors shrink-0 text-zinc-600">
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

          <div className="bg-white border border-zinc-200 rounded-lg p-5 shadow-sm flex items-center gap-4">
            <div className="h-10 w-10 rounded bg-zinc-100 flex items-center justify-center shrink-0 text-zinc-600">
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
              <div className="h-10 w-10 rounded bg-zinc-100 flex items-center justify-center group-hover:bg-black group-hover:text-white transition-colors shrink-0 text-zinc-600">
                <Users className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <h3 className="font-extrabold text-zinc-900 text-sm">Driver Verification Panel</h3>
                <p className="text-xs text-zinc-500 mt-0.5">Review, approve, or reject driver applications</p>
              </div>
              <ArrowRight className="h-4 w-4 text-zinc-400 shrink-0" />
            </Link>

            <div className="bg-white border border-zinc-200 rounded-lg p-5 shadow-sm flex items-center gap-4">
              <div className="h-10 w-10 rounded bg-zinc-100 flex items-center justify-center shrink-0 text-zinc-600">
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

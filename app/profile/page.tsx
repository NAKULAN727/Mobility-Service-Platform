"use client";

import React, { useState } from "react";
import { useMutation } from "@apollo/client/react";
import { gql } from "@apollo/client";
import { useAuth } from "../providers";
import { 
  User, Mail, Phone, Shield, UserCheck, AlertTriangle, 
  Camera, Loader2, Save, Key, LogOut, CheckCircle, Navigation 
} from "lucide-react";
import Link from "next/link";

const UPDATE_PROFILE = gql`
  mutation UpdateProfile($fullName: String, $phone: String, $profileImage: String) {
    updateProfile(fullName: $fullName, phone: $phone, profileImage: $profileImage) {
      id
      fullName
      phone
      profileImage
    }
  }
`;

const CHANGE_PASSWORD = gql`
  mutation ChangePassword($oldPassword: String!, $newPassword: String!) {
    changePassword(oldPassword: $oldPassword, newPassword: $newPassword)
  }
`;

export default function ProfilePage() {
  const { user, logout, refreshUser, loading: authLoading } = useAuth();
  
  // Profile edit state
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [uploading, setUploading] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState("");
  const [profileError, setProfileError] = useState("");

  // Password edit state
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [passwordError, setPasswordError] = useState("");

  // Apollo mutations
  const [updateProfileMutation, { loading: profileUpdating }] = useMutation(UPDATE_PROFILE, {
    onCompleted: async () => {
      await refreshUser();
      setProfileSuccess("Profile updated successfully.");
      setTimeout(() => setProfileSuccess(""), 4000);
    },
    onError: (error) => {
      setProfileError(error.message || "Failed to update profile.");
      setTimeout(() => setProfileError(""), 5000);
    },
  });

  const [changePasswordMutation, { loading: passwordUpdating }] = useMutation(CHANGE_PASSWORD, {
    onCompleted: () => {
      setPasswordSuccess("Password changed successfully.");
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setPasswordSuccess(""), 4000);
    },
    onError: (error) => {
      setPasswordError(error.message || "Failed to change password.");
      setTimeout(() => setPasswordError(""), 5000);
    },
  });

  // Load initial values from context user
  React.useEffect(() => {
    if (user) {
      setFullName(user.fullName);
      setPhone(user.phone);
    }
  }, [user]);

  if (authLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 text-zinc-900">
        <Loader2 className="h-6 w-6 animate-spin text-zinc-900" />
      </div>
    );
  }

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSuccess("");
    setProfileError("");

    if (!fullName || !phone) {
      setProfileError("Name and Phone fields are required.");
      return;
    }

    updateProfileMutation({
      variables: { fullName, phone },
    });
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordSuccess("");
    setPasswordError("");

    if (!oldPassword || !newPassword || !confirmPassword) {
      setPasswordError("All password fields are required.");
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError("New password must be at least 6 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match.");
      return;
    }

    changePasswordMutation({
      variables: { oldPassword, newPassword },
    });
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setProfileSuccess("");
    setProfileError("");
    setUploading(true);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "File upload failed.");
      }

      await updateProfileMutation({
        variables: { profileImage: data.url },
      });
    } catch (err: any) {
      setProfileError(err.message || "Avatar upload failed.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-800 flex flex-col font-sans">
      
      {/* Navigation Header */}
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
          <Link href="/profile" className="text-black border-b-2 border-black pb-1">
            Profile
          </Link>
          {user.role === "DRIVER" && (
            <Link href="/driver/verification" className="hover:text-black transition-colors">
              Driver Portal
            </Link>
          )}
          {user.role === "ADMIN" && (
            <Link href="/admin/drivers" className="hover:text-black transition-colors">
              Verification Desk
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-4">
          <span className="hidden sm:inline text-[10px] bg-zinc-100 border border-zinc-200 px-2.5 py-1.5 rounded font-bold uppercase tracking-wider text-zinc-650">
            {user.role}
          </span>
          <button
            onClick={logout}
            className="flex items-center gap-2 text-xs bg-white hover:bg-zinc-50 border border-zinc-200 text-zinc-700 hover:text-black font-bold px-4 py-2.5 rounded transition-all duration-200 shadow-sm"
          >
            <LogOut className="h-4 w-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </header>

      {/* Mobile nav */}
      <div className="md:hidden flex bg-white border-b border-zinc-200 px-6 py-2 justify-center gap-6 text-xs font-bold shadow-sm">
        <Link href="/profile" className="text-black">
          Profile
        </Link>
        {user.role === "DRIVER" && (
          <Link href="/driver/verification" className="text-zinc-500 hover:text-black">
            Driver Portal
          </Link>
        )}
        {user.role === "ADMIN" && (
          <Link href="/admin/drivers" className="text-zinc-500 hover:text-black">
            Verifications
          </Link>
        )}
      </div>

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-10 space-y-6">
        
        {/* Profile Card Banner */}
        <div className="bg-white border border-zinc-200 rounded-lg p-6 sm:p-8 flex flex-col sm:flex-row items-center gap-6 shadow-sm">
          <div className="relative group">
            <div className="h-24 w-24 rounded-full overflow-hidden border border-zinc-200 bg-zinc-50 flex items-center justify-center relative shadow-sm">
              {user.profileImage ? (
                <img
                  src={user.profileImage}
                  alt={user.fullName}
                  className="h-full w-full object-cover"
                />
              ) : (
                <User className="h-10 w-10 text-zinc-400" />
              )}
              {uploading && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <Loader2 className="h-5 w-5 animate-spin text-white" />
                </div>
              )}
            </div>
            <label className="absolute bottom-0 right-0 h-7 w-7 rounded-full bg-black hover:bg-zinc-800 text-white flex items-center justify-center cursor-pointer shadow border border-white">
              <Camera className="h-3.5 w-3.5" />
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                disabled={uploading}
                className="hidden"
              />
            </label>
          </div>

          <div className="flex-1 text-center sm:text-left space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 justify-center sm:justify-start">
              <h1 className="text-xl font-extrabold text-zinc-950">{user.fullName}</h1>
              <span className="inline-flex max-w-fit items-center justify-center rounded bg-blue-50 border border-blue-200 px-2 py-0.5 text-[10px] font-bold text-blue-650 uppercase tracking-wider">
                {user.role}
              </span>
              {user.isVerified ? (
                <span className="inline-flex max-w-fit items-center gap-1 rounded bg-emerald-50 border border-emerald-250 px-2 py-0.5 text-[10px] font-bold text-emerald-600 uppercase tracking-wider">
                  <UserCheck className="h-3 w-3" />
                  Verified
                </span>
              ) : (
                <span className="inline-flex max-w-fit items-center gap-1 rounded bg-amber-50 border border-amber-250 px-2 py-0.5 text-[10px] font-bold text-amber-600 uppercase tracking-wider">
                  <AlertTriangle className="h-3 w-3" />
                  Pending
                </span>
              )}
            </div>
            <p className="text-zinc-650 text-xs sm:text-sm flex items-center justify-center sm:justify-start gap-1.5 font-bold">
              <Mail className="h-4 w-4 text-zinc-400" />
              {user.email}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Edit Profile Form */}
          <div className="bg-white border border-zinc-200 rounded-lg p-6 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 border-b border-zinc-100 pb-3 mb-5">
                <Shield className="h-5 w-5 text-zinc-800" />
                <h2 className="text-base font-extrabold text-zinc-950">Profile Details</h2>
              </div>

              <form onSubmit={handleProfileSubmit} className="space-y-4">
                {profileSuccess && (
                  <div className="flex items-center gap-2 rounded bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-600 font-semibold shadow-sm">
                    <CheckCircle className="h-4.5 w-4.5 shrink-0" />
                    <span>{profileSuccess}</span>
                  </div>
                )}
                {profileError && (
                  <div className="flex items-center gap-2 rounded bg-red-50 border border-red-200 p-3 text-xs text-red-600 font-semibold shadow-sm">
                    <AlertTriangle className="h-4.5 w-4.5 shrink-0" />
                    <span>{profileError}</span>
                  </div>
                )}

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
                    />
                  </div>
                </div>

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
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={profileUpdating}
                  className="w-full flex items-center justify-center gap-1.5 bg-black hover:bg-zinc-900 text-white font-bold py-2.5 px-4 rounded text-xs transition-colors disabled:opacity-50 active:scale-[0.99] mt-2"
                >
                  {profileUpdating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  <span>Save Changes</span>
                </button>
              </form>
            </div>
          </div>

          {/* Change Password Form */}
          <div className="bg-white border border-zinc-200 rounded-lg p-6 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 border-b border-zinc-100 pb-3 mb-5">
                <Key className="h-5 w-5 text-zinc-800" />
                <h2 className="text-base font-extrabold text-zinc-950">Security & Password</h2>
              </div>

              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                {passwordSuccess && (
                  <div className="flex items-center gap-2 rounded bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-600 font-semibold shadow-sm">
                    <CheckCircle className="h-4.5 w-4.5 shrink-0" />
                    <span>{passwordSuccess}</span>
                  </div>
                )}
                {passwordError && (
                  <div className="flex items-center gap-2 rounded bg-red-50 border border-red-200 p-3 text-xs text-red-650 font-semibold shadow-sm">
                    <AlertTriangle className="h-4.5 w-4.5 shrink-0" />
                    <span>{passwordError}</span>
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-550 uppercase tracking-wider block">
                    Current Password
                  </label>
                  <input
                    type="password"
                    required
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    className="block w-full rounded border border-zinc-205 bg-zinc-50 py-2.5 px-3 text-zinc-800 placeholder-zinc-400 outline-none transition-colors focus:border-black focus:bg-white text-sm"
                    placeholder="••••••••"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-550 uppercase tracking-wider block">
                    New Password
                  </label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="block w-full rounded border border-zinc-205 bg-zinc-50 py-2.5 px-3 text-zinc-800 placeholder-zinc-400 outline-none transition-colors focus:border-black focus:bg-white text-sm"
                    placeholder="Min 6 characters"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-550 uppercase tracking-wider block">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="block w-full rounded border border-zinc-205 bg-zinc-50 py-2.5 px-3 text-zinc-800 placeholder-zinc-400 outline-none transition-colors focus:border-black focus:bg-white text-sm"
                    placeholder="••••••••"
                  />
                </div>

                <button
                  type="submit"
                  disabled={passwordUpdating}
                  className="w-full flex items-center justify-center gap-1.5 bg-black hover:bg-zinc-900 text-white font-bold py-2.5 px-4 rounded text-xs transition-colors disabled:opacity-50 active:scale-[0.99] mt-2"
                >
                  {passwordUpdating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Key className="h-4 w-4" />
                  )}
                  <span>Change Password</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

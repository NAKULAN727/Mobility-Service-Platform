"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "@apollo/client/react";
import { gql } from "@apollo/client";
import { useAuth } from "../../providers";
import DriverNavbar from "../../../components/driver/DriverNavbar";
import Link from "next/link";
import {
  User, Mail, Phone, Shield, UserCheck, AlertTriangle,
  Camera, Loader2, Save, Key, CheckCircle, Clock, XCircle,
  FileText, Upload, Check, ArrowRight, Car, FileCheck,
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

const UPLOAD_DOCUMENT = gql`
  mutation UploadDriverDocument($documentType: DocumentType!, $documentUrl: String!) {
    uploadDriverDocument(documentType: $documentType, documentUrl: $documentUrl) {
      id documentType documentUrl uploadedAt
    }
  }
`;

const GET_VEHICLE = gql`
  query GetVehicleById($id: ID!) {
    getVehicleById(id: $id) {
      id registrationNumber make model vehicleType seatingCapacity
      insurance verificationStatus availabilityStatus
    }
  }
`;

type DocumentType = "DRIVING_LICENSE" | "AADHAAR" | "PAN_CARD" | "VEHICLE_CERTIFICATE";

interface DocConfig {
  type: DocumentType;
  title: string;
  description: string;
  vehicleOnly?: boolean;
}

const DRIVER_DOCUMENTS: DocConfig[] = [
  {
    type: "DRIVING_LICENSE",
    title: "Driving License",
    description: "Upload your valid national commercial or private driving license.",
  },
  {
    type: "AADHAAR",
    title: "Aadhaar Card",
    description: "Upload front and back side photo or copy of your Aadhaar.",
  },
  {
    type: "PAN_CARD",
    title: "PAN Card",
    description: "Upload copy of your Permanent Account Number card.",
  },
];

const VEHICLE_DOCUMENTS: DocConfig[] = [
  {
    type: "VEHICLE_CERTIFICATE",
    title: "Registration Certificate (RC)",
    description: "Upload registration certificate copy of your primary vehicle.",
    vehicleOnly: true,
  },
];

export default function DriverProfilePage() {
  const router = useRouter();
  const { user, logout, refreshUser, loading: authLoading } = useAuth();

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [uploading, setUploading] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwMsg, setPwMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [activeUploadType, setActiveUploadType] = useState<DocumentType | null>(null);
  const [docSuccess, setDocSuccess] = useState("");
  const [docError, setDocError] = useState("");

  useEffect(() => {
    if (!authLoading && (!user || user.role !== "DRIVER")) {
      router.push(user ? "/" : "/login");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      setFullName(user.fullName);
      setPhone(user.phone);
    }
  }, [user]);

  const profile = user?.driverProfile;
  const ownsVehicle = profile?.ownsVehicle ?? false;
  const vehicleId = profile?.vehicleId;

  const { data: vehicleData, loading: loadingVehicle } = useQuery(GET_VEHICLE, {
    variables: { id: vehicleId },
    skip: !ownsVehicle || !vehicleId,
  });

  const vehicle = (vehicleData as any)?.getVehicleById;

  const flash = (set: (v: any) => void, v: any) => {
    set(v);
    setTimeout(() => set(null), 4000);
  };

  const [updateProfile, { loading: saving }] = useMutation(UPDATE_PROFILE, {
    onCompleted: (d: any) => {
      refreshUser(d.updateProfile);
      flash(setProfileMsg, { ok: true, text: "Profile updated." });
    },
    onError: (e) => flash(setProfileMsg, { ok: false, text: e.message }),
  });

  const [changePassword, { loading: pwSaving }] = useMutation(CHANGE_PASSWORD, {
    onCompleted: () => {
      flash(setPwMsg, { ok: true, text: "Password changed." });
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    },
    onError: (e) => flash(setPwMsg, { ok: false, text: e.message }),
  });

  const [uploadDocMutation] = useMutation(UPLOAD_DOCUMENT, {
    onCompleted: async (data: any) => {
      const doc = data?.uploadDriverDocument;
      if (user && profile && doc) {
        const existingDocs = profile.documents || [];
        const nextDocs = existingDocs
          .filter((d) => d.documentType !== doc.documentType)
          .concat(doc);
        refreshUser({
          driverProfile: { ...profile, documents: nextDocs },
        });
      }
      setDocSuccess("Document uploaded successfully.");
      setTimeout(() => setDocSuccess(""), 4000);
    },
    onError: (error) => {
      setDocError(error.message || "Failed to save document.");
      setTimeout(() => setDocError(""), 5000);
    },
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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, documentType: DocumentType) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setActiveUploadType(documentType);
    setDocSuccess("");
    setDocError("");
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "File upload failed.");
      await uploadDocMutation({ variables: { documentType, documentUrl: data.url } });
    } catch (err: any) {
      setDocError(err.message || "Failed to upload document.");
    } finally {
      setActiveUploadType(null);
    }
  };

  const getDocStatus = (type: DocumentType) =>
    profile?.documents?.find((d) => d.documentType === type) ?? null;

  const inputCls =
    "block w-full rounded border border-zinc-200 bg-zinc-50 py-2.5 px-3 text-sm text-zinc-800 outline-none focus:border-black focus:bg-white transition-colors";
  const labelCls = "text-[10px] font-bold text-zinc-500 uppercase tracking-wider block mb-1.5";

  const Msg = ({ msg }: { msg: { ok: boolean; text: string } | null }) =>
    msg ? (
      <div
        className={`flex items-center gap-2 rounded p-3 text-xs font-semibold mb-3 ${
          msg.ok
            ? "bg-emerald-50 border border-emerald-200 text-emerald-700"
            : "bg-red-50 border border-red-200 text-red-700"
        }`}
      >
        {msg.ok ? (
          <CheckCircle className="h-4 w-4 shrink-0" />
        ) : (
          <AlertTriangle className="h-4 w-4 shrink-0" />
        )}
        {msg.text}
      </div>
    ) : null;

  const renderDocCard = (doc: DocConfig) => {
    const uploadedDoc = getDocStatus(doc.type);
    const isUploading = activeUploadType === doc.type;

    return (
      <div
        key={doc.type}
        className={`bg-white border rounded-lg p-5 shadow-sm flex flex-col justify-between ${
          uploadedDoc ? "border-emerald-200" : "border-zinc-200"
        }`}
      >
        <div className="space-y-2 mb-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-zinc-900 text-sm">{doc.title}</h3>
            {uploadedDoc ? (
              <span className="flex items-center gap-0.5 text-[9px] text-emerald-700 font-bold bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                <Check className="h-3 w-3" />
                Uploaded
              </span>
            ) : (
              <span className="text-[9px] text-zinc-500 font-bold bg-zinc-50 border border-zinc-200 px-2 py-0.5 rounded uppercase tracking-wider">
                Required
              </span>
            )}
          </div>
          <p className="text-zinc-600 text-xs leading-relaxed">{doc.description}</p>
        </div>
        <div className="flex items-center gap-4">
          {uploadedDoc && (
            <a
              href={uploadedDoc.documentUrl}
              target="_blank"
              rel="noreferrer"
              className="text-xs font-bold text-blue-600 hover:text-blue-500 flex items-center gap-1"
            >
              View File
              <ArrowRight className="h-3.5 w-3.5" />
            </a>
          )}
          <label className="ml-auto flex items-center gap-1.5 cursor-pointer bg-white hover:bg-zinc-50 border border-zinc-200 text-zinc-700 text-xs font-bold px-3 py-2 rounded shadow-sm transition-colors">
            {isUploading ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="h-3.5 w-3.5" />
                {uploadedDoc ? "Replace" : "Upload File"}
              </>
            )}
            <input
              type="file"
              accept="image/*,application/pdf"
              onChange={(e) => handleFileUpload(e, doc.type)}
              disabled={isUploading || profile?.verificationStatus === "APPROVED"}
              className="hidden"
            />
          </label>
        </div>
      </div>
    );
  };

  if (authLoading || !user || user.role !== "DRIVER") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50">
        <Loader2 className="h-6 w-6 animate-spin text-zinc-900" />
      </div>
    );
  }

  const requiredDocs = ownsVehicle
    ? [...DRIVER_DOCUMENTS, ...VEHICLE_DOCUMENTS]
    : DRIVER_DOCUMENTS;
  const docsUploaded = profile?.documents?.filter((d) =>
    requiredDocs.some((r) => r.type === d.documentType)
  ).length ?? 0;

  const verificationStatus = profile?.verificationStatus ?? "PENDING";
  const statusConfig = {
    APPROVED: {
      cls: "bg-emerald-50 border-emerald-200 text-emerald-700",
      icon: <CheckCircle className="h-5 w-5" />,
      title: "Account Approved",
      desc: "You are verified and can accept ride requests.",
    },
    PENDING: {
      cls: "bg-amber-50 border-amber-200 text-amber-700",
      icon: <Clock className="h-5 w-5 animate-pulse" />,
      title: "Pending Verification",
      desc: "Admin is reviewing your uploaded credentials.",
    },
    REJECTED: {
      cls: "bg-red-50 border-red-200 text-red-700",
      icon: <XCircle className="h-5 w-5" />,
      title: "Verification Rejected",
      desc: "Please re-upload valid documents below.",
    },
  }[verificationStatus];

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col">
      <DriverNavbar logout={logout} />
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-10 space-y-8">

        {/* Personal information */}
        <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row items-center gap-5">
          <div className="relative shrink-0">
            <div className="h-20 w-20 rounded-full overflow-hidden border border-zinc-200 bg-zinc-50 flex items-center justify-center">
              {user.profileImage ? (
                <img src={user.profileImage} alt="" className="h-full w-full object-cover" />
              ) : (
                <User className="h-8 w-8 text-zinc-400" />
              )}
              {uploading && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center rounded-full">
                  <Loader2 className="h-4 w-4 animate-spin text-white" />
                </div>
              )}
            </div>
            <label className="absolute bottom-0 right-0 h-6 w-6 rounded-full bg-black text-white flex items-center justify-center cursor-pointer border border-white shadow">
              <Camera className="h-3 w-3" />
              <input type="file" accept="image/*" onChange={handleAvatarUpload} disabled={uploading} className="hidden" />
            </label>
          </div>
          <div className="text-center sm:text-left flex-1">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 justify-center sm:justify-start">
              <h1 className="text-xl font-black text-zinc-950">{user.fullName}</h1>
              {user.isVerified ? (
                <span className="inline-flex items-center gap-1 rounded bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold text-emerald-600 uppercase">
                  <UserCheck className="h-3 w-3" />
                  Verified
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded bg-amber-50 border border-amber-200 px-2 py-0.5 text-[10px] font-bold text-amber-600 uppercase">
                  <AlertTriangle className="h-3 w-3" />
                  Pending
                </span>
              )}
            </div>
            <p className="text-sm text-zinc-500 mt-1 flex items-center gap-1.5 justify-center sm:justify-start">
              <Mail className="h-3.5 w-3.5" /> {user.email}
            </p>
            <p className="text-xs text-zinc-400 mt-1 flex items-center gap-1.5 justify-center sm:justify-start">
              <Phone className="h-3.5 w-3.5" /> {user.phone}
            </p>
            {profile && (
              <p className="text-xs text-zinc-400 mt-1">
                License: <span className="font-bold text-zinc-700">{profile.licenseNumber}</span>
                {" · "}{profile.experienceYears} yrs experience
              </p>
            )}
          </div>
        </div>

        {/* Verification status */}
        <div className={`border rounded-xl p-5 flex items-start gap-4 ${statusConfig.cls}`}>
          <div className="shrink-0 mt-0.5">{statusConfig.icon}</div>
          <div className="flex-1">
            <h2 className="text-sm font-extrabold">{statusConfig.title}</h2>
            <p className="text-xs mt-0.5 opacity-90">{statusConfig.desc}</p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-[10px] font-bold uppercase tracking-wider opacity-70">Documents</p>
            <p className="text-sm font-black">{docsUploaded} / {requiredDocs.length}</p>
          </div>
        </div>

        {/* Edit profile & change password */}
        <div>
          <h2 className="text-xs font-black text-zinc-500 uppercase tracking-wider mb-3">Account Settings</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white border border-zinc-200 rounded-lg p-6 shadow-sm">
              <div className="flex items-center gap-2 border-b border-zinc-100 pb-3 mb-5">
                <Shield className="h-4 w-4 text-zinc-700" />
                <h2 className="text-sm font-extrabold text-zinc-950">Edit Profile</h2>
              </div>
              <Msg msg={profileMsg} />
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  updateProfile({ variables: { fullName, phone } });
                }}
                className="space-y-4"
              >
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

            <div className="bg-white border border-zinc-200 rounded-lg p-6 shadow-sm">
              <div className="flex items-center gap-2 border-b border-zinc-100 pb-3 mb-5">
                <Key className="h-4 w-4 text-zinc-700" />
                <h2 className="text-sm font-extrabold text-zinc-950">Change Password</h2>
              </div>
              <Msg msg={pwMsg} />
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (newPassword.length < 6) { flash(setPwMsg, { ok: false, text: "Min 6 characters." }); return; }
                  if (newPassword !== confirmPassword) { flash(setPwMsg, { ok: false, text: "Passwords don't match." }); return; }
                  changePassword({ variables: { oldPassword, newPassword } });
                }}
                className="space-y-4"
              >
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
        </div>

        {/* Driver documents */}
        <div>
          <div className="flex items-center justify-between border-b border-zinc-200 pb-3 mb-4">
            <h2 className="text-xs font-black text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
              <FileText className="h-4 w-4" /> Driver Documents
            </h2>
            <span className="text-xs font-bold text-zinc-500 bg-white border border-zinc-200 px-3 py-1 rounded">
              {profile?.documents?.filter((d) => DRIVER_DOCUMENTS.some((r) => r.type === d.documentType)).length ?? 0} / {DRIVER_DOCUMENTS.length}
            </span>
          </div>
          {docSuccess && (
            <div className="flex items-center gap-2 rounded bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-700 font-semibold mb-4">
              <CheckCircle className="h-4 w-4 shrink-0" />
              {docSuccess}
            </div>
          )}
          {docError && (
            <div className="flex items-center gap-2 rounded bg-red-50 border border-red-200 p-3 text-xs text-red-700 font-semibold mb-4">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              {docError}
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {DRIVER_DOCUMENTS.map(renderDocCard)}
          </div>
        </div>

        {/* Vehicle section — only when driver owns a vehicle */}
        {ownsVehicle && (
          <>
            <div>
              <div className="flex items-center justify-between border-b border-zinc-200 pb-3 mb-4">
                <h2 className="text-xs font-black text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Car className="h-4 w-4" /> Vehicle Documents
                </h2>
                <span className="text-xs font-bold text-zinc-500 bg-white border border-zinc-200 px-3 py-1 rounded">
                  {getDocStatus("VEHICLE_CERTIFICATE") ? "1 / 1" : "0 / 1"}
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {VEHICLE_DOCUMENTS.map(renderDocCard)}
              </div>
            </div>

            <div>
              <h2 className="text-xs font-black text-zinc-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <FileCheck className="h-4 w-4" /> Vehicle Details
              </h2>
              {loadingVehicle ? (
                <div className="bg-white border border-zinc-200 rounded-lg p-8 text-center">
                  <Loader2 className="h-5 w-5 animate-spin mx-auto text-zinc-900" />
                </div>
              ) : vehicle ? (
                <div className="bg-white border border-zinc-200 rounded-lg p-6 shadow-sm grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {[
                    { label: "Registration", value: vehicle.registrationNumber },
                    { label: "Make & Model", value: `${vehicle.make} ${vehicle.model}` },
                    { label: "Type", value: vehicle.vehicleType },
                    { label: "Seating", value: `${vehicle.seatingCapacity} seats` },
                    { label: "Insurance", value: vehicle.insurance || "Not provided" },
                    { label: "Status", value: vehicle.verificationStatus },
                  ].map(({ label, value }) => (
                    <div key={label}>
                      <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">{label}</p>
                      <p className="text-sm font-bold text-zinc-900 mt-0.5">{value}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white border border-zinc-200 rounded-lg p-6 text-sm text-zinc-500">
                  No vehicle linked to your profile yet.
                </div>
              )}
            </div>
          </>
        )}

        <p className="text-center text-xs text-zinc-400 pb-4">
          Need to go online?{" "}
          <Link href="/driver/dashboard" className="font-bold text-zinc-700 hover:text-black underline">
            Return to Dashboard
          </Link>
        </p>
      </main>
    </div>
  );
}

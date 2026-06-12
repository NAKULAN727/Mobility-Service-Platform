"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@apollo/client/react";
import { gql } from "@apollo/client";
import { useAuth } from "../../providers";
import { 
  FileText, CheckCircle, Clock, XCircle, AlertTriangle, 
  Upload, Loader2, Navigation, LogOut, Check, ArrowRight
} from "lucide-react";
import Link from "next/link";

const UPLOAD_DOCUMENT = gql`
  mutation UploadDriverDocument($documentType: DocumentType!, $documentUrl: String!) {
    uploadDriverDocument(documentType: $documentType, documentUrl: $documentUrl) {
      id
      documentType
      documentUrl
      uploadedAt
    }
  }
`;

type DocumentType = "DRIVING_LICENSE" | "AADHAAR" | "PAN_CARD" | "VEHICLE_CERTIFICATE";

interface DocConfig {
  type: DocumentType;
  title: string;
  description: string;
}

const DOCUMENTS_TO_UPLOAD: DocConfig[] = [
  {
    type: "DRIVING_LICENSE",
    title: "Driving License",
    description: "Upload your valid national commercial/private driving license.",
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
  {
    type: "VEHICLE_CERTIFICATE",
    title: "Vehicle Registration Certificate (RC)",
    description: "Upload registration certificate copy of your primary vehicle.",
  },
];

export default function DriverVerificationPage() {
  const router = useRouter();
  const { user, logout, refreshUser, loading: authLoading } = useAuth();
  
  useEffect(() => {
    if (!authLoading && (!user || user.role !== "DRIVER")) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  const [activeUploadType, setActiveUploadType] = useState<DocumentType | null>(null);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const [uploadDocMutation] = useMutation(UPLOAD_DOCUMENT, {
    onCompleted: async (data: any) => {
      const doc = data?.uploadDriverDocument;
      if (user && user.driverProfile && doc) {
        const existingDocs = user.driverProfile.documents || [];
        const nextDocs = existingDocs.filter((d: any) => d.documentType !== doc.documentType).concat(doc);
        refreshUser({
          driverProfile: {
            ...user.driverProfile,
            documents: nextDocs,
          },
        });
      }
      setSuccessMsg("Document uploaded and saved successfully.");
      setTimeout(() => setSuccessMsg(""), 4000);
    },
    onError: (error) => {
      setErrorMsg(error.message || "Failed to save document.");
      setTimeout(() => setErrorMsg(""), 5000);
    },
  });

  if (authLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 text-zinc-900">
        <Loader2 className="h-6 w-6 animate-spin text-zinc-900" />
      </div>
    );
  }

  const profile = user.driverProfile;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, documentType: DocumentType) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setActiveUploadType(documentType);
    setSuccessMsg("");
    setErrorMsg("");

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

      await uploadDocMutation({
        variables: {
          documentType,
          documentUrl: data.url,
        },
      });
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to upload document.");
    } finally {
      setActiveUploadType(null);
    }
  };

  const getDocStatus = (type: DocumentType) => {
    if (!profile?.documents) return null;
    return profile.documents.find((d) => d.documentType === type);
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
          <Link href="/profile" className="hover:text-black transition-colors">
            Profile
          </Link>
          <Link href="/driver/verification" className="text-black border-b-2 border-black pb-1">
            Driver Portal
          </Link>
        </nav>

        <div className="flex items-center gap-4">
          <span className="hidden sm:inline text-[10px] bg-blue-50 border border-blue-200 px-2.5 py-1.5 rounded font-bold uppercase tracking-wider text-blue-650 shadow-sm">
            Driver Partner
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
        <Link href="/profile" className="text-zinc-500 hover:text-black">
          Profile
        </Link>
        <Link href="/driver/verification" className="text-black">
          Driver Portal
        </Link>
      </div>

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-10 space-y-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-black text-zinc-950">Driver Verification Desk</h1>
          <p className="text-zinc-600 text-sm">
            Upload your credentials to get approved as a DriveMate Driver Partner.
          </p>
        </div>

        {/* Verification Status Card */}
        <div className="bg-white border border-zinc-200 rounded-lg p-6 sm:p-8 shadow-sm">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4 text-center sm:text-left flex-col sm:flex-row">
              {profile?.verificationStatus === "APPROVED" && (
                <>
                  <div className="h-12 w-12 rounded bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center shadow-sm">
                    <CheckCircle className="h-5 w-5" />
                  </div>
                  <div className="space-y-1">
                    <h2 className="text-base font-extrabold text-zinc-950">Your Partner Account is Approved</h2>
                    <p className="text-zinc-600 text-xs sm:text-sm">
                      Congratulations! You can now accept passenger bookings and drive with DriveMate.
                    </p>
                  </div>
                </>
              )}

              {profile?.verificationStatus === "PENDING" && (
                <>
                  <div className="h-12 w-12 rounded bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center shadow-sm">
                    <Clock className="h-5 w-5 animate-pulse" />
                  </div>
                  <div className="space-y-1">
                    <h2 className="text-base font-extrabold text-zinc-950">Pending Admin Verification</h2>
                    <p className="text-zinc-600 text-xs sm:text-sm">
                      We have received your files. An admin is verifying your credentials.
                    </p>
                  </div>
                </>
              )}

              {profile?.verificationStatus === "REJECTED" && (
                <>
                  <div className="h-12 w-12 rounded bg-red-50 border border-red-200 text-red-600 flex items-center justify-center shadow-sm">
                    <XCircle className="h-5 w-5" />
                  </div>
                  <div className="space-y-1">
                    <h2 className="text-base font-extrabold text-zinc-950">Verification Rejected</h2>
                    <p className="text-zinc-600 text-xs sm:text-sm">
                      Credentials check failed. Please re-upload your valid files below.
                    </p>
                  </div>
                </>
              )}
            </div>

            <div className="bg-zinc-50 px-4 py-2.5 rounded border border-zinc-200 text-center font-bold text-[10px] uppercase tracking-wider shadow-sm">
              <span className="text-zinc-500 block mb-0.5">Verification</span>
              <span className={`text-xs ${
                profile?.verificationStatus === "APPROVED" ? "text-emerald-650" :
                profile?.verificationStatus === "REJECTED" ? "text-red-650" : "text-amber-600"
              }`}>
                {profile?.verificationStatus}
              </span>
            </div>
          </div>
        </div>

        {/* Upload Cards Grid */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-200 pb-3">
            <h2 className="text-sm font-bold text-zinc-950 flex items-center gap-1.5">
              <FileText className="h-4.5 w-4.5 text-zinc-700" />
              Identity & Vehicle Licensing Files
            </h2>
            <span className="text-xs font-bold text-zinc-550 bg-white border border-zinc-200 px-3 py-1 rounded shadow-sm">
              {profile?.documents?.length || 0} of {DOCUMENTS_TO_UPLOAD.length} Uploaded
            </span>
          </div>

          {successMsg && (
            <div className="flex items-center gap-2 rounded bg-emerald-50 border border-emerald-200 p-3.5 text-xs text-emerald-600 font-semibold shadow-sm">
              <CheckCircle className="h-4.5 w-4.5 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}
          {errorMsg && (
            <div className="flex items-center gap-2 rounded bg-red-50 border border-red-200 p-3.5 text-xs text-red-600 font-semibold shadow-sm">
              <AlertTriangle className="h-4.5 w-4.5 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {DOCUMENTS_TO_UPLOAD.map((doc) => {
              const uploadedDoc = getDocStatus(doc.type);
              const isUploading = activeUploadType === doc.type;

              return (
                <div 
                  key={doc.type}
                  className={`bg-white border rounded-lg p-6 shadow-sm flex flex-col justify-between hover:border-zinc-350 transition-colors ${
                    uploadedDoc ? "border-emerald-200" : "border-zinc-200"
                  }`}
                >
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-extrabold text-zinc-900 text-sm">{doc.title}</h3>
                      {uploadedDoc ? (
                        <span className="flex items-center gap-0.5 text-[9px] text-emerald-650 font-bold bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded shadow-sm">
                          <Check className="h-3 w-3" />
                          Uploaded
                        </span>
                      ) : (
                        <span className="text-[9px] text-zinc-500 font-bold bg-zinc-50 border border-zinc-200 px-2 py-0.5 rounded uppercase tracking-wider">
                          Required
                        </span>
                      )}
                    </div>
                    <p className="text-zinc-605 text-xs leading-relaxed font-semibold">
                      {doc.description}
                    </p>
                  </div>

                  <div className="flex items-center gap-4">
                    {uploadedDoc && (
                      <a 
                        href={uploadedDoc.documentUrl} 
                        target="_blank" 
                        rel="noreferrer"
                        className="text-xs font-bold text-blue-600 hover:text-blue-500 flex items-center gap-1 py-1"
                      >
                        View File
                        <ArrowRight className="h-3.5 w-3.5" />
                      </a>
                    )}
                    
                    <label className="ml-auto flex items-center gap-1.5 cursor-pointer bg-white hover:bg-zinc-50 border border-zinc-200 text-zinc-750 text-xs font-bold px-3 py-2 rounded shadow-sm transition-colors">
                      {isUploading ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="h-3.5 w-3.5" />
                          <span>{uploadedDoc ? "Replace" : "Upload File"}</span>
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
            })}
          </div>
        </div>
      </main>
    </div>
  );
}

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../providers";
import { Loader2 } from "lucide-react";

export default function DashboardRedirect() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) { router.replace("/login"); return; }
    router.replace(user.role === "DRIVER" ? "/driver/dashboard" : "/");
  }, [user, loading, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50">
      <Loader2 className="h-6 w-6 animate-spin text-zinc-900" />
    </div>
  );
}

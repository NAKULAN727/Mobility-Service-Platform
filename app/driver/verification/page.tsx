"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function DriverVerificationRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/driver/profile");
  }, [router]);

  return null;
}

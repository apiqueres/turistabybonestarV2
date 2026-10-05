"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function AdminHome() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/admin/solicitudes");
  }, [router]);
  return null;
}

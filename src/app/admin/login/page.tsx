import { Suspense } from "react";
import type { Metadata } from "next";
import { LoginForm } from "@/components/admin/LoginForm";

export const metadata: Metadata = { title: "Acceso administración", robots: { index: false, follow: false } };

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="login" />}>
      <LoginForm />
    </Suspense>
  );
}

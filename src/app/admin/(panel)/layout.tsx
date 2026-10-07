import type { Metadata } from "next";
import { AdminShell, DemoAdminShell } from "@/components/admin/AdminShell";
import { STATIC_DEMO } from "@/lib/config";
import { requireUser } from "@/lib/admin/session";

export const metadata: Metadata = { title: "Administración", robots: { index: false, follow: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  if (STATIC_DEMO) return <DemoAdminShell>{children}</DemoAdminShell>;
  const user = await requireUser();
  return <AdminShell userLabel={user.email || user.name}>{children}</AdminShell>;
}

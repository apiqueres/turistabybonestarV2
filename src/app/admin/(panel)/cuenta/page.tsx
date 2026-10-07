import { notFound } from "next/navigation";
import { PasswordForm } from "@/components/admin/PasswordForm";
import { STATIC_DEMO } from "@/lib/config";
import { requireUser } from "@/lib/admin/session";

export default async function AccountPage() {
  if (STATIC_DEMO) notFound();
  const user = await requireUser();
  return (
    <>
      <div className="admin-head">
        <div>
          <div className="kicker">Administración</div>
          <h1 className="t-h2 mt-2">Cuenta</h1>
        </div>
      </div>
      <PasswordForm email={user.email} />
    </>
  );
}

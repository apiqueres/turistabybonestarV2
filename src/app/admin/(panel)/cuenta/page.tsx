import { notFound } from "next/navigation";
import { MailSettingsForm } from "@/components/admin/MailSettingsForm";
import { PasswordForm } from "@/components/admin/PasswordForm";
import { STATIC_DEMO } from "@/lib/config";
import { requireUser } from "@/lib/admin/session";

type Search = Promise<{ "primer-acceso"?: string }>;

export default async function AccountPage({ searchParams }: { searchParams: Search }) {
  if (STATIC_DEMO) notFound();
  const user = await requireUser({ allowPending: true });
  const sp = await searchParams;
  return (
    <>
      <div className="admin-head">
        <div>
          <div className="kicker">Administración</div>
          <h1 className="t-h2 mt-2">Mi cuenta</h1>
        </div>
      </div>
      {(user.mustChangePassword || sp["primer-acceso"]) && (
        <div className="card card-pad mb-6">
          <span className="form-status">Antes de usar el panel, cambia la contraseña inicial por una tuya.</span>
        </div>
      )}
      <div className="flex flex-col gap-8">
        <PasswordForm email={user.email} />
        <section>
          <h2 className="t-h3 mb-4">Correo</h2>
          <MailSettingsForm />
        </section>
      </div>
    </>
  );
}

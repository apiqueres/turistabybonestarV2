import { notFound } from "next/navigation";
import { UsersAdmin, type UserRow } from "@/components/admin/UsersAdmin";
import { STATIC_DEMO } from "@/lib/config";
import { requireRole } from "@/lib/admin/session";
import { listUsers } from "@/lib/repo/users";

export default async function UsersPage() {
  if (STATIC_DEMO) notFound();
  const user = await requireRole("admin");
  const users: UserRow[] = await listUsers();
  return (
    <>
      <div className="admin-head">
        <div>
          <div className="kicker">Administración</div>
          <h1 className="t-h2 mt-2">Usuarios</h1>
        </div>
      </div>
      <UsersAdmin users={users} selfId={user.id} />
    </>
  );
}

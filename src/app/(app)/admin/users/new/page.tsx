import { requireAdminPage } from "@/lib/auth/dal";
import { listClasses } from "@/controllers/admin/org.controller";
import { UserForm } from "@/components/admin/UserForm";
import { createUserAction } from "../actions";
import Link from "next/link";

export default async function NewUserPage() {
  await requireAdminPage();

  const classes = await listClasses();
  const classOptions = classes.map((c: { id: string; name: string }) => ({
    id: c.id,
    name: c.name,
  }));

  return (
    <div className="space-y-6 p-6 max-w-2xl mx-auto">
      <div>
        <Link
          href="/admin/users"
          className="inline-flex items-center gap-1 text-xs font-semibold text-slate-400 hover:text-white transition-colors mb-3"
        >
          ← Back to users
        </Link>
        <h1 className="text-2xl font-bold text-white tracking-tight">
          Create User Account
        </h1>
      </div>

      <UserForm action={createUserAction} classOptions={classOptions} />
    </div>
  );
}

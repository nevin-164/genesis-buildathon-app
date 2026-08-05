import { requireAdminPage } from "@/lib/auth/dal";
import { getUser } from "@/controllers/admin/user.controller";
import { listClasses } from "@/controllers/admin/org.controller";
import { UserForm } from "@/components/admin/UserForm";
import { ConfirmButton } from "@/components/admin/ConfirmButton";
import {
  updateUserAction,
  setUserActiveAction,
  resetUserPasswordAction,
} from "../actions";
import Link from "next/link";

export default async function EditUserPage(props: PageProps<"/admin/users/[id]">) {
  await requireAdminPage();

  const { id } = await props.params;
  const user = await getUser(id);
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
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Edit User: {user.fullName}
          </h1>
          {!user.isActive && (
            <span className="px-3 py-1 text-xs font-semibold rounded-full bg-slate-800 text-slate-400 border border-slate-700">
              Account Inactive
            </span>
          )}
        </div>
      </div>

      {/* USER EDIT FORM (Role is fixed plain text) */}
      <UserForm
        isEdit
        initialData={user}
        action={updateUserAction}
        classOptions={classOptions}
      />

      {/* ACCOUNT SECTION (Deactivate / Reset Password) - NO DELETE BUTTON */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl space-y-6 shadow-sm">
        <h2 className="text-sm font-semibold text-white uppercase tracking-wider">
          Account Management
        </h2>

        {/* Deactivate / Activate Action */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-800">
          <div>
            <h3 className="text-sm font-medium text-slate-200">
              {user.isActive ? "Deactivate Account" : "Activate Account"}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {user.isActive
                ? "They will be signed out and will not be able to sign in."
                : "Restores user access to the system."}
            </p>
          </div>
          <ConfirmButton
            buttonText={user.isActive ? "Deactivate User" : "Activate User"}
            confirmTitle={user.isActive ? "Confirm Deactivation" : "Confirm Activation"}
            confirmMessage={
              user.isActive
                ? "They will be signed out and will not be able to sign in."
                : "Are you sure you want to reactivate this user account?"
            }
            variant={user.isActive ? "danger" : "warning"}
            onConfirmAction={async () => {
              "use server";
              await setUserActiveAction(user.id, !user.isActive);
            }}
          />
        </div>

        {/* Reset Password Form */}
        <div className="pt-4 border-t border-slate-800">
          <h3 className="text-sm font-medium text-slate-200 mb-2">Reset Password</h3>
          <p className="text-xs text-slate-400 mb-3">
            Setting a new password will automatically sign this user out everywhere.
          </p>
          <form action={resetUserPasswordAction} className="flex gap-3">
            <input type="hidden" name="userId" value={user.id} />
            <input
              type="password"
              name="newPassword"
              required
              minLength={8}
              placeholder="New password (min 8 chars)"
              className="flex-1 px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500"
            />
            <button
              type="submit"
              className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-medium text-sm rounded-lg transition-colors cursor-pointer"
            >
              Reset Password
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

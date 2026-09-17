import Link from "next/link";
import { notFound } from "next/navigation";

import { ActionForm } from "@/components/admin/ActionForm";
import { ConfirmButton } from "@/components/admin/ConfirmButton";
import { UserForm } from "@/components/admin/UserForm";
import { StaffContent, StaffPageHeader } from "@/components/staff/StaffShell";
import {
  badge,
  BTN_SECONDARY,
  CONTROL,
  DIVIDER,
  FAINT,
  INK,
  LINK,
  LINK_BACK,
  MUTED,
  PANEL_PADDED,
  SECTION_TITLE,
} from "@/components/staff/staff-ui";
import { listClasses } from "@/controllers/admin/org.controller";
import { getUser } from "@/controllers/admin/user.controller";
import { requireAdminPage } from "@/lib/auth/dal";
import { NotFoundError } from "@/lib/auth/errors";
import { cn } from "@/lib/cn";

import { resetUserPasswordAction, setUserActiveAction, updateUserAction } from "../actions";

export default async function EditUserPage(props: PageProps<"/admin/users/[id]">) {
  await requireAdminPage();

  const { id } = await props.params;

  // A bad id is a missing page, not a server fault. Bookmarks of the deleted
  // /admin/users/new land here as id="new".
  const loaded = await Promise.all([getUser(id), listClasses()]).catch((error) => {
    if (error instanceof NotFoundError) notFound();
    throw error;
  });
  const [user, classes] = loaded;

  const classOptions = classes.map((cls) => ({
    id: cls.id,
    // Disambiguates two classes with the same name in different batches.
    name: `${cls.departmentName} · ${cls.batchName} · ${cls.name}`,
  }));

  const advises = user.role === "faculty" ? user.advisedClassCount : 0;

  return (
    <StaffContent width="narrow">
      <StaffPageHeader
        eyebrow="Admin console · Users"
        title={user.fullName}
        subtitle={user.email}
        back={
          <Link href="/admin/users" className={LINK_BACK}>
            <span aria-hidden="true">&larr;</span> Back to users
          </Link>
        }
        actions={
          !user.isActive ? <span className={badge("rose")}>Account inactive</span> : null
        }
      />

      <UserForm
        user={{
          id: user.id,
          fullName: user.fullName,
          email: user.email,
          role: user.role,
          registerNumber: user.registerNumber,
          className: user.className,
        }}
        action={updateUserAction}
        classOptions={classOptions}
      />

      {user.role === "faculty" && (
        <section className={PANEL_PADDED}>
          <h2 className={SECTION_TITLE}>Advising</h2>
          <p className={cn("mt-2 text-sm leading-relaxed", MUTED)}>
            {advises === 0 ? (
              <>
                This faculty member advises no classes, so nothing routes to
                them yet. Give them one on{" "}
                <Link href="/admin/classes" className={LINK}>
                  Classes
                </Link>
                .
              </>
            ) : (
              <>
                Advises {advises} {advises === 1 ? "class" : "classes"}. Handing
                a class to someone else only redirects internships submitted
                from then on — anything already submitted stays in this
                advisor&apos;s queue and history.
              </>
            )}
          </p>
        </section>
      )}

      {/* Deactivate / reset password. There is deliberately no delete. */}
      <section className={cn(PANEL_PADDED, "space-y-5")}>
        <h2 className={SECTION_TITLE}>Account management</h2>

        <div className={cn("flex flex-wrap items-center justify-between gap-4 border-t pt-5", DIVIDER)}>
          <div className="min-w-0">
            <h3 className={cn("text-sm font-semibold", INK)}>
              {user.isActive ? "Deactivate account" : "Activate account"}
            </h3>
            <p className={cn("mt-0.5 text-xs", FAINT)}>
              {user.isActive
                ? "They will be signed out and will not be able to sign in."
                : "Restores their access to the system."}
            </p>
          </div>
          <ConfirmButton
            buttonText={user.isActive ? "Deactivate user" : "Activate user"}
            confirmTitle={user.isActive ? "Confirm deactivation" : "Confirm activation"}
            confirmMessage={
              user.isActive
                ? advises > 0
                  ? `They still advise ${advises} ${advises === 1 ? "class" : "classes"}. This will be refused until those are handed to another advisor.`
                  : "They will be signed out and will not be able to sign in."
                : "Are you sure you want to reactivate this account?"
            }
            variant={user.isActive ? "danger" : "warning"}
            onConfirmAction={async () => {
              "use server";
              return setUserActiveAction(user.id, !user.isActive);
            }}
          />
        </div>

        <div className={cn("border-t pt-5", DIVIDER)}>
          <h3 className={cn("text-sm font-semibold", INK)}>Reset password</h3>
          <p className={cn("mb-3 mt-0.5 text-xs", FAINT)}>
            For someone locked out. Setting a new password signs them out
            everywhere.
          </p>
          <ActionForm action={resetUserPasswordAction} className="flex flex-wrap gap-3">
            <input type="hidden" name="userId" value={user.id} />
            <input
              type="password"
              name="newPassword"
              required
              minLength={8}
              placeholder="New password (min 8 characters)"
              className={cn(CONTROL, "min-w-[240px] flex-1")}
            />
            <button type="submit" className={BTN_SECONDARY}>
              Reset password
            </button>
          </ActionForm>
        </div>
      </section>
    </StaffContent>
  );
}

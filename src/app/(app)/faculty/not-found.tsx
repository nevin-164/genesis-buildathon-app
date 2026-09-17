import Link from "next/link";

import { StaffContent } from "@/components/staff/StaffShell";
import {
  BTN_PRIMARY,
  MUTED,
  PAGE_TITLE,
  PANEL_PADDED,
} from "@/components/staff/staff-ui";
import { cn } from "@/lib/cn";

export default function FacultyNotFound() {
  return (
    <StaffContent width="narrow">
      <div className={cn(PANEL_PADDED, "py-10 text-center sm:py-12")}>
        <h2 className={PAGE_TITLE}>Record not found</h2>

        <p className={cn("mx-auto mt-3 max-w-md text-sm leading-relaxed", MUTED)}>
          This student, application, or experience record does not exist or is not
          assigned to your advising account.
        </p>

        <div className="mt-6">
          <Link href="/faculty" className={BTN_PRIMARY}>
            Return to dashboard <span aria-hidden="true">&rarr;</span>
          </Link>
        </div>
      </div>
    </StaffContent>
  );
}

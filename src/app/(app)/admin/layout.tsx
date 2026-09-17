import { StaffCanvas } from "@/components/staff/StaffShell";

/**
 * The admin console surface.
 *
 * This used to be a rounded slate panel floating inside a light shell, which is
 * why the console read as a widget pasted onto a page rather than a place you
 * were in. StaffCanvas paints the console background edge to edge beneath a
 * header drawn in the same ink, and supplies the type scale.
 *
 * The column width is set per screen by `StaffContent`, since a directory table
 * and a single-user form do not want the same one.
 *
 * No auth check here — a layout does not re-run on navigation, so a guard here
 * would protect nothing. Each page.tsx calls `requireAdminPage()` itself.
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <StaffCanvas>{children}</StaffCanvas>;
}

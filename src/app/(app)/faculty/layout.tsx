import { StaffCanvas } from "@/components/staff/StaffShell";

/**
 * The faculty console surface.
 *
 * These screens used to be written twice — a light set of classes and a `dark:`
 * set beside each one — which meant they followed the operating system's
 * preference while the admin console next door was unconditionally dark. Two
 * halves of the same staff area could not agree what colour they were. They are
 * committed to the dark console now, and the `dark:` variants are gone.
 *
 * Wraps error.tsx, loading.tsx and not-found.tsx as well as the pages, so a
 * failed load is drawn on the same canvas as a successful one.
 *
 * No auth check here — a layout does not re-run on navigation, so a guard here
 * would protect nothing. Each page.tsx calls `requireFacultyPage()` itself.
 */
export default function FacultyLayout({ children }: { children: React.ReactNode }) {
  return <StaffCanvas>{children}</StaffCanvas>;
}

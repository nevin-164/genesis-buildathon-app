/**
 * The admin console surface.
 *
 * Every admin screen is designed dark, while the signed-in shell around it is
 * light. This panel gives those screens the background they were drawn against
 * without touching `components/layout/**`, which package 1 owns.
 *
 * No auth check here — a layout does not re-run on navigation, so a guard here
 * would protect nothing. Each page.tsx calls `requireAdminPage()` itself.
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-slate-950 ring-1 ring-slate-800 overflow-hidden">
      {children}
    </div>
  );
}

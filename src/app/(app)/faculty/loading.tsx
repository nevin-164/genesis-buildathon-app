import { StaffContent } from "@/components/staff/StaffShell";

/**
 * Skeleton in the console's own greys. It used to be drawn in light slate, so
 * on a dark screen the page flashed pale and then went dark once it loaded.
 */
export default function FacultyLoading() {
  return (
    <StaffContent>
      <div className="animate-pulse space-y-6 motion-reduce:animate-none">
        {/* Header */}
        <div className="space-y-2.5">
          <div className="h-3 w-28 rounded bg-[#121e17]" />
          <div className="h-8 w-56 rounded-md bg-[#152219]" />
          <div className="h-4 w-80 max-w-full rounded bg-[#121e17]" />
        </div>

        {/* Tiles */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="h-36 rounded-xl border border-[#1b2a21] bg-[#0d1611]" />
          <div className="h-36 rounded-xl border border-[#1b2a21] bg-[#0d1611]" />
        </div>

        {/* Table */}
        <div className="h-64 rounded-xl border border-[#1b2a21] bg-[#0d1611]" />
      </div>
    </StaffContent>
  );
}

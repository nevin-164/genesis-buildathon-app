"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import {
  CONTROL_SM,
  EMPTY,
  FAINT,
  FOCUS,
  INK,
  LINK_ACTION,
  MONO,
  MOTION,
  MUTED,
  PANEL_FLUSH,
  PANEL_HEADER,
  SECTION_TITLE,
  TABLE,
  TABLE_HEAD,
  TABLE_WRAP,
  TBODY,
  TD,
  TH,
  TR,
  badge,
  type Tone,
} from "@/components/staff/staff-ui";
import { cn } from "@/lib/cn";
import type { AssignedStudent } from "@/types/contracts";

interface StudentTableProps {
  students: AssignedStudent[];
}

/**
 * Status as the console reads it: lime is waiting on the advisor, amber is
 * waiting on the student, mint is published, rose is terminal, neutral is
 * nothing to act on.
 */
const STATUS_BADGE: Record<string, { label: string; tone: Tone }> = {
  not_submitted: { label: "Not submitted", tone: "neutral" },
  draft: { label: "Draft", tone: "neutral" },
  submitted: { label: "Under review", tone: "lime" },
  changes_requested: { label: "Changes requested", tone: "amber" },
  verified: { label: "Published", tone: "mint" },
  rejected: { label: "Rejected", tone: "rose" },
};

function StatusBadge({ status }: { status?: string | null }) {
  const known = STATUS_BADGE[status ?? "not_submitted"];
  if (!known) return <span className={badge("neutral")}>{status}</span>;
  return <span className={badge(known.tone)}>{known.label}</span>;
}

const FILTER_TABS = [
  { id: "all", label: "All" },
  { id: "not_submitted", label: "Not submitted" },
  { id: "submitted", label: "Under review" },
  { id: "changes_requested", label: "Changes requested" },
  { id: "verified", label: "Verified" },
  { id: "rejected", label: "Rejected" },
];

export function StudentTable({ students }: StudentTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentFilter = searchParams.get("filter") || "all";
  const [searchTerm, setSearchTerm] = useState("");

  const handleFilterChange = (filter: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (filter === "all") {
      params.delete("filter");
    } else {
      params.set("filter", filter);
    }
    router.push(`/faculty/students${params.toString() ? `?${params.toString()}` : ""}`);
  };

  // Filter students array client-side
  const filteredStudents = students.filter((student) => {
    const matchesSearch =
      student.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.registerNumber.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    if (currentFilter === "all") return true;
    // "not submitted" is the absence of an internship, not a status value.
    if (currentFilter === "not_submitted") return !student.internshipStatus;
    return student.internshipStatus === currentFilter;
  });

  return (
    <section className={PANEL_FLUSH}>
      {/* Header controls */}
      <div className={PANEL_HEADER}>
        <h2 className={SECTION_TITLE}>My students ({students.length})</h2>

        <div className="w-full sm:w-72">
          <label htmlFor="student-search" className="sr-only">
            Search students by name or register number
          </label>
          <input
            id="student-search"
            type="search"
            placeholder="Search name or reg. no…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={CONTROL_SM}
          />
        </div>
      </div>

      {/* Filter tabs */}
      <div
        className={cn(
          "flex overflow-x-auto border-b border-[#1b2a21] px-2 sm:px-4",
          "[scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden",
        )}
      >
        {FILTER_TABS.map((tab) => {
          const isActive = currentFilter === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleFilterChange(tab.id)}
              aria-pressed={isActive}
              className={cn(
                "-mb-px shrink-0 cursor-pointer whitespace-nowrap border-b-2 px-3.5 py-3 text-xs font-bold",
                MOTION,
                FOCUS,
                isActive
                  ? "border-[#c8ef5a] text-[#c8ef5a]"
                  : "border-transparent text-[#71857a] hover:text-[#eaf2ec]",
              )}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content area */}
      {students.length === 0 ? (
        <div className="px-6 py-12 text-center">
          <p className={cn("text-sm font-semibold", INK)}>
            No students are assigned to you yet.
          </p>
          <p className={cn("mx-auto mt-1.5 max-w-md text-sm", FAINT)}>
            An administrator assigns students by making you the advisor of a class.
          </p>
        </div>
      ) : filteredStudents.length === 0 ? (
        <p className={EMPTY}>No students found matching your criteria.</p>
      ) : (
        <div className={TABLE_WRAP}>
          <table className={TABLE}>
            <thead className={TABLE_HEAD}>
              <tr>
                <th className={TH}>Name</th>
                <th className={TH}>Reg. no.</th>
                <th className={TH}>Class</th>
                <th className={TH}>Internship</th>
                <th className={cn(TH, "text-right")}>View</th>
              </tr>
            </thead>

            <tbody className={TBODY}>
              {filteredStudents.map((student) => (
                <tr key={student.id} className={TR}>
                  <td className="px-5 py-3.5 sm:px-6">
                    <span className={cn("font-semibold", INK)}>{student.fullName}</span>
                  </td>

                  <td className={cn(TD, MONO, FAINT, "whitespace-nowrap")}>
                    {student.registerNumber}
                  </td>

                  <td className={cn(TD, MUTED)}>{student.className}</td>

                  <td className={TD}>
                    <StatusBadge status={student.internshipStatus} />
                  </td>

                  <td className="whitespace-nowrap px-5 py-3.5 text-right sm:px-6">
                    <Link href={`/faculty/students/${student.id}`} className={LINK_ACTION}>
                      History <span aria-hidden="true">&rarr;</span>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

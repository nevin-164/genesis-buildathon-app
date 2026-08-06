"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import type { AssignedStudent } from "@/types/contracts";

interface StudentTableProps {
  students: AssignedStudent[];
}

export function StudentTable({ students }: StudentTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentFilter = searchParams.get("filter") || "all";
  const [searchTerm, setSearchTerm] = useState("");

  // Map status to visual badge styling
  const getStatusBadge = (status?: string | null) => {
    if (!status || status === "not_submitted") {
      return (
        <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-400">
          Not submitted
        </span>
      );
    }
    if (status === "submitted") {
      return (
        <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-950 dark:text-blue-300">
          Under review
        </span>
      );
    }
    if (status === "changes_requested") {
      return (
        <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-950 dark:text-amber-300">
          Changes requested
        </span>
      );
    }
    if (status === "verified") {
      return (
        <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
          Published
        </span>
      );
    }
    if (status === "draft") {
      return (
        <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-400">
          Draft
        </span>
      );
    }
    if (status === "rejected") {
      return (
        <span className="inline-flex items-center rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-medium text-rose-800 dark:bg-rose-950 dark:text-rose-300">
          Rejected
        </span>
      );
    }

    return (
      <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-400">
        {status}
      </span>
    );
  };

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

  const filterTabs = [
    { id: "all", label: "All" },
    { id: "not_submitted", label: "Not submitted" },
    { id: "submitted", label: "Under review" },
    { id: "changes_requested", label: "Changes requested" },
    { id: "verified", label: "Verified" },
    { id: "rejected", label: "Rejected" },
  ];

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
      {/* Header controls */}
      <div className="flex flex-col gap-4 border-b border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
            My Students ({students.length})
          </h2>
        </div>
        <div className="w-full sm:w-72">
          <input
            type="text"
            placeholder="Search name or reg. no..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3.5 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:bg-white focus:outline-hidden dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500"
          />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex overflow-x-auto border-b border-slate-200 px-4 dark:border-slate-800">
        {filterTabs.map((tab) => {
          const isActive = currentFilter === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleFilterChange(tab.id)}
              className={`whitespace-nowrap border-b-2 px-4 py-3 text-xs font-semibold transition-colors ${
                isActive
                  ? "border-blue-600 text-blue-600 dark:border-blue-500 dark:text-blue-400"
                  : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content area */}
      {students.length === 0 ? (
        <div className="p-12 text-center">
          <p className="text-base font-semibold text-slate-800 dark:text-slate-200">
            No students are assigned to you yet.
          </p>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            An administrator assigns students by making you the advisor of a class.
          </p>
        </div>
      ) : filteredStudents.length === 0 ? (
        <div className="p-8 text-center text-slate-500 dark:text-slate-400">
          No students found matching your criteria.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400">
              <tr>
                <th className="px-6 py-3">Name</th>
                <th className="px-6 py-3">Reg. No.</th>
                <th className="px-6 py-3">Class</th>
                <th className="px-6 py-3">Internship</th>
                <th className="px-6 py-3 text-right">View</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {filteredStudents.map((student) => (
                <tr
                  key={student.id}
                  className="transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/50"
                >
                  <td className="px-6 py-4 font-semibold text-slate-900 dark:text-slate-100">
                    {student.fullName}
                  </td>
                  <td className="px-6 py-4 font-mono text-xs text-slate-600 dark:text-slate-400">
                    {student.registerNumber}
                  </td>
                  <td className="px-6 py-4 text-slate-700 dark:text-slate-300">
                    {student.className}
                  </td>
                  <td className="px-6 py-4">
                    {getStatusBadge(student.internshipStatus)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link
                      href={`/faculty/students/${student.id}`}
                      className="inline-flex items-center text-xs font-semibold text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      View history &rarr;
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

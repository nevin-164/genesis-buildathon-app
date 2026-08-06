"use client";

import { useEffect } from "react";

interface FacultyErrorProps {
  error: Error & { digest?: string };
  retry: () => void;
}

export default function FacultyError({ error, retry }: FacultyErrorProps) {
  useEffect(() => {
    console.error("Faculty section runtime error:", error);
  }, [error]);

  return (
    <div className="mx-auto max-w-xl p-8 text-center my-12">
      <div className="rounded-2xl border border-rose-200 bg-rose-50/50 p-8 shadow-xs dark:border-rose-950 dark:bg-rose-950/20">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 text-rose-600 dark:bg-rose-900/50 dark:text-rose-400">
          <span className="text-xl font-bold">!</span>
        </div>
        <h2 className="mt-4 text-xl font-bold text-rose-900 dark:text-rose-200">
          Something went wrong
        </h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          {error.message || "An unexpected error occurred while loading faculty data."}
        </p>
        <div className="mt-6">
          <button
            onClick={() => retry()}
            className="inline-flex items-center rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white shadow-xs hover:bg-rose-700 dark:bg-rose-700 dark:hover:bg-rose-800"
          >
            Try again
          </button>
        </div>
      </div>
    </div>
  );
}

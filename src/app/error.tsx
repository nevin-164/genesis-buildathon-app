"use client";

import { Button } from "@/components/ui";

/** In Next 16 the prop is `retry`, not `reset`. */
export default function Error({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <div className="mx-auto max-w-md px-4 py-24 text-center">
      <h1 className="text-lg font-semibold">Something went wrong</h1>
      <p className="mt-2 text-sm text-zinc-600">
        {error.message || "An unexpected error occurred."}
      </p>
      <div className="mt-6">
        <Button onClick={() => retry()}>Try again</Button>
      </div>
    </div>
  );
}

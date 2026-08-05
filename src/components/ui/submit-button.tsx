"use client";

import { useFormStatus } from "react-dom";

import { Button } from "./index";

/**
 * A submit button that disables itself and shows a pending label while the
 * Server Action is running. Must be rendered INSIDE the <form>, because
 * useFormStatus reads the nearest form above it.
 */
export function SubmitButton({
  children,
  pendingLabel = "Saving…",
  variant = "primary",
  name,
  value,
}: {
  children: React.ReactNode;
  pendingLabel?: string;
  variant?: "primary" | "secondary" | "danger";
  name?: string;
  value?: string;
}) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" variant={variant} disabled={pending} name={name} value={value}>
      {pending ? pendingLabel : children}
    </Button>
  );
}

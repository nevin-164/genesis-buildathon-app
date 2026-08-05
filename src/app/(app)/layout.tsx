import { AppShell } from "@/components/layout/app-shell";

/**
 * Wraps every signed-in page. Draws the chrome only — no auth checks here.
 * See the note in AppShell for why.
 */
export default function AppLayout({ children }: LayoutProps<"/">) {
  return <AppShell>{children}</AppShell>;
}

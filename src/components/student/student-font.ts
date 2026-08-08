import { DM_Sans, Manrope } from "next/font/google";

/** Student body — metadata, forms, long content. Scoped to StudentPageShell only. */
export const studentBody = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
  variable: "--font-student-body",
});

/** Student display — page headings and emphasis. Scoped to StudentPageShell only. */
export const studentDisplay = Manrope({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  display: "swap",
  variable: "--font-student-display",
});

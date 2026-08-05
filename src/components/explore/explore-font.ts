import { Manrope, Sora } from "next/font/google";

/** Body font — scoped to the Explore page only. */
export const exploreFont = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

/** Display font for Explore headings only. */
export const exploreDisplay = Sora({
  subsets: ["latin"],
  weight: ["700"],
  display: "swap",
  variable: "--font-explore-display",
});

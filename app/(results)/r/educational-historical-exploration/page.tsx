import type { Metadata } from "next";
import { Fraunces, IBM_Plex_Mono } from "next/font/google";

import Inquiry from "./Inquiry";

/**
 * Fraunces for the inquiry (soft ink-traps, a paper face). IBM Plex Mono for
 * the register and the daily table, so dates and counts form a column.
 */
const serif = Fraunces({
  subsets: ["latin"],
  style: ["normal", "italic"],
  display: "swap",
  variable: "--font-serif",
});

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "Broad Street — the 1854 inquiry",
  description:
    "Conduct the Golden Square cholera investigation yourself. The deaths, the pumps, the workhouse, the brewery, and the widow in Hampstead are all here. You can be wrong.",
};

export default function Page() {
  return (
    <main className={`${serif.variable} ${mono.variable}`}>
      <Inquiry />
    </main>
  );
}

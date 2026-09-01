import type { Metadata } from "next";
import { IBM_Plex_Sans, Newsreader } from "next/font/google";

import Desk from "./Desk";

/**
 * Newsreader for the argument (a news face, meant to be held as a paragraph).
 * IBM Plex Sans for the mix and the hour stamps — institutional, tabular,
 * the register of a system operator's own publications.
 */

const serif = Newsreader({
  subsets: ["latin"],
  style: ["normal", "italic"],
  display: "swap",
  variable: "--font-serif",
});

const sans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Grid — keep the lights on",
  description:
    "Build a generation mix against a real Great Britain demand year and try to survive the hours when annual percentages stop meaning anything.",
};

export default function Page() {
  return (
    <main className={`${serif.variable} ${sans.variable}`}>
      <Desk />
    </main>
  );
}

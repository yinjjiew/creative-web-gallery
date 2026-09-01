import type { Metadata } from "next";
import { IBM_Plex_Sans, Petrona } from "next/font/google";

import Mount from "./Mount";

/**
 * Petrona is the kennel-card name — a warm book face that still reads at
 * arm's length on a cheap phone. IBM Plex Sans is the board: dates, holds,
 * and the one sentence a volunteer has to act on. Tabular figures, no
 * decoration. This is a fluorescent room, not a product.
 */
const name = Petrona({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
  variable: "--in-name",
});

const board = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
  variable: "--in-board",
});

export const metadata: Metadata = {
  title: "Intake — a due step needs a person",
  description:
    "Shift board for a volunteer-run cat rescue. Every due step must have an owner. Medical intervals are locks. A volunteer arriving for a shift can see the next action in fifteen seconds.",
};

export default function Page() {
  return (
    <div className={`${name.variable} ${board.variable}`}>
      <Mount />
    </div>
  );
}

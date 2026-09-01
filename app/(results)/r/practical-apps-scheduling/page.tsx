import type { Metadata } from "next";
import { Cardo, Lexend } from "next/font/google";

import Mount from "./Mount";

/**
 * Cardo is a scholar's face — the names in a school prize book, not a product
 * heading. Lexend carries the corridor: low-vision-friendly proportions so a
 * fluorescent hallway between lessons is still readable at arm's length.
 */
const read = Cardo({
  subsets: ["latin"],
  weight: ["400", "700"],
  style: ["normal", "italic"],
  display: "swap",
  variable: "--pe-read",
});

const ui = Lexend({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  display: "swap",
  variable: "--pe-ui",
});

export const metadata: Metadata = {
  title: "Peripatetic — sixty-one pupils, six timetables",
  description:
    "Constraint-first scheduling for a travelling violin teacher. Six school timetables he does not control; a January change that shows exactly what it broke. Not a calendar.",
};

export default function Page() {
  return (
    <div className={`${read.variable} ${ui.variable}`}>
      <Mount />
    </div>
  );
}

import type { Metadata } from "next";
import { Instrument_Sans, Newsreader } from "next/font/google";

import Walk from "./Walk";
import s from "./walk.module.css";

/**
 * Newsreader carries every word she wrote. It is a screen text face with real
 * italics and a low-contrast, slightly worn look that holds a 60-character
 * measure at 19px without turning into a magazine; the notes are the whole
 * piece, so the reading face is chosen first and everything else fits round it.
 *
 * Instrument Sans carries the apparatus — dates, minute marks, counts, the
 * labels on the year strips. It is there to be read quickly at 11px in wide
 * tracking and to stay visibly separate from her voice.
 */
const text = Newsreader({
  subsets: ["latin"],
  display: "swap",
  weight: ["300", "400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--face-text",
});

const label = Instrument_Sans({
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600"],
  variable: "--face-label",
});

export const metadata: Metadata = {
  title: "Same Walk — a year of one morning route",
  description:
    "A diary of the same twenty-minute canal walk every morning for a year, read along the route as well as along the calendar.",
};

export default function Page() {
  return (
    <main className={`${text.variable} ${label.variable} ${s.page}`}>
      <Walk />
    </main>
  );
}

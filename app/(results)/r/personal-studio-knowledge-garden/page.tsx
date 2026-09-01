import type { Metadata } from "next";
import { IBM_Plex_Sans, Source_Serif_4 } from "next/font/google";

import Plot from "./Plot";
import s from "./plot.module.css";

/**
 * Source Serif 4 carries the notes. It is a reading face with a real italic
 * and enough weight range that a ten-year conviction and a sentence put down
 * this morning can share a page without sharing a voice. The italic is
 * load-bearing: seedlings are set in it, tended notes are not.
 *
 * IBM Plex Sans carries the apparatus — beds, dates, the filter, the file-like
 * span of a note. It was drawn for institutional documents. She was a council
 * officer; the furniture of the plot should look like the files she used to
 * write, not like a magazine.
 */
const serif = Source_Serif_4({
  subsets: ["latin"],
  display: "swap",
  style: ["normal", "italic"],
  axes: ["opsz"],
  variable: "--face-serif",
});

const sans = IBM_Plex_Sans({
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500"],
  variable: "--face-sans",
});

export const metadata: Metadata = {
  title: "Plot — Ada Voss, notes 2015–2026",
  description:
    "A public notebook kept by a municipal tree officer in Holme. Maturity is in the type: tended notes look tended, seedlings look like seedlings, and a note left in 2018 is still here if a later one stands against it.",
};

export default function Page() {
  return (
    <main className={`${serif.variable} ${sans.variable} ${s.page}`}>
      <Plot />
    </main>
  );
}

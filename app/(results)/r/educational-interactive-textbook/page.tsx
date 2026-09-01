import type { Metadata } from "next";
import { Cardo, Karla } from "next/font/google";

import Read from "./read";

/**
 * Cardo is a Renaissance scholarly face — the right temperature for a chapter
 * that has to be read, not scanned. Karla is for the instruments: sliders,
 * readouts, figure numbers. It is not monospaced; the figures are drawings,
 * not ledgers, and a humanist sans keeps them in the same document as the prose.
 */
const serif = Cardo({
  subsets: ["latin"],
  weight: ["400", "700"],
  style: ["normal", "italic"],
  display: "swap",
  variable: "--font-serif",
});

const sans = Karla({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Arch — why a pile of stones stands",
  description:
    "A chapter on the statics of masonry arches: the thrust line, the catenary, the outward push, and why an arch fails by hinging. Real force resolution, written to be read.",
};

export default function Page() {
  return (
    <main
      className={`${serif.variable} ${sans.variable}`}
      style={{ minHeight: "100vh", background: "#e7e8e1" }}
    >
      <Read />
    </main>
  );
}

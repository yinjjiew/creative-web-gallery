import type { Metadata } from "next";
import { DM_Mono, Literata } from "next/font/google";

import Desk from "./Desk";

/**
 * Literata for the lesson (a reading face, slightly condensed, meant to be
 * held as a paragraph). DM Mono for every instrument: altitude, speed and
 * period have to line up as a column or the relationship they share is harder
 * to see.
 */
const serif = Literata({
  subsets: ["latin"],
  style: ["normal", "italic"],
  display: "swap",
  variable: "--font-serif",
});

const mono = DM_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "Orbit — to catch up, slow down",
  description:
    "A two-body rendezvous desk. Fire toward a craft ahead of you and you fall behind; brake, and you come around and meet it. Real inverse-square gravity, conserved energy and angular momentum, ISS-height numbers.",
};

export default function Page() {
  return (
    <main className={`${serif.variable} ${mono.variable}`}>
      <Desk />
    </main>
  );
}

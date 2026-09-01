import type { Metadata } from "next";
import { Geist_Mono, Instrument_Serif } from "next/font/google";

import Mount from "./Mount";
import s from "./desk.module.css";

/**
 * Two faces, two jobs. Instrument Serif names the stations and the mast —
 * a reading face that can hold a slur. Geist Mono is the score: milliseconds,
 * bezier points, the export, never the word on the control.
 */
const serif = Instrument_Serif({
  subsets: ["latin"],
  weight: ["400"],
  style: ["normal", "italic"],
  display: "swap",
  variable: "--sc-serif",
});

const mono = Geist_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
  variable: "--sc-mono",
});

export const metadata: Metadata = {
  title: "Statecraft — a desk for the journey between states",
  description:
    "A component editor whose object is the directed edge: duration, easing, " +
    "and the stagger of each voice. The live control is the proof. Export is " +
    "the same React and CSS the proof already runs.",
};

export default function StatecraftPage() {
  return (
    <div className={`${serif.variable} ${mono.variable} ${s.root}`}>
      <Mount />
    </div>
  );
}

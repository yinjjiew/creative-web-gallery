import type { Metadata } from "next";
import { Atkinson_Hyperlegible, Source_Serif_4, Tangerine } from "next/font/google";

import Mount from "./Mount";

/**
 * Atkinson Hyperlegible is the desk: she sits for four hours and must not
 * misread her own marks. Source Serif 4 is the reading — optical sizes, a
 * face that can hold a diplomatic transcription at 16px. Tangerine is the
 * clerk’s hand on the facsimile only, and never appears in her judgements.
 */
const ui = Atkinson_Hyperlegible({
  subsets: ["latin"],
  weight: ["400", "700"],
  style: ["normal", "italic"],
  display: "swap",
  variable: "--reg-ui",
});

const read = Source_Serif_4({
  subsets: ["latin"],
  style: ["normal", "italic"],
  display: "swap",
  axes: ["opsz"],
  variable: "--reg-read",
});

const hand = Tangerine({
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
  variable: "--reg-hand",
});

export const metadata: Metadata = {
  title: "Register — Askrigg baptisms, a sitting",
  description:
    "Transcription software for a historian: uncertainty is recorded per field, each reading stays linked to its image region, revisions keep the original, and suggestions cannot be mistaken for judgements.",
};

export default function Page() {
  return (
    <div className={`${ui.variable} ${read.variable} ${hand.variable}`}>
      <Mount />
    </div>
  );
}

import type { Metadata } from "next";
import { Albert_Sans, STIX_Two_Text } from "next/font/google";

import Desk from "./Desk";

/**
 * STIX Two Text is the scientific-publishing face — the temperature of the
 * papers this diagnostic is built from. Albert Sans is for the instruments:
 * the answers, the captions, the keys. A grotesque keeps those from competing
 * with the diagnoses, which have to be read as prose.
 */
const serif = STIX_Two_Text({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  display: "swap",
  variable: "--font-serif",
});

const sans = Albert_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Naive Physics — a diagnostic for force and motion",
  description:
    "Every wrong answer is a documented misconception. The feedback is a simulation where that prediction fails, because being told you are wrong does not dislodge a physical intuition.",
};

export default function Page() {
  return (
    <main className={`${serif.variable} ${sans.variable}`}>
      <Desk />
    </main>
  );
}

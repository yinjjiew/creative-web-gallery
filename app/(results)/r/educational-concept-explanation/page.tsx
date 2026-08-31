import type { Metadata } from "next";
import { IBM_Plex_Mono, Source_Serif_4 } from "next/font/google";

import Explainer from "./explainer";

/**
 * Source Serif 4 for the reading, IBM Plex Mono for every figure. The mono is
 * doing real work rather than decoration: it is monospaced, so a column of
 * counts lines up without asking for tabular figures, and it keeps the numbers
 * visibly separate from the argument about them.
 */
const serif = Source_Serif_4({
  subsets: ["latin"],
  style: ["normal", "italic"],
  display: "swap",
  variable: "--font-serif",
});

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "Reversal — an interactive explanation of Simpson's paradox",
  description:
    "A comparison can hold in every subgroup and turn around when the groups are pooled. Drag the case mix until the reversal appears and disappears under your own hands, with the 1986 kidney-stone figures, Berkeley 1973, and the question most explanations skip: which number should you act on.",
};

export default function Page() {
  return (
    <main className={`${serif.variable} ${mono.variable}`}>
      <Explainer />
    </main>
  );
}

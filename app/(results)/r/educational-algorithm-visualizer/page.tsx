import type { Metadata } from "next";
import { Inconsolata, Spectral } from "next/font/google";

import Essay from "./essay";

/**
 * Spectral for the essay (a news face, slightly condensed, meant to be read
 * in a column). Inconsolata for every pattern, input, and instruction — the
 * same face a programmer already trusts for code, used here so a regex and
 * the string it is eating stay aligned.
 */
const serif = Spectral({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  display: "swap",
  variable: "--font-serif",
});

const mono = Inconsolata({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "Backtrack — how a regular expression engine actually runs",
  description:
    "A visualiser for backtracking regular expression matching. Bring a pattern and an input, watch the engine try, fail and give back, and see the shape of the combinatorial explosion that turns microseconds into centuries.",
};

export default function Page() {
  return (
    <main className={`${serif.variable} ${mono.variable}`}>
      <Essay />
    </main>
  );
}

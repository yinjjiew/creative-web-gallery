import type { Metadata } from "next";
import { Barlow_Condensed, Fraunces, Source_Sans_3 } from "next/font/google";

import App from "./App";
import s from "./getin.module.css";

/**
 * Fraunces carries the one sentence she actually asks — what is about to
 * become unrecoverable — and nothing else. It is a soft optical-size serif,
 * closer to a note on a call sheet than to a product headline.
 *
 * Barlow Condensed is the call-sheet face: department stamps, day counts,
 * latest-start dates. Source Sans 3 is the reading face for owners, reasons
 * and the explanation of a chain.
 */
const question = Fraunces({
  subsets: ["latin"],
  display: "swap",
  weight: ["500", "600"],
  style: ["normal", "italic"],
  variable: "--gi-question",
});

const stamp = Barlow_Condensed({
  subsets: ["latin"],
  display: "swap",
  weight: ["500", "600", "700"],
  variable: "--gi-stamp",
});

const text = Source_Sans_3({
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--gi-text",
});

export const metadata: Metadata = {
  title: "Get-In — what is about to become unrecoverable",
  description:
    "Five weeks to an immovable opening night. A production manager's view of slack, lead times and the critical path — not a board with columns.",
};

export default function Page() {
  return (
    <div className={`${question.variable} ${stamp.variable} ${text.variable} ${s.root}`}>
      <App />
    </div>
  );
}

import type { Metadata } from "next";
import { Crimson_Pro, Geist_Mono } from "next/font/google";

import Log from "./Log";
import s from "./log.module.css";

/**
 * Crimson Pro carries the log. It is a reading face with a real italic and
 * oldstyle figures, dark enough to hold a two-line note and a two-year essay
 * on the same paper without a second display cut. The work is written, so the
 * face is chosen for reading, not for a masthead.
 *
 * Geist Mono is the apparatus: years, dates, month-counts, the three readers.
 * Keeping the furniture in a different voice from the entries is the same
 * argument the log makes — a career is a record, not a presentation.
 */
const text = Crimson_Pro({
  subsets: ["latin"],
  display: "swap",
  style: ["normal", "italic"],
  weight: ["400", "500", "600"],
  variable: "--log-text",
});

const mono = Geist_Mono({
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500"],
  variable: "--log-mono",
});

export const metadata: Metadata = {
  title: "Log — Ivo Ren, 2012–2026",
  description:
    "Fourteen years of a creative developer's work as a chronological log: technique notes beside major projects, weighted by the months they took, readable as delivered work, as thinking, or as making.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#e7e3d6",
};

export default function Page() {
  return (
    <div className={`${text.variable} ${mono.variable} ${s.root}`}>
      <Log />
    </div>
  );
}

import type { Metadata } from "next";
import localFont from "next/font/local";
import { Newsreader } from "next/font/google";

import Mount from "./Mount";

/**
 * Newsreader for the English — a reading face with an optical size axis, so
 * the lesson copy and the small staff labels stay in one family. The hanzi
 * are a local subset of Noto Serif SC (OFL), only the characters this page
 * uses, because next/font/google's Noto SC build here ships Latin only.
 */
const text = Newsreader({
  subsets: ["latin"],
  style: ["normal", "italic"],
  display: "swap",
  variable: "--font-text",
});

const han = localFont({
  src: "./han.woff2",
  weight: "500",
  display: "swap",
  variable: "--font-han",
  fallback: ["Noto Serif CJK SC", "Songti SC", "STSong", "SimSun", "serif"],
  adjustFontFallback: false,
});

export const metadata: Metadata = {
  title: "Tone — see the pitch you cannot hear",
  description:
    "Mandarin tone as a contour you produce and then see. Your pitch is drawn against the target; feedback names what to fix. Relative contour, tone sandhi, the neutral tone, and a path that does not need a microphone.",
};

export default function Page() {
  return (
    <div className={`${text.variable} ${han.variable}`}>
      <Mount />
    </div>
  );
}

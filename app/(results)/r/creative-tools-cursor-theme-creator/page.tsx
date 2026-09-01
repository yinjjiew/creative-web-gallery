import type { Metadata } from "next";
import { Ibarra_Real_Nova, IBM_Plex_Mono } from "next/font/google";

import Mount from "./Mount";
import s from "./pointer.module.css";

/**
 * Two faces, two jobs. Ibarra Real Nova sets the proof — a Spanish old-style
 * that still reads as a page, not a UI. IBM Plex Mono is the grammar: target
 * names, masses, the export. They do not swap.
 */
const serif = Ibarra_Real_Nova({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
  variable: "--idx-serif",
});

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
  variable: "--idx-mono",
});

export const metadata: Metadata = {
  title: "Index — a grammar for the pointer",
  description:
    "A pointer-system designer. Shape, weight, magnetism, press and wait " +
    "are rules per target, proofed against a real page and exported as " +
    "dependency-free CSS and JS.",
};

export default function IndexPage() {
  return (
    <div className={`${serif.variable} ${mono.variable} ${s.root}`}>
      <Mount />
    </div>
  );
}

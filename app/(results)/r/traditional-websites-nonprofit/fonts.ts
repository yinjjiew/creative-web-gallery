import { Atkinson_Hyperlegible, IBM_Plex_Mono } from "next/font/google";

/**
 * Atkinson Hyperlegible was cut so letters are hard to confuse — i/l/1, o/0 —
 * which is the right face for someone reading under stress on a cracked phone.
 * IBM Plex Mono holds the number, the times and the dates: the facts that must
 * not wrap or be misread. Neither is a display face.
 */
export const sans = Atkinson_Hyperlegible({
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "700"],
  style: ["normal", "italic"],
  variable: "--dy-sans",
});

export const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500"],
  variable: "--dy-mono",
});

export const fontClass = `${sans.variable} ${mono.variable}`;

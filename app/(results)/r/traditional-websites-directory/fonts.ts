import { IBM_Plex_Mono, Newsreader } from "next/font/google";

/**
 * Newsreader carries the names of water — a slightly condensed reading face
 * that sits on a page like an old gazetteer without going precious. IBM Plex
 * Mono carries every figure, stamp, date and source: the survey half of the
 * register. The two jobs do not share a weight or a case.
 */
export const newsreader = Newsreader({
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--rch-serif",
});

export const plex = IBM_Plex_Mono({
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500"],
  variable: "--rch-mono",
});

export const fontClass = `${newsreader.variable} ${plex.variable}`;

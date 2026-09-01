import {
  Fraunces,
  IBM_Plex_Mono,
  IBM_Plex_Sans_Condensed,
  Newsreader,
} from "next/font/google";

/**
 * Works sets four faces, each with a job.
 *
 * Fraunces is the publication: soft contrast, a little worn, optical sizes
 * that hold a 72-point masthead without going costume. Newsreader is the
 * reading face — designed for screens, with an optical axis that stays
 * even at text size on a phone. Plex Condensed does the industrial work
 * (issue numbers, section labels, running heads). Plex Mono does the
 * measured work (tables, footnote marks, plate numbers).
 */
export const display = Fraunces({
  subsets: ["latin"],
  display: "swap",
  axes: ["opsz", "SOFT", "WONK"],
  variable: "--wk-display",
});

export const body = Newsreader({
  subsets: ["latin"],
  display: "swap",
  axes: ["opsz"],
  style: ["normal", "italic"],
  variable: "--wk-body",
});

export const label = IBM_Plex_Sans_Condensed({
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600"],
  variable: "--wk-label",
});

export const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500"],
  variable: "--wk-mono",
});

export const fontClass = `${display.variable} ${body.variable} ${label.variable} ${mono.variable}`;

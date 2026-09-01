import { JetBrains_Mono, Source_Sans_3, Source_Serif_4 } from "next/font/google";

/**
 * Instant docs set three faces, each with a job.
 *
 * Source Serif 4 is the reading face — optical sizes that hold both a
 * title and a 9,000-word concept page. Source Sans 3 does chrome: nav,
 * labels, table heads, the search field. JetBrains Mono does signatures
 * and examples, where a confused glyph is a bug in the documentation.
 */
export const serif = Source_Serif_4({
  subsets: ["latin"],
  display: "swap",
  axes: ["opsz"],
  style: ["normal", "italic"],
  variable: "--in-serif",
});

export const sans = Source_Sans_3({
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
  variable: "--in-sans",
});

export const mono = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500"],
  variable: "--in-mono",
});

export const fontClass = `${serif.variable} ${sans.variable} ${mono.variable}`;

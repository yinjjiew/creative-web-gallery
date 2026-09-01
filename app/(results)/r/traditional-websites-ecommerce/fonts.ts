import { Big_Shoulders, IBM_Plex_Mono, Source_Sans_3 } from "next/font/google";

/**
 * Signage, then the book, then the ticket.
 *
 * Big Shoulders is a painted-brick condensed: the face on fifty years of
 * enamel plates in a market-town ironmonger. Source Sans is the counter
 * hand — plain, slightly tired, no charm. IBM Plex Mono is the SKU, the
 * gauge, the thread pitch and the price. Three jobs, three faces.
 */
export const display = Big_Shoulders({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  display: "swap",
  variable: "--cu-display",
});

export const sans = Source_Sans_3({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--cu-sans",
});

export const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
  variable: "--cu-mono",
});

export const fontClass = `${display.variable} ${sans.variable} ${mono.variable}`;

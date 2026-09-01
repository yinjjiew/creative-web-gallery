import { Fraunces, IBM_Plex_Sans } from "next/font/google";

/**
 * Fraunces for door names. IBM Plex Sans for the tape — civic, readable
 * at arm's length on a wet phone. Neither pairing is used by the other
 * client-brand results.
 */
export const serif = Fraunces({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
  variable: "--oc-serif",
});

export const sans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
  variable: "--oc-sans",
});

export const fontClass = `${serif.variable} ${sans.variable}`;

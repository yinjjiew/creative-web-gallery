import { IBM_Plex_Sans, STIX_Two_Text } from "next/font/google";

/**
 * STIX Two is the face scientific journals actually use — a Times lineage
 * cut for equations and for the kind of sentence that contains a Reynolds
 * number. IBM Plex Sans does the drawing-office work: title strips, keys,
 * the job index. Neither is a display face. Nothing here is set for effect.
 */
export const serif = STIX_Two_Text({
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--lk-serif",
});

export const sans = IBM_Plex_Sans({
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500"],
  variable: "--lk-sans",
});

export const fontClass = `${serif.variable} ${sans.variable}`;

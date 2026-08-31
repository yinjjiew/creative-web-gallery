import { Archivo, Spectral } from "next/font/google";

/**
 * Two faces, divided by job rather than by hierarchy.
 *
 * Spectral carries every word the chef says: sharp wedge serifs, low contrast,
 * a little austere, and it holds a 34rem measure without going soft. Archivo
 * carries every number and every label — the machine half of a weighbridge
 * ticket — and has the tabular figures the ledger columns depend on.
 *
 * Nothing is set in bold. Severity here comes from spacing and rule work, not
 * from weight.
 */
export const spectral = Spectral({
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500"],
  style: ["normal", "italic"],
  variable: "--wb-serif",
});

export const archivo = Archivo({
  subsets: ["latin"],
  display: "swap",
  axes: ["wdth"],
  variable: "--wb-sans",
});

export const fontClass = `${spectral.variable} ${archivo.variable}`;

import { Fira_Sans, Yrsa } from "next/font/google";

/**
 * Yrsa is a slightly condensed old-style, cut for screens — closer to a
 * wage-book hand than to a display serif. It holds a 36-rem measure without
 * going soft, and the italic is a signature, not a costume. Fira Sans does
 * the clerk's work: the nav, the labels, the money. Neither is a startup
 * grotesque. Nothing here is set for effect.
 */
export const serif = Yrsa({
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--ro-serif",
});

export const sans = Fira_Sans({
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500"],
  variable: "--ro-sans",
});

export const fontClass = `${serif.variable} ${sans.variable}`;

import { Bricolage_Grotesque, Newsreader } from "next/font/google";

/**
 * Newsreader carries the one sentence the campaign is allowed: a spoken line,
 * not a slogan. Bricolage Grotesque is the operational face — the hour, the
 * form, the eligibility answers — a slightly awkward contemporary grotesque
 * that does not look like a government PDF or a wellness brand.
 */
export const display = Newsreader({
  subsets: ["latin"],
  weight: ["400", "600"],
  style: ["normal", "italic"],
  display: "swap",
  variable: "--font-display",
});

export const text = Bricolage_Grotesque({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  display: "swap",
  variable: "--font-text",
});

export const fontClass = `${display.variable} ${text.variable}`;

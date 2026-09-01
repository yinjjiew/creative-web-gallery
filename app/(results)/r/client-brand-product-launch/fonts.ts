import { Atkinson_Hyperlegible, Fraunces } from "next/font/google";

/**
 * Fraunces carries the argument. It is a soft optical serif — not a Didone
 * watch advertisement, not a medical grotesque. At the size of the headline it
 * has the weight of a spoken sentence; at text size it stays open enough for
 * tired eyes. The softness is intentional: this audience has been sold to with
 * chrome and with beige, and neither is the register of someone telling them
 * the truth about seven years.
 *
 * Atkinson Hyperlegible is the operational face — navigation, specification,
 * forms, the room, the fitting. It was drawn by the Braille Institute for
 * readers with low vision, which is not a decorative choice here. The brief's
 * audience is over fifty and many of them are on this page with the same eyes
 * that are the reason they came. Body copy lives in this face at 20px, not in
 * the serif.
 */
export const display = Fraunces({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
  variable: "--font-display",
});

export const text = Atkinson_Hyperlegible({
  subsets: ["latin"],
  weight: ["400", "700"],
  style: ["normal", "italic"],
  display: "swap",
  variable: "--font-text",
});

export const fontClass = `${display.variable} ${text.variable}`;

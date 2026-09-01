import { Azeret_Mono, Public_Sans } from "next/font/google";

/**
 * Two faces, and neither of them is trying to be charming.
 *
 * Public Sans is a plain, slightly cold grotesque drawn for government forms.
 * That is exactly the register this mill wants: a mill that publishes its own
 * fault register and its own margin should not be setting its prose in
 * something with a flourish. It is unfashionable in the way the client is
 * unfashionable, and it holds a long measure at 17px without going soft.
 *
 * Azeret Mono carries every lot code, weight, micron and date. Monospaced does
 * real work here — the whole site is columns of figures that have to line up to
 * be checkable — and its square, blunt terminals read as a stencil on a bale
 * rather than as a code editor. Tabular by construction.
 *
 * No serif anywhere. A serif would have made this warm, and heritage warmth is
 * the thing the brief rules out.
 */
export const sans = Public_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--aw-sans",
});

export const mono = Azeret_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
  variable: "--aw-mono",
});

export const fontClass = `${sans.variable} ${mono.variable}`;

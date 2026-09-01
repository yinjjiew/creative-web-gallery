import type { Metadata } from "next";
import { Azeret_Mono, Fraunces } from "next/font/google";

import Mount from "./Mount";
import s from "./bench.module.css";

/**
 * Two jobs, two faces. Fraunces is the material — a variable optical serif
 * whose weight, soft, wonk and optical-size axes are what the score drives.
 * Azeret Mono is the instrument: axis names, knot values, the formula, never
 * the line being set.
 */
const face = Fraunces({
  subsets: ["latin"],
  display: "swap",
  axes: ["SOFT", "WONK", "opsz"],
  variable: "--kin-face",
});

const mono = Azeret_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
  variable: "--kin-mono",
});

export const metadata: Metadata = {
  title: "Kinesis — a score for type in time",
  description:
    "A kinetic type bench. Variable-font axes are driven per letter by an " +
    "editable curve over the clock, the pointer, or the scroll. The artifact " +
    "is CSS and Web Animations you can paste onto a real page.",
};

export default function TypographyPlaygroundPage() {
  return (
    <div className={`${face.variable} ${mono.variable} ${s.root}`}>
      <Mount />
    </div>
  );
}

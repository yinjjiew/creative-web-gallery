import type { Metadata } from "next";
import { Cormorant_Garamond, Karla } from "next/font/google";

import Mount from "./Mount";
import s from "./cairn.module.css";

/**
 * Cormorant is the face of a hillwalking guidebook — high contrast, a little
 * old, the word "Cairn" standing like a stacked stone. Karla does the map
 * labels: quiet, slightly condensed, the same voice as a contour interval.
 */
const display = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
});

const label = Karla({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Cairn — a ridge that keeps your falls",
  description:
    "A precision platformer on a Highland ridge. Every death leaves a solid " +
    "stone. Fail a jump often enough and you build a cairn through it — or " +
    "wall yourself in.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#1c1a17",
};

export default function Page() {
  return (
    <div
      className={s.root}
      style={
        {
          "--display": display.style.fontFamily,
          "--label": label.style.fontFamily,
        } as React.CSSProperties
      }
    >
      <Mount />
    </div>
  );
}

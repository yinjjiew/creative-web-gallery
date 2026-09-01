import type { Metadata } from "next";
import { Cormorant_Garamond, IBM_Plex_Mono } from "next/font/google";

import Mount from "./Mount";
import s from "./tide.module.css";

/**
 * Copperplate-adjacent: a high-contrast garalde for the cartouche and a
 * monospaced face for soundings and the tide table, as on a printed sheet.
 */
const display = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  display: "swap",
});

const figures = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Tide — a puzzle",
  description:
    "A tidal puzzle on an engraved chart. The same water that blocks a path " +
    "is the water that floats you over the wall, on a cycle you can read but never change.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#d4c7a5",
};

export default function Page() {
  return (
    <div
      className={s.root}
      style={
        {
          "--display": display.style.fontFamily,
          "--figures": figures.style.fontFamily,
        } as React.CSSProperties
      }
    >
      <Mount />
    </div>
  );
}

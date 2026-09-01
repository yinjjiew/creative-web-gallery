import type { Metadata } from "next";
import { Literata, Source_Sans_3, Syne } from "next/font/google";

import Mount from "./Mount";
import s from "./desk.module.css";

/**
 * Three faces, three jobs. Syne carries the poster headline — a geometric
 * with enough weight to hold a wall. Literata sets the dek, a reading serif
 * that still has a newspaper grain at italic. Source Sans 3 is the desk
 * chrome: small, quiet, never competing with the sheet.
 */
const display = Syne({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  display: "swap",
  variable: "--sig-display",
});

const serif = Literata({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
  variable: "--sig-serif",
});

const ui = Source_Sans_3({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
  variable: "--sig-ui",
});

export const metadata: Metadata = {
  title: "Signal — a composing desk for posters",
  description:
    "A poster and social-card composer built on switchable editorial grids. " +
    "You bring the copy and a still; the desk chooses how they sit, treats " +
    "the image in the same inks as the type, reflows for each destination, " +
    "and writes a PNG at the real pixel size.",
};

export default function PosterMakerPage() {
  return (
    <div className={`${display.variable} ${serif.variable} ${ui.variable} ${s.root}`}>
      <Mount />
    </div>
  );
}

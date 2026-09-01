import type { Metadata } from "next";
import { IBM_Plex_Sans_Condensed, Libre_Baskerville } from "next/font/google";

import Watershed from "./Watershed";
import s from "./watershed.module.css";

/**
 * Libre Baskerville carries the notes. It is a book face with enough weight
 * in the roman and a real italic, and it does not prettify a walk that was
 * not pretty. The measure is for reading, not for a magazine.
 *
 * IBM Plex Sans Condensed carries the survey — day, kilometre, width, the
 * long section. It looks like a gauge board. The two faces keep her voice
 * and the river's measurements from sharing a texture.
 */
const text = Libre_Baskerville({
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "700"],
  style: ["normal", "italic"],
  variable: "--face-text",
});

const mark = IBM_Plex_Sans_Condensed({
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500"],
  variable: "--face-mark",
});

export const metadata: Metadata = {
  title: "Watershed — forty-one days on the Lum",
  description:
    "Ruth Keane walked one river from a peat spring to a two-kilometre estuary. The site is the descent: distance downstream, and the water getting wider.",
};

export default function Page() {
  return (
    <div className={`${text.variable} ${mark.variable} ${s.root}`}>
      <Watershed />
    </div>
  );
}

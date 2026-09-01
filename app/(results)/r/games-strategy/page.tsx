import type { Metadata } from "next";
import { Newsreader, Public_Sans } from "next/font/google";

import Mount from "./Mount";
import s from "./levee.module.css";

/**
 * Newsreader is a flood extra, not a copperplate chart: the parish name should
 * read like a notice pinned to a levee-board door. Public Sans is the face of
 * a government sheet — figures, crests, the day of the rise.
 */
const display = Newsreader({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  display: "swap",
});

const label = Public_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Levee — a strategy game",
  description:
    "Hold a river delta against a flood with too few crews and too little stone. " +
    "The water needs no intelligence — it finds the weakest crest and goes there.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#c6c2b6",
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

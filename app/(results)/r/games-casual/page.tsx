import type { Metadata } from "next";
import { Figtree, Fraunces } from "next/font/google";

import Mount from "./Mount";
import s from "./skip.module.css";

/**
 * Fraunces for the count — a soft display that can sit on water without
 * shouting. Figtree for every label, because a casual game should read like
 * a note on the shore, not a circus bill.
 */
const display = Fraunces({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  display: "swap",
});

const label = Figtree({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Skip — stones across water",
  description:
    "A casual game about skipping stones. Angle, spin and pace decide whether " +
    "the stone bites or sinks, and the whole of it is the pleasure of each touch.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0c1418",
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

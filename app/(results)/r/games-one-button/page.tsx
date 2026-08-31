import type { Metadata } from "next";
import { Barlow_Condensed, Bodoni_Moda } from "next/font/google";

import Mount from "./Mount";
import s from "./trapeze.module.css";

/**
 * Bodoni Moda for anything that is a name or a number: it is the face of a
 * nineteenth-century circus bill, and its high contrast holds up at poster size
 * against a black ground. Barlow Condensed, lower case and widely tracked,
 * handles every label, because a one-button game should never look like it is
 * explaining itself.
 */
const display = Bodoni_Moda({
  subsets: ["latin"],
  weight: ["400", "500"],
  style: ["normal", "italic"],
  display: "swap",
});

const label = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Trapeze — a game with one button",
  description:
    "A flying trapeze game with a single input. The swing is an honest pendulum " +
    "and a release carries the tangential momentum you actually had, so the " +
    "skill is reading the arc and knowing the exact moment to let go.",
};

/** A game needs the whole viewport and no rubber-banding around it. */
export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0c0b0a",
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

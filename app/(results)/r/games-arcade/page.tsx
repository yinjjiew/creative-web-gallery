import type { Metadata } from "next";
import { Big_Shoulders_Stencil, Newsreader } from "next/font/google";

import Mount from "./Mount";
import s from "./semaphore.module.css";

/**
 * Enamel station lettering and a period text face. Big Shoulders Stencil
 * is a Midland nameboard; Newsreader does the notices pinned beside the frame.
 */
const enamel = Big_Shoulders_Stencil({
  subsets: ["latin"],
  weight: ["500", "700", "800"],
  display: "swap",
});

const notice = Newsreader({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Semaphore — Millford Junction",
  description:
    "An 1890 signal box under escalating traffic. Set and lock routes on a " +
    "mechanical lever frame. Interlocking forbids the combinations that would " +
    "kill someone. One mistake ends the turn.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#1c1410",
};

export default function Page() {
  return (
    <div
      className={s.root}
      style={
        {
          "--enamel": enamel.style.fontFamily,
          "--notice": notice.style.fontFamily,
        } as React.CSSProperties
      }
    >
      <Mount />
    </div>
  );
}

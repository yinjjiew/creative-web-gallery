import type { Metadata } from "next";
import { Alegreya, Alegreya_Sans } from "next/font/google";

import Mount from "./Mount";
import s from "./starter.module.css";

/**
 * A cookbook pair. Alegreya is the notebook and the jar label; Alegreya Sans
 * names the bags and the places on the table. Neither is a UI face.
 */
const serif = Alegreya({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
});

const sans = Alegreya_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  style: ["normal", "italic"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Starter — a jar on the table",
  description:
    "Tend a sourdough culture: yeast and lactic bacteria in one jar. " +
    "Temperature and feeding shift the balance, and the loaf is a consequence " +
    "of how the culture was kept.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#e8dcc8",
};

export default function Page() {
  return (
    <div
      className={s.root}
      style={
        {
          "--serif": serif.style.fontFamily,
          "--sans": sans.style.fontFamily,
        } as React.CSSProperties
      }
    >
      <Mount />
    </div>
  );
}

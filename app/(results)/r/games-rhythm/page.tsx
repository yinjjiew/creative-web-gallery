import type { Metadata } from "next";
import { Archivo_Narrow, Bitter } from "next/font/google";

import Mount from "./Mount";
import s from "./anvil.module.css";

/**
 * Bitter is a workshop ledger — a slab that can stamp a name on iron.
 * Archivo Narrow is the ticket face: heat names, blow counts, the quiet link.
 */
const display = Bitter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
});

const ticket = Archivo_Narrow({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Anvil — the work is the score",
  description:
    "A rhythm game about forging. Keep time on hot iron and the piece takes " +
    "its shape from your timing. A good run and a bad run leave different objects.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#100c0a",
};

export default function Page() {
  return (
    <div
      className={s.root}
      style={
        {
          "--display": display.style.fontFamily,
          "--ticket": ticket.style.fontFamily,
        } as React.CSSProperties
      }
    >
      <Mount />
    </div>
  );
}

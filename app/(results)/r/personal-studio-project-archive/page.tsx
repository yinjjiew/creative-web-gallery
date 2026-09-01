import type { Metadata } from "next";
import { Overpass_Mono, Piazzolla } from "next/font/google";

import Threads from "./Threads";
import s from "./threads.module.css";

/**
 * Piazzolla carries titles and the artist's notes. It is a reading old-style
 * with a real italic; the italic is reserved for her claims, so a visitor can
 * see the difference between a documented series and a problem she says is
 * the same twenty years later.
 *
 * Overpass Mono is the finding aid — catalogue numbers, years, dimensions,
 * the citation. The archive is a record before it is a page of prose.
 */
const text = Piazzolla({
  subsets: ["latin"],
  display: "swap",
  style: ["normal", "italic"],
  weight: ["400", "500", "600"],
  variable: "--face-text",
});

const mono = Overpass_Mono({
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600"],
  variable: "--face-mono",
});

export const metadata: Metadata = {
  title: "Threads — Esther Wain, 1995–2025",
  description:
    "Thirty years of a printmaker's work indexed by preoccupation rather than date: tide tables, a grandmother's hand, ledgers, birds seen from trains.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#e7dcc4",
};

export default function Page() {
  return (
    <div className={`${text.variable} ${mono.variable} ${s.page}`}>
      <Threads />
    </div>
  );
}

import type { Metadata } from "next";
import { Azeret_Mono, Fraunces } from "next/font/google";

import Ambit from "./Ambit";
import s from "./ambit.module.css";

/**
 * Fraunces carries her notes. It was cut to feel like a reading face that has
 * been in a bag — a little soft, a real italic — so the sought/found pair can
 * sit as two voices on one card without a second family.
 *
 * Azeret Mono is the finding aid: catalogue numbers, hours, durations, the
 * plot's ticks. The archive is a register before it is a page of prose.
 */
const voice = Fraunces({
  subsets: ["latin"],
  display: "swap",
  style: ["normal", "italic"],
  weight: ["300", "400", "500", "600"],
  variable: "--face-voice",
});

const mono = Azeret_Mono({
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500"],
  variable: "--face-mono",
});

export const metadata: Metadata = {
  title: "Ambit — Signe Vale, field recordings 2015–2026",
  description:
    "Four hundred recordings plotted by the hour she went and the day of the year. A field recordist's archive, built so a music supervisor can follow a place, a season or an hour, listen without fighting the page, and enquire.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#e4e0d2",
};

export default function Page() {
  return (
    <div className={`${voice.variable} ${mono.variable} ${s.root}`}>
      <Ambit />
    </div>
  );
}

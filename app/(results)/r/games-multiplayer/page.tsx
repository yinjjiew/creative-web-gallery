import type { Metadata } from "next";
import { IBM_Plex_Mono, Source_Serif_4 } from "next/font/google";

import Mount from "./Mount";
import s from "./slalom.module.css";

/**
 * A timing-tape mono for the clock and the packed run, and a book serif for
 * the challenge — the voice of a race office handing you someone else's slip.
 */
const tape = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

const letter = Source_Serif_4({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Slalom — a run that fits in a link",
  description:
    "A downhill time trial whose entire run compresses into a shareable link. " +
    "A friend opens it and races your ghost. Nothing is stored anywhere.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#101412",
};

export default function Page() {
  return (
    <div
      className={s.root}
      style={
        {
          "--tape": tape.style.fontFamily,
          "--letter": letter.style.fontFamily,
        } as React.CSSProperties
      }
    >
      <Mount />
    </div>
  );
}

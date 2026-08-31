import type { Metadata } from "next";
import { IBM_Plex_Mono, Space_Grotesk } from "next/font/google";

import Mount from "./Mount";
import s from "./press.module.css";

/**
 * Two faces, split by job. Space Grotesk sets the words — a grotesque with
 * squared-off terminals that keeps its nerve at 10px in wide small-caps
 * tracking, which is most of this interface. IBM Plex Mono sets every number:
 * screen angles, drift in millimetres, contrast ratios and panel dimensions all
 * sit in columns, and a monospace is the only honest way to align them.
 */
const sans = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
  variable: "--press-sans",
});

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
  variable: "--press-mono",
});

export const metadata: Metadata = {
  title: "Press — a risograph wallpaper works",
  description:
    "A wallpaper press in the risograph register: limited spot inks, real " +
    "halftone screens at classic plate angles, deliberate misregistration and " +
    "paper grain. Compositions are laid out around the lock clock, the icon " +
    "grid and the dock of real devices, measured for legibility under them, " +
    "and exported as a PNG at the panel's true pixel dimensions.",
};

export default function WallpaperPressPage() {
  return (
    <div className={`${sans.variable} ${mono.variable} ${s.root}`}>
      <Mount />
    </div>
  );
}

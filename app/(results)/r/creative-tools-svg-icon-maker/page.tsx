import type { Metadata } from "next";
import { IBM_Plex_Mono, Newsreader } from "next/font/google";

import Mount from "./Mount";
import s from "./foundry.module.css";

/**
 * Two faces, two jobs. Newsreader is the foundry name and the punch titles —
 * a newsprint serif with enough contrast to read as a specimen caption at
 * 11px. IBM Plex Mono is the grid: coordinates, weights, the spec line.
 * Nothing else is allowed to speak.
 */
const serif = Newsreader({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
  variable: "--stk-serif",
});

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
  variable: "--stk-mono",
});

export const metadata: Metadata = {
  title: "Stroke — a punch for a whole icon set",
  description:
    "An icon-set foundry. Weight, terminals, joins, corner radius and " +
    "optical correction live on the set; every punch inherits them. Draw on " +
    "a 24-unit grid, proof at the sizes a toolbar actually uses, and export " +
    "real SVG — a Figma sheet and a currentColor sprite.",
};

export default function StrokePage() {
  return (
    <div className={`${serif.variable} ${mono.variable} ${s.root}`}>
      <Mount />
    </div>
  );
}

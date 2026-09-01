import type { Metadata } from "next";
import { Archivo, IBM_Plex_Mono } from "next/font/google";

import Mount from "./Mount";
import s from "./actuator.module.css";

/**
 * Two jobs, two faces. Archivo is the shop lettering — a grotesque that
 * stays square on a machined plate at 11px. IBM Plex Mono is the instrument:
 * millimetres, hertz, damping ratio, never the word "Actuator".
 */
const sans = Archivo({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--act-sans",
});

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
  variable: "--act-mono",
});

export const metadata: Metadata = {
  title: "Actuator — a bench for press feel",
  description:
    "A control designer whose material is actuation: travel, inertia, " +
    "damping, preload, a detent at commit, settle, and a synthesized click. " +
    "Press the live plunger, then paste out a module that runs the same spring.",
};

export default function ActuatorPage() {
  return (
    <div className={`${sans.variable} ${mono.variable} ${s.root}`}>
      <Mount />
    </div>
  );
}

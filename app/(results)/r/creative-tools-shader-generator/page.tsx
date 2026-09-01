import type { Metadata } from "next";
import { IBM_Plex_Mono, Lora } from "next/font/google";

import Mount from "./Mount";
import s from "./bench.module.css";

/**
 * Two jobs, two faces. Lora is the sample label — a text serif with enough
 * ink to sit on a stone yard tag. IBM Plex Mono is the instrument: blend
 * names, opacity, the compiled GLSL, never the word "Substrate".
 */
const serif = Lora({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
  variable: "--sub-serif",
});

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
  variable: "--sub-mono",
});

export const metadata: Metadata = {
  title: "Substrate — a bench for procedural materials",
  description:
    "Procedural materials as a stack of blended layers rather than a node " +
    "graph, compiled live to real GLSL on the GPU. Designers already know " +
    "opacity, blend modes and clipping; the export is a fragment shader " +
    "you can paste into a project.",
};

export default function SubstratePage() {
  return (
    <div className={`${serif.variable} ${mono.variable} ${s.root}`}>
      <Mount />
    </div>
  );
}

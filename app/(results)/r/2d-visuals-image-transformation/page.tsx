import type { Metadata, Viewport } from "next";
import { Besley } from "next/font/google";

import Sheet from "./Sheet";
import styles from "./loom.module.css";

const besley = Besley({
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "600"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "Loom — a photograph, rewoven",
  description:
    "A photograph reconstructed as cloth. Warp and weft are real yarns from a " +
    "limited mill palette; every crossing is one or the other. Tone is the lift, " +
    "not a colour filter. Zoom until the threads are individually correct.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function LoomPage() {
  return (
    <main className={`${besley.className} ${styles.page}`}>
      <Sheet />
    </main>
  );
}

import type { Metadata } from "next";
import { IBM_Plex_Mono, Spectral } from "next/font/google";

import Still from "./Still";
import styles from "./still.module.css";

/**
 * Still — a mattress advertisement.
 *
 * Comfort cannot be proved in a browser. Motion isolation can. The page is
 * one bed, split, and a wave that is allowed to travel on only one side.
 * The copy is there so a visitor who never touches it still leaves with the
 * claim; the interaction is there so a sceptic can try to break it.
 */
const display = Spectral({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  display: "swap",
});

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Still — their two in the morning is not your problem any more",
  description:
    "A mattress built so that one person’s two in the morning is not the other’s. Pocketed coils, a polymer seam, latex and wool rather than foam. Hundred-night trial. We take the old mattress.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: "#100e0c",
};

export default function Page() {
  return (
    <div className={`${display.className} ${styles.page}`}>
      <Still monoClass={mono.className} />
    </div>
  );
}

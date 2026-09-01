import type { Metadata } from "next";
import { Cormorant } from "next/font/google";

import Atelier from "./Atelier";
import styles from "./drape.module.css";

const face = Cormorant({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Charmeuse — a length of heavy silk",
  description:
    "A hanging length of 19-momme ivory charmeuse on a constraint-solved mesh. " +
    "Grab it, pin it, cut it. Folds form, travel and settle; light in the folds " +
    "does the describing.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#241f1a",
};

export default function Page() {
  return (
    <main className={`${face.className} ${styles.page}`}>
      <Atelier fontFamily={face.style.fontFamily} />
    </main>
  );
}

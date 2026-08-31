import type { Metadata } from "next";
import { Fragment_Mono } from "next/font/google";

import Plate from "./Plate";
import styles from "./moire.module.css";

const mono = Fragment_Mono({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Moir\u00e9 — two rulings in near-alignment",
  description:
    "A cursor-reactive interference plate. Two ruled line fields are evaluated " +
    "analytically in the frequency domain, so the figures are genuine moiré " +
    "rather than sampling artefacts, and the pointer sets the relation between " +
    "the layers.",
};

export default function MoirePage() {
  return (
    <main className={`${mono.className} ${styles.page}`}>
      <Plate />
    </main>
  );
}

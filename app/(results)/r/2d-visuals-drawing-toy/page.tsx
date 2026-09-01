import type { Metadata } from "next";
import { Shippori_Mincho } from "next/font/google";

import Sheet from "./Sheet";
import styles from "./bleed.module.css";

const mincho = Shippori_Mincho({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Bleed — sumi on damp paper",
  description:
    "A drawing toy whose medium keeps moving after the stroke. Ink is water " +
    "and soot on a damp sheet: it wicks along fibre, blooms where the paper " +
    "is already wet, and dries into a darker rim.",
};

export default function BleedPage() {
  return (
    <main className={`${mincho.className} ${styles.page}`}>
      <Sheet />
    </main>
  );
}

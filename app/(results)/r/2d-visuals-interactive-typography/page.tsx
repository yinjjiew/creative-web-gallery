import type { Metadata } from "next";
import { IM_Fell_English } from "next/font/google";

import Sheet from "./Sheet";
import styles from "./press.module.css";

const fell = IM_Fell_English({
  weight: "400",
  subsets: ["latin"],
  style: ["normal", "italic"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Deboss — a letterpress impression",
  description:
    "A sheet of cotton rag holding a blind impression. The type is a valley " +
    "in the paper, invisible under flat light, and the visitor's pointer is " +
    "the only lamp in the room.",
};

export default function DebossPage() {
  return (
    <main className={`${fell.className} ${styles.page}`}>
      <Sheet fontFamily={fell.style.fontFamily} />
    </main>
  );
}

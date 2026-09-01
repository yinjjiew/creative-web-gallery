import type { Metadata } from "next";
import { Newsreader } from "next/font/google";

import Sheet from "./Sheet";
import styles from "./growth.module.css";

const newsreader = Newsreader({
  subsets: ["latin"],
  display: "swap",
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "Growth — a closed line, lengthening",
  description:
    "Differential line growth drawn with a single plotter pen. A closed curve " +
    "lengthens, refuses to occupy itself, and folds until there is no room left. " +
    "Tone is density. Hold to pull the line.",
};

export default function GrowthPage() {
  return (
    <main className={`${newsreader.className} ${styles.page}`}>
      <Sheet />
    </main>
  );
}

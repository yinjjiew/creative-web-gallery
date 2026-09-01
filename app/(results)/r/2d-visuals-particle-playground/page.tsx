import type { Metadata } from "next";
import { Old_Standard_TT } from "next/font/google";

import Plate from "./Plate";
import styles from "./plate.module.css";

const face = Old_Standard_TT({
  weight: ["400", "700"],
  style: ["normal", "italic"],
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Filings — iron on paper over magnets",
  description:
    "Tens of thousands of iron filings on a sheet of paper. Each one is an " +
    "induced dipole in the linear superposition of the magnets underneath. " +
    "Drag a bar. Flip a pole. Unlike ends join; like ends leave a null.",
};

export default function FilingsPage() {
  return (
    <main className={`${face.className} ${styles.page}`}>
      <Plate fontFamily={face.style.fontFamily} />
    </main>
  );
}

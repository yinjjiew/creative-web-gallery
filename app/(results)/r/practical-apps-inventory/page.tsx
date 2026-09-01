import type { Metadata } from "next";
import { Red_Hat_Mono, Source_Serif_4 } from "next/font/google";

import App from "./App";
import s from "./stockroom.module.css";

/**
 * Source Serif 4 is the stores ledger — chemical names and the one question
 * on the wall. Red Hat Mono is every mass, CAS number, cabinet plate and
 * gram in the audit: the face of a label maker, not a product heading.
 */
const ledger = Source_Serif_4({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
  variable: "--sr-ledger",
});

const plate = Red_Hat_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--sr-plate",
});

export const metadata: Metadata = {
  title: "Stockroom — teaching stores",
  description:
    "A university teaching-lab stockroom where compatibility and capacity are enforced, demand comes from the timetable, and the audit trail of every controlled gram survives a regulator.",
};

export default function Page() {
  return (
    <div className={`${ledger.variable} ${plate.variable} ${s.root}`}>
      <App />
    </div>
  );
}

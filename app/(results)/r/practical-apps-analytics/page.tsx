import type { Metadata } from "next";
import { Bricolage_Grotesque, Source_Serif_4 } from "next/font/google";

import Shelf from "./Shelf";
import s from "./shelf.module.css";

/**
 * Source Serif 4 is the jacket and the Sunday question — a book face that
 * still holds at 15px on a packing-bench phone. Bricolage Grotesque is the
 * stockroom: metres, slot counts, the Monday stamp. They should not swap.
 */
const read = Source_Serif_4({
  subsets: ["latin"],
  display: "swap",
  style: ["normal", "italic"],
  variable: "--sh-read",
});

const mark = Bricolage_Grotesque({
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
  variable: "--sh-mark",
});

export const metadata: Metadata = {
  title: "Shelf — Sunday at Quire",
  description:
    "Twenty minutes on a Sunday: which slow titles go back, whether poetry earns its metre, and which books only ever sell face-out. Shelf space is the scarce resource. The till cannot see the shelf.",
};

export default function Page() {
  return (
    <div className={`${read.variable} ${mark.variable} ${s.root}`}>
      <Shelf />
    </div>
  );
}

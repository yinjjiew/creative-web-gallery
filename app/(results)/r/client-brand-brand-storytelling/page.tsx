import type { Metadata } from "next";
import { Courier_Prime, EB_Garamond } from "next/font/google";

import Library from "./library";

/**
 * EB Garamond for the argument and Courier Prime for the record.
 *
 * The pairing is the organisation rather than a mood: a seed library's own
 * paperwork is a nineteenth-century catalogue on one side and a typed index card
 * on the other, and the two faces keep the reading and the data visibly separate
 * — every date, count, price and label is typewritten, every sentence that is
 * trying to persuade you is set in a text face. Garamond also has proper
 * old-style figures, which is what a ledger of years wants.
 */
const text = EB_Garamond({
  subsets: ["latin"],
  style: ["normal", "italic"],
  display: "swap",
  variable: "--font-text",
});

const mark = Courier_Prime({
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
  variable: "--font-mark",
});

export const metadata: Metadata = {
  title: "Lost Varieties — Kirkwall Seed Library",
  description:
    "A variety only survives while someone is still growing it. Named vegetables with the year their record stops, why a seed bank is a rota rather than a shelf, open-pollinated and F1 hybrid seed treated fairly, and how to keep one variety yourself.",
};

export default function Page() {
  return (
    <main className={`${text.variable} ${mark.variable}`}>
      <Library />
    </main>
  );
}

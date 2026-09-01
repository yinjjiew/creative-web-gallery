import type { Metadata } from "next";
import { Libre_Caslon_Text, Roboto_Mono } from "next/font/google";

import Mount from "./Mount";

/**
 * Caslon is the English book face; a cash book is a book. Roboto Mono carries
 * every figure so a column of pence lines up without asking the serif for
 * tabular lining numbers it may not have.
 */
const serif = Libre_Caslon_Text({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  display: "swap",
  variable: "--run-serif",
});

const mono = Roboto_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
  variable: "--run-mono",
});

export const metadata: Metadata = {
  title: "Runway — Nell Farrar’s cash book",
  description:
    "A cash-flow book for a freelance illustrator: invoices as dated probable promises, tax as a floor under the account, and two questions — can she pay rent in March, and how much of a job is genuinely hers.",
};

export default function Page() {
  return (
    <div className={`${serif.variable} ${mono.variable}`}>
      <Mount />
    </div>
  );
}

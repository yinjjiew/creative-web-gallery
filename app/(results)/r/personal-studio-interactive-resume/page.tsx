import type { Metadata } from "next";
import { DM_Mono, Newsreader } from "next/font/google";

import Fit from "./Fit";

/**
 * Newsreader carries the claims. It is a reading face with a real italic, and
 * the italic is load-bearing here: her framing is set in it and her claims are
 * not, so the difference between a fact and an opinion about a fact is visible
 * at a glance and survives being photocopied.
 *
 * DM Mono carries everything that is machinery — dates, claim ids, relevance
 * marks, the ledger's arithmetic, the checksum. Keeping the apparatus in a
 * different voice from the record is the same argument made typographically.
 */
const serif = Newsreader({
  subsets: ["latin"],
  style: ["normal", "italic"],
  weight: ["300", "400", "500", "600"],
  display: "swap",
  variable: "--fit-serif",
});

const mono = DM_Mono({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  display: "swap",
  variable: "--fit-mono",
});

export const metadata: Metadata = {
  title: "Fit — one résumé, three readings",
  description:
    "Hana Bergström's twelve years in hardware, read for engineering, program management or operations. The same claims in every reading, reordered and re-emphasised but never rewritten, with a ledger of exactly what changed and a printable plain record.",
};

export default function Page() {
  return (
    <div className={`${serif.variable} ${mono.variable}`}>
      <Fit />
    </div>
  );
}

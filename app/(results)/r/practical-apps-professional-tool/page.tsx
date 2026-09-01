import type { Metadata } from "next";
import { Literata, Public_Sans } from "next/font/google";

import Mount from "./Mount";

/**
 * Two faces, split by whose words they are.
 *
 * Literata sets the student's writing and nothing else. It is a reading face
 * with a large x-height and sturdy serifs, built for screens, and the whole
 * premise of this tool is that she reads a hundred and twenty-four essays on
 * her own eyes — so the essay gets the comfortable face and the software does
 * not compete with it.
 *
 * Public Sans carries the marker's side: labels, marks, totals, her comments.
 * It is a plain institutional grotesque with proper tabular figures, which a
 * column of marks out of six needs if it is to be scanned rather than read.
 */
const script = Literata({
  subsets: ["latin"],
  style: ["normal", "italic"],
  display: "swap",
  axes: ["opsz"],
  variable: "--mk-script",
});

const ui = Public_Sans({
  subsets: ["latin"],
  style: ["normal", "italic"],
  display: "swap",
  variable: "--mk-ui",
});

export const metadata: Metadata = {
  title: "Marking — 124 essays, one question, five strands",
  description:
    "A marking desk for a secondary English teacher: a fixed rubric, a comment bank that will not fire until it has something from this script in it, anchors drawn from her own earlier decisions, blind second readings to catch her own drift, and a moderation record she can reconstruct months later. It does not mark anything.",
};

export default function Page() {
  return (
    <div className={`${script.variable} ${ui.variable}`}>
      <Mount />
    </div>
  );
}

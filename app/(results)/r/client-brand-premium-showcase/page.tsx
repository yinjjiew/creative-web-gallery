import type { Metadata } from "next";

import Mill from "./Mill";
import { fontClass } from "./fonts";
import { TOTAL_COATS } from "./data/lots";

/**
 * Ardnamurchan Woollens — the Single Flock Coat.
 *
 * The brief's audience has been inoculated against craft language, so the site
 * has no craft language in it. What it has instead is a record: four named
 * flocks, one clip, dated stages, weights that reconcile from the flock to the
 * coat, a cost sheet down to the buttons, a register of the mill's own faults,
 * and a coat you can look up by the number sewn inside it. Every persuasive
 * move on the page is something a competitor cannot copy by writing better
 * sentences.
 *
 * This file is a server component so that the page can carry metadata; the
 * document itself is a client component because choosing which lot you are
 * reading changes the whole record.
 */
export const metadata: Metadata = {
  title: "Ardnamurchan Woollens — the Single Flock Coat",
  description: `One flock, one farm, one season's clip, traceable back to it. ${String(TOTAL_COATS)} coats from the 2026 clip at £1,100. Four named flocks, the route from fleece to cloth, the trade-off, and repair for as long as the coat exists.`,
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  // A page of tables and figures. Pinch zoom must work.
  maximumScale: 5,
  userScalable: true,
};

export default function Page() {
  return (
    <div className={fontClass}>
      <Mill />
    </div>
  );
}

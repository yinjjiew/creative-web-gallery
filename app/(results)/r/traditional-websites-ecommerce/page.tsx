import type { Metadata } from "next";

import Cuttle from "./Cuttle";
import { fontClass } from "./fonts";

/**
 * Cuttle — a 140-year-old ironmonger.
 *
 * The brief's real problem is two opposite customers sharing one catalogue
 * of things that look identical and are not. This file is a server wrapper
 * so the page can carry metadata; the shop itself is a client because the
 * first gesture (trade or ask) has to change the page.
 */
export const metadata: Metadata = {
  title: "Cuttle — Ironmonger, est. 1886",
  description:
    "Trade counter and ask-the-counter for four thousand two hundred fixings. Sheep Street, Kettleton. A modelled catalogue. Nothing can be ordered.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export default function Page() {
  return (
    <div className={fontClass}>
      <Cuttle />
    </div>
  );
}

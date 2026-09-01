import type { Metadata } from "next";

import Natt from "./Natt";
import { fontClass } from "./fonts";

/**
 * NATT — go to sleep here, wake up there.
 *
 * The audience already knows the flight is faster and cheaper. The page
 * refuses that fight. You pull the night through a two-berth compartment:
 * Brussels evening becomes Berlin morning in the same window, and the pocket
 * under the glass is the working service — berth, bill, border, breakfast —
 * not a second website underneath a mood film.
 */
export const metadata: Metadata = {
  title: "NATT — Go to sleep here. Wake up there.",
  description:
    "A night train from Brussels to Berlin. Eleven hours, a two-berth compartment, dinner, a bunk that is honestly narrow. The flight is faster. This is the night.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: "#2a221c",
};

export default function Page() {
  return (
    <div className={fontClass}>
      <Natt />
    </div>
  );
}

import type { Metadata } from "next";

import Kestrel from "./Kestrel";
import { fontClass } from "./fonts";

/**
 * Kestrel — the Kestrel One.
 *
 * The brief's finding is that the seven-year delay is a design problem: the
 * category's own visual language tells people that hearing loss is shameful.
 * Glasses already made the move from medical appliance to object of taste.
 * This page borrows the register of a watch or a pair of spectacles — a metal
 * chosen the way a case is chosen — and keeps the clinical claims modest
 * enough that a sceptical person over fifty will not leave.
 *
 * Accessibility is not a layer. The audience's eyes are why they are here.
 * Type is large, contrast is ink-on-stone, targets are 52px, and pinch zoom
 * is left alone.
 *
 * This file is a server component so the page can carry metadata. The document
 * itself is a client component because choosing a finish, a seat at the table,
 * and a fitting all live in the browser.
 */
export const metadata: Metadata = {
  title: "Kestrel — the Kestrel One",
  description:
    "Seven years is a long time to miss things. A hearing aid designed to be seen: machined titanium and brass, worn openly at the ear. Finishes, fit, crowded rooms, price, and how to book a fitting.",
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
      <Kestrel />
    </div>
  );
}

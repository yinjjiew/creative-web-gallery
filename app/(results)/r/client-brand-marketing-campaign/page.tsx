import type { Metadata } from "next";

import Hour from "./Hour";
import { fontClass } from "./fonts";

/**
 * One Hour — a national blood service, first-time donors 18–25.
 *
 * The brief's finding is that this audience is not opposed and not squeamish
 * in any decisive way. They have never had a reason to go this week rather
 * than eventually. Urgency and guilt have been the category's only tools, and
 * the audience is immune to both. The page therefore spends its surface on
 * the hour itself — including the needle, including the eligibility confusion
 * that causes most drop-off — and keeps ineligible visitors inside the piece
 * as people who can still bring someone.
 *
 * This file is a server component so the page can carry metadata. The document
 * is a client component because walking the hour, checking eligibility, booking
 * a slot and writing a message all live in the browser. Nothing is sent.
 */
export const metadata: Metadata = {
  title: "One Hour — National Blood Service",
  description:
    "It takes an hour. You have an hour. Exactly what happens when you give blood, including the needle, who can and cannot go this week, and how to book or bring someone.",
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
      <Hour />
    </div>
  );
}

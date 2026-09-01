import type { Metadata } from "next";

import City from "./City";
import { fontClass } from "./fonts";

/**
 * Open City — one weekend, get inside.
 * Server wrapper for metadata only. Do not put next/dynamic here.
 */
export const metadata: Metadata = {
  title: "Open City — One weekend. Get inside.",
  description:
    "A hundred and eighty buildings open for one weekend. The problem is not finding them. It is building a route that still works at four o'clock in the rain.",
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
      <City />
    </div>
  );
}

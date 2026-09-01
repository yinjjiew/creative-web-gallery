import type { Metadata } from "next";

import { fontClass } from "./fonts";
import s from "./docs.module.css";

export const metadata: Metadata = {
  title: "Instant",
  description:
    "Documentation for Instant, a library for dates, times, and timezones.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export default function InstantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className={`${fontClass} ${s.root}`}>{children}</div>;
}

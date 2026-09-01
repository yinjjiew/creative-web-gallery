import type { Metadata } from "next";

import { fontClass } from "./fonts";
import s from "./works.module.css";

export const metadata: Metadata = {
  title: "Works",
  description:
    "A quarterly on the built systems that make ordinary life possible — reported, not opinionated.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export default function WorksLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className={`${fontClass} ${s.root}`}>{children}</div>;
}

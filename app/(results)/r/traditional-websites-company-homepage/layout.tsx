import type { Metadata } from "next";

import { fontClass } from "./fonts";
import s from "./leckie.module.css";

export const metadata: Metadata = {
  title: {
    default: "Leckie — wind tunnels, Cardington",
    template: "%s — Leckie",
  },
  description:
    "Leckie Limited, Cardington. We design and build wind tunnels. Two to four years. Three jobs on the floor. Established 1964.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export default function LeckieLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className={`${fontClass} ${s.root}`}>{children}</div>;
}

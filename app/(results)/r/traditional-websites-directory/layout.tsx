import type { Metadata } from "next";

import { fontClass } from "./fonts";
import s from "./reaches.module.css";

export const metadata: Metadata = {
  title: {
    default: "Reaches — a register of outdoor swimming",
    template: "%s — Reaches",
  },
  description:
    "A modelled directory of rivers, lakes, lidos, tidal pools and coast. Hazard is unmissable. A blank is not safety.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export default function ReachesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className={`${fontClass} ${s.root}`}>{children}</div>;
}

import type { Metadata } from "next";

import { fontClass } from "./fonts";
import s from "./rota.module.css";

export const metadata: Metadata = {
  title: {
    default: "Rota — payroll and the rota, for independent restaurants",
    template: "%s — Rota",
  },
  description:
    "Payroll and the rota for one restaurant or four. Tip pools, late swaps, young workers, and people who want a cheque on Friday. A modelled company.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export default function RotaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className={`${fontClass} ${s.root}`}>{children}</div>;
}

import type { Metadata } from "next";

import { Clinic } from "./Clinic";
import { fontClass } from "./fonts";
import s from "./duty.module.css";

export const metadata: Metadata = {
  title: "Duty — free legal advice, Ormside",
  description:
    "Free help with housing, debt, benefits and work. If you have a letter, start here. Call 01632 960 441. This is general information, not advice on your case.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export default function Page() {
  return (
    <div className={`${fontClass} ${s.root}`}>
      <Clinic />
    </div>
  );
}

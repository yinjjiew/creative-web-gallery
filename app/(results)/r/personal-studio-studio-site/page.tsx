import type { Metadata, Viewport } from "next";
import { Red_Hat_Text, Vollkorn } from "next/font/google";

import Bench from "./Bench";
import s from "./bench.module.css";

/**
 * Vollkorn carries the reasons. It is a sturdy text face with a real italic
 * and a slightly rustic texture — closer to a shop note than to a fashion
 * grotesque — which is the voice of a studio that makes unfashionable objects
 * meant to last decades.
 *
 * Red Hat Text is the apparatus: form numbers, names, the procurement column.
 * It is a little wide and does not charm, which is what a label on a foam
 * model should do.
 */
const text = Vollkorn({
  subsets: ["latin"],
  display: "swap",
  style: ["normal", "italic"],
  weight: ["400", "500", "600"],
  variable: "--face-text",
});

const label = Red_Hat_Text({
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600"],
  variable: "--face-label",
});

export const metadata: Metadata = {
  title: "Bench — four people, Attercliffe",
  description:
    "An industrial design studio that sells its judgement by showing what it killed: the foam models, the elegant idea, the test that failed. Tools, instruments, and furniture for institutions.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#d5cfc0",
};

export default function Page() {
  return (
    <div className={`${text.variable} ${label.variable} ${s.root}`}>
      <Bench />
    </div>
  );
}

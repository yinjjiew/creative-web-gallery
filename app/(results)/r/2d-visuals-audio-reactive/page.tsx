import type { Metadata } from "next";
import { Gentium_Book_Plus, Red_Hat_Mono } from "next/font/google";

import Field from "./Field";
import styles from "./formant.module.css";

/**
 * Gentium is the linguist's face — it was cut to hold IPA without apology.
 * Red Hat Mono is the instrument: F1 and F2 have to line up as numbers.
 */
const serif = Gentium_Book_Plus({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "700"],
  style: ["normal", "italic"],
  display: "swap",
});

const mono = Red_Hat_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Formant — a vowel is a place",
  description:
    "Linear predictive coding maps the resonances of the vocal tract onto the " +
    "classic F1–F2 plane. The same vowel lands in the same place, whether you " +
    "sing it or the page synthesises it. Nothing is sent anywhere.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#e4ddd0",
};

export default function Page() {
  return (
    <main
      className={`${styles.page} ${serif.className}`}
      style={
        {
          "--serif": serif.style.fontFamily,
          "--mono": mono.style.fontFamily,
        } as React.CSSProperties
      }
    >
      <Field />
    </main>
  );
}

import type { Metadata } from "next";
import { IBM_Plex_Mono, Newsreader } from "next/font/google";

import App from "./App";
import s from "./desk.module.css";

/**
 * Newsreader is the file: optical sizes, a literary face that still holds at
 * 15px on a phone. IBM Plex Mono is the clocks — weeks out, exclusive expiry,
 * an offer's reply-by — which are not literary and should not pretend to be.
 */
const read = Newsreader({
  subsets: ["latin"],
  display: "swap",
  style: ["normal", "italic"],
  variable: "--sub-read",
});

const stamp = IBM_Plex_Mono({
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500"],
  variable: "--sub-stamp",
});

export const metadata: Metadata = {
  title: "Submissions — Kerr Literary",
  description:
    "A literary agent's memory: what she knows about a person and what happened last time. Rejections kept as intelligence, relationships that follow the editor, and a copy the author is allowed to see.",
};

export default function Page() {
  return (
    <div className={`${read.variable} ${stamp.variable} ${s.root}`}>
      <App />
    </div>
  );
}

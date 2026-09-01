import type { Metadata } from "next";
import { JetBrains_Mono, Newsreader } from "next/font/google";

import { Lamp } from "@/components/Lamp";
import { Masthead } from "@/components/Masthead";
import { overallProgress } from "@/lib/tasks";

import "./gallery.css";

/**
 * One of two root layouts. This one owns the gallery's typography and palette;
 * `app/(results)/layout.tsx` deliberately shares none of it, so that a built
 * result can establish its own visual language without inheriting the
 * catalogue's. Crossing between the two triggers a full page load, which is
 * correct here — a result is a separate piece of work, not a subview.
 */
const text = Newsreader({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-text",
  axes: ["opsz"],
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-mono",
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: {
    default: "Creative Web Reference Gallery",
    template: "%s — Creative Web Reference Gallery",
  },
  description:
    "A catalogue of task prompts and reference implementations across nine application settings of the creative web.",
  robots: { index: false, follow: false },
};

export default function GalleryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { complete, total } = overallProgress();

  return (
    <html lang="en" className={`${text.variable} ${mono.variable}`}>
      <body>
        <Lamp />
        <Masthead complete={complete} total={total} />
        <main id="main">{children}</main>
        <footer className="shell" style={{ padding: "4rem var(--gutter) 3rem" }}>
          <hr className="rule" />
          <p
            className="mono"
            style={{ color: "var(--faint)", paddingTop: "1.25rem" }}
          >
            Move the lamp. Open a plate. {complete} of {total} are live.
          </p>
        </footer>
      </body>
    </html>
  );
}

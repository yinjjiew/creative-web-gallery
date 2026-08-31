import type { Metadata } from "next";

/**
 * The second root layout, and deliberately almost empty.
 *
 * Section 9 of the specification forbids the results from sharing a navbar,
 * hero, card design, fonts, palette, transitions or layout. The cleanest way to
 * guarantee that is structural rather than disciplinary: this layout declares no
 * font, imports no stylesheet, and renders no chrome, so a result inherits
 * nothing it did not choose. Each result brings its own typography and its own
 * reset.
 *
 * The only thing established here is that a result occupies the full viewport
 * and that its own scroll behaviour is its own business.
 */
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  // Results include drag, pinch-sensitive canvases and games. Letting the page
  // itself zoom on a double tap would break them; individual results that want
  // pinch zoom can re-enable it.
  maximumScale: 1,
};

export default function ResultsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body style={{ margin: 0 }}>{children}</body>
    </html>
  );
}

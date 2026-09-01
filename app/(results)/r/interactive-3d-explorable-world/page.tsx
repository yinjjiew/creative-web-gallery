import type { Metadata, Viewport } from "next";

import Faro from "./Faro";

export const metadata: Metadata = {
  title: "Faro — a skerry light",
  description:
    "A modelled miniature of a rock lighthouse in the Norwegian Sea. Turn it in your hands. Night is the point.",
};

/**
 * Pinch on the canvas is how you step closer to the rock. The page must not
 * steal that gesture for browser zoom.
 */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function Page() {
  return <Faro />;
}

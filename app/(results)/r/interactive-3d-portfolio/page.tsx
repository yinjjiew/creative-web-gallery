import type { Metadata } from "next";

import FlatFile from "./FlatFile";

export const metadata: Metadata = {
  title: "Holm — Flat File",
  description:
    "Print work in a plan chest. Pull a drawer, lift a piece to the light table, and see it at true relative scale.",
};

export default function Page() {
  return <FlatFile />;
}

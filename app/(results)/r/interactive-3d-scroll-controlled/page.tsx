import type { Metadata } from "next";

import Core from "./Core";

export const metadata: Metadata = {
  title: "Core — a section through deep time",
  description:
    "Scroll down. Depth is time. The metres are logarithmic; a steel rod beside the core is not.",
};

export default function Page() {
  return <Core />;
}

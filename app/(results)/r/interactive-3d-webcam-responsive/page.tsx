import type { Metadata } from "next";

import Timid from "./Timid";

export const metadata: Metadata = {
  title: "Timid — a hide",
  description:
    "A shy cave salamander that can feel you through the camera. Sudden motion startles it. Patience is rewarded. All sensing stays on this machine.",
};

export default function Page() {
  return <Timid />;
}

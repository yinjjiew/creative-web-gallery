import type { Metadata } from "next";

import Leva from "./Leva";

export const metadata: Metadata = {
  title: "Leva — a manual lever espresso machine",
  description:
    "Pull the lever yourself and watch the pressure curve you make. A launch page for a direct-lever espresso machine.",
};

export default function Page() {
  return <Leva />;
}

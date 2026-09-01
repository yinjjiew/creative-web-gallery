import type { Metadata } from "next";

import Occupants from "./Occupants";

export const metadata: Metadata = {
  title: "Occupants",
  description:
    "One corner of one room, 1962 to 2024. The camera does not move. Time does.",
};

export default function Page() {
  return <Occupants />;
}

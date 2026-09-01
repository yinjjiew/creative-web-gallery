import type { Metadata } from "next";

import Neap from "./Neap";

export const metadata: Metadata = {
  title: "Neap",
  description:
    "A hanging of shore things in equilibrium. Touch a leaf and the impulse travels the armature.",
};

export default function Page() {
  return <Neap />;
}

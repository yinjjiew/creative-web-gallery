import type { Metadata } from "next";

import Slab from "./Slab";

export const metadata: Metadata = {
  title: "Slab — Japan Trench",
  description:
    "Earthquake hypocentres under the Japan Trench. The map is a smear; the section is a plate.",
};

export default function Page() {
  return <Slab />;
}

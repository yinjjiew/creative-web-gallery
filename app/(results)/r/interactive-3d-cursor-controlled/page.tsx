import type { Metadata } from "next";

import Anamorph from "./Anamorph";

export const metadata: Metadata = {
  title: "Anamorph",
  description:
    "A hanging cast of plaster and iron that holds as a face from one viewpoint. The cursor is the eye.",
};

export default function Page() {
  return <Anamorph />;
}

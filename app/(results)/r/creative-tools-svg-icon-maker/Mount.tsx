"use client";

/**
 * The foundry is a client instrument: pointer capture on the plate, clipboard
 * writes, and object-URL downloads. `ssr: false` is not permitted from a
 * Server Component, so this file is the one-line client boundary.
 */
import dynamic from "next/dynamic";

import s from "./foundry.module.css";

const Foundry = dynamic(() => import("./Foundry"), {
  ssr: false,
  loading: () => (
    <div className={s.booting} role="status">
      Dressing the stone
    </div>
  ),
});

export default function Mount() {
  return <Foundry />;
}

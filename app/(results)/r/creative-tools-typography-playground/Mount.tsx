"use client";

/**
 * The bench measures glyph boxes, runs a frame loop, and writes variation
 * settings onto live letters. None of that belongs in prerender, so the
 * instrument loads only on the client.
 */
import dynamic from "next/dynamic";

import s from "./bench.module.css";

const Bench = dynamic(() => import("./Bench"), {
  ssr: false,
  loading: () => (
    <div className={s.booting} role="status">
      Casting the line
    </div>
  ),
});

export default function Mount() {
  return <Bench />;
}

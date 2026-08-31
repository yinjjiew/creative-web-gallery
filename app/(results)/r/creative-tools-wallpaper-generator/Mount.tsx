"use client";

/**
 * The press is entirely a canvas instrument: it measures its own bed with a
 * ResizeObserver, reads pixels back off the preview, and writes a full-panel
 * PNG. None of that has any meaning on the server, so it is loaded on the
 * client only. `ssr: false` is not permitted in a Server Component, which is
 * why this one-line client boundary exists between the page and the tool.
 */
import dynamic from "next/dynamic";

import s from "./press.module.css";

const Press = dynamic(() => import("./Press"), {
  ssr: false,
  loading: () => (
    <div className={s.booting} role="status">
      Warming the drum
    </div>
  ),
});

export default function Mount() {
  return <Press />;
}

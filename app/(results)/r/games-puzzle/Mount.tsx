"use client";

import dynamic from "next/dynamic";

import s from "./tide.module.css";

/**
 * The chart, the tide cycle and the synthesizer all belong on the client.
 * Keeping the server render to an empty sheet avoids prerendering a canvas
 * of state that does not exist yet.
 */
const Tide = dynamic(() => import("./Tide"), {
  ssr: false,
  loading: () => (
    <div className={s.sheet} aria-busy="true">
      <header className={s.mast}>
        <div className={s.brand}>
          <div className={s.kicker}>Admiralty · modelled cycle</div>
          <h1 className={s.title}>Tide</h1>
        </div>
      </header>
    </div>
  ),
});

export default function Mount() {
  return <Tide />;
}

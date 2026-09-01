"use client";

/**
 * The bench runs a frame loop, captures pointers, and opens an AudioContext.
 * None of that belongs in prerender, so the instrument loads only on the client.
 * The loading shell already carries the thesis, so a slow chunk is still a page.
 */
import dynamic from "next/dynamic";

import s from "./actuator.module.css";

function Boot() {
  return (
    <div className={s.shell}>
      <header className={s.mast}>
        <h1 className={s.brand}>Actuator</h1>
        <p className={s.lede}>
          A control&apos;s quality is almost never in its radius. It is in{" "}
          <strong>travel</strong>, the force before it gives, the hill at
          commitment, the settle afterwards, and the sound that marks the
          crossing. This bench authors that. The plunger is the design — press
          it with a pointer or the keyboard. The family shares the same spring,
          so a whole interface can feel like one hand built it. Disabled and
          busy are part of the recipe. The click is synthesized: a noise tick, a
          damped triangle, a short partial. Export is that same integrator, not
          a picture of a button.
        </p>
      </header>
      <div className={s.booting} role="status">
        Seating the spring
      </div>
    </div>
  );
}

const Bench = dynamic(() => import("./Bench"), {
  ssr: false,
  loading: () => <Boot />,
});

export default function Mount() {
  return <Bench />;
}

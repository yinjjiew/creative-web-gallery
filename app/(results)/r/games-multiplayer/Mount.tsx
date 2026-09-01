"use client";

import dynamic from "next/dynamic";

import s from "./slalom.module.css";

/**
 * Fixed-step physics, a canvas and a Web Audio graph. None of that should run
 * during prerender, and a software rasteriser does not want this in a shared
 * chunk either.
 */
const Slalom = dynamic(() => import("./Slalom"), {
  ssr: false,
  loading: () => <div className={s.wrap} aria-busy="true" />,
});

export default function Mount() {
  return <Slalom />;
}

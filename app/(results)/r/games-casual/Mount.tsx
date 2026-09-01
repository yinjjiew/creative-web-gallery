"use client";

import dynamic from "next/dynamic";

import s from "./skip.module.css";

/**
 * The lake is a canvas, a fixed-step skip model and a Web Audio graph.
 * None of that should run during prerender.
 */
const Skip = dynamic(() => import("./Skip"), {
  ssr: false,
  loading: () => <div className={s.wrap} aria-busy="true" />,
});

export default function Mount() {
  return <Skip />;
}

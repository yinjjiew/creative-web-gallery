"use client";

import dynamic from "next/dynamic";

import s from "./semaphore.module.css";

/**
 * The box is a canvas, a fixed-step lever frame and a Web Audio graph.
 * None of that should run during prerender.
 */
const Box = dynamic(() => import("./Box"), {
  ssr: false,
  loading: () => <div className={s.wrap} aria-busy="true" />,
});

export default function Mount() {
  return <Box />;
}

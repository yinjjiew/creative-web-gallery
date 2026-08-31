"use client";

import dynamic from "next/dynamic";

import s from "./trapeze.module.css";

/**
 * The game is a canvas, a fixed-step simulation and a Web Audio graph, none of
 * which have any business running during a prerender. Loading it client-side
 * only keeps the server render to an empty stage.
 */
const Trapeze = dynamic(() => import("./Trapeze"), {
  ssr: false,
  loading: () => <div className={s.wrap} aria-busy="true" />,
});

export default function Mount() {
  return <Trapeze />;
}

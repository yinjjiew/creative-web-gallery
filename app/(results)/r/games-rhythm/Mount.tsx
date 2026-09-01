"use client";

import dynamic from "next/dynamic";

import s from "./anvil.module.css";

/**
 * The shop is a canvas, an audio-clock scheduler and a WebGL piece.
 * None of that should run during prerender.
 */
const Anvil = dynamic(() => import("./Anvil"), {
  ssr: false,
  loading: () => <div className={s.wrap} aria-busy="true" />,
});

export default function Mount() {
  return <Anvil />;
}

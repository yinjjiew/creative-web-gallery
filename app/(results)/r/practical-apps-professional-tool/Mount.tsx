"use client";

import dynamic from "next/dynamic";

import s from "./marking.module.css";

/**
 * Everything here reads localStorage on first paint and lays the sample history
 * down against the current wall clock, so a server render would either be wrong
 * or would have to be thrown away. Loading client-side only keeps the prerender
 * to an empty desk and removes any possibility of a hydration mismatch between
 * a document that exists on this machine and one that does not exist on the
 * server.
 */
const Desk = dynamic(() => import("./App"), {
  ssr: false,
  loading: () => <div className={s.booting} aria-busy="true" />,
});

export default function Mount() {
  return <Desk />;
}

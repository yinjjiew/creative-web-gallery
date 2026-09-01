"use client";

import dynamic from "next/dynamic";

import s from "./peri.module.css";

/**
 * Placements are read from localStorage against a modelled term. A server
 * render would either invent an empty desk or disagree with this browser,
 * so the desk mounts only on the client.
 */
const Desk = dynamic(() => import("./App"), {
  ssr: false,
  loading: () => <div className={s.booting} aria-busy="true" />,
});

export default function Mount() {
  return <Desk />;
}

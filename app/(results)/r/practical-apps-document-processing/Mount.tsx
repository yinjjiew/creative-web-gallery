"use client";

import dynamic from "next/dynamic";

import s from "./register.module.css";

/**
 * The desk reads and writes localStorage. A server render would invent a
 * sitting that this machine does not have, so the work stays client-only.
 */
const Desk = dynamic(() => import("./App"), {
  ssr: false,
  loading: () => <div className={s.booting} aria-busy="true" />,
});

export default function Mount() {
  return <Desk />;
}

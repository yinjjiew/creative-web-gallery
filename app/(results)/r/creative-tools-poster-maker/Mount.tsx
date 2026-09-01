"use client";

/**
 * The desk is a canvas instrument: it measures its stage, treats a still,
 * and writes a full-resolution PNG. None of that belongs on the server.
 * `ssr: false` is not permitted in a Server Component, so this client
 * boundary sits between the page and the tool.
 */
import dynamic from "next/dynamic";

import s from "./desk.module.css";

const Desk = dynamic(() => import("./Desk"), {
  ssr: false,
  loading: () => (
    <div className={s.booting} role="status">
      Clearing the board
    </div>
  ),
});

export default function Mount() {
  return <Desk />;
}

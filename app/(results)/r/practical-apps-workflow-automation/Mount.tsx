"use client";

import App from "./App";

/**
 * The board is a client component so the sitting can live on this phone.
 * It is not behind next/dynamic: there is no WebGL, and a blank boot
 * screen is the wrong first paint for a volunteer on a slow handset.
 */
export default function Mount() {
  return <App />;
}

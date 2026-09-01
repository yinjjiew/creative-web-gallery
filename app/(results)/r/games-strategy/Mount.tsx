"use client";

import Levee from "./Levee";

/**
 * The sheet is SVG and a heightfield, not a WebGL scene, so it can mount
 * with the rest of the client tree. A loading plate here was reading as a
 * stub on a phone, where the first paint is the whole of the evidence.
 */
export default function Mount() {
  return <Levee />;
}

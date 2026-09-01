"use client";

/**
 * Client boundary only. The bench itself is the first paint so a short
 * screenshot is the instrument, not a boot screen. WebGL stays in
 * Surface's effect and never runs during prerender.
 */
import Bench from "./Bench";

export default function Mount() {
  return <Bench />;
}

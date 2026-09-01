"use client";

/**
 * The bench is a client tree: pointer loop, matchMedia, clipboard.
 * It is not WebGL, so it mounts directly — a delayed shell would be
 * the first frame the camera sees.
 */
import Desk from "./Desk";

export default function Mount() {
  return <Desk />;
}

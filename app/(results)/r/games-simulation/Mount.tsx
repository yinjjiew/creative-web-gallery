"use client";

import Kitchen from "./Kitchen";

/**
 * The jar canvas and the culture clock only run in effects. No WebGL, so
 * there is nothing that must be split behind next/dynamic.
 */
export default function Mount() {
  return <Kitchen />;
}

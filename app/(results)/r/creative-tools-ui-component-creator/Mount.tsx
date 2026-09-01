"use client";

/**
 * No WebGL, no prerender hazard — the desk is the page. Loading it through a
 * chunk would leave a boot shell in the first seconds, which is an inert page.
 */
import Desk from "./Desk";

export default function Mount() {
  return <Desk />;
}

"use client";

import { useEffect } from "react";

import { Shell } from "./Shell";
import { CONTENT } from "./pages";

export function App({ slug }: { slug: string }) {
  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (!hash) return;
    const el = document.getElementById(hash);
    el?.scrollIntoView({ block: "start" });
  }, [slug]);

  const Page = CONTENT[slug] ?? CONTENT[""];
  return (
    <Shell slug={slug}>
      <Page />
    </Shell>
  );
}

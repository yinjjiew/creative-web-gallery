"use client";

import dynamic from "next/dynamic";

/**
 * next/dynamic with ssr: false is a Client Component API. The page remains a
 * Server Component for fonts and metadata; this file is the boundary.
 */
const Chapter = dynamic(() => import("./chapter"), {
  ssr: false,
  loading: () => (
    <div style={{ minHeight: "100vh", background: "#e7e8e1" }} aria-hidden />
  ),
});

export default function Read() {
  return <Chapter />;
}

"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

import s from "./essay.module.css";

const Tree = dynamic(() => import("./tree"), {
  ssr: false,
  loading: () => <div className={s.treeHost} aria-hidden="true" />,
});

function hasWebGL(): boolean {
  if (typeof document === "undefined") return false;
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}

/** SVG stand-in so a machine without WebGL still sees the branching. */
function FlatTree({ depth }: { depth: number }) {
  const levels = Math.max(1, Math.min(depth, 6));
  const w = 320;
  const h = 180;
  const nodes: { x: number; y: number; i: number }[] = [];
  for (let i = 0; i < 2 ** levels - 1; i++) {
    const level = Math.floor(Math.log2(i + 1));
    const first = 2 ** level - 1;
    const offset = i - first;
    const slots = 2 ** level;
    nodes.push({
      x: ((offset + 0.5) / slots) * (w - 16) + 8,
      y: 14 + level * ((h - 28) / Math.max(1, levels - 1)),
      i,
    });
  }
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" height="100%" aria-hidden="true">
      {nodes.map((n) => {
        if (n.i === 0) return null;
        const p = nodes[Math.floor((n.i - 1) / 2)];
        return (
          <line
            key={`e${n.i}`}
            x1={p.x}
            y1={p.y}
            x2={n.x}
            y2={n.y}
            stroke="#14181c"
            strokeOpacity="0.35"
            strokeWidth="0.8"
          />
        );
      })}
      {nodes.map((n) => (
        <circle key={n.i} cx={n.x} cy={n.y} r="2.1" fill={n.i > 6 ? "#9c2b24" : "#14181c"} />
      ))}
    </svg>
  );
}

export default function TreeHost({
  depth,
  caption,
}: {
  depth: number;
  caption: string;
}) {
  const [gl, setGl] = useState<boolean | null>(null);
  useEffect(() => setGl(hasWebGL()), []);

  // Wait until after mount before loading the WebGL tree. Rendering <Tree />
  // while `gl` is still null starts a dynamic import during the first paint,
  // which is what was scheduling setState on a component that had not mounted.
  if (gl !== true) {
    return (
      <div className={s.treeHost} role="img" aria-label={caption}>
        <FlatTree depth={depth} />
        <span className={s.treeNote}>{caption}</span>
      </div>
    );
  }

  return <Tree depth={depth} caption={caption} />;
}

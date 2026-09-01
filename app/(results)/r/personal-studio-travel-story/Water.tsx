"use client";

import s from "./watershed.module.css";

export default function Water({
  top,
  bottom,
  phone,
}: {
  top: number;
  bottom: number;
  phone: boolean;
}) {
  const t = Math.max(3, top);
  const b = Math.max(3, bottom);
  const max = Math.max(t, b);

  if (phone) {
    return <div className={s.water} style={{ height: t }} aria-hidden />;
  }

  return (
    <div className={s.water} style={{ width: max }} aria-hidden>
      <svg
        className={s.waterShape}
        viewBox={`0 0 ${max} 100`}
        preserveAspectRatio="none"
      >
        <path d={`M 0 0 H ${t} L ${b} 100 H 0 Z`} fill="currentColor" />
      </svg>
    </div>
  );
}

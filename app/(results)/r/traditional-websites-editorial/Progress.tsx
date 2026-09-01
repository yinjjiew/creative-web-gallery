"use client";

import { useEffect, useState } from "react";

import s from "./works.module.css";

export function Progress() {
  const [p, setP] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const el = document.documentElement;
      const max = el.scrollHeight - el.clientHeight;
      setP(max <= 0 ? 0 : Math.min(1, el.scrollTop / max));
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className={s.progress} aria-hidden="true">
      <span style={{ width: `${p * 100}%` }} />
    </div>
  );
}

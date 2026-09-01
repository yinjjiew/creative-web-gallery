"use client";

/**
 * The stone is the design. Changing a rule changes the hand already on
 * the page. Export is that same hand, flattened to CSS and a module.
 */

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";

import { emitCss, emitJs, fileStem } from "./emit";
import Mark, { type MarkHandle } from "./Mark";
import Preview from "./Preview";
import s from "./pointer.module.css";
import {
  PRESETS,
  RANGES,
  TARGETS,
  cloneRecipe,
  detectTarget,
  freshBody,
  magnetPoint,
  nextShape,
  seedBody,
  stepBody,
  type Recipe,
  type Target,
} from "./system";

const TASK = "/tasks/creative-tools-cursor-theme-creator";
const REDUCED = "(prefers-reduced-motion: reduce)";
const COARSE = "(pointer: coarse)";
const DT = 1 / 120;

function useMedia(query: string, server = false): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const q = window.matchMedia(query);
      q.addEventListener("change", onChange);
      return () => q.removeEventListener("change", onChange);
    },
    () => window.matchMedia(query).matches,
    () => server
  );
}

function download(name: string, body: string, type: string) {
  const blob = new Blob([body], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

export default function Desk() {
  const reduced = useMedia(REDUCED);
  const coarse = useMedia(COARSE);
  const [recipe, setRecipe] = useState<Recipe>(() =>
    cloneRecipe(PRESETS.find((p) => p.id === "ledger") ?? PRESETS[0]!)
  );
  const [busy, setBusy] = useState(false);
  const [target, setTarget] = useState<Target>("rest");
  const [pressed, setPressed] = useState(false);
  const [moved, setMoved] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [pane, setPane] = useState<"css" | "js">("css");
  const [lag, setLag] = useState(0);

  const body = useRef(freshBody(0, 0));
  const mouse = useRef({ x: 0, y: 0 });
  const over = useRef<Element | null>(null);
  const angle = useRef(0);
  const spin = useRef(0);
  const visible = useRef(false);
  const seeded = useRef(false);
  const held = useRef(false);
  const recipeRef = useRef(recipe);
  const busyRef = useRef(busy);
  const pressedRef = useRef(false);
  const coarseRef = useRef(coarse);
  const mark = useRef<MarkHandle | null>(null);
  const lastUi = useRef({ target: "rest" as Target, lag: 0 });

  recipeRef.current = recipe;
  busyRef.current = busy;
  pressedRef.current = pressed;
  coarseRef.current = coarse;

  const css = useMemo(() => emitCss(recipe), [recipe]);
  const js = useMemo(() => emitJs(recipe), [recipe]);

  useEffect(() => {
    const root = document.documentElement;
    const hide = !coarse;
    if (hide) root.classList.add("idx-live");
    return () => {
      root.classList.remove("idx-live", "idx-text");
    };
  }, [coarse]);

  useEffect(() => {
    const root = document.documentElement;
    if (target === "text") root.classList.add("idx-text");
    else root.classList.remove("idx-text");
  }, [target]);

  useEffect(() => {
    let raf = 0;
    let acc = 0;
    let last = performance.now();

    const frame = (now: number) => {
      const dt = Math.min(0.048, (now - last) / 1000);
      last = now;
      acc += dt;
      const rec = recipeRef.current;
      const tgt = detectTarget(over.current, busyRef.current);
      const pull = magnetPoint(
        over.current,
        tgt,
        rec,
        mouse.current.x,
        mouse.current.y
      );
      while (acc >= DT) {
        stepBody(body.current, pull.x, pull.y, rec, DT, reduced);
        acc -= DT;
      }
      const spd = Math.hypot(body.current.vx, body.current.vy);
      if (rec.aim && spd > 40) {
        angle.current = (Math.atan2(body.current.vy, body.current.vx) * 180) / Math.PI;
      }
      if (tgt === "wait" && !reduced) spin.current += dt * 140;
      else if (tgt !== "wait") spin.current = 0;
      const rot =
        tgt === "wait" && !reduced
          ? spin.current
          : rec.aim
            ? angle.current
            : 0;
      const show =
        visible.current && (!coarseRef.current || held.current);
      mark.current?.paint(
        rec,
        tgt,
        pressedRef.current,
        show,
        body.current.x,
        body.current.y,
        rot
      );
      const nextLag = Math.min(
        999,
        Math.round(
          Math.hypot(body.current.x - mouse.current.x, body.current.y - mouse.current.y)
        )
      );
      if (tgt !== lastUi.current.target) {
        lastUi.current.target = tgt;
        setTarget(tgt);
      }
      if (nextLag !== lastUi.current.lag) {
        lastUi.current.lag = nextLag;
        setLag(nextLag);
      }
      raf = requestAnimationFrame(frame);
    };

    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [reduced]);

  const onMove = useCallback((e: PointerEvent) => {
    mouse.current.x = e.clientX;
    mouse.current.y = e.clientY;
    visible.current = true;
    over.current = document.elementFromPoint(e.clientX, e.clientY);
    if (!seeded.current) {
      seeded.current = true;
      seedBody(body.current, e.clientX, e.clientY);
      setMoved(true);
    }
  }, []);

  useEffect(() => {
    const down = (e: PointerEvent) => {
      held.current = true;
      if (e.pointerType === "mouse" || e.pointerType === "pen") {
        setPressed(true);
      }
      onMove(e);
    };
    const up = () => {
      held.current = false;
      setPressed(false);
    };
    const leave = () => {
      visible.current = false;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", down, { passive: true });
    window.addEventListener("pointerup", up, { passive: true });
    window.addEventListener("pointercancel", up, { passive: true });
    document.addEventListener("mouseleave", leave);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", down);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
      document.removeEventListener("mouseleave", leave);
    };
  }, [onMove]);

  function pick(preset: Recipe) {
    setRecipe(cloneRecipe(preset));
    setCopied(null);
  }

  function setDim(key: keyof typeof RANGES, value: number) {
    setRecipe((r) => ({ ...r, [key]: value }));
  }

  function cycleShape(id: Target) {
    setRecipe((r) => {
      const next = cloneRecipe(r);
      const cur = next.rules[id];
      const shape = nextShape(cur.shape);
      next.rules[id] = {
        ...cur,
        shape,
        magnet: shape === "native" ? false : cur.magnet,
        size: shape === "native" ? 0 : cur.size || 16,
      };
      return next;
    });
  }

  function toggleMagnet(id: Target) {
    setRecipe((r) => {
      if (r.rules[id].shape === "native") return r;
      const next = cloneRecipe(r);
      next.rules[id] = { ...next.rules[id], magnet: !next.rules[id].magnet };
      return next;
    });
  }

  async function copy(which: "css" | "js" | "both") {
    const text =
      which === "css" ? css : which === "js" ? js : `${css}\n${js}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(which);
      window.setTimeout(() => setCopied(null), 1400);
    } catch {
      setCopied(null);
    }
  }

  const stem = fileStem(recipe);
  const live = TARGETS.find((t) => t.id === target);

  return (
    <div
      className={s.desk}
      style={{ ["--idx-ink" as string]: recipe.ink }}
    >
      <style>{`
        html.idx-live, html.idx-live * { cursor: none !important; }
        html.idx-live.idx-text, html.idx-live.idx-text *,
        html.idx-live input:not([type="button"]):not([type="submit"]):not([type="reset"]):not([type="checkbox"]):not([type="radio"]):not([type="file"]),
        html.idx-live textarea, html.idx-live select,
        html.idx-live [contenteditable="true"], html.idx-live [data-ptr="text"] {
          cursor: text !important;
        }
        @media (pointer: coarse) {
          html.idx-live, html.idx-live * { cursor: auto !important; }
        }
      `}</style>

      <header className={s.head}>
        <h1 className={s.word}>
          Inde<span>x</span>
        </h1>
        <p className={s.thesis}>
          A pointer system is a grammar: weight, magnetism, and a rule per
          target. Proof it on a page. Export the same hand.
        </p>
        <Link className={s.task} href={TASK}>
          Task
        </Link>
      </header>

      <div
        className={s.systems}
        role="group"
        aria-label="Pointer systems"
        onKeyDown={(e) => {
          if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
          const i = PRESETS.findIndex((p) => p.id === recipe.id);
          if (i < 0) return;
          e.preventDefault();
          const n = e.key === "ArrowRight" ? i + 1 : i - 1;
          const next = PRESETS[(n + PRESETS.length) % PRESETS.length];
          if (next) pick(next);
        }}
      >
        {PRESETS.map((p) => (
          <button
            key={p.id}
            type="button"
            className={`${s.system} ${p.caution ? s.caution : ""}`}
            aria-pressed={recipe.id === p.id}
            onClick={() => pick(p)}
          >
            <span className={s.systemName}>{p.name}</span>
            <span className={s.systemNote}>{p.epithet}</span>
          </button>
        ))}
      </div>

      <div className={s.stage}>
        <div className={s.proofWrap}>
          <Preview recipe={recipe} busy={busy} onBusy={setBusy} />
        </div>

        <aside className={s.rail}>
          <section className={s.panel}>
            <h2>Weight</h2>
            <div className={s.dims}>
              {(
                [
                  ["mass", "Mass", (n: number) => n.toFixed(2)],
                  ["damping", "Damp", (n: number) => n.toFixed(2)],
                  ["magnetRadius", "Reach", (n: number) => `${Math.round(n)}px`],
                  ["magnetPull", "Pull", (n: number) => n.toFixed(2)],
                ] as const
              ).map(([key, label, fmt]) => (
                <div className={s.dim} key={key}>
                  <label htmlFor={`dim-${key}`}>{label}</label>
                  <input
                    id={`dim-${key}`}
                    type="range"
                    min={RANGES[key].min}
                    max={RANGES[key].max}
                    step={RANGES[key].step}
                    value={recipe[key]}
                    onChange={(e) => setDim(key, Number(e.target.value))}
                  />
                  <output htmlFor={`dim-${key}`}>{fmt(recipe[key])}</output>
                </div>
              ))}
            </div>
          </section>

          <section className={s.panel}>
            <h2>Per target</h2>
            <table className={s.rules}>
              <thead>
                <tr>
                  <th aria-hidden="true" />
                  <th>Target</th>
                  <th>Mark</th>
                  <th>Magnet</th>
                </tr>
              </thead>
              <tbody>
                {TARGETS.map((t) => {
                  const rule = recipe.rules[t.id];
                  const hot = target === t.id;
                  return (
                    <tr key={t.id} data-hot={hot ? "true" : "false"}>
                      <td className={s.hot} aria-hidden="true">
                        {hot ? "▸" : ""}
                      </td>
                      <td>
                        {t.label}
                        <span style={{ display: "block", fontSize: 9, letterSpacing: "0.08em", textTransform: "uppercase", opacity: 0.55 }}>
                          {t.hint}
                        </span>
                      </td>
                      <td>
                        <button
                          type="button"
                          className={s.shapeBtn}
                          onClick={() => cycleShape(t.id)}
                        >
                          {rule.shape}
                        </button>
                      </td>
                      <td>
                        <button
                          type="button"
                          className={s.ruleBtn}
                          onClick={() => toggleMagnet(t.id)}
                          disabled={rule.shape === "native"}
                          aria-pressed={rule.magnet}
                        >
                          {rule.shape === "native" ? "—" : rule.magnet ? "on" : "off"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </section>

          <section className={s.panel}>
            <h2>Export</h2>
            <div className={s.export}>
              <p style={{ fontFamily: "var(--serif)", fontSize: 14, lineHeight: 1.4, color: "var(--metal)" }}>
                Dependency-free. Drop {stem}.css and {stem}.js.{" "}
                {recipe.caution
                  ? "Haze is the style the other four leave. Text still keeps the caret."
                  : "Attach after the sheet. Text keeps the caret. Keyboard is not captured."}
              </p>
              <div className={s.exportBar}>
                <button
                  type="button"
                  className={s.exportBtn}
                  aria-pressed={pane === "css"}
                  onClick={() => setPane("css")}
                >
                  CSS
                </button>
                <button
                  type="button"
                  className={s.exportBtn}
                  aria-pressed={pane === "js"}
                  onClick={() => setPane("js")}
                >
                  JS
                </button>
                <button type="button" className={s.exportBtn} onClick={() => copy(pane)}>
                  {copied === pane ? "Copied" : "Copy"}
                </button>
                <button type="button" className={s.exportBtn} onClick={() => copy("both")}>
                  {copied === "both" ? "Copied" : "Copy both"}
                </button>
                <button
                  type="button"
                  className={s.exportBtn}
                  onClick={() => download(`${stem}.css`, css, "text/css")}
                >
                  Save CSS
                </button>
                <button
                  type="button"
                  className={s.exportBtn}
                  onClick={() =>
                    download(`${stem}.js`, js, "text/javascript")
                  }
                >
                  Save JS
                </button>
              </div>
              <textarea
                className={s.code}
                readOnly
                spellCheck={false}
                value={pane === "css" ? css : js}
                aria-label={pane === "css" ? "Exported CSS" : "Exported JavaScript"}
              />
            </div>
          </section>
        </aside>
      </div>

      <footer className={s.foot}>
        <span>
          Target <strong>{live?.label ?? "Rest"}</strong>
          {pressed ? " · press" : ""}
          {busy ? " · wait" : ""}
          {coarse ? " · coarse pointer" : ""}
          {reduced ? " · reduced motion" : ""}
        </span>
        <span>
          {moved
            ? `lag ${lag}px · ${recipe.aim ? "aimed" : "upright"}`
            : coarse
              ? "Touch a target. The rule lights."
              : "Move. The mark is the design."}
        </span>
      </footer>

      <Mark handleRef={mark} />
    </div>
  );
}

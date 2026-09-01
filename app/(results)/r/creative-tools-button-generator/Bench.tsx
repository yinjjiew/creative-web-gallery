"use client";

/**
 * The bench is the design. The plunger is not a preview of a button —
 * it is the control. Changing a dimension changes the spring the finger
 * is already pressing. Export is that same spring, flattened to a module.
 */

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";

import s from "./actuator.module.css";
import { makeClick, playClick, unlock, type Click } from "./click";
import { emitModule, emitPreview, emitRecipe, fileStem } from "./emit";
import {
  DEFAULT_RECIPE,
  DIMS,
  PRESETS,
  RANGES,
  clamp,
  clampRecipe,
  formatDim,
  matchPreset,
  travelPx,
  type Dim,
  type Recipe,
  type Role,
} from "./feel";
import { freshBody, holdProgress, step, type Body } from "./spring";

const TASK = "/tasks/creative-tools-button-generator";
const REDUCED = "(prefers-reduced-motion: reduce)";
const DT = 1 / 120;
const SCOPE_N = 240;

const FAMILY: { role: Role; label: string; hint: string }[] = [
  { role: "momentary", label: "Fire", hint: "Counts on commit" },
  { role: "latch", label: "Latch", hint: "Stays until the next press" },
  { role: "hold", label: "Hold", hint: "Stay past the scribe" },
  { role: "busy", label: "Busy", hint: "Locks after it fires" },
  { role: "dead", label: "Dead", hint: "Disabled on purpose" },
];

type Drive = {
  held: boolean;
  depth: number;
  originY: number;
  moved: boolean;
  ballistic: number;
};

type Slot = {
  role: Role;
  body: Body;
  drive: Drive;
  el: HTMLElement | null;
  hold: HTMLSpanElement | null;
};

type Sample = { t: number; x: number; mark: boolean };

type Metrics = {
  settle: number | null;
  peak: number;
  overshoot: number;
  presses: number;
};

function emptyDrive(): Drive {
  return { held: false, depth: 1, originY: 0, moved: false, ballistic: 0 };
}

function useReduced(): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const q = window.matchMedia(REDUCED);
      q.addEventListener("change", onChange);
      return () => q.removeEventListener("change", onChange);
    },
    () => window.matchMedia(REDUCED).matches,
    () => false
  );
}

function plotY(x: number, h: number): number {
  const u = (x + 0.04) / 1.12;
  return 8 + clamp(u, 0, 1) * (h - 16);
}

function makeSlots(): Slot[] {
  const roles: Role[] = ["momentary", ...FAMILY.map((f) => f.role)];
  return roles.map((role) => ({
    role,
    body: freshBody(),
    drive: emptyDrive(),
    el: null,
    hold: null,
  }));
}

export default function Bench() {
  const uid = useId();
  const reduced = useReduced();
  const [recipe, setRecipe] = useState<Recipe>(DEFAULT_RECIPE);
  const [muted, setMuted] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [counts, setCounts] = useState<number[]>(() => FAMILY.map(() => 0));
  const [metrics, setMetrics] = useState<Metrics>({
    settle: null,
    peak: 0,
    overshoot: 0,
    presses: 0,
  });

  const recipeRef = useRef(recipe);
  recipeRef.current = recipe;
  const mutedRef = useRef(muted);
  mutedRef.current = muted;
  const reducedRef = useRef(reduced);
  reducedRef.current = reduced;
  const slots = useRef<Slot[]>(makeSlots());
  const clickRef = useRef<Click | null>(null);
  const samples = useRef<Sample[]>([]);
  const polyRef = useRef<SVGPolylineElement>(null);
  const marksRef = useRef<SVGGElement>(null);
  const commitLineRef = useRef<SVGLineElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const scopeBox = useRef({ w: 320, h: 180 });
  const pressAt = useRef<number | null>(null);
  const peakX = useRef(0);
  const peakV = useRef(0);
  const settled = useRef(true);
  const lastPtr = useRef(0);

  const preset = matchPreset(recipe);
  const stroke = travelPx(recipe.travel);
  const unitTravel = Math.max(22, Math.round(stroke * 0.38));
  const moduleText = useMemo(() => emitModule(recipe), [recipe]);
  const preview = useMemo(() => emitPreview(recipe), [recipe]);

  const paintSlot = useCallback((slot: Slot, travel: number) => {
    const x = Math.max(0, slot.body.x);
    if (slot.el) {
      slot.el.style.transform = `translateY(${x * travel}px)`;
      const btn = slot.el.closest("button");
      if (btn && slot.role === "latch") {
        btn.setAttribute("aria-pressed", slot.body.latched ? "true" : "false");
      }
      if (btn && slot.role === "busy") {
        if (slot.body.busyLeft > 0) btn.setAttribute("aria-busy", "true");
        else btn.removeAttribute("aria-busy");
      }
    }
    if (slot.hold) {
      const p = slot.role === "hold" ? holdProgress(slot.body, recipeRef.current) : 0;
      slot.hold.style.height = `${(p * 100).toFixed(1)}%`;
    }
  }, []);

  const drawScope = useCallback(() => {
    const { w, h } = scopeBox.current;
    if (w < 8 || h < 8) return;
    const pts = samples.current;
    if (pts.length < 2) {
      polyRef.current?.setAttribute("points", "");
    } else {
      const t1 = pts[pts.length - 1].t;
      const span = Math.max(240, t1 - pts[0].t);
      const points = pts
        .map((p) => {
          const x = 8 + ((p.t - (t1 - span)) / span) * (w - 16);
          return `${x.toFixed(1)},${plotY(p.x, h).toFixed(1)}`;
        })
        .join(" ");
      polyRef.current?.setAttribute("points", points);
    }
    const y = plotY(recipeRef.current.commit, h);
    commitLineRef.current?.setAttribute("y1", y.toFixed(1));
    commitLineRef.current?.setAttribute("y2", y.toFixed(1));
    commitLineRef.current?.setAttribute("x2", (w - 8).toFixed(1));

    if (marksRef.current) {
      const t1 = pts.length ? pts[pts.length - 1].t : 0;
      const t0 = pts.length ? pts[0].t : 0;
      const span = Math.max(240, t1 - t0);
      const dots = pts.filter((p) => p.mark);
      marksRef.current.replaceChildren(
        ...dots.map((p) => {
          const c = document.createElementNS("http://www.w3.org/2000/svg", "circle");
          c.setAttribute("class", s.scopeMark);
          c.setAttribute("r", "2.4");
          c.setAttribute("cx", (8 + ((p.t - (t1 - span)) / span) * (w - 16)).toFixed(1));
          c.setAttribute("cy", plotY(p.x, h).toFixed(1));
          return c;
        })
      );
    }
  }, []);

  useEffect(() => {
    const node = svgRef.current;
    if (!node) return;
    const ro = new ResizeObserver((entries) => {
      const box = entries[0]?.contentRect;
      if (!box || box.width < 8) return;
      scopeBox.current = { w: box.width, h: box.height };
      node.setAttribute("viewBox", `0 0 ${box.width} ${box.height}`);
      drawScope();
    });
    ro.observe(node);
    return () => ro.disconnect();
  }, [drawScope]);

  useEffect(() => {
    let raf = 0;
    let acc = 0;
    let last = performance.now();

    const loop = (now: number) => {
      const dt = Math.min(0.048, (now - last) / 1000);
      last = now;
      acc += dt;
      const r = recipeRef.current;
      const travel = travelPx(r.travel);
      const small = Math.max(22, Math.round(travel * 0.38));
      const fires: number[] = [];
      let mainCommit = false;

      while (acc >= DT) {
        for (let i = 0; i < slots.current.length; i++) {
          const slot = slots.current[i];
          if (slot.drive.ballistic > 0) {
            slot.drive.ballistic = Math.max(0, slot.drive.ballistic - DT);
            if (slot.body.stroke) slot.drive.ballistic = 0;
            else if (!slot.body.latched && slot.body.x >= r.commit) {
              slot.drive.ballistic = 0;
            }
          }
          const busyLock = slot.role === "busy" && slot.body.busyLeft > 0;
          const pulled = (slot.drive.held || slot.drive.ballistic > 0) && !busyLock;
          const ev = step(
            slot.body,
            r,
            slot.role,
            { held: pulled, depth: slot.drive.held ? slot.drive.depth : 1 },
            DT,
            reducedRef.current
          );
          if (ev.commit) {
            playClick(clickRef.current, r, ev.velocity, mutedRef.current);
            if (i === 0) mainCommit = true;
          }
          if (ev.fire && i > 0) fires.push(i - 1);
        }

        const main = slots.current[0];
        if (main.drive.held || main.body.x > 0.012 || Math.abs(main.body.v) > 0.03) {
          if (pressAt.current === null && main.drive.held) {
            pressAt.current = now;
            peakX.current = 0;
            peakV.current = 0;
            settled.current = false;
            samples.current = [];
          }
          peakX.current = Math.max(peakX.current, main.body.x);
          if (main.body.x > 0.08) {
            peakV.current = Math.max(peakV.current, Math.abs(main.body.v));
          }
          samples.current.push({ t: now, x: main.body.x, mark: mainCommit });
          if (samples.current.length > SCOPE_N) samples.current.shift();
          mainCommit = false;
        }

        if (
          !settled.current &&
          !main.drive.held &&
          main.drive.ballistic === 0 &&
          pressAt.current !== null &&
          (now - pressAt.current > 850 ||
            (main.body.x < 0.06 && Math.abs(main.body.v) < 0.2))
        ) {
          const settle = now - pressAt.current;
          setMetrics((m) => ({
            settle,
            peak: peakV.current,
            overshoot: Math.max(0, peakX.current - 1),
            presses: m.presses + 1,
          }));
          pressAt.current = null;
          settled.current = true;
        }

        acc -= DT;
      }

      if (fires.length) {
        setCounts((prev) => {
          const next = prev.slice();
          for (const i of fires) next[i] += 1;
          return next;
        });
      }

      paintSlot(slots.current[0], travel);
      for (let i = 1; i < slots.current.length; i++) {
        paintSlot(slots.current[i], small);
      }
      drawScope();
      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [drawScope, paintSlot]);

  const setDim = (id: Dim, value: number) => {
    setRecipe((r) => clampRecipe({ ...r, [id]: value }));
  };

  const ensureAudio = async () => {
    if (!clickRef.current) clickRef.current = makeClick();
    await unlock(clickRef.current);
  };

  const begin = (index: number, clientY: number) => {
    const slot = slots.current[index];
    if (slot.role === "dead") return;
    if (slot.role === "busy" && slot.body.busyLeft > 0) return;
    slot.drive.held = true;
    slot.drive.originY = clientY;
    slot.drive.depth = 1;
    slot.drive.moved = false;
    slot.drive.ballistic = 0;
    void ensureAudio();
  };

  const move = (index: number, clientY: number, travel: number) => {
    const slot = slots.current[index];
    if (!slot.drive.held) return;
    const dy = clientY - slot.drive.originY;
    if (dy > 12) {
      slot.drive.moved = true;
      slot.drive.depth = clamp(dy / Math.max(8, travel), 0, 1);
    }
  };

  const stop = (index: number) => {
    const slot = slots.current[index];
    slot.drive.held = false;
    slot.drive.depth = 1;
    if (
      slot.role !== "hold" &&
      slot.role !== "dead" &&
      !slot.drive.moved &&
      !slot.body.stroke
    ) {
      slot.drive.ballistic = 0.55;
    }
  };

  const onDown =
    (index: number, travel: number) => (e: ReactPointerEvent<HTMLButtonElement>) => {
      lastPtr.current = performance.now();
      e.preventDefault();
      e.currentTarget.setPointerCapture(e.pointerId);
      begin(index, e.clientY);
      move(index, e.clientY, travel);
    };

  const onClick = (index: number) => () => {
    if (performance.now() - lastPtr.current < 500) return;
    begin(index, 0);
    stop(index);
  };

  const onMove =
    (index: number, travel: number) => (e: ReactPointerEvent<HTMLButtonElement>) => {
      move(index, e.clientY, travel);
    };

  const onUp = (index: number) => () => {
    stop(index);
  };

  const onKeyDown =
    (index: number) => (e: ReactKeyboardEvent<HTMLButtonElement>) => {
      if (e.code !== "Space" && e.code !== "Enter") return;
      e.preventDefault();
      if (e.repeat) return;
      begin(index, 0);
      slots.current[index].drive.depth = 1;
    };

  const onKeyUp = (index: number) => (e: ReactKeyboardEvent<HTMLButtonElement>) => {
    if (e.code !== "Space" && e.code !== "Enter") return;
    e.preventDefault();
    stop(index);
  };

  const onScopePointer = (e: ReactPointerEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const u = (y - 8) / Math.max(1, rect.height - 16);
    setDim("commit", clamp(u * 1.12 - 0.04, RANGES.commit.min, RANGES.commit.max));
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const copy = async (kind: "module" | "recipe") => {
    const text = kind === "module" ? moduleText : emitRecipe(recipe);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(kind);
      window.setTimeout(() => setCopied(null), 1600);
    } catch {
      setCopied(null);
    }
  };

  const download = () => {
    const blob = new Blob([moduleText], { type: "text/javascript" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${fileStem(recipe)}.js`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className={s.shell}>
      <header className={s.mast}>
        <h1 className={s.brand}>Actuator</h1>
        <p className={s.lede}>
          A control&apos;s quality is almost never in its radius. It is in{" "}
          <strong>travel</strong>, the force before it gives, the hill at
          commitment, the settle afterwards, and the sound that marks the
          crossing. This bench authors that. The plunger is the design — press
          it with a pointer or the keyboard. The family shares the same spring,
          so a whole interface can feel like one hand built it. Disabled and
          busy are part of the recipe. The click is synthesized: a noise tick, a
          damped triangle, a short partial. Export is that same integrator, not
          a picture of a button.
        </p>
        <Link className={s.task} href={TASK}>
          Task
        </Link>
      </header>

      <div className={s.body}>
        <div className={s.plate}>
          <section className={s.stage} aria-label="Live plunger">
            <div className={s.stageHead}>
              <span>{preset ? preset.name : "Custom"} · live</span>
              <span className={s.metrics}>
                {metrics.presses === 0
                  ? "Press to seat the spring"
                  : `${metrics.presses} · settle ${
                      metrics.settle !== null ? `${Math.round(metrics.settle)} ms` : "—"
                    } · vel ${metrics.peak.toFixed(1)} · overshoot ${Math.round(
                      metrics.overshoot * 100
                    )}%`}
              </span>
            </div>

            <div className={s.wellWrap}>
              <div className={s.scale} aria-hidden>
                <span className={s.tick} style={{ top: "8%" }}>
                  0
                </span>
                <span className={s.tick} style={{ top: "50%" }}>
                  {recipe.travel.toFixed(1)}
                </span>
                <span className={s.tick} style={{ top: "88%" }}>
                  mm
                </span>
              </div>
              <Well
                travel={stroke}
                commit={recipe.commit}
                role="momentary"
                label="Feel the press. Space or Enter to actuate."
                elRef={(el) => {
                  slots.current[0].el = el;
                }}
                holdRef={(el) => {
                  slots.current[0].hold = el;
                }}
                onPointerDown={onDown(0, stroke)}
                onPointerMove={onMove(0, stroke)}
                onPointerUp={onUp(0)}
                onPointerCancel={onUp(0)}
                onClick={onClick(0)}
                onKeyDown={onKeyDown(0)}
                onKeyUp={onKeyUp(0)}
                tall
              />
            </div>

            <figure className={s.scope}>
              <figcaption>
                Travel against time. Drag the rust line to move commit.
              </figcaption>
              <svg
                ref={svgRef}
                viewBox="0 0 320 180"
                preserveAspectRatio="none"
                role="img"
                aria-label="Travel trace. Drag vertically to set the commit point."
                onPointerDown={onScopePointer}
                onPointerMove={(e) => {
                  if (e.buttons) onScopePointer(e);
                }}
              >
                <line className={s.scopeAxis} x1="8" x2="8" y1="8" y2="172" />
                <line
                  ref={commitLineRef}
                  className={s.scopeCommit}
                  x1="8"
                  x2="312"
                  y1={plotY(recipe.commit, 180)}
                  y2={plotY(recipe.commit, 180)}
                />
                <polyline ref={polyRef} className={s.scopeLine} points="" />
                <g ref={marksRef} />
              </svg>
            </figure>
          </section>

          <section className={s.family} aria-label="Shared family">
            <div className={s.familyHead}>
              <span>Family</span>
              <span className={s.familyNote}>
                Same spring, five jobs. A set that feels like one maker.
              </span>
            </div>
            <div className={s.familyRow}>
              {FAMILY.map((unit, i) => {
                const index = i + 1;
                return (
                  <div className={s.unit} key={unit.role}>
                    <Well
                      travel={unitTravel}
                      commit={recipe.commit}
                      role={unit.role}
                      label={`${unit.label}. ${unit.hint}`}
                      elRef={(el) => {
                        slots.current[index].el = el;
                      }}
                      holdRef={(el) => {
                        slots.current[index].hold = el;
                      }}
                      onPointerDown={onDown(index, unitTravel)}
                      onPointerMove={onMove(index, unitTravel)}
                      onPointerUp={onUp(index)}
                      onPointerCancel={onUp(index)}
                      onClick={onClick(index)}
                      onKeyDown={onKeyDown(index)}
                      onKeyUp={onKeyUp(index)}
                    />
                    <div className={s.unitLabel}>{unit.label}</div>
                    <div className={s.unitMeta}>
                      {unit.role === "dead"
                        ? "off"
                        : counts[i] > 0
                          ? String(counts[i])
                          : unit.hint}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        <aside className={s.rail}>
          <fieldset>
            <legend className={s.blockHead}>
              <span>Recipes</span>
              <span>{preset ? preset.name : "Custom"}</span>
            </legend>
            <div className={s.presets}>
              {PRESETS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  className={s.chip}
                  aria-pressed={preset?.id === p.id}
                  onClick={() => setRecipe({ ...p.recipe })}
                >
                  {p.name}
                </button>
              ))}
            </div>
            <p className={s.note}>{preset ? preset.note : "A feel you seated yourself."}</p>
          </fieldset>

          <fieldset>
            <legend className={s.blockHead}>
              <span>Feel</span>
              <span>coupled</span>
            </legend>
            <div className={s.dims}>
              {DIMS.map((d) => {
                const spec = RANGES[d.id];
                const id = `${uid}-${d.id}`;
                return (
                  <div className={s.row} key={d.id}>
                    <label htmlFor={id} title={d.hint}>
                      {d.label}
                    </label>
                    <input
                      id={id}
                      className={s.slide}
                      type="range"
                      min={spec.min}
                      max={spec.max}
                      step={spec.step}
                      value={recipe[d.id]}
                      aria-valuetext={formatDim(d.id, recipe[d.id])}
                      onChange={(e) => setDim(d.id, Number(e.target.value))}
                    />
                    <output htmlFor={id}>{formatDim(d.id, recipe[d.id])}</output>
                  </div>
                );
              })}
            </div>
            <div className={s.toggles}>
              <button
                type="button"
                className={s.ghost}
                aria-pressed={muted}
                onClick={() => setMuted((m) => !m)}
              >
                {muted ? "Click muted" : "Click live"}
              </button>
            </div>
          </fieldset>

          <section className={s.export} aria-label="Export">
            <div className={s.blockHead}>
              <span>Export</span>
              <span>{fileStem(recipe)}.js</span>
            </div>
            <pre className={s.code}>{preview}</pre>
            <div className={s.actions}>
              <button type="button" className={s.ghost} onClick={() => void copy("module")}>
                {copied === "module" ? "Copied module" : "Copy module"}
              </button>
              <button type="button" className={s.ghost} onClick={() => void copy("recipe")}>
                {copied === "recipe" ? "Copied recipe" : "Copy recipe"}
              </button>
              <button type="button" className={s.ghost} onClick={download}>
                Download
              </button>
            </div>
            <p className={s.honest}>
              Paste-out is the live spring: mass, damping ratio, detent hill,
              commit, and the three-voice click. Drop{" "}
              <code>attach(button, &#123; onCommit &#125;)</code> on a real
              control and it will travel, resist, fire and settle the way this
              plunger does. Appearance is yours.
            </p>
          </section>
        </aside>
      </div>
    </div>
  );
}

type WellProps = {
  travel: number;
  commit: number;
  role: Role;
  label: string;
  tall?: boolean;
  elRef: (el: HTMLElement | null) => void;
  holdRef: (el: HTMLSpanElement | null) => void;
  onPointerDown: (e: ReactPointerEvent<HTMLButtonElement>) => void;
  onPointerMove: (e: ReactPointerEvent<HTMLButtonElement>) => void;
  onPointerUp: () => void;
  onPointerCancel: () => void;
  onClick: () => void;
  onKeyDown: (e: ReactKeyboardEvent<HTMLButtonElement>) => void;
  onKeyUp: (e: ReactKeyboardEvent<HTMLButtonElement>) => void;
};

function Well({
  travel,
  commit,
  role,
  label,
  tall,
  elRef,
  holdRef,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerCancel,
  onClick,
  onKeyDown,
  onKeyUp,
}: WellProps) {
  const capH = tall ? 40 : 22;
  const pad = tall ? 14 : 8;
  const height = travel + capH + pad * 2;
  const scribeTop = pad + commit * travel + capH * 0.35;

  return (
    <div
      className={tall ? s.bore : s.unitBore}
      style={{ height: tall ? height : 92 }}
    >
      <button
        type="button"
        className={tall ? s.boreHit : s.unitHit}
        disabled={role === "dead"}
        aria-label={label}
        aria-pressed={role === "latch" ? false : undefined}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
        onClick={onClick}
        onKeyDown={onKeyDown}
        onKeyUp={onKeyUp}
      >
        <span className={s.floor} aria-hidden style={{ top: `${pad + travel + capH * 0.35}px` }} />
        <span className={s.scribe} style={{ top: `${scribeTop}px` }}>
          {tall ? <span>commit</span> : null}
        </span>
        <span className={s.holdFill} ref={holdRef} />
        <span className={s.plunger} style={{ top: pad }} ref={elRef}>
          <span className={s.cap} />
          <span className={s.stem} aria-hidden />
        </span>
      </button>
    </div>
  );
}

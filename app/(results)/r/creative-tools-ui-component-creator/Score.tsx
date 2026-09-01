/**
 * The phrase. Each voice is a bar on a shared ruler. Drag a bar to stagger
 * it; the duration belongs to the journey, not the skin.
 */

import { useRef, type PointerEvent as ReactPointerEvent } from "react";

import s from "./desk.module.css";
import { gestureLabel } from "./emit";
import {
  EASINGS,
  GESTURES,
  easingOf,
  maxDelay,
  totalMs,
  voicesFor,
  type Doc,
  type Edge,
  type Easing,
  type Gesture,
  type VoiceId,
} from "./model";

const DURATIONS = [120, 200, 280, 400, 560];

function curvePath(e: Easing, w: number, h: number): string {
  const minY = Math.min(0, e.y1, e.y2);
  const maxY = Math.max(1, e.y1, e.y2);
  const span = maxY - minY || 1;
  const X = (t: number) => t * w;
  const Y = (t: number) => h - ((t - minY) / span) * h;
  return `M ${X(0)} ${Y(0)} C ${X(e.x1)} ${Y(e.y1)}, ${X(e.x2)} ${Y(e.y2)}, ${X(1)} ${Y(1)}`;
}

export function Score({
  doc,
  edge,
  playhead,
  onDuration,
  onEasing,
  onDelay,
  onBind,
  onRemove,
}: {
  doc: Doc;
  edge: Edge;
  playhead: number | null;
  onDuration: (ms: number) => void;
  onEasing: (id: string) => void;
  onDelay: (voice: VoiceId, delay: number) => void;
  onBind: (g: Gesture | undefined) => void;
  onRemove: () => void;
}) {
  const rail = useRef<HTMLDivElement>(null);
  const span = Math.max(320, edge.duration + maxDelay(edge) + 40);
  const used = voicesFor(doc.specimen);

  function dragVoice(id: VoiceId, ev: ReactPointerEvent<HTMLButtonElement>) {
    ev.preventDefault();
    const startX = ev.clientX;
    const start = edge.voices.find((v) => v.id === id)?.delay ?? 0;
    const target = ev.currentTarget;
    target.setPointerCapture(ev.pointerId);
    const move = (e: PointerEvent) => {
      const dx = e.clientX - startX;
      const el = rail.current;
      if (!el) return;
      const per = span / Math.max(1, el.getBoundingClientRect().width);
      onDelay(id, start + dx * per);
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  }

  function dragDuration(ev: ReactPointerEvent<HTMLButtonElement>) {
    ev.preventDefault();
    const startX = ev.clientX;
    const start = edge.duration;
    ev.currentTarget.setPointerCapture(ev.pointerId);
    const move = (e: PointerEvent) => {
      const el = rail.current;
      if (!el) return;
      const per = span / Math.max(1, el.getBoundingClientRect().width);
      const next = Math.max(60, Math.min(800, Math.round((start + (e.clientX - startX) * per) / 10) * 10));
      onDuration(next);
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  }

  const from = doc.states.find((p) => p.id === edge.from)?.name ?? edge.from;
  const to = doc.states.find((p) => p.id === edge.to)?.name ?? edge.to;
  const ease = easingOf(edge.easing);
  const head = playhead === null ? null : Math.min(1, playhead / totalMs(edge));

  return (
    <section className={s.score} aria-label="Journey score">
      <header className={s.scoreHead}>
        <p className={s.phrase}>
          <em>{from}</em>
          <span aria-hidden="true"> → </span>
          <em>{to}</em>
        </p>
        <p className={s.phraseMeta}>
          {edge.duration}ms {ease.label}
          {edge.gesture ? ` · ${gestureLabel(edge.gesture)}` : " · graph only"}
        </p>
        <button type="button" className={s.textBtn} onClick={onRemove}>
          Drop journey
        </button>
      </header>

      <div className={s.easeRow} role="group" aria-label="Easing">
        {EASINGS.map((e) => (
          <button
            key={e.id}
            type="button"
            className={`${s.ease} ${edge.easing === e.id ? s.easeOn : ""}`}
            aria-pressed={edge.easing === e.id}
            onClick={() => onEasing(e.id)}
          >
            <svg viewBox="0 0 48 28" aria-hidden="true">
              <path d={curvePath(e, 48, 28)} />
            </svg>
            <span>{e.label}</span>
          </button>
        ))}
      </div>

      <div className={s.durRow} role="group" aria-label="Duration">
        {DURATIONS.map((ms) => (
          <button
            key={ms}
            type="button"
            className={`${s.tick} ${edge.duration === ms ? s.tickOn : ""}`}
            aria-pressed={edge.duration === ms}
            onClick={() => onDuration(ms)}
          >
            {ms}
          </button>
        ))}
        <button
          type="button"
          className={s.durGrip}
          aria-label="Drag to change duration"
          onPointerDown={dragDuration}
        >
          {edge.duration}ms
        </button>
      </div>

      <div className={s.railWrap}>
        <div ref={rail} className={s.rail} style={{ ["--span" as string]: `${span}` }}>
          {used.map((id) => {
            const delay = edge.voices.find((v) => v.id === id)?.delay ?? 0;
            const left = (delay / span) * 100;
            const width = (edge.duration / span) * 100;
            return (
              <div key={id} className={s.voice}>
                <span className={s.voiceName}>{id}</span>
                <div className={s.voiceTrack}>
                  <button
                    type="button"
                    className={s.voiceBar}
                    style={{ left: `${left}%`, width: `${width}%` }}
                    aria-label={`${id} starts at ${delay} milliseconds. Drag to stagger.`}
                    onPointerDown={(ev) => dragVoice(id, ev)}
                  />
                </div>
                <span className={s.voiceMs}>+{delay}</span>
              </div>
            );
          })}
          {head !== null ? <div className={s.playhead} style={{ left: `${head * 100}%` }} /> : null}
        </div>
        <p className={s.railHint}>
          Drag a voice to stagger it. The well can leave before the word. That
          order is the quality.
        </p>
      </div>

      <div className={s.bindRow} role="group" aria-label="When this journey is taken">
        <span className={s.bindLab}>Taken on</span>
        <button
          type="button"
          className={`${s.tick} ${!edge.gesture ? s.tickOn : ""}`}
          aria-pressed={!edge.gesture}
          onClick={() => onBind(undefined)}
        >
          graph
        </button>
        {GESTURES.map((g) => (
          <button
            key={g.id}
            type="button"
            className={`${s.tick} ${edge.gesture === g.id ? s.tickOn : ""}`}
            aria-pressed={edge.gesture === g.id}
            onClick={() => onBind(g.id)}
          >
            {g.label}
          </button>
        ))}
      </div>
    </section>
  );
}


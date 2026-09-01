"use client";

import { useCallback, useId, useRef, useState } from "react";

import type { Recipe } from "./system";
import s from "./pointer.module.css";

type Props = {
  recipe: Recipe;
  busy: boolean;
  onBusy: (on: boolean) => void;
};

/**
 * The proof is a page, not a widget tray. Type you can select, a reference
 * you can follow, a print you can drag, a field you can enter, a control
 * that waits, one that refuses. A grammar can only be judged against work.
 */
export default function Preview({ recipe, busy, onBusy }: Props) {
  const uid = useId();
  const sheet = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const drag = useRef<{
    px: number;
    py: number;
    ox: number;
    oy: number;
  } | null>(null);

  const onPrintDown = useCallback((e: React.PointerEvent<HTMLButtonElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = {
      px: e.clientX,
      py: e.clientY,
      ox: offset.x,
      oy: offset.y,
    };
  }, [offset]);

  const onPrintMove = useCallback((e: React.PointerEvent<HTMLButtonElement>) => {
    const d = drag.current;
    if (!d) return;
    const parent = sheet.current?.getBoundingClientRect();
    const next = {
      x: d.ox + (e.clientX - d.px),
      y: d.oy + (e.clientY - d.py),
    };
    if (parent) {
      next.x = Math.min(80, Math.max(-40, next.x));
      next.y = Math.min(80, Math.max(-24, next.y));
    }
    setOffset(next);
  }, []);

  const onPrintUp = useCallback(() => {
    drag.current = null;
  }, []);

  function wait() {
    onBusy(true);
    window.setTimeout(() => onBusy(false), 1600);
  }

  return (
    <article
      className={s.proof}
      ref={sheet}
      style={{ background: recipe.paper, color: recipe.ink, ["--ink" as string]: recipe.ink }}
    >
      <header className={s.proofHead}>
        <span>Quarto · specimen</span>
        <span>{recipe.name}</span>
      </header>
      <div className={s.proofBody}>
        <div className={s.article} data-ptr="text">
          <h2>The hand the page lends you</h2>
          <p>
            A pointer is not a logo. It is the hand a site lends for a moment:
            it moves, it has weight, it crosses different kinds of work, it
            presses, it drags, it enters a line of type, it waits. Those are
            states and relationships. A good system has a considered answer
            for each of them, and the answer belongs to the page it serves.
          </p>
          <p>
            Most custom cursors fail because they are decoration. A blurred
            disc arrives late and says the same thing on a{" "}
            <a href="#colophon" onClick={(e) => e.preventDefault()}>
              colophon
            </a>
            , a form, and a photograph. It hides the caret. It makes the page
            harder to use. This sheet is a page — type you can select, a{" "}
            <a href="#notes" onClick={(e) => e.preventDefault()}>
              note on magnetism
            </a>
            , a print you can drag, a field you can enter — because a grammar
            can only be judged against content.
          </p>
          <p>
            The copy on this sheet is written for the bench. It is not a
            shop. Index authors the rules; the export is the same integrator,
            as CSS and JS, with no framework attached.
          </p>
        </div>
        <aside className={s.aside}>
          <button
            type="button"
            className={s.print}
            data-ptr="drag"
            aria-label="Drag the print"
            onPointerDown={onPrintDown}
            onPointerMove={onPrintMove}
            onPointerUp={onPrintUp}
            onPointerCancel={onPrintUp}
            style={{
              transform: `translate(${offset.x}px, ${offset.y}px)`,
              background: printGround(recipe.id),
            }}
          >
            <PrintFace id={recipe.id} ink={recipe.ink} />
            <span className={s.printLabel}>Drag</span>
          </button>
          <form
            className={s.form}
            onSubmit={(e) => {
              e.preventDefault();
              wait();
            }}
          >
            <label htmlFor={`${uid}-name`}>
              Name
              <input id={`${uid}-name`} name="name" autoComplete="off" defaultValue="" />
            </label>
            <label htmlFor={`${uid}-note`}>
              A line
              <textarea id={`${uid}-note`} name="note" rows={3} defaultValue="" />
            </label>
            <div className={s.actions}>
              <button type="submit" className={s.proofBtn} aria-busy={busy}>
                {busy ? "Waiting" : "Send"}
              </button>
              <button type="button" className={s.proofBtn} disabled>
                Bound
              </button>
            </div>
          </form>
        </aside>
      </div>
    </article>
  );
}

function printGround(id: string): string {
  if (id === "stamp") return "#d8c19a";
  if (id === "lead") return "#cfd6db";
  if (id === "sight") return "#c9d4c6";
  if (id === "haze") return "#d8d8d8";
  return "#d8c9a8";
}

function PrintFace({ id, ink }: { id: string; ink: string }) {
  return (
    <svg viewBox="0 0 160 200" width="100%" height="100%" aria-hidden="true">
      <rect width="160" height="200" fill="none" />
      <g fill="none" stroke={ink} strokeWidth="1.1">
        <rect x="16" y="18" width="128" height="164" />
        {id === "sight" ? (
          <>
            <circle cx="80" cy="88" r="28" />
            <path d="M80 48v12M80 116v12M40 88h12M108 88h12" />
          </>
        ) : id === "lead" ? (
          <>
            <path d="M36 48h88M36 64h64" />
            <path d="M36 150 124 62" />
          </>
        ) : (
          <>
            <path d="M28 44h104" />
            <path d="M28 58h72" />
            <path d="M28 150h104" />
          </>
        )}
      </g>
      <text
        x="80"
        y="104"
        textAnchor="middle"
        fill={ink}
        fontSize="13"
        fontFamily="Ibarra Real Nova, Palatino, serif"
      >
        {id === "haze" ? "haze" : "Q"}
      </text>
    </svg>
  );
}

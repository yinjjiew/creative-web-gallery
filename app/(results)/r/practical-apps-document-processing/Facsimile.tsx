"use client";

import { useId, useRef, useState } from "react";

import { COLS, PAPER, ROW0, ROWH, cellRect, rectToSvg, svgToNorm } from "./plate";
import s from "./register.module.css";
import { FIELD_IDS, FIELD_SHORT, type FieldId, type Focus, type Folio, type Line, type Rect } from "./state";

type Props = {
  folio: Folio;
  focus: Focus | null;
  linking: boolean;
  onFocus: (focus: Focus) => void;
  onRegion: (region: Rect) => void;
};

function clerk(folio: Folio, line: Line, fieldId: FieldId): string {
  if (folio.id === "f47" && line.id === "f47-l3" && fieldId === "surname") return "Whit";
  if (folio.id === "f47" && line.id === "f47-l5" && fieldId === "surname") return "Whittaker";
  if (folio.id === "f47" && line.id === "f47-l6" && fieldId === "when") return "31 Febry";
  if (folio.id === "f47" && line.id === "f47-l7" && fieldId === "parents") return "Joseph &";
  if (folio.id === "f61" && line.id === "f61-l4" && fieldId === "parents") return "";
  const value = line.fields[fieldId].value;
  return value.replace(" 1838", "").replace(" & [blank]", " &").replace("[blank]", "");
}

function fontSize(folio: Folio, fieldId: FieldId): number {
  if (folio.year === 1841) return fieldId === "minister" || fieldId === "trade" ? 13 : 15;
  if (fieldId === "minister" || fieldId === "trade") return 15;
  if (fieldId === "when") return 16;
  return 17;
}

export default function Facsimile({ folio, focus, linking, onFocus, onRegion }: Props) {
  const uid = useId();
  const paperRef = useRef<SVGGElement>(null);
  const [drag, setDrag] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const start = useRef<{ x: number; y: number } | null>(null);

  function localPoint(event: React.PointerEvent) {
    const g = paperRef.current;
    if (!g) return null;
    const svg = g.ownerSVGElement;
    if (!svg) return null;
    const ctm = g.getScreenCTM();
    if (!ctm) return null;
    const pt = svg.createSVGPoint();
    pt.x = event.clientX;
    pt.y = event.clientY;
    const p = pt.matrixTransform(ctm.inverse());
    return { x: p.x, y: p.y };
  }

  function onPointerDown(event: React.PointerEvent<SVGGElement>) {
    if (!linking) return;
    const p = localPoint(event);
    if (!p) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    start.current = p;
    setDrag({ x: p.x, y: p.y, w: 0, h: 0 });
  }

  function onPointerMove(event: React.PointerEvent<SVGGElement>) {
    if (!linking || !start.current) return;
    const p = localPoint(event);
    if (!p) return;
    const x = Math.min(start.current.x, p.x);
    const y = Math.min(start.current.y, p.y);
    setDrag({
      x,
      y,
      w: Math.abs(p.x - start.current.x),
      h: Math.abs(p.y - start.current.y),
    });
  }

  function onPointerUp() {
    if (!linking || !drag || !start.current) {
      start.current = null;
      setDrag(null);
      return;
    }
    if (drag.w > 8 && drag.h > 8) {
      onRegion(svgToNorm(drag.x, drag.y, drag.w, drag.h));
    }
    start.current = null;
    setDrag(null);
  }

  const rows = 8;
  const later = folio.lines.find((l) => l.laterHand);

  return (
    <svg viewBox="0 0 1000 700" role="img" aria-label={`Synthesized facsimile of ${folio.church}, folio ${folio.folio}, ${String(folio.year)}`}>
      <defs>
        <clipPath id={`${uid}-paper`}>
          <path d="M18 8 H902 L910 18 V628 L28 636 L8 618 Z" />
        </clipPath>
        <filter id={`${uid}-grain`} x="-5%" y="-5%" width="110%" height="110%">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="3" seed="7" result="n" />
          <feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.16 0" />
        </filter>
        <filter id={`${uid}-stain`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="6" />
        </filter>
        {folio.lines.map((line, i) =>
          FIELD_IDS.map((fieldId) => {
            const box = cellRect(i, fieldId);
            return (
              <clipPath id={`${uid}-c-${line.id}-${fieldId}`} key={`${line.id}-${fieldId}`}>
                <rect
                  x={box.x * PAPER.w}
                  y={box.y * PAPER.h}
                  width={box.w * PAPER.w}
                  height={ROWH * PAPER.h}
                />
              </clipPath>
            );
          }),
        )}
      </defs>

      <rect width="1000" height="700" fill="#2a2621" />

      <g transform={`translate(${String(PAPER.x)},${String(PAPER.y)})`}>
        <g ref={paperRef} clipPath={`url(#${uid}-paper)`} onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp}>
          <rect width={PAPER.w} height={PAPER.h} fill="#e8d9b8" />
          <rect width={PAPER.w} height={PAPER.h} fill="#c9a66a" opacity="0.18" />
          <ellipse cx="160" cy="80" rx="220" ry="90" fill="#d8b57a" opacity="0.2" />
          <ellipse cx="780" cy="520" rx="200" ry="110" fill="#c4a06a" opacity="0.16" />
          <rect width={PAPER.w} height={PAPER.h} filter={`url(#${uid}-grain)`} />

          {folio.id === "f47" ? (
            <>
              <ellipse cx="500" cy="292" rx="78" ry="42" fill="#6b3a14" opacity="0.28" filter={`url(#${uid}-stain)`} style={{ mixBlendMode: "multiply" }} />
              <ellipse cx="488" cy="286" rx="36" ry="18" fill="#3a2210" opacity="0.2" style={{ mixBlendMode: "multiply" }} />
            </>
          ) : null}

          <ellipse cx="120" cy="560" rx="18" ry="10" fill="#8a6230" opacity="0.22" />
          <ellipse cx="740" cy="90" rx="14" ry="8" fill="#8a6230" opacity="0.18" />
          <ellipse cx="300" cy="600" rx="22" ry="9" fill="#7a5428" opacity="0.16" />

          <text className={s.printTitle} x="18" y="36" fontSize="13">
            BAPTISMS solemnized in the Parish of {folio.parish} in the County of York
          </text>
          <text className={s.printTitle} x="18" y="56" fontSize="13">
            in the Year {folio.year}
          </text>
          <text className={s.print} x="790" y="56" fontSize="11">
            {folio.volume}
          </text>

          <line className={s.ruleInk} x1="12" y1="68" x2="908" y2="68" />
          <line className={s.ruleInk} x1="12" y1="148" x2="908" y2="148" strokeWidth="1.1" />

          {(
            [
              [COLS.when, "When\nBaptized"],
              [COLS.child, "Child’s\nChristian Name"],
              [COLS.parents, "Parents’\nChristian Names"],
              [COLS.surname, "Surname"],
              [COLS.abode, "Abode"],
              [COLS.trade, "Quality, Trade,\nor Profession"],
              [COLS.minister, "By whom the\nCeremony was\nperformed"],
            ] as const
          ).map(([col, label]) => {
            const lines = label.split("\n");
            return (
              <g key={label}>
                <line
                  className={s.ruleInk}
                  x1={col.x * PAPER.w}
                  y1="68"
                  x2={col.x * PAPER.w}
                  y2="620"
                />
                {lines.map((ln, i) => (
                  <text
                    key={ln}
                    className={s.print}
                    x={col.x * PAPER.w + 6}
                    y={86 + i * 13}
                    fontSize="9"
                  >
                    {ln}
                  </text>
                ))}
              </g>
            );
          })}
          <line className={s.ruleInk} x1="908" y1="68" x2="908" y2="620" />

          {Array.from({ length: rows }, (_, i) => {
            const y = (ROW0 + i * ROWH) * PAPER.h;
            return <line key={i} className={s.ruleInk} x1="12" y1={y} x2="908" y2={y} />;
          })}
          <line className={s.ruleInk} x1="12" y1="620" x2="908" y2="620" />

          {folio.lines.map((line, i) => {
            const wobble = folio.year === 1841 ? (i % 2 === 0 ? 1 : -1) : [1, -1, 0, 1, -2, 1, 0, -1][i] ?? 0;
            const y = (ROW0 + i * ROWH + 0.05) * PAPER.h + wobble;
            return (
              <g key={line.id}>
                {FIELD_IDS.map((fieldId) => {
                  const col = COLS[fieldId];
                  const box = cellRect(i, fieldId);
                  const text = clerk(folio, line, fieldId);
                  const laterHere = line.laterHand && fieldId === "surname";
                  const clip = `${uid}-c-${line.id}-${fieldId}`;
                  return (
                    <g key={fieldId} clipPath={`url(#${clip})`}>
                      <text
                        className={laterHere ? s.handLater : s.hand}
                        x={col.x * PAPER.w + 4}
                        y={laterHere ? y - 6 : y}
                        fontSize={laterHere ? 12 : fontSize(folio, fieldId)}
                      >
                        {laterHere ? "Whitacre" : text}
                      </text>
                      {laterHere ? (
                        <>
                          <text
                            className={s.hand}
                            x={col.x * PAPER.w + 4}
                            y={y + 12}
                            fontSize="14"
                          >
                            Whittaker
                          </text>
                          <line
                            className={s.struck}
                            x1={col.x * PAPER.w + 3}
                            y1={y + 8}
                            x2={col.x * PAPER.w + box.w * PAPER.w - 6}
                            y2={y + 7}
                          />
                        </>
                      ) : null}
                    </g>
                  );
                })}
              </g>
            );
          })}

          <text className={s.print} x="430" y="638" fontSize="12">
            folio {folio.folio}
          </text>

          {folio.lines.map((line, i) =>
            FIELD_IDS.map((fieldId) => {
              const field = line.fields[fieldId];
              const r = rectToSvg(field.region);
              const selected = focus?.lineId === line.id && focus.fieldId === fieldId;
              const markClass =
                field.certainty === "illegible"
                  ? `${s.cellMark} ${s.cellMarkIllegible}`
                  : field.origin === "suggestion"
                    ? `${s.cellMark} ${s.cellMarkSuggest}`
                    : field.certainty !== "certain" || field.caveat
                      ? s.cellMark
                      : "";
              return (
                <g key={`${line.id}-${fieldId}`}>
                  {markClass ? (
                    <rect
                      className={markClass}
                      x={r.x}
                      y={r.y}
                      width={r.w}
                      height={r.h}
                    />
                  ) : null}
                  {selected ? (
                    <rect className={s.cellFocus} x={r.x} y={r.y} width={r.w} height={r.h} />
                  ) : null}
                  <rect
                    className={s.cell}
                    x={cellRect(i, fieldId).x * PAPER.w}
                    y={cellRect(i, fieldId).y * PAPER.h}
                    width={COLS[fieldId].w * PAPER.w}
                    height={ROWH * PAPER.h * 0.92}
                    role="button"
                    tabIndex={linking ? -1 : 0}
                    aria-label={`${FIELD_SHORT[fieldId]}, line ${String(line.n)}, ${field.certainty}${field.value ? `: ${field.value}` : ""}`}
                    aria-current={selected || undefined}
                    onClick={() => {
                      if (linking) return;
                      onFocus({ lineId: line.id, fieldId });
                    }}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        onFocus({ lineId: line.id, fieldId });
                      }
                    }}
                  />
                </g>
              );
            }),
          )}

          {drag && drag.w > 2 && drag.h > 2 ? (
            <rect className={s.dragBox} x={drag.x} y={drag.y} width={drag.w} height={drag.h} />
          ) : null}
        </g>

        <path d="M8 618 L0 700 L70 640 Z" fill="#2a2621" />
      </g>

      {later ? <title>{`Later hand present on line ${String(later.n)}`}</title> : null}
    </svg>
  );
}

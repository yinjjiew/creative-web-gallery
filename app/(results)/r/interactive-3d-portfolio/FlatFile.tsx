"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { IBM_Plex_Mono, Spectral } from "next/font/google";
import { useCallback, useMemo, useRef, useState } from "react";

import styles from "./flatfile.module.css";
import {
  CARD_MM,
  DRAWERS,
  STUDIO,
  cardLengths,
  piecesIn,
  type Piece,
} from "./work";

const serif = Spectral({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-serif",
  display: "swap",
});

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
  display: "swap",
});

const Stage = dynamic(() => import("./Stage"), {
  ssr: false,
  loading: () => <div className={styles.placeholder} aria-hidden="true" />,
});

const TASK = "/tasks/interactive-3d-portfolio";

export type Command =
  | { type: "toggle-drawer"; drawer: number }
  | { type: "lift"; id: string }
  | { type: "return" };

function ScaleCompare({ piece }: { piece: Piece }) {
  const long = Math.max(piece.wMm, piece.hMm);
  const n = cardLengths(piece);
  const max = Math.max(long, CARD_MM);
  const cardW = Math.max(8, (CARD_MM / max) * 140);
  const pieceW = Math.max(8, (long / max) * 140);
  return (
    <div className={styles.scale}>
      <p className={styles.scaleLabel}>Relative to a visiting card</p>
      <div className={styles.scaleTrack}>
        <span
          className={styles.scaleBar}
          data-ref="true"
          style={{ width: cardW }}
          aria-hidden="true"
        />
        <span className={styles.scaleFig}>{CARD_MM} mm</span>
      </div>
      <div className={styles.scaleTrack}>
        <span className={styles.scaleBar} style={{ width: pieceW }} aria-hidden="true" />
        <span className={styles.scaleFig}>
          {piece.wMm} × {piece.hMm} mm · {n.toFixed(n >= 10 ? 0 : 1)}×
        </span>
      </div>
    </div>
  );
}

export default function FlatFile() {
  const commandRef = useRef<Command | null>(null);
  const [piece, setPiece] = useState<Piece | null>(null);
  const [open, setOpen] = useState<boolean[]>([true, false, false, false]);
  const [contact, setContact] = useState(false);

  const onPiece = useCallback((next: Piece | null) => {
    setPiece(next);
  }, []);

  const onDrawers = useCallback((next: boolean[]) => {
    setOpen(next);
  }, []);

  const send = useCallback((cmd: Command) => {
    commandRef.current = cmd;
  }, []);

  const groups = useMemo(
    () => DRAWERS.map((d) => ({ drawer: d, pieces: piecesIn(d.id) })),
    [],
  );

  return (
    <div className={`${serif.variable} ${mono.variable} ${styles.page}`}>
      <Stage commandRef={commandRef} onPiece={onPiece} onDrawers={onDrawers} />

      <div className={styles.hud}>
        <header className={styles.top}>
          <div className={styles.brand}>
            <h1 className={styles.word}>{STUDIO.name}</h1>
            <p className={styles.who}>
              {STUDIO.person} · {STUDIO.line} · {STUDIO.city}
            </p>
            <p className={styles.note}>
              Print work stored as it is stored: in a plan chest. Pull a drawer.
              Lift a piece to the light table. A card and a poster keep their
              real sizes.
            </p>
          </div>
          <div className={styles.aside}>
            <Link className={styles.task} href={TASK}>
              Task
            </Link>
            <button
              type="button"
              className={styles.write}
              aria-expanded={contact}
              onClick={() => setContact((v) => !v)}
            >
              Write
            </button>
            {contact ? (
              <aside className={styles.contact} aria-label="Contact">
                <p className={styles.who}>
                  {STUDIO.person} · {STUDIO.city}
                </p>
                <a className={styles.mail} href={`mailto:${STUDIO.email}`}>
                  {STUDIO.email}
                </a>
                <p className={styles.modelled}>{STUDIO.modelled}</p>
              </aside>
            ) : null}
          </div>
        </header>

        <div className={styles.bottom}>
          <nav className={styles.index} aria-label="Work in the chest">
            <p className={styles.indexLabel}>The drawers</p>
            <div className={styles.drawers}>
              {groups.map(({ drawer, pieces }) => (
                <div key={drawer.id} className={styles.drawerRow}>
                  <button
                    type="button"
                    className={styles.drawerName}
                    data-open={open[drawer.id] ? "true" : "false"}
                    aria-pressed={open[drawer.id]}
                    onClick={() => send({ type: "toggle-drawer", drawer: drawer.id })}
                  >
                    {drawer.name}
                  </button>
                  <div className={styles.titles}>
                    {pieces.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        className={styles.titleBtn}
                        aria-current={piece?.id === item.id}
                        onClick={() => send({ type: "lift", id: item.id })}
                      >
                        {item.title}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </nav>

          <section className={styles.caption} aria-live="polite">
            {piece ? (
              <>
                <div className={styles.capHead}>
                  <h2 className={styles.capTitle}>{piece.title}</h2>
                  <span className={styles.capYear}>{piece.year}</span>
                </div>
                <p className={styles.capMeta}>
                  {piece.client}
                </p>
                <p className={styles.capRole}>{piece.role}</p>
                <p className={styles.capNote}>{piece.note}</p>
                <p className={styles.capStock}>
                  {piece.wMm} × {piece.hMm} × {piece.dMm} mm · {piece.stock}
                  <br />
                  {piece.paper}
                </p>
                <ScaleCompare piece={piece} />
              </>
            ) : (
              <p className={styles.captionEmpty}>
                Pull a drawer — drag the copper handle, tap it, or pick a title.
                Then lift a piece onto the table. The grid is millimetres.
              </p>
            )}
            <p className={styles.keys}>
              drawers 1–4 · titles [ ] · lift enter · back esc · turn ← → ↑ ↓ ·
              nearer + −
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

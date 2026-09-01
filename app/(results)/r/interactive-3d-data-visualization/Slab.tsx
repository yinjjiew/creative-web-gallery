"use client";

/**
 * Stage is a Client Component sibling. WebGL is created in an effect, so
 * prerender sees an empty frame and never runs the renderer.
 */

import Link from "next/link";
import { IBM_Plex_Sans, STIX_Two_Text } from "next/font/google";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";

import {
  CATALOG,
  MW_FLOOR,
  PROVENANCE,
  STATS,
  YEAR_MAX,
  YEAR_MIN,
  type DepthBand,
  type Quake,
} from "./catalog";
import Stage from "./Stage";
import styles from "./slab.module.css";

const serif = STIX_Two_Text({
  subsets: ["latin"],
  weight: ["400", "600"],
  style: ["normal", "italic"],
  variable: "--font-serif",
  display: "swap",
});

const sans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-sans",
  display: "swap",
});

const TASK = "/tasks/interactive-3d-data-visualization";

function formatIso(iso: string) {
  const d = new Date(iso);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  const hh = String(d.getUTCHours()).padStart(2, "0");
  const mm = String(d.getUTCMinutes()).padStart(2, "0");
  return `${y}–${m}–${day} ${hh}:${mm} UTC`;
}

export default function Slab() {
  const tiltRef = useRef(0);
  const [tilt, setTilt] = useState(0);
  const [ve, setVe] = useState(2);
  const [minMw, setMinMw] = useState(MW_FLOOR);
  const [yearFrom, setYearFrom] = useState(YEAR_MIN);
  const [yearTo, setYearTo] = useState(YEAR_MAX);
  const [depth, setDepth] = useState<DepthBand>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [reduce, setReduce] = useState(false);

  useEffect(() => {
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduce(motion.matches);
    sync();
    motion.addEventListener("change", sync);
    return () => motion.removeEventListener("change", sync);
  }, []);

  const applyTilt = useCallback((next: number) => {
    const t = Math.min(1, Math.max(0, next));
    tiltRef.current = t;
    setTilt(t);
  }, []);

  const snap = useCallback(
    (to: 0 | 1) => {
      applyTilt(to);
    },
    [applyTilt],
  );

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const tag = (event.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT") {
        if (event.key !== "Escape") return;
      }
      if (tag === "BUTTON" && !/^[ms12]$/i.test(event.key) && event.key !== "Escape") {
        return;
      }
      if (event.key === "m" || event.key === "M" || event.key === "1") {
        snap(0);
      } else if (event.key === "s" || event.key === "S" || event.key === "2") {
        snap(1);
      } else if (event.key === "ArrowRight" || event.key === "ArrowUp") {
        event.preventDefault();
        applyTilt(tiltRef.current + (reduce ? 1 : 0.06));
      } else if (event.key === "ArrowLeft" || event.key === "ArrowDown") {
        event.preventDefault();
        applyTilt(tiltRef.current - (reduce ? 1 : 0.06));
      } else if (event.key === "Escape") {
        setSelectedId(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [applyTilt, reduce, snap]);

  const selected = useMemo(
    () => CATALOG.find((q) => q.id === selectedId) ?? null,
    [selectedId],
  );

  const visible = useMemo(() => {
    return CATALOG.filter((q) => matchFilters(q, minMw, yearFrom, yearTo, depth)).length;
  }, [depth, minMw, yearFrom, yearTo]);

  const section = tilt > 0.55;
  const bearing = section
    ? "Along-strike section · east right · depth down"
    : "Looking down · north up";

  return (
    <div className={`${serif.variable} ${sans.variable} ${styles.page}`}>
      <header className={styles.mast}>
        <div className={styles.identity}>
          <h1 className={styles.word}>Slab</h1>
          <p className={styles.lede}>
            Japan Trench, 36.2–41.0°N. A map of earthquakes is a smear along
            the coast. Turn the plate on edge and the same events are a
            descending surface. Drag the figure, or the rule.
          </p>
        </div>
        <Link className={styles.task} href={TASK}>
          Task
        </Link>
        <div className={styles.clinometer}>
          <button type="button" data-on={tilt < 0.15 ? "1" : "0"} onClick={() => snap(0)}>
            Map
          </button>
          <div className={styles.rule}>
            <input
              type="range"
              min={0}
              max={100}
              step={1}
              value={Math.round(tilt * 100)}
              aria-label="View from map to section"
              aria-valuetext={section ? "section" : "map"}
              onChange={(e) => applyTilt(Number(e.target.value) / 100)}
            />
          </div>
          <button type="button" data-on={tilt > 0.85 ? "1" : "0"} onClick={() => snap(1)}>
            Section
          </button>
        </div>
      </header>

      <div className={styles.stageWrap}>
        <Stage
          tiltRef={tiltRef}
          ve={ve}
          minMw={minMw}
          yearFrom={yearFrom}
          yearTo={yearTo}
          depth={depth}
          selectedId={selectedId}
          reduceMotion={reduce}
          onTilt={applyTilt}
          onSelect={setSelectedId}
        />
        <div
          className={styles.guides}
          style={
            {
              "--section": String(tilt),
            } as CSSProperties
          }
        >
          <div className={styles.scale}>
            <span className={styles.scaleBar} />
            <span>100 km horizontal</span>
          </div>
          <div className={styles.depthRail}>Depth, km · vertical ×{ve}</div>
          <div className={styles.bearing}>{bearing}</div>
        </div>
      </div>

      <footer className={styles.collar}>
        <div className={styles.ask}>
          <div className={styles.row}>
            <span className={styles.tag}>Magnitude</span>
            <input
              type="range"
              min={45}
              max={75}
              step={1}
              value={Math.round(minMw * 10)}
              aria-label="Minimum magnitude"
              onChange={(e) => setMinMw(Number(e.target.value) / 10)}
            />
            <span className={styles.read}>Mw ≥ {minMw.toFixed(1)}</span>
          </div>
          <div className={styles.row}>
            <span className={styles.tag}>From</span>
            <input
              type="range"
              min={YEAR_MIN}
              max={YEAR_MAX}
              step={1}
              value={yearFrom}
              aria-label="Catalog start year"
              onChange={(e) => {
                const y = Number(e.target.value);
                setYearFrom(y);
                if (y > yearTo) setYearTo(y);
              }}
            />
            <span className={styles.read}>{yearFrom}</span>
          </div>
          <div className={styles.row}>
            <span className={styles.tag}>Through</span>
            <input
              type="range"
              min={YEAR_MIN}
              max={YEAR_MAX}
              step={1}
              value={yearTo}
              aria-label="Catalog end year"
              onChange={(e) => {
                const y = Number(e.target.value);
                setYearTo(y);
                if (y < yearFrom) setYearFrom(y);
              }}
            />
            <span className={styles.read}>{yearTo}</span>
          </div>
          <div className={styles.row}>
            <span className={styles.tag}>Depth</span>
            <div className={styles.chips} role="group" aria-label="Depth band">
              {(
                [
                  ["all", "All"],
                  ["shallow", "0–70 km"],
                  ["mid", "70–150 km"],
                  ["deep", "150 km+"],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  data-on={depth === id ? "1" : "0"}
                  onClick={() => setDepth(id)}
                >
                  {label}
                </button>
              ))}
            </div>
            <span className={styles.read}>{visible} events</span>
          </div>
          <div className={styles.row}>
            <span className={styles.tag}>Vertical</span>
            <p className={styles.note} style={{ margin: 0 }}>
              Exaggeration ×{ve}
              {ve === 2
                ? " — one kilometre up the page is 0.5 km of depth. Standard for this geometry."
                : " — true scale. The slab is shallower than it first appears."}
            </p>
            <div className={styles.ve}>
              <button type="button" data-on={ve === 1 ? "1" : "0"} onClick={() => setVe(1)}>
                ×1
              </button>
              <button type="button" data-on={ve === 2 ? "1" : "0"} onClick={() => setVe(2)}>
                ×2
              </button>
            </div>
          </div>
        </div>
        <div className={styles.notes}>
          <div className={styles.pick} aria-live="polite">
            {selected ? <EventCard quake={selected} /> : <EmptyPick />}
          </div>
          <p className={styles.note}>{PROVENANCE}</p>
        </div>
      </footer>
    </div>
  );
}

function matchFilters(
  q: Quake,
  minMw: number,
  yearFrom: number,
  yearTo: number,
  depth: DepthBand,
) {
  if (q.mw < minMw - 1e-6) return false;
  const y = Math.floor(q.year);
  if (y < yearFrom || y > yearTo) return false;
  if (depth === "shallow" && q.depthKm > 70) return false;
  if (depth === "mid" && (q.depthKm <= 70 || q.depthKm > 150)) return false;
  if (depth === "deep" && q.depthKm <= 150) return false;
  return true;
}

function EmptyPick() {
  return (
    <>
      <span className={styles.kind}>Catalog</span>
      <strong>
        {STATS.total} events · {STATS.observed} observed
      </strong>
      <p>Tap a hypocentre. Size is magnitude. Depth is position, not colour.</p>
    </>
  );
}

function EventCard({ quake }: { quake: Quake }) {
  return (
    <>
      <span className={styles.kind}>
        {quake.kind === "observed" ? "Observed" : "Modelled"} · {quake.source}
      </span>
      <strong>
        {quake.name ? quake.name : "Hypocentre"} · Mw {quake.mw.toFixed(1)}
      </strong>
      <p>
        {quake.depthKm.toFixed(1)} km · {quake.lat.toFixed(3)}°N {quake.lon.toFixed(3)}°E
        <br />
        {formatIso(quake.iso)}
      </p>
    </>
  );
}

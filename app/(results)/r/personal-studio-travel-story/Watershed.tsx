"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

import {
  DAYS,
  RIVER,
  RIVER_KM,
  STATIONS,
  WALKER,
} from "./journal";
import {
  channelPx,
  formatKm,
  formatWidth,
  landscapeAt,
  lastDay,
  tintAt,
  widthAt,
} from "./model";
import Rail from "./Rail";
import Spring from "./Spring";
import Water from "./Water";
import s from "./watershed.module.css";

function usePhone(): boolean {
  const [phone, setPhone] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 720px)");
    const apply = () => setPhone(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);
  return phone;
}

export default function Watershed() {
  const [inRiver, setInRiver] = useState(false);
  const [km, setKm] = useState(0.2);
  const [maxChannel, setMaxChannel] = useState(280);
  const lock = useRef(false);
  const nodes = useRef<Map<string, HTMLElement>>(new Map());
  const phone = usePhone();

  const widthM = widthAt(km);
  const tint = tintAt(km);
  const land = landscapeAt(km);
  const day = lastDay(km);
  const channel = channelPx(widthM, maxChannel);

  useLayoutEffect(() => {
    const measure = () => {
      const w = window.innerWidth;
      setMaxChannel(w < 720 ? Math.min(200, w * 0.48) : Math.min(w * 0.44, 560));
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  const seek = useCallback((next: number) => {
    const target = Math.max(0, Math.min(RIVER_KM, next));
    setKm(target);
    const ids = STATIONS.map((st) => st.id);
    let i = 0;
    while (i < ids.length - 1 && STATIONS[i + 1].km < target) i += 1;
    const a = nodes.current.get(STATIONS[i].id);
    const b = nodes.current.get(STATIONS[Math.min(i + 1, ids.length - 1)].id);
    if (!a) return;
    lock.current = true;
    if (!b || a === b) {
      a.scrollIntoView({ block: "start" });
    } else {
      const t =
        (target - STATIONS[i].km) /
        Math.max(0.01, STATIONS[Math.min(i + 1, ids.length - 1)].km - STATIONS[i].km);
      const top =
        a.getBoundingClientRect().top +
        window.scrollY +
        (b.getBoundingClientRect().top +
          window.scrollY -
          (a.getBoundingClientRect().top + window.scrollY)) *
          t;
      window.scrollTo({ top: Math.max(0, top - 56) });
    }
    window.setTimeout(() => {
      lock.current = false;
    }, 80);
  }, []);

  useEffect(() => {
    if (!inRiver) return;
    const onScroll = () => {
      if (lock.current) return;
      const mid = window.scrollY + window.innerHeight * 0.38;
      let best = STATIONS[0];
      let bestDist = Infinity;
      for (const st of STATIONS) {
        const el = nodes.current.get(st.id);
        if (!el) continue;
        const y = el.getBoundingClientRect().top + window.scrollY;
        const d = Math.abs(y - mid);
        if (d < bestDist) {
          best = st;
          bestDist = d;
        }
      }
      const idx = STATIONS.indexOf(best);
      const prev = STATIONS[Math.max(0, idx - 1)];
      const next = STATIONS[Math.min(STATIONS.length - 1, idx + 1)];
      const el = nodes.current.get(best.id);
      const elN = nodes.current.get(next.id);
      if (!el) {
        setKm(best.km);
        return;
      }
      const y0 = el.getBoundingClientRect().top + window.scrollY;
      const y1 = elN
        ? elN.getBoundingClientRect().top + window.scrollY
        : y0 + el.offsetHeight;
      const t = y1 === y0 ? 0 : Math.max(0, Math.min(1, (mid - y0) / (y1 - y0)));
      const kmA = mid < y0 ? prev.km : best.km;
      const kmB = mid < y0 ? best.km : next.km;
      const u = mid < y0 ? 0 : t;
      setKm(kmA + (kmB - kmA) * u);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [inRiver]);

  useEffect(() => {
    if (!inRiver) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "j" || e.key === "J") {
        const i = STATIONS.findIndex((st) => st.km > km + 0.05);
        if (i >= 0) seek(STATIONS[i].km);
      } else if (e.key === "k" || e.key === "K") {
        const up = [...STATIONS].reverse().find((st) => st.km < km - 0.05);
        if (up) seek(up.km);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [inRiver, km, seek]);

  const vars = {
    "--paper": tint.paper,
    "--ink": tint.ink,
    "--mute": tint.mute,
    "--water": tint.water,
    "--silt": tint.silt,
    "--rule": tint.rule,
    "--live-h": `${Math.max(4, channel)}px`,
  } as React.CSSProperties;

  return (
    <div
      className={s.root}
      style={vars}
      data-phase={inRiver ? "river" : "bank"}
    >
      <a className={s.corner} href="/tasks/personal-studio-travel-story">
        Task
      </a>

      {!inRiver ? (
        <Spring
          onCross={() => {
            setInRiver(true);
            setKm(0.2);
            window.requestAnimationFrame(() => window.scrollTo(0, 0));
          }}
        />
      ) : (
        <div className={s.descent}>
          <header className={s.gauge}>
            <strong>
              Day {day.day}
              <em> / {DAYS}</em>
            </strong>
            <span>
              {formatKm(km)}
              <em> · {RIVER}</em>
            </span>
            <span>
              {formatWidth(widthM)}
              <em> · {land.label}</em>
            </span>
            <div className={s.live} aria-hidden>
              <span style={{ width: channel }} />
            </div>
          </header>

          <div className={s.shell}>
            <div className={s.railWrap}>
              <Rail km={km} horizontal={phone} onSeek={seek} />
            </div>

            <div className={s.stream}>
              {STATIONS.map((st, i) => {
                const next = STATIONS[i + 1];
                const spanKm = next ? next.km - st.km : 4;
                const localW = channelPx(st.widthM, maxChannel);
                const nextW = channelPx(next?.widthM ?? st.widthM, maxChannel);
                const span = st.kind === "mark" ? Math.max(8, spanKm * 2.6) : 0;
                return (
                  <article
                    key={st.id}
                    id={st.id}
                    ref={(el) => {
                      if (el) nodes.current.set(st.id, el);
                      else nodes.current.delete(st.id);
                    }}
                    className={s.station}
                    data-kind={st.kind}
                    style={
                      {
                        "--channel-max": `${Math.max(localW, nextW)}px`,
                        "--span": `${span}rem`,
                      } as React.CSSProperties
                    }
                  >
                    <Water top={localW} bottom={nextW} phone={phone} />
                    {st.kind === "day" && st.paras ? (
                      <div className={s.copy}>
                        <p className={s.markLine}>
                          <b>Day {st.day}</b>
                          <span>{st.km.toFixed(1)} km</span>
                          <span>{formatWidth(st.widthM)}</span>
                          <span>{st.place}</span>
                        </p>
                        <h2 className={s.place}>{st.crumb}</h2>
                        {st.paras.map((p) => (
                          <p key={p.slice(0, 24)}>{p}</p>
                        ))}
                      </div>
                    ) : (
                      <p className={s.crumbOnly}>{st.crumb}</p>
                    )}
                  </article>
                );
              })}

              <footer className={s.end}>
                <p>
                  {WALKER} walked {RIVER} for forty-one days. This page is a
                  composed account of that shape of journey — peat spring to
                  industrial estuary — not a log, and not a map. The channel is
                  drawn on a log section so the first month is still visible.
                  Widths are modelled.
                </p>
                <p className={phone ? s.hidden : undefined}>
                  j / k between stations. The long section on the edge seeks.
                </p>
              </footer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

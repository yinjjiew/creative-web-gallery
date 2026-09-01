"use client";

import { type Run } from "./model";
import { formatStamp } from "./series";
import styles from "./grid.module.css";

const W = 168;
const H = 56;
const PAD_L = 8;
const PAD_R = 2;
const PAD_T = 4;
const PAD_B = 10;

export default function Week({ run, start }: { run: Run; start: number }) {
  const at = Math.max(0, Math.min(run.demand.length - 168, start));
  const innerW = W - PAD_L - PAD_R;
  const innerH = H - PAD_T - PAD_B;
  const x = (i: number) => PAD_L + (i / 167) * innerW;

  let max = 8;
  for (let i = 0; i < 168; i++) {
    const v = run.demand[at + i] + run.unserved[at + i];
    if (v > max) max = v;
  }
  max = Math.ceil(max / 5) * 5;
  const y = (gw: number) => PAD_T + innerH - (gw / max) * innerH;

  const stack = (i: number) => {
    const sol = run.solar[at + i];
    const win = run.wind[at + i];
    const nuc = run.nuclear[at + i];
    const gas = run.gas[at + i];
    const uns = run.unserved[at + i];
    const batt = Math.max(
      0,
      run.demand[at + i] - sol - win - nuc - gas - uns,
    );
    return { sol, win, nuc, batt, gas, uns };
  };

  const bands: { cls: string; key: keyof ReturnType<typeof stack> }[] = [
    { cls: styles.wkSolar, key: "sol" },
    { cls: styles.wkWind, key: "win" },
    { cls: styles.wkNuc, key: "nuc" },
    { cls: styles.wkBatt, key: "batt" },
    { cls: styles.wkGas, key: "gas" },
    { cls: styles.wkOut, key: "uns" },
  ];

  const area = (key: keyof ReturnType<typeof stack>) => {
    const top: string[] = [];
    const bot: string[] = [];
    for (let i = 0; i < 168; i++) {
      const s = stack(i);
      let base = 0;
      for (const b of bands) {
        if (b.key === key) break;
        base += s[b.key];
      }
      const hi = base + s[key];
      top.push(`${x(i).toFixed(2)},${y(hi).toFixed(2)}`);
      bot.push(`${x(i).toFixed(2)},${y(base).toFixed(2)}`);
    }
    return `${top.join(" ")} ${bot.reverse().join(" ")}`;
  };

  const demandLine = Array.from({ length: 168 }, (_, i) => {
    return `${x(i).toFixed(2)},${y(run.demand[at + i]).toFixed(2)}`;
  }).join(" ");

  const socCap = Math.max(
    0.01,
    ...Array.from({ length: 168 }, (_, i) => run.soc[at + i]),
  );
  const socLine = Array.from({ length: 168 }, (_, i) => {
    const yy = H - 2 - (run.soc[at + i] / socCap) * 6;
    return `${x(i).toFixed(2)},${yy.toFixed(2)}`;
  }).join(" ");

  return (
    <figure className={styles.week}>
      <figcaption className={styles.weekCap}>
        Seven days from {formatStamp(at)} · demand is the ink line · the thin
        strip at the bottom is battery charge
      </figcaption>
      <svg
        className={styles.weekSvg}
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={`Generation and demand for the week starting ${formatStamp(at)}`}
      >
        {bands.map((b) => (
          <polygon key={b.key} className={b.cls} points={area(b.key)} />
        ))}
        <polyline className={styles.wkDemand} points={demandLine} fill="none" />
        <polyline className={styles.wkSoc} points={socLine} fill="none" />
        <text className={styles.wkTick} x="1" y={y(max) + 3}>
          {max} GW
        </text>
        <text className={styles.wkTick} x="1" y={y(0)}>
          0
        </text>
      </svg>
    </figure>
  );
}

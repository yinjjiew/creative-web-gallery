/**
 * Six compositions, written as separations.
 *
 * A score does not draw colour. It draws a greyscale COVERAGE field per plate —
 * white means "lay a full film of this ink here", black means "leave the paper
 * alone". The press turns each field into a halftone at that plate's screen
 * angle and multiplies the inks together, which is the only way the overlaps
 * come out right.
 *
 * Every score is written for the job: large forms, a single focal mass, and an
 * anchor placed in the part of the sheet the operating system leaves alone.
 */
import { Rng, fbm } from "./rng";

export type ScoreId = "solar" | "strata" | "meridian" | "lens" | "terrace" | "plot";

export const SCORES: { id: ScoreId; name: string; note: string }[] = [
  { id: "solar", name: "Solar", note: "One disc, concentric rings, a horizon." },
  { id: "strata", name: "Strata", note: "Sedimentary bands in flat tones." },
  { id: "meridian", name: "Meridian", note: "A ruled field deflected by a mass." },
  { id: "lens", name: "Lens", note: "Overlapping discs, printed for the overlaps." },
  { id: "terrace", name: "Terrace", note: "Nested ridges under a low sun." },
  { id: "plot", name: "Plot", note: "A modernist grid, three flat tones." },
];

export type Frame = {
  w: number;
  h: number;
  unit: number;
  diag: number;
  portrait: boolean;
  /** Fractions of height the OS will occupy, top and bottom. */
  keepTop: number;
  keepBottom: number;
};

type Ctx = CanvasRenderingContext2D;
export type PlateDraw = (ctx: Ctx) => void;

function tone(c: number): string {
  const v = Math.max(0, Math.min(255, Math.round(c * 255)));
  return `rgb(${v},${v},${v})`;
}

function toneA(c: number, a: number): string {
  const v = Math.max(0, Math.min(255, Math.round(c * 255)));
  return `rgba(${v},${v},${v},${a})`;
}

/**
 * Where the focal mass goes. On a phone the free room is the lower third —
 * below the lock clock, above the dock. On a laptop it is off to one side,
 * because the centre of the screen is where windows live.
 */
function anchorFor(rng: Rng, f: Frame): { x: number; y: number } {
  const candidates = f.portrait
    ? [
        { x: 0.5, y: 0.66 },
        { x: 0.42, y: 0.62 },
        { x: 0.58, y: 0.71 },
        { x: 0.5, y: 0.75 },
        { x: 0.36, y: 0.7 },
      ]
    : [
        { x: 0.29, y: 0.52 },
        { x: 0.71, y: 0.46 },
        { x: 0.24, y: 0.6 },
        { x: 0.76, y: 0.58 },
        { x: 0.5, y: 0.62 },
      ];
  const a = rng.pick(candidates);
  const lo = f.keepTop + 0.05;
  const hi = 1 - f.keepBottom - 0.04;
  const y = Math.min(Math.max(a.y, lo), Math.max(lo, hi));
  return { x: a.x * f.w, y: y * f.h };
}

type Op = { plate: number; run: PlateDraw };

class Separation {
  readonly ops: Op[] = [];

  constructor(readonly plates: number) {}

  add(plate: number, run: PlateDraw) {
    this.ops.push({ plate: ((plate % this.plates) + this.plates) % this.plates, run });
  }

  build(): PlateDraw[] {
    return Array.from({ length: this.plates }, (_, i) => (ctx: Ctx) => {
      for (const op of this.ops) {
        if (op.plate !== i) continue;
        ctx.save();
        ctx.globalCompositeOperation = "source-over";
        op.run(ctx);
        ctx.restore();
      }
    });
  }
}

const TAU = Math.PI * 2;

/** Paints a full-bleed vertical ramp — the ground every score sits on. */
function ramp(ctx: Ctx, f: Frame, from: number, to: number) {
  const g = ctx.createLinearGradient(0, 0, 0, f.h);
  g.addColorStop(0, tone(from));
  g.addColorStop(1, tone(to));
  ctx.fillStyle = g;
  ctx.fillRect(-2, -2, f.w + 4, f.h + 4);
}

function disc(ctx: Ctx, x: number, y: number, r: number) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TAU);
  ctx.fill();
}

function solar(rng: Rng, f: Frame, sep: Separation, cov: (c: number) => number) {
  const a = anchorFor(rng, f);
  const R = f.unit * rng.range(0.3, 0.44);
  const discPlate = sep.plates > 1 ? 1 : 0;
  const groundPlate = 0;
  const flip = rng.chance(0.4);

  sep.add(groundPlate, (ctx) => {
    ramp(ctx, f, cov(flip ? 0.3 : 0.08), cov(flip ? 0.06 : 0.3));
  });

  // Halation: the glow the ink leaves around a solid, additive so it reads as
  // more ink rather than as a different shape.
  sep.add(groundPlate, (ctx) => {
    ctx.globalCompositeOperation = "lighter";
    const g = ctx.createRadialGradient(a.x, a.y, R * 0.6, a.x, a.y, R * rng.range(2.1, 3.1));
    g.addColorStop(0, toneA(cov(0.42), 1));
    g.addColorStop(0.55, toneA(cov(0.16), 0.7));
    g.addColorStop(1, toneA(0, 0));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, f.w, f.h);
  });

  const rings = rng.int(3, 6);
  sep.add(groundPlate, (ctx) => {
    ctx.strokeStyle = tone(cov(0.92));
    for (let i = 0; i < rings; i += 1) {
      const t = (i + 1) / rings;
      ctx.lineWidth = f.unit * (0.004 + 0.016 * (1 - t) * rng.next());
      ctx.beginPath();
      ctx.arc(a.x, a.y, R * (1.18 + 1.5 * t), 0, TAU);
      ctx.stroke();
    }
  });

  sep.add(discPlate, (ctx) => {
    ctx.fillStyle = tone(cov(0.86));
    disc(ctx, a.x, a.y, R);
    if (rng.chance(0.45)) {
      // Eclipse: a knockout offset off the disc, which is how you get a
      // crescent out of a two-plate separation.
      const d = R * rng.range(0.3, 0.6);
      const ang = rng.range(0, TAU);
      ctx.fillStyle = "#000";
      disc(ctx, a.x + Math.cos(ang) * d, a.y + Math.sin(ang) * d, R * rng.range(0.72, 0.95));
    }
  });

  // Horizon: one hairline, well away from the disc, to give the eye a datum.
  const hy = a.y + R * rng.range(1.5, 2.4);
  if (hy < f.h * 0.94) {
    sep.add(discPlate, (ctx) => {
      ctx.fillStyle = tone(cov(0.95));
      ctx.fillRect(-2, hy, f.w + 4, Math.max(1, f.unit * 0.004));
    });
  }
}

function strata(rng: Rng, f: Frame, sep: Separation, cov: (c: number) => number) {
  const rhythm = rng.shuffled([1, 1, 2, 3, 5, 3, 2, 8].slice(0, rng.int(5, 8)));
  const total = rhythm.reduce((s, v) => s + v, 0);
  const ladder = [0.16, 0.3, 0.46, 0.64, 0.86];
  let y = 0;
  let last = -1;
  const bands: { y: number; h: number; plate: number; c: number; ramped: boolean }[] = [];
  rhythm.forEach((r, i) => {
    const bh = (r / total) * f.h;
    let idx = rng.int(0, ladder.length - 1);
    if (idx === last) idx = (idx + 1 + rng.int(0, 1)) % ladder.length;
    last = idx;
    bands.push({
      y,
      h: bh,
      plate: i % sep.plates,
      c: ladder[idx],
      ramped: rng.chance(0.3),
    });
    y += bh;
  });

  for (const b of bands) {
    sep.add(b.plate, (ctx) => {
      if (b.ramped) {
        const g = ctx.createLinearGradient(0, b.y, 0, b.y + b.h);
        g.addColorStop(0, tone(cov(b.c)));
        g.addColorStop(1, tone(cov(b.c * 0.25)));
        ctx.fillStyle = g;
      } else {
        ctx.fillStyle = tone(cov(b.c));
      }
      ctx.fillRect(-2, b.y, f.w + 4, b.h + 0.6);
    });
  }

  // One form crossing the bands, so the stack reads as a composition rather
  // than a swatch chart.
  const a = anchorFor(rng, f);
  const R = f.unit * rng.range(0.2, 0.34);
  const crossPlate = sep.plates - 1;
  sep.add(crossPlate, (ctx) => {
    ctx.globalCompositeOperation = "lighten";
    ctx.fillStyle = tone(cov(0.72));
    if (rng.chance(0.5)) {
      disc(ctx, a.x, a.y, R);
    } else {
      ctx.fillRect(a.x - R * 0.34, -2, R * 0.68, f.h + 4);
    }
  });

  sep.add(0, (ctx) => {
    ctx.fillStyle = tone(cov(0.95));
    const rules = rng.int(1, 3);
    for (let i = 0; i < rules; i += 1) {
      const b = rng.pick(bands);
      ctx.fillRect(-2, b.y + b.h - f.unit * 0.003, f.w + 4, Math.max(1, f.unit * 0.0035));
    }
  });
}

function meridian(rng: Rng, f: Frame, sep: Separation, cov: (c: number) => number) {
  const a = anchorFor(rng, f);
  const lines = rng.int(38, 76);
  const alternate = rng.chance(0.45) && sep.plates > 1;
  const attractors = [
    { x: a.x, y: a.y, r: f.unit * rng.range(0.3, 0.55), amp: f.unit * rng.range(0.09, 0.2) * rng.sign() },
  ];
  if (rng.chance(0.6)) {
    attractors.push({
      x: f.w * rng.range(0.1, 0.9),
      y: f.h * rng.range(0.1, 0.9),
      r: f.unit * rng.range(0.16, 0.34),
      amp: f.unit * rng.range(0.04, 0.12) * rng.sign(),
    });
  }

  const deflect = (x: number, y: number) => {
    let dy = 0;
    for (const at of attractors) {
      const d2 = (x - at.x) ** 2 + (y - at.y) ** 2;
      dy += at.amp * Math.exp(-d2 / (2 * at.r * at.r));
    }
    return dy;
  };

  sep.add(sep.plates - 1, (ctx) => {
    ramp(ctx, f, cov(0.06), cov(0.2));
  });

  // The mass the field bends around is printed, faintly, so the bulge has a
  // reason on the page.
  sep.add(sep.plates - 1, (ctx) => {
    ctx.globalCompositeOperation = "lighten";
    const g = ctx.createRadialGradient(a.x, a.y, 0, a.x, a.y, attractors[0].r * 1.4);
    g.addColorStop(0, toneA(cov(0.5), 1));
    g.addColorStop(1, toneA(0, 0));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, f.w, f.h);
  });

  const step = Math.max(3, f.w / 220);
  for (let i = 0; i < lines; i += 1) {
    const baseY = ((i + 0.5) / lines) * f.h;
    const plate = alternate ? i % sep.plates : 0;
    const weight = f.unit * (0.0032 + 0.0022 * Math.abs(Math.sin(i * 0.7)));
    sep.add(plate, (ctx) => {
      ctx.strokeStyle = tone(cov(0.88));
      ctx.lineWidth = weight;
      ctx.lineCap = "round";
      ctx.beginPath();
      for (let x = -step; x <= f.w + step; x += step) {
        const y = baseY + deflect(x, baseY);
        if (x <= -step) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    });
  }
}

function lens(rng: Rng, f: Frame, sep: Separation, cov: (c: number) => number) {
  const a = anchorFor(rng, f);
  const n = rng.int(3, 5);
  const ang = rng.range(0, Math.PI);
  const spacing = f.unit * rng.range(0.24, 0.4);
  const ladder = [0.42, 0.56, 0.72];

  sep.add(0, (ctx) => {
    ramp(ctx, f, cov(0.1), cov(0.04));
  });

  for (let i = 0; i < n; i += 1) {
    const t = i - (n - 1) / 2;
    const cx = a.x + Math.cos(ang) * spacing * t;
    const cy = a.y + Math.sin(ang) * spacing * t;
    const r = f.unit * rng.range(0.22, 0.4);
    const squash = rng.chance(0.4) ? rng.range(0.6, 0.85) : 1;
    const rot = rng.range(0, Math.PI);
    const c = ladder[i % ladder.length];
    const plate = i % sep.plates;
    sep.add(plate, (ctx) => {
      ctx.globalCompositeOperation = "lighten";
      ctx.fillStyle = tone(cov(c));
      ctx.beginPath();
      ctx.ellipse(cx, cy, r, r * squash, rot, 0, TAU);
      ctx.fill();
    });
  }

  // One small solid at full film, as a point of focus among the washes.
  const accent = { x: a.x + f.unit * rng.range(-0.3, 0.3), y: a.y + f.unit * rng.range(-0.3, 0.3) };
  sep.add(n % sep.plates, (ctx) => {
    ctx.globalCompositeOperation = "lighten";
    ctx.fillStyle = tone(cov(0.98));
    disc(ctx, accent.x, accent.y, f.unit * rng.range(0.035, 0.075));
  });
}

function terrace(rng: Rng, f: Frame, sep: Separation, cov: (c: number) => number) {
  const a = anchorFor(rng, f);
  const ridges = rng.int(3, 6);
  const sunR = f.unit * rng.range(0.16, 0.28);
  const horizon = Math.min(f.h * 0.88, a.y + sunR * rng.range(0.6, 1.5));

  sep.add(0, (ctx) => {
    ramp(ctx, f, cov(0.07), cov(0.26));
  });

  sep.add(sep.plates > 1 ? 1 : 0, (ctx) => {
    ctx.fillStyle = tone(cov(0.7));
    disc(ctx, a.x, a.y, sunR);
  });

  const phases = Array.from({ length: ridges * 2 }, () => rng.range(0, TAU));
  for (let i = 0; i < ridges; i += 1) {
    const t = i / Math.max(1, ridges - 1);
    const base = horizon + (f.h - horizon) * (0.1 + 0.86 * t);
    const amp = f.unit * (0.05 + 0.07 * (1 - t)) * rng.range(0.6, 1.2);
    const f1 = rng.range(0.9, 2.1);
    const f2 = rng.range(2.4, 4.6);
    const plate = i % sep.plates;
    const c = 0.34 + 0.56 * t;
    sep.add(plate, (ctx) => {
      ctx.fillStyle = tone(cov(c));
      ctx.beginPath();
      ctx.moveTo(-2, f.h + 2);
      const step = Math.max(3, f.w / 160);
      for (let x = -2; x <= f.w + 2; x += step) {
        const u = x / f.w;
        const y =
          base -
          amp * (Math.sin(u * TAU * f1 + phases[i]) * 0.62 + Math.sin(u * TAU * f2 + phases[i + ridges]) * 0.38);
        ctx.lineTo(x, y);
      }
      ctx.lineTo(f.w + 2, f.h + 2);
      ctx.closePath();
      ctx.fill();
    });
  }
}

function plot(rng: Rng, f: Frame, sep: Separation, cov: (c: number) => number) {
  const cols = f.portrait ? rng.int(3, 5) : rng.int(5, 7);
  const cw = f.w / cols;
  const rows = Math.max(3, Math.round((f.h / cw) * 0.92));
  const rh = f.h / rows;
  const ladder = [0.22, 0.44, 0.68, 0.92];

  sep.add(0, (ctx) => {
    ctx.fillStyle = tone(cov(0.08));
    ctx.fillRect(-2, -2, f.w + 4, f.h + 4);
  });

  const blocks = rng.int(2, 4);
  const used: string[] = [];
  for (let i = 0; i < blocks; i += 1) {
    const bw = rng.int(1, Math.max(1, cols - 1));
    const bh = rng.int(1, Math.max(1, Math.min(rows - 1, Math.round(rows * 0.4))));
    const cx = rng.int(0, cols - bw);
    const cy = rng.int(0, rows - bh);
    used.push(`${cx},${cy}`);
    const c = ladder[rng.int(0, ladder.length - 1)];
    const plate = i % sep.plates;
    sep.add(plate, (ctx) => {
      ctx.globalCompositeOperation = "lighten";
      ctx.fillStyle = tone(cov(c));
      ctx.fillRect(cx * cw, cy * rh, bw * cw + 0.5, bh * rh + 0.5);
    });
  }

  const singles = rng.int(3, 8);
  for (let i = 0; i < singles; i += 1) {
    const cx = rng.int(0, cols - 1);
    const cy = rng.int(0, rows - 1);
    const c = ladder[rng.int(0, ladder.length - 1)];
    const plate = (i + 1) % sep.plates;
    const inset = cw * 0.16;
    sep.add(plate, (ctx) => {
      ctx.globalCompositeOperation = "lighten";
      ctx.fillStyle = tone(cov(c));
      ctx.fillRect(cx * cw + inset, cy * rh + inset, cw - inset * 2, rh - inset * 2);
    });
  }

  const a = anchorFor(rng, f);
  const gx = Math.round(a.x / cw) * cw;
  const gy = Math.round(a.y / rh) * rh;
  sep.add(sep.plates - 1, (ctx) => {
    ctx.globalCompositeOperation = "lighten";
    ctx.fillStyle = tone(cov(0.95));
    disc(ctx, gx, gy, Math.min(cw, rh) * rng.range(0.5, 0.9));
  });

  sep.add(0, (ctx) => {
    ctx.fillStyle = tone(cov(0.96));
    const t = Math.max(1, f.unit * 0.0035);
    ctx.fillRect(-2, Math.round(rng.int(1, rows - 1)) * rh, f.w + 4, t);
    ctx.fillRect(Math.round(rng.int(1, cols - 1)) * cw, -2, t, f.h + 4);
  });
}

export function buildScore(
  id: ScoreId,
  seed: number,
  f: Frame,
  plates: number,
  weight: number
): PlateDraw[] {
  const rng = new Rng(seed);
  const sep = new Separation(plates);
  const k = 0.5 + weight * 1.0;
  const cov = (c: number) => Math.max(0, Math.min(1, c * k));

  switch (id) {
    case "solar":
      solar(rng, f, sep, cov);
      break;
    case "strata":
      strata(rng, f, sep, cov);
      break;
    case "meridian":
      meridian(rng, f, sep, cov);
      break;
    case "lens":
      lens(rng, f, sep, cov);
      break;
    case "terrace":
      terrace(rng, f, sep, cov);
      break;
    case "plot":
      plot(rng, f, sep, cov);
      break;
  }
  return sep.build();
}

/** Unused directly by the press, exported so the tool can label ink coverage. */
export function inkTexture(x: number, y: number, seed: number): number {
  return fbm(x, y, seed, 3);
}

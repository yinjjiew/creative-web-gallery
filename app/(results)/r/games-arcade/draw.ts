/**
 * The box, drawn.
 *
 * Enamel, brass, cast iron, oil lamps, a faded diagram in the window.
 * Nothing here is a tileset. The interior is cached on resize; trains,
 * arms and levers are the only thing that moves.
 */
import {
  CW,
  HOME_T,
  OPP,
  ROADS,
  pointsLock,
  signalLock,
  type Game,
  type Lever,
  type Road,
  type Train,
} from "./engine";

export interface Hit {
  i: number;
  x: number;
  y: number;
  r: number;
}

const CREAM = "#ead6b0";
const BRASS = "#c9a35a";
const MAROON = "#7a1f1c";

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function far(road: Road): { x: number; y: number } {
  switch (road) {
    case "A":
      return { x: 0.5, y: 0.1 };
    case "B":
      return { x: 0.92, y: 0.5 };
    case "C":
      return { x: 0.5, y: 0.9 };
    case "D":
      return { x: 0.08, y: 0.5 };
  }
}

function throat(road: Road): { x: number; y: number } {
  switch (road) {
    case "A":
      return { x: 0.5, y: 0.36 };
    case "B":
      return { x: 0.66, y: 0.5 };
    case "C":
      return { x: 0.5, y: 0.64 };
    case "D":
      return { x: 0.34, y: 0.5 };
  }
}

export function routePos(from: Road, to: Road, t: number): { x: number; y: number } {
  const a = far(from);
  const th = throat(from);
  const c = { x: 0.5, y: 0.5 };
  const out = throat(to);
  const b = far(to);
  if (t <= HOME_T) {
    const u = t / HOME_T;
    return { x: lerp(a.x, th.x, u), y: lerp(a.y, th.y, u) };
  }
  const u = (t - HOME_T) / (1 - HOME_T);
  if (u < 0.35) {
    const k = u / 0.35;
    return { x: lerp(th.x, c.x, k), y: lerp(th.y, c.y, k) };
  }
  if (u < 0.6) {
    const k = (u - 0.35) / 0.25;
    return { x: lerp(c.x, out.x, k), y: lerp(c.y, out.y, k) };
  }
  const k = (u - 0.6) / 0.4;
  return { x: lerp(out.x, b.x, k), y: lerp(out.y, b.y, k) };
}

function grainCanvas(w: number, h: number) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const g = c.getContext("2d")!;
  const img = g.createImageData(w, h);
  for (let i = 0; i < img.data.length; i += 4) {
    const n = 118 + Math.random() * 40;
    img.data[i] = n;
    img.data[i + 1] = n * 0.92;
    img.data[i + 2] = n * 0.78;
    img.data[i + 3] = 28 + Math.random() * 18;
  }
  g.putImageData(img, 0, 0);
  return c;
}

export class Stage {
  w = 1;
  h = 1;
  dpr = 1;
  hits: Hit[] = [];
  /** Window rect in CSS pixels. */
  win = { x: 0, y: 0, w: 1, h: 1 };
  frameY = 0;
  private grain: HTMLCanvasElement | null = null;
  private back: HTMLCanvasElement | null = null;
  private flicker = 1;

  resize(w: number, h: number, dpr: number) {
    this.w = w;
    this.h = h;
    this.dpr = dpr;
    this.grain = grainCanvas(Math.max(2, Math.floor(w / 2)), Math.max(2, Math.floor(h / 2)));
    this.back = null;
    this.layout();
  }

  private layout() {
    const { w, h } = this;
    const phone = w < 700 || h < 640;
    const top = phone ? 8 : Math.max(10, h * 0.018);
    const left = phone ? 10 : Math.max(16, w * 0.04);
    const right = left;
    const frameH = phone ? Math.max(168, h * 0.34) : Math.max(200, h * 0.3);
    this.frameY = h - frameH;
    this.win = {
      x: left,
      y: top + (phone ? 52 : 8),
      w: w - left - right,
      h: this.frameY - top - (phone ? 70 : 28),
    };
  }

  private ensureBack() {
    if (this.back) return;
    const c = document.createElement("canvas");
    c.width = Math.max(1, Math.round(this.w * this.dpr));
    c.height = Math.max(1, Math.round(this.h * this.dpr));
    const ctx = c.getContext("2d")!;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    this.paintInterior(ctx);
    this.back = c;
  }

  private paintInterior(ctx: CanvasRenderingContext2D) {
    const { w, h, win } = this;

    ctx.fillStyle = "#1a120e";
    ctx.fillRect(0, 0, w, h);

    // Vertical oak boards.
    for (let x = 0; x < w; x += 28) {
      const shade = 22 + ((x * 13) % 9);
      ctx.fillStyle = `rgb(${shade + 18},${shade + 6},${shade})`;
      ctx.fillRect(x, 0, 26, h);
      ctx.fillStyle = "rgba(0,0,0,0.18)";
      ctx.fillRect(x + 24, 0, 2, h);
      ctx.fillStyle = "rgba(80,50,30,0.12)";
      ctx.fillRect(x + 3, 0, 1, h);
    }

    // Window reveal — cream paint gone tobacco.
    const r = 10;
    ctx.fillStyle = "#4a3828";
    ctx.fillRect(win.x - r, win.y - r, win.w + r * 2, win.h + r * 2);
    ctx.fillStyle = "#c4ae86";
    ctx.fillRect(win.x - 7, win.y - 7, win.w + 14, win.h + 14);
    ctx.fillStyle = "#2a1c14";
    ctx.fillRect(win.x - 2, win.y - 2, win.w + 4, win.h + 4);

    // Mounted linen diagram — the working sheet, not a night view.
    const paper = ctx.createLinearGradient(win.x, win.y, win.x + win.w, win.y + win.h);
    paper.addColorStop(0, "#cbb892");
    paper.addColorStop(0.45, "#d4c19a");
    paper.addColorStop(1, "#b9a47a");
    ctx.fillStyle = paper;
    ctx.fillRect(win.x, win.y, win.w, win.h);

    // Foxing and a fold.
    ctx.fillStyle = "rgba(90, 60, 28, 0.07)";
    ctx.beginPath();
    ctx.ellipse(win.x + win.w * 0.18, win.y + win.h * 0.72, win.w * 0.16, win.h * 0.1, 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(40, 28, 12, 0.08)";
    ctx.fillRect(win.x + win.w * 0.49, win.y, 1.2, win.h);

    this.paintDiagram(ctx);

    ctx.strokeStyle = "#6a5438";
    ctx.lineWidth = 1;
    ctx.strokeRect(win.x + 1, win.y + 1, win.w - 2, win.h - 2);

    // Sill.
    ctx.fillStyle = "#8a6e48";
    ctx.fillRect(win.x - 10, win.y + win.h, win.w + 20, 10);
    ctx.fillStyle = "#c4ae86";
    ctx.fillRect(win.x - 12, win.y + win.h + 8, win.w + 24, 7);

    // Oil lamps on the sill.
    this.lampBase(ctx, win.x + 28, win.y + win.h + 4);
    this.lampBase(ctx, win.x + win.w - 28, win.y + win.h + 4);

    // Floorboards in the foreground.
    const fy = this.frameY - 18;
    ctx.fillStyle = "#241812";
    ctx.fillRect(0, fy, w, h - fy);
    for (let y = fy; y < h; y += 16) {
      ctx.fillStyle = `rgba(80,50,28,${0.08 + ((y * 3) % 5) * 0.015})`;
      ctx.fillRect(0, y, w, 14);
      ctx.fillStyle = "rgba(0,0,0,0.25)";
      ctx.fillRect(0, y + 14, w, 1);
    }

    // Cast-iron lever trough.
    const ty = this.frameY + 8;
    ctx.fillStyle = "#161310";
    ctx.beginPath();
    ctx.moveTo(20, h);
    ctx.lineTo(36, ty);
    ctx.lineTo(w - 36, ty);
    ctx.lineTo(w - 20, h);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#2a2218";
    ctx.fillRect(40, ty, w - 80, 10);
    ctx.fillStyle = BRASS;
    ctx.globalAlpha = 0.35;
    ctx.fillRect(48, ty + 3, w - 96, 2);
    ctx.globalAlpha = 1;

    // Number plate beam.
    ctx.fillStyle = "#1c1612";
    ctx.fillRect(48, h - 36, w - 96, 18);
  }

  private lampBase(ctx: CanvasRenderingContext2D, x: number, y: number) {
    ctx.fillStyle = "#3a2a18";
    ctx.beginPath();
    ctx.ellipse(x, y + 4, 10, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = BRASS;
    ctx.fillRect(x - 3, y - 16, 6, 16);
    ctx.beginPath();
    ctx.arc(x, y - 20, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#f0c878";
    ctx.beginPath();
    ctx.arc(x, y - 20, 5, 0, Math.PI * 2);
    ctx.fill();
  }

  private paintDiagram(ctx: CanvasRenderingContext2D) {
    const { win } = this;
    const wx = (u: number) => win.x + u * win.w;
    const wy = (v: number) => win.y + v * win.h;

    const drawRoad = (a: Road, b: Road) => {
      const p = far(a);
      const q = far(b);
      ctx.beginPath();
      ctx.moveTo(wx(p.x), wy(p.y));
      ctx.lineTo(wx(q.x), wy(q.y));
      ctx.stroke();
    };

    // Ballast wash.
    ctx.strokeStyle = "rgba(70, 52, 28, 0.28)";
    ctx.lineWidth = Math.max(16, win.w * 0.032);
    ctx.lineCap = "butt";
    drawRoad("A", "C");
    drawRoad("D", "B");

    // India-ink rails.
    ctx.strokeStyle = "#2a2218";
    ctx.lineWidth = 1.7;
    const rail = (a: Road, b: Road, ox: number, oy: number) => {
      const p = far(a);
      const q = far(b);
      ctx.beginPath();
      ctx.moveTo(wx(p.x) + ox, wy(p.y) + oy);
      ctx.lineTo(wx(q.x) + ox, wy(q.y) + oy);
      ctx.stroke();
    };
    const o = Math.max(3, win.w * 0.006);
    rail("A", "C", -o, 0);
    rail("A", "C", o, 0);
    rail("D", "B", 0, -o);
    rail("D", "B", 0, o);

    ctx.strokeStyle = "rgba(42, 34, 24, 0.35)";
    ctx.lineWidth = 1;
    const sleepers = (a: Road, b: Road, acrossX: number, acrossY: number) => {
      const p = far(a);
      const q = far(b);
      for (let i = 1; i < 18; i++) {
        const t = i / 18;
        const x = wx(lerp(p.x, q.x, t));
        const y = wy(lerp(p.y, q.y, t));
        ctx.beginPath();
        ctx.moveTo(x - acrossX, y - acrossY);
        ctx.lineTo(x + acrossX, y + acrossY);
        ctx.stroke();
      }
    };
    sleepers("A", "C", Math.max(6, win.w * 0.012), 0);
    sleepers("D", "B", 0, Math.max(6, win.h * 0.014));

    // Points marks — a faded V at each throat.
    ctx.strokeStyle = "rgba(201,163,90,0.45)";
    ctx.lineWidth = 1.4;
    for (const r of ROADS) {
      const th = throat(r);
      const rev = throat(CW[r]);
      ctx.beginPath();
      ctx.moveTo(wx(th.x), wy(th.y));
      ctx.lineTo(wx(rev.x * 0.35 + 0.5 * 0.65), wy(rev.y * 0.35 + 0.5 * 0.65));
      ctx.stroke();
    }

    // Road enamel plaques.
    const plaque = (road: Road, u: number, v: number) => {
      const x = wx(u);
      const y = wy(v);
      ctx.fillStyle = MAROON;
      ctx.fillRect(x - 14, y - 9, 28, 18);
      ctx.strokeStyle = BRASS;
      ctx.lineWidth = 1;
      ctx.strokeRect(x - 14, y - 9, 28, 18);
      ctx.fillStyle = CREAM;
      ctx.font = `700 12px ${this.fontEnamel()}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(road, x, y + 1);
    };
    plaque("A", 0.5, 0.16);
    plaque("B", 0.86, 0.5);
    plaque("C", 0.5, 0.84);
    plaque("D", 0.14, 0.5);

    ctx.textAlign = "left";
    ctx.fillStyle = "rgba(42, 34, 24, 0.45)";
    ctx.font = `500 10px ${this.fontEnamel()}`;
    ctx.fillText("MILLFORD  ·  EAST BOX", wx(0.04), wy(0.06));
  }

  enamel = "Impact, sans-serif";

  private fontEnamel() {
    return this.enamel || "Impact, sans-serif";
  }

  private winPoint(u: number, v: number) {
    return {
      x: this.win.x + u * this.win.w,
      y: this.win.y + v * this.win.h,
    };
  }

  private paintTrain(ctx: CanvasRenderingContext2D, g: Game, tr: Train) {
    const p = routePos(tr.from, tr.to, tr.t);
    const fogged = g.fog && tr.t < 0.38 && !tr.entered;
    if (fogged) return;
    const { x, y } = this.winPoint(p.x, p.y);
    const len = tr.cls === "goods" ? 22 : tr.cls === "pass" ? 16 : 12;
    // Heading from the last bit of route.
    const prevT = Math.max(0, tr.t - 0.02);
    const q = routePos(tr.from, tr.to, prevT);
    const dx = p.x - q.x;
    const dy = p.y - q.y;
    const ang = Math.atan2(dy * this.win.h, dx * this.win.w);

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(ang);
    ctx.fillStyle = "#1a1410";
    ctx.fillRect(-len * 0.55, -5, len, 10);
    ctx.fillStyle = tr.cls === "express" ? "#3a2018" : "#2a1c14";
    ctx.fillRect(-len * 0.5, -4, len * 0.9, 8);
    ctx.fillStyle = BRASS;
    ctx.globalAlpha = 0.5;
    ctx.fillRect(-len * 0.48, -3, len * 0.2, 2);
    ctx.globalAlpha = 1;
    // Oil lamp.
    const lamp = tr.cls === "express" ? "#fff1c8" : tr.cls === "pass" ? "#f0c060" : "#c48840";
    ctx.fillStyle = lamp;
    ctx.beginPath();
    ctx.arc(len * 0.42, 0, tr.cls === "express" ? 3.2 : 2.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    if (tr.t < HOME_T) {
      ctx.fillStyle = "#2a1c12";
      ctx.globalAlpha = 0.8;
      ctx.font = `700 10px ${this.fontEnamel()}`;
      ctx.textAlign = "center";
      ctx.fillText(`${tr.from}→${tr.to}`, x, y - 12);
      ctx.globalAlpha = 1;
    }
  }

  private paintSignal(ctx: CanvasRenderingContext2D, road: Road, off: number) {
    const th = throat(road);
    // Stand the post slightly off the running line.
    const side =
      road === "A" ? { x: 0.04, y: 0 } :
      road === "C" ? { x: -0.04, y: 0 } :
      road === "B" ? { x: 0, y: 0.05 } :
      { x: 0, y: -0.05 };
    const { x, y } = this.winPoint(th.x + side.x, th.y + side.y);
    const h = Math.max(16, this.win.h * 0.07);
    ctx.strokeStyle = "#6a5a44";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, y + 4);
    ctx.lineTo(x, y - h);
    ctx.stroke();
    // Lower-quadrant arm: 0 = horizontal danger, 1 = dropped ~50°.
    const ang = lerp(0, 0.85, off);
    ctx.save();
    ctx.translate(x, y - h + 4);
    ctx.rotate(ang);
    ctx.fillStyle = off > 0.7 ? "#d8c8a0" : "#b42828";
    ctx.fillRect(0, -2.2, 16, 4.4);
    ctx.fillStyle = CREAM;
    ctx.fillRect(12, -2.2, 4, 4.4);
    ctx.restore();
    // Lamp: red at danger, white/green at clear (1890s changeover).
    ctx.fillStyle = off > 0.7 ? "#b8e0a8" : "#d43030";
    ctx.beginPath();
    ctx.arc(x, y - h + 4, 2.2, 0, Math.PI * 2);
    ctx.fill();
  }

  private paintPoints(ctx: CanvasRenderingContext2D, road: Road, pos: number) {
    const th = throat(road);
    const n = throat(OPP[road]);
    const r = throat(CW[road]);
    const a = this.winPoint(th.x, th.y);
    const straight = this.winPoint(
      lerp(th.x, n.x, 0.35),
      lerp(th.y, n.y, 0.35)
    );
    const div = this.winPoint(
      lerp(th.x, r.x, 0.35),
      lerp(th.y, r.y, 0.35)
    );
    const to = {
      x: lerp(straight.x, div.x, pos),
      y: lerp(straight.y, div.y, pos),
    };
    ctx.strokeStyle = BRASS;
    ctx.globalAlpha = 0.75;
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  private paintLevers(ctx: CanvasRenderingContext2D, g: Game) {
    const { w, h } = this;
    const y0 = this.frameY + 22;
    const pivotY = h - 28;
    const n = 8;
    const left = w * 0.1;
    const right = w * 0.9;
    this.hits = [];

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    for (let i = 0; i < n; i++) {
      const l = g.levers[i]!;
      const x = lerp(left, right, n === 1 ? 0.5 : i / (n - 1));
      this.paintOneLever(ctx, l, x, y0, pivotY, g);
    }

    // Brass numbers on the beam.
    ctx.font = `700 11px ${this.fontEnamel()}`;
    for (let i = 0; i < n; i++) {
      const x = lerp(left, right, i / (n - 1));
      const l = g.levers[i]!;
      ctx.fillStyle = BRASS;
      ctx.fillText(String(i + 1), x, h - 27);
      ctx.fillStyle = l.kind === "signal" ? "rgba(234,214,176,0.45)" : "rgba(201,163,90,0.4)";
      ctx.font = `500 8px ${this.fontEnamel()}`;
      ctx.fillText(l.kind === "signal" ? "HOME" : "PTS", x, h - 16);
      ctx.font = `700 11px ${this.fontEnamel()}`;
    }
  }

  private paintOneLever(
    ctx: CanvasRenderingContext2D,
    l: Lever,
    x: number,
    y0: number,
    pivotY: number,
    g: Game
  ) {
    // pos 0: upright toward the window. pos 1: pulled toward the man.
    const ang = lerp(-0.22, 0.72, l.pos);
    const len = pivotY - y0;
    const hx = x + Math.sin(ang) * len;
    const hy = pivotY - Math.cos(ang) * len;
    const near = 0.75 + l.pos * 0.35;
    const locked =
      l.kind === "signal"
        ? !!signalLock(g, l.road) && l.target < 0.5
        : !!pointsLock(g, l.road);

    ctx.strokeStyle = "#2a241c";
    ctx.lineWidth = 7;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(x, pivotY);
    ctx.lineTo(hx, hy);
    ctx.stroke();
    ctx.strokeStyle = "#6a5a44";
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(x, pivotY);
    ctx.lineTo(hx, hy);
    ctx.stroke();

    const called = g.trains.some((tr) => tr.from === l.road && !tr.entered);
    const enamel = l.kind === "signal" ? MAROON : "#0c0b09";
    const r = 13 * near;
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.beginPath();
    ctx.ellipse(hx + 1, hy + 3, r * 0.9, r * 0.35, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = enamel;
    ctx.beginPath();
    ctx.arc(hx, hy, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = locked ? "#8a3030" : called ? "#f0d080" : "#8a7040";
    ctx.lineWidth = locked ? 2 : called ? 2.2 : 1.1;
    ctx.stroke();
    ctx.fillStyle = CREAM;
    ctx.font = `700 ${Math.round(10 * near)}px ${this.fontEnamel()}`;
    ctx.textAlign = "center";
    ctx.fillText(l.road, hx, hy + 0.5);

    this.hits.push({ i: l.i, x: hx, y: hy, r: Math.max(22, r + 10) });
  }

  private paintLamps(ctx: CanvasRenderingContext2D, g: Game) {
    const { win } = this;
    if (!g.reduced) {
      this.flicker = lerp(this.flicker, 0.88 + Math.random() * 0.14, 0.15);
    } else {
      this.flicker = 1;
    }
    const glow = ctx.createRadialGradient(
      win.x + 28,
      win.y + win.h,
      4,
      win.x + 28,
      win.y + win.h,
      90
    );
    glow.addColorStop(0, `rgba(240,190,90,${0.22 * this.flicker})`);
    glow.addColorStop(1, "rgba(240,190,90,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(win.x - 20, win.y + win.h - 80, 140, 120);

    const glow2 = ctx.createRadialGradient(
      win.x + win.w - 28,
      win.y + win.h,
      4,
      win.x + win.w - 28,
      win.y + win.h,
      90
    );
    glow2.addColorStop(0, `rgba(240,190,90,${0.2 * this.flicker})`);
    glow2.addColorStop(1, "rgba(240,190,90,0)");
    ctx.fillStyle = glow2;
    ctx.fillRect(win.x + win.w - 140, win.y + win.h - 80, 140, 120);
  }

  private paintFog(ctx: CanvasRenderingContext2D, g: Game) {
    if (!g.fog) return;
    const { win } = this;
    ctx.fillStyle = "rgba(40, 38, 36, 0.38)";
    ctx.fillRect(win.x, win.y, win.w, win.h);
  }

  draw(ctx: CanvasRenderingContext2D, g: Game) {
    const host = ctx.canvas.parentElement;
    if (host) {
      const fam = getComputedStyle(host).getPropertyValue("--enamel").trim();
      if (fam && fam !== this.enamel) {
        this.enamel = fam;
        this.back = null;
      } else if (fam) {
        this.enamel = fam;
      }
    }
    this.layout();
    this.ensureBack();
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    if (this.back) {
      ctx.drawImage(this.back, 0, 0, this.w, this.h);
    } else {
      ctx.fillStyle = "#1c1410";
      ctx.fillRect(0, 0, this.w, this.h);
    }

    // Moving iron on the diagram.
    for (const r of ROADS) {
      const pts = g.levers[ROADS.indexOf(r) * 2]!;
      this.paintPoints(ctx, r, pts.pos);
      const sig = g.levers[ROADS.indexOf(r) * 2 + 1]!;
      this.paintSignal(ctx, r, sig.pos);
    }
    for (const tr of g.trains) this.paintTrain(ctx, g, tr);
    this.paintFog(ctx, g);

    // Crash stain in the glass.
    if (g.phase === "dead") {
      ctx.fillStyle = "rgba(80, 10, 8, 0.28)";
      ctx.fillRect(this.win.x, this.win.y, this.win.w, this.win.h);
    }

    this.paintLamps(ctx, g);
    this.paintLevers(ctx, g);

    if (this.grain) {
      ctx.globalAlpha = 0.22;
      ctx.drawImage(this.grain, 0, 0, this.w, this.h);
      ctx.globalAlpha = 1;
    }
  }
}

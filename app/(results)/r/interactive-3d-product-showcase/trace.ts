/**
 * The pressure trace, drawn with the 2D canvas API.
 *
 * The axes are fixed — nought to fifteen bar, nought to thirty seconds — because
 * the point of the plot is to compare one pull against another and against the
 * flat line a pump would draw. Autoscaling would destroy that comparison. Two
 * previous pulls stay on the chart as ghosts for the same reason.
 */
import type { Sample } from "./physics";

const INK = "#191811";
const INK_SOFT = "rgba(25, 24, 17, 0.45)";
const RULE = "rgba(25, 24, 17, 0.13)";
const RULE_FAINT = "rgba(25, 24, 17, 0.07)";
const EXTRACT = "#8c3117";
const BRASS = "#9a7433";
const GHOST = "rgba(25, 24, 17, 0.16)";

const P_MAX = 15;
/** 15 is left unlabelled: the "bar" caption lives in that corner instead. */
const P_TICKS = [0, 3, 6, 9, 12, 15];
const P_LABELLED = new Set([0, 3, 6, 9, 12]);
/** Where a pump sits, all day, every day. */
const PUMP_BAR = 9;

export interface TraceFrame {
  samples: Sample[];
  ghosts: Sample[][];
  live: boolean;
}

export function drawTrace(canvas: HTMLCanvasElement, frame: TraceFrame) {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const cssW = canvas.clientWidth;
  const cssH = canvas.clientHeight;
  if (cssW === 0 || cssH === 0) return;
  const w = Math.round(cssW * dpr);
  const h = Math.round(cssH * dpr);
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w;
    canvas.height = h;
  }
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, cssW, cssH);

  const last = frame.samples[frame.samples.length - 1];
  const longest = Math.max(
    last ? last.t : 0,
    ...frame.ghosts.map((g) => (g.length ? g[g.length - 1].t : 0))
  );
  const tMax = longest > 29 ? 45 : 30;
  const tStep = tMax === 45 ? 15 : 10;

  const padL = 30;
  const padR = 8;
  const padT = 16;
  const padB = 20;
  const plotW = cssW - padL - padR;
  const plotH = cssH - padT - padB;
  if (plotW < 40 || plotH < 40) return;

  const X = (t: number) => padL + (Math.min(t, tMax) / tMax) * plotW;
  const Y = (p: number) => padT + plotH - (Math.min(p, P_MAX) / P_MAX) * plotH;

  const label = (size: number, weight = 500) =>
    `${weight} ${size}px ui-monospace, "Spline Sans Mono", SFMono-Regular, monospace`;

  // Grid and scales.
  ctx.lineWidth = 1;
  ctx.font = label(9);
  ctx.textBaseline = "middle";
  ctx.textAlign = "right";
  for (const p of P_TICKS) {
    const y = Math.round(Y(p)) + 0.5;
    ctx.strokeStyle = p === 0 ? RULE : RULE_FAINT;
    ctx.beginPath();
    ctx.moveTo(padL, y);
    ctx.lineTo(padL + plotW, y);
    ctx.stroke();
    if (P_LABELLED.has(p)) {
      ctx.fillStyle = INK_SOFT;
      ctx.fillText(String(p), padL - 6, y);
    }
  }
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  for (let t = tStep; t <= tMax; t += tStep) {
    const x = Math.round(X(t)) + 0.5;
    ctx.strokeStyle = RULE_FAINT;
    ctx.beginPath();
    ctx.moveTo(x, padT);
    ctx.lineTo(x, padT + plotH);
    ctx.stroke();
    ctx.fillStyle = INK_SOFT;
    ctx.fillText(String(t), x, padT + plotH + 5);
  }
  ctx.textAlign = "left";
  ctx.fillStyle = INK_SOFT;
  ctx.fillText("seconds", padL, padT + plotH + 5);
  ctx.textAlign = "right";
  ctx.textBaseline = "top";
  ctx.fillText("bar", padL - 6, padT - 3);

  // What a pump does. The whole argument of the page, in one dashed line.
  const pumpY = Math.round(Y(PUMP_BAR)) + 0.5;
  ctx.save();
  ctx.strokeStyle = BRASS;
  ctx.setLineDash([3, 4]);
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(padL, pumpY);
  ctx.lineTo(padL + plotW, pumpY);
  ctx.stroke();
  ctx.restore();
  ctx.font = label(8.5, 600);
  ctx.fillStyle = BRASS;
  ctx.textAlign = "right";
  ctx.textBaseline = "bottom";
  ctx.letterSpacing = "0.06em";
  ctx.fillText("A PUMP, EVERY TIME", padL + plotW - 2, pumpY - 3);
  ctx.letterSpacing = "0px";

  // Earlier pulls, so you can see whether you are getting better.
  ctx.lineWidth = 1.2;
  ctx.strokeStyle = GHOST;
  for (const ghost of frame.ghosts) {
    if (ghost.length < 2) continue;
    ctx.beginPath();
    ghost.forEach((s, i) => (i ? ctx.lineTo(X(s.t), Y(s.p)) : ctx.moveTo(X(s.t), Y(s.p))));
    ctx.stroke();
  }

  if (frame.samples.length < 2) {
    if (!frame.live) {
      ctx.font = label(10);
      ctx.fillStyle = INK_SOFT;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("no pull yet", padL + plotW / 2, padT + plotH / 2);
    }
    return;
  }

  // The curve, with a wash under it so the shape reads as an area, not a wire.
  const path = new Path2D();
  frame.samples.forEach((s, i) =>
    i ? path.lineTo(X(s.t), Y(s.p)) : path.moveTo(X(s.t), Y(s.p))
  );
  const fill = new Path2D(path);
  fill.lineTo(X(frame.samples[frame.samples.length - 1].t), Y(0));
  fill.lineTo(X(frame.samples[0].t), Y(0));
  fill.closePath();
  ctx.fillStyle = "rgba(140, 49, 23, 0.09)";
  ctx.fill(fill);
  ctx.strokeStyle = EXTRACT;
  ctx.lineWidth = 1.8;
  ctx.lineJoin = "round";
  ctx.stroke(path);

  // Where the bed opened, if it did. This is the moment the shot was decided.
  const broke = frame.samples.find((s) => s.k < 0.75);
  if (broke) {
    const x = X(broke.t);
    ctx.strokeStyle = "rgba(25, 24, 17, 0.5)";
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 2]);
    ctx.beginPath();
    ctx.moveTo(x, padT);
    ctx.lineTo(x, padT + plotH);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.font = label(8.5, 600);
    ctx.fillStyle = INK;
    ctx.letterSpacing = "0.06em";
    const room = x < padL + plotW * 0.6;
    ctx.textAlign = room ? "left" : "right";
    ctx.textBaseline = "top";
    ctx.fillText("BED OPENS", x + (room ? 4 : -4), padT + 2);
    ctx.letterSpacing = "0px";
  }

  if (frame.live && last) {
    ctx.fillStyle = EXTRACT;
    ctx.beginPath();
    ctx.arc(X(last.t), Y(last.p), 2.6, 0, Math.PI * 2);
    ctx.fill();
  }
}

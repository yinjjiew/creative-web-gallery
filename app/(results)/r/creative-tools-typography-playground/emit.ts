/**
 * The artifact is code that runs without this bench. Time-driven pieces
 * compile to CSS keyframes and animation-delay. Pointer and scroll compile
 * to a small script that samples the same polyline the bench uses.
 */

import {
  AXIS_BY_ID,
  AXIS_ORDER,
  REST,
  formatAxis,
  formulaOf,
  sampleCurve,
  settingsFor,
  type Axis,
  type AxisId,
  type Driver,
  type Knot,
} from "./score";

export type EmitInput = {
  title: string;
  line: string;
  driver: Driver;
  period: number;
  stagger: number;
  axis: AxisId;
  knots: Knot[];
};

const STOPS = 12;

function slug(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "kinesis";
}

function valuesAt(axis: Axis, knots: Knot[], t: number): Record<AxisId, number> {
  const y = sampleCurve(knots, t);
  const driven = axis.min + (axis.max - axis.min) * y;
  return { ...REST, [axis.id]: driven };
}

function settingsLine(values: Record<AxisId, number>): string {
  return AXIS_ORDER.map((id) => {
    const spec = AXIS_BY_ID.get(id)!;
    return `"${id}" ${formatAxis(spec, values[id])}`;
  }).join(", ");
}

function keyframes(axis: Axis, knots: Knot[], name: string): string {
  const frames: string[] = [];
  for (let i = 0; i <= STOPS; i++) {
    const t = i / STOPS;
    const pct = Math.round((i / STOPS) * 100);
    frames.push(`  ${pct}% { font-variation-settings: ${settingsLine(valuesAt(axis, knots, t))}; }`);
  }
  return `@keyframes ${name} {\n${frames.join("\n")}\n}`;
}

function knotLiteral(knots: Knot[]): string {
  return knots
    .map((k) => `{ x: ${k.x.toFixed(3)}, y: ${k.y.toFixed(3)} }`)
    .join(", ");
}

function sampleFn(): string {
  return `function sample(knots, t) {
  const x = Math.min(1, Math.max(0, t));
  const s = knots.slice().sort((a, b) => a.x - b.x);
  if (x <= s[0].x) return s[0].y;
  const last = s[s.length - 1];
  if (x >= last.x) return last.y;
  for (let i = 0; i < s.length - 1; i++) {
    const a = s[i], b = s[i + 1];
    if (x >= a.x && x <= b.x) {
      const u = (x - a.x) / (b.x - a.x || 1);
      return a.y + (b.y - a.y) * u;
    }
  }
  return last.y;
}`;
}

function applyFn(axis: Axis): string {
  const rest = AXIS_ORDER.map((id) => {
    const spec = AXIS_BY_ID.get(id)!;
    const value = id === axis.id ? "v" : formatAxis(spec, REST[id]);
    return `"${id}" ${id === axis.id ? "${v.toFixed(" + String(axis.decimals) + ")}" : value}`;
  }).join(", ");
  return `function apply(el, t) {
  const y = sample(knots, t);
  const v = ${axis.min} + (${axis.max} - ${axis.min}) * y;
  el.style.fontVariationSettings = \`${rest}\`;
}`;
}

function lettersHtml(line: string, className: string): string {
  return `<div class="${className}" id="${className}" aria-label="${escapeHtml(line)}">\n${line
    .split("")
    .map((ch, i) => {
      const glyph = ch === " " ? "&nbsp;" : escapeHtml(ch);
      return `  <span style="--i:${i}">${glyph}</span>`;
    })
    .join("\n")}\n</div>`;
}

function escapeHtml(ch: string): string {
  return ch.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function faceCss(className: string): string {
  return `.${className} {
  font-family: "Fraunces", "Times New Roman", Times, serif;
  font-optical-sizing: none;
  font-weight: 320;
  font-size: clamp(48px, 12vw, 120px);
  line-height: 1;
  letter-spacing: -0.03em;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
}
.${className} span {
  display: block;
  white-space: pre;
}`;
}

function fontNote(): string {
  return `/* Face: Fraunces variable, axes wght / SOFT / WONK / opsz.
   Load it yourself — next/font/google:

     import { Fraunces } from "next/font/google";
     const face = Fraunces({ subsets: ["latin"], axes: ["SOFT", "WONK", "opsz"] });

   or the CSS API:
     https://fonts.googleapis.com/css2?family=Fraunces:opsz,SOFT,WONK,wght@9..144,0..100,0..1,100..900&display=swap
*/`;
}

export function emitSnippet(input: EmitInput): string {
  const axis = AXIS_BY_ID.get(input.axis)!;
  const name = `kin-${slug(input.title)}`;
  const formula = formulaOf(input);
  const html = lettersHtml(input.line, name);

  if (input.driver === "time") {
    const delay = (input.stagger * input.period).toFixed(3);
    const css = `${fontNote()}
/* ${formula} */
${faceCss(name)}
.${name} span {
  animation: ${name}-axis ${input.period}s linear infinite;
  animation-delay: calc(var(--i) * -${delay}s);
}
${keyframes(axis, input.knots, `${name}-axis`)}

@media (prefers-reduced-motion: reduce) {
  .${name} span { animation: none; font-variation-settings: ${settingsFor(axis, REST[axis.id])}; }
}`;
    return `${html}\n\n<style>\n${css}\n</style>`;
  }

  const radius = 180;
  const script =
    input.driver === "pointer"
      ? pointerScript(name, axis, input.knots, radius)
      : scrollScript(name, axis, input.knots, input.stagger);

  const css = `${fontNote()}
/* ${formula} */
${faceCss(name)}`;

  return `${html}\n\n<style>\n${css}\n</style>\n\n<script>\n${script}\n</script>`;
}

function pointerScript(name: string, axis: Axis, knots: Knot[], radius: number): string {
  return `(function () {
  const root = document.getElementById("${name}");
  if (!root) return;
  const knots = [${knotLiteral(knots)}];
  ${sampleFn()}
  ${applyFn(axis)}
  const letters = [...root.querySelectorAll("span")];
  function at(x, y) {
    letters.forEach((el) => {
      const r = el.getBoundingClientRect();
      const d = Math.hypot(x - (r.left + r.width / 2), y - (r.top + r.height / 2));
      apply(el, Math.min(1, Math.max(0, 1 - d / ${radius})));
    });
  }
  root.addEventListener("pointermove", (e) => at(e.clientX, e.clientY));
  root.addEventListener("pointerleave", () => letters.forEach((el) => apply(el, 0)));
  letters.forEach((el) => apply(el, 0));
})();`;
}

function scrollScript(name: string, axis: Axis, knots: Knot[], stagger: number): string {
  return `(function () {
  const root = document.getElementById("${name}");
  if (!root) return;
  const knots = [${knotLiteral(knots)}];
  ${sampleFn()}
  ${applyFn(axis)}
  const letters = [...root.querySelectorAll("span")];
  function tick() {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const t = max <= 0 ? 0 : window.scrollY / max;
    letters.forEach((el, i) => {
      const u = ((t - i * ${stagger}) % 1 + 1) % 1;
      apply(el, u);
    });
  }
  window.addEventListener("scroll", tick, { passive: true });
  tick();
})();`;
}

export function emitDocument(input: EmitInput): string {
  const snippet = emitSnippet(input);
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Kinesis — ${escapeHtml(input.title)}</title>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,SOFT,WONK,wght@9..144,0..100,0..1,100..900&display=swap">
  <style>
    html, body { margin: 0; background: #e4e2dc; color: #171614; }
    body {
      min-height: 100dvh;
      display: grid;
      place-items: center;
      padding: 12vh 6vw ${input.driver === "scroll" ? "120vh" : "12vh"};
    }
  </style>
</head>
<body>
${snippet}
</html>
`;
}

export function fileStem(title: string, line: string): string {
  const fromLine = line.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return `kinesis-${slug(title)}${fromLine ? "-" + fromLine.slice(0, 24) : ""}`;
}

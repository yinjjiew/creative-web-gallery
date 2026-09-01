/**
 * One compiler. The live proof injects this sheet; export copies it. If a
 * journey cannot be expressed here, it is not a journey the tool may offer.
 */

import {
  cubic,
  easingOf,
  voicesFor,
  type Doc,
  type Edge,
  type Pose,
  type VoiceId,
} from "./model";

type Target = { sel: string; props: string[] };

function targets(specimen: Doc["specimen"], voice: VoiceId): Target[] {
  switch (voice) {
    case "well":
      return [{ sel: "", props: ["background-color"] }];
    case "shade":
      return [{ sel: "", props: ["box-shadow"] }];
    case "ink":
      return [
        { sel: "", props: ["color"] },
        { sel: " .scWord span", props: ["color"] },
      ];
    case "thumb":
      return [{ sel: " .scThumb", props: ["transform"] }];
    case "lift":
      return [{ sel: "", props: ["transform"] }];
    case "word":
      return [{ sel: " .scWord span", props: ["opacity"] }];
    case "mark":
      return [{ sel: " .scMark", props: ["opacity", "transform"] }];
    default:
      return [];
  }
}

function cssEscape(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function voiceDelay(edge: Edge, id: VoiceId): number {
  return edge.voices.find((v) => v.id === id)?.delay ?? 0;
}

function poseRules(root: string, pose: Pose, specimen: Doc["specimen"]): string {
  const word = cssEscape(pose.word);
  if (specimen === "switch") {
    const x = (5 + pose.thumbX * 46).toFixed(1);
    return `${root}[data-state="${pose.id}"] {
  background-color: ${pose.well};
  box-shadow: ${pose.shade};
  color: ${pose.ink};
}
${root}[data-state="${pose.id}"] .scThumb {
  transform: translateX(${x}px) scale(${pose.thumbS});
}
${root}[data-state="${pose.id}"] .scWord [data-word="${word}"] {
  opacity: 1;
}
${root}[data-state="${pose.id}"] .scWord span {
  color: ${pose.ink};
}`;
  }
  return `${root}[data-state="${pose.id}"] {
  background-color: ${pose.well};
  box-shadow: ${pose.shade};
  color: ${pose.ink};
  transform: translateY(${pose.lift.toFixed(1)}px) scale(${pose.scale});
}
${root}[data-state="${pose.id}"] .scWord [data-word="${word}"] {
  opacity: 1;
}
${root}[data-state="${pose.id}"] .scWord span {
  color: ${pose.ink};
}
${root}[data-state="${pose.id}"] .scMark[data-mark="${pose.mark}"] {
  opacity: 1;
  transform: scale(1);
}`;
}

function edgeRules(root: string, edge: Edge, specimen: Doc["specimen"]): string {
  const ease = cubic(easingOf(edge.easing));
  const ms = `${edge.duration}ms`;
  const groups = new Map<string, string[]>();
  for (const id of voicesFor(specimen)) {
    const delay = `${voiceDelay(edge, id)}ms`;
    for (const t of targets(specimen, id)) {
      const sel = `${root}[data-edge="${edge.id}"]${t.sel}`;
      const list = groups.get(sel) ?? [];
      for (const p of t.props) list.push(`${p} ${ms} ${ease} ${delay}`);
      groups.set(sel, list);
    }
  }
  return [...groups.entries()]
    .map(([sel, props]) => `${sel} {\n  transition: ${props.join(", ")};\n}`)
    .join("\n");
}

function words(doc: Doc): string[] {
  return [...new Set(doc.states.map((p) => p.word))];
}

export function compileSheet(doc: Doc, root: string): string {
  const base =
    doc.specimen === "switch" ? switchChrome(root, words(doc)) : commitChrome(root, words(doc));
  const states = doc.states.map((p) => poseRules(root, p, doc.specimen)).join("\n");
  const edges = doc.edges.map((e) => edgeRules(root, e, doc.specimen)).join("\n");
  return `${base}\n${states}\n${edges}\n${reduce(root)}\n`;
}

function reduce(root: string): string {
  return `@media (prefers-reduced-motion: reduce) {
${root},
${root} * {
  transition-duration: 0.01ms !important;
  transition-delay: 0ms !important;
  animation-duration: 0.01ms !important;
}
}`;
}

function switchChrome(root: string, labels: string[]): string {
  return `${root} {
  appearance: none;
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 14px;
  margin: 0;
  padding: 8px 16px 8px 8px;
  border: 0;
  border-radius: 2px;
  cursor: pointer;
  font-family: inherit;
  font-size: inherit;
  font-style: inherit;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
}
${root}:focus-visible {
  outline: 2px solid #e25a28;
  outline-offset: 4px;
}
${root}:disabled {
  cursor: wait;
}
${root} .scTrack {
  position: relative;
  width: 72px;
  height: 34px;
  flex: 0 0 auto;
  pointer-events: none;
}
${root} .scThumb {
  position: absolute;
  top: 5px;
  left: 0;
  width: 10px;
  height: 24px;
  background: #e2d8c6;
  border-radius: 1px;
  will-change: transform;
}
${root} .scWord {
  position: relative;
  display: grid;
  min-width: 4.2ch;
  text-align: left;
}
${root} .scWord span {
  grid-area: 1 / 1;
  opacity: 0;
}
${labels.map((w) => `/* ${w} */`).join("\n")}
${root} .scMark { display: none; }`;
}

function commitChrome(root: string, _labels: string[]): string {
  return `${root} {
  appearance: none;
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  min-width: 9.5rem;
  margin: 0;
  padding: 14px 28px;
  border: 0;
  border-radius: 1px;
  cursor: pointer;
  font-family: inherit;
  font-size: inherit;
  font-style: inherit;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  will-change: transform, background-color, box-shadow;
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
}
${root}:focus-visible {
  outline: 2px solid #e25a28;
  outline-offset: 4px;
}
${root}:disabled {
  cursor: wait;
}
${root} .scTrack,
${root} .scThumb { display: none; }
${root} .scWord {
  position: relative;
  display: grid;
  min-width: 7ch;
  text-align: center;
}
${root} .scWord span {
  grid-area: 1 / 1;
  opacity: 0;
}
${root} .scMark {
  position: absolute;
  left: 16px;
  width: 12px;
  height: 12px;
  opacity: 0;
  transform: scale(0.6);
  pointer-events: none;
}
${root} .scMark[data-mark="spin"] {
  border: 1.5px solid currentColor;
  border-right-color: transparent;
  border-radius: 50%;
}
${root}[data-state="pending"] .scMark[data-mark="spin"] {
  animation: scSpin 700ms linear infinite;
}
${root} .scMark[data-mark="check"] {
  border: 0;
  background: transparent;
}
${root} .scMark[data-mark="check"]::before {
  content: "";
  position: absolute;
  left: 2px;
  top: 2px;
  width: 7px;
  height: 4px;
  border-left: 1.5px solid currentColor;
  border-bottom: 1.5px solid currentColor;
  transform: rotate(-45deg);
}
@keyframes scSpin {
  to { transform: rotate(360deg) scale(1); }
}`;
}

export function classNameOf(uid: string): string {
  return `sc_${uid.replace(/[^a-zA-Z0-9]/g, "")}`;
}

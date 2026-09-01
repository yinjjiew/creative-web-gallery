/**
 * A pointer system is a recipe: weight, magnetism, and a rule per target.
 * Press is a modifier, not a target. Text is native so the caret stays.
 */

export type Target =
  | "rest"
  | "link"
  | "button"
  | "text"
  | "drag"
  | "wait"
  | "disabled";

export type Shape =
  | "native"
  | "dot"
  | "ring"
  | "cross"
  | "bar"
  | "arrow"
  | "corners"
  | "square"
  | "sight"
  | "haze";

export type Rule = {
  shape: Shape;
  size: number;
  magnet: boolean;
};

export type Recipe = {
  id: string;
  name: string;
  epithet: string;
  ink: string;
  paper: string;
  mass: number;
  damping: number;
  magnetRadius: number;
  magnetPull: number;
  aim: boolean;
  caution?: boolean;
  rules: Record<Target, Rule>;
};

export const TARGETS: { id: Target; label: string; hint: string }[] = [
  { id: "rest", label: "Rest", hint: "Open ground" },
  { id: "link", label: "Link", hint: "Follow" },
  { id: "button", label: "Button", hint: "Commit" },
  { id: "text", label: "Text", hint: "Caret stays" },
  { id: "drag", label: "Drag", hint: "Move a thing" },
  { id: "wait", label: "Wait", hint: "Busy" },
  { id: "disabled", label: "Dead", hint: "Refuses" },
];

export const SHAPES: Shape[] = [
  "native",
  "cross",
  "bar",
  "dot",
  "ring",
  "arrow",
  "corners",
  "square",
  "sight",
  "haze",
];

export const RANGES = {
  mass: { min: 0.06, max: 0.72, step: 0.01 },
  damping: { min: 0.35, max: 1.15, step: 0.01 },
  magnetRadius: { min: 0, max: 72, step: 1 },
  magnetPull: { min: 0, max: 0.92, step: 0.01 },
};

const native: Rule = { shape: "native", size: 0, magnet: false };

export const PRESETS: Recipe[] = [
  {
    id: "ledger",
    name: "Ledger",
    epithet: "Hairline. Tight. A rule under type.",
    ink: "#1b1814",
    paper: "#efe8d8",
    mass: 0.11,
    damping: 0.86,
    magnetRadius: 22,
    magnetPull: 0.28,
    aim: false,
    rules: {
      rest: { shape: "cross", size: 14, magnet: false },
      link: { shape: "bar", size: 22, magnet: true },
      button: { shape: "ring", size: 20, magnet: true },
      text: native,
      drag: { shape: "corners", size: 22, magnet: true },
      wait: { shape: "ring", size: 16, magnet: false },
      disabled: { shape: "dot", size: 5, magnet: false },
    },
  },
  {
    id: "stamp",
    name: "Stamp",
    epithet: "A square that inks when it presses.",
    ink: "#21160f",
    paper: "#f3e3c4",
    mass: 0.28,
    damping: 0.72,
    magnetRadius: 28,
    magnetPull: 0.36,
    aim: false,
    rules: {
      rest: { shape: "square", size: 13, magnet: false },
      link: { shape: "corners", size: 20, magnet: true },
      button: { shape: "square", size: 16, magnet: true },
      text: native,
      drag: { shape: "corners", size: 24, magnet: true },
      wait: { shape: "square", size: 14, magnet: false },
      disabled: { shape: "dot", size: 5, magnet: false },
    },
  },
  {
    id: "lead",
    name: "Lead",
    epithet: "A pencil that turns with the stroke.",
    ink: "#1a2430",
    paper: "#e4e8ea",
    mass: 0.16,
    damping: 0.8,
    magnetRadius: 18,
    magnetPull: 0.22,
    aim: true,
    rules: {
      rest: { shape: "bar", size: 18, magnet: false },
      link: { shape: "arrow", size: 16, magnet: true },
      button: { shape: "ring", size: 18, magnet: true },
      text: native,
      drag: { shape: "bar", size: 26, magnet: true },
      wait: { shape: "cross", size: 14, magnet: false },
      disabled: { shape: "dot", size: 4, magnet: false },
    },
  },
  {
    id: "sight",
    name: "Sight",
    epithet: "A reticle that takes the target.",
    ink: "#142016",
    paper: "#e7efe4",
    mass: 0.09,
    damping: 0.94,
    magnetRadius: 48,
    magnetPull: 0.62,
    aim: false,
    rules: {
      rest: { shape: "sight", size: 18, magnet: false },
      link: { shape: "sight", size: 22, magnet: true },
      button: { shape: "sight", size: 22, magnet: true },
      text: native,
      drag: { shape: "corners", size: 24, magnet: true },
      wait: { shape: "sight", size: 16, magnet: false },
      disabled: { shape: "cross", size: 10, magnet: false },
    },
  },
  {
    id: "haze",
    name: "Haze",
    epithet: "The house style. Same mark on every surface.",
    ink: "#222",
    paper: "#f6f6f6",
    mass: 0.58,
    damping: 0.48,
    magnetRadius: 0,
    magnetPull: 0,
    aim: false,
    caution: true,
    rules: {
      rest: { shape: "haze", size: 38, magnet: false },
      link: { shape: "haze", size: 38, magnet: false },
      button: { shape: "haze", size: 38, magnet: false },
      text: native,
      drag: { shape: "haze", size: 38, magnet: false },
      wait: { shape: "haze", size: 38, magnet: false },
      disabled: { shape: "haze", size: 38, magnet: false },
    },
  },
];

export function cloneRecipe(recipe: Recipe): Recipe {
  return {
    ...recipe,
    rules: {
      rest: { ...recipe.rules.rest },
      link: { ...recipe.rules.link },
      button: { ...recipe.rules.button },
      text: { ...recipe.rules.text },
      drag: { ...recipe.rules.drag },
      wait: { ...recipe.rules.wait },
      disabled: { ...recipe.rules.disabled },
    },
  };
}

export function nextShape(shape: Shape): Shape {
  const i = SHAPES.indexOf(shape);
  return SHAPES[(i + 1) % SHAPES.length] ?? "cross";
}

export function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

export type Body = { x: number; y: number; vx: number; vy: number };

export function freshBody(x = 0, y = 0): Body {
  return { x, y, vx: 0, vy: 0 };
}

export function seedBody(body: Body, x: number, y: number): void {
  body.x = x;
  body.y = y;
  body.vx = 0;
  body.vy = 0;
}

/**
 * Semi-implicit spring in pixel space. Mass lowers ω (heavier follow);
 * damping is a ratio around critical. ω·dt stays well under 0.5 so the
 * integrator cannot explode. Reduced motion snaps.
 */
export function stepBody(
  body: Body,
  tx: number,
  ty: number,
  recipe: Recipe,
  dt: number,
  reduced: boolean
): void {
  if (
    reduced ||
    !Number.isFinite(body.x) ||
    !Number.isFinite(body.vx)
  ) {
    seedBody(body, tx, ty);
    return;
  }
  const jump = Math.hypot(tx - body.x, ty - body.y);
  if (jump > 280 && Math.hypot(body.vx, body.vy) < 90) {
    seedBody(body, tx, ty);
    return;
  }
  const u = clamp((recipe.mass - 0.06) / 0.66, 0, 1);
  const omega = 22 - u * 14;
  const zeta = clamp(0.7 + recipe.damping * 0.45, 0.7, 1.35);
  const ax = omega * omega * (tx - body.x) - 2 * zeta * omega * body.vx;
  const ay = omega * omega * (ty - body.y) - 2 * zeta * omega * body.vy;
  body.vx += ax * dt;
  body.vy += ay * dt;
  const spd = Math.hypot(body.vx, body.vy);
  const max = 2800;
  if (spd > max) {
    body.vx *= max / spd;
    body.vy *= max / spd;
  }
  body.x += body.vx * dt;
  body.y += body.vy * dt;
}

export function detectTarget(el: Element | null, busy: boolean): Target {
  if (busy) return "wait";
  let node: Element | null = el;
  while (node && node !== document.documentElement) {
    if (node instanceof HTMLElement) {
      const ptr = node.dataset.ptr;
      if (ptr === "wait") return "wait";
      if (ptr === "disabled") return "disabled";
      if (ptr === "text") return "text";
      if (ptr === "drag") return "drag";
      if (ptr === "button") return "button";
      if (ptr === "link") return "link";
      if (ptr === "rest") return "rest";
      if (node.getAttribute("aria-disabled") === "true") return "disabled";
      if (
        node instanceof HTMLButtonElement ||
        node instanceof HTMLInputElement ||
        node instanceof HTMLTextAreaElement ||
        node instanceof HTMLSelectElement
      ) {
        if (node.disabled) return "disabled";
      }
      if (
        node instanceof HTMLInputElement &&
        ["text", "search", "email", "url", "tel", "password", "number", "date"].includes(
          node.type
        )
      ) {
        return "text";
      }
      if (node instanceof HTMLInputElement && node.type === "") return "text";
      if (node instanceof HTMLTextAreaElement) return "text";
      if (node instanceof HTMLSelectElement) return "text";
      if (node.getAttribute("contenteditable") === "true") return "text";
      if (node.getAttribute("role") === "link") return "link";
      if (node instanceof HTMLAnchorElement && node.href) return "link";
      if (node.getAttribute("role") === "button") return "button";
      if (node instanceof HTMLButtonElement) return "button";
      if (node instanceof HTMLInputElement && ["button", "submit", "reset"].includes(node.type)) {
        return "button";
      }
      if (node.getAttribute("draggable") === "true") return "drag";
      if (isSelectableCopy(node)) return "text";
    }
    node = node.parentElement;
  }
  return "rest";
}

function isSelectableCopy(node: Element): boolean {
  const tag = node.tagName;
  return (
    tag === "P" ||
    tag === "H1" ||
    tag === "H2" ||
    tag === "H3" ||
    tag === "H4" ||
    tag === "LI" ||
    tag === "BLOCKQUOTE" ||
    tag === "LABEL" ||
    tag === "DD" ||
    tag === "DT"
  );
}

export function magnetPoint(
  el: Element | null,
  target: Target,
  recipe: Recipe,
  mx: number,
  my: number
): { x: number; y: number } {
  const rule = recipe.rules[target];
  if (!rule.magnet || recipe.magnetRadius <= 0 || recipe.magnetPull <= 0) {
    return { x: mx, y: my };
  }
  if (!el || !(el instanceof Element)) return { x: mx, y: my };
  const box = el.getBoundingClientRect();
  const cx = box.left + box.width / 2;
  const cy = box.top + box.height / 2;
  const dx = cx - mx;
  const dy = cy - my;
  const d = Math.hypot(dx, dy);
  if (d > recipe.magnetRadius || d < 0.001) return { x: mx, y: my };
  const t = (1 - d / recipe.magnetRadius) * recipe.magnetPull;
  return { x: mx + dx * t, y: my + dy * t };
}

export function markInner(shape: Shape, size: number, filled: boolean): string {
  const s = Math.max(4, size);
  const sw = 1.2;
  const fill = filled ? "currentColor" : "none";
  switch (shape) {
    case "native":
      return "";
    case "dot":
      return `<circle r="${s / 2}" fill="currentColor"/>`;
    case "ring":
      return `<circle r="${s / 2}" fill="${fill}" stroke="currentColor" stroke-width="${sw}"/>`;
    case "cross":
      return `<path d="M${-s / 2} 0h${s}M0 ${-s / 2}v${s}" fill="none" stroke="currentColor" stroke-width="${sw}"/>`;
    case "bar":
      return `<path d="M${-s / 2} 0h${s}" fill="none" stroke="currentColor" stroke-width="${sw}"/>`;
    case "arrow":
      return `<path d="M${-s * 0.28} ${-s * 0.42} L${s * 0.38} 0 L${-s * 0.28} ${s * 0.42} Z" fill="${fill}" stroke="currentColor" stroke-width="${sw}" stroke-linejoin="miter"/>`;
    case "corners": {
      const a = s / 2;
      const k = s * 0.32;
      return [
        `<path d="M${-a} ${-a + k}V${-a}h${k}" fill="none" stroke="currentColor" stroke-width="${sw}"/>`,
        `<path d="M${a - k} ${-a}H${a}v${k}" fill="none" stroke="currentColor" stroke-width="${sw}"/>`,
        `<path d="M${a} ${a - k}V${a}h${-k}" fill="none" stroke="currentColor" stroke-width="${sw}"/>`,
        `<path d="M${-a + k} ${a}H${-a}v${-k}" fill="none" stroke="currentColor" stroke-width="${sw}"/>`,
      ].join("");
    }
    case "square":
      return `<rect x="${-s / 2}" y="${-s / 2}" width="${s}" height="${s}" fill="${fill}" stroke="currentColor" stroke-width="${sw}"/>`;
    case "sight":
      return [
        `<circle r="${s / 2}" fill="none" stroke="currentColor" stroke-width="${sw}"/>`,
        `<circle r="${s / 5.5}" fill="${fill}" stroke="currentColor" stroke-width="${sw}"/>`,
        `<path d="M${-s * 0.72} 0h${s * 0.2}M${s * 0.52} 0h${s * 0.2}M0 ${-s * 0.72}v${s * 0.2}M0 ${s * 0.52}v${s * 0.2}" fill="none" stroke="currentColor" stroke-width="${sw}"/>`,
      ].join("");
    case "haze":
      return `<circle r="${s / 2}" fill="currentColor" opacity="0.42"/>`;
    default:
      return "";
  }
}

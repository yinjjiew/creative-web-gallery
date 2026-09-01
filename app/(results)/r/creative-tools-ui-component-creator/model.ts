/**
 * A document is a specimen, a set of named poses (stations), and the journeys
 * between them. The journey — duration, easing, per-voice stagger — is the
 * object. Poses exist so a journey has somewhere to leave and somewhere to
 * arrive. They are not the work.
 */

export type SpecimenId = "switch" | "commit";

export type VoiceId = "well" | "ink" | "thumb" | "lift" | "word" | "mark" | "shade";

export type Gesture = "click" | "enter" | "leave" | "down" | "up" | "reply";

export type Mark = "none" | "spin" | "check";

export type Easing = {
  id: string;
  label: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
};

export type Pose = {
  id: string;
  name: string;
  well: string;
  ink: string;
  thumbX: number;
  thumbS: number;
  lift: number;
  scale: number;
  shade: string;
  word: string;
  mark: Mark;
};

export type Voice = {
  id: VoiceId;
  delay: number;
};

export type Edge = {
  id: string;
  from: string;
  to: string;
  duration: number;
  easing: string;
  voices: Voice[];
  gesture?: Gesture;
};

export type Doc = {
  specimen: SpecimenId;
  states: Pose[];
  edges: Edge[];
  replyMs: number;
};

export const EASINGS: Easing[] = [
  { id: "exit", label: "exit", x1: 0.16, y1: 1, x2: 0.3, y2: 1 },
  { id: "enter", label: "enter", x1: 0.7, y1: 0, x2: 0.84, y2: 0 },
  { id: "through", label: "through", x1: 0.45, y1: 0.05, x2: 0.55, y2: 0.95 },
  { id: "snap", label: "snap", x1: 0.22, y1: 0, x2: 0, y2: 1 },
  { id: "over", label: "over", x1: 0.34, y1: 1.4, x2: 0.64, y2: 1 },
  { id: "flat", label: "flat", x1: 0, y1: 0, x2: 1, y2: 1 },
];

export const EASING_BY_ID = new Map(EASINGS.map((e) => [e.id, e]));

export const VOICES: { id: VoiceId; label: string; switch: boolean; commit: boolean }[] = [
  { id: "well", label: "well", switch: true, commit: true },
  { id: "shade", label: "shade", switch: true, commit: true },
  { id: "thumb", label: "thumb", switch: true, commit: false },
  { id: "lift", label: "lift", switch: false, commit: true },
  { id: "ink", label: "ink", switch: true, commit: true },
  { id: "word", label: "word", switch: true, commit: true },
  { id: "mark", label: "mark", switch: false, commit: true },
];

export const INKS = [
  "#1a1f1a",
  "#2c3228",
  "#e2d8c6",
  "#e25a28",
  "#6d7d58",
  "#8b3a2a",
  "#3a4654",
  "#c4b49a",
];

export const REPLY_MS = [400, 900, 1600] as const;

export const GESTURES: { id: Gesture; label: string }[] = [
  { id: "click", label: "click" },
  { id: "enter", label: "pointer enter" },
  { id: "leave", label: "pointer leave" },
  { id: "down", label: "pointer down" },
  { id: "up", label: "pointer up" },
  { id: "reply", label: "reply" },
];

const SWITCH_VOICES = VOICES.filter((v) => v.switch).map((v) => v.id);
const COMMIT_VOICES = VOICES.filter((v) => v.commit).map((v) => v.id);

export function voicesFor(specimen: SpecimenId): VoiceId[] {
  return specimen === "switch" ? SWITCH_VOICES : COMMIT_VOICES;
}

function voiceSet(delays: Partial<Record<VoiceId, number>>, ids: VoiceId[]): Voice[] {
  return ids.map((id) => ({ id, delay: delays[id] ?? 0 }));
}

function pose(partial: Pose): Pose {
  return partial;
}

export function easingOf(id: string): Easing {
  return EASING_BY_ID.get(id) ?? EASINGS[0];
}

export function cubic(e: Easing): string {
  return `cubic-bezier(${e.x1}, ${e.y1}, ${e.x2}, ${e.y2})`;
}

export function maxDelay(edge: Edge): number {
  return edge.voices.reduce((m, v) => Math.max(m, v.delay), 0);
}

export function totalMs(edge: Edge): number {
  return edge.duration + maxDelay(edge);
}

export function poseOf(doc: Doc, id: string): Pose | undefined {
  return doc.states.find((p) => p.id === id);
}

export function edgeOf(doc: Doc, id: string): Edge | undefined {
  return doc.edges.find((e) => e.id === id);
}

export function edgeFor(doc: Doc, from: string, gesture: Gesture): Edge | undefined {
  return doc.edges.find((e) => e.from === from && e.gesture === gesture);
}

export function edgesFrom(doc: Doc, from: string): Edge[] {
  return doc.edges.filter((e) => e.from === from);
}

export function slugName(name: string): string {
  const s = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return s || "station";
}

export function uniqueId(base: string, used: Set<string>): string {
  if (!used.has(base)) return base;
  let n = 2;
  while (used.has(`${base}-${n}`)) n += 1;
  return `${base}-${n}`;
}

export function nextStateId(doc: Doc, name: string): string {
  return uniqueId(slugName(name), new Set(doc.states.map((p) => p.id)));
}

export function nextEdgeId(doc: Doc, from: string, to: string): string {
  return uniqueId(`e-${from}-${to}`, new Set(doc.edges.map((e) => e.id)));
}

export function clonePose(src: Pose, id: string, name: string): Pose {
  return { ...src, id, name };
}

export function defaultVoices(specimen: SpecimenId, delays: Partial<Record<VoiceId, number>> = {}): Voice[] {
  return voiceSet(delays, voicesFor(specimen));
}

export function addState(doc: Doc, fromId: string, name: string): Doc {
  const src = poseOf(doc, fromId) ?? doc.states[0];
  const id = nextStateId(doc, name);
  const state = clonePose(src, id, name);
  const edge: Edge = {
    id: nextEdgeId(doc, fromId, id),
    from: fromId,
    to: id,
    duration: 240,
    easing: "exit",
    voices: defaultVoices(doc.specimen, { well: 0, shade: 12, thumb: 32, lift: 16, ink: 48, word: 64, mark: 40 }),
  };
  return { ...doc, states: [...doc.states, state], edges: [...doc.edges, edge] };
}

export function addEdge(doc: Doc, from: string, to: string): Doc {
  if (from === to) return doc;
  if (doc.edges.some((e) => e.from === from && e.to === to)) return doc;
  const edge: Edge = {
    id: nextEdgeId(doc, from, to),
    from,
    to,
    duration: 240,
    easing: "through",
    voices: defaultVoices(doc.specimen),
  };
  return { ...doc, edges: [...doc.edges, edge] };
}

export function removeEdge(doc: Doc, id: string): Doc {
  return { ...doc, edges: doc.edges.filter((e) => e.id !== id) };
}

export function removeState(doc: Doc, id: string): Doc {
  if (doc.states.length <= 2) return doc;
  return {
    ...doc,
    states: doc.states.filter((p) => p.id !== id),
    edges: doc.edges.filter((e) => e.from !== id && e.to !== id),
  };
}

export function patchEdge(doc: Doc, id: string, patch: Partial<Edge>): Doc {
  return {
    ...doc,
    edges: doc.edges.map((e) => (e.id === id ? { ...e, ...patch } : e)),
  };
}

export function patchVoice(doc: Doc, edgeId: string, voiceId: VoiceId, delay: number): Doc {
  const clamped = Math.max(0, Math.min(400, Math.round(delay)));
  return {
    ...doc,
    edges: doc.edges.map((e) =>
      e.id === edgeId
        ? { ...e, voices: e.voices.map((v) => (v.id === voiceId ? { ...v, delay: clamped } : v)) }
        : e
    ),
  };
}

export function bindGesture(doc: Doc, edgeId: string, gesture: Gesture | undefined): Doc {
  const edge = edgeOf(doc, edgeId);
  if (!edge) return doc;
  return {
    ...doc,
    edges: doc.edges.map((e) => {
      if (e.id === edgeId) return { ...e, gesture };
      if (gesture && e.from === edge.from && e.gesture === gesture) {
        return { ...e, gesture: undefined };
      }
      return e;
    }),
  };
}

export function patchPose(doc: Doc, id: string, patch: Partial<Pose>): Doc {
  return {
    ...doc,
    states: doc.states.map((p) => (p.id === id ? { ...p, ...patch } : p)),
  };
}

export function bestTravel(doc: Doc, from: string, to: string): Edge | undefined {
  if (from === to) return undefined;
  const direct = doc.edges.find((e) => e.from === from && e.to === to);
  if (direct) return direct;
  return undefined;
}

function switchDoc(): Doc {
  const ids = voicesFor("switch");
  const off = pose({
    id: "off",
    name: "Off",
    well: "#2a3028",
    ink: "#c8bfae",
    thumbX: 0,
    thumbS: 1,
    lift: 0,
    scale: 1,
    shade: "0 0 0 1px rgba(226,216,198,0.14)",
    word: "Off",
    mark: "none",
  });
  const on = pose({
    id: "on",
    name: "On",
    well: "#e25a28",
    ink: "#1a120e",
    thumbX: 1,
    thumbS: 1,
    lift: 0,
    scale: 1,
    shade: "0 8px 20px rgba(226,90,40,0.28)",
    word: "On",
    mark: "none",
  });
  const pending = pose({
    id: "pending",
    name: "Pending",
    well: "#3a4034",
    ink: "#e2d8c6",
    thumbX: 0.48,
    thumbS: 0.86,
    lift: 0,
    scale: 1,
    shade: "0 0 0 1px rgba(226,216,198,0.22)",
    word: "Wait",
    mark: "spin",
  });
  return {
    specimen: "switch",
    replyMs: 900,
    states: [off, on, pending],
    edges: [
      {
        id: "e-off-on",
        from: "off",
        to: "on",
        duration: 280,
        easing: "exit",
        gesture: "click",
        voices: voiceSet({ well: 0, shade: 16, thumb: 40, ink: 88, word: 88 }, ids),
      },
      {
        id: "e-on-off",
        from: "on",
        to: "off",
        duration: 200,
        easing: "through",
        gesture: "click",
        voices: voiceSet({ word: 0, ink: 0, thumb: 36, well: 72, shade: 72 }, ids),
      },
      {
        id: "e-off-pending",
        from: "off",
        to: "pending",
        duration: 160,
        easing: "through",
        voices: voiceSet({ word: 0, ink: 0, thumb: 24, well: 48, shade: 32 }, ids),
      },
      {
        id: "e-pending-on",
        from: "pending",
        to: "on",
        duration: 320,
        easing: "over",
        gesture: "reply",
        voices: voiceSet({ well: 0, shade: 20, thumb: 48, ink: 96, word: 96 }, ids),
      },
      {
        id: "e-on-pending",
        from: "on",
        to: "pending",
        duration: 150,
        easing: "enter",
        voices: voiceSet({ word: 0, ink: 8, thumb: 20, well: 40, shade: 24 }, ids),
      },
      {
        id: "e-pending-off",
        from: "pending",
        to: "off",
        duration: 220,
        easing: "through",
        voices: voiceSet({ word: 0, thumb: 28, well: 56, ink: 40, shade: 56 }, ids),
      },
    ],
  };
}

function commitDoc(): Doc {
  const ids = voicesFor("commit");
  const rest = pose({
    id: "rest",
    name: "Rest",
    well: "#e2d8c6",
    ink: "#141610",
    thumbX: 0,
    thumbS: 1,
    lift: 0,
    scale: 1,
    shade: "0 1px 0 rgba(20,22,16,0.18)",
    word: "Keep",
    mark: "none",
  });
  const hover = pose({
    id: "hover",
    name: "Hover",
    well: "#efe8da",
    ink: "#141610",
    thumbX: 0,
    thumbS: 1,
    lift: -3,
    scale: 1,
    shade: "0 10px 22px rgba(20,22,16,0.22)",
    word: "Keep",
    mark: "none",
  });
  const armed = pose({
    id: "armed",
    name: "Armed",
    well: "#c8bfae",
    ink: "#141610",
    thumbX: 0,
    thumbS: 1,
    lift: 2,
    scale: 0.97,
    shade: "0 0 0 1px rgba(20,22,16,0.28)",
    word: "Keep",
    mark: "none",
  });
  const pending = pose({
    id: "pending",
    name: "Pending",
    well: "#2a3028",
    ink: "#e2d8c6",
    thumbX: 0,
    thumbS: 1,
    lift: 0,
    scale: 1,
    shade: "0 0 0 1px rgba(226,216,198,0.2)",
    word: "Keeping",
    mark: "spin",
  });
  const done = pose({
    id: "done",
    name: "Done",
    well: "#6d7d58",
    ink: "#f3eee4",
    thumbX: 0,
    thumbS: 1,
    lift: 0,
    scale: 1,
    shade: "0 8px 18px rgba(109,125,88,0.28)",
    word: "Kept",
    mark: "check",
  });
  return {
    specimen: "commit",
    replyMs: 900,
    states: [rest, hover, armed, pending, done],
    edges: [
      {
        id: "e-rest-hover",
        from: "rest",
        to: "hover",
        duration: 140,
        easing: "exit",
        gesture: "enter",
        voices: voiceSet({ lift: 0, shade: 0, well: 8, ink: 8, word: 0, mark: 0 }, ids),
      },
      {
        id: "e-hover-rest",
        from: "hover",
        to: "rest",
        duration: 180,
        easing: "through",
        gesture: "leave",
        voices: voiceSet({ well: 0, shade: 16, lift: 24, ink: 8, word: 0, mark: 0 }, ids),
      },
      {
        id: "e-hover-armed",
        from: "hover",
        to: "armed",
        duration: 70,
        easing: "snap",
        gesture: "down",
        voices: voiceSet({ lift: 0, well: 0, shade: 0, ink: 0, word: 0, mark: 0 }, ids),
      },
      {
        id: "e-rest-armed",
        from: "rest",
        to: "armed",
        duration: 70,
        easing: "snap",
        gesture: "down",
        voices: voiceSet({ lift: 0, well: 0, shade: 0, ink: 0, word: 0, mark: 0 }, ids),
      },
      {
        id: "e-armed-hover",
        from: "armed",
        to: "hover",
        duration: 120,
        easing: "exit",
        gesture: "leave",
        voices: voiceSet({ lift: 0, well: 8, shade: 8, ink: 0, word: 0, mark: 0 }, ids),
      },
      {
        id: "e-armed-pending",
        from: "armed",
        to: "pending",
        duration: 220,
        easing: "through",
        gesture: "up",
        voices: voiceSet({ word: 0, ink: 16, mark: 72, well: 40, shade: 40, lift: 8 }, ids),
      },
      {
        id: "e-rest-pending",
        from: "rest",
        to: "pending",
        duration: 220,
        easing: "through",
        voices: voiceSet({ word: 0, ink: 16, mark: 72, well: 40, shade: 40, lift: 8 }, ids),
      },
      {
        id: "e-hover-pending",
        from: "hover",
        to: "pending",
        duration: 220,
        easing: "through",
        voices: voiceSet({ word: 0, ink: 16, mark: 72, well: 40, shade: 40, lift: 8 }, ids),
      },
      {
        id: "e-pending-done",
        from: "pending",
        to: "done",
        duration: 340,
        easing: "exit",
        gesture: "reply",
        voices: voiceSet({ well: 0, shade: 16, mark: 40, word: 90, ink: 90, lift: 8 }, ids),
      },
      {
        id: "e-done-rest",
        from: "done",
        to: "rest",
        duration: 240,
        easing: "through",
        gesture: "click",
        voices: voiceSet({ mark: 0, word: 40, ink: 40, well: 64, shade: 64, lift: 24 }, ids),
      },
    ],
  };
}

export const PRESETS: Record<SpecimenId, Doc> = {
  switch: switchDoc(),
  commit: commitDoc(),
};

export const SPECIMENS: { id: SpecimenId; label: string; hint: string }[] = [
  { id: "switch", label: "Switch", hint: "A slide that waits, or does not." },
  { id: "commit", label: "Commit", hint: "A press that admits the network." },
];

export function fresh(id: SpecimenId): Doc {
  return structuredClone(PRESETS[id]);
}

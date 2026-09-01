/**
 * Pedagogical Mandarin (Putonghua) tone model.
 *
 * Contours are Chao (1930) five-level letters, drawn as shapes a teacher
 * would put on a blackboard — not averages from a recorded corpus. Sandhi
 * and the neutral tone follow the usual textbook description of Beijing
 * Mandarin. Simplifications are listed in SOURCES at the bottom and shown
 * on the page.
 */

export type Underlying = 1 | 2 | 3 | 4 | 0;
export type Surface = "1" | "2" | "3" | "3h" | "4" | "0";

export type Point = { t: number; y: number };

export type Syllable = {
  han: string;
  /** Tone-less pinyin nucleus, e.g. "ma", "ni", "hao". */
  py: string;
  underlying: Underlying;
  /** 不 and 一 have their own sandhi, on top of the third-tone rule. */
  particle?: "bu" | "yi";
};

export type Item = {
  id: string;
  syllables: Syllable[];
  /** One sentence of context, shown above the staff. */
  note: string;
  isolation: boolean;
};

export type Lesson = {
  id: string;
  numeral: string;
  title: string;
  dek: string;
  items: Item[];
};

export const SOURCES = [
  "Yuen Ren Chao, “A System of Tone-Letters” (1930): the 1–5 staff.",
  "Third-tone sandhi (3+3 → 2+3) and the half-third (21) before a non-third are standard Putonghua.",
  "Neutral-tone height after 1 / 2 / 3 / 4 (low, mid, mid-high, low) follows the usual Beijing description.",
  "不 before a fourth tone is bú; 一 is yí before a fourth tone and yì before the others.",
  "Contours on this page are pedagogical shapes. They omit focus, question intonation, and regional variation.",
  "Pitch is estimated on-device with YIN (de Cheveigné & Kawahara, 2002). Nothing is transmitted.",
] as const;

const TONE_MARKS: Record<string, string[]> = {
  a: ["a", "ā", "á", "ǎ", "à"],
  e: ["e", "ē", "é", "ě", "è"],
  i: ["i", "ī", "í", "ǐ", "ì"],
  o: ["o", "ō", "ó", "ǒ", "ò"],
  u: ["u", "ū", "ú", "ǔ", "ù"],
  ü: ["ü", "ǖ", "ǘ", "ǚ", "ǜ"],
  v: ["ü", "ǖ", "ǘ", "ǚ", "ǜ"],
};

/** Place a tone mark on the nucleus, in the usual pinyin spelling order. */
export function markPinyin(raw: string, tone: Underlying | Surface): string {
  const n =
    tone === 0 || tone === "0"
      ? 0
      : tone === "3h" || tone === "3"
        ? 3
        : tone === "1" || tone === 1
          ? 1
          : tone === "2" || tone === 2
            ? 2
            : 4;
  if (n === 0) return raw;
  const lower = raw.toLowerCase();
  const pick = (vowel: string) => TONE_MARKS[vowel]?.[n] ?? vowel;
  if (lower.includes("a")) return lower.replace("a", pick("a"));
  if (lower.includes("e")) return lower.replace("e", pick("e"));
  if (lower.includes("ou")) return lower.replace("o", pick("o"));
  if (lower.includes("iu")) return lower.replace("u", pick("u"));
  const idx = Math.max(lower.lastIndexOf("i"), lower.lastIndexOf("u"), lower.lastIndexOf("ü"), lower.lastIndexOf("v"));
  if (idx >= 0) {
    const ch = lower[idx] ?? "i";
    return lower.slice(0, idx) + pick(ch) + lower.slice(idx + 1);
  }
  return raw;
}

export function surfaceOf(syllables: Syllable[]): Surface[] {
  const n = syllables.length;
  const out: Surface[] = syllables.map((s) => (s.underlying === 0 ? "0" : String(s.underlying) as Surface));

  for (let i = 0; i < n; i++) {
    const syl = syllables[i];
    if (!syl) continue;
    const next = syllables[i + 1];

    if (syl.particle === "bu" && next && next.underlying === 4) {
      out[i] = "2";
      continue;
    }
    if (syl.particle === "yi" && next) {
      out[i] = next.underlying === 4 ? "2" : "4";
      continue;
    }

    if (syl.underlying !== 3) continue;
    if (next && next.underlying === 3) {
      out[i] = "2";
    } else if (next) {
      // Before T1, T2, T4, or a neutral: the rise is dropped.
      out[i] = "3h";
    } else {
      out[i] = "3";
    }
  }
  return out;
}

function shape(kind: Surface, after?: Surface): Point[] {
  switch (kind) {
    case "1":
      return [
        { t: 0, y: 5 },
        { t: 1, y: 4.95 },
      ];
    case "2":
      return [
        { t: 0, y: 3 },
        { t: 0.28, y: 3.25 },
        { t: 1, y: 5 },
      ];
    case "3":
      return [
        { t: 0, y: 2.2 },
        { t: 0.38, y: 1.15 },
        { t: 0.62, y: 1.45 },
        { t: 1, y: 4 },
      ];
    case "3h":
      return [
        { t: 0, y: 2.15 },
        { t: 1, y: 1.15 },
      ];
    case "4":
      return [
        { t: 0, y: 5 },
        { t: 0.22, y: 4.15 },
        { t: 1, y: 1.15 },
      ];
    case "0": {
      const table: Record<string, [number, number]> = {
        "1": [2.15, 1.75],
        "2": [3.15, 2.75],
        "3": [4.05, 3.55],
        "3h": [3.85, 3.35],
        "4": [1.45, 1.1],
        "0": [2.5, 2.2],
      };
      const pair = table[after ?? "1"] ?? [2.2, 1.8];
      return [
        { t: 0, y: pair[0] },
        { t: 1, y: pair[1] },
      ];
    }
  }
}

export function syllableWeight(kind: Surface): number {
  return kind === "0" ? 0.55 : 1;
}

/** Concatenate syllable shapes onto one staff, with a short join at each boundary. */
export function phraseContour(syllables: Syllable[]): Point[] {
  const surface = surfaceOf(syllables);
  const weights = surface.map(syllableWeight);
  const total = weights.reduce((a, b) => a + b, 0) || 1;
  const points: Point[] = [];
  let cursor = 0;
  for (let i = 0; i < surface.length; i++) {
    const kind = surface[i] ?? "1";
    const prev = i > 0 ? surface[i - 1] : undefined;
    const local = shape(kind, prev);
    const span = (weights[i] ?? 1) / total;
    const join = i === 0 ? 0 : Math.min(0.04, span * 0.2);
    if (i > 0 && points.length) {
      const last = points[points.length - 1];
      const first = local[0];
      if (last && first) {
        points.push({ t: cursor + join * 0.5, y: (last.y + first.y) / 2 });
      }
    }
    for (const p of local) {
      points.push({ t: cursor + join + p.t * (span - join), y: p.y });
    }
    cursor += span;
  }
  return points;
}

export function boundaries(syllables: Syllable[]): number[] {
  const surface = surfaceOf(syllables);
  const weights = surface.map(syllableWeight);
  const total = weights.reduce((a, b) => a + b, 0) || 1;
  const marks: number[] = [];
  let cursor = 0;
  for (let i = 0; i < weights.length - 1; i++) {
    cursor += (weights[i] ?? 1) / total;
    marks.push(cursor);
  }
  return marks;
}

export function surfaceLabel(kind: Surface): string {
  switch (kind) {
    case "1":
      return "first tone (55)";
    case "2":
      return "second tone (35)";
    case "3":
      return "third tone, citation (214)";
    case "3h":
      return "half-third (21)";
    case "4":
      return "fourth tone (51)";
    case "0":
      return "neutral tone";
  }
}

function at(points: Point[], t: number): number {
  if (points.length === 0) return 3;
  if (t <= (points[0]?.t ?? 0)) return points[0]?.y ?? 3;
  const last = points[points.length - 1];
  if (last && t >= last.t) return last.y;
  for (let i = 1; i < points.length; i++) {
    const b = points[i];
    const a = points[i - 1];
    if (!a || !b) continue;
    if (t <= b.t) {
      const u = (t - a.t) / (b.t - a.t || 1);
      return a.y + (b.y - a.y) * u;
    }
  }
  return last?.y ?? 3;
}

export function resample(points: Point[], n = 48): Point[] {
  if (points.length === 0) return [];
  const t0 = points[0]?.t ?? 0;
  const t1 = points[points.length - 1]?.t ?? 1;
  const out: Point[] = [];
  for (let i = 0; i < n; i++) {
    const t = n === 1 ? 0 : i / (n - 1);
    out.push({ t, y: at(points, t0 + t * (t1 - t0)) });
  }
  return out;
}

function mean(xs: number[]): number {
  if (xs.length === 0) return 0;
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}

type Features = {
  start: number;
  mid: number;
  end: number;
  min: number;
  max: number;
  minT: number;
  maxT: number;
  rise: number;
  range: number;
  first: number;
  second: number;
};

function features(points: Point[]): Features | null {
  const r = resample(points, 40);
  if (r.length < 8) return null;
  const ys = r.map((p) => p.y);
  const start = mean(ys.slice(0, 6));
  const mid = mean(ys.slice(16, 24));
  const end = mean(ys.slice(-6));
  let min = ys[0] ?? 3;
  let max = ys[0] ?? 3;
  let minT = 0;
  let maxT = 0;
  r.forEach((p, i) => {
    if (p.y < min) {
      min = p.y;
      minT = r.length === 1 ? 0 : i / (r.length - 1);
    }
    if (p.y > max) {
      max = p.y;
      maxT = r.length === 1 ? 0 : i / (r.length - 1);
    }
  });
  return {
    start,
    mid,
    end,
    min,
    max,
    minT,
    maxT,
    rise: end - start,
    range: max - min,
    first: mid - start,
    second: end - mid,
  };
}

function classify(f: Features): Surface | "unclear" {
  const dipped = f.minT > 0.18 && f.minT < 0.72 && f.min < f.start - 0.55 && f.end > f.min + 0.9;
  if (dipped) return "3";
  if (f.range < 0.85) {
    if (f.start >= 3.8) return "1";
    if (f.start <= 2.1) return "0";
    return "unclear";
  }
  if (f.rise >= 0.9 && f.minT < 0.35) return "2";
  if (f.rise <= -1.0 && f.maxT < 0.35) return "4";
  if (f.rise <= -0.7 && f.start <= 2.8) return "3h";
  return "unclear";
}

export type Diagnosis = {
  lines: string[];
  ok: boolean;
};

/**
 * Name the error, not a score. One problem at a time. Height comments are
 * withheld when the staff is not yet the speaker's own range.
 */
export function diagnose(
  produced: Point[],
  syllables: Syllable[],
  registerKnown: boolean,
): Diagnosis {
  if (produced.length < 7) {
    return {
      ok: false,
      lines: [
        "There isn’t enough pitch to read. Hold the vowel longer — the tone lives on the voiced part, not on the consonant.",
      ],
    };
  }
  const f = features(produced);
  if (!f) {
    return { ok: false, lines: ["The line is too short to judge. Try again, a little slower."] };
  }

  const surface = surfaceOf(syllables);
  const primary = surface[0] ?? "1";
  const multi = surface.length > 1;

  if (multi) {
    return diagnosePhrase(f, produced, syllables, surface, registerKnown);
  }
  return diagnoseOne(f, primary, registerKnown, syllables[0]);
}

function diagnoseOne(f: Features, kind: Surface, registerKnown: boolean, syl?: Syllable): Diagnosis {
  const word = syl ? `${syl.han} (${markPinyin(syl.py, kind)})` : "this syllable";
  const heard = classify(f);
  const height = registerKnown;

  if (kind === "1") {
    if (heard === "4" || f.rise <= -1) {
      return { ok: false, lines: [`${word} is a first tone: high and level. Yours fell. Hold the same height through the vowel — do not step off it.`] };
    }
    if (heard === "2" || f.rise >= 0.9) {
      return { ok: false, lines: [`Your first tone is climbing. ${word} should stay put at the top of your range, not rise.`] };
    }
    if (f.range > 1.15) {
      return { ok: false, lines: [`The line is wandering. A first tone is a held note. Think of keeping the vowel still.`] };
    }
    if (height && f.start < 3.7) {
      return { ok: false, lines: [`Your first tone sits too low. It should live at the top of the staff — the same height you start a fourth tone from.`] };
    }
    return { ok: true, lines: [`Level, and high enough. That is a first tone: 55, a held top.`] };
  }

  if (kind === "2") {
    if (heard === "3") {
      return { ok: false, lines: [`This has a dip. A second tone only goes up. Start in the middle of your range and rise; do not go down first.`] };
    }
    if (heard === "4" || f.rise <= -0.7) {
      return { ok: false, lines: [`${word} should rise. Yours fell, which is a fourth-tone shape on a second-tone word.`] };
    }
    if (heard === "1" || f.range < 0.7) {
      return { ok: false, lines: [`Your second tone is flat. It has to move: start mid, finish high.`] };
    }
    if (height && f.start > 4.1) {
      return { ok: false, lines: [`Your second tone starts too high — there is nowhere left to rise. Begin nearer the middle of the staff.`] };
    }
    if (f.rise < 0.75 || (height && f.end < 4.2)) {
      return { ok: false, lines: [`It stops rising too early. Carry the second tone all the way to the top of your range.`] };
    }
    if (f.second < -0.45) {
      return { ok: false, lines: [`You rose and then fell off. Finish high; the second tone does not come back down.`] };
    }
    return { ok: true, lines: [`A rise from the middle to the top. That is a second tone.`] };
  }

  if (kind === "3") {
    if (heard === "2" || (f.rise > 1 && f.minT < 0.22)) {
      return { ok: false, lines: [`This rose like a second tone. In isolation the third tone dips first — down, then up. The rise is the second half, not the whole syllable.`] };
    }
    if (heard === "4") {
      return { ok: false, lines: [`This fell from high to low, a fourth tone. The isolated third tone starts low, dips, and then comes up.`] };
    }
    if (f.minT < 0.16 || f.min > f.start - 0.4) {
      return { ok: false, lines: [`The third tone needs a dip. Go down before you come up — the low turning point is the centre of the shape.`] };
    }
    if (f.end < f.min + 0.8) {
      return { ok: false, lines: [`You stayed low. Alone, or at the end of a phrase, the third tone rises after the dip. (Before another tone, the rise is dropped — that is a different shape.)`] };
    }
    if (height && f.min > 2.1) {
      return { ok: false, lines: [`The dip does not go low enough. The bottom of the third tone is the bottom of your range.`] };
    }
    return { ok: true, lines: [`Dip, then rise. That is the citation third tone — 214 — the one you use when the syllable stands alone.`] };
  }

  if (kind === "3h") {
    if (f.end > f.start + 0.55 || heard === "3") {
      return { ok: false, lines: [`You rose at the end. Before another tone, the third tone stays low and does not come up. Save the 214 rise for when the syllable is alone or last.`] };
    }
    if (heard === "2") {
      return { ok: false, lines: [`This climbed. The half-third is a low fall (21), not a rise. The rise appears only in the citation form.`] };
    }
    if (height && f.start > 3.4) {
      return { ok: false, lines: [`Start lower. The half-third lives in the bottom of the staff.`] };
    }
    if (heard === "4" && f.start > 3.8) {
      return { ok: false, lines: [`This started high and fell — a fourth tone. The half-third starts already low.`] };
    }
    return { ok: true, lines: [`Low, and no rise. That is the half-third: the third tone as it actually appears before another full tone.`] };
  }

  if (kind === "4") {
    if (heard === "2" || f.rise >= 0.7) {
      return { ok: false, lines: [`${word} should fall. Yours rose. Start at the top and come all the way down.`] };
    }
    if (heard === "3") {
      return { ok: false, lines: [`This dipped and came up. A fourth tone only falls.`] };
    }
    if (heard === "1" || f.range < 0.85) {
      return { ok: false, lines: [`Your fourth tone is too flat. It is a drop, not a held note.`] };
    }
    if (height && f.start < 3.7) {
      return { ok: false, lines: [`Your fourth tone starts too low, so the fall has no room. Begin at the top of your range.`] };
    }
    if (f.rise > -1.05 || (height && f.end > 2.3)) {
      return { ok: false, lines: [`The fall stops too high. Take the fourth tone to the bottom of the staff.`] };
    }
    return { ok: true, lines: [`High to low, in one motion. That is a fourth tone.`] };
  }

  // Neutral, isolated (should be rare; usually in a phrase).
  if (f.range > 1.6) {
    return { ok: false, lines: [`The neutral tone is short and almost flat. Yours still has a full contour — cut it off and let it sit.`] };
  }
  return { ok: true, lines: [`Short, and not a full tone. That is the idea of the neutral.`] };
}

function diagnosePhrase(
  f: Features,
  produced: Point[],
  syllables: Syllable[],
  surface: Surface[],
  registerKnown: boolean,
): Diagnosis {
  const weights = surface.map(syllableWeight);
  const total = weights.reduce((a, b) => a + b, 0) || 1;
  let cursor = 0;
  for (let i = 0; i < surface.length; i++) {
    const span = (weights[i] ?? 1) / total;
    const slice = resample(produced, 64).filter((p) => p.t >= cursor && p.t <= cursor + span);
    const local = features(slice.length >= 6 ? slice : [{ t: 0, y: at(produced, cursor) }, { t: 1, y: at(produced, cursor + span) }]);
    const kind = surface[i] ?? "1";
    const syl = syllables[i];
    cursor += span;
    if (!local || !syl) continue;

    if (kind === "2" && i === 0 && syllables[0]?.underlying === 3 && syllables[1]?.underlying === 3) {
      if (local.rise < 0.55 && classify(local) !== "2") {
        return {
          ok: false,
          lines: [
            `The first ${syl.han} should rise, like a second tone. Two third tones in a row: the first one changes. This is obligatory — not a casual-speech shortcut.`,
          ],
        };
      }
    }
    if (kind === "3h" && (local.end > local.start + 0.6 || classify(local) === "3")) {
      return {
        ok: false,
        lines: [
          `${syl.han} is not alone here, so it should not rise. The citation 214 appears when a third tone stands by itself or comes last; before what follows, it stays low.`,
        ],
      };
    }
    if (kind === "0") {
      if (local.range > 1.7) {
        return {
          ok: false,
          lines: [
            `${syl.han} is neutral: shorter, and without a full tone shape. Yours still traces a contour. Let it sit at the height the previous tone leaves you at.`,
          ],
        };
      }
      const prev = surface[i - 1];
      if (registerKnown && prev === "4" && local.start > 2.6) {
        return {
          ok: false,
          lines: [`After a fourth tone the neutral sits at the bottom of the staff. Yours stayed high.`],
        };
      }
      if (registerKnown && (prev === "3" || prev === "3h") && local.start < 2.8) {
        return {
          ok: false,
          lines: [`After a third tone the neutral sits relatively high. Yours dropped. The height is borrowed, not chosen.`],
        };
      }
      if (registerKnown && prev === "1" && local.start > 3.6) {
        return {
          ok: false,
          lines: [`After a first tone the neutral is low-mid, not another high level. Come off the top.`],
        };
      }
    }
    if (kind === "2" && classify(local) === "4") {
      return { ok: false, lines: [`${syl.han} should rise here. The line fell.`] };
    }
    if (kind === "4" && classify(local) === "2") {
      return { ok: false, lines: [`${syl.han} should fall here. The line rose.`] };
    }
  }

  // Connected-speech reset: a jump back to a citation start in the middle of the phrase.
  if (surface.length >= 2 && surface[0] === "2" && surface[1] === "3") {
    const mid = at(produced, 0.5);
    if (mid < 1.6 && f.end < 2.2) {
      return {
        ok: false,
        lines: [
          `The two syllables should join: the rise of 你 runs into 好. You reset and started a new third tone in the middle. Do not put a silence, or a new 214, between them.`,
        ],
      };
    }
  }

  if (surface.includes("2") && f.range < 0.7) {
    return { ok: false, lines: [`The whole phrase is too flat. The sandhi rise still has to be there — the change is audible, not only a spelling.`] };
  }

  const names = syllables.map((s, i) => `${s.han} as a ${surfaceLabel(surface[i] ?? "1")}`).join("; ");
  return {
    ok: true,
    lines: [
      `The phrase has the right motion — ${names}. In connected speech the shapes join; you did not restart each syllable from its citation form.`,
    ],
  };
}

export function spokenPinyin(syllables: Syllable[]): string {
  const surface = surfaceOf(syllables);
  return syllables.map((s, i) => markPinyin(s.py, surface[i] ?? s.underlying)).join(" ");
}

export function underlyingPinyin(syllables: Syllable[]): string {
  return syllables.map((s) => markPinyin(s.py, s.underlying)).join(" ");
}

export function sandhiChanged(syllables: Syllable[]): boolean {
  const surface = surfaceOf(syllables);
  return syllables.some((s, i) => {
    const u = s.underlying === 0 ? "0" : String(s.underlying);
    return u !== surface[i];
  });
}

const S = (han: string, py: string, underlying: Underlying, particle?: "bu" | "yi"): Syllable =>
  particle ? { han, py, underlying, particle } : { han, py, underlying };

export const LESSONS: Lesson[] = [
  {
    id: "four",
    numeral: "I",
    title: "Four shapes",
    dek: "The citation tones, one at a time. The arrows in textbooks are these four lines.",
    items: [
      {
        id: "ma1",
        syllables: [S("妈", "ma", 1)],
        note: "First tone: high and level. 55. Nothing moves.",
        isolation: true,
      },
      {
        id: "ma2",
        syllables: [S("麻", "ma", 2)],
        note: "Second tone: starts in the middle and rises. 35. The rise is the whole event.",
        isolation: true,
      },
      {
        id: "ma3",
        syllables: [S("马", "ma", 3)],
        note: "Third tone, alone: dip, then rise. 214. This is the citation form — not what you will say in a sentence.",
        isolation: true,
      },
      {
        id: "ma4",
        syllables: [S("骂", "ma", 4)],
        note: "Fourth tone: high to low, in one drop. 51.",
        isolation: true,
      },
    ],
  },
  {
    id: "half",
    numeral: "II",
    title: "The dip",
    dek: "The third tone is two things. The 214 you drilled is the isolation form.",
    items: [
      {
        id: "hao",
        syllables: [S("好", "hao", 3)],
        note: "Alone, 好 is a full 214. Dip, then come up. This is the form people memorise, and then mis-apply.",
        isolation: true,
      },
      {
        id: "haokan",
        syllables: [S("好", "hao", 3), S("看", "kan", 4)],
        note: "Before another tone the rise is dropped. 好 in 好看 is a low 21. The third tone you meet in speech is usually this one.",
        isolation: false,
      },
    ],
  },
  {
    id: "sandhi",
    numeral: "III",
    title: "Two thirds",
    dek: "When two third tones meet, the first becomes a second tone. Obligatory.",
    items: [
      {
        id: "nihao",
        syllables: [S("你", "ni", 3), S("好", "hao", 3)],
        note: "Underlying nǐ hǎo is spoken ní hǎo. The first syllable rises. This is not optional, and it is not sloppy speech.",
        isolation: false,
      },
      {
        id: "wohenhao",
        syllables: [S("我", "wo", 3), S("很", "hen", 3), S("好", "hao", 3)],
        note: "A run of thirds: every one except the last becomes a second tone. 我很好 is wó hén hǎo.",
        isolation: false,
      },
    ],
  },
  {
    id: "neutral",
    numeral: "IV",
    title: "The fifth tone",
    dek: "Neutral tone is short, and its height is borrowed from what came before.",
    items: [
      {
        id: "mama",
        syllables: [S("妈", "ma", 1), S("妈", "ma", 0)],
        note: "After a first tone the neutral sits low-mid. 妈妈 is not two high levels.",
        isolation: false,
      },
      {
        id: "baba",
        syllables: [S("爸", "ba", 4), S("爸", "ba", 0)],
        note: "After a fourth tone the neutral is at the bottom of the staff. 爸爸 falls, then stays down.",
        isolation: false,
      },
      {
        id: "yizi",
        syllables: [S("椅", "yi", 3), S("子", "zi", 0)],
        note: "椅 is a half-third before the suffix; 子 is neutral and relatively high. After a third tone, the leftover height is high, not low.",
        isolation: false,
      },
      {
        id: "piaoliang",
        syllables: [S("漂", "piao", 4), S("亮", "liang", 0)],
        note: "亮 was a fourth tone; as a neutral it loses that contour and sits low, because 漂 fell.",
        isolation: false,
      },
    ],
  },
  {
    id: "phrase",
    numeral: "V",
    title: "A phrase",
    dek: "Citation forms do not restart on every syllable. The line continues.",
    items: [
      {
        id: "nihaoma",
        syllables: [S("你", "ni", 3), S("好", "hao", 3), S("吗", "ma", 0)],
        note: "你 rises (sandhi), 好 stays low (half-third before the particle), 吗 is neutral and relatively high after that third. One line, not three drills.",
        isolation: false,
      },
      {
        id: "bushi",
        syllables: [S("不", "bu", 4, "bu"), S("是", "shi", 4)],
        note: "不 is bù, except before a fourth tone, where it becomes bú. 不是 is the usual example. Another sandhi, not an exception you memorise as a word.",
        isolation: false,
      },
    ],
  },
];

export function formantsFor(py: string): [number, number, number] {
  const n = py.toLowerCase();
  if (n.includes("i") && !n.includes("a") && !n.includes("o") && !n.includes("e")) {
    return [270, 2300, 3000];
  }
  if (n.startsWith("shi") || n.startsWith("zi") || n.startsWith("si")) {
    return [400, 1800, 2600];
  }
  if (n.includes("u") && !n.includes("a") && !n.includes("o")) {
    return [300, 870, 2240];
  }
  if (n.includes("ao") || n.includes("ou")) {
    return [700, 1100, 2400];
  }
  if (n.includes("e")) {
    return [530, 1840, 2480];
  }
  return [750, 1180, 2400];
}

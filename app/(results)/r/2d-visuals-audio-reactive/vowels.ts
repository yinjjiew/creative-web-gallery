/**
 * Landmark vowels on the F1–F2 plane.
 *
 * Frequencies are adult-male means from Hillenbrand, Getty & Clark (1995),
 * "Acoustic characteristics of American English vowels", JASA 97(5).
 * A shorter tract (most women, all children) shifts the same vowel up and
 * right — higher F1 and F2 — without changing the shape of the space.
 *
 * The plane itself is the classic phonetic chart: F2 high on the left (front),
 * F1 low at the top (high tongue). Pitch is not an axis.
 */

export type Vowel = {
  ipa: string;
  word: string;
  key: string;
  f1: number;
  f2: number;
  f3: number;
};

export const VOWELS: Vowel[] = [
  { ipa: "i", word: "heed", key: "i", f1: 342, f2: 2322, f3: 3000 },
  { ipa: "ɪ", word: "hid", key: "y", f1: 427, f2: 2034, f3: 2684 },
  { ipa: "e", word: "hayed", key: "e", f1: 476, f2: 2089, f3: 2691 },
  { ipa: "ɛ", word: "head", key: "3", f1: 580, f2: 1799, f3: 2605 },
  { ipa: "æ", word: "had", key: "a", f1: 588, f2: 1952, f3: 2601 },
  { ipa: "ɑ", word: "hod", key: "o", f1: 768, f2: 1333, f3: 2522 },
  { ipa: "ɔ", word: "hawed", key: "4", f1: 652, f2: 997, f3: 2538 },
  { ipa: "ʊ", word: "hood", key: "w", f1: 469, f2: 1122, f3: 2434 },
  { ipa: "u", word: "who'd", key: "u", f1: 378, f2: 997, f3: 2343 },
  { ipa: "ʌ", word: "hud", key: "v", f1: 623, f2: 1200, f3: 2550 },
  { ipa: "ə", word: "the", key: "x", f1: 500, f2: 1500, f3: 2500 },
];

/** Chart window in Hz. F2 is drawn reversed (front = left). */
export const PLANE = {
  f1Min: 220,
  f1Max: 980,
  f2Min: 720,
  f2Max: 2680,
};

export const PROVENANCE =
  "Landmarks: Hillenbrand, Getty & Clark 1995, adult male means. Analysis: 14th-order LPC, 16 kHz, 25 ms Hamming, Levinson–Durbin. Same pipeline for voice and the on-device synthesizer.";

const KEY_TO_IPA: Record<string, string> = {
  i: "i",
  "1": "i",
  y: "ɪ",
  "2": "ɪ",
  e: "e",
  "3": "ɛ",
  a: "æ",
  "4": "æ",
  o: "ɑ",
  "5": "ɑ",
  "6": "ɔ",
  w: "ʊ",
  "7": "ʊ",
  u: "u",
  "8": "u",
  v: "ʌ",
  "9": "ʌ",
  x: "ə",
  "0": "ə",
};

export function nearestVowel(f1: number, f2: number): Vowel {
  let best = VOWELS[0]!;
  let bestD = Infinity;
  for (const v of VOWELS) {
    const d = (v.f1 - f1) ** 2 + (v.f2 - f2) ** 2;
    if (d < bestD) {
      bestD = d;
      best = v;
    }
  }
  return best;
}

export function vowelByKey(key: string): Vowel | undefined {
  const ipa = KEY_TO_IPA[key.toLowerCase()];
  if (!ipa) return undefined;
  return VOWELS.find((v) => v.ipa === ipa);
}

/** F3 is not on the chart; the synth still needs a third resonator. */
export function estimateF3(f1: number, f2: number): number {
  let wsum = 0;
  let fsum = 0;
  for (const v of VOWELS) {
    const w = 1 / ((v.f1 - f1) ** 2 + (v.f2 - f2) ** 2 + 400);
    wsum += w;
    fsum += w * v.f3;
  }
  return fsum / wsum;
}

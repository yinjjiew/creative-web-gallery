import { SEARCH, type Kind, type SearchRec } from "./catalog";

export type Hit = {
  rec: SearchRec;
  score: number;
  snippet: string;
};

const KIND_WEIGHT: Record<Kind, number> = {
  api: 8,
  concept: 6,
  guide: 4,
  migrate: 5,
  limit: 5,
  home: 1,
};

function snippet(text: string, query: string): string {
  const hay = text;
  const q = query.trim();
  if (!q) return hay.slice(0, 160);
  const i = hay.toLowerCase().indexOf(q.toLowerCase());
  if (i < 0) return hay.slice(0, 160);
  const from = Math.max(0, i - 36);
  const to = Math.min(hay.length, i + q.length + 80);
  return `${from > 0 ? "…" : ""}${hay.slice(from, to)}${to < hay.length ? "…" : ""}`;
}

export function searchDocs(raw: string): Hit[] {
  const query = raw.trim().toLowerCase();
  if (query.length < 1) return [];
  const tokens = query.split(/\s+/).filter(Boolean);
  const hits: Hit[] = [];

  for (const rec of SEARCH) {
    const title = rec.title.toLowerCase();
    const hay = `${rec.text} ${rec.aliases.join(" ")}`.toLowerCase();
    const sig = (rec.signature ?? "").toLowerCase();
    const aliases = rec.aliases.map((a) => a.toLowerCase());
    let score = 0;

    if (title === query || aliases.some((a) => a === query)) score += 120;
    else if (title.startsWith(query)) score += 90;
    else if (title.includes(query)) score += 55;

    if (sig && (sig.startsWith(query) || sig.includes(query))) score += 70;
    if (aliases.some((a) => a.startsWith(query))) score += 45;
    if (hay.includes(query)) score += 28;

    let tokenHits = 0;
    for (const t of tokens) {
      if (title.includes(t) || sig.includes(t) || aliases.some((a) => a.includes(t)) || hay.includes(t)) {
        tokenHits += 1;
      }
    }
    if (tokens.length && tokenHits === 0) continue;
    score += tokenHits * 16;
    score += KIND_WEIGHT[rec.kind];

    if (score <= 0) continue;
    hits.push({ rec, score, snippet: snippet(rec.text, query) });
  }

  hits.sort((a, b) => b.score - a.score || a.rec.title.localeCompare(b.rec.title));

  const seen = new Set<string>();
  const unique: Hit[] = [];
  for (const h of hits) {
    const key = `${h.rec.slug}#${h.rec.hash ?? ""}:${h.rec.title}`;
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(h);
    if (unique.length >= 12) break;
  }
  return unique;
}

export const HINTS = ["dst", "Instant.parse", "add a month", "SkippedTimeError", "v2"];

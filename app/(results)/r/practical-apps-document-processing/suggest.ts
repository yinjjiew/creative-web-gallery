import {
  FIELD_LABEL,
  findLine,
  type Doc,
  type FieldId,
  type Focus,
  type Line,
} from "./state";

export type SuggestionKind = "glossary" | "variant" | "calendar";

export type Suggestion = {
  id: string;
  kind: SuggestionKind;
  fieldId: FieldId;
  text: string;
  note: string;
  adoptable: boolean;
};

const GLOSSARY: { pattern: RegExp; expansion: string; note: string }[] = [
  {
    pattern: /^(ag\.?\s*lab\.?)$/i,
    expansion: "agricultural labourer",
    note: "Common expansion of ag. lab. in North Riding registers after 1813. A glossary, not a reading of these graphs.",
  },
  {
    pattern: /^(lab\.?)$/i,
    expansion: "labourer",
    note: "Common expansion of lab. A glossary, not a reading of these graphs.",
  },
  {
    pattern: /^(yeo\.?)$/i,
    expansion: "yeoman",
    note: "Common expansion of yeo. A glossary, not a reading of these graphs.",
  },
];

const MONTHS: Record<string, number> = {
  january: 1,
  february: 2,
  march: 3,
  april: 4,
  may: 5,
  june: 6,
  july: 7,
  august: 8,
  september: 9,
  october: 10,
  november: 11,
  december: 12,
};

function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

function calendarFlag(value: string, year: number): Suggestion | null {
  const match = value.match(
    /^(\d{1,2})\s+(January|February|March|April|May|June|July|August|September|October|November|December)(?:\s+(\d{4}))?$/i,
  );
  if (!match) return null;
  const day = Number(match[1]);
  const month = MONTHS[match[2].toLowerCase()];
  const y = match[3] ? Number(match[3]) : year;
  if (!month) return null;
  const max = daysInMonth(y, month);
  if (day >= 1 && day <= max) return null;
  return {
    id: "cal-impossible",
    kind: "calendar",
    fieldId: "when",
    text: value,
    note: `${match[1]} ${match[2]} ${String(y)} is not a calendar day (${match[2]} ${String(y)} has ${String(max)} days). The software will not correct the figures. Certainty is about the ink.`,
    adoptable: false,
  };
}

function surnameKey(value: string): string {
  return value.toLowerCase().replace(/[^a-z]/g, "");
}

function relatedSurnames(doc: Doc, line: Line): Suggestion[] {
  const here = surnameKey(line.fields.surname.value);
  if (here.length < 4) return [];
  const out: Suggestion[] = [];
  const seen = new Set<string>();
  for (const folio of doc.folios) {
    for (const other of folio.lines) {
      if (other.id === line.id) continue;
      const raw = other.fields.surname.value;
      const key = surnameKey(raw);
      if (!key || key === here) continue;
      const share =
        here.slice(0, 4) === key.slice(0, 4) ||
        (here.startsWith("whit") && key.startsWith("whit"));
      if (!share) continue;
      const stamp = `${folio.folio}:${other.n}:${key}`;
      if (seen.has(stamp)) continue;
      seen.add(stamp);
      out.push({
        id: `var-${stamp}`,
        kind: "variant",
        fieldId: "surname",
        text: raw,
        note: `Attested on folio ${folio.folio}, line ${String(other.n)}, as a ${other.fields.surname.certainty} reading. Evidence that the spelling occurs in this volume — not a reading of this line.`,
        adoptable: true,
      });
    }
  }
  return out;
}

export function suggestionsFor(doc: Doc, focus: Focus): Suggestion[] {
  const found = findLine(doc, focus.lineId);
  if (!found) return [];
  const { folio, line } = found;
  const field = line.fields[focus.fieldId];
  const out: Suggestion[] = [];

  if (focus.fieldId === "trade") {
    for (const item of GLOSSARY) {
      if (item.pattern.test(field.value.trim())) {
        if (field.value.trim().toLowerCase() === item.expansion) continue;
        out.push({
          id: `gloss-${item.expansion}`,
          kind: "glossary",
          fieldId: "trade",
          text: item.expansion,
          note: item.note,
          adoptable: true,
        });
      }
    }
  }

  if (focus.fieldId === "when") {
    const flag = calendarFlag(field.value.trim(), folio.year);
    if (flag) out.push(flag);
  }

  if (focus.fieldId === "surname") {
    out.push(...relatedSurnames(doc, line));
  }

  return out;
}

export function suggestionLabel(kind: SuggestionKind): string {
  if (kind === "glossary") return "Glossary";
  if (kind === "variant") return "Attested elsewhere";
  return "Calendar";
}

export function lineTitle(doc: Doc, lineId: string): string {
  const found = findLine(doc, lineId);
  if (!found) return lineId;
  return `folio ${found.folio.folio} · line ${String(found.line.n)}`;
}

export function fieldCaption(doc: Doc, focus: Focus): string {
  const found = findLine(doc, focus.lineId);
  if (!found) return FIELD_LABEL[focus.fieldId];
  return `${FIELD_LABEL[focus.fieldId]} · ${lineTitle(doc, focus.lineId)} · ${found.folio.year}`;
}


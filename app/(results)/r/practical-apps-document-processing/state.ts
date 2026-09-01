export const CERTAINTIES = ["certain", "probable", "guess", "illegible"] as const;
export type Certainty = (typeof CERTAINTIES)[number];

export type Origin = "judgement" | "suggestion";

export const FIELD_IDS = [
  "when",
  "child",
  "parents",
  "surname",
  "abode",
  "trade",
  "minister",
] as const;
export type FieldId = (typeof FIELD_IDS)[number];

export const FIELD_LABEL: Record<FieldId, string> = {
  when: "When baptized",
  child: "Child’s Christian name",
  parents: "Parents’ Christian names",
  surname: "Surname",
  abode: "Abode",
  trade: "Quality, trade, or profession",
  minister: "By whom the ceremony was performed",
};

export const FIELD_SHORT: Record<FieldId, string> = {
  when: "When",
  child: "Child",
  parents: "Parents",
  surname: "Surname",
  abode: "Abode",
  trade: "Trade",
  minister: "Minister",
};

export type Rect = { x: number; y: number; w: number; h: number };

export type Revision = {
  seq: number;
  sitting: string;
  value: string;
  certainty: Certainty;
  caveat: string;
  origin: Origin;
  reason: string;
};

export type Field = {
  value: string;
  certainty: Certainty;
  caveat: string;
  origin: Origin;
  region: Rect;
  revisions: Revision[];
};

export type Line = {
  id: string;
  n: number;
  laterHand: boolean;
  fields: Record<FieldId, Field>;
};

export type Folio = {
  id: string;
  parish: string;
  church: string;
  county: string;
  kind: "baptisms";
  year: number;
  folio: string;
  volume: string;
  photographed: string;
  damage: string[];
  lines: Line[];
};

export type Doc = {
  scholar: string;
  sitting: string;
  nextSeq: number;
  activeFolioId: string;
  folios: Folio[];
};

export type Focus = { lineId: string; fieldId: FieldId };

export type State = {
  doc: Doc;
  focus: Focus | null;
  linking: boolean;
  past: Doc[];
  future: Doc[];
};

export const STORAGE_KEY = "register:askrigg:v1";

export type Action =
  | { type: "focus"; focus: Focus | null }
  | { type: "linking"; on: boolean }
  | { type: "folio"; id: string }
  | { type: "patch"; lineId: string; fieldId: FieldId; patch: FieldPatch; reason: string }
  | { type: "restore"; lineId: string; fieldId: FieldId; seq: number }
  | { type: "region"; lineId: string; fieldId: FieldId; region: Rect }
  | { type: "undo" }
  | { type: "redo" }
  | { type: "replace"; doc: Doc };

export type FieldPatch = Partial<Pick<Field, "value" | "certainty" | "caveat" | "origin">>;

export function folioOf(doc: Doc): Folio {
  return doc.folios.find((f) => f.id === doc.activeFolioId) ?? doc.folios[0];
}

export function lineOf(folio: Folio, lineId: string): Line | undefined {
  return folio.lines.find((l) => l.id === lineId);
}

export function findLine(doc: Doc, lineId: string): { folio: Folio; line: Line } | null {
  for (const folio of doc.folios) {
    const line = folio.lines.find((l) => l.id === lineId);
    if (line) return { folio, line };
  }
  return null;
}

/** Fields that still ask something of her — not certain judgements with no caveat. */
export function openQuestions(doc: Doc): Focus[] {
  const out: Focus[] = [];
  for (const folio of doc.folios) {
    for (const line of folio.lines) {
      for (const fieldId of FIELD_IDS) {
        const field = line.fields[fieldId];
        if (field.certainty !== "certain" || field.origin === "suggestion") {
          out.push({ lineId: line.id, fieldId });
        }
      }
    }
  }
  return out;
}

export function cloneDoc(doc: Doc): Doc {
  return structuredClone(doc);
}

function applyPatch(
  doc: Doc,
  lineId: string,
  fieldId: FieldId,
  patch: FieldPatch,
  reason: string,
  region?: Rect,
): Doc {
  const next = cloneDoc(doc);
  const found = findLine(next, lineId);
  if (!found) return doc;
  const field = found.line.fields[fieldId];
  const merged: Field = {
    ...field,
    ...patch,
    region: region ?? field.region,
  };
  const same =
    merged.value === field.value &&
    merged.certainty === field.certainty &&
    merged.caveat === field.caveat &&
    merged.origin === field.origin &&
    !region;
  if (same) return doc;

  const last = field.revisions[field.revisions.length - 1];
  const coalesce =
    last &&
    last.sitting === next.sitting &&
    last.reason === reason &&
    (reason === "typed" || reason === "caveat");

  const rev: Revision = {
    seq: coalesce ? last.seq : next.nextSeq,
    sitting: next.sitting,
    value: merged.value,
    certainty: merged.certainty,
    caveat: merged.caveat,
    origin: merged.origin,
    reason,
  };

  if (coalesce) {
    merged.revisions = field.revisions.slice(0, -1).concat(rev);
  } else {
    merged.revisions = field.revisions.concat(rev);
    next.nextSeq += 1;
  }
  found.line.fields[fieldId] = merged;
  return next;
}

export function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "focus":
      return { ...state, focus: action.focus };
    case "linking":
      return { ...state, linking: action.on };
    case "folio":
      return { ...state, doc: { ...state.doc, activeFolioId: action.id }, focus: null };
    case "replace":
      return { ...state, doc: action.doc, past: [], future: [] };
    case "patch": {
      const doc = applyPatch(state.doc, action.lineId, action.fieldId, action.patch, action.reason);
      if (doc === state.doc) return state;
      return {
        ...state,
        doc,
        past: [...state.past.slice(-40), state.doc],
        future: [],
      };
    }
    case "region": {
      const doc = applyPatch(
        state.doc,
        action.lineId,
        action.fieldId,
        {},
        "region linked",
        action.region,
      );
      if (doc === state.doc) return state;
      return {
        ...state,
        doc,
        linking: false,
        past: [...state.past.slice(-40), state.doc],
        future: [],
      };
    }
    case "restore": {
      const found = findLine(state.doc, action.lineId);
      if (!found) return state;
      const field = found.line.fields[action.fieldId];
      const rev = field.revisions.find((r) => r.seq === action.seq);
      if (!rev) return state;
      const doc = applyPatch(
        state.doc,
        action.lineId,
        action.fieldId,
        {
          value: rev.value,
          certainty: rev.certainty,
          caveat: rev.caveat,
          origin: rev.origin,
        },
        `restored seq ${String(rev.seq)}`,
      );
      if (doc === state.doc) return state;
      return {
        ...state,
        doc,
        past: [...state.past.slice(-40), state.doc],
        future: [],
      };
    }
    case "undo": {
      const prev = state.past[state.past.length - 1];
      if (!prev) return state;
      return {
        ...state,
        doc: prev,
        past: state.past.slice(0, -1),
        future: [state.doc, ...state.future],
      };
    }
    case "redo": {
      const next = state.future[0];
      if (!next) return state;
      return {
        ...state,
        doc: next,
        past: [...state.past, state.doc],
        future: state.future.slice(1),
      };
    }
    default:
      return state;
  }
}

export function serialise(doc: Doc): string {
  return JSON.stringify(doc);
}

export function deserialise(raw: string): Doc | null {
  try {
    const parsed = JSON.parse(raw) as Doc;
    if (!parsed?.folios?.length || !parsed.sitting) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function neighbour(
  folio: Folio,
  focus: Focus,
  dLine: number,
  dField: number,
): Focus {
  const lineIndex = folio.lines.findIndex((l) => l.id === focus.lineId);
  const fieldIndex = FIELD_IDS.indexOf(focus.fieldId);
  const nextField = FIELD_IDS[fieldIndex + dField];
  if (dField !== 0 && nextField) {
    return { lineId: focus.lineId, fieldId: nextField };
  }
  if (dField > 0) {
    const line = folio.lines[lineIndex + 1];
    if (line) return { lineId: line.id, fieldId: FIELD_IDS[0] };
  }
  if (dField < 0) {
    const line = folio.lines[lineIndex - 1];
    if (line) return { lineId: line.id, fieldId: FIELD_IDS[FIELD_IDS.length - 1] };
  }
  const line = folio.lines[Math.min(folio.lines.length - 1, Math.max(0, lineIndex + dLine))];
  return { lineId: line.id, fieldId: focus.fieldId };
}

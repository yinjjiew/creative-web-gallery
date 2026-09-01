import { FIRST_SITTING, PROVENANCE, SCHOLAR, THIS_SITTING } from "./seed";
import {
  FIELD_IDS,
  FIELD_LABEL,
  type Certainty,
  type Doc,
  type Field,
  type Folio,
  type Line,
  type Origin,
} from "./state";

function mark(certainty: Certainty, origin: Origin): string {
  const who = origin === "suggestion" ? "; adopted suggestion, not yet a judgement" : "";
  if (certainty === "certain") return origin === "suggestion" ? `[suggested${who}]` : "";
  if (certainty === "probable") return `[probable${who}]`;
  if (certainty === "guess") return `[guess${who}]`;
  return `[illegible${who}]`;
}

function region(field: Field): string {
  const r = field.region;
  const n = (x: number) => x.toFixed(3);
  return `bbox ${n(r.x)},${n(r.y)},${n(r.w)},${n(r.h)}`;
}

function fieldLine(field: Field, label: string): string {
  const reading = field.certainty === "illegible" && !field.value ? "∅" : field.value || "∅";
  const tagged = `${reading} ${mark(field.certainty, field.origin)}`.trim();
  const caveat = field.caveat ? ` — ${field.caveat}` : "";
  const first = field.revisions[0];
  const kept =
    first && (first.value !== field.value || first.certainty !== field.certainty)
      ? ` Original (${first.sitting}): ${first.value || "∅"} [${first.certainty}].`
      : "";
  return `${label}: ${tagged}${caveat}. Region ${region(field)}.${kept}`;
}

function entryBlock(folio: Folio, line: Line): string {
  const head = `${folio.church}, ${folio.parish} (${folio.county}), ${folio.kind} ${String(folio.year)}, ${folio.volume} folio ${folio.folio}, line ${String(line.n)}.`;
  const later = line.laterHand ? " A later hand is present on this line." : "";
  const body = FIELD_IDS.map((id) => `    ${fieldLine(line.fields[id], FIELD_LABEL[id])}`).join(
    "\n",
  );
  return `${head}${later}\n${body}`;
}

export function editionText(doc: Doc): string {
  const title = `${folioHead(doc.folios[0])} — diplomatic edition with uncertainty`;
  const by = `Transcribed ${SCHOLAR}. First sitting ${FIRST_SITTING}; this sitting ${THIS_SITTING}.`;
  const how =
    "Every field records a reading, a certainty, a caveat if she has one, an origin (judgement or suggestion), a link back to a region of the facsimile, and a revision history that keeps the first reading. Suggestions are marked as such. Nothing has been silently resolved.";
  const folios = doc.folios
    .map((folio) => {
      const plate = `Facsimile folio ${folio.folio}: ${folio.photographed}. Damage: ${folio.damage.join("; ")}.`;
      const entries = folio.lines.map((line) => entryBlock(folio, line)).join("\n\n");
      return `${plate}\n\n${entries}`;
    })
    .join("\n\n——\n\n");
  const prov = PROVENANCE.map((p, i) => `${String(i + 1)}. ${p}`).join("\n");
  return `${title}\n${by}\n\n${how}\n\n${folios}\n\nProvenance\n${prov}\n`;
}

function folioHead(folio: Folio): string {
  return `${folio.parish} (${folio.church}), ${folio.kind} register ${String(folio.year)}`;
}

export function editionJson(doc: Doc): string {
  const payload = {
    type: "parish-register-diplomatic-edition",
    citeAs: `${SCHOLAR}, diplomatic transcription of ${folioHead(doc.folios[0])}, sittings of ${FIRST_SITTING} and ${THIS_SITTING}. Uncertainty is recorded per field.`,
    scholar: doc.scholar,
    sitting: doc.sitting,
    statement:
      "Readings with origin ‘suggestion’ are not judgements. Certainty describes the reading of the ink, not the truth of the fact. The original reading of each field is revisions[0].",
    provenance: PROVENANCE,
    facsimile: {
      kind: "synthesized",
      model: "Rose’s Act 1812 printed baptism register",
      coordinateSpace: "normalised 0–1 against the paper rectangle of each folio plate",
    },
    folios: doc.folios.map((folio) => ({
      id: folio.id,
      parish: folio.parish,
      church: folio.church,
      county: folio.county,
      kind: folio.kind,
      year: folio.year,
      folio: folio.folio,
      volume: folio.volume,
      photographed: folio.photographed,
      damage: folio.damage,
      entries: folio.lines.map((line) => ({
        id: line.id,
        line: line.n,
        laterHand: line.laterHand,
        fields: Object.fromEntries(
          FIELD_IDS.map((id) => {
            const field = line.fields[id];
            return [
              id,
              {
                label: FIELD_LABEL[id],
                value: field.value,
                certainty: field.certainty,
                caveat: field.caveat,
                origin: field.origin,
                region: field.region,
                revisions: field.revisions,
              },
            ];
          }),
        ),
      })),
    })),
  };
  return `${JSON.stringify(payload, null, 2)}\n`;
}

export function citeField(doc: Doc, line: Line, field: Field, label: string, folio: Folio): string {
  const reading = field.value || "∅";
  const origin =
    field.origin === "suggestion" ? " Adopted from a suggestion; not yet marked as her judgement." : "";
  return `${folio.church}, ${folio.parish}, ${folio.kind} ${String(folio.year)}, ${folio.volume} folio ${folio.folio} line ${String(line.n)}, ${label.toLowerCase()}: ${reading} [${field.certainty}].${field.caveat ? ` ${field.caveat}` : ""} Region ${region(field)}. ${doc.scholar}, ${doc.sitting}.${origin}`;
}

export function filenameStem(doc: Doc): string {
  const folio = doc.folios[0];
  return `${folio.parish.toLowerCase()}-${folio.kind}-${doc.sitting.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
}

export function downloadText(filename: string, text: string, mime: string) {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

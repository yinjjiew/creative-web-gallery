import { cellRect } from "./plate";
import {
  FIELD_IDS,
  type Certainty,
  type Doc,
  type Field,
  type FieldId,
  type Folio,
  type Line,
  type Origin,
  type Revision,
} from "./state";

export const FIRST_SITTING = "12 January 2026";
export const THIS_SITTING = "14 January 2026";
export const SCHOLAR = "Helen Marr";

export const PROVENANCE = [
  "The facsimile is synthesized. Column layout follows the printed baptism register introduced by Rose’s Act 1812 (52 Geo. III c. 146). It is not a photograph of a named archive.",
  "Parish, church, hamlets and surnames are real to Wensleydale. The eight entries, the stain, the later hand and the impossible date are modelled on typical problems in North Riding registers 1813–1871. They are a written case, not a measurement.",
  "Certainty is about the ink, not the world. A date can be certainly read and still be a day that did not exist.",
  "Suggestions come from a glossary of period abbreviations, from other readings already in this sitting, or from the Gregorian calendar. They are never written as her judgement.",
];

let seq = 1;

function rev(
  sitting: string,
  value: string,
  certainty: Certainty,
  caveat: string,
  origin: Origin,
  reason: string,
): Revision {
  const out: Revision = { seq, sitting, value, certainty, caveat, origin, reason };
  seq += 1;
  return out;
}

function field(
  lineIndex: number,
  fieldId: FieldId,
  value: string,
  certainty: Certainty,
  caveat = "",
  origin: Origin = "judgement",
  history?: Revision[],
): Field {
  const region = cellRect(lineIndex, fieldId);
  const first =
    history ??
    [rev(FIRST_SITTING, value, certainty, caveat, origin, "first reading")];
  const last = first[first.length - 1];
  return {
    value: last.value,
    certainty: last.certainty,
    caveat: last.caveat,
    origin: last.origin,
    region,
    revisions: first,
  };
}

type CellSpec = {
  value: string;
  certainty: Certainty;
  caveat?: string;
  origin?: Origin;
  history?: Revision[];
};

function line(
  id: string,
  n: number,
  lineIndex: number,
  cells: Record<FieldId, CellSpec>,
  laterHand = false,
): Line {
  const fields = {} as Line["fields"];
  for (const fieldId of FIELD_IDS) {
    const spec = cells[fieldId];
    fields[fieldId] = field(
      lineIndex,
      fieldId,
      spec.value,
      spec.certainty,
      spec.caveat ?? "",
      spec.origin ?? "judgement",
      spec.history,
    );
  }
  return { id, n, laterHand, fields };
}

function easy(
  value: string,
  certainty: Certainty = "certain",
  caveat = "",
): { value: string; certainty: Certainty; caveat?: string } {
  return { value, certainty, caveat };
}

function folio47(): Folio {
  return {
    id: "f47",
    parish: "Askrigg",
    church: "St Oswald",
    county: "York, North Riding",
    kind: "baptisms",
    year: 1838,
    folio: "47",
    volume: "PR/ASK 1/6",
    photographed: "modelled as a north-light plate; no archive negative",
    damage: [
      "Water stain across column 4, lines 3–4, with iron-gall bloom",
      "Lower-left corner lost, not affecting the entries",
      "Line 5 surname overwritten in a later hand",
    ],
    lines: [
      line("f47-l1", 1, 0, {
        when: easy("3 January"),
        child: easy("Mary"),
        parents: easy("John & Ann"),
        surname: easy("Metcalfe"),
        abode: easy("Askrigg"),
        trade: easy("labourer"),
        minister: easy("J. Wharton"),
      }),
      line("f47-l2", 2, 1, {
        when: easy("14 January"),
        child: easy("Thomas"),
        parents: easy("James & Sarah"),
        surname: easy("Alderson"),
        abode: easy("Woodhall"),
        trade: easy("yeo.", "certain", "written yeo."),
        minister: easy("J. Wharton"),
      }),
      line("f47-l3", 3, 2, {
        when: easy("21 January"),
        child: easy("Elizabeth"),
        parents: easy("William & Mary"),
        surname: {
          value: "Whitaker",
          certainty: "probable",
          caveat:
            "graphs after Whit under a water stain; -aker from the k-descender and a terminal r. Whitacre remains possible.",
          history: [
            rev(
              FIRST_SITTING,
              "",
              "illegible",
              "surname under stain; left unread rather than guessed",
              "judgement",
              "first reading",
            ),
            rev(
              THIS_SITTING,
              "Whitaker",
              "probable",
              "graphs after Whit under a water stain; -aker from the k-descender and a terminal r. Whitacre remains possible.",
              "judgement",
              "reread under raking light",
            ),
          ],
        },
        abode: easy("Askrigg"),
        trade: easy("lab.", "certain", "written lab."),
        minister: easy("J. Wharton"),
      }),
      line("f47-l4", 4, 3, {
        when: easy("4 February"),
        child: easy("John"),
        parents: easy("Thomas & Jane"),
        surname: easy("Sayer"),
        abode: easy("Nappa"),
        trade: easy("blacksmith"),
        minister: easy("J. Wharton"),
      }),
      line(
        "f47-l5",
        5,
        4,
        {
          when: easy("18 February"),
          child: easy("Margaret"),
          parents: easy("Robert & Ellen"),
          surname: {
            value: "Whitacre",
            certainty: "probable",
            caveat:
              "Later hand in a colder ink writes Whitacre over Whittaker. The first writing is still visible underneath.",
            history: [
              rev(
                FIRST_SITTING,
                "Whittaker",
                "certain",
                "as first written",
                "judgement",
                "first reading",
              ),
              rev(
                THIS_SITTING,
                "Whitacre",
                "probable",
                "Later hand in a colder ink writes Whitacre over Whittaker. The first writing is still visible underneath.",
                "judgement",
                "noticed the overwriting",
              ),
            ],
          },
          abode: easy("Askrigg"),
          trade: easy("weaver"),
          minister: easy("J. Wharton"),
        },
        true,
      ),
      line("f47-l6", 6, 5, {
        when: {
          value: "31 February 1838",
          certainty: "certain",
          caveat: "No such day. The figures are 31 February, written as such.",
        },
        child: easy("James"),
        parents: easy("George & Hannah"),
        surname: easy("Horner"),
        abode: easy("Bainbridge"),
        trade: easy("farmer"),
        minister: easy("J. Wharton"),
      }),
      line("f47-l7", 7, 6, {
        when: easy("11 March"),
        child: easy("Ann"),
        parents: {
          value: "Joseph & [blank]",
          certainty: "certain",
          caveat: "Mother’s Christian name was never entered. The ampersand is there; the name is not.",
        },
        surname: easy("Fawcett"),
        abode: easy("Askrigg"),
        trade: easy("weaver"),
        minister: easy("J. Wharton"),
      }),
      line("f47-l8", 8, 7, {
        when: easy("25 March"),
        child: easy("William"),
        parents: easy("John & Elizabeth"),
        surname: easy("Whitacre"),
        abode: easy("Newbiggin"),
        trade: easy("ag lab", "certain", "written ag lab"),
        minister: easy("J. Wharton"),
      }),
    ],
  };
}

function folio61(): Folio {
  return {
    id: "f61",
    parish: "Askrigg",
    church: "St Oswald",
    county: "York, North Riding",
    kind: "baptisms",
    year: 1841,
    folio: "61",
    volume: "PR/ASK 1/6",
    photographed: "modelled as a north-light plate; no archive negative",
    damage: ["Light foxing only. A different incumbent’s hand — smaller, more upright."],
    lines: [
      line("f61-l1", 1, 0, {
        when: easy("7 June"),
        child: easy("Hannah"),
        parents: easy("William & Mary"),
        surname: easy("Whitaker", "probable", "same couple as folio 47 line 3, if that surname holds"),
        abode: easy("Askrigg"),
        trade: easy("labourer"),
        minister: easy("T. Lodder"),
      }),
      line("f61-l2", 2, 1, {
        when: easy("19 June"),
        child: easy("Alice"),
        parents: easy("Robert & Ellen"),
        surname: easy("Whittaker", "certain", "double t clear; compare folio 47 line 5 original"),
        abode: easy("Askrigg"),
        trade: easy("weaver"),
        minister: easy("T. Lodder"),
      }),
      line("f61-l3", 3, 2, {
        when: easy("3 July"),
        child: easy("James"),
        parents: easy("John & Elizabeth"),
        surname: easy("Whitacre"),
        abode: easy("Newbiggin"),
        trade: easy("ag. lab.", "certain", "written ag. lab."),
        minister: easy("T. Lodder"),
      }),
      line("f61-l4", 4, 3, {
        when: easy("18 July"),
        child: easy("Isabella"),
        parents: {
          value: "—",
          certainty: "guess",
          caveat: "Parents’ column smudged; not yet read. Dash is a placeholder, not a reading of the ink.",
        },
        surname: {
          value: "",
          certainty: "illegible",
          caveat: "Left empty on purpose. A blank cell here is a claim: unread, not absent.",
        },
        abode: easy("Hardraw", "probable", "the last three letters are the clearest"),
        trade: easy("lead miner", "guess", "only ‘lead’ is secure; the rest is inferred from the parish"),
        minister: easy("T. Lodder"),
      }),
    ],
  };
}

export function buildDoc(): Doc {
  seq = 1;
  const folios = [folio47(), folio61()];
  return {
    scholar: SCHOLAR,
    sitting: THIS_SITTING,
    nextSeq: seq,
    activeFolioId: "f47",
    folios,
  };
}

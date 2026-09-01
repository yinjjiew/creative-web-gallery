import { EPOCH, type DateStr } from "./dates";
import type { Animal, Sitting, Step, Volunteer } from "./types";

/**
 * Ten cats, one Tuesday morning. The animals, names and notes are modelled
 * for this sitting — they are not a live rescue. The medical intervals they
 * sit on are not: those come from published schedules, cited on the board.
 */
export const VOLUNTEERS: Volunteer[] = [
  { id: "priya", name: "Priya", staff: true, present: true },
  { id: "sam", name: "Sam", staff: false, present: true },
  { id: "ellis", name: "Ellis", staff: false, present: true },
  { id: "june", name: "June", staff: false, present: false },
  { id: "rowan", name: "Rowan", staff: false, present: false },
  /** Used when someone takes a card before putting a name on the phone. */
  { id: "phone", name: "This phone", staff: false, present: true },
];

export const ON_SHIFT = VOLUNTEERS.filter((v) => v.present && v.id !== "phone");
export const AWAY = VOLUNTEERS.filter((v) => !v.present);

export const ANIMALS: Animal[] = [
  {
    id: "pepper",
    name: "Pepper",
    sex: "F",
    age: "about 5 months",
    ageWeeks: 22,
    where: "Isolation 4",
    meds: null,
    note: "First FVRCP 8 August. June said she would do the second and then went on holiday.",
  },
  {
    id: "pip",
    name: "Pip",
    sex: "M",
    age: "adult, unknown",
    ageWeeks: 80,
    where: "Isolation 1",
    meds: null,
    note: "Vet cleared him on 19 August. Quarantine minimum ended 28 August. He is still in isolation.",
  },
  {
    id: "moss",
    name: "Moss",
    sex: "F",
    age: "2 years",
    ageWeeks: 104,
    where: "Foster — Rowan",
    meds: "Prednisolone 5 mg, morning and night",
    note: "Flare started 29 August. Rowan has the cat. Nobody has told her about the tablets.",
  },
  {
    id: "bramble",
    name: "Bramble",
    sex: "M",
    age: "1 year",
    ageWeeks: 52,
    where: "Pen 2",
    meds: null,
    note: "Ellis did the Chen home check on 10 August. The result was never written down. The adoption has sat still for three weeks.",
  },
  {
    id: "juniper",
    name: "Juniper",
    sex: "F",
    age: "4 months",
    ageWeeks: 17,
    where: "Pen 3",
    meds: null,
    note: "First FVRCP 15 August. Second dose is locked until 5 September.",
  },
  {
    id: "soot",
    name: "Soot",
    sex: "M",
    age: "8 months",
    ageWeeks: 34,
    where: "Pen 1",
    meds: "Meloxicam as written on the kennel card",
    note: "Neutered 26 August. Listing stays locked until the post-op hold ends.",
  },
  {
    id: "nettle",
    name: "Nettle",
    sex: "F",
    age: "about 8 weeks",
    ageWeeks: 8,
    where: "Isolation 2",
    meds: null,
    note: "Arrived yesterday evening. No vet has seen her yet.",
  },
  {
    id: "mallow",
    name: "Mallow",
    sex: "F",
    age: "3 years",
    ageWeeks: 156,
    where: "Adopted — Chen waitlist no; gone home 20 August",
    meds: null,
    note: "Went home 20 August. The two-week call is due 3 September.",
  },
  {
    id: "cinder",
    name: "Cinder",
    sex: "M",
    age: "6 months",
    ageWeeks: 26,
    where: "Isolation 3",
    meds: null,
    note: "Ten days in. Eyes clear this morning. Someone has to end quarantine or he sits another night for no reason.",
  },
  {
    id: "hodge",
    name: "Hodge",
    sex: "M",
    age: "2 years",
    ageWeeks: 104,
    where: "Pen 2",
    meds: null,
    note: "Cleared and waiting for a foster. June put her name on it and left.",
  },
];

/**
 * Published and policy intervals used as hard locks.
 *
 * FVRCP spacing and minimum age: AAFP / AAHA Feline Vaccination Guidelines
 * (2020). Revaccinate every 3–4 weeks; this board treats 21 days as the floor.
 * First dose not before 6 weeks of age.
 *
 * Paediatric neuter from 8 weeks / 1 kg is common rescue practice (ICAM /
 * many UK clinic protocols), not a statute.
 *
 * Ten-day arrival isolation is this rescue's URI watch, modelled on common
 * shelter practice — not a legal minimum.
 *
 * Ten-day post-neuter hold before a public listing is this rescue's surgical
 * recovery rule.
 *
 * Fourteen-day post-adoption call is this rescue's follow-up rule.
 */
export const INTERVALS = {
  fvrpDays: 21,
  fvrpMinAgeWeeks: 6,
  neuterMinAgeWeeks: 8,
  afterVaccineToNeuterDays: 7,
  quarantineDays: 10,
  postNeuterListDays: 10,
  followUpDays: 14,
} as const;

function step(
  id: string,
  animalId: string,
  kind: Step["kind"],
  dueOn: DateStr,
  brief: string,
  context: string,
  extra: Partial<Step> = {},
): Step {
  return {
    id,
    animalId,
    kind,
    dueOn,
    lockedUntil: null,
    lockSource: null,
    ownerId: null,
    doneOn: null,
    brief,
    context,
    ...extra,
  };
}

export function seedSteps(): Step[] {
  return [
    step(
      "pepper-vax2",
      "pepper",
      "vaccine-2",
      "2026-08-29",
      "Give the second FVRCP.",
      "First dose 8 August. Twenty-one days have passed — the AAFP floor is met. Isolation 4. Draw from the fridge marked FVRCP.",
      { ownerId: "june" },
    ),
    step(
      "pip-q",
      "pip",
      "quarantine",
      "2026-08-28",
      "Move Pip out of isolation.",
      "Vet cleared him 19 August. The ten-day watch ended 28 August. He has been sitting four extra days because the clearance had no owner.",
    ),
    step(
      "moss-meds",
      "moss",
      "meds-brief",
      "2026-08-29",
      "Tell Rowan: prednisolone 5 mg, morning and night.",
      "Moss is already in the house. The tablets are in the foster bag by the kettle. If Rowan does not hear this today, tonight's dose is the one that gets dropped.",
    ),
    step(
      "bramble-home",
      "bramble",
      "home-check",
      "2026-08-10",
      "Write down the Chen home check.",
      "Ellis went on 10 August and said it was fine. Nothing was recorded, so the adoption cannot move. The Chens have been waiting three weeks.",
    ),
    step(
      "juniper-vax2",
      "juniper",
      "vaccine-2",
      "2026-09-05",
      "Give the second FVRCP.",
      "First dose 15 August. The 21-day AAFP floor lands on 5 September. Giving it earlier is refused — the interval is a lock, not a reminder.",
      {
        ownerId: "sam",
        lockedUntil: "2026-09-05",
        lockSource: "AAFP 2020: 21 days after first FVRCP",
      },
    ),
    step(
      "soot-list",
      "soot",
      "listing",
      "2026-09-05",
      "Write Soot's adoption listing.",
      "Neutered 26 August. This rescue will not list until ten days after surgery. The hold lifts 5 September.",
      {
        ownerId: "priya",
        lockedUntil: "2026-09-05",
        lockSource: "Rescue post-op hold: 10 days after neuter",
      },
    ),
    step(
      "nettle-vet",
      "nettle",
      "vet",
      EPOCH,
      "Get Nettle seen.",
      "Arrived last night. About eight weeks. Isolation 2. No one has a stethoscope on her yet — that is this morning's first job if you take it.",
    ),
    step(
      "mallow-follow",
      "mallow",
      "follow-up",
      "2026-09-03",
      "Call the new home. Two weeks today, on Thursday.",
      "Adopted 20 August. The fourteen-day call is this rescue's rule. It is not due yet. When Thursday comes and nobody holds it, it will sit in the well.",
    ),
    step(
      "cinder-q",
      "cinder",
      "quarantine",
      EPOCH,
      "End Cinder's quarantine, or say why not.",
      "Day ten. Eyes clear. If nobody looks, he spends a night in isolation he does not need.",
    ),
    step(
      "hodge-foster",
      "hodge",
      "foster",
      "2026-08-30",
      "Find Hodge a foster, or take the card off June.",
      "Cleared. June wrote her name on the card and went on holiday. A present person has to take it or he waits for a memory.",
      { ownerId: "june" },
    ),
  ];
}

export function emptySitting(): Sitting {
  return {
    today: EPOCH,
    youId: null,
    steps: seedSteps(),
  };
}

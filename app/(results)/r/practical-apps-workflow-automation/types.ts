import type { DateStr } from "./dates";

export type StepKind =
  | "intake"
  | "vet"
  | "quarantine"
  | "vaccine-1"
  | "vaccine-2"
  | "neuter"
  | "foster"
  | "meds-brief"
  | "listing"
  | "home-check"
  | "adoption"
  | "follow-up";

export type Volunteer = {
  id: string;
  name: string;
  /** Two part-time staff; everyone else is a volunteer. */
  staff: boolean;
  /** On the premises for this sitting. Holiday and foster-at-home are not. */
  present: boolean;
};

export type Animal = {
  id: string;
  name: string;
  sex: "F" | "M";
  /** Plain-language age as of the sitting's epoch. */
  age: string;
  /** Age in weeks at epoch — used for hard paediatric locks. */
  ageWeeks: number;
  where: string;
  meds: string | null;
  note: string;
};

export type Step = {
  id: string;
  animalId: string;
  kind: StepKind;
  dueOn: DateStr;
  /** Medical or policy lock. Completing before this date is refused. */
  lockedUntil: DateStr | null;
  lockSource: string | null;
  ownerId: string | null;
  doneOn: DateStr | null;
  /** The one sentence a volunteer acts on. */
  brief: string;
  context: string;
};

export type Sitting = {
  today: DateStr;
  youId: string | null;
  steps: Step[];
};

export const STEP_LABEL: Record<StepKind, string> = {
  intake: "Intake",
  vet: "Vet assessment",
  quarantine: "Quarantine end",
  "vaccine-1": "First FVRCP",
  "vaccine-2": "Second FVRCP",
  neuter: "Neuter",
  foster: "Foster placement",
  "meds-brief": "Tell the foster",
  listing: "Adoption listing",
  "home-check": "Record home check",
  adoption: "Adoption",
  "follow-up": "Follow-up call",
};

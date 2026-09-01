import { addDays, daysBetween, type DateStr } from "./dates";
import { ANIMALS, INTERVALS, VOLUNTEERS } from "./seed";
import { type Sitting, type Step, type StepKind, type Volunteer } from "./types";

export type Band = "orphan" | "yours" | "held" | "waiting";

export type Card = {
  step: Step;
  animal: (typeof ANIMALS)[number];
  owner: Volunteer | null;
  band: Band;
  daysOverdue: number;
  daysUntilDue: number;
  daysLocked: number;
  canClaim: boolean;
  canComplete: boolean;
  canRelease: boolean;
  lockReason: string | null;
};

export function volunteer(id: string | null): Volunteer | null {
  if (!id) return null;
  return VOLUNTEERS.find((v) => v.id === id) ?? null;
}

export function isPresent(id: string | null, youId: string | null): boolean {
  if (!id) return false;
  if (id === youId) return true;
  return volunteer(id)?.present === true;
}

export function isDue(step: Step, today: DateStr): boolean {
  return !step.doneOn && daysBetween(step.dueOn, today) >= 0;
}

export function isLocked(step: Step, today: DateStr): boolean {
  return !!step.lockedUntil && daysBetween(today, step.lockedUntil) > 0;
}

/**
 * The failure mode: the step is due, unfinished, and the person on the card
 * is not in the building. No owner and an owner on holiday are the same hole.
 */
export function isOrphan(step: Step, today: DateStr, youId: string | null): boolean {
  if (step.doneOn || !isDue(step, today)) return false;
  return !isPresent(step.ownerId, youId);
}

export function derive(sitting: Sitting): Card[] {
  const { today, youId } = sitting;
  const cards: Card[] = [];

  for (const step of sitting.steps) {
    if (step.doneOn) continue;
    const animal = ANIMALS.find((a) => a.id === step.animalId);
    if (!animal) continue;
    const owner = volunteer(step.ownerId);
    const due = isDue(step, today);
    const locked = isLocked(step, today);
    const present = isPresent(step.ownerId, youId);
    const yours = !!youId && step.ownerId === youId;
    const orphan = due && !present;

    let band: Band;
    if (orphan) band = "orphan";
    else if (!due) band = "waiting";
    else if (yours) band = "yours";
    else band = "held";

    const daysOverdue = due ? daysBetween(step.dueOn, today) : 0;
    const daysUntilDue = due ? 0 : daysBetween(today, step.dueOn);
    const daysLocked = locked && step.lockedUntil ? daysBetween(today, step.lockedUntil) : 0;

    const lockReason =
      locked && step.lockedUntil
        ? `${step.lockSource ?? "Locked"} — opens ${step.lockedUntil}`
        : null;

    const canComplete = yours && due && !locked;
    const canRelease = yours;

    cards.push({
      step,
      animal,
      owner,
      band,
      daysOverdue,
      daysUntilDue,
      daysLocked,
      canClaim: orphan && !!youId,
      canComplete,
      canRelease,
      lockReason,
    });
  }

  const rank = (c: Card) => {
    if (c.band === "orphan") return 0 - c.daysOverdue;
    if (c.band === "yours") return 100 + (c.step.lockedUntil ? 1 : 0);
    if (c.band === "held") return 200;
    return 300 + c.daysUntilDue;
  };

  return cards.sort((a, b) => rank(a) - rank(b) || a.animal.name.localeCompare(b.animal.name));
}

export function claim(sitting: Sitting, stepId: string): Sitting {
  const youId = sitting.youId;
  if (!youId) return sitting;
  return {
    ...sitting,
    steps: sitting.steps.map((step) => {
      if (step.id !== stepId || step.doneOn) return step;
      if (!isDue(step, sitting.today)) return step;
      if (step.ownerId && isPresent(step.ownerId, youId) && step.ownerId !== youId) {
        return step;
      }
      return { ...step, ownerId: youId };
    }),
  };
}

export function release(sitting: Sitting, stepId: string): Sitting {
  const youId = sitting.youId;
  return {
    ...sitting,
    steps: sitting.steps.map((step) => {
      if (step.id !== stepId || step.doneOn) return step;
      if (step.ownerId !== youId) return step;
      return { ...step, ownerId: null };
    }),
  };
}

function nextAfter(step: Step, today: DateStr): Step | null {
  const animal = ANIMALS.find((a) => a.id === step.animalId);
  if (!animal) return null;

  const spawn = (
    kind: StepKind,
    dueOn: DateStr,
    brief: string,
    context: string,
    extra: Partial<Step> = {},
  ): Step => ({
    id: `${step.animalId}-${kind}-${today}`,
    animalId: step.animalId,
    kind,
    dueOn,
    lockedUntil: extra.lockedUntil ?? null,
    lockSource: extra.lockSource ?? null,
    ownerId: null,
    doneOn: null,
    brief,
    context,
  });

  switch (step.kind) {
    case "vet": {
      const due = addDays(today, INTERVALS.quarantineDays);
      return spawn(
        "quarantine",
        due,
        `End quarantine on day ${INTERVALS.quarantineDays}.`,
        `Watch started today. The ten-day URI hold is this rescue's rule. The card will rise on ${due}.`,
        {
          lockedUntil: due,
          lockSource: `Rescue URI watch: ${INTERVALS.quarantineDays} days`,
        },
      );
    }
    case "quarantine": {
      if (animal.ageWeeks < INTERVALS.fvrpMinAgeWeeks) {
        const weeks = INTERVALS.fvrpMinAgeWeeks - animal.ageWeeks;
        const due = addDays(today, weeks * 7);
        return spawn(
          "vaccine-1",
          due,
          "First FVRCP, once old enough.",
          `AAFP will not start core vaccine before 6 weeks. Locked until ${due}.`,
          { lockedUntil: due, lockSource: "AAFP 2020: not before 6 weeks of age" },
        );
      }
      return spawn(
        "vaccine-1",
        today,
        "Give the first FVRCP.",
        "Out of isolation. Age is past 6 weeks. The dose is due now and has no owner until someone takes it.",
      );
    }
    case "vaccine-1": {
      const due = addDays(today, INTERVALS.fvrpDays);
      return spawn(
        "vaccine-2",
        due,
        "Give the second FVRCP.",
        `Twenty-one days after today's dose (AAFP 2020). Locked until ${due}.`,
        { lockedUntil: due, lockSource: "AAFP 2020: 21 days after first FVRCP" },
      );
    }
    case "vaccine-2": {
      const due = addDays(today, INTERVALS.afterVaccineToNeuterDays);
      if (animal.ageWeeks < INTERVALS.neuterMinAgeWeeks) {
        return spawn(
          "foster",
          today,
          "Place in foster until old enough to neuter.",
          "Under 8 weeks. Surgery waits. A foster card with no owner is how this stalls.",
        );
      }
      return spawn(
        "neuter",
        due,
        "Book neuter.",
        `This rescue waits ${INTERVALS.afterVaccineToNeuterDays} days after a vaccine before anaesthesia. Locked until ${due}.`,
        {
          lockedUntil: due,
          lockSource: `Rescue rule: ${INTERVALS.afterVaccineToNeuterDays} days after vaccine before surgery`,
        },
      );
    }
    case "neuter": {
      const due = addDays(today, INTERVALS.postNeuterListDays);
      return spawn(
        "listing",
        due,
        "Write the adoption listing.",
        `Ten-day post-op hold. Locked until ${due}.`,
        { lockedUntil: due, lockSource: "Rescue post-op hold: 10 days after neuter" },
      );
    }
    case "foster":
      return spawn(
        "listing",
        today,
        "Write the adoption listing.",
        "Foster is in place. Listing is due and has no owner until someone takes it.",
      );
    case "listing":
      return spawn(
        "home-check",
        today,
        "Book or record the home check.",
        "Listing is up. A home check with no owner is how an adoption sits still.",
      );
    case "home-check":
      return spawn(
        "adoption",
        today,
        "Do the adoption paperwork.",
        "Home check is on the card. The animal can go when someone holds this step.",
      );
    case "adoption": {
      const due = addDays(today, INTERVALS.followUpDays);
      return spawn(
        "follow-up",
        due,
        "Call the new home.",
        `Fourteen-day follow-up. The card will rise on ${due}.`,
        { lockedUntil: due, lockSource: "Rescue follow-up: 14 days after adoption" },
      );
    }
    default:
      return null;
  }
}

export function complete(sitting: Sitting, stepId: string): Sitting {
  const youId = sitting.youId;
  if (!youId) return sitting;
  const current = sitting.steps.find((s) => s.id === stepId);
  if (!current || current.doneOn) return sitting;
  if (current.ownerId !== youId) return sitting;
  if (!isDue(current, sitting.today) || isLocked(current, sitting.today)) return sitting;

  const done: Step = { ...current, doneOn: sitting.today };
  const spawned = nextAfter(current, sitting.today);
  const already = spawned
    ? sitting.steps.some((s) => s.animalId === spawned.animalId && s.kind === spawned.kind && !s.doneOn)
    : false;

  return {
    ...sitting,
    steps: [...sitting.steps.map((s) => (s.id === stepId ? done : s)), ...(spawned && !already ? [spawned] : [])],
  };
}

export function wake(sitting: Sitting): Sitting {
  return { ...sitting, today: addDays(sitting.today, 1) };
}

export function setYou(sitting: Sitting, youId: string | null): Sitting {
  return { ...sitting, youId };
}


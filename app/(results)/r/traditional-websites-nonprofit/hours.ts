/** Opening hours for the modelled clinic, read in Europe/London. */

const ZONE = "Europe/London";

const WEEK: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

export type DropIn = { id: string; name: string; when: string };

export const ROOMS: DropIn[] = [
  { id: "lib", name: "Ormside Library, meeting room 2", when: "Tuesday 10:00–13:00" },
  { id: "luke", name: "St Luke’s Hall, side door", when: "Thursday 16:00–19:00" },
  { id: "canal", name: "Canal Street community rooms", when: "Saturday 10:00–12:30" },
];

export const PHONE_HOURS =
  "Monday to Friday 9:00–17:00, Wednesday until 19:00. England time.";

type Slice = { day: number; start: number; end: number; label: string };

const PHONE: Slice[] = [
  { day: 1, start: 9 * 60, end: 17 * 60, label: "Monday 9:00" },
  { day: 2, start: 9 * 60, end: 17 * 60, label: "Tuesday 9:00" },
  { day: 3, start: 9 * 60, end: 19 * 60, label: "Wednesday 9:00" },
  { day: 4, start: 9 * 60, end: 17 * 60, label: "Thursday 9:00" },
  { day: 5, start: 9 * 60, end: 17 * 60, label: "Friday 9:00" },
];

function parts(now: Date) {
  const bits = new Intl.DateTimeFormat("en-GB", {
    timeZone: ZONE,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const get = (type: string) => bits.find((b) => b.type === type)?.value ?? "";
  const weekday = get("weekday");
  return {
    weekday,
    day: WEEK[weekday] ?? 0,
    minutes: Number(get("hour")) * 60 + Number(get("minute")),
  };
}

function dropInAt(day: number, minutes: number): DropIn | null {
  if (day === 2 && minutes >= 10 * 60 && minutes < 13 * 60) return ROOMS[0];
  if (day === 4 && minutes >= 16 * 60 && minutes < 19 * 60) return ROOMS[1];
  if (day === 6 && minutes >= 10 * 60 && minutes < 12 * 60 + 30) return ROOMS[2];
  return null;
}

function nextPhone(day: number, minutes: number): string {
  for (let add = 0; add < 8; add++) {
    const d = (day + add) % 7;
    const slice = PHONE.find((p) => p.day === d);
    if (!slice) continue;
    if (add === 0 && minutes < slice.start) return `Phone opens today at 9:00.`;
    if (add === 0 && minutes >= slice.start && minutes < slice.end) {
      const endH = slice.end / 60;
      const end = endH === 19 ? "19:00" : "17:00";
      return `Phone is open until ${end} today.`;
    }
    if (add > 0) {
      if (add === 1) return `Phone opens tomorrow at 9:00.`;
      return `Phone opens ${slice.label}.`;
    }
  }
  return "Phone opens Monday at 9:00.";
}

export type DeskClock = {
  phoneOpen: boolean;
  dropIn: DropIn | null;
  line: string;
  next: string;
};

export function deskAt(now: Date): DeskClock {
  const { day, minutes } = parts(now);
  const slice = PHONE.find((p) => p.day === day);
  const phoneOpen = Boolean(slice && minutes >= slice.start && minutes < slice.end);
  const dropIn = dropInAt(day, minutes);
  const next = nextPhone(day, minutes);

  let line: string;
  if (phoneOpen && dropIn) {
    line = `Phone is open. A drop-in is on now at ${dropIn.name}.`;
  } else if (phoneOpen) {
    line = next;
  } else if (dropIn) {
    line = `Phone is closed. A drop-in is on now at ${dropIn.name}.`;
  } else {
    line = `We are closed. Leave a voicemail. ${next}`;
  }

  return { phoneOpen, dropIn, line, next };
}

/**
 * One Hour — copy and invented fixtures.
 *
 * Clinical statements are written modestly from typical whole-blood practice
 * at services such as NHS Blood and Transplant (England) and the American
 * Red Cross, 2024–2026. Rules differ by country and change. Nothing here is
 * personal medical advice. Invented fixtures are marked in the interface.
 */

export type Beat = {
  id: string;
  start: number;
  end: number;
  title: string;
  lead: string;
  body: string[];
};

export const BEATS: Beat[] = [
  {
    id: "arrive",
    start: 0,
    end: 8,
    title: "You walk in",
    lead: "A waiting room. Not a drama.",
    body: [
      "Bring photo identification. Wear something that lets them reach the inner elbow. You do not need a costume and you do not need to have rehearsed.",
      "You sit. If you brought someone they can sit with you until you are called through. The room looks like a clinic because it is one.",
    ],
  },
  {
    id: "form",
    start: 8,
    end: 20,
    title: "They ask you things",
    lead: "A questionnaire. Longer than you expect.",
    body: [
      "Travel, recent illness, tattoos, medication, whether you feel well today. The point is not to catch you out. Blood is given to people who cannot afford a surprise.",
      "Answer what is true. If you are not sure, say you are not sure. Guessing yes to get it over with is how people get deferred on the chair.",
    ],
  },
  {
    id: "finger",
    start: 20,
    end: 28,
    title: "A finger, not an arm",
    lead: "Iron, pulse, blood pressure.",
    body: [
      "They prick a finger and check that you have enough haemoglobin to give blood and still walk out. They take your pulse and blood pressure.",
      "This is the most common reason a first visit does not end in a donation: iron a bit low, or a pulse up because you ran from the bus. It is not a judgement. You go home, eat, come back another hour.",
    ],
  },
  {
    id: "needle",
    start: 28,
    end: 32,
    title: "The needle",
    lead: "The part the leaflets skip.",
    body: [
      "They tie a strap on your upper arm and ask you to make a fist. The needle is wide — typically about 16-gauge — because they are not taking a sample. They are taking a unit, around 470 millilitres, about a pint. That volume is typical for whole blood; local services set the exact amount.",
      "It goes into a vein in the inner elbow. A hard pinch, then a push, two or three seconds. After that it sits there. You can look. You do not have to. Some people feel a dull ache. Some people feel nothing after the first pinch.",
      "If you feel faint, you say so. They stop. You lie down. That is the whole emergency. Fainting is uncommon, usually brief, and they are used to it.",
    ],
  },
  {
    id: "sit",
    start: 32,
    end: 44,
    title: "You sit",
    lead: "Eight to twelve minutes. That is the donation.",
    body: [
      "The bag fills while you squeeze a ball every few seconds. You can use your phone with the other hand. Someone stays nearby. You are not dripping on the floor and you are not in a film.",
      "When the bag is full they take the needle out, press firmly, then tape. The plaster stays on for a few hours. Do not peel it in the bathroom to inspect the hole. There is not much to see.",
    ],
  },
  {
    id: "stay",
    start: 44,
    end: 55,
    title: "You stay sitting",
    lead: "Water. Something salty or sweet. Ten or fifteen minutes.",
    body: [
      "This is not politeness. Standing up too fast is how people faint in the car park. You leave when they say you can, not when you feel slightly bored.",
      "Drink more than usual for the rest of the day. Eat a proper meal. The hour is almost over.",
    ],
  },
  {
    id: "leave",
    start: 55,
    end: 60,
    title: "You leave",
    lead: "That was the hour.",
    body: [
      "You can go to a lecture, a shift, a sofa. You cannot go straight to a hard gym session. The plaster stays on. If the site weeps, press; if it will not stop, they told you who to call and the card is in your pocket.",
      "Most people who were going to feel lightheaded already felt it in the chair. If you feel odd later, sit down and drink. You are allowed to have an ordinary evening.",
    ],
  },
];

export type Centre = {
  id: string;
  name: string;
  where: string;
  note: string;
  hours: string;
};

/** Invented centres for the booking demonstration. */
export const CENTRES: Centre[] = [
  {
    id: "campus",
    name: "Campus Health",
    where: "Student Union, lower ground",
    note: "Booked only. Short walk from the buses.",
    hours: "Tue–Thu 12:00–19:00",
  },
  {
    id: "riverside",
    name: "Riverside Hall",
    where: "14 Dock Lane",
    note: "The largest room. Saturday mornings fill first.",
    hours: "Tue–Sat 09:00–16:30",
  },
  {
    id: "market",
    name: "North Market",
    where: "Above the library",
    note: "Evenings. Good if you work days.",
    hours: "Wed–Fri 15:00–19:30",
  },
  {
    id: "station",
    name: "Station Approach",
    where: "Next to the bus interchange",
    note: "One hour either side of a train is enough.",
    hours: "Thu–Sat 10:00–17:00",
  },
];

export const SLOT_HOURS = [
  "09:30",
  "11:00",
  "12:30",
  "14:00",
  "15:30",
  "17:00",
  "18:30",
] as const;

export type Voice = {
  name: string;
  age: number;
  line: string;
};

/** Composite first-timers — not real named donors. */
export const VOICES: Voice[] = [
  {
    name: "Mira",
    age: 21,
    line: "I went between a seminar and a shift. The needle was worse in my head than in my arm.",
  },
  {
    name: "Ben",
    age: 19,
    line: "I thought the tattoo from last summer was a no. It was a question, not a no.",
  },
  {
    name: "Asha",
    age: 23,
    line: "I brought my flatmate because I did not want to sit there alone. She donated. I had a cold. They said come back in six weeks.",
  },
];

export function beatAt(minute: number): Beat {
  const clamped = Math.max(0, Math.min(59, minute));
  return (
    BEATS.find((beat) => clamped >= beat.start && clamped < beat.end) ??
    BEATS[BEATS.length - 1]
  );
}

export function formatDay(iso: string): string {
  const date = new Date(`${iso}T12:00:00`);
  return date.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

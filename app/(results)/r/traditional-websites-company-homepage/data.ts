export const BASE = "/r/traditional-websites-company-homepage";

export const FIRM = {
  name: "Leckie",
  legal: "Leckie Limited",
  founded: 1964,
  people: 90,
  slots: 3,
  place: "Cardington, Bedfordshire",
  address: [
    "Building 17",
    "Shortstown Road",
    "Cardington",
    "Bedfordshire MK42 0AJ",
  ],
  phone: "01234 640 190",
  mail: "works@leckie.bedford",
};

export type JobStatus = "floor" | "handed";
export type JobClass = "aeroacoustic" | "transonic" | "research" | "sport";

export type Spec = { label: string; value: string; note?: string };

export type Job = {
  slug: string;
  code: string;
  title: string;
  klass: JobClass;
  klassLabel: string;
  status: JobStatus;
  years: string;
  client: string;
  value: string;
  size: string;
  standfirst: string;
  paragraphs: string[];
  specs: Spec[];
  schedule?: { when: string; what: string }[];
  after?: string;
};

export const CLASS_LABEL: Record<JobClass, string> = {
  aeroacoustic: "Aeroacoustic",
  transonic: "Transonic",
  research: "Research",
  sport: "Performance",
};

export const JOBS: Job[] = [
  {
    slug: "l-147",
    code: "L-147",
    title: "¾-open-jet aeroacoustic",
    klass: "aeroacoustic",
    klassLabel: "Aeroacoustic",
    status: "floor",
    years: "2024–27",
    client: "A European car manufacturer",
    value: "£31 million",
    size: "22 m² nozzle",
    standfirst:
      "A full-scale aeroacoustic tunnel for a European car manufacturer. First air is booked for March 2027. The same eight people who signed the specification in 2024 will stand in the plenum when the fan starts.",
    paragraphs: [
      "The job is a ¾-open-jet tunnel with a 22 square-metre nozzle, a collector sized for a production car and a short van, and an anechoic plenum treated to give an out-of-flow noise floor of 58 dB(A) at 140 km/h. Maximum empty-section speed is 250 km/h. The building around it is the client’s; we design and build the circuit, the treatment, the balance, and the first-run instrumentation.",
      "A procurement director asking whether a ninety-person firm can deliver a thirty-one-million-pound facility on a thirty-six-month clock is asking the right question. The answer is the slot. This job occupies one of three. Nothing else has been taken against the same people, and the programme below is the programme we are on, not a proposal. Slip on our side has one cause: a late decision from the client on the building that wraps the circuit. We do not start manufacture of the contraction until the building grid is frozen.",
      "What we hold, and what we will demonstrate on the first-run sheet, is empty-test-section turbulence intensity at or below 0.12 percent at 50 m/s, spatial uniformity of mean speed within ±0.4 percent over the model volume, and the noise floor above. Those three figures are the ones the aero department will use. The rest of the specification — collector geometry, turning-vane set, fan and motor, balance capacity — is in the job book, which we will send to a named engineer on request.",
    ],
    specs: [
      { label: "Circuit", value: "¾-open jet, closed return" },
      { label: "Nozzle", value: "22 m²", note: "5.5 × 4.0 m" },
      { label: "Empty-section speed", value: "40–250 km/h" },
      { label: "Turbulence intensity", value: "≤ 0.12 %", note: "at 50 m/s, empty" },
      { label: "Speed uniformity", value: "±0.4 %", note: "model volume" },
      { label: "Out-of-flow noise", value: "58 dB(A)", note: "at 140 km/h" },
      { label: "Balance", value: "6-component, 12 kN" },
      { label: "First air", value: "March 2027" },
      { label: "Contract value", value: "£31 million" },
    ],
    schedule: [
      { when: "Apr 2024", what: "Specification signed. Slot taken." },
      { when: "Nov 2024", what: "Circuit locked. Building grid issued to the client." },
      { when: "Jun 2025", what: "Contraction and collector in manufacture at Cardington." },
      { when: "Jan 2026", what: "Fan and motor on the stand. Treatment panels begun." },
      { when: "Sep 2026", what: "Site installation starts, building weathertight." },
      { when: "Mar 2027", what: "First air. Empty-section survey. Handover sheet." },
    ],
    after:
      "Figures on this page are the contracted performance for L-147. Leckie is a modelled firm; the numbers are typical of a full-scale automotive aeroacoustic tunnel of this class, not measurements from a real facility.",
  },
  {
    slug: "l-148",
    code: "L-148",
    title: "Slotted transonic, 1.2 m",
    klass: "transonic",
    klassLabel: "Transonic",
    status: "floor",
    years: "2023–26",
    client: "A national aerospace programme",
    value: "Not published",
    size: "1.2 × 1.2 m",
    standfirst:
      "A slotted-wall transonic tunnel for a national aerospace programme. We can say the size, the Mach range, and that the job is on the floor. We cannot say the client, the model, or the value.",
    paragraphs: [
      "The circuit is a 1.2 by 1.2 metre slotted test section, Mach 0.3 to 1.3, Reynolds number 12 × 10⁶ per metre. The slots are the work: open-area ratio, plenum suction, and the interference correction that has to be good enough at Mach 0.95 that a national programme will stake a configuration on it. That is the interesting problem, and it is the one we can describe.",
      "Classified work is taken under the same three-slot rule as everything else. The difference is the drawing office. L-148 has its own room, its own store, and a data path that does not share a switch with L-147 or L-149. People on this job hold Security Check as a minimum; the lead and two aerodynamicists hold Developed Vetting. We have held List X on this site since 1987. Visitors from the programme come in through a separate door off the north yard and do not walk the rest of the works.",
      "A contracting officer asking whether a civilian firm of ninety can hold a programme of this kind is asking about the room and the people, not about a certificate on a wall. The room has been used for this class of work for thirty-nine years. The people are named on a list we will send through the usual channel. The tunnel itself will be described, to the people who need it, in the classified specification. This page is the unclassified remainder.",
    ],
    specs: [
      { label: "Circuit", value: "Closed, slotted-wall test section" },
      { label: "Section", value: "1.2 × 1.2 m" },
      { label: "Mach", value: "0.3–1.3" },
      { label: "Reynolds number", value: "12 × 10⁶ / m" },
      { label: "Stagnation", value: "up to 300 kPa" },
      { label: "Walls", value: "Longitudinal slots, suction plenum" },
      { label: "Clearance", value: "List X site; SC / DV as required" },
      { label: "First air", value: "November 2026" },
      { label: "Contract value", value: "Not published" },
    ],
    schedule: [
      { when: "Sep 2023", what: "Slot taken. Compartmented office opened." },
      { when: "May 2024", what: "Unclassified circuit frozen." },
      { when: "Feb 2025", what: "Pressure shell in manufacture." },
      { when: "Nov 2026", what: "First air, closed survey." },
    ],
    after:
      "Unclassified figures only. They are typical of a 1.2 m transonic tunnel of this class. Leckie is a modelled firm; the programme named here is not a real contract.",
  },
  {
    slug: "l-149",
    code: "L-149",
    title: "Closed research, 0.6 m",
    klass: "research",
    klassLabel: "Research",
    status: "floor",
    years: "2025–27",
    client: "A Midlands university",
    value: "£480,000",
    size: "0.6 × 0.6 m",
    standfirst:
      "A 0.6 metre closed-circuit tunnel for a Midlands university, paid from a single responsive-mode grant. It occupies a slot. It is not a favour, and it is not done in the gaps between the other two jobs.",
    paragraphs: [
      "The professor wrote in January 2025 with four hundred and eighty thousand pounds, a laboratory that will take a circuit six metres by two, and a need for empty-section turbulence at or below 0.08 percent. That is a real job. We have built this class of tunnel since 1964 — the first Leckie circuit was a teaching tunnel for a redbrick university — and we still take two or three of them a decade. They keep the shop able to hold a contraction to a tenth of a millimetre, which is the same skill L-147 uses at twenty-two square metres.",
      "What you get for £480,000 is the circuit, the fan and inverter, a three-component balance, the empty-section survey, and two weeks of commissioning with the people who designed it. What you do not get is a building, a traversing gear beyond a simple centreline rake, or a promise that we will still be on site in four years to supervise a student. We will leave a book: the as-built drawings, the survey, and the settings that produced the 0.08 percent. After that the tunnel is yours.",
      "The grant is small by the standard of the other two jobs on the floor. The slot is not. If we cannot staff a research tunnel through first air with the same aerodynamicist who wrote the specification, we will not take it. That has meant saying no, twice in the last ten years, to departments who wanted a tunnel in fourteen months. Two years is the floor. L-149 was taken because the laboratory was already empty and the grant already awarded; we will not hold a slot against a bid.",
    ],
    specs: [
      { label: "Circuit", value: "Closed, octagonal section" },
      { label: "Section", value: "0.6 × 0.6 m" },
      { label: "Empty-section speed", value: "5–55 m/s" },
      { label: "Turbulence intensity", value: "≤ 0.08 %", note: "at 30 m/s, empty" },
      { label: "Contraction ratio", value: "9 : 1" },
      { label: "Balance", value: "3-component, 200 N" },
      { label: "First air", value: "August 2027" },
      { label: "Contract value", value: "£480,000" },
    ],
    schedule: [
      { when: "Mar 2025", what: "Specification signed. Slot taken." },
      { when: "Dec 2025", what: "Circuit in manufacture." },
      { when: "Apr 2027", what: "Installation in the laboratory." },
      { when: "Aug 2027", what: "Empty-section survey. Book left. We leave." },
    ],
    after:
      "Figures are the contracted performance for L-149. Leckie is a modelled firm; the university and the grant are invented. The prices are in the range of a 0.6 m research tunnel built in Britain.",
  },
  {
    slug: "l-141",
    code: "L-141",
    title: "Open-jet, rider in the flow",
    klass: "sport",
    klassLabel: "Performance",
    status: "handed",
    years: "2019–22",
    client: "A British endurance team",
    value: "£2.1 million",
    size: "4.2 m² nozzle",
    standfirst:
      "A tunnel built for a cycling team. You put a rider in the jet. You change a position, a suit, a helmet. You leave with a number for each one that you can take to the track.",
    paragraphs: [
      "The team did not come with a Reynolds number. They came with a question: when we move a hand, or change a skin-suit, does it matter, and by how much. The tunnel answers that. It does not tell you how to ride. It tells you what the air did, on that rider, in that position, at that speed, on that day.",
      "What we built is a ¾-open jet large enough for a rider on a bike, on a rig that holds the bike still and lets the rider pedal. The air is even across the rider — if it is not, you are measuring the tunnel, not the position. Speeds cover what a road rider and a pursuiter actually do, not what a car does. A week in the tunnel is five or six days of riding and a book of numbers: each position, each suit, each helmet, the drag in newtons, and the difference from the last run. The difference is the thing you came for.",
      "We do not run a service bureau. L-141 was a tunnel we designed and left with the team. They own it. We spent three years on the circuit and the rig, and two weeks teaching the two people who would run it. If you want a week of hire in someone else’s tunnel, that is a different firm. If you want a tunnel of your own, and you can wait two to four years, write. The smallest job we take is four hundred thousand pounds; a rider-scale open jet is usually more than that and less than a car tunnel.",
    ],
    specs: [
      { label: "Circuit", value: "¾-open jet" },
      { label: "Nozzle", value: "4.2 m²", note: "rider and bike in the core" },
      { label: "Speed", value: "25–80 km/h" },
      { label: "What you leave with", value: "Drag in newtons, per run" },
      { label: "A week of running", value: "5–6 days, 40–70 runs" },
      { label: "Handed", value: "April 2022" },
      { label: "Contract value", value: "£2.1 million" },
    ],
    after:
      "L-141 is a modelled job. The speeds and the size are typical of a rider-scale open-jet tunnel. The team is not named because the firm is invented.",
  },
  {
    slug: "l-136",
    code: "L-136",
    title: "Open-jet, skier on a plate",
    klass: "sport",
    klassLabel: "Performance",
    status: "handed",
    years: "2020–23",
    client: "A national ski federation",
    value: "£1.6 million",
    size: "6.0 m² nozzle",
    standfirst:
      "A tunnel for a ski federation. A skier stands on a plate in the jet, in the tuck they will use on the hill. You change a suit, a helmet, the angle of an arm. You get a number.",
    paragraphs: [
      "Skiing in a tunnel is not skiing. There is no hill and no snow. There is a plate, a belt, and air at the speed of a downhill. The point is the same as the cycling job: you can see, in a morning, whether a new suit is worth taking to a race. The federation did not have aerodynamicists on staff. They had a coach and a suit manufacturer. The book we left is written for those two people.",
      "The circuit is a ¾-open jet with a six-square-metre nozzle — large enough that the skier’s hands stay in good air when the arms open. The plate measures the push of the air on the body. A day is twenty or thirty runs. A week is enough to finish a suit programme, or to settle a posture argument that has been going on in the team for a year.",
      "We handed the tunnel in 2023. We do not run it. If a federation or a team wants this class of facility, the constraint is the same as every other job: two to four years, a slot, and enough money that we can staff it through first air. Write in English. You do not need to speak to the engineering.",
    ],
    specs: [
      { label: "Circuit", value: "¾-open jet" },
      { label: "Nozzle", value: "6.0 m²" },
      { label: "Speed", value: "60–140 km/h" },
      { label: "What you leave with", value: "Force on the plate, per run" },
      { label: "Handed", value: "June 2023" },
      { label: "Contract value", value: "£1.6 million" },
    ],
    after:
      "L-136 is a modelled job. Figures are typical of a skier-scale open-jet tunnel.",
  },
  {
    slug: "l-128",
    code: "L-128",
    title: "Climatic aeroacoustic, 18 m²",
    klass: "aeroacoustic",
    klassLabel: "Aeroacoustic",
    status: "handed",
    years: "2016–20",
    client: "A Japanese car manufacturer",
    value: "£24 million",
    size: "18 m² nozzle",
    standfirst:
      "An 18 square-metre ¾-open-jet tunnel with climatic plant, handed in 2020. Four years. First air was six weeks late, because the client’s building was six weeks late. The circuit was not.",
    paragraphs: [
      "L-128 is the job we point to when a procurement office asks whether we have done this before at this scale. We have. The circuit, the treatment, the balance and the climatic plant (from −20 °C to +45 °C, which is the plant, not us) were ours. The building was theirs. The six-week slip sat entirely on the building. The empty-section survey, when we finally stood in the plenum, met the sheet we had signed in 2016.",
      "Out-of-flow noise was 61 dB(A) at 140 km/h — three decibels above L-147’s contracted floor, which is the difference between 2016 treatment and what we will put in now. Turbulence intensity was 0.14 percent at 50 m/s. We will send the first-run sheet, with the client’s name removed, to a named engineer.",
    ],
    specs: [
      { label: "Circuit", value: "¾-open jet, climatic" },
      { label: "Nozzle", value: "18 m²" },
      { label: "Empty-section speed", value: "40–220 km/h" },
      { label: "Turbulence intensity", value: "0.14 %", note: "measured, 50 m/s" },
      { label: "Out-of-flow noise", value: "61 dB(A)", note: "measured, 140 km/h" },
      { label: "Handed", value: "February 2020" },
      { label: "Contract value", value: "£24 million" },
    ],
    after:
      "L-128 is a modelled job. The measured figures are invented as typical of a 2016-generation automotive aeroacoustic tunnel.",
  },
  {
    slug: "l-119",
    code: "L-119",
    title: "Teaching tunnel, 0.45 m",
    klass: "research",
    klassLabel: "Research",
    status: "handed",
    years: "2015–17",
    client: "A Scottish university",
    value: "£410,000",
    size: "0.45 × 0.45 m",
    standfirst:
      "A teaching tunnel for a Scottish university. Four hundred and ten thousand pounds, two years, handed in 2017. It is still running; we get a letter most years when a bearing is due.",
    paragraphs: [
      "This is the job the firm was founded to do. James Leckie left RAE Bedford in 1964 to build a teaching tunnel for a university that had a laboratory and no circuit. L-119 is the same job, fifty-one years later: a 0.45 metre closed circuit, a simple balance, a book, and a technician who can run it after we leave.",
      "We take these when we have a slot and when the laboratory is ready. We do not bid on a grant that has not been awarded, and we do not design a tunnel to fit a number that was written to buy something else. If the grant is four hundred thousand and the room is six metres long, we can talk. If the grant is four hundred thousand and the room is a corridor, write to someone who sells a fan in a box.",
    ],
    specs: [
      { label: "Circuit", value: "Closed, octagonal" },
      { label: "Section", value: "0.45 × 0.45 m" },
      { label: "Empty-section speed", value: "5–40 m/s" },
      { label: "Turbulence intensity", value: "0.11 %", note: "measured, 25 m/s" },
      { label: "Handed", value: "September 2017" },
      { label: "Contract value", value: "£410,000" },
    ],
    after:
      "L-119 is a modelled job. The price is in the range of a small British teaching tunnel of the mid-2010s.",
  },
  {
    slug: "l-112",
    code: "L-112",
    title: "Slotted transonic, 0.9 m",
    klass: "transonic",
    klassLabel: "Transonic",
    status: "handed",
    years: "2011–14",
    client: "A national aerospace programme",
    value: "Not published",
    size: "0.9 × 0.9 m",
    standfirst:
      "The previous transonic job. Handed in 2014. We can say the size and that it is still in use. We cannot say more on this page.",
    paragraphs: [
      "L-112 is why L-148 was taken. The same compartmented office, the same List X site, several of the same people. A contracting officer who wants a history rather than a certificate can ask for the unclassified first-run sheet through the usual channel. The sheet gives the empty-section Mach calibration and the wall-interference method. It does not give the models.",
    ],
    specs: [
      { label: "Circuit", value: "Closed, slotted-wall" },
      { label: "Section", value: "0.9 × 0.9 m" },
      { label: "Mach", value: "0.3–1.2" },
      { label: "Handed", value: "March 2014" },
      { label: "Clearance", value: "List X site; SC / DV as required" },
      { label: "Contract value", value: "Not published" },
    ],
    after:
      "Unclassified remainder only. Leckie is a modelled firm.",
  },
];

export function jobBySlug(slug: string): Job | undefined {
  return JOBS.find((j) => j.slug === slug);
}

export const FLOOR = JOBS.filter((j) => j.status === "floor");
export const HANDED = JOBS.filter((j) => j.status === "handed");

export const HELD: Spec[] = [
  { label: "Empty-test-section TI", value: "≤ 0.08 %", note: "research class, 30 m/s" },
  { label: "Aeroacoustic floor", value: "58 dB(A)", note: "out of flow, 140 km/h" },
  { label: "Transonic Re", value: "12 × 10⁶ / m" },
  { label: "Smallest job we take", value: "£400,000" },
];

export const NAV: { href: string; label: string }[] = [
  { href: `${BASE}/work`, label: "Work" },
  { href: `${BASE}/practice`, label: "Practice" },
  { href: `${BASE}/people`, label: "People" },
  { href: `${BASE}/write`, label: "Write" },
];

/**
 * THE RECORD.
 *
 * This module holds claims and nothing else. There is no ordering here, no
 * weighting, no audience: every string in this file is written once and is the
 * same string whichever way the résumé is read. The three readings live in
 * `reading.ts`, which imports this and may only permute, group and rank what it
 * finds. It cannot rewrite a claim because it never holds one — it holds ids.
 *
 * That split is the whole design, so it is enforced by the file boundary rather
 * than by good intentions.
 *
 * Hana Bergström is invented for this brief; so is every number below. The
 * interface says so in the colophon and on the printed page, because a résumé
 * full of plausible fabricated metrics presented as real would be exactly the
 * dishonesty this piece is arguing against.
 */

export type LensId = "eng" | "pgm" | "ops";

/** 3 = lead with it, 2 = keep it in the body, 1 = set it back but keep it. */
export type Weight = 1 | 2 | 3;

export type Claim = {
  /** Stable and printed in the margin, so a claim can be pointed at. */
  id: string;
  /** The claim. Identical in every reading, by construction. */
  text: string;
  /**
   * Further specifics. A reading may fold this away, never remove it: the
   * record view and the printed page always show it, and the ledger counts
   * every fold.
   */
  detail?: string;
  w: Record<LensId, Weight>;
  /** Never demoted, never folded, always first in its role. */
  pinned?: boolean;
};

export type Stint = { title: string; from: string; to: string };

export type Role = {
  id: string;
  org: string;
  place: string;
  /** What the company did. Part of the record, not a pitch. */
  what: string;
  span: string;
  stints: Stint[];
  claims: Claim[];
};

export const PERSON = {
  name: "Hana Bergström",
  line: "Mechanical engineer · technical program manager · founder",
  place: "Portland, Oregon",
  email: "hana@bergstrom.example",
  phone: "+1 503 555 0142",
  /**
   * One headline, shown to all three audiences, and it names the failure. A
   * résumé that introduces itself differently to each employer has already
   * lost the argument this one is trying to make.
   */
  headline:
    "Twelve years in hardware: precision instruments, warehouse robots, and two years running a company of my own that did not make it.",
};

export const ROLES: Role[] = [
  {
    id: "vantive",
    org: "Vantive Robotics",
    place: "Hillsboro, Oregon",
    what: "Mobile robots for cold-storage distribution centres. About 240 people.",
    span: "Feb 2021 – present",
    stints: [
      {
        title: "Senior Technical Program Manager",
        from: "Aug 2023",
        to: "present",
      },
      { title: "Technical Program Manager", from: "Feb 2021", to: "Aug 2023" },
    ],
    claims: [
      {
        id: "V1",
        text: "Program lead for the P3 pallet shuttle from prototype to volume production: four hardware teams, 31 engineers, a 19-month schedule. It shipped in March 2024, nine weeks later than committed.",
        detail:
          "The nine weeks were mine. I took a battery-pack change in month eleven without re-baselining the qualification plan, and a 5,000-cycle life test cannot be compressed. I re-baseline in public now, the week scope moves, not the month before launch.",
        w: { eng: 2, pgm: 3, ops: 2 },
      },
      {
        id: "V2",
        text: "Re-sourced 41 of the 96 line items on the P3 bill of materials across 2022 and 2023, after the drive-motor vendor left the market. Qualified two replacements and held launch cost within 6% of target.",
        detail:
          "Fourteen of those 41 were single-sourced when I inherited the BOM. All fourteen have a second source today, qualified and building, not merely identified in a spreadsheet.",
        w: { eng: 1, pgm: 2, ops: 3 },
      },
      {
        id: "V3",
        text: "Wrote the hardware change control the company still runs on: engineering change orders, a deviation log with expiry dates, and a rule that nothing goes to tooling without a signed tolerance stack. Three programs use it.",
        w: { eng: 2, pgm: 3, ops: 2 },
      },
      {
        id: "V4",
        text: "Run the weekly integration review across mechanical, electrical, firmware, test and operations, against a risk register that holds 60 to 80 open items, each with one named owner and a date.",
        w: { eng: 1, pgm: 3, ops: 2 },
      },
      {
        id: "V5",
        text: "Cut prototype build turnaround from five weeks to twelve days by bringing fixture fabrication in-house and standardising the build kit.",
        w: { eng: 2, pgm: 2, ops: 3 },
      },
      {
        id: "V6",
        text: "Ran the root cause on two charge-dock failures in Salt Lake City myself: a blocked intake and thermal runaway on the balance board. Revised the duct geometry and the service interval; no recurrence in 19 months.",
        detail:
          "I do not think a program manager should stop being an engineer. I took this one because I had the thermal background and the field data was ambiguous enough that handing it over would have cost a month.",
        w: { eng: 3, pgm: 2, ops: 1 },
      },
      {
        id: "V7",
        text: "Represent hardware in the sales-and-operations planning cycle and maintain the model that turns the demand plan into long-lead part commitments 26 weeks out.",
        w: { eng: 1, pgm: 2, ops: 3 },
      },
      {
        id: "V8",
        text: "Moved the P3 line from the Portland pilot cell to a contract manufacturer in Guadalajara over eleven months. First-pass yield was 91% at hand-off and 96% two quarters later.",
        detail:
          "Six weeks on site across three trips. Almost all of the yield gap at hand-off came down to one press-fit operation, and we changed the fixture rather than the training, which is usually the right way round.",
        w: { eng: 2, pgm: 3, ops: 3 },
      },
      {
        id: "V9",
        text: "Brought three engineers into program ownership. Two now run programs of their own; the third decided it was not for her and went back to design, which I also count as a good outcome.",
        w: { eng: 1, pgm: 3, ops: 1 },
      },
    ],
  },
  {
    id: "halyard",
    org: "Halyard Systems",
    place: "Portland, Oregon",
    what: "Benchtop autosampler for municipal drinking-water laboratories. Co-founded with one other person.",
    span: "Mar 2018 – Nov 2020",
    stints: [
      {
        title: "Co-founder and Head of Engineering",
        from: "Mar 2018",
        to: "Nov 2020",
      },
    ],
    claims: [
      {
        id: "H0",
        text: "Halyard closed in November 2020. We raised $4.1M, shipped 312 instruments to 40 laboratories, and could not raise a Series A. I ran the wind-down over four months: service contracts honoured to term, all nine employees placed, $310,000 returned to investors.",
        detail:
          "The company failed. There is no reading of this record in which it did not, and this line is pinned to the top of the role in all three.",
        w: { eng: 3, pgm: 3, ops: 3 },
        pinned: true,
      },
      {
        id: "H1",
        text: "Designed the sampling head: a 24-position carousel with a self-cleaning needle, ±0.35% volumetric repeatability measured over 5,000 cycles.",
        detail:
          "Three mechanisms inside 140 mm of vertical travel — carousel index, needle Z-drive, and a wash station that had to seal against a wet needle without wiping it. The seal geometry took four prototypes and the fourth is the one that shipped.",
        w: { eng: 3, pgm: 1, ops: 1 },
      },
      {
        id: "H2",
        text: "Owned the whole mechanical stack — sheet-metal chassis, moulded carousel, fluidics deck, three custom mechanisms — from first sketch to production tooling in fourteen months.",
        w: { eng: 3, pgm: 2, ops: 2 },
      },
      {
        id: "H3",
        text: "Wrote and ran the qualification programme: eighteen tests, including a 5,000-cycle life test, IEC 61010 pre-compliance and ISTA 3A shipping. It found two failures and both were fixed before the first shipment.",
        w: { eng: 3, pgm: 2, ops: 1 },
      },
      {
        id: "H4",
        text: "Rebuilt the supply chain the first time in 2019, when Section 301 tariffs made the original Shenzhen sourcing untenable: 60% of BOM value moved to suppliers in Malaysia and Ohio over five months, at a 4% net cost increase.",
        w: { eng: 1, pgm: 2, ops: 3 },
      },
      {
        id: "H5",
        text: "Rebuilt it the second time in March 2020, when the Malaysian plant closed: 22 critical parts dual-sourced in nine weeks, and every unit we had committed to that year shipped.",
        detail:
          "Nine weeks of nothing but phone calls, drawings and air freight. It is the work I would most want an operations interviewer to ask about, and it is also the period in which I was least available to my own engineers.",
        w: { eng: 1, pgm: 2, ops: 3 },
      },
      {
        id: "H6",
        text: "Hired and led nine people — four engineers, two technicians, two in manufacturing, a regulatory consultant on retainer — and set the engineering practice from nothing: drawing standard, part numbering, change control, and a PLM people actually used.",
        w: { eng: 2, pgm: 3, ops: 2 },
      },
      {
        id: "H7",
        text: "Ran the operating rhythm as one of two founders: engineering, contract manufacturing, regulatory and forty customer sites on a two-week cycle, with a board to keep informed.",
        w: { eng: 1, pgm: 3, ops: 2 },
      },
      {
        id: "H8",
        text: "Did twenty-two pilot installations myself, trained the laboratory staff, and took the support calls for two years.",
        detail:
          "Water-quality technicians start at seven in the morning. I learned more about that instrument from a 7 a.m. call in Gresham than from any design review we ever held.",
        w: { eng: 2, pgm: 2, ops: 2 },
      },
      {
        id: "H9",
        text: "What I got wrong: we cut the carousel tool before the sampling protocol was settled and paid $180,000 to revise it, and I planned the pump at an eight-week lead time when it was twelve. Both were schedule optimism and both were mine.",
        w: { eng: 3, pgm: 3, ops: 3 },
        pinned: true,
      },
    ],
  },
  {
    id: "kestrel",
    org: "Kestrel Instrument",
    place: "Beaverton, Oregon",
    what: "Precision mass comparators for calibration laboratories. About 60 people.",
    span: "Jun 2014 – Mar 2018",
    stints: [
      {
        title: "Senior Mechanical Engineer",
        from: "Sep 2016",
        to: "Mar 2018",
      },
      { title: "Mechanical Engineer", from: "Jun 2014", to: "Sep 2016" },
    ],
    claims: [
      {
        id: "K1",
        text: "Designed the kinematic pan support for the K7 comparator and brought off-centre loading error down from 42 µg to 9 µg.",
        detail:
          "Three-point contact on hardened spheres, with the load path arranged so that thermal growth in the frame cannot tilt the pan. Named inventor on the granted US patent covering the geometry.",
        w: { eng: 3, pgm: 1, ops: 1 },
      },
      {
        id: "K2",
        text: "Designed the K7 thermal enclosure: 0.01 °C per hour of drift over an eight-hour run, in a laboratory held to ±1 °C.",
        w: { eng: 3, pgm: 1, ops: 1 },
      },
      {
        id: "K3",
        text: "Ran tolerance analysis and GD&T for the K7 platform and wrote the drawing standard the company used for everything after it.",
        w: { eng: 3, pgm: 2, ops: 1 },
      },
      {
        id: "K4",
        text: "Took the K7 through pilot production with the in-house machine shop: 60 units at 88% first-pass yield, and a build book a technician could follow without me in the room.",
        w: { eng: 2, pgm: 2, ops: 3 },
      },
      {
        id: "K5",
        text: "Cut frame machining cost 22% by consolidating five parts into a single casting and negotiating the pattern cost with the foundry directly.",
        w: { eng: 2, pgm: 1, ops: 3 },
      },
      {
        id: "K6",
        text: "Answered field escalations for two years, about thirty of them, which is where I learned what a drawing does not say.",
        w: { eng: 2, pgm: 1, ops: 2 },
      },
    ],
  },
];

export const EDUCATION: Claim[] = [
  {
    id: "E1",
    text: "BS Mechanical Engineering, Oregon State University, 2014.",
    w: { eng: 2, pgm: 2, ops: 2 },
  },
  {
    id: "E2",
    text: "Graduate certificate in Global Supply Chain Management, Portland State University, 2022. Evening programme, finished while working.",
    w: { eng: 1, pgm: 2, ops: 3 },
  },
];

export const WRITING: Claim[] = [
  {
    id: "T1",
    text: "“Closing it properly” — a talk on winding down a hardware company, Portland Hardware Meetup, February 2021.",
    w: { eng: 2, pgm: 2, ops: 2 },
  },
  {
    id: "T2",
    text: "“Two supply chains in eighteen months” — written up internally at Vantive, 2022, and used since as onboarding for new commodity managers.",
    w: { eng: 1, pgm: 2, ops: 3 },
  },
];

export type SkillGroup = {
  id: string;
  label: string;
  items: string[];
  w: Record<LensId, Weight>;
};

export const SKILLS: SkillGroup[] = [
  {
    id: "S1",
    label: "Mechanical design",
    items: [
      "SolidWorks (12 years)",
      "Onshape",
      "GD&T to ASME Y14.5",
      "tolerance stack-up, worst case and RSS",
      "DFM for injection moulding, sheet metal and machining",
      "structural and thermal FEA",
    ],
    w: { eng: 3, pgm: 1, ops: 1 },
  },
  {
    id: "S2",
    label: "Test and compliance",
    items: [
      "life and environmental test design",
      "IEC 61010",
      "ISTA 3A",
      "measurement system analysis",
      "fault tree and 8D root cause",
    ],
    w: { eng: 3, pgm: 2, ops: 2 },
  },
  {
    id: "S3",
    label: "Program",
    items: [
      "schedule modelling and critical path",
      "risk registers",
      "ECO and deviation control",
      "NPI phase gates",
      "Smartsheet, Jira, Confluence",
    ],
    w: { eng: 1, pgm: 3, ops: 2 },
  },
  {
    id: "S4",
    label: "Operations",
    items: [
      "BOM and PLM (Arena, Windchill)",
      "supplier qualification and audit",
      "dual-sourcing and second-source qualification",
      "NetSuite",
      "incoterms and customs classification",
      "sales and operations planning",
    ],
    w: { eng: 1, pgm: 2, ops: 3 },
  },
];

/**
 * Her framing, in her own words — commentary about relevance, not a claim of
 * fact, and typographically separated everywhere it appears. Every reading's
 * framing is listed in the audit at the foot of the page, so an employer
 * reading one of them can see exactly what she says to the other two.
 */
export type Lens = {
  id: LensId;
  label: string;
  /** The kind of role this reading is for. */
  target: string;
  note: string;
  roleNotes: Record<string, string>;
};

export const LENSES: Lens[] = [
  {
    id: "eng",
    label: "Engineering",
    target: "senior mechanical engineering roles",
    note: "The deepest technical work I have done is the two years at Halyard, where I owned every mechanism in an instrument that shipped and wrote the programme that proved it. Kestrel is where I learned precision. Vantive is where I have kept my hands on hardware while running programs.",
    roleNotes: {
      vantive:
        "A program job, but the thermal investigation below is mine end to end.",
      halyard:
        "Read this role for the mechanism work. It is the most complete piece of engineering I have done.",
      kestrel:
        "Eight years ago, and still the most precise work I have done.",
    },
  },
  {
    id: "pgm",
    label: "Program",
    target: "technical program management roles",
    note: "The same two years at Halyard read differently here: nine people, a fixed runway, forty laboratories waiting, and nobody else to run it. Vantive is that job at four times the scale, with the authority to fix a process rather than work around it.",
    roleNotes: {
      vantive: "This is the job I am asking to do again, one level up.",
      halyard:
        "Read this role as running an organisation: every function reporting through two founders.",
      kestrel:
        "Early career, individual contributor. It is here for completeness rather than because it argues for me.",
    },
  },
  {
    id: "ops",
    label: "Operations",
    target: "hardware operations and supply chain roles",
    note: "I have rebuilt a supply chain twice under two different shocks — a tariff regime and a plant closure — and then done it a third time at Vantive at a hundred times the volume. I have also been the person who personally signs for the air freight.",
    roleNotes: {
      vantive:
        "Operations at volume: 96 line items, a contract-manufacturer transfer, and the S&OP model.",
      halyard:
        "Read this role for the two rebuilds. They are the reason I am applying for operations at all.",
      kestrel:
        "The casting consolidation and the pilot build are the operations content here.",
    },
  },
];

/** Shown in the colophon and printed. See the note at the top of this file. */
export const PROVENANCE =
  "Hana Bergström is a fictional person written for this brief, and every figure on this page is invented. Nothing here is a real career or a real measurement.";

/**
 * Bench is a modelled studio. The people, objects, tests and clients are
 * written as if they were real; they are not. Provenance is stated in the
 * interface, not only here.
 */

export type PersonId = "ruth" | "tomas" | "asha" | "leo";

export type FormStatus = "killed" | "left";

export type KillKind = "constraint" | "test" | "direction";

export type Person = {
  id: PersonId;
  name: string;
  role: string;
  killsFor: string;
};

export type Form = {
  id: string;
  n: number;
  name: string;
  mark: string;
  status: FormStatus;
  killer?: PersonId;
  kind?: KillKind;
  verdict: string;
  reason: string;
  thinking: string;
};

export type Project = {
  id: string;
  name: string;
  object: string;
  years: string;
  client: string;
  asked: string;
  needed: string;
  forms: Form[];
  left: {
    title: string;
    spec: string;
    cost: string;
  };
};

export const STUDIO = {
  name: "Bench",
  legal: "Bench Studio",
  place: "Attercliffe, Sheffield",
  founded: 2014,
  people: 4,
  note:
    "Bench is a modelled studio, written for this gallery. The objects, tests and clients are invented. The reasoning is the work.",
} as const;

export const PEOPLE: Person[] = [
  {
    id: "ruth",
    name: "Ruth Keene",
    role: "Furniture",
    killsFor: "If the caretaker needs a second person, the object is wrong for the building.",
  },
  {
    id: "tomas",
    name: "Tomás Vale",
    role: "Mechanisms",
    killsFor: "If it only works clean, dry and right-handed, it does not work.",
  },
  {
    id: "asha",
    name: "Asha Nair",
    role: "Materials",
    killsFor: "I do not argue with a test. I write the number down.",
  },
  {
    id: "leo",
    name: "Leo Hart",
    role: "Briefs",
    killsFor: "The brief is never the brief. I write down what they will actually live with.",
  },
];

export const CAPABILITIES = [
  {
    title: "Institutional furniture",
    body: "Waiting, reading, meeting. Hospitals, libraries, courts. Designed for the cleaner and the twenty-year caretaker, not for the photograph in the bid.",
  },
  {
    title: "Tools",
    body: "Hand tools and bench tools for trades that still have hands. Replaceable parts. No sealed sculpture that dies with one screw.",
  },
  {
    title: "Instruments",
    body: "Field and laboratory instruments that survive grit, gloves and a drop onto something harder than the floor of this shop.",
  },
] as const;

export const WILL_NOT = [
  "Interiors as a service",
  "Consumer electronics",
  "A fourth job before one of the two on the bench has left",
] as const;

export const PROJECTS: Project[] = [
  {
    id: "ward-4",
    name: "Ward 4",
    object: "Waiting chair",
    years: "2022–23",
    client: "A Midlands district hospital (modelled)",
    asked: "A chair that feels like a lounge, not a clinic.",
    needed:
      "Chlorine wipe, stack of six in the cupboard that exists, 160 kg, sit-to-stand arms, IV-pole clearance, faces visible from the station, a seat pan that undoes with four screws.",
    left: {
      title: "The chair that left",
      spec: "Steel frame, radiused. 18 mm birch ply seat and back. Two-part polyurethane that does not bloom. Arms at 680 mm. Open to the floor. Stacks six. One seat pan, four screws. 140 in the modelled ward since 2023.",
      cost: "We lost the object that would have won a pitch against a prettier studio.",
    },
    forms: [
      {
        id: "w-lounge",
        n: 1,
        name: "Lounge",
        mark: "lounge",
        status: "killed",
        killer: "asha",
        kind: "test",
        verdict: "You picked the one that looked like the brief.",
        reason:
          "The trust asked for rest. This form is rest: a deep seat, a soft back, a skirt that hides the legs. Asha wiped it with 1,000 ppm chlorine, the dilution the ward uses on a night shift. At cycle 80 the piped seam at the front rail opened and the foam greyed. A waiting-room chair that cannot be wiped is a vector. We killed it the same afternoon.",
        thinking: "We do not keep a form that photographs well and fails the cleaner.",
      },
      {
        id: "w-tub",
        n: 2,
        name: "Tub",
        mark: "tub",
        status: "killed",
        killer: "ruth",
        kind: "constraint",
        verdict: "You picked a form that would have sat well in a photograph.",
        reason:
          "A tub photographs as a piece. It also holds crumbs, cannot stack, and takes two people to turn when the floor is mopped. The store that would have taken 140 of these is a six-metre cupboard. Ruth killed it for the cupboard, not for the look.",
        thinking: "If the caretaker needs a second person, the object is wrong for the building.",
      },
      {
        id: "w-sled",
        n: 3,
        name: "Sled",
        mark: "sled",
        status: "killed",
        killer: "tomas",
        kind: "constraint",
        verdict: "You picked the cleanest line on the bench.",
        reason:
          "A sled base is one bent tube and a good drawing. On Ward 4 it is also a trip for an IV pole and a catch for a walking frame. Tomás brought a frame from the physio store and would not discuss the drawing until the frame had cleared the runner. It did not.",
        thinking: "The elegant line is not a defence against the other objects in the room.",
      },
      {
        id: "w-ash",
        n: 4,
        name: "Ash",
        mark: "ash",
        status: "killed",
        killer: "asha",
        kind: "test",
        verdict: "You picked the honest material.",
        reason:
          "We wanted timber. We always want timber. Four legs in ash, a plywood seat, a linseed finish we have used on library work. Asha left a rail in the same chlorine the vinyl had failed. The finish bloomed white on day two and the grain raised. A hospital is not a library. We kept the ash for the table and killed it here.",
        thinking: "A favourite material is not a method.",
      },
      {
        id: "w-cant",
        n: 5,
        name: "Cantilever",
        mark: "cantilever",
        status: "killed",
        killer: "asha",
        kind: "test",
        verdict: "You picked the one that looks as if it knows what a chair is.",
        reason:
          "The cantilever is a twentieth-century idea that still looks current, which is usually a warning. We loaded the seat to 160 kg, the trust’s bariatric figure, and measured sag at the front rail: 14 mm, then 16 mm the next morning. Asha does not argue with a number that grows overnight.",
        thinking: "If it moves after you have left it, it is not finished.",
      },
      {
        id: "w-perch",
        n: 6,
        name: "Perch",
        mark: "perch",
        status: "killed",
        killer: "leo",
        kind: "direction",
        verdict: "You picked a different brief.",
        reason:
          "A perch is a good object. It is not a waiting-room chair. Leo wrote the brief back to the trust: you asked for rest for people who may sit two hours with a child or a cast. A perch is a refusal of that time. We killed our own cleverness.",
        thinking: "We do not solve a brief by changing it when the object gets interesting.",
      },
      {
        id: "w-wing",
        n: 7,
        name: "Wing",
        mark: "wing",
        status: "killed",
        killer: "ruth",
        kind: "constraint",
        verdict: "You picked privacy.",
        reason:
          "A high back makes a bay. On a ward it also hides a faint from the nurses’ station. Ruth sat in it in the mock bay and the charge nurse could not see her face. That was the end of the wings.",
        thinking: "Comfort that conceals a patient is not comfort we will sign.",
      },
      {
        id: "w-slab",
        n: 8,
        name: "Slab",
        mark: "slab",
        status: "killed",
        killer: "ruth",
        kind: "constraint",
        verdict: "You picked the quietest one.",
        reason:
          "Without arms the elevation is calm and the stack is tighter. Two of the trust’s occupational therapists came to the shop and asked, without sitting, where a person with bad hips pushes up from. Ruth killed it before the foam had a coat on it.",
        thinking: "The people who cannot use the object do not appear in the photograph.",
      },
      {
        id: "w-loaf",
        n: 9,
        name: "Loaf",
        mark: "loaf",
        status: "killed",
        killer: "asha",
        kind: "test",
        verdict: "You picked the soft answer.",
        reason:
          "A thick cushion is what a lounge wants. Asha injected the same foam we liked with 200 ml of water — the accident the ward would not put in a brief — and weighed it out the next day. It still held 140 ml. A waiting chair that keeps a spill is a policy problem. We do not make policy problems.",
        thinking: "Softness is a material, not a kindness, and it has to dry.",
      },
      {
        id: "w-disc",
        n: 10,
        name: "Disc",
        mark: "disc",
        status: "killed",
        killer: "tomas",
        kind: "constraint",
        verdict: "You picked a single stem, which is a tidy thought.",
        reason:
          "You cannot clean under a disc without kicking it. Tomás put a mop to the mock-up and the head would not pass the plate. The cleaners on Ward 4 work around objects; they do not lift them.",
        thinking: "An object that cannot be cleaned around will be cleaned badly.",
      },
      {
        id: "w-four",
        n: 11,
        name: "Four-leg",
        mark: "fourleg",
        status: "left",
        verdict: "This is the one that left.",
        reason:
          "Four steel legs, radiused. 18 mm birch ply seat and back. A two-part polyurethane the chlorine does not bloom. Arms at 680 mm for a sit-to-stand. Open to the floor. Stacks six in the cupboard that exists. The charge nurse can see every face. A single seat pan undoes with four screws when it is finally marked. It is not a lounge.",
        thinking:
          "The right object is the one the building can live with when we are not in the room. We gave up the photograph.",
      },
    ],
  },
  {
    id: "pocket",
    name: "Pocket",
    object: "Field loupe",
    years: "2019–20",
    client: "A county wildlife trust (modelled)",
    asked: "A beautiful instrument they will want to own.",
    needed:
      "Rain, grit, gloves, a drop onto limestone, a left hand, a battery you can buy in a village, a lanyard that does not look like jewellery.",
    left: {
      title: "The loupe that left",
      spec: "Polymer body, sliding focus, identical left and right. AA cell. Lanyard through the mass, not a loop on a cap. 80 mm long. The modelled trust issued forty in 2020.",
      cost: "It will never be stolen for the look of it. That is a loss we accepted.",
    },
    forms: [
      {
        id: "p-brass",
        n: 1,
        name: "Brass",
        mark: "brass",
        status: "killed",
        killer: "asha",
        kind: "test",
        verdict: "You picked the one that looked like an instrument.",
        reason:
          "Brass photographs as knowledge. It is also cold in March, heavy on a lanyard, and it tarnishes in a pocket against a wet notebook. Asha left a turned body in a damp bag for a week. The green came. A field tool that asks to be polished is a second job. We killed the brass.",
        thinking: "An instrument that looks valuable will be treated as jewellery or as theft.",
      },
      {
        id: "p-bellows",
        n: 2,
        name: "Fold",
        mark: "fold",
        status: "killed",
        killer: "tomas",
        kind: "constraint",
        verdict: "You picked the elegant mechanism.",
        reason:
          "A folding bellows made the instrument pocketable and, on the bench, a pleasure to open. Tomás put grit from the yard — the same grit as a limestone path — into the hinge and worked it. It jammed on the third close. A hinge that only works clean is not a field hinge.",
        thinking: "If it only works clean, dry and right-handed, it does not work.",
      },
      {
        id: "p-ring",
        n: 3,
        name: "Ring",
        mark: "ring",
        status: "killed",
        killer: "tomas",
        kind: "constraint",
        verdict: "You picked the fine adjustment.",
        reason:
          "A knurled focus ring is what a microscope is supposed to have. Tomás put on the winter gloves the trust actually issues and could not find the thread. We do not design for bare hands and then add ‘also works with gloves’ in a caption.",
        thinking: "A control you cannot find in January is not a control.",
      },
      {
        id: "p-right",
        n: 4,
        name: "Right",
        mark: "right",
        status: "killed",
        killer: "tomas",
        kind: "constraint",
        verdict: "You picked the usual handedness.",
        reason:
          "The eyepiece sat naturally for a right eye and a right hand on the focus. Two of the trust’s recorders are left-eyed. Tomás made them try it on a wet Tuesday and wrote down the time they spent turning it over. We killed the handedness.",
        thinking: "Usual is not the same as common, and common is not the same as all.",
      },
      {
        id: "p-wood",
        n: 5,
        name: "Clad",
        mark: "clad",
        status: "killed",
        killer: "asha",
        kind: "test",
        verdict: "You picked warmth.",
        reason:
          "A thin ash cladding made the polymer feel like a tool from a better century. Asha left it in a tray of rain from the roof. The cladding swelled and the focus slide went tight. Warmth that fails in weather is decoration.",
        thinking: "A favourite material is not a method.",
      },
      {
        id: "p-mini",
        n: 6,
        name: "Mini",
        mark: "mini",
        status: "killed",
        killer: "ruth",
        kind: "constraint",
        verdict: "You picked the pocket.",
        reason:
          "At 42 mm it disappeared into a coat and, in the mock, into the lining. Ruth asked the recorders how many pencils they already lose in a season. We do not add a seventh small thing.",
        thinking: "Smaller is not kinder when the object has to be found with cold fingers.",
      },
      {
        id: "p-dumpy",
        n: 7,
        name: "Dumpy",
        mark: "dumpy",
        status: "left",
        verdict: "This is the one that left.",
        reason:
          "A short polymer body. Focus by sliding, with a detent you can feel in a glove. Identical left and right. An AA cell, not a coin cell from a city. The lanyard goes through the mass so the cap cannot take the instrument with it when it is dropped. It is dumpy. It does not look like a thing one owns. It looks like a thing one uses in the rain.",
        thinking: "The instrument is the looking, not the owning.",
      },
    ],
  },
  {
    id: "long-table",
    name: "Long table",
    object: "Reading table",
    years: "2024–25",
    client: "A civic library (modelled)",
    asked: "A table that disappears.",
    needed:
      "Eight-hour sit, bags, elbows, the power they said they did not want, a surface that can take a key, a rail so bags are not a trip, twenty years in a room that is cleaned badly.",
    left: {
      title: "The table that left",
      spec: "40 mm beech top. Visible steel stretchers. A grommet in the surface that unscrews when the socket dies. Bag rail on the user’s side. 2.4 m. Six in the modelled room.",
      cost: "It does not disappear. A disappearing table was the elegant idea, and the elegant idea sagged.",
    },
    forms: [
      {
        id: "t-cant",
        n: 1,
        name: "Cantilever",
        mark: "tcant",
        status: "killed",
        killer: "asha",
        kind: "test",
        verdict: "You picked the table that would have disappeared.",
        reason:
          "A cantilevered top with no stretchers is the elegant idea: a plane in a room. We loaded 80 kg at 1.2 m — a bag, a machine, two elbows — and measured 12 mm of sag. In the morning it was 13. Asha wrote the numbers on the underside and we killed it. The brief had asked the table to vanish. Gravity declined.",
        thinking: "If it moves after you have left it, it is not finished.",
      },
      {
        id: "t-well",
        n: 2,
        name: "Well",
        mark: "well",
        status: "killed",
        killer: "ruth",
        kind: "constraint",
        verdict: "You picked the hidden power.",
        reason:
          "A cable well under a flap is how a table stays a plane. It is also a crumb trap, and the sockets die inside a box you need a screwdriver and a lie-down to reach. The library said they did not want power. Leo wrote back the week the first reader asked where to plug in. Ruth killed the well for the cleaner, and we put the socket in the surface where it can be replaced standing up.",
        thinking: "A hide is not a solution if someone has to get under the object to mend it.",
      },
      {
        id: "t-elm",
        n: 3,
        name: "Elm",
        mark: "elm",
        status: "killed",
        killer: "asha",
        kind: "test",
        verdict: "You picked the precious top.",
        reason:
          "Thin elm, quarter-sawn, the kind of top a table is supposed to be proud of. Asha wet one face, as a spilled flask would, and the board cupped 4 mm by evening. A civic table that asks to be precious will be policed, and then resented. We went to 40 mm beech, which can take a key.",
        thinking: "A favourite material is not a method.",
      },
      {
        id: "t-hair",
        n: 4,
        name: "Hairpin",
        mark: "hairpin",
        status: "killed",
        killer: "tomas",
        kind: "constraint",
        verdict: "You picked the lightest legs.",
        reason:
          "Hairpin legs keep the floor visible and the drawing thin. Tomás racked the mock with one hand on the far corner — the move a reader makes standing up with a bag. The top walked. A reading table that walks is a table people stop trusting with a drink.",
        thinking: "Thin is not the same as lasting.",
      },
      {
        id: "t-plain",
        n: 5,
        name: "Plane",
        mark: "plane",
        status: "killed",
        killer: "leo",
        kind: "direction",
        verdict: "You picked the brief, taken literally.",
        reason:
          "No rail, no grommet, no stretcher you can see: a plane. Bags went on the floor and became a trip in the mock room. Leo had already written that the brief was wrong about power; he wrote it again about bags. We do not disappear the table by moving the problem to the floor.",
        thinking: "We do not solve a brief by changing it when the object gets interesting — and we do not obey a brief that injures the room.",
      },
      {
        id: "t-beech",
        n: 6,
        name: "Beech",
        mark: "beech",
        status: "left",
        verdict: "This is the one that left.",
        reason:
          "Forty millimetres of beech. Steel stretchers you can see, so you know why it does not sag. A grommet in the surface that unscrews when the socket dies. A bag rail on the user’s side. It is a table in a room. It does not vanish. Readers stay for eight hours, which was the actual brief.",
        thinking: "The right object is the one the building can live with when we are not in the room.",
      },
    ],
  },
];

export function personById(id: PersonId): Person {
  return PEOPLE.find((p) => p.id === id)!;
}

export function killsOn(project: Project, id: PersonId): Form[] {
  return project.forms.filter((f) => f.killer === id);
}

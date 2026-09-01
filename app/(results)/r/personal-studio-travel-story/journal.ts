/**
 * Composed account. Distances follow a Pennine-to-estuary river of 138 km.
 * Widths are modelled, not gauged. No day is a log.
 */

export type StationKind = "day" | "mark";

export type Station = {
  id: string;
  km: number;
  /** Metres across, modelled. */
  widthM: number;
  landscape:
    | "moor"
    | "farms"
    | "mill"
    | "city"
    | "docks"
    | "marsh";
  kind: StationKind;
  day?: number;
  place: string;
  /** One line on the rail. Days carry the writing. */
  crumb: string;
  paras?: string[];
};

export const RIVER_KM = 138;
export const SPRING_M = 0.4;
export const MOUTH_M = 2000;
export const DAYS = 41;

export const WALKER = "Ruth Keane";
export const RIVER = "the Lum";

export const STATIONS: Station[] = [
  {
    id: "head",
    km: 0.2,
    widthM: 0.4,
    landscape: "moor",
    kind: "day",
    day: 1,
    place: "Lum Head",
    crumb: "A spring you can step across",
    paras: [
      "I stepped across it because that was the joke I had come for: a river you can put one boot on either side of. The water was peat-brown at once, not clear, and cold in a way that went up the bone. I had packed for a different trip — too many shirts, a pan I never used — and the first hour was unpicking the weight.",
      "I did not tell David. I told my sister I was walking a river, and she asked which one, and I said the Lum, and she said she thought that was a drain. It is, at the head. It comes out of a rusted pipe someone put in the peat in the seventies and then out of the peat itself, and then it is a line you could lose in the heather if you looked away.",
      "I camped in a wind that made the tent walk. I ate cheese that had gone and I did not sleep so much as wait. In the morning the spring was still there, which felt like an argument I was losing.",
    ],
  },
  {
    id: "hags",
    km: 7.1,
    widthM: 1.2,
    landscape: "moor",
    kind: "mark",
    place: "Reave Moss",
    crumb: "Last of the peat hags. The path is an argument.",
  },
  {
    id: "ewe",
    km: 11.8,
    widthM: 2.1,
    landscape: "moor",
    kind: "day",
    day: 4,
    place: "Reave Edge",
    crumb: "A ewe in a grip",
    paras: [
      "A ewe had gone into a grip and could not get the purchase to come out. I went in to the waist. The water at four days is already a thing that wants to take your feet. I got her out and she ran ten yards and looked at me as if I had done a rudeness.",
      "The man who owned the moor found me sitting on the bank with my trousers drying on a stone. He asked if I was lost. I said I was not. He looked at the tent and at my hands and said, Right, which is a word that can mean several kinds of refusal. He did not mention a woman on her own. He mentioned the path, which was not a path.",
      "I slept in my wet things because the dry ones were the ones I was saving, which is the sort of thinking that has to be broken early.",
    ],
  },
  {
    id: "cattle",
    km: 22.4,
    widthM: 4.0,
    landscape: "farms",
    kind: "mark",
    place: "Howe End",
    crumb: "First cattle. The water takes a smell of them.",
  },
  {
    id: "eggs",
    km: 31.4,
    widthM: 6.2,
    landscape: "farms",
    kind: "day",
    day: 9,
    place: "Holme Sike",
    crumb: "Six eggs and a bus shelter",
    paras: [
      "The first farm I could have walked into without climbing a wall. A woman sold me six eggs from a kitchen that still had the morning in it. I paid with a note that was too large and she made the change from a jar. She asked if I was doing the Coast to Coast, and I said no, just this water, and she nodded as if that were a known category.",
      "I ate two of the eggs raw on a stile because I was behind on food and did not want to light the stove in someone else's field. They were good. I rang my sister from a bus shelter and talked about the eggs. She waited for me to talk about the house. I did not.",
      "The Lum here is past stepping. A dog stood in the middle of it and considered me. I went around.",
    ],
  },
  {
    id: "dye",
    km: 48.0,
    widthM: 12,
    landscape: "mill",
    kind: "mark",
    place: "above Cinderford",
    crumb: "The dye works before you see the town.",
  },
  {
    id: "weir",
    km: 54.6,
    widthM: 18,
    landscape: "mill",
    kind: "day",
    day: 14,
    place: "Cinderford",
    crumb: "Not for charity",
    paras: [
      "Cinderford used to dye cloth. The river is the colour of tea left with a nail in it. I walked the weir with a man who said he had been a tuner, and then a driver, and now he watched the water because his knees had finished with him. He told me about the flood in 2007 that took the footbridge and left a car in a tree. He pointed at the tree. There was no car. He said that was the point.",
      "I took a room over the Hare. A woman at the bar asked if I was doing it for charity. I said no. She looked at my boots and then at my face and found nothing to attach the walk to, and she went back to the glasses. I was glad. I was also, for an hour, ashamed of being glad.",
      "The streetlights came on before the shops shut. The river under the road made a sound like someone trying not to be heard.",
    ],
  },
  {
    id: "outfall",
    km: 73.1,
    widthM: 28,
    landscape: "city",
    kind: "day",
    day: 19,
    place: "Low Cut",
    crumb: "The ankle, and the worse reason",
    paras: [
      "I turned my ankle on a broken outfall — concrete, algal, the exact height to catch a boot. I sat on the path and said one short word several times. A cyclist asked if I needed a lift and I said I did not, which was untrue and also the only thing I could say.",
      "Two days in a hotel that advertised itself as executive. Daytime television, a carpet that held other people's tea. I thought about trains. I thought about the conversation that would follow an early return: the concern, the interpretation, the kindness that would turn the walk into a symptom. I stayed for the worse reason. I stayed because I did not want to explain.",
      "When I walked again the river had not noticed.",
    ],
  },
  {
    id: "ring",
    km: 84.6,
    widthM: 38,
    landscape: "city",
    kind: "mark",
    place: "the ring road",
    crumb: "The ring road. The Lum goes under it without comment.",
  },
  {
    id: "sofa",
    km: 91.8,
    widthM: 48,
    landscape: "city",
    kind: "day",
    day: 24,
    place: "Marlowgate",
    crumb: "A sofa, on its back",
    paras: [
      "The Lum is walled here and fast in the middle. Offices look at it without using it. I walked the towpath between bins and a man eating a salad from a box. A boy was fishing with no bait, or none I could see. He said he liked the sitting. I said I did too, which was a lie for the time of day.",
      "There was a sofa in the water, on its back, quite calm. I ate in the station café and a couple at the next table argued about whose turn it was to fetch the children from his mother's. I left before the sandwich arrived and then went back because I had paid. The woman behind the counter did not comment. I was grateful for every person that day who did not ask me a question.",
      "I slept in a bunkhouse that smelled of other people's socks and I was fine.",
    ],
  },
  {
    id: "gate",
    km: 114.2,
    widthM: 160,
    landscape: "docks",
    kind: "day",
    day: 31,
    place: "Brant Docks",
    crumb: "Authorised personnel",
    paras: [
      "A locked gate and a sign about authorised personnel. The other bank was a different weather — I am not being literary; it was raining there and not here. I walked the road for an hour. A security man came out of a hut and I showed him nothing. I asked if there was a way along. He said there was not a public way. He was not unkind. He pointed at the A-road as if it were a kindness.",
      "Container smell. Gulls that had forgotten the sea. The Lum is wide enough here that you stop thinking of the other side as a destination. I bought a tide table in a shop that also sold phone chargers and fried things, and I used the blank back of it for the rest of the notes. That is why the last pages look like this.",
      "I thought about the piano. Not as a symbol. As an object that will have to go somewhere, and neither of us plays.",
    ],
  },
  {
    id: "salt",
    km: 122.8,
    widthM: 320,
    landscape: "marsh",
    kind: "mark",
    place: "first salt",
    crumb: "First salt in the air. The water slackens.",
  },
  {
    id: "dolphin",
    km: 129.4,
    widthM: 740,
    landscape: "marsh",
    kind: "day",
    day: 38,
    place: "Sunk Island reach",
    crumb: "Two hours on a dolphin",
    paras: [
      "I misread the tide and sat on a concrete dolphin for two hours while the water came up around the path I had meant to use. It came brown and then grey. A man in a van stopped on the sea wall and looked at me and decided I was not his business. I was not.",
      "I could not name the birds. I used to be able to name more things. The marsh makes a sound when the water leaves it that I will not try to write down because I would get it wrong and then I would have a sentence I liked more than the thing.",
      "I did not cry. I ate the last of the fruitcake my sister had put in the pack without asking. It was stale and I finished it.",
    ],
  },
  {
    id: "rumour",
    km: 134.6,
    widthM: 1400,
    landscape: "marsh",
    kind: "mark",
    place: "the far shore",
    crumb: "The other shore is a rumour.",
  },
  {
    id: "mouth",
    km: 138,
    widthM: 2000,
    landscape: "marsh",
    kind: "day",
    day: 41,
    place: "Lum Mouth",
    crumb: "A width, not a point",
    paras: [
      "There is no place to finish. The estuary is a width, not a point. I stood on a spit that the map still called land and watched the water become something that did not care about the Lum as a name.",
      "I took the bus inland because that is how you leave an estuary. A woman with a trolley asked if I had been on holiday. I said I had been walking. She said it was a funny place to walk. I agreed.",
      "I do not feel finished. I feel like a person who has been wet for a long time. The house will still be the house. David will still be David. The river will be this colour tomorrow, which is not a comfort and not an injury. It is just the fact I walked next to.",
    ],
  },
];

export const DAYS_KEPT = STATIONS.filter((s) => s.kind === "day");

export const LANDSCAPES: {
  id: Station["landscape"];
  label: string;
  fromKm: number;
}[] = [
  { id: "moor", label: "moor", fromKm: 0 },
  { id: "farms", label: "farms", fromKm: 18 },
  { id: "mill", label: "mill town", fromKm: 48 },
  { id: "city", label: "city", fromKm: 72 },
  { id: "docks", label: "docks", fromKm: 108 },
  { id: "marsh", label: "salt marsh", fromKm: 124 },
];

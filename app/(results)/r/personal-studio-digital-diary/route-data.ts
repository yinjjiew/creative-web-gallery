/**
 * The route. Nine places, in the order they are walked, with the minute of the
 * walk each one falls at. The walk is the same every morning, which is the
 * whole point: these nine are the only places anything can happen.
 *
 * `at` is minutes from the front door. It is what makes the route an axis you
 * can measure along rather than just a list of names.
 */
export type StationId =
  | "step"
  | "ginnel"
  | "towpath"
  | "bridge41"
  | "iron"
  | "veritys"
  | "pool"
  | "footbridge"
  | "back";

export type Station = {
  id: StationId;
  /** How she refers to it in the notes. */
  name: string;
  /** Minutes from the front door. */
  at: number;
  /** Fixed description of the place — true on every one of the mornings. */
  standing: string;
};

export const STATIONS: Station[] = [
  {
    id: "step",
    name: "the step",
    at: 0,
    standing:
      "Two steps down onto Alma Street. Whatever the weather is doing, this is where I find out.",
  },
  {
    id: "ginnel",
    name: "the ginnel",
    at: 2,
    standing:
      "The alley between 41 and 43, down to the water. Bins, moss, a bike frame nobody has ever come back for.",
  },
  {
    id: "towpath",
    name: "the towpath",
    at: 3,
    standing:
      "Left at the bottom, onto the cut. From here to the footbridge it is one straight line of water.",
  },
  {
    id: "bridge41",
    name: "bridge 41",
    at: 5,
    standing:
      "Brick, low, and it drips whatever the sky is doing. Four strides through and out.",
  },
  {
    id: "iron",
    name: "the iron bridge",
    at: 7,
    standing:
      "The railway crosses on green girders. The 06:52 goes over it, or it doesn't.",
  },
  {
    id: "veritys",
    name: "Verity's",
    at: 9,
    standing:
      "Scrap metal merchants. A crane, a magnet, a yard of dead cars, and a dog on a chain.",
  },
  {
    id: "pool",
    name: "the pool",
    at: 11,
    standing:
      "Where the cut widens above the lock. Reeds on the far side. This is the heron's, when he is in.",
  },
  {
    id: "footbridge",
    name: "Ladyshaw footbridge",
    at: 12,
    standing:
      "The turn. Eleven steps up, over, eleven down, and home on the other bank.",
  },
  {
    id: "back",
    name: "the far bank",
    at: 14,
    standing:
      "Back the other way, with the backs of the houses on my right and the yard behind its fence on my left.",
  },
];

export const STATION_BY_ID: Record<StationId, Station> = Object.fromEntries(
  STATIONS.map((s) => [s.id, s]),
) as Record<StationId, Station>;

/**
 * A modelled Open City weekend, not the official 2026 programme.
 *
 * Twenty-two doors plus five talks, authored so a route can tell the truth:
 * some places are only one day, some are forty minutes apart, some queue
 * past closing. Times, walks and waits are invented for the mechanic.
 * Provenance is stated on the page.
 */

export type DayId = "sat" | "sun";

export type Hours = { open: number; close: number };

export type District =
  | "lea"
  | "dock"
  | "civic"
  | "north"
  | "south"
  | "west"
  | "east"
  | "outer"
  | "far";

export type Calibre = "extraordinary" | "hour" | "fifteen";

export type Booking = "none" | "advised" | "required";

export type Building = {
  id: string;
  name: string;
  kind: string;
  district: District;
  why: string;
  calibre: Calibre;
  sat: Hours | null;
  sun: Hours | null;
  visit: number;
  queue: number;
  booking: Booking;
  capacity: string;
  access: {
    stepFree: boolean;
    summary: string;
    detail: string;
  };
  how: string;
};

export type Talk = {
  id: string;
  title: string;
  venue: string;
  district: District;
  day: DayId;
  start: number;
  duration: number;
  why: string;
};

export const DAY_START = 9 * 60;
export const DAY_END = 18 * 60;
export const WEEKEND = "13–14 September 2026";

export const DISTRICTS: Record<District, string> = {
  lea: "Lea Valley",
  dock: "The docks",
  civic: "The civic core",
  north: "North",
  south: "South",
  west: "West",
  east: "East",
  outer: "Outer north",
  far: "Forty minutes out",
};

/** Saturday public-transport minutes, authored. Intra-district is 8. */
const TRAVEL: Record<District, Record<District, number>> = {
  lea: { lea: 8, dock: 22, civic: 28, north: 35, south: 48, west: 50, east: 18, outer: 40, far: 55 },
  dock: { lea: 22, dock: 8, civic: 22, north: 38, south: 35, west: 42, east: 20, outer: 45, far: 48 },
  civic: { lea: 28, dock: 22, civic: 8, north: 22, south: 28, west: 30, east: 18, outer: 38, far: 50 },
  north: { lea: 35, dock: 38, civic: 22, north: 8, south: 42, west: 28, east: 25, outer: 22, far: 55 },
  south: { lea: 48, dock: 35, civic: 28, north: 42, south: 8, west: 38, east: 32, outer: 50, far: 40 },
  west: { lea: 50, dock: 42, civic: 30, north: 28, south: 38, west: 8, east: 35, outer: 35, far: 60 },
  east: { lea: 18, dock: 20, civic: 18, north: 25, south: 32, west: 35, east: 8, outer: 32, far: 45 },
  outer: { lea: 40, dock: 45, civic: 38, north: 22, south: 50, west: 35, east: 32, outer: 8, far: 50 },
  far: { lea: 55, dock: 48, civic: 50, north: 55, south: 40, west: 60, east: 45, outer: 50, far: 8 },
};

export function travelMin(a: District, b: District): number {
  return TRAVEL[a][b];
}

export const BUILDINGS: Building[] = [
  {
    id: "pumps",
    name: "Lea Bridge Pumping Station",
    kind: "Working sewage works, 1868",
    district: "lea",
    why: "The engine house is the size of a parish church and still smells faintly of the river. You will not get this from the street.",
    calibre: "extraordinary",
    sat: { open: 10 * 60, close: 17 * 60 },
    sun: { open: 10 * 60, close: 16 * 60 },
    visit: 45,
    queue: 25,
    booking: "none",
    capacity: "Eighty at a time in the engine hall.",
    access: {
      stepFree: false,
      summary: "Not step-free. Many stairs, wet floors, no lift.",
      detail:
        "Entry is a stone stair into the basement. The engine hall has a gallery reached by a further iron stair. No lift, no step-free WC. Seats in the hall if you need to stop.",
    },
    how: "Overground to Lea Bridge, then twelve minutes on the towpath. Last entry forty minutes before close.",
  },
  {
    id: "bunker",
    name: "North Weald Bunker",
    kind: "Nuclear-era civil defence rooms",
    district: "far",
    why: "A three-storey hole under a field. The operations room is still labelled for a war that did not happen. Saturday only — they will not open it twice.",
    calibre: "extraordinary",
    sat: { open: 10 * 60, close: 16 * 60 },
    sun: null,
    visit: 60,
    queue: 90,
    booking: "required",
    capacity: "Guided groups of twenty. Unbooked, the queue is the visit.",
    access: {
      stepFree: false,
      summary: "Not step-free. Long stair, confined rooms, no lift.",
      detail:
        "A hundred and twenty steps down, the same back up. Corridors are narrow and low. No step-free route exists. Not suitable if you cannot do stairs, and hard if you dislike confined spaces.",
    },
    how: "Central line to Epping, then a bus that runs twice an hour on Saturday. Forty to fifty-five minutes from the civic core. Book; the desk stops taking walk-ups at two.",
  },
  {
    id: "carradale",
    name: "Carradale House, a maisonette",
    kind: "Brutalist tower, east",
    district: "east",
    why: "Goldfinger's slightly less famous neighbour. The maisonette is ordinary and the view is not. Forty minutes is enough; the queue is not.",
    calibre: "extraordinary",
    sat: { open: 11 * 60, close: 17 * 60 },
    sun: { open: 11 * 60, close: 17 * 60 },
    visit: 40,
    queue: 60,
    booking: "advised",
    capacity: "One flat. Twelve people inside at once.",
    access: {
      stepFree: false,
      summary: "Lift to the landing. The maisonette itself is stairs.",
      detail:
        "A working lift to the access deck. Inside: a stair between the two floors of the maisonette, a narrow kitchen, no step-free WC. The deck and the view are available without entering the flat.",
    },
    how: "DLR to Langdon Park, eight minutes walk. Book a slot if you can; walk-up is a one-hour queue most of Saturday.",
  },
  {
    id: "tower",
    name: "West Norwood Water Tower",
    kind: "Victorian standpipe tower",
    district: "south",
    why: "A nice fifteen minutes if you like a view and a spiral stair. A wasted journey if you arrive at four on Saturday — it is Sunday only.",
    calibre: "hour",
    sat: null,
    sun: { open: 10 * 60, close: 16 * 60 },
    visit: 30,
    queue: 15,
    booking: "none",
    capacity: "Twenty on the stair at a time.",
    access: {
      stepFree: false,
      summary: "Not step-free. 180 steps, no lift, no landing chairs.",
      detail:
        "A tight spiral to the tank floor. No lift, no alternative. If you cannot do stairs this is not for you — the ground-floor pump room is closed this year.",
    },
    how: "Southern to West Norwood, six minutes walk. Sunday only. Last entry at half past three.",
  },
  {
    id: "erith",
    name: "Erith Engine House",
    kind: "Beam-engine cathedral, far east",
    district: "far",
    why: "The other sewage cathedral. Larger than Lea Bridge, further away, Saturday only. Do not pair it with the bunker unless you are staying out east.",
    calibre: "extraordinary",
    sat: { open: 10 * 60, close: 17 * 60 },
    sun: null,
    visit: 50,
    queue: 20,
    booking: "none",
    capacity: "A hundred in the engine house.",
    access: {
      stepFree: false,
      summary: "Ground hall is step-free. The beam floor is a stair.",
      detail:
        "The great hall is level from the yard. The upper beam floor is a steep iron stair with a handrail, no lift. Accessible WC in the yard.",
    },
    how: "Elizabeth line to Abbey Wood, then a bus. Fifty minutes from the civic core. Saturday only.",
  },
  {
    id: "isokon",
    name: "Lawn Road, a flat",
    kind: "Isokon flats, 1934",
    district: "north",
    why: "A small plywood interior and a long argument about how to live. Worth an hour. The building is the point, not the furniture.",
    calibre: "hour",
    sat: { open: 10 * 60, close: 17 * 60 },
    sun: { open: 10 * 60, close: 17 * 60 },
    visit: 30,
    queue: 10,
    booking: "none",
    capacity: "Eight in the flat.",
    access: {
      stepFree: false,
      summary: "Stairs only. No lift in the block.",
      detail:
        "Two flights from the street to the open flat. No lift. A resident's ground-floor studio is not on the route this year.",
    },
    how: "Northern line to Belsize Park, five minutes walk up the hill.",
  },
  {
    id: "highbury",
    name: "A house on Highbury Fields",
    kind: "Private Georgian terrace, 1840",
    district: "north",
    why: "Fifteen minutes of someone else's life: a stair, a piano, a garden the width of the house. Do not build a morning around it.",
    calibre: "fifteen",
    sat: { open: 10 * 60, close: 16 * 60 },
    sun: { open: 10 * 60, close: 16 * 60 },
    visit: 20,
    queue: 5,
    booking: "none",
    capacity: "Ten at a time. The owner is in the kitchen.",
    access: {
      stepFree: false,
      summary: "Steps to the door. No downstairs WC.",
      detail:
        "Five steps from the pavement. All rooms on the piano nobile and up. No downstairs toilet. A chair in the hall if you need to stop.",
    },
    how: "Victoria line to Highbury & Islington, eight minutes walk across the fields.",
  },
  {
    id: "clinic",
    name: "Pine Street Clinic",
    kind: "Municipal health centre, 1938",
    district: "north",
    why: "Lubetkin's argument in brick and glass: that a clinic should be a pleasure to enter. Saturday only, no queue, step-free. Use it as a hinge.",
    calibre: "hour",
    sat: { open: 10 * 60, close: 16 * 60 },
    sun: null,
    visit: 25,
    queue: 0,
    booking: "none",
    capacity: "Open floor. No limit worth planning around.",
    access: {
      stepFree: true,
      summary: "Step-free throughout. Accessible WC.",
      detail:
        "Level from the street. Original ramps still work. Accessible WC. A few original doors are heavy; staff will hold them.",
    },
    how: "Northern line to Angel, ten minutes walk. Saturday only — the clinic works on Sunday.",
  },
  {
    id: "mosque",
    name: "Al-Huda, Whitechapel",
    kind: "A working mosque that opens its doors",
    district: "east",
    why: "The prayer hall is the building. Go for the space, not for a tour of 'otherness'. Closed from three for the afternoon prayer.",
    calibre: "hour",
    sat: { open: 10 * 60, close: 15 * 60 },
    sun: { open: 10 * 60, close: 15 * 60 },
    visit: 30,
    queue: 0,
    booking: "none",
    capacity: "The hall holds two hundred. You will not queue.",
    access: {
      stepFree: true,
      summary: "Step-free prayer hall. Gallery is stairs.",
      detail:
        "Level entrance to the main hall and an accessible WC. The women's gallery is a stair. Shoes off; chairs are available.",
    },
    how: "District or Hammersmith & City to Whitechapel, four minutes walk. Last entry half past two. Dress modestly.",
  },
  {
    id: "asylum",
    name: "Colney Hatch Chapel",
    kind: "Former asylum chapel, outer north",
    district: "outer",
    why: "A vast, emptied nave in the middle of a housing estate that used to be a hospital. Sunday only. Extraordinary if you have the afternoon.",
    calibre: "extraordinary",
    sat: null,
    sun: { open: 11 * 60, close: 16 * 60 },
    visit: 40,
    queue: 20,
    booking: "none",
    capacity: "The nave holds a crowd. The porch does not.",
    access: {
      stepFree: false,
      summary: "Uneven ground, one step at the door, no WC.",
      detail:
        "A gravel path from the estate road. One stone step into the nave. No toilet on site. Wheelchair users have managed the path with help; there is no guaranteed step-free route.",
    },
    how: "Piccadilly line to Arnos Grove, then a bus. Sunday only. Thirty-five minutes from King's Cross.",
  },
  {
    id: "civicbunker",
    name: "Civic Centre basement",
    kind: "Cold-war rooms under a town hall",
    district: "civic",
    why: "Not the North Weald hole. A set of rooms under a working building, open from noon. The queue is the risk — it eats the afternoon.",
    calibre: "hour",
    sat: { open: 12 * 60, close: 17 * 60 },
    sun: { open: 12 * 60, close: 16 * 60 },
    visit: 35,
    queue: 40,
    booking: "advised",
    capacity: "Guided groups of fifteen.",
    access: {
      stepFree: false,
      summary: "Not step-free. Two stair flights, confined.",
      detail:
        "Staff entrance, then two flights down. No lift to the basement. Rooms are small. Not for anyone who cannot do stairs.",
    },
    how: "Any line to the civic core. Opens at noon both days. Book a noon slot or expect forty minutes in the yard.",
  },
  {
    id: "debeauvoir",
    name: "An architect's house, De Beauvoir",
    kind: "The architect still lives here",
    district: "east",
    why: "A converted workshop and a very specific kitchen. Fifteen minutes. Pair it with the mosque or the weaver's house, not with Erith.",
    calibre: "fifteen",
    sat: { open: 10 * 60, close: 17 * 60 },
    sun: { open: 10 * 60, close: 17 * 60 },
    visit: 20,
    queue: 15,
    booking: "none",
    capacity: "Six in the house.",
    access: {
      stepFree: false,
      summary: "Workshop floor is step-free. The house is a stair.",
      detail:
        "The ground-floor workshop is level from the mews. The living floors are a steep stair, no lift, no downstairs WC.",
    },
    how: "Overground to Haggerston, seven minutes walk.",
  },
  {
    id: "nunhead",
    name: "An architect's house, Nunhead",
    kind: "The architect still lives here",
    district: "south",
    why: "A rear extension that is better than the house. Saturday only. Fifteen minutes, then you are in the south and the water tower is tomorrow.",
    calibre: "fifteen",
    sat: { open: 11 * 60, close: 16 * 60 },
    sun: null,
    visit: 20,
    queue: 10,
    booking: "none",
    capacity: "Eight.",
    access: {
      stepFree: false,
      summary: "Steps from the street. No downstairs WC.",
      detail: "Four steps to the hall. The advertised extension is two steps down from the kitchen. No downstairs toilet.",
    },
    how: "Overground to Nunhead. Saturday only.",
  },
  {
    id: "muswell",
    name: "An architect's house, Muswell Hill",
    kind: "The architect still lives here",
    district: "north",
    why: "Sunday only, and only until three. A timber room in a garden. Do not leave the bunker for this — you cannot; the bunker is Saturday.",
    calibre: "fifteen",
    sat: null,
    sun: { open: 10 * 60, close: 15 * 60 },
    visit: 20,
    queue: 5,
    booking: "none",
    capacity: "Six.",
    access: {
      stepFree: true,
      summary: "Level from the side gate to the garden room.",
      detail:
        "The house is not open. The garden room is level from a side gate on the lane. Accessible WC in the house if you ask.",
    },
    how: "Northern line to Highgate, then a hill. Sunday only, last entry half past two.",
  },
  {
    id: "southmere",
    name: "Southmere, a walk-up",
    kind: "Brutalist estate, Thamesmead",
    district: "far",
    why: "The lake, the deck, a maisonette that is still a home. Extraordinary, and forty minutes from everywhere else. Make it a morning or do not go.",
    calibre: "extraordinary",
    sat: { open: 10 * 60, close: 17 * 60 },
    sun: { open: 10 * 60, close: 16 * 60 },
    visit: 45,
    queue: 15,
    booking: "none",
    capacity: "The deck is open. The flat holds ten.",
    access: {
      stepFree: true,
      summary: "Step-free on the ground deck. The maisonette is stairs.",
      detail:
        "The lakeside deck and the community room are step-free. The open maisonette is a walk-up, no lift. Accessible WC in the community room.",
    },
    how: "Elizabeth line to Abbey Wood, then a bus around the lake. Pair with Erith on Saturday if you stay east.",
  },
  {
    id: "crypt",
    name: "Ambulatory under the Guildhall",
    kind: "Medieval undercroft, civic core",
    district: "civic",
    why: "Worth an hour if you are already in the core. Not worth a crossing from the bunker. The stair is the whole visit for some people.",
    calibre: "hour",
    sat: { open: 10 * 60, close: 16 * 60 },
    sun: { open: 10 * 60, close: 16 * 60 },
    visit: 25,
    queue: 20,
    booking: "none",
    capacity: "Forty in the undercroft.",
    access: {
      stepFree: false,
      summary: "Stairs only. No lift to the undercroft.",
      detail:
        "A stone stair from the yard. No lift. The Guildhall itself is not on the route. Benches at the bottom.",
    },
    how: "Central or Northern to Bank, five minutes walk.",
  },
  {
    id: "bake",
    name: "Columbia bakehouse",
    kind: "A working bakery in a Georgian terrace",
    district: "east",
    why: "Fifteen minutes, and only in the morning. If you arrive after one it is bread, not a building.",
    calibre: "fifteen",
    sat: { open: 9 * 60, close: 13 * 60 },
    sun: { open: 9 * 60, close: 13 * 60 },
    visit: 15,
    queue: 5,
    booking: "none",
    capacity: "The shop holds twelve.",
    access: {
      stepFree: true,
      summary: "Step-free shop floor. The cellar is closed.",
      detail: "Level from the street. The ovens are visible from the shop. Cellar not open. No public WC.",
    },
    how: "Overground to Hoxton, five minutes walk. Closes at one both days.",
  },
  {
    id: "gate",
    name: "Clerkenwell gatehouse",
    kind: "Tudor gate, still a rooms-above",
    district: "civic",
    why: "A hinge in the civic core. Thirty minutes, a small museum, a stair to a room that was a prison.",
    calibre: "hour",
    sat: { open: 10 * 60, close: 17 * 60 },
    sun: { open: 10 * 60, close: 17 * 60 },
    visit: 30,
    queue: 10,
    booking: "none",
    capacity: "Twenty.",
    access: {
      stepFree: false,
      summary: "Ground room step-free. The prison room is a stair.",
      detail:
        "The reception and a ground exhibition are level. The historic rooms are a spiral stair, no lift. Accessible WC on the ground floor.",
    },
    how: "Farringdon, six minutes walk. Both days.",
  },
  {
    id: "warehouse",
    name: "A warehouse that is still a warehouse",
    kind: "Working store, Millwall",
    district: "dock",
    why: "No conversion, no café. The point is the shed: timber, light from the north, a forklift that will not stop for you.",
    calibre: "fifteen",
    sat: { open: 11 * 60, close: 18 * 60 },
    sun: { open: 11 * 60, close: 17 * 60 },
    visit: 20,
    queue: 0,
    booking: "none",
    capacity: "The floor is large. Stay out of the marked aisle.",
    access: {
      stepFree: true,
      summary: "Level yard and floor. No public WC.",
      detail:
        "Yard is tarmac, floor is level. High-vis is provided. No public toilet. Forklifts have priority; stay in the visitor lane.",
    },
    how: "DLR to Mudchute, ten minutes walk. Opens at eleven.",
  },
  {
    id: "palace",
    name: "Palace theatre, the flies",
    kind: "Backstage, Alexandra Palace",
    district: "north",
    why: "A Victorian fly tower and a view west. Saturday only. The queue is real after lunch. The hill is part of the travel time.",
    calibre: "hour",
    sat: { open: 10 * 60, close: 16 * 60 },
    sun: null,
    visit: 40,
    queue: 30,
    booking: "advised",
    capacity: "Groups of sixteen on the grid.",
    access: {
      stepFree: false,
      summary: "Not step-free. Many stairs, no lift to the grid.",
      detail:
        "The auditorium can be seen from a step-free door. The advertised visit is the flies: several steep stairs, no lift, a grid with a drop. If you cannot do stairs, skip this.",
    },
    how: "Overground to Alexandra Palace, then the hill, or the free shuttle on the hour. Saturday only.",
  },
  {
    id: "weaver",
    name: "A weaver's house, Spitalfields",
    kind: "Private Georgian house, still lived in",
    district: "east",
    why: "Tiny, famous, and the queue is the whole afternoon if you go at two. Fifteen minutes inside. Go at ten or do not go.",
    calibre: "fifteen",
    sat: { open: 10 * 60, close: 17 * 60 },
    sun: { open: 10 * 60, close: 17 * 60 },
    visit: 20,
    queue: 45,
    booking: "none",
    capacity: "Eight inside. The street holds the rest.",
    access: {
      stepFree: false,
      summary: "Stairs only. No downstairs WC.",
      detail:
        "A step from the street, then stairs to every room that is open. No lift, no downstairs toilet. The parlour doorway is narrow.",
    },
    how: "Liverpool Street or Aldgate East, six minutes walk. The queue starts on Folgate Street.",
  },
  {
    id: "control",
    name: "Riverside control room",
    kind: "Decommissioned power-station desk",
    district: "dock",
    why: "A room of dead dials the size of a classroom. Extraordinary, booked, and it closes at three. Do not leave it until last.",
    calibre: "extraordinary",
    sat: { open: 10 * 60, close: 15 * 60 },
    sun: { open: 10 * 60, close: 15 * 60 },
    visit: 35,
    queue: 20,
    booking: "required",
    capacity: "Booked groups of twelve. No walk-up after twelve.",
    access: {
      stepFree: false,
      summary: "Metal stair. No lift. Confined gantry.",
      detail:
        "A metal stair from the turbine hall (itself not open). No lift. The gantry around the desk is narrow. Not step-free, not for anyone unsteady on stairs.",
    },
    how: "DLR to Pontoon Dock. Book. Last booked entry at two; the room is dark at three.",
  },
];

export const TALKS: Talk[] = [
  {
    id: "doors",
    title: "Why we open the doors",
    venue: "Clerkenwell gatehouse, the ground room",
    district: "civic",
    day: "sat",
    start: 11 * 60,
    duration: 45,
    why: "The festival's own argument, forty-five minutes, booked. You will be in the civic core at eleven; the pumping station will have to wait.",
  },
  {
    id: "estate",
    title: "Walking the deck at Southmere",
    venue: "Southmere community room",
    district: "far",
    day: "sat",
    start: 14 * 60,
    duration: 60,
    why: "A booked hour on the estate. If you are already at Southmere it is the point of going. If you are in the bunker at two, you will not make it.",
  },
  {
    id: "sewage",
    title: "Sewage and the city",
    venue: "Lea Bridge Pumping Station",
    district: "lea",
    day: "sat",
    start: 16 * 60,
    duration: 40,
    why: "In the engine hall at four. Last entry to the station is earlier if you only want to walk around; the talk is a seat.",
  },
  {
    id: "tank",
    title: "Saving the water tower",
    venue: "West Norwood Water Tower, ground",
    district: "south",
    day: "sun",
    start: 11 * 60 + 30,
    duration: 45,
    why: "Sunday, half eleven, at the tower you came for. Book. The spiral opens again after.",
  },
  {
    id: "listed",
    title: "Living in a listed house",
    venue: "The house on Highbury Fields",
    district: "north",
    day: "sun",
    start: 14 * 60,
    duration: 40,
    why: "The owner, forty minutes, booked. The house is also open as a walk-through; do not try to do both in the same slot.",
  },
];

export const BUILDING_BY_ID: Record<string, Building> = Object.fromEntries(
  BUILDINGS.map((b) => [b.id, b]),
);

export const TALK_BY_ID: Record<string, Talk> = Object.fromEntries(
  TALKS.map((t) => [t.id, t]),
);

export function hoursOn(b: Building, day: DayId): Hours | null {
  return day === "sat" ? b.sat : b.sun;
}

export function calibreLabel(c: Calibre): string {
  if (c === "extraordinary") return "Get in";
  if (c === "hour") return "Worth an hour";
  return "Fifteen minutes";
}

export function fmt(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function bookingLabel(b: Booking): string {
  if (b === "required") return "Book";
  if (b === "advised") return "Book if you can";
  return "No booking";
}

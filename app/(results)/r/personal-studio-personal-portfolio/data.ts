/**
 * A modelled archive. Places are real. Dates, durations, stillness and the
 * sought/found notes are written for this site. Catalogue numbers are stable
 * so a music supervisor can quote them.
 */

export type Kind =
  | "water"
  | "wind"
  | "ice"
  | "foliage"
  | "birds"
  | "insects"
  | "urban"
  | "interior"
  | "mechanical"
  | "rain"
  | "voices"
  | "rural";

export type Season = "winter" | "spring" | "summer" | "autumn";

export type Place = {
  id: string;
  name: string;
  region: string;
  lat: number;
  lon: number;
  kind: Kind;
};

export type Recording = {
  id: string;
  cat: string;
  placeId: string;
  place: string;
  region: string;
  lat: number;
  lon: number;
  date: string;
  year: number;
  month: number;
  day: number;
  yearday: number;
  hour: number;
  minute: number;
  hourFrac: number;
  durationMin: number;
  stillnessMin: number;
  impressionSec: number;
  kind: Kind;
  sought: string;
  found: string;
};

export type Filter = {
  placeId?: string;
  season?: Season;
  hour?: number;
  kind?: Kind;
  year?: number;
  q?: string;
};

export const KIND_LABEL: Record<Kind, string> = {
  water: "water",
  wind: "wind",
  ice: "ice",
  foliage: "leaves",
  birds: "birds",
  insects: "insects",
  urban: "traffic",
  interior: "rooms",
  mechanical: "machines",
  rain: "rain",
  voices: "voices, distant",
  rural: "open country",
};

export const SEASONS: Season[] = ["winter", "spring", "summer", "autumn"];

export const SEASON_MONTHS: Record<Season, number[]> = {
  winter: [12, 1, 2],
  spring: [3, 4, 5],
  summer: [6, 7, 8],
  autumn: [9, 10, 11],
};

export const PLACES: Place[] = [
  { id: "cley", name: "Cley hedgerow", region: "Norfolk, England", lat: 52.954, lon: 1.057, kind: "foliage" },
  { id: "dubh", name: "Dubh Lochan", region: "Cairngorms, Scotland", lat: 57.078, lon: -3.668, kind: "ice" },
  { id: "silo", name: "Willingham silo", region: "Lincolnshire, England", lat: 53.311, lon: -0.689, kind: "interior" },
  { id: "hanoi", name: "Nguyễn Du & Bà Triệu", region: "Hanoi, Vietnam", lat: 21.017, lon: 105.847, kind: "urban" },
  { id: "hackney", name: "Kitchen window, London Fields", region: "London, England", lat: 51.542, lon: -0.061, kind: "birds" },
  { id: "ely", name: "Ely Cathedral, nave", region: "Cambridgeshire, England", lat: 52.399, lon: 0.264, kind: "interior" },
  { id: "minch", name: "Ullapool–Stornoway ferry", region: "The Minch, Scotland", lat: 58.12, lon: -5.72, kind: "mechanical" },
  { id: "uig", name: "Bothy above Uig sands", region: "Isle of Lewis, Scotland", lat: 58.17, lon: -7.02, kind: "wind" },
  { id: "jokul", name: "Jökulsárlón foreshore", region: "Iceland", lat: 64.078, lon: -16.23, kind: "ice" },
  { id: "sensa", name: "Rio della Sensa", region: "Venice, Italy", lat: 45.446, lon: 12.331, kind: "water" },
  { id: "tofuku", name: "Tōfuku-ji, after rain", region: "Kyoto, Japan", lat: 34.977, lon: 135.774, kind: "rain" },
  { id: "karakoy", name: "Karaköy landing", region: "Istanbul, Turkey", lat: 41.023, lon: 28.975, kind: "voices" },
  { id: "perito", name: "Perito Moreno, east edge", region: "Santa Cruz, Argentina", lat: -50.473, lon: -73.035, kind: "ice" },
  { id: "round", name: "Roundstone bog", region: "Connemara, Ireland", lat: 53.395, lon: -9.918, kind: "wind" },
  { id: "alley", name: "Service alley, Shinjuku", region: "Tokyo, Japan", lat: 35.69, lon: 139.7, kind: "urban" },
  { id: "organ", name: "Organ Pipe, north bajada", region: "Arizona, USA", lat: 31.954, lon: -112.8, kind: "wind" },
  { id: "tarkine", name: "Tarkine, Arthur River track", region: "Tasmania, Australia", lat: -41.05, lon: 144.84, kind: "foliage" },
  { id: "graca", name: "Calçada da Graça, tram 28", region: "Lisbon, Portugal", lat: 38.716, lon: -9.131, kind: "mechanical" },
  { id: "azhar", name: "Al-Azhar courtyard", region: "Cairo, Egypt", lat: 30.046, lon: 31.262, kind: "voices" },
  { id: "capilano", name: "Capilano, second-growth", region: "Vancouver, Canada", lat: 49.353, lon: -123.115, kind: "rain" },
  { id: "gwang", name: "Gwangjang, last stall", region: "Seoul, South Korea", lat: 37.57, lon: 126.999, kind: "voices" },
  { id: "auffes", name: "Vallon des Auffes", region: "Marseille, France", lat: 43.285, lon: 5.347, kind: "water" },
  { id: "mala", name: "Courtyard, Malá Strana", region: "Prague, Czechia", lat: 50.088, lon: 14.403, kind: "interior" },
  { id: "u8", name: "U8, Alexanderplatz overrun", region: "Berlin, Germany", lat: 52.522, lon: 13.413, kind: "mechanical" },
  { id: "lakeL", name: "Lake Street L, underside", region: "Chicago, USA", lat: 41.885, lon: -87.648, kind: "urban" },
  { id: "dinorwic", name: "Dinorwic, gallery 2", region: "Gwynedd, Wales", lat: 53.121, lon: -4.115, kind: "wind" },
  { id: "kinder", name: "Kinderdijk, pump house", region: "South Holland, Netherlands", lat: 51.886, lon: 4.639, kind: "mechanical" },
  { id: "hvide", name: "Hvide Sande, dune fence", region: "West Jutland, Denmark", lat: 56.004, lon: 8.125, kind: "wind" },
  { id: "ryvoan", name: "Ryvoan bothy", region: "Cairngorms, Scotland", lat: 57.177, lon: -3.646, kind: "interior" },
  { id: "hives", name: "Hives, Macknade", region: "Kent, England", lat: 51.308, lon: 0.908, kind: "insects" },
  { id: "bl", name: "Humanities 1, British Library", region: "London, England", lat: 51.53, lon: -0.127, kind: "interior" },
  { id: "lido", name: "London Fields Lido, empty", region: "London, England", lat: 51.542, lon: -0.057, kind: "interior" },
  { id: "dungeness", name: "Dungeness foreshore", region: "Kent, England", lat: 50.913, lon: 0.973, kind: "wind" },
  { id: "grant", name: "Grantchester meadow", region: "Cambridgeshire, England", lat: 52.179, lon: 0.093, kind: "rural" },
  { id: "homerton", name: "Homerton, ward corridor", region: "London, England", lat: 51.551, lon: -0.046, kind: "interior" },
  { id: "fitzroy", name: "Brunswick St tram stop", region: "Melbourne, Australia", lat: -37.798, lon: 144.978, kind: "urban" },
  { id: "grate", name: "Grate, 23rd & Sixth", region: "New York, USA", lat: 40.743, lon: -73.991, kind: "urban" },
  { id: "chefch", name: "Alley off Place Outa el-Hammam", region: "Chefchaouen, Morocco", lat: 35.171, lon: -5.264, kind: "urban" },
  { id: "advent", name: "Adventfjorden ice edge", region: "Svalbard, Norway", lat: 78.227, lon: 15.598, kind: "ice" },
  { id: "howrah", name: "Howrah approach, river side", region: "Kolkata, India", lat: 22.585, lon: 88.347, kind: "urban" },
  { id: "valpa", name: "Cerro Alegre funicular", region: "Valparaíso, Chile", lat: -33.044, lon: -71.628, kind: "mechanical" },
  { id: "abanot", name: "Abanotubani, before opening", region: "Tbilisi, Georgia", lat: 41.688, lon: 44.811, kind: "voices" },
  { id: "frogner", name: "Frognerkilen ice", region: "Oslo, Norway", lat: 59.912, lon: 10.705, kind: "ice" },
  { id: "quay", name: "Boat Quay, before clerks", region: "Singapore", lat: 1.287, lon: 103.849, kind: "urban" },
  { id: "oaxaca", name: "Mercado 20 de Noviembre, closing", region: "Oaxaca, Mexico", lat: 17.06, lon: -96.725, kind: "voices" },
  { id: "maas", name: "Maasvlakte, berth 4", region: "Rotterdam, Netherlands", lat: 51.943, lon: 4.061, kind: "mechanical" },
  { id: "amman", name: "Jabal Amman stair", region: "Amman, Jordan", lat: 31.952, lon: 35.924, kind: "urban" },
  { id: "faro", name: "Ria Formosa, tide gate", region: "Algarve, Portugal", lat: 37.034, lon: -7.84, kind: "water" },
];

const PLACE = Object.fromEntries(PLACES.map((p) => [p.id, p])) as Record<string, Place>;

const HEDGE: [string, string][] = [
  ["The same gap. January. I wanted the hedge without the road.", "The road is in it. A wren used the gap as a door for eleven minutes."],
  ["Blackthorn still bare. After the wind in the wires.", "The wires won. I kept the take because the wind had a metre."],
  ["First green. I wanted the change, not the birds.", "A yellowhammer started and I did not stop it. The change is under him."],
  ["April gap after rain. The drip off the blackthorn.", "A tractor two fields over. I left it. The drip is still the take."],
  ["May, same hour, same stake in the ground.", "Cow parsley now. The stake hummed. I had forgotten I could hear it."],
  ["Midsummer. I wanted less. The hedge is too full.", "I got less by waiting. Eight minutes of almost nothing, then a hare."],
  ["July flies. I came for the flies.", "They arrived late. Before that, a single woodpigeon on one note."],
  ["Harvest starting. I wanted the hedge to ignore it.", "It did not. A combine on the far side, then the gap again, thinner."],
  ["First true autumn in the leaves.", "A school bus at 7:11. After it, the leaves were what I came for."],
  ["Wet October. The same drip as April, different wood.", "A pheasant burst. I flinched and stayed. The drip resumed."],
  ["Bare again, almost. I wanted the year audible in one gap.", "What I got was a dog, then silence with a different weight."],
  ["December. I came to close the year in the same place.", "Frost on the thorn. My own coat. I left the coat in."],
  ["Second January. Same gap. I wanted to hear if I remembered it.", "I had remembered the wren and not the road. The road is still there."],
  ["Storm week. I wanted the gap as a mouth.", "It was a mouth. A tile came off a roof I cannot see."],
  ["The green again. I was after last year's yellowhammer.", "A different bird. Same perch. I wrote the wrong name on the slate and crossed it out."],
  ["Rain in the blackthorn, second April.", "No tractor. I missed it, which is not a useful note, and then the drip."],
  ["Cow parsley again. I wanted the stake.", "The stake had been pulled. The hole held water. That is the take."],
  ["I came to wait longer than last June.", "Twenty-two minutes. A hare again, or the same hare, which I cannot know."],
  ["Flies. Second July. I wanted them closer.", "They landed on the windshield. I am in the take as a presence."],
  ["Harvest, second time. I wanted the combine further.", "It was further. The hedge had more room. A cicada I did not expect this far north."],
  ["Leaves turning. I wanted the year without a bus.", "No bus. A bicycle bell, which is worse, and then the leaves."],
  ["Wet again. I came for the pheasant and hoped I would not get it.", "No pheasant. A man on the phone in the lane, walking through."],
  ["Almost bare. I wanted the silence with the weight I wrote down last year.", "The weight was a weather, not a silence. It is in the low end."],
  ["Last month of the two years. I wanted to stop.", "I rolled for twelve minutes and did stop. The gap sounded like a gap."],
];

const HANOI: [string, string][] = [
  ["The junction before scooters. Four in the morning.", "Scooters anyway, three of them, then a long empty that is the take."],
  ["Same corner, 4:10. I wanted the empty without the three.", "A plastic bag in the wire. The empty is under it."],
  ["I came back at 3:40 to be earlier than the bag.", "A radio from a fourth-floor window. Vietnamese pop, very small."],
  ["After rain. I wanted tyres on wet tile, not engines.", "One engine. Many tyres. A man hosing the step of a shop that was not open."],
  ["Noon, to hear what I had been avoiding.", "I lasted six minutes. The take is an argument for the morning ones."],
  ["Four again. I wanted the plastic bag gone.", "Gone. A cat. The empty is cleaner and less interesting."],
  ["Last night of the first trip. I wanted a close.", "A wedding on the next block. I kept a minute of it and then the junction."],
  ["Return, six years later. Same painted kerb.", "The kerb is not the same colour. The hour is. A delivery bike with no lights."],
  ["4:04. I wanted to know if I still wait.", "I waited. A woman in slippers crossed without looking. She is the take."],
  ["Rain again, second trip.", "The hose man is gone. A different shop, same water on tile."],
  ["I tried 5:15 to see the city start.", "It starts as a pile, not a line. I prefer four o'clock and I will not pretend otherwise."],
  ["Last morning. I wanted nothing new.", "A train, very far, that I had never heard here. I stayed for it."],
];

const THAW: [string, string][] = [
  ["Ice talking before the ducks.", "A snowmobile on the far shore at 06:11, then the sheet cracking toward me."],
  ["The first open water. I wanted it without birds.", "A single teal. The water is a click, not a lap."],
  ["Night thaw. I wanted the lake to work in the dark.", "It did. My teeth are in the take. I was cold enough to hear them."],
  ["I came for the line of crack I recorded last year.", "A different line. Same direction, toward the outlet."],
  ["Wind off the plateau. I wanted the ice anyway.", "The wind won for twenty minutes. Then four minutes of ice I will use."],
  ["Ducks, on purpose, after years of avoiding them.", "They are comic. Under them the lake is still working."],
  ["I wanted meltwater under the sheet, not the sheet.", "A drain-like tone. I put the hydrophone in a hole I did not make."],
  ["Late March, almost open.", "A walker with poles. I asked him to cross again and he did, which I then felt badly about and kept."],
  ["Early, still hard. I wanted the wait.", "Forty minutes of almost nothing. A raven. The nothing has a pitch."],
  ["I came back at dusk to hear the day let go.", "The ice sounded tired, which is not a measurement, and then a truck on the ski road."],
  ["Rain on remaining ice.", "The rain is the take. The ice is a floor under it."],
  ["I wanted only the outlet.", "Peat water, thick. A fish I never saw."],
  ["Second session the same morning.", "Better. I had stopped hoping."],
  ["I wanted the plateau wind without the lake.", "I turned my back. The lake is still in the stereo image, left."],
  ["Last year I would have packed at the snowmobile.", "I waited it out. The crack after is the reason I still come."],
];

const SILO: [string, string][] = [
  ["Grain settling after the dryer stopped.", "The silo was ringing when I arrived. I stayed for the ring."],
  ["I wanted the ring without the dryer in memory.", "A lorry on the concrete. After it, the ring had a longer tail."],
  ["Noon. I wanted to know if it rings in daylight.", "Less. A pigeon in the roof vent. The ring is a dusk thing."],
  ["I came for the pigeon and hoped for the ring.", "Both. The pigeon is closer than I like and I did not move."],
  ["Empty, after they drew it down.", "A new note, higher. My footsteps on the catwalk. I walked them on purpose."],
  ["Night. I wanted the empty without me.", "I sat for half an hour. A dog at the farm, then the empty."],
  ["Last visit. They are taking the silo down next year.", "I recorded the door. It will not be here. The ring is in the earlier takes."],
];

const BANK: Record<string, { sought: string[]; found: string[] }> = {
  hackney: {
    sought: [
      "The street without the street. Just the plane trees.",
      "Rain on the kitchen extension, from inside.",
      "The same blackbird I have no right to claim.",
      "Foxes, if they came, which they do not on request.",
      "New Year, the park empty, the window open a hand.",
      "A helicopter I did not want, to remember the year.",
    ],
    found: [
      "A bus on Mare Street. The trees are in it, left.",
      "The neighbour's extract fan. I know this room too well.",
      "The blackbird, then a delivery locker lid.",
      "Two foxes, brief, and a man talking to them as if they were dogs.",
      "Fireworks over the park, late, ugly, useful.",
      "The helicopter circled twice. I kept the second pass.",
    ],
  },
  ely: {
    sought: [
      "The nave empty enough to hear the stone.",
      "A single door, west end.",
      "Rain on the lantern, from the crossing.",
      "Choir practice I would leave if it became a concert.",
      "My own walk up the aisle, then stillness.",
    ],
    found: [
      "A vacuum in the south aisle. I waited. The stone came back.",
      "The door, and a tourist who apologised, which is in the take.",
      "Rain, and a heater ticking. The lantern is the high shimmer.",
      "They sang four minutes and stopped. I kept the stop.",
      "The walk is clumsy. The stillness after is why I go.",
    ],
  },
  minch: {
    sought: [
      "Hull and water, not the tannoy.",
      "The wake from midships, lee side.",
      "A crossing with almost no passengers.",
      "Engine in the stairwell, as a room.",
    ],
    found: [
      "The tannoy once. I left it. The hull is the rest.",
      "Gulls working the wake. The water is heavy.",
      "A child in the lounge. The door kept closing.",
      "The stairwell sings. I did not know it would.",
    ],
  },
  uig: {
    sought: [
      "Wind in the bothy chimney, not the view.",
      "Sand moving at night.",
      "Rain on corrugated, from the bunk.",
      "The door I had to keep shut.",
    ],
    found: [
      "The chimney, and my stove. I am in this one.",
      "Sand, and a sheep against the wall.",
      "The rain is a metre. I slept and let it run.",
      "The door slammed. I recorded the latch after.",
    ],
  },
  jokul: {
    sought: [
      "Bergs working against each other, not tourist boats.",
      "The lagoon before the car park filled.",
      "A calf rolling, close.",
      "Wind off the sandur, with ice as percussion.",
    ],
    found: [
      "One boat. After it, twenty minutes of the thing I came for.",
      "A coach. I started earlier the next day.",
      "The calf, then a crack I felt in my knees.",
      "The sandur won. Ice is in the right channel.",
    ],
  },
  sensa: {
    sought: [
      "Water under a private door, no voices.",
      "A vaporetto far enough to be weather.",
      "Night, the canal as a room.",
      "Rain into the same water.",
    ],
    found: [
      "A kitchen above me. Plates. The water is still the bed.",
      "The vaporetto, then oars, which I wanted more.",
      "A couple arguing in the next rio. I kept a little.",
      "Rain, and a pump I had not heard in the dry.",
    ],
  },
  tofuku: {
    sought: [
      "Drip from the maple after the rain had stopped.",
      "Gravel under one person I would not be.",
      "The valley as a bowl, from the bridge.",
      "Closing time, the garden giving up voices.",
    ],
    found: [
      "Drip, and a camera shutter I will not point to.",
      "Two people. I waited for one. I got two, then none.",
      "A train in the valley. The bowl holds it.",
      "A guard's radio. Then the maples, finally.",
    ],
  },
  karakoy: {
    sought: [
      "The ferry tying up, not the square.",
      "Men calling the lines, close.",
      "Dawn, the landing before tea.",
      "The gangway as a percussion instrument.",
    ],
    found: [
      "The square leaked in. The lines are still the take.",
      "The call, then a phone on speaker.",
      "Tea anyway, one stall. Gulls.",
      "The gangway, and a suitcase I did not need.",
    ],
  },
  perito: {
    sought: [
      "Calving, if it would, without applause.",
      "The lake ice against the face, small.",
      "Wind in the beech behind the boardwalk.",
      "Night, the glacier as a building settling.",
    ],
    found: [
      "A calving. Two people clapped. I kept the minute after.",
      "Small ice, constant. Better than the event.",
      "The beech, and a guide with a flag.",
      "Settling, yes. A fox, I think, on the moraine.",
    ],
  },
  round: {
    sought: [
      "Wind in the bog cotton, not the road to Clifden.",
      "A pool with rain on it, close.",
      "Night, snipe if they were there.",
      "The same pool in sun, to hear the difference.",
    ],
    found: [
      "The road is a thread. The cotton is the take.",
      "Rain, and a fly in the windshield.",
      "Snipe, distant. Cattle closer.",
      "Sun makes the pool a click. I prefer the rain.",
    ],
  },
  alley: {
    sought: [
      "The crossing as a leak, not a subject.",
      "Compressors, the alley as an engine room.",
      "4am, deliveries, no voices if I could help it.",
      "Rain on the covered stretch.",
    ],
    found: [
      "The crossing leaked. I used a longer take and let it.",
      "One compressor with a limp. I sat with it.",
      "Deliveries, and a radio. Voices anyway.",
      "Rain, and a cat I have on three takes now.",
    ],
  },
  organ: {
    sought: [
      "Wind in the saguaro, which may be a fantasy.",
      "Sand moving at ankle height.",
      "Noon heat as a sound, if it is one.",
      "A jet from the range, then the return of the desert.",
    ],
    found: [
      "The saguaro is quiet. The gravel is not.",
      "Sand, and a beetle I will not name.",
      "Heat is cicadas. I was wrong and I kept it.",
      "The jet. The return takes longer than I wanted.",
    ],
  },
  tarkine: {
    sought: [
      "Myrtle and leeches, the track as a wet room.",
      "A creek under tree fern, close.",
      "Wind in the canopy, not the tourist boardwalk.",
      "Night, something I would not see.",
    ],
    found: [
      "Leeches, not audible. The wet room is real.",
      "The creek, and a lyrebird I did not deserve.",
      "Boardwalk voices. I walked off the timber.",
      "A possum. I flinched. The flinch is in it.",
    ],
  },
  graca: {
    sought: [
      "The tram as a room, windows open.",
      "Brakes on the calçada, from the pavement.",
      "Early, before the queue at the miradouro.",
      "The same brakes after rain.",
    ],
    found: [
      "A ticket inspector. The room still holds.",
      "Brakes, and a scooter, which is the new city.",
      "The queue was already there. I pointed down the hill.",
      "Wet stone is better. I will use this one.",
    ],
  },
  azhar: {
    sought: [
      "Before the first call, the courtyard as stone.",
      "The call from inside the arcade, not a postcard.",
      "Pigeons, if they would work with the stone.",
      "Late morning, shoes, and then empty again.",
    ],
    found: [
      "A sweeper. The stone is under him.",
      "The call, close, not pretty. I stayed.",
      "Pigeons, and a school group I waited out.",
      "Shoes, then a long empty I almost missed because I was packing.",
    ],
  },
  capilano: {
    sought: [
      "Rain on cedar, from the path not the suspension bridge.",
      "The river in spate, a short take.",
      "Drip after the rain, the forest as a clock.",
      "A raven, if one would, without jokes about ravens.",
    ],
    found: [
      "Bridge voices far up. Cedar is the take.",
      "Spate, and a warning sign rattling.",
      "Drip, regular as I wanted. A dog.",
      "The raven. I got the joke anyway, in my own head.",
    ],
  },
  gwang: {
    sought: [
      "Shutters, the last broth, no music from phones.",
      "The alley behind the market, water on tile.",
      "One stall holder washing down, close.",
      "The hour after close, the building settling.",
    ],
    found: [
      "A phone. K-pop, small. Shutters over it.",
      "Water on tile, and a motorbike I could not stop.",
      "She talked to me. I kept the wash, not the talk.",
      "Settling, and a security radio.",
    ],
  },
  auffes: {
    sought: [
      "Water in the little port, no restaurant.",
      "A boat tying, close, early.",
      "Night, the road above as weather.",
      "Mistral, if it came, against the houses.",
    ],
    found: [
      "A restaurant opening chairs. Water under it.",
      "The boat, and a radio news bulletin.",
      "The road is a drone. I like it more than I expected.",
      "The mistral came. Lines slapped. I stayed in the lee.",
    ],
  },
  mala: {
    sought: [
      "The courtyard as a well. One window.",
      "Rain into the well.",
      "A piano I had heard from the street, if it was real.",
      "Night, the well empty of voices.",
    ],
    found: [
      "Two windows. Dishes, then the well.",
      "Rain, and a drain I had not clocked.",
      "The piano was real. Three minutes. I did not knock.",
      "A tram on Kampa, very small. The well holds.",
    ],
  },
  u8: {
    sought: [
      "The overrun after the last train, not the train.",
      "Wind in the tunnel from a dropped train.",
      "A busker's leftover resonance, if any.",
      "Morning first train, from the bench, close.",
    ],
    found: [
      "A cleaner. The overrun is after her trolley.",
      "Wind, and a rat I am not proud of jumping at.",
      "No busker. A humming panel.",
      "The train, then the doors. I will use the doors.",
    ],
  },
  lakeL: {
    sought: [
      "The structure, not the cars.",
      "A train passing over, from the pavement.",
      "Night, the steel ticking.",
      "Rain on the deck, underneath.",
    ],
    found: [
      "Cars anyway. The steel is the bed.",
      "The train, too loud, then a useful tail.",
      "Ticking, and a man asking if I was all right.",
      "Rain, perfect, and a bottle kicked.",
    ],
  },
  dinorwic: {
    sought: [
      "Wind in a gallery, the mountain as a flute.",
      "My own steps, then none.",
      "Slate shifting, if it would, small.",
      "Rain at the mouth, from inside.",
    ],
    found: [
      "The flute is real. A drone tour far below.",
      "Steps. Water. I stopped walking.",
      "A shift I felt more than heard.",
      "Rain at the mouth, a hard line.",
    ],
  },
  kinder: {
    sought: [
      "The pump as a heart, close, with permission.",
      "The screw from the walkway.",
      "Outside, the same pump as landscape.",
      "A dry day, to hear the house without rain.",
    ],
    found: [
      "Permission, and a guide who stayed quiet. The heart is the take.",
      "The screw, hypnotic. I cut late.",
      "Landscape, and a bicycle bell on the dyke.",
      "The house creaks. The pump is still in the floor.",
    ],
  },
  hvisde: {
    sought: [
      "Wind in the dune fence, a counting.",
      "The North Sea as a floor, not a postcard.",
      "Sand on wood, close.",
      "A foghorn, if the weather would, with the fence.",
    ],
    found: [
      "The fence counts. A dog. I waited.",
      "The sea is a floor. A windsurfer, distant.",
      "Sand on wood, and my hood, which I then took off.",
      "No horn. A tractor on the beach road.",
    ],
  },
  ryvoan: {
    sought: [
      "The bothy as a drum in wind.",
      "The stove, from the bunk, night.",
      "A stream through the wall, I hoped.",
      "Morning, the door opened on purpose.",
    ],
    found: [
      "Drum, yes. A pair of walkers at 11.",
      "The stove, and mice. I am not precious.",
      "The stream is there. I put a cup on the sill and the cup sang.",
      "The door, and a grouse I flushed, badly.",
    ],
  },
  hives: {
    sought: [
      "The hive as a single tone.",
      "A lid off, brief, with the keeper.",
      "Evening, the tone dropping.",
      "Rain on the hive roof, bees under it.",
    ],
    found: [
      "The tone, and a tractor. Kent.",
      "Lid off. I flinched. She laughed. The bees are the take.",
      "The drop is real. A blackbird over it.",
      "Rain, and the tone still there, smaller.",
    ],
  },
  bl: {
    sought: [
      "Pages, the room as weather, no laptops.",
      "A cough, then the room returning.",
      "Closing, the last trolley.",
      "Rare books desk, pencils, if they would have me.",
    ],
    found: [
      "Laptops. Pages under them if you wait.",
      "The cough, and a chair. The room returns.",
      "The trolley, and a bag zip that made me angry.",
      "Pencils, yes. A whispered no. I kept the pencils.",
    ],
  },
  lido: {
    sought: [
      "Empty water, October, the building as a shell.",
      "Wind over the unheated pool.",
      "A lane rope ticking the wall.",
      "Rain on the water, no swimmers.",
    ],
    found: [
      "A groundsman. After him, the shell.",
      "Wind, and the café radio through a wall.",
      "The rope, irregular. I liked it.",
      "Rain. A bus on the street. The water takes it.",
    ],
  },
  dungeness: {
    sought: [
      "Shingle moving, the power station as a tone.",
      "Wires over the cottages.",
      "A train on the little line, from the beach.",
      "Fog, if it came, with the tone.",
    ],
    found: [
      "Shingle, and a photographer's bag. The tone is there.",
      "Wires, a lark. I did not come for the lark and I kept it.",
      "The train, toy-like, useful.",
      "Fog. The tone got closer. I will use this.",
    ],
  },
  grant: {
    sought: [
      "The meadow as a room of grass, no punts.",
      "Cattle, close, without comedy.",
      "Dawn, the river not the college.",
      "A skylark, if I could be unsentimental.",
    ],
    found: [
      "A punt, one. Grass after.",
      "Cattle, serious. A bicycle.",
      "The river, and a runner with a podcast I angled away from.",
      "The lark. I failed to be unsentimental.",
    ],
  },
  homerton: {
    sought: [
      "The corridor at three, machines not voices.",
      "A door that kept closing.",
      "Dawn, the ward still dim, from the chair I was allowed.",
    ],
    found: [
      "Machines, and a laugh at the desk. I kept both.",
      "The door. A bed being moved. I was there for a person, not a take, and I still rolled.",
      "Dawn is a trolley. I stopped. That is the last of these.",
    ],
  },
  fitzroy: {
    sought: [
      "The tram bell as a clock, early.",
      "Rain on the shelter, the wire singing.",
      "A driver changing ends, close.",
      "Night, the wire without the tram.",
    ],
    found: [
      "The bell, and a man on a phone about a lease.",
      "Rain, the wire, a possum in the plane tree.",
      "Changing ends, keys, a cough.",
      "The wire sings. A taxi. I preferred the wire.",
    ],
  },
  grate: {
    sought: [
      "The subway as a throat, from the grate.",
      "A train, then the throat empty.",
      "Night, steam if it would.",
      "Rain into the grate, the throat answering.",
    ],
    found: [
      "The throat, and a preacher on 23rd I angled from.",
      "The train, too short. I waited for the next empty.",
      "Steam, yes, and a laugh. New York.",
      "Rain. The throat answers. A plastic cup.",
    ],
  },
  chefch: {
    sought: [
      "The alley before paint and shops.",
      "A tap, somewhere, and stone.",
      "Dawn call, from the alley not the square.",
      "Rain on blue walls, if it would rain.",
    ],
    found: [
      "A shop anyway, rolling up. Stone under it.",
      "The tap, a mule, far.",
      "The call, close enough. A television.",
      "It rained. The blue is not a sound. The rain is.",
    ],
  },
  advent: {
    sought: [
      "Ice edge, snowmobiles out of the hour if I could choose.",
      "The fjord working, small.",
      "Wind off the mountain, with ice as grit.",
      "A raven, because they are the town.",
    ],
    found: [
      "One snowmobile. I waited. The edge ticked.",
      "The fjord, and a generator I could not locate.",
      "Wind, grit, my hood again. Off.",
      "The raven, three of them. The town is audible behind.",
    ],
  },
  howrah: {
    sought: [
      "The river before the bridge becomes a postcard.",
      "Ferries, close, from the steps.",
      "Dawn, horns as a climate.",
      "Night, the same steps emptying.",
    ],
    found: [
      "The bridge is in it. I stopped pretending.",
      "A ferry, a vendor, the steps wet.",
      "Horns, and a radio. The climate is real.",
      "Emptying, never empty. A dog.",
    ],
  },
  valpa: {
    sought: [
      "The funicular as a wooden room.",
      "Cables, from the street, no voices.",
      "Dogs on Cerro Alegre, night, if they would.",
      "Foghorn from the port, with the hill.",
    ],
    found: [
      "The room, and a ticket punch.",
      "Cables, a bus. Voices anyway.",
      "The dogs. A television. The hill is a bowl.",
      "The horn, faint. A party. I waited for the next horn.",
    ],
  },
  abanot: {
    sought: [
      "The baths before opening, steam as a room.",
      "A pipe, close.",
      "The street waking, from the steps.",
      "Night, the dome ticking as it cooled.",
    ],
    found: [
      "A worker with a hose. Steam under him.",
      "The pipe, a radio, Georgian talk I cannot use as meaning.",
      "The street, bread, a car alarm.",
      "The dome ticks. A cat. I will use the ticks.",
    ],
  },
  frogner: {
    sought: [
      "Ice on the inner fjord, city in the left.",
      "Skates, if they came, as percussion.",
      "Night, the ice without the promenade.",
      "Thaw starting, the same bay as a different room.",
    ],
    found: [
      "The city is in the left. Ice ticks in the right.",
      "Skates, children. I kept a short piece.",
      "A tram. The ice is still the take.",
      "Thaw. Ducks. I have this problem everywhere.",
    ],
  },
  quay: {
    sought: [
      "The river before clerks, 5am.",
      "A bumboat, close, no tour.",
      "Rain on the promenade cover.",
      "The expressway as a floor, the water over it.",
    ],
    found: [
      "A cleaner. Clerks start earlier than I thought.",
      "The bumboat, and a tourist anyway.",
      "Rain, good. A radio from a barge.",
      "The expressway is the floor. Water is an argument on top.",
    ],
  },
  oaxaca: {
    sought: [
      "Shutters, chocolate being ground, then none.",
      "The aisle after close, water.",
      "A single stall, meat, if I could be decent about it.",
      "Night in the square, from a doorway, not the band.",
    ],
    found: [
      "The grind, then a motorbike. Shutters.",
      "Water, a radio still on in a locked stall.",
      "I was decent. Knives and water. I left the meat out of the note and not the take.",
      "The band ended. The doorway held the square emptying.",
    ],
  },
  maas: {
    sought: [
      "A ship tying, the berth as a room.",
      "Containers, the crane as a clock.",
      "Night, the river with no ship.",
      "Fog, horns, the land barely there.",
    ],
    found: [
      "The ship, a safety talk on a speaker. The room is still there.",
      "The crane, hypnotic. A truck reversing, endless.",
      "No ship. Wind in a fence. Better.",
      "Fog. Horns. I stayed too long and was glad.",
    ],
  },
  amman: {
    sought: [
      "The stair at dawn, stone, no cars if the hill would allow.",
      "A generator, the city's other weather.",
      "Call from a few streets over, the stair as a filter.",
      "Night, a door, cats.",
    ],
    found: [
      "Cars. Stone under them. A broom.",
      "The generator, and bread. I pointed at the generator.",
      "The call, filtered, as I wanted.",
      "A door, cats, a television. I cut before the television won.",
    ],
  },
  faro: {
    sought: [
      "The tide gate working, close.",
      "Waders, if I could keep them as texture.",
      "Wind in the salterns, no weekend.",
      "Night, the lagoon as a single tone.",
    ],
    found: [
      "The gate, a bicycle. The hinge is the take.",
      "Waders, a dog walker. Texture anyway.",
      "A weekend. I came back Tuesday. This is Tuesday.",
      "The tone, and a distant highway I could not kill.",
    ],
  },
};

type Draft = {
  placeId: string;
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  durationMin: number;
  stillnessMin: number;
  kind?: Kind;
  sought?: string;
  found?: string;
};

function daysIn(year: number, month: number) {
  return new Date(year, month, 0).getDate();
}

function yearday(year: number, month: number, day: number) {
  const start = Date.UTC(year, 0, 1);
  const at = Date.UTC(year, month - 1, day);
  return Math.floor((at - start) / 86400000) + 1;
}

function clampDay(year: number, month: number, day: number) {
  return Math.min(day, daysIn(year, month));
}

function mulberry(seed: number) {
  let a = seed >>> 0;
  return () => {
    a += 0x6d2b79f5;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick<T>(rand: () => number, xs: T[]): T {
  return xs[Math.floor(rand() * xs.length) % xs.length];
}

function hourClause(hour: number, rand: () => number): string {
  if (rand() > 0.38) return "";
  if (hour < 5) return " The hour is the point.";
  if (hour < 8) return " I still think dawn is a method.";
  if (hour > 21) return " Night made it smaller and closer.";
  if (hour >= 12 && hour < 15) return " Midday is usually a mistake; I wanted the mistake.";
  return "";
}

function notesFor(d: Draft, index: number): { sought: string; found: string } {
  if (d.sought && d.found) return { sought: d.sought, found: d.found };
  const bank = BANK[d.placeId];
  const rand = mulberry(index * 997 + d.year * 13 + d.month * 17 + d.day * 23 + d.hour);
  if (!bank) {
    return {
      sought: "I wanted the place to speak before I did.",
      found: "It did, and then it did not. I kept the middle.",
    };
  }
  const sought = bank.sought[index % bank.sought.length];
  const found = bank.found[Math.floor(rand() * 97) % bank.found.length] + hourClause(d.hour, rand);
  return { sought, found };
}

function draft(): Draft[] {
  const out: Draft[] = [];

  HEDGE.forEach(([sought, found], i) => {
    const year = i < 12 ? 2019 : 2020;
    const month = (i % 12) + 1;
    out.push({
      placeId: "cley",
      year,
      month,
      day: 11 + (i % 7),
      hour: 5 + (i % 3),
      minute: [4, 12, 18, 27, 33, 41, 52][i % 7],
      durationMin: i === 17 ? 22 : 9 + (i % 7),
      stillnessMin: 8 + (i % 11),
      kind: "foliage",
      sought,
      found,
    });
  });

  HANOI.forEach(([sought, found], i) => {
    const first = i < 7;
    out.push({
      placeId: "hanoi",
      year: first ? 2017 : 2023,
      month: first ? 11 : 3,
      day: first ? 4 + i : 9 + (i - 7),
      hour: [4, 4, 3, 4, 12, 4, 4, 4, 4, 4, 5, 4][i],
      minute: [8, 10, 40, 22, 3, 2, 51, 6, 4, 19, 15, 11][i],
      durationMin: [14, 12, 16, 11, 6, 15, 13, 18, 17, 12, 9, 20][i],
      stillnessMin: [25, 18, 30, 22, 4, 28, 20, 35, 40, 24, 10, 32][i],
      kind: i === 4 ? "urban" : "urban",
      sought,
      found,
    });
  });

  SILO.forEach(([sought, found], i) => {
    out.push({
      placeId: "silo",
      year: [2016, 2016, 2017, 2018, 2021, 2021, 2024][i],
      month: [10, 10, 2, 9, 4, 11, 6][i],
      day: [3, 4, 18, 9, 21, 2, 14][i],
      hour: [19, 20, 12, 18, 16, 21, 17][i],
      minute: [12, 4, 30, 8, 45, 10, 22][i],
      durationMin: [38, 41, 12, 27, 33, 44, 8][i],
      stillnessMin: [15, 22, 6, 18, 20, 31, 4][i],
      kind: "interior",
      sought,
      found,
    });
  });

  let thawI = 0;
  for (let year = 2016; year <= 2026; year++) {
    const sessions = year % 3 === 0 ? 3 : 2;
    for (let s = 0; s < sessions; s++) {
      const [sought, found] = THAW[thawI % THAW.length];
      out.push({
        placeId: "dubh",
        year,
        month: 3,
        day: 7 + s * 5 + (year % 4),
        hour: [5, 6, 19, 7][s % 4],
        minute: [8, 21, 40, 3][s % 4],
        durationMin: 16 + ((year + s) % 14),
        stillnessMin: 20 + ((year * 3 + s) % 25),
        kind: s === 0 && year % 2 === 0 ? "ice" : "water",
        sought: `${sought} (${year}.)`,
        found,
      });
      thawI++;
    }
  }

  type Trip = {
    placeId: string;
    year: number;
    month: number;
    startDay: number;
    n: number;
    hours: number[];
    kind?: Kind;
  };

  const trips: Trip[] = [
    { placeId: "minch", year: 2016, month: 9, startDay: 4, n: 6, hours: [7, 8, 11, 16, 18] },
    { placeId: "uig", year: 2016, month: 9, startDay: 6, n: 8, hours: [0, 2, 6, 14, 22] },
    { placeId: "jokul", year: 2017, month: 7, startDay: 11, n: 11, hours: [5, 6, 8, 11, 21] },
    { placeId: "sensa", year: 2018, month: 2, startDay: 3, n: 9, hours: [4, 5, 13, 22, 23] },
    { placeId: "tofuku", year: 2018, month: 11, startDay: 8, n: 9, hours: [6, 7, 9, 16] },
    { placeId: "karakoy", year: 2019, month: 4, startDay: 2, n: 9, hours: [6, 7, 8, 18] },
    { placeId: "perito", year: 2019, month: 12, startDay: 14, n: 9, hours: [5, 7, 14, 22] },
    { placeId: "round", year: 2020, month: 8, startDay: 9, n: 11, hours: [5, 6, 12, 20] },
    { placeId: "alley", year: 2021, month: 5, startDay: 3, n: 9, hours: [3, 4, 5, 23] },
    { placeId: "organ", year: 2021, month: 9, startDay: 18, n: 8, hours: [5, 10, 15, 20] },
    { placeId: "tarkine", year: 2022, month: 2, startDay: 6, n: 9, hours: [6, 8, 13, 21] },
    { placeId: "graca", year: 2022, month: 6, startDay: 1, n: 8, hours: [7, 8, 9, 19] },
    { placeId: "azhar", year: 2023, month: 1, startDay: 12, n: 8, hours: [4, 5, 10, 17] },
    { placeId: "capilano", year: 2024, month: 3, startDay: 4, n: 8, hours: [7, 8, 11, 15], kind: "rain" },
    { placeId: "gwang", year: 2024, month: 10, startDay: 21, n: 8, hours: [20, 21, 22, 23] },
    { placeId: "auffes", year: 2025, month: 5, startDay: 8, n: 8, hours: [6, 7, 13, 22] },
    { placeId: "mala", year: 2025, month: 9, startDay: 2, n: 8, hours: [5, 8, 15, 23] },
    { placeId: "u8", year: 2016, month: 11, startDay: 9, n: 8, hours: [0, 1, 5, 23] },
    { placeId: "lakeL", year: 2026, month: 4, startDay: 3, n: 6, hours: [1, 6, 13, 22] },
    { placeId: "dinorwic", year: 2018, month: 6, startDay: 14, n: 9, hours: [8, 10, 14, 17] },
    { placeId: "kinder", year: 2017, month: 5, startDay: 19, n: 8, hours: [9, 11, 15] },
    { placeId: "hvide", year: 2020, month: 1, startDay: 7, n: 6, hours: [8, 11, 16, 18] },
    { placeId: "ryvoan", year: 2015, month: 10, startDay: 16, n: 8, hours: [1, 6, 13, 22] },
    { placeId: "advent", year: 2022, month: 3, startDay: 11, n: 8, hours: [6, 8, 14, 21] },
    { placeId: "howrah", year: 2019, month: 2, startDay: 5, n: 8, hours: [5, 6, 17, 21] },
    { placeId: "valpa", year: 2023, month: 8, startDay: 18, n: 6, hours: [8, 12, 19, 23] },
    { placeId: "abanot", year: 2024, month: 6, startDay: 7, n: 6, hours: [6, 7, 18, 22] },
    { placeId: "frogner", year: 2021, month: 2, startDay: 2, n: 6, hours: [7, 9, 16, 21] },
    { placeId: "quay", year: 2025, month: 7, startDay: 3, n: 6, hours: [5, 6, 18] },
    { placeId: "oaxaca", year: 2018, month: 4, startDay: 20, n: 6, hours: [7, 20, 21, 22] },
    { placeId: "maas", year: 2020, month: 11, startDay: 12, n: 6, hours: [2, 4, 15, 23] },
    { placeId: "amman", year: 2017, month: 3, startDay: 8, n: 6, hours: [5, 6, 19] },
    { placeId: "faro", year: 2026, month: 2, startDay: 16, n: 6, hours: [6, 8, 17, 21] },
    { placeId: "chefch", year: 2016, month: 4, startDay: 22, n: 6, hours: [5, 6, 18, 22] },
    { placeId: "fitzroy", year: 2023, month: 12, startDay: 4, n: 6, hours: [6, 7, 18, 23] },
    { placeId: "grate", year: 2015, month: 6, startDay: 9, n: 6, hours: [1, 3, 14, 22] },
  ];

  for (const t of trips) {
    for (let i = 0; i < t.n; i++) {
      const rand = mulberry(t.year * 1000 + t.month * 40 + t.startDay + i * 9 + t.placeId.charCodeAt(0));
      out.push({
        placeId: t.placeId,
        year: t.year,
        month: t.month,
        day: clampDay(t.year, t.month, t.startDay + Math.floor(i * 0.7)),
        hour: t.hours[i % t.hours.length],
        minute: Math.floor(rand() * 56),
        durationMin: 6 + Math.floor(rand() * 28),
        stillnessMin: 3 + Math.floor(rand() * 32),
        kind: t.kind,
      });
    }
  }

  const returning: { placeId: string; years: number[]; months: number[]; hours: number[]; per: number }[] = [
    { placeId: "hackney", years: [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026], months: [1, 3, 6, 10, 12], hours: [5, 6, 22], per: 1 },
    { placeId: "ely", years: [2015, 2017, 2019, 2022, 2024], months: [2, 11], hours: [8, 16], per: 1 },
    { placeId: "hives", years: [2016, 2018, 2020, 2023, 2025], months: [5, 7], hours: [10, 18], per: 1 },
    { placeId: "bl", years: [2015, 2016, 2018, 2022], months: [1, 9], hours: [11, 16], per: 1 },
    { placeId: "lido", years: [2017, 2021], months: [10], hours: [8, 15], per: 2 },
    { placeId: "dungeness", years: [2015, 2018, 2022, 2025], months: [2, 11], hours: [7, 14, 17], per: 1 },
    { placeId: "grant", years: [2016, 2019, 2024], months: [5, 6], hours: [6, 7], per: 1 },
    { placeId: "homerton", years: [2021], months: [1], hours: [3, 4, 6], per: 1 },
  ];

  for (const r of returning) {
    for (const year of r.years) {
      for (const month of r.months) {
        for (let i = 0; i < r.per; i++) {
          const rand = mulberry(year * 77 + month * 13 + i * 19 + r.placeId.length * 31);
          const day = clampDay(year, month, 4 + Math.floor(rand() * 22));
          if (year === 2026 && month > 8) continue;
          if (year === 2026 && month === 8 && day > 20) continue;
          out.push({
            placeId: r.placeId,
            year,
            month,
            day,
            hour: r.hours[(i + month + year) % r.hours.length],
            minute: Math.floor(rand() * 50) + 3,
            durationMin: 5 + Math.floor(rand() * 22),
            stillnessMin: 2 + Math.floor(rand() * 24),
          });
        }
      }
    }
  }

  return out;
}

function compile(drafts: Draft[]): Recording[] {
  const sorted = [...drafts].sort((a, b) => {
    const da = a.year * 10000 + a.month * 100 + a.day + a.hour / 100;
    const db = b.year * 10000 + b.month * 100 + b.day + b.hour / 100;
    return da - db;
  });

  const byYear = new Map<number, number>();
  return sorted.map((d, index) => {
    const place = PLACE[d.placeId];
    const n = (byYear.get(d.year) ?? 0) + 1;
    byYear.set(d.year, n);
    const { sought, found } = notesFor(d, index);
    const minute = d.minute;
    const impressionSec = 48 + ((index * 17) % 24);
    return {
      id: `r-${d.year}-${String(n).padStart(3, "0")}`,
      cat: `A.${d.year}.${String(n).padStart(3, "0")}`,
      placeId: d.placeId,
      place: place.name,
      region: place.region,
      lat: place.lat,
      lon: place.lon,
      date: `${d.year}-${String(d.month).padStart(2, "0")}-${String(d.day).padStart(2, "0")}`,
      year: d.year,
      month: d.month,
      day: d.day,
      yearday: yearday(d.year, d.month, d.day),
      hour: d.hour,
      minute,
      hourFrac: d.hour + minute / 60,
      durationMin: d.durationMin,
      stillnessMin: d.stillnessMin,
      impressionSec,
      kind: d.kind ?? place.kind,
      sought,
      found,
    };
  });
}

function fit(recs: Recording[], target: number): Recording[] {
  if (recs.length === target) return recs;
  if (recs.length < target) {
    const extra: Draft[] = [];
    const hosts = ["hackney", "dungeness", "cley", "dubh", "round", "ely", "grant", "hives", "faro"];
    let i = 0;
    while (recs.length + extra.length < target) {
      const rand = mulberry(9000 + i * 13);
      const placeId = hosts[i % hosts.length];
      const year = 2015 + (i % 12);
      const month = 1 + (i % 12);
      if (year > 2026 || (year === 2026 && month > 8)) {
        i++;
        continue;
      }
      extra.push({
        placeId,
        year,
        month,
        day: clampDay(year, month, 2 + (i % 26)),
        hour: [5, 6, 7, 18, 21, 22][i % 6],
        minute: Math.floor(rand() * 48),
        durationMin: 7 + (i % 19),
        stillnessMin: 4 + (i % 21),
      });
      i++;
    }
    return compile([...draft(), ...extra]);
  }

  const need = recs.length - target;
  const drop = new Set<string>();
  const middleHome = recs.filter(
    (r) => r.placeId === "hackney" && r.year >= 2017 && r.year <= 2023,
  );
  for (const r of middleHome) {
    if (drop.size >= need) break;
    drop.add(r.id);
  }
  if (drop.size < need) {
    for (const r of recs) {
      if (drop.size >= need) break;
      if (r.placeId === "grant" || r.placeId === "dungeness") drop.add(r.id);
    }
  }
  return recatalog(recs.filter((r) => !drop.has(r.id)));
}

function recatalog(recs: Recording[]): Recording[] {
  const byYear = new Map<number, number>();
  return recs.map((r) => {
    const n = (byYear.get(r.year) ?? 0) + 1;
    byYear.set(r.year, n);
    return {
      ...r,
      id: `r-${r.year}-${String(n).padStart(3, "0")}`,
      cat: `A.${r.year}.${String(n).padStart(3, "0")}`,
    };
  });
}

const RAW = draft();
export const RECORDINGS: Recording[] = fit(compile(RAW), 400);

export const YEARS = [...new Set(RECORDINGS.map((r) => r.year))].sort((a, b) => a - b);

export const KINDS = (Object.keys(KIND_LABEL) as Kind[]).filter((k) =>
  RECORDINGS.some((r) => r.kind === k),
);

export function seasonOf(month: number): Season {
  if (month === 12 || month <= 2) return "winter";
  if (month <= 5) return "spring";
  if (month <= 8) return "summer";
  return "autumn";
}

export function clock(hour: number, minute: number) {
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

export function longDate(r: Recording) {
  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  return `${r.day} ${months[r.month - 1]} ${r.year}`;
}

export function dur(min: number) {
  return `${min}′`;
}

export function matches(r: Recording, f: Filter) {
  if (f.placeId && r.placeId !== f.placeId) return false;
  if (f.season && seasonOf(r.month) !== f.season) return false;
  if (f.hour !== undefined && r.hour !== f.hour) return false;
  if (f.kind && r.kind !== f.kind) return false;
  if (f.year && r.year !== f.year) return false;
  if (f.q) {
    const q = f.q.trim().toLowerCase();
    if (!q) return true;
    const bag = `${r.cat} ${r.place} ${r.region} ${r.kind} ${KIND_LABEL[r.kind]} ${r.sought} ${r.found} ${r.year} ${r.date}`.toLowerCase();
    if (!bag.includes(q)) return false;
  }
  return true;
}

export function filterRecordings(f: Filter) {
  return RECORDINGS.filter((r) => matches(r, f));
}

function avg(xs: number[]) {
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}

export function attentionLine(recs: Recording[]): string {
  if (!recs.length) return "Nothing in this thread.";
  const hours = recs.map((r) => r.hourFrac);
  const durs = recs.map((r) => r.durationMin);
  const still = recs.map((r) => r.stillnessMin);
  const lo = Math.min(...hours);
  const hi = Math.max(...hours);
  const fmt = (h: number) => {
    const hr = Math.floor(h);
    const m = Math.round((h - hr) * 60);
    return clock(hr, m === 60 ? 0 : m);
  };
  const places = [...new Set(recs.map((r) => r.place))];
  const wait = Math.round(avg(still));
  const span = `${Math.min(...durs)}–${Math.max(...durs)}′`;
  const mean = Math.round(avg(durs));
  if (places.length === 1) {
    return `${places[0]} · ${recs.length} recordings · she went between ${fmt(lo)} and ${fmt(hi)} · waited ${wait}′ before rolling · takes ${span} (mean ${mean}′)`;
  }
  return `${recs.length} recordings · ${places.length} places · between ${fmt(lo)} and ${fmt(hi)} · waited ${wait}′ before rolling · takes ${span}`;
}

export function nextIn(recs: Recording[], id: string) {
  const i = recs.findIndex((r) => r.id === id);
  if (i < 0) return recs[0] ?? null;
  return recs[(i + 1) % recs.length] ?? null;
}

export function prevIn(recs: Recording[], id: string) {
  const i = recs.findIndex((r) => r.id === id);
  if (i < 0) return recs[recs.length - 1] ?? null;
  return recs[(i - 1 + recs.length) % recs.length] ?? null;
}

export function byId(id: string) {
  return RECORDINGS.find((r) => r.id === id) ?? null;
}

export function threadActive(f: Filter) {
  return Boolean(f.placeId || f.season || f.hour !== undefined || f.kind || f.year || (f.q && f.q.trim()));
}

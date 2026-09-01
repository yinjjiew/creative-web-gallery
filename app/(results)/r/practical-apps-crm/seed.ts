import type { Author, Book, Editor, Submission } from "./types";

/**
 * Invented people, invented books, real imprint names. Held at 31 August 2026.
 * The numbers in the brief — thirty-eight authors, about twenty manuscripts
 * out — are the size of the desk, not decoration.
 */

export const AGENT = {
  name: "Iona Kerr",
  house: "Kerr Literary",
  provenance:
    "A modelled desk. The people and books are invented; the imprints are real. The date is held at Monday 31 August 2026 so the clocks do not drift.",
};

export const EDITORS: Editor[] = [
  {
    id: "hale",
    name: "Tom Hale",
    taste:
      "Quiet domestic novels that turn structural rather than sensational. He will wait for a last-act fracture if the sentences earn it. He does not want birds doing metaphorical work.",
    tenures: [
      { imprint: "Picador", house: "Macmillan", role: "editor", from: "2009-03", to: "2016-08" },
      {
        imprint: "Jonathan Cape",
        house: "Penguin Random House",
        role: "editorial director",
        from: "2016-09",
        to: null,
      },
    ],
    notes: [
      {
        id: "hale-n1",
        at: "2024-04-18",
        text: "Drinks too much at the London Book Fair. Still the best reader of quiet novels I have. Never email him on a Friday.",
        audience: "desk",
      },
      {
        id: "hale-n2",
        at: "2025-11-02",
        text: "Told me over lunch he is tired of 'novels that apologise for being novels'. Useful, if I do not quote it at him.",
        audience: "desk",
      },
    ],
  },
  {
    id: "marsh",
    name: "Helen Marsh",
    taste: "Cape literary, same meeting as Hale. Do not send her what he already has.",
    tenures: [
      {
        imprint: "Jonathan Cape",
        house: "Penguin Random House",
        role: "editor",
        from: "2019-01",
        to: null,
      },
    ],
    notes: [
      {
        id: "marsh-n1",
        at: "2023-06-11",
        text: "Collegial with Hale but they will not both read the same book. House rule is hers as much as his.",
        audience: "desk",
      },
    ],
  },
  {
    id: "chen",
    name: "Maya Chen",
    taste:
      "Voice-led American and transatlantic fiction, especially when the plot is an argument about class the narrator will not name. She likes a book she can defend in a big meeting.",
    tenures: [
      { imprint: "Grove", house: "Grove Atlantic", role: "assistant", from: "2015-09", to: "2018-06" },
      { imprint: "Catapult", house: "Catapult", role: "editor", from: "2018-07", to: "2022-03" },
      {
        imprint: "Riverhead",
        house: "Penguin Random House",
        role: "executive editor",
        from: "2022-04",
        to: null,
      },
    ],
    notes: [
      {
        id: "chen-n1",
        at: "2022-05-09",
        text: "The move to Riverhead is the one to remember: she can now pay, and she is still the reader she was at Catapult. Do not treat her as a new person.",
        audience: "desk",
      },
    ],
  },
  {
    id: "okonkwo",
    name: "Sam Okonkwo",
    taste:
      "Sharp, funny, slightly cruel contemporary. He was Hale's assistant; he is not Hale. He wants pace and a social world, not a structural last act.",
    tenures: [
      {
        imprint: "Jonathan Cape",
        house: "Penguin Random House",
        role: "assistant to Tom Hale",
        from: "2017-09",
        to: "2021-12",
      },
      {
        imprint: "Serpent's Tail",
        house: "Profile",
        role: "commissioning editor",
        from: "2022-01",
        to: null,
      },
    ],
    notes: [
      {
        id: "oko-n1",
        at: "2022-02-14",
        text: "Cultivate. He read everything Hale passed to him for four years and now he can buy. The relationship is with Sam, not with Cape.",
        audience: "desk",
      },
    ],
  },
  {
    id: "nair",
    name: "Priya Nair",
    taste:
      "Literary novels with a public argument — migration, civil service, the state as weather. She has moved three times; the taste did not.",
    tenures: [
      {
        imprint: "Jonathan Cape",
        house: "Penguin Random House",
        role: "assistant",
        from: "2014-10",
        to: "2017-08",
      },
      { imprint: "Bloomsbury", house: "Bloomsbury", role: "editor", from: "2017-09", to: "2023-02" },
      {
        imprint: "Hamish Hamilton",
        house: "Penguin Random House",
        role: "commissioning editor",
        from: "2023-03",
        to: null,
      },
    ],
    notes: [
      {
        id: "nair-n1",
        at: "2023-03-20",
        text: "Third house in a decade. Submit to Priya, never 'to Hamilton'. Last time we spoke she was still annoyed I had addressed a parcel to Bloomsbury two months after she left.",
        audience: "desk",
      },
    ],
  },
  {
    id: "grant",
    name: "Elspeth Grant",
    taste: "Hamilton literary, slightly more commercial than Nair. Overlap is real — do not double-submit inside Hamilton.",
    tenures: [
      {
        imprint: "Hamish Hamilton",
        house: "Penguin Random House",
        role: "publishing director",
        from: "2012-01",
        to: null,
      },
    ],
    notes: [],
  },
  {
    id: "ruiz",
    name: "Ben Ruiz",
    taste: "Big, clean American novels with a moral centre he can say out loud. He moves fast when he wants something.",
    tenures: [
      { imprint: "Viking", house: "Penguin Random House", role: "editor", from: "2016-05", to: null },
    ],
    notes: [
      {
        id: "ruiz-n1",
        at: "2026-08-28",
        text: "Telephoned with the Night Swimming offer at 16:10 New York. Do not put the advance in anything an author can screenshot.",
        audience: "desk",
      },
    ],
  },
  {
    id: "desai",
    name: "Anjali Desai",
    taste: "Faber literary, international, a little severe. She will walk from an auction if the process feels messy.",
    tenures: [
      { imprint: "Faber & Faber", house: "Faber", role: "editorial director", from: "2018-02", to: null },
    ],
    notes: [
      {
        id: "desai-n1",
        at: "2024-09-03",
        text: "She left the last auction I ran because Knopf was given an extra day. She was right. Same information, same noon.",
        audience: "desk",
      },
    ],
  },
  {
    id: "vale",
    name: "Christopher Vale",
    taste: "Knopf literary American, patient, expensive when he is in.",
    tenures: [
      { imprint: "Knopf", house: "Penguin Random House", role: "senior editor", from: "2011-04", to: null },
    ],
    notes: [],
  },
  {
    id: "hmoss",
    name: "Hannah Moss",
    taste: "Picador UK, novels with a weather system. She reads slowly and means it.",
    tenures: [
      { imprint: "Picador", house: "Macmillan", role: "publisher", from: "2015-06", to: null },
    ],
    notes: [],
  },
  {
    id: "lhart",
    name: "Lila Hart",
    taste: "Bloomsbury fiction, slightly warmer than Park. Same imprint — never simultaneous.",
    tenures: [
      { imprint: "Bloomsbury", house: "Bloomsbury", role: "editor", from: "2020-01", to: null },
    ],
    notes: [],
  },
  {
    id: "park",
    name: "Owen Park",
    taste: "Bloomsbury debuts with a strong first fifty pages. He will not share a book with Hart.",
    tenures: [
      { imprint: "Bloomsbury", house: "Bloomsbury", role: "editor", from: "2018-09", to: null },
    ],
    notes: [
      {
        id: "park-n1",
        at: "2025-01-15",
        text: "If Hart has something, Park does not get it, and the other way around. Bloomsbury is one door.",
        audience: "desk",
      },
    ],
  },
  {
    id: "morel",
    name: "Jean-Paul Morel",
    taste: "Fitzcarraldo: translated-feeling English, short, severe, no apology.",
    tenures: [
      {
        imprint: "Fitzcarraldo Editions",
        house: "Fitzcarraldo",
        role: "editor",
        from: "2017-03",
        to: null,
      },
    ],
    notes: [],
  },
  {
    id: "brioni",
    name: "Kate Brioni",
    taste: "Granta: political without being a tract. She passed on Birds for a reason I must not forget.",
    tenures: [
      { imprint: "Granta", house: "Granta", role: "editorial director", from: "2016-08", to: null },
    ],
    notes: [],
  },
  {
    id: "yusuf",
    name: "Yusuf Rahman",
    taste: "Canongate: a public-facing literary novel. Not the same person as Sofia Rahman.",
    tenures: [
      { imprint: "Canongate", house: "Canongate", role: "publisher", from: "2013-02", to: null },
    ],
    notes: [],
  },
  {
    id: "archer",
    name: "Nell Archer",
    taste: "Virago: women's lives, not 'women's fiction'. She will say the distinction out loud.",
    tenures: [
      { imprint: "Virago", house: "Hachette", role: "editor", from: "2014-05", to: null },
    ],
    notes: [],
  },
  {
    id: "cho",
    name: "David Cho",
    taste: "FSG, formally restless, New York. He and Hale should not be imagined as the same reader.",
    tenures: [
      {
        imprint: "Farrar, Straus and Giroux",
        house: "Macmillan",
        role: "editor",
        from: "2017-11",
        to: null,
      },
    ],
    notes: [],
  },
  {
    id: "frost",
    name: "Amelia Frost",
    taste: "Graywolf: the sentence is the event. She will take a book Viking will not.",
    tenures: [
      { imprint: "Graywolf", house: "Graywolf", role: "executive editor", from: "2012-09", to: null },
    ],
    notes: [],
  },
  {
    id: "lind",
    name: "Theo Lind",
    taste: "Tin House: stories, and novels that behave like story collections.",
    tenures: [
      { imprint: "Tin House", house: "Tin House", role: "editor", from: "2019-04", to: null },
    ],
    notes: [],
  },
  {
    id: "pemberton",
    name: "Ruth Pemberton",
    taste: "Chatto: English, slightly old-fashioned in a way she would deny.",
    tenures: [
      {
        imprint: "Chatto & Windus",
        house: "Penguin Random House",
        role: "publisher",
        from: "2008-01",
        to: null,
      },
    ],
    notes: [],
  },
  {
    id: "stern",
    name: "Michael Stern",
    taste: "Little, Brown crime that wants to be taken seriously. Hugh is for him if the book stays ugly.",
    tenures: [
      { imprint: "Little, Brown", house: "Hachette", role: "editor", from: "2015-07", to: null },
    ],
    notes: [],
  },
  {
    id: "torres",
    name: "Gina Torres",
    taste: "Ecco: American literary with a saleable spine.",
    tenures: [
      { imprint: "Ecco", house: "HarperCollins", role: "editor", from: "2018-03", to: null },
    ],
    notes: [],
  },
  {
    id: "ng",
    name: "Pauline Ng",
    taste: "Scribner, precise, not sentimental. She will need the full Night Swimming manuscript, not a taste.",
    tenures: [
      {
        imprint: "Scribner",
        house: "Simon & Schuster",
        role: "executive editor",
        from: "2016-01",
        to: null,
      },
    ],
    notes: [],
  },
  {
    id: "bloom",
    name: "Ira Bloom",
    taste: "Pantheon: odd, Jewish, comic when it is allowed to be.",
    tenures: [
      {
        imprint: "Pantheon",
        house: "Penguin Random House",
        role: "senior editor",
        from: "2006-09",
        to: null,
      },
    ],
    notes: [],
  },
  {
    id: "klein",
    name: "Sasha Klein",
    taste: "Doubleday commercial-literary. Useful when a book has a hook I am slightly ashamed of.",
    tenures: [
      {
        imprint: "Doubleday",
        house: "Penguin Random House",
        role: "editor",
        from: "2019-08",
        to: null,
      },
    ],
    notes: [],
  },
  {
    id: "tran",
    name: "Willa Tran",
    taste: "And Other Stories: international, slim, the opposite of a campaign novel.",
    tenures: [
      {
        imprint: "And Other Stories",
        house: "And Other Stories",
        role: "editor",
        from: "2016-02",
        to: null,
      },
    ],
    notes: [],
  },
  {
    id: "holst",
    name: "Greg Holst",
    taste: "New Directions: the unfashionable book that will still be in print.",
    tenures: [
      {
        imprint: "New Directions",
        house: "New Directions",
        role: "editor",
        from: "2010-06",
        to: null,
      },
    ],
    notes: [],
  },
  {
    id: "vega",
    name: "Marisol Vega",
    taste: "Europa: European-feeling, translated or not. She took The Last Apprentice because it felt already translated.",
    tenures: [
      {
        imprint: "Europa Editions",
        house: "Europa",
        role: "editor",
        from: "2017-01",
        to: null,
      },
    ],
    notes: [],
  },
];

export const AUTHORS: Author[] = [
  {
    id: "ellison",
    name: "Naomi Ellison",
    notes: [
      {
        id: "ell-n1",
        at: "2025-03-12",
        text: "Do not mention the Faber pass on Winter Guests. She took it as a verdict on her and I spent a week talking her down. The Glass House is a different book.",
        audience: "desk",
      },
      {
        id: "ell-n2",
        at: "2026-06-16",
        text: "I have told her silence is ordinary. She believes me on Tuesdays.",
        audience: "desk",
      },
      {
        id: "ell-n3",
        at: "2026-06-20",
        text: "Cape, FSG and Graywolf have The Glass House. I will write when the picture changes, and not before.",
        audience: "shareable",
      },
    ],
  },
  {
    id: "voss",
    name: "Leah Voss",
    notes: [
      {
        id: "voss-n1",
        at: "2026-07-20",
        text: "Her mother is ill. Be gentle on timing. The exclusive was Leah's idea — she wanted one serious American read before a general.",
        audience: "desk",
      },
      {
        id: "voss-n2",
        at: "2026-07-22",
        text: "Riverhead has Salt Line on an exclusive until the first days of September. After that I can go wider if we need to.",
        audience: "shareable",
      },
    ],
  },
  {
    id: "okeke",
    name: "Daniel Okeke",
    notes: [
      {
        id: "oke-n1",
        at: "2026-08-28",
        text: "Anxious. Wants daily updates. I write on Tuesdays. Do not show him the Viking number until I have heard from the others, and never in an email he can forward to his brother.",
        audience: "desk",
      },
      {
        id: "oke-n2",
        at: "2026-08-29",
        text: "We have an offer. I am not putting the figure here. The other editors have until the 7th of September. I will telephone.",
        audience: "shareable",
      },
    ],
  },
  {
    id: "wu",
    name: "Frances Wu",
    notes: [
      {
        id: "wu-n1",
        at: "2026-08-18",
        text: "The Ferry is in auction. Same noon for everyone. Frances wants to 'just send Knopf a hint'. I will not.",
        audience: "desk",
      },
      {
        id: "wu-n2",
        at: "2026-08-19",
        text: "Four houses are bidding on The Ferry. The process is the same for each of them. I will call you when it closes.",
        audience: "shareable",
      },
    ],
  },
  {
    id: "pell",
    name: "Marcus Pell",
    notes: [
      {
        id: "pell-n1",
        at: "2026-07-01",
        text: "A Kind of Weather is the book I have been waiting for from him. Do not let him tinker while it is out.",
        audience: "desk",
      },
    ],
  },
  {
    id: "srahman",
    name: "Sofia Rahman",
    notes: [
      {
        id: "sof-n1",
        at: "2026-05-02",
        text: "Seven passes. She has asked me twice for the list. I will not give it to her. The intelligence is for the second round, not for her to metabolise.",
        audience: "desk",
      },
      {
        id: "sof-n2",
        at: "2026-05-10",
        text: "The Translation of Birds has been through a first round. I am not going to itemise the houses. The sentences are being admired; the question is where a book this quiet sits on a list. That is placement, not quality. I go out again in the second week of September.",
        audience: "shareable",
      },
    ],
  },
  {
    id: "denning",
    name: "Hugh Denning",
    notes: [
      {
        id: "den-n1",
        at: "2026-08-04",
        text: "Second Sitting is uglier than his last, which is the point. Little, Brown has it. If Stern passes I go to Serpent's Tail — Sam would know what to do with it.",
        audience: "desk",
      },
    ],
  },
  {
    id: "may",
    name: "Clara May",
    notes: [
      {
        id: "may-n1",
        at: "2026-08-14",
        text: "Debut. House of Hours is with Park at Bloomsbury. Hart does not get a look while he has it.",
        audience: "desk",
      },
    ],
  },
  {
    id: "kol",
    name: "Esther Kol",
    notes: [
      {
        id: "kol-n1",
        at: "2026-06-30",
        text: "The Inland Sea is the one I would take to Archer first and I did. Nine weeks is long even for Virago.",
        audience: "desk",
      },
    ],
  },
  {
    id: "bridger",
    name: "James Bridger",
    notes: [],
    betweenBooks: "Ordinary Light is his second collection. The first earned out slowly and is still in print at Graywolf.",
  },
  {
    id: "sen",
    name: "Meera Sen",
    notes: [
      {
        id: "sen-n1",
        at: "2026-08-24",
        text: "Monsoon Inventory is the first thing I have sent Priya at Hamilton. The last pass was Priya at Bloomsbury, for a reason that may no longer hold.",
        audience: "desk",
      },
    ],
  },
  {
    id: "ash",
    name: "Robyn Ash",
    notes: [],
  },
  { id: "wren", name: "Thomas Wren", notes: [], betweenBooks: "Between novels. Last sold to Chatto, 2024." },
  { id: "pym", name: "Alice Pym", notes: [], betweenBooks: "Essays. Not on submission." },
  { id: "bcho", name: "Benjamin Cho", notes: [], betweenBooks: "First novel delivered; I am still editing." },
  { id: "ilang", name: "Iris Lang", notes: [], betweenBooks: "Backlist at Canongate. A new idea in notes." },
  { id: "doyle", name: "Patrick Doyle", notes: [], betweenBooks: "Crime, resting." },
  { id: "tanaka", name: "Yuki Tanaka", notes: [], betweenBooks: "Translation project, not yet a manuscript." },
  { id: "hfrost", name: "Helen Frost", notes: [], betweenBooks: "Stories. Not the Amelia Frost at Graywolf." },
  { id: "reed", name: "Samuel Reed", notes: [], betweenBooks: "Sold last spring; copy-edit in October." },
  { id: "blake", name: "Nora Blake", notes: [], betweenBooks: "Proposal only." },
  { id: "kemp", name: "David Kemp", notes: [], betweenBooks: "History. Between contracts." },
  { id: "okafor", name: "Amara Okafor", notes: [], betweenBooks: "Second novel promised for January." },
  { id: "lmartin", name: "Louis Martin", notes: [], betweenBooks: "Poetry. I do not submit poetry on this desk." },
  { id: "berg", name: "Caitlin Berg", notes: [], betweenBooks: "Memoir, paused at her request." },
  { id: "kapoor", name: "Rajiv Kapoor", notes: [], betweenBooks: "Sold to Picador, 2025." },
  { id: "shore", name: "Emily Shore", notes: [], betweenBooks: "Children's, with another agent at the house." },
  { id: "fgrant", name: "Felix Grant", notes: [], betweenBooks: "Not Elspeth Grant. Debut still in draft." },
  { id: "jvale", name: "Josephine Vale", notes: [], betweenBooks: "Not Christopher Vale. Novel under option." },
  { id: "andreou", name: "Nikos Andreou", notes: [], betweenBooks: "Greek, writing in English. Next book 2027." },
  { id: "sbell", name: "Sarah Bell", notes: [], betweenBooks: "Commercial women's. Quiet on purpose." },
  { id: "ocole", name: "Owen Cole", notes: [], betweenBooks: "Not Owen Park. Non-fiction proposal." },
  { id: "mpark", name: "Mina Park", notes: [], betweenBooks: "Stories. Looking for the right editor, not a spray." },
  { id: "clane", name: "Christopher Lane", notes: [], betweenBooks: "Third novel, I turned it back once." },
  { id: "nour", name: "Adele Nour", notes: [], betweenBooks: "French-English. Between translations." },
  { id: "hmoss2", name: "Henry Moss", notes: [], betweenBooks: "Not Hannah Moss. Sold, waiting on a title." },
  { id: "ortega", name: "Lina Ortega", notes: [], betweenBooks: "Debut I am still shaping." },
];

export const BOOKS: Book[] = [
  {
    id: "glass",
    authorId: "ellison",
    title: "The Glass House",
    kind: "novel",
    line: "A marriage, a glass extension, and a crack that is not in the glass.",
  },
  {
    id: "winter",
    authorId: "ellison",
    title: "Winter Guests",
    kind: "novel",
    line: "The last book. Sold to Chatto after Faber passed. In paperback.",
  },
  {
    id: "salt",
    authorId: "voss",
    title: "Salt Line",
    kind: "novel",
    line: "A coastal inheritance and the people who cannot afford to refuse it.",
  },
  {
    id: "night",
    authorId: "okeke",
    title: "Night Swimming",
    kind: "novel",
    line: "Lagos, London, a brother who cannot swim and a brother who will not stop.",
  },
  {
    id: "ferry",
    authorId: "wu",
    title: "The Ferry",
    kind: "novel",
    line: "Three nights on a crossing that should have taken one.",
  },
  {
    id: "weather",
    authorId: "pell",
    title: "A Kind of Weather",
    kind: "novel",
    line: "A meteorologist, a disappearing village, no metaphor she does not earn.",
  },
  {
    id: "birds",
    authorId: "srahman",
    title: "The Translation of Birds",
    kind: "novel",
    line: "A marriage and a migration, told as if both were a language problem.",
  },
  {
    id: "sitting",
    authorId: "denning",
    title: "Second Sitting",
    kind: "novel",
    line: "A catering murder that refuses to become a puzzle.",
  },
  {
    id: "hours",
    authorId: "may",
    title: "House of Hours",
    kind: "novel",
    line: "A debut: a clockmaker's daughter and a year that will not strike.",
  },
  {
    id: "inland",
    authorId: "kol",
    title: "The Inland Sea",
    kind: "novel",
    line: "Two sisters, a drained lake, a country that renamed the water.",
  },
  {
    id: "ordinary",
    authorId: "bridger",
    title: "Ordinary Light",
    kind: "stories",
    line: "Twelve stories in which nothing is ordinary except the light.",
  },
  {
    id: "monsoon",
    authorId: "sen",
    title: "Monsoon Inventory",
    kind: "novel",
    line: "A civil servant counts what the rain takes. The last book Priya passed, in another life.",
  },
  {
    id: "apprentice",
    authorId: "ash",
    title: "The Last Apprentice",
    kind: "novel",
    line: "A tailor in a city that has stopped needing clothes.",
  },
];

/**
 * About twenty currently out; the rest are the memory — passes kept because
 * the reason is the point.
 */
export const SUBMISSIONS: Submission[] = [
  {
    id: "s-glass-hale",
    bookId: "glass",
    editorId: "hale",
    sent: "2026-06-15",
    imprintThen: "Jonathan Cape",
    state: { kind: "out" },
  },
  {
    id: "s-glass-cho",
    bookId: "glass",
    editorId: "cho",
    sent: "2026-07-20",
    imprintThen: "Farrar, Straus and Giroux",
    state: { kind: "out" },
  },
  {
    id: "s-glass-frost",
    bookId: "glass",
    editorId: "frost",
    sent: "2026-08-03",
    imprintThen: "Graywolf",
    state: { kind: "out" },
  },
  {
    id: "s-salt-chen",
    bookId: "salt",
    editorId: "chen",
    sent: "2026-07-22",
    imprintThen: "Riverhead",
    state: { kind: "out", exclusiveUntil: "2026-09-02" },
  },
  {
    id: "s-night-ruiz",
    bookId: "night",
    editorId: "ruiz",
    sent: "2026-07-08",
    imprintThen: "Viking",
    state: {
      kind: "offer",
      at: "2026-08-28",
      terms: "North American, two-book, a number I will not type here. Reply asked of the others by 7 September.",
      othersBy: "2026-09-07",
    },
  },
  {
    id: "s-night-grant",
    bookId: "night",
    editorId: "grant",
    sent: "2026-07-08",
    imprintThen: "Hamish Hamilton",
    state: { kind: "out" },
  },
  {
    id: "s-night-ng",
    bookId: "night",
    editorId: "ng",
    sent: "2026-07-09",
    imprintThen: "Scribner",
    state: { kind: "out" },
  },
  {
    id: "s-night-bloom",
    bookId: "night",
    editorId: "bloom",
    sent: "2026-07-09",
    imprintThen: "Pantheon",
    state: { kind: "out" },
  },
  {
    id: "s-ferry-desai",
    bookId: "ferry",
    editorId: "desai",
    sent: "2026-08-18",
    imprintThen: "Faber & Faber",
    state: { kind: "auction", close: "2026-09-04", closeLabel: "Friday 4 September, noon London" },
  },
  {
    id: "s-ferry-vale",
    bookId: "ferry",
    editorId: "vale",
    sent: "2026-08-18",
    imprintThen: "Knopf",
    state: { kind: "auction", close: "2026-09-04", closeLabel: "Friday 4 September, noon London" },
  },
  {
    id: "s-ferry-hmoss",
    bookId: "ferry",
    editorId: "hmoss",
    sent: "2026-08-18",
    imprintThen: "Picador",
    state: { kind: "auction", close: "2026-09-04", closeLabel: "Friday 4 September, noon London" },
  },
  {
    id: "s-ferry-torres",
    bookId: "ferry",
    editorId: "torres",
    sent: "2026-08-18",
    imprintThen: "Ecco",
    state: { kind: "auction", close: "2026-09-04", closeLabel: "Friday 4 September, noon London" },
  },
  {
    id: "s-weather-brioni",
    bookId: "weather",
    editorId: "brioni",
    sent: "2026-07-28",
    imprintThen: "Granta",
    state: { kind: "out" },
  },
  {
    id: "s-weather-yusuf",
    bookId: "weather",
    editorId: "yusuf",
    sent: "2026-07-06",
    imprintThen: "Canongate",
    state: { kind: "out" },
  },
  {
    id: "s-weather-morel",
    bookId: "weather",
    editorId: "morel",
    sent: "2026-08-10",
    imprintThen: "Fitzcarraldo Editions",
    state: { kind: "out" },
  },
  {
    id: "s-hours-park",
    bookId: "hours",
    editorId: "park",
    sent: "2026-08-17",
    imprintThen: "Bloomsbury",
    state: { kind: "out" },
  },
  {
    id: "s-inland-archer",
    bookId: "inland",
    editorId: "archer",
    sent: "2026-06-30",
    imprintThen: "Virago",
    state: { kind: "out" },
  },
  {
    id: "s-inland-tran",
    bookId: "inland",
    editorId: "tran",
    sent: "2026-07-14",
    imprintThen: "And Other Stories",
    state: { kind: "out" },
  },
  {
    id: "s-ordinary-lind",
    bookId: "ordinary",
    editorId: "lind",
    sent: "2026-07-21",
    imprintThen: "Tin House",
    state: { kind: "out" },
  },
  {
    id: "s-monsoon-nair",
    bookId: "monsoon",
    editorId: "nair",
    sent: "2026-08-24",
    imprintThen: "Hamish Hamilton",
    state: { kind: "out" },
  },
  {
    id: "s-sitting-stern",
    bookId: "sitting",
    editorId: "stern",
    sent: "2026-08-04",
    imprintThen: "Little, Brown",
    state: { kind: "out" },
  },
  {
    id: "s-apprentice-vega",
    bookId: "apprentice",
    editorId: "vega",
    sent: "2026-07-27",
    imprintThen: "Europa Editions",
    state: { kind: "out" },
  },

  // Memory: Winter Guests
  {
    id: "s-winter-desai",
    bookId: "winter",
    editorId: "desai",
    sent: "2024-09-02",
    imprintThen: "Faber & Faber",
    state: {
      kind: "pass",
      at: "2024-11-19",
      intelligence:
        "Admired the sentences; said the marriage never became a book. She would look at Naomi again if the next one had a public world, not another closed house. Do not mention this pass to Naomi.",
    },
  },
  {
    id: "s-winter-pemberton",
    bookId: "winter",
    editorId: "pemberton",
    sent: "2024-11-28",
    imprintThen: "Chatto & Windus",
    state: { kind: "withdrawn", at: "2025-01-20", reason: "Offer accepted — not a pass. In print." },
  },

  // Memory: Birds — seven passes, the intelligence is the asset
  {
    id: "s-birds-hale",
    bookId: "birds",
    editorId: "hale",
    sent: "2025-11-03",
    imprintThen: "Jonathan Cape",
    state: {
      kind: "pass",
      at: "2026-01-14",
      intelligence:
        "The birds were doing too much metaphorical work. He wanted the marriage. He asked me not to send him the next one until the metaphor had a job.",
    },
  },
  {
    id: "s-birds-brioni",
    bookId: "birds",
    editorId: "brioni",
    sent: "2025-11-03",
    imprintThen: "Granta",
    state: {
      kind: "pass",
      at: "2026-01-22",
      intelligence:
        "She wanted a political novel and received a private one. 'I kept waiting for the state to arrive.' Do not send her the quiet revision. Send her the next book if it has a street in it.",
    },
  },
  {
    id: "s-birds-frost",
    bookId: "birds",
    editorId: "frost",
    sent: "2025-11-04",
    imprintThen: "Graywolf",
    state: {
      kind: "pass",
      at: "2026-02-03",
      intelligence:
        "Loved the last forty pages and not the first eighty. Asked whether Sofia would cut the opening migration. I said no; she said then she could not see the paperback.",
      shareable: "One editor wanted a shorter opening. I did not agree.",
    },
  },
  {
    id: "s-birds-morel",
    bookId: "birds",
    editorId: "morel",
    sent: "2025-11-04",
    imprintThen: "Fitzcarraldo Editions",
    state: {
      kind: "pass",
      at: "2026-02-18",
      intelligence:
        "Too English. He meant it as a compliment to the sentences and a no to the list. Fitzcarraldo is wrong for a second attempt.",
    },
  },
  {
    id: "s-birds-chen",
    bookId: "birds",
    editorId: "chen",
    sent: "2025-11-10",
    imprintThen: "Riverhead",
    state: {
      kind: "pass",
      at: "2026-03-02",
      intelligence:
        "Could not see how she would publish it next to the bigger voices on her list. 'I would have taken this at Catapult. I cannot take it here.' The move changed the yes.",
    },
  },
  {
    id: "s-birds-holst",
    bookId: "birds",
    editorId: "holst",
    sent: "2025-12-01",
    imprintThen: "New Directions",
    state: {
      kind: "pass",
      at: "2026-03-20",
      intelligence:
        "He is over-inventoried on marriages. Asked for the next thing, not a rewrite. A genuine later.",
    },
  },
  {
    id: "s-birds-tran",
    bookId: "birds",
    editorId: "tran",
    sent: "2026-01-08",
    imprintThen: "And Other Stories",
    state: {
      kind: "pass",
      at: "2026-04-11",
      intelligence:
        "Loved it and could not afford it. Not a literary no. Keep her for a slimmer book.",
      shareable: "One small house loved it and could not make the numbers work.",
    },
  },

  // Priya at Bloomsbury — same person, other imprint
  {
    id: "s-monsoon-nair-bloomsbury",
    bookId: "monsoon",
    editorId: "nair",
    sent: "2022-10-03",
    imprintThen: "Bloomsbury",
    state: {
      kind: "pass",
      at: "2023-01-09",
      intelligence:
        "Then: too quiet for the Bloomsbury list she had inherited, and she said so. She also said the civil-service sections were the book. She is at Hamilton now, which is built for that. The pass is not a pass at Hamilton.",
    },
  },

  // Sam, as assistant — not his no
  {
    id: "s-winter-okonkwo",
    bookId: "winter",
    editorId: "okonkwo",
    sent: "2024-09-04",
    imprintThen: "Jonathan Cape",
    state: {
      kind: "pass",
      at: "2024-10-02",
      intelligence:
        "This was Hale's no, written up by Sam. Sam told me later he would have held it. He can hold things now. Winter Guests is sold; the next ugly, funny book is his.",
    },
  },
];

export const EDITOR_BY_ID = Object.fromEntries(EDITORS.map((e) => [e.id, e])) as Record<
  string,
  Editor
>;
export const AUTHOR_BY_ID = Object.fromEntries(AUTHORS.map((a) => [a.id, a])) as Record<
  string,
  Author
>;
export const BOOK_BY_ID = Object.fromEntries(BOOKS.map((b) => [b.id, b])) as Record<string, Book>;

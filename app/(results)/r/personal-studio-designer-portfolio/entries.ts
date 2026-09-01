/**
 * A modelled career. The names, clients and dates are invented for this
 * gallery. The problem is not: fourteen years of uneven work cannot be told
 * as six case studies, and a two-line note is not a small project.
 */

export type Lens = "delivered" | "thought" | "made";

export type Entry = {
  id: string;
  date: string;
  year: number;
  title: string;
  /** Months of actual attention. This is the honest weight. */
  months: number;
  /** How much each reader should find this. Does not change the width. */
  for: Record<Lens, 1 | 2 | 3>;
  /** One-line register. The collapsed view. */
  line: string;
  /** The body. Two-line notes are only this, on purpose. */
  body: string;
  delivered?: string;
  thought?: string;
  made?: string;
};

export const YEARS = [
  2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024,
  2025, 2026,
] as const;

export const LENSES: {
  id: Lens;
  label: string;
  reader: string;
  hint: string;
}[] = [
  {
    id: "delivered",
    label: "Delivered",
    reader: "a client",
    hint: "What shipped, for whom, and whether anyone still uses it.",
  },
  {
    id: "thought",
    label: "Thought",
    reader: "a collaborator",
    hint: "How the work was decided, including what failed.",
  },
  {
    id: "made",
    label: "Made",
    reader: "a peer",
    hint: "The technique — what was actually figured out.",
  },
];

export const ENTRIES: Entry[] = [
  {
    id: "hire",
    date: "2012-02",
    year: 2012,
    title: "Halve",
    months: 0.2,
    for: { delivered: 1, thought: 1, made: 1 },
    line: "Hired because I could sit still.",
    body: "A small studio in Manchester. Brochure sites for regional theatres. I learned to ship on a Thursday.",
  },
  {
    id: "brochures",
    date: "2012-06",
    year: 2012,
    title: "Six theatres",
    months: 8,
    for: { delivered: 3, thought: 1, made: 1 },
    line: "Six brochure sites, one template I was not allowed to break.",
    body: "The same skeleton six times: season, cast, book. I was not the designer. I was the person who made the dates change when the print leaflet changed.",
    delivered:
      "All six launched before their seasons. Two are still up, rebuilt by other people on the same information model. A client who needs a site that can be updated by a box office on a Saturday will find this more useful than anything I made later.",
    thought:
      "I wanted to make six different sites. The producer was right. The theatres were not six brands; they were one kind of organisation with six names. I spent a year learning that sameness is sometimes the work.",
    made: "A single XML feed from their booking system, parsed into static pages overnight. Nothing clever. It ran for four years without me.",
  },
  {
    id: "flash",
    date: "2012-11",
    year: 2012,
    title: "Flash, then not",
    months: 0.3,
    for: { delivered: 1, thought: 2, made: 3 },
    line: "The last SWF I shipped, and the first week without one.",
    body: "A navigation I had been proud of stopped opening. I rewrote it in a weekend. The rewrite was worse, and it worked.",
  },
  {
    id: "canvas-weekend",
    date: "2012-12",
    year: 2012,
    title: "A weekend with canvas",
    months: 0.15,
    for: { delivered: 1, thought: 1, made: 2 },
    line: "Drew a circle that followed the mouse. Deleted it.",
    body: "I kept the file. I have not opened it. The point was that the browser would draw.",
  },
  {
    id: "left-halve",
    date: "2013-03",
    year: 2013,
    title: "Left Halve",
    months: 0.1,
    for: { delivered: 1, thought: 2, made: 1 },
    line: "Left before I was good. The leaving was correct.",
    body: "I had one trick and I was repeating it. Freelance is a worse school, but at least the mistakes are mine.",
  },
  {
    id: "museum-sites",
    date: "2013-08",
    year: 2013,
    title: "Three museum microsites",
    months: 5,
    for: { delivered: 3, thought: 2, made: 2 },
    line: "Three exhibitions, three deadlines, one exhausted registrar.",
    body: "A city museum asked for a site per show. The registrar sent object lists as Word files. I built a small pipeline so she could send the same file twice.",
    delivered:
      "Three shows, on time, on a public-sector budget. The object pages were printable. That was the brief, unstated: a teacher had to be able to take a label into a classroom.",
    thought:
      "I asked to design the shows. I was hired to get the labels online. Once I stopped confusing those, the registrar started sending the files earlier.",
    made: "A script that turned a named-style Word document into structured records. Fragile, documented, and used for two more years after I left.",
  },
  {
    id: "failed-app",
    date: "2013-11",
    year: 2013,
    title: "The app that didn't",
    months: 4,
    for: { delivered: 1, thought: 3, made: 2 },
    line: "A location app with a friend. We built it. Nobody wanted it.",
    body: "We spent four months making a thing for a user we had invented. The invention was flattering. The store listing was not.",
    delivered:
      "It shipped. That is the only honest sentence I can offer a client. Fourteen downloads, nine of them ours. I put it here so the record is not a list of things that worked.",
    thought:
      "We started from a mechanic we liked and went looking for a person who needed it. That is how you spend a winter. I do not start from a mechanic now. I start from a person who already has a mess.",
    made: "Background geolocation on 2013 phones, a lot of battery apology, a map I should not have drawn myself. The code is gone. The lesson is not.",
  },
  {
    id: "baseline",
    date: "2013-12",
    year: 2013,
    title: "How to keep a baseline",
    months: 0.25,
    for: { delivered: 1, thought: 2, made: 3 },
    line: "Spent a week making 16px and 24px share a grid. Still do this.",
    body: "Not a project. A habit I could not leave alone. Most of what I am proud of looks like this from the outside: a week that did not produce a name.",
  },
  {
    id: "enough-canvas",
    date: "2014-04",
    year: 2014,
    title: "Enough canvas",
    months: 0.4,
    for: { delivered: 1, thought: 2, made: 3 },
    line: "Learned to draw, then learned when not to.",
    body: "A client asked for particles behind the heading. I built them, then took them out before launch. The heading was the work.",
  },
  {
    id: "festival-killed",
    date: "2014-07",
    year: 2014,
    title: "Festival system, cancelled",
    months: 3,
    for: { delivered: 1, thought: 3, made: 2 },
    line: "An identity system for a festival that lost its venue.",
    body: "Three months of type, a colour, a set of rules for other people to use. The festival did not happen. The rules were the only thing I kept.",
    delivered: "Nothing shipped to the public. I invoiced for the months. That is the whole delivery record.",
    thought:
      "I had designed for a week of weather in a park. When the park fell through I had no system left, because I had designed an event, not a practice. I keep that distinction now.",
    made: "A small set of layout rules — measure, crop, overprint — written so a volunteer could make a flyer. The volunteer never arrived. The writing taught me more than the drawings.",
  },
  {
    id: "church-talk",
    date: "2014-10",
    year: 2014,
    title: "A talk in a church hall",
    months: 0.15,
    for: { delivered: 1, thought: 2, made: 1 },
    line: "Fourteen people. I talked about defaults.",
    body: "I said that most of my job was choosing not to invent a system. Someone in the second row was a producer I still work with.",
  },
  {
    id: "day-rate",
    date: "2014-12",
    year: 2014,
    title: "Billing by the day",
    months: 0.1,
    for: { delivered: 2, thought: 2, made: 1 },
    line: "Stopped quoting projects. Started quoting days.",
    body: "The work was never the thing in the quote. The work was the week the thing met the actual organisation.",
  },
  {
    id: "quarry-start",
    date: "2015-02",
    year: 2015,
    title: "Quarry Press writes",
    months: 0.2,
    for: { delivered: 2, thought: 2, made: 1 },
    line: "A publisher asked if I could make a place to read.",
    body: "Not a shop. A room. They had eight titles and a fear of Amazon. I said yes before I knew how.",
  },
  {
    id: "reader",
    date: "2015-10",
    year: 2015,
    title: "The reader",
    months: 8,
    for: { delivered: 3, thought: 2, made: 3 },
    line: "A reading app for eight books. Still the way I think about type on a phone.",
    body: "Eight months of measure, hyphenation, and a contents page that did not lie about how long a chapter was. It shipped. People read in it.",
    delivered:
      "Launched with the autumn list. The publisher used it for four lists before they were bought. I can show a client the reading view, the contents, and the fact that a 70-year-old reader wrote to thank them — not me — for the type size.",
    thought:
      "I wanted a beautiful object. They wanted their books to be finishable on a bus. Every argument I lost made the thing more like a book. I keep a note of the arguments I lost.",
    made: "CSS hyphenation was not enough, so I wrote a small breaker that respected their house style — em-dashes, no break before a numeral. The scroller kept position across a chapter, not a page, because a page is not a unit of reading on a phone.",
  },
  {
    id: "threw-away",
    date: "2015-11",
    year: 2015,
    title: "What I threw away",
    months: 0.2,
    for: { delivered: 1, thought: 3, made: 2 },
    line: "A skin that made the books look like a magazine. Gone before launch.",
    body: "It photographed well. It made chapter one feel like an article. The editor was polite, and firm.",
  },
  {
    id: "hyphens",
    date: "2015-12",
    year: 2015,
    title: "Hyphenation, the hard way",
    months: 0.35,
    for: { delivered: 1, thought: 1, made: 3 },
    line: "Patterns, exceptions, a list of words the house would not split.",
    body: "I still have the exception list. ‘Manchester’ may not break. Neither may the author’s name.",
  },
  {
    id: "paid-year",
    date: "2015-12",
    year: 2015,
    title: "Paid for a year",
    months: 0.1,
    for: { delivered: 2, thought: 2, made: 1 },
    line: "First time a client retained me. I bought a better chair.",
    body: "The chair was a mistake. The retainment was not. Someone wanted me in the room after launch.",
  },
  {
    id: "sighted-ask",
    date: "2016-01",
    year: 2016,
    title: "The ask",
    months: 0.15,
    for: { delivered: 2, thought: 2, made: 1 },
    line: "A charity had a decade of bird sightings in a spreadsheet.",
    body: "They wanted a map. I had made maps. I said yes too fast. That is the whole origin of the thing I am known for.",
  },
  {
    id: "sighted",
    date: "2016-08",
    year: 2016,
    title: "Sighted",
    months: 7,
    for: { delivered: 3, thought: 2, made: 2 },
    line: "The map. Shared until I was sick of it. I would not make it now.",
    body: "I mapped a decade of citizen-science bird sightings. It was shared far past the point of being useful. The projection is a default. The legend is wrong in three places. I still get emails.",
    delivered:
      "This is the piece a client has already seen. It launched in August 2016, was used in two newspapers, and is the reason my name is searchable. If you need proof that I can take a dead spreadsheet and make a public thing that people pass on, this is that proof. I will also tell you, before you ask for another one, that I will not make another one.",
    thought:
      "I designed for the share, not for the sighting. The map rewards density — cities light up, moorland disappears — which is the opposite of what the charity cared about. I learned that a visualisation has a politics whether you write one or not. I am embarrassed by the piece and I keep it in the log at its true size, which is seven months, not a career.",
    made: "D3, a tiled base I should have paid for, a choropleth on raw counts instead of effort-corrected rates. The three legend errors: a bin edge repeated, a colour that is not colour-blind safe, and ‘sightings’ where I meant ‘records’. I know how to do this properly now. I did not then. The repo is public; I have not touched it.",
  },
  {
    id: "emails",
    date: "2016-09",
    year: 2016,
    title: "The emails",
    months: 0.2,
    for: { delivered: 1, thought: 3, made: 1 },
    line: "Strangers asked me to map their uncle, their borough, their grief.",
    body: "I answered the first twenty. Then I wrote a short note and stopped. Attention is not a commission.",
  },
  {
    id: "legend",
    date: "2016-10",
    year: 2016,
    title: "Three mistakes in the legend",
    months: 0.25,
    for: { delivered: 1, thought: 2, made: 3 },
    line: "I wrote them down so I would stop pretending they were details.",
    body: "A repeated bin. A colour that vanishes for some eyes. A word that is not the word. I still check legends first.",
  },
  {
    id: "log-begins",
    date: "2016-12",
    year: 2016,
    title: "This log",
    months: 0.1,
    for: { delivered: 1, thought: 3, made: 1 },
    line: "Started writing the work down so the map would not be the whole story.",
    body: "A text file, then another. The shape you are looking at began as a refusal to be the person who made Sighted.",
  },
  {
    id: "another-sighted",
    date: "2017-03",
    year: 2017,
    title: "Another Sighted",
    months: 0.2,
    for: { delivered: 2, thought: 3, made: 1 },
    line: "Four offers to do the same map for different animals. I said no.",
    body: "One I said yes to, for a week, before I sent the money back. I do not have a series in me. I have a mistake I already made.",
  },
  {
    id: "studio-fold",
    date: "2017-11",
    year: 2017,
    title: "A studio, folded",
    months: 14,
    for: { delivered: 1, thought: 3, made: 2 },
    line: "Two friends, eighteen months, a name, then not.",
    body: "We rented a room. We took work we did not want so we could afford work we did. The room outlasted the wanting. Folding it taught me more than any launch that year.",
    delivered:
      "A handful of sites under a name that no longer exists. I will not list them as a studio’s portfolio. They were jobs. The useful fact for a client is that I have been inside a small company that did not work, and I know what that costs.",
    thought:
      "We organised around taste. Taste does not make a Tuesday. We needed a way of choosing work, and a way of refusing it, and we had only the first. I will not start another company with people I only admire.",
    made: "A shared component kit that was too proud to be copied, and so was not. I write kits now that I am willing to see used badly.",
  },
  {
    id: "night-class",
    date: "2017-10",
    year: 2017,
    title: "Night class",
    months: 0.4,
    for: { delivered: 1, thought: 2, made: 2 },
    line: "Taught HTML to adults in a library. They asked better questions than students.",
    body: "Why does this break when I add a sentence? That is still the right question.",
  },
  {
    id: "folding-taught",
    date: "2017-12",
    year: 2017,
    title: "What folding taught",
    months: 0.2,
    for: { delivered: 1, thought: 3, made: 1 },
    line: "A company is a way of saying yes. We had no way of saying no.",
    body: "I write the no down now, before the work starts. If I cannot, I do not start.",
  },
  {
    id: "in-house",
    date: "2018-02",
    year: 2018,
    title: "In-house",
    months: 0.15,
    for: { delivered: 2, thought: 2, made: 1 },
    line: "Joined a product team. Badge, stand-up, a kitchen with better coffee.",
    body: "I wanted to see work that lasted longer than a launch. I stayed two years.",
  },
  {
    id: "tokens",
    date: "2018-08",
    year: 2018,
    title: "Tokens, then under the tokens",
    months: 6,
    for: { delivered: 2, thought: 2, made: 3 },
    line: "A design system that was a list of colours until it wasn’t.",
    body: "The useful work was not the palette. It was the thing that stopped a spacing decision being a conversation every Tuesday.",
    delivered:
      "Shipped as a library the product teams actually imported. Adoption is the only metric I will offer: eleven surfaces, then sixteen. I can walk a client through one component and the three products it holds together.",
    thought:
      "The first version was a brand manual in code. Nobody needs a brand manual on a Tuesday. The second version answered a question a team was already asking. I wait for the question now.",
    made: "A set of typed tokens, a lint rule that failed a pull request if a magic number appeared in a layout file, and a page that showed the computed gap, not the token name. The lint rule did more than the documentation.",
  },
  {
    id: "unseen-prs",
    date: "2018-12",
    year: 2018,
    title: "Pull requests nobody saw",
    months: 0.3,
    for: { delivered: 1, thought: 2, made: 3 },
    line: "A year of making other people’s pages hold together.",
    body: "This is most of a career, if you are honest. It does not photograph.",
  },
  {
    id: "off-twitter",
    date: "2018-11",
    year: 2018,
    title: "Stopped putting work up",
    months: 0.1,
    for: { delivered: 1, thought: 3, made: 1 },
    line: "The map had trained me to need an audience. I stopped feeding it.",
    body: "I missed the noise for a month. Then I didn’t.",
  },
  {
    id: "killed-tool",
    date: "2019-05",
    year: 2019,
    title: "The tool they didn’t ship",
    months: 5,
    for: { delivered: 1, thought: 3, made: 3 },
    line: "An internal editor. Finished. Never put in front of the people who needed it.",
    body: "We built the wrong door into the right room. Killing it was the most adult thing that team did.",
    delivered:
      "No public artefact. A client asking what I have shipped this year will not find this. I include it because a finished thing that does not launch is still work, and because I was the person who said we should stop.",
    thought:
      "The editor was elegant. The people who would have used it already had a mess they understood. We had not sat with the mess long enough. I will not start a tool now before I have used the bad one for a week.",
    made: "A block model, undo that restored selection, a paste path that did not mangle their existing documents. The paste path is the only piece I have reused. Undo-with-selection I have rewritten twice since.",
  },
  {
    id: "constraints",
    date: "2019-07",
    year: 2019,
    title: "Constraint sketches",
    months: 0.4,
    for: { delivered: 1, thought: 2, made: 3 },
    line: "Started drawing layouts as inequalities. It looked like homework.",
    body: "It was homework. It became the compositor.",
  },
  {
    id: "defaults-essay",
    date: "2019-09",
    year: 2019,
    title: "On defaults",
    months: 0.3,
    for: { delivered: 1, thought: 3, made: 2 },
    line: "A short piece about leaving the type alone.",
    body: "I published it on my own site. A few people who make books wrote back. That was enough.",
  },
  {
    id: "quarry-type",
    date: "2019-11",
    year: 2019,
    title: "Quarry, again",
    months: 3,
    for: { delivered: 3, thought: 2, made: 2 },
    line: "Typeset a short-run list. Ink, paper, a contents page that was true.",
    body: "They asked me back because the reader had been quiet and correct. This time the work was physical. I liked being unable to push a fix.",
    delivered:
      "Four titles, a printer in Yorkshire, on the date the warehouse needed them. A client who wants someone who has seen a book through a press can have this conversation in an hour.",
    thought:
      "On screen I had been able to fuss. On paper the fuss had a cost per page. I became a better screen designer that month.",
    made: "InDesign, their house styles, a contents script that counted actual pages after the last proof, not the pages we hoped for.",
  },
  {
    id: "compositor-thought",
    date: "2019-12",
    year: 2019,
    title: "A thought I could not leave",
    months: 0.2,
    for: { delivered: 1, thought: 3, made: 2 },
    line: "What if the layout engine was as stubborn as a compositor?",
    body: "Not a product idea. A irritation. The irritation lasted two years.",
  },
  {
    id: "brief-that-wasnt",
    date: "2020-02",
    year: 2020,
    title: "The brief that wasn’t",
    months: 0.25,
    for: { delivered: 1, thought: 3, made: 1 },
    line: "A publisher said: the books take too long to put on the page.",
    body: "They did not ask for a system. They asked for Tuesdays back. I heard a system anyway.",
  },
  {
    id: "compositor",
    date: "2020-11",
    year: 2020,
    title: "Compositor",
    months: 20,
    for: { delivered: 1, thought: 3, made: 3 },
    line: "A layout engine with no page, no repo, no credit line. The work I would keep.",
    body: "For two years I wrote the thing that puts one publisher’s books on a page. It has no public name. It is not in a case study. It has been running since 2020. This is the work I am proudest of, and the least useful thing I can show a stranger.",
    delivered:
      "I cannot send you a link. I can tell you that one house has used it for every trade title since late 2020, that the production editor still writes to me when a constraint fails, and that the failure mail is rare. If you need a visible artefact, this entry will disappoint you. If you need someone who will sit with an unglamorous problem until the Tuesday is shorter, this is the proof — you will have to take my word, and then ask them.",
    thought:
      "I started from the bad week: a designer fighting a template, an editor fighting the designer, a printer waiting. The engine is a list of things that may not happen — a break before a numeral, a widow, a folio colliding with a footnote. I spent a month writing down the prohibitions before I wrote a solver. Most of what I know about working with other people is in that month.",
    made: "A constraint solver over a simple box model. Input is a structured manuscript and a house file: measures, faces, the rules the house will not break. Output is a page list. It is not a general tool. The specialisation is why it works. I used a cascade of passes rather than a single global solve — hyphenation, then vertical, then a last pass for folios — because a global solve made worse pages and I could not explain them. I can explain every pass. That was the requirement I set myself.",
  },
  {
    id: "no-colophon",
    date: "2020-12",
    year: 2020,
    title: "No name on the colophon",
    months: 0.15,
    for: { delivered: 1, thought: 3, made: 1 },
    line: "I asked once. They said the press is the author of the page.",
    body: "They were right. I wanted the credit for the wrong reason. I do not ask now.",
  },
  {
    id: "pandemic-note",
    date: "2020-04",
    year: 2020,
    title: "April",
    months: 0.1,
    for: { delivered: 1, thought: 2, made: 1 },
    line: "Worked from the kitchen. The books still needed pages.",
    body: "A small note, on purpose. The year was not only the engine.",
  },
  {
    id: "shader-letter",
    date: "2021-03",
    year: 2021,
    title: "A letter in a shader",
    months: 0.5,
    for: { delivered: 1, thought: 1, made: 3 },
    line: "Drew an n, then a g. The g took a week.",
    body: "I wanted to know what a curve is when it is not a Bézier in someone else’s engine. I do not make type. I wanted the respect.",
  },
  {
    id: "returned",
    date: "2021-06",
    year: 2021,
    title: "The commission I returned",
    months: 2,
    for: { delivered: 1, thought: 3, made: 2 },
    line: "A generative piece for a lobby. I sent the money back.",
    body: "It would have looked like every other lobby. I could have made it. I could not have stood next to it.",
    delivered: "No delivery. A returned deposit. A client may read this as unreliability. It is the opposite, and I will say so in the room.",
    thought:
      "I had said yes because the fee was the fee. That is not a way of choosing. I have a written test now: would I put this in the log without a paragraph of apology? If not, I do not start.",
    made: "A particle field driven by the building’s lift traffic. Technically fine. Conceptually a screensaver. I kept the lift feed idea and have not used it.",
  },
  {
    id: "compositor-y2",
    date: "2021-09",
    year: 2021,
    title: "Compositor, year two",
    months: 0.3,
    for: { delivered: 1, thought: 2, made: 3 },
    line: "Still running. I fixed a widow rule that was too proud.",
    body: "The proud rule left ugly holes. I let a few widows through. The pages got better. Pride is a layout bug.",
  },
  {
    id: "test-layout",
    date: "2021-10",
    year: 2021,
    title: "How I test layout",
    months: 0.35,
    for: { delivered: 1, thought: 2, made: 3 },
    line: "A corpus of bad pages. If a change makes them worse, it does not ship.",
    body: "Not unit tests. A shelf. I can show a peer the shelf. I cannot show a client why it matters in a slide.",
  },
  {
    id: "specimen-site",
    date: "2021-12",
    year: 2021,
    title: "A friend’s specimen",
    months: 1.5,
    for: { delivered: 2, thought: 1, made: 2 },
    line: "A site for a face that did not need my help, and got a little.",
    body: "I made the waterfalls and the printable PDF. She made the type. People remember the type.",
  },
  {
    id: "archive",
    date: "2022-11",
    year: 2022,
    title: "The archive",
    months: 14,
    for: { delivered: 3, thought: 2, made: 2 },
    line: "A municipal archive, fourteen months, 40,000 scans and a finding aid.",
    body: "A council had digitised faster than it had described. I spent a year making the descriptions usable by a person who is not an archivist, and by a few who are.",
    delivered:
      "Launched to the public in November. Search, a finding aid, and a request path the records office already understood. If you need evidence that I can finish a long civic project with procurement, stakeholders, and a launch date that cannot move, this is the piece. I can introduce you to the archivist.",
    thought:
      "The scans were the easy pride. The work was the language of the filters — parish, year, ‘poor law’ — and the decision to show an empty result as a place, not an error. A lot of people come looking for a person who is not there. The page had to be able to say that.",
    made: "OCR we did not trust, so every record carries a confidence and a ‘not yet read’ state. The search is boring on purpose: AND, a year range, a parish. I refused a knowledge graph. The archivist has to be able to explain the system to a visitor in one sentence.",
  },
  {
    id: "ocr-social",
    date: "2022-06",
    year: 2022,
    title: "OCR is a social problem",
    months: 0.2,
    for: { delivered: 1, thought: 3, made: 2 },
    line: "The engine was fine. The handwriting was a person.",
    body: "We stopped treating low confidence as a defect and started treating it as a queue for a human. The queue is the product.",
  },
  {
    id: "weekend-tool",
    date: "2022-08",
    year: 2022,
    title: "A tool for myself",
    months: 0.3,
    for: { delivered: 1, thought: 1, made: 3 },
    line: "A measure ruler that sits on any page. I use it daily.",
    body: "Twenty lines. No repo worth mentioning. Technique is often this small.",
  },
  {
    id: "no-portfolio",
    date: "2022-12",
    year: 2022,
    title: "Still no portfolio",
    months: 0.1,
    for: { delivered: 1, thought: 3, made: 1 },
    line: "A peer asked for my site. I sent this file.",
    body: "It was a folder then. It is a page now. The contents have not been selected.",
  },
  {
    id: "freight",
    date: "2023-09",
    year: 2023,
    title: "The board",
    months: 11,
    for: { delivered: 3, thought: 2, made: 2 },
    line: "A freight desk’s board. Used every weekday. Ugly on purpose.",
    body: "A shipping office needed to see what was late. I made a board they can read from across the room. It is not a product. It is a wall.",
    delivered:
      "In production since September 2023. The desk will not go back to the spreadsheet. I can put a client on a call with the operations lead. This is the plainest proof I have that I can deliver a tool into a working room and leave it there.",
    thought:
      "I arrived with a redesign. They arrived with a wall of printouts and a set of hand signals. The board copies the printouts’ hierarchy and throws away my redesign. I am glad. A tool that needs training is a tool they will not look at when a ship is late.",
    made: "A single view, no pagination, type at 28px for the late column, a refresh that does not shuffle rows. Rows are stable by booking id so a pointing finger still points. I spent longer on the shuffle than on the look. The look is Helvetica because it was already on the machines.",
  },
  {
    id: "used-daily",
    date: "2023-10",
    year: 2023,
    title: "Used every day",
    months: 0.15,
    for: { delivered: 2, thought: 3, made: 1 },
    line: "A feeling I did not get from the map.",
    body: "Nobody shared it. They just turned it on at eight. I prefer this.",
  },
  {
    id: "deleted-motion",
    date: "2023-07",
    year: 2023,
    title: "The motion I deleted",
    months: 0.2,
    for: { delivered: 1, thought: 2, made: 3 },
    line: "Rows that slid when a time changed. Pretty. Unusable.",
    body: "A late ship must not dance. I cut the animation and wrote a note on the ticket so nobody would put it back.",
  },
  {
    id: "student-sighted",
    date: "2023-11",
    year: 2023,
    title: "A student asked about Sighted",
    months: 0.1,
    for: { delivered: 1, thought: 3, made: 1 },
    line: "I told her the legend was wrong. She had used it in a talk.",
    body: "She was gracious. I was tired. I sent her the three mistakes and a better dataset.",
  },
  {
    id: "letter",
    date: "2023-12",
    year: 2023,
    title: "A letter",
    months: 0.2,
    for: { delivered: 1, thought: 3, made: 1 },
    line: "Wrote to a designer I wanted to work with. Sent the compositor note, not the map.",
    body: "She wrote back. We have not made a thing yet. The letter was the work of that week.",
  },
  {
    id: "smaller",
    date: "2024-03",
    year: 2024,
    title: "Smaller on purpose",
    months: 0.15,
    for: { delivered: 2, thought: 3, made: 1 },
    line: "Turned down a year-long product role. Kept the days I can choose.",
    body: "I like a long problem. I do not like being unable to fold.",
  },
  {
    id: "debugger",
    date: "2024-06",
    year: 2024,
    title: "The debugger I use",
    months: 1.2,
    for: { delivered: 1, thought: 2, made: 3 },
    line: "A layout inspector for my own pages. Not a product. A mirror.",
    body: "It draws the measure, the baseline, the constraints that fired. I open it more than the browser’s own tools. Nobody else has a copy.",
    made: "Overlays, a log of which constraint lost, a key to step the cascade. Built for the compositor and then pointed at everything else. If a peer wants to talk about how I work, this is the object, not a slide.",
  },
  {
    id: "refused-rebrand",
    date: "2024-09",
    year: 2024,
    title: "Refused a rebrand of Sighted",
    months: 0.1,
    for: { delivered: 1, thought: 3, made: 1 },
    line: "An agency wanted to ‘revisit the famous map’. I said no.",
    body: "They were kind about it. The map is finished, including its mistakes.",
  },
  {
    id: "teach-fail",
    date: "2024-11",
    year: 2024,
    title: "Teaching the failures",
    months: 0.4,
    for: { delivered: 1, thought: 3, made: 2 },
    line: "A short course. I led with the studio that folded and the map.",
    body: "The successes made worse students. The failures made them ask what they would refuse.",
  },
  {
    id: "foundry",
    date: "2025-04",
    year: 2025,
    title: "A specimen engine",
    months: 6,
    for: { delivered: 3, thought: 2, made: 3 },
    line: "A foundry needed to put a face through waterfalls without opening a file.",
    body: "I made a small engine that sets their specimens from a design space. They change an axis; the page holds.",
    delivered:
      "Shipped for their spring release. The foundry updates specimens without me. That was the brief. A client who makes a thing with axes — type, a product line, a set of tones — can see this in twenty minutes.",
    thought:
      "They asked for a generator. I made a setter. A generator invents pages; a setter obeys a face. The distinction kept us out of a year of taste arguments.",
    made: "Variable-font instances, a line-break pass that knows a face’s own kerning, printable PDFs that match the screen to a point. The match is the whole problem. I tested on their worst glyphs, not the word ‘Hamburgefonstiv’.",
  },
  {
    id: "compositor-y5",
    date: "2025-09",
    year: 2025,
    title: "Compositor, year five",
    months: 0.2,
    for: { delivered: 1, thought: 2, made: 3 },
    line: "A new house file. The engine did not notice I had been away.",
    body: "That is the highest compliment I know how to give my own work.",
  },
  {
    id: "estimate",
    date: "2025-06",
    year: 2025,
    title: "How I estimate now",
    months: 0.15,
    for: { delivered: 2, thought: 3, made: 1 },
    line: "I estimate the week the thing meets the organisation, not the build.",
    body: "The build is the part I know. The week is the part that used to ruin me.",
  },
  {
    id: "walk-note",
    date: "2025-10",
    year: 2025,
    title: "A walk",
    months: 0.05,
    for: { delivered: 1, thought: 1, made: 1 },
    line: "No work. A towpath. Logged so a year is not only jobs.",
    body: "The log is a career, not a brand. Some days are empty on purpose.",
  },
  {
    id: "open-year",
    date: "2026-01",
    year: 2026,
    title: "This year is open",
    months: 0.1,
    for: { delivered: 1, thought: 2, made: 1 },
    line: "Nothing I will name yet.",
    body: "I am in the middle of a thing. It does not have a weight. I will give it one when I know.",
  },
  {
    id: "half-built",
    date: "2026-04",
    year: 2026,
    title: "A half-built thing",
    months: 2,
    for: { delivered: 1, thought: 2, made: 2 },
    line: "An instrument for comparing two layouts. Not finished.",
    body: "I can open two pages and see where the constraints disagree. I cannot yet tell you why. That is the remaining work.",
    thought:
      "I keep unfinished work in the log so the finished work does not look like a sequence of arrivals. Most of a year is this: a thing that does not yet have a name.",
    made: "A diff of box trees, drawn as a third page. Useful already. Wrong about floats. I know where.",
  },
  {
    id: "why-log",
    date: "2026-06",
    year: 2026,
    title: "Why a log",
    months: 0.25,
    for: { delivered: 1, thought: 3, made: 1 },
    line: "Because a portfolio would have been a lie I was good at telling.",
    body: "Six case studies would have put Sighted at the top and left the compositor out. That is a career I did not have. This is the one I did.",
  },
];

export const byId = new Map(ENTRIES.map((e) => [e.id, e]));

export function entriesIn(year: number): Entry[] {
  return ENTRIES.filter((e) => e.year === year);
}

/** Honest width: months of attention, independent of who is reading. */
export function markWidth(entry: Entry): number {
  return Math.max(7, Math.min(168, 7 + entry.months * 7.4));
}

/** Ink follows the reader. Width does not. */
export function relevance(entry: Entry, lens: Lens): 1 | 2 | 3 {
  return entry.for[lens];
}

export function mass(entry: Entry): 1 | 2 | 3 | 4 | 5 {
  if (entry.months < 0.35) return 1;
  if (entry.months < 1.5) return 2;
  if (entry.months < 5) return 3;
  if (entry.months < 10) return 4;
  return 5;
}

export function heaviestFor(year: number, lens: Lens): Entry | undefined {
  const list = entriesIn(year);
  if (list.length === 0) return undefined;
  return [...list].sort((a, b) => {
    const aw = a.months * a.for[lens];
    const bw = b.months * b.for[lens];
    if (bw !== aw) return bw - aw;
    return a.date.localeCompare(b.date);
  })[0];
}

export function monthLabel(date: string): string {
  const [y, m] = date.split("-").map(Number);
  const names = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  return `${names[(m ?? 1) - 1]} ${y}`;
}

export function monthsLabel(months: number): string {
  if (months < 0.2) return "a day or two";
  if (months < 0.5) return "a week";
  if (months < 1) return `${Math.round(months * 4)} weeks`;
  if (months === 1) return "one month";
  if (months < 12) return `${Math.round(months)} months`;
  const years = months / 12;
  if (years < 1.75) return "a year";
  return `${years.toFixed(1)} years`;
}

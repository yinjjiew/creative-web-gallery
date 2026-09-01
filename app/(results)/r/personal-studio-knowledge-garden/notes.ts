/**
 * Plot is fiction. Ada Voss, the Borough of Holme, Ledger Street, Mrs Dutta,
 * the plane, the census in the loft and every sentence in these notes were
 * written for this piece. Nothing here is a record of a real officer, a real
 * tree, or a real council. That is stated in the colophon as well as here.
 *
 * The notes are a body of thought, not a set of cards: the same street, the
 * same plane, the same three changes of mind, returned to until the returns
 * are the point.
 */

export type Maturity = "seedling" | "growing" | "established" | "left";

export type BedId = "ledger" | "pull" | "dirt" | "tuesday" | "for";

export type Graf = {
  /** Calendar year this paragraph was put in or last rewritten. */
  at?: string;
  text: string;
};

export type Note = {
  id: string;
  title: string;
  bed: BedId;
  planted: string;
  lastTended: string;
  revisions: number;
  maturity: Maturity;
  /** Notes this one now stands against. The disagreement is hers. */
  contradicts?: string[];
  body: Graf[];
};

export const BEDS: { id: BedId; name: string; about: string }[] = [
  {
    id: "ledger",
    name: "Ledger Street",
    about: "One terrace. One plane. What a street tree actually is.",
  },
  {
    id: "pull",
    name: "What we pull",
    about: "Weeds, natives, and the habit of deciding what belongs.",
  },
  {
    id: "dirt",
    name: "Street dirt",
    about: "The cubic metre of loam that was never there.",
  },
  {
    id: "tuesday",
    name: "Tuesday",
    about: "A mowing schedule is a landscape design.",
  },
  {
    id: "for",
    name: "Who it is for",
    about: "Residents, the highway, the bats, the inbox.",
  },
];

export const NOTES: Note[] = [
  {
    id: "the-plane",
    title: "The plane on Ledger Street",
    bed: "ledger",
    planted: "2015-03-18",
    lastTended: "2025-11-02",
    revisions: 14,
    maturity: "established",
    body: [
      {
        at: "2015",
        text: "The tree outside no. 17. I thought it was a Norway maple for the first six months. The bark told me otherwise in the second winter — a plane flakes in puzzle pieces, grey and olive and the colour of newsprint left in the rain. Platanus × hispanica. A hybrid. I wrote “maple” in the first file and I have never quite forgiven the file.",
      },
      {
        at: "2017",
        text: "Girth 2.4 m at 1.5 m. Planted 1961 if you believe the highways folder, which is three sheets and a coffee ring. The crown clears the lamp at no. 19 and does not clear the bedroom window at no. 12. I have stood under it on the way to work and on the way back and I could not, then, have drawn the branching from memory.",
      },
      {
        at: "2019",
        text: "The roots have lifted two flags of the pavement. Mrs Dutta at no. 19 wants it gone. The folder now has eleven sheets. I went down into [[the-pit|the pit]] that summer, after the drought, and there was no soil in it worth the name — see [[street-dirt|street dirt]]. The tree is not in the pit. The tree is in the service trench and under her path.",
      },
      {
        at: "2022",
        text: "The crane. I have written that out in [[after-the-crane|its own note]]. What belongs here is only this: the tree leafed on the wounded side. Thinner. Alive. I had been looking at it for seven years and I still could not have told you which limb would come off.",
      },
      {
        at: "2025",
        text: "Girth 2.61 m. Mrs Dutta’s mother has died and Mrs Dutta has not mentioned the flags since, which I am not treating as consent. I have been looking at this tree for ten years and I still could not draw the branching from memory. That is either a failure of attention or a fact about trees. [[cities-are-already-novel|It does not belong here]] in the sense I used to mean belong, and it is better at Holme than I am.",
      },
    ],
  },
  {
    id: "the-pit",
    title: "The pit",
    bed: "ledger",
    planted: "2018-06-11",
    lastTended: "2024-09-14",
    revisions: 6,
    maturity: "growing",
    body: [
      {
        at: "2018",
        text: "I lifted the grate on Ledger Street after a drought year, when [[the-plane|the plane]] dropped a third of its leaf in July. Underneath: the original pit, maybe 600 mm square, sides of the clay pipe they used as a liner in the sixties, and then the compacted Type 1 the pavement sits on. The roots left through the cracks years ago.",
      },
      {
        at: "2021",
        text: "[[the-specification|The specification]] I was still issuing at this date called for a 1 m³ pit and a watered-in mulch. I have written that specification. I have also stood in this hole. The two facts sat in the same week of my life and did not speak.",
      },
      {
        at: "2024",
        text: "I went back with a tape. The grate is the same. The white tide-mark of salt is worse — [[the-white-line|the white line]]. What I had not noticed in 2018 is that the clay liner is cracked on the house side, which is the side the roots took, which is the side Mrs Dutta’s path is on. The pit is a hallway. The rooms are somewhere else.",
      },
    ],
  },
  {
    id: "after-the-crane",
    title: "After the crane",
    bed: "ledger",
    planted: "2022-02-17",
    lastTended: "2023-08-09",
    revisions: 5,
    maturity: "established",
    contradicts: ["let-some-of-it-fail"],
    body: [
      {
        at: "2022",
        text: "A 40-tonne crane on Ledger Street for the loft conversion at no. 12. The operator swung the jib through the lower crown of [[the-plane|the plane]] and took off a limb about 250 mm at the cut. Clean, as these things go. Four in the afternoon, a Tuesday. The only reason it did not hit anyone is that Mrs Dutta had gone in for her programme.",
      },
      {
        at: "2022",
        text: "I spent three months thinking the tree would die on that side. It leafed. What changed was not the tree. What changed was [[let-some-of-it-fail|the note I wrote in 2019 about designed decay]]. I had been arguing that we should let street trees complete their lives, that a pollard in the last decade is a kind of honesty. Then I watched a limb that size come down onto a pavement.",
      },
      {
        at: "2023",
        text: "I still think most of what we do to old trees is vanity. I no longer think we get to be theoretical about the ones over a footway. The rest of the 2019 note — plant the replacement while the old one is still standing, stop pretending a 12 cm stick replaces a sixty-year plane — I have not abandoned. I have abandoned the sentence that made it sound like a philosophy. [[who-the-tree-is-for|Who it is for]] is a woman who was indoors by luck, and a file that now has a photograph of a cut I did not authorise.",
      },
    ],
  },
  {
    id: "the-census",
    title: "The census",
    bed: "ledger",
    planted: "2018-04-03",
    lastTended: "2019-09-22",
    revisions: 4,
    maturity: "left",
    body: [
      {
        at: "2018",
        text: "I started mapping every tree in the borough the council had a duty to. Not the GIS — we had a GIS, it was six years out of date and the points sat in the middle of buildings. A walk, a notebook, a stem, a species if I knew it, a photograph if the light was decent. Ledger Street first, because of [[the-plane|the plane]]. Then Collier Street, the precinct, most of Holme Road.",
      },
      {
        at: "2019",
        text: "I got as far as the industrial estate and then I was spending Saturdays on the census and weekdays on the inbox, and the census had become a way of not doing the other thing. The useful fact, before I stopped: we did not know what we owned. The GIS said 4,200 trees. I had counted 1,100 in the streets I finished and I was not a quarter through. Some of the missing ones were dead. Some had never existed. Some were in front gardens and had been adopted by a previous officer in a mood.",
      },
      {
        at: "2019",
        text: "The notebook is in the loft. The photographs are on a drive. I have not opened either. [[the-app|I almost started again]] last year with a phone, and I stopped at the thought of the loft. I am leaving this where it stopped. Finishing it would be a different note, and I do not have that note.",
      },
    ],
  },
  {
    id: "the-app",
    title: "The app",
    bed: "ledger",
    planted: "2024-04-19",
    lastTended: "2024-04-19",
    revisions: 1,
    maturity: "seedling",
    body: [
      {
        text: "I downloaded a thing. It wants a GPS point and a species and a photograph and then it is a map. I stood under [[the-plane|the plane]] and I did not press the button.",
      },
      {
        text: "[[the-census|The census]] failed because I turned looking into a second job. An app would make the second job lighter and therefore easier to keep doing instead of the first one. I am putting this down so that I remember the thought, and so that I do not have to have it again in 2027.",
      },
    ],
  },
  {
    id: "what-a-weed-is",
    title: "What a weed is",
    bed: "pull",
    planted: "2016-04-07",
    lastTended: "2024-06-21",
    revisions: 9,
    maturity: "established",
    body: [
      {
        at: "2016",
        text: "A weed is a plant in the wrong file. I knew this in 2016 and I keep having to learn it again. The borough’s amenity contract has a list: dandelion, willowherb, ragwort, buddleia in the gutters. The list is reprinted every three years with the same names. Buddleia is on it because someone in 1998 did not like it on the station wall.",
      },
      {
        at: "2016",
        text: "I spent that spring pulling ragwort off the Holme Road verge because the contract said to. I had [[natives|a list of my own]] in the same year, and I did not notice that the two lists were the same habit in different clothes.",
      },
      {
        at: "2023",
        text: "The contractor went bust. Nobody mowed until September. I walked the same verge and the ragwort was the only thing the hoverflies used. I am not making a hymn of this. I am saying the file was wrong about that plant on that road, and I had enforced the file.",
      },
      {
        at: "2024",
        text: "The word I want is not weed. I haven’t got the word yet. “Volunteer” is too cute. “Spontaneous” is a botanist’s word and it does not survive a committee. [[a-thistle-i-left|The thistle I did not pull]] last summer is not an argument. It is the gap where the argument should be. See also [[tuesday-at-ten|Tuesday]], which pulls everything at ten o’clock whether I have a word or not.",
      },
    ],
  },
  {
    id: "natives",
    title: "Natives",
    bed: "pull",
    planted: "2017-01-14",
    lastTended: "2018-11-03",
    revisions: 4,
    maturity: "left",
    body: [
      {
        at: "2017",
        text: "Plant native. That is the whole note, really, and I was sure of it. Hawthorn, field maple, hornbeam, the occasional small-leaved lime if the pit was deep enough. No cultivars with names like ‘Chanticleer’. No plane — plane is a hybrid and a Victorian habit and it does not belong in a town that is trying to be something else.",
      },
      {
        at: "2018",
        text: "I had a list. I issued it. Some of those trees are still alive on the 2018 streets and they look fine, which is not the same as being right. I am leaving this here because I said it in meetings and it got into three planting schemes. [[cities-are-already-novel|I do not hold it any more.]] The holding was the problem as much as the list.",
      },
    ],
  },
  {
    id: "cities-are-already-novel",
    title: "Cities are already novel",
    bed: "pull",
    planted: "2023-03-02",
    lastTended: "2025-09-11",
    revisions: 5,
    maturity: "growing",
    contradicts: ["natives"],
    body: [
      {
        at: "2023",
        text: "Holme is not a woodland with buildings in it. It is a novel ecosystem that has been running for two hundred years: plane, lime, sycamore, buddleia, the Norway maple I keep mistaking things for, the tree of heaven behind the old tannery that I am supposed to want gone.",
      },
      {
        at: "2024",
        text: "[[natives|The 2017 note]] wanted a restoration. There is nothing to restore to. The soils are made of ash, clinker, brick dust and the crushed sandstone they used to bed the tram lines — [[street-dirt|street dirt]], not earth. The rainfall hits drains. The “native” trees I specified on Collier Street are doing all right in spite of this, not because I put them back where they belonged.",
      },
      {
        at: "2025",
        text: "[[the-plane|The plane on Ledger Street]] is a hybrid of two species that never met until someone in the seventeenth century made them meet. I spent years treating that as a problem of taste. It is better at Holme than the hornbeams I was proud of. I am not writing a defence of anything that will take a wall apart. I am writing down that “belongs” was a word I used when I meant “I prefer.”",
      },
    ],
  },
  {
    id: "a-thistle-i-left",
    title: "A thistle I left",
    bed: "pull",
    planted: "2025-07-08",
    lastTended: "2025-07-08",
    revisions: 1,
    maturity: "seedling",
    body: [
      {
        text: "Spear thistle, south verge of Holme Road, about forty yards west of the crossing to the precinct. I walked past it four mornings and on the fifth I didn’t pull it. I don’t have an argument for this yet. It was just tall, and the bees were already on it, and I was not at work.",
      },
      {
        text: "[[what-a-weed-is|What a weed is]] is the note this wants to belong to. [[tuesday-at-ten|Tuesday]] will have had it off if the van started. I keep meaning to go back and see. I haven’t.",
      },
    ],
  },
  {
    id: "street-dirt",
    title: "Street dirt",
    bed: "dirt",
    planted: "2017-09-29",
    lastTended: "2024-04-16",
    revisions: 8,
    maturity: "established",
    contradicts: ["the-cubic-metre"],
    body: [
      {
        at: "2017",
        text: "Call it soil if you want. It isn’t. I have a biscuit tin of it from [[the-pit|the pit]] on Ledger Street, collected the year after I first wrote [[the-cubic-metre|the cubic metre]]. It has never been wet in the tin and it has never been dry in the ground in the way soil is dry. Grey-brown grit, a white crust of last winter’s salt, two fragments of blue-and-white china.",
      },
      {
        at: "2018",
        text: "I sent it to the lab. They rang to ask if I had sent the right sample. pH about 8.2 if the cheap meter was telling the truth; the lab was ruder about organic matter than I will repeat. [[cities-are-already-novel|This is what Holme is made of]]. Ash, clinker, brick dust, the sandstone from the tram beds. The trees that live in it live in it the way people live in a badly converted flat: they find the one room that works and they put everything there.",
      },
      {
        at: "2024",
        text: "The pit is the hallway they were given. The rooms are the service trench, the back-alley clay, the strip behind the wall. I still write “soil” in reports because the alternative is a lecture, and a report cannot survive a lecture. The tin is on the shelf behind me. I have not thrown it away. I have not opened it in two years either.",
      },
    ],
  },
  {
    id: "the-cubic-metre",
    title: "The cubic metre",
    bed: "dirt",
    planted: "2018-03-05",
    lastTended: "2019-01-20",
    revisions: 3,
    maturity: "left",
    body: [
      {
        at: "2018",
        text: "If we can get a full cubic metre of uncompacted loam under every new tree, most of the rest will follow. I believed this the way you believe a dimension. I put it in the 2018 guidance note. I repeated it to councillors because it is a number, and numbers travel.",
      },
      {
        at: "2019",
        text: "[[street-dirt|Street dirt]] and [[the-pit|the pit]] are what I found when I went and looked. The cubic metre is what I said when I hadn’t. I am leaving this. It is in documents with my name on. [[the-specification|The specification]] still quotes it, in wording I wrote, which is a kind of afterlife I did not intend and have not been able to stop.",
      },
    ],
  },
  {
    id: "the-specification",
    title: "The specification",
    bed: "dirt",
    planted: "2019-02-11",
    lastTended: "2021-11-28",
    revisions: 4,
    maturity: "growing",
    body: [
      {
        at: "2019",
        text: "BS 8545 is a good document. I mean that. It is also a document that assumes a pit will be dug in earth. What I actually wrote into a contract for Holme: a crate, a structured soil or a foam-glass aggregate if the budget held, irrigation for two summers, a watering bag that will be stolen by the third Thursday, and a 12–14 cm girth tree that will look like a stick for four years while the councillor who cut the ribbon wonders if we planted it dead.",
      },
      {
        at: "2021",
        text: "The specification is the most honest document I produced at the council and the most fictional. It describes a tree that could live. The invoice describes the one we could afford. I stopped revising this when I left the meetings. The 2024 schemes still use my wording. I know because a contractor sent it back to me for a “quick look,” and there was [[the-cubic-metre|the cubic metre]], still in it, still with my cadence.",
      },
    ],
  },
  {
    id: "the-white-line",
    title: "The white line",
    bed: "dirt",
    planted: "2020-01-14",
    lastTended: "2024-02-27",
    revisions: 4,
    maturity: "growing",
    body: [
      {
        at: "2020",
        text: "Every March there is a white tide-mark on the inside of the grate on Ledger Street, about two fingers deep. It is last winter’s salt, recrystallised. I photographed it. I photographed the crown of [[the-plane|the plane]] from the same spot, road side and house side.",
      },
      {
        at: "2024",
        text: "The crown is thinner on the road side than on Mrs Dutta’s side. I am not a good enough observer to swear the difference is salt. I am a good enough observer to have stopped asking Highways to salt the flags under the tree. They salt the flags because of the flags the roots lifted. The roots lifted the flags because the tree is in the service trench. The service trench is where the salt goes. I have not proved any of this. I have a biscuit tin and two photographs. See [[street-dirt|street dirt]], and [[the-pit|the pit]].",
      },
    ],
  },
  {
    id: "honey-fungus",
    title: "Honey fungus",
    bed: "dirt",
    planted: "2026-03-09",
    lastTended: "2026-03-09",
    revisions: 1,
    maturity: "seedling",
    body: [
      {
        text: "The lime on Collier Street — the one the man said was watching the house, in [[complaints|the complaints]] — has a boot of something at the base on the north side. I saw it in March after the rain, the colour of egg yolk and leather. I am not sure it is Armillaria. I am not sure it matters if I am sure.",
      },
      {
        text: "The tree has a cavity I noted in 2018 and did nothing about because [[the-census|the census]] had already become the loft. I should go back with a proper look. I am writing this instead.",
      },
    ],
  },
  {
    id: "tuesday-at-ten",
    title: "Tuesday at ten",
    bed: "tuesday",
    planted: "2019-05-16",
    lastTended: "2024-08-13",
    revisions: 7,
    maturity: "established",
    body: [
      {
        at: "2019",
        text: "The amenity contract mows the Holme Road verges on Tuesday morning, starting at the precinct and working west. Ten o’clock if the van starts. I have stood on that verge at 9:50 and at 10:20 and the difference is a landscape.",
      },
      {
        at: "2019",
        text: "Before ten: a strip of ryegrass and whatever came up — dandelion, [[a-thistle-i-left|a thistle]], a bit of vetch if you get your eye in. After ten: a 40 mm sward the colour of a sports field in March, cuttings left in clumps that go yellow by Thursday. Nobody designed this. A man with a ride-on designed it, and the man who wrote his route in 2006, and the insurance clause about sight lines at junctions.",
      },
      {
        at: "2021",
        text: "The wildflower trial lasted one season. They mowed it in June because the route said June. I had signed the trial. I had not taken Tuesday off the map. I have more influence over a single tree than I have ever had over Tuesday. [[who-the-verge-is-for|Who the verge is for]] is the note that grew out of standing there, and I still cannot get the route rewritten.",
      },
      {
        at: "2024",
        text: "I do not work for the borough any more and I still know when the van is due. That is either pathetic or a fact about how a town is made. [[what-a-weed-is|What we pull]] is mostly pulled at ten o’clock on a Tuesday, by a man who is not thinking about hoverflies, because we paid him not to.",
      },
    ],
  },
  {
    id: "who-the-verge-is-for",
    title: "Who the verge is for",
    bed: "tuesday",
    planted: "2021-04-20",
    lastTended: "2024-10-05",
    revisions: 5,
    maturity: "growing",
    body: [
      {
        at: "2021",
        text: "Sight lines. That is the official answer. A verge exists so a driver can see a child, and so the borough cannot be sued for the child, and so the grass looks “kept.” I walked the Holme Road junctions with a highways engineer in April. He was not a fool. At two of the six junctions the sight-line argument was real. At the other four the verge could have been 200 mm of grass and meadow and nobody’s view of anything would have changed, because the view is of parked vans.",
      },
      {
        at: "2024",
        text: "The unofficial answer is that a long verge looks like nobody is in charge. That is a different fear from a child, and we keep using the child’s name for it. [[tuesday-at-ten|Tuesday]] enforces the fear. [[who-the-tree-is-for|The tree argument]] is the same argument with a stem in it: kept, or not in charge. I have not found a third word that a committee will minuted.",
      },
    ],
  },
  {
    id: "who-the-tree-is-for",
    title: "Who the tree is for",
    bed: "for",
    planted: "2016-08-22",
    lastTended: "2025-02-14",
    revisions: 10,
    maturity: "established",
    body: [
      {
        at: "2016",
        text: "I used to write “amenity value” in the reports. It is a real number in the CAVAT system and I can run it. The number for [[the-plane|the Ledger Street plane]] is the sort of number that makes a councillor pause and then approve the flags. The number is not who it is for.",
      },
      {
        at: "2019",
        text: "Mrs Dutta wants it down because the flags are up and her mother trips. Highways want a stem that does not lift flags and a crown that does not touch a lamp. The bats — common pipistrelle; I am not a bat person; the ecologist said so in a survey I commissioned and then could not act on — want the splits in the old pollard limes on Collier Street, not this plane. I want a tree I have been looking at for years not to be a case.",
      },
      {
        at: "2022",
        text: "[[after-the-crane|After the crane]] I added a person I had not been counting: the person who is under the crown at four in the afternoon. [[let-some-of-it-fail|The 2019 note]] had not counted her either. There is no version of this in which everyone is served.",
      },
      {
        at: "2025",
        text: "The closest I have come to an honest sentence is: the tree is for the street, and the street does not get a vote. [[complaints|The complaints]] are the vote we actually have, and they are not nothing — one of them is from a woman who sat under this plane when she first rented no. 17, which is my house. I still do not know what to do with that, except keep it.",
      },
    ],
  },
  {
    id: "complaints",
    title: "Complaints",
    bed: "for",
    planted: "2020-01-08",
    lastTended: "2024-11-19",
    revisions: 6,
    maturity: "growing",
    body: [
      {
        at: "2020",
        text: "I kept them. Not all of them — the council’s system is a graveyard and I do not have a login any more — but the ones that came to me I copied into a notebook, because the system filed them under “trees / other” and they disappeared.",
      },
      {
        at: "2021",
        text: "They are very specific and very the same. Sticky residue on a car (plane, June, every year). A flag. A television-reception theory I have never been able to follow. Shade on a vegetable bed that is already under a fence. One letter from a man who said the lime on Collier Street was “watching the house.” I went and looked at that lime. It is a tree. It now has [[honey-fungus|something at the base]] I did not have the eyes for then.",
      },
      {
        at: "2024",
        text: "The useful ones mention a person: mother, who trips; son, who plays under it; the woman who wrote that she had sat under [[the-plane|the Ledger Street plane]] with her husband when they first rented no. 17. I live at no. 17. I did not know what to do with that letter except keep it. [[who-the-tree-is-for|Who it is for]] is partly this drawer.",
      },
    ],
  },
  {
    id: "let-some-of-it-fail",
    title: "Let some of it fail",
    bed: "for",
    planted: "2019-06-30",
    lastTended: "2019-11-12",
    revisions: 3,
    maturity: "left",
    body: [
      {
        at: "2019",
        text: "A street tree is allowed to die of something other than a saw. That was the whole claim. I had been watching veterans in churchyards get braced and filled and lit, and I wanted the opposite for the ones we actually own: a senescence we had planned for, a replacement in the ground before the old one came down, a public that had been told.",
      },
      {
        at: "2019",
        text: "I still want the public to have been told. I no longer think “planned senescence” is a phrase I get to use about a limb over a pavement. [[after-the-crane|February 2022]] is why, and that note stands against this one, and this one is still here because I said it in a meeting about Collier Street and a councillor repeated it as if it were policy.",
      },
      {
        at: "2019",
        text: "The rest — plant the replacement while the old one is still standing, stop pretending a 12 cm stick replaces a sixty-year plane, write the death into the file before the complaint does — I have not abandoned. I have stopped pretending it is a design philosophy. It is maintenance with the ending left in. I am not tending this note. I am not taking it down.",
      },
    ],
  },
];

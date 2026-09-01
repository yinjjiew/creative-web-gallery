import type { Task } from "../types";

/**
 * SETTING 5 — Personal & Studio Sites
 *
 * Every prompt here invents a specific person or practice, because the failure
 * mode of this setting is the anonymous template: Hero, About, Projects,
 * Contact, applied to someone whose actual identity is never expressed. A
 * specific person with a specific body of work forces a structure to follow
 * from the content instead of preceding it.
 */
export const PERSONAL_STUDIO: Task[] = [
  {
    id: "personal-studio-personal-portfolio",
    applicationSetting: "personal-studio",
    typicalTask: "Personal Portfolio",
    title: "Ambit",
    prompt: `Build a portfolio site for a field recordist — someone whose work is recording places, and who sells and licenses those recordings to films, games and installations.

Her archive is about four hundred recordings made over eleven years: a thawing lake in March, the inside of a grain silo, a specific junction in Hanoi at four in the morning, the same hedgerow recorded every month for two years. Each one has a place, a date, a time of day, a duration, and notes about what she was after and what actually happened.

The obvious problem is that her work is invisible. A portfolio of audio cannot be browsed with the eyes, and the standard answer — a list of files with play buttons — is a filing cabinet rather than a portfolio. The deeper problem is that what makes her work good is not any single recording but her attention: what she chooses to point a microphone at, when she goes, and how long she is willing to wait.

Design a site that makes that attention legible, and that makes four hundred recordings genuinely explorable. Someone should be able to wander it the way you wander an archive, following whatever thread interests them — a place, a season, an hour, a kind of sound — and should be able to listen easily and continuously without fighting the interface.

It also has to work commercially. A music supervisor arriving with a specific need has to find it, understand the licence, and get in touch.

Because the medium is sound, silence and restraint in the visual design will serve her better than spectacle. Nothing should compete with what the visitor is listening to.

No autoplay. Someone arriving at a site that starts making noise will leave.`,
    abilityTags: [
      "Information Architecture",
      "Audio Design",
      "Visual Design / Taste",
      "Interaction Design",
      "Layout & Typography",
      "Narrative / Communication",
      "State & Data",
    ],
    resultRoute: "/r/personal-studio-personal-portfolio",
    status: "complete",
    blurb:
      "A field recordist's eleven-year archive, navigable by place, season and hour of the day, built so continuous listening never fights the interface.",
    direction:
      "The real subject is her attention — what she points a microphone at and how long she waits — so the site is organised around the dimensions of that judgement rather than around a file list. Visual restraint is a functional requirement, not a style: nothing may compete with what is being listened to. A play-button inventory is exactly the thing refused.",
  },
  {
    id: "personal-studio-designer-portfolio",
    applicationSetting: "personal-studio",
    typicalTask: "Designer / Developer Portfolio",
    title: "Log",
    prompt: `Build a portfolio for a creative developer with fourteen years of output, structured as a chronological record rather than as a set of selected projects.

He has a specific and slightly awkward problem. His best-known work is a data visualisation from 2016 that he now finds embarrassing; his favourite work is a piece of infrastructure nobody can see; and a lot of what he is proudest of is technique — things he worked out how to do — rather than projects with names and clients. The standard portfolio of six polished case studies actively misrepresents him, because it implies a career of discrete triumphs when the truth is fourteen years of continuous, cumulative, uneven work in which the failures taught him more than the successes.

Take the honest structure seriously. A career is more like a log than a gallery: dense, chronological, full of small entries, with occasional things that mattered. Build a site that can hold that much material without becoming a wall, that lets a reader see the shape of a career at a glance and then descend into any part of it, and that can give a two-line entry and a major project their appropriate relative weight.

The audience is mixed and their needs conflict: a potential client wants proof he can deliver, a potential collaborator wants to know how he thinks, and a curious peer wants the technical detail. One structure has to serve all three.

He writes well and prefers text to marketing. Typography and reading experience will decide whether this site is good, and it should feel like reading rather than like being sold to.

Avoid project cards in a three-column grid, and avoid a case-study template with a Challenge and a Solution.`,
    abilityTags: [
      "Information Architecture",
      "Layout & Typography",
      "Visual Design / Taste",
      "Narrative / Communication",
      "State & Data",
      "Interaction Design",
    ],
    resultRoute: "/r/personal-studio-designer-portfolio",
    status: "complete",
    blurb:
      "Fourteen years of a developer's work as a dense chronological log — technique notes beside major projects, weighted honestly, built to be read rather than sold from.",
    direction:
      "The structure follows from an honest account of what a career actually is: cumulative, uneven, mostly small entries. A log holds that; six polished case studies misrepresent it. The typographic challenge is giving a two-line note and a two-year project their true relative weight in one continuous surface, which is more interesting than a grid of cards.",
  },
  {
    id: "personal-studio-studio-site",
    applicationSetting: "personal-studio",
    typicalTask: "Studio / Agency Site",
    title: "Bench",
    prompt: `Build a site for a four-person industrial design studio that designs physical products — tools, instruments, furniture for institutions.

Their commercial problem is precise. Prospective clients are choosing between them and two similar studios whose finished work looks equally competent in photographs, and every one of those studios has a website of beautiful final product photography. Since the finished renders are indistinguishable, the photography is not doing any persuading. What actually differentiates them is judgement — the reasoning that got from a vague brief to the right object — and that reasoning is invisible in a hero image.

So the argument this site has to make is about process rather than outcome. That means showing things studios normally hide: the directions that were rejected and why, the eleven foam models that preceded the chosen form, the constraint that killed the elegant idea, the thing that failed in testing. This is genuinely risky and that is the point — a studio confident enough to show its discards is making a claim its competitors cannot copy with better photography.

Design the site around that. Someone should be able to follow a project from brief to object and understand the decisions, and should come away with a clear sense of how these four people think.

It still has to function as a business site. A procurement officer needs capabilities, credentials and a way to start a conversation, without wading through a manifesto.

The studio's own taste is part of the pitch — they make restrained, well-proportioned, unfashionable objects meant to last decades. A site with trendy interaction would contradict them.

Avoid a full-bleed hero video and a logo wall.`,
    abilityTags: [
      "Narrative / Communication",
      "Information Architecture",
      "Layout & Typography",
      "Visual Design / Taste",
      "Brand Interpretation",
      "Interaction Design",
    ],
    resultRoute: "/r/personal-studio-studio-site",
    status: "complete",
    blurb:
      "An industrial design studio that sells its judgement by showing what it rejected: the foam models, the killed ideas, the failed test — the argument competitors can't copy.",
    direction:
      "When every competitor's finished photography looks equally good, photography persuades nobody, so the differentiator has to be reasoning. Showing discards is a claim that cannot be copied with a better photographer, and the risk is precisely what makes it credible. The site's own restraint has to match objects designed to last decades; trendy interaction would refute the pitch.",
  },
  {
    id: "personal-studio-digital-diary",
    applicationSetting: "personal-studio",
    typicalTask: "Digital Diary",
    title: "Same Walk",
    prompt: `Build a digital diary belonging to someone who walked the same twenty-minute route every morning for a year and wrote one short entry each day.

The route never changes: out of a terraced house, along a canal towpath, under two bridges, past a scrapyard and a heron that is sometimes there, across a footbridge and back. Three hundred and forty-one entries, ranging from one line to a paragraph. Some are about the weather. One is about a death in the family. Several are about the heron. Two mention the same stranger. Read in order they are repetitive; read as a whole they are unmistakably a year in a life, and the repetition is what makes the exceptions land.

Find the structure that lets that emerge. Chronological order — a list of dated entries, newest first — is the default and it destroys the material, because the whole meaning of this diary is in recurrence: the same place seen two hundred times, the same bridge in February and in July, the things that changed while the route did not.

Design something that lets a reader move through it along whichever axis they want, and that makes the accumulation visible. A reader should be able to notice a pattern the writer may not have noticed themselves.

Restraint is essential. This material is quiet and slightly sad, and any interaction that treats it as content to be gamified will destroy it. Everything should serve reading.

Write the diary yourself, and write it properly. Three hundred entries of generated filler would make this worthless, so a smaller number of genuinely well-written days — with real specificity, real repetition, and a few that quietly hurt — is far better than volume.`,
    abilityTags: [
      "Narrative / Communication",
      "Information Architecture",
      "Layout & Typography",
      "Interaction Design",
      "Visual Design / Taste",
      "Creative Concept",
      "State & Data",
    ],
    resultRoute: "/r/personal-studio-digital-diary",
    status: "complete",
    blurb:
      "A year of one unchanging morning walk, read along the route as well as along the calendar, so recurrence becomes visible and the exceptions land.",
    direction:
      "The material's meaning is recurrence, so a reverse-chronological list — the default — actively destroys it. Making the route itself a navigable axis alongside the calendar lets a reader stand at one bridge across two hundred mornings and see what changed. Fewer, genuinely well-written entries beat volume; generated filler would make the whole thing worthless.",
  },
  {
    id: "personal-studio-travel-story",
    applicationSetting: "personal-studio",
    typicalTask: "Travel / Life Story",
    title: "Watershed",
    prompt: `Build a site telling the story of one person's forty-one-day descent of a river, from a spring on a hillside to the sea.

The journey has an unusually strong natural structure: it is a line, it only goes one way, and it is organised by something real. The river starts as a trickle someone can step across and ends as a tidal estuary two kilometres wide, and everything the traveller encounters is arranged along that gradient — moorland, then farms, then a mill town, then a city, then docks, then salt marsh. The river gets bigger, slower, dirtier and more industrial, and the human story tracks it.

It is also not a triumphant story. She set out three months after a divorce, and the trip's meaning is not the achievement of finishing it. The site should be able to carry that without becoming either mawkish or coy.

Use the linearity. A journey down a river is one of the few travel structures that genuinely justifies a strong sense of progression, and the relationship between distance, days, and change in the landscape is the material you are working with.

Avoid the standard travel-blog answer of a map with photo pins. A pin map flattens exactly what matters here — that this was a continuous descent in which each place followed from the last.

Write the text yourself and make it good. Travel writing fails by describing scenery; it succeeds through specific incident, people met, things that went wrong, and honesty about the writer. Fewer, better days are much stronger than complete coverage.

The visual language should be restrained enough that the writing carries it.`,
    abilityTags: [
      "Narrative / Communication",
      "Layout & Typography",
      "Visual Design / Taste",
      "Motion Design",
      "Interaction Design",
      "Information Architecture",
      "Creative Concept",
    ],
    resultRoute: "/r/personal-studio-travel-story",
    status: "complete",
    blurb:
      "Forty-one days down a river from spring to estuary, told along the one axis that organises everything: distance downstream, as the water widens and the story darkens.",
    direction:
      "A river is one of the few travel structures where strong linear progression is honest rather than imposed — the landscape's change is genuinely a function of distance downstream, so the site's single axis carries the argument. The pin map is refused because it flattens continuity, which is the whole point. The emotional register stays dry; the writing does the work.",
  },
  {
    id: "personal-studio-interactive-resume",
    applicationSetting: "personal-studio",
    typicalTask: "Interactive Résumé",
    title: "Fit",
    prompt: `Build an interactive résumé for someone whose experience is broad enough that no single fixed document represents her well.

Over twelve years she has been a mechanical engineer, a technical program manager, and the founder of a hardware startup that failed after two years. She is now applying for roles that fall into three quite different categories, and each one wants a different reading of the same history. For an engineering role, the startup is where she did her deepest technical work. For a program management role, the startup is evidence she can run a cross-functional organisation. For an operations role, the interesting part is the supply chain she rebuilt twice. Every fact is the same; the relevance ordering is completely different.

The normal solution is maintaining three documents, which is tedious and quickly inconsistent. Build the better version: one honest record that can be read from several angles.

The hard constraint is integrity, and it should be visible. The résumé may reorder, expand, contract and re-emphasise, but it must never change a claim to suit an audience. Nothing may be invented, no title may be inflated, and the failure of the startup must be present in every reading. A tool that quietly tells each employer what they want to hear is a lie generator, and the design should make it evident that this one is not.

It must also survive contact with reality. Recruiters print things, paste them into systems, and read them on phones at midnight, so a plain, complete, printable version is a requirement rather than a fallback.

Résumés are a genre with real conventions and hiring managers read them extremely fast. Do not make someone learn an interface to find out where she worked.`,
    abilityTags: [
      "Information Architecture",
      "State & Data",
      "Layout & Typography",
      "Interaction Design",
      "Functional Logic",
      "Robustness / Product Polish",
      "Export / Reusability",
    ],
    resultRoute: "/r/personal-studio-interactive-resume",
    status: "complete",
    blurb:
      "One honest career record readable from three angles — engineering, program management, operations — reordering emphasis without ever altering a claim, and printing cleanly.",
    direction:
      "The genuine problem is that relevance ordering is audience-dependent while facts are not, so the design separates the two and makes the separation visible. Integrity is the load-bearing constraint: the failed startup appears in every reading, which is what distinguishes this from a tool that tells each employer what it wants to hear. A plain printable version is a requirement, because recruiters print things.",
  },
  {
    id: "personal-studio-project-archive",
    applicationSetting: "personal-studio",
    typicalTask: "Project Archive",
    title: "Threads",
    prompt: `Build an archive site for a prolific artist with about two hundred and sixty works made over thirty years across several media, organised by the relationships between the works rather than by date.

She works in print, sculpture, artist's books and occasional public commissions, and her practice has a small number of preoccupations she has returned to over and over: tide tables, her grandmother's handwriting, the structure of ledgers, birds seen from trains. A print from 1998 and a sculpture from 2019 can be two attempts at the same problem, twenty-one years apart. A chronological archive makes that invisible. So does a medium-based one, because the connections cut across media, which is precisely what is interesting about them.

Design the archive around the connections. A visitor should be able to arrive at any work and find their way to the others it is genuinely related to, and should be able to see the shape of thirty years of preoccupations — which ideas she kept coming back to, which she abandoned, which lay dormant for a decade and returned.

This has real scholarly use, so rigour matters. Titles, dates, media, dimensions, editions and locations need to be present and correct, and someone should be able to cite a work. Where a relationship is the artist's own claim rather than an established fact, that distinction is worth preserving.

Two hundred and sixty items is enough to be genuinely difficult to navigate, and making a large archive feel navigable rather than exhausting is most of this task.

Do not build a force-directed graph of floating nodes. It is the reflexive answer to connected data and it is nearly always unreadable, unnavigable and impossible to cite.`,
    abilityTags: [
      "Information Architecture",
      "State & Data",
      "Data Visualization",
      "Layout & Typography",
      "Interaction Design",
      "Visual Design / Taste",
      "Narrative / Communication",
    ],
    resultRoute: "/r/personal-studio-project-archive",
    status: "complete",
    blurb:
      "Thirty years of an artist's work indexed by recurring preoccupation rather than date, so a 1998 print and a 2019 sculpture can be seen as two attempts at one problem.",
    direction:
      "Organising by preoccupation instead of chronology or medium is the whole thesis, since the interesting relationships cut across both. The explicit refusal of the force-directed graph matters: it is the reflex answer for connected data and it is unreadable, unnavigable and uncitable. Scholarly rigour — correct metadata, citable works, artist claims distinguished from established fact — keeps it useful rather than decorative.",
  },
  {
    id: "personal-studio-knowledge-garden",
    applicationSetting: "personal-studio",
    typicalTask: "Personal Knowledge Garden",
    title: "Plot",
    prompt: `Build a public notebook for someone thinking in the open, where the maturity of each note is part of what is published.

The idea of a digital garden is that notes are planted, tended and grown rather than published finished — a correction to the blog, where a post is frozen at the moment of publication and never revised. In practice most implementations get one thing very wrong: they present a half-formed thought and a decade-long conviction in exactly the same typographic voice, so a reader cannot tell which is which and has to treat everything with equal scepticism.

Make maturity legible. A reader should be able to see, without being told, which notes are speculative fragments and which have been worked on for years, and should be able to choose to read only the developed material or to wander into the undergrowth deliberately.

Take the metaphor seriously enough to be honest about neglect. Real gardens have parts that were abandoned, and a note last touched four years ago that contradicts a newer one is a true fact about how this person thinks. Hiding that would be the same failure as the uniform typographic voice.

The notes must be genuinely interconnected, and the connections should be usable while reading rather than only visible from a map. Someone following an idea across notes is doing the thing this form exists for.

Write real notes with real content — a coherent body of thought where the connections mean something. A hundred lorem-ipsum nodes in a graph would make this worthless, so a smaller number of substantial, genuinely linked notes is far better.

Avoid the two clichés of this genre: a force-directed graph as the front door, and the whole thing rendered as a dark terminal.`,
    abilityTags: [
      "Information Architecture",
      "Layout & Typography",
      "State & Data",
      "Narrative / Communication",
      "Interaction Design",
      "Visual Design / Taste",
    ],
    resultRoute: "/r/personal-studio-knowledge-garden",
    status: "complete",
    blurb:
      "A public notebook where a note's maturity is typographically legible, tended notes look tended, and neglected ones admit it instead of posing as conclusions.",
    direction:
      "The genre's real bug is that a half-formed fragment and a decade-old conviction are published in the same voice, leaving readers unable to calibrate. Making maturity visible in the typography fixes it, and taking neglect seriously — a stale note that contradicts a newer one stays visible — is the honest completion of the same idea. Both house clichés, the graph front door and the dark terminal, are refused.",
  },
];

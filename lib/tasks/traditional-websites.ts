import type { Task } from "../types";

/**
 * SETTING 9 — Traditional Websites
 *
 * Included as its own setting because doing this well is a distinct discipline.
 * The visitor reads, browses, navigates and discovers rather than completing a
 * workflow, which moves the entire quality budget onto typography, hierarchy,
 * navigation, content order, restraint and art direction.
 *
 * Traditional does not mean mediocre. Each subject below was chosen because it
 * has a genuinely hard content problem — several audiences, or four thousand
 * near-identical items, or a reader in crisis — so that a result cannot succeed
 * on decoration.
 */
export const TRADITIONAL_WEBSITES: Task[] = [
  {
    id: "traditional-websites-company-homepage",
    applicationSetting: "traditional-websites",
    typicalTask: "Company Homepage",
    title: "Tunnel",
    prompt: `Build the homepage and top-level site for a company that designs and builds wind tunnels.

They are a ninety-person engineering firm, sixty-two years old, and they build bespoke facilities costing between two and forty million: automotive aeroacoustic tunnels, transonic tunnels for aerospace, small research tunnels for universities, and a growing line of work for cycling and skiing teams. Each installation takes two to four years.

The difficulty is that one homepage has to serve five audiences with almost nothing in common. A procurement director at a car manufacturer needs evidence they can deliver a forty-million-pound facility on schedule. A university professor with a small grant needs to know they will take a four-hundred-thousand-pound job seriously. A national aerospace agency needs security and classification credentials. A cycling team's performance director does not speak engineering. And a graduate aerodynamicist deciding where to work wants to see interesting problems. Each of these people will decide within about twenty seconds whether this company is for them.

Their credibility rests on specifics — flow quality, turbulence intensity, achievable Reynolds numbers, acoustic noise floors — which are meaningless to two of the five audiences and decisive for the other three.

Build it. The core problem is information architecture and hierarchy: making a homepage that routes five audiences correctly without becoming a menu of doors, while establishing enough authority in the first screen that a sceptical engineer keeps reading. The company is proud, technical, unshowy and slightly old-fashioned, and the site should be recognisably theirs.

This is an engineering firm, so precision is part of the art direction. Restraint will read as competence.

Avoid a full-bleed hero video with a one-word headline, a carousel of client logos, and the phrase innovative solutions.`,
    abilityTags: [
      "Information Architecture",
      "Layout & Typography",
      "Visual Design / Taste",
      "Narrative / Communication",
      "Brand Interpretation",
      "Robustness / Product Polish",
    ],
    resultRoute: "/r/traditional-websites-company-homepage",
    status: "planned",
    blurb:
      "One homepage routing five incompatible audiences — procurement, academia, defence, sport, recruits — while proving engineering authority to a sceptic in twenty seconds.",
    direction:
      "The whole task is hierarchy under conflicting demands: five audiences, twenty seconds, and technical specifics that are decisive for three of them and meaningless to the other two. Solving it without degenerating into a menu of doors is the design problem. Precision as art direction — restraint reading as competence — fits a firm that is proud, technical and unshowy, and rules out the hero video.",
  },
  {
    id: "traditional-websites-saas-website",
    applicationSetting: "traditional-websites",
    typicalTask: "Conventional Product / SaaS Website",
    title: "Rota",
    prompt: `Build the marketing website for payroll and scheduling software sold to independent restaurants.

The product is unglamorous and genuinely valuable. Restaurant payroll is unusually horrible: staff turnover is enormous, shifts are split, tips have to be pooled and distributed under rules that vary by jurisdiction and get people prosecuted when done wrong, minors have restricted hours, overtime interacts with scheduling, and a significant fraction of staff would rather be paid promptly than paid via an app. The buyer is an owner-operator who is also the person who was up until one in the morning doing this by hand last Sunday.

Two things make this a hard piece of communication. First, the buyer is deeply sceptical, because they have been sold restaurant software before and it did not work, and they will assume this is the same. Second, the product's value is in details that sound boring — correct tip distribution, handling a rota change three hours before service — and any attempt to make those sound exciting will destroy trust with exactly the person you need.

So the site has to be specific rather than aspirational. Its persuasive power comes from demonstrating that whoever built this actually understands the job, which means naming real situations the buyer will recognise from last week.

Build it, and build it as a proper marketing site: what it does, who it is for, how it compares, what it costs, how migration works, and how support works. Pricing has to be real and legible, because opacity is a major objection in this market.

This is deliberately a conventional website. The exercise is doing an ordinary form extremely well — clear, confident, well-typeset, correctly sequenced, and free of filler.

Avoid a gradient hero with a floating dashboard screenshot, invented testimonials, fake logo walls, and a comparison table rigged so every competitor row is empty.`,
    abilityTags: [
      "Layout & Typography",
      "Information Architecture",
      "Narrative / Communication",
      "Visual Design / Taste",
      "Brand Interpretation",
      "Robustness / Product Polish",
    ],
    resultRoute: "/r/traditional-websites-saas-website",
    status: "planned",
    blurb:
      "Restaurant payroll sold to a sceptic who did it by hand last Sunday: specific about tip pooling and late rota changes, honest about price, aspirational about nothing.",
    direction:
      "The audience has already been burned by restaurant software, so credibility comes from demonstrated understanding of the job rather than from ambition — naming situations the buyer recognises from last week. That forbids making boring-but-valuable details sound exciting, which would destroy trust with precisely the right buyer. The exercise is an ordinary form executed extremely well, with real legible pricing.",
  },
  {
    id: "traditional-websites-editorial",
    applicationSetting: "traditional-websites",
    typicalTask: "Blog / Editorial Publication",
    title: "Works",
    prompt: `Build an editorial publication about infrastructure — the built systems that make ordinary life possible and that almost nobody thinks about.

It publishes long reported essays: a month inside a water treatment plant, why a container port is arranged the way it is, the politics of a sewer overflow, the ninety-year-old switchgear still running a city's trams, how a national grid is balanced minute by minute. Pieces run from two to nine thousand words, are reported rather than opinionated, and are frequently technical.

The design problem is real editorial design rather than a blog theme. The publication has several distinct article formats — the long reported feature, the short dispatch, the photo essay, the annotated diagram, the interview — and they need genuinely different treatments while remaining unmistakably one publication. There are issues, and there is an archive that has to stay navigable as it grows. Long technical reading requires serious typographic craft: measure, rhythm, footnotes, pull quotes, captions, sidebars, tables and diagrams that sit properly in a text column.

Reading is the product. Anything that interferes with sustained attention across nine thousand words is a design failure, and the visual identity has to be strong without competing with the writing.

Write real sample content. A publication cannot be evaluated on placeholder text, and the typographic decisions only mean something against genuine prose of the stated length — including at least one piece long enough to test the reading experience properly.

Consider the whole publication, not one article page: a front page that makes an editorial argument about what matters this week, section pages, the archive, and how a reader who arrives at one piece from elsewhere is given a reason to stay.

Avoid a centred column of grey text on white with a giant sans-serif headline, and avoid the newsletter aesthetic.`,
    abilityTags: [
      "Layout & Typography",
      "Information Architecture",
      "Visual Design / Taste",
      "Narrative / Communication",
      "Interaction Design",
      "Robustness / Product Polish",
    ],
    resultRoute: "/r/traditional-websites-editorial",
    status: "planned",
    blurb:
      "A reported publication about infrastructure, with genuinely distinct article formats under one identity and typography built to survive nine thousand words.",
    direction:
      "Real editorial design rather than a blog theme means several article formats needing different treatments while remaining one publication — that tension is the task. Reading is the product, so the identity must be strong without competing with the prose. Sample content is written at true length because typographic decisions are meaningless against placeholder text.",
  },
  {
    id: "traditional-websites-documentation",
    applicationSetting: "traditional-websites",
    typicalTask: "Documentation Site",
    title: "Instant",
    prompt: `Build a documentation site for a date, time and timezone library.

The subject is chosen deliberately: dates and times are the canonical example of a domain everybody thinks is simple and nobody gets right. Timezones change by political decision, sometimes with weeks of notice. Days are not always twenty-four hours long. Some local times do not exist and some occur twice. Adding a month is ambiguous and adding a day is not the same as adding twenty-four hours. Which means the documentation is not a courtesy — it is the primary defence against a class of bugs that reaches production constantly.

Documentation has to serve people in completely different states at once. Someone integrating for the first time needs a path from nothing to working. Someone debugging at eleven at night needs one function's exact behaviour, including its edge cases, in ten seconds. Someone evaluating the library needs to know what it does not do. Someone upgrading needs to know precisely what broke. These are different documents and they are usually collapsed into one that serves none of them.

Build it properly: guides, an API reference, conceptual explanation of the hard parts, and versioned migration notes. Search is not a feature here, it is the primary navigation, and most documentation search is bad.

Take the code seriously. Examples must be correct, runnable, and cover the awkward cases rather than the happy path — the example that earns trust is the one showing what happens at a daylight-saving transition.

Typographically this is a specific and underrated craft: dense technical text, signatures, types, inline code, tables of behaviour, and a scannability requirement that fights the reading requirement.

Write real documentation. Invent a coherent, plausible API and document it consistently and accurately, including its limitations.

Avoid a wall of auto-generated signatures with no prose, and avoid a marketing homepage bolted onto the front.`,
    abilityTags: [
      "Information Architecture",
      "Layout & Typography",
      "Functional Logic",
      "Narrative / Communication",
      "Interaction Design",
      "Robustness / Product Polish",
    ],
    resultRoute: "/r/traditional-websites-documentation",
    status: "planned",
    blurb:
      "Docs for a datetime library, serving the integrator, the 11pm debugger, the evaluator and the upgrader as the different documents they actually are.",
    direction:
      "Documentation usually collapses four readers in four different states into one document that serves none, so separating them is the structural move. The subject is picked because its edge cases are notorious, which makes examples at a daylight-saving transition the trust-earning content rather than happy-path snippets. Search is treated as primary navigation, and the typography has to reconcile scanning with reading.",
  },
  {
    id: "traditional-websites-restaurant",
    applicationSetting: "traditional-websites",
    typicalTask: "Restaurant / Hospitality Site",
    title: "Weighbridge",
    prompt: `Build the site for a restaurant in a converted weighbridge on the edge of a market town.

The specifics: eighteen seats, one sitting a night, five nights a week. There is no menu in the usual sense — a set meal of nine or ten courses, decided that morning from what arrived, at ninety-five pounds a head. Dinner takes three hours. There are no substitutions beyond genuine allergies, dietary requirements must be given at booking, and the wine list is short and mostly unfamiliar. Bookings open for a month at a time and are gone within an hour. The chef-owner is not interested in being famous and does not want the restaurant described as an experience.

The site's real job is not persuasion — demand exceeds supply by an order of magnitude — it is expectation management and logistics. Almost every bad review this restaurant gets comes from someone who did not understand what they had booked: they expected to choose, expected to leave in ninety minutes, did not realise it was one sitting at seven-thirty, brought a child, or assumed a vegetarian option could be arranged on the night. The kindest thing the site can do is ensure that everyone who books knows exactly what they are agreeing to, and that people who would not enjoy it discover that before booking rather than during dinner.

Build it. It has to handle the awkward, unglamorous, essential content — the fixed price, the fixed time, the no-substitutions policy, the cancellation terms, getting there, parking, accessibility, allergies — without becoming a page of rules, and while conveying enough of what this place is that the right person recognises it immediately.

The restaurant's character is plain, serious, unpretentious and slightly severe. The site should be the same. Restraint here is not a style choice, it is accuracy.

Avoid full-screen video of hands plating, parallax food photography, the word journey, and a hidden menu of terms nobody reads.`,
    abilityTags: [
      "Layout & Typography",
      "Visual Design / Taste",
      "Information Architecture",
      "Narrative / Communication",
      "Brand Interpretation",
      "Robustness / Product Polish",
    ],
    resultRoute: "/r/traditional-websites-restaurant",
    status: "complete",
    blurb:
      "Eighteen seats, one sitting, no choices: a site whose real job is making sure nobody books without knowing exactly what they agreed to.",
    direction:
      "Demand already exceeds supply tenfold, so persuasion is the wrong goal and expectation management is the real one — every bad review comes from a misunderstanding the site could have prevented. That inverts the usual restaurant brief: the awkward logistics become the primary content, and helping the wrong customer self-select out is a service. Restraint is accuracy here, matching a plain and slightly severe kitchen.",
  },
  {
    id: "traditional-websites-directory",
    applicationSetting: "traditional-websites",
    typicalTask: "Directory / Listing Site",
    title: "Reaches",
    prompt: `Build a directory of places to swim outdoors — rivers, lakes, lidos, tidal pools and stretches of coast.

About one thousand nine hundred entries. Each has a location, access details, parking, depth, current, temperature by season, water quality where measured, hazards, whether it is legal and whether it is merely tolerated, and notes from swimmers.

Two things make this harder than an ordinary listing site. The first is that the information is safety-critical. People drown in these places. A river that is benign in August is lethal in March, an inviting weir pool has a recirculating current that has killed people, and water quality after heavy rain can be genuinely dangerous downstream of a storm overflow. A directory that presents all entries with equal cheerfulness would be irresponsible, and hazard information has to be impossible to miss without making the whole site read as a warning notice.

The second is that the data is uneven. Some entries have official water quality sampling; some have one swimmer's note from 2019. Presenting both in the same confident format would mislead exactly when it matters most, so provenance and recency have to be visible.

Then there is the ordinary but substantial problem of making one thousand nine hundred entries genuinely findable. People arrive with very different questions — near me, somewhere safe for a child, somewhere I can swim a mile, somewhere I can get to without a car, somewhere warm enough in October — and a single filterable list serves none of them well.

Build it: the browse and search experience, the individual entry page, and the structure that holds it together. Be honest about what is not known, and never let an absence of information look like an absence of hazard.

Avoid a map of nineteen hundred identical pins as the primary interface, and avoid presenting user notes as if they were measurements.`,
    abilityTags: [
      "Information Architecture",
      "State & Data",
      "Layout & Typography",
      "Interaction Design",
      "Visual Design / Taste",
      "Robustness / Product Polish",
      "Data Visualization",
    ],
    resultRoute: "/r/traditional-websites-directory",
    status: "planned",
    blurb:
      "Nineteen hundred outdoor swimming spots where the data is uneven and the stakes are drowning: provenance visible, hazards unmissable, and absence never mistaken for safety.",
    direction:
      "Safety-critical content with wildly uneven provenance is the defining constraint, so official sampling and one swimmer's 2019 note must never share a confident format. The hard rule — an absence of information must never look like an absence of hazard — drives the entry design. Nineteen hundred identical pins are refused, because arrivals come with genuinely different questions that one filterable list cannot serve.",
  },
  {
    id: "traditional-websites-nonprofit",
    applicationSetting: "traditional-websites",
    typicalTask: "Event / Institution / Nonprofit Website",
    title: "Advice",
    prompt: `Build the website for a free legal advice clinic.

They help people with housing, debt, benefits and employment problems — eviction, disrepair, wrongful dismissal, a benefit stopped without warning. They run drop-in sessions in three locations, a phone line, and a small casework team, staffed by two solicitors and thirty volunteers.

The primary user is in trouble. They may have had a letter this morning saying they must leave their home in fourteen days. They are frightened, possibly not reading in their first language, quite likely on a phone with little data and a nearly-flat battery, and they may be doing this at two in the morning. They do not want to learn about the organisation. They need to know whether they are in the kind of trouble this clinic handles, what to do in the next twenty-four hours, and how to reach a human.

That is a difficult and important information design problem, and it is made harder by legal accuracy: the advice must be correct, must distinguish general information from advice on someone's specific situation, must not imply a solicitor-client relationship, and must be clear about deadlines, because in housing and employment law a missed deadline can end a case permanently.

The site also has to serve people whose needs conflict with that primary user. Funders want impact reporting and accounts. Volunteers want to apply. Local authorities and other charities want referral routes. Donors want to give. None of that may be allowed to get between a frightened person and the phone number.

Build it. Make it work on a slow connection and an old device, be readable at speed under stress, and be genuinely usable by someone with low confidence in English.

Avoid a hero photograph of a diverse group smiling, a homepage dominated by a donate button, charity-sector language like empowering, and burying the phone number in a Contact page.`,
    abilityTags: [
      "Information Architecture",
      "Narrative / Communication",
      "Layout & Typography",
      "Robustness / Product Polish",
      "Visual Design / Taste",
      "Interaction Design",
    ],
    resultRoute: "/r/traditional-websites-nonprofit",
    status: "planned",
    blurb:
      "A legal advice clinic whose primary user has fourteen days to leave their home: triage first, deadlines unmissable, and nothing allowed between a frightened person and a phone number.",
    direction:
      "Ranking a frightened user in crisis above funders, volunteers and donors is the decision the whole site follows from, and it is the one most charity sites get backwards. Triage — am I in the kind of trouble you handle, and what do I do today — replaces the organisational introduction. Legal accuracy adds a real constraint: general information must be distinguishable from advice, and deadlines must be impossible to miss.",
  },
  {
    id: "traditional-websites-ecommerce",
    applicationSetting: "traditional-websites",
    typicalTask: "Traditional E-Commerce Storefront",
    title: "Ironmonger",
    prompt: `Build an online storefront for a hundred-and-forty-year-old ironmonger selling tools and fixings.

About four thousand two hundred products, and the catalogue is the difficulty. Thirty-one varieties of wood screw, differing by material, head type, drive, gauge, length and finish, most of which look identical in a photograph and none of which are interchangeable in use. Also hand tools, hinges, locks, chain by the metre, and eleven kinds of hammer whose differences are real and invisible to a novice.

Two customers use this shop and they are almost opposites. A tradesperson knows exactly what they want, orders the same items repeatedly, wants to buy a box of two hundred in thirty seconds, and is infuriated by anything decorative. A homeowner has a broken thing and does not know the name of the part they need, which makes the site's search — built on names they do not know — useless to them. Serving both from one catalogue is the central problem.

The staff's expertise is the shop's actual advantage. In the physical shop, someone asks which screw for oak outdoors and gets a correct answer in seconds. That knowledge exists, and putting it into a website is more valuable than any amount of styling.

Build it: the catalogue structure, browse and search, the product page, and the path to checkout. Product data is the substance here — specifications, materials, sizes, quantities, compatibility, what a thing is actually for — and a product page that omits the thread pitch is broken no matter how it looks.

The shop is plain, competent, well-organised and slightly stern, with fifty years of trade counter signage. That is a real identity and better than a generic e-commerce theme.

Avoid a lifestyle hero image, an infinite grid of near-identical thumbnails, and a search that returns four hundred results in no useful order.`,
    abilityTags: [
      "Information Architecture",
      "State & Data",
      "Layout & Typography",
      "Interaction Design",
      "Visual Design / Taste",
      "Functional Logic",
      "Robustness / Product Polish",
    ],
    resultRoute: "/r/traditional-websites-ecommerce",
    status: "planned",
    blurb:
      "Four thousand fixings that look identical and aren't, serving both a tradesperson who wants a box in thirty seconds and someone who doesn't know the word for the part they broke.",
    direction:
      "Two near-opposite customers sharing one catalogue is the central problem, and the novice's difficulty is structural: search indexed on names they do not know cannot help them. Encoding the trade counter's expertise — which screw for oak outdoors — is worth more than any styling, so product data and guided selection carry the design. The identity comes from fifty years of trade signage rather than an e-commerce theme.",
  },
];

import type { Task } from "../types";

/**
 * SETTING 6 — Client & Brand Work
 *
 * Each prompt is a real brief: a fictional client, an audience, a positioning,
 * a message, mandatory content, a call to action, constraints, and things to
 * avoid. The ability under test is not decoration — it is reading a commercial
 * idea correctly and finding the digital form that carries it. So every brief
 * contains a genuine strategic problem that a merely beautiful page would fail
 * to solve.
 */
export const CLIENT_BRAND: Task[] = [
  {
    id: "client-brand-product-launch",
    applicationSetting: "client-brand",
    typicalTask: "Product Launch Site",
    title: "Kestrel",
    prompt: `CLIENT — Kestrel, a hearing aid company.

PRODUCT — The Kestrel One, a hearing aid designed to be seen. Machined titanium and brass, available in finishes chosen the way you would choose a watch, worn openly at the ear.

AUDIENCE — People between fifty and sixty-eight with early to moderate hearing loss who have been putting off doing anything about it. On average this group waits seven years between noticing a problem and buying a device. They are not waiting because of cost or because they are unaware. They are waiting because every product in the category is designed to be hidden — beige, plastic, discreet — and the entire category's design language tells them that what they have is something shameful. Buying one feels like an admission of getting old.

POSITIONING — Against the whole category's instinct to disappear. Glasses made this journey already: a medical appliance became an object of taste that people wear as a choice, and nobody hides their spectacles. Kestrel intends the same move for hearing.

MAIN MESSAGE — Seven years is a long time to miss things.

MANDATORY CONTENT — The finishes. Fit and sizing. How it handles crowded rooms, which is the single most common complaint. Battery life. Price, which is high, and financing. The fact that a hearing test is required, and how to get one. Clinical credibility, because this is a medical device and the audience will be sceptical of a design-led pitch.

CALL TO ACTION — Book a fitting.

CONSTRAINTS — This is a regulated medical device: no exaggerated performance claims, and hearing loss must not be trivialised. The audience is over fifty and many have some vision impairment, so type size, contrast and touch targets are a hard requirement rather than an accessibility checkbox. Many will be shopping with a spouse or adult child.

AVOID — Stock photography of grey-haired couples laughing on beaches. Wellness language. Anything that reads as consumer electronics. Any implication that the previous seven years were the customer's fault.`,
    abilityTags: [
      "Brand Interpretation",
      "Visual Design / Taste",
      "Narrative / Communication",
      "Layout & Typography",
      "Information Architecture",
      "Robustness / Product Polish",
      "Interaction Design",
    ],
    resultRoute: "/r/client-brand-product-launch",
    status: "planned",
    blurb:
      "A hearing aid launch that argues the category should stop hiding — jewellery-grade industrial design, medical credibility intact, and accessibility as the actual brief.",
    direction:
      "The strategic insight is that the seven-year delay is a design problem, not an awareness problem: the category's own visual language shames its buyers. So the site borrows the register of watches and eyewear while keeping clinical seriousness, and the glasses precedent does the persuading. Accessibility is load-bearing here rather than compliance, since the audience's eyes are the reason they are on the page.",
  },
  {
    id: "client-brand-marketing-campaign",
    applicationSetting: "client-brand",
    typicalTask: "Marketing Campaign",
    title: "One Hour",
    prompt: `CLIENT — A national blood service.

PRODUCT — Blood donation. Free to give, urgently needed, chronically under-supplied.

AUDIENCE — Eighteen to twenty-five year olds who have never donated. This group is the service's long-term survival, because donors acquired young give for decades, and it is the group they are worst at reaching. Research says they are not opposed and not squeamish in any decisive way — they simply have never had a reason to go this week rather than eventually. The barrier is not attitude, it is inertia.

POSITIONING — Against the category's own decades-old instinct towards guilt and emergency. This audience has been marketed at with urgency their entire lives and is fully immune to it. What actually moves them is specificity and social proof: knowing exactly what happens, how long it takes, that it is genuinely fine, and that people they know have done it.

MAIN MESSAGE — It takes an hour. You have an hour.

MANDATORY CONTENT — Exactly what happens, step by step, including the needle, honestly. Eligibility, which is complicated and is a major source of drop-off, including the common belief that a tattoo or antidepressants disqualify you. What to eat beforehand. How long until you can go to the gym. Where to go and how to book. What happens to the blood afterwards, because knowing it went to a real person is the strongest retention lever the service has.

CALL TO ACTION — Book an appointment. Secondary: bring someone.

CONSTRAINTS — Public health communication must be accurate; nothing may be minimised or overstated. Must work on a low-end phone on mobile data, which is how most of this audience will see it. Must not exclude people who turn out to be ineligible — they are future donors and potential recruiters.

AVOID — Guilt. Sirens and emergency framing. Stock photography of smiling nurses. Anything that treats donation as heroism, which this audience reads as manipulation. Gamification with badges.`,
    abilityTags: [
      "Brand Interpretation",
      "Narrative / Communication",
      "Information Architecture",
      "Interaction Design",
      "Visual Design / Taste",
      "Robustness / Product Polish",
      "Layout & Typography",
    ],
    resultRoute: "/r/client-brand-marketing-campaign",
    status: "planned",
    blurb:
      "A donation campaign that treats inertia rather than attitude as the barrier: total specificity about the hour it takes, the needle included, and a bring-someone mechanic.",
    direction:
      "The brief's real finding is that this audience is immune to urgency and moved by specificity, which inverts the category's default. So the campaign's persuasive engine is radical honesty about the procedure — including the needle and the eligibility confusion that causes most drop-off — rather than emotional pressure. Ineligible visitors are treated as future recruiters instead of dead ends.",
  },
  {
    id: "client-brand-interactive-ad",
    applicationSetting: "client-brand",
    typicalTask: "Interactive Advertisement",
    title: "Still",
    prompt: `CLIENT — A mattress company.

PRODUCT — A mattress whose defining engineering claim is motion isolation: when one person in the bed moves, the other does not feel it.

AUDIENCE — Couples who share a bed and are losing sleep to each other. One is a light sleeper, the other gets up in the night, and both have quietly concluded this is just how it is. They are not currently shopping for a mattress, which is the central difficulty — mattresses are bought reactively, roughly once a decade, and almost nobody is in the market on any given day.

POSITIONING — Most mattress advertising sells comfort, which is unverifiable in an advertisement and which every competitor also claims. Motion isolation is different: it is a specific, physical, demonstrable property, and it is the one thing about a mattress that can actually be proven in a browser.

MAIN MESSAGE — Their two in the morning is not your problem any more.

MANDATORY CONTENT — How the isolation is achieved, in terms a sceptical person will accept. The hundred-night trial. Sizes and price. Delivery and removal of the old mattress. That it is not a foam mattress that sleeps hot, which is the objection this category always faces.

CALL TO ACTION — Start the hundred-night trial.

CONSTRAINTS — This is an advertisement, so it must work in a few seconds for someone who did not come looking for it, and it must be honest — no claim the product cannot support. It must work on touch as well as with a pointer, and it needs to communicate something even to a visitor who does not interact at all.

AVOID — Cartoon sleep imagery. Sheep. Anyone in white linen in a sunbeam. A page-length scroll story; this is an advertisement and the audience's patience is measured in seconds. And do not make the interaction a gimmick that fails to prove the claim — if the demonstration is not convincing, the advertisement has no argument.`,
    abilityTags: [
      "Brand Interpretation",
      "Interaction Design",
      "Physics / Simulation",
      "Creative Concept",
      "Motion Design",
      "Visual Design / Taste",
    ],
    resultRoute: "/r/client-brand-interactive-ad",
    status: "planned",
    blurb:
      "An advertisement whose interaction is the proof: disturb one side of the bed as hard as you like and watch the other side refuse to move.",
    direction:
      "Motion isolation was selected from the product's claims precisely because it is the only one physically demonstrable in a browser — comfort is unverifiable, so the ad would have nothing to do. Making the interaction the demonstration means the argument survives without copy, and a wave-propagation model that visibly dies at the boundary is the entire pitch. Seconds, not a scroll story.",
  },
  {
    id: "client-brand-premium-showcase",
    applicationSetting: "client-brand",
    typicalTask: "Fashion / Automotive / Premium Product Showcase",
    title: "Single Flock",
    prompt: `CLIENT — Ardnamurchan Woollens, a Scottish spinning mill operating since 1834.

PRODUCT — The Single Flock Coat. Each coat is made from the wool of one named flock, from one farm, from one season's clip, and is traceable back to it. Production is roughly four hundred coats a year. The price is eleven hundred pounds.

AUDIENCE — People who have stopped enjoying buying clothes. They have the money, they are tired of owning things that last two seasons, and they are increasingly suspicious of sustainability marketing because they have seen it used to sell the same disposable goods. They buy few things and research them heavily.

POSITIONING — Traceability as the entire argument. Every heritage brand claims craft, and the claims are unverifiable and therefore worthless. This one is checkable: a specific farm, a specific flock, a specific year, and a coat that can be repaired by the mill for as long as it exists. The mill is not selling a story about wool, it is selling a chain of custody.

MAIN MESSAGE — You can know where it came from.

MANDATORY CONTENT — The farms and the flocks, named, with something real about each. The route from clip to cloth to coat. Why single-flock wool differs from blended, which involves a genuine trade-off worth being honest about: consistency is lower, and each year's cloth is slightly different. Sizing and fit, which is the main barrier to buying an expensive coat unseen. Repair and re-proofing for life. Price and the waiting list. Care.

CALL TO ACTION — Join the waiting list for the coming clip.

CONSTRAINTS — Every claim must be specific and checkable; vague sustainability language would actively damage this brand with this audience. The mill's own character is plain, unfashionable and slightly severe, and the site should not be more glamorous than the company. It must sell an expensive garment to someone who cannot touch it.

AVOID — Windswept models on clifftops. Heritage nostalgia and sepia. The word artisanal. Automotive-style product-configurator gloss.`,
    abilityTags: [
      "Brand Interpretation",
      "Visual Design / Taste",
      "Narrative / Communication",
      "Layout & Typography",
      "Information Architecture",
      "3D / Spatial",
      "Interaction Design",
    ],
    resultRoute: "/r/client-brand-premium-showcase",
    status: "planned",
    blurb:
      "A coat sold on chain of custody rather than craft language: named flocks, one season's clip, the honest trade-off that each year's cloth differs, and repair for life.",
    direction:
      "Because this audience has been inoculated against unverifiable craft claims, the site's persuasive strategy is checkability — named farms, a specific clip, a traceable route — which no competitor's copywriting can imitate. Volunteering the real drawback, that single-flock cloth is less consistent, buys more credibility than any amount of heritage atmosphere. The design stays as plain and severe as the mill.",
  },
  {
    id: "client-brand-event-microsite",
    applicationSetting: "client-brand",
    typicalTask: "Event Microsite",
    title: "Open City",
    prompt: `CLIENT — Open City, an annual architecture festival.

PRODUCT — One weekend a year, a hundred and eighty buildings that are normally closed to the public open their doors for free. Private houses, a working sewage pumping station, a Brutalist council estate, a Victorian water tower, three architects' own homes, a nuclear bunker, a mosque, a former asylum.

AUDIENCE — Two hundred thousand attendees a year, ranging from architecture students to families looking for something free to do on a Sunday. Most people manage to see four or five buildings.

POSITIONING — The festival's problem is not awareness, it is planning. Its own research shows that the biggest predictor of a good experience is whether someone built a viable route, and the biggest cause of a bad one is arriving somewhere with a two-hour queue at four o'clock when it closes at five. Some buildings need pre-booking, some have capacity limits, some are only open on one of the two days, and some are forty minutes apart. The festival's own website is currently a filterable list, and attendees resort to spreadsheets.

MAIN MESSAGE — One weekend. Get inside.

MANDATORY CONTENT — Every building: what it is, why it is worth seeing, when it is open, whether booking is needed, accessibility, and how to get there. Which buildings are extraordinary and which are a nice fifteen minutes, because a first-time attendee cannot tell. Travel time between buildings. The tours and talks, which are separate and mostly need booking.

CALL TO ACTION — Build a route and take it with you.

CONSTRAINTS — It will be used on a phone, outdoors, in the rain, on patchy data, by someone standing in a queue deciding where to go next. That is the primary use case, not a desktop browsing session. Opening times and capacity are real constraints and a route that ignores them is worse than no route. Accessibility information is critical: many of these buildings are genuinely difficult and attendees need to know before travelling.

AVOID — A filterable list, which is what exists and does not work. A map with a hundred and eighty identical pins. Assuming the visitor already knows which buildings matter.`,
    abilityTags: [
      "Information Architecture",
      "Functional Logic",
      "State & Data",
      "Interaction Design",
      "Layout & Typography",
      "Robustness / Product Polish",
      "Brand Interpretation",
    ],
    resultRoute: "/r/client-brand-event-microsite",
    status: "planned",
    blurb:
      "A hundred and eighty buildings, one weekend, and the real problem solved: building a route that respects opening hours, travel time and queues, usable in the rain on a phone.",
    direction:
      "The brief's insight is that this festival's failure mode is planning rather than awareness, so the microsite's job is route construction, not persuasion — the event sells itself. Designing for the true primary context, a wet phone in a queue at four o'clock, drives every decision. The existing filterable list and the hundred-and-eighty-identical-pins map are named as the things being replaced.",
  },
  {
    id: "client-brand-brand-storytelling",
    applicationSetting: "client-brand",
    typicalTask: "Brand Storytelling Experience",
    title: "Lost Varieties",
    prompt: `CLIENT — Kirkwall Seed Library, a small non-profit seed bank that preserves and sells heritage vegetable seed.

PRODUCT — Open-pollinated seed of old varieties, and a membership that funds the preservation work. Roughly nine hundred varieties, many held by only a handful of growers anywhere.

AUDIENCE — Gardeners, mostly experienced, who already buy seed somewhere else. The library needs them to understand why this seed is different and worth more than the packet at the garden centre.

POSITIONING — The story is a genuine and mostly unknown catastrophe. Something in the order of nine tenths of the vegetable varieties grown a century ago are gone — not endangered, gone, because a variety exists only as long as somebody keeps growing it and saving its seed. There is no wild population to return to and no way to reconstruct one. A seed bank is not a museum; it is the only reason certain foods still exist at all.

MAIN MESSAGE — A variety only survives while someone is still growing it.

MANDATORY CONTENT — What has already been lost, with real specificity — named varieties, what they were like, when they were last recorded. How preservation actually works, including that seed must be regrown every few years or it dies in storage, which is why the library needs growers and not just donors. The difference between open-pollinated and hybrid seed, honestly, including why hybrids exist and are not villains. How to save seed yourself. Membership and how to buy.

CALL TO ACTION — Become a member. Secondary: grow one variety and save its seed.

CONSTRAINTS — This must be factually accurate about agricultural biodiversity; the audience includes people who know the subject. It must not be so bleak that the visitor leaves feeling helpless, since the ask is participation. The organisation is tiny and unglamorous, and a slick corporate experience would read as inauthentic.

AVOID — Doom framing without agency. Corporate sustainability aesthetics. Sepia photographs of hands holding soil. Vilifying farmers or seed companies, which the audience will recognise as cheap.`,
    abilityTags: [
      "Brand Interpretation",
      "Narrative / Communication",
      "Data Visualization",
      "Visual Design / Taste",
      "Layout & Typography",
      "Educational Correctness",
      "Interaction Design",
    ],
    resultRoute: "/r/client-brand-brand-storytelling",
    status: "planned",
    blurb:
      "A seed bank telling a real and mostly unknown extinction story — named varieties, last recorded dates — and converting it into the one act that reverses it: growing one.",
    direction:
      "The story is genuinely startling and factually verifiable, so the persuasive work is specificity: named lost varieties with last-recorded dates rather than a statistic. The constraint that matters most is refusing doom without agency, because the ask is participation — so the piece routes every visitor from the loss to the single reversing act. No sepia soil-holding hands, no villains.",
  },
  {
    id: "client-brand-immersive-commercial",
    applicationSetting: "client-brand",
    typicalTask: "Immersive Commercial Experience",
    title: "Sleeper",
    prompt: `CLIENT — A European rail operator.

PRODUCT — The return of a night train: board in one city in the evening, sleep, wake up in another country. Two-berth compartments, a dining car, breakfast crossing a border.

AUDIENCE — People who currently fly this route in ninety minutes for a third of the price. The night train takes eleven hours and costs more, and everyone in the audience knows this. Persuading them is not a matter of information.

POSITIONING — The flight is faster and the train is better, and the argument has to be made on ground the flight cannot contest. A flight is dead time in a queue; the sleeper converts a night that would have been spent unconscious in a hotel into the journey itself, gives you the evening in one city and the morning in another, and is a genuinely pleasurable experience rather than an ordeal to be endured. It is also roughly a twentieth of the carbon, which matters to this audience but does not close the sale on its own.

MAIN MESSAGE — Go to sleep here. Wake up there.

MANDATORY CONTENT — What the compartments are actually like, in real detail, because this is the main anxiety and the main objection. Whether you can sleep on a train, honestly. The dining car. Prices, including the comparison with flying plus a hotel night, which is the only comparison that flatters the train. Timetable. Luggage, which is a real advantage. What happens at borders. Accessibility. Booking.

CALL TO ACTION — Book a berth.

CONSTRAINTS — The romance of night trains is real but the audience is practical, and an experience that is all atmosphere and no logistics will not convert. Both have to be present, and they should not feel like two different websites. It must be honest — a sleeper is not a hotel, the bunks are narrow, and overselling it will produce bad reviews.

AVOID — Wes Anderson pastiche, which is the reflexive answer for trains and has become a cliché. Orient Express nostalgia; this is a working service, not a luxury cruise. Motion effects that induce nausea in a piece about sleeping.`,
    abilityTags: [
      "Brand Interpretation",
      "Narrative / Communication",
      "Motion Design",
      "Visual Design / Taste",
      "Audio Design",
      "Interaction Design",
      "Information Architecture",
    ],
    resultRoute: "/r/client-brand-immersive-commercial",
    status: "planned",
    blurb:
      "A night train sold on the only comparison that flatters it — an evening here, a morning there, versus a flight plus a hotel — with the logistics as carefully made as the romance.",
    direction:
      "The strategic move is refusing to fight on speed or price and reframing the comparison as train-versus-flight-plus-hotel-night, which the sleeper wins. Atmosphere alone would not convert a practical audience, so the experience has to carry compartment detail, timetables and border logistics inside the romance rather than beside it. Wes Anderson pastiche and Orient Express nostalgia are both explicitly refused.",
  },
];

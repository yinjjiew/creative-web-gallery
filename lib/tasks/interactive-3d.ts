import type { Task } from "../types";

/**
 * SETTING 2 — Interactive 3D Experiences
 *
 * Every prompt here is written so that the third dimension has a job. Where an
 * idea would read as well or better flat, it belongs in Setting 3. The
 * house style being refused throughout: a dark page, a glowing sphere, and
 * scroll wired to rotation.
 */
export const INTERACTIVE_3D: Task[] = [
  {
    id: "interactive-3d-product-showcase",
    applicationSetting: "interactive-3d",
    typicalTask: "3D Product Showcase",
    title: "Leva",
    prompt: `Create a launch experience for a manual lever espresso machine, sold to people who already make good coffee and want to make it themselves rather than have a machine decide for them.

The product's defining promise is control. On an automatic machine, a pump holds nine bars and the shot is the same every time. On this one, the person pulls a lever against a spring and their own hand shapes the pressure curve over the twenty-five seconds of extraction — a steep rise, a plateau, a long decline — and that curve is the difference between a sour shot and a sweet one. The machine's argument is that this is a skill worth having, and that the tool should be honest and repairable rather than clever.

Translate that argument into the experience of the page. The visitor should come away understanding what a pressure profile is and why anyone would want to control it by hand, having felt something of it rather than having read a paragraph about it. The object itself is beautiful — chromed brass, a wooden handle, visible engineering — and deserves to be looked at properly, from angles the visitor chooses.

This is a commercial page, so someone who arrives convinced needs a clear path to the specifications, the price, and the purchase, and someone who arrives sceptical needs enough substance to take it seriously. Keep the marketing copy sparse; let the mechanism do the arguing.

Avoid a dark showroom with a spotlit product on a turntable.`,
    abilityTags: [
      "3D / Spatial",
      "Interaction Design",
      "Visual Design / Taste",
      "Motion Design",
      "Physics / Simulation",
      "Narrative / Communication",
      "Brand Interpretation",
    ],
    resultRoute: "/r/interactive-3d-product-showcase",
    status: "complete",
    blurb:
      "A lever machine you actually pull: dragging the handle works against real spring resistance and draws the pressure curve you just made, which is also the product's whole argument.",
    direction:
      "The interaction and the sales pitch are the same gesture. Because the promise is manual control, letting the visitor pull the lever and watch their own pressure curve emerge proves the claim in a way copy cannot. Refusing headphones and the spotlit-turntable showroom; the light is a bright workshop, the palette is brass and paper.",
  },
  {
    id: "interactive-3d-explorable-world",
    applicationSetting: "interactive-3d",
    typicalTask: "Explorable 3D World",
    title: "Faro",
    prompt: `Build a small explorable world: a lighthouse and the rock it stands on, somewhere cold and Atlantic, rendered as a miniature you can turn in your hands.

The pleasure of a diorama is that it is completely knowable. Unlike an open world, a miniature invites you to learn every corner of it, and rewards attention rather than endurance. Use that. The island should be small enough to understand and dense enough that a curious person keeps finding things — a bird that only appears in certain conditions, a boat that comes and goes, a window that lights when the keeper wakes.

Time should pass, and it should matter. A lighthouse is a machine for making a specific kind of night legible, so a world containing one is not fully expressed at noon. Whatever cycle you build should change how the place feels, what is visible, and what is worth waiting for, and the visitor should have some say in it.

Navigation needs to feel good in the hand — a world that is annoying to move around in cannot be explored. Decide whether the visitor orbits it, walks it, or something else, and make that choice work properly on a laptop trackpad and on a phone.

Sound would help this enormously and must be synthesized rather than sampled from files.

Avoid the low-poly pastel island that has become a default. Let the place feel like a real weather-beaten location with a specific latitude.`,
    abilityTags: [
      "3D / Spatial",
      "Visual Design / Taste",
      "Interaction Design",
      "Motion Design",
      "Audio Design",
      "Creative Concept",
      "Robustness / Product Polish",
    ],
    resultRoute: "/r/interactive-3d-explorable-world",
    status: "planned",
    blurb:
      "A knowable miniature: one lighthouse island with a real day cycle, weather, a rotating beam that genuinely sweeps the sea, and small events that only occur at certain hours.",
    direction:
      "Choosing the miniature over the open world means quality per square metre instead of scale, which is the only honest way to make an explorable world good in a browser. Time is the second axis of exploration, so the same small island yields several different places. The refusal: low-poly pastel cuteness — this is grey, wet and specific.",
  },
  {
    id: "interactive-3d-portfolio",
    applicationSetting: "interactive-3d",
    typicalTask: "3D Portfolio",
    title: "Flat File",
    prompt: `Build a portfolio for a working graphic designer whose output is mostly printed matter — books, posters, identities, packaging — using space as the organising idea.

There is a real problem to solve here. Print work photographs badly on screens: a beautifully bound book becomes a flat rectangle in a grid of flat rectangles, and the qualities the designer cares about — weight, scale, paper, how a spread opens, how a poster reads from six feet — are exactly the qualities a thumbnail destroys. Meanwhile the standard 3D portfolio answer, work floating as planes in a void, destroys them differently.

Find a spatial metaphor that actually serves printed work, and build the portfolio inside it. The visitor should be able to browse the body of work, then look properly at any one piece — close enough to read it, and with some sense of its physical presence.

This has to function as a portfolio, not only as an experience: a person who might hire this designer needs to see what the work is, who it was for, and what the designer contributed, and they need to be able to get in touch. Someone who is impatient must be able to move fast, and someone on a phone must not be locked out.

Avoid work floating in a dark void, and avoid a cursor-lagging blurred circle.`,
    abilityTags: [
      "3D / Spatial",
      "Visual Design / Taste",
      "Layout & Typography",
      "Interaction Design",
      "Information Architecture",
      "Narrative / Communication",
    ],
    resultRoute: "/r/interactive-3d-portfolio",
    status: "planned",
    blurb:
      "Print work in an architect's plan chest: pull a drawer, lift a piece to the light table, and see it at true relative scale with paper stock and weight legible.",
    direction:
      "The plan chest is the metaphor a print designer would actually choose — it is how this work is really stored, it makes drawer-and-lift a natural navigation grammar, and it preserves the two things thumbnails destroy: relative scale between a business card and a poster, and the sense that these are objects. The void full of floating planes is the thing being refused.",
  },
  {
    id: "interactive-3d-cursor-controlled",
    applicationSetting: "interactive-3d",
    typicalTask: "Cursor-Controlled Spatial Experience",
    title: "Anamorph",
    prompt: `Build an experience in which the cursor is the viewpoint, and the viewpoint is the whole point.

Anamorphosis is the trick where a scene appears to be a meaningless scatter of parts until it is seen from one exact position, at which point it snaps into a coherent image. It is a genuinely spatial idea — it cannot exist in two dimensions, and it cannot exist without a viewer who moves — which makes it a good test of whether an interaction is really about space or is just decoration.

Build something around that. A visitor should arrive in apparent disorder, discover that moving changes how much sense it makes, and be drawn towards the resolution without being instructed. What resolves, and what it means that it resolves, is yours to decide — the payoff should feel like it was worth finding rather than like a puzzle being solved.

Cursor velocity is available to you as well as cursor position, and the difference between a slow searching movement and a fast careless one is meaningful information about what the visitor is doing.

Getting the feel right is most of this task: the camera must not be nauseating, the guidance must not be heavy-handed, and the moment of resolution has to be unmistakable when it happens. Decide what a phone visitor gets, since there is no cursor — device orientation is one option, but a considered fallback is better than a broken one.`,
    abilityTags: [
      "3D / Spatial",
      "Interaction Design",
      "Creative Concept",
      "Motion Design",
      "Visual Design / Taste",
      "Robustness / Product Polish",
    ],
    resultRoute: "/r/interactive-3d-cursor-controlled",
    status: "planned",
    blurb:
      "A scatter of suspended fragments that resolves into a legible image from exactly one viewpoint, with the cursor steering the camera and the near-miss doing the guiding.",
    direction:
      "Anamorphosis makes interaction and concept inseparable — remove the moving viewer and the piece ceases to exist, which is the strongest possible answer to 'does this need 3D'. Warmth as you approach alignment does the guiding without instructions. Cursor velocity distinguishes searching from flailing and lets the scene reward patience.",
  },
  {
    id: "interactive-3d-scroll-controlled",
    applicationSetting: "interactive-3d",
    typicalTask: "Scroll-Controlled Spatial Experience",
    title: "Core",
    prompt: `Build a scroll-driven experience where scrolling downward means descending, and depth means time.

Scroll is usually wired to the least interesting thing available — an object turns, a section fades. But scroll has one strong natural meaning that most sites throw away: down is down. Anything genuinely stacked can use scroll as a real spatial control rather than as a timeline.

Take a vertical section through deep time — a core sample, a canyon wall, a road cut, an ice core, a city's accumulated street levels — and let the visitor descend through it. The experience should convey the thing that makes stratigraphy startling, which is the sheer disproportion of geological time against human time: the top few centimetres containing everything anyone remembers, and hundreds of metres below it containing everything before that.

Handle scale honestly. If the mapping between scroll distance and depth is non-linear, be open about it rather than quietly cheating, because the distortion is part of what you are trying to communicate.

The visitor should be able to stop and read. Descent and annotation have to coexist, which is a layout problem worth solving properly rather than covering the scene in floating labels.

Avoid pinned sections that merely crossfade, and avoid a progress bar standing in for a sense of place.`,
    abilityTags: [
      "3D / Spatial",
      "Motion Design",
      "Narrative / Communication",
      "Layout & Typography",
      "Data Visualization",
      "Interaction Design",
    ],
    resultRoute: "/r/interactive-3d-scroll-controlled",
    status: "planned",
    blurb:
      "A continuous descent through a geological core where scroll is depth and depth is time, with a logarithmic scale the piece admits to and uses as its argument.",
    direction:
      "Scroll gets its one honest meaning back: down is down. The disproportion of deep time is the idea, and a logarithmic depth axis — declared openly, with the compression made visible — turns what would be a cheat into the point. Refusing pinned crossfade sections in favour of one unbroken space.",
  },
  {
    id: "interactive-3d-webcam-responsive",
    applicationSetting: "interactive-3d",
    typicalTask: "Webcam-Responsive Character / Environment",
    title: "Timid",
    prompt: `Build an experience with a creature in it that is aware of the person watching, through their camera.

Most webcam experiments treat the camera as a novelty input and the result is a filter or a puppet: you move, a thing moves, and thirty seconds later the joke is over. What makes a responsive character worth building is being watched back — having something on the other side of the screen that appears to have its own interests and its own opinion about your behaviour.

Make something with an inner life. The creature should notice presence, respond differently to a slow approach than to a sudden movement, behave differently when ignored than when stared at, and change over the course of a few minutes of acquaintance. What it is and what it wants are yours to invent, but it should be capable of something like trust, so that a patient person is rewarded with something an impatient one never sees.

Camera access is a genuine imposition and must be handled with care: ask clearly, explain why, work gracefully if refused, and be visibly honest that no video leaves the machine. All processing must be local, with no image ever sent anywhere and no third-party model or service involved.

Build a real fallback for a visitor who declines or has no camera. It should be a considered alternative experience rather than an error message.`,
    abilityTags: [
      "Multimodal Interaction",
      "3D / Spatial",
      "Interaction Design",
      "Creative Concept",
      "Motion Design",
      "Robustness / Product Polish",
      "Narrative / Communication",
    ],
    resultRoute: "/r/interactive-3d-webcam-responsive",
    status: "planned",
    blurb:
      "A shy creature that tracks where you are and how fast you moved, flinches from sudden motion, grows bolder with patience, and remembers across a session. All processing on-device.",
    direction:
      "Being watched back is the difference between a filter and a character, so the creature gets internal state — curiosity, alarm, familiarity — that the person can only move by behaving a certain way. Motion energy from frame differencing gives position and startle without shipping any ML model, which keeps it fast, private and offline. Patience is the mechanic; the impatient never see the best of it.",
  },
  {
    id: "interactive-3d-storytelling",
    applicationSetting: "interactive-3d",
    typicalTask: "3D Storytelling Experience",
    title: "Occupants",
    prompt: `Tell a story in three dimensions using one fixed viewpoint and a great deal of time.

The reflex for spatial storytelling is to move the camera through a space. Consider the opposite discipline: hold the camera perfectly still on one corner of one room, and move time instead. Sixty years of tenants pass through that corner. Furniture arrives and leaves, the wallpaper changes twice, a window is replaced, a chair stays through four occupants, the light shifts as buildings go up outside. Nothing is narrated and no character is ever seen.

Build that. The visitor should assemble the story themselves out of objects and their arrival and disappearance, which is a far more affecting way to receive it than being told. Give them control over time — the ability to move through it, stop, and go back and check something they now suspect.

This lives or dies on the writing of the objects. Every item has to be doing work: dating the period, implying an occupant, or paying off something established earlier. A room full of generically old furniture communicates nothing. Small specific things — a brand that existed only in certain years, a repair, a stain, something hidden and later found — carry the whole thing.

Restraint is the mode. No captions explaining what a visitor should feel, no music cueing sadness, no ghostly figures. The room, the objects, the light, and the years.`,
    abilityTags: [
      "Narrative / Communication",
      "3D / Spatial",
      "Creative Concept",
      "Visual Design / Taste",
      "Motion Design",
      "Interaction Design",
    ],
    resultRoute: "/r/interactive-3d-storytelling",
    status: "planned",
    blurb:
      "One corner of one room, held still from 1962 to 2024, while objects arrive and vanish and the light changes. The story is inferred entirely from what is present.",
    direction:
      "Fixing the camera and moving time inverts the usual spatial-narrative reflex and is far stronger: the visitor becomes an investigator of a scene rather than a passenger through one. Every object is written to date a period, imply an occupant, or pay off an earlier detail. No narration, no score, no ghosts — the absence of people is what makes the objects speak.",
  },
  {
    id: "interactive-3d-physics",
    applicationSetting: "interactive-3d",
    typicalTask: "Physics-Based 3D Interaction",
    title: "Mobile",
    prompt: `Build an interactive hanging mobile — a balanced kinetic sculpture in the Calder tradition — with physics good enough that it feels like a real object on a real wire.

This is a deliberately narrow task, chosen because it makes faking impossible. A mobile is a chain of nested pendulums, each arm balanced on a pivot and carrying weights or further arms. Push one leaf and the disturbance propagates up through the armature, redistributes, and comes back down transformed, and the whole thing settles over a long time in a way that is instantly recognisable. Anyone who has seen a real mobile will know within two seconds whether yours is real or a loop of keyframes.

So implement the dynamics honestly. Rotational inertia, coupling between levels, damping and the slow decay all have to emerge from the simulation rather than being animated. The visitor should be able to disturb it directly and feel that their gesture had a proportional physical consequence — a light touch and a hard shove should produce recognisably different events, and the sculpture should always come back to balance.

The sculpture itself is a design problem as much as a physics one: proportion, colour, the shapes of the leaves, the gauge of the wire, and the room it hangs in all decide whether this reads as art or as a tech demo. Calder is the reference; a plagiarised Calder is not the goal.

Silence is an acceptable choice here. If you add sound, it must be synthesized and it must be as restrained as the object.`,
    abilityTags: [
      "Physics / Simulation",
      "3D / Spatial",
      "Interaction Design",
      "Visual Design / Taste",
      "Motion Design",
      "Robustness / Product Polish",
    ],
    resultRoute: "/r/interactive-3d-physics",
    status: "planned",
    blurb:
      "A hanging mobile simulated as coupled nested pendulums: disturb any leaf and the impulse travels the armature, redistributes and decays over a minute back to balance.",
    direction:
      "The mobile is chosen precisely because everyone has an intuition for how one behaves, which makes cheating detectable and honest simulation legible. Real coupled rotational dynamics give the long, slow, complex settle that no keyframe loop reproduces. Held to gallery restraint — white wall, raking light, silence — so it reads as an object rather than a demo.",
  },
  {
    id: "interactive-3d-data-visualization",
    applicationSetting: "interactive-3d",
    typicalTask: "3D Data Visualization",
    title: "Slab",
    prompt: `Build a three-dimensional visualisation of earthquake locations beneath a subduction zone, where the third dimension is carrying real information that a flat map cannot.

Most 3D data visualisation is a mistake — a bar chart given depth it does not need, at the cost of occlusion, distorted comparison and a camera to fight. This dataset is one of the genuine exceptions, and that is why it was chosen. Plotted on a map, earthquakes near a trench are a smear of dots along a coastline. Plotted with depth, the same events reveal a coherent surface: the subducting plate itself, descending at an angle for hundreds of kilometres. The structure is invisible in two dimensions and unmistakable in three. That is the whole argument for the medium, and the visualisation should make it.

Build it so that someone can find that for themselves — arriving at a familiar-looking map, then discovering the geometry hiding under it. Depth, magnitude and time are all present in the data and all worth being able to interrogate; a viewer should be able to ask questions of it rather than only look at it.

Be rigorous about the data. State where it came from, and if any part of it is modelled rather than observed, label that plainly in the interface where a viewer will see it. Vertical exaggeration is standard practice in this field and is fine, but the factor must be disclosed. Provide a real scale, real units, and an orientation the viewer can always recover.

Legibility beats spectacle. Thousands of glowing points are easy and useless; the reader has to be able to see the slab.`,
    abilityTags: [
      "Data Visualization",
      "3D / Spatial",
      "Educational Correctness",
      "Interaction Design",
      "Information Architecture",
      "Visual Design / Taste",
    ],
    resultRoute: "/r/interactive-3d-data-visualization",
    status: "planned",
    blurb:
      "Earthquake hypocentres beneath a trench, where rotating from map view to section view makes the descending plate appear — structure that only exists in the third dimension.",
    direction:
      "This is the rare dataset where 3D is not a stylistic choice but the only way the structure appears, which is why it earns the setting. The designed moment is the rotation from map to section, when a smear of coastal dots becomes a plate. Held to real scientific-graphics discipline: stated provenance, disclosed vertical exaggeration, real units, recoverable orientation.",
  },
];

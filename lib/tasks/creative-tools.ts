import type { Task } from "../types";

/**
 * SETTING 1 — Creative Tools & Artifact Generators
 *
 * The failure mode this setting invites is the property inspector: a panel of
 * sliders bolted to a preview, where the "creative space" is the cartesian
 * product of six numbers. Each prompt below is written to make that answer
 * insufficient — the tool has to have an opinion about what it is helping
 * someone make.
 */
export const CREATIVE_TOOLS: Task[] = [
  {
    id: "creative-tools-ui-component-creator",
    applicationSetting: "creative-tools",
    typicalTask: "UI Component Creator",
    title: "Statecraft",
    prompt: `Design and build a creation environment for authoring a single interactive UI component — a button, a toggle, an input, a menu item — across every state it can occupy, not in one static pose.

The users are product designers who hand work off to engineers. Their standing complaint is that the tools they draw in can express what a component looks like at rest but have almost nothing to say about what happens between states: how a toggle travels when it flips, how an input announces that it is now invalid, how a button acknowledges a press before the network answers. That in-between is where the perceived quality of an interface actually lives, and it currently gets decided by whichever engineer implements it, from a static picture and a guess.

Build the tool that makes the transitions as editable as the states. Someone should be able to define the states a component has, move between them, shape how each move behaves, and see the component respond under a real pointer rather than in a scrubbable preview. The output has to be code a developer can paste into a project and have it behave exactly as it did in the tool — if the tool cannot honestly promise that, it has failed at its one job.

Decide for yourself what a state is, how transitions are represented and edited, and what the export looks like. The interface should feel like an instrument for a professional, not a settings dialog.`,
    abilityTags: [
      "Interaction Design",
      "Motion Design",
      "Functional Logic",
      "State & Data",
      "Export / Reusability",
      "Visual Design / Taste",
    ],
    resultRoute: "/r/creative-tools-ui-component-creator",
    status: "planned",
    blurb:
      "A component editor whose primary object is the transition between states, not the states themselves. Exports React and CSS that behave identically outside the tool.",
    direction:
      "The central move is refusing to treat states as a list of static skins. Making the edge between two states a first-class editable object — with its own duration, easing, and per-property staggering — turns a property inspector into something with an actual thesis. The cliché refused: a left rail of sliders labelled Radius, Shadow, Color.",
  },
  {
    id: "creative-tools-button-generator",
    applicationSetting: "creative-tools",
    typicalTask: "Button / Control Generator",
    title: "Actuator",
    prompt: `Build a focused tool for designing how a control feels to operate.

Almost every control generator on the web is a skin generator: it varies radius, fill, border and shadow, and calls the result a button. But when a physical control feels good — a well-damped switch, a camera shutter, the detent on a good dial — almost none of that quality is in its appearance. It is in travel, resistance, the moment of commitment, the settle afterwards, and the sound it makes while doing it.

Make a tool for authoring that. The person using it should be able to sculpt the tactile behaviour of a control and immediately feel the result by operating it with their own pointer or keyboard, then produce a coherent family of controls that share that behaviour, so a whole interface can feel like it was built by one hand. Take seriously that a control has to remain accessible and legible while it is being interesting: keyboard operation, focus, and disabled and busy states are part of the design, not an afterthought.

Sound is available to you through the Web Audio API and you should not ship recorded audio files. If you use sound, synthesize it, and make it defensible rather than decorative.

You decide what dimensions of feel are worth exposing, how they are represented, and what the exported artifact is.`,
    abilityTags: [
      "Interaction Design",
      "Motion Design",
      "Audio Design",
      "Physics / Simulation",
      "Export / Reusability",
      "Robustness / Product Polish",
    ],
    resultRoute: "/r/creative-tools-button-generator",
    status: "planned",
    blurb:
      "A control designer where the editable material is press feel — travel, resistance, overshoot, settle and synthesized click — rather than fill and radius.",
    direction:
      "Reframing the noun from 'how it looks' to 'how it actuates' creates real design space in a category that is usually a CSS toy. Spring physics gives the feel dimensions genuine coupling, so the parameters interact instead of stacking. Sound is synthesized so the click is parametric too.",
  },
  {
    id: "creative-tools-wallpaper-generator",
    applicationSetting: "creative-tools",
    typicalTask: "Wallpaper Generator",
    title: "Press",
    prompt: `Build a tool that makes wallpapers people would genuinely keep on their devices.

The bar here is unusually concrete: a wallpaper succeeds if someone sets it and does not change it back within a day. That rules out most generative output. Wallpaper has a job that fights against being interesting — it sits behind icons and windows, it has to stay legible at a glance, it is seen a hundred times a day so it cannot be exhausting, and it has to survive being cropped to a dozen aspect ratios and dimmed behind a lock screen clock.

Design a tool that understands that job rather than ignoring it. It should produce compositions with an actual visual point of view, at the true pixel dimensions of real devices, and it should reckon with where the operating system will put things on top. Export has to be real: a file at full device resolution that someone can immediately set as their wallpaper.

Choose a visual language with some conviction and commit to it — a tool that can make any image will make nothing worth keeping. Do not build a gradient picker, and do not reach for the blue-to-purple mesh that every AI wallpaper tool converges on.`,
    abilityTags: [
      "Visual Design / Taste",
      "2D Graphics",
      "Creative Concept",
      "Export / Reusability",
      "Interaction Design",
    ],
    resultRoute: "/r/creative-tools-wallpaper-generator",
    status: "planned",
    blurb:
      "A risograph-inspired wallpaper press: layered spot inks with real halftone and misregistration, composed around the icon and clock safe areas of actual devices.",
    direction:
      "Two ideas carry this. First, a committed print aesthetic — limited spot inks, halftone screens, deliberate misregistration, paper grain — because constraint is what makes generative output look designed. Second, the product insight that a wallpaper has furniture on top of it, so the tool shows the dock, menu bar and clock and composes around them.",
  },
  {
    id: "creative-tools-svg-icon-maker",
    applicationSetting: "creative-tools",
    typicalTask: "SVG / Logo / Icon Maker",
    title: "Stroke",
    prompt: `Build a lightweight creation environment for vector icons, where the unit of work is the set rather than the icon.

Drawing one good icon is not hard. The hard problem, and the one every real product hits, is that the twentieth icon has to look like it came from the same family as the first: the same grid, the same stroke weight, the same corner radius, the same terminal, the same optical density, the same decisions about when a diagonal is allowed. Teams lose this fight constantly, and the result is a toolbar that looks assembled from three different libraries.

Make a tool where consistency is structural rather than a matter of discipline — where the shared system is defined once and every icon in the set inherits it, and changing the system changes every icon at once. Someone should be able to draw a handful of icons quickly, see them together at the sizes they will actually be used, and export something a developer can drop into a codebase.

Optical correction matters and is worth thinking about: a circle and a square of the same nominal size do not look the same size, and a diagonal stroke does not read as the same weight as a vertical one. Decide how much of that your tool should handle.

You choose the drawing model, the constraint system, and the export format.`,
    abilityTags: [
      "2D Graphics",
      "Visual Design / Taste",
      "Functional Logic",
      "Export / Reusability",
      "Layout & Typography",
      "Interaction Design",
    ],
    resultRoute: "/r/creative-tools-svg-icon-maker",
    status: "planned",
    blurb:
      "An icon-set foundry on a shared grid: stroke weight, terminals, corner radius and optical scaling live in the set, so editing the system reshapes every icon at once.",
    direction:
      "Choosing the set as the unit of work turns a drawing toy into a systems tool and creates the interesting constraint — every edit is either local to an icon or global to the family, and the tool has to make that distinction legible. Snapping to a real icon grid means output is usable rather than approximate.",
  },
  {
    id: "creative-tools-poster-maker",
    applicationSetting: "creative-tools",
    typicalTask: "Poster / Social Card Maker",
    title: "Signal",
    prompt: `Build a tool for composing posters and social cards, centred on typography, layout, image treatment and export.

The audience is people who have to produce a constant stream of announcement graphics — a gig, a talk, a release, an open call — and who have taste but not time, and who are tired of everything they make looking like a template. The failure mode of every tool in this category is free-form dragging: infinite freedom, and every result slightly misaligned and slightly ugly.

Take the opposite bet. Build a tool where composition is governed by real editorial systems, so that a person choosing quickly still lands somewhere defensible, and where the interesting decisions are the ones worth making — what is the hierarchy, how is the image treated, where does the eye go, what is the one thing that must be legible from across a room.

Image handling should be genuine. Let someone bring their own picture and treat it in ways that unify it with the type rather than sitting behind it. Export must produce a real file at the pixel dimensions the person actually needs, and different destinations have genuinely different shapes, which is a layout problem and not a scaling problem.

Do not build a canvas with draggable text boxes.`,
    abilityTags: [
      "Layout & Typography",
      "Visual Design / Taste",
      "2D Graphics",
      "Export / Reusability",
      "Creative Concept",
      "Interaction Design",
    ],
    resultRoute: "/r/creative-tools-poster-maker",
    status: "planned",
    blurb:
      "A poster composer built on switchable editorial grid systems, with real image treatments — duotone, halftone, threshold — and true-resolution export per destination format.",
    direction:
      "The bet is that constraint beats freedom for this user. Composition systems as the primary control means the tool carries the taste and the user carries the content. Reflowing between destination aspect ratios through the grid rather than by scaling is the detail that separates this from a canvas editor.",
  },
  {
    id: "creative-tools-typography-playground",
    applicationSetting: "creative-tools",
    typicalTask: "Typography / Font Playground",
    title: "Kinesis",
    prompt: `Build a playground for typographic treatments that exist in time as well as space.

Variable fonts made letterforms continuously adjustable — weight, width, slant, optical size and stranger axes can all be driven as live numbers. Almost nobody uses this for anything beyond a responsive headline, and the web is poorer for it. Meanwhile kinetic typography, the actual craft of type in motion, mostly lives in video tools and never reaches the browser, where it could respond to a reader.

Make a tool for composing typographic treatments where motion and letterform are the same material. Someone should be able to write a line of text, shape how it behaves over time or in response to a reader, and get something out that they could put on a real site.

Whatever you build has to be legible about what it is doing — a treatment nobody can reason about cannot be reused. And it has to export to something that runs on a real page without the tool present.

The trap to avoid is a row of sliders bound to font-variation-settings with a live preview above it. That is a font inspector, not a playground.`,
    abilityTags: [
      "Layout & Typography",
      "Motion Design",
      "Visual Design / Taste",
      "Interaction Design",
      "Export / Reusability",
      "Creative Concept",
    ],
    resultRoute: "/r/creative-tools-typography-playground",
    status: "planned",
    blurb:
      "A kinetic type composer where variable-font axes are driven per character by editable curves over time, cursor proximity or scroll, exporting runnable CSS and Web Animations code.",
    direction:
      "Treating an axis value as a function rather than a number is the whole idea — once the input can be time, pointer distance or scroll progress, the design space explodes while staying reasonable. Per-character offset along that function produces the wave behaviour that makes kinetic type feel alive, from one honest mechanism rather than a pile of presets.",
  },
  {
    id: "creative-tools-shader-generator",
    applicationSetting: "creative-tools",
    typicalTask: "Shader / Material Generator",
    title: "Substrate",
    prompt: `Build a visual tool that makes authoring procedural materials approachable to people who cannot write shader code.

Procedural material authoring is one of the highest-leverage skills in computer graphics and one of the least accessible. The professional tools are node graphs, which are powerful and genuinely hard: a beginner faces an empty canvas, a library of a hundred nodes, and no idea which three of them make something that looks like brushed metal. Writing the equivalent by hand means knowing GLSL.

Find a model of composition that a designer can already reason about, and build a real material authoring tool on top of it. It has to run on the GPU and produce actual shader code — a canvas-filter approximation is not a material generator, and the artifact someone leaves with should be usable in their own project.

The tool should reward exploration. Someone who does not know what they want should be able to arrive somewhere good, and someone who does should be able to get there directly. Both of those are design problems, not feature lists.

Do not produce yet another dark page with a glowing sphere on it.`,
    abilityTags: [
      "2D Graphics",
      "Visual Design / Taste",
      "Functional Logic",
      "Export / Reusability",
      "Interaction Design",
      "Robustness / Product Polish",
    ],
    resultRoute: "/r/creative-tools-shader-generator",
    status: "planned",
    blurb:
      "Procedural materials as a stack of blended layers rather than a node graph, compiled live to real GLSL on the GPU, with the generated shader source as the export.",
    direction:
      "Borrowing the layer stack from image editors is the accessibility move: designers already know opacity, blend modes and clipping, so the mental model arrives for free while the underlying compositing stays mathematically honest. Compiling the stack to readable GLSL keeps the promise that the output is real and portable.",
  },
  {
    id: "creative-tools-cursor-theme-creator",
    applicationSetting: "creative-tools",
    typicalTask: "Cursor / Interaction Theme Creator",
    title: "Pointer",
    prompt: `Build a tool for designing a site's entire pointer behaviour as one coherent system, and exporting it as something droppable into a real project.

Custom cursors are having a moment and most of them are bad. A blurred circle lagging behind the mouse has become the house style of the portfolio web, and it is applied identically to a law firm and a techno label. The reason it fails is that it is a decoration rather than a system: it says nothing about the site, it does not know what it is hovering, and it frequently makes the page harder to use.

Treat pointer behaviour as a design surface with rules. A pointer moves, it has weight, it crosses different kinds of targets, it presses, it drags, it enters text, it waits. Those are states and relationships, and a good pointer system has a considered answer for each of them, appropriate to the site it belongs to.

Preview it against something that resembles a real page — text to select, links to hover, an image to drag, a form field to enter — because a pointer system can only be judged against content. Accessibility is not optional here: a custom pointer must not degrade keyboard use, must not hide the caret in text, and must respect a reduced-motion preference.

The export should be self-contained and framework-agnostic.`,
    abilityTags: [
      "Interaction Design",
      "Motion Design",
      "Physics / Simulation",
      "Export / Reusability",
      "Robustness / Product Polish",
      "Visual Design / Taste",
    ],
    resultRoute: "/r/creative-tools-cursor-theme-creator",
    status: "planned",
    blurb:
      "A pointer-system designer covering shape, inertia, target magnetism, press and drag states, previewed against a realistic page and exported as dependency-free JS and CSS.",
    direction:
      "Framing the artifact as a system with per-target-type rules, rather than a cursor graphic, is what makes this a tool instead of a novelty. Previewing against real content is the honest test and forces the accessibility questions into view early. The lagging blurred circle is present only as the thing the tool lets you outgrow.",
  },
];

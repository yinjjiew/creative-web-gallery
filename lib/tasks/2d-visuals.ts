import type { Task } from "../types";

/**
 * SETTING 3 — 2D Visuals & Toys
 *
 * Nothing here is exported and nothing is completed; the experience under the
 * hand is the deliverable. Which means the entire quality of a result lives in
 * its feedback loop — latency, proportionality, and whether the thing behaves
 * like a material rather than like a parameter.
 *
 * Each of these is built on one honest simulation rather than a pile of
 * effects, because "creative visual" does not mean particles everywhere.
 */
export const TWO_D_VISUALS: Task[] = [
  {
    id: "2d-visuals-generative-art",
    applicationSetting: "2d-visuals",
    typicalTask: "Generative Art",
    title: "Growth",
    prompt: `Make a generative artwork built on a growth process, in the tradition of pen-plotter drawing.

Generative art divides sharply into work driven by a system and work driven by noise. Layered Perlin noise with a nice palette will always produce something acceptable and never produce something surprising, because there is no process — nothing accumulates, nothing competes for space, nothing has a history. The pieces that stay interesting are the ones running an actual process whose outcome the author could not have predicted in detail.

Build one of those. Something should grow, respond to its own past, and run out of room. The plotter discipline is a useful constraint to accept: no fills, no blur, no glow, no gradients — a single pen, a line of constant weight, and the entire tonal range produced by density alone. That constraint is what makes this class of work look like drawing rather than like rendering.

A generative piece needs to be watchable and it needs to end. Growth in progress is much of the pleasure, so the pacing of the process is a design decision, and the finished state has to be a composition rather than a saturated field where the process ran until nothing moved.

The visitor should have some genuine influence — enough to feel implicated in the result, not so much that the process stops being the author.

Do not add colour to make it prettier. If the line is not good enough in black, more hues will not fix it.`,
    abilityTags: [
      "2D Graphics",
      "Creative Concept",
      "Visual Design / Taste",
      "Functional Logic",
      "Motion Design",
      "Interaction Design",
    ],
    resultRoute: "/r/2d-visuals-generative-art",
    status: "complete",
    blurb:
      "Differential line growth: one closed curve that lengthens, resists itself and folds into coral-like convolution, drawn as a single plotter pen with tone made only of density.",
    direction:
      "A real process rather than layered noise — the curve's future depends on its own accumulated history, so the result is genuinely unpredictable. The single-pen plotter constraint forces tone to come from density, which is what makes generative output read as drawing instead of rendering. Colour and glow are refused outright.",
  },
  {
    id: "2d-visuals-particle-playground",
    applicationSetting: "2d-visuals",
    typicalTask: "Particle Playground",
    title: "Filings",
    prompt: `Build a particle playground in which every particle is doing real physics and the point of the particles is to reveal something invisible.

"Meaningless particles" is the single most common failure in creative coding: ten thousand dots drifting behind a headline, signifying nothing. The corrective is not fewer particles but particles that are measuring something. Iron filings scattered on paper over a magnet are the canonical example — the particles are not decoration, they are an instrument, and the pattern they form is a genuine visualisation of a field that was already there.

Build a playground on that principle. The visitor should be able to change the field and watch the particles report the change, and the relationship between what they did and what they see should be legible enough that they start forming intuitions and testing them.

Get the physics right, because the whole value proposition is that this is real. Field superposition, the way lines crowd where the field is strong, the behaviour between like and unlike poles, and the way filings align to direction while also being drawn along gradients are all things a physicist would check, and a viewer will feel even if they cannot name them.

Visually, this belongs to the tradition of scientific plates rather than to the tradition of screensavers: paper, iron, ink, near-monochrome. Restraint will make it look more impressive, not less.

Performance matters. Tens of thousands of particles at a steady frame rate is part of the task, so choose your rendering approach accordingly.`,
    abilityTags: [
      "Physics / Simulation",
      "2D Graphics",
      "Interaction Design",
      "Visual Design / Taste",
      "Educational Correctness",
      "Robustness / Product Polish",
    ],
    resultRoute: "/r/2d-visuals-particle-playground",
    status: "complete",
    blurb:
      "Iron filings on paper over magnets you can drag: tens of thousands of particles doing honest field superposition, drawing real field lines that crowd where the field is strong.",
    direction:
      "Giving the particles a job — being an instrument that images an invisible field — is the direct answer to meaningless particles. Every dot is measuring something, so density and alignment carry real information. The visual register is the nineteenth-century scientific plate: iron, paper, ink, no glow, which reads as far more assured than a screensaver.",
  },
  {
    id: "2d-visuals-interactive-typography",
    applicationSetting: "2d-visuals",
    typicalTask: "Interactive Typography",
    title: "Deboss",
    prompt: `Make a piece about type as a physical impression, where the reader's movement is the only light in the room.

Before type was an image on a screen it was a deformation of a surface — metal driven into damp paper, leaving an edge you could feel with a thumb and see only when light came across it at an angle. That is a real and mostly lost quality of typography, and it happens to be a genuinely interactive one, because an impression is invisible under flat light and legible under raking light. It cannot be photographed well. It has to be moved past.

Build that. The surface holds an impression; the visitor's pointer is the light; reading requires moving. The relationship between where the light is and what becomes legible should be physically plausible, so that the whole thing feels like a surface rather than an effect.

Choose a text worth the treatment. This mechanic makes reading effortful, and a reader will only accept effort for something that rewards it — something short, something that gains from being uncovered a phrase at a time rather than presented whole.

The paper is as much of the task as the type: fibre, deckle, tooth, the slight cockle around a heavy impression, and the way ink sits differently in a valley than on a plateau.

There must be a way for someone to simply read the text — a reduced-motion preference, a keyboard-only visitor, or a person who does not want to play a game to read a poem all need to be served.`,
    abilityTags: [
      "Layout & Typography",
      "2D Graphics",
      "Interaction Design",
      "Visual Design / Taste",
      "Creative Concept",
      "Robustness / Product Polish",
    ],
    resultRoute: "/r/2d-visuals-interactive-typography",
    status: "complete",
    blurb:
      "A letterpress impression in cotton paper, invisible under flat light and legible only under the raking light of your cursor. Reading it means moving across the page.",
    direction:
      "Recovering the pre-screen fact that type was a dent in a surface yields an interaction that is inseparable from the subject: an impression genuinely cannot be read without moving light. Real normal-mapped relief lighting makes it feel like a surface rather than a shader trick. An always-available plain reading mode keeps the conceit from becoming a toll gate.",
  },
  {
    id: "2d-visuals-drawing-toy",
    applicationSetting: "2d-visuals",
    typicalTask: "Generative Drawing Toy",
    title: "Bleed",
    prompt: `Build a drawing toy whose medium has a mind of its own.

Digital brushes are almost always obedient: the mark ends where the gesture ends, and the result is exactly what was drawn. Real wet media are not like that. Ink on damp paper keeps moving after the brush lifts — it wicks along fibres, pools where the paper is already wet, blooms when it meets water, dries at the edges into a darker rim, and refuses to be fully controlled. Painters spend years learning to collaborate with that rather than fight it, and the collaboration is the pleasure.

Make a toy where the medium behaves that way. The visitor's gesture should be an input to a process rather than a specification of a result, and the difference between a fast dry stroke and a slow loaded one should be enormous. Speed, dwell time and overlap are all information you can use.

For this to be satisfying it has to be genuinely responsive — the ink must start moving immediately and keep moving, which is a real-time simulation problem and should be solved on the GPU.

Whatever process you implement, be faithful to it rather than approximating the look with blur. Diffusion, absorption, evaporation and the concentration of pigment at a drying edge produce behaviour that is unmistakable when correct and unconvincing when faked.

The paper deserves as much attention as the ink. Its texture is what the ink is negotiating with.`,
    abilityTags: [
      "2D Graphics",
      "Physics / Simulation",
      "Interaction Design",
      "Visual Design / Taste",
      "Motion Design",
      "Creative Concept",
    ],
    resultRoute: "/r/2d-visuals-drawing-toy",
    status: "complete",
    blurb:
      "Sumi ink on damp paper, simulated on the GPU: strokes wick into fibre, bloom where the sheet is already wet, and dry into a darker rim minutes after the gesture ended.",
    direction:
      "The medium as collaborator rather than servant is the idea — the gesture is an input to a process, not a description of the mark, so the toy stays interesting after a hundred strokes. Real diffusion and absorption with pigment concentrating at a drying edge produces the one detail that instantly separates simulated wet media from blur.",
  },
  {
    id: "2d-visuals-cursor-reactive",
    applicationSetting: "2d-visuals",
    typicalTask: "Cursor-Reactive Artwork",
    title: "Moiré",
    prompt: `Build a cursor-reactive artwork out of interference between two simple things.

Moiré is one of the great free lunches in visual perception. Two plain grids, each individually boring, overlaid at a slight offset, produce enormous slow-moving figures that exist in neither layer — patterns dramatically more complex than their causes, and exquisitely sensitive to relative position. A displacement of one pixel can transform the entire image. That sensitivity is precisely what makes it a superb subject for cursor control: tiny movements produce large consequences, which is the most satisfying possible input-to-output ratio.

Build a piece on that phenomenon. The visitor's movement should govern the relationship between layers, and the reward is discovering how narrow and how live the interesting regions are — how the pattern breathes, inverts, and briefly resolves into something that looks intentional.

Be rigorous about the rendering. Moiré is an aliasing phenomenon, which means naive drawing produces the wrong pattern — you will be fighting your own sampling, and getting genuine interference rather than rendering artefacts is the technical core of this task.

Stay monochrome. This effect is strongest in pure black and white, and colour will make it look like a screensaver.

The piece should also be beautiful when nobody is touching it. A resting state that invites a first movement is part of the composition.`,
    abilityTags: [
      "2D Graphics",
      "Interaction Design",
      "Visual Design / Taste",
      "Creative Concept",
      "Motion Design",
      "Robustness / Product Polish",
    ],
    resultRoute: "/r/2d-visuals-cursor-reactive",
    status: "complete",
    blurb:
      "Two line grids in near-alignment, their offset driven by the cursor. Sub-pixel movements swing vast interference figures that exist in neither layer.",
    direction:
      "Moiré gives the best sensitivity-to-effort ratio in visual perception: one pixel of movement reorganises the entire field, which makes cursor control feel enormously consequential. The technical crux is honest supersampling — naive rasterisation produces aliasing that masquerades as the effect. Strict monochrome, because colour would cheapen it immediately.",
  },
  {
    id: "2d-visuals-soft-body",
    applicationSetting: "2d-visuals",
    typicalTask: "Fluid / Soft-Body / Physical Simulation",
    title: "Drape",
    prompt: `Build an interactive length of cloth that behaves like cloth.

Fabric is one of the hardest things to fake and one of the easiest for anyone to judge. Everybody has handled cloth, so everybody knows how it should fall: how a fold forms and then travels, how a pinned corner changes the whole hang, how a diagonal pull propagates differently from a straight one, how the material resists stretching almost completely while offering no resistance at all to bending, and how a heavy silk moves differently from a light cotton.

Build the real thing. The visitor should be able to grab it, drag it, let it fall, pin it, release it, and possibly cut it, and every one of those should produce the consequence they expect. The simulation must be stable — a cloth that explodes or slowly stretches into noodles fails the task no matter how good it looks in the first three seconds.

Shading is not a separate concern from the physics here. Cloth is legible almost entirely through how light behaves in its folds, so the appearance of the material and the correctness of the geometry stand or fall together.

Make a considered choice about the fabric and the setting, and let the whole piece be about that specific material rather than about a generic grid of springs.

Touch has to work as well as the pointer. Dragging fabric is exactly the gesture a phone is good at.`,
    abilityTags: [
      "Physics / Simulation",
      "2D Graphics",
      "Interaction Design",
      "Visual Design / Taste",
      "Motion Design",
      "Robustness / Product Polish",
    ],
    resultRoute: "/r/2d-visuals-soft-body",
    status: "complete",
    blurb:
      "A hanging length of heavy silk on a constraint-solved mass-spring mesh: grab it, pin it, cut it. Folds form, travel and settle, with light in the folds doing the describing.",
    direction:
      "Cloth is chosen because universal tactile familiarity makes it unfakeable — everyone knows how silk falls. Position-based constraint solving gives the near-inextensible, freely-bending behaviour real fabric has, and stability under abuse is treated as a requirement rather than a nicety. Shading and geometry are developed together, since folds are only legible through light.",
  },
  {
    id: "2d-visuals-audio-reactive",
    applicationSetting: "2d-visuals",
    typicalTask: "Audio-Reactive Visual",
    title: "Formant",
    prompt: `Build an audio-reactive visual driven by the human voice, which shows the singer something true about the sound they are making.

The music visualiser is a solved and exhausted form: amplitude drives scale, bass drives colour, and the result is decorative rather than informative — it responds to loudness while remaining indifferent to what is actually in the sound. Meanwhile the voice is extraordinarily rich, and almost none of that richness is visible to the person producing it.

Take a real property of vocal sound and make it visible. Vowels, for instance, are distinguished not by pitch but by the resonances of the vocal tract, which is why a vowel is recognisable whether sung high or low, and why sliding continuously between two vowels traces a continuous path through a space that has been mapped and named for a century. There is genuine structure here worth revealing, and a person exploring it with their own voice will discover things about their own speech.

Whatever property you choose, extract it honestly with real signal processing. The visual must be driven by an actual measurement, and the mapping should be stable enough that the same sound reliably produces the same image — a visitor has to be able to form a hypothesis and test it.

Microphone access is an imposition and needs the same care as a camera: ask plainly, process entirely on the device, send nothing anywhere, and provide a real experience for someone who declines or has no microphone.

Latency is the whole game. A voice visual that lags is not a mirror, it is a recording.`,
    abilityTags: [
      "Multimodal Interaction",
      "Audio Design",
      "2D Graphics",
      "Data Visualization",
      "Educational Correctness",
      "Interaction Design",
      "Robustness / Product Polish",
    ],
    resultRoute: "/r/2d-visuals-audio-reactive",
    status: "complete",
    blurb:
      "Sing a vowel and watch it land in real formant space: honest LPC analysis maps your vocal tract's resonances, so sliding between vowels draws a continuous path you can see.",
    direction:
      "Rejecting amplitude-driven decoration for an actual measurement means the visual teaches the singer something about their own voice. Real formant estimation makes the mapping stable enough to form and test hypotheses, which is what turns a visualiser into an instrument. Latency is treated as the primary quality metric, because a delayed mirror is just a recording.",
  },
  {
    id: "2d-visuals-image-transformation",
    applicationSetting: "2d-visuals",
    typicalTask: "Interactive Image Transformation",
    title: "Loom",
    prompt: `Build something that takes a photograph the visitor brings and reconstructs it in another material entirely.

The filter is a dead form. Adjusting the colour of a photograph does not transform it, and a gallery of named filters is a menu rather than an idea. The interesting version of this task is translation into a medium with its own logic and its own constraints — where the source image has to be genuinely reinterpreted, and where the constraints of the destination material are what make the result beautiful.

Weaving is one such medium. A woven image cannot have arbitrary colour: it has a warp and a weft of specific threads, and every pixel of the result is one or the other showing through, according to a binary structure that repeats. That is a brutal constraint, and it is exactly why woven portraits look the way they do. Translating a photograph into it is a real problem with real decisions — thread palette, weave structure, sett, how tone gets rendered when you cannot mix colours.

Whatever material you choose, be faithful to its physics. The result should look like the material at a glance and survive close inspection, where individual threads, stitches, dots or strokes become visible and are individually correct.

The visitor should be able to explore the translation, not just receive it, and should be able to zoom in far enough to see the structure that is doing the work.

Handle an uploaded image responsibly: everything stays on the device, nothing is transmitted, and a visitor who does not want to upload anything should still have something good to look at.`,
    abilityTags: [
      "2D Graphics",
      "Visual Design / Taste",
      "Functional Logic",
      "Creative Concept",
      "Interaction Design",
      "Robustness / Product Polish",
    ],
    resultRoute: "/r/2d-visuals-image-transformation",
    status: "complete",
    blurb:
      "Your photograph rewoven as cloth: real weave structures and a limited yarn palette resolve tone through interlacing alone, and zooming in shows individually correct threads.",
    direction:
      "Translation into a material with its own logic replaces the dead filter form — the destination's constraints are what make the output beautiful. Weaving's binary warp-or-weft rule is genuinely brutal, so rendering a photograph's tone through interlacing and a limited yarn palette is a real problem. It has to survive zooming to the individual thread, which is the honesty test.",
  },
];

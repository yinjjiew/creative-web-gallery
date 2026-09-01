import type { Task } from "../types";

/**
 * SETTING 7 — Educational Apps
 *
 * The pattern every prompt here is written to demand:
 *
 *   learner manipulates X → system changes Y → learner sees the relationship
 *   → learner builds intuition
 *
 * Correct prose inside a pleasant interface is a document, not an educational
 * app. And since a beautiful explanation of something false is worse than no
 * explanation, conceptual correctness is a hard constraint in all eight — every
 * subject below was chosen partly because it is checkable.
 */
export const EDUCATIONAL: Task[] = [
  {
    id: "educational-concept-explanation",
    applicationSetting: "educational",
    typicalTask: "Interactive Concept Explanation",
    title: "Reversal",
    prompt: `Build an interactive explanation of Simpson's paradox.

The paradox is that a trend can appear in every subgroup of a population and disappear or reverse when the groups are combined. A treatment can be better for men and better for women and worse overall. A university can admit a higher proportion of women in every single department and a lower proportion of women overall. These are not errors or tricks; they are arithmetically ordinary, and they are genuinely disturbing the first time you meet one, because they threaten the basic assumption that aggregate numbers mean what they appear to mean.

This is close to the ideal subject for an interactive explanation, because the reason it stops being paradoxical is fundamentally visual — once you see where the group sizes are, the whole thing becomes obvious and stays obvious. Prose descriptions of it are notoriously hard to follow, and readers routinely finish an article able to define the paradox and still unable to see it.

Build the thing that makes it click, and make sure the learner is the one doing the work. Someone should be able to move the underlying quantities and watch a reversal appear and disappear under their own hands, until they can predict when it will happen before it does.

Use at least one real historical case, cited properly, because the paradox's importance rests on it being consequential rather than a curiosity.

Then handle the part that most explanations skip, which is also the part that matters: knowing that aggregation can mislead is useless without knowing what to do about it. Which number is the right one to act on depends on the causal structure behind the data, and it is genuinely not always the disaggregated one.

Be rigorous. Every number must be arithmetically correct, and it must be possible to check them.`,
    abilityTags: [
      "Educational Correctness",
      "Data Visualization",
      "Interaction Design",
      "Narrative / Communication",
      "Layout & Typography",
      "Visual Design / Taste",
    ],
    resultRoute: "/r/educational-concept-explanation",
    status: "complete",
    blurb:
      "Simpson's paradox made visible: drag the group sizes and watch a trend reverse under your own hands, with a real cited case and the question of which number to act on.",
    direction:
      "The paradox stops being paradoxical for visual rather than verbal reasons, which is exactly why prose explanations fail and why an interactive is the right medium. Letting the learner produce and destroy the reversal themselves is what converts a definition into intuition. Going on to the causal question — which number should you act on — is the part most explainers omit and the only part that is actionable.",
  },
  {
    id: "educational-science-simulation",
    applicationSetting: "educational",
    typicalTask: "Math / Science Simulation",
    title: "Orbit",
    prompt: `Build a simulation that teaches orbital mechanics through the specific counterintuitive fact that to catch up with something ahead of you in orbit, you have to slow down.

This is one of the best learning payoffs in physics. Everyday intuition about chasing things is completely wrong in orbit, and the correct behaviour is so unintuitive that it had to be worked out and trained. Thrusting towards a target ahead of you raises your orbit, which lengthens your period, which makes you arrive later; braking drops you into a lower, faster orbit, and you come round and catch it. Nobody arrives at this by reasoning about it verbally, and almost everybody arrives at it quickly by trying it.

That makes it near-perfect for simulation. Build one where a learner attempts a rendezvous, fails in the way everyone fails, and discovers the actual rule by experiment.

The physics must be right. Real gravitation, real conservation of energy and angular momentum, and an integrator stable enough that orbits do not decay from numerical error over a long session — a simulation that quietly cheats teaches something false, which is worse than teaching nothing.

Support the discovery with the right instruments. Orbital insight comes largely from seeing the relationship between altitude, speed and period simultaneously, which is a visualisation problem worth solving carefully.

Scaffold it. A learner dropped into an unconstrained orbital sandbox will flail; a sequence that isolates one idea at a time will get them to the payoff and then let them play.

Use real units and real orbits, so that a learner who later reads about actual spaceflight recognises the numbers.

Avoid presenting this as a game with a score. The reward here is comprehension, and a scoreboard would compete with it.`,
    abilityTags: [
      "Educational Correctness",
      "Physics / Simulation",
      "Interaction Design",
      "Data Visualization",
      "Functional Logic",
      "Visual Design / Taste",
    ],
    resultRoute: "/r/educational-science-simulation",
    status: "complete",
    blurb:
      "A rendezvous simulator built around orbital mechanics' best paradox: thrust toward your target and you fall behind. Learners fail the intuitive way, then find the real rule.",
    direction:
      "The subject is chosen for having a payoff nobody reaches by verbal reasoning and almost everybody reaches by experiment, which is the strongest possible argument for simulation over prose. Failing in the universal way first is the designed experience, not a flaw. Physical rigour is non-negotiable — an integrator that lets orbits decay would teach something false — and no score competes with comprehension.",
  },
  {
    id: "educational-historical-exploration",
    applicationSetting: "educational",
    typicalTask: "Historical / Geographical Exploration",
    title: "Broad Street",
    prompt: `Build an exploration of the 1854 Broad Street cholera outbreak, in which the learner conducts the investigation rather than reading about it.

This episode is usually told as a tidy story: John Snow mapped the deaths, saw them cluster around a pump, had the handle removed, and epidemiology was born. The tidy version is both slightly wrong and much less interesting than what happened, and it wastes the best thing about the case, which is that it is a genuine piece of reasoning under uncertainty that a learner can actually perform.

Build the investigation. The learner should have access to what Snow had — where the deaths were, where the pumps were, who lived where — and should have to work out what is going on. The insight is spatial, so the geography has to be real enough to reason over.

The apparent anomalies are the most valuable part and must be included. The workhouse in the middle of the outbreak with almost no deaths, which had its own well. The brewery whose workers were unaffected, who drank beer. The widow in Hampstead who died miles away because she had water delivered from Broad Street because she preferred the taste. Each of these looks like a refutation and is in fact the strongest confirmation, and a learner who works that out has learned something about evidence that no lecture conveys.

Be historically honest, which means including the parts that spoil the myth: the outbreak was already declining when the handle was removed, Snow did not convince the establishment, and the miasma theory he was arguing against was held by serious people for reasons that were not stupid.

Cite real sources and distinguish clearly between the historical record, scholarly interpretation, and anything you have simplified.

Do not build a guided tour with hotspots. The learner has to be able to be wrong.`,
    abilityTags: [
      "Educational Correctness",
      "Narrative / Communication",
      "Data Visualization",
      "Information Architecture",
      "Interaction Design",
      "Visual Design / Taste",
    ],
    resultRoute: "/r/educational-historical-exploration",
    status: "complete",
    blurb:
      "Conduct Snow's 1854 investigation yourself on the real geography, including the anomalies — the brewery, the workhouse, the widow in Hampstead — that look like refutations.",
    direction:
      "The tidy handle-removal story wastes the case's real value, which is that it is a performable piece of reasoning under uncertainty. The anomalies are the centre of the design rather than trivia, because working out why an apparent refutation is actually confirmation teaches something about evidence that no lecture does. Historical honesty includes the myth-spoiling facts, and the learner must be able to be wrong.",
  },
  {
    id: "educational-algorithm-visualizer",
    applicationSetting: "educational",
    typicalTask: "Coding / Algorithm Visualizer",
    title: "Backtrack",
    prompt: `Build a visualiser for how a backtracking regular expression engine actually executes, so that a programmer can see why some patterns are instantaneous and some hang forever.

Algorithm visualisers overwhelmingly cover sorting, and sorting is a poor subject: everybody already has an intuition for putting things in order, the animations are decorative rather than explanatory, and nobody has ever been saved from a production incident by having watched bubble sort. Regular expression backtracking is the opposite on every count. Almost every working programmer uses regular expressions, almost none can predict their performance, the failure mode is spectacular and real — a pattern that runs in microseconds on one input and for longer than the universe has existed on another, slightly longer one — and it is a live source of denial-of-service vulnerabilities.

The reason it is invisible is that the engine's control flow is hidden. Make it visible. A learner should be able to bring their own pattern and their own input, watch the engine attempt, fail, back up and try again, and see the exact structure of the combinatorial explosion when one occurs.

The model must be faithful to how real backtracking engines behave, since the practical value depends entirely on the learner's new intuitions transferring to their actual work. Where you simplify, say so.

Then take the learner somewhere useful: what makes a pattern dangerous, how to recognise the shape of it, how to fix it, and why some engines are immune. Nested quantifiers over overlapping alternations are the classic hazard and deserve to be understood rather than memorised.

Design for the scale honestly. A catastrophic case has more steps than can be shown one at a time, and finding a way to make an astronomically large search legible is the real design problem here.`,
    abilityTags: [
      "Educational Correctness",
      "Data Visualization",
      "Functional Logic",
      "Interaction Design",
      "Information Architecture",
      "Visual Design / Taste",
    ],
    resultRoute: "/r/educational-algorithm-visualizer",
    status: "complete",
    blurb:
      "Watch a real backtracking regex engine try, fail and back up on your own pattern — and see the exact shape of the explosion that turns microseconds into centuries.",
    direction:
      "Sorting visualisers are chosen because they animate well, not because anyone needs them; catastrophic backtracking is the inverse — universally used, universally mispredicted, and a live security bug class. The hidden thing being revealed is control flow, which is genuinely invisible today. The real design problem is making an astronomically large search legible without stepping through it, which is where the work goes.",
  },
  {
    id: "educational-language-learning",
    applicationSetting: "educational",
    typicalTask: "Language-Learning Interaction",
    title: "Tone",
    prompt: `Build an interaction for learning Mandarin tones, using the learner's own voice.

Tones are the single largest obstacle for adult learners from non-tonal languages, and mainstream language apps handle them badly. They teach the tones as four names with four arrows, test recognition with multiple choice, and provide essentially no feedback on production — so learners can pass every exercise and still be unintelligible, because their second tone is flat and nobody has ever told them.

The specific problem is that tone is a pitch contour, learners cannot hear their own pitch reliably, and without external feedback they cannot correct. This is exactly the kind of gap a browser can close, since the microphone and real-time pitch analysis make the invisible thing visible immediately.

Build it. A learner should hear a target, produce it, and see their own contour against the target closely enough to know what to fix — not a score, but the actual shape of what they did.

Be linguistically correct, and correct in ways that go beyond the four arrows. Tone in connected speech is not tone in isolation: the third tone changes when followed by another third tone, the neutral tone exists, and a learner drilling isolated syllables will be surprised by real sentences. What matters is relative contour rather than absolute pitch, which means a low-voiced and a high-voiced learner should both be able to succeed.

Feedback has to be actionable. "Seventy-two percent" teaches nothing; "your second tone starts too high and stops rising too early" is a thing a learner can act on.

Handle the microphone honestly: ask clearly, process everything on the device, transmit nothing, and give a genuine alternative to anyone who declines. Recording your own voice is intimidating, and the design should be aware of that.`,
    abilityTags: [
      "Educational Correctness",
      "Multimodal Interaction",
      "Audio Design",
      "Data Visualization",
      "Interaction Design",
      "Robustness / Product Polish",
    ],
    resultRoute: "/r/educational-language-learning",
    status: "planned",
    blurb:
      "Say it and see it: real-time pitch tracking draws your tone contour against the target, with feedback that names what to fix rather than scoring you out of a hundred.",
    direction:
      "The gap is specific and well-documented — learners cannot hear their own pitch, so production never corrects itself while recognition exercises quietly pass them. Real-time pitch extraction closes exactly that loop, which is something a browser can do and a flashcard cannot. Feedback names the error instead of scoring it, and relative contour rather than absolute pitch keeps it correct for any voice.",
  },
  {
    id: "educational-interactive-textbook",
    applicationSetting: "educational",
    typicalTask: "Interactive Textbook / Explainer",
    title: "Arch",
    prompt: `Write and build one chapter of an interactive textbook, on why arches stand up.

This is a longer form than a single explainer and has different problems. A chapter has to sustain attention over a substantial reading, build ideas in a genuine sequence where each depends on the last, and integrate several interactive figures into continuous prose without either the text becoming captions or the figures becoming decoration. Doing that well is a distinct skill from making one good interactive.

The subject rewards it. An arch is a structure that cannot work in tension, made of pieces that are not attached to each other, and it stands for a thousand years — which is genuinely surprising once stated plainly. Getting from that to a real understanding requires a chain: how a shape determines where forces go, why the catenary is special, what the thrust line is, why an arch pushes outwards and what has to resist that, why an arch fails by hinging rather than crushing, and why a chain hanging from two points quietly solves the whole problem. Every one of those is manipulable, and each one is genuinely illuminated by being manipulable.

The engineering must be correct. Real statics, real force resolution, and correct thrust-line behaviour — a figure that looks right and is wrong is worse than a photograph, because a learner will believe it.

The prose is half of this task and should be written properly, with the confidence to be plain. Hanging a chain and observing that the arch is its mirror image is one of the loveliest facts in engineering, and it deserves prose that can carry it.

Take reading seriously: measure, hierarchy, figure placement, and the fact that someone may spend twenty minutes here.

Avoid a page of embedded widgets with paragraphs between them. The chapter is the unit, not the widget.`,
    abilityTags: [
      "Educational Correctness",
      "Layout & Typography",
      "Narrative / Communication",
      "Physics / Simulation",
      "Interaction Design",
      "Information Architecture",
      "Data Visualization",
    ],
    resultRoute: "/r/educational-interactive-textbook",
    status: "planned",
    blurb:
      "A full chapter on why arches stand: manipulable statics figures woven into real prose, ending where it should — a hanging chain, inverted, solving the whole problem.",
    direction:
      "The chapter rather than the widget is the unit, which makes the hard problem integration: figures inside continuous prose without the text degrading into captions. The subject supports a genuine dependency chain, so each interactive earns its place by illuminating one link. Correct statics is mandatory because a plausible wrong figure is worse than a photograph — the learner will believe it.",
  },
  {
    id: "educational-quiz",
    applicationSetting: "educational",
    typicalTask: "Quiz with Meaningful Feedback",
    title: "Naive Physics",
    prompt: `Build a quiz about force and motion whose feedback diagnoses the specific wrong belief behind each wrong answer.

Ordinary quizzes are nearly worthless for learning. They mark an answer right or wrong, show a score, and leave the learner exactly as they were, because a wrong answer is treated as an absence of knowledge rather than as evidence of a particular incorrect theory. In physics education this is a well-studied problem with a well-studied solution: adult learners hold consistent, predictable, wrong physical theories, and the productive move is to identify which one a learner holds and then confront it directly.

The misconceptions are documented and remarkably stable. That motion requires a continuing force. That heavier things fall faster. That a thrown object has force inside it that runs out. That circular motion needs an outward force. Each generates specific wrong answers to specific questions, which is what makes diagnosis possible.

Build a quiz on that principle. Each distractor should correspond to a known misconception rather than being merely wrong, so that a wrong answer identifies a belief. Then confront it, which is the part that has to work: telling someone they are wrong does not dislodge a physical intuition, and the thing that does is watching a simulation of the situation where their prediction visibly fails to happen.

The physics must be exactly right, including in the feedback. This is a subject where a sloppy explanation installs a new misconception, so the explanations need to be as carefully checked as the simulations.

Design the experience so that being wrong is the productive path rather than a punishment. A learner who gets everything right should learn nothing here, and the design should be honest about that.

Do not gamify it with streaks and points. Extrinsic reward would compete with the only thing that matters, which is the learner noticing that their model of the world is wrong.`,
    abilityTags: [
      "Educational Correctness",
      "Physics / Simulation",
      "Interaction Design",
      "Narrative / Communication",
      "Functional Logic",
      "Layout & Typography",
    ],
    resultRoute: "/r/educational-quiz",
    status: "planned",
    blurb:
      "Every wrong answer maps to a documented misconception, then confronts it with the simulation where your prediction visibly fails — because being told you're wrong changes nothing.",
    direction:
      "Treating a wrong answer as evidence of a specific incorrect theory rather than missing knowledge is what makes diagnosis possible, and the misconceptions in this subject are documented and stable enough to design distractors around. The confrontation has to be experiential, since physical intuitions do not yield to being corrected in prose. No streaks or points, which would compete with the actual reward.",
  },
  {
    id: "educational-data-explainer",
    applicationSetting: "educational",
    typicalTask: "Data / Concept Explainer",
    title: "Grid",
    prompt: `Build a data-driven explainer about why decarbonising an electricity grid is harder than building more solar panels, in which the reader has to keep the lights on themselves.

Public debate on this is dominated by a single number, the annual percentage of generation from renewables, and that number hides the actual problem. A grid must match supply to demand continuously, within very tight tolerances, in every hour of every day. Solar produces nothing at night, wind produces nothing in a still anticyclone, demand peaks on winter evenings when both are least available, and the difficulty is not the annual average but the worst few hours of the year. This is why grids with impressive annual percentages still burn gas, and why the last twenty percent is far harder than the first eighty.

Nobody arrives at this from a bar chart, and almost everybody arrives at it from ten minutes of trying to do it. So make the reader do it: give them a real demand profile and real generation profiles, let them build a mix, and let them discover the hard hours themselves.

Be rigorous about the data. Use real published data for demand and for generation by source, cite it precisely, and be explicit about the period it covers. Where you simplify — and you will have to, since a real grid involves transmission constraints, inertia, reserve margins and interconnection — say what you have left out and why, so a reader does not leave with false confidence.

Handle storage honestly, since it is where most public reasoning goes wrong. Duration matters as much as capacity, and a battery that covers an evening peak is a fundamentally different thing from one that covers a still week in January.

The reader should leave with a genuinely better model, including of why this is tractable — not with the impression that the problem is hopeless, which would be its own distortion.`,
    abilityTags: [
      "Data Visualization",
      "Educational Correctness",
      "Interaction Design",
      "Narrative / Communication",
      "Functional Logic",
      "Information Architecture",
      "Layout & Typography",
    ],
    resultRoute: "/r/educational-data-explainer",
    status: "planned",
    blurb:
      "Build your own generation mix against a real demand curve and try to survive the worst hours of the year — where annual percentages stop meaning anything.",
    direction:
      "The annual-percentage framing that dominates public debate is precisely what hides the problem, so the explainer replaces it with the real constraint: matching supply to demand in the worst few hours. Nobody derives that from a bar chart and nearly everybody derives it from ten minutes of trying, which decides the form. Simplifications are declared, and storage duration is handled explicitly because that is where public reasoning fails.",
  },
];

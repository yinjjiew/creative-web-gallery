import type { Task } from "../types";

/**
 * SETTING 4 — Games
 *
 * The highest-variance setting, so every prompt states the bar explicitly:
 * movement, collision and a score are the floor. What is actually being asked
 * for is game feel, feedback, pacing, difficulty, sound, visual identity and a
 * reason to press retry.
 *
 * A standing constraint across all nine: audio is synthesized with the Web
 * Audio API rather than shipped as files. This is partly a licensing question
 * and mostly a quality one — parametric sound can respond to game state, which
 * is where game feel actually comes from.
 */
export const GAMES: Task[] = [
  {
    id: "games-arcade",
    applicationSetting: "games",
    typicalTask: "Arcade Game",
    title: "Semaphore",
    prompt: `Build an arcade game in which the player is a railway signalman working a mechanical lever frame in about 1890, routing traffic through a busy junction.

The arcade form is strict and worth respecting: one run, escalating pressure, a single mistake ending it, a score, and a loop tight enough that the player is reaching for retry before they have finished being annoyed. What makes a great arcade game is not difficulty but legibility under pressure — the player must always feel that a death was their own error, correctly punished, and that they now know something they did not know before.

The signal box is a strong fit for that because the real job has exactly the right shape. Trains approach on a schedule the signalman can see coming but cannot change; points and signals are thrown by hand and take real time to move; a route has to be set and locked before a train reaches it; and interlocking means some combinations are physically impossible to set at once. The tension is entirely about planning under a clock, and it escalates naturally as traffic thickens.

Take game feel seriously in a game about pulling levers: the weight of a lever, the clunk when it seats, the ring of a block bell, the rattle of a train taking a diverging route. All sound must be synthesized rather than sampled from files, which is an advantage here since these are mechanical sounds that should vary with force and state.

Difficulty needs a real curve, not just faster spawns. Introduce complications that ask new questions of the player rather than the same question sooner.

Visual identity matters as much as mechanics. This is enamel, brass, cast iron, oil lamps, faded diagrams — a period-specific world, not a generic pixel-art pastiche.`,
    abilityTags: [
      "Game Design",
      "Interaction Design",
      "Functional Logic",
      "Motion Design",
      "Audio Design",
      "Visual Design / Taste",
      "Robustness / Product Polish",
    ],
    resultRoute: "/r/games-arcade",
    status: "planned",
    blurb:
      "A Victorian signal box under escalating traffic: set and lock routes with a mechanical lever frame where interlocking forbids the combinations that would kill someone.",
    direction:
      "The historical job already has perfect arcade shape — visible incoming pressure, slow deliberate inputs, hard physical constraints, and total legibility of blame when it goes wrong. Interlocking is the mechanic that makes it deep rather than fast: the player is fighting a rule system, not a spawn rate. Period specificity in brass and enamel instead of generic pixel art.",
  },
  {
    id: "games-puzzle",
    applicationSetting: "games",
    typicalTask: "Puzzle Game",
    title: "Tide",
    prompt: `Build a puzzle game whose central mechanic is a rising and falling tide.

A puzzle game is only as good as the depth of its one idea. The test is whether the mechanic keeps generating genuinely different questions after twenty levels, or whether level twenty is level three with more pieces on the board. Depth comes from a mechanic that interacts with itself — where two instances of the same rule produce a situation neither predicted.

Tide is a promising candidate because water is simultaneously an obstacle and a vehicle. High water blocks a path and also floats a boat over a wall. Low water opens a causeway and also strands you. The tide is on a fixed cycle the player can read and plan around but cannot alter, which makes the puzzle about sequencing and commitment rather than about search.

Design the mechanic properly and then design a real progression through it. Every level should teach exactly one thing, in an order where each idea prepares the next, and the game should stop introducing mechanics well before it stops introducing ideas. Aim for a genuine, finishable sequence of hand-designed levels, not a generator.

A puzzle game needs the right kind of feedback: instant and undoable. Failure should cost nothing but information, retrying should be immediate, and the player should never lose progress to a misclick. Undo and reset are core mechanics here, not conveniences.

Visual identity should carry the subject. Admiralty charts, tide tables, soundings and engraved coastlines are a rich and specific reference, and far better than generic mobile-puzzle gloss.

Sound must be synthesized. Water, bell buoys and hull knocks all reward parametric treatment.`,
    abilityTags: [
      "Game Design",
      "Functional Logic",
      "State & Data",
      "Visual Design / Taste",
      "Interaction Design",
      "Layout & Typography",
      "Audio Design",
    ],
    resultRoute: "/r/games-puzzle",
    status: "planned",
    blurb:
      "A tidal puzzle on an engraved admiralty chart, where the same water that blocks your path is the water that floats you over the wall, on a cycle you can read but never change.",
    direction:
      "Water earns the central slot because it is obstacle and vehicle at once, so the mechanic interacts with itself and keeps producing new questions. A fixed readable cycle makes the game about sequencing and commitment rather than search. Hand-designed levels each teaching one idea, with instant undo, because a puzzle should only ever cost information.",
  },
  {
    id: "games-rhythm",
    applicationSetting: "games",
    typicalTask: "Rhythm Game",
    title: "Anvil",
    prompt: `Build a rhythm game about forging metal, in which the object the player makes is a record of how well they played.

Rhythm games almost universally throw away their own results. Notes fall, the player hits them, a number goes up, and nothing persists — the performance leaves no trace but a score. But rhythm is a craft skill in the physical world, and the crafts that depend on it produce objects. A smith working hot iron strikes in time, and accurate strikes at the right moment shape the metal while mistimed ones waste heat and deform it. The work itself is the scoreboard.

Build that. The player keeps time against the work, and the piece they are forging takes its shape from their timing, so that a good run and a bad run produce visibly different objects they can look at afterwards. This gives you a progression system for free and a much better reward than a letter grade.

Timing is the entire technical foundation and most browser rhythm games get it wrong. Scheduling must be driven by the audio clock rather than by animation frames, latency has to be measured and compensated rather than assumed, and the player needs a calibration step. A rhythm game that is fifty milliseconds off is broken no matter how it looks.

All audio must be synthesized with the Web Audio API and none of it sampled from files. This is a real constraint and an opportunity: the ring of struck iron changes as the piece thins and cools, and that is a parametric sound telling the player something they need to know.

Heat is a natural pacing mechanism — metal is workable for a limited time and then must go back in the fire — which gives you phrase structure, rest, and rising tension without an artificial timer.

Visual identity: a real forge. Scale, slag, the specific colour sequence of cooling steel. Not neon.`,
    abilityTags: [
      "Game Design",
      "Audio Design",
      "Motion Design",
      "Interaction Design",
      "Functional Logic",
      "Visual Design / Taste",
      "Robustness / Product Polish",
    ],
    resultRoute: "/r/games-rhythm",
    status: "planned",
    blurb:
      "Keep time on hot iron and the metal takes its shape from your accuracy. A good run and a bad run leave visibly different objects, and cooling steel sets the phrasing.",
    direction:
      "Making the forged object the scoreboard fixes the form's central waste — a performance that leaves a trace is worth far more than a letter grade, and it supplies progression for free. Cooling metal gives phrase structure and rest without an artificial timer. Audio-clock scheduling with a real calibration step, since fifty milliseconds of drift makes any rhythm game worthless.",
  },
  {
    id: "games-casual",
    applicationSetting: "games",
    typicalTask: "Casual Game",
    title: "Skip",
    prompt: `Build a casual game about skipping stones across water.

Casual does not mean shallow; it means the cost of starting is near zero and the game never punishes a player for putting it down. The craft is in making a very simple action feel so good that people repeat it without needing a reason, which puts essentially the entire weight of the task on feel and feedback rather than on systems.

Stone skipping is a good subject because the real physics is genuinely interesting and genuinely subtle. The outcome depends on the angle of attack, the spin, the velocity and the state of the water, there is a real optimum that expert throwers know, and the failure modes are distinct and readable — too steep and it sinks on the first contact, too flat and it never bites, no spin and it tumbles. Simulate it well enough that a player develops a feel for it and can tell why a throw went wrong.

Everything the player does should be pleasurable in itself. The wind-up, the release, each impact, the ring spreading on the surface, the count, the final sink. This is a game where the fifteenth skip needs to be more satisfying than the first, and where the sound of a stone touching water is a substantial fraction of the total quality.

Give it somewhere to go without adding pressure. Different stones, different water, different weather and a reason to come back are all compatible with calm; timers and lives are not.

All audio synthesized rather than sampled. Water contact is a parametric sound and should vary with speed and angle.

Look at real light on real water. Avoid cartoon vector flatness and avoid a mobile free-to-play aesthetic.`,
    abilityTags: [
      "Game Design",
      "Physics / Simulation",
      "Motion Design",
      "Audio Design",
      "Interaction Design",
      "Visual Design / Taste",
    ],
    resultRoute: "/r/games-casual",
    status: "planned",
    blurb:
      "Stone skipping with honest physics: angle, spin and velocity decide whether it bites or sinks, and the whole game is the pleasure of each touch on the water.",
    direction:
      "A near-zero cost of entry puts the entire weight on feel, so the subject was chosen for having subtle real physics with readable failure modes — a player can build genuine intuition. The fifteenth skip has to beat the first, which makes parametric water contact sound a large fraction of total quality. Calm progression only: no timers, no lives.",
  },
  {
    id: "games-platformer",
    applicationSetting: "games",
    typicalTask: "Platformer",
    title: "Cairn",
    prompt: `Build a precision platformer in which every death leaves a stone behind, and the stones become part of the level.

The platformer is the most thoroughly explored genre in games, which means the bar for movement is brutally high and the bar for originality is higher. Two things have to be true for a result here to be worth anything. First, the movement has to feel excellent on its own terms — the accumulated craft of this genre is largely invisible tuning, and its absence is instantly felt. Second, there has to be an actual idea, because a competent platformer with no idea is the single most replaceable thing on this list.

The idea here is that failure is constructive. When the player dies, a small stone is left at that spot, and it is solid. Enough failed attempts at the same jump build a cairn that changes the geometry of the problem, so a player grinding a hard section is unknowingly building their own way through it. This makes difficulty self-balancing without a difficulty setting, turns frustration into visible progress, and creates a real tension worth designing around: the accumulated stones can also block a route the player needs.

Movement quality is not optional and is mostly made of things players never name — coyote time, input buffering, variable jump height, asymmetric gravity, the exact number of frames of hitstop on a landing. Tune it until it feels right, then tune it again.

Deaths must be cheap and instant. A precision platformer with a slow respawn is unplayable regardless of how good the jump is.

All sound synthesized. Footfalls, stone settling and the wind should respond to state.

Choose a visual language with real atmosphere — a specific place, specific weather, specific light — rather than a generic pixel tileset.`,
    abilityTags: [
      "Game Design",
      "Interaction Design",
      "Motion Design",
      "Functional Logic",
      "Physics / Simulation",
      "Visual Design / Taste",
      "Audio Design",
    ],
    resultRoute: "/r/games-platformer",
    status: "planned",
    blurb:
      "A precision platformer where each death drops a solid stone. Repeated failure builds a cairn that reshapes the jump — self-balancing difficulty that can also wall you in.",
    direction:
      "Constructive failure is the idea that earns this a place in an exhausted genre: grinding a hard jump visibly builds the solution, so difficulty self-balances with no settings screen, and the same stones can block a route you later need. Everything else is invisible craft — coyote time, input buffering, asymmetric gravity, landing hitstop — because its absence is what makes a platformer feel cheap.",
  },
  {
    id: "games-strategy",
    applicationSetting: "games",
    typicalTask: "Strategy Game",
    title: "Levee",
    prompt: `Build a strategy game about defending a river delta from a flood, where the opponent is the water.

Most small strategy games are undone by their artificial intelligence. A weak opponent makes the strategy meaningless, a strong one is a large research project, and a cheating one poisons the whole experience. The way out is to choose an opponent that does not need to think: a physical process, indifferent and legible, which produces genuine strategic pressure without ever needing to be clever.

Water is an excellent adversary. It is predictable in principle and overwhelming in practice, it exploits the weakest point in a defence automatically, defending one place sends it somewhere else, and every choice is a real trade-off between locations, between now and later, and between certain small losses and possible large ones. The player has limited crews, limited material and limited time, and the water does not care.

Design for real decisions. Every turn should present a choice where the player can see a case for two different options and will not know for certain whether they were right — that is what distinguishes strategy from optimisation. Sacrifice has to be genuinely on the table, including deliberately flooding farmland to save a town.

The simulation must be honest and readable. The player has to be able to predict roughly what water will do, or the game becomes a slot machine, so make the model transparent enough to reason about while still capable of surprising them.

Information design is a large part of this task: the state of a delta under rising water is a lot of data, and it has to be readable at a glance. Treat the map as a serious piece of graphic design in the tradition of hydrological survey drawings.

Sound synthesized, and restrained — this should be tense, not loud.`,
    abilityTags: [
      "Game Design",
      "Functional Logic",
      "State & Data",
      "Data Visualization",
      "Information Architecture",
      "Visual Design / Taste",
      "Physics / Simulation",
    ],
    resultRoute: "/r/games-strategy",
    status: "planned",
    blurb:
      "Hold a river delta against a flood with too few crews and too little stone. The water needs no intelligence to beat you — it just finds the weakest point automatically.",
    direction:
      "Choosing a physical process as the opponent sidesteps the thing that ruins small strategy games: you get real pressure and real trade-offs with no AI to write and no cheating to forgive. Water automatically exploits the weakest point, so defending one place genuinely endangers another. The map is treated as hydrological survey drawing, since readable state is most of the design.",
  },
  {
    id: "games-simulation",
    applicationSetting: "games",
    typicalTask: "Simulation Game",
    title: "Starter",
    prompt: `Build a simulation game about keeping a sourdough starter alive.

The pleasure of a simulation game is understanding a system well enough to steer it, so the quality of a result depends almost entirely on whether there is a real system underneath. A simulation with arbitrary rules teaches nothing and gets boring the moment the player realises the numbers are invented.

A sourdough culture is a genuinely good system: small, real, well-documented and counter-intuitive. It is an ecology of two populations — yeasts and lactic acid bacteria — competing and cooperating in a jar, and their balance is what determines whether bread tastes mild or sharp, rises well or collapses. Temperature, hydration, flour, feeding ratio and time all move that balance, often in ways bakers find surprising: a warmer culture is not simply a faster one, because heat favours one population over the other and changes the flavour rather than only the schedule.

Model it honestly, with population dynamics that produce the behaviours real bakers report. The player should be able to develop true intuitions — a person who gets good at this game should be better at real sourdough, and nothing in it should teach them something false.

Time is the central design problem. Fermentation happens over days, which is fatal to a browser game if handled naively and interesting if handled well. Solve it deliberately.

Give the player a reason to care about the outcome. Bread is the point, and the loaf should be a legible consequence of how the culture was kept.

The register should be quiet and domestic — a kitchen, a jar, a notebook, flour on a scale. Not a management-game HUD.

Sound, if present, must be synthesized and should be almost nothing.`,
    abilityTags: [
      "Game Design",
      "Physics / Simulation",
      "Educational Correctness",
      "State & Data",
      "Data Visualization",
      "Visual Design / Taste",
      "Functional Logic",
    ],
    resultRoute: "/r/games-simulation",
    status: "planned",
    blurb:
      "Tend a jar of yeast and lactic bacteria competing over days. Temperature and feeding shift the balance, and the loaf is an honest consequence of how you kept the culture.",
    direction:
      "A real documented system is the prerequisite for a simulation worth playing, and a two-population culture is small enough to model honestly while being genuinely counter-intuitive — warmth changes flavour, not just speed. The correctness constraint is strict: someone who gets good at this should be better at actual sourdough. Domestic and quiet, not a management HUD.",
  },
  {
    id: "games-one-button",
    applicationSetting: "games",
    typicalTask: "Experimental One-Button Game",
    title: "Trapeze",
    prompt: `Build a one-button game about flying trapeze.

The one-button constraint is a real design discipline rather than a gimmick. With a single input there is nowhere to hide: no combination of controls can manufacture depth, so all of it has to come from timing and from context making the same input mean different things. The best games in this form are extremely simple to describe and take a long time to get good at.

Flying trapeze fits the constraint almost perfectly, because the actual sport is about exactly one decision made repeatedly: when to let go. Release too early or too late and the arc is wrong. Everything else — the swing, the momentum, the arc through the air, the catch — follows from physics and from that one choice of moment. It also has the ideal difficulty property: the same action, timed a fraction of a second differently, produces the difference between a clean catch and a fall.

Build the physics honestly, because the entire skill of the game is reading a pendulum and predicting where a release will send you. If the trajectory does not follow from real momentum, there is nothing to learn and the game becomes guesswork.

Escalate by asking new questions of the same button rather than by adding buttons. The vocabulary of the real sport offers plenty: catchers who swing on their own schedule, longer gaps, rotations that must be completed before the catch.

Feel is nearly everything. The weight at the bottom of a swing, the stretch of the fly bar, the moment of weightlessness, the sound of a catch, and the specific pleasure of a release that was exactly right.

Sound synthesized. Visually, this suits strong graphic restraint — silhouette, a very limited palette, dust in a beam of light.`,
    abilityTags: [
      "Game Design",
      "Physics / Simulation",
      "Interaction Design",
      "Motion Design",
      "Visual Design / Taste",
      "Audio Design",
    ],
    resultRoute: "/r/games-one-button",
    status: "planned",
    blurb:
      "One button, one decision, repeated: when to let go. Real pendulum momentum decides your arc, so the skill is reading a swing and knowing the exact moment.",
    direction:
      "The sport reduces to precisely the one-button constraint — everything follows from the timing of a release — so the fit is structural rather than imposed. Honest momentum is mandatory, because if the arc does not follow from physics there is no skill to acquire and the game becomes a coin flip. Escalation asks new questions of the same button instead of adding inputs.",
  },
  {
    id: "games-multiplayer",
    applicationSetting: "games",
    typicalTask: "Multiplayer / Social Mini-Game",
    title: "Slalom",
    prompt: `Build a social racing game where players compete against each other's recorded runs, passed between them as a link.

Real-time multiplayer in a browser is largely an infrastructure problem, and infrastructure is not what this task should be testing. There is also a more interesting design question available. Simultaneous play requires two people to be free at the same moment, which is usually the reason a social game goes unplayed; asynchronous competition against a specific person's recorded attempt has a long history in racing games, and it is arguably more social, because the ghost is identifiably your friend's run and you can see precisely where they beat you.

Build that, with no server. A run should be capturable, encoded compactly enough to live inside a shareable link, and replayable by whoever opens it as a ghost racing alongside them. Beating it should naturally produce a link going back the other way, so the loop is a rivalry that can continue for weeks.

The encoding is a real engineering problem worth doing properly: it must be compact enough for a URL, and the replay must be exact. Fixed-timestep determinism is the honest way to achieve that, and the ghost has to be trustworthy or the whole social premise collapses.

Underneath, this still has to be a good game to play alone. A downhill time trial lives or dies on the feel of carving, the sense of speed, and the perfectly-tuned relationship between risk and line. Get that right first.

Design the social object with care. What the recipient sees when they open a challenge link, and how a defeat is delivered, is where the actual social experience happens.

Sound synthesized. Be honest with the player about what a link contains and that nothing is stored anywhere.`,
    abilityTags: [
      "Game Design",
      "Functional Logic",
      "State & Data",
      "Interaction Design",
      "Motion Design",
      "Narrative / Communication",
      "Robustness / Product Polish",
    ],
    resultRoute: "/r/games-multiplayer",
    status: "planned",
    blurb:
      "A downhill time trial whose entire run compresses into a shareable link. Your friend opens it and races your ghost, and beating it mints the rematch — no server anywhere.",
    direction:
      "Asynchronous rivalry is not a workaround for lacking a server but the better social design: it removes the requirement that two people be free simultaneously, and a named friend's ghost is more pointed than an anonymous lobby. Deterministic fixed-timestep replay is what makes the ghost trustworthy, and the trust is the entire premise. The link is treated as the social object and designed as carefully as the racing.",
  },
];

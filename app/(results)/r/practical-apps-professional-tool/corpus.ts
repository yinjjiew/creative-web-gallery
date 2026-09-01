/**
 * The sample set: 124 scripts.
 *
 * SAMPLE DATA — READ THIS BEFORE BELIEVING ANY OF IT.
 *
 * No student wrote any of these essays. They are assembled, deterministically
 * from a fixed seed, out of a bank of paragraphs written for this demonstration
 * at three levels of accomplishment. Names are drawn from a name bank and
 * belong to nobody. The interface says all of this on the surface, not only
 * here, because a marking tool full of convincing-looking student work is
 * exactly the sort of thing that gets mistaken for real.
 *
 * Quotations *from the play* inside the sample essays are from J. B. Priestley,
 * An Inspector Calls (1945), and are quoted accurately and briefly, as a
 * student would quote them. The lower-band paragraphs mostly contain no
 * quotation at all, which is both accurate to the band descriptor and avoids
 * putting misquotations of a real text into a tool.
 *
 * Why generate rather than ship 124 written-out essays: the point of the tool
 * is behaviour across a large set — drift over a hundred-odd decisions, a rank
 * order you can scan, a re-review sample. That needs a hundred-odd scripts. It
 * does not need a hundred-odd hand-written ones, and pretending otherwise would
 * have meant shipping a megabyte of prose to make a point about consistency.
 */

import { STRAND_IDS, type StrandId } from "./rubric";

/* -------------------------------------------------------------------------- */
/* Deterministic randomness                                                    */
/* -------------------------------------------------------------------------- */

/** mulberry32. Small, fast, and the same sequence in every browser forever. */
export function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick<T>(random: () => number, items: readonly T[]): T {
  return items[Math.floor(random() * items.length) % items.length];
}

/* -------------------------------------------------------------------------- */
/* Names                                                                       */
/* -------------------------------------------------------------------------- */

const FORENAMES = [
  "Amira", "Joel", "Priya", "Callum", "Nadia", "Tomas", "Grace", "Idris",
  "Leah", "Marcus", "Ffion", "Zainab", "Owen", "Hana", "Reuben", "Chloe",
  "Kofi", "Isla", "Danny", "Meera", "Aaron", "Bethan", "Yusuf", "Erin",
  "Louis", "Tia", "Samir", "Niamh", "Ethan", "Rosa", "Kyle", "Anya",
  "Jonah", "Freya", "Dele", "Maya", "Connor", "Sana", "Elliot", "Robyn",
  "Hassan", "Immy", "Lewis", "Tara", "Vince", "Aoife", "Jonty", "Kiran",
  "Sadie", "Ben", "Nia", "Otis", "Farrah", "Rhys", "Georgia", "Malik",
];

const SURNAMES = [
  "Adeyemi", "Bartlett", "Chowdhury", "Doyle", "Ellery", "Farrow", "Gunn",
  "Halloran", "Iqbal", "Jarvis", "Kowalczyk", "Lindsay", "Mensah", "Nowak",
  "O'Rourke", "Petrov", "Quayle", "Rasheed", "Sinclair", "Thwaite", "Udall",
  "Vaughan", "Whitlock", "Xavier", "Yardley", "Zielinski", "Ashworth",
  "Beaumont", "Crowther", "Dhillon", "Eastwood", "Fenwick", "Gallagher",
  "Hobbs", "Ingram", "Joshi", "Kerrigan", "Lomax", "Marchetti", "Nkemelu",
];

const FORMS = ["11A", "11B", "11C", "11D", "11E"] as const;

/* -------------------------------------------------------------------------- */
/* The paragraph bank                                                          */
/* -------------------------------------------------------------------------- */

type Level = "low" | "mid" | "high";

const OPENINGS: Record<Level, string[]> = {
  low: [
    "An Inspector Calls is a play by J.B. Priestley and it is about responsibility. In this essay I am going to talk about the Birling family and what they done to Eva Smith and how the Inspector comes to there house. Priestley wants us to think about how we treat other people.",
    "In this essay I will be writing about responsibility in An Inspector Calls. The play is set in 1912 in the house of the Birlings who are a rich family. A girl called Eva Smith has died and the Inspector wants to know who is to blame for it.",
    "Responsibility is a big theme in the play An Inspector Calls. Priestley uses lots of different techniques to show this. There are lots of characters in the play and they all have a part in what happened to Eva Smith which I will explain.",
    "The play An Inspector Calls was written by J.B. Priestley in 1945. It is about a family who are having a party and then a inspector turns up. The inspector tells them that a girl has died and each of them had something to do with it. This links to responsibility.",
  ],
  mid: [
    "Priestley presents responsibility as something the Birlings would rather avoid than accept. Through the Inspector, and through the way each member of the family is questioned in turn, Priestley shows an audience that responsibility cannot be divided up and handed off. The younger characters learn this and the older ones refuse to.",
    "In An Inspector Calls, Priestley presents responsibility as a duty we owe to people we will never meet. Arthur Birling begins the play insisting that a man should look after himself, and the rest of the play is arranged to prove him wrong. Priestley uses the Inspector, the structure of the interrogation, and the contrast between the generations to make his point.",
    "Priestley presents responsibility as a test that the Birling family fails. The play was written in 1945 but set in 1912, and this gap allows Priestley to show an audience a family who are confidently wrong. Responsibility, for Priestley, is collective, and the play is built to demonstrate that.",
    "Responsibility in An Inspector Calls is presented as something that is shared whether we accept it or not. Priestley uses the Inspector as a moral voice, the chain of events surrounding Eva Smith to show consequence, and the split between the older and younger Birlings to suggest where change might come from.",
  ],
  high: [
    "Priestley presents responsibility less as a moral position than as a fact about how a society is wired, and the play's real argument is that the Birlings' denial of it does not make it untrue. The interrogation structure matters here: responsibility is discovered in sequence, one link at a time, so that an audience watches a chain assemble that no single character can see whole.",
    "It is tempting to read An Inspector Calls as a play that divides its characters into those who accept responsibility and those who do not, and the ending nearly invites that reading. But Priestley complicates it. Sheila and Eric accept responsibility and are still powerless; Birling refuses it and remains in charge. Responsibility, in this play, is presented as something a society can acknowledge and still fail to act on.",
    "Priestley's presentation of responsibility depends on withholding its object. Eva Smith never appears, is never heard, and may not be one person at all, so the audience is asked to feel responsible for someone constructed entirely out of other people's accounts of her. This is the play's most interesting move: it makes responsibility an act of imagination rather than a response to a person in the room.",
    "The play is often taught as though the Inspector's final speech is Priestley's argument, delivered plainly. It is more accurate to say that the speech is where the play stops arguing and starts warning, and that the argument itself has already been made structurally — in the order of the confessions, in the pink lighting that goes hard, and in the fact that nobody in the room can see the whole chain they are part of.",
  ],
};

type BodyBank = Record<Level, string[]>;

const BODIES: Record<string, BodyBank> = {
  birling: {
    low: [
      "Mr Birling is very selfish in the play. He sacked Eva Smith because she asked for more money and he did not care what happened to her after. He says that a man has to look after himself and his own which shows he is selfish and only thinks about money. He also thinks the Titanic is unsinkable which shows he is wrong about things. Priestley does this to show that rich people were selfish.",
      "The first person who is responsible is Mr Birling. He is the one who sacked her from his factory at the start of the chain of events. He would of been able to give her the raise because he is rich but he did not want to. This shows he does not take responsibility for his workers and only cares about profit.",
    ],
    mid: [
      "Priestley presents Arthur Birling as the clearest refusal of responsibility in the play. In Act One he tells the young people that “a man has to mind his own business and look after himself and his own”, a line Priestley places immediately before the Inspector's arrival so that the doorbell interrupts it. The staging turns Birling's philosophy into a set-up for a joke at his expense, and an audience in 1945, who knew what the following thirty years had cost, would have heard the irony straight away.",
      "Birling's response to the Inspector reveals what his sense of responsibility actually is. When the pressure builds he offers money: “Look, Inspector — I'd give thousands — yes, thousands —”. Priestley makes him reach for a cheque because Birling can only understand obligation as a transaction, something that can be settled and closed. The Inspector's refusal to accept it shows the audience that responsibility, as Priestley means it, cannot be paid off.",
    ],
    high: [
      "Birling is Priestley's most efficient device rather than his most interesting character, and the play knows it. His pronouncements about the Titanic and the impossibility of war are calibrated to be wrong in ways a 1945 audience could verify from memory, which means his opinions arrive pre-discredited. The consequence is subtle: because Birling's economics are attached to his meteorology and his politics, Priestley need never argue against “a man has to mind his own business and look after himself and his own”. He only has to let the same man say it who was sure about the Titanic.",
      "What makes Birling's refusal of responsibility dramatically useful is that it is never punished. He ends the play in the same house, with the same money, and with his reputation intact in his own eyes; the only thing that frightens him is “a public scandal”. Priestley withholds the satisfaction of seeing him ruined, and the withholding is the point. If responsibility were enforced by consequence, the play would be a comfort. Because it is not, the final telephone call has to do the work instead.",
    ],
  },
  inspector: {
    low: [
      "The Inspector is the main character who talks about responsibility. He says that we are members of one body and we are responsible for each other. This is Priestley speaking through him because Priestley was a socialist. The Inspector is not a real inspector at the end which makes it more mysterious.",
      "Goole is a inspector who comes to the house to ask questions. He is quite rude to the family and does not let them get away with there answers. He tells them at the end that each of them helped to kill her. This shows that everyone is responsible not just one person.",
    ],
    mid: [
      "The Inspector is Priestley's instrument for stating the play's argument outright. His final speech insists that “We don't live alone. We are members of one body. We are responsible for each other,” and Priestley gives it to a character who has already been established as unnervingly certain. The warning that follows — that if men will not learn this lesson “they will be taught it in fire and blood and anguish” — would have landed hard in 1945, when an audience had just watched two wars deliver exactly that.",
      "Priestley uses the Inspector's method as much as his words. He questions the family one at a time, and he refuses to let them see the photograph together. This control of information means that responsibility is revealed in a chain, so no character can dismiss their part as unconnected. The Inspector's line to Birling that “Public men, Mr Birling, have responsibilities as well as privileges” makes explicit what the interrogation has been demonstrating.",
    ],
    high: [
      "The Inspector's authority is a structural trick rather than an institutional one, and Priestley is careful about this. He never proves he is a policeman, and by Act Three we learn he was not one; what he has instead is the ability to make people speak. That the family confess to a man with no standing whatsoever is the most persuasive argument the play makes about responsibility, because it shows the obligation was always internal. They did not need to be caught. They needed to be asked.",
      "It is worth resisting the reading that the Inspector simply is Priestley. His method — sequencing the confessions, withholding the photograph, controlling who is in the room — is manipulative in ways Priestley's own argument is not, and the play lets us notice. When he tells them that “each of you helped to kill her”, the claim is morally true and evidentially unproven, and the two things pull against each other. Priestley wants an audience persuaded, but he has built a character who is willing to persuade by pressure, which quietly asks what responsibility is worth if it has to be extracted.",
    ],
  },
  sheila: {
    low: [
      "Sheila changes the most in the play. At the start she is spoilt and she got Eva Smith sacked from Milwards because she was jealous of her. But then she feels really bad about it and she starts to take responsibility. This shows that young people can change.",
      "Sheila is a young character and she is different to her parents. She says that the girls are not cheap labour they are people. She learns her lesson from the Inspector unlike her mum and dad who do not care at the end. Priestley wanted young people to be like Sheila.",
    ],
    mid: [
      "Sheila is Priestley's evidence that responsibility can be learned. Her admission comes without being forced: she says of her part in Eva's dismissal from Milwards that she was “in a furious temper” and she does not soften it. By Act Two she has understood the Inspector's method well enough to warn her mother — “You mustn't try to build up a kind of wall between us and that girl” — which shows Priestley presenting her not merely as sorry but as newly able to see how denial works.",
      "Priestley marks Sheila's change through her language. In Act One she interrupts her father with “But these girls aren't cheap labour — they're people,” a correction of vocabulary that is also a correction of ethics. She is the first character in the play to talk about the workers as people rather than as a cost, and Priestley places this before she knows she is implicated, so that her decency is not merely a response to being caught.",
    ],
    high: [
      "Sheila's transformation is the part of the play most often over-read. She does change, and Priestley clearly approves, but the change costs her nothing that she is shown to value and it produces no action; at the final curtain she has returned the ring and stayed in the house. Priestley's interest, I think, is less in her conversion than in her new capacity to see the mechanism. Her warning to her mother about building “a kind of wall between us and that girl” is the only moment in the play where a Birling correctly predicts another Birling's evasion, and that diagnostic ability, rather than her remorse, is what Priestley is holding up.",
      "There is a real difficulty in Sheila's position that the play does not resolve. She accepts responsibility fully and immediately, and by doing so becomes the character least able to change anything, since accepting responsibility in this household means forfeiting authority in it. Birling dismisses her and Eric as “the famous younger generation who know it all”, and the phrase works because it is exactly what an audience is inclined to say too. Priestley risks his own sympathetic characters being annoying, which suggests he is more interested in the structure of denial than in giving us someone to like.",
    ],
  },
  generations: {
    low: [
      "There is a big difference between the older and younger generation in the play. Mr and Mrs Birling do not take responsibility at all and they are happy when they find out it might be a hoax. But Sheila and Eric still feel bad. This shows that Priestley thought young people would change society.",
      "Eric is responsible because of what he done to Eva Smith and also he stole money from his dad. He says his dad is not the kind of father you can go to when your in trouble. Mrs Birling is also responsible because she turned Eva away from the charity when she needed help.",
    ],
    mid: [
      "Priestley divides the family by generation to suggest where change might come from. Mrs Birling insists “I did nothing I'm ashamed of or that won't bear investigation,” and her language of investigation shows she is thinking about scrutiny rather than about the girl. Eric, by contrast, refuses the family's relief in Act Three: “It's you two who are being childish — trying not to face the facts.” Priestley gives the accusation of childishness to the son, reversing the authority of age.",
      "Eric's confrontation with his father makes responsibility a domestic failure as well as a social one. When he says “you're not the kind of father a chap could go to when he's in trouble,” Priestley extends the play's argument inward: the same refusal to be responsible for a stranger has produced a home in which a son cannot ask for help. This makes the Inspector's collective claim harder for an audience to dismiss as merely political.",
    ],
    high: [
      "The generational split is Priestley's most optimistic device and also his least examined one, and it is worth pressing on. Sheila and Eric are given the moral victory, but Priestley provides no mechanism by which their conversion becomes power; they are dependants in their father's house. Mrs Birling's “I did nothing I'm ashamed of or that won't bear investigation” is a more revealing line than it first appears, because the two halves are not equivalent — shame is internal, investigation external — and she treats them as the same test. That conflation, not her cruelty, is what the young Birlings have escaped.",
      "Priestley's handling of Eric complicates any straightforward reading of the young as redeemed. Eric's offence is the gravest in the play and his remorse is the least articulate; where Sheila analyses, he mostly shouts. Yet Priestley gives him the play's sharpest sentence about the family — “It's you two who are being childish — trying not to face the facts” — which suggests that clarity about responsibility does not depend on having behaved well. The play separates moral insight from moral record, and it is unusual in doing so.",
    ],
  },
  eva: {
    low: [
      "Eva Smith is the girl who died. She never appears in the play because she is dead already. Each of the family did something bad to her which added up until she killed herself. This shows that lots of small things can add up to something terrible.",
      "Eva Smith represents the working class. She was sacked, then fired from the shop, then Gerald had a affair with her, then Eric got her pregnant and then Mrs Birling refused to help her. It is a chain of events and everyone is a part of it.",
    ],
    mid: [
      "Priestley keeps Eva Smith off the stage, and this absence is a deliberate method. Everything an audience knows about her arrives through the people who harmed her, which means she exists only as a series of accounts. The Inspector's closing reminder that there are “millions and millions and millions of Eva Smiths and John Smiths still left with us” converts her from an individual into a category, and Priestley needs her to be both: specific enough to be mourned and general enough to be a claim about society.",
      "The chain of harm surrounding Eva Smith is Priestley's clearest argument that responsibility is shared. No single Birling kills her; each performs an act that is, taken alone, defensible in their own terms. Priestley constructs the sequence so that an audience can see what none of the characters can, which is the accumulation. Responsibility is presented not as guilt for an action but as a share in a result.",
    ],
    high: [
      "The possibility that there was no single girl is the play's most demanding idea and it is usually treated as a plot twist. Gerald's discovery that the Inspector was not a policeman opens the door to the reading that several different women were involved, and the Birlings seize on it with relief. But Priestley has arranged things so that the relief is unavailable to the audience: whether the photograph showed one woman or five, five acts of harm were still done. By making the identity of the victim uncertain and the conduct certain, Priestley detaches responsibility from consequence entirely.",
      "Eva Smith's silence is doing more work than her death. Because she never speaks, she cannot forgive, cannot accuse, and cannot be found to have deserved any of it, which forecloses every escape route an audience might otherwise take. The name itself is a construction — Eva as first woman, Smith as anybody — and the Inspector's “millions and millions and millions of Eva Smiths and John Smiths” makes the allegory explicit at the point where it can no longer damage the realism. Priestley waits until the last possible moment to admit what he has been doing.",
    ],
  },
  structure: {
    low: [
      "The play has three acts and it all happens in one room in one evening. This makes it feel more tense. At the end the phone rings and a inspector is coming which is a cliffhanger and it makes the audience think about what will happen next.",
      "Priestley uses dramatic irony in the play. Mr Birling says the Titanic is unsinkable and that there will not be a war but the audience knows he is wrong. This makes us not trust what he says about responsibility either.",
    ],
    mid: [
      "The structure of the play enforces the argument that the words alone could not. Priestley uses a cyclical ending: the family relax, and then the telephone rings to announce a real inspector and a real death. Because the audience has already watched the whole interrogation once, the second one is imagined rather than staged, and Priestley leaves us to run it ourselves. Responsibility is handed to the audience at the exact moment the characters put it down.",
      "Priestley's stage directions make the play's argument visible before anybody states it. The lighting is to be “pink and intimate” until the Inspector arrives, “and then it should be brighter and harder.” The Birlings' comfortable view of themselves is literally a filter, and the Inspector's arrival is presented as a change in the light rather than a change in the facts. Nothing about the family alters; only the illumination does.",
    ],
    high: [
      "The cyclical ending is often described as a warning, which is true but incomplete. What the final telephone call actually does is convert the audience from spectators into participants in the play's moral scheme, because we are the only people in the theatre who have watched the evening twice — once as it happened and once, imagined, as it is about to happen again. Priestley uses repetition to produce knowledge that no character possesses, and knowledge, in this play, is what responsibility is made of.",
      "Priestley's decision to keep the classical unities — one room, one evening, continuous time — is doing argumentative work rather than formal work. A play about collective responsibility that ranged over years and cities would let an audience feel the harm was diffuse; confining it to a dining room in Brumley makes the chain short enough to hold in the head. The pink lighting going “brighter and harder” is the same instinct applied to design. Priestley is consistently converting a social argument into something that can be perceived in a single room in two hours, which is the real craft of the play.",
    ],
  },
};

const CONCLUSIONS: Record<Level, string[]> = {
  low: [
    "In conclusion Priestley presents responsibility as very important. He shows that the Birlings are all responsible for Eva Smith dying and that they should of helped her. Priestley wants the audience to be more responsible than them.",
    "To conclude, responsibility is a big theme in An Inspector Calls. Some characters take responsibility like Sheila and Eric and some do not like Mr and Mrs Birling. Priestley is telling us that we should all look after each other.",
    "Overall I think Priestley presents responsibility in lots of ways in the play. He uses the Inspector to tell us the message and the family to show what happens when people are selfish. This is still important today.",
  ],
  mid: [
    "Priestley therefore presents responsibility as collective, unavoidable, and easier to see from outside than from inside. The Birlings are given every chance to accept it and only half of them do, and Priestley denies the audience a comfortable ending in order to pass the question on.",
    "In presenting responsibility, then, Priestley works on two levels at once: the Inspector states the argument, and the structure of the play demonstrates it. An audience leaves having watched a family fail a test that the final telephone call implies they are about to sit again.",
    "Ultimately Priestley presents responsibility as something a society owes rather than something an individual chooses. The play's refusal to punish Birling, and its refusal to reward Sheila, keep the question open, which for a play written in 1945 about 1912 is the more useful ending.",
  ],
  high: [
    "What Priestley finally presents, then, is not a lesson about responsibility but a demonstration of how a group of reasonable people avoid it, each for a defensible local reason. The play's power comes from the fact that no individual act in it is monstrous. It is the arithmetic that is monstrous, and arithmetic is exactly what a family in a dining room cannot see.",
    "The play's presentation of responsibility is therefore best read as diagnostic rather than hortatory. Priestley is less interested in telling an audience to be responsible — the Inspector does that, and it is the least interesting thing in the play — than in showing, through structure, sequence and lighting, the precise mechanism by which responsibility gets distributed until it disappears.",
    "If the play still works, and it does, it is because Priestley refuses the ending his argument seems to want. Nobody is punished, nothing is repaired, and the telephone rings. Responsibility is left where it is least comfortable and most accurate: outside the play, with the people who watched it and are now going home.",
  ],
};

const TOPIC_ORDER = ["birling", "inspector", "sheila", "generations", "eva", "structure"] as const;

/* -------------------------------------------------------------------------- */
/* Assembly                                                                    */
/* -------------------------------------------------------------------------- */

export type Script = {
  /** 1-based candidate number, the way a set of scripts is actually numbered. */
  id: number;
  candidate: string;
  name: string;
  form: string;
  paragraphs: string[];
  wordCount: number;
  /**
   * The quality the paragraphs were assembled at, per strand, 0..6.
   *
   * This exists ONLY to seed the sample marking history so it is not random
   * noise, and to keep the sample scripts internally consistent. It is never
   * shown, never used to suggest a mark, and no part of the interface reads it.
   * A tool that knew what an essay was worth would be a different product, and
   * the brief rules it out.
   */
  latent: Record<StrandId, number>;
};

function levelFor(quality: number): Level {
  if (quality <= 2.4) return "low";
  if (quality <= 4.4) return "mid";
  return "high";
}

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function buildScript(id: number, random: () => number): Script {
  // Overall accomplishment, skewed to the middle the way a real set is.
  const draws = [random(), random(), random()];
  const centre = 1.1 + (draws[0] + draws[1] + draws[2]) * 1.7; // ~1.1 .. 6.2

  const latent = {} as Record<StrandId, number>;
  for (const strand of STRAND_IDS) {
    const jitter = (random() - 0.5) * 2.1;
    latent[strand] = Math.max(0.4, Math.min(6, centre + jitter));
  }

  const overall = Math.max(0.6, Math.min(6, centre));
  const level = levelFor(overall);

  const topicCount = overall < 2.5 ? 3 : overall < 4.5 ? 4 : random() < 0.45 ? 4 : 5;
  const topics = [...TOPIC_ORDER]
    .map((topic) => ({ topic, sort: random() }))
    .sort((a, b) => a.sort - b.sort)
    .slice(0, topicCount)
    .map((entry) => entry.topic);

  const paragraphs = [pick(random, OPENINGS[level])];
  for (const topic of topics) {
    // Individual paragraphs wobble around the essay's overall level, which is
    // what makes a real script hard to mark: the good paragraph and the thin
    // one are in the same essay.
    const wobble = overall + (random() - 0.5) * 1.6;
    paragraphs.push(pick(random, BODIES[topic][levelFor(wobble)]));
  }
  paragraphs.push(pick(random, CONCLUSIONS[level]));

  const forename = pick(random, FORENAMES);
  const surname = pick(random, SURNAMES);

  return {
    id,
    candidate: `${8000 + id * 7}`,
    name: `${forename} ${surname}`,
    form: pick(random, FORMS),
    paragraphs,
    wordCount: paragraphs.reduce((sum, p) => sum + countWords(p), 0),
    latent,
  };
}

/**
 * The set. Built once at module load from a fixed seed, so script 41 is the
 * same essay in every session, in every browser, forever — which is what makes
 * a saved mark still mean something after a reload.
 */
export const SCRIPTS: Script[] = (() => {
  const random = rng(0x5eed_1c41);
  const out: Script[] = [];
  for (let id = 1; id <= 124; id += 1) out.push(buildScript(id, random));
  return out;
})();

export const SCRIPT_BY_ID: Map<number, Script> = new Map(SCRIPTS.map((s) => [s.id, s]));

/** Full text with paragraph breaks, used for clip offsets. */
export function scriptText(script: Script): string {
  return script.paragraphs.join("\n\n");
}

/**
 * The order she marks in.
 *
 * Shuffled once, deterministically, and then fixed. Marking a set in register
 * order means the same names are read first every time and the same names are
 * read at eleven at night; shuffling is the cheapest correction for that, and
 * it is a real practice, not a feature invented here. Fixed rather than
 * re-shuffled per session so that "position 74" means one thing.
 */
export const MARKING_ORDER: number[] = (() => {
  const ids = SCRIPTS.map((s) => s.id);
  const shuffle = rng(0x51_9f_ac_11);
  for (let i = ids.length - 1; i > 0; i -= 1) {
    const j = Math.floor(shuffle() * (i + 1));
    [ids[i], ids[j]] = [ids[j], ids[i]];
  }
  return ids;
})();

import type { Task } from "../types";

/**
 * SETTING 8 — Practical Web Apps
 *
 * Every prompt here is written in the form the specification asks for — here is
 * a real person with a messy problem, design the software — rather than as a
 * parts list of sidebar, table, three buttons and a modal. The point is to
 * leave room for product reasoning, so none of these names a UI pattern.
 *
 * Each user was chosen because their problem has a structural feature that the
 * obvious generic app gets wrong: a fixed deadline with real lead times, income
 * that arrives at the wrong time, uncertainty that must be preserved rather
 * than resolved.
 */
export const PRACTICAL_APPS: Task[] = [
  {
    id: "practical-apps-project-management",
    applicationSetting: "practical-apps",
    typicalTask: "Task / Project Management",
    title: "Get-In",
    prompt: `Design software for a theatre production manager in the five weeks before an opening night.

Her situation: a mid-scale production, opening on a date that cannot move because tickets are sold. Around four hundred things have to happen, spread across set construction, costume, lighting, sound, props, cast and front of house. Many have hard dependencies — the set cannot be built in the theatre until the previous production's set is out, the lighting cannot be rigged until the set is in, the cast cannot rehearse on the set until it is safe, and the sound designer cannot finalise anything until they have heard the room. Several have long lead times she does not control: a hired lighting desk arrives on a specific day, a fabric order takes three weeks, a licence has to be approved.

The way she currently works is a large spreadsheet, a paper diary, four group chats and her own memory, and the thing she is actually afraid of is not forgetting a task but discovering on a Tuesday that something she needed to order two weeks ago is now going to make opening night impossible. Her real question, every morning, is: what is about to become unrecoverable?

She also has to communicate constantly with people who do not care about the whole plan. The costume supervisor wants to know what costume needs this week, not to navigate a project.

Design the software. Take seriously that the deadline is immovable, that slack is the scarce resource, that departments need different views of one truth, and that this is used at a technical rehearsal at eleven at night on a phone with one hand.

Do not design a generic board with columns. That pattern hides dependency and lead time, which are the entire problem here.`,
    abilityTags: [
      "Functional Logic",
      "Information Architecture",
      "State & Data",
      "Interaction Design",
      "Data Visualization",
      "Layout & Typography",
      "Robustness / Product Polish",
    ],
    resultRoute: "/r/practical-apps-project-management",
    status: "planned",
    blurb:
      "Five weeks to an immovable opening night: software that answers what is about to become unrecoverable, tracking real dependencies and lead times instead of columns.",
    direction:
      "The immovable deadline makes slack the scarce resource, so the app's central object is the critical path and its daily question is what is about to become unrecoverable — not what is in progress. A kanban board is explicitly refused because columns hide exactly the two things that matter here, dependency and lead time. Per-department views of one truth, usable one-handed at eleven at night.",
  },
  {
    id: "practical-apps-personal-finance",
    applicationSetting: "practical-apps",
    typicalTask: "Personal Finance",
    title: "Runway",
    prompt: `Design personal finance software for a freelance illustrator whose income is wildly irregular.

Her situation: she earns a decent annual amount, and it arrives in unpredictable lumps. A publisher pays sixty days after invoice, and sometimes ninety. A good month is eight thousand and a bad month is four hundred. She has committed monthly outgoings of about two thousand three hundred. She owes tax in two large payments a year, and she is chronically caught out by them because the money that should have been set aside was spent in a lean month. She has eleven thousand in savings and no idea whether that is comfortable or precarious.

The available software is all built for salaried people. It tells her she overspent on eating out in March, which she knows and does not care about, and it cannot answer either of the two questions she actually has. First: given what I have been promised and when it is likely to arrive, will I be able to pay my rent in March? Second: when a job comes in, how much of this is genuinely mine to spend, after tax and after the lean months it has to cover?

Her real problem is timing, not discipline. Budgets assume a monthly cycle she does not have.

Design the software. Take seriously that invoices are promises with dates and probabilities rather than income, that tax is a liability accruing continuously and payable in lumps, that the useful horizon is forward-looking, and that she needs to know whether to take an unattractive commission this month.

Nothing may be invented: no fabricated bank connections, no fake predictions dressed as certainties, and any estimate should be visibly an estimate.

Do not design a dashboard of spending-by-category pie charts. That is the thing that exists and does not answer her questions.`,
    abilityTags: [
      "Functional Logic",
      "State & Data",
      "Data Visualization",
      "Information Architecture",
      "Interaction Design",
      "Layout & Typography",
      "Robustness / Product Polish",
    ],
    resultRoute: "/r/practical-apps-personal-finance",
    status: "planned",
    blurb:
      "Finance software for lumpy freelance income: invoices as dated probable promises, tax accruing continuously, and one forward-looking answer — can I pay rent in March?",
    direction:
      "Her problem is timing, not discipline, which is why every salaried-user app fails her — the monthly budget cycle she is asked to inhabit does not exist. Treating invoices as dated promises with probabilities and tax as a continuously accruing liability reframes the whole model around cash-flow projection. Spending-by-category pie charts are named as the incumbent that answers neither of her real questions.",
  },
  {
    id: "practical-apps-crm",
    applicationSetting: "practical-apps",
    typicalTask: "CRM / Relationship Management",
    title: "Submissions",
    prompt: `Design software for a literary agent.

Her situation: she represents thirty-eight authors and deals with perhaps two hundred and forty editors across sixty imprints. At any time she has around twenty manuscripts out on submission, and each submission has a state that matters enormously — an editor who has had something for eleven weeks needs chasing, an exclusive read has an expiry, an offer starts a clock for everyone else, and an auction has to be run cleanly.

The relationships are the actual asset and they are long. She knows an editor who moved three houses in a decade, that a particular editor loves a specific kind of book and passed on something similar for a reason she should remember before submitting again, that two editors at the same imprint should not be approached simultaneously, and that one editor's assistant is now a commissioning editor and is worth cultivating. This knowledge is currently in her head, an unfathomable email archive, and a notebook.

Her authors, meanwhile, need reassurance and want to know what is happening without seeing the seven rejections in raw form.

What she wants is not a sales pipeline. Her deals are rare, slow, and not really a funnel; what she needs is memory. The question she has before every email is: what do I know about this person, and what happened last time?

Design the software. Take seriously that a person's history is the core object, that a rejection contains valuable intelligence rather than being a dead end, that editors move and the relationship follows the person rather than the imprint, and that discretion is professional obligation — some notes must never be visible to an author.

Do not design a sales CRM with deal stages and a forecast. Her business is memory, not conversion rate.`,
    abilityTags: [
      "Information Architecture",
      "State & Data",
      "Functional Logic",
      "Interaction Design",
      "Layout & Typography",
      "Robustness / Product Polish",
    ],
    resultRoute: "/r/practical-apps-crm",
    status: "planned",
    blurb:
      "A literary agent's memory rather than a pipeline: what do I know about this editor and what happened last time — with rejections treated as intelligence and clocks that matter.",
    direction:
      "Her business is memory, not conversion, so the core object is a person's history rather than a deal stage — which is why every sales CRM misfits. Rejections become the most valuable records instead of dead ends, and relationships follow the human when they change imprint. Discretion is modelled as a real requirement, since some notes must never be visible to the author they concern.",
  },
  {
    id: "practical-apps-scheduling",
    applicationSetting: "practical-apps",
    typicalTask: "Scheduling",
    title: "Peripatetic",
    prompt: `Design scheduling software for a peripatetic music teacher.

His situation: he teaches violin to sixty-one pupils across six schools, travelling between them. Each school gives him particular days, and within those days he can only see a pupil when that pupil is not in a lesson he cannot pull them out of — so his availability is constrained by six different school timetables, each with its own period structure and term dates, none of which he controls and all of which change.

It gets worse in the specifics. Some pupils share a thirty-minute slot as a pair, which only works if their levels match. Two schools are twenty-five minutes apart and he cannot teach either side of that gap. Exam candidates need more time in the eight weeks before an exam and less afterwards. Younger pupils cannot be taught last period because they are tired and it is wasted. One pupil can only be seen on Tuesdays. Ensembles need several pupils free simultaneously. And when a school changes its timetable in January, roughly forty of his arrangements break at once.

He currently does this with a paper grid, six emails and about six hours of work each term, and he gets it wrong every time in a way that surfaces as an angry parent.

He also has to communicate the result: sixty-one families, each of whom needs to know only their own lesson time and to be told immediately when it changes.

Design the software. Take seriously that this is a genuine constraint problem with hard and soft constraints, that a full solve is neither necessary nor desirable because he has judgement a solver does not, that the interesting moment is a change breaking forty things at once, and that he uses this in a corridor between lessons.

Do not design a calendar with drag-and-drop events. A calendar cannot express the constraints, so it silently lets him build an impossible timetable.`,
    abilityTags: [
      "Functional Logic",
      "State & Data",
      "Information Architecture",
      "Interaction Design",
      "Data Visualization",
      "Robustness / Product Polish",
      "Layout & Typography",
    ],
    resultRoute: "/r/practical-apps-scheduling",
    status: "planned",
    blurb:
      "Sixty-one pupils across six school timetables he doesn't control: hard and soft constraints made explicit, so a January timetable change shows exactly what it broke.",
    direction:
      "This is a real constraint-satisfaction problem, and the design insight is that a full automatic solve is the wrong goal — he has judgement a solver lacks, so the software's job is to make constraints explicit, propose, and show consequences. The designed moment is a school timetable change breaking forty arrangements at once. A drag-and-drop calendar is refused because it cannot express constraints and so permits impossible timetables.",
  },
  {
    id: "practical-apps-document-processing",
    applicationSetting: "practical-apps",
    typicalTask: "Document / Data Processing",
    title: "Register",
    prompt: `Design software for a historian transcribing nineteenth-century parish registers into structured data.

Her situation: she is working through about four thousand baptism, marriage and burial entries from three parishes between 1813 and 1871, photographed from the originals. The handwriting varies by incumbent and some of it is very bad. The paper is damaged. Spelling is unstandardised, and the same family appears as Whitaker, Whittaker and Whitacre across three decades — sometimes because the clerk spelled it differently and sometimes because they are different families. Occupations are abbreviated in ways that were obvious then and are not now. Dates are occasionally impossible. Some entries have been amended later in a different hand.

Her central problem is that she frequently cannot be certain, and the tools available force her to be. A spreadsheet cell holds "Whitaker" or it does not; it has no way to record that the surname is probably Whitaker, that the third letter is obscured by a stain, that she is confident about the year and guessing at the day, or that a later hand has altered the entry. So she keeps a parallel document of caveats, which immediately falls out of sync, and by the time she publishes she cannot reconstruct why she made a given reading.

This matters because other researchers will build on her data, and a confident-looking dataset that silently contains guesses is actively harmful to scholarship.

Design the software. Take seriously that uncertainty must be recorded rather than resolved, that a transcription must remain linked to the image region it came from, that she works for four hours at a time and speed genuinely matters, that later evidence should let her revise an earlier reading without losing the original, and that the output must be publishable in a form other scholars can evaluate and cite.

Nothing may fabricate a reading. If the software suggests anything, its suggestions must be unmistakably distinguishable from her judgements.`,
    abilityTags: [
      "Functional Logic",
      "State & Data",
      "Information Architecture",
      "Interaction Design",
      "Educational Correctness",
      "Export / Reusability",
      "Robustness / Product Polish",
    ],
    resultRoute: "/r/practical-apps-document-processing",
    status: "planned",
    blurb:
      "Transcription software where uncertainty is data: partial readings, confidence per field, linkage back to the image region, and revision history a later scholar can evaluate.",
    direction:
      "The failure of every existing tool is that a cell must hold a value or nothing, forcing false certainty and pushing caveats into a document that desynchronises. Making uncertainty a first-class recordable property — per field, with provenance back to the image region — is the whole design. Any machine suggestion must be visibly distinguishable from her judgement, because a confident dataset containing silent guesses damages scholarship.",
  },
  {
    id: "practical-apps-analytics",
    applicationSetting: "practical-apps",
    typicalTask: "Analytics",
    title: "Shelf",
    prompt: `Design analytics software for the owner of an independent bookshop.

His situation: one shop, about nine thousand titles in stock, roughly two hundred and forty of which he can display face-out where they sell several times better. He has three years of till data. His margin is thin, his cash is tied up in stock, and returns to publishers are possible but costly and limited.

His problem is not that he lacks data; his till system exports plenty. It is that every analytics tool he has tried tells him things he already knows — that the new hardback release sold well in November, that Christmas is busy — and none of them help with the decisions he actually makes. Those decisions are almost all about the long tail and about space. Which of these two hundred titles that have not sold in fourteen months should go back. Whether the poetry section, which loses money per square metre, is worth keeping. Whether the local-history table earns its position. How many of a forthcoming title to order, knowing overordering costs cash and underordering costs a sale he never sees. Which titles sell only when face-out, meaning their sales are a property of his display rather than of demand.

The last one matters most and is the hardest, because his data cannot distinguish a book nobody wants from a book nobody saw.

Design the software. Take seriously that the unit of scarcity is shelf space rather than money, that the useful output is a small number of specific recommended actions rather than charts, that his data has real blind spots and the software must be honest about them rather than papering over them, that a wrong recommendation costs him real money, and that he will use this for twenty minutes on a Sunday.

Do not design a dashboard of revenue charts. He can already see that revenue is flat; the question is what to do on Monday.`,
    abilityTags: [
      "Data Visualization",
      "Functional Logic",
      "Information Architecture",
      "State & Data",
      "Interaction Design",
      "Layout & Typography",
      "Robustness / Product Polish",
    ],
    resultRoute: "/r/practical-apps-analytics",
    status: "planned",
    blurb:
      "Analytics that end in decisions, not charts: which of these two hundred slow titles go back, whether poetry earns its metre, and which books only ever sell face-out.",
    direction:
      "Reframing the scarce resource from money to shelf space changes every question the tool asks, and it is the reason revenue dashboards are useless to him. The hardest and most valuable feature is honesty about a genuine blind spot — the data cannot distinguish a book nobody wants from one nobody saw — so the software surfaces that rather than papering over it. Output is a short list of Monday actions.",
  },
  {
    id: "practical-apps-workflow-automation",
    applicationSetting: "practical-apps",
    typicalTask: "Workflow Automation",
    title: "Intake",
    prompt: `Design workflow software for a small animal rescue that runs on volunteers.

The situation: they take in about six hundred cats a year. Each one moves through a sequence — intake, vet assessment, quarantine, vaccination and neutering with real minimum intervals between them, foster placement, adoption listing, home check, adoption, and a follow-up. It is run by two part-time staff and fifty-odd volunteers who each do a few shifts a month.

Their failures are almost never decisions and almost always dropped handoffs. A cat's second vaccination is due and the volunteer who knew that is on holiday. A foster carer was never told the cat is on medication. A home check was done and the result never recorded, so the adoption stalls for three weeks. A cat sits in quarantine four days longer than necessary because nobody noticed the vet had cleared it. Every one of these is a step that had no owner at the moment it became due.

The important constraint is that the humans cannot be replaced by automation. Volunteers are unpaid, use their own phones, will not learn a complex system, forget passwords, and drift in and out. Any design that depends on everyone being diligent will fail, because that is precisely what is already failing.

So the automation has to be about making sure the right human is prompted at the right time with the right context, and about making the state of every animal visible enough that a dropped step is noticed by someone else.

Design the software. Take seriously that steps have real medical constraints with hard intervals, that a task with no owner is the actual failure mode, that a volunteer arriving for a shift needs to know what to do in fifteen seconds, that this must work on an old phone in a noisy room with poor signal, and that an animal's welfare depends on it.

Do not design a node-graph automation builder. Nobody here will ever configure a trigger.`,
    abilityTags: [
      "Functional Logic",
      "State & Data",
      "Information Architecture",
      "Interaction Design",
      "Robustness / Product Polish",
      "Layout & Typography",
    ],
    resultRoute: "/r/practical-apps-workflow-automation",
    status: "planned",
    blurb:
      "Automation aimed at dropped handoffs rather than data: every due step has an owner, a volunteer knows their next action in fifteen seconds, and nothing waits on one person's memory.",
    direction:
      "Their failures are handoffs, not decisions, so the automation targets ownership of a due step rather than moving records between systems. The binding constraint is that volunteers cannot be made diligent — any design assuming they can is already the thing failing — which forces context to be pushed to whoever is present. A node-graph trigger builder is refused outright; nobody here will ever configure one.",
  },
  {
    id: "practical-apps-inventory",
    applicationSetting: "practical-apps",
    typicalTask: "Inventory / Resource Management",
    title: "Stockroom",
    prompt: `Design inventory software for the stockroom of a university teaching laboratory.

The situation: a technician manages roughly one thousand four hundred chemical containers supporting eleven undergraduate practical courses. Her job has constraints that ordinary inventory software knows nothing about. Reagents expire, and some become genuinely dangerous with age rather than merely ineffective — old peroxide-forming ethers are a real hazard. Incompatible substances cannot share a cabinet, and the compatibility rules are a matrix rather than a list. Certain items are controlled and require a legally-defensible audit trail of every gram. Storage capacity is a hard physical constraint per cabinet, per hazard class.

Her demand is highly predictable in aggregate and extremely spiky in practice: the same eleven courses run every year in the same order, and one practical consumes four months of a particular reagent in a single afternoon with two hundred students. So she is ordering against a known timetable, with lead times, minimum order quantities that often exceed what she can legally store, and a budget by financial year that does not align with the academic one.

What she is actually afraid of is a specific afternoon: two hundred students arriving for a practical and a reagent not being there, which cannot be fixed and cannot be rescheduled.

Design the software. Take seriously that this is a safety and compliance system as much as a stock system, that the compatibility and capacity rules must be enforced rather than advised, that demand is derived from a teaching timetable rather than forecast statistically, that an audit must be reconstructible years later, and that she needs to know today what to order for a practical in eleven weeks.

Nothing may invent safety data. If a hazard classification or a compatibility rule is present, it must be attributable to a real published source, and anything unverified must be visibly marked as such.`,
    abilityTags: [
      "Functional Logic",
      "State & Data",
      "Information Architecture",
      "Data Visualization",
      "Interaction Design",
      "Robustness / Product Polish",
      "Educational Correctness",
    ],
    resultRoute: "/r/practical-apps-inventory",
    status: "planned",
    blurb:
      "A teaching lab stockroom where compatibility and capacity are enforced rather than advised, demand comes from the timetable, and the audit trail survives a regulator years later.",
    direction:
      "This is a safety and compliance system wearing inventory clothing, which is why generic stock software fails: its rules are advisory and these must be enforced. Demand is derived from a known teaching timetable rather than statistically forecast, which is both easier and more accurate. Safety data must be attributable to a real source, with anything unverified visibly marked, because invented hazard rules would be dangerous.",
  },
  {
    id: "practical-apps-professional-tool",
    applicationSetting: "practical-apps",
    typicalTask: "Professional Workflow Tool",
    title: "Marking",
    prompt: `Design a tool for a secondary school English teacher marking a set of essays.

Her situation: a hundred and twenty-four essays on the same question, to be marked against a five-strand rubric, returned within two weeks, while teaching a full timetable. She marks in evenings, in sittings of about ninety minutes.

The problems are specific and well known to anyone who has done this. Her standards drift: essays marked at ten at night on a Thursday get different marks from the same work marked on a Sunday morning, and she knows it. Her early marking is inconsistent with her later marking, because she calibrates as she goes and cannot easily revisit. She writes the same eleven comments hundreds of times, which is a waste of her expertise and also produces feedback students correctly perceive as generic. The feedback that would actually help a student is specific to their essay, and she has roughly four minutes per essay. She has to justify her marks at moderation, where a colleague samples her marking and challenges it, and she often cannot reconstruct why she gave a particular mark. And she knows, uncomfortably, that the order she marks in and her mood affect a young person's grade.

To be clear about scope: this is not a tool that marks essays. It is a tool that helps a human mark well. Nothing in it may generate a mark, generate feedback, or judge student writing.

Design it. Take seriously that consistency across a large set is the central technical problem, that comment reuse must not produce generic feedback, that her judgement must remain auditable at moderation, that four minutes is the real budget, and that the output is read by a fifteen-year-old who will mostly look at the number and needs to be given a reason to read the rest.

Do not design a grading dashboard for administrators. This is a tool for the person doing the work.`,
    abilityTags: [
      "Functional Logic",
      "Information Architecture",
      "State & Data",
      "Interaction Design",
      "Layout & Typography",
      "Robustness / Product Polish",
      "Narrative / Communication",
    ],
    resultRoute: "/r/practical-apps-professional-tool",
    status: "planned",
    blurb:
      "A hundred and twenty-four essays, four minutes each: the tool fights marker drift, makes reused comments specific, and keeps her reasoning auditable at moderation.",
    direction:
      "Consistency across a large set is the real technical problem, and it is one software can genuinely help with — comparative calibration and re-review of early marking address a known human failing rather than replacing judgement. The scope boundary is deliberate and absolute: nothing generates a mark or a comment, because a tool that judges student writing is a different and worse product.",
  },
];

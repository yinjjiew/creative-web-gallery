import type { DiagramDoc, DispatchDoc, FeatureDoc, InterviewDoc } from "./types";

export const afterStorm: DispatchDoc = {
  dateline: "Lea valley, Wednesday, 12 March · 07:40, the morning after",
  blocks: [
    {
      t: "p",
      text: "The pumping station ran all night and still opened the overflow at 5:40. That is the sentence on the whiteboard in the mess room, written in a marker that has been dying since January. Storm Kathleen had a name, which means the press had a name to put on the water. The men in the mess room had a different name for it: a night that used everything and was still not enough.",
    },
    {
      t: "p",
      text: "I arrived after the gate had closed. The compound was a lake with a building in it. A diesel pump on a trailer was still going, doing a job the electric pumps had already done, because nobody had told it to stop and the man who would have told it was on his second breakfast. The event-duration monitor would show the overflow. It would not show the trailer.",
    },
    {
      t: "p",
      text: "What a named storm does to a combined network is simple arithmetic wearing a costume. The costume is the wind and the fallen tree on the access road. The arithmetic is millimetres of rain on impermeable ground, arriving in a pipe that is also carrying Tuesday’s sewage, and a works that can take a multiple of dry flow and not a multiple of this. When the multiple is exceeded the gate opens. The gate is not a failure of nerve. It is the last correct decision in a sequence of correct decisions that began when the estate was built without enough storage.",
    },
    {
      t: "p",
      text: "At eight a supervisor walked the wet yard and named the things that had held: the screens, the standby pump, the telemetry that had told them the level was coming. Then he named the thing that had not: a flap valve on a small outfall that had jammed with a plastic sack and given them a second, unofficial overflow into a ditch. That one will not be on the dashboard. It will be on a job sheet, if the job sheet survives the week.",
    },
    {
      t: "p",
      text: "The storm will have a parliamentary question. The ditch will not. Both are the system.",
    },
  ],
};

export const sewer: FeatureDoc = {
  toc: [
    { id: "map", label: "The map" },
    { id: "four", label: "Four owners" },
    { id: "smell", label: "The smell" },
  ],
  notes: [
    {
      n: 1,
      text: "The distinction between a public sewer, a private sewer, a lateral drain and a highway drain is set out in the Water Industry Act 1991 and in Ofwat and water-company guidance on transfer. The 2011 private sewer transfer moved a great many pipes onto company books; it did not move all of them, and it did not make the map agree with the ground.",
    },
    {
      n: 2,
      text: "The terrace, the smell and the conversations are a composite of cases reported to the Local Government and Social Care Ombudsman and of typical drainage disputes in inner London. No single address is identified.",
    },
  ],
  blocks: [
    {
      t: "p",
      drop: true,
      text: "Under a terrace in south London there is a pipe that three households, a water company and a borough all believe is someone else’s. The pipe is real. The disagreement is about a line on a map that was drawn in 1962, redrawn in 2011 when private sewers were transferred, and then argued over in emails that use the words ‘lateral’, ‘public’ and ‘highway drain’ as if they were places you could stand.{{1}}",
    },
    {
      t: "p",
      text: "I spent three weeks on this pipe because it is the smallest version of a question the industry prefers to answer at the scale of a city: who owns the thing that carries the waste away, and what happens when the answer is a committee. The smell is the thing that makes the question urgent. The map is the thing that makes it unending.{{2}}",
    },

    { t: "h2", id: "map", text: "The map" },
    {
      t: "p",
      text: "The water company’s GIS shows a public sewer in the road, a lateral coming off it toward number 42, and then a blank. The borough’s highway record shows a drain taking the road gully, and a note that the gully ‘may interconnect’. The deeds of number 42 mention a ‘shared drainage’ with 40 and 44, in a clause that was copied from a 1930s precedent and never surveyed. The man at number 44 has a drawing his surveyor made in 2019, in pencil, that shows the pipe under the back yard of 42 and then under the alley. The alley is unadopted. Unadopted is a word that means nobody wanted the bill.",
    },
    {
      t: "figure",
      id: "sewer",
      caption:
        "The same thirty metres of pipe, drawn four times from four records. The disagreements are the white gaps. Nothing in this figure is a measured survey; it is a picture of what the paperwork thinks.",
    },
    {
      t: "p",
      text: "In 2011 the private sewer transfer was supposed to end a class of these arguments by moving the pipes at the back of houses onto the companies. It moved a class. It did not move the laterals in every configuration, and it did not move highway drains, and it did not update every drawing. The result is a modern customer journey bolted onto an Edwardian diagram. You ring a number. A person who is kind, and who cannot see the alley, books a crew. The crew arrives, lifts a cover that is not the cover, and writes ‘no fault found on public system’. That sentence is often true. It is also, from the yard of number 42, the beginning of the next six months.",
    },

    { t: "h2", id: "four", text: "Four owners" },
    {
      t: "p",
      text: "Call them A, B, C and the road. A is the company, which owns the sewer in the street if the sewer in the street is a public sewer, which it probably is. B is the borough, which owns the gully and the pipe from the gully if that pipe is a highway drain, which it might be. C is the three freeholders, who own whatever is left, jointly, in a way that none of their mortgages mentioned in words a person would notice. The road owns nothing and receives everything that escapes.",
    },
    {
      t: "p",
      text: "Each owner has a test for whether the pipe is theirs. The company’s test is the record and the point of discharge. The borough’s test is whether the water in the pipe is ‘highway water’. The freeholders’ test is whether a letter has arrived with their name on it. None of these tests can be performed on the smell. The smell does not care who paid for the pipe. The smell is a mixture of a slow blockage, a cracked joint, and a gully that backflows when the sewer in the street is full. Fixing it requires someone to accept a metre of ownership long enough to put a camera in.",
    },
    {
      t: "pull",
      text: "The smell does not care who paid for the pipe.",
    },
    {
      t: "p",
      text: "I sat in a meeting, in the fourth week, at which a company technician, a borough highways officer and the owner of 42 put three printouts on a table and tried to make the lines agree. They did not agree. They agreed, after an hour, to a joint camera survey ‘without prejudice’, which is lawyer for we will look but we will not admit that looking is our job. The camera found the blockage under the alley. The alley, as noted, is unadopted.",
    },
    {
      t: "sidebar",
      title: "A glossary that is also a trap",
      text: "Sewer: a pipe that serves more than one property, or that the company has agreed to adopt. Drain: a pipe that serves one. Lateral drain: the bit from the property boundary to the sewer. Highway drain: takes the road, not the house. Private sewer, pre-2011: often the pipe along the backs. The trap is that a pipe can satisfy two of these at once depending on which end you start from, and that ‘adopted’ is a legal event, not a visible one.",
    },

    { t: "h2", id: "smell", text: "The smell" },
    {
      t: "p",
      text: "Number 42 has a child who will not play in the yard. That is the fact that does not appear on the GIS. The blockage under the alley was cleared on a Thursday by a contractor the three freeholders paid for, splitting the bill in a WhatsApp group, because waiting for the ownership to resolve would have been another winter. The company later accepted a length of the pipe as public, after the camera survey and a letter from a councillor. The borough did not accept the gully interconnection. The gully still backflows in heavy rain. The smell is better. It is not gone.",
    },
    {
      t: "p",
      text: "This is not a story about a villain. It is a story about a system that was built to move water and then asked, a century later, to move liability with the same precision. The water is the easy part. The water goes downhill. The liability goes to whoever cannot prove that the downhill is not theirs.",
    },
    {
      t: "p",
      text: "I walked the alley on the last morning. A new cover, paid for by 42, 40 and 44. A mark in chalk from the camera crew. A gully in the road that still had a leaf in it. The map will catch up, or it will not. The child was in the yard. That is the only metric the pipe understands.",
    },
  ],
};

export const heat: DiagramDoc = {
  figure: "heat",
  lede: "A district-heating network from the energy centre to a fifth-floor radiator, with the losses marked where they actually occur. Figures are typical of a recent London communal scheme, not a named block.",
  blocks: [
    {
      t: "p",
      text: "District heat is sold as a straight line: a boiler, a pipe, a radiator. The line is real. The heat that leaves the boiler is not the heat that arrives in the room, and the difference is the last mile — the part of the system that is too short to make a speech about and long enough to waste a winter.",
    },
    {
      t: "h3",
      text: "1 · The energy centre",
    },
    {
      t: "p",
      text: "A gas boiler, or a heat pump, or a combination that looks like a policy. The flow temperature is set high enough for the worst flat on the coldest day. That sentence is how networks become inefficient: they are designed for a Tuesday in January and then run that way in October.",
    },
    {
      t: "h3",
      text: "2 · The buried main",
    },
    {
      t: "p",
      text: "Pre-insulated steel, if the scheme is recent; something less proud if it is not. Loss here is continuous and mostly honest — watts per metre, published in a datasheet. A long run to a small load is a long leak. The map of the estate is therefore a thermal argument, not just a civil one.",
    },
    {
      t: "h3",
      text: "3 · The riser",
    },
    {
      t: "p",
      text: "Inside the block the pipe is no longer a datasheet. It is a cupboard, a boxing-in, a length that was rerouted around a beam. Insulation is cut for fittings and not replaced. This is where a surprising fraction of the heat goes: not into the ground, into the corridor.",
    },
    {
      t: "h3",
      text: "4 · The heat interface unit",
    },
    {
      t: "p",
      text: "The box in the cupboard that is the tenant’s boiler-that-isn’t. If it is set wrong, or if the keep-warm function runs because the main is slow, it sips heat all day to be ready for a tap. Ready is comfortable. Ready is also the bill.",
    },
    {
      t: "h3",
      text: "5 · The radiator",
    },
    {
      t: "p",
      text: "The last metre. A thermostatic valve that works, or one that has been painted over. The room gets warm. The network, from here, looks like a success. The losses that made it expensive happened four numbers ago, in places the tenant cannot see and the bill does not itemise.",
    },
  ],
};

export const substation: DispatchDoc = {
  dateline: "Outer London, 33 kV compound · 3 April, 21:10–01:05",
  blocks: [
    {
      t: "p",
      text: "The lights are on everywhere except here. A fault on the 33 kV has taken the compound dark and left the streets it feeds lit from the other direction, which is the point of a network and also the reason a substation at night can feel like a mistake: the city is fine, and this place is not.",
    },
    {
      t: "p",
      text: "Four of us, if you count me, which the men on the job did not. A senior authorised person, a jointer, a trainee who held the lamp. The fault was a joint that had decided, after fifteen years, to be a joint no longer. Finding it was a matter of a protection indication, a walk, and the smell of burnt polymer, which is a smell you only need to be taught once.",
    },
    {
      t: "p",
      text: "They isolated, earthed, and proved dead in an order that is a ritual because the alternative is not a ritual. I was told where to stand. I stood there. The work itself was unphotogenic: a hole, a cut, a new joint made with the patience of someone who has seen what impatience looks like on a board. At ten to one the compound was still dark and the streets were still lit. They would back-feed this place in the morning. The night was for making sure the morning had something safe to switch.",
    },
  ],
};

export const nightDesk: InterviewDoc = {
  subject: "A control-room engineer, nights, speaking for herself",
  setting:
    "A national or regional control room. The hour between two and three. The interviewee asked not to be identified by employer. The hour, the physics and the habits are not composite.",
  turns: [
    {
      q: "What is the hour between two and three actually for?",
      a: [
        "It is for the country being light. Demand is down. Some of the plant that was holding the evening has come off. The interconnectors are on whatever schedule last night’s traders left us. Frequency is usually polite. That is when a single trip is most embarrassing, because there is less on the system to absorb it and because nobody outside this room believes anything happens at two.",
      ],
    },
    {
      q: "What do you watch when nothing is happening?",
      a: [
        "The slope, not the number. A number that is 50.02 and climbing slowly is a different sentence from 50.02 that just arrived there. I watch the plant we have asked to be in frequency response, to see if it is actually doing it. I watch the weather on the North Sea because a wind forecast that is wrong at two is still wrong at six, and six is when the country gets up. I drink tea that is too strong. That is also watching.",
      ],
    },
    {
      q: "Has the job changed.",
      a: [
        "The screens have. The physics has not. We have more things that can move quickly — batteries, some of the demand — and fewer things that spin. So the room is twitchier. A trip that would have been a shrug in 2004 is a conversation now. The conversation is better than the shrug. I would like it if the public story of the grid included the shrug and the conversation, not just the blackout that did not happen.",
      ],
    },
    {
      q: "What would you want a reader to understand, if they understand only one thing?",
      a: [
        "That the system is being balanced by people looking at it. Not only by people — the automatic response is faster than we are — but the automatic response is a set of contracts someone wrote, and someone is awake to see whether the contracts are telling the truth. The night desk is that someone. We are not heroes. We are the continuity. The country is light. We keep it that way until the kettles.",
      ],
    },
  ],
};

import type { FeatureDoc } from "./types";

/**
 * Long reported feature. Written at reading length so the measure, sidenotes,
 * pull quotes and tables can be judged against real prose.
 *
 * Sources for measurements: Drinking Water Inspectorate annual reports;
 * Thames Water AMP documents; Metropolis Water Act 1852 (public statute).
 * Shift dialogue and some access detail are reconstructed from typical
 * practice at a large surface-water works and are marked in the notes.
 */
export const river: FeatureDoc = {
  toc: [
    { id: "intake", label: "The intake" },
    { id: "train", label: "The train" },
    { id: "night", label: "The night" },
    { id: "lab", label: "The laboratory" },
    { id: "left", label: "What is left" },
    { id: "rebuild", label: "The rebuild" },
  ],
  notes: [
    {
      n: 1,
      text: "Hampton Water Treatment Works was begun by the Grand Junction Waterworks Company in the 1850s, after the Metropolis Water Act 1852 forbade the taking of London drinking water from the tidal Thames. Capacity figures in company literature have long been given around 700 million litres a day. That is a design number, not a daily average.",
    },
    {
      n: 2,
      text: "The West London reservoir chain — including the Queen Mary, Queen Elizabeth II, Wraysbury, Knight and Bessborough reservoirs — stores Thames water before treatment. Hampton sits beside the older Stain Hill reservoirs. The geography here is reconstructed from published maps and Thames Water site descriptions, not from a commissioned survey.",
    },
    {
      n: 3,
      text: "Coagulant choice at London surface-water works has historically been ferric sulphate or aluminium sulphate. The precise current chemical, dose and supplier at Hampton are operational details Thames Water does not publish. The doses given later in this piece are typical ranges from UK water-industry practice, not leaked set-points.",
    },
    {
      n: 4,
      text: "Drinking Water Inspectorate guidance treats turbidity leaving a works as a critical control. A common operational aim is well below 0.1 NTU; the regulatory standard is looser. Figures in the table are typical treated-water values from DWI reporting, not a reading taken on a named day at Hampton.",
    },
    {
      n: 5,
      text: "The night-shift conversations are reconstructed. The jobs, the alarms and the order of the work are real; the spoken lines are written from how operators talk about this work, not from a recorded interview on a named night.",
    },
    {
      n: 6,
      text: "Plumbosolvency dosing with orthophosphoric acid is standard across much of the UK distribution network because of remaining lead communication pipes. It is not unique to Hampton.",
    },
  ],
  blocks: [
    {
      t: "p",
      drop: true,
      text: "The river arrives at Hampton already decided. It has come down from the Cotswolds, through the locks, past the paper mills that are no longer mills, and it has sat in a reservoir long enough for the silt to give up. What comes over the weir at four in the morning is not the Thames of postcards. It is a brown, cold, slightly sweet-smelling volume of water that two million people will drink by the afternoon, and the job of the works is to make that sentence ordinary.{{1}}",
    },
    {
      t: "p",
      text: "I spent four weeks at the works in late summer, walking the same concrete each morning, sitting in the control room through a night, and standing on the filter gallery when a bed was being washed. Thames Water did not embed me. The site is visible from the towpath, the process is in the textbooks, and the people who run plants like this talk, if you stay long enough and do not ask them to be characters. What follows is reported from that month, from the published record, and from the ordinary knowledge of a trade that has been doing this in this reach of the river for a hundred and seventy years.{{2}}",
    },
    {
      t: "p",
      text: "Hampton is not a secret. It is a Victorian idea that has been rebuilt four times without ever quite being replaced. The original company buildings still sit on the road like a civic statement: we will take the river, and we will give it back as something you do not have to think about. Everything behind them is a negotiation between that promise and the chemistry of a surface water in a crowded catchment.",
    },

    { t: "h2", id: "intake", text: "The intake" },
    {
      t: "p",
      text: "The works does not drink the river directly. It drinks the reservoirs, and the reservoirs drink the river when the river is in the right mood. In a dry August the pumps at the intake run less. In a wet February they run more, and the reservoirs rise, and someone in a different building starts a sentence about raw-water quality. The sentence is always the same: how much of what we do not want came down with the rain.",
    },
    {
      t: "p",
      text: "What we do not want has a short list and a long one. The short list is silt, algae, colour, ammonia, pesticides from a catchment that is still farmed, and the microbes that live in a river used by boats, dogs and sewage works upstream. The long list is everything else a modern laboratory can find if it looks: traces of medicines, industrial solvents, the ghost of a spill from 1998 that is still in a report. The works is built for the short list. The long list is a political argument wearing a laboratory coat.",
    },
    {
      t: "p",
      text: "On the first morning I was there the raw water coming onto the site was the colour of weak tea and the temperature was sixteen degrees. A man who has been on this plant for thirty-one years — I will call him D., because he did not ask to be named — put two fingers on the sample tap and said, without looking at me, that it was a good day. A good day means the reservoirs have settled, the algae have not bloomed, and the dose will be boring. Boring is the highest compliment a treatment works can be paid.",
    },
    {
      t: "pull",
      text: "Boring is the highest compliment a treatment works can be paid.",
    },
    {
      t: "p",
      text: "The sample tap is a short brass pipe in a tiled room that smells of damp concrete and the particular sweetness of raw Thames. The water comes out at pressure and hits a stainless sink. D. fills a glass jar, holds it to the window, and tilts it. He is looking at colour, not at a number. The number will come from a turbidimeter on the raw-water line, and it will be logged, and it will matter. But the first decision is still a man looking at a jar against daylight, which is how this job was done when the building was new.",
    },
    {
      t: "sidebar",
      title: "Why the works is here",
      text: "The Metropolis Water Act 1852 forbade companies from taking drinking water from the Thames below Teddington Lock — the tidal limit — after the river in central London had become a sewer in all but name. The west-London works, Hampton among them, are the geographical consequence of that statute: far enough upstream to be legal, close enough to the city to be pumped. The cholera argument was won with a map and a lock, not with a treatment plant. Treatment came later, as a second apology.",
    },

    { t: "h2", id: "train", text: "The train" },
    {
      t: "p",
      text: "Every surface-water works in this country is a sentence with the same grammar. Screen. Coagulate. Flocculate. Settle, or float. Filter. Disinfect. Put it in a pipe. The vocabulary is nineteenth-century chemistry wearing twentieth-century steel, and the twenty-first century has added ozone, carbon and a great many sensors without changing the order of the words. Hampton is that sentence, spoken in a particular accent.{{3}}",
    },
    {
      t: "figure",
      id: "train",
      caption:
        "The process train at a large Thames surface-water works, drawn from the standard sequence rather than from a restricted site plan. Volumes and residence times are typical, not Hampton’s operating set-points.",
    },
    {
      t: "p",
      text: "Screening is unromantic and non-negotiable. Leaves, plastic, the occasional fish, a surprising amount of wet wipe from somewhere upstream. The screens are raked. The rake dumps its catch into a skip that smells of the river at low water. Nobody writes about the skip. If the screens stop, everything downstream is trying to treat the Thames with the packaging still in it.",
    },
    {
      t: "p",
      text: "Coagulation is the first thing that looks like chemistry. A metal salt — ferric, or alum — is dosed into the water so that the particles which would otherwise stay suspended lose their reason for staying apart. The dose is small and the effect is immediate if you know what you are looking at. The water goes from tea to a kind of dirty milk, and then, if the pH is right and the mixing is right, the milk begins to think about becoming snow. That is flocculation: slow stirring, long enough for the destabilised particles to find each other and grow heavy. A good floc is the size of a grain of couscous and the colour of rust. A bad floc is a haze that will not sit down, and a bad floc at eight in the morning is a conversation that lasts until Thursday.",
    },
    {
      t: "p",
      text: "The clarifiers at a works of this age are great concrete tanks with hopper bottoms, or, in the bays that have been rebuilt, dissolved-air flotation cells that lift the floc to the surface on a foam of microbubbles and scrape it off like a skin. Both do the same job: take the dirt out as a sludge and send the clearer water on. Standing on the walkway above a flotation cell is one of the few moments at which the process is visible as a process. You can see the dirt deciding to leave.",
    },
    {
      t: "p",
      text: "Then the filters. Rapid gravity filters — sand, sometimes with anthracite on top — are beds the size of a small barge, and there are many of them, because a filter that is washing is a filter that is not working, and a works this size cannot afford to have too many of them out at once. Water falls through the sand. What is left in the sand is what the clarifier did not catch. Every so often the bed is washed: air, then water, then a dirty surge that goes back to the head of the works to be treated again. Watching a filter wash is like watching a carpet being beaten. The dirt that was invisible becomes a brown cloud, and then it is gone, and the bed is theoretically clean.",
    },
    {
      t: "p",
      text: "I stood on the gallery during a wash in the third week. The air scoured first, a low industrial cough through the pipework, and the surface of the bed boiled. D. did not watch it. He watched the gauges. “If it boils even, it’s a filter,” he said. “If it boils in one corner, it’s a problem wearing a filter’s clothes.”",
    },
    {
      t: "p",
      text: "After the filters the water is, by the standards of a river, astonishingly clear, and by the standards of a glass it is not yet finished. Disinfection is chlorine, with a contact tank large enough that the water has to sit with the dose for a defined time before anyone is allowed to call it potable. Some London works have ozone and granular activated carbon in the train as well, for taste and for the things chlorine is not elegant at destroying. Whether a given bay at Hampton is running carbon on a given day is an operational fact I am not going to invent. The principle is public: chlorine is the last word, and the last word has to have time to be spoken.{{4}}",
    },
    {
      t: "table",
      caption:
        "Typical values for water leaving a large English surface-water works, assembled from Drinking Water Inspectorate reporting and industry practice. Not a sample from a named day at Hampton.",
      heads: ["Parameter", "Typical leaving works", "Why it is watched"],
      rows: [
        ["Turbidity", "< 0.1 NTU", "Proxy for filtration; a spike is a cryptosporidium conversation"],
        ["Free chlorine", "0.3–0.5 mg/l", "Must persist into the network without tasting of a swimming pool"],
        ["pH", "7.2–7.8", "Set for disinfection and for the lead pipes still in the ground"],
        ["Aluminium / iron", "well below standard", "Residual of the coagulant; a rise means the dose or the pH has slipped"],
        ["Coliforms", "0 in 100 ml", "The legal sentence. Anything else is an incident."],
        ["Nitrate", "below 50 mg/l", "A catchment number more than a process number"],
      ],
    },
    {
      t: "p",
      text: "There is one more chemical, and it has nothing to do with making the water safe today and everything to do with the city’s remaining lead. Orthophosphate is dosed so that a film forms inside old communication pipes and the lead stays in the pipe instead of in the kettle. It is a national policy wearing a local dose. The works did not invent the lead, and it cannot take the lead out of the ground. It can only send a chemical downstream to argue with it.{{6}}",
    },

    { t: "h2", id: "night", text: "The night" },
    {
      t: "p",
      text: "A treatment works at night is quieter than a factory and louder than an office. The pumps have a frequency you stop hearing after twenty minutes. The control room is a long desk, a wall of screens, and a kettle that is never quite empty. On the Thursday I sat through, two operators held the plant from eleven until seven. One watched the works. One watched the alarms that belong to the works but are really about the network — a burst in a trunk main, a reservoir that is dropping faster than it should, a contact tank whose residual has started to wander.{{5}}",
    },
    {
      t: "p",
      text: "Nothing dramatic happened. That is the point of the night, and it is also why nights are hard to report. The drama of water treatment is a drama of not happening. A turbidity analyser on filter 7 ticked up by a number you would not notice in a kitchen and the operator opened the trend, watched it for four minutes, and reduced the flow through that bay by a fraction. The number came back. He did not write a novel about it. He wrote a line in the log: 02:17 F7 turbidity, flow eased, recovered.",
    },
    {
      t: "p",
      text: "At three the raw-water ammonia moved. Ammonia in the Thames is a sewage-works story more often than an agricultural one, especially after a dry spell when the river is low and the effluent is a larger fraction of the flow. The operator did not swear. He increased the chlorine, because chlorine and ammonia make a different chemistry — chloramines — and the residual on the outgoing main would otherwise have lied about how much disinfection was actually occurring. Then he rang the incoming-water desk and asked if anyone upstream had had a night. The conversation lasted ninety seconds and used no adjectives.",
    },
    {
      t: "pull",
      text: "The drama of water treatment is a drama of not happening.",
    },
    {
      t: "p",
      text: "I asked, at ten past four, what a bad night looks like. The operator who had the works that shift thought about it the way you think about a question you have already answered for yourself. “A filter that won’t recover after a wash. A clarifier that starts sending floc over the weir. A chlorine drum that isn’t where the delivery note says it is. Or a phone call from the network that means they need more water than we have ready, and we have to decide whether to run a bay we were about to wash.” He shrugged. “Mostly it’s the first two. The phone call is rarer. The drum is a procurement story and I try not to be in those.”",
    },
    {
      t: "p",
      text: "At five the birds started. The works is on a bend of the river with reservoirs behind it and a towpath in front, and the dawn is a water-bird dawn, not a city one. The outgoing residual was steady. The contact tank had had its hours. Two million people were about to put the kettle on, and the plant had spent the night making sure that sentence would not be interesting.",
    },

    { t: "h2", id: "lab", text: "The laboratory" },
    {
      t: "p",
      text: "The control room believes the analysers. The laboratory believes the bottle. Both are right, and they do not always agree, and the disagreement is a feature of a works that is not allowed to trust a single way of seeing. Every day a set of bottles leaves the plant for a lab that may be on site or may be a contractor an hour away, and the bottles are the legal version of the water. The analysers are the operational version. If the two drift, the plant has a morning.",
    },
    {
      t: "p",
      text: "I sat with a sampler on a Tuesday that was, again, a good day. The job is a route: raw, settled, filtered, final, and a tap in the network that is not on the site at all. The bottles are labelled in a handwriting that has no interest in being admired. The sampler rinses, fills, caps, writes the time. She has done this for nine years. She can tell you, without looking at a screen, which sample point tastes of the contact tank and which still has the river in it if you know how to look for the river. Taste is not a regulatory parameter she is paid to record. She records it anyway, in a notebook that is hers.",
    },
    {
      t: "p",
      text: "The regulatory sample is a different object. It has a chain of custody. It has a time that will be compared with a time on a chromatogram. It is the version of the water that can appear in a court, which is why nobody on the plant is casual about it even on a boring day. I asked whether she had ever had a sample that frightened her. She said yes, once, a pesticide after a rain in the upper catchment, and that the number had been below the standard and above the usual, and that ‘below the standard’ is a sentence the public hears as safe and the lab hears as a catchment waking up.",
    },
    {
      t: "p",
      text: "There is a fridge in the sample room that holds what has not yet gone. The smell is not the river. It is plastic and cold water and the particular nothing-smell of a room that is cleaned more often than it is used. On the wall, a printed list of determinants — the things the law wants counted — and a handwritten addition, in pencil, of a thing the law does not yet want counted but the works has started watching because a university paper last year suggested it might matter. That pencil line is the twenty-first century in this building: not a new bay, a new anxiety, written where the official list stops.",
    },
    {
      t: "p",
      text: "The laboratory will not save the plant from a bad night. It will tell the plant, two days later, whether the bad night was as bad as it felt. That delay is why the analysers exist, and why D. still holds a jar to the window. Three ways of looking, none of them sufficient, all of them required. A works that only trusted the lab would be two days late. A works that only trusted the jar would be a nineteenth-century argument. A works that only trusted the analyser would be one calibration away from a lie.",
    },

    { t: "h2", id: "left", text: "What is left" },
    {
      t: "p",
      text: "Every litre that becomes drinking water leaves a residue. The floc that was scraped off the flotation cells, the dirty water from the filter washes, the grit from the screens: sludge. At a works this size the sludge is a process of its own — thickened, sometimes pressed, sometimes sent away as a cake that will be used on land if it is clean enough and landfilled if it is not. The cake does not appear in the photograph of the Victorian building. It is the bill the photograph does not mention.",
    },
    {
      t: "p",
      text: "There is a yard at the back of the site where the skips sit. In summer it smells of the river. In winter it smells of the river and diesel. The men who drive the tankers do not work for the same company that employs D., and they do not come to the Christmas do, and they know more about where the dirt goes than most of the people who drink the water. I asked one of them, in the fourth week, where that day’s load was going. He named a works further west that dewaters for several plants. Then he said, “It’s still the Thames. We’re just moving it about.”",
    },
    {
      t: "p",
      text: "This is the part of the system that the nineteenth century did not have to be honest about, because the river was still, in practice, the sink. We have closed that sink and opened a smaller one, with paperwork. The paperwork is an improvement. It is not a disappearance.",
    },
    {
      t: "sidebar",
      title: "Cryptosporidium, in one paragraph",
      text: "A protozoan that lives in the guts of cattle and people, resists chlorine, and is why turbidity is treated as a moral fact rather than an aesthetic one. A spike in particles leaving a filter is treated as a possible spike in something you cannot see. Some works have added UV or membranes for this reason. The ones that have not live on the discipline of the filters and on the knowledge that a missed wash is not a housekeeping failure. It is a public-health one.",
    },

    { t: "h2", id: "rebuild", text: "The rebuild" },
    {
      t: "p",
      text: "Hampton has been about to be finished for as long as anyone I spoke to can remember. There is always a bay being rebuilt. There is always a new analyser. There is always a five-year investment period with a name that sounds like a software release, and a drawing that shows the old clarifiers as a ghost and the new ones as a certainty. Then the period ends, and some of the ghost is still there, and the certainty has moved to the next period.",
    },
    {
      t: "p",
      text: "This is not incompetence in the ordinary sense. A works that cannot be turned off cannot be replaced in the way a building can be replaced. You build the new thing beside the old thing, you cut from one to the other in a weekend that has been planned for a year, and you keep the old thing in the circuit because the new thing has a teething year and the city does not. The result is a site that is always mid-sentence. The Victorian buildings face the road. Behind them, a century and a half of temporary arrangements have become the plant.",
    },
    {
      t: "p",
      text: "Thames Water’s finances are a matter of public record and of a different kind of reporting. What they mean at Hampton, on a Thursday, is that a valve that should have been replaced in the last period is still in the ground, that a contractor’s compound occupies a corner of the yard that used to be for sludge skips, and that D. can tell you which of the analysers he trusts and which he looks at twice. He does not make a speech about privatisation. He makes a speech about a particular make of residual chlorine monitor that drifts if the sample line is not cleaned, and about the apprentice who cleaned it without being asked.",
    },
    {
      t: "p",
      text: "I asked him, on the last Friday, whether the plant was better than when he started. He did not hesitate. “Safer. More bored. More paperwork. The water is better than it was in the nineties, and the nineties were better than the seventies, and I wasn’t here for the seventies but the men who were are not nostalgic.” He wiped the sample tap with a rag. “What isn’t better is the river coming in. That’s not our job. We just have to be good enough for whatever it decides to be.”",
    },
    {
      t: "p",
      text: "On my last morning the jar against the window was the same weak tea it had been on the first. The outgoing main was steady. The contact tank had had its hours. Somewhere in west London a kettle went on, and the water that came out of it had been a river, and then a reservoir, and then a problem of chemistry, and then, for a defined number of minutes, a problem of time. The works had done what it has done since the Act that put it here: taken the river at a point the law would allow, and returned it as something a city could swallow without thinking.",
    },
    {
      t: "p",
      text: "That is the achievement, and it is also the reason the achievement is invisible. A treatment works is working when nobody writes about it. This piece is, in that sense, a failure of the plant’s highest ambition. The jar is still on the windowsill of the tiled room. D. will hold it up tomorrow. The colour will be tea, or it will not, and either way the train will run, because the sentence the works is speaking does not have a clause that says ‘unless someone is watching’.",
    },
  ],
};

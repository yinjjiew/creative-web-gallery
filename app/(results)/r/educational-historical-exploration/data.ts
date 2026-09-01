/**
 * Sourced figures and documents for the 1854 Broad Street inquiry.
 *
 * Where a number, date, or quotation is historical, the citation is on the
 * object. Where a position, a day-assignment, or a wording is reconstructed
 * for the piece, that is flagged on the object and again in the interface.
 */

export type Kind = "record" | "interpretation" | "reconstructed";

export type Source = {
  id: string;
  short: string;
  full: string;
};

export const SOURCES: Source[] = [
  {
    id: "cic-snow",
    short: "Snow, CIC 1855",
    full: "Snow, J. (1855). “Dr. Snow’s Report.” In Report on the Cholera Outbreak in the Parish of St. James, Westminster, during the Autumn of 1854 (pp. 97–120). London: J. Churchill. Dated 12 December 1854.",
  },
  {
    id: "mcc2",
    short: "Snow, MCC2 1855",
    full: "Snow, J. (1855). On the Mode of Communication of Cholera (2nd ed.). London: John Churchill.",
  },
  {
    id: "cic",
    short: "Cholera Inquiry Committee 1855",
    full: "Cholera Inquiry Committee (1855). Report on the Cholera Outbreak in the Parish of St. James, Westminster, during the Autumn of 1854. London: J. Churchill.",
  },
  {
    id: "whitehead",
    short: "Whitehead, CIC 1855",
    full: "Whitehead, H. (1855). Report of his special investigation of Broad Street, in the Cholera Inquiry Committee report. Whitehead was curate of St Luke’s, Berwick Street; he found the infant at no. 40 after the outbreak.",
  },
  {
    id: "berwick",
    short: "“The Cholera in Berwick Street,” 1854",
    full: "Anonymous parish account, “The Cholera in Berwick Street,” 1854, reprinted among the Broad Street documents. Street totals for Broad Street (houses, population, deaths) are taken from this return.",
  },
  {
    id: "farr",
    short: "Farr, elevation law",
    full: "Farr, W. Registrar-General’s reports on cholera (especially 1848–49 and 1854). Farr published an inverse relation between elevation above the Thames and cholera mortality. He later changed his mind, after the 1866 East London outbreak.",
  },
];

export type DayRow = {
  /** Days after 19 August 1854. 0 = 19 Aug, 13 = 1 Sep, 20 = 8 Sep. */
  offset: number;
  month: "Aug" | "Sep";
  day: number;
  attacks: number;
  deaths: number;
  unknown?: boolean;
};

/**
 * Fatal attacks and deaths by date. Snow compiled this from the Registrar
 * General, hospital returns, and house inquiry. 45 fatal attacks have no
 * recoverable date of onset; they are listed separately and are not assigned
 * to a day on the map.
 *
 * Source: Snow, “Dr. Snow’s Report,” CIC 1855, the daily table. The same
 * table is the one HistData::Snow.dates transcribes (616 deaths; 45 attacks
 * of unknown date).
 */
export const DAYS: DayRow[] = [
  { offset: 0, month: "Aug", day: 19, attacks: 1, deaths: 1 },
  { offset: 1, month: "Aug", day: 20, attacks: 1, deaths: 0 },
  { offset: 2, month: "Aug", day: 21, attacks: 1, deaths: 2 },
  { offset: 3, month: "Aug", day: 22, attacks: 0, deaths: 0 },
  { offset: 4, month: "Aug", day: 23, attacks: 1, deaths: 0 },
  { offset: 5, month: "Aug", day: 24, attacks: 1, deaths: 2 },
  { offset: 6, month: "Aug", day: 25, attacks: 0, deaths: 0 },
  { offset: 7, month: "Aug", day: 26, attacks: 1, deaths: 0 },
  { offset: 8, month: "Aug", day: 27, attacks: 1, deaths: 1 },
  { offset: 9, month: "Aug", day: 28, attacks: 1, deaths: 0 },
  { offset: 10, month: "Aug", day: 29, attacks: 1, deaths: 1 },
  { offset: 11, month: "Aug", day: 30, attacks: 8, deaths: 2 },
  { offset: 12, month: "Aug", day: 31, attacks: 56, deaths: 3 },
  { offset: 13, month: "Sep", day: 1, attacks: 143, deaths: 70 },
  { offset: 14, month: "Sep", day: 2, attacks: 116, deaths: 127 },
  { offset: 15, month: "Sep", day: 3, attacks: 54, deaths: 76 },
  { offset: 16, month: "Sep", day: 4, attacks: 46, deaths: 71 },
  { offset: 17, month: "Sep", day: 5, attacks: 36, deaths: 45 },
  { offset: 18, month: "Sep", day: 6, attacks: 20, deaths: 37 },
  { offset: 19, month: "Sep", day: 7, attacks: 28, deaths: 32 },
  { offset: 20, month: "Sep", day: 8, attacks: 12, deaths: 30 },
  { offset: 21, month: "Sep", day: 9, attacks: 11, deaths: 24 },
  { offset: 22, month: "Sep", day: 10, attacks: 5, deaths: 18 },
  { offset: 23, month: "Sep", day: 11, attacks: 5, deaths: 15 },
  { offset: 24, month: "Sep", day: 12, attacks: 1, deaths: 6 },
  { offset: 25, month: "Sep", day: 13, attacks: 3, deaths: 13 },
  { offset: 26, month: "Sep", day: 14, attacks: 0, deaths: 6 },
  { offset: 27, month: "Sep", day: 15, attacks: 1, deaths: 8 },
  { offset: 28, month: "Sep", day: 16, attacks: 4, deaths: 6 },
  { offset: 29, month: "Sep", day: 17, attacks: 2, deaths: 5 },
  { offset: 30, month: "Sep", day: 18, attacks: 3, deaths: 2 },
  { offset: 31, month: "Sep", day: 19, attacks: 0, deaths: 3 },
  { offset: 32, month: "Sep", day: 20, attacks: 0, deaths: 0 },
  { offset: 33, month: "Sep", day: 21, attacks: 2, deaths: 0 },
  { offset: 34, month: "Sep", day: 22, attacks: 1, deaths: 2 },
  { offset: 35, month: "Sep", day: 23, attacks: 1, deaths: 3 },
  { offset: 36, month: "Sep", day: 24, attacks: 1, deaths: 0 },
  { offset: 37, month: "Sep", day: 25, attacks: 1, deaths: 0 },
  { offset: 38, month: "Sep", day: 26, attacks: 1, deaths: 2 },
  { offset: 39, month: "Sep", day: 27, attacks: 1, deaths: 0 },
  { offset: 40, month: "Sep", day: 28, attacks: 0, deaths: 2 },
  { offset: 41, month: "Sep", day: 29, attacks: 0, deaths: 1 },
  { offset: 42, month: "Sep", day: 30, attacks: 0, deaths: 0 },
];

export const UNKNOWN_ATTACKS = 45;
export const HANDLE_OFFSET = 20; // 8 September
export const DEFAULT_OFFSET = 15; // 3 September — cluster visible, handle still on
export const SNOW_GUARDIANS_OFFSET = 19; // 7 September

export const TOTAL_DEATHS = DAYS.reduce((s, d) => s + d.deaths, 0);
export const TOTAL_ATTACKS =
  DAYS.reduce((s, d) => s + d.attacks, 0) + UNKNOWN_ATTACKS;

export function labelDay(offset: number): string {
  const row = DAYS[offset];
  if (!row) return "";
  return `${row.day} ${row.month === "Aug" ? "August" : "September"} 1854`;
}

export function shortDay(offset: number): string {
  const row = DAYS[offset];
  if (!row) return "";
  return `${row.day} ${row.month}`;
}

export function cumulativeDeaths(through: number): number {
  let n = 0;
  for (const row of DAYS) {
    if (row.offset <= through) n += row.deaths;
  }
  return n;
}

/** Figures that appear in the interface as measurements. */
export const FIGURES = {
  workhouseInmates: {
    value: 535,
    kind: "record" as Kind,
    source: "cic-snow",
    note: "Snow: “out of 535 inmates, only five died of Cholera — the other deaths which took place being those of persons admitted after they were attacked.”",
  },
  workhouseInmateDeaths: {
    value: 5,
    kind: "record" as Kind,
    source: "cic-snow",
  },
  workhouseExpectedIfSurrounding: {
    value: 50,
    kind: "record" as Kind,
    source: "cic-snow",
    note: "Snow’s counterfactual in the CIC report: “upwards of 50 inmates would have died.” (MCC2 gives “upwards of one hundred” for a slightly different surrounding. This piece uses the CIC wording.)",
  },
  breweryMen: {
    value: 70,
    kind: "record" as Kind,
    source: "cic-snow",
    note: "“above 70 workmen.” Two were “indisposed, and that not seriously.” None died of cholera.",
  },
  breweryDeaths: { value: 0, kind: "record" as Kind, source: "cic-snow" },
  eleyHands: {
    value: 200,
    kind: "record" as Kind,
    source: "cic-snow",
    note: "“about 200 work people” at 38 Broad Street. Tubs of Broad Street pump water on the premises. 18 died at their own houses (16 women, 2 men).",
  },
  eleyDeaths: { value: 18, kind: "record" as Kind, source: "cic-snow" },
  lodgingHands: {
    value: 35,
    kind: "record" as Kind,
    source: "berwick",
    note: "Labourers on an unfinished model lodging-house behind the brewery. 7 of 35 fatally seized. Broad Street water in use. From the Berwick Street / CIC account.",
  },
  lodgingDeaths: { value: 7, kind: "record" as Kind, source: "berwick" },
  broadStreetHouses: { value: 49, kind: "record" as Kind, source: "berwick" },
  broadStreetPop: { value: 869, kind: "record" as Kind, source: "berwick" },
  broadStreetDeaths: {
    value: 86,
    kind: "record" as Kind,
    source: "berwick",
    note: "Resident deaths on Broad Street. South side 49, north side 37. Every house but one on the south side had a death. Exclusive of the brewery.",
  },
  weekEnding2Sep: { value: 89, kind: "record" as Kind, source: "cic-snow" },
  snowInquiry: { value: 83, kind: "record" as Kind, source: "cic-snow" },
  nearerOtherPump: { value: 10, kind: "record" as Kind, source: "cic-snow" },
  nearerButUsedBroad: { value: 5, kind: "record" as Kind, source: "cic-snow" },
  usedBroadOf73: { value: 61, kind: "record" as Kind, source: "cic-snow" },
  noInformation: { value: 6, kind: "record" as Kind, source: "cic-snow" },
  didNotDrink: { value: 6, kind: "record" as Kind, source: "cic-snow" },
  twoFiftyYardsAttacks: {
    value: 500,
    kind: "record" as Kind,
    source: "mcc2",
    note: "“Within two hundred and fifty yards of the spot where Cambridge Street joins Broad Street, there were upwards of five hundred fatal attacks of cholera in ten days.”",
  },
} as const;

export type PaperId =
  | "return"
  | "workhouse"
  | "brewery"
  | "hampstead"
  | "eley"
  | "miasma"
  | "coffee"
  | "pentonville"
  | "marlborough"
  | "whitehead"
  | "handle"
  | "after";

export type Paper = {
  id: PaperId;
  title: string;
  date: string;
  when: "1854" | "1855" | "later";
  from: string;
  kind: Kind;
  source: string;
  body: string;
  /** Buildings that yield this paper when requested. */
  fromBuilding?: string;
};

export const PAPERS: Paper[] = [
  {
    id: "return",
    title: "Weekly return of deaths",
    date: "Week ending 2 September 1854",
    when: "1854",
    from: "General Register Office, via Snow",
    kind: "record",
    source: "cic-snow",
    body: "Eighty-nine deaths from cholera were registered during the week in the sub-districts of Golden Square, Berwick Street, and St Anne’s Soho. Only six of those fell on the first four days. Four fell on Thursday the 31st of August. The remaining seventy-nine fell on Friday and Saturday.\n\nSnow took the 83 deaths of the last three days as the beginning of the outburst and inquired at the houses. Nearly all had occurred a short distance from the pump in Broad Street. Ten of the 83 were in houses nearer another street pump. In five of those ten the family said they sent to Broad Street because they preferred the water. Three were children at school near that pump. The remaining two, Snow wrote, were only the mortality that had been occurring before the eruption.\n\nOf the 73 deaths in the pump’s own locality: 61 had drunk the Broad Street water, constantly or occasionally; in 6 every connection had died or fled; in 6 he was told they had not drunk it.",
  },
  {
    id: "workhouse",
    title: "Return from the Master’s office",
    date: "September 1854",
    when: "1854",
    from: "St James’s Workhouse, Poland Street",
    kind: "record",
    source: "cic-snow",
    fromBuilding: "workhouse",
    body: "Inmates on the books: 535.\n\nDeaths from cholera among those inmates: 5. Other cholera deaths in the house were of persons carried in already attacked.\n\nWater: a pump on the premises, and a supply from the Grand Junction Water Works. The inmates never sent to Broad Street.\n\nSnow’s remark, which is argument rather than a measurement: the house is more than three-fourths surrounded by houses in which deaths occurred. Had the inmates died at the rate of the streets on three sides, “upwards of 50” would have died. They did not.",
  },
  {
    id: "brewery",
    title: "Mr Huggins, proprietor",
    date: "September 1854",
    when: "1854",
    from: "The brewery, Broad Street",
    kind: "record",
    source: "cic-snow",
    fromBuilding: "brewery",
    body: "Snow called because no brewer’s men appeared in the death register.\n\nAbove 70 workmen. None had suffered from cholera in a severe form. Two were indisposed, not seriously.\n\nThe men are allowed a quantity of malt liquor. Huggins believes they do not drink water at all, and is certain they never took water from the pump in the street. There is a deep well in the brewery, and a supply from the New River Company.\n\nA later parish account adds a contrast: of 35 labourers on an unfinished lodging-house immediately behind the brewery, 7 were fatally seized. Those men had been using the Broad Street water. The works stopped on the third day.",
  },
  {
    id: "hampstead",
    title: "A death at West End, Hampstead",
    date: "2–3 September 1854",
    when: "1854",
    from: "Inquiry of Mrs E——’s son; Snow’s report",
    kind: "record",
    source: "cic-snow",
    fromBuilding: "eley",
    body: "Mrs E—— had not been in the neighbourhood of Broad Street for many months. A cart went from Broad Street to West End every day, and it was the custom to take out a large bottle of the pump water, which she preferred.\n\nThe water was taken out on Thursday the 31st of August. She drank of it that evening and on Friday. She was seized on Friday evening and died on Saturday. A niece on a visit also drank of it, returned to a high and healthy part of Islington, was attacked, and died. There was not cholera at the time at West End, or where the niece died.\n\nOne servant also partook. She had diarrhoea, not severe.\n\nSnow printed the name as “Mrs E——.” She is later identified as Susannah Eley, whose sons manufactured percussion caps at 38 Broad Street. That identification is later than the 1854 inquiry; the facts of the bottle and the two deaths are Snow’s.",
  },
  {
    id: "eley",
    title: "38 Broad Street — the cartridge works",
    date: "September 1854",
    when: "1854",
    from: "Mr Eley; Snow’s report",
    kind: "record",
    source: "cic-snow",
    fromBuilding: "eley",
    body: "About 200 workpeople. Two tubs on the premises, always supplied from the pump in the street for those who wished to drink. Eighteen of those workpeople died of cholera at their own houses — sixteen women and two men.\n\nMr Eley had long noticed that the Broad Street water became offensive to smell and taste after it had been kept about two days. That is a character of water contaminated with sewage. It does not, by itself, say what kind of sewage.",
  },
  {
    id: "coffee",
    title: "A coffee-shop keeper",
    date: "6 September 1854",
    when: "1854",
    from: "Snow’s house inquiry",
    kind: "record",
    source: "cic-snow",
    body: "The Broad Street water was used for mixing with spirits in public houses, and at dining rooms and coffee shops. It was sold in little shops with a teaspoon of effervescing powder, as sherbet.\n\nThe keeper of a coffee shop frequented by mechanics, where the pump water was supplied at dinner, told Snow on the 6th of September that she was already aware of nine of her customers who were dead.\n\nThe pump was frequented much more than is usual, even for a London pump in a populous neighbourhood. People came to it because the water was thought good.",
  },
  {
    id: "pentonville",
    title: "A visitor from Brighton",
    date: "1–3 September 1854",
    when: "1854",
    from: "Dr Fraser of Oakley Square, St Pancras, to Snow",
    kind: "record",
    source: "cic-snow",
    body: "A gentleman in delicate health was sent for from Brighton to see his brother at no. 6 Poland Street. The brother was attacked with cholera and died in twelve hours on the 1st of September. The visitor arrived after the death, did not see the body, stayed about twenty minutes, and took a scanty luncheon of rump steak with a small tumbler of cold brandy and water — the water from the Broad Street pump.\n\nHe went to Pentonville, was attacked on the evening of the 2nd, and died the next evening.\n\nAn officer living at St John’s Wood, who came to dine in Wardour Street and drank the same water, died in a few hours. That case is also Snow’s, from Mr Peter Marshall of 53 Greek Street.",
  },
  {
    id: "marlborough",
    title: "The pump at the end of Carnaby Street",
    date: "First week of September 1854",
    when: "1854",
    from: "Snow’s examination of the wells",
    kind: "record",
    source: "cic-snow",
    body: "Snow found visible impurities in the Golden Square pumps he examined, except Vigo Street. Broad Street, Warwick Street, and Bridle Lane showed minute whitish flocculent particles. The Marlborough Street pump, at the end of Carnaby Street, was worse. Most people in its neighbourhood avoided it and sent to Broad Street.\n\nDr Hassall, looking at Broad Street water under the microscope at Snow’s request, found no organised structure in the particles, and a great number of minute oval animalculæ — proof of organic matter, not of a specific poison. Snow himself was clear: mere impurity would not cause cholera “unless it were of a special kind — unless, in fact, the impurity had proceeded from a Cholera patient.”\n\nMr Gould the ornithologist, coming home on the morning of 2 September, found the Broad Street water offensive in smell though perfectly transparent. He drank scarcely any of it.",
  },
  {
    id: "miasma",
    title: "Why the air is still the better theory",
    date: "Autumn 1854",
    when: "1854",
    from: "A composite of the Board of Health position, Farr’s elevation law, and the ordinary medical view",
    kind: "interpretation",
    source: "farr",
    body: "This paper is not a single historical letter. It is a fair statement of the view Snow was arguing against, put together from positions that were actually held.\n\nCholera gathers in low, filthy, overcrowded ground. Farr had shown that mortality falls as one rises above the Thames. Soho sits in a shallow depression. The stench, in the first week of September, was something witnesses wrote about as a physical blow. A disease of bad air predicts a tight cluster in the worst streets, a flight of those who can leave, and a workhouse full of the destitute — exactly the shape on the map.\n\nContagion, in the ordinary sense, fits badly. Physicians who sat with the dying often did not take the disease. The Broad Street water was clear enough to be preferred. No one had a microbe to show. Pacini, in Florence, described a cholera bacillus in this same year; it was ignored. Koch’s isolation is 1883.\n\nIf you hold this view you are in the company of serious people. The question is whether it survives the houses that should have died and did not, and the houses that should have been safe and were not.",
  },
  {
    id: "handle",
    title: "The handle, and what Snow said it proved",
    date: "7–8 September 1854, written up December 1854",
    when: "1854",
    from: "Board of Guardians; Snow’s own caveat",
    kind: "record",
    source: "cic-snow",
    body: "Snow saw the Guardians of St James’s on the evening of Thursday, 7 September, and represented the pump. The handle was taken off the following day.\n\nOn the table of fatal attacks the outburst is already falling before that morning: 143, 116, 54, 46, 36, 20, 28 on the seven days from 1 to 7 September; 12 on the 8th. Snow wrote the sentence that the tidy story leaves out:\n\n“It will be observed that the daily number of fatal attacks was already much diminished by September the 8th, the day when the handle of the pump in Broad Street was removed; and it is not improbable that the water had, from some cause or other, ceased to contain the cholera poison.”\n\nThe population was also fleeing. In less than six days, he wrote, the worst streets were deserted by more than three-quarters of their inhabitants. A falling curve after a falling population does not tell you what the handle did.",
  },
  {
    id: "whitehead",
    title: "The infant at no. 40 — found later",
    date: "1855",
    when: "1855",
    from: "Rev. Henry Whitehead, for the Cholera Inquiry Committee",
    kind: "record",
    source: "whitehead",
    fromBuilding: "forty",
    body: "This is not something Snow had in the first week of September. Whitehead, curate of St Luke’s, went house to house after the outbreak and found it.\n\nAt 40 Broad Street — a few feet from the well — an infant, Frances Lewis, was taken ill on 28 August and died on 2 September. The mother, Sarah Lewis, had washed the nappies in water that was emptied into a cesspool at the front of the house. The cesspool was later opened. Its brickwork was decayed. It leaked toward the well.\n\nIf this is the seed of the well, the outburst has a beginning that is ordinary and domestic, not atmospheric. It also means the decisive fact arrived a season late, which is what investigations are like.\n\nTreat this paper as 1855 knowledge. Using it to congratulate yourself on a September guess is a different exercise from making the guess.",
  },
  {
    id: "after",
    title: "What this did not settle",
    date: "1855–1883",
    when: "later",
    from: "The Committee, the Board of Health, Farr, Koch",
    kind: "interpretation",
    source: "cic",
    body: "The Cholera Inquiry Committee took Snow seriously and still did not convert the medical establishment. The General Board of Health’s own report on the outbreak continued to prefer a local atmospheric cause. Miasma was not a superstition; it was the educated theory, and it had Farr’s numbers behind it.\n\nSnow died in 1858. Farr changed his mind after the East London outbreak of 1866, when a contaminated reservoir produced a water-shaped epidemic he could not talk around. Robert Koch isolated Vibrio cholerae in 1883. The handle on Broad Street was not the birth of epidemiology. It was one parish vestry, already watching the deaths fall, agreeing to disable a pump.\n\nThe useful inheritance is not the legend. It is the method: a map you can be wrong about, and three facts that look like they ruin a theory and instead tighten it.",
  },
];

export type CauseId =
  | "miasma"
  | "broad"
  | "pumps"
  | "sewer"
  | "contagion"
  | "filth"
  | "unknown";

export const CAUSES: { id: CauseId; label: string; hint: string }[] = [
  {
    id: "miasma",
    label: "Bad air — a local miasma",
    hint: "The cluster is the poisoned neighbourhood. Elevation and filth already predict it.",
  },
  {
    id: "broad",
    label: "The Broad Street pump",
    hint: "One well. People who drank from it, wherever they lived.",
  },
  {
    id: "pumps",
    label: "Street-pump water in general",
    hint: "The wells share a tainted ground. Broad Street is only the worst.",
  },
  {
    id: "sewer",
    label: "The sewer under Broad Street",
    hint: "A drain, not a well. The street itself is the source.",
  },
  {
    id: "contagion",
    label: "Person to person",
    hint: "The sick give it to the near. The map is a map of households.",
  },
  {
    id: "filth",
    label: "Overcrowding and filth, no single source",
    hint: "Soho is a slum. Looking for one handle is a mistake.",
  },
  {
    id: "unknown",
    label: "I do not know yet",
    hint: "The honest position if the anomalies are still closed.",
  },
];

export type EvidenceId =
  | "workhouse"
  | "brewery"
  | "hampstead"
  | "eley"
  | "pentonville"
  | "marlborough"
  | "coffee"
  | "return"
  | "miasma"
  | "handle"
  | "whitehead"
  | "after"
  | "hinterland"
  | "circle"
  | "elevation";

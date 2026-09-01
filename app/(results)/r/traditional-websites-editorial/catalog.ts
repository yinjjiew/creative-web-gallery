export const BASE = "/r/traditional-websites-editorial";

export type Format = "feature" | "dispatch" | "essay" | "diagram" | "interview";
export type SectionId = "water" | "power" | "freight" | "streets";

export type Article = {
  slug: string;
  title: string;
  dek: string;
  format: Format;
  section: SectionId;
  issue: number;
  date: string;
  byline: string;
  words: number;
};

export type Issue = {
  n: number;
  season: string;
  title: string;
  note: string;
};

export type Section = {
  id: SectionId;
  title: string;
  stand: string;
};

export const FORMAT_LABEL: Record<Format, string> = {
  feature: "Feature",
  dispatch: "Dispatch",
  essay: "Photo essay",
  diagram: "Annotated diagram",
  interview: "Interview",
};

export const issues: Issue[] = [
  {
    n: 11,
    season: "Autumn 2025",
    title: "What still runs",
    note: "This issue is about things that were meant to have been replaced. The switchgear that still throws the trams in a northern city is ninety years old and live. The treatment works at Hampton is in its fourth reconstruction and drinking water still comes out of the first one. The overflow at Beckton is a political argument about a pipe Brunel’s generation laid. We went looking for the new systems and kept finding the old ones, still in the circuit, still doing the job, still not in the press release.",
  },
  {
    n: 10,
    season: "Spring 2025",
    title: "Overflow",
    note: "A winter of named storms, and the politics of a sewer that was never meant to take this much rain. Issue 10 stayed with water after it left the house — who owns the pipe, who counts the spill, and what a ‘bathing water’ designation actually changes.",
  },
  {
    n: 9,
    season: "Autumn 2024",
    title: "The last mile",
    note: "Heat, freight and the last hundred metres: the parts of a system that are too small to make a speech about and too expensive to ignore.",
  },
  {
    n: 8,
    season: "Spring 2024",
    title: "Load",
    note: "What a national grid is doing at 4am, and who is awake to watch it. Issue 8 was spent in control rooms.",
  },
];

export const sections: Section[] = [
  {
    id: "water",
    title: "Water",
    stand:
      "Intake, treatment, the sewer, the outfall. The oldest public health system still running, and the one most often noticed only when it fails.",
  },
  {
    id: "power",
    title: "Power",
    stand:
      "Frequency, load, the last mile of heat. Systems that have to be right every second and are described, when they are described at all, as if they were buildings.",
  },
  {
    id: "freight",
    title: "Freight",
    stand:
      "Ports, yards, the box. How a country that no longer makes most of what it uses still gets the rest of it onto a lorry by Thursday.",
  },
  {
    id: "streets",
    title: "Streets",
    stand:
      "Trams, switchgear, the kit under the pavement. The parts of a city that are still live after the people who installed them have gone.",
  },
];

export const articles: Article[] = [
  {
    slug: "what-the-river-becomes",
    title: "What the river becomes",
    dek: "A month inside the treatment works at Hampton, where the Thames is turned into drinking water for two million people. The chemistry is Victorian. The rebuild never finishes.",
    format: "feature",
    section: "water",
    issue: 11,
    date: "4 September 2025",
    byline: "M. Hale",
    words: 3840,
  },
  {
    slug: "still-live",
    title: "Still live",
    dek: "Ninety-year-old switchgear still running a city’s trams. Drawn on site, because the depot will not let a camera near the boards.",
    format: "essay",
    section: "streets",
    issue: 11,
    date: "4 September 2025",
    byline: "R. Quinn",
    words: 1680,
  },
  {
    slug: "the-outfall",
    title: "The outfall at low water",
    dek: "Tuesday, a spring tide, and a combined sewer that is doing exactly what it was designed to do. That is the political problem.",
    format: "dispatch",
    section: "water",
    issue: 11,
    date: "28 August 2025",
    byline: "A. Sen",
    words: 980,
  },
  {
    slug: "sixty-seconds",
    title: "Sixty seconds on the grid",
    dek: "How a national electricity system is balanced minute by minute, annotated from the public frequency record of a single ordinary Wednesday.",
    format: "diagram",
    section: "power",
    issue: 11,
    date: "4 September 2025",
    byline: "J. Okoye",
    words: 1920,
  },
  {
    slug: "the-box-is-the-job",
    title: "The box is the job",
    dek: "A harbourmaster on why a container port is arranged the way it is, and why the pretty aerial photograph is the least useful view of it.",
    format: "interview",
    section: "freight",
    issue: 11,
    date: "4 September 2025",
    byline: "Works",
    words: 2240,
  },
  {
    slug: "after-the-storm",
    title: "After the storm",
    dek: "The morning after Storm Kathleen, at a pumping station that ran all night and still had to open the overflow at 5:40.",
    format: "dispatch",
    section: "water",
    issue: 10,
    date: "12 March 2025",
    byline: "A. Sen",
    words: 720,
  },
  {
    slug: "who-owns-a-sewer",
    title: "Who owns a sewer",
    dek: "A pipe under a terrace in south London has four owners, three legal statuses and no one who will admit to the smell. The map is the argument.",
    format: "feature",
    section: "water",
    issue: 10,
    date: "18 February 2025",
    byline: "M. Hale",
    words: 2480,
  },
  {
    slug: "the-last-mile-of-heat",
    title: "The last mile of heat",
    dek: "A district-heating network drawn from the energy centre to the fifth-floor radiator, with the losses marked where they actually occur.",
    format: "diagram",
    section: "power",
    issue: 9,
    date: "8 October 2024",
    byline: "J. Okoye",
    words: 1540,
  },
  {
    slug: "a-substation-in-the-dark",
    title: "A substation in the dark",
    dek: "Four hours at a 33 kV compound after a fault. The lights are on everywhere except here.",
    format: "dispatch",
    section: "power",
    issue: 8,
    date: "3 April 2024",
    byline: "R. Quinn",
    words: 640,
  },
  {
    slug: "the-night-desk",
    title: "The night desk",
    dek: "A control-room engineer on the hour between two and three, when the country is lightest and a single trip can still move the frequency.",
    format: "interview",
    section: "power",
    issue: 8,
    date: "20 March 2024",
    byline: "Works",
    words: 1860,
  },
];

export function articleBySlug(slug: string) {
  return articles.find((a) => a.slug === slug);
}

export function articlesInIssue(n: number) {
  return articles.filter((a) => a.issue === n);
}

export function articlesInSection(id: SectionId) {
  return articles.filter((a) => a.section === id);
}

export function issueByN(n: number) {
  return issues.find((i) => i.n === n);
}

export function sectionById(id: string) {
  return sections.find((s) => s.id === id);
}

export function related(article: Article) {
  const issueMates = articles.filter(
    (a) => a.issue === article.issue && a.slug !== article.slug,
  );
  const sectionMates = articles.filter(
    (a) =>
      a.section === article.section &&
      a.slug !== article.slug &&
      !issueMates.includes(a),
  );
  return { issueMates, sectionMates: sectionMates.slice(0, 3) };
}

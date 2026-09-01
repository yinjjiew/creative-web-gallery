export const BASE = "/r/traditional-websites-documentation";
export const TASK = "/tasks/traditional-websites-documentation";
export const VERSION = "2.1.0";

export type Kind = "home" | "guide" | "concept" | "api" | "limit" | "migrate";

export type PageMeta = {
  slug: string;
  title: string;
  kind: Kind;
  section: string;
  blurb: string;
  /** Extra phrases people will type at 11pm. */
  aliases: string[];
};

export const PAGES: PageMeta[] = [
  {
    slug: "",
    title: "Instant",
    kind: "home",
    section: "",
    blurb: "Documentation. Search first. Four readers, four documents.",
    aliases: ["home", "index", "docs"],
  },
  {
    slug: "start",
    title: "Getting started",
    kind: "guide",
    section: "Start",
    blurb: "From install to a working Clock, including the first daylight-saving case.",
    aliases: ["install", "quickstart", "tutorial", "hello", "first", "integrate", "getting started"],
  },
  {
    slug: "concepts/instant-civil",
    title: "Instant and Civil",
    kind: "concept",
    section: "Concepts",
    blurb: "A point on the timeline is not a label on a wall clock. Mixing them is the bug.",
    aliases: [
      "instant vs civil",
      "wall clock",
      "date",
      "datetime",
      "point",
      "label",
      "24 hours",
      "one day",
      "epoch",
    ],
  },
  {
    slug: "concepts/zones",
    title: "Zones and offsets",
    kind: "concept",
    section: "Concepts",
    blurb: "An offset is a number. A zone is a political history that produces offsets.",
    aliases: [
      "timezone",
      "time zone",
      "iana",
      "offset",
      "utc",
      "+01:00",
      "gmt",
      "bst",
      "abbreviation",
    ],
  },
  {
    slug: "concepts/ambiguous",
    title: "Skipped and repeated times",
    kind: "concept",
    section: "Concepts",
    blurb: "Some local times never happen. Some happen twice. Instant will not guess which.",
    aliases: [
      "dst",
      "daylight saving",
      "daylight savings",
      "spring forward",
      "fall back",
      "gap",
      "overlap",
      "skipped",
      "ambiguous",
      "repeated",
      "ifSkipped",
      "ifAmbiguous",
      "reject",
    ],
  },
  {
    slug: "concepts/calendar",
    title: "Adding a month",
    kind: "concept",
    section: "Concepts",
    blurb: "Calendar arithmetic is a different operation from adding twenty-four hours.",
    aliases: [
      "add month",
      "add day",
      "february 29",
      "jan 31",
      "clamp",
      "overflow",
      "calendar",
      "leap year",
      "week",
    ],
  },
  {
    slug: "api",
    title: "API",
    kind: "api",
    section: "API",
    blurb: "Types, signatures, and the errors they throw.",
    aliases: ["reference", "functions", "methods"],
  },
  {
    slug: "api/instant",
    title: "Instant",
    kind: "api",
    section: "API",
    blurb: "A point on the UTC timeline. Exact spans only. No calendar units.",
    aliases: ["Instant.parse", "Instant.now", "Instant.add", "epoch", "fromEpochMs", "Z"],
  },
  {
    slug: "api/civil",
    title: "Civil",
    kind: "api",
    section: "API",
    blurb: "A calendar label with no timezone. The numbers a wall clock shows.",
    aliases: ["Civil.parse", "Civil.of", "Civil.add", "date only", "wall time"],
  },
  {
    slug: "api/clock",
    title: "Clock",
    kind: "api",
    section: "API",
    blurb: "A Civil nailed to a Zone. Where skipped and repeated times are decided.",
    aliases: ["Clock.of", "Clock.at", "Clock.parse", "Clock.addSpan", "Clock.addCalendar", "zoned"],
  },
  {
    slug: "api/span",
    title: "Span and Calendar",
    kind: "api",
    section: "API",
    blurb: "Exact durations versus years, months, weeks and days.",
    aliases: ["Span.of", "PT2H", "duration", "Calendar.of", "hours", "P1M"],
  },
  {
    slug: "api/zone",
    title: "Zone",
    kind: "api",
    section: "API",
    blurb: "IANA identifiers, offsets at an instant, and the next transition.",
    aliases: ["Zone.get", "nextTransition", "previousTransition", "offsetAt", "Europe/London"],
  },
  {
    slug: "api/parse",
    title: "Parse and format",
    kind: "api",
    section: "API",
    blurb: "Which parser accepts which string, and what each toString emits.",
    aliases: ["ISO-8601", "ISO", "format", "toString", "parse error", "brackets"],
  },
  {
    slug: "limits",
    title: "What Instant does not do",
    kind: "limit",
    section: "Limits",
    blurb: "Relative time, natural language, other calendars, recurrence, leap seconds.",
    aliases: [
      "limits",
      "not supported",
      "relative",
      "ago",
      "next tuesday",
      "locale",
      "format",
      "rrule",
      "business day",
      "leap second",
      "hijri",
      "evaluate",
      "why not",
    ],
  },
  {
    slug: "migrate",
    title: "Upgrade notes",
    kind: "migrate",
    section: "Migrate",
    blurb: "Which version broke what. Start here if a parse started throwing.",
    aliases: ["upgrade", "changelog", "breaking", "migration", "version"],
  },
  {
    slug: "migrate/v2",
    title: "v1 → v2",
    kind: "migrate",
    section: "Migrate",
    blurb: "Instant.parse no longer accepts offset-less strings. Span no longer takes days.",
    aliases: ["v1", "v2", "breaking change", "Instant.parse", "fromDate", "days on span"],
  },
  {
    slug: "migrate/v21",
    title: "v2.0 → v2.1",
    kind: "migrate",
    section: "Migrate",
    blurb: "Zone.nextTransition and Zone.previousTransition. Nothing broke.",
    aliases: ["v2.1", "2.1", "nextTransition"],
  },
];

export const NAV: { section: string; slugs: string[] }[] = [
  { section: "Start", slugs: ["start"] },
  {
    section: "Concepts",
    slugs: [
      "concepts/instant-civil",
      "concepts/zones",
      "concepts/ambiguous",
      "concepts/calendar",
    ],
  },
  {
    section: "API",
    slugs: ["api", "api/instant", "api/civil", "api/clock", "api/span", "api/zone", "api/parse"],
  },
  { section: "Limits", slugs: ["limits"] },
  { section: "Migrate", slugs: ["migrate", "migrate/v2", "migrate/v21"] },
];

export function pageBySlug(slug: string): PageMeta | undefined {
  return PAGES.find((p) => p.slug === slug);
}

export function isPage(slug: string): boolean {
  return PAGES.some((p) => p.slug === slug);
}

export function href(slug: string): string {
  return slug ? `${BASE}/${slug}` : BASE;
}

export function neighbours(slug: string): { prev?: PageMeta; next?: PageMeta } {
  const linear = PAGES.filter((p) => p.slug !== "");
  const i = linear.findIndex((p) => p.slug === slug);
  if (i < 0) return {};
  return { prev: linear[i - 1], next: linear[i + 1] };
}

export type SearchRec = {
  slug: string;
  title: string;
  heading?: string;
  hash?: string;
  kind: Kind;
  text: string;
  aliases: string[];
  signature?: string;
};

export const SEARCH: SearchRec[] = [
  ...PAGES.map((p) => ({
    slug: p.slug,
    title: p.title,
    kind: p.kind,
    text: p.blurb,
    aliases: p.aliases,
  })),
  {
    slug: "api/instant",
    title: "Instant.parse",
    heading: "parse",
    hash: "parse",
    kind: "api",
    signature: "Instant.parse(input: string): Instant",
    text: "Requires Z or a numeric offset. Offset-less strings throw ParseError. Use Civil.parse for wall time.",
    aliases: ["parse instant", "iso", "timezone required", "no offset"],
  },
  {
    slug: "api/instant",
    title: "Instant.add",
    heading: "add",
    hash: "add",
    kind: "api",
    signature: "Instant.add(instant: Instant, span: Span): Instant",
    text: "Adds an exact span. Cannot add days or months. Twenty-four hours is not a calendar day.",
    aliases: ["add hours", "plus", "24 hours"],
  },
  {
    slug: "api/instant",
    title: "Instant.now",
    heading: "now",
    hash: "now",
    kind: "api",
    signature: "Instant.now(): Instant",
    text: "The current UTC instant from the host clock.",
    aliases: ["current time", "now", "today"],
  },
  {
    slug: "api/instant",
    title: "Instant.fromEpochMs",
    heading: "fromEpochMs",
    hash: "fromepochms",
    kind: "api",
    signature: "Instant.fromEpochMs(ms: number): Instant",
    text: "Build from Unix milliseconds. Leap seconds are not represented.",
    aliases: ["unix", "epoch", "timestamp", "milliseconds"],
  },
  {
    slug: "api/civil",
    title: "Civil.parse",
    heading: "parse",
    hash: "parse",
    kind: "api",
    signature: "Civil.parse(input: string): Civil",
    text: "ISO without offset or zone. Date-only forms midnight. Z or +01:00 throws.",
    aliases: ["parse date", "date only", "YYYY-MM-DD"],
  },
  {
    slug: "api/civil",
    title: "Civil.add",
    heading: "add",
    hash: "add",
    kind: "api",
    signature: "Civil.add(civil: Civil, calendar: Calendar, overflow?: clamp | reject): Civil",
    text: "Calendar arithmetic. January 31 plus one month clamps to February 28, or throws if overflow is reject.",
    aliases: ["add month", "add day", "overflow", "clamp"],
  },
  {
    slug: "api/clock",
    title: "Clock.of",
    heading: "of",
    hash: "of",
    kind: "api",
    signature: "Clock.of(civil: Civil, zone: Zone, options?: ResolveOptions): Clock",
    text: "Attach a civil time to a zone. Default ifSkipped and ifAmbiguous are reject. This is the function you want at 11pm.",
    aliases: ["zoned", "in zone", "SkippedTimeError", "AmbiguousTimeError"],
  },
  {
    slug: "api/clock",
    title: "Clock.at",
    heading: "at",
    hash: "at",
    kind: "api",
    signature: "Clock.at(instant: Instant, zone: Zone): Clock",
    text: "What the wall clocks in a zone read at a known instant. Always unique.",
    aliases: ["convert timezone", "utc to local", "in zone"],
  },
  {
    slug: "api/clock",
    title: "Clock.addSpan",
    heading: "addSpan",
    hash: "addspan",
    kind: "api",
    signature: "Clock.addSpan(clock: Clock, span: Span): Clock",
    text: "Add an exact duration to the instant, then convert back. Crossing a spring-forward jumps the wall clock.",
    aliases: ["add hour", "physical time", "elapsed"],
  },
  {
    slug: "api/clock",
    title: "Clock.addCalendar",
    heading: "addCalendar",
    hash: "addcalendar",
    kind: "api",
    signature: "Clock.addCalendar(clock: Clock, calendar: Calendar, options?: ResolveOptions): Clock",
    text: "Add calendar units to the civil fields, then re-resolve. Tomorrow at the same clock time.",
    aliases: ["add day clock", "same time tomorrow", "meeting"],
  },
  {
    slug: "api/zone",
    title: "Zone.nextTransition",
    heading: "nextTransition",
    hash: "nexttransition",
    kind: "api",
    signature: "Zone.nextTransition(zone: Zone, instant: Instant): Transition | null",
    text: "The next offset change after an instant, or null in a zone that does not observe DST.",
    aliases: ["dst change", "when does the clock change", "transition"],
  },
  {
    slug: "api/span",
    title: "Span.of",
    heading: "of",
    hash: "of",
    kind: "api",
    signature: "Span.of({ hours, minutes, seconds, millis }): Span",
    text: "Exact duration. Days are not accepted. Use Calendar.of({ days }).",
    aliases: ["duration", "hours", "PT"],
  },
  {
    slug: "concepts/ambiguous",
    title: "SkippedTimeError",
    heading: "Gaps",
    hash: "gaps",
    kind: "concept",
    text: "Thrown when a civil time never occurs in that zone. Europe/London 2026-03-29T01:30 is the usual example.",
    aliases: ["SkippedTimeError", "does not exist", "spring", "01:30"],
  },
  {
    slug: "concepts/ambiguous",
    title: "AmbiguousTimeError",
    heading: "Overlaps",
    hash: "overlaps",
    kind: "concept",
    text: "Thrown when a civil time occurs twice. Europe/London 2026-10-25T01:30 happens as BST and as GMT.",
    aliases: ["AmbiguousTimeError", "twice", "fall back", "01:30 autumn"],
  },
  {
    slug: "limits",
    title: "Leap seconds",
    heading: "Leap seconds",
    hash: "leap-seconds",
    kind: "limit",
    text: "Instant uses Unix time. Leap seconds are not represented. 23:59:60 is a ParseError.",
    aliases: ["leap second", "23:59:60", "tai", "smear"],
  },
  {
    slug: "limits",
    title: "Relative time",
    heading: "Relative time",
    hash: "relative-time",
    kind: "limit",
    text: "Instant will not emit 2 hours ago. Use Intl.RelativeTimeFormat on a Span.",
    aliases: ["time ago", "from now", "relative", "pretty time"],
  },
  {
    slug: "migrate/v2",
    title: "Instant.parse breaking change",
    heading: "Parse",
    hash: "parse",
    kind: "migrate",
    text: "v1 treated offset-less ISO as UTC. v2 throws. Replace with Instant.parse(s + 'Z') or Civil.parse.",
    aliases: ["broke", "started throwing", "upgrade parse", "offset-less"],
  },
];

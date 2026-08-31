/**
 * The demonstration release.
 *
 * Bookings open at 10:00 on the first Monday of the month for the month after
 * next; the first Monday of September 2026 is the 7th, which releases November.
 * November 2026 begins on a Sunday, so the twenty dinner dates below are the
 * real Wednesday-to-Sunday dates of that month.
 *
 * The sold-out times are invented, not measured, and the booking page says so.
 * They are here because "gone within the hour" is a fact the site has to convey
 * and a column of times conveys it better than a sentence claiming it does.
 */
export type Night = {
  /** ISO date, used as the form value. */
  id: string;
  label: string;
  /** Seats left of eighteen. Zero means the date went in the release. */
  seats: number;
  /** Clock time the date sold out, for dates that did. */
  went?: string;
};

export const RELEASE_LABEL = "November 2026";
export const RELEASE_OPENED = "10:00, Monday 7 September";

export const NIGHTS: Night[] = [
  { id: "2026-11-01", label: "Sunday 1 November", seats: 0, went: "10:09" },
  { id: "2026-11-04", label: "Wednesday 4 November", seats: 0, went: "10:22" },
  { id: "2026-11-05", label: "Thursday 5 November", seats: 0, went: "10:17" },
  { id: "2026-11-06", label: "Friday 6 November", seats: 0, went: "10:04" },
  { id: "2026-11-07", label: "Saturday 7 November", seats: 0, went: "10:01" },
  { id: "2026-11-08", label: "Sunday 8 November", seats: 0, went: "10:12" },
  { id: "2026-11-11", label: "Wednesday 11 November", seats: 4, went: undefined },
  { id: "2026-11-12", label: "Thursday 12 November", seats: 0, went: "10:26" },
  { id: "2026-11-13", label: "Friday 13 November", seats: 0, went: "10:03" },
  { id: "2026-11-14", label: "Saturday 14 November", seats: 0, went: "10:01" },
  { id: "2026-11-15", label: "Sunday 15 November", seats: 2, went: undefined },
  { id: "2026-11-18", label: "Wednesday 18 November", seats: 0, went: "10:31" },
  { id: "2026-11-19", label: "Thursday 19 November", seats: 0, went: "10:14" },
  { id: "2026-11-20", label: "Friday 20 November", seats: 0, went: "10:02" },
  { id: "2026-11-21", label: "Saturday 21 November", seats: 0, went: "10:01" },
  { id: "2026-11-22", label: "Sunday 22 November", seats: 0, went: "10:19" },
  { id: "2026-11-25", label: "Wednesday 25 November", seats: 6, went: undefined },
  { id: "2026-11-26", label: "Thursday 26 November", seats: 0, went: "10:08" },
  { id: "2026-11-27", label: "Friday 27 November", seats: 0, went: "10:02" },
  { id: "2026-11-28", label: "Saturday 28 November", seats: 0, went: "10:01" },
  { id: "2026-11-29", label: "Sunday 29 November", seats: 0, went: "10:23" },
];

/**
 * The six confirmations, one for each term on the reading page. This is the one
 * piece of deliberate friction in the flow: it is cheaper for everyone to find
 * a misunderstanding here than at half past eight on the night.
 */
export const CONFIRMATIONS: { id: string; figure: string; text: string }[] = [
  {
    id: "price",
    figure: "£95",
    text: "£95 a head with service included, and wine on top of that.",
  },
  {
    id: "sitting",
    figure: "19:30",
    text: "The room sits together at 19:30 and seats are held only until 19:45.",
  },
  {
    id: "length",
    figure: "3 hours",
    text: "Dinner runs about three hours and cannot be shortened.",
  },
  {
    id: "choice",
    figure: "0",
    text: "Everyone is given the same nine or ten courses and nothing can be swapped on the night.",
  },
  {
    id: "diet",
    figure: "at booking",
    text: "Anything we need to cook around has to be on this form, not mentioned at the table.",
  },
  {
    id: "cancel",
    figure: "72 hours",
    text: "Inside seventy-two hours the full £95 a seat is charged, whether or not we come.",
  },
];

export const DIET_OPTIONS: { id: string; label: string }[] = [
  { id: "nuts", label: "Nuts" },
  { id: "shellfish", label: "Shellfish" },
  { id: "fish", label: "Fish" },
  { id: "dairy", label: "Dairy" },
  { id: "gluten", label: "Gluten / coeliac" },
  { id: "egg", label: "Egg" },
  { id: "no-meat", label: "No meat" },
  { id: "no-alcohol", label: "No alcohol" },
];

/* Party size is asked before the date, because a night with two seats left
   cannot take a table of four and it is better to grey it out than to refuse
   it afterwards. */
export const STEPS = [
  "Party",
  "Date",
  "Allergies",
  "The format",
  "Card",
] as const;

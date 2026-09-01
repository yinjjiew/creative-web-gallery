export const BASE = "/r/traditional-websites-saas-website";
export const TASK = "/tasks/traditional-websites-saas-website";

export const FIRM = {
  name: "Rota",
  legal: "Rota Ltd",
  place: "Sheffield",
  line: "Payroll and the rota, for independent restaurants",
  mail: "start@rota.example",
  phone: "0114 399 0140",
  phoneHref: "tel:+441143990140",
  hours: "Tuesday–Sunday, 08:00–22:00",
} as const;

export const NAV = [
  { href: BASE, id: "sunday", label: "Sunday" },
  { href: `${BASE}/product`, id: "product", label: "The work" },
  { href: `${BASE}/for`, id: "for", label: "For whom" },
  { href: `${BASE}/compare`, id: "compare", label: "Compared" },
  { href: `${BASE}/price`, id: "price", label: "Price" },
  { href: `${BASE}/move`, id: "move", label: "Moving" },
  { href: `${BASE}/help`, id: "help", label: "Help" },
  { href: `${BASE}/write`, id: "write", label: "Write" },
] as const;

export const PRICE = {
  site: 45,
  person: 3.8,
  setupRemote: 250,
  setupVisit: 400,
  smsIncluded: 80,
  smsPence: 4,
  annualMonths: 10,
} as const;

export function quote(sites: number, paid: number) {
  const site = PRICE.site * sites;
  const people = Math.round(PRICE.person * paid * 100) / 100;
  const total = Math.round((site + people) * 100) / 100;
  return { site, people, total };
}

export function gbp(n: number) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
  }).format(n);
}

/** Staves is a modelled 42-cover restaurant. The week is typical, not a case. */
export const STAVES = {
  name: "Staves",
  covers: 42,
  city: "Sheffield",
  onBooks: 31,
  paid: 28,
  weekEnding: "Sunday 24 August",
  saturdayCovers: 92,
  cardTips: 487.4,
  cashTips: 64,
} as const;

type Wage = {
  name: string;
  role: string;
  hours: string;
  rate: string;
  tips: string;
  pay: string;
  how: string;
  note?: string;
};

export const WAGES: Wage[] = [
  {
    name: "Maya Chen",
    role: "Waiter",
    hours: "38.50",
    rate: "£12.60",
    tips: "£87.20",
    pay: "£572.15",
    how: "BACS Friday",
  },
  {
    name: "Tomas Reid",
    role: "Waiter",
    hours: "44.00",
    rate: "£12.60",
    tips: "£91.10",
    pay: "£668.90",
    how: "BACS Friday",
    note: "Friday became a double after the 15:10 swap. Overtime on the last four hours.",
  },
  {
    name: "Kai Okonkwo",
    role: "Runner, 16",
    hours: "22.00",
    rate: "£8.60",
    tips: "£41.00",
    pay: "£230.20",
    how: "BACS Friday",
    note: "Wednesday was rostered to 22:30. That is night work. It has to come off.",
  },
  {
    name: "Denise Hart",
    role: "Waiter, left 8 Aug",
    hours: "0",
    rate: "—",
    tips: "—",
    pay: "£144.90",
    how: "Cheque",
    note: "Holiday still owing. She will not install an app. The cheque is the product.",
  },
];

export const INCIDENTS = [
  {
    when: "Friday 22 August, 15:10",
    title: "The late swap",
    body: "Jess asked Tomas to take her Friday night. Tomas had already done lunch, 12–15. The printed rota still had Jess on 17–22. If you pay the paper, Tomas is short and Jess is over. If you pay what actually happened, Tomas is now on a double and the last four hours are overtime. You found out at cash-up.",
  },
  {
    when: "Saturday 23 August, 23:50",
    title: "The tip pool",
    body: "Card tips £487.40, cash in the tin £64. Five on the floor, one bartender who also ran food from 19:00, three in the kitchen. The kitchen want their 15% this week because it was 92 covers. Your written policy — the one the Tips Act requires you to keep — says 70 / 20 / 10, floor / bar / kitchen. Last month you eyeballed it. Eyeballing it is now a written record you can be asked for.",
  },
  {
    when: "Wednesday 20 August",
    title: "The 16-year-old",
    body: "Kai is 16. You were short on the close and left him on until 22:30. In England that is night work for a young worker. It is not a scolding from a poster in the staff room. It is a thing an inspector can fine you for, and a thing a parent can use. The rota has to refuse the shift, not remind you after Sunday.",
  },
] as const;

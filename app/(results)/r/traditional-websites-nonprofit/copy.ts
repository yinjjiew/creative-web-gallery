/**
 * All public words for Duty.
 *
 * The clinic, the number, the rooms and the yearly figures are modelled.
 * The law sketched here is general information for England and Wales as at
 * September 2026, written in short sentences for someone who may not be
 * reading in their first language. It is not advice on a real case.
 */

export const PHONE_DISPLAY = "01632 960 441";
export const PHONE_TEL = "tel:+441632960441";

export const REAL = {
  acas: { display: "0300 123 1100", tel: "tel:+443001231100" },
  shelter: { display: "0808 800 4444", tel: "tel:+448088004444" },
  samaritans: { display: "116 123", tel: "tel:116123" },
  gas: { display: "0800 111 999", tel: "tel:+44800111999" },
  emergency: { display: "999", tel: "tel:999" },
} as const;

export type TopicId = "out" | "broken" | "debt" | "benefits" | "work" | "else";

export type LetterId = "landlord" | "court" | "bailiff";

export type Deadline = {
  title: string;
  body: string;
  miss: string;
};

export type Topic = {
  id: TopicId;
  key: string;
  label: string;
  hint: string;
  weHelp: boolean;
  yes: string;
  today: string[];
  deadline: Deadline;
  letters?: { id: LetterId; label: string; deadline: Deadline }[];
  more: string[];
};

export const TOPICS: Topic[] = [
  {
    id: "out",
    key: "1",
    label: "They want me out of my home",
    hint: "A letter says I must leave. Or someone told me to go.",
    weHelp: true,
    yes: "Yes. We help with this. Housing is the main thing we do.",
    today: [
      "Keep the letter. Photograph every page, including the back.",
      "Do not move out because a letter told you to. A letter is not the same as court bailiffs at the door.",
      "Call us or come to a drop-in. Bring the letter. Say if you have a date.",
      "If people are at your door now: ask if they are court bailiffs, and ask to see a warrant. You do not have to let a landlord or an agent in. If you are in danger, call 999.",
    ],
    deadline: {
      title: "The date on the letter is not always the day you must leave",
      body: "From 1 May 2026 a private landlord in England cannot use a “no fault” section 21 notice. They must give a section 8 notice with a reason, then get a court order, then use court bailiffs. Many letters that say “leave in 14 days” are not a court order.",
      miss: "If you leave when you do not have to, it is much harder to get help to stay or to be housed. Call before you pack.",
    },
    letters: [
      {
        id: "landlord",
        label: "From a landlord or agent",
        deadline: {
          title: "This is often a notice — not an eviction",
          body: "After 1 May 2026 a private landlord in England should use a section 8 notice (often Form 3A) and must give a reason. The leave-by date is the end of a notice period. If you stay, they must go to court. Do not miss a court letter that comes later.",
          miss: "The notice date is not usually the day you have to walk out. The date you must not miss is a court date, if one comes.",
        },
      },
      {
        id: "court",
        label: "From a court",
        deadline: {
          title: "Do not miss the hearing date",
          body: "Look for a time and a place. If you miss a possession hearing the court can decide without you. Call us before that date. Bring every page.",
          miss: "A missed hearing can end the case. Tell us the date when you call.",
        },
      },
      {
        id: "bailiff",
        label: "It says bailiff or eviction",
        deadline: {
          title: "That date — often about 14 days — is the one you must not miss",
          body: "After a court possession order you are usually given at least 14 days’ notice of the eviction date. Call us today. You can ask the court to delay a warrant. Do not wait until the morning they come.",
          miss: "Once bailiffs have executed a warrant, getting back in is rare. Call today.",
        },
      },
    ],
    more: [
      "If you could lose your home in the next 56 days, ask the council for a homelessness application as well. That is a separate duty they have. Do both: call us, and tell the council.",
      "Lodgers and some people who live with their landlord have fewer rights. That is why we need to see the letter.",
      "We advise on homes in England. If your home is in Wales, Scotland or Northern Ireland, say so when you call — the law is different.",
    ],
  },
  {
    id: "broken",
    key: "2",
    label: "The house is broken",
    hint: "No heat. Damp. Dangerous wiring. Water coming in.",
    weHelp: true,
    yes: "Yes. We help with this.",
    today: [
      "Tell the landlord or the council landlord, in writing. A text or an email counts. Photograph it.",
      "Photograph the problem. Take another photo every few days if it gets worse.",
      "Do not stop paying rent to force a repair. That can be used to evict you. Call us first.",
      "If it is dangerous tonight — no heat in cold weather, no water, unsafe electrics — call us and the council’s environmental health team. If you smell gas, call the gas emergency line on 0800 111 999. That number is real. It is not us.",
    ],
    deadline: {
      title: "There is no court clock on a broken house — unless they try to evict you for asking",
      body: "A landlord must keep the house fit and in repair. If they ignore you, we can help you write, involve the council, or take a claim. If they answer with a notice to leave, that is urgent. Come in with both letters.",
      miss: "Waiting months makes the house worse and makes the case harder to prove. Write today.",
    },
    more: [
      "Keep a simple list: the date you told them, what you said, and what they did. Bring it.",
    ],
  },
  {
    id: "debt",
    key: "3",
    label: "I owe money",
    hint: "Bailiffs. A court claim. Rent or council tax.",
    weHelp: true,
    yes: "Yes. We help with this.",
    today: [
      "Find the letter. Look for the word Claim, a court crest, or Notice of Enforcement.",
      "If it is a court claim and it came with the details of the claim, you often have 14 days to reply. If you do nothing they can get a judgment without you.",
      "Do not borrow more to pay this. Do not ignore it.",
      "Make a list of what you owe. Rent, council tax and energy come first — those can lose you the home.",
    ],
    deadline: {
      title: "14 days, if this is a court claim",
      body: "For most county court money claims in England and Wales you must reply within 14 days of the claim details arriving. You can send an “acknowledgment of service” (form N9) in those 14 days. That usually gives you 28 days from when the claim details arrived to send a defence. Some online claims print a different date — believe the date on the form.",
      miss: "If you miss it, they can get a County Court Judgment. That can lead to bailiffs. It is much harder to undo.",
    },
    more: [
      "Bailiffs collecting most consumer debts cannot usually force their way in on a first visit. You do not have to open the door. Stricter rules apply to magistrates’ court fines and some tax debts. Call us before you speak to them.",
      "Council tax is not the same as a credit card. It can move faster. Bring that letter first.",
    ],
  },
  {
    id: "benefits",
    key: "4",
    label: "A benefit stopped",
    hint: "Universal Credit, PIP, ESA, housing benefit. A decision letter.",
    weHelp: true,
    yes: "Yes. We help with this.",
    today: [
      "Keep the decision letter. Photograph every page.",
      "Look for the date at the top. The time to ask them to look again often starts from that date.",
      "Call us or come in. Do not wait until the month is over.",
      "If you have no money for food or the meter today, say so when you call. Ask the council for emergency help as well.",
    ],
    deadline: {
      title: "One month to ask them to look again",
      body: "For most DWP decisions — including Universal Credit — you should ask for a “mandatory reconsideration” (a review) within one month of the date on the letter. If they say no, you usually have one more month to appeal to a tribunal. Late requests can sometimes be accepted for up to about 13 months if you have a good reason. Do not rely on that.",
      miss: "If you miss the month, you can lose the right to appeal. Ask now, even if you are not sure of the words. “I want this looked at again” is enough.",
    },
    more: [
      "If you are on Universal Credit you can ask in your journal. Photograph the message. Then call us.",
    ],
  },
  {
    id: "work",
    key: "5",
    label: "I lost my job",
    hint: "Sacked. Forced out. Not paid. Treated badly at work.",
    weHelp: true,
    yes: "Yes. We help with this.",
    today: [
      "Write down your last day at work, and the day they told you.",
      "Keep the letter, the contract, wage slips and every email. If you still have the work email, copy the messages out today.",
      "Do not sign a settlement or an “I will not claim” paper until you have had advice. There is often a short window.",
      "Call us. The tribunal clock is short.",
    ],
    deadline: {
      title: "Usually 3 months, minus one day",
      body: "For most employment tribunal claims — unfair dismissal, discrimination, unpaid wages — you must start with Acas early conciliation within 3 months minus one day of the thing you complain about (or the last day you worked, for dismissal). Acas is a real public service, not us. Their number is 0300 123 1100. From 1 October 2026 many claims will have 6 months if the thing you complain about happens on or after that date. If it happened before then, the 3-month clock still applies. Do not wait to find out which.",
      miss: "If you miss the Acas deadline, a tribunal will usually refuse the claim. There is often no second chance. Going through a workplace appeal does not stop the clock.",
    },
    more: [
      "Interim relief — a rare, fast claim after some dismissals — can be 7 days. If you were dismissed for whistleblowing or union reasons, call us today.",
    ],
  },
  {
    id: "else",
    key: "6",
    label: "Something else",
    hint: "Family, immigration, crime, injury. Or I am not sure.",
    weHelp: false,
    yes: "We do not take these cases. Do not wait on this page.",
    today: [
      "If you are not safe tonight, call 999.",
      "If the police are holding you, ask for the duty solicitor. That is a different service, and it is free.",
      "Immigration advice must come from a person regulated by the OISC or a solicitor. We are not that.",
      "You can still call us. We will try to name the right place. Stay on the line.",
    ],
    deadline: {
      title: "We cannot see your deadline from here",
      body: "Other areas of law have their own clocks. A family hearing, an asylum date or a crime charge cannot be handled on this page.",
      miss: "Using a drop-in slot for a case we do not do takes a seat from someone in housing trouble. Phone first and we will say so quickly.",
    },
    more: [],
  },
];

export function topicById(id: TopicId): Topic {
  const found = TOPICS.find((t) => t.id === id);
  if (!found) throw new Error(`unknown topic ${id}`);
  return found;
}

export const DISCLAIMER =
  "This page is general information for England and Wales, not advice about your case. Reading it does not make us your solicitor. We become your solicitor only if we write to you to say we are taking your case.";

export const HONESTY =
  "Duty is a modelled clinic. The phone number, the three rooms and the yearly figures are invented. The law here is general information written in September 2026, not a measurement from a real file.";

export const IMPACT = [
  { label: "People at drop-in", value: "1,847", note: "last year, modelled" },
  { label: "Cases we opened", value: "412", note: "last year, modelled" },
  { label: "Solicitors", value: "2", note: "on the staff now" },
  { label: "Volunteers", value: "30", note: "on the rota now" },
  { label: "Income", value: "£184,000", note: "last year, modelled" },
  { label: "Of that, council grant", value: "61%", note: "modelled split" },
  { label: "Trust grants", value: "22%", note: "modelled split" },
  { label: "Donations", value: "17%", note: "modelled split" },
] as const;

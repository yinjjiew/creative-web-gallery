import { CAB, CHEM } from "./data";
import type { Bottle, CompatGroup, Refusal, SourceId } from "./types";

type Pair = {
  a: CompatGroup;
  b: CompatGroup;
  why: string;
  source: SourceId;
};

/**
 * Pairwise incompatibilities. Each cell cites a published reaction or a
 * published storage rule. Same-group storage is allowed except where a
 * cabinet's accept-list already isolates a class (oxidizing acids live alone
 * because the cabinet will not take anything else).
 */
const PAIRS: Pair[] = [
  {
    a: "flammable",
    b: "oxidizer",
    why: "Oxidizing agents and flammable solvents are marked incompatible: fire, and in some mixes detonation.",
    source: "epa-600",
  },
  {
    a: "flammable",
    b: "oxidizing-acid",
    why: "Oxidizing acids (nitric) on flammable organics — fire and evolution of nitrogen oxides.",
    source: "epa-600",
  },
  {
    a: "organic-acid",
    b: "oxidizing-acid",
    why: "Organic acids and nitric acid: the glacial acetic / nitric mixture is a documented runaway.",
    source: "epa-600",
  },
  {
    a: "organic-acid",
    b: "mineral-acid",
    why: "Prudent Practices keeps organic acids off the mineral-acid shelf so nitric cannot be parked beside acetic by habit.",
    source: "prudent-2011",
  },
  {
    a: "organic-acid",
    b: "oxidizer",
    why: "Organic acids with solid or liquid oxidizers — fire.",
    source: "epa-600",
  },
  {
    a: "mineral-acid",
    b: "base",
    why: "Mineral acids and alkalis: violent neutralization, heat, splash.",
    source: "epa-600",
  },
  {
    a: "oxidizing-acid",
    b: "base",
    why: "Oxidizing acids and alkalis: heat plus an oxidizer in the mix.",
    source: "epa-600",
  },
  {
    a: "mineral-acid",
    b: "oxidizer",
    why: "Some mineral-acid / oxidizer pairs liberate chlorine, bromine or other gases. Kept apart as a class.",
    source: "epa-600",
  },
  {
    a: "oxidizing-acid",
    b: "oxidizer",
    why: "Nitric is stored isolated. It is not parked with permanganate, peroxide or dichromate.",
    source: "prudent-2011",
  },
  {
    a: "flammable",
    b: "base",
    why: "Unverified as a universal reaction — this store still refuses aqueous bases in a flammable cabinet because the cabinet is rated for flammable liquids only.",
    source: "departmental",
  },
  {
    a: "water-reactive",
    b: "flammable",
    why: "Water-reactives are kept dry and alone. A flammable cabinet is not a dry-box.",
    source: "prudent-2011",
  },
  {
    a: "water-reactive",
    b: "organic-acid",
    why: "Water-reactives with acids: hydrogen, heat, ignition.",
    source: "epa-600",
  },
  {
    a: "water-reactive",
    b: "mineral-acid",
    why: "Alkali metals and mineral acids: hydrogen and heat.",
    source: "epa-600",
  },
  {
    a: "water-reactive",
    b: "oxidizing-acid",
    why: "Water-reactives and nitric acid: violent.",
    source: "epa-600",
  },
  {
    a: "water-reactive",
    b: "base",
    why: "Aqueous bases wet a water-reactive. Hydrogen.",
    source: "epa-600",
  },
  {
    a: "water-reactive",
    b: "oxidizer",
    why: "Water-reactives and oxidizers, including aqueous peroxide.",
    source: "epa-600",
  },
  {
    a: "water-reactive",
    b: "toxic",
    why: "Water-reactives stay in the desiccated cabinet. Nothing else shares it.",
    source: "prudent-2011",
  },
  {
    a: "water-reactive",
    b: "general",
    why: "Even dry salts stay out of the water-reactive cabinet so the desiccator is not opened for the wrong bottle.",
    source: "prudent-2011",
  },
  {
    a: "toxic",
    b: "flammable",
    why: "CMR / toxic liquids have their own locked cabinet. They are not stored in the flammable cupboard.",
    source: "prudent-2011",
  },
  {
    a: "toxic",
    b: "mineral-acid",
    why: "Acids on some toxics liberate HCN, H2S or other gases. Segregated as a class.",
    source: "epa-600",
  },
  {
    a: "toxic",
    b: "oxidizing-acid",
    why: "Oxidizing acids on toxics — gas evolution and fire.",
    source: "epa-600",
  },
  {
    a: "toxic",
    b: "oxidizer",
    why: "Toxics are not stored with oxidizers.",
    source: "prudent-2011",
  },
  {
    a: "toxic",
    b: "base",
    why: "Bases on some toxics liberate gas. Locked cabinet is single-class.",
    source: "epa-600",
  },
  {
    a: "base",
    b: "oxidizer",
    why: "Alkalis and oxidizers are a documented incompatible pair on the EPA chart.",
    source: "epa-600",
  },
  {
    a: "flammable",
    b: "mineral-acid",
    why: "Flammable solvents are not stored in the acid cabinet; some acid / solvent pairs heat or liberate gas.",
    source: "prudent-2011",
  },
  {
    a: "flammable",
    b: "organic-acid",
    why: "Glacial acetic is an organic acid and a flammable, but this store keeps it on the organic-acid shelf so it cannot sit beside nitric by being filed as 'flammable'.",
    source: "prudent-2011",
  },
  {
    a: "general",
    b: "mineral-acid",
    why: "General solids stay dry and off the acid shelf.",
    source: "prudent-2011",
  },
  {
    a: "general",
    b: "oxidizing-acid",
    why: "General solids are not stored with nitric acid.",
    source: "prudent-2011",
  },
  {
    a: "general",
    b: "base",
    why: "General solids are not stored in the base cabinet.",
    source: "prudent-2011",
  },
  {
    a: "general",
    b: "oxidizer",
    why: "General solids are not stored with oxidizers.",
    source: "prudent-2011",
  },
  {
    a: "general",
    b: "flammable",
    why: "The flammable cabinet is for flammable liquids only — a volume limit, not a spare shelf.",
    source: "hsg51",
  },
  {
    a: "general",
    b: "organic-acid",
    why: "General solids stay on the general shelf.",
    source: "prudent-2011",
  },
  {
    a: "general",
    b: "toxic",
    why: "The toxics cabinet is single-class and locked.",
    source: "prudent-2011",
  },
  {
    a: "mineral-acid",
    b: "oxidizing-acid",
    why: "Nitric is isolated from other mineral acids. Prudent Practices: oxidizing acids stored separately.",
    source: "prudent-2011",
  },
  {
    a: "organic-acid",
    b: "base",
    why: "Organic acids and alkalis: heat and splash.",
    source: "epa-600",
  },
];

const PAIR_MAP = new Map<string, Pair>();
for (const pair of PAIRS) {
  const key = [pair.a, pair.b].sort().join("|");
  PAIR_MAP.set(key, pair);
}

export function pairRule(a: CompatGroup, b: CompatGroup): Pair | null {
  if (a === b) return null;
  return PAIR_MAP.get([a, b].sort().join("|")) ?? null;
}

export function matrixCell(a: CompatGroup, b: CompatGroup): {
  ok: boolean;
  why: string;
  source: SourceId;
} {
  if (a === b) {
    return {
      ok: true,
      why: "Same class. The cabinet accept-list still applies — oxidizing acids, for example, have a cabinet to themselves.",
      source: "prudent-2011",
    };
  }
  const hit = pairRule(a, b);
  if (hit) return { ok: false, why: hit.why, source: hit.source };
  return {
    ok: true,
    why: "No published incompatibility recorded for this pair in the rules used here.",
    source: "epa-600",
  };
}

export function cabinetFill(cabinetId: string, bottles: Bottle[]): number {
  let fill = 0;
  for (const bottle of bottles) {
    if (bottle.cabinetId !== cabinetId) continue;
    if (bottle.state !== "stored" && bottle.state !== "quarantine") continue;
    fill += bottle.size;
  }
  return fill;
}

export function peroxideOverdue(
  bottle: Bottle,
  today: string,
  tested: Record<string, string>,
): boolean {
  const chem = CHEM[bottle.chemicalId];
  if (!chem.peroxide || !bottle.opened) return false;
  const last = tested[bottle.id] ?? bottle.opened;
  return diffDays(last, today) > chem.peroxide.testDays;
}

export function usableStock(
  chemicalId: string,
  bottles: Bottle[],
  today: string,
  tested: Record<string, string>,
): number {
  let sum = 0;
  for (const bottle of bottles) {
    if (bottle.chemicalId !== chemicalId) continue;
    if (bottle.state !== "stored" && bottle.state !== "receiving") continue;
    if (peroxideOverdue(bottle, today, tested)) continue;
    sum += bottle.remaining;
  }
  return sum;
}

export function tryPlace(bottle: Bottle, cabinetId: string, bottles: Bottle[]): Refusal | null {
  const cab = CAB[cabinetId];
  const chem = CHEM[bottle.chemicalId];
  if (!cab || !chem) {
    return {
      cabinetId,
      bottleId: bottle.id,
      title: "Unknown container",
      body: "That bottle or cabinet is not on the store list.",
      source: "departmental",
      kind: "state",
    };
  }

  if (bottle.state === "issued") {
    return {
      cabinetId,
      bottleId: bottle.id,
      title: "Already issued",
      body: "An issued bottle does not come back onto a shelf without a receive line.",
      source: "departmental",
      kind: "state",
    };
  }

  if (!cab.accepts.includes(chem.group)) {
    const against = cab.accepts[0];
    const hit = against ? pairRule(chem.group, against) : null;
    if (hit) {
      return {
        cabinetId,
        bottleId: bottle.id,
        title: "Incompatible — will not share",
        body: `${chem.name} cannot go into ${cab.plate} (${cab.name}). ${hit.why}`,
        source: hit.source,
        kind: "matrix",
      };
    }
    const want = cab.accepts.map((g) => g.replace("-", " ")).join(", ");
    return {
      cabinetId,
      bottleId: bottle.id,
      title: `${cab.plate} will not take ${chem.group.replace("-", " ")}`,
      body: `${cab.name} accepts ${want} only. ${chem.name} is stored as ${chem.group.replace("-", " ")}. Prudent Practices (2011, Ch. 5) stores by compatibility class, not by leftover space.`,
      source: "prudent-2011",
      kind: "class",
    };
  }

  for (const other of bottles) {
    if (other.id === bottle.id) continue;
    if (other.cabinetId !== cabinetId) continue;
    if (other.state !== "stored" && other.state !== "quarantine") continue;
    const og = CHEM[other.chemicalId].group;
    const hit = pairRule(chem.group, og);
    if (hit) {
      return {
        cabinetId,
        bottleId: bottle.id,
        title: "Incompatible in the same cabinet",
        body: `${chem.name} cannot share ${cab.plate} with ${CHEM[other.chemicalId].name}. ${hit.why}`,
        source: hit.source,
        kind: "matrix",
      };
    }
  }

  const current = cabinetFill(cabinetId, bottles.filter((b) => b.id !== bottle.id));
  const next = current + bottle.size;
  if (next > cab.capacity) {
    const unit = cab.liquid ? "L" : "kg";
    const cap = cab.liquid ? cab.capacity / 1000 : cab.capacity / 1000;
    const have = cab.liquid ? current / 1000 : current / 1000;
    const add = cab.liquid ? bottle.size / 1000 : bottle.size / 1000;
    return {
      cabinetId,
      bottleId: bottle.id,
      title: `${cab.plate} is full`,
      body: `${cab.plate} holds ${cap.toFixed(1)} ${unit}. It already has ${have.toFixed(1)} ${unit}. ${chem.name} (${add.toFixed(1)} ${unit}) will not fit. Capacity is a physical limit, not a warning. Cabinet ratings here are modelled on HSE HSG51; they are not a survey of a real room.`,
      source: "hsg51",
      kind: "capacity",
    };
  }

  return null;
}

export function diffDays(from: string, to: string): number {
  const a = Date.parse(`${from}T12:00:00Z`);
  const b = Date.parse(`${to}T12:00:00Z`);
  return Math.round((b - a) / 86_400_000);
}

export function addDays(iso: string, days: number): string {
  const d = new Date(`${iso}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function formatDay(iso: string): string {
  return new Date(`${iso}T12:00:00Z`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function formatShort(iso: string): string {
  return new Date(`${iso}T12:00:00Z`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
}

export function amountLabel(chemicalId: string, amount: number): string {
  const chem = CHEM[chemicalId];
  if (chem.liquid) {
    if (amount >= 1000) return `${(amount / 1000).toFixed(amount % 1000 === 0 ? 1 : 2)} L`;
    return `${Math.round(amount)} mL`;
  }
  if (amount >= 1000) return `${(amount / 1000).toFixed(2)} kg`;
  return `${Math.round(amount)} g`;
}

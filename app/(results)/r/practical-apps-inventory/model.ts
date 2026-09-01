import {
  BUDGET_LEFT,
  CAB,
  CHEM,
  PRACTICALS,
  SEED_AUDIT,
  SEED_BOTTLES,
  TECHNICIAN,
  TODAY,
} from "./data";
import {
  addDays,
  amountLabel,
  cabinetFill,
  peroxideOverdue,
  tryPlace,
  usableStock,
} from "./rules";
import type {
  AuditEvent,
  Bottle,
  Order,
  Persist,
  Practical,
  Refusal,
} from "./types";

const KEY = "stockroom.teaching.v1";

export type DemandRow = {
  practical: Practical;
  chemicalId: string;
  need: number;
  stock: number;
  reserved: number;
  available: number;
  short: number;
  orderBy: string;
  leadDays: number;
  status: "ok" | "watch" | "order" | "late";
};

export type Fear = {
  row: DemandRow;
  line: string;
};

export function load(): Persist | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Persist;
    if (!Array.isArray(parsed.bottles) || !Array.isArray(parsed.audit)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function save(state: Persist): boolean {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}

export function clear(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}

export function seed(): Persist {
  return {
    bottles: SEED_BOTTLES.map((b) => ({ ...b })),
    heldId: "eth-in",
    origin: { bottleId: "eth-in", cabinetId: null, state: "receiving" },
    audit: SEED_AUDIT.map((a) => ({ ...a })),
    orders: [],
    tested: {},
  };
}

export function demand(bottles: Bottle[], tested: Record<string, string>): DemandRow[] {
  const upcoming = [...PRACTICALS].sort((a, b) => a.date.localeCompare(b.date));
  const rows: DemandRow[] = [];
  const reserved: Record<string, number> = {};

  for (const practical of upcoming) {
    if (practical.date < TODAY) continue;
    for (const need of practical.needs) {
      const stock = usableStock(need.chemicalId, bottles, TODAY, tested);
      const already = reserved[need.chemicalId] ?? 0;
      const available = Math.max(0, stock - already);
      const short = Math.max(0, need.amount - available);
      const chem = CHEM[need.chemicalId];
      const orderBy = addDays(practical.date, -chem.leadDays);
      const daysToOrder = Math.round(
        (Date.parse(`${orderBy}T12:00:00Z`) - Date.parse(`${TODAY}T12:00:00Z`)) /
          86_400_000,
      );
      let status: DemandRow["status"] = "ok";
      if (short > 0) {
        if (daysToOrder < 0) status = "late";
        else if (daysToOrder <= 10) status = "order";
        else status = "watch";
      }
      rows.push({
        practical,
        chemicalId: need.chemicalId,
        need: need.amount,
        stock,
        reserved: already,
        available,
        short,
        orderBy,
        leadDays: chem.leadDays,
        status,
      });
      reserved[need.chemicalId] = already + need.amount;
    }
  }
  return rows;
}

export function fearOf(rows: DemandRow[]): Fear | null {
  const rank = { late: 0, order: 1, watch: 2, ok: 3 };
  const worst = [...rows].sort((a, b) => {
    const d = rank[a.status] - rank[b.status];
    if (d) return d;
    return b.short / Math.max(1, b.need) - a.short / Math.max(1, a.need);
  })[0];
  if (!worst || worst.status === "ok") return null;
  const chem = CHEM[worst.chemicalId];
  const who = `${worst.practical.course} · ${worst.practical.students} students`;
  if (worst.status === "late") {
    return {
      row: worst,
      line: `${who} on ${worst.practical.date} is ${amountLabel(chem.id, worst.short)} short of ${chem.name}. Lead time is ${String(worst.leadDays)} days. It will not arrive.`,
    };
  }
  if (worst.status === "order") {
    return {
      row: worst,
      line: `${who} on ${worst.practical.date} is ${amountLabel(chem.id, worst.short)} short of ${chem.name}. The approved grade has a ${String(worst.leadDays)}-day lead. Order by ${worst.orderBy} or the afternoon cannot run.`,
    };
  }
  return {
    row: worst,
    line: `${who} on ${worst.practical.date} will need ${amountLabel(chem.id, worst.need)} of ${chem.name}. Stock covers it only if nothing earlier takes a share.`,
  };
}

export function incomingVolume(chemicalId: string, packs: number): number {
  const chem = CHEM[chemicalId];
  return packs * chem.packSize;
}

export function freeCapacityFor(chemicalId: string, bottles: Bottle[]): number {
  const chem = CHEM[chemicalId];
  let free = 0;
  for (const cab of Object.values(CAB)) {
    if (!cab.accepts.includes(chem.group)) continue;
    if (cab.liquid !== chem.liquid) continue;
    free += Math.max(0, cab.capacity - cabinetFill(cab.id, bottles));
  }
  return free;
}

export function orderCost(chemicalId: string, packs: number): number {
  return CHEM[chemicalId].packGbp * packs;
}

export function spentOnOrders(orders: Order[]): number {
  return orders
    .filter((o) => o.status === "raised")
    .reduce((sum, o) => sum + orderCost(o.chemicalId, o.packs), 0);
}

export function raiseOrder(
  chemicalId: string,
  bottles: Bottle[],
  orders: Order[],
): { order: Order; note: string } {
  const chem = CHEM[chemicalId];
  const packs = chem.moqPacks;
  const volume = incomingVolume(chemicalId, packs);
  const free = freeCapacityFor(chemicalId, bottles);
  const cost = orderCost(chemicalId, packs);
  const left = BUDGET_LEFT - spentOnOrders(orders);

  if (cost > left) {
    return {
      order: {
        id: `ord-${chemicalId}-${String(orders.length + 1)}`,
        chemicalId,
        packs,
        raised: TODAY,
        status: "blocked-budget",
      },
      note: `£${cost} against £${left} left on the teaching-chemicals line (FY ends 31 March 2027). The academic year is only just starting. Unverified departmental budget.`,
    };
  }

  if (volume > free) {
    return {
      order: {
        id: `ord-${chemicalId}-${String(orders.length + 1)}`,
        chemicalId,
        packs,
        raised: TODAY,
        status: "blocked-capacity",
      },
      note: `Minimum order is ${String(packs)} × ${amountLabel(chemicalId, chem.packSize)} = ${amountLabel(chemicalId, volume)}. Free compatible capacity is ${amountLabel(chemicalId, free)}. The order is refused until a bottle leaves the store. Capacity is enforced.`,
    };
  }

  return {
    order: {
      id: `ord-${chemicalId}-${String(orders.length + 1)}`,
      chemicalId,
      packs,
      raised: TODAY,
      status: "raised",
    },
    note: `Raised ${String(packs)} × ${amountLabel(chemicalId, chem.packSize)} of ${chem.name}, due ${addDays(TODAY, chem.leadDays)}. £${cost} from the teaching line.`,
  };
}

export function placeBottle(
  bottles: Bottle[],
  bottleId: string,
  cabinetId: string,
): { bottles: Bottle[]; refusal: Refusal | null } {
  const bottle = bottles.find((b) => b.id === bottleId);
  if (!bottle) return { bottles, refusal: null };
  const refusal = tryPlace(bottle, cabinetId, bottles);
  if (refusal) return { bottles, refusal };
  return {
    bottles: bottles.map((b) =>
      b.id === bottleId
        ? { ...b, cabinetId, state: "stored" as const, opened: b.opened }
        : b,
    ),
    refusal: null,
  };
}

export function issueBottle(
  bottles: Bottle[],
  bottleId: string,
  practicalId: string | null,
  today: string,
  tested: Record<string, string>,
): { bottles: Bottle[]; dest: string | null; error: string | null } {
  const bottle = bottles.find((b) => b.id === bottleId);
  if (!bottle) return { bottles, dest: null, error: "No such bottle." };
  if (bottle.state !== "stored") {
    return {
      bottles,
      dest: null,
      error: "Only a stored bottle can be issued to a class store.",
    };
  }
  if (peroxideOverdue(bottle, today, tested)) {
    return {
      bottles,
      dest: null,
      error: `${CHEM[bottle.chemicalId].name} lot ${bottle.lot} is overdue for a peroxide test and cannot be issued. Quarantine it or log a test.`,
    };
  }
  const practical = PRACTICALS.find((p) => p.id === practicalId);
  const dest = practical ? `${practical.course} class store` : "class store";
  return {
    bottles: bottles.map((b) =>
      b.id === bottleId ? { ...b, state: "issued" as const, cabinetId: null } : b,
    ),
    dest,
    error: null,
  };
}

export function auditLine(
  kind: AuditEvent["kind"],
  bottle: Bottle,
  from: string,
  to: string,
  purpose: string,
  amount?: number,
): AuditEvent {
  const chem = CHEM[bottle.chemicalId];
  return {
    id: `live-${kind}-${bottle.id}-${Date.now()}`,
    at: `${TODAY}T09:00:00Z`,
    chemicalId: bottle.chemicalId,
    bottleId: bottle.id,
    amount: amount ?? bottle.remaining,
    unit: chem.liquid ? "mL" : "g",
    kind,
    from,
    to,
    by: TECHNICIAN,
    purpose,
  };
}

export function bottleOf(bottles: Bottle[], id: string | null): Bottle | undefined {
  if (!id) return undefined;
  return bottles.find((b) => b.id === id);
}

import type { Category, Product, Spec } from "./types";

/**
 * A modelled counter stock. Every line is generated from trade dimensions
 * (material, head, drive, gauge, length, finish, pack) so the catalogue can
 * be the size of a real ironmonger's without inventing four thousand unique
 * photographs. Provenance is stated on the shop floor.
 *
 * Thread pitch / TPI is taken from common British wood-screw and metric
 * machine-screw tables, not measured on a particular box.
 */

const WOOD_TPI: Record<number, string> = {
  4: "26 TPI",
  6: "20 TPI",
  8: "18 TPI",
  10: "16 TPI",
  12: "14 TPI",
  14: "14 TPI",
};

const METRIC_PITCH: Record<string, string> = {
  M3: "0.50 mm",
  M4: "0.70 mm",
  M5: "0.80 mm",
  M6: "1.00 mm",
  M8: "1.25 mm",
  M10: "1.50 mm",
  M12: "1.75 mm",
};

function pence(n: number): number {
  return Math.max(35, Math.round(n));
}

function imperial(mm: number): string {
  const eighths = Math.round((mm / 25.4) * 8);
  const whole = Math.floor(eighths / 8);
  const frac = eighths % 8;
  if (frac === 0) return `${String(whole)}″`;
  const g = frac % 4 === 0 ? 4 : frac % 2 === 0 ? 2 : 1;
  const pretty = `${String(frac / g)}/${String(8 / g)}`;
  return whole === 0 ? `${pretty}″` : `${String(whole)} ${pretty}″`;
}

function packLabel(qty: number, unit: Product["unit"]): string {
  if (unit === "metre") return "per metre";
  if (unit === "each") return "each";
  if (qty === 1) return "each";
  if (qty >= 100) return `box of ${String(qty)}`;
  return `card of ${String(qty)}`;
}

type Family = {
  id: string;
  category: Category;
  name: string;
  skuStem: string;
  material: string;
  finish: string;
  head?: string;
  drive?: string;
  gauges?: number[];
  diameters?: string[];
  lengthsMm?: number[];
  packs?: number[];
  unit?: Product["unit"];
  for: string[];
  notFor: string[];
  note: string;
  keywords: string[];
  price: (opts: { gauge?: number; diameter?: string; lengthMm?: number; pack: number }) => number;
  extraSpecs?: Spec[];
};

function withTradePacks(packs: number[]): number[] {
  const set = new Set(packs);
  if ((set.has(10) || set.has(4)) && (set.has(200) || set.has(100) || set.has(50)) && !set.has(50)) {
    set.add(50);
  }
  return [...set].sort((a, b) => a - b);
}

function fillLengths(lengths: number[]): number[] {
  const extra = [12, 16, 19, 20, 25, 30, 32, 35, 38, 40, 45, 50, 55, 60, 63, 70, 75, 80, 90, 100, 120];
  const min = Math.min(...lengths);
  const max = Math.max(...lengths);
  const set = new Set(lengths);
  for (const n of extra) {
    if (n >= min && n <= max) set.add(n);
  }
  return [...set].sort((a, b) => a - b);
}

function explodeWood(family: Family, products: Product[]) {
  const gauges = family.gauges ?? [8];
  const lengths = fillLengths(family.lengthsMm ?? [38, 50]);
  const packs = withTradePacks(family.packs ?? [10, 200]);
  for (const gauge of gauges) {
    for (const lengthMm of lengths) {
      for (const pack of packs) {
        const sku = `${family.skuStem}-${String(gauge)}-${String(lengthMm)}-${String(pack)}`;
        const extras = family.extraSpecs ?? [];
        const hasThread = extras.some((row) => row.label === "Thread");
        const specs: Spec[] = [
          { label: "Gauge", value: `${String(gauge)}g` },
          { label: "Length", value: `${String(lengthMm)} mm · ${imperial(lengthMm)}` },
          ...(hasThread
            ? []
            : [{ label: "Thread", value: WOOD_TPI[gauge] ?? "coarse wood thread" }]),
          { label: "Head", value: family.head ?? "—" },
          { label: "Drive", value: family.drive ?? "—" },
          { label: "Material", value: family.material },
          { label: "Finish", value: family.finish },
          { label: "Pack", value: packLabel(pack, "pack") },
          ...extras,
        ];
        products.push({
          sku,
          name: `${family.name}, ${String(gauge)}g × ${String(lengthMm)} mm`,
          category: family.category,
          familyId: family.id,
          familyName: family.name,
          specs,
          material: family.material,
          finish: family.finish,
          packQty: pack,
          unit: "pack",
          pricePence: family.price({ gauge, lengthMm, pack }),
          for: family.for,
          notFor: family.notFor,
          keywords: [
            ...family.keywords,
            `${String(gauge)}g`,
            `${String(lengthMm)}mm`,
            family.head ?? "",
            family.drive ?? "",
          ],
          counterNote: family.note,
        });
      }
    }
  }
}

function explodeMetric(family: Family, products: Product[]) {
  const diameters = family.diameters ?? ["M6"];
  const lengths = fillLengths(family.lengthsMm ?? [20, 30, 40]);
  const packs = withTradePacks(family.packs ?? [10, 100]);
  const unit = family.unit ?? "pack";
  for (const diameter of diameters) {
    for (const lengthMm of lengths) {
      for (const pack of packs) {
        const sku = `${family.skuStem}-${diameter}-${String(lengthMm)}-${String(pack)}`;
        const pitch = METRIC_PITCH[diameter] ?? "coarse";
        const specs: Spec[] = [
          { label: "Thread", value: `${diameter} × ${pitch}` },
          { label: "Length", value: `${String(lengthMm)} mm` },
          { label: "Head", value: family.head ?? "—" },
          { label: "Drive", value: family.drive ?? "—" },
          { label: "Material", value: family.material },
          { label: "Finish", value: family.finish },
          { label: "Pack", value: packLabel(pack, unit) },
          ...(family.extraSpecs ?? []),
        ];
        products.push({
          sku,
          name: `${family.name}, ${diameter} × ${String(lengthMm)} mm`,
          category: family.category,
          familyId: family.id,
          familyName: family.name,
          specs,
          material: family.material,
          finish: family.finish,
          packQty: pack,
          unit,
          pricePence: family.price({ diameter, lengthMm, pack }),
          for: family.for,
          notFor: family.notFor,
          keywords: [...family.keywords, diameter, `${String(lengthMm)}mm`],
          counterNote: family.note,
        });
      }
    }
  }
}

function explodeSimple(family: Family, products: Product[]) {
  const packs = family.packs ?? [1];
  const lengths = family.lengthsMm ?? [0];
  const unit = family.unit ?? "each";
  for (const lengthMm of lengths) {
    for (const pack of packs) {
      const sku =
        lengthMm > 0
          ? `${family.skuStem}-${String(lengthMm)}-${String(pack)}`
          : `${family.skuStem}-${String(pack)}`;
      const specs: Spec[] = [
        { label: "Material", value: family.material },
        { label: "Finish", value: family.finish },
        ...(lengthMm > 0
          ? [{ label: "Size", value: `${String(lengthMm)} mm` }]
          : []),
        { label: "Sold", value: packLabel(pack, unit) },
        ...(family.extraSpecs ?? []),
      ];
      const sizeBit = lengthMm > 0 ? `, ${String(lengthMm)} mm` : "";
      products.push({
        sku,
        name: `${family.name}${sizeBit}`,
        category: family.category,
        familyId: family.id,
        familyName: family.name,
        specs,
        material: family.material,
        finish: family.finish,
        packQty: pack,
        unit,
        pricePence: family.price({ lengthMm, pack }),
        for: family.for,
        notFor: family.notFor,
        keywords: [...family.keywords],
        counterNote: family.note,
      });
    }
  }
}

/** Thirty-one wood-screw families. The brief's central difficulty. */
const WOOD_SCREW_FAMILIES: Family[] = [
  {
    id: "ws-zn-csk-sl",
    category: "wood-screws",
    name: "Steel wood screw, CSK, slotted, bright zinc",
    skuStem: "WS-ZN-CSK-SL",
    material: "Mild steel",
    finish: "Bright zinc",
    head: "Countersunk",
    drive: "Slotted",
    gauges: [6, 8, 10],
    lengthsMm: [19, 25, 32, 38, 50, 63],
    packs: [10, 200],
    for: ["softwood indoors", "old slotted work", "restoration"],
    notFor: ["oak outdoors", "coastal", "masonry"],
    note: "The old pattern. Keep it for matching existing slotted work. Do not start a new job on slotted if you can help it — the bit walks.",
    keywords: ["wood screw", "slotted", "zinc", "countersunk", "csk"],
    price: ({ gauge = 8, lengthMm = 40, pack }) =>
      pence((8 + gauge + lengthMm * 0.08) * (pack === 200 ? 14 : 1.1)),
  },
  {
    id: "ws-zn-csk-pz",
    category: "wood-screws",
    name: "Steel wood screw, CSK, Pozidriv, bright zinc",
    skuStem: "WS-ZN-CSK-PZ",
    material: "Mild steel",
    finish: "Bright zinc",
    head: "Countersunk",
    drive: "Pozidriv",
    gauges: [4, 6, 8, 10, 12],
    lengthsMm: [16, 19, 25, 32, 38, 45, 50, 63, 75],
    packs: [10, 200],
    for: ["softwood indoors", "carcassing", "general joinery"],
    notFor: ["oak outdoors", "coastal", "treated timber long-term"],
    note: "The default indoor screw. Pozidriv, not Phillips — a Phillips bit will cam out and ruin the head. Zinc is paint, not armour; it is not for weather.",
    keywords: ["wood screw", "pozidriv", "pz", "zinc", "countersunk"],
    price: ({ gauge = 8, lengthMm = 40, pack }) =>
      pence((7 + gauge + lengthMm * 0.07) * (pack === 200 ? 13 : 1)),
  },
  {
    id: "ws-yz-csk-pz",
    category: "wood-screws",
    name: "Steel wood screw, CSK, Pozidriv, yellow zinc",
    skuStem: "WS-YZ-CSK-PZ",
    material: "Mild steel",
    finish: "Yellow zinc",
    head: "Countersunk",
    drive: "Pozidriv",
    gauges: [6, 8, 10, 12],
    lengthsMm: [25, 32, 38, 50, 63, 75],
    packs: [10, 200],
    for: ["softwood indoors", "workshop", "where you want to see them"],
    notFor: ["oak outdoors", "visible brass work"],
    note: "Same screw as bright zinc. The yellow is so you can find it on a dirty bench. It is not a weather finish.",
    keywords: ["wood screw", "yellow", "pozidriv", "countersunk"],
    price: ({ gauge = 8, lengthMm = 40, pack }) =>
      pence((7.5 + gauge + lengthMm * 0.07) * (pack === 200 ? 13 : 1)),
  },
  {
    id: "ws-jp-csk-sl",
    category: "wood-screws",
    name: "Steel wood screw, CSK, slotted, black japanned",
    skuStem: "WS-JP-CSK-SL",
    material: "Mild steel",
    finish: "Black japanned",
    head: "Countersunk",
    drive: "Slotted",
    gauges: [6, 8, 10],
    lengthsMm: [19, 25, 32, 38, 50],
    packs: [10, 200],
    for: ["dark interior ironmongery", "japanned fittings"],
    notFor: ["outdoors", "oak", "structural"],
    note: "Japanning is a stove enamel. It looks right on black ironmongery and it chips if you drive it carelessly. Not a coating that survives rain.",
    keywords: ["wood screw", "japanned", "black", "slotted"],
    price: ({ gauge = 8, lengthMm = 40, pack }) =>
      pence((9 + gauge + lengthMm * 0.08) * (pack === 200 ? 15 : 1.2)),
  },
  {
    id: "ws-a2-csk-pz",
    category: "wood-screws",
    name: "A2 stainless wood screw, CSK, Pozidriv",
    skuStem: "WS-A2-CSK-PZ",
    material: "A2 stainless (304)",
    finish: "Unplated stainless",
    head: "Countersunk",
    drive: "Pozidriv",
    gauges: [6, 8, 10, 12],
    lengthsMm: [25, 32, 38, 50, 63, 75, 100],
    packs: [10, 200],
    for: ["outdoors inland", "softwood fence", "garden joinery"],
    notFor: ["coastal", "oak (use bronze or A4)", "masonry"],
    note: "A2 is inland stainless. It will stain on oak — oak is acidic — and it will pit if the weather tastes of salt. For oak or the coast, keep walking down this list.",
    keywords: ["wood screw", "stainless", "a2", "304", "outdoor", "pozidriv"],
    price: ({ gauge = 8, lengthMm = 40, pack }) =>
      pence((18 + gauge * 1.4 + lengthMm * 0.16) * (pack === 200 ? 16 : 1.3)),
  },
  {
    id: "ws-a2-csk-tx",
    category: "wood-screws",
    name: "A2 stainless wood screw, CSK, Torx",
    skuStem: "WS-A2-CSK-TX",
    material: "A2 stainless (304)",
    finish: "Unplated stainless",
    head: "Countersunk",
    drive: "Torx T20 / T25",
    gauges: [8, 10, 12],
    lengthsMm: [32, 38, 50, 63, 75, 100],
    packs: [10, 200],
    for: ["outdoors inland", "decking subframe inland", "high-torque driving"],
    notFor: ["coastal", "oak"],
    note: "Same metal as the Pozidriv A2. Torx if you are driving hundreds and you are tired of cam-out. The bit is not the one in a supermarket pack.",
    keywords: ["wood screw", "stainless", "a2", "torx", "star"],
    price: ({ gauge = 8, lengthMm = 40, pack }) =>
      pence((20 + gauge * 1.4 + lengthMm * 0.16) * (pack === 200 ? 16 : 1.3)),
  },
  {
    id: "ws-a4-csk-pz",
    category: "wood-screws",
    name: "A4 stainless wood screw, CSK, Pozidriv",
    skuStem: "WS-A4-CSK-PZ",
    material: "A4 stainless (316)",
    finish: "Unplated stainless",
    head: "Countersunk",
    drive: "Pozidriv",
    gauges: [8, 10, 12],
    lengthsMm: [32, 38, 50, 63, 75, 100],
    packs: [10, 200],
    for: ["coastal", "oak outdoors", "gates in weather"],
    notFor: ["indoor carcassing (waste of money)", "masonry"],
    note: "A4 is the coastal and oak answer. Molybdenum in the alloy. If they said ‘stainless’ and they live near the water, this is the one they meant.",
    keywords: ["wood screw", "stainless", "a4", "316", "marine", "coastal", "oak"],
    price: ({ gauge = 8, lengthMm = 40, pack }) =>
      pence((28 + gauge * 1.8 + lengthMm * 0.22) * (pack === 200 ? 17 : 1.5)),
  },
  {
    id: "ws-a4-csk-tx",
    category: "wood-screws",
    name: "A4 stainless wood screw, CSK, Torx",
    skuStem: "WS-A4-CSK-TX",
    material: "A4 stainless (316)",
    finish: "Unplated stainless",
    head: "Countersunk",
    drive: "Torx T25",
    gauges: [8, 10, 12],
    lengthsMm: [38, 50, 63, 75, 100],
    packs: [10, 200],
    for: ["coastal", "oak outdoors", "decking near weather"],
    notFor: ["indoor carcassing"],
    note: "A4, Torx. The box a decking gang on the coast should be buying. Not the green-coated steel that has already been returned twice this year.",
    keywords: ["wood screw", "stainless", "a4", "torx", "marine"],
    price: ({ gauge = 8, lengthMm = 40, pack }) =>
      pence((30 + gauge * 1.8 + lengthMm * 0.22) * (pack === 200 ? 17 : 1.5)),
  },
  {
    id: "ws-br-csk-sl",
    category: "wood-screws",
    name: "Brass wood screw, CSK, slotted",
    skuStem: "WS-BR-CSK-SL",
    material: "Brass",
    finish: "Unplated brass",
    head: "Countersunk",
    drive: "Slotted",
    gauges: [4, 6, 8],
    lengthsMm: [16, 19, 25, 32, 38, 50],
    packs: [10, 200],
    for: ["brass furniture", "interior joinery on show", "softwood"],
    notFor: ["structural", "oak outdoors", "high torque"],
    note: "Brass is for looking at. It shears if you lean on it. Pilot the hole. Do not use it to hang a gate.",
    keywords: ["wood screw", "brass", "slotted", "countersunk"],
    price: ({ gauge = 6, lengthMm = 30, pack }) =>
      pence((16 + gauge * 1.6 + lengthMm * 0.14) * (pack === 200 ? 15 : 1.4)),
  },
  {
    id: "ws-br-rsd-sl",
    category: "wood-screws",
    name: "Brass wood screw, raised head, slotted",
    skuStem: "WS-BR-RSD-SL",
    material: "Brass",
    finish: "Unplated brass",
    head: "Raised",
    drive: "Slotted",
    gauges: [4, 6, 8],
    lengthsMm: [16, 19, 25, 32, 38],
    packs: [10, 100],
    for: ["visible fittings", "switch plates", "light ironmongery"],
    notFor: ["structural", "outdoors"],
    note: "Raised head sits on the plate, not in it. Same soft metal. Same warning.",
    keywords: ["wood screw", "brass", "raised", "slotted"],
    price: ({ gauge = 6, lengthMm = 25, pack }) =>
      pence((17 + gauge * 1.6 + lengthMm * 0.14) * (pack >= 100 ? 12 : 1.4)),
  },
  {
    id: "ws-sb-csk-sl",
    category: "wood-screws",
    name: "Silicon bronze wood screw, CSK, slotted",
    skuStem: "WS-SB-CSK-SL",
    material: "Silicon bronze",
    finish: "Unplated bronze",
    head: "Countersunk",
    drive: "Slotted",
    gauges: [8, 10, 12],
    lengthsMm: [32, 38, 50, 63, 75],
    packs: [10, 100],
    for: ["oak outdoors", "boats", "church doors", "conservation"],
    notFor: ["cheap indoor carcassing"],
    note: "The oak-outdoors answer that will still be there in fifty years. Bronze does not mind acid timber. It costs what it costs. A4 is the modern substitute; this is the one the old shop would have sold.",
    keywords: ["wood screw", "bronze", "silicon", "oak", "boat", "conservation"],
    price: ({ gauge = 8, lengthMm = 40, pack }) =>
      pence((42 + gauge * 2.4 + lengthMm * 0.3) * (pack >= 100 ? 14 : 1.8)),
  },
  {
    id: "ws-zn-rsd-pz",
    category: "wood-screws",
    name: "Steel wood screw, raised, Pozidriv, bright zinc",
    skuStem: "WS-ZN-RSD-PZ",
    material: "Mild steel",
    finish: "Bright zinc",
    head: "Raised",
    drive: "Pozidriv",
    gauges: [6, 8, 10],
    lengthsMm: [19, 25, 32, 38, 50],
    packs: [10, 200],
    for: ["fitting on the surface", "cups and plates"],
    notFor: ["flush work", "outdoors"],
    note: "Raised so the head sits proud. Wrong if you wanted it flush.",
    keywords: ["wood screw", "raised", "pozidriv", "zinc"],
    price: ({ gauge = 8, lengthMm = 32, pack }) =>
      pence((8 + gauge + lengthMm * 0.07) * (pack === 200 ? 13 : 1)),
  },
  {
    id: "ws-zn-rnd-sl",
    category: "wood-screws",
    name: "Steel wood screw, round head, slotted, bright zinc",
    skuStem: "WS-ZN-RND-SL",
    material: "Mild steel",
    finish: "Bright zinc",
    head: "Round",
    drive: "Slotted",
    gauges: [6, 8, 10],
    lengthsMm: [19, 25, 32, 38, 50],
    packs: [10, 200],
    for: ["surface fixings", "old pattern ironmongery"],
    notFor: ["flush work"],
    note: "Round head, fully proud. The pattern on half the ironmongery in this town from before 1970.",
    keywords: ["wood screw", "round", "slotted", "zinc"],
    price: ({ gauge = 8, lengthMm = 32, pack }) =>
      pence((8 + gauge + lengthMm * 0.07) * (pack === 200 ? 13 : 1)),
  },
  {
    id: "ws-zn-pan-pz",
    category: "wood-screws",
    name: "Steel wood screw, pan head, Pozidriv, bright zinc",
    skuStem: "WS-ZN-PAN-PZ",
    material: "Mild steel",
    finish: "Bright zinc",
    head: "Pan",
    drive: "Pozidriv",
    gauges: [6, 8, 10],
    lengthsMm: [16, 19, 25, 32, 38],
    packs: [10, 200],
    for: ["sheet to timber", "clips", "hardware on the face"],
    notFor: ["flush joinery", "outdoors"],
    note: "Pan head clamps a fitting. It will not sink. Do not use it where you wanted countersunk.",
    keywords: ["wood screw", "pan", "pozidriv", "zinc"],
    price: ({ gauge = 8, lengthMm = 25, pack }) =>
      pence((7 + gauge + lengthMm * 0.07) * (pack === 200 ? 13 : 1)),
  },
  {
    id: "ws-yz-pan-pz",
    category: "wood-screws",
    name: "Steel wood screw, pan head, Pozidriv, yellow zinc",
    skuStem: "WS-YZ-PAN-PZ",
    material: "Mild steel",
    finish: "Yellow zinc",
    head: "Pan",
    drive: "Pozidriv",
    gauges: [6, 8, 10],
    lengthsMm: [16, 19, 25, 32, 38],
    packs: [10, 200],
    for: ["sheet to timber", "clips"],
    notFor: ["flush joinery", "outdoors"],
    note: "Yellow so you can see it. Same screw as the bright pan.",
    keywords: ["wood screw", "pan", "yellow", "pozidriv"],
    price: ({ gauge = 8, lengthMm = 25, pack }) =>
      pence((7.5 + gauge + lengthMm * 0.07) * (pack === 200 ? 13 : 1)),
  },
  {
    id: "ws-a2-pan-pz",
    category: "wood-screws",
    name: "A2 stainless wood screw, pan head, Pozidriv",
    skuStem: "WS-A2-PAN-PZ",
    material: "A2 stainless (304)",
    finish: "Unplated stainless",
    head: "Pan",
    drive: "Pozidriv",
    gauges: [6, 8, 10],
    lengthsMm: [19, 25, 32, 38, 50],
    packs: [10, 200],
    for: ["outdoor fittings on the face", "inland"],
    notFor: ["coastal", "oak"],
    note: "Pan, A2, inland. For a fitting that sits on timber in the garden, not in it.",
    keywords: ["wood screw", "pan", "stainless", "a2"],
    price: ({ gauge = 8, lengthMm = 32, pack }) =>
      pence((18 + gauge * 1.3 + lengthMm * 0.15) * (pack === 200 ? 16 : 1.3)),
  },
  {
    id: "ws-a2-rsd-pz",
    category: "wood-screws",
    name: "A2 stainless wood screw, raised, Pozidriv",
    skuStem: "WS-A2-RSD-PZ",
    material: "A2 stainless (304)",
    finish: "Unplated stainless",
    head: "Raised",
    drive: "Pozidriv",
    gauges: [6, 8, 10],
    lengthsMm: [19, 25, 32, 38],
    packs: [10, 100],
    for: ["outdoor plates inland"],
    notFor: ["coastal", "flush work"],
    note: "Raised A2. For a house number or a plate that has to survive a winter inland.",
    keywords: ["wood screw", "raised", "stainless", "a2"],
    price: ({ gauge = 8, lengthMm = 25, pack }) =>
      pence((19 + gauge * 1.3 + lengthMm * 0.15) * (pack >= 100 ? 12 : 1.3)),
  },
  {
    id: "ws-jp-rnd-sl",
    category: "wood-screws",
    name: "Steel wood screw, round head, slotted, black japanned",
    skuStem: "WS-JP-RND-SL",
    material: "Mild steel",
    finish: "Black japanned",
    head: "Round",
    drive: "Slotted",
    gauges: [6, 8, 10],
    lengthsMm: [19, 25, 32, 38],
    packs: [10, 100],
    for: ["black ironmongery", "interior"],
    notFor: ["outdoors"],
    note: "Matches japanned hooks and hasps. The enamel chips. Not weatherproof.",
    keywords: ["wood screw", "japanned", "round", "black"],
    price: ({ gauge = 8, lengthMm = 25, pack }) =>
      pence((9 + gauge + lengthMm * 0.08) * (pack >= 100 ? 12 : 1.2)),
  },
  {
    id: "ws-zn-csk-ph",
    category: "wood-screws",
    name: "Steel wood screw, CSK, Phillips, bright zinc",
    skuStem: "WS-ZN-CSK-PH",
    material: "Mild steel",
    finish: "Bright zinc",
    head: "Countersunk",
    drive: "Phillips",
    gauges: [6, 8, 10],
    lengthsMm: [25, 32, 38, 50],
    packs: [10, 200],
    for: ["matching existing Phillips work"],
    notFor: ["new work (use Pozidriv)", "outdoors"],
    note: "We stock it because people bring the bit they have. Phillips was designed to cam out. If you are starting a job, buy Pozidriv.",
    keywords: ["wood screw", "phillips", "crosshead", "zinc"],
    price: ({ gauge = 8, lengthMm = 32, pack }) =>
      pence((6.5 + gauge + lengthMm * 0.06) * (pack === 200 ? 12 : 0.95)),
  },
  {
    id: "ws-ch-hx-zn",
    category: "wood-screws",
    name: "Coach screw, hex, bright zinc",
    skuStem: "WS-CH-HX-ZN",
    material: "Mild steel",
    finish: "Bright zinc",
    head: "Hexagon",
    drive: "Spanner / socket",
    gauges: [8, 10, 12],
    lengthsMm: [50, 63, 75, 100],
    packs: [4, 50],
    for: ["heavy timber inland", "sleepers", "brackets"],
    notFor: ["oak outdoors", "coastal", "fine joinery"],
    note: "A coach screw is a lag. Pilot it or it splits the end grain. Zinc, so not for weather you care about.",
    keywords: ["coach", "lag", "hex", "sleeper"],
    extraSpecs: [{ label: "Thread", value: "coarse coach / lag" }],
    price: ({ gauge = 10, lengthMm = 75, pack }) =>
      pence((22 + gauge * 2 + lengthMm * 0.2) * (pack >= 50 ? 8 : 1.1)),
  },
  {
    id: "ws-ch-hx-a2",
    category: "wood-screws",
    name: "Coach screw, hex, A2 stainless",
    skuStem: "WS-CH-HX-A2",
    material: "A2 stainless (304)",
    finish: "Unplated stainless",
    head: "Hexagon",
    drive: "Spanner / socket",
    gauges: [10, 12],
    lengthsMm: [50, 75, 100],
    packs: [4, 25],
    for: ["heavy timber outdoors inland", "play equipment"],
    notFor: ["coastal (ask for A4 coach)", "fine joinery"],
    note: "A2 coach. The sleeper in the garden, not on the sea wall.",
    keywords: ["coach", "lag", "stainless", "a2", "hex"],
    extraSpecs: [{ label: "Thread", value: "coarse coach / lag" }],
    price: ({ gauge = 10, lengthMm = 75, pack }) =>
      pence((48 + gauge * 3 + lengthMm * 0.35) * (pack >= 25 ? 7 : 1.4)),
  },
  {
    id: "ws-tf-csk-pz",
    category: "wood-screws",
    name: "Twinfast chipboard screw, CSK, Pozidriv, yellow zinc",
    skuStem: "WS-TF-CSK-PZ",
    material: "Mild steel",
    finish: "Yellow zinc",
    head: "Countersunk",
    drive: "Pozidriv",
    gauges: [6, 8],
    lengthsMm: [16, 25, 30, 40, 50],
    packs: [10, 200],
    for: ["chipboard", "MDF", "carcassing", "kitchen units"],
    notFor: ["oak", "outdoors", "structural timber"],
    note: "Twinfast is a double-start thread for man-made board. It will chew a hole in oak and it will rust in a month outside. It is the kitchen-unit screw.",
    keywords: ["chipboard", "twinfast", "mdf", "carcass", "pozidriv"],
    extraSpecs: [{ label: "Thread", value: "twin-start coarse" }],
    price: ({ gauge = 8, lengthMm = 30, pack }) =>
      pence((5 + gauge + lengthMm * 0.05) * (pack === 200 ? 11 : 0.9)),
  },
  {
    id: "ws-dk-csk-tx",
    category: "wood-screws",
    name: "Decking screw, CSK, Torx, green coated",
    skuStem: "WS-DK-CSK-TX",
    material: "Hardened steel",
    finish: "Green ceramic coat",
    head: "Countersunk",
    drive: "Torx T25",
    gauges: [8, 10],
    lengthsMm: [50, 63, 75],
    packs: [10, 200],
    for: ["softwood decking inland", "treated pine"],
    notFor: ["oak", "coastal", "hardwood decking"],
    note: "The green coat is a sales finish. Inland, on treated pine, it lasts a few seasons. Coastal or oak, it is a callback. We will sell you A4 instead if you will let us.",
    keywords: ["decking", "green", "torx", "deck"],
    extraSpecs: [{ label: "Thread", value: "coarse, type-17 point" }],
    price: ({ gauge = 10, lengthMm = 63, pack }) =>
      pence((10 + gauge + lengthMm * 0.1) * (pack === 200 ? 14 : 1.1)),
  },
  {
    id: "ws-dk-a2-tx",
    category: "wood-screws",
    name: "Decking screw, CSK, Torx, A2 stainless",
    skuStem: "WS-DK-A2-TX",
    material: "A2 stainless (304)",
    finish: "Unplated stainless",
    head: "Countersunk",
    drive: "Torx T25",
    gauges: [8, 10],
    lengthsMm: [50, 63, 75],
    packs: [10, 200],
    for: ["decking inland", "composite boards inland"],
    notFor: ["coastal (use A4)", "oak"],
    note: "Decking, A2, inland. The one we would rather sell than the green box.",
    keywords: ["decking", "stainless", "a2", "torx"],
    extraSpecs: [{ label: "Thread", value: "coarse, type-17 point" }],
    price: ({ gauge = 10, lengthMm = 63, pack }) =>
      pence((24 + gauge * 1.5 + lengthMm * 0.18) * (pack === 200 ? 16 : 1.4)),
  },
  {
    id: "ws-dw-bgl-ph",
    category: "wood-screws",
    name: "Drywall screw, bugle, Phillips, black phosphate",
    skuStem: "WS-DW-BGL-PH",
    material: "Hardened steel",
    finish: "Black phosphate",
    head: "Bugle",
    drive: "Phillips",
    gauges: [6],
    lengthsMm: [25, 32, 38, 50, 75],
    packs: [50, 500],
    for: ["plasterboard to timber", "plasterboard to stud"],
    notFor: ["timber to timber structural", "outdoors", "masonry"],
    note: "A drywall screw is brittle. It snaps if you use it as a wood screw. Board to stud only. The black is phosphate, not decoration, and it rusts in a wet room.",
    keywords: ["drywall", "plasterboard", "bugle", "phillips", "board"],
    extraSpecs: [{ label: "Thread", value: "fine or coarse, drywall" }],
    price: ({ lengthMm = 38, pack }) =>
      pence((3 + lengthMm * 0.04) * (pack >= 500 ? 18 : 2)),
  },
  {
    id: "ws-dw-bgl-zn",
    category: "wood-screws",
    name: "Drywall screw, bugle, Phillips, zinc",
    skuStem: "WS-DW-BGL-ZN",
    material: "Hardened steel",
    finish: "Bright zinc",
    head: "Bugle",
    drive: "Phillips",
    gauges: [6],
    lengthsMm: [25, 32, 38, 50],
    packs: [50, 500],
    for: ["plasterboard in a wet room (still not ideal)", "board to stud"],
    notFor: ["outdoors", "timber structure"],
    note: "Zinc drywall. Slightly less eager to rust in a bathroom than phosphate. Still a drywall screw. Still brittle.",
    keywords: ["drywall", "plasterboard", "zinc", "bugle"],
    extraSpecs: [{ label: "Thread", value: "coarse, drywall" }],
    price: ({ lengthMm = 38, pack }) =>
      pence((3.4 + lengthMm * 0.04) * (pack >= 500 ? 18 : 2)),
  },
  {
    id: "ws-st-pan-pz",
    category: "self-tappers",
    name: "Self-tapping screw, pan, Pozidriv, bright zinc",
    skuStem: "ST-ZN-PAN-PZ",
    material: "Hardened steel",
    finish: "Bright zinc",
    head: "Pan",
    drive: "Pozidriv",
    gauges: [6, 8, 10],
    lengthsMm: [13, 16, 19, 25, 32],
    packs: [10, 200],
    for: ["sheet metal", "flashing", "trunking"],
    notFor: ["timber (use a wood screw)", "masonry"],
    note: "Self-tappers cut their own thread in thin metal. They make a mess of timber and they do not hold in a wall.",
    keywords: ["self tapper", "self-tapping", "sheet", "metal", "pan"],
    extraSpecs: [{ label: "Thread", value: "AB self-tapping" }],
    price: ({ gauge = 8, lengthMm = 19, pack }) =>
      pence((6 + gauge + lengthMm * 0.08) * (pack === 200 ? 12 : 1)),
  },
  {
    id: "ws-st-csk-pz",
    category: "self-tappers",
    name: "Self-tapping screw, CSK, Pozidriv, bright zinc",
    skuStem: "ST-ZN-CSK-PZ",
    material: "Hardened steel",
    finish: "Bright zinc",
    head: "Countersunk",
    drive: "Pozidriv",
    gauges: [6, 8, 10],
    lengthsMm: [13, 16, 19, 25],
    packs: [10, 200],
    for: ["flush in sheet metal"],
    notFor: ["timber", "masonry"],
    note: "Countersunk self-tapper. Same metal job, flush head.",
    keywords: ["self tapper", "countersunk", "sheet"],
    extraSpecs: [{ label: "Thread", value: "AB self-tapping" }],
    price: ({ gauge = 8, lengthMm = 16, pack }) =>
      pence((6 + gauge + lengthMm * 0.08) * (pack === 200 ? 12 : 1)),
  },
  {
    id: "ws-sec-csk-pt",
    category: "wood-screws",
    name: "Security wood screw, CSK, pin-Torx, A2",
    skuStem: "WS-SEC-CSK-PT",
    material: "A2 stainless (304)",
    finish: "Unplated stainless",
    head: "Countersunk",
    drive: "Pin-Torx (security)",
    gauges: [8, 10],
    lengthsMm: [32, 38, 50, 63],
    packs: [10, 100],
    for: ["number plates", "external ironmongery you do not want walked away"],
    notFor: ["anything you will want to undo with a normal driver"],
    note: "Pin-Torx. You will need the bit. We sell the bit. Do not put these on a cupboard you open every day.",
    keywords: ["security", "pin torx", "anti theft", "stainless"],
    extraSpecs: [{ label: "Thread", value: WOOD_TPI[8] ?? "18 TPI" }],
    price: ({ gauge = 8, lengthMm = 38, pack }) =>
      pence((22 + gauge * 1.5 + lengthMm * 0.16) * (pack >= 100 ? 12 : 1.4)),
  },
  {
    id: "ws-cut-csk-sl",
    category: "wood-screws",
    name: "Cut-thread wood screw, CSK, slotted, bright steel",
    skuStem: "WS-CUT-CSK-SL",
    material: "Mild steel",
    finish: "Bright unplated",
    head: "Countersunk",
    drive: "Slotted",
    gauges: [8, 10, 12],
    lengthsMm: [32, 38, 50, 63, 75],
    packs: [10, 100],
    for: ["old joinery", "conservation", "matching cut-thread work"],
    notFor: ["new carcassing", "outdoors without oiling"],
    note: "Cut thread, not rolled. The old way. It holds in seasoned timber in a way a rolled cheap screw does not, and it rusts if you leave it bright. For a sash that has always had them.",
    keywords: ["cut thread", "traditional", "slotted", "conservation"],
    extraSpecs: [{ label: "Thread", value: "cut, not rolled" }],
    price: ({ gauge = 8, lengthMm = 50, pack }) =>
      pence((14 + gauge * 1.2 + lengthMm * 0.12) * (pack >= 100 ? 12 : 1.3)),
  },
  {
    id: "ws-a2-csk-sl",
    category: "wood-screws",
    name: "A2 stainless wood screw, CSK, slotted",
    skuStem: "WS-A2-CSK-SL",
    material: "A2 stainless (304)",
    finish: "Unplated stainless",
    head: "Countersunk",
    drive: "Slotted",
    gauges: [6, 8, 10],
    lengthsMm: [25, 32, 38, 50, 63],
    packs: [10, 100],
    for: ["conservation outdoors inland", "matching slotted stainless"],
    notFor: ["coastal", "high-volume new work"],
    note: "Slotted stainless. For the job where the surveyor will look at the head. Slow to drive. Correct on the right door.",
    keywords: ["wood screw", "stainless", "slotted", "conservation", "a2"],
    price: ({ gauge = 8, lengthMm = 38, pack }) =>
      pence((20 + gauge * 1.4 + lengthMm * 0.16) * (pack >= 100 ? 12 : 1.4)),
  },
];

const MACHINE: Family[] = [
  {
    id: "ms-csk-pz-zn",
    category: "machine-screws",
    name: "Machine screw, CSK, Pozidriv, bright zinc",
    skuStem: "MS-ZN-CSK-PZ",
    material: "Mild steel",
    finish: "Bright zinc",
    head: "Countersunk",
    drive: "Pozidriv",
    diameters: ["M4", "M5", "M6", "M8"],
    lengthsMm: [12, 16, 20, 25, 30, 40, 50],
    packs: [10, 100],
    for: ["tapped holes", "machine parts", "with a nut"],
    notFor: ["timber (no purchase)", "masonry"],
    note: "A machine screw needs a nut or a tapped hole. It will spin in wood. Thread pitch is on the ticket — do not mix coarse and fine.",
    keywords: ["machine screw", "metric", "pozidriv", "csk"],
    price: ({ diameter = "M6", lengthMm = 25, pack }) =>
      pence((5 + diameter.length + (lengthMm ?? 20) * 0.06) * (pack >= 100 ? 9 : 0.9)),
  },
  {
    id: "ms-pan-pz-zn",
    category: "machine-screws",
    name: "Machine screw, pan, Pozidriv, bright zinc",
    skuStem: "MS-ZN-PAN-PZ",
    material: "Mild steel",
    finish: "Bright zinc",
    head: "Pan",
    drive: "Pozidriv",
    diameters: ["M3", "M4", "M5", "M6", "M8"],
    lengthsMm: [10, 12, 16, 20, 25, 30, 40],
    packs: [10, 100],
    for: ["tapped holes", "with a nut", "electrical plates"],
    notFor: ["timber", "masonry"],
    note: "Pan machine. The everyday metric fastener. Pitch is standard coarse — written on every line.",
    keywords: ["machine screw", "pan", "metric"],
    price: ({ diameter = "M5", lengthMm = 20, pack }) =>
      pence((4.5 + (lengthMm ?? 20) * 0.06) * (pack >= 100 ? 9 : 0.85)),
  },
  {
    id: "ms-csk-pz-a2",
    category: "machine-screws",
    name: "Machine screw, CSK, Pozidriv, A2 stainless",
    skuStem: "MS-A2-CSK-PZ",
    material: "A2 stainless (304)",
    finish: "Unplated stainless",
    head: "Countersunk",
    drive: "Pozidriv",
    diameters: ["M4", "M5", "M6", "M8"],
    lengthsMm: [12, 16, 20, 25, 30, 40],
    packs: [10, 100],
    for: ["outdoor machine work inland", "with A2 nuts"],
    notFor: ["timber", "coastal (use A4)"],
    note: "A2 machine. Match the nut. Mixed metals stain.",
    keywords: ["machine screw", "stainless", "a2", "metric"],
    price: ({ lengthMm = 20, pack }) =>
      pence((12 + (lengthMm ?? 20) * 0.12) * (pack >= 100 ? 10 : 1.2)),
  },
  {
    id: "ms-hex-zn",
    category: "machine-screws",
    name: "Set screw, hex, bright zinc",
    skuStem: "MS-ZN-HEX",
    material: "Grade 8.8 steel",
    finish: "Bright zinc",
    head: "Hexagon",
    drive: "Spanner",
    diameters: ["M6", "M8", "M10", "M12"],
    lengthsMm: [16, 20, 25, 30, 40, 50, 60],
    packs: [10, 50],
    for: ["bolted joints", "brackets with nuts"],
    notFor: ["timber without a coach or coach-bolt"],
    note: "A set screw is fully threaded. If you wanted a shank, you wanted a bolt. Grade 8.8.",
    keywords: ["set screw", "hex", "metric", "8.8"],
    extraSpecs: [{ label: "Grade", value: "8.8" }],
    price: ({ diameter = "M8", lengthMm = 30, pack }) =>
      pence((8 + (lengthMm ?? 30) * 0.1) * (pack >= 50 ? 7 : 1)),
  },
];

const NAIL_FAMILIES: Family[] = [
  {
    id: "nl-round-wire",
    category: "nails",
    name: "Round wire nail, bright",
    skuStem: "NL-RW-BR",
    material: "Mild steel",
    finish: "Bright",
    lengthsMm: [25, 40, 50, 65, 75, 100],
    packs: [50, 500],
    for: ["carcassing", "softwood frames"],
    notFor: ["oak (bends)", "outdoors long-term"],
    note: "The nail in the keg. Bends in hard timber. Rusts outside.",
    keywords: ["nail", "wire", "round"],
    extraSpecs: [{ label: "Shank", value: "smooth round" }],
    price: ({ lengthMm = 50, pack }) =>
      pence((2 + (lengthMm ?? 50) * 0.03) * (pack >= 500 ? 16 : 2)),
  },
  {
    id: "nl-oval",
    category: "nails",
    name: "Oval lost-head nail, bright",
    skuStem: "NL-OV-BR",
    material: "Mild steel",
    finish: "Bright",
    lengthsMm: [40, 50, 65],
    packs: [50, 500],
    for: ["joinery", "where the head must disappear"],
    notFor: ["structural frames", "masonry"],
    note: "Oval so it can be punched and filled. Not for holding a building up.",
    keywords: ["nail", "oval", "lost head"],
    extraSpecs: [{ label: "Shank", value: "oval" }],
    price: ({ lengthMm = 50, pack }) =>
      pence((2.4 + (lengthMm ?? 50) * 0.03) * (pack >= 500 ? 16 : 2)),
  },
  {
    id: "nl-galvanised",
    category: "nails",
    name: "Round wire nail, galvanised",
    skuStem: "NL-RW-GV",
    material: "Mild steel",
    finish: "Hot-dip galvanised",
    lengthsMm: [50, 65, 75, 100],
    packs: [50, 500],
    for: ["outdoor softwood", "fencing inland"],
    notFor: ["oak (stains and dies)", "fine joinery"],
    note: "Galv for outdoor pine. Oak will blacken around it and then eat it. Stainless or bronze nails for oak — we have few of those, and we will say so.",
    keywords: ["nail", "galvanised", "fence"],
    extraSpecs: [{ label: "Shank", value: "smooth round" }],
    price: ({ lengthMm = 65, pack }) =>
      pence((3 + (lengthMm ?? 65) * 0.04) * (pack >= 500 ? 16 : 2.2)),
  },
  {
    id: "nl-panel-pin",
    category: "nails",
    name: "Panel pin, bright",
    skuStem: "NL-PP-BR",
    material: "Mild steel",
    finish: "Bright",
    lengthsMm: [15, 20, 25, 30, 40],
    packs: [50, 500],
    for: ["mouldings", "beads", "light joinery"],
    notFor: ["structure", "outdoors"],
    note: "A pin. Hold the bead, not the door.",
    keywords: ["panel pin", "pin", "bead"],
    extraSpecs: [{ label: "Shank", value: "fine pin" }],
    price: ({ lengthMm = 25, pack }) =>
      pence((1.6 + (lengthMm ?? 25) * 0.03) * (pack >= 500 ? 14 : 1.6)),
  },
  {
    id: "nl-masonry",
    category: "nails",
    name: "Masonry nail, hardened",
    skuStem: "NL-MS-HD",
    material: "Hardened steel",
    finish: "Bright",
    lengthsMm: [25, 40, 50, 65],
    packs: [50, 250],
    for: ["soft brick", "block", "plugging a batten"],
    notFor: ["engineering brick", "concrete (use an anchor)", "timber-to-timber"],
    note: "Hardened. It will snap and fly if you hit a flint. Goggles. Not a substitute for a plug and screw in anything that matters.",
    keywords: ["masonry nail", "brick nail", "hardened"],
    extraSpecs: [{ label: "Shank", value: "fluted hardened" }],
    price: ({ lengthMm = 40, pack }) =>
      pence((4 + (lengthMm ?? 40) * 0.05) * (pack >= 250 ? 12 : 2)),
  },
];

const BOLT_FAMILIES: Family[] = [
  {
    id: "bt-hex-zn",
    category: "bolts",
    name: "Hex bolt, part-threaded, bright zinc",
    skuStem: "BT-HX-ZN",
    material: "Grade 8.8 steel",
    finish: "Bright zinc",
    head: "Hexagon",
    drive: "Spanner",
    diameters: ["M6", "M8", "M10", "M12"],
    lengthsMm: [30, 40, 50, 60, 80, 100],
    packs: [4, 25],
    for: ["brackets", "steelwork", "with a nut and washer"],
    notFor: ["timber without a coach-bolt"],
    note: "Part-threaded: there is a shank. That is the difference from a set screw. Grade 8.8, coarse pitch.",
    keywords: ["bolt", "hex", "8.8"],
    extraSpecs: [{ label: "Grade", value: "8.8" }],
    price: ({ lengthMm = 50, pack }) =>
      pence((14 + (lengthMm ?? 50) * 0.12) * (pack >= 25 ? 6 : 1.1)),
  },
  {
    id: "bt-coach-zn",
    category: "bolts",
    name: "Coach bolt, square neck, bright zinc",
    skuStem: "BT-CB-ZN",
    material: "Mild steel",
    finish: "Bright zinc",
    head: "Domed, square neck",
    drive: "Held by the neck",
    diameters: ["M8", "M10", "M12"],
    lengthsMm: [50, 80, 100, 120],
    packs: [4, 25],
    for: ["timber to timber", "play equipment inland", "gates inland"],
    notFor: ["steel-to-steel (use a hex bolt)", "coastal"],
    note: "The neck bites the timber so you can tighten from one side. Needs a washer under the nut or it pulls in.",
    keywords: ["coach bolt", "carriage", "cup square"],
    price: ({ lengthMm = 80, pack }) =>
      pence((16 + (lengthMm ?? 80) * 0.1) * (pack >= 25 ? 6 : 1.2)),
  },
  {
    id: "bt-coach-a2",
    category: "bolts",
    name: "Coach bolt, square neck, A2 stainless",
    skuStem: "BT-CB-A2",
    material: "A2 stainless (304)",
    finish: "Unplated stainless",
    head: "Domed, square neck",
    drive: "Held by the neck",
    diameters: ["M8", "M10"],
    lengthsMm: [50, 80, 100],
    packs: [4, 20],
    for: ["timber gates inland", "outdoor furniture inland"],
    notFor: ["coastal (A4)", "steelwork"],
    note: "A2 coach bolt. Match with A2 nut and washer or the nut will seize and stain.",
    keywords: ["coach bolt", "stainless", "a2"],
    price: ({ lengthMm = 80, pack }) =>
      pence((38 + (lengthMm ?? 80) * 0.2) * (pack >= 20 ? 6 : 1.5)),
  },
];

const NUT_FAMILIES: Family[] = [
  {
    id: "nt-hex-zn",
    category: "nuts",
    name: "Hex nut, bright zinc",
    skuStem: "NT-HX-ZN",
    material: "Grade 8 steel",
    finish: "Bright zinc",
    diameters: ["M4", "M5", "M6", "M8", "M10", "M12"],
    lengthsMm: [0],
    packs: [10, 100],
    for: ["matching zinc bolts and set screws"],
    notFor: ["stainless work (it will corrode)"],
    note: "Coarse pitch, standard hex. Match the thread on the bolt exactly — M8 × 1.25 is not M8 fine.",
    keywords: ["nut", "hex"],
    extraSpecs: [{ label: "Thread", value: "coarse metric" }],
    price: ({ diameter = "M8", pack }) =>
      pence((3 + (diameter === "M12" ? 4 : 1)) * (pack >= 100 ? 8 : 0.7)),
  },
  {
    id: "nt-hex-a2",
    category: "nuts",
    name: "Hex nut, A2 stainless",
    skuStem: "NT-HX-A2",
    material: "A2 stainless (304)",
    finish: "Unplated stainless",
    diameters: ["M5", "M6", "M8", "M10"],
    lengthsMm: [0],
    packs: [10, 50],
    for: ["A2 bolts and machine screws"],
    notFor: ["zinc bolts (mixed metals)"],
    note: "A2 nut for A2 thread. Anti-seize if it will ever come apart.",
    keywords: ["nut", "stainless", "a2"],
    extraSpecs: [{ label: "Thread", value: "coarse metric" }],
    price: ({ pack }) => pence(8 * (pack >= 50 ? 6 : 1)),
  },
  {
    id: "nt-nyloc-zn",
    category: "nuts",
    name: "Nyloc nut, bright zinc",
    skuStem: "NT-NY-ZN",
    material: "Grade 8 steel, nylon insert",
    finish: "Bright zinc",
    diameters: ["M6", "M8", "M10", "M12"],
    lengthsMm: [0],
    packs: [10, 50],
    for: ["where vibration would undo a plain nut"],
    notFor: ["high heat (nylon melts)", "reuse (the insert is single-use)"],
    note: "The nylon is the lock. Once off, bin it. Not for a stove or an exhaust.",
    keywords: ["nyloc", "lock nut", "nylon"],
    extraSpecs: [{ label: "Thread", value: "coarse metric, nylon insert" }],
    price: ({ pack }) => pence(7 * (pack >= 50 ? 6 : 1)),
  },
];

const WASHER_FAMILIES: Family[] = [
  {
    id: "wsr-flat-zn",
    category: "washers",
    name: "Flat washer, form A, bright zinc",
    skuStem: "WR-FL-ZN",
    material: "Mild steel",
    finish: "Bright zinc",
    diameters: ["M5", "M6", "M8", "M10", "M12"],
    lengthsMm: [0],
    packs: [20, 200],
    for: ["under a nut on timber or painted steel"],
    notFor: ["as a substitute for the right size nut"],
    note: "Form A. Spreads the load. On timber, use a larger penny washer.",
    keywords: ["washer", "flat", "form a"],
    extraSpecs: [{ label: "Form", value: "A (standard)" }],
    price: ({ pack }) => pence(2 * (pack >= 200 ? 10 : 0.6)),
  },
  {
    id: "wsr-penny-zn",
    category: "washers",
    name: "Penny washer, bright zinc",
    skuStem: "WR-PN-ZN",
    material: "Mild steel",
    finish: "Bright zinc",
    diameters: ["M6", "M8", "M10"],
    lengthsMm: [0],
    packs: [10, 100],
    for: ["timber", "soft materials", "under a coach-bolt nut"],
    notFor: ["tight steelwork"],
    note: "A big washer. Stops the nut pulling through a fence arris.",
    keywords: ["penny washer", "repair washer"],
    extraSpecs: [{ label: "Form", value: "penny / repair" }],
    price: ({ pack }) => pence(4 * (pack >= 100 ? 8 : 0.8)),
  },
  {
    id: "wsr-spring-zn",
    category: "washers",
    name: "Spring washer, bright zinc",
    skuStem: "WR-SP-ZN",
    material: "Spring steel",
    finish: "Bright zinc",
    diameters: ["M6", "M8", "M10", "M12"],
    lengthsMm: [0],
    packs: [20, 200],
    for: ["light vibration", "old habit"],
    notFor: ["where a nyloc or a proper lock is specified"],
    note: "A spring washer is a habit more than an engineering choice. We sell them because people ask. A nyloc is usually what they meant.",
    keywords: ["spring washer", "shakeproof"],
    extraSpecs: [{ label: "Form", value: "single coil spring" }],
    price: ({ pack }) => pence(2.4 * (pack >= 200 ? 10 : 0.6)),
  },
];

const PLUG_FAMILIES: Family[] = [
  {
    id: "pl-brown",
    category: "plugs",
    name: "Wall plug, brown, nylon",
    skuStem: "PL-BR-NY",
    material: "Nylon",
    finish: "Brown",
    lengthsMm: [30, 40, 50],
    packs: [25, 100],
    for: ["solid brick", "block", "with a 7–8g screw"],
    notFor: ["plasterboard (it spins)", "aerated block without care"],
    note: "Brown is the solid-wall plug. Drill the right hole — 7 mm for most brown — blow the dust out, or it will spin. It is not a plasterboard fixing.",
    keywords: ["wall plug", "rawlplug", "brown", "nylon", "brick"],
    extraSpecs: [
      { label: "Drill", value: "7 mm" },
      { label: "Screw", value: "7–10g or 4–5 mm" },
    ],
    price: ({ pack }) => pence(3 * (pack >= 100 ? 8 : 1.2)),
  },
  {
    id: "pl-red",
    category: "plugs",
    name: "Wall plug, red, nylon",
    skuStem: "PL-RD-NY",
    material: "Nylon",
    finish: "Red",
    lengthsMm: [25, 35],
    packs: [25, 100],
    for: ["solid brick with a smaller screw", "6–8g"],
    notFor: ["plasterboard", "heavy shelves"],
    note: "Red is smaller than brown. 6 mm hole. Same rule about dust.",
    keywords: ["wall plug", "red", "nylon"],
    extraSpecs: [
      { label: "Drill", value: "6 mm" },
      { label: "Screw", value: "6–8g" },
    ],
    price: ({ pack }) => pence(2.6 * (pack >= 100 ? 8 : 1.1)),
  },
  {
    id: "pl-yellow",
    category: "plugs",
    name: "Wall plug, yellow, nylon",
    skuStem: "PL-YL-NY",
    material: "Nylon",
    finish: "Yellow",
    lengthsMm: [20, 30],
    packs: [25, 100],
    for: ["light fittings on solid wall", "4–6g"],
    notFor: ["shelves", "plasterboard", "TVs"],
    note: "Yellow is the light one. Pictures, not cupboards.",
    keywords: ["wall plug", "yellow", "nylon"],
    extraSpecs: [
      { label: "Drill", value: "5 mm" },
      { label: "Screw", value: "4–6g" },
    ],
    price: ({ pack }) => pence(2.2 * (pack >= 100 ? 8 : 1)),
  },
  {
    id: "pl-plasterboard",
    category: "plugs",
    name: "Plasterboard plug, metal self-drive",
    skuStem: "PL-PB-SD",
    material: "Zinc alloy",
    finish: "Zinc",
    lengthsMm: [30],
    packs: [10, 50],
    for: ["plasterboard where there is no stud", "light-to-medium loads"],
    notFor: ["solid wall", "a television", "a cupboard full of plates"],
    note: "Self-drive into the board. Find the stud if you can; this is the consolation prize. A heavy thing wants a cavity anchor or a batten.",
    keywords: ["plasterboard plug", "drywall anchor", "self drive"],
    extraSpecs: [{ label: "Board", value: "9.5–15 mm" }],
    price: ({ pack }) => pence(8 * (pack >= 50 ? 7 : 1.3)),
  },
  {
    id: "pl-cavity",
    category: "plugs",
    name: "Cavity anchor, steel, M5",
    skuStem: "PL-CV-M5",
    material: "Steel",
    finish: "Zinc",
    lengthsMm: [40, 55],
    packs: [10, 50],
    for: ["cavity walls", "heavier board loads"],
    notFor: ["solid brick (use a nylon plug)"],
    note: "The wings open in the cavity. You need the setting tool or a long screw and patience. Not a brown plug.",
    keywords: ["cavity", "anchor", "toggle", "hollow"],
    extraSpecs: [{ label: "Thread", value: "M5 × 0.80 mm" }],
    price: ({ pack }) => pence(18 * (pack >= 50 ? 7 : 1.4)),
  },
  {
    id: "pl-rawlbolt",
    category: "plugs",
    name: "Shield anchor (rawlbolt), zinc",
    skuStem: "PL-RB-ZN",
    material: "Steel shield",
    finish: "Zinc",
    diameters: ["M8", "M10", "M12"],
    lengthsMm: [0],
    packs: [4, 25],
    for: ["concrete", "solid dense masonry", "structural brackets"],
    notFor: ["plasterboard", "soft brick", "aerated block"],
    note: "A rawlbolt is a shield in a drilled hole. Concrete and dense masonry. Soft brick just crumbles around it. Torque it; do not guess.",
    keywords: ["rawlbolt", "shield anchor", "concrete"],
    extraSpecs: [{ label: "Use", value: "through-fix or flush, as marked" }],
    price: ({ diameter = "M10", pack }) =>
      pence((40 + (diameter === "M12" ? 20 : 0)) * (pack >= 25 ? 6 : 1.3)),
  },
];

const HINGE_FAMILIES: Family[] = [
  {
    id: "hg-butt-steel",
    category: "hinges",
    name: "Butt hinge, steel, uncranked",
    skuStem: "HG-BT-ST",
    material: "Mild steel",
    finish: "Bright steel",
    lengthsMm: [75, 100],
    packs: [1],
    unit: "each",
    for: ["internal doors", "cupboard doors on timber"],
    notFor: ["gates", "stone", "a door that already pulled its screws out (fix the rebate first)"],
    note: "Sold in pairs. 75 mm for a cupboard, 100 mm for a room door. If the old screws pulled out, the timber is tired — longer screws into the carcass, not a bigger hinge.",
    keywords: ["hinge", "butt", "door"],
    extraSpecs: [
      { label: "Sold", value: "pair" },
      { label: "Knuckles", value: "3 or 5, as stamped" },
    ],
    price: ({ lengthMm = 100 }) => pence(lengthMm === 100 ? 420 : 280),
  },
  {
    id: "hg-butt-brass",
    category: "hinges",
    name: "Butt hinge, solid brass",
    skuStem: "HG-BT-BR",
    material: "Brass",
    finish: "Polished brass",
    lengthsMm: [75, 100],
    packs: [1],
    unit: "each",
    for: ["interior doors on show", "joinery"],
    notFor: ["heavy exterior gates", "unlacquered coastal"],
    note: "Brass butt. Match the screws (brass, slotted, raised or CSK). Steel screws on a brass hinge look like a mistake because they are one.",
    keywords: ["hinge", "butt", "brass"],
    extraSpecs: [{ label: "Sold", value: "pair" }],
    price: ({ lengthMm = 100 }) => pence(lengthMm === 100 ? 980 : 720),
  },
  {
    id: "hg-butt-a2",
    category: "hinges",
    name: "Butt hinge, A2 stainless",
    skuStem: "HG-BT-A2",
    material: "A2 stainless (304)",
    finish: "Unplated stainless",
    lengthsMm: [75, 100],
    packs: [1],
    unit: "each",
    for: ["exterior doors inland", "wet rooms"],
    notFor: ["coastal (A4 hinge, we can order)"],
    note: "A2 butt for a painted exterior door inland. Stainless screws, not zinc.",
    keywords: ["hinge", "butt", "stainless"],
    extraSpecs: [{ label: "Sold", value: "pair" }],
    price: ({ lengthMm = 100 }) => pence(lengthMm === 100 ? 860 : 640),
  },
  {
    id: "hg-tee",
    category: "hinges",
    name: "Tee hinge, galvanised",
    skuStem: "HG-TE-GV",
    material: "Mild steel",
    finish: "Galvanised",
    lengthsMm: [200, 300, 400],
    packs: [1],
    unit: "each",
    for: ["ledges and braces", "shed doors", "light gates"],
    notFor: ["a heavy field gate (use hook and band)", "interior furniture"],
    note: "Tee hinge. The strap goes on the door, the plate on the post. Length is the strap. A sagging gate often wants a longer strap and a better post, not a third cheap hinge.",
    keywords: ["tee hinge", "t hinge", "shed", "gate"],
    extraSpecs: [{ label: "Sold", value: "pair" }],
    price: ({ lengthMm = 300 }) => pence(180 + (lengthMm ?? 300)),
  },
  {
    id: "hg-strap",
    category: "hinges",
    name: "Hook and band, galvanised",
    skuStem: "HG-HB-GV",
    material: "Mild steel",
    finish: "Galvanised",
    lengthsMm: [450, 600],
    packs: [1],
    unit: "each",
    for: ["field gates", "heavy boarded doors"],
    notFor: ["internal cupboard doors"],
    note: "The proper gate hinge. The hook goes in the post, the band on the gate. If the gate has dropped, check the post before you buy a new pair.",
    keywords: ["hook and band", "gate hinge", "strap"],
    extraSpecs: [{ label: "Sold", value: "pair, hooks included" }],
    price: ({ lengthMm = 450 }) => pence(900 + (lengthMm ?? 450)),
  },
  {
    id: "hg-parliament",
    category: "hinges",
    name: "Parliament hinge, steel",
    skuStem: "HG-PA-ST",
    material: "Mild steel",
    finish: "Bright steel",
    lengthsMm: [100],
    packs: [1],
    unit: "each",
    for: ["a door that must fold back flat to the wall"],
    notFor: ["a standard room door that does not need to"],
    note: "Parliament hinges throw the door clear of an architrave. If you do not have that problem, you do not want this hinge.",
    keywords: ["parliament hinge", "projection"],
    extraSpecs: [{ label: "Throw", value: "clears architrave" }],
    price: () => 1460,
  },
  {
    id: "hg-flush",
    category: "hinges",
    name: "Flush hinge, steel",
    skuStem: "HG-FL-ST",
    material: "Mild steel",
    finish: "Bright steel",
    lengthsMm: [50, 75],
    packs: [1],
    unit: "each",
    for: ["light cupboard doors", "no rebate"],
    notFor: ["room doors", "gates"],
    note: "Sits on the face. No chiselling. Light doors only.",
    keywords: ["flush hinge", "surface"],
    extraSpecs: [{ label: "Sold", value: "pair" }],
    price: ({ lengthMm = 50 }) => pence(lengthMm === 75 ? 340 : 220),
  },
];

const LOCK_FAMILIES: Family[] = [
  {
    id: "lk-nightlatch",
    category: "locks",
    name: "Nightlatch, 60 mm backset, brass cylinder",
    skuStem: "LK-NL-60",
    material: "Steel case, brass cylinder",
    finish: "Case enamelled, cylinder polished",
    packs: [1],
    unit: "each",
    for: ["front doors, rim fitting"],
    notFor: ["as the only lock on a door that needs insurance-grade mortice"],
    note: "A nightlatch is the rim lock people mean by ‘Yale’. Measure the backset from the edge to the keyhole of the old one. 60 mm is the common. It is a convenience lock; many insurers still want a British Standard mortice as well.",
    keywords: ["nightlatch", "yale", "rim lock", "front door"],
    extraSpecs: [
      { label: "Backset", value: "60 mm" },
      { label: "Keys", value: "2" },
    ],
    price: () => 1840,
  },
  {
    id: "lk-mortice-sash",
    category: "locks",
    name: "Sashlock, 3-lever, 64 mm",
    skuStem: "LK-MS-64",
    material: "Steel",
    finish: "Case enamelled",
    packs: [1],
    unit: "each",
    for: ["internal doors", "rooms that latch and lock"],
    notFor: ["a front door that needs BS 3621"],
    extraSpecs: [
      { label: "Case", value: "64 mm" },
      { label: "Levers", value: "3" },
    ],
    note: "Latch and lock in one case. Measure the old case — 64 and 76 are not interchangeable, and the spindle height moves with them.",
    keywords: ["sashlock", "mortice", "internal door"],
    price: () => 1620,
  },
  {
    id: "lk-mortice-dead",
    category: "locks",
    name: "Deadlock, 5-lever BS 3621, 76 mm",
    skuStem: "LK-DL-76",
    material: "Steel",
    finish: "Case enamelled",
    packs: [1],
    unit: "each",
    for: ["front and back doors, insurance work"],
    notFor: ["a thin internal door"],
    extraSpecs: [
      { label: "Case", value: "76 mm" },
      { label: "Standard", value: "BS 3621" },
      { label: "Levers", value: "5" },
    ],
    note: "The insurance deadlock. 5-lever, kitemarked. Measure the rebate and the case. We will not sell you a 3-lever for a front door and we will say why.",
    keywords: ["deadlock", "mortice", "bs 3621", "5 lever", "insurance"],
    price: () => 3480,
  },
  {
    id: "lk-pad-laminated",
    category: "locks",
    name: "Padlock, laminated steel, 40 mm",
    skuStem: "LK-PD-40",
    material: "Laminated steel",
    finish: "Painted",
    packs: [1],
    unit: "each",
    for: ["hasps", "sheds", "gates"],
    notFor: ["as a substitute for a proper door lock"],
    extraSpecs: [
      { label: "Body", value: "40 mm" },
      { label: "Keys", value: "2" },
    ],
    note: "A padlock is only as good as the hasp. We sell the hasp. The cheap open hasp is the thing that gets levered, not the lock.",
    keywords: ["padlock", "shed", "hasp"],
    price: () => 740,
  },
  {
    id: "lk-pad-brass",
    category: "locks",
    name: "Padlock, brass, 30 mm",
    skuStem: "LK-PD-BR-30",
    material: "Brass",
    finish: "Polished brass",
    packs: [1],
    unit: "each",
    for: ["indoor cabinets", "light outdoor in the dry"],
    notFor: ["a field gate"],
    extraSpecs: [{ label: "Body", value: "30 mm" }],
    note: "Small brass. Cupboard, not compound.",
    keywords: ["padlock", "brass"],
    price: () => 520,
  },
  {
    id: "lk-thumb",
    category: "locks",
    name: "Thumb latch, Suffolk, galvanised",
    skuStem: "LK-TL-SF",
    material: "Mild steel",
    finish: "Galvanised",
    packs: [1],
    unit: "each",
    for: ["ledged doors", "garden gates that do not need a lock"],
    notFor: ["a front door"],
    note: "The Suffolk latch. Handle on one side, thumb on the other. A gate that only needs to keep the wind out, not a burglar.",
    keywords: ["thumb latch", "suffolk", "gate latch"],
    extraSpecs: [{ label: "Pattern", value: "Suffolk" }],
    price: () => 980,
  },
  {
    id: "lk-ring",
    category: "locks",
    name: "Ring latch, black japanned",
    skuStem: "LK-RL-JP",
    material: "Malleable iron",
    finish: "Black japanned",
    packs: [1],
    unit: "each",
    for: ["cottage doors", "interior character work"],
    notFor: ["security"],
    note: "A ring latch is a look. It is not a lock. Japanned screws to match, or it will look like a kit.",
    keywords: ["ring latch", "cottage", "japanned"],
    extraSpecs: [{ label: "Pattern", value: "ring / cottage" }],
    price: () => 1240,
  },
];

const CHAIN_FAMILIES: Family[] = [
  {
    id: "ch-welded-zn",
    category: "chain",
    name: "Welded chain, zinc, 3 mm",
    skuStem: "CH-WD-ZN-3",
    material: "Mild steel",
    finish: "Zinc",
    packs: [1],
    unit: "metre",
    for: ["light hanging", "barriers that are a warning not a restraint"],
    notFor: ["lifting", "a swing", "a dog that pulls"],
    note: "Sold by the metre, cut at the counter. Zinc welded is not rated for lifting. If you want to hang a person or a load, you are in the wrong shop.",
    keywords: ["chain", "welded", "zinc", "metre"],
    extraSpecs: [
      { label: "Link", value: "3 mm welded" },
      { label: "Rated", value: "not for lifting" },
    ],
    price: () => 280,
  },
  {
    id: "ch-welded-zn-5",
    category: "chain",
    name: "Welded chain, zinc, 5 mm",
    skuStem: "CH-WD-ZN-5",
    material: "Mild steel",
    finish: "Zinc",
    packs: [1],
    unit: "metre",
    for: ["heavier hanging", "barrier"],
    notFor: ["lifting", "safety-critical restraint"],
    note: "5 mm welded, still not rated. Cut to length. We will not cut you a lifting sling.",
    keywords: ["chain", "welded", "5mm"],
    extraSpecs: [
      { label: "Link", value: "5 mm welded" },
      { label: "Rated", value: "not for lifting" },
    ],
    price: () => 460,
  },
  {
    id: "ch-welded-gv-6",
    category: "chain",
    name: "Welded chain, galvanised, 6 mm",
    skuStem: "CH-WD-GV-6",
    material: "Mild steel",
    finish: "Hot-dip galvanised",
    packs: [1],
    unit: "metre",
    for: ["outdoor barrier", "gate stay"],
    notFor: ["lifting"],
    note: "Galv, 6 mm. Outdoor, not overhead.",
    keywords: ["chain", "galvanised", "6mm"],
    extraSpecs: [
      { label: "Link", value: "6 mm welded" },
      { label: "Rated", value: "not for lifting" },
    ],
    price: () => 620,
  },
  {
    id: "ch-jack",
    category: "chain",
    name: "Jack chain, brass, 2 mm",
    skuStem: "CH-JK-BR-2",
    material: "Brass",
    finish: "Unplated brass",
    packs: [1],
    unit: "metre",
    for: ["light fittings", "signs"],
    notFor: ["load", "gates"],
    note: "Jack chain. Decorative, single-jack links. A lamp, not a dog.",
    keywords: ["jack chain", "brass", "light"],
    extraSpecs: [{ label: "Link", value: "2 mm single jack" }],
    price: () => 540,
  },
  {
    id: "ch-ball",
    category: "chain",
    name: "Ball chain, nickel, 3.2 mm",
    skuStem: "CH-BL-NK",
    material: "Steel, nickel plated",
    finish: "Nickel",
    packs: [1],
    unit: "metre",
    for: ["light pulls", "tags"],
    notFor: ["load"],
    note: "Ball chain. We sell the connectors. Cut to length.",
    keywords: ["ball chain", "pull"],
    extraSpecs: [{ label: "Ball", value: "3.2 mm" }],
    price: () => 320,
  },
];

/** Eleven hammers. The differences are real and invisible to a novice. */
const HAMMER_FAMILIES: Family[] = [
  {
    id: "hm-claw-steel",
    category: "hammers",
    name: "Claw hammer, steel shaft, 16 oz",
    skuStem: "HM-CL-ST-16",
    material: "Forged steel head, steel shaft",
    finish: "Painted / polished face",
    packs: [1],
    unit: "each",
    for: ["general nailing", "pulling nails"],
    notFor: ["stone", "a cold chisel (use a club or a ball pein)", "precision pins"],
    extraSpecs: [
      { label: "Weight", value: "16 oz / 454 g" },
      { label: "Face", value: "slightly crowned, 27 mm" },
      { label: "Claw", value: "curved" },
    ],
    note: "The hammer people mean when they say hammer. Curved claw for pulling. A steel shaft will sting less than people think and will not snap like cheap hickory. Not for striking metal tools — the face will chip.",
    keywords: ["hammer", "claw", "16oz"],
    price: () => 1680,
  },
  {
    id: "hm-claw-hickory",
    category: "hammers",
    name: "Claw hammer, hickory shaft, 16 oz",
    skuStem: "HM-CL-HK-16",
    material: "Forged steel head, hickory shaft",
    finish: "Lacquered shaft",
    packs: [1],
    unit: "each",
    for: ["general nailing", "the feel of wood"],
    notFor: ["leaving in the wet", "striking chisels"],
    extraSpecs: [
      { label: "Weight", value: "16 oz / 454 g" },
      { label: "Face", value: "crowned, 27 mm" },
      { label: "Claw", value: "curved" },
    ],
    note: "Same head as the steel-shaft claw. Hickory is quieter in the hand and it will break if it is left in a damp van. Neither is better. People have a religion about it.",
    keywords: ["hammer", "claw", "hickory"],
    price: () => 1540,
  },
  {
    id: "hm-warrington",
    category: "hammers",
    name: "Warrington hammer, cross pein, 10 oz",
    skuStem: "HM-WR-10",
    material: "Forged steel, hickory",
    finish: "Polished",
    packs: [1],
    unit: "each",
    for: ["pins", "fine nailing", "starting a nail you are holding"],
    notFor: ["framing", "masonry", "pulling nails (there is no claw)"],
    extraSpecs: [
      { label: "Weight", value: "10 oz / 280 g" },
      { label: "Pein", value: "cross (Warrington)" },
    ],
    note: "The cross pein starts a pin while your fingers are still on it. That is the whole of the difference, and it is why a joiner owns one and a novice does not know to ask.",
    keywords: ["warrington", "cross pein", "pin hammer", "joiner"],
    price: () => 1860,
  },
  {
    id: "hm-ball",
    category: "hammers",
    name: "Ball pein, engineer’s, 16 oz",
    skuStem: "HM-BP-16",
    material: "Forged steel, hickory",
    finish: "Polished",
    packs: [1],
    unit: "each",
    for: ["rivets", "striking punches and cold chisels", "shaping metal"],
    notFor: ["nails in timber (wrong face, no claw)", "stone"],
    extraSpecs: [
      { label: "Weight", value: "16 oz / 454 g" },
      { label: "Pein", value: "ball" },
    ],
    note: "A ball pein is an engineer’s hammer. The face is harder. The ball closes a rivet. Using a claw hammer on a cold chisel is how faces chip and chips fly.",
    keywords: ["ball pein", "ball peen", "engineer"],
    price: () => 1720,
  },
  {
    id: "hm-club",
    category: "hammers",
    name: "Club hammer, 2.5 lb",
    skuStem: "HM-CLB-25",
    material: "Forged steel, fibreglass",
    finish: "Painted",
    packs: [1],
    unit: "each",
    for: ["chisels", "bolsters", "light demolition"],
    notFor: ["nails", "fine work", "a sledge job"],
    extraSpecs: [
      { label: "Weight", value: "2.5 lb / 1.13 kg" },
      { label: "Face", value: "flat, both ends" },
    ],
    note: "Short, heavy, two faces. For a bolster, not for a nail. People buy a claw and then wonder why the chisel walks.",
    keywords: ["club hammer", "lump", "bolster"],
    price: () => 1980,
  },
  {
    id: "hm-copper",
    category: "hammers",
    name: "Club hammer, copper-faced, 2 lb",
    skuStem: "HM-CU-20",
    material: "Copper faces, steel body",
    finish: "Bare copper",
    packs: [1],
    unit: "each",
    for: ["non-spark work", "seating parts you must not bruise"],
    notFor: ["masonry", "nails"],
    extraSpecs: [
      { label: "Weight", value: "2 lb / 907 g" },
      { label: "Face", value: "copper, replaceable" },
    ],
    note: "Copper does not spark on steel the way a steel face does. Also does not mark a machined surface. The faces wear and we sell replacements.",
    keywords: ["copper hammer", "non spark", "soft face"],
    price: () => 3640,
  },
  {
    id: "hm-nylon",
    category: "hammers",
    name: "Soft-faced hammer, nylon, 35 mm",
    skuStem: "HM-NY-35",
    material: "Steel body, nylon faces",
    finish: "Painted",
    packs: [1],
    unit: "each",
    for: ["assembly", "knocking timber without the dent"],
    notFor: ["nails", "masonry", "chisels"],
    extraSpecs: [
      { label: "Face", value: "35 mm nylon, replaceable" },
    ],
    note: "Soft face. For persuading, not for driving. The faces unscrew when they are spent.",
    keywords: ["nylon hammer", "soft face", "mallet"],
    price: () => 2240,
  },
  {
    id: "hm-sledge",
    category: "hammers",
    name: "Sledge hammer, 7 lb",
    skuStem: "HM-SG-7",
    material: "Forged steel, fibreglass",
    finish: "Painted",
    packs: [1],
    unit: "each",
    for: ["stakes", "demolition", "posts"],
    notFor: ["anything you would regret hitting"],
    extraSpecs: [
      { label: "Weight", value: "7 lb / 3.2 kg" },
      { label: "Length", value: "810 mm" },
    ],
    note: "A sledge. Two hands. We do not sell a 14 lb to someone who asked for a hammer to hang a picture.",
    keywords: ["sledge", "maul"],
    price: () => 2860,
  },
  {
    id: "hm-pin",
    category: "hammers",
    name: "Pin hammer, 4 oz",
    skuStem: "HM-PN-4",
    material: "Steel, hickory",
    finish: "Polished",
    packs: [1],
    unit: "each",
    for: ["panel pins", "beads", "very small nails"],
    notFor: ["anything a claw would be asked to do"],
    extraSpecs: [
      { label: "Weight", value: "4 oz / 113 g" },
      { label: "Pein", value: "cross" },
    ],
    note: "Four ounces. A Warrington for people who only ever hang beads. The difference from the 10 oz is that you can feel a pin bend.",
    keywords: ["pin hammer", "4oz"],
    price: () => 1280,
  },
  {
    id: "hm-brick",
    category: "hammers",
    name: "Brick hammer, 16 oz",
    skuStem: "HM-BR-16",
    material: "Forged steel, hickory",
    finish: "Painted",
    packs: [1],
    unit: "each",
    for: ["cutting bricks", "light chasing"],
    notFor: ["nails", "stone you care about"],
    extraSpecs: [
      { label: "Weight", value: "16 oz / 454 g" },
      { label: "Other end", value: "chisel pein" },
    ],
    note: "One face, one chisel. For dressing a brick, not for hanging a shelf. The chisel end is not a wood chisel and will not forgive being used as one.",
    keywords: ["brick hammer", "scutch"],
    price: () => 1920,
  },
  {
    id: "hm-mallet",
    category: "hammers",
    name: "Joiner’s mallet, beech",
    skuStem: "HM-ML-BE",
    material: "Beech",
    finish: "Oiled",
    packs: [1],
    unit: "each",
    for: ["wood chisels", "jointing"],
    notFor: ["nails", "masonry", "metal tools"],
    extraSpecs: [
      { label: "Head", value: "beech, square" },
      { label: "Face", value: "end grain" },
    ],
    note: "A mallet is not a hammer. End-grain beech on a chisel handle. A steel hammer on a chisel handle is how handles split and how we sell you a new chisel next week.",
    keywords: ["mallet", "beech", "joiner", "chisel"],
    price: () => 2140,
  },
];

const TOOL_FAMILIES: Family[] = [
  {
    id: "tl-pz2",
    category: "tools",
    name: "Pozidriv screwdriver, PZ2 × 100 mm",
    skuStem: "TL-SD-PZ2",
    material: "Chrome vanadium, polypropylene",
    finish: "Black tip",
    packs: [1],
    unit: "each",
    for: ["PZ2 screws — most 8g wood screws"],
    notFor: ["Phillips heads (it will almost fit and then ruin them)"],
    extraSpecs: [
      { label: "Drive", value: "PZ2" },
      { label: "Blade", value: "100 mm" },
    ],
    note: "PZ2 is the bit that fits the screw we sell most of. A Phillips will go in and then chew the head. The difference is a punch mark in the cross; look at it.",
    keywords: ["screwdriver", "pozidriv", "pz2"],
    price: () => 640,
  },
  {
    id: "tl-pz1",
    category: "tools",
    name: "Pozidriv screwdriver, PZ1 × 75 mm",
    skuStem: "TL-SD-PZ1",
    material: "Chrome vanadium, polypropylene",
    finish: "Black tip",
    packs: [1],
    unit: "each",
    for: ["PZ1 — 4g and 6g"],
    notFor: ["8g and up"],
    extraSpecs: [{ label: "Drive", value: "PZ1" }],
    note: "Smaller Pozidriv. 6g and under.",
    keywords: ["screwdriver", "pozidriv", "pz1"],
    price: () => 580,
  },
  {
    id: "tl-slotted-8",
    category: "tools",
    name: "Slotted screwdriver, 8 mm × 150 mm",
    skuStem: "TL-SD-SL8",
    material: "Chrome vanadium",
    finish: "Black tip",
    packs: [1],
    unit: "each",
    for: ["slotted wood screws and ironmongery"],
    notFor: ["as a chisel"],
    extraSpecs: [{ label: "Tip", value: "8 mm parallel" }],
    note: "A parallel tip for a wood-screw slot. A cabinet tip is different; this is the one for 8g and 10g slotted.",
    keywords: ["screwdriver", "slotted", "flat"],
    price: () => 560,
  },
  {
    id: "tl-torx-25",
    category: "tools",
    name: "Torx driver, T25 × 100 mm",
    skuStem: "TL-SD-T25",
    material: "Chrome vanadium",
    finish: "Black tip",
    packs: [1],
    unit: "each",
    for: ["T25 decking and security-adjacent screws"],
    notFor: ["pin-Torx (needs the security bit)"],
    extraSpecs: [{ label: "Drive", value: "T25" }],
    note: "T25 is the decking bit. Pin-Torx is a different bit and we sell that separately.",
    keywords: ["torx", "t25", "star driver"],
    price: () => 620,
  },
  {
    id: "tl-pin-torx",
    category: "tools",
    name: "Pin-Torx bit, T25H",
    skuStem: "TL-BT-T25H",
    material: "Tool steel",
    finish: "Black oxide",
    packs: [1],
    unit: "each",
    for: ["the security screws we sell"],
    notFor: ["ordinary Torx"],
    extraSpecs: [{ label: "Drive", value: "T25H pin-Torx" }],
    note: "The bit for the screws that do not want to come out. 1/4 inch hex.",
    keywords: ["pin torx", "security bit", "t25h"],
    price: () => 340,
  },
  {
    id: "tl-combo",
    category: "tools",
    name: "Combination pliers, 180 mm",
    skuStem: "TL-PL-CO-180",
    material: "Chrome vanadium",
    finish: "Polished jaws",
    packs: [1],
    unit: "each",
    for: ["gripping", "light cutting of wire"],
    notFor: ["hardened chain", "as a hammer"],
    extraSpecs: [{ label: "Length", value: "180 mm" }],
    note: "Pliers. Not a substitute for the right driver.",
    keywords: ["pliers", "combination"],
    price: () => 880,
  },
  {
    id: "tl-side",
    category: "tools",
    name: "Side cutters, 160 mm",
    skuStem: "TL-PL-SC-160",
    material: "Chrome vanadium",
    finish: "Polished",
    packs: [1],
    unit: "each",
    for: ["wire", "pins", "zinc chain of the small sort"],
    notFor: ["piano wire", "hardened nails"],
    extraSpecs: [{ label: "Length", value: "160 mm" }],
    note: "For cutting what they are rated for. Hardened nails will notch them.",
    keywords: ["side cutters", "snip", "wire cutter"],
    price: () => 920,
  },
  {
    id: "tl-adjustable",
    category: "tools",
    name: "Adjustable spanner, 200 mm",
    skuStem: "TL-SP-AD-200",
    material: "Chrome vanadium",
    finish: "Polished",
    packs: [1],
    unit: "each",
    for: ["hex heads when you have not brought the right ring"],
    notFor: ["rounded heads you then blame us for"],
    extraSpecs: [{ label: "Length", value: "200 mm" }],
    note: "An adjustable. Pull so the force is on the fixed jaw.",
    keywords: ["adjustable", "spanner", "shifter"],
    price: () => 1100,
  },
  {
    id: "tl-tape",
    category: "tools",
    name: "Tape measure, 5 m, metric / inch",
    skuStem: "TL-TP-5",
    material: "Steel blade, ABS case",
    finish: "Yellow blade",
    packs: [1],
    unit: "each",
    for: ["measuring the thing you are about to buy the wrong length of"],
    notFor: ["as a straight edge for a knife"],
    extraSpecs: [
      { label: "Length", value: "5 m" },
      { label: "Blade", value: "19 mm, metric and inch" },
    ],
    note: "Metric on one edge, inches on the other. Wood screws in this shop are sold in millimetres with the inch in the spec because that is how the trade still talks.",
    keywords: ["tape", "measure", "5m"],
    price: () => 640,
  },
  {
    id: "tl-bradawl",
    category: "tools",
    name: "Bradawl, square blade",
    skuStem: "TL-BA-SQ",
    material: "Tool steel, beech",
    finish: "Oiled handle",
    packs: [1],
    unit: "each",
    for: ["starting a wood screw in timber", "marking"],
    notFor: ["masonry", "as a screwdriver"],
    extraSpecs: [{ label: "Blade", value: "square, 40 mm" }],
    note: "A bradawl is how you start a screw without the bit walking. Square blade so it does not follow the grain the way a round awl will.",
    keywords: ["bradawl", "awl"],
    price: () => 480,
  },
];

const IRON_FAMILIES: Family[] = [
  {
    id: "ir-hasp",
    category: "ironmongery",
    name: "Hasp and staple, galvanised, 90 mm",
    skuStem: "IR-HS-GV-90",
    material: "Mild steel",
    finish: "Galvanised",
    packs: [1],
    unit: "each",
    for: ["sheds", "gates", "with a padlock"],
    notFor: ["a front door"],
    extraSpecs: [{ label: "Length", value: "90 mm" }],
    note: "The hasp is what fails, not the padlock. Fix it with coach screws, not drywall screws.",
    keywords: ["hasp", "staple", "padlock"],
    price: () => 420,
  },
  {
    id: "ir-hasp-150",
    category: "ironmongery",
    name: "Hasp and staple, galvanised, 150 mm",
    skuStem: "IR-HS-GV-150",
    material: "Mild steel",
    finish: "Galvanised",
    packs: [1],
    unit: "each",
    for: ["heavier sheds and gates"],
    notFor: ["a front door"],
    extraSpecs: [{ label: "Length", value: "150 mm" }],
    note: "Longer hasp. Same rule about the screws.",
    keywords: ["hasp", "staple"],
    price: () => 640,
  },
  {
    id: "ir-hook-cabin",
    category: "ironmongery",
    name: "Cabin hook, galvanised, 150 mm",
    skuStem: "IR-CK-GV-150",
    material: "Mild steel",
    finish: "Galvanised",
    packs: [1],
    unit: "each",
    for: ["holding a gate or a door open"],
    notFor: ["as a lock"],
    extraSpecs: [{ label: "Length", value: "150 mm" }],
    note: "A hook and eye. Holds open. Does not keep out.",
    keywords: ["cabin hook", "hook and eye"],
    price: () => 360,
  },
  {
    id: "ir-gate-spring",
    category: "ironmongery",
    name: "Gate spring, adjustable, galvanised",
    skuStem: "IR-GS-GV",
    material: "Spring steel",
    finish: "Galvanised",
    packs: [1],
    unit: "each",
    for: ["self-closing garden gates"],
    notFor: ["a fire door (wrong closer)"],
    extraSpecs: [{ label: "Pattern", value: "adjustable bolt-through" }],
    note: "A farm gate spring. Not a fire-door closer and not rated as one.",
    keywords: ["gate spring", "closer"],
    price: () => 880,
  },
  {
    id: "ir-shelf-bracket",
    category: "ironmongery",
    name: "Shelf bracket, steel, 150 × 125 mm",
    skuStem: "IR-SB-150",
    material: "Mild steel",
    finish: "Grey primer",
    packs: [1],
    unit: "each",
    for: ["shelves on a solid wall"],
    notFor: ["plasterboard without a stud or a proper cavity fixing"],
    extraSpecs: [{ label: "Size", value: "150 × 125 mm" }],
    note: "The bracket is the easy part. The wall is the part. Brown plugs in brick; find the stud in board; do not hang a row of novels on a self-drive plug.",
    keywords: ["shelf bracket", "angle"],
    price: () => 340,
  },
  {
    id: "ir-shelf-200",
    category: "ironmongery",
    name: "Shelf bracket, steel, 200 × 150 mm",
    skuStem: "IR-SB-200",
    material: "Mild steel",
    finish: "Grey primer",
    packs: [1],
    unit: "each",
    for: ["deeper shelves on a solid wall"],
    notFor: ["board without a stud"],
    extraSpecs: [{ label: "Size", value: "200 × 150 mm" }],
    note: "Deeper bracket. Same wall rules.",
    keywords: ["shelf bracket"],
    price: () => 420,
  },
  {
    id: "ir-coat-hook",
    category: "ironmongery",
    name: "Coat hook, double, japanned",
    skuStem: "IR-CH-JP",
    material: "Malleable iron",
    finish: "Black japanned",
    packs: [1],
    unit: "each",
    for: ["coats on a solid door or wall"],
    notFor: ["a hollow door with 12 mm screws"],
    extraSpecs: [{ label: "Pattern", value: "double hat & coat" }],
    note: "Japanned screws, or it looks unfinished. Into something solid.",
    keywords: ["coat hook", "japanned"],
    price: () => 280,
  },
  {
    id: "ir-gate-throw",
    category: "ironmongery",
    name: "Tower bolt, galvanised, 150 mm",
    skuStem: "IR-TB-GV-150",
    material: "Mild steel",
    finish: "Galvanised",
    packs: [1],
    unit: "each",
    for: ["gates", "shed doors", "the side that is not the latch"],
    notFor: ["as the only security on a house door"],
    extraSpecs: [{ label: "Throw", value: "150 mm" }],
    note: "A bolt. Keeps a gate shut in the wind. Not an insurance lock.",
    keywords: ["tower bolt", "barrel bolt", "gate bolt"],
    price: () => 380,
  },
  {
    id: "ir-gate-throw-200",
    category: "ironmongery",
    name: "Tower bolt, galvanised, 200 mm",
    skuStem: "IR-TB-GV-200",
    material: "Mild steel",
    finish: "Galvanised",
    packs: [1],
    unit: "each",
    for: ["heavier gates"],
    notFor: ["house-door security"],
    extraSpecs: [{ label: "Throw", value: "200 mm" }],
    note: "Longer throw. Same job.",
    keywords: ["tower bolt", "barrel bolt"],
    price: () => 460,
  },
  {
    id: "ir-eye-plate",
    category: "ironmongery",
    name: "Screw eye, zinc, 50 mm",
    skuStem: "IR-SE-ZN-50",
    material: "Mild steel",
    finish: "Zinc",
    packs: [10],
    unit: "pack",
    for: ["light hanging in timber"],
    notFor: ["masonry", "a swing", "a hammock"],
    extraSpecs: [{ label: "Overall", value: "50 mm" }],
    note: "A screw eye in timber. In masonry you want a wall eye and a plug. People mix these up and then the hanging comes down.",
    keywords: ["screw eye", "eye"],
    price: () => 220,
  },
];

function explodeNutsWashers(family: Family, products: Product[]) {
  const diameters = family.diameters ?? ["M8"];
  const packs = family.packs ?? [10];
  for (const diameter of diameters) {
    for (const pack of packs) {
      const sku = `${family.skuStem}-${diameter}-${String(pack)}`;
      const pitch = METRIC_PITCH[diameter] ?? "coarse";
      products.push({
        sku,
        name: `${family.name}, ${diameter}`,
        category: family.category,
        familyId: family.id,
        familyName: family.name,
        specs: [
          { label: "Thread", value: `${diameter} × ${pitch}` },
          { label: "Material", value: family.material },
          { label: "Finish", value: family.finish },
          { label: "Pack", value: packLabel(pack, family.unit ?? "pack") },
          ...(family.extraSpecs ?? []),
        ],
        material: family.material,
        finish: family.finish,
        packQty: pack,
        unit: family.unit ?? "pack",
        pricePence: family.price({ diameter, pack }),
        for: family.for,
        notFor: family.notFor,
        keywords: [...family.keywords, diameter],
        counterNote: family.note,
      });
    }
  }
}

function buildCatalogue(): Product[] {
  const products: Product[] = [];
  for (const family of WOOD_SCREW_FAMILIES) explodeWood(family, products);
  for (const family of MACHINE) explodeMetric(family, products);
  for (const family of NAIL_FAMILIES) explodeSimple(family, products);
  for (const family of BOLT_FAMILIES) explodeMetric(family, products);
  for (const family of NUT_FAMILIES) explodeNutsWashers(family, products);
  for (const family of WASHER_FAMILIES) explodeNutsWashers(family, products);
  for (const family of PLUG_FAMILIES) {
    if (family.diameters) explodeNutsWashers(family, products);
    else explodeSimple(family, products);
  }
  for (const family of HINGE_FAMILIES) explodeSimple(family, products);
  for (const family of LOCK_FAMILIES) explodeSimple(family, products);
  for (const family of CHAIN_FAMILIES) explodeSimple(family, products);
  for (const family of HAMMER_FAMILIES) explodeSimple(family, products);
  for (const family of TOOL_FAMILIES) explodeSimple(family, products);
  for (const family of IRON_FAMILIES) explodeSimple(family, products);
  return products;
}

export const PRODUCTS: Product[] = buildCatalogue();
export const LINE_COUNT = PRODUCTS.length;

export const BY_SKU = new Map(PRODUCTS.map((p) => [p.sku, p]));

export const FAMILIES = (() => {
  const map = new Map<string, { id: string; name: string; category: Category; skus: string[] }>();
  for (const p of PRODUCTS) {
    const row = map.get(p.familyId) ?? {
      id: p.familyId,
      name: p.familyName,
      category: p.category,
      skus: [],
    };
    row.skus.push(p.sku);
    map.set(p.familyId, row);
  }
  return [...map.values()];
})();

export const FAMILY_COUNT = FAMILIES.length;

export function money(penceValue: number): string {
  return `£${(penceValue / 100).toFixed(2)}`;
}

export function lineTotal(product: Product, qty: number): number {
  return product.pricePence * qty;
}

export function productBySku(sku: string): Product | undefined {
  return BY_SKU.get(sku.trim().toUpperCase()) ?? BY_SKU.get(sku.trim());
}

export function siblings(product: Product): Product[] {
  return PRODUCTS.filter((p) => p.familyId === product.familyId);
}

export function sameFamilyOtherPacks(product: Product): Product[] {
  return siblings(product).filter(
    (p) =>
      p.sku !== product.sku &&
      p.specs.find((s) => s.label === "Length")?.value ===
        product.specs.find((s) => s.label === "Length")?.value &&
      p.specs.find((s) => s.label === "Gauge")?.value ===
        product.specs.find((s) => s.label === "Gauge")?.value &&
      p.specs.find((s) => s.label === "Thread")?.value ===
        product.specs.find((s) => s.label === "Thread")?.value,
  );
}

/** Broad words that must not dump four hundred lines. */
export const BROAD: Record<string, Category | "ask"> = {
  screw: "ask",
  screws: "ask",
  "wood screw": "wood-screws",
  "wood screws": "wood-screws",
  nail: "nails",
  nails: "nails",
  bolt: "bolts",
  bolts: "bolts",
  nut: "nuts",
  nuts: "nuts",
  washer: "washers",
  washers: "washers",
  hinge: "hinges",
  hinges: "hinges",
  lock: "locks",
  locks: "locks",
  chain: "chain",
  hammer: "hammers",
  hammers: "hammers",
  plug: "plugs",
  plugs: "plugs",
  rawlplug: "plugs",
  tool: "tools",
  tools: "tools",
};

export type SearchHit =
  | { kind: "exact"; product: Product }
  | { kind: "narrow"; reason: string; families: typeof FAMILIES }
  | { kind: "family"; family: (typeof FAMILIES)[number]; products: Product[] }
  | { kind: "list"; products: Product[] }
  | { kind: "empty" };

export function searchCatalogue(raw: string): SearchHit {
  const q = raw.trim().toLowerCase();
  if (!q) return { kind: "empty" };

  const exact = PRODUCTS.find((p) => p.sku.toLowerCase() === q);
  if (exact) return { kind: "exact", product: exact };

  const prefix = PRODUCTS.filter((p) => p.sku.toLowerCase().startsWith(q));
  if (prefix.length === 1) return { kind: "exact", product: prefix[0] };
  if (prefix.length > 1 && prefix.length <= 12) return { kind: "list", products: prefix };

  const broad = BROAD[q];
  if (broad === "ask") {
    return {
      kind: "narrow",
      reason:
        "‘Screw’ is not a line. Thirty-one wood-screw families, plus machine and self-tappers. Say the job — oak outdoors, kitchen carcass, sheet metal — or type a SKU.",
      families: FAMILIES.filter((f) =>
        f.category === "wood-screws" ||
        f.category === "machine-screws" ||
        f.category === "self-tappers",
      ).slice(0, 12),
    };
  }
  if (broad) {
    const families = FAMILIES.filter((f) => f.category === broad);
    return {
      kind: "narrow",
      reason: `${String(families.length)} kinds of ${q} in the rack. Pick the family. A list of every size is how people buy the wrong one.`,
      families,
    };
  }

  const scored = PRODUCTS.map((p) => {
    const blob = `${p.sku} ${p.name} ${p.familyName} ${p.keywords.join(" ")} ${p.material} ${p.finish}`.toLowerCase();
    let score = 0;
    if (blob.includes(q)) score += 6;
    for (const word of q.split(/\s+/)) {
      if (word.length < 2) continue;
      if (blob.includes(word)) score += 2;
      if (p.sku.toLowerCase().includes(word)) score += 4;
    }
    return { p, score };
  })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score);

  if (scored.length === 0) return { kind: "empty" };

  const topFamily = scored[0].p.familyId;
  const sameFamily = scored.filter((x) => x.p.familyId === topFamily);
  if (sameFamily.length >= 4 && sameFamily[0].score >= scored[Math.min(6, scored.length - 1)].score) {
    const family = FAMILIES.find((f) => f.id === topFamily);
    if (family) {
      return {
        kind: "family",
        family,
        products: PRODUCTS.filter((p) => p.familyId === topFamily),
      };
    }
  }

  const uniqueFamilies = new Set(scored.slice(0, 24).map((x) => x.p.familyId));
  if (uniqueFamilies.size > 8) {
    return {
      kind: "narrow",
      reason: `${String(scored.length)} lines match that, which is not a useful answer. Name the material, the head, or the job.`,
      families: FAMILIES.filter((f) => uniqueFamilies.has(f.id)).slice(0, 10),
    };
  }

  const seen = new Set<string>();
  const list: Product[] = [];
  for (const { p } of scored) {
    if (seen.has(p.familyId)) continue;
    seen.add(p.familyId);
    const card = PRODUCTS.find(
      (x) => x.familyId === p.familyId && (x.unit !== "pack" || x.packQty <= 10),
    );
    list.push(card ?? p);
    if (list.length >= 8) break;
  }
  return { kind: "list", products: list };
}


/**
 * Editorial systems. Each one is a named answer to "where does the eye go",
 * not a set of free boxes. Changing destination aspect does not scale a
 * layout — it picks a different region map for the same system. That is the
 * whole bet: constraint, then reflow.
 */

export type Rect = { x: number; y: number; w: number; h: number };

export type Rule = {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  weight: "hair" | "bar" | "spot";
};

export type Regions = {
  plate: Rect;
  kicker: Rect;
  headline: Rect;
  dek: Rect;
  meta: Rect;
  /** Paper veil behind type, used when type sits on the plate. */
  veil?: Rect;
  rules: Rule[];
  /** How type sits relative to the sheet. */
  ground: "paper" | "veil" | "knockout";
};

export type SystemId = "masthead" | "field" | "overprint" | "banner" | "folio";
export type Hierarchy = "name" | "picture" | "fact";
export type Aspect = "portrait" | "landscape" | "square";

export const SYSTEMS: {
  id: SystemId;
  index: string;
  name: string;
  job: string;
}[] = [
  {
    id: "masthead",
    index: "01",
    name: "Masthead",
    job: "Newspaper front. Plate as a cut, type as a column.",
  },
  {
    id: "field",
    index: "02",
    name: "Field",
    job: "Equal fields split by a bar. Picture or name takes first position.",
  },
  {
    id: "overprint",
    index: "03",
    name: "Overprint",
    job: "Full-bleed still. Type in a reserved band with a paper veil.",
  },
  {
    id: "banner",
    index: "04",
    name: "Banner",
    job: "The room-distance sheet. A thin plate, then type that holds a wall.",
  },
  {
    id: "folio",
    index: "05",
    name: "Folio",
    job: "Magazine cover. Plate bleeds; type lives in a protected spine.",
  },
];

export const HIERARCHIES: { id: Hierarchy; name: string; job: string }[] = [
  { id: "name", name: "Name", job: "The title is the one thing from across a room." },
  { id: "picture", name: "Picture", job: "The still leads. Type supports." },
  { id: "fact", name: "Fact", job: "Date and place are display. The title follows." },
];

const box = (x: number, y: number, w: number, h: number): Rect => ({ x, y, w, h });

export function aspectOf(w: number, h: number): Aspect {
  const r = w / h;
  if (r >= 1.18) return "landscape";
  if (r <= 0.86) return "portrait";
  return "square";
}

export function compose(
  system: SystemId,
  hierarchy: Hierarchy,
  aspect: Aspect
): Regions {
  switch (system) {
    case "masthead":
      return masthead(hierarchy, aspect);
    case "field":
      return field(hierarchy, aspect);
    case "overprint":
      return overprint(hierarchy, aspect);
    case "banner":
      return banner(hierarchy, aspect);
    case "folio":
      return folio(hierarchy, aspect);
  }
}

function masthead(h: Hierarchy, a: Aspect): Regions {
  const m = a === "landscape" ? 0.045 : 0.062;

  if (a === "landscape") {
    if (h === "picture") {
      return {
        plate: box(0, 0, 0.62, 1),
        kicker: box(0.655, 0.12, 0.3, 0.06),
        headline: box(0.655, 0.2, 0.3, 0.42),
        dek: box(0.655, 0.66, 0.3, 0.16),
        meta: box(0.655, 0.86, 0.3, 0.08),
        rules: [{ x1: 0.62, y1: 0, x2: 0.62, y2: 1, weight: "bar" }],
        ground: "paper",
      };
    }
    if (h === "fact") {
      return {
        plate: box(0.52, 0, 0.48, 1),
        kicker: box(m, 0.1, 0.44, 0.055),
        headline: box(m, 0.58, 0.44, 0.18),
        dek: box(m, 0.78, 0.44, 0.1),
        meta: box(m, 0.18, 0.44, 0.34),
        rules: [
          { x1: 0.52, y1: 0, x2: 0.52, y2: 1, weight: "bar" },
          { x1: m, y1: 0.54, x2: 0.48, y2: 0.54, weight: "hair" },
        ],
        ground: "paper",
      };
    }
    return {
      plate: box(0, 0, 0.44, 1),
      kicker: box(0.49, 0.1, 0.46, 0.055),
      headline: box(0.49, 0.18, 0.46, 0.46),
      dek: box(0.49, 0.68, 0.46, 0.16),
      meta: box(0.49, 0.88, 0.46, 0.06),
      rules: [
        { x1: 0.44, y1: 0, x2: 0.44, y2: 1, weight: "hair" },
        { x1: 0.49, y1: 0.855, x2: 0.95, y2: 0.855, weight: "hair" },
      ],
      ground: "paper",
    };
  }

  if (a === "square") {
    if (h === "picture") {
      return {
        plate: box(0, 0, 1, 0.56),
        kicker: box(m, 0.6, 1 - 2 * m, 0.04),
        headline: box(m, 0.65, 1 - 2 * m, 0.16),
        dek: box(m, 0.83, 1 - 2 * m, 0.08),
        meta: box(m, 0.925, 1 - 2 * m, 0.04),
        rules: [{ x1: 0, y1: 0.56, x2: 1, y2: 0.56, weight: "bar" }],
        ground: "paper",
      };
    }
    if (h === "fact") {
      return {
        plate: box(0, 0.42, 1, 0.32),
        kicker: box(m, 0.06, 1 - 2 * m, 0.04),
        headline: box(m, 0.78, 1 - 2 * m, 0.1),
        dek: box(0, 0, 0, 0),
        meta: box(m, 0.11, 1 - 2 * m, 0.28),
        rules: [
          { x1: m, y1: 0.4, x2: 1 - m, y2: 0.4, weight: "hair" },
          { x1: m, y1: 0.76, x2: 1 - m, y2: 0.76, weight: "hair" },
        ],
        ground: "paper",
      };
    }
    return {
      plate: box(m, m, 1 - 2 * m, 0.34),
      kicker: box(m, 0.44, 1 - 2 * m, 0.04),
      headline: box(m, 0.49, 1 - 2 * m, 0.26),
      dek: box(m, 0.77, 1 - 2 * m, 0.1),
      meta: box(m, 0.9, 1 - 2 * m, 0.05),
      rules: [
        { x1: m, y1: 0.418, x2: 1 - m, y2: 0.418, weight: "spot" },
        { x1: m, y1: 0.88, x2: 1 - m, y2: 0.88, weight: "hair" },
      ],
      ground: "paper",
    };
  }

  /* portrait */
  if (h === "picture") {
    return {
      plate: box(0, 0, 1, 0.58),
      kicker: box(m, 0.615, 1 - 2 * m, 0.032),
      headline: box(m, 0.655, 1 - 2 * m, 0.16),
      dek: box(m, 0.83, 1 - 2 * m, 0.08),
      meta: box(m, 0.925, 1 - 2 * m, 0.04),
      rules: [{ x1: 0, y1: 0.58, x2: 1, y2: 0.58, weight: "bar" }],
      ground: "paper",
    };
  }
  if (h === "fact") {
    return {
      plate: box(0, 0.4, 1, 0.3),
      kicker: box(m, 0.055, 1 - 2 * m, 0.03),
      headline: box(m, 0.74, 1 - 2 * m, 0.12),
      dek: box(m, 0.87, 1 - 2 * m, 0.05),
      meta: box(m, 0.1, 1 - 2 * m, 0.26),
      rules: [
        { x1: m, y1: 0.38, x2: 1 - m, y2: 0.38, weight: "hair" },
        { x1: m, y1: 0.72, x2: 1 - m, y2: 0.72, weight: "hair" },
      ],
      ground: "paper",
    };
  }
  return {
    plate: box(m, m, 1 - 2 * m, 0.3),
    kicker: box(m, 0.39, 1 - 2 * m, 0.032),
    headline: box(m, 0.43, 1 - 2 * m, 0.28),
    dek: box(m, 0.735, 1 - 2 * m, 0.12),
    meta: box(m, 0.9, 1 - 2 * m, 0.05),
    rules: [
      { x1: m, y1: 0.378, x2: 1 - m, y2: 0.378, weight: "spot" },
      { x1: m, y1: 0.875, x2: 1 - m, y2: 0.875, weight: "hair" },
    ],
    ground: "paper",
  };
}

function field(h: Hierarchy, a: Aspect): Regions {
  const m = 0.055;

  if (a === "landscape") {
    const typeFirst = h !== "picture";
    const plate = typeFirst ? box(0.5, 0, 0.5, 1) : box(0, 0, 0.5, 1);
    const tx = typeFirst ? m : 0.545;
    if (h === "fact") {
      return {
        plate,
        kicker: box(tx, 0.08, 0.4, 0.05),
        headline: box(tx, 0.62, 0.4, 0.16),
        dek: box(tx, 0.8, 0.4, 0.1),
        meta: box(tx, 0.16, 0.4, 0.4),
        rules: [{ x1: 0.5, y1: 0, x2: 0.5, y2: 1, weight: "bar" }],
        ground: "paper",
      };
    }
    return {
      plate,
      kicker: box(tx, 0.1, 0.4, 0.055),
      headline: box(tx, 0.18, 0.4, 0.46),
      dek: box(tx, 0.68, 0.4, 0.16),
      meta: box(tx, 0.88, 0.4, 0.06),
      rules: [{ x1: 0.5, y1: 0, x2: 0.5, y2: 1, weight: "bar" }],
      ground: "paper",
    };
  }

  const typeFirst = h !== "picture";
  if (h === "fact") {
    return {
      plate: box(0, 0.38, 1, 0.36),
      kicker: box(m, 0.04, 1 - 2 * m, 0.03),
      headline: box(m, 0.78, 1 - 2 * m, 0.1),
      dek: box(m, 0.9, 1 - 2 * m, 0.05),
      meta: box(m, 0.08, 1 - 2 * m, 0.26),
      rules: [
        { x1: 0, y1: 0.38, x2: 1, y2: 0.38, weight: "bar" },
        { x1: 0, y1: 0.74, x2: 1, y2: 0.74, weight: "bar" },
      ],
      ground: "paper",
    };
  }
  if (typeFirst) {
    const top = a === "square" ? 0.48 : 0.46;
    return {
      plate: box(0, top, 1, 1 - top),
      kicker: box(m, 0.05, 1 - 2 * m, 0.04),
      headline: box(m, 0.1, 1 - 2 * m, 0.22),
      dek: box(m, 0.34, 1 - 2 * m, 0.07),
      meta: box(m, 0.42, 1 - 2 * m, 0.035),
      rules: [{ x1: 0, y1: top, x2: 1, y2: top, weight: "bar" }],
      ground: "paper",
    };
  }
  const plateH = a === "square" ? 0.52 : 0.54;
  return {
    plate: box(0, 0, 1, plateH),
    kicker: box(m, plateH + 0.04, 1 - 2 * m, 0.035),
    headline: box(m, plateH + 0.08, 1 - 2 * m, 0.2),
    dek: box(m, plateH + 0.3, 1 - 2 * m, 0.08),
    meta: box(m, 0.94, 1 - 2 * m, 0.035),
    rules: [{ x1: 0, y1: plateH, x2: 1, y2: plateH, weight: "bar" }],
    ground: "paper",
  };
}

function overprint(h: Hierarchy, a: Aspect): Regions {
  if (a === "landscape") {
    const w = h === "picture" ? 0.36 : 0.42;
    const veil = box(0, 0, w, 1);
    if (h === "fact") {
      return {
        plate: box(0, 0, 1, 1),
        veil,
        kicker: box(0.04, 0.1, w - 0.08, 0.06),
        headline: box(0.04, 0.62, w - 0.08, 0.16),
        dek: box(0.04, 0.8, w - 0.08, 0.1),
        meta: box(0.04, 0.2, w - 0.08, 0.36),
        rules: [{ x1: 0.04, y1: 0.17, x2: 0.14, y2: 0.17, weight: "spot" }],
        ground: "veil",
      };
    }
    return {
      plate: box(0, 0, 1, 1),
      veil,
      kicker: box(0.04, 0.12, w - 0.08, 0.06),
      headline: box(0.04, 0.2, w - 0.08, 0.46),
      dek: box(0.04, 0.7, w - 0.08, 0.14),
      meta: box(0.04, 0.88, w - 0.08, 0.06),
      rules: [{ x1: 0.04, y1: 0.185, x2: 0.14, y2: 0.185, weight: "spot" }],
      ground: "veil",
    };
  }

  if (h === "picture") {
    const veil = box(0, 0.68, 1, 0.32);
    return {
      plate: box(0, 0, 1, 1),
      veil,
      kicker: box(0.07, 0.71, 0.86, 0.035),
      headline: box(0.07, 0.75, 0.86, 0.12),
      dek: box(0.07, 0.88, 0.86, 0.05),
      meta: box(0.07, 0.94, 0.86, 0.035),
      rules: [],
      ground: "veil",
    };
  }
  if (h === "fact") {
    const veil = box(0, 0, 1, 0.42);
    return {
      plate: box(0, 0, 1, 1),
      veil,
      kicker: box(0.07, 0.04, 0.86, 0.035),
      headline: box(0.07, 0.32, 0.86, 0.07),
      dek: box(0, 0, 0, 0),
      meta: box(0.07, 0.09, 0.86, 0.2),
      rules: [],
      ground: "veil",
    };
  }
  const veilH = a === "square" ? 0.48 : 0.46;
  const veil = box(0, 1 - veilH, 1, veilH);
  return {
    plate: box(0, 0, 1, 1),
    veil,
    kicker: box(0.07, 1 - veilH + 0.04, 0.86, 0.035),
    headline: box(0.07, 1 - veilH + 0.085, 0.86, veilH * 0.48),
    dek: box(0.07, 1 - 0.16, 0.86, 0.07),
    meta: box(0.07, 1 - 0.07, 0.86, 0.04),
    rules: [],
    ground: "veil",
  };
}

function banner(h: Hierarchy, a: Aspect): Regions {
  const m = a === "landscape" ? 0.04 : 0.06;

  if (a === "landscape") {
    const strip = h === "picture" ? 0.34 : 0.2;
    return {
      plate: box(0, 0, strip, 1),
      kicker: box(strip + m, 0.1, 1 - strip - 2 * m, 0.06),
      headline: box(strip + m, 0.18, 1 - strip - 2 * m, h === "fact" ? 0.22 : 0.5),
      dek: box(strip + m, 0.72, 1 - strip - 2 * m, 0.12),
      meta: box(strip + m, h === "fact" ? 0.42 : 0.88, 1 - strip - 2 * m, h === "fact" ? 0.26 : 0.06),
      rules: [{ x1: strip, y1: 0, x2: strip, y2: 1, weight: "bar" }],
      ground: "paper",
    };
  }

  const strip = h === "picture" ? 0.28 : 0.16;
  if (h === "fact") {
    return {
      plate: box(0, 0, 1, strip),
      kicker: box(m, strip + 0.04, 1 - 2 * m, 0.035),
      headline: box(m, 0.72, 1 - 2 * m, 0.12),
      dek: box(m, 0.86, 1 - 2 * m, 0.06),
      meta: box(m, strip + 0.09, 1 - 2 * m, 0.36),
      rules: [{ x1: 0, y1: strip, x2: 1, y2: strip, weight: "bar" }],
      ground: "paper",
    };
  }
  return {
    plate: box(0, 0, 1, strip),
    kicker: box(m, strip + 0.045, 1 - 2 * m, 0.035),
    headline: box(m, strip + 0.09, 1 - 2 * m, 0.52),
    dek: box(m, 0.8, 1 - 2 * m, 0.1),
    meta: box(m, 0.92, 1 - 2 * m, 0.04),
    rules: [{ x1: 0, y1: strip, x2: 1, y2: strip, weight: "spot" }],
    ground: "paper",
  };
}

function folio(h: Hierarchy, a: Aspect): Regions {
  if (a === "landscape") {
    const w = h === "picture" ? 0.3 : 0.38;
    const veil = box(0, 0, w, 1);
    return {
      plate: box(0, 0, 1, 1),
      veil,
      kicker: box(0.035, 0.08, w - 0.07, 0.055),
      headline: box(0.035, h === "fact" ? 0.58 : 0.18, w - 0.07, h === "fact" ? 0.16 : 0.44),
      dek: box(0.035, 0.68, w - 0.07, 0.14),
      meta: box(0.035, h === "fact" ? 0.16 : 0.86, w - 0.07, h === "fact" ? 0.36 : 0.07),
      rules: [{ x1: w, y1: 0.06, x2: w, y2: 0.94, weight: "hair" }],
      ground: "veil",
    };
  }

  if (h === "picture") {
    const veil = box(0, 0.7, 1, 0.3);
    return {
      plate: box(0, 0, 1, 1),
      veil,
      kicker: box(0.07, 0.725, 0.86, 0.03),
      headline: box(0.07, 0.76, 0.86, 0.11),
      dek: box(0.07, 0.88, 0.86, 0.05),
      meta: box(0.07, 0.94, 0.86, 0.03),
      rules: [],
      ground: "veil",
    };
  }
  if (h === "fact") {
    const veil = box(0, 0, 1, 0.38);
    return {
      plate: box(0, 0, 1, 1),
      veil,
      kicker: box(0.07, 0.045, 0.86, 0.03),
      headline: box(0.07, 0.3, 0.86, 0.055),
      dek: box(0, 0, 0, 0),
      meta: box(0.07, 0.085, 0.86, 0.19),
      rules: [],
      ground: "veil",
    };
  }
  const spine = a === "square" ? 0.42 : 0.38;
  const veil = box(0, 0, spine, 1);
  return {
    plate: box(0, 0, 1, 1),
    veil,
    kicker: box(0.045, 0.08, spine - 0.08, 0.04),
    headline: box(0.045, 0.15, spine - 0.08, 0.42),
    dek: box(0.045, 0.62, spine - 0.08, 0.18),
    meta: box(0.045, 0.86, spine - 0.08, 0.07),
    rules: [{ x1: spine, y1: 0.06, x2: spine, y2: 0.94, weight: "hair" }],
    ground: "veil",
  };
}

export function liveRect(rect: Rect): boolean {
  return rect.w > 0.02 && rect.h > 0.02;
}

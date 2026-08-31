/**
 * Devices, and the furniture the operating system puts on top of a wallpaper.
 *
 * Pixel dimensions are the real panel resolutions — an export at these numbers
 * can be set as a wallpaper without the OS resampling it. `pt` is the logical
 * size the interface is laid out in (points on Apple hardware, dp on Android),
 * which is what makes the furniture the right size relative to the sheet: a
 * menu bar is 24pt whether the panel is 2560 or 3024 pixels wide.
 *
 * Furniture geometry is stated in pt and is approximate — measured off default
 * iOS 17 / macOS 14 / Android 14 layouts rather than from a specification. It is
 * here to answer one question honestly: does the composition survive contact
 * with the clock, the icon grid and the dock.
 */

export type Kind = "phone" | "tablet" | "laptop" | "display";

export type RectPt = { x: number; y: number; w: number; h: number };

export type Device = {
  id: string;
  name: string;
  sub: string;
  group: string;
  kind: Kind;
  /** True panel pixels. What export writes. */
  px: [number, number];
  /** Logical layout size. What the furniture is measured in. */
  pt: [number, number];
  ppi: number;
  cornerPt: number;
  /** Android home screens are laid out differently enough to matter. */
  android?: boolean;
};

export const DEVICES: Device[] = [
  {
    id: "iphone-15-pro",
    name: "iPhone 15 Pro",
    sub: "6.1″ · 460 ppi",
    group: "Phone",
    kind: "phone",
    px: [1179, 2556],
    pt: [393, 852],
    ppi: 460,
    cornerPt: 55,
  },
  {
    id: "iphone-15-pro-max",
    name: "iPhone 15 Pro Max",
    sub: "6.7″ · 460 ppi",
    group: "Phone",
    kind: "phone",
    px: [1290, 2796],
    pt: [430, 932],
    ppi: 460,
    cornerPt: 55,
  },
  {
    id: "iphone-se",
    name: "iPhone SE",
    sub: "4.7″ · 326 ppi",
    group: "Phone",
    kind: "phone",
    px: [750, 1334],
    pt: [375, 667],
    ppi: 326,
    cornerPt: 0,
  },
  {
    id: "pixel-8",
    name: "Pixel 8",
    sub: "6.2″ · 428 ppi",
    group: "Phone",
    kind: "phone",
    px: [1080, 2400],
    pt: [412, 915],
    ppi: 428,
    cornerPt: 40,
    android: true,
  },
  {
    id: "ipad-pro-11",
    name: "iPad Pro 11″",
    sub: "264 ppi · portrait",
    group: "Tablet",
    kind: "tablet",
    px: [1668, 2388],
    pt: [834, 1194],
    ppi: 264,
    cornerPt: 18,
  },
  {
    id: "macbook-pro-14",
    name: "MacBook Pro 14″",
    sub: "254 ppi · notched",
    group: "Laptop",
    kind: "laptop",
    px: [3024, 1964],
    pt: [1512, 982],
    ppi: 254,
    cornerPt: 12,
  },
  {
    id: "macbook-air-13",
    name: "MacBook Air 13″",
    sub: "224 ppi",
    group: "Laptop",
    kind: "laptop",
    px: [2560, 1664],
    pt: [1280, 832],
    ppi: 224,
    cornerPt: 10,
  },
  {
    id: "qhd-27",
    name: "27″ display",
    sub: "QHD · 109 ppi",
    group: "Display",
    kind: "display",
    px: [2560, 1440],
    pt: [2560, 1440],
    ppi: 109,
    cornerPt: 0,
  },
  {
    id: "uhd-4k",
    name: "4K display",
    sub: "UHD · scaled 2×",
    group: "Display",
    kind: "display",
    px: [3840, 2160],
    pt: [1920, 1080],
    ppi: 163,
    cornerPt: 0,
  },
];

export const DEVICE_BY_ID = new Map(DEVICES.map((d) => [d.id, d]));

export type Furniture = {
  cornerPt: number;
  statusBarPt?: number;
  island?: RectPt;
  menuBar?: { h: number; notch?: RectPt };
  clock: { box: RectPt; timePt: number; datePt: number; align: "center" | "left" };
  icons: {
    box: RectPt;
    cols: number;
    rows: number;
    iconPt: number;
    pitchX: number;
    pitchY: number;
  };
  dock: { box: RectPt; icons: number; radius: number; pill?: RectPt };
  desktopIcons?: { x: number; y: number; iconPt: number; count: number; pitch: number };
  indicator?: RectPt;
};

export function furnitureFor(device: Device): Furniture {
  const [pw, ph] = device.pt;

  if (device.kind === "phone" || device.kind === "tablet") {
    const notched = device.cornerPt > 20;
    const statusBarPt = notched ? (device.android ? 34 : 54) : 20;
    const cols = device.kind === "tablet" ? 6 : device.android ? 5 : 4;
    const iconPt = device.kind === "tablet" ? 76 : 60;
    const gapX = device.kind === "tablet" ? 44 : 27;
    const gridW = cols * iconPt + (cols - 1) * gapX;
    const marginX = Math.max(16, (pw - gridW) / 2);
    const pitchY = iconPt + 36;
    const gridTop = statusBarPt + (device.kind === "tablet" ? 34 : 18);

    const dockH = device.kind === "tablet" ? 104 : device.android ? 132 : 96;
    const dockBottom = notched ? 34 : 12;
    const dockW = device.kind === "tablet" ? Math.min(pw - 64, 620) : pw - 20;
    const dockTop = ph - dockBottom - dockH;
    const rows = Math.max(4, Math.min(6, Math.floor((dockTop - 16 - gridTop) / pitchY)));

    const timePt = device.kind === "tablet" ? 74 : device.android ? 78 : 92;
    const datePt = device.kind === "tablet" ? 17 : 17;
    const clockTop = device.kind === "tablet" ? statusBarPt + 30 : statusBarPt + 12;
    const clockBox: RectPt = {
      x: marginX,
      y: clockTop,
      w: pw - marginX * 2,
      h: datePt * 1.6 + timePt * 1.2,
    };

    return {
      cornerPt: device.cornerPt,
      statusBarPt,
      island:
        notched && !device.android
          ? { x: pw / 2 - 62, y: 11, w: 124, h: 37 }
          : undefined,
      clock: {
        box: clockBox,
        timePt,
        datePt,
        align: device.android ? "left" : "center",
      },
      icons: {
        box: { x: marginX, y: gridTop, w: gridW, h: rows * pitchY },
        cols,
        rows,
        iconPt,
        pitchX: iconPt + gapX,
        pitchY,
      },
      dock: {
        box: { x: (pw - dockW) / 2, y: dockTop, w: dockW, h: dockH },
        icons: device.kind === "tablet" ? 6 : device.android ? 5 : 4,
        radius: notched ? 40 : 22,
        pill: device.android
          ? { x: (pw - dockW) / 2 + 14, y: dockTop + 84, w: dockW - 28, h: 44 }
          : undefined,
      },
      indicator: notched
        ? { x: pw / 2 - 70, y: ph - 13, w: 140, h: 5 }
        : undefined,
    };
  }

  // macOS-style furniture: menu bar across the top, dock at the bottom, and
  // desktop icons stacked down the right edge.
  const notched = device.id === "macbook-pro-14";
  const menuH = notched ? 37 : device.kind === "display" && device.pt[1] > 1200 ? 24 : 24;
  const dockIcon = 52;
  const dockH = dockIcon + 22;
  const dockIcons = 9;
  const dockW = dockIcons * (dockIcon + 8) + 16;
  const dockBottom = 8;
  const timePt = Math.round(Math.min(140, ph * 0.115));

  return {
    cornerPt: device.cornerPt,
    menuBar: {
      h: menuH,
      notch: notched ? { x: pw / 2 - 87, y: 0, w: 174, h: menuH } : undefined,
    },
    clock: {
      box: { x: pw * 0.2, y: ph * 0.1, w: pw * 0.6, h: timePt * 1.5 },
      timePt,
      datePt: Math.round(timePt * 0.17),
      align: "center",
    },
    icons: {
      box: { x: pw - 108, y: menuH + 18, w: 88, h: 4 * 96 },
      cols: 1,
      rows: 4,
      iconPt: 64,
      pitchX: 96,
      pitchY: 96,
    },
    dock: {
      box: { x: (pw - dockW) / 2, y: ph - dockBottom - dockH, w: dockW, h: dockH },
      icons: dockIcons,
      radius: 18,
    },
    desktopIcons: { x: pw - 108, y: menuH + 18, iconPt: 64, count: 4, pitch: 96 },
  };
}

export type Frac = { x: number; y: number; w: number; h: number };

export function toFrac(rect: RectPt, device: Device): Frac {
  const [pw, ph] = device.pt;
  return { x: rect.x / pw, y: rect.y / ph, w: rect.w / pw, h: rect.h / ph };
}

/**
 * The three regions the press measures and, when asked, composes around.
 */
export function zonesFor(device: Device): { id: "clock" | "icons" | "dock"; label: string; rect: Frac }[] {
  const f = furnitureFor(device);
  const iconLabel = device.kind === "laptop" || device.kind === "display" ? "Desktop icons" : "Icon field";
  const dockLabel = device.kind === "laptop" || device.kind === "display" ? "Dock" : "Dock";
  return [
    { id: "clock", label: "Lock clock", rect: toFrac(f.clock.box, device) },
    { id: "icons", label: iconLabel, rect: toFrac(f.icons.box, device) },
    { id: "dock", label: dockLabel, rect: toFrac(f.dock.box, device) },
  ];
}

/** Vertical band, as a fraction of height, that the OS is guaranteed to use. */
export function keepOut(device: Device): { top: number; bottom: number } {
  const f = furnitureFor(device);
  const [, ph] = device.pt;
  const top = (f.clock.box.y + f.clock.box.h) / ph;
  const bottom = 1 - f.dock.box.y / ph;
  return { top, bottom };
}

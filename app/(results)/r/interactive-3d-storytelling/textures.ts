/**
 * Every surface that would otherwise be a flat Lambert colour is drawn here.
 * Nothing is loaded. The floral, the boards, the lace and the jamb marks are
 * the room's period handwriting.
 */

function canvas(w: number, h: number) {
  const el = document.createElement("canvas");
  el.width = w;
  el.height = h;
  const ctx = el.getContext("2d");
  if (!ctx) throw new Error("canvas");
  return { el, ctx };
}

function noise(ctx: CanvasRenderingContext2D, w: number, h: number, a: number) {
  const img = ctx.getImageData(0, 0, w, h);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const n = (Math.random() - 0.5) * a;
    d[i] = Math.min(255, Math.max(0, d[i] + n));
    d[i + 1] = Math.min(255, Math.max(0, d[i + 1] + n));
    d[i + 2] = Math.min(255, Math.max(0, d[i + 2] + n));
  }
  ctx.putImageData(img, 0, 0);
}

export function woodFloor() {
  const { el, ctx } = canvas(512, 512);
  ctx.fillStyle = "#5a3c24";
  ctx.fillRect(0, 0, 512, 512);
  const boards = 8;
  const bw = 512 / boards;
  for (let i = 0; i < boards; i++) {
    const x = i * bw;
    const base = 78 + ((i * 19) % 28);
    ctx.fillStyle = `rgb(${base + 36},${base + 4},${base - 18})`;
    ctx.fillRect(x, 0, bw - 2, 512);
    ctx.fillStyle = "rgba(30,16,8,0.38)";
    ctx.fillRect(x + bw - 2, 0, 2, 512);
    for (let k = 0; k < 7; k++) {
      ctx.strokeStyle = `rgba(60,36,18,${0.04 + (k % 3) * 0.03})`;
      ctx.beginPath();
      const gx = x + 6 + ((i * 13 + k * 9) % (bw - 14));
      ctx.moveTo(gx, 0);
      ctx.bezierCurveTo(gx + 4, 180, gx - 5, 320, gx + 2, 512);
      ctx.stroke();
    }
    for (let n = 0; n < 4; n++) {
      const y = 40 + ((i * 47 + n * 110) % 440);
      ctx.fillStyle = "rgba(30,20,12,0.45)";
      ctx.fillRect(x + 5, y, 2, 2);
      ctx.fillRect(x + bw - 8, y + 18, 2, 2);
    }
  }
  noise(ctx, 512, 512, 16);
  return el;
}

export function floralPaper() {
  const { el, ctx } = canvas(512, 512);
  ctx.fillStyle = "#c4ae82";
  ctx.fillRect(0, 0, 512, 512);
  ctx.fillStyle = "#b89e72";
  for (let y = 0; y < 512; y += 6) {
    ctx.fillRect(0, y, 512, 1);
  }
  const cell = 72;
  for (let gy = -cell; gy < 512 + cell; gy += cell) {
    for (let gx = -cell; gx < 512 + cell; gx += cell) {
      const ox = gx + ((gy / cell) % 2 === 0 ? 0 : cell / 2);
      leaf(ctx, ox + 12, gy + 20, -0.4);
      leaf(ctx, ox + 40, gy + 44, 0.8);
      rose(ctx, ox + 24, gy + 28, 13);
    }
  }
  noise(ctx, 512, 512, 10);
  return el;
}

function rose(ctx: CanvasRenderingContext2D, x: number, y: number, r: number) {
  ctx.fillStyle = "#7a2e32";
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2 - 0.4;
    ctx.beginPath();
    ctx.ellipse(
      x + Math.cos(a) * r * 0.45,
      y + Math.sin(a) * r * 0.45,
      r * 0.42,
      r * 0.28,
      a,
      0,
      Math.PI * 2
    );
    ctx.fill();
  }
  ctx.fillStyle = "#a84840";
  ctx.beginPath();
  ctx.arc(x, y, r * 0.28, 0, Math.PI * 2);
  ctx.fill();
}

function leaf(ctx: CanvasRenderingContext2D, x: number, y: number, rot: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.fillStyle = "#3e5a34";
  ctx.beginPath();
  ctx.ellipse(0, 0, 11, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export function peachPaint() {
  const { el, ctx } = canvas(256, 256);
  ctx.fillStyle = "#e0b896";
  ctx.fillRect(0, 0, 256, 256);
  for (let y = 0; y < 256; y += 3) {
    ctx.fillStyle = `rgba(180,120,80,${0.03 + (y % 9) * 0.004})`;
    ctx.fillRect(0, y, 256, 1);
  }
  noise(ctx, 256, 256, 12);
  return el;
}

export function magnoliaPaint() {
  const { el, ctx } = canvas(256, 256);
  ctx.fillStyle = "#e8e0d0";
  ctx.fillRect(0, 0, 256, 256);
  for (let y = 0; y < 256; y += 2) {
    ctx.fillStyle = `rgba(160,150,130,${0.025 + (y % 7) * 0.003})`;
    ctx.fillRect(0, y, 256, 1);
  }
  noise(ctx, 256, 256, 8);
  return el;
}

export function plaster() {
  const { el, ctx } = canvas(512, 512);
  ctx.fillStyle = "#c8b8a4";
  ctx.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 80; i++) {
    ctx.fillStyle = `rgba(90,70,55,${0.04 + Math.random() * 0.08})`;
    ctx.beginPath();
    ctx.ellipse(
      Math.random() * 512,
      Math.random() * 512,
      8 + Math.random() * 40,
      4 + Math.random() * 16,
      Math.random() * Math.PI,
      0,
      Math.PI * 2
    );
    ctx.fill();
  }
  ctx.strokeStyle = "rgba(90,70,55,0.18)";
  ctx.beginPath();
  ctx.moveTo(40, 20);
  ctx.bezierCurveTo(80, 200, 60, 340, 120, 500);
  ctx.stroke();
  noise(ctx, 512, 512, 18);
  return el;
}

export function rushSeat() {
  const { el, ctx } = canvas(256, 256);
  ctx.fillStyle = "#8a6e3e";
  ctx.fillRect(0, 0, 256, 256);
  ctx.strokeStyle = "#6a542c";
  for (let i = 0; i < 18; i++) {
    ctx.beginPath();
    ctx.moveTo(i * 15, 0);
    ctx.lineTo(i * 15 - 40, 256);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, i * 15);
    ctx.lineTo(256, i * 15 + 40);
    ctx.stroke();
  }
  noise(ctx, 256, 256, 14);
  return el;
}

export function laceAlpha() {
  const { el, ctx } = canvas(256, 256);
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, 256, 256);
  ctx.fillStyle = "#fff";
  for (let y = 10; y < 256; y += 22) {
    for (let x = 10; x < 256; x += 22) {
      ctx.beginPath();
      ctx.arc(x, y, 2.1, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.fillRect(0, 0, 256, 6);
  ctx.fillRect(0, 250, 256, 6);
  return el;
}

export function brick() {
  const { el, ctx } = canvas(256, 256);
  ctx.fillStyle = "#6a5348";
  ctx.fillRect(0, 0, 256, 256);
  const bh = 16;
  const bw = 32;
  for (let row = 0; row < 18; row++) {
    const off = row % 2 === 0 ? 0 : bw / 2;
    for (let col = -1; col < 10; col++) {
      const x = col * bw + off;
      const y = row * bh;
      ctx.fillStyle = `rgb(${110 + ((row * 3 + col) % 28)},${70 + ((row + col) % 16)},${58 + ((col * 5) % 14)})`;
      ctx.fillRect(x + 1, y + 1, bw - 2, bh - 2);
    }
  }
  return el;
}

export function skyView() {
  const { el, ctx } = canvas(256, 512);
  const g = ctx.createLinearGradient(0, 0, 0, 512);
  g.addColorStop(0, "#8aa4c0");
  g.addColorStop(0.45, "#c8c4b4");
  g.addColorStop(1, "#b0a090");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 256, 512);
  return el;
}

/** What the window actually looks onto. Buildings are also meshes for shadow. */
export function streetView(year: number) {
  const { el, ctx } = canvas(256, 384);
  const g = ctx.createLinearGradient(0, 0, 0, 384);
  if (year < 1976) {
    g.addColorStop(0, "#8fb0d0");
    g.addColorStop(0.42, "#d4cfc0");
    g.addColorStop(1, "#9a8a78");
  } else if (year < 1998) {
    g.addColorStop(0, "#7a90a4");
    g.addColorStop(1, "#6a5a50");
  } else if (year < 2012) {
    g.addColorStop(0, "#6a7884");
    g.addColorStop(1, "#5a4a42");
  } else {
    g.addColorStop(0, "#5a6870");
    g.addColorStop(1, "#3a4044");
  }
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 256, 384);

  if (year < 1976) {
    ctx.fillStyle = "#6a4e42";
    ctx.fillRect(20, 200, 216, 140);
    ctx.fillStyle = "#4a3a32";
    ctx.fillRect(16, 192, 224, 12);
    ctx.fillStyle = "#3a4a58";
    ctx.fillRect(48, 230, 36, 44);
    ctx.fillRect(108, 230, 36, 44);
    ctx.fillRect(168, 230, 36, 44);
    ctx.fillStyle = "#5a4034";
    ctx.fillRect(188, 150, 22, 50);
  } else if (year < 1998) {
    ctx.fillStyle = "#5a4038";
    ctx.fillRect(0, 40, 256, 320);
    ctx.fillStyle = "#2a2c28";
    ctx.fillRect(18, 80, 220, 36);
    ctx.fillRect(18, 160, 220, 36);
    ctx.fillRect(18, 240, 220, 36);
  } else if (year < 2012) {
    ctx.fillStyle = "#6a4a40";
    ctx.fillRect(0, 0, 256, 384);
    ctx.fillStyle = "#1a2830";
    for (let row = 0; row < 7; row++) {
      for (let col = 0; col < 4; col++) {
        ctx.fillRect(16 + col * 60, 18 + row * 52, 42, 36);
      }
    }
  } else {
    ctx.fillStyle = "#6a7a84";
    ctx.fillRect(0, 0, 256, 384);
    ctx.fillStyle = "#d0d4d6";
    for (let i = 0; i < 10; i++) ctx.fillRect(0, 12 + i * 36, 256, 3);
    ctx.fillStyle = "#4a5860";
    for (let col = 0; col < 5; col++) {
      for (let row = 0; row < 9; row++) {
        ctx.fillRect(10 + col * 50, 18 + row * 40, 36, 28);
      }
    }
  }
  return el;
}

const MARKS: { year: number; cm: number }[] = [
  { year: 1982, cm: 98 },
  { year: 1984, cm: 108 },
  { year: 1986, cm: 118 },
  { year: 1988, cm: 128 },
  { year: 1990, cm: 136 },
  { year: 1992, cm: 148 },
  { year: 1993, cm: 154 },
];

/** Jamb face: wood, then pencil heights, then paint, then the same marks again. */
export function jambFace(year: number) {
  const { el, ctx } = canvas(128, 512);
  const painted = year >= 2008 && year < 2020;
  const stripped = year >= 2020;
  if (painted) {
    ctx.fillStyle = year >= 2008 ? "#e8e0d0" : "#e0b896";
    ctx.fillRect(0, 0, 128, 512);
    noise(ctx, 128, 512, 8);
    return el;
  }
  ctx.fillStyle = "#7a5a3a";
  ctx.fillRect(0, 0, 128, 512);
  ctx.fillStyle = "rgba(40,24,12,0.15)";
  for (let x = 8; x < 128; x += 14) {
    ctx.fillRect(x, 0, 2, 512);
  }
  const ghost = stripped;
  const visible = MARKS.filter((m) => year >= m.year && (year < 2008 || stripped));
  for (const mark of visible) {
    const y = 512 - (mark.cm / 210) * 512;
    ctx.strokeStyle = ghost ? "rgba(40,32,24,0.35)" : "rgba(32,28,22,0.7)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(12, y);
    ctx.lineTo(116, y);
    ctx.stroke();
    ctx.fillStyle = ghost ? "rgba(32,28,22,0.45)" : "rgba(24,20,16,0.85)";
    ctx.font = "22px Georgia, serif";
    ctx.fillText(String(mark.year), 22, y - 6);
  }
  noise(ctx, 128, 512, 10);
  return el;
}

export { MARKS };

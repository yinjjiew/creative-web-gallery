/**
 * Printed faces, drawn on canvas. Kept small — this machine paints WebGL in
 * software, and a press sheet does not need a 4K file to read as type.
 */

import * as THREE from "three";

function canvas(w: number, h: number) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d");
  if (!ctx) throw new Error("canvas");
  return { c, ctx };
}

function texture(c: HTMLCanvasElement) {
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.generateMipmaps = false;
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.needsUpdate = true;
  return tex;
}

function fill(ctx: CanvasRenderingContext2D, w: number, h: number, colour: string) {
  ctx.fillStyle = colour;
  ctx.fillRect(0, 0, w, h);
}

export function makePaperTextures(): Record<string, THREE.CanvasTexture> {
  const out: Record<string, THREE.CanvasTexture> = {};

  {
    const { c, ctx } = canvas(256, 360);
    fill(ctx, 256, 360, "#1c3a3a");
    ctx.fillStyle = "#d8c9a0";
    ctx.font = "500 24px Palatino, Georgia, serif";
    ctx.textAlign = "center";
    ctx.fillText("FJORD", 128, 184);
    ctx.font = "12px Palatino, Georgia, serif";
    ctx.fillStyle = "#b7a87a";
    ctx.fillText("A COASTAL ATLAS", 128, 210);
    ctx.strokeStyle = "#d8c9a0";
    ctx.strokeRect(28, 28, 200, 304);
    out.fjord = texture(c);
  }

  {
    const { c, ctx } = canvas(384, 272);
    fill(ctx, 384, 272, "#f0e6c8");
    ctx.fillStyle = "#1c3a3a";
    ctx.beginPath();
    ctx.moveTo(28, 150);
    for (let x = 28; x < 356; x += 12) {
      ctx.lineTo(x, 150 + Math.sin(x * 0.04) * 22 + Math.sin(x * 0.11) * 10);
    }
    ctx.lineTo(356, 248);
    ctx.lineTo(28, 248);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#1c1914";
    ctx.font = "15px Palatino, Georgia, serif";
    ctx.fillText("Hardangerfjord", 36, 40);
    ctx.font = "11px Palatino, Georgia, serif";
    ctx.fillStyle = "#5a544a";
    ctx.fillText("60°26′ N  ·  the water first", 36, 60);
    out["fjord-spread"] = texture(c);
  }

  {
    const { c, ctx } = canvas(220, 320);
    fill(ctx, 220, 320, "#c47a2a");
    ctx.fillStyle = "#24180c";
    ctx.font = "600 42px Palatino, Georgia, serif";
    ctx.fillText("BROTH", 18, 168);
    ctx.font = "13px Palatino, Georgia, serif";
    ctx.fillText("Kadeau  ·  2023", 20, 196);
    out.broth = texture(c);
  }

  {
    const { c, ctx } = canvas(256, 340);
    fill(ctx, 256, 340, "#e8e4dc");
    ctx.strokeStyle = "#1c1914";
    ctx.strokeRect(14, 14, 228, 312);
    ctx.strokeRect(18, 18, 220, 304);
    ctx.fillStyle = "#1c1914";
    ctx.textAlign = "center";
    ctx.font = "18px Palatino, Georgia, serif";
    ctx.fillText("GLASS HOURS", 128, 176);
    ctx.font = "11px Palatino, Georgia, serif";
    ctx.fillStyle = "#5a544a";
    ctx.fillText("AN ARTIST BOOK", 128, 198);
    out["glass-hours"] = texture(c);
  }

  {
    const { c, ctx } = canvas(384, 272);
    fill(ctx, 384, 272, "#f2ebe0");
    ctx.fillStyle = "#8c3117";
    ctx.font = "600 140px Palatino, Georgia, serif";
    ctx.textAlign = "left";
    ctx.fillText("IV", 24, 168);
    ctx.fillStyle = "#1c1914";
    ctx.font = "16px Palatino, Georgia, serif";
    ctx.fillText("Koncerthuset", 28, 228);
    ctx.font = "12px Palatino, Georgia, serif";
    ctx.fillStyle = "#5a544a";
    ctx.fillText("Season  ·  August to December  2024", 28, 250);
    out.season = texture(c);
  }

  {
    const { c, ctx } = canvas(384, 272);
    fill(ctx, 384, 272, "#d8d2c6");
    ctx.fillStyle = "#1c1914";
    const word = "TYPEWALK";
    let x = 20;
    for (let i = 0; i < word.length; i++) {
      const size = 18 + i * 12;
      ctx.font = `500 ${size}px Palatino, Georgia, serif`;
      ctx.fillText(word[i], x, 168);
      x += size * 0.72;
    }
    ctx.font = "12px Palatino, Georgia, serif";
    ctx.fillStyle = "#5a544a";
    ctx.fillText("A walking tour of lettering  ·  Copenhagen", 24, 248);
    out["type-walk"] = texture(c);
  }

  {
    const { c, ctx } = canvas(320, 226);
    fill(ctx, 320, 226, "#e8e2c8");
    ctx.fillStyle = "#3d5a28";
    ctx.font = "600 48px Palatino, Georgia, serif";
    ctx.fillText("HARVEST", 20, 100);
    ctx.font = "22px Palatino, Georgia, serif";
    ctx.fillText("24", 22, 132);
    ctx.fillStyle = "#1c1914";
    ctx.font = "13px Palatino, Georgia, serif";
    ctx.fillText("Torvehallerne  ·  Saturdays in September", 22, 190);
    ctx.strokeStyle = "#3d5a28";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(22, 150);
    ctx.lineTo(140, 150);
    ctx.stroke();
    out.harvest = texture(c);
  }

  {
    const { c, ctx } = canvas(256, 166);
    fill(ctx, 256, 166, "#d8cfc2");
    ctx.fillStyle = "#8a4a28";
    ctx.beginPath();
    ctx.ellipse(70, 84, 30, 32, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#1c1914";
    ctx.font = "20px Palatino, Georgia, serif";
    ctx.fillText("BRUUN", 118, 80);
    ctx.font = "11px Palatino, Georgia, serif";
    ctx.fillStyle = "#5a544a";
    ctx.fillText("ceramics", 118, 100);
    out["bruun-card"] = texture(c);
  }

  {
    const { c, ctx } = canvas(220, 310);
    fill(ctx, 220, 310, "#f4efe6");
    ctx.fillStyle = "#8a4a28";
    ctx.beginPath();
    ctx.ellipse(36, 36, 12, 13, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#1c1914";
    ctx.font = "13px Palatino, Georgia, serif";
    ctx.fillText("BRUUN", 56, 34);
    ctx.font = "10px Palatino, Georgia, serif";
    ctx.fillStyle = "#5a544a";
    ctx.fillText("Ceramics  ·  Copenhagen", 56, 50);
    ctx.strokeStyle = "rgba(28,25,20,0.16)";
    ctx.beginPath();
    ctx.moveTo(18, 64);
    ctx.lineTo(202, 64);
    ctx.stroke();
    out["bruun-letter"] = texture(c);
  }

  {
    const { c, ctx } = canvas(256, 166);
    fill(ctx, 256, 166, "#1c2a44");
    ctx.strokeStyle = "#e8dcc4";
    ctx.beginPath();
    ctx.moveTo(22, 134);
    ctx.quadraticCurveTo(64, 118, 112, 134);
    ctx.quadraticCurveTo(160, 150, 210, 130);
    ctx.stroke();
    ctx.fillStyle = "#e8dcc4";
    ctx.font = "24px Palatino, Georgia, serif";
    ctx.fillText("HAVN", 22, 70);
    ctx.font = "11px Palatino, Georgia, serif";
    ctx.fillText("Inn  ·  Skagen", 24, 90);
    out.havn = texture(c);
  }

  {
    const { c, ctx } = canvas(220, 220);
    fill(ctx, 220, 220, "#efe8d8");
    ctx.strokeStyle = "#1c1914";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(110, 110, 82, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = "#1c1914";
    ctx.textAlign = "center";
    ctx.font = "28px Palatino, Georgia, serif";
    ctx.fillText("ØRE", 110, 108);
    ctx.font = "14px Palatino, Georgia, serif";
    ctx.fillText("07", 110, 132);
    out.ore = texture(c);
  }

  {
    const { c, ctx } = canvas(192, 192);
    fill(ctx, 192, 192, "#6a7a86");
    ctx.fillStyle = "#f0eadc";
    ctx.textAlign = "center";
    ctx.font = "32px Palatino, Georgia, serif";
    ctx.fillText("NORD", 96, 96);
    ctx.font = "12px Palatino, Georgia, serif";
    ctx.fillText("SEA SALT", 96, 118);
    out["nord-salt"] = texture(c);
  }

  {
    const { c, ctx } = canvas(160, 240);
    fill(ctx, 160, 240, "#d4dcc4");
    ctx.strokeStyle = "#3d4a28";
    for (let i = 0; i < 5; i++) {
      ctx.beginPath();
      ctx.moveTo(30 + i * 5, 28);
      ctx.quadraticCurveTo(52 + i * 6, 120, 26 + i * 5, 210);
      ctx.stroke();
    }
    ctx.fillStyle = "#1c1914";
    ctx.textAlign = "center";
    ctx.font = "22px Palatino, Georgia, serif";
    ctx.fillText("BIRCH", 80, 124);
    ctx.font = "11px Palatino, Georgia, serif";
    ctx.fillText("TEA", 80, 142);
    out.birch = texture(c);
  }

  {
    const { c, ctx } = canvas(280, 122);
    fill(ctx, 280, 122, "#f0e8d4");
    ctx.strokeStyle = "rgba(28,25,20,0.35)";
    ctx.setLineDash([3, 4]);
    ctx.beginPath();
    ctx.moveTo(196, 6);
    ctx.lineTo(196, 116);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = "#1c1914";
    ctx.font = "18px Palatino, Georgia, serif";
    ctx.textAlign = "left";
    ctx.fillText("STUB", 14, 42);
    ctx.font = "11px Palatino, Georgia, serif";
    ctx.fillStyle = "#5a544a";
    ctx.fillText("Koncerthuset  ·  Season IV", 14, 62);
    ctx.font = "16px ui-monospace, monospace";
    ctx.fillStyle = "#1c1914";
    ctx.fillText("0847", 208, 68);
    out.stub = texture(c);
  }

  {
    const { c, ctx } = canvas(256, 256);
    ctx.fillStyle = "#f4efe4";
    ctx.fillRect(0, 0, 256, 256);
    ctx.strokeStyle = "rgba(28,25,20,0.12)";
    for (let i = 0; i <= 8; i++) {
      const p = (i / 8) * 256;
      ctx.beginPath();
      ctx.moveTo(p, 0);
      ctx.lineTo(p, 256);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, p);
      ctx.lineTo(256, p);
      ctx.stroke();
    }
    out.grid = texture(c);
  }

  {
    const { c, ctx } = canvas(256, 32);
    ctx.fillStyle = "#9a6b42";
    ctx.fillRect(0, 0, 256, 32);
    ctx.fillStyle = "#3a2414";
    for (let i = 0; i <= 30; i++) {
      const x = (i / 30) * 256;
      ctx.fillRect(x, i % 5 === 0 ? 4 : 14, 1, i % 5 === 0 ? 24 : 14);
    }
    ctx.fillStyle = "#24180c";
    ctx.font = "10px ui-monospace, monospace";
    ctx.fillText("0", 3, 12);
    ctx.fillText("300 mm", 210, 12);
    out.ruler = texture(c);
  }

  {
    const names = ["BOOKS", "POSTERS", "IDENTITY", "PACKING"];
    names.forEach((name, i) => {
      const { c, ctx } = canvas(128, 32);
      ctx.fillStyle = "#d8cfc0";
      ctx.fillRect(0, 0, 128, 32);
      ctx.fillStyle = "#1c1914";
      ctx.font = "12px Palatino, Georgia, serif";
      ctx.textAlign = "center";
      ctx.fillText(name, 64, 21);
      out[`label-${i}`] = texture(c);
    });
  }

  return out;
}

export function makeEdgeTexture(warm = "#e8dcc4") {
  const { c, ctx } = canvas(4, 16);
  ctx.fillStyle = warm;
  ctx.fillRect(0, 0, 4, 16);
  return texture(c);
}

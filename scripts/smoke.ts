/**
 * Smoke-tests every built result route against the running dev server.
 *
 * `npm run validate` checks the registry's structure and `next build` checks
 * that the code compiles, and a result can sail through both while being a
 * placeholder — a page that renders a heading and nothing else returns 200 and
 * type-checks perfectly. This catches that class of problem instead:
 *
 *   - the route does not resolve, or throws
 *   - the console reports errors
 *   - there is barely any content, i.e. it is still a stub
 *   - a canvas is present but paints a flat field
 *
 * The flat-canvas test uses compressed size as a proxy for variance: a PNG of a
 * uniform area is tiny, so bytes per pixel separates a blank plate from a drawn
 * one without needing an image decoder.
 *
 *   npx tsx scripts/smoke.ts                  every directory under (results)/r
 *   npx tsx scripts/smoke.ts games-one-button one id
 *
 * Set SMOKE_WIDTH / SMOKE_HEIGHT to test a phone viewport.
 */
import { readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { chromium, type Browser } from "playwright";

const HERE = dirname(fileURLToPath(import.meta.url));
const RESULTS_DIR = join(HERE, "..", "app", "(results)", "r");

const BASE = process.env.SMOKE_BASE ?? "http://localhost:3000";
const WIDTH = Number(process.env.SMOKE_WIDTH ?? 1440);
const HEIGHT = Number(process.env.SMOKE_HEIGHT ?? 900);
const SETTLE = Number(process.env.SMOKE_SETTLE ?? 2500);

/** Below this much rendered text, a page is not a finished result. */
const MIN_TEXT = 400;
/** Below this many elements, likewise. */
const MIN_NODES = 40;
/** Compressed bytes per pixel under which a canvas is considered flat. */
const MIN_BYTES_PER_PIXEL = 0.02;

/** Software WebGL is refused by default in current Chromium without this. */
const LAUNCH_ARGS = [
  "--enable-unsafe-swiftshader",
  "--use-gl=angle",
  "--use-angle=swiftshader",
  "--disable-dev-shm-usage",
];

type Report = {
  id: string;
  status: number;
  text: number;
  nodes: number;
  canvases: number;
  flat: number;
  errors: string[];
  failures: string[];
  /** Other results whose compile errors are breaking this route's verdict. */
  blockedBy: string[];
};

async function check(browser: Browser, id: string): Promise<Report> {
  const context = await browser.newContext({
    viewport: { width: WIDTH, height: HEIGHT },
    deviceScaleFactor: 1,
    hasTouch: WIDTH < 500,
    isMobile: WIDTH < 500,
    httpCredentials:
      process.env.SITE_USERNAME && process.env.SITE_PASSWORD
        ? {
            username: process.env.SITE_USERNAME,
            password: process.env.SITE_PASSWORD,
          }
        : undefined,
  });

  const page = await context.newPage();
  const errors: string[] = [];
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  page.on("pageerror", (e) => errors.push(String(e)));

  const failures: string[] = [];
  let blockedBy: string[] = [];
  let status = 0;
  let text = 0;
  let nodes = 0;
  let canvases = 0;
  let flat = 0;

  try {
    const response = await page.goto(`${BASE}/r/${id}`, {
      waitUntil: "networkidle",
      timeout: 60_000,
    });
    status = response?.status() ?? 0;
    await page.waitForTimeout(SETTLE);

    const measured = await page.evaluate(() => ({
      text: (document.body.innerText ?? "").trim().length,
      nodes: document.body.querySelectorAll("*").length,
    }));
    text = measured.text;
    nodes = measured.nodes;

    // A canvas-driven result legitimately carries little text, so the two
    // thresholds are only a failure together with a flat or absent canvas.
    const handles = await page.locator("canvas").all();
    canvases = handles.length;
    for (const handle of handles) {
      const box = await handle.boundingBox();
      if (!box || box.width < 8 || box.height < 8) continue;
      // Generous: a heavy scene on a software rasteriser is slow to commit.
      const shot = await handle.screenshot({ timeout: 45_000 }).catch(() => null);
      if (!shot) {
        failures.push("canvas would not capture — too slow to draw a frame?");
        continue;
      }
      const perPixel = shot.byteLength / (box.width * box.height);
      if (perPixel < MIN_BYTES_PER_PIXEL) {
        flat++;
        failures.push(
          `flat canvas ${Math.round(box.width)}x${Math.round(box.height)} ` +
            `at ${perPixel.toFixed(4)} bytes/px`
        );
      }
    }

    // A compile error anywhere fails every route in dev, so a result can look
    // broken because a different one is mid-edit. Say so rather than blaming
    // this result, which is what sends someone chasing a bug they do not have.
    const foreign = errors
      .flatMap((error) => [...error.matchAll(/\(results\)\/r\/([\w-]+)\//g)])
      .map((match) => match[1])
      .filter((other) => other !== id);
    if (foreign.length) {
      blockedBy = [...new Set(foreign)];
    }

    if (status !== 200) failures.push(`status ${String(status)}`);
    // A full-bleed canvas piece is legitimately a handful of elements and a few
    // words, so thinness is only evidence of a stub when nothing is being drawn
    // either. A drawn canvas is the content.
    if (canvases === 0 && (text < MIN_TEXT || nodes < MIN_NODES)) {
      failures.push(
        `only ${String(text)} characters and ${String(nodes)} elements, ` +
          `no canvas — a stub?`
      );
    }
    if (errors.length) failures.push(`${String(errors.length)} console error(s)`);
  } catch (error) {
    failures.push(String(error).split("\n")[0]);
  }

  await context.close();
  return { id, status, text, nodes, canvases, flat, errors, failures, blockedBy };
}

async function main() {
  const requested = process.argv.slice(2);
  const ids = requested.length
    ? requested
    : readdirSync(RESULTS_DIR, { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .map((entry) => entry.name)
        .sort();

  if (!ids.length) {
    console.log("no result directories yet");
    return;
  }

  console.log(`smoke ${String(ids.length)} result(s) at ${String(WIDTH)}x${String(HEIGHT)}\n`);

  const browser = await chromium.launch({ args: LAUNCH_ARGS });
  const reports: Report[] = [];
  for (const id of ids) {
    const report = await check(browser, id);
    reports.push(report);
    const blocked = report.blockedBy.length > 0;
    const mark = blocked ? "----" : report.failures.length ? "FAIL" : "ok  ";
    console.log(
      `${mark} ${report.id}\n` +
        `       ${String(report.status)} · ${String(report.text)} chars · ` +
        `${String(report.nodes)} elements · ${String(report.canvases)} canvas`
    );
    if (blocked) {
      console.log(
        `       inconclusive: ${report.blockedBy.join(", ")} ` +
          `${report.blockedBy.length > 1 ? "are" : "is"} failing to compile, ` +
          `which breaks every route. Retry once that is fixed.`
      );
    } else {
      for (const failure of report.failures) console.log(`       ! ${failure}`);
      for (const error of report.errors.slice(0, 3)) {
        console.log(`       console: ${error.slice(0, 160)}`);
      }
    }
  }
  await browser.close();

  const blocked = reports.filter((r) => r.blockedBy.length);
  const bad = reports.filter((r) => !r.blockedBy.length && r.failures.length);
  const clean = reports.length - bad.length - blocked.length;
  console.log(`\n${String(clean)}/${String(reports.length)} clean`);
  if (blocked.length) {
    console.log(
      `inconclusive (another result will not compile): ` +
        `${blocked.map((r) => r.id).join(", ")}`
    );
  }
  if (bad.length) {
    console.log(`failing: ${bad.map((r) => r.id).join(", ")}`);
  }
  if (bad.length || blocked.length) process.exitCode = 1;
}

void main();

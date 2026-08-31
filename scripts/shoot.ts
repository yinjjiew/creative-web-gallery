/**
 * Screenshots pages from the running dev server into /tmp/shots.
 *
 * A design-led project cannot be reviewed from a passing build, and reading CSS
 * is not the same as looking at the page. Used during development only.
 *
 *   npx tsx scripts/shoot.ts /               index.png
 *   npx tsx scripts/shoot.ts /tasks/foo      tasks-foo.png
 *
 * With no arguments it shoots a default tour of the gallery.
 */
import { mkdirSync } from "node:fs";

import { chromium, type Browser } from "playwright";

const BASE = process.env.SHOOT_BASE ?? "http://localhost:3000";
const OUT = process.env.SHOOT_OUT ?? "/tmp/shots";
const WIDTH = Number(process.env.SHOOT_WIDTH ?? 1440);
const HEIGHT = Number(process.env.SHOOT_HEIGHT ?? 900);
const FULL = process.env.SHOOT_FULL !== "0";
/** Milliseconds to let animation and simulation settle before the shutter. */
const SETTLE = Number(process.env.SHOOT_SETTLE ?? 1200);
/**
 * There is no GPU here, so WebGL runs on a software rasteriser. A heavy scene
 * at 2x on a large viewport can take longer to commit a frame than the default
 * shutter is willing to wait, which reads as a hang on exactly the 3D results
 * that most need looking at. Hence a generous timeout, and a retry at 1x.
 */
const TIMEOUT = Number(process.env.SHOOT_TIMEOUT ?? 60_000);
const DPR = Number(process.env.SHOOT_DPR ?? 2);

/** Software WebGL is refused by default in current Chromium without this. */
const LAUNCH_ARGS = [
  "--enable-unsafe-swiftshader",
  "--use-gl=angle",
  "--use-angle=swiftshader",
  "--disable-dev-shm-usage",
];

const DEFAULT_TOUR = [
  "/",
  "/settings/creative-tools",
  "/tasks/creative-tools-wallpaper-generator",
  "/abilities",
  "/progress",
];

function nameFor(path: string) {
  const slug = path.replace(/^\/|\/$/g, "").replace(/[^a-zA-Z0-9]+/g, "-");
  return `${slug || "index"}.png`;
}

async function shoot(browser: Browser, path: string, dpr = DPR) {
  const context = await browser.newContext({
    viewport: { width: WIDTH, height: HEIGHT },
    deviceScaleFactor: dpr,
    // The catalogue is behind basic auth in every environment.
    httpCredentials:
      process.env.SITE_USERNAME && process.env.SITE_PASSWORD
        ? {
            username: process.env.SITE_USERNAME,
            password: process.env.SITE_PASSWORD,
          }
        : undefined,
  });

  const page = await context.newPage();

  // The dev-mode indicator floats over the bottom-left corner and is not part
  // of the page being reviewed. Left in, it reads as a bug in the result.
  // Passed as source text, not a function: the transform used to run this
  // script injects helpers that would not exist in the page.
  await page.addInitScript({
    content: `
      (function () {
        function hide() {
          var style = document.createElement("style");
          style.textContent =
            "nextjs-portal, [data-nextjs-toast], #__next-build-watcher { display: none !important; }";
          document.head.appendChild(style);
        }
        if (document.head) hide();
        else document.addEventListener("DOMContentLoaded", hide, { once: true });
      })();
    `,
  });

  const problems: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") problems.push(message.text());
  });
  page.on("pageerror", (error) => problems.push(String(error)));

  const response = await page.goto(`${BASE}${path}`, {
    waitUntil: "networkidle",
    timeout: TIMEOUT,
  });
  await page.waitForTimeout(SETTLE);

  const file = `${OUT}/${nameFor(path)}`;
  let captured = true;
  try {
    await page.screenshot({ path: file, fullPage: FULL, timeout: TIMEOUT });
  } catch (error) {
    captured = false;
    problems.push(`screenshot: ${String(error).split("\n")[0]}`);
  }

  const status = response?.status() ?? 0;
  console.log(
    `${captured && status === 200 ? "ok " : "ERR"} ${String(status)}  ` +
      `${path}${dpr === DPR ? "" : ` @${String(dpr)}x`} → ${file}`
  );
  for (const problem of problems.slice(0, 5)) {
    console.log(`      console: ${problem}`);
  }

  await context.close();
  return captured;
}

async function main() {
  const paths = process.argv.slice(2);
  const targets = paths.length ? paths : DEFAULT_TOUR;

  mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({ args: LAUNCH_ARGS });
  for (const path of targets) {
    try {
      const captured = await shoot(browser, path);
      // A frame the software rasteriser cannot commit in time is usually just
      // too many pixels, so fall back to 1x rather than leaving no image at all.
      if (!captured && DPR > 1) {
        console.log(`      retrying at 1x`);
        await shoot(browser, path, 1);
      }
    } catch (error) {
      console.log(`ERR      ${path} — ${String(error).split("\n")[0]}`);
    }
  }
  await browser.close();
}

void main();

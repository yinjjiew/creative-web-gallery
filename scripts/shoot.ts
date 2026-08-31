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

async function shoot(browser: Browser, path: string) {
  const context = await browser.newContext({
    viewport: { width: WIDTH, height: HEIGHT },
    deviceScaleFactor: 2,
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
  const problems: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") problems.push(message.text());
  });
  page.on("pageerror", (error) => problems.push(String(error)));

  const response = await page.goto(`${BASE}${path}`, {
    waitUntil: "networkidle",
    timeout: 45_000,
  });
  await page.waitForTimeout(SETTLE);

  const file = `${OUT}/${nameFor(path)}`;
  await page.screenshot({ path: file, fullPage: FULL });

  const status = response?.status() ?? 0;
  console.log(
    `${status === 200 ? "ok " : "ERR"} ${String(status)}  ${path} → ${file}`
  );
  for (const problem of problems.slice(0, 5)) {
    console.log(`      console: ${problem}`);
  }

  await context.close();
}

async function main() {
  const paths = process.argv.slice(2);
  const targets = paths.length ? paths : DEFAULT_TOUR;

  mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();
  for (const path of targets) {
    try {
      await shoot(browser, path);
    } catch (error) {
      console.log(`ERR      ${path} — ${String(error).split("\n")[0]}`);
    }
  }
  await browser.close();
}

void main();

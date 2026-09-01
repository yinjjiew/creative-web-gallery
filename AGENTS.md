<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Creative Web Reference Gallery

A catalogue of 74 task prompts across 9 application settings, each with one
reference implementation built in answer to its prompt.

## The three concepts, kept separate

| Concept | Meaning | Lives in |
| --- | --- | --- |
| Application Setting | Broad family of web experience. There are 9. | `lib/settings.ts` |
| Typical Task | A kind of thing buildable inside a setting. There are 74. | `lib/tasks/*.ts` |
| Ability | An underlying capability a task demands. Closed list of 20. | `lib/types.ts` |

A setting is never represented by a single example. Every typical task has its
own prompt, its own ability tags, and its own result.

## Layout

```
app/
├── (gallery)/            root layout A — the catalogue. Owns fonts + palette.
│   ├── page.tsx          index: all settings, search, ability filter
│   ├── settings/[slug]/  one setting
│   ├── tasks/[id]/       prompt + result pairing. The most important page.
│   ├── abilities/        ability vocabulary and per-ability task lists
│   └── progress/         pipeline status per setting
└── (results)/            root layout B — deliberately empty of styling
    └── r/<task-id>/      one built result per directory
lib/
├── types.ts              Task, Setting, ABILITIES, STATUS_ORDER
├── settings.ts           the 9 settings
├── tasks/                the 74 tasks, one file per setting
└── rows.ts               server→client projection for the index
scripts/
├── validate.ts           structural checks over the registry
└── shoot.ts              screenshots pages from the dev server
proxy.ts                  HTTP basic auth over everything
```

Two root layouts, so results inherit no typography or palette from the
catalogue. Crossing between them triggers a full page load, which is correct: a
result is a separate piece of work, not a subview. Do not add `app/layout.tsx` —
it would collapse the isolation.

## Commands

```bash
npm run dev                     # localhost:3000, credentials in .env.local
npm run validate                # registry structure
npm run check                   # validate + tsc + lint + build
npm run smoke                   # every result: status, console, stubs, blank canvases
npm run smoke -- <task-id>      # just one
npx tsx scripts/shoot.ts /path  # screenshot a page (dev server must be running)
```

`smoke` exists because a placeholder passes both `validate` and `build`: a page
that renders a heading and nothing else compiles perfectly and returns 200. It
flags thin pages, console errors, and canvases that paint a flat field. Run it
before you call a result finished.

### When several agents build at once

They share one dev server, and **a compile error in any result breaks every
route**. So a 500 on your page is often not your fault. If the error names a
file outside your own directory, another agent is mid-write: wait a moment and
retry rather than debugging your own code. `npm run smoke` reports this as
`inconclusive` and names the culprit instead of blaming your result.

Write files early and often. Save a working skeleton before refining it, so an
interruption leaves something that renders rather than a half-written import.

There is no GPU here, so WebGL runs on a software rasteriser and a heavy scene
can take a minute or more to capture. `shoot.ts` allows for that and retries at
1x if a frame will not commit in time; `SHOOT_DPR=1` from the start is faster
while you iterate. A slow screenshot is not a bug in your result.

Screenshots need browser libraries that are not installed system-wide here.
Prefix with:

```bash
export LD_LIBRARY_PATH=/tmp/plwdeps/root/usr/lib/x86_64-linux-gnu:/tmp/plwdeps/root/usr/lib/x86_64-linux-gnu/nss:$LD_LIBRARY_PATH
```

## Building a result

One directory, `app/(results)/r/<task-id>/`, containing `page.tsx` plus whatever
CSS modules and local components it needs. Own the directory entirely; never
edit another result's files.

### Hard rules

**Read the prompt and answer it.** The prompt in `lib/tasks/` is the brief. If it
asks for export, implement export. If it asks for persistence, persist. If it
asks for camera input, take camera input and write a real fallback. Nothing may
be faked, stubbed, or replaced by a note explaining what would happen.

**The first gesture must change the page.** A brochure, a static article, or a
settings panel that could be a PDF has failed this gallery. The visitor should
be able to do something in the first two seconds that the page answers — light,
weight, a throw, a constraint lighting up, a field rearranging. Interaction is
the work, not a flourish on top of copy. Pointer, touch, keyboard, and (where
the brief asks) voice or camera all count. Hover-only theatre does not.

**No shared design.** Each result brings its own fonts, palette, spacing and
motion. Sharing framework, routing, utilities and build config is expected;
sharing a navbar, a hero, a card, a font pairing or a colour scheme is not. Two
results that look like siblings are both failures.

**Self-contained.** No network requests at runtime, no external asset hosts, no
API keys, no third-party services. Fonts come from `next/font/google` (which
self-hosts at build time) or are drawn from system stacks. Datasets are embedded
as local modules with their provenance stated. Audio is synthesized with Web
Audio; do not ship audio files. 3D geometry is generated procedurally; do not
ship model binaries.

**Client-side.** Results are interactive front-ends. Mark them `"use client"`
and keep heavy work behind `next/dynamic` with `ssr: false` so a WebGL scene
never runs during prerender or lands in a shared chunk.

**Honest data.** Where a result presents real data, state where it came from. If
any part is modelled or synthesized, label that plainly in the interface, not
just in a comment. Never present invented numbers as measurements.

**Accessible.** Keyboard operation, visible focus, real contrast, and
`prefers-reduced-motion` respected. Where an experience depends on pointer
movement, provide a route through it that does not. Camera and microphone are
asked for plainly, processed on-device, and refusal leads to a considered
alternative rather than a dead end.

**Works on a phone.** Touch as well as pointer. A result that requires a mouse
must say so and degrade deliberately.

**Escape hatch.** Every result includes a quiet, unobtrusive link back to its
task page — small, in a corner, in the result's own visual language, never a
shared component.

### Aesthetics to refuse

Blue-to-purple gradients. Glowing blobs. Glassmorphism. Bento grids. Endless
rounded cards. Giant gradient headlines. Fake SaaS testimonials and logo walls.
Default Tailwind dashboards. Repeated hero sections. Meaningless particles.
Dark backgrounds with a glowing sphere. A blurred circle lagging behind the
cursor.

More visual effects is not better taste. Restrained, editorial, quiet, minimal,
monochrome and typography-driven are all available and frequently stronger. Each
result picks the visual language its own subject deserves. Quiet is allowed;
inert is not. If the only motion is a CSS fade on a card, start again.

Some results should be simple. One screen, one object, one interaction, one idea
is a legitimate and often better answer than maximum feature count. The standard
is strength of idea multiplied by quality of execution.

### Status

Move the task's `status` in `lib/tasks/` as work proceeds:

`planned` → `prompt-written` → `building` → `polishing` → `complete`

`validate` requires a route on disk at `polishing` and above. Do not write
`complete` because the route renders — it means the result was reviewed against
its own prompt and the weak areas were fixed.

### Self-review before marking complete

Does it satisfy its own prompt? Is there one clear idea? Is the typography
intentional? Does the interaction have a purpose, or is it there to make the page
busier? Does it look contemporary rather than generated? Is anything fake? Is
anything obviously unfinished? Would a strong creative developer post this
publicly?

# Creative Web Reference Gallery

A catalogue of 74 task prompts across 9 application settings of the creative
web, each with one reference implementation built in answer to its prompt.

The purpose is to establish a high-quality reference distribution — task designs
and built results whose creative standard is meaningfully above the conventional
examples found in existing AI web-building communities.

## The structure

Three concepts, kept deliberately separate:

```
Application Setting          the broad family of web experience (9)
        ↓
Typical Task                 a kind of thing buildable in that setting (74)
        ↓
Prompt + Ability Tags        one concrete prompt written per typical task
        ↓
Result                       one built implementation per prompt
```

A setting is never represented by a single example. `Games` is not one task; it
is nine, each with its own prompt and its own result.

### The nine settings

| # | Setting | Tasks |
| --- | --- | --- |
| 1 | Creative Tools & Artifact Generators | 8 |
| 2 | Interactive 3D Experiences | 9 |
| 3 | 2D Visuals & Toys | 8 |
| 4 | Games | 9 |
| 5 | Personal & Studio Sites | 8 |
| 6 | Client & Brand Work | 7 |
| 7 | Educational Apps | 8 |
| 8 | Practical Web Apps | 9 |
| 9 | Traditional Websites | 8 |

### Abilities

Every task is tagged from a closed vocabulary of 20 abilities, defined in
`lib/types.ts`. The list is closed on purpose: a second name for an ability that
already exists would split one ability's tasks across two labels and make any
later per-ability analysis wrong.

The metadata is structured this way because the catalogue may later become part
of an evaluation benchmark. **No evaluation system is built here** — there is no
scoring, no judging, no leaderboard, and no model comparison. The structure
exists so that such an analysis would be possible, not so that it is performed.

## Running it

Requires Node 20.9 or newer.

```bash
npm install
cp .env.example .env.local     # then fill in SITE_USERNAME and SITE_PASSWORD
npm run dev
```

Open `http://localhost:3000`. The whole site is behind HTTP basic auth while the
project is confidential; `proxy.ts` fails closed, so it will return 503 until
both variables are set.

| Command | Does |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run validate` | Structural checks over the task registry |
| `npm run check` | validate, then typecheck, lint and build |
| `npx tsx scripts/shoot.ts /path` | Screenshot a page from the running dev server |

### Environment variables

| Variable | Purpose |
| --- | --- |
| `SITE_USERNAME` | Username for viewing the catalogue |
| `SITE_PASSWORD` | Password for viewing the catalogue |

There is no database, no API key and no third-party service. The catalogue is
authored content and lives in the repository as typed data, which means git
provides its history and there is no secret to leak beyond the viewing password.
Results that need to remember something use the browser's own storage.

## Layout

```
app/
├── (gallery)/            root layout A — the catalogue
│   ├── page.tsx          index: all settings, search, ability filter
│   ├── settings/[slug]/  one setting and its typical tasks
│   ├── tasks/[id]/       the prompt + result pairing
│   ├── abilities/        the vocabulary, and tasks per ability
│   └── progress/         pipeline status per setting
└── (results)/            root layout B — no shared styling at all
    └── r/<task-id>/      one built result per directory
lib/
├── types.ts              Task, Setting, ABILITIES, STATUS_ORDER
├── settings.ts           the 9 settings
├── tasks/                the 74 tasks, one file per setting
├── abilities.ts          ability ⇄ URL slug
└── rows.ts               server→client projection for the index
scripts/
├── validate.ts           registry invariants
└── shoot.ts              screenshots, for reviewing design work
proxy.ts                  HTTP basic auth
```

### Why two root layouts

Section 9 of the specification forbids the results from sharing a navbar, hero,
card design, font pairing, palette, transition or layout. Enforcing that by
discipline alone fails eventually, so it is enforced structurally instead: the
gallery's typography and palette live in `app/(gallery)/layout.tsx`, and
`app/(results)/layout.tsx` declares no font and imports no stylesheet. A result
inherits nothing it did not choose.

The cost is that navigating between the catalogue and a result triggers a full
page load. That is the correct trade here — a result is a separate piece of
work, not a subview of the gallery.

### Why no Tailwind

Each of the 74 results needs a genuinely different visual language, and utility
classes push independent designs toward a shared vocabulary. CSS Modules keep
each result's styling self-contained and make divergence the default rather than
something to fight for.

## Progress

A task moves through:

```
planned → prompt-written → building → polishing → complete
```

`complete` means the result was reviewed against its own prompt and its weak
areas were fixed. It does not mean the route renders. `npm run validate`
enforces that any task claiming `polishing` or above has a route on disk, and
that no route on disk lacks a task.

`/progress` reports the state of every setting.

## Adding or changing a result

Conventions for building results — the hard rules, the aesthetics to refuse, and
the self-review checklist — are in [AGENTS.md](./AGENTS.md).

## Deployment

Deployed on Vercel. No cron jobs, no database, so the default configuration is
sufficient and any plan tier will do.

Vercel's own Deployment Protection is disabled for this project **on purpose**.
On a Pro account it defaults to `all_except_custom_domains`, which puts every
`.vercel.app` URL behind a Vercel login and would make the site unopenable by
anyone without an account on the team — defeating the point of a shareable
viewing password. Access control is `proxy.ts` instead: one shared credential
that can be given to a reviewer, covering production and previews alike.

If this project ever stops being confidential, remove the gate rather than
weakening it, and re-enable Vercel's protection on any preview deployments that
should stay private.

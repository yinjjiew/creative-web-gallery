"use client";

/**
 * Kirkwall Seed Library — a brand story that has to end in participation.
 *
 * The brief's hardest constraint is the one about doom. A story this bleak, told
 * straight, produces a visitor who feels bad and does nothing, and the ask is a
 * membership and a bed. So the page is built as loss, then cause, then the
 * practice that answers the cause, then the act — and the ledger in §2 is wired
 * directly into the practices in §5 so that no named loss is ever more than one
 * click from the thing that would have prevented it.
 *
 * The second constraint is accuracy, because the audience are gardeners who
 * already buy seed and some of them know this subject better than the copy does.
 * So the real figures are separated from the invented ones typographically as
 * well as verbally: anything real carries a note number, anything invented
 * carries an "illustrative" chip, and §1 volunteers the weaknesses in the
 * best-known statistic in the field before a reader can catch it out.
 */

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

import { CATALOGUE_1903, CATALOGUE_TOTALS, SOURCES } from "./data/facts";
import {
  LOST,
  ADOPTABLE,
  VARIETIES,
  byId,
  type LessonId,
} from "./data/varieties";
import Join from "./join";
import { Detail, Ledger } from "./ledger";
import Practice from "./practice";
import Segregation from "./segregation";
import Store from "./store";
import s from "./kirkwall.module.css";

const STORE_KEY = "kirkwall-seed-library.taken-on";

function Ref({ n }: { n: number }) {
  return (
    <a className={`${s.ref} ${s.refLink}`} href={`#note-${String(n)}`}>
      <span className={s.srOnly}>note </span>
      {n}
    </a>
  );
}

const CONTENTS = [
  { id: "gone", label: "What is gone" },
  { id: "ledger", label: "The ledger" },
  { id: "rota", label: "A rota, not a shelf" },
  { id: "seed", label: "Seed you can keep" },
  { id: "keeping", label: "How to keep one" },
  { id: "join", label: "Join" },
];

const KEPT_PERCENT = (
  (CATALOGUE_TOTALS.held1983 / CATALOGUE_TOTALS.listed1903) *
  100
).toFixed(1);

export default function Library() {
  const [selected, setSelected] = useState("kirkwall-longkeeper");
  const [openLesson, setOpenLesson] = useState<LessonId>("share");
  const [adopted, setAdopted] = useState<Set<string>>(() => new Set());
  const keeping = useRef<HTMLElement>(null);

  // A commitment that vanishes on reload is not a commitment. Read after mount
  // so the server and the first client render agree.
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORE_KEY);
      if (!raw) return;
      const ids = JSON.parse(raw) as unknown;
      if (Array.isArray(ids)) {
        setAdopted(
          new Set(ids.filter((id): id is string => typeof id === "string" && !!byId(id)))
        );
      }
    } catch {
      // A private-mode browser or a corrupt entry: the page works without it.
    }
  }, []);

  const toggleAdopt = useCallback((id: string) => {
    setAdopted((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      try {
        window.localStorage.setItem(STORE_KEY, JSON.stringify([...next]));
      } catch {
        // Fine. Nothing on this page depends on it having worked.
      }
      return next;
    });
    setSelected(id);
  }, []);

  const jumpToLesson = useCallback((id: LessonId) => {
    setOpenLesson(id);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    keeping.current?.scrollIntoView({
      behavior: reduce ? "auto" : "smooth",
      block: "start",
    });
  }, []);

  const current = byId(selected) ?? VARIETIES[0];

  return (
    <div className={s.shell}>
      <div className={s.page}>
        <header className={s.masthead}>
          <span className={s.mastheadName}>Kirkwall Seed Library</span>
          <span className={s.mark}>Orkney &middot; founded 1979</span>
          <span className={`${s.mark} ${s.mastheadRest}`}>
            900 varieties &middot; a members&rsquo; collection
          </span>
        </header>

        <nav className={s.contents} aria-label="Sections">
          <ol>
            {CONTENTS.map((c, i) => (
              <li key={c.id}>
                <a href={`#${c.id}`}>
                  <span className={s.contentsNo}>{i + 1}</span> {c.label}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <div className={s.hero}>
          <h1 className={s.heroLine}>
            A variety only survives while someone is still growing it.
          </h1>
          <div className={s.heroCols}>
            <div className={s.prose}>
              <p className={s.lead}>
                There is no wild population of a garden pea to go back to. A
                vegetable variety is a population that people made, by choosing
                which plants to save seed from, for as long as anybody bothered.
                Stop sowing it for a decade and it is not endangered. It is
                finished, and it cannot be rebuilt, because the thing that was
                lost was the seed and the thing the seed carried.
              </p>
              <p>
                This has already happened, on a scale that is hard to take in and
                that almost nobody was told about. It happened without a villain:
                growers grew what sold, firms listed what shifted, the state
                wrote rules to stop buyers being sold mislabelled seed, and
                between them they were the ordinary weather in which nine
                varieties out of ten quietly stopped existing.
              </p>
            </div>
            <aside className={s.heroAside}>
              <span className={s.figureBig}>
                {CATALOGUE_TOTALS.listed1903.toLocaleString("en-GB")} &rarr;{" "}
                {CATALOGUE_TOTALS.held1983}
              </span>
              <p className={s.mark} style={{ marginBottom: "0.6rem" }}>
                Ten vegetables
              </p>
              <p style={{ fontSize: "0.94em" }}>
                Varieties listed by the American seed trade in 1903, and the
                number of those still held in the national seed store eighty
                years later: {KEPT_PERCENT} per cent of them.
                <Ref n={1} /> Read §1 before quoting it; the figure is real and
                it is narrower than it looks.
              </p>
            </aside>
          </div>
        </div>

        {/* ------------------------------------------------------------ §1 */}
        <section className={s.section} id="gone">
          <div className={s.sectionHead}>
            <span className={s.sectionNo}>§ 1</span>
            <h2 className={s.sectionTitle}>What is already gone</h2>
            <span className={s.sectionNote}>published figures, with sources</span>
          </div>

          <div className={s.prose}>
            <p>
              In 1903 the United States Department of Agriculture published an
              inventory of what the commercial seed trade was offering. Eighty
              years later the Rural Advancement Foundation International took ten
              of those vegetables and asked, variety by variety, whether it was
              still held in the national seed store. Cary Fowler and Pat Mooney
              published the result in 1990.
              <Ref n={1} />
            </p>
          </div>

          <div className={s.tableWrap}>
            <table className={s.counts}>
              <caption>
                Listed in 1903 &middot; held in the US National Seed Storage
                Laboratory in 1983
              </caption>
              <thead>
                <tr>
                  <th scope="col">Vegetable</th>
                  <th scope="col" className={s.num}>
                    1903
                  </th>
                  <th scope="col" className={s.num}>
                    1983
                  </th>
                  <th scope="col" className={s.barCell}>
                    Proportion still held
                  </th>
                  <th scope="col" className={s.num}>
                    Kept
                  </th>
                </tr>
              </thead>
              <tbody>
                {CATALOGUE_1903.map((row) => {
                  const kept = (row.held1983 / row.listed1903) * 100;
                  return (
                    <tr key={row.crop}>
                      <th scope="row">{row.crop}</th>
                      <td className={s.num}>{row.listed1903}</td>
                      <td className={s.num}>{row.held1983}</td>
                      <td className={s.barCell}>
                        <span className={s.bar}>
                          <span className={s.barGone} />
                          <span
                            className={s.barKept}
                            style={{ width: `${String(Math.max(kept, 0.6))}%` }}
                          />
                        </span>
                      </td>
                      <td className={s.num}>{kept.toFixed(1)}%</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr>
                  <th scope="row">Ten vegetables</th>
                  <td className={s.num}>{CATALOGUE_TOTALS.listed1903}</td>
                  <td className={s.num}>{CATALOGUE_TOTALS.held1983}</td>
                  <td />
                  <td className={s.num}>{KEPT_PERCENT}%</td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div className={s.prose}>
            <h3 className={s.h3}>What that table is, and is not</h3>
            <p>
              It is not a census of what existed in 1983. It compares catalogue{" "}
              <em>listings</em> in 1903 with the <em>holdings of one collection</em>{" "}
              eighty years later. Some of those 1903 names were the same variety
              sold under different names by different firms, and some varieties
              missing from that store survived in gardens, in other countries and
              in other collections. Anyone quoting the numbers as a body count is
              overstating what was measured.
            </p>
            <p>
              What is not in doubt is the direction and the order of magnitude.
              You may also have met the claim that about three quarters of crop
              genetic diversity was lost in the twentieth century, which traces to
              an FAO report of 1996;
              <Ref n={2} /> it is quoted far more often than it is sourced, and
              FAO&rsquo;s own second report is markedly more cautious. And a
              review of the published diversity studies puts the clearest losses
              in the earlier part of the century, when landraces were displaced by
              bred cultivars, and finds no obvious continuing fall in the
              diversity of newly released cultivars.
              <Ref n={3} />
            </p>
            <p>
              We say all of that plainly because you can check it, and because a
              seed library that shades its numbers has nothing left to sell. The
              honest version is still severe: an enormous number of named,
              described, distinct vegetables that existed within living memory do
              not exist now.
            </p>
            <h3 className={s.h3}>Gone in a particular sense</h3>
            <p>
              No species is at stake here. There are plenty of cabbages. What has
              gone is the varieties inside the species — the individual
              populations, each with its own timing, flavour, habit and tolerance,
              each the product of somebody selecting for decades in one place. A
              wild brassica on a sea cliff is not a route back to a cabbage that
              stood an Orkney winter. There is no reservoir, no reintroduction,
              and nothing to breed back from except other surviving varieties.
            </p>
            <p>
              Which is why the next section is not a statistic. Ten vegetables
              reduced to {KEPT_PERCENT} per cent is a fact you can agree with and
              forget. A name, a description and a year it stops is harder.
            </p>
          </div>
        </section>

        {/* ------------------------------------------------------------ §2 */}
        <section className={s.section} id="ledger">
          <div className={s.sectionHead}>
            <span className={s.sectionNo}>§ 2</span>
            <h2 className={s.sectionTitle}>
              {VARIETIES.length} lines of custody
            </h2>
            <span className={s.sectionNote}>select a line</span>
          </div>

          <div className={s.prose}>
            <p>
              Each line below runs from the first year a variety appears in a
              record to the last year it appears in one, and then it stops. What
              lies to the right of the stop is not decline. It is the years the
              variety did not exist. {LOST.length} of these {VARIETIES.length}{" "}
              lines stop; {ADOPTABLE.length} are in the collection and can be
              taken on; one has run without a break since before the ledger
              begins.
            </p>
            <p className={s.dim} style={{ fontSize: "0.95em" }}>
              <span className={s.chip}>illustrative</span> Kirkwall Seed Library
              is a fictional client, and all but one of these varieties were
              written for this piece — invented in the shape of the records that
              really do survive for lost vegetables, which is a catalogue line, a
              show schedule, a note in a letter.
              <Ref n={7} /> Every row says which it is. The exception is bere, the
              six-row barley still grown in Orkney and still milled at Birsay,
              which is real and is here as the control case.
              <Ref n={8} />
            </p>
          </div>

          <Ledger selected={selected} onSelect={setSelected} adopted={adopted} />

          <ul className={s.pressures}>
            <li>
              <span className={s.pressureYear}>1939&ndash;45</span>
              Wartime food production narrowed what was grown to a few dependable
              maincrop sorts, and a variety skipped for six seasons is often a
              variety whose seed no longer germinates.
            </li>
            <li>
              <span className={s.pressureYear}>From 1970</span>
              Seed of a vegetable variety could generally only be marketed if the
              variety was on an official list, and listing costs money. Nothing
              was banned; varieties that sold a few hundred packets a year simply
              stopped being worth registering.
              <Ref n={6} />
            </li>
            <li>
              <span className={s.pressureYear}>Any year at all</span>
              One grower, one shed, one wet winter, one death, one house sale.
              Most of the losses on this ledger are this, and not agriculture.
            </li>
          </ul>

          <Detail
            v={current}
            adopted={adopted.has(current.id)}
            onAdopt={toggleAdopt}
            onLesson={jumpToLesson}
          />
        </section>

        {/* ------------------------------------------------------------ §3 */}
        <section className={s.section} id="rota">
          <div className={s.sectionHead}>
            <span className={s.sectionNo}>§ 3</span>
            <h2 className={s.sectionTitle}>A rota, not a shelf</h2>
            <span className={s.sectionNote}>why growers, not only donors</span>
          </div>

          <div className={s.prose}>
            <p>
              The word &ldquo;bank&rdquo; is the most misleading thing about a
              seed bank. Money in a bank sits still. Seed in a store is dying
              from the day it goes in: slowly if it was dried properly and kept
              cold, quickly if it was not, and at wildly different rates depending
              on the crop. The only way to replace it is to sow it, grow the
              plants and save fresh seed.
            </p>
            <p>
              Formal practice takes this seriously. FAO&rsquo;s genebank standards
              have orthodox seed dried to a low moisture content and held near
              minus eighteen degrees, germination monitored, and the accession
              regrown once viability falls below eighty-five per cent of the
              figure first recorded for it.
              <Ref n={4} /> That buys decades. A library of nine hundred varieties
              run by four people and a network of gardens does not have decades;
              it has the ranges below.
            </p>
          </div>

          <Store adoptedCount={adopted.size} />
        </section>

        {/* ------------------------------------------------------------ §4 */}
        <section className={s.section} id="seed">
          <div className={s.sectionHead}>
            <span className={s.sectionNo}>§ 4</span>
            <h2 className={s.sectionTitle}>Seed you can keep, and seed you cannot</h2>
            <span className={s.sectionNote}>open-pollinated and F1, fairly</span>
          </div>

          <div className={s.prose}>
            <p>
              Everything in this collection is open-pollinated, which means only
              that its seed comes true: sow what you saved and you get the variety
              again. Most of what a garden centre sells is an F1 hybrid, made by
              crossing two inbred parent lines every year. Save seed from an F1
              and you do not get the F1 back, and this is where seed catalogues
              acquire a reputation for conspiracy that they have not earned.
            </p>
            <p>
              An F1 is uniform because every plant in it has the same genotype,
              and it is often more vigorous than either of its parents.
              <Ref n={9} /> If you are a market grower who needs a field to mature
              in the same week, or a gardener who wants three specific disease
              resistances in one plant, that uniformity is worth paying for. F1
              hybrids are not genetically modified, and the reason their seed
              costs more is that somebody has to make the cross again every
              season. The reason their offspring vary is Mendel.
            </p>
          </div>

          <Segregation />

          <div className={s.prose} style={{ marginTop: "1.6rem" }}>
            <p>
              So the honest account has costs on both sides. Open-pollinated seed
              is less uniform, sometimes lower yielding, and often lacks the
              resistances bred into modern hybrids. It is also the only kind you
              can keep, adapt to your own ground, and hand on. Both of those
              sentences are true at once, and a seed library that pretended
              otherwise would be lying to people who garden for a living.
            </p>
            <p>
              And if you like an F1, the segregating generation above is not
              rubbish — it is breeding material. Selecting out of it for six or
              seven generations is how gardeners dehybridise a variety they liked,
              and how a good many open-pollinated varieties began.
            </p>
          </div>
        </section>

        {/* ------------------------------------------------------------ §5 */}
        <section className={s.section} id="keeping" ref={keeping}>
          <div className={s.sectionHead}>
            <span className={s.sectionNo}>§ 5</span>
            <h2 className={s.sectionTitle}>How to keep one</h2>
            <span className={s.sectionNote}>
              seven ways to lose a variety, and the answer to each
            </span>
          </div>

          <div className={s.prose}>
            <p>
              Every line on the ledger stops for one of seven reasons, and all
              seven have an answer that fits in a paragraph and costs nothing but
              attention. This is the part of the page worth keeping: if you take
              nothing else from us, take the four easiest crops in the table
              below and do those.
            </p>
          </div>

          <Practice open={openLesson} onOpen={setOpenLesson} />
        </section>

        {/* ------------------------------------------------------------ §6 */}
        <section className={s.section} id="join">
          <div className={s.sectionHead}>
            <span className={s.sectionNo}>§ 6</span>
            <h2 className={s.sectionTitle}>Become a member</h2>
            <span className={s.sectionNote}>and grow one, and save its seed</span>
          </div>

          <div className={s.prose}>
            <p>
              We are four people, a walled garden on loan, two rented fields and
              about six hundred members. The membership pays for seed cleaning,
              germination testing, postage, the seed list, and the part-time wage
              of the person who keeps the rota. It is not a subscription to a
              cause; it is the running cost of a collection that has to be regrown
              to exist.
            </p>
          </div>

          <Join adopted={adopted} onAdopt={toggleAdopt} />
        </section>

        {/* ---------------------------------------------------------- notes */}
        <section className={s.section} id="notes">
          <div className={s.sectionHead}>
            <span className={s.sectionNo}>Notes</span>
            <h2 className={s.sectionTitle}>Where each figure comes from</h2>
            <span className={s.sectionNote}>and what is invented</span>
          </div>
          <div className={s.prose}>
            <p style={{ fontSize: "0.94em" }}>
              Everything on this page is either a published figure with a source
              below, arithmetic on numbers shown in full, or marked{" "}
              <span className={s.chip}>illustrative</span>. Kirkwall Seed Library
              is fictional: its collection size, prices, staff, member counts and
              all but one of its varieties were written for a brief. The
              agricultural facts are not, and are quoted narrowly on purpose.
            </p>
          </div>
          <ol className={s.notes}>
            {SOURCES.map((src) => (
              <li id={`note-${String(src.n)}`} key={src.n}>
                <span className={s.noteNum}>{src.n}</span>
                {src.cite}
                {src.scope ? (
                  <span className={s.noteScope}>{src.scope}</span>
                ) : null}
              </li>
            ))}
          </ol>
        </section>

        <footer className={s.colophon}>
          <span>Kirkwall Seed Library &middot; a fictional client</span>
          <span>Drawings generated, not photographed</span>
          <Link className={s.backLink} href="/tasks/client-brand-brand-storytelling" prefetch={false}>
            the brief this was built from &rarr;
          </Link>
        </footer>
      </div>
    </div>
  );
}

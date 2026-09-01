"use client";

/**
 * The document. One lot is selected at a time and the whole page is that lot's
 * record: its route, its cloth, its cost sheet, its place in the queue. Choosing
 * a flock is not configuring a product — it is deciding which record you are
 * reading, which is why it looks like a switch on a filing cabinet and not like
 * a colourway picker.
 */
import Link from "next/link";
import { useState } from "react";

import CoatLookup from "./CoatLookup";
import FitTool from "./FitTool";
import ListForm from "./ListForm";
import WeaveFigure from "./WeaveFigure";
import { CoatFlat, MicronChart, ShadeStrip } from "./figures";
import { FAULTS } from "./data/coats";
import {
  CLOTH_GSM,
  CLOTH_WIDTH_M,
  COAT_CLOTH_M,
  LOTS,
  PRICE,
  REPAIR_RESERVE,
  ROUTE,
  TOTAL_COATS,
  TOTAL_EWES,
  reconcile,
  type Lot,
} from "./data/lots";
import {
  AUCTION_PRICE_PER_KG,
  LIST_TOTAL,
  WAITING_LIST,
  WOOL_PRICE_PER_KG,
  costSheet,
  listFor,
} from "./data/money";
import s from "./mill.module.css";

const CONTENTS: [string, string][] = [
  ["#coat", "The coat"],
  ["#flocks", "The four flocks"],
  ["#route", "From clip to coat"],
  ["#cloth", "The cloth, and the catch"],
  ["#fit", "Sizing and fit"],
  ["#repair", "Repair for life"],
  ["#price", "What £1,100 is"],
  ["#list", "The waiting list"],
  ["#care", "Care"],
];

/** A twill runs on the diagonal, so the cloth swatches do too. */
function clothStyle(lot: Lot): React.CSSProperties {
  return {
    background: `repeating-linear-gradient(45deg, ${lot.hex} 0 3px, ${lot.hexAlt} 3px 6px)`,
  };
}

function LotSwitcher({
  current,
  onPick,
}: {
  current: Lot;
  onPick: (lot: Lot) => void;
}) {
  return (
    <div className={s.switcher} role="group" aria-label="Which lot you are reading">
      {LOTS.map((lot) => (
        <button
          key={lot.code}
          type="button"
          className={s.lotButton}
          aria-pressed={lot.code === current.code}
          onClick={() => {
            onPick(lot);
          }}
        >
          <span className={s.lotSwatch} style={clothStyle(lot)} aria-hidden="true" />
          <span>
            <span className={s.lotName}>{lot.farm}</span>
            <span className={s.lotMeta}>
              {lot.short} · {lot.micron.toFixed(1)} µm
              <br />
              {reconcile(lot).coats} coats
            </span>
          </span>
        </button>
      ))}
    </div>
  );
}

function Figure({ value, label }: { value: string; label: string }) {
  return (
    <div className={s.figure}>
      <span className={s.figureValue}>{value}</span>
      <span className={s.figureLabel}>{label}</span>
    </div>
  );
}

function Spec({ items }: { items: [string, string][] }) {
  return (
    <div className={s.spec}>
      {items.map(([label, value]) => (
        <div className={s.specItem} key={label}>
          <span className={s.specValue}>{value}</span>
          <span className={s.specLabel}>{label}</span>
        </div>
      ))}
    </div>
  );
}

function Kicker({ children }: { children: React.ReactNode }) {
  return <p className={s.kicker}>{children}</p>;
}

export default function Mill() {
  const [lot, setLot] = useState<Lot>(LOTS[2]);
  const sums = reconcile(lot);
  const costs = costSheet(lot);
  const queue = listFor(lot.code);

  return (
    <div className={s.root}>
      <a className={s.skip} href="#main">
        Skip to the record
      </a>

      <header className={s.masthead}>
        <div className={s.mastheadInner}>
          <p className={s.wordmark}>
            <b>Ardnamurchan Woollens</b>
            <span>Spinning at Kilchoan since 1834</span>
            <span>The Single Flock Coat · £{PRICE.toLocaleString("en-GB")}</span>
          </p>

          <h1 className={s.headline}>You can know where it came from.</h1>

          <p className={`${s.lede} ${s.standout}`}>
            Every coat we make is cut from the wool of one flock, on one farm, in
            one season. Not a region, not a breed, not a story about wool: a named
            flock of sheep, shorn in a particular week of June, sorted and spun in
            this building, woven on two looms, and traceable back to the field it
            grazed. There are four flocks. Between them they will make{" "}
            <strong>{TOTAL_COATS} coats</strong> from the 2026 clip.
          </p>
          <p className={s.lede}>
            Every mill of our age claims craft, and none of the claims can be
            checked, which is why they are worth nothing. So this page is not an
            argument, it is a record: the farms and who keeps them, the dates each
            stage happened, the weights at every step, what the cloth costs us and
            what we keep, the faults we have caused and what we did about them, and
            the number sewn inside every coat we have made since 2010. Where the
            single-flock way of working is worse — and it is, in one specific and
            important respect — that is on the page too.
          </p>

          <div className={s.figures}>
            <Figure value={String(TOTAL_COATS)} label="Coats, 2026 clip" />
            <Figure value="4" label="Flocks, four farms" />
            <Figure value={String(TOTAL_EWES)} label="Ewes behind them" />
            <Figure value={`£${PRICE.toLocaleString("en-GB")}`} label="Including VAT" />
            <Figure value={String(LIST_TOTAL)} label="On the waiting list" />
          </div>
        </div>
      </header>

      <div className={s.shell}>
        <aside className={s.rail}>
          <p className={s.railLabel}>Reading the record for</p>
          <LotSwitcher current={lot} onPick={setLot} />
          <nav className={s.contents} aria-label="Sections">
            <ol>
              {CONTENTS.map(([href, label]) => (
                <li key={href}>
                  <a href={href}>{label}</a>
                </li>
              ))}
            </ol>
          </nav>
        </aside>

        <main className={s.main} id="main">
          <div className={s.railMobile}>
            <p className={s.railLabel}>Reading the record for</p>
            <LotSwitcher current={lot} onPick={setLot} />
          </div>

          {/* ------------------------------------------------------- the coat */}
          <section className={s.section} id="coat">
            <Kicker>
              <span>The coat</span>
              <em>{lot.code}</em>
            </Kicker>
            <h2 className={s.h2}>
              One pattern, seven sizes, four cloths, and nothing else.
            </h2>

            <div className={s.twoUp}>
              <div>
                <CoatFlat mode="spec" colour={lot.hex} />
              </div>
              <div className={s.prose}>
                <p>
                  A single-breasted coat that finishes just below the knee, cut
                  with room for a jacket underneath. Six horn buttons and a spare
                  sewn inside the hem. Canvas through the chest, a felled cotton
                  lining, bound edges, patch pockets deep enough for a pair of
                  gloves and a phone. It weighs a little over two kilos, which is
                  what a wool coat that keeps weather out weighs.
                </p>
                <p>
                  We have made this one coat since 2009 and changed the pattern
                  twice: the sleeve head in 2014 and the pocket position in 2019.
                  There is no second style, no shorter version and no jacket. Four
                  hundred coats a year is what four flocks and eleven people can
                  do properly.
                </p>
                <Spec
                  items={[
                    ["Cloth", `${String(CLOTH_GSM)} g/m²`],
                    ["Weave", "2/2 twill"],
                    ["Width", `${String(CLOTH_WIDTH_M * 100)} cm`],
                    ["Cloth per coat", `${COAT_CLOTH_M.toFixed(1)} m`],
                    ["Weight, size 42", "2.05 kg"],
                    ["Thickness", "2.1 mm"],
                    ["Made at", "Hawick"],
                    ["Hours to make", "≈ 9"],
                  ]}
                />
                <p className={s.small}>
                  There are no photographs on this site. The cloth changes every
                  year, and a photograph of last year&rsquo;s piece is a promise we
                  would then have to keep. The drawing above is the grader&rsquo;s
                  flat, tinted to this lot&rsquo;s colour; the cloth itself is
                  modelled from its own figures further down.
                </p>
              </div>
            </div>
          </section>

          {/* ----------------------------------------------------- the flocks */}
          <section className={s.section} id="flocks">
            <Kicker>
              <span>The farms and the flocks</span>
              <em>2026 clip</em>
            </Kicker>
            <h2 className={s.h2}>Four farms, all of them within an hour of the mill.</h2>
            <div className={s.prose}>
              <p>
                We buy from four flocks and no others. We pay £
                {WOOL_PRICE_PER_KG.toFixed(2)} a kilo for the sorted greasy
                weight, against about £{AUCTION_PRICE_PER_KG.toFixed(2)} at
                auction, and we pay it whether the scouring yield turns out well
                or badly, because the farm cannot control how much sand is in a
                fleece and we can choose not to buy. Every one of these farms will
                take a phone call about this.
              </p>
            </div>

            <div className={s.records}>
              {LOTS.map((entry) => {
                const entrySums = reconcile(entry);
                const here = entry.code === lot.code;
                return (
                  <article
                    key={entry.code}
                    className={`${s.record} ${here ? s.recordCurrent : ""}`}
                  >
                    <div>
                      <div className={s.cloth} style={clothStyle(entry)} aria-hidden="true" />
                      <button
                        type="button"
                        className={s.pick}
                        disabled={here}
                        onClick={() => {
                          setLot(entry);
                        }}
                      >
                        {here ? "Reading this lot" : "Read this lot"}
                      </button>
                    </div>
                    <div>
                      <div className={s.recordHead}>
                        <h3 className={s.recordName}>{entry.farm}</h3>
                        <span className={s.recordCode}>{entry.code}</span>
                      </div>
                      <p className={s.recordSub}>
                        {entry.township} · {entry.grid} · {entry.altitude}
                        <br />
                        {entry.ewes} {entry.breed} ewes · {entry.farmer}
                      </p>
                      <p className={s.recordNote}>{entry.note}</p>
                      <Spec
                        items={[
                          ["Micron", `${entry.micron.toFixed(1)} µm`],
                          ["Variation", `${entry.cv.toFixed(1)}% CV`],
                          ["Staple", `${String(entry.staple)} mm`],
                          ["Fleece, mean", `${entry.fleeceKg.toFixed(1)} kg`],
                          ["Scour yield", `${String(Math.round(entry.scourYield * 100))}%`],
                          ["Coats", String(entrySums.coats)],
                        ]}
                      />
                      <p className={s.small}>
                        <strong>Colour.</strong> {entry.colour}
                        {entry.dye ? ` · ${entry.dye}` : ""}
                      </p>
                      <div className={s.warning}>
                        <span className={s.warningLabel}>
                          What you should know before buying this one
                        </span>
                        <p>{entry.warning}</p>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>

          {/* ------------------------------------------------------ the route */}
          <section className={s.section} id="route">
            <Kicker>
              <span>From clip to coat</span>
              <em>{lot.code}</em>
            </Kicker>
            <h2 className={s.h2}>
              Eleven stages, four of them in this building, two of them not in
              Scotland.
            </h2>
            <div className={s.prose}>
              <p>
                These are the dates for {lot.farm}&rsquo;s 2026 wool. The stages
                are the same for all four lots; the dates and the tonnages are not,
                because a lot goes through in one piece and a small lot goes
                through quickly.
              </p>
            </div>

            <div className={s.tableWrap}>
              <table className={s.table}>
                <caption>{lot.code} — dated stages</caption>
                <thead>
                  <tr>
                    <th scope="col">Stage</th>
                    <th scope="col">When</th>
                    <th scope="col">Where</th>
                  </tr>
                </thead>
                <tbody>
                  {ROUTE.map((stage) => (
                    <tr key={stage.key}>
                      <th scope="row">{stage.stage}</th>
                      <td className={s.num} style={{ fontSize: "0.78rem" }}>
                        {lot.dates[stage.key]}
                      </td>
                      <td>{stage.place}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className={s.scrollNote}>Table scrolls sideways.</p>

            <p className={s.h4}>What happens at each of them</p>
            <div className={s.dl}>
              {ROUTE.map((stage) => (
                <div className={s.dlRow} key={stage.key}>
                  <dt>{stage.stage}</dt>
                  <dd>
                    {stage.what}
                    <span className={s.ledgerBasis}>
                      {stage.place} · {stage.who}
                    </span>
                  </dd>
                </div>
              ))}
            </div>

            <p className={s.h4}>Where the weight goes</p>
            <div className={s.prose}>
              <p className={s.small}>
                A coat is mostly the wool that did not make it. This is{" "}
                {lot.farm}&rsquo;s clip, from the shed floor to a number of coats,
                with nothing left out. Every figure is worked forward from the one
                above it.
              </p>
            </div>
            <div className={s.tableWrap}>
              <table className={s.table}>
                <caption>{lot.code} — reconciliation</caption>
                <thead>
                  <tr>
                    <th scope="col">Step</th>
                    <th scope="col" className={s.n}>
                      Lost
                    </th>
                    <th scope="col" className={s.n}>
                      Left
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <th scope="row">
                      {lot.ewes} fleeces off the sheep, mean{" "}
                      {lot.fleeceKg.toFixed(1)} kg
                    </th>
                    <td className={s.n}>—</td>
                    <td className={s.n}>{sums.greasy.toFixed(0)} kg</td>
                  </tr>
                  <tr>
                    <th scope="row">Sorted: belly, britch and dags out</th>
                    <td className={s.n}>−{(sums.greasy - sums.sorted).toFixed(0)} kg</td>
                    <td className={s.n}>{sums.sorted.toFixed(0)} kg</td>
                  </tr>
                  <tr>
                    <th scope="row">
                      Scoured at {String(Math.round(lot.scourYield * 100))}% yield —
                      grease, suint and peat
                    </th>
                    <td className={s.n}>−{(sums.sorted - sums.scoured).toFixed(0)} kg</td>
                    <td className={s.n}>{sums.scoured.toFixed(0)} kg</td>
                  </tr>
                  <tr>
                    <th scope="row">Carded and spun — noil and short fibre out</th>
                    <td className={s.n}>−{(sums.scoured - sums.yarn).toFixed(0)} kg</td>
                    <td className={s.n}>{sums.yarn.toFixed(0)} kg</td>
                  </tr>
                  <tr>
                    <th scope="row">Woven, milled and finished — loom waste and shrinkage</th>
                    <td className={s.n}>−{(sums.yarn - sums.cloth).toFixed(0)} kg</td>
                    <td className={s.n}>{sums.cloth.toFixed(0)} kg</td>
                  </tr>
                  <tr>
                    <th scope="row">
                      Cloth at {String(CLOTH_GSM)} g/m², {String(CLOTH_WIDTH_M * 100)} cm
                      wide
                    </th>
                    <td className={s.n}>—</td>
                    <td className={s.n}>{sums.linearM.toFixed(0)} m</td>
                  </tr>
                  <tr>
                    <th scope="row">
                      Held back for repairs, {String(Math.round(REPAIR_RESERVE * 100))}%,
                      never sold
                    </th>
                    <td className={s.n}>−{sums.reserveM.toFixed(0)} m</td>
                    <td className={s.n}>{sums.saleM.toFixed(0)} m</td>
                  </tr>
                  <tr className={s.sum}>
                    <th scope="row">
                      At {COAT_CLOTH_M.toFixed(1)} m a coat, matched across the seams
                    </th>
                    <td className={s.n}>—</td>
                    <td className={s.n}>{sums.coats} coats</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className={s.stampBlock}>
              <b>Which comes to</b>
              {sums.greasyPerCoat.toFixed(2)} kg of greasy fleece behind one{" "}
              {lot.farm} coat — about{" "}
              {Math.round(sums.greasyPerCoat / lot.fleeceKg)} whole fleeces.
            </div>
          </section>

          {/* ------------------------------------------------------ the cloth */}
          <section className={s.section} id="cloth">
            <Kicker>
              <span>The cloth, and the catch</span>
              <em>{lot.code}</em>
            </Kicker>
            <h2 className={s.h2}>
              Single-flock cloth is less consistent than blended cloth. That is
              not a quirk, it is the trade-off.
            </h2>
            <div className={s.prose}>
              <p>
                A large mill buys wool from hundreds of farms and blends it to a
                specification, so that this year&rsquo;s cloth matches last
                year&rsquo;s within about half a micron. That is a real
                achievement and it is what blending is for. We cannot do it and we
                do not try, because the moment you blend two flocks you can no
                longer say where anything came from, and saying where it came from
                is the whole of what we sell.
              </p>
              <p>
                So: our cloth wanders. Fibre diameter moves with the weather, the
                grazing and the age of the ewes. An undyed fleece changes colour
                from year to year and a dyed piece takes the dye slightly
                differently when the wool underneath it has changed. Here are
                eight years of {lot.farm} against the tolerance a blend would hold.
              </p>
            </div>

            <div className={s.figureBlock}>
              <MicronChart lot={lot} />
              <p className={s.caption}>
                {lot.farm}, eight clips. Mean fibre diameter ranges over{" "}
                {(
                  Math.max(...lot.history.map((entry) => entry.micron)) -
                  Math.min(...lot.history.map((entry) => entry.micron))
                ).toFixed(1)}{" "}
                µm — several times what a blended cloth is held to. Within any one
                clip the fibres themselves vary by {lot.cv.toFixed(1)}% either
                side of that mean, which is what makes the yarn uneven.
              </p>
            </div>

            <div className={s.figureBlock}>
              <ShadeStrip lot={lot} />
              <p className={s.caption}>
                The same cloth&rsquo;s colour, eight years running. These are
                measured against the finished piece and they are all called by the
                same name.
              </p>
            </div>

            <div className={s.warning}>
              <span className={s.warningLabel}>{lot.farm} — the honest warning</span>
              <p>{lot.warning}</p>
            </div>

            <p className={s.h4}>What varies, and what does not</p>
            <div className={s.tableWrap}>
              <table className={s.table}>
                <thead>
                  <tr>
                    <th scope="col">Varies between clips</th>
                    <th scope="col">Does not vary</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Shade of the finished cloth, visibly</td>
                    <td>The pattern, and every construction detail</td>
                  </tr>
                  <tr>
                    <td>Handle for the first month of wear</td>
                    <td>Sizing and the graded measurements</td>
                  </tr>
                  <tr>
                    <td>Cloth weight, by up to 25 g/m²</td>
                    <td>Sett: 12 ends and 12 picks to the centimetre</td>
                  </tr>
                  <tr>
                    <td>How long the cuffs take to go shiny</td>
                    <td>Fulling: fifty-five minutes, since 2022</td>
                  </tr>
                  <tr>
                    <td>Fleck and kemp in the piece</td>
                    <td>The price, and the repair terms</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p className={s.h4}>The cloth itself</p>
            <div className={s.prose}>
              <p className={s.small}>
                Below is the cloth as a model rather than a photograph, because the
                thing worth seeing is not the surface. Turn it edge on and you can
                see the crimp that makes it thick; trace one end and you can follow
                a single yarn from {lot.farm} through the whole thickness of the
                cloth; put it against a blend and you can see, rather than be told,
                what evenness looks like.
              </p>
            </div>
            <WeaveFigure lot={lot} />
          </section>

          {/* -------------------------------------------------------- sizing */}
          <section className={s.section} id="fit">
            <Kicker>
              <span>Sizing and fit</span>
              <em>the hard part</em>
            </Kicker>
            <h2 className={s.h2}>
              You are being asked to buy a coat you cannot try on. Here is how we
              deal with that.
            </h2>
            <div className={s.prose}>
              <p>
                This is the part that goes wrong, and it goes wrong more often than
                anything to do with the cloth. Of the {TOTAL_COATS} coats in a
                normal year, between fourteen and twenty come back for a size
                reason. So there are four things we do about it, in the order they
                are worth doing.
              </p>
            </div>

            <div className={s.dl}>
              <div className={s.dlRow}>
                <dt>1 — Measure a coat you own</dt>
                <dd>
                  The tool below compares a coat that already fits you against the
                  seven sizes and shows you the difference in centimetres for each
                  measurement, including where our nearest size is wrong. Four
                  measurements takes about three minutes with the coat flat on a
                  bed.
                </dd>
              </div>
              <div className={s.dlRow}>
                <dt>2 — The paper pattern, free</dt>
                <dd>
                  Ask and we post you the coat in kraft paper, cut to the size you
                  are considering, in a tube. Tack the shoulders and side seams
                  with the tape provided, put it on over what you would actually
                  wear, and you will know inside ten minutes. About a third of
                  people who ask for one change size afterwards. It costs us £14
                  and saves us far more than that.
                </dd>
              </div>
              <div className={s.dlRow}>
                <dt>3 — Alterations before it leaves</dt>
                <dd>
                  Sleeve length is free, up to 3 cm down and any amount up. Hem
                  length is free. Taking the waist in is £45. The shoulder cannot be
                  altered on a made coat, which is why the tool weights it heaviest
                  and why we ask twice about it.
                </dd>
              </div>
              <div className={s.dlRow}>
                <dt>4 — Made to measure, £180 on top</dt>
                <dd>
                  If you are outside the seven sizes, or one of those people whom
                  ready-made never fits, the cutter at Hawick will work to your
                  measurements. It takes no longer than a graded coat and it is the
                  right answer more often than we used to admit.
                </dd>
              </div>
              <div className={s.dlRow}>
                <dt>And if it is still wrong</dt>
                <dd>
                  Thirty days from the day it arrives, worn or not, and we pay the
                  carriage back. We would rather have the coat than your money: it
                  goes to the next person on the list within a fortnight, so a
                  return costs us almost nothing and an unhappy owner costs us a
                  great deal.
                </dd>
              </div>
              <div className={s.dlRow}>
                <dt>Or come to Kilchoan</dt>
                <dd>
                  There are coats in every size on a rail in the office and you are
                  welcome to try them on. It is a long way — three hours from Fort
                  William and the last stretch is single track — and about forty
                  people a year do it.
                </dd>
              </div>
            </div>

            <p className={s.h4}>Work out your size</p>
            <FitTool />
          </section>

          {/* -------------------------------------------------------- repair */}
          <section className={s.section} id="repair">
            <Kicker>
              <span>Repair and re-proofing</span>
              <em>for as long as the coat exists</em>
            </Kicker>
            <h2 className={s.h2}>
              Repair for life is not the same as free for life, so here is exactly
              which is which.
            </h2>
            <div className={s.prose}>
              <p>
                Repair is not an aftercare policy bolted onto the end of this. It is
                the same argument as the rest of the page: eight per cent of every
                lot&rsquo;s cloth is never sold, it is folded and labelled with the
                lot code and kept upstairs, so that in 2041 we can still darn a
                2026 coat in 2026 cloth. That reserve is the reason a repair
                promise from a mill of this size means anything at all.
              </p>
              <p>
                We will repair any coat we have made, whoever owns it now, for as
                long as the mill exists. What we charge depends on whose fault it
                was, and we say which we think it is before we start.
              </p>
            </div>

            <div className={s.tableWrap}>
              <table className={s.table}>
                <caption>What is free and what is not</caption>
                <thead>
                  <tr>
                    <th scope="col">Work</th>
                    <th scope="col">Who pays</th>
                    <th scope="col" className={s.n}>
                      Cost
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <th scope="row">Re-proofing, every three or four years</th>
                    <td>Us, forever. You pay carriage one way.</td>
                    <td className={s.n}>£0</td>
                  </tr>
                  <tr>
                    <th scope="row">Seam failure, anywhere</th>
                    <td>Us. Our stitching.</td>
                    <td className={s.n}>£0</td>
                  </tr>
                  <tr>
                    <th scope="row">Buttons, any number, any time</th>
                    <td>Us.</td>
                    <td className={s.n}>£0</td>
                  </tr>
                  <tr>
                    <th scope="row">Pocket bags</th>
                    <td>Us. They fail at the bar tack, which is ours.</td>
                    <td className={s.n}>£0</td>
                  </tr>
                  <tr>
                    <th scope="row">First alteration, whenever you ask</th>
                    <td>Us.</td>
                    <td className={s.n}>£0</td>
                  </tr>
                  <tr>
                    <th scope="row">Lining renewed — a wearing part</th>
                    <td>You, at our cost of cloth and labour.</td>
                    <td className={s.n}>£86–96</td>
                  </tr>
                  <tr>
                    <th scope="row">Cuffs rebound, at six to eight years</th>
                    <td>You. Ordinary wear, not a fault.</td>
                    <td className={s.n}>£64</td>
                  </tr>
                  <tr>
                    <th scope="row">Tears, burns, barbed wire</th>
                    <td>You, at cost, quoted first.</td>
                    <td className={s.n}>£60–160</td>
                  </tr>
                  <tr>
                    <th scope="row">Moth</th>
                    <td>You. Quoted first, and we will say if we think it is not worth it.</td>
                    <td className={s.n}>£90–220</td>
                  </tr>
                  <tr>
                    <th scope="row">Anything we got wrong</th>
                    <td>Us, including carriage both ways, on our initiative.</td>
                    <td className={s.n}>£0</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className={s.scrollNote}>Table scrolls sideways.</p>

            <p className={s.h4}>Look up a coat</p>
            <div className={s.prose}>
              <p className={s.small}>
                Every coat made since 2010 has a number on a woven label inside the
                left front. Type it in and you get the flock, the piece and metre
                it was cut from, who wove it, and every repair with its date and
                what it cost. If you do not own one yet, open any of the examples.
              </p>
            </div>
            <CoatLookup />

            <p className={s.h4}>Faults we have caused, and what we did</p>
            <div className={s.prose}>
              <p className={s.small}>
                Published because a mill with no recorded faults is a mill that
                does not inspect, and because this is the one part of a
                traceability claim that a competitor cannot imitate by writing
                better sentences. Five entries in seventeen years of making this
                coat.
              </p>
            </div>
            {FAULTS.map((fault) => (
              <article className={s.fault} key={`${String(fault.clip)}-${fault.lot}`}>
                <div className={s.faultHead}>
                  <span className={s.faultYear}>
                    {fault.clip} · {fault.lot}
                  </span>
                  <h3 className={s.faultTitle}>{fault.headline}</h3>
                </div>
                <p>{fault.detail}</p>
                <p className={s.faultOutcome}>{fault.outcome}</p>
              </article>
            ))}
          </section>

          {/* --------------------------------------------------------- price */}
          <section className={s.section} id="price">
            <Kicker>
              <span>Price</span>
              <em>{lot.code}</em>
            </Kicker>
            <h2 className={s.h2}>
              What eleven hundred pounds is, line by line.
            </h2>
            <div className={s.prose}>
              <p>
                The objection to a £1,100 coat is rarely the money. It is the
                suspicion that the number was chosen rather than arrived at. So
                here is the whole of it for a {lot.farm} coat, including the part
                we keep.
              </p>
              <p>
                The line that surprises people is the first one. The wool in your
                coat cost us £{costs.wool.toFixed(2)}. We pay nearly seven times
                the auction price for it and it is still less than the buttons and
                the box. Anyone telling you an expensive wool coat is expensive
                because of the wool is not telling you the truth: it is expensive
                because of the hours, and the hours are the last two lines but one.
              </p>
            </div>

            <div className={s.tableWrap}>
              <table className={s.table}>
                <caption>{lot.code} — one coat, ex-VAT</caption>
                <thead>
                  <tr>
                    <th scope="col">Line</th>
                    <th scope="col" className={s.n}>
                      £
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {costs.lines.map((line) => (
                    <tr key={line.label}>
                      <th scope="row">
                        {line.label}
                        {line.note ? (
                          <span className={s.ledgerBasis}>{line.note}</span>
                        ) : null}
                      </th>
                      <td className={s.n}>{line.amount.toFixed(2)}</td>
                    </tr>
                  ))}
                  <tr className={s.sum}>
                    <th scope="row">Before VAT</th>
                    <td className={s.n}>{costs.net.toFixed(2)}</td>
                  </tr>
                  <tr>
                    <th scope="row">VAT at 20%</th>
                    <td className={s.n}>{costs.vat.toFixed(2)}</td>
                  </tr>
                  <tr className={s.sum}>
                    <th scope="row">Price on the label</th>
                    <td className={s.n}>{costs.total.toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p className={s.small}>
              The wool line and the balance move by a pound or two between the four
              lots, because a fleece with more sand in it yields less scoured wool
              per coat. Everything else is the same figure whichever flock you
              choose. Payment is £150 when your cloth is cut and £950 when the coat
              is finished; we take nothing to join the list.
            </p>
          </section>

          {/* ---------------------------------------------------- the list */}
          <section className={s.section} id="list">
            <Kicker>
              <span>The waiting list</span>
              <em>as at 1 September 2026</em>
            </Kicker>
            <h2 className={s.h2}>
              Join the list for the coming clip.
            </h2>
            <div className={s.prose}>
              <p>
                {LIST_TOTAL} people are waiting and there are {TOTAL_COATS} coats in
                this clip, so for three of the four flocks the honest answer is a
                year or more. The list is in the order people joined it. There is no
                way to move up it, nothing to be gained by knowing us, and we do not
                keep coats back for anyone.
              </p>
            </div>

            <div className={s.tableWrap}>
              <table className={s.table}>
                <caption>Where each flock stands</caption>
                <thead>
                  <tr>
                    <th scope="col">Flock</th>
                    <th scope="col" className={s.n}>
                      Coats
                    </th>
                    <th scope="col" className={s.n}>
                      Waiting
                    </th>
                    <th scope="col">Served from</th>
                  </tr>
                </thead>
                <tbody>
                  {WAITING_LIST.map((entry) => {
                    const entryLot = LOTS.find((l) => l.code === entry.lotCode);
                    if (!entryLot) return null;
                    return (
                      <tr
                        key={entry.lotCode}
                        className={entry.lotCode === lot.code ? s.here : undefined}
                      >
                        <th scope="row">{entryLot.farm}</th>
                        <td className={s.n}>{reconcile(entryLot).coats}</td>
                        <td className={s.n}>{entry.waiting}</td>
                        <td>
                          {entry.servedFrom}
                          <span className={s.ledgerBasis}>{entry.comment}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p className={s.scrollNote}>Table scrolls sideways.</p>

            <div className={s.stampBlock}>
              <b>{lot.farm}, today</b>
              {queue.waiting} waiting · joining now is served from {queue.servedFrom}{" "}
              · leaving Hawick {queue.dispatch}
            </div>

            <ListForm lot={lot} />
          </section>

          {/* ---------------------------------------------------------- care */}
          <section className={s.section} id="care">
            <Kicker>
              <span>Care</span>
              <em>most of it is not doing things</em>
            </Kicker>
            <h2 className={s.h2}>
              A fulled wool coat wants brushing, air and a dark cupboard.
            </h2>
            <div className={s.dl}>
              <div className={s.dlRow}>
                <dt>Wet</dt>
                <dd>
                  Hang it on a wide hanger somewhere cool and let it dry on its own.
                  Not on a radiator, not near a stove, not in an airing cupboard.
                  Heat on wet wool is what turns a coat into a smaller, harder coat.
                </dd>
              </div>
              <div className={s.dlRow}>
                <dt>Dirty</dt>
                <dd>
                  Brush it, in one direction, with a stiff bristle brush, when it is
                  dry. Most marks come out. A sponge with cold water and patience
                  takes the rest. Fulled cloth sheds dirt because the surface is
                  closed; this is what the fifty-five minutes at Selkirk buys.
                </dd>
              </div>
              <div className={s.dlRow}>
                <dt>Dry cleaning</dt>
                <dd>
                  Once every two or three years at the most, and never as a
                  substitute for brushing. Solvent strips the natural grease that
                  is left in the cloth. Send it to us instead and we will clean and
                  re-proof it together.
                </dd>
              </div>
              <div className={s.dlRow}>
                <dt>Re-proofing</dt>
                <dd>
                  Every three or four years, free, forever. There is no coating on
                  this cloth: proofing is a lanolin-based dressing worked in warm,
                  which is what our great-grandparents did and what still works. You
                  will know it is due when rain stops beading and starts soaking.
                </dd>
              </div>
              <div className={s.dlRow}>
                <dt>Moth</dt>
                <dd>
                  The real enemy, and it eats undyed wool by preference. Store it
                  clean — moths go for the sweat, not the wool — in the dark, with
                  air moving, and look at it in July. Cedar and lavender are close
                  to useless. A sealed bag with the coat clean is not.
                </dd>
              </div>
              <div className={s.dlRow}>
                <dt>Ironing</dt>
                <dd>
                  Steam, a damp cloth between, and no weight on the iron. Or send it
                  to us with the re-proofing and the presser at Hawick will do it
                  properly.
                </dd>
              </div>
            </div>
          </section>

          {/* ------------------------------------------------------ colophon */}
          <footer className={s.colophon}>
            <div>
              <h2>The mill</h2>
              <p>
                Ardnamurchan Woollens
                <br />
                Pier Road, Kilchoan
                <br />
                Acharacle PH36 4LH
              </p>
              <p>
                <a href="tel:+441972510118">01972 510 118</a>
                <br />
                <a href="mailto:cloth@ardnamurchanwoollens.example">
                  cloth@ardnamurchanwoollens.example
                </a>
              </p>
            </div>
            <div>
              <h2>Open</h2>
              <p>
                Monday to Thursday, eight until four. The looms are running, so it
                is loud, and the telephone is answered better in the afternoon.
              </p>
              <p>
                Anyone is welcome to walk in and look. There is no visitor centre,
                no shop and nowhere to buy a coffee.
              </p>
            </div>
            <div>
              <h2>Eleven people</h2>
              <p>
                Three spinners, one warper, two weavers, one mender, one sorter,
                two in the office and a manager who does the sorting when there is
                nobody else. Cutting and making are done by fifteen people at a
                workshop in Hawick who are not us.
              </p>
            </div>

            <div className={s.disclosure}>
              <p>
                <strong>What this is.</strong> Ardnamurchan Woollens does not exist.
                This is a reference implementation built to a written brief for a
                catalogue of creative web work, and every farm, farmer, flock,
                date, weight, micron figure, coat number, repair and fault on this
                page was invented for it. The arithmetic is real in the sense that
                it is computed rather than asserted — the tonnages, the coat counts
                and the cost sheet are all worked forward from the flock sizes, so
                they add up — and the process, the yields and the orders of
                magnitude follow how a small British woollen mill actually works.
                None of it is a measurement of anything. Nothing here can be bought
                and no coat can be looked up. Nothing you type is sent anywhere.
              </p>
              <p>
                <Link
                  className={s.backlink}
                  href="/tasks/client-brand-premium-showcase"
                  prefetch={false}
                >
                  <span>·</span> The brief this was built from
                </Link>
              </p>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useRef, useState } from "react";

import styles from "./reversal.module.css";
import Machine from "./machine";
import Predict from "./predict";
import CausalStories from "./causal-stories";
import BerkeleyFigure from "./berkeley-figure";
import {
  ARM_A,
  ARM_B,
  BERKELEY,
  BERKELEY_WIDE,
  KIDNEY_STONES,
  STRATA,
  berkeleyTotals,
} from "./data";
import { frac, overall, pct, pooled, rate, type Setup } from "./model";

function Ref({ n }: { n: number }) {
  return (
    <a className={styles.ref} href={`#note-${n}`} aria-label={`Note ${n}`}>
      {n}
    </a>
  );
}

export default function Explainer() {
  const [setup, setSetup] = useState<Setup>(KIDNEY_STONES);
  const machineRef = useRef<HTMLDivElement>(null);

  const load = (next: Setup) => {
    setSetup(next);
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    machineRef.current?.scrollIntoView({
      behavior: reduce ? "auto" : "smooth",
      block: "start",
    });
  };

  const totals = berkeleyTotals();
  const menRate = totals.men.admitted / totals.men.applied;
  const womenRate = totals.women.admitted / totals.women.applied;

  /* The two halves of the decomposition in § 3, computed from the published
     counts rather than typed in, so the prose cannot drift away from the table
     above it. They sum to overall(a) − overall(b) identically. */
  const pubA = KIDNEY_STONES.a;
  const pubB = KIDNEY_STONES.b;
  const mixA = pubA.small.total / (pubA.small.total + pubA.large.total);
  const mixB = pubB.small.total / (pubB.small.total + pubB.large.total);
  const withinTerm =
    mixA * (rate(pubA.small) - rate(pubB.small)) +
    (1 - mixA) * (rate(pubA.large) - rate(pubB.large));
  const mixTerm = (mixA - mixB) * (rate(pubB.small) - rate(pubB.large));

  return (
    <div className={styles.root}>
      <header className={styles.masthead}>
        <div className={styles.mastheadInner}>
        <p className={styles.eyebrow}>
          <span>Interactive explanation</span>
          <span>Simpson&rsquo;s paradox</span>
          <span>Aggregation and its discontents</span>
        </p>
        <h1 className={styles.title}>Reversal</h1>
        <p className={styles.deck}>
          A comparison can hold in every part of a population and turn around
          when the parts are put together. It is not a trick and it is not rare;
          it is what averages do. Below: a real case, a chart you can break with
          your hands, and the question most explanations leave out — which of the
          two numbers you should act on.
        </p>
        <p className={styles.byline}>
          <span>
            Every count comes from a cited paper unless labelled illustrative
            <Ref n={8} />
          </span>
          <span>Drag, keyboard or slider</span>
        </p>
        </div>
      </header>

      {/* ------------------------------------------------------------ § 1 */}
      <section className={styles.section}>
        <div className={styles.sectionHead}>
          <span className={styles.sectionNum}>§ 1 — One real case</span>
          <h2 className={styles.h2}>
            A treatment that is better twice and worse once
          </h2>
        </div>

        <div className={styles.col}>
          <p className={`${styles.p} ${styles.first}`}>
            In 1986 a team of urologists in London published outcomes for
            patients treated for kidney stones by three different methods.
            <Ref n={1} /> Two of them — open surgery, and percutaneous
            nephrolithotomy, in which the stone is taken out through a narrow
            tract in the back — were later set against each other and split by
            stone size, in a short note on confounding in the{" "}
            <i>British Medical Journal</i>.<Ref n={2} /> Each method had been
            used on 350 patients.
          </p>
        </div>

        <div className={`${styles.tableWrap} ${styles.tableMid}`}>
          <table className={styles.table}>
            <caption>
              <b>Published figures.</b> Successful treatments out of cases
              treated, by stone size. Charig, Webb, Payne and Wickham (1986), as
              tabulated by stone size in Julious and Mullee (1994). Cases are
              divided at a stone diameter of two centimetres.
            </caption>
            <thead>
              <tr>
                <th scope="col">Treatment</th>
                <th scope="col">
                  {STRATA.small.name}
                  <br />
                  <span className={styles.sub}>{STRATA.small.axis}</span>
                </th>
                <th scope="col">
                  {STRATA.large.name}
                  <br />
                  <span className={styles.sub}>{STRATA.large.axis}</span>
                </th>
                <th scope="col">
                  all cases
                  <br />
                  <span className={styles.sub}>pooled</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {[
                { label: ARM_A.name, arm: KIDNEY_STONES.a, cls: styles.armA },
                { label: ARM_B.name, arm: KIDNEY_STONES.b, cls: styles.armB },
              ].map(({ label, arm, cls }) => (
                <tr key={label}>
                  <th scope="row" className={cls}>
                    {label}
                  </th>
                  <td>
                    {pct(rate(arm.small))}{" "}
                    <span className={styles.sub}>{frac(arm.small)}</span>
                  </td>
                  <td>
                    {pct(rate(arm.large))}{" "}
                    <span className={styles.sub}>{frac(arm.large)}</span>
                  </td>
                  <td>
                    {pct(overall(arm))}{" "}
                    <span className={styles.sub}>{frac(pooled(arm))}</span>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <th scope="row">Better treatment</th>
                <td className={styles.armA}>open surgery</td>
                <td className={styles.armA}>open surgery</td>
                <td className={styles.armB}>PCNL</td>
              </tr>
            </tfoot>
          </table>
        </div>

        <div className={styles.col}>
          <p className={styles.p}>
            Read the two stone-size columns and open surgery is the better
            treatment: 93.1 per cent against 86.7 on the small stones, 73.0
            against 68.8 on the large ones. Read the last column and open surgery
            is the worse treatment: 78.0 per cent against 82.6. Both readings are
            correct, and neither is a rounding artefact. 81 + 192 = 273, and 87 +
            263 = 350, and 273 &divide; 350 is exactly 0.78.
          </p>
          <p className={styles.p}>
            The instinct on first meeting a table like this is that one of the
            two comparisons must be wrong. Nothing is wrong. The arithmetic is
            ordinary — dull, even — and it is a habit of reading that has been
            caught out: the habit of treating a rate over a population as a
            property of the thing being rated.
          </p>
          <p className={styles.p}>
            The pattern has a name. It is called Simpson&rsquo;s paradox, after a
            1951 paper on contingency tables,
            <Ref n={4} /> though Yule had described it in 1903 and some writers
            prefer the Yule&ndash;Simpson effect.
            <Ref n={5} /> The name is unhelpful in one respect: there is nothing
            paradoxical about it once you can see where it comes from, and seeing
            that takes a picture rather than a sentence.
          </p>
          <div className={styles.aside}>
            <p>
              Two things about this table before it is put to work. The
              coincidence that both treatments were used on exactly 350 patients
              is a property of the data, not a device; the effect does not need
              it. And these were not randomised trials — which patients received
              which treatment was a clinical decision, and a systematic one. That
              second fact is the whole of &sect;&thinsp;6.
            </p>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------ § 2 */}
      <section className={styles.section}>
        <div className={styles.sectionHead}>
          <span className={styles.sectionNum}>§ 2 — Where it comes from</span>
          <h2 className={styles.h2}>A treatment is a line, not a point</h2>
        </div>

        <div className={styles.col}>
          <p className={styles.p}>
            An overall success rate is not a measurement of a treatment. It is an
            average of the treatment&rsquo;s success rate in each kind of case,
            weighted by how many cases of each kind it was given. For open
            surgery, in full:
          </p>
          <div className={styles.algebra}>
            <span>
              (87/350) &times; (81/87) + (263/350) &times; (192/263) = 273/350
            </span>
            <span className={styles.algebraNote}>
              The two weights, 87/350 and 263/350, say nothing at all about how
              good the treatment is. They are a record of which patients were
              sent to it.
            </span>
          </div>
          <p className={styles.p}>
            So put the weights on the page. Success rate runs up the chart.
            Across it runs the fraction of a treatment&rsquo;s cases that were
            small stones — its <i>case mix</i>. At the far left a treatment would
            have been given nothing but large stones, so its overall rate would
            be exactly its large-stone rate; at the far right, nothing but small
            ones. In between it moves in a straight line, because a weighted
            average is linear in its weights. A treatment is therefore a line,
            and its actual overall rate is one marker on that line, put there by
            its actual mix.
          </p>
        </div>

        <div ref={machineRef} style={{ scrollMarginTop: "1.5rem" }}>
          <Machine setup={setup} onChange={setSetup} />
        </div>

        <div className={styles.col}>
          <p className={styles.pull}>
            The lines do not cross. The markers do. Nothing about the treatments
            has changed — the patients moved.
          </p>
          <p className={styles.p}>
            That is the whole paradox, and both halves of it are now visible at
            the same time instead of one sentence after another. Open surgery
            sits above the percutaneous technique at every mix, which is what
            &ldquo;better in both kinds of case&rdquo; means. But the two lines
            overlap in height, and the markers are far apart horizontally,
            because open surgery was given the hard cases: 87 of its 350 patients
            had small stones against 270 of the other treatment&rsquo;s 350. Each
            marker is dragged towards the end of its own line where its patients
            actually were.
          </p>
          <p className={styles.p}>Four things worth doing with your hands:</p>
          <ol className={styles.list}>
            <li className={styles.li}>
              Drag open surgery&rsquo;s marker slowly to the right, giving it
              easier cases. Its line stays put: the rate within each kind of
              stone is untouched, and only the proportions are moving. But the
              marker climbs, and at 170 of its 350 cases being small stones the
              two treatments finish exactly level, on 289 successes each. One
              more case and the pooled figure agrees with the parts. (The ends of
              the line do twitch a little at the extremes. A rate has to be a
              whole number of successes over a whole number of cases, and when a
              group is down to a handful of patients one case is worth a point or
              two. Nothing is being smoothed; you are seeing the integers.)
            </li>
            <li className={styles.li}>
              Drag the two markers to the same horizontal position. The reversal
              disappears and cannot be brought back by moving them together.
            </li>
            <li className={styles.li}>
              Drag them apart again. The overall gap widens without a single
              group rate changing.
            </li>
            <li className={styles.li}>
              Now drag the ends of the lines until the two lines no longer
              overlap in height at all. The reversal becomes unreachable at every
              mix.
            </li>
          </ol>
        </div>
      </section>

      {/* ------------------------------------------------------------ § 3 */}
      <section className={styles.section}>
        <div className={styles.sectionHead}>
          <span className={styles.sectionNum}>§ 3 — The rule</span>
          <h2 className={styles.h2}>Exactly when a reversal is possible</h2>
        </div>

        <div className={styles.col}>
          <p className={styles.p}>
            An average always lies between the numbers it averages. That is why
            each marker is trapped on its own line and can never leave it, and
            everything else follows from it. Write <i>x</i> for a
            treatment&rsquo;s case mix; a&#8321; and a&#8322; for treatment
            A&rsquo;s rates on small and on large stones, b&#8321; and b&#8322;
            for treatment B&rsquo;s; and A and B for the two overall rates:
          </p>
          <div className={styles.algebra}>
            <span>A = a&#8322; + x(a&#8321; &minus; a&#8322;)</span>
            <span>
              A &minus; B = (a&#8322; &minus; b&#8322;) + x<sub>A</sub>(a&#8321;
              &minus; a&#8322;)
            </span>
            <span>
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&minus; x<sub>B</sub>(b&#8321;
              &minus; b&#8322;)
            </span>
            <span className={styles.algebraNote}>
              The first line is the chart: a straight line from a&#8322; at
              x&nbsp;=&nbsp;0 to a&#8321; at x&nbsp;=&nbsp;1. The second is the
              gap between the two markers, and it is correct but hard to feel,
              because each treatment&rsquo;s mix is tangled up with its own pair
              of rates.
            </span>
          </div>
          <p className={styles.p}>
            Regroup exactly those terms, though, and the same difference splits
            into two pieces that each mean something:
          </p>
          <div className={styles.algebra}>
            <span>
              A &minus; B = [x<sub>A</sub>(a&#8321; &minus; b&#8321;) + (1
              &minus; x<sub>A</sub>)(a&#8322; &minus; b&#8322;)]
            </span>
            <span>
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;+ (x<sub>A</sub> &minus; x
              <sub>B</sub>)(b&#8321; &minus; b&#8322;)
            </span>
            <span className={styles.algebraNote}>
              The bracket is the comparison you meant to make: the two
              within-group differences, averaged using A&rsquo;s case mix. If A
              wins in both groups it is positive, by construction. The second
              term is everything else, and it is the whole of the trouble — a
              product of how differently the two treatments were loaded and how
              far apart the two groups are.
            </span>
          </div>
          <p className={styles.p}>
            With the published kidney-stone figures the bracket comes to{" "}
            <b>+{(withinTerm * 100).toFixed(2)}</b> points in open
            surgery&rsquo;s favour, and the mix term to{" "}
            <b>&minus;{Math.abs(mixTerm * 100).toFixed(2)}</b>. They sum to{" "}
            <b>&minus;{Math.abs((withinTerm + mixTerm) * 100).toFixed(2)}</b>{" "}
            points, which is exactly {frac(pooled(pubA))} &minus;{" "}
            {frac(pooled(pubB))}, or &minus;16/350: the reversal, to the last
            digit, with its two causes separated and priced. Nothing has been
            rounded into place — and note that the mix term is nearly twice the
            size of the effect it is hiding.
          </p>
          <p className={styles.p}>
            Three consequences fall out of that product, and between them they
            are the entire content of the paradox.
          </p>

          <h3 className={styles.h3}>
            One. The mixes have to differ. Sizes are irrelevant.
          </h3>
          <p className={styles.p}>
            Set the two mixes equal, at <i>x</i>, and the expression above
            collapses:
          </p>
          <div className={styles.algebra}>
            <span>
              A &minus; B = x(a&#8321; &minus; b&#8321;) + (1 &minus; x)(a&#8322;
              &minus; b&#8322;)
            </span>
            <span className={styles.algebraNote}>
              A weighted average of the two within-group differences — positive
              whenever both of them are. Equal mixes, no reversal, however many
              or few patients each treatment saw.
            </span>
          </div>
          <p className={styles.p}>
            This is worth dwelling on, because the intuition most people arrive
            at is the wrong one. A reversal is not caused by one treatment having
            more patients than the other. Exercise&nbsp;2 below has one treatment
            with four times the patients of the other and no reversal at all. What
            matters is the <i>shape</i> of each treatment&rsquo;s caseload, not
            its size.
          </p>

          <h3 className={styles.h3}>
            Two. The groups have to differ in difficulty.
          </h3>
          <p className={styles.p}>
            The mix term is a product, so it also dies if its second factor
            does. Suppose small and large stones were equally hard for the
            percutaneous technique — b&#8321;&nbsp;=&nbsp;b&#8322;. Then that
            treatment&rsquo;s line is horizontal, its overall rate is the same
            whatever caseload it draws, and open surgery, which beats it in both
            groups, must beat it overall from any position on its own line. It
            makes no difference how lopsided the caseloads are. In the chart:
            flatten one line and the reversal is gone, permanently.
          </p>
          <p className={styles.p}>
            Which is worth saying in the other direction, because it is the
            practical version. A variable can only produce a reversal if it is
            related to <i>both</i> the treatment given and the outcome. Stone
            size qualifies: surgeons chose by it, and it changes the odds. That
            double requirement is exactly the definition of a confounder, and it
            is why &sect;&nbsp;6 is not an appendix to this page but the reason
            for it.
          </p>

          <h3 className={styles.h3}>Three. The group rates have to overlap.</h3>
          <p className={styles.p}>
            Open surgery&rsquo;s overall rate is never below its worse group
            rate, and the percutaneous technique&rsquo;s is never above its
            better group rate. So if the first of those exceeds the second — if
            one treatment&rsquo;s bad day beats the other&rsquo;s good day — no
            case mix anywhere can produce a reversal. On the chart this is
            immediate: the two lines occupy disjoint bands of height, and the
            markers can never pass each other.
          </p>
          <p className={styles.p}>
            Between those two limits, whether the aggregate reverses is settled
            entirely by the mixes, and you can now read it off the chart before
            you have finished moving anything. Which is the point at which you
            should be asked to.
          </p>
        </div>
      </section>

      {/* ------------------------------------------------------------ § 4 */}
      <section className={styles.section}>
        <div className={styles.sectionHead}>
          <span className={styles.sectionNum}>§ 4 — Predict it</span>
          <h2 className={styles.h2}>Before you compute</h2>
        </div>
        <div className={styles.col}>
          <p className={styles.p}>
            The test of a picture is whether it makes the next case obvious.
            Three configurations; decide first, then check the arithmetic. The
            counts in these three are invented — stone sizes are borrowed only as
            a familiar frame — and each can be loaded into the chart above.
          </p>
        </div>
        <Predict onLoad={load} />
      </section>

      {/* ------------------------------------------------------------ § 5 */}
      <section className={styles.section}>
        <div className={styles.sectionHead}>
          <span className={styles.sectionNum}>§ 5 — The case that mattered</span>
          <h2 className={styles.h2}>Berkeley, autumn 1973</h2>
        </div>

        <div className={styles.col}>
          <p className={styles.p}>
            Aggregation bias would be a curiosity if it only ever turned up in
            constructed tables. Its reputation rests on a real administrative
            emergency. In the autumn of 1973,{" "}
            {BERKELEY_WIDE.menApplied.toLocaleString("en-US")} men and{" "}
            {BERKELEY_WIDE.womenApplied.toLocaleString("en-US")} women applied to
            graduate programmes at the University of California, Berkeley.{" "}
            {BERKELEY_WIDE.menPercent} per cent of the men were admitted and{" "}
            {BERKELEY_WIDE.womenPercent} per cent of the women.
            <Ref n={3} /> A nine-point gap across twelve thousand people is not
            noise, and it looked exactly like what it appeared to be.
          </p>
          <p className={styles.p}>
            Peter Bickel, Eugene Hammel and William O&rsquo;Connell went into the
            departmental records. Here are the six largest departments, which
            between them account for about a third of all applications. The
            departments are anonymous in the source; the letters are the
            authors&rsquo;.
          </p>
        </div>

        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <caption>
              <b>Published figures.</b> Admissions to the six largest graduate
              departments at Berkeley, autumn 1973. Bickel, Hammel and
              O&rsquo;Connell (1975); the same counts are distributed with R as
              the <span className={styles.mono}>UCBAdmissions</span> dataset.
              Departments are ordered as in the source.
            </caption>
            <thead>
              <tr>
                <th scope="col">Dept</th>
                <th scope="col">Men applied</th>
                <th scope="col">Men admitted</th>
                <th scope="col">Men %</th>
                <th scope="col">Women applied</th>
                <th scope="col">Women admitted</th>
                <th scope="col">Women %</th>
                <th scope="col">
                  Higher rate
                  <br />
                  <span className={styles.sub}>points</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {BERKELEY.map((d) => {
                const m = d.men.admitted / d.men.applied;
                const w = d.women.admitted / d.women.applied;
                return (
                  <tr key={d.code}>
                    <th scope="row">{d.code}</th>
                    <td>{d.men.applied.toLocaleString("en-US")}</td>
                    <td>{d.men.admitted.toLocaleString("en-US")}</td>
                    <td>{pct(m)}</td>
                    <td>{d.women.applied.toLocaleString("en-US")}</td>
                    <td>{d.women.admitted.toLocaleString("en-US")}</td>
                    <td>{pct(w)}</td>
                    <td className={styles.sub}>
                      {w > m ? "women" : "men"} +
                      {(Math.abs(w - m) * 100).toFixed(1)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr>
                <th scope="row">All six</th>
                <td>{totals.men.applied.toLocaleString("en-US")}</td>
                <td>{totals.men.admitted.toLocaleString("en-US")}</td>
                <td>{pct(menRate)}</td>
                <td>{totals.women.applied.toLocaleString("en-US")}</td>
                <td>{totals.women.admitted.toLocaleString("en-US")}</td>
                <td>{pct(womenRate)}</td>
                <td className={styles.sub}>
                  men +{((menRate - womenRate) * 100).toFixed(1)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        <BerkeleyFigure />
        <p className={styles.figcaption}>
          <b>Where the applications went.</b> Each bar is one sex&rsquo;s
          applications to these six departments, divided by department, with
          segment width proportional to applications and darkness to the
          department&rsquo;s combined admission rate. Same arithmetic as the chart
          in &sect;&thinsp;2, drawn for six groups instead of two: the men&rsquo;s
          applications are concentrated in the dark, easy departments and the
          women&rsquo;s in the pale, hard ones. Computed from the counts in the
          table above.
        </p>

        <div className={styles.col}>
          <p className={styles.p}>
            The mechanism is the one you have been dragging. Within departments
            the differences point both ways: women were admitted at a higher rate
            in four of these six — by twenty points in department A, and by
            between one and five points in B, D and F — and at a lower rate in
            the other two, by under four points. Pooled across the six, men were
            admitted at{" "}
            {pct(menRate)} and women at {pct(womenRate)}, a gap of{" "}
            {((menRate - womenRate) * 100).toFixed(1)} points. The gap is not
            made of admissions decisions. It is made of{" "}
            {(
              ((BERKELEY[0].men.applied + BERKELEY[1].men.applied) /
                totals.men.applied) *
              100
            ).toFixed(1)}{" "}
            per cent of the men&rsquo;s applications going to the two departments
            that admitted around two thirds of everyone, against{" "}
            {(
              ((BERKELEY[0].women.applied + BERKELEY[1].women.applied) /
                totals.women.applied) *
              100
            ).toFixed(1)}{" "}
            per cent of the women&rsquo;s.
          </p>
          <p className={styles.p}>
            It is worth being careful here, because this case is usually told
            badly. Berkeley is not an example of women being admitted at a higher
            rate in every department; that version is a tidier story than the
            data supports. What reverses is the size and the meaning of the
            aggregate, not the sign of every subgroup comparison. The
            authors&rsquo; own conclusion, drawn from all departments rather than
            the largest six, was flatter than the version that circulates:{" "}
            <q>
              If the data are properly pooled, however, they show a small but
              statistically significant bias in favor of women.
            </q>
            <Ref n={3} />
          </p>
          <div className={styles.aside}>
            <p>
              And the paper is careful about what that does and does not
              establish. A department-by-department analysis can say that the
              departments&rsquo; own decisions were not the source of the
              aggregate gap. It cannot say that nothing unjust produced the
              pattern of applications, and the authors do not claim it: the
              question of why women applied in such different proportions to
              different fields is a real one that admissions records cannot
              answer. Resolving a paradox is not the same as resolving a
              grievance.
            </p>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------ § 6 */}
      <section className={styles.section}>
        <div className={styles.sectionHead}>
          <span className={styles.sectionNum}>
            § 6 — The part that is usually skipped
          </span>
          <h2 className={styles.h2}>Which number should you act on?</h2>
        </div>

        <div className={styles.col}>
          <p className={styles.p}>
            By now the reversal is arithmetic and it has stopped being
            surprising. This is where most explanations end, and ending here is
            close to useless, because the practical question has not been
            touched. You are the urologist. The table is in front of you. The two
            numbers point in opposite directions and you have to pick one.
          </p>
          <p className={styles.p}>
            The usual advice is to trust the subgroups. That advice is wrong
            often enough to be dangerous, and it cannot be right in general,
            because it is a rule about arithmetic and the question is not about
            arithmetic. What decides it is how cases came to be in one group
            rather than the other: whether the splitting variable is a cause of
            the treatment, a consequence of it, or a consequence of both the
            treatment and the outcome. Three stories follow. The counts are
            identical in all three, patient for patient. The right answer is not.
          </p>
        </div>

        <CausalStories />

        <div className={styles.col} style={{ paddingTop: "2rem" }}>
          <p className={styles.p}>
            Nothing computed from the table distinguishes those three situations.
            The information that decides between them — what was measured when,
            and what could have caused what — is not in the data and has to be
            argued for from outside it. This is why the paradox has no
            statistical fix, and why the modern treatment of it is written in
            terms of causal diagrams rather than tables.
            <Ref n={6} />
            <Ref n={7} /> Judea Pearl&rsquo;s diagnosis is that the reversal was
            never a paradox about numbers at all. It is a paradox about the
            causal claims readers cannot help attaching to them.
          </p>
          <h3 className={styles.h3}>Berkeley, read twice</h3>
          <p className={styles.p}>
            The three stories are invented so that the counts can be held fixed
            while the structure changes. The uncomfortable part is that the real
            case in &sect;&nbsp;5 supports two of these readings at once,
            depending on the question, and the same
            {" "}
            {(
              totals.men.applied + totals.women.applied
            ).toLocaleString("en-US")}{" "}
            applications answer them differently.
          </p>
          <p className={styles.p}>
            Ask whether the admissions committees were deciding fairly, and
            department is a confounder of the &sect;&nbsp;1 kind. It was fixed
            before any committee saw a file, it determined which committee saw
            it, and it changed the odds. Hold it fixed; read the
            within-department numbers; conclude, as Bickel and his co-authors
            did, that the committees were largely not the problem.
          </p>
          <p className={styles.p}>
            Now ask a different question: was the institution as a whole fair to
            women? If the reason women were concentrated in the oversubscribed
            departments is itself part of what you mean to hold to account —
            advice, expectation, which fields were made to feel available years
            earlier — then department is no longer a variable off to one side. It
            sits <i>on the path</i> from the thing you are asking about to the
            outcome, exactly like the mediator in the second story. Conditioning
            on it subtracts the mechanism you were trying to measure, and the
            within-department numbers, though perfectly correct, systematically
            understate the answer. Here the aggregate is closer to the quantity
            you want.
          </p>
          <p className={styles.p}>
            So the honest summary of the most famous example of this paradox is
            not that the aggregate was wrong. It is that the aggregate answered a
            question about a system and the breakdown answered a question about
            six committees, and the reason it caused an argument is that everyone
            involved thought they were discussing the same thing. This is the
            case that should be kept in mind whenever &ldquo;always look at the
            subgroups&rdquo; sounds like enough.
          </p>
        </div>
      </section>

      {/* ------------------------------------------------------------ § 7 */}
      <section className={styles.section}>
        <div className={styles.sectionHead}>
          <span className={styles.sectionNum}>§ 7 — What survives as advice</span>
          <h2 className={styles.h2}>Five questions, and no rule</h2>
        </div>

        <div className={styles.col}>
          <ol className={styles.list}>
            <li className={styles.li}>
              <b>How were cases sorted into the groups?</b> If the sorting
              happened before treatment and the sorting variable also affects the
              outcome, it is a confounder, and the disaggregated comparison is the
              one that answers a treatment question.
            </li>
            <li className={styles.li}>
              <b>When was the splitting variable measured?</b> Anything recorded
              after treatment is suspect. It may be a piece of the very effect you
              are trying to size, and conditioning on it can invent associations
              as well as hide them.
            </li>
            <li className={styles.li}>
              <b>Do the mixes actually differ?</b> If they don&rsquo;t, an
              aggregate cannot mislead you in this particular way, whatever the
              group sizes are, and something else is going on.
            </li>
            <li className={styles.li}>
              <b>Would adjusting change what you do?</b> &ldquo;Control for more
              variables&rdquo; is not a strategy. The same variable can rescue an
              estimate or ruin it, and which one it does depends only on where it
              sits in the causal structure — not on the data, and not on how much
              of it there is.
            </li>
            <li className={styles.li}>
              <b>Could randomisation have been used?</b> It is popular for
              precisely this reason. It does not make reversals impossible —
              subgroup mixes still differ, by chance, and post-treatment variables
              still wreck things — but it removes confounding by construction, and
              so makes the pooled comparison the one to act on by design instead
              of by argument.
            </li>
          </ol>
          <p className={styles.p}>
            The same arithmetic runs through the continuous version, which is
            worth recognising when you meet it: a scatter plot with a clean
            positive slope inside every group and a negative slope through the
            pooled cloud. Nothing new is happening. The group means are sitting
            where the group sizes put them.
          </p>
          <p className={styles.pull}>
            An aggregate is not untrustworthy. It is an average with weights, and
            the weights are part of what it says.
          </p>
          <p className={styles.p}>
            Which leaves a small habit rather than a rule, and small habits are
            what survive contact with real data. When you read a rate over a
            population — a success rate, an admission rate, a fatality rate, a
            conversion rate — ask what the population was made of. Then go and
            find out whether the two things you are comparing were made of the
            same thing. Usually they were not.
          </p>
        </div>
      </section>

      {/* ---------------------------------------------------------- notes */}
      <section className={styles.notes}>
        <h2 className={styles.notesTitle}>Sources and notes</h2>
        <ol className={styles.notesList}>
          <li className={styles.noteItem} id="note-1">
            <span className={styles.noteNum}>1</span>
            C. R. Charig, D. R. Webb, S. R. Payne and J. E. A. Wickham,
            &ldquo;Comparison of treatment of renal calculi by open surgery,
            percutaneous nephrolithotomy, and extracorporeal shockwave
            lithotripsy&rdquo;, <i>British Medical Journal</i> 292 (6524),
            879&ndash;882, 1986.
          </li>
          <li className={styles.noteItem} id="note-2">
            <span className={styles.noteNum}>2</span>
            S. A. Julious and M. A. Mullee, &ldquo;Confounding and Simpson&rsquo;s
            paradox&rdquo;, <i>British Medical Journal</i> 309 (6967),
            1480&ndash;1481, 1994. This is the source of the split by stone size
            used here, and of the two-centimetre cut-off.
          </li>
          <li className={styles.noteItem} id="note-3">
            <span className={styles.noteNum}>3</span>
            P. J. Bickel, E. A. Hammel and J. W. O&rsquo;Connell, &ldquo;Sex bias
            in graduate admissions: data from Berkeley&rdquo;, <i>Science</i> 187
            (4175), 398&ndash;404, 7 February 1975. The quoted sentence is from
            the paper&rsquo;s abstract, and refers to a pooled analysis over all
            departments rather than the six largest tabulated above.
          </li>
          <li className={styles.noteItem} id="note-4">
            <span className={styles.noteNum}>4</span>
            E. H. Simpson, &ldquo;The interpretation of interaction in contingency
            tables&rdquo;, <i>Journal of the Royal Statistical Society, Series B</i>{" "}
            13 (2), 238&ndash;241, 1951. The effect is named after this paper.
          </li>
          <li className={styles.noteItem} id="note-5">
            <span className={styles.noteNum}>5</span>
            G. U. Yule, &ldquo;Notes on the theory of association of attributes in
            statistics&rdquo;, <i>Biometrika</i> 2 (2), 121&ndash;134, 1903. Yule
            had the phenomenon half a century earlier, which is why it is
            sometimes called the Yule&ndash;Simpson effect.
          </li>
          <li className={styles.noteItem} id="note-6">
            <span className={styles.noteNum}>6</span>
            J. Pearl, <i>Causality: Models, Reasoning, and Inference</i>, second
            edition, Cambridge University Press, 2009, section 6.1, which treats
            the reversal as a question about causal structure rather than about
            tables.
          </li>
          <li className={styles.noteItem} id="note-7">
            <span className={styles.noteNum}>7</span>
            M. A. Hern&aacute;n, D. Clayton and N. Keiding, &ldquo;The
            Simpson&rsquo;s paradox unraveled&rdquo;,{" "}
            <i>International Journal of Epidemiology</i> 40 (3), 780&ndash;785,
            2011.
          </li>
          <li className={styles.noteItem} id="note-8">
            <span className={styles.noteNum}>8</span>
            On this page: the kidney-stone and Berkeley counts are as published.
            Everything in the prediction exercises, in the presets other than
            &ldquo;published figures&rdquo;, and in causal stories 2 and 3 is
            invented for teaching and is labelled illustrative where it appears.
            All percentages are computed from the counts shown, rounded for
            display only.
          </li>
        </ol>
      </section>

      <footer className={styles.colophon}>
        <span>Reversal — an interactive explanation of Simpson&rsquo;s paradox</span>
        <Link
          className={styles.backLink}
          href="/tasks/educational-concept-explanation"
        >
          the brief for this piece &rarr;
        </Link>
      </footer>
    </div>
  );
}

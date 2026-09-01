"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { fmtSteps, run, waysOr, waysPlus } from "./engine";
import s from "./essay.module.css";
import { HeatTape, Stepper, type Demo } from "./stepper";
import TreeHost from "./tree-host";

function Ref({ n }: { n: number }) {
  return (
    <a className={s.ref} href={`#note-${n}`} aria-label={`Note ${n}`}>
      {n}
    </a>
  );
}

const WORKBENCH: Demo[] = [
  { pattern: "cat|car", input: "car", label: "cat|car" },
  { pattern: "a+ab", input: "aaab", label: "greedy a+" },
  { pattern: "a?a?a?aaa", input: "aa", label: "Cox’s a?" },
  { pattern: "^(a+)+b", input: "aaaa", label: "(a+)+b" },
  { pattern: "^(a|a)*b", input: "aaaa", label: "(a|a)*b" },
];

const PREDICT = [
  {
    id: "lin-plus",
    pat: "^a+b",
    explode: false,
    why: "One quantifier. When b is missing the engine gives back one a at a time: linear in the length.",
  },
  {
    id: "nest",
    pat: "^(a+)+b",
    explode: true,
    why: "Nested + over the same character. The n a’s can be cut into 2^{n−1} ordered groups; each cut is tried.",
  },
  {
    id: "lit",
    pat: "^aa+b",
    explode: false,
    why: "Still a single star. The two leading a’s do not create a choice about how to split the rest.",
  },
  {
    id: "or",
    pat: "^(a|a)*b",
    explode: true,
    why: "Two ways to eat each a, and they overlap. Assigning n letters independently is 2^n paths, then b fails.",
  },
] as const;

const LEDE_INPUT = "aaaa";
const lede = run("^(a|a)*b", LEDE_INPUT, { anchored: true });

export default function Essay() {
  return (
    <div className={s.root}>
      <Link className={s.escape} href="/tasks/educational-algorithm-visualizer">
        Brief
      </Link>

      <header className={s.masthead}>
        <p className={s.kicker}>
          <span>A note on engines</span>
          <span>Regular expressions · backtracking</span>
          <span>Read it, then break it</span>
        </p>
        <h1 className={s.title}>Backtrack</h1>
        <p className={s.deck}>
          A pattern that finishes before you blink on one string will, on a
          string one character longer, outlast the sun. The engine that does
          this is the one already in your language. Below: you drive it.
        </p>
        <p className={s.byline}>
          <span>Modelled on PCRE / Python re / historical JavaScript</span>
          <span>Keyboard: arrows when a figure is focused</span>
        </p>
        <figure className={s.ledeFigure}>
          <HeatTape input={LEDE_INPUT} visits={lede.visits} />
          <figcaption className={s.ledeCaption}>
            <span className={s.mono}>^(a|a)*b</span> against four a’s and no{" "}
            <span className={s.mono}>b</span>. The bar on each letter is how
            many times the engine came back to it — 2, 4, 8, 16. That is the
            whole essay, in one strip.
          </figcaption>
        </figure>
      </header>

      <section className={s.section} id="engine">
        <div className={s.sectionHead}>
          <span className={s.secNum}>§ 1 — The engine you already use</span>
          <h2 className={s.h2}>It is not the algorithm in the textbook</h2>
        </div>
        <div className={s.col}>
          <p className={s.p}>
            Almost every working programmer writes regular expressions. Almost
            none can say what their engine will do on a slightly longer input.
            The failure mode is not a wrong answer. It is a search that is
            still running when the process is killed — microseconds on{" "}
            <span className={s.mono}>aaaX</span>, longer than the universe has
            existed on <span className={s.mono}>aaaaaaaaaaaaaaaaaaaaX</span>.
            That is a live denial-of-service class, not a curiosity.
            <Ref n={1} />
          </p>
          <p className={s.p}>
            The textbook algorithm is Thompson’s, from 1968: keep every
            reachable position in the pattern at once, advance them together,
            never retry a pair (instruction, input index).
            <Ref n={2} /> It is linear in the product of those sizes. RE2, Go’s{" "}
            <span className={s.mono}>regexp</span>, and Rust’s{" "}
            <span className={s.mono}>regex</span> do that. Perl, PCRE, Python’s{" "}
            <span className={s.mono}>re</span>, Ruby, Java{" "}
            <span className={s.mono}>Pattern</span>, .NET, and the JavaScript
            engine that still runs most of the web do something else. They{" "}
            <em>backtrack</em>. They try one path, and when it dies they give
            back the last choice and try the other.
            <Ref n={3} />
          </p>
          <p className={s.pull}>
            The control flow is hidden. A match either returns or it does not.
            The combinatorial explosion is the thing that never appears on
            the screen — until the service falls over.
          </p>
          <p className={s.p}>
            This page runs a small backtracker built to that control flow.
            Greedy quantifiers take as much as they can and retreat;{" "}
            <span className={s.mono}>|</span> tries the left side first;
            unanchored search, like <span className={s.mono}>RegExp#exec</span>,
            restarts one character later if the current start fails. Where the
            model is smaller than a real engine, that is said in the notes.
            Nothing here is a film of bubble sort. You will change the
            quantities.
          </p>
        </div>
      </section>

      <section className={s.section} id="try">
        <div className={s.sectionHead}>
          <span className={s.secNum}>§ 2 — One decision, then another</span>
          <h2 className={s.h2}>Watch it fail, give back, and try the other side</h2>
        </div>
        <div className={s.col}>
          <p className={s.p}>
            Start with a pattern that does not explode.{" "}
            <span className={s.mono}>cat|car</span> on <span className={s.mono}>car</span>:
            the engine walks into <span className={s.mono}>cat</span>, dies on
            the <span className={s.mono}>t</span>, returns to the bar, and
            walks <span className={s.mono}>car</span>. Then try greedy{" "}
            <span className={s.mono}>a+ab</span> on <span className={s.mono}>aaab</span> —
            the plus takes every <span className={s.mono}>a</span>, the trailing{" "}
            <span className={s.mono}>ab</span> cannot fire, and the plus gives
            them back one by one until it can. Then Cox’s example: three
            optional <span className={s.mono}>a</span>s in front of a required
            three, on a string that is too short. Every combination is tried.
            <Ref n={3} />
          </p>
          <p className={s.p}>
            Focus the figure. Right arrow (or Next) is the next instruction.
            You are the clock.
          </p>
        </div>
        <Stepper initial={WORKBENCH[0]} editable presets={WORKBENCH} />
        <div className={s.col}>
          <p className={s.p}>
            Type your own. The dialect here is small on purpose: literals,{" "}
            <span className={s.mono}>.</span>, classes, <span className={s.mono}>\d\w\s</span>,{" "}
            <span className={s.mono}>^$</span>, <span className={s.mono}>|</span>, groups,{" "}
            <span className={s.mono}>*+?</span> and <span className={s.mono}>{"{n,m}"}</span>,
            greedy or lazy (<span className={s.mono}>*?</span>) or possessive (
            <span className={s.mono}>*+</span>). No backreferences, no
            lookaround, no Unicode properties. A real engine has those, and
            backreferences make the worst cases worse. The explosion you are
            about to produce does not need them.
          </p>
        </div>
      </section>

      <Predict />

      <Scale />

      <Fix />

      <section className={s.section} id="model">
        <div className={s.sectionHead}>
          <span className={s.secNum}>§ 6 — What this model leaves out</span>
          <h2 className={s.h2}>Faithful where it matters, smaller where it must be</h2>
        </div>
        <div className={s.col}>
          <p className={s.p}>
            The backtracker is a recursive search with an explicit stack,
            compiled from a Thompson-style program: consume, split, jump,
            match. That is the control flow of PCRE and of CPython’s SRE, not
            a cartoon of it. Empty loops such as <span className={s.mono}>(a*)*</span>{" "}
            are broken the way real engines break them — a thread that returns
            to the same instruction at the same index on its <em>current
            path</em> is failed. That is not memoisation of failure. Memoising
            every pair (instruction, index) would make the search linear and
            would hide the thing this page exists to show.
          </p>
          <p className={s.p}>
            Real engines also have heuristics that sometimes skip a doomed
            search, a recursion ceiling, and a different story for
            backreferences, lookaround, and possessive groups. JavaScript’s
            current engine is a backtracker with optimisations, not a pure
            one; some patterns that explode here are cheaper there, and some
            are not. The NFA column is Thompson’s algorithm on the same
            bytecode. Possessive constructs are a backtracking commitment and
            are treated as ordinary epsilon edges in that column — the
            automaton does not need them, because it never gives back.
          </p>
          <p className={s.p}>
            Step counts are instruction visits, not CPU nanoseconds, and the
            two columns are not in identical units. They are honest work. If
            a search is cut off, the figure says so, and the closed form for
            the number of complete failed parses is sitting next to it. Check
            the arithmetic. That is the point.
          </p>
        </div>
      </section>

      <section className={s.notes} aria-label="Sources and notes">
        <h2 className={s.notesTitle}>Sources and notes</h2>
        <ol className={s.notesList}>
          <li className={s.note} id="note-1">
            <span className={s.noteNum}>1</span>
            <span>
              Regular-expression denial of service is a named class; see OWASP,
              “Regular expression Denial of Service”. A production case: Cloudflare,
              “Details of the Cloudflare outage on July 2, 2019” — a WAF
              expression whose backtracking exhausted CPU across the edge.
            </span>
          </li>
          <li className={s.note} id="note-2">
            <span className={s.noteNum}>2</span>
            <span>
              Ken Thompson, “Regular Expression Search Algorithm”,{" "}
              <i>Communications of the ACM</i> 11 (6), 1968, 419–422. The
              simultaneous NFA; the linear bound.
            </span>
          </li>
          <li className={s.note} id="note-3">
            <span className={s.noteNum}>3</span>
            <span>
              Russ Cox, “Regular Expression Matching Can Be Simple And Fast
              (but is slow in Java, Perl, PHP, Python, Ruby, …)”, 2007,
              swtch.com/~rsc/regexp/regexp1.html. The{" "}
              <span className={s.mono}>a?a?a?aaa</span> example is his. The
              argument of this page is his argument, made visible.
            </span>
          </li>
          <li className={s.note} id="note-4">
            <span className={s.noteNum}>4</span>
            <span>
              The number of compositions of n into ordered positive parts is
              2<sup>n−1</sup>. That is the number of ways <span className={s.mono}>(a+)+</span>{" "}
              can cut a run of n a’s. The overlapping alternation{" "}
              <span className={s.mono}>(a|a)*</span> assigns each letter
              independently: 2^n.
            </span>
          </li>
          <li className={s.note} id="note-5">
            <span className={s.noteNum}>5</span>
            <span>
              Jeffrey E. F. Friedl, <i>Mastering Regular Expressions</i>,
              O’Reilly — the standard description of backtracking as
              programmers meet it. Henry Spencer’s Tcl engine is the other
              famous lineage, closer to automata.
            </span>
          </li>
          <li className={s.note} id="note-6">
            <span className={s.noteNum}>6</span>
            <span>
              Syntax implemented here: concatenation, <span className={s.mono}>|</span>,
              capturing groups (capturing is parsed, not exposed),{" "}
              <span className={s.mono}>* + ? {"{n,m}"}</span> with lazy{" "}
              <span className={s.mono}>?</span> and possessive{" "}
              <span className={s.mono}>+</span> suffixes, <span className={s.mono}>.</span>{" "}
              (not newline), <span className={s.mono}>^ $</span> as start and
              end of the whole input, classes and the usual shorthands.
              Not implemented: backreferences, lookaround, flags, named groups,
              Unicode properties, recursion. Unanchored search tries each
              start, like <span className={s.mono}>re.search</span> /{" "}
              <span className={s.mono}>RegExp#exec</span>, unless the pattern
              begins with <span className={s.mono}>^</span>.
            </span>
          </li>
        </ol>
      </section>
    </div>
  );
}

function Predict() {
  const [picked, setPicked] = useState<Record<string, boolean>>({});
  const [revealed, setRevealed] = useState(false);
  const n = 10;
  const input = "a".repeat(n);

  const rows = useMemo(
    () =>
      PREDICT.map((c) => {
        const r = run(c.pat, input, { anchored: true, stepLimit: 80_000 });
        return { ...c, steps: r.steps, capped: r.capped, nfa: r.nfaSteps };
      }),
    [input],
  );

  const toggle = (id: string) => {
    if (revealed) return;
    setPicked((p) => ({ ...p, [id]: !p[id] }));
  };

  return (
    <section className={s.section} id="shape">
      <div className={s.sectionHead}>
        <span className={s.secNum}>§ 3 — The shape of a hazard</span>
        <h2 className={s.h2}>Nested quantifiers, overlapping alternations</h2>
      </div>
      <div className={s.col}>
        <p className={s.p}>
          Two shapes keep turning up in outages. A quantifier inside a
          quantifier over the same characters — <span className={s.mono}>(a+)+</span>,{" "}
          <span className={s.mono}>(a*)*</span>, <span className={s.mono}>(x+x+)+y</span>.
          And an alternation whose arms eat the same text —{" "}
          <span className={s.mono}>(a|a)</span>, <span className={s.mono}>(a|aa)</span>,{" "}
          <span className={s.mono}>(.*)*b</span>. Neither is exotic. Both are
          easy to write by accident while making a pattern “more flexible”.
        </p>
        <p className={s.p}>
          Mark the ones you think will still be thrashing after ten thousand
          steps on ten a’s and no <span className={s.mono}>b</span>. Then
          open them. Wrong is the useful answer.
        </p>
      </div>
      <div className={s.figure}>
        <p className={s.figLabel}>Which of these explode? Input · {input}</p>
        <div className={s.grid}>
          {rows.map((c) => {
            const on = !!picked[c.id];
            return (
              <button
                key={c.id}
                type="button"
                className={`${s.card} ${on ? s.cardOn : ""}`}
                aria-pressed={on}
                onClick={() => toggle(c.id)}
              >
                <p className={s.cardPat}>{c.pat}</p>
                <p className={s.cardMeta}>
                  {revealed
                    ? `${fmtSteps(c.steps)} steps · NFA ${fmtSteps(c.nfa)}`
                    : on
                      ? "you marked this as dangerous"
                      : "click if you think this one explodes"}
                </p>
                {revealed ? (
                  <p className={`${s.cardVerdict} ${c.explode ? s.markBad : s.markOk}`}>
                    {c.explode ? "Explodes. " : "Stays linear. "}
                    {c.why}{" "}
                    {on === c.explode
                      ? on
                        ? "You marked it."
                        : "You left it, correctly."
                      : on
                        ? "You marked it; this one does not explode."
                        : "You left it — that was the miss."}
                  </p>
                ) : null}
              </button>
            );
          })}
        </div>
        <div className={s.controls}>
          <button
            type="button"
            className={s.btn}
            onClick={() => setRevealed(true)}
            disabled={revealed}
          >
            Run them
          </button>
          <button
            type="button"
            className={s.btn}
            onClick={() => {
              setRevealed(false);
              setPicked({});
            }}
          >
            Clear
          </button>
        </div>
        {revealed ? (
          <p className={s.figCaption}>
            Ten a’s is already enough to tell the two families apart. The NFA
            column on the same bytecode stays in the dozens of steps for every
            row.
          </p>
        ) : (
          <p className={s.figCaption}>
            Four patterns, one input. Commit before you see the counts.
          </p>
        )}
      </div>
    </section>
  );
}

function Scale() {
  const [n, setN] = useState(5);
  const input = "a".repeat(n);
  const or = useMemo(
    () => run("^(a|a)*b", input, { anchored: true, stepLimit: 80_000, eventLimit: 0 }),
    [input],
  );
  const plus = useMemo(
    () => run("^(a+)+b", input, { anchored: true, stepLimit: 80_000, eventLimit: 0 }),
    [input],
  );
  const treeDepth = Math.min(n + 1, 7);
  const leaves = waysOr(Math.min(n, 20));

  return (
    <section className={s.section} id="scale">
      <div className={s.sectionHead}>
        <span className={s.secNum}>§ 4 — An astronomically large search</span>
        <h2 className={s.h2}>You cannot step through 2<sup>n</sup>. You can see its shape.</h2>
      </div>
      <div className={s.col}>
        <p className={s.p}>
          At four a’s the stepper in § 2 is honest. At twenty it is a lie: a
          complete listing of <span className={s.mono}>^(a|a)*b</span> has
          more than a million failed paths, and at thirty the number no
          longer fits in a readable sentence. The design problem is not
          animation. It is making that search <em>legible</em> without
          pretending to walk it.
        </p>
        <p className={s.p}>
          So we stop listing. The strip still says how often each letter was
          visited. The tree is the decision at each letter — left arm or
          right — drawn as a volume, not as a film. The number next to it is
          the closed form: 2<sup>n</sup> ways for the overlapping bar, 2
          <sup>n−1</sup> compositions for the nested plus.
          <Ref n={4} /> Move the length yourself. Predict the next doubling
          before the slider lands.
        </p>
      </div>
      <div className={s.figure}>
        <p className={s.figLabel}>
          Length of a run of a’s · pattern <span className={s.mono}>^(a|a)*b</span>
        </p>
        <div className={s.sliderRow}>
          <label htmlFor="n-a">n = {n}</label>
          <input
            id="n-a"
            className={s.slider}
            type="range"
            min={1}
            max={20}
            value={n}
            onChange={(e) => setN(Number(e.target.value))}
          />
          <div className={s.bigNum} aria-live="polite">
            {or.capped ? ">" : ""}
            {fmtSteps(or.steps)}
          </div>
        </div>
        <HeatTape input={input} visits={or.visits} />
        <div className={s.pair}>
          <TreeHost
            depth={treeDepth}
            caption={
              n <= 6
                ? `Every internal node is a choice of a|a. ${fmtSteps(leaves)} leaves would try b and fail.`
                : `First ${treeDepth - 1} choices drawn. A complete tree at n = ${n} has ${fmtSteps(leaves)} failed leaves.`
            }
          />
          <div>
            <p className={s.stat}>
              <b>Overlapping alternation</b>
              <br />
              <span className={s.mono}>^(a|a)*b</span> on {n} a’s
              <br />
              ways to assign the letters: 2<sup>{n}</sup> = {fmtSteps(waysOr(n))}
              <br />
              this backtracker: {or.capped ? "stopped at " : ""}
              {fmtSteps(or.steps)} steps
              <br />
              same program as an NFA: {fmtSteps(or.nfaSteps)} steps
            </p>
            <p className={s.stat} style={{ marginTop: "0.85rem" }}>
              <b>Nested plus</b>
              <br />
              <span className={s.mono}>^(a+)+b</span> on the same input
              <br />
              compositions: 2<sup>{n - 1}</sup> = {fmtSteps(waysPlus(n))}
              <br />
              this backtracker: {plus.capped ? "stopped at " : ""}
              {fmtSteps(plus.steps)} steps
              <br />
              NFA: {fmtSteps(plus.nfaSteps)} steps
            </p>
          </div>
        </div>
        <p className={s.figCaption}>
          Drag the tree, or focus it and use the arrows. The red nodes are
          the deeper choices — the ones a listing would still be enumerating
          after you had gone home. At n = 20 the run is capped on purpose;
          the closed form is not.
        </p>
      </div>
    </section>
  );
}

function Fix() {
  const [pat, setPat] = useState("^(a+)+b");
  const n = 12;
  const input = "a".repeat(n);
  const r = useMemo(
    () => run(pat, input, { anchored: true, stepLimit: 80_000, eventLimit: 200 }),
    [pat, input],
  );
  const ok = run("^a+b", input + "b", { anchored: true });

  return (
    <section className={s.section} id="fix">
      <div className={s.sectionHead}>
        <span className={s.secNum}>§ 5 — What to do about it</span>
        <h2 className={s.h2}>Recognise the shape, then refuse the search</h2>
      </div>
      <div className={s.col}>
        <p className={s.p}>
          A name for the failure is useless without a way to stop it. The
          useful questions are four, and they are in order.
        </p>
        <ul className={s.ul}>
          <li>
            <b>Is there a quantifier whose body can be eaten more than one way?</b>{" "}
            Nested <span className={s.mono}>+</span> / <span className={s.mono}>*</span>,
            or <span className={s.mono}>|</span> with overlapping arms, or{" "}
            <span className={s.mono}>.*</span> next to another{" "}
            <span className={s.mono}>.*</span>. If the answer is yes and a later
            literal can fail, you have the shape.
          </li>
          <li>
            <b>Can you write the same language without the extra choice?</b>{" "}
            <span className={s.mono}>(a+)+b</span> is <span className={s.mono}>a+b</span>.{" "}
            <span className={s.mono}>(a|a)*b</span> is <span className={s.mono}>a*b</span>.{" "}
            <span className={s.mono}>(a|aa)+$</span> is <span className={s.mono}>a+$</span>.
            The nested form is almost never saying what the author thinks.
          </li>
          <li>
            <b>If the language really needs the overlap, commit.</b> Possessive{" "}
            <span className={s.mono}>a++</span> / <span className={s.mono}>{"(?>a+)"}</span>{" "}
            means: take the greedy amount and do not give it back. The search
            becomes a single path. This engine implements the{" "}
            <span className={s.mono}>++</span> suffix so you can feel the
            difference.
          </li>
          <li>
            <b>If you can, leave the backtracker.</b> RE2, Go, and Rust never
            retry a pair (state, index). They are immune to this explosion.
            They also refuse backreferences, which is the trade. Use them
            for untrusted patterns — anything a user typed, anything in a WAF.
            <Ref n={1} />
          </li>
        </ul>
        <p className={s.p}>
          Rewrite the dangerous pattern. The input is twelve a’s. The safe
          forms of this language finish in tens of steps. The nested form
          does not.
        </p>
      </div>
      <div className={s.figure}>
        <p className={s.figLabel}>Same input · {n} a’s · you change the pattern</p>
        <div className={s.presets} role="group" aria-label="Rewrites">
          {[
            ["^(a+)+b", "as written"],
            ["^a+b", "same language"],
            ["^(a++)+b", "possessive"],
            ["^(a|a)*b", "the other shape"],
            ["^a*b", "that language, linear"],
          ].map(([p, lab]) => (
            <button
              key={p}
              type="button"
              className={`${s.chip} ${pat === p ? s.chipOn : ""}`}
              onClick={() => setPat(p)}
            >
              {lab}
            </button>
          ))}
        </div>
        <div className={s.field}>
          <label htmlFor="fix-pat">Pattern</label>
          <input
            id="fix-pat"
            className={s.input}
            spellCheck={false}
            autoCapitalize="off"
            autoCorrect="off"
            value={pat}
            onChange={(e) => setPat(e.target.value)}
          />
        </div>
        {r.error ? <p className={s.err}>{r.error}</p> : null}
        <HeatTape input={input} visits={r.visits} />
        <div className={s.compare}>
          <div className={s.colBox}>
            <h3>Your pattern, backtracking</h3>
            <p>
              {r.capped ? "Stopped at " : ""}
              <b>{fmtSteps(r.steps)}</b> steps
              {r.matched ? ", matched" : ", no match (as intended — there is no b)"}.
            </p>
          </div>
          <div className={s.colBox}>
            <h3>Same bytecode, Thompson NFA</h3>
            <p>
              <b>{fmtSteps(r.nfaSteps)}</b> steps,{" "}
              {r.nfaMatched ? "matched" : "no match"}. The pair (instruction,
              index) is never retried.
            </p>
          </div>
        </div>
        <p className={s.figCaption}>
          <span className={s.mono}>^a+b</span> on twelve a’s then a{" "}
          <span className={s.mono}>b</span> matches in {fmtSteps(ok.steps)}{" "}
          steps. If your rewrite still says “yes” to that string and “no” to
          twelve a’s alone, and the left-hand number stays small as n grows,
          you have left the hazard.
        </p>
      </div>
      <div className={s.col}>
        <div className={s.aside}>
          <p>
            A scoreboard would compete with the only reward that matters
            here, which is seeing the tree and then making it go away. There
            is not one.
          </p>
        </div>
      </div>
    </section>
  );
}

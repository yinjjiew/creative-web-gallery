/**
 * A small backtracking regular-expression engine, modelled on the control
 * flow of PCRE / Python `re` / historical JavaScript — not on Thompson's
 * simultaneous NFA, which is the algorithm in the textbook and in RE2.
 *
 * The point of the model is transfer: a programmer who watches this engine
 * fail and give back should recognise the same shape in production. Where
 * the model is smaller than a real engine, that is declared in the essay.
 *
 * Empty-match loops (e.g. `(a*)*`) are broken the way real engines break
 * them: a thread that returns to the same instruction at the same input
 * offset on its *current path* is a cycle and is failed. That is not
 * memoisation of failure — memoising (pc, sp) would make the search linear
 * and would hide the explosion this page exists to show.
 */

export type QuantMode = "greedy" | "lazy" | "possessive";

export type Ast =
  | { t: "empty"; a: number; b: number }
  | { t: "lit"; c: string; a: number; b: number }
  | { t: "any"; a: number; b: number }
  | { t: "cls"; label: string; test: (ch: string) => boolean; a: number; b: number }
  | { t: "bol"; a: number; b: number }
  | { t: "eol"; a: number; b: number }
  | { t: "cat"; xs: Ast[]; a: number; b: number }
  | { t: "alt"; xs: Ast[]; a: number; b: number }
  | { t: "rep"; e: Ast; min: number; max: number | null; mode: QuantMode; a: number; b: number }
  | { t: "grp"; id: number; e: Ast; a: number; b: number };

export type Why = "quant" | "alt" | "opt";

export type Op =
  | { op: "char"; c: string; a: number; b: number }
  | { op: "any"; a: number; b: number }
  | { op: "cls"; label: string; test: (ch: string) => boolean; a: number; b: number }
  | { op: "bol"; a: number; b: number }
  | { op: "eol"; a: number; b: number }
  | { op: "split"; x: number; y: number; why: Why; a: number; b: number }
  | { op: "jmp"; to: number; a: number; b: number }
  | { op: "enter_atomic"; a: number; b: number }
  | { op: "commit"; a: number; b: number }
  | { op: "match"; a: number; b: number };

export type Verb =
  | "start"
  | "try"
  | "eat"
  | "fail"
  | "split"
  | "back"
  | "match"
  | "cap"
  | "cycle";

export type Event = {
  n: number;
  pc: number;
  sp: number;
  start: number;
  verb: Verb;
  op: string;
  detail: string;
  from: number;
  to: number;
};

export type Run = {
  matched: boolean;
  span: [number, number] | null;
  steps: number;
  capped: boolean;
  visits: number[];
  events: Event[];
  startsTried: number;
  splits: number;
  backs: number;
  eats: number;
  fails: number;
  cycles: number;
  /** Thompson NFA on the same program and input — for the comparison. */
  nfaSteps: number;
  nfaMatched: boolean;
  error: string | null;
  prog: Op[];
  ast: Ast | null;
  anchored: boolean;
};

export type ParseOk = { ok: true; ast: Ast; anchored: boolean };
export type ParseErr = { ok: false; error: string; at: number };
export type ParseResult = ParseOk | ParseErr;

const DIGIT = (ch: string) => ch >= "0" && ch <= "9";
const WORD = (ch: string) =>
  (ch >= "a" && ch <= "z") ||
  (ch >= "A" && ch <= "Z") ||
  DIGIT(ch) ||
  ch === "_";
const SPACE = (ch: string) =>
  ch === " " || ch === "\t" || ch === "\n" || ch === "\r" || ch === "\f";

export function parse(src: string): ParseResult {
  let i = 0;
  let gid = 0;

  const peek = () => src[i];
  const eof = () => i >= src.length;

  function err(msg: string, at = i): ParseErr {
    return { ok: false, error: msg, at };
  }

  function parseAlt(a0: number): Ast | ParseErr {
    const xs: Ast[] = [];
    const first = parseCat(i);
    if (!ok(first)) return first;
    xs.push(first);
    while (peek() === "|") {
      i++;
      const next = parseCat(i);
      if (!ok(next)) return next;
      xs.push(next);
    }
    const b = i;
    if (xs.length === 1) return xs[0];
    return { t: "alt", xs, a: a0, b };
  }

  function parseCat(a0: number): Ast | ParseErr {
    const xs: Ast[] = [];
    while (!eof() && peek() !== "|" && peek() !== ")") {
      const n = parseRep();
      if (!ok(n)) return n;
      xs.push(n);
    }
    const b = i;
    if (xs.length === 0) return { t: "empty", a: a0, b };
    if (xs.length === 1) return xs[0];
    return { t: "cat", xs, a: a0, b };
  }

  function parseRep(): Ast | ParseErr {
    const atom = parseAtom();
    if (!ok(atom)) return atom;
    let e: Ast = atom;
    for (;;) {
      const q = peek();
      if (q !== "*" && q !== "+" && q !== "?" && q !== "{") break;
      const a = e.a;
      let min = 0;
      let max: number | null = 0;
      if (q === "*") {
        i++;
        min = 0;
        max = null;
      } else if (q === "+") {
        i++;
        min = 1;
        max = null;
      } else if (q === "?") {
        i++;
        min = 0;
        max = 1;
      } else {
        const brace = parseBrace();
        if (!ok(brace)) return brace;
        min = brace.min;
        max = brace.max;
      }
      let mode: QuantMode = "greedy";
      if (peek() === "?") {
        i++;
        mode = "lazy";
      } else if (peek() === "+") {
        i++;
        mode = "possessive";
      }
      e = { t: "rep", e, min, max, mode, a, b: i };
    }
    return e;
  }

  function parseBrace():
    | { ok: true; min: number; max: number | null }
    | ParseErr {
    const at = i;
    i++; // {
    if (!DIGIT(peek() ?? "")) return err("expected a number in {n,m}", at);
    let min = 0;
    while (DIGIT(peek() ?? "")) min = min * 10 + (eatNum() ?? 0);
    let max: number | null = min;
    if (peek() === ",") {
      i++;
      if (peek() === "}") {
        max = null;
      } else {
        if (!DIGIT(peek() ?? "")) return err("expected a number after the comma", i);
        max = 0;
        while (DIGIT(peek() ?? "")) max = max * 10 + (eatNum() ?? 0);
        if (max < min) return err("maximum is smaller than minimum", at);
      }
    }
    if (peek() !== "}") return err("unclosed {n,m}", at);
    i++;
    return { ok: true, min, max };
  }

  function eatNum(): number | null {
    const c = peek();
    if (!c || !DIGIT(c)) return null;
    i++;
    return c.charCodeAt(0) - 48;
  }

  function parseAtom(): Ast | ParseErr {
    if (eof()) return err("unexpected end of pattern");
    const a = i;
    const c = src[i++];
    if (c === "(") {
      const id = ++gid;
      const inner = parseAlt(i);
      if (!ok(inner)) return inner;
      if (peek() !== ")") return err("unclosed group", a);
      i++;
      return { t: "grp", id, e: inner, a, b: i };
    }
    if (c === ")") return err("unmatched ')'", a);
    if (c === "*" || c === "+" || c === "?")
      return err(`'${c}' has nothing to quantify`, a);
    if (c === ".") return { t: "any", a, b: i };
    if (c === "^") return { t: "bol", a, b: i };
    if (c === "$") return { t: "eol", a, b: i };
    if (c === "[") return parseClass(a);
    if (c === "\\") return parseEsc(a);
    if (c === "|") return err("empty alternative needs a neighbour", a);
    return { t: "lit", c, a, b: i };
  }

  function parseEsc(a: number): Ast | ParseErr {
    if (eof()) return err("dangling backslash", a);
    const c = src[i++];
    if (c === "d") return { t: "cls", label: "\\d", test: DIGIT, a, b: i };
    if (c === "D")
      return { t: "cls", label: "\\D", test: (ch) => !DIGIT(ch), a, b: i };
    if (c === "w") return { t: "cls", label: "\\w", test: WORD, a, b: i };
    if (c === "W")
      return { t: "cls", label: "\\W", test: (ch) => !WORD(ch), a, b: i };
    if (c === "s") return { t: "cls", label: "\\s", test: SPACE, a, b: i };
    if (c === "S")
      return { t: "cls", label: "\\S", test: (ch) => !SPACE(ch), a, b: i };
    if (c === "n") return { t: "lit", c: "\n", a, b: i };
    if (c === "t") return { t: "lit", c: "\t", a, b: i };
    return { t: "lit", c, a, b: i };
  }

  function parseClass(a: number): Ast | ParseErr {
    const negate = peek() === "^";
    if (negate) i++;
    const parts: ((ch: string) => boolean)[] = [];
    let label = src.slice(a, i);
    if (eof()) return err("unclosed character class", a);
    // First character may be ] or - literally.
    if (peek() === "]" || peek() === "-") {
      const lit = src[i++];
      parts.push((ch) => ch === lit);
    }
    while (!eof() && peek() !== "]") {
      if (peek() === "\\") {
        i++;
        if (eof()) return err("dangling backslash in class", a);
        const c = src[i++];
        if (c === "d") parts.push(DIGIT);
        else if (c === "w") parts.push(WORD);
        else if (c === "s") parts.push(SPACE);
        else parts.push((ch) => ch === c);
        continue;
      }
      const start = src[i++];
      if (peek() === "-" && src[i + 1] && src[i + 1] !== "]") {
        i++;
        const end = src[i++];
        const lo = start.charCodeAt(0);
        const hi = end.charCodeAt(0);
        parts.push((ch) => {
          const k = ch.charCodeAt(0);
          return k >= lo && k <= hi;
        });
      } else {
        parts.push((ch) => ch === start);
      }
    }
    if (peek() !== "]") return err("unclosed character class", a);
    i++;
    label = src.slice(a, i);
    const test = (ch: string) => {
      const hit = parts.some((p) => p(ch));
      return negate ? !hit : hit;
    };
    return { t: "cls", label, test, a, b: i };
  }

  const ast = parseAlt(0);
  if (!ok(ast)) return ast;
  if (!eof()) return err(`unexpected '${peek()}'`, i);
  const anchored = startsAnchored(ast);
  return { ok: true, ast, anchored };
}

function ok<T>(x: T | ParseErr): x is T {
  return typeof x === "object" && x !== null && !("ok" in x && x.ok === false && "error" in x);
}

function startsAnchored(ast: Ast): boolean {
  if (ast.t === "bol") return true;
  if (ast.t === "cat") return ast.xs.length > 0 && startsAnchored(ast.xs[0]);
  if (ast.t === "grp") return startsAnchored(ast.e);
  if (ast.t === "alt") return ast.xs.every(startsAnchored);
  return false;
}

export function compile(ast: Ast): Op[] {
  const out: Op[] = [];

  const emit = <T extends Op>(op: T): number => {
    out.push(op);
    return out.length - 1;
  };

  const gen = (e: Ast) => {
    switch (e.t) {
      case "empty":
        return;
      case "lit":
        emit({ op: "char", c: e.c, a: e.a, b: e.b });
        return;
      case "any":
        emit({ op: "any", a: e.a, b: e.b });
        return;
      case "cls":
        emit({ op: "cls", label: e.label, test: e.test, a: e.a, b: e.b });
        return;
      case "bol":
        emit({ op: "bol", a: e.a, b: e.b });
        return;
      case "eol":
        emit({ op: "eol", a: e.a, b: e.b });
        return;
      case "cat":
        for (const x of e.xs) gen(x);
        return;
      case "grp":
        gen(e.e);
        return;
      case "alt": {
        const jmps: number[] = [];
        for (let k = 0; k < e.xs.length; k++) {
          if (k < e.xs.length - 1) {
            const s = emit({
              op: "split",
              x: 0,
              y: 0,
              why: "alt",
              a: e.a,
              b: e.b,
            });
            (out[s] as Extract<Op, { op: "split" }>).x = out.length;
            gen(e.xs[k]);
            jmps.push(emit({ op: "jmp", to: 0, a: e.a, b: e.b }));
            (out[s] as Extract<Op, { op: "split" }>).y = out.length;
          } else {
            gen(e.xs[k]);
          }
        }
        const end = out.length;
        for (const j of jmps) (out[j] as Extract<Op, { op: "jmp" }>).to = end;
        return;
      }
      case "rep": {
        const wrapAtomic = e.mode === "possessive";
        if (wrapAtomic) emit({ op: "enter_atomic", a: e.a, b: e.b });
        for (let k = 0; k < e.min; k++) gen(e.e);
        const extra = e.max === null ? null : e.max - e.min;
        if (extra === null) {
          star(e.e, e.mode === "lazy" ? "lazy" : "greedy", e.a, e.b);
        } else {
          for (let k = 0; k < extra; k++) opt(e.e, e.mode === "lazy" ? "lazy" : "greedy", e.a, e.b);
        }
        if (wrapAtomic) emit({ op: "commit", a: e.a, b: e.b });
        return;
      }
    }
  };

  const star = (e: Ast, mode: "greedy" | "lazy", a: number, b: number) => {
    const s = emit({ op: "split", x: 0, y: 0, why: "quant", a, b });
    const split = out[s] as Extract<Op, { op: "split" }>;
    if (mode === "greedy") {
      split.x = out.length;
      gen(e);
      emit({ op: "jmp", to: s, a, b });
      split.y = out.length;
    } else {
      split.y = out.length;
      gen(e);
      emit({ op: "jmp", to: s, a, b });
      split.x = out.length;
    }
  };

  const opt = (e: Ast, mode: "greedy" | "lazy", a: number, b: number) => {
    const s = emit({ op: "split", x: 0, y: 0, why: "opt", a, b });
    const split = out[s] as Extract<Op, { op: "split" }>;
    if (mode === "greedy") {
      split.x = out.length;
      gen(e);
      split.y = out.length;
    } else {
      split.y = out.length;
      gen(e);
      split.x = out.length;
    }
  };

  gen(ast);
  emit({ op: "match", a: ast.a, b: ast.b });
  return out;
}

export type ExecOpts = {
  input: string;
  /** Unanchored search, like `RegExp#exec` / `re.search`. Default true. */
  search?: boolean;
  stepLimit?: number;
  eventLimit?: number;
  /** If true, only try from index 0 (like `re.match`). */
  anchored?: boolean;
};

const DEFAULT_STEP = 80_000;
const DEFAULT_EVENTS = 2_400;

type Choice = {
  pc: number;
  sp: number;
  pathLen: number;
};

function opName(inst: Op): string {
  if (inst.op === "char") return `'${fmtChar(inst.c)}'`;
  if (inst.op === "cls") return inst.label;
  if (inst.op === "any") return ".";
  if (inst.op === "bol") return "^";
  if (inst.op === "eol") return "$";
  if (inst.op === "split") return inst.why === "alt" ? "|" : inst.why === "opt" ? "?" : "*";
  if (inst.op === "jmp") return "jmp";
  if (inst.op === "match") return "match";
  if (inst.op === "enter_atomic") return "atomic";
  return "commit";
}

export function fmtChar(c: string): string {
  if (c === " ") return "␣";
  if (c === "\n") return "\\n";
  if (c === "\t") return "\\t";
  return c;
}

function record(
  events: Event[],
  limit: number,
  ev: Omit<Event, "n"> & { n?: number },
  n: number,
) {
  if (events.length >= limit) return;
  events.push({ ...ev, n });
}

export function exec(prog: Op[], opts: ExecOpts): Omit<Run, "nfaSteps" | "nfaMatched" | "error" | "prog" | "ast" | "anchored"> {
  const input = opts.input;
  const n = input.length;
  const search = opts.search !== false;
  const stepLimit = opts.stepLimit ?? DEFAULT_STEP;
  const eventLimit = opts.eventLimit ?? DEFAULT_EVENTS;
  const forceAnchor = opts.anchored === true;

  const visits = Array.from({ length: n }, () => 0);
  const events: Event[] = [];
  let steps = 0;
  let splits = 0;
  let backs = 0;
  let eats = 0;
  let fails = 0;
  let cycles = 0;
  let capped = false;
  let startsTried = 0;
  let matched = false;
  let span: [number, number] | null = null;

  const last = forceAnchor || !search ? 0 : n;

  outer: for (let start = 0; start <= last; start++) {
    startsTried++;
    record(
      events,
      eventLimit,
      {
        pc: 0,
        sp: start,
        start,
        verb: "start",
        op: "start",
        detail:
          start === 0
            ? "Begin at the left of the input."
            : `The previous start failed. Try again from index ${start}.`,
        from: 0,
        to: 0,
      },
      steps,
    );

    const choices: Choice[] = [];
    const marks: number[] = [];
    const path: number[] = [];
    const pathSet = new Set<number>();
    let pc = 0;
    let sp = start;

    const keyOf = (p: number, s: number) => p * (n + 1) + s;

    const dropTo = (len: number) => {
      while (path.length > len) {
        const k = path.pop();
        if (k !== undefined) pathSet.delete(k);
      }
    };

    const backtrack = (): boolean => {
      const ch = choices.pop();
      if (!ch) return false;
      while (marks.length && marks[marks.length - 1] > choices.length) marks.pop();
      dropTo(ch.pathLen);
      pc = ch.pc;
      sp = ch.sp;
      backs++;
      const inst = prog[pc];
      record(
        events,
        eventLimit,
        {
          pc,
          sp,
          start,
          verb: "back",
          op: inst ? opName(inst) : "back",
          detail: `Give back. Resume at index ${sp}.`,
          from: inst?.a ?? 0,
          to: inst?.b ?? 0,
        },
        steps,
      );
      return true;
    };

    const failHere = (inst: Op, detail: string) => {
      fails++;
      record(
        events,
        eventLimit,
        {
          pc,
          sp,
          start,
          verb: "fail",
          op: opName(inst),
          detail,
          from: inst.a,
          to: inst.b,
        },
        steps,
      );
    };

    inner: for (;;) {
      steps++;
      if (steps > stepLimit) {
        capped = true;
        record(
          events,
          eventLimit,
          {
            pc,
            sp,
            start,
            verb: "cap",
            op: "cap",
            detail: `Stopped after ${stepLimit.toLocaleString("en-GB")} steps. A complete search would continue.`,
            from: 0,
            to: 0,
          },
          steps,
        );
        break outer;
      }

      const inst = prog[pc];
      if (!inst) break;

      const k = keyOf(pc, sp);
      if (pathSet.has(k)) {
        cycles++;
        record(
          events,
          eventLimit,
          {
            pc,
            sp,
            start,
            verb: "cycle",
            op: opName(inst),
            detail: "Same instruction at the same index on this path — empty loop, fail this thread.",
            from: inst.a,
            to: inst.b,
          },
          steps,
        );
        if (!backtrack()) break inner;
        continue;
      }
      pathSet.add(k);
      path.push(k);

      switch (inst.op) {
        case "char": {
          record(
            events,
            eventLimit,
            {
              pc,
              sp,
              start,
              verb: "try",
              op: opName(inst),
              detail:
                sp < n
                  ? `Need '${fmtChar(inst.c)}', looking at '${fmtChar(input[sp])}' (index ${sp}).`
                  : `Need '${fmtChar(inst.c)}', but the input has ended.`,
              from: inst.a,
              to: inst.b,
            },
            steps,
          );
          if (sp < n && input[sp] === inst.c) {
            visits[sp]++;
            eats++;
            record(
              events,
              eventLimit,
              {
                pc,
                sp: sp + 1,
                start,
                verb: "eat",
                op: opName(inst),
                detail: `Took '${fmtChar(inst.c)}'.`,
                from: inst.a,
                to: inst.b,
              },
              steps,
            );
            pc++;
            sp++;
          } else {
            failHere(
              inst,
              sp < n
                ? `'${fmtChar(input[sp])}' is not '${fmtChar(inst.c)}'.`
                : `Needed '${fmtChar(inst.c)}' and there is nothing left.`,
            );
            dropTo(path.length - 1);
            pathSet.delete(k);
            if (!backtrack()) break inner;
          }
          break;
        }
        case "any": {
          record(
            events,
            eventLimit,
            {
              pc,
              sp,
              start,
              verb: "try",
              op: ".",
              detail: sp < n ? `Dot, looking at '${fmtChar(input[sp])}'.` : "Dot, but the input has ended.",
              from: inst.a,
              to: inst.b,
            },
            steps,
          );
          if (sp < n && input[sp] !== "\n") {
            visits[sp]++;
            eats++;
            pc++;
            sp++;
          } else {
            failHere(inst, "Dot does not match here.");
            dropTo(path.length - 1);
            pathSet.delete(k);
            if (!backtrack()) break inner;
          }
          break;
        }
        case "cls": {
          record(
            events,
            eventLimit,
            {
              pc,
              sp,
              start,
              verb: "try",
              op: inst.label,
              detail:
                sp < n
                  ? `${inst.label} against '${fmtChar(input[sp])}'.`
                  : `${inst.label} at end of input.`,
              from: inst.a,
              to: inst.b,
            },
            steps,
          );
          if (sp < n && inst.test(input[sp])) {
            visits[sp]++;
            eats++;
            pc++;
            sp++;
          } else {
            failHere(inst, `${inst.label} does not match here.`);
            dropTo(path.length - 1);
            pathSet.delete(k);
            if (!backtrack()) break inner;
          }
          break;
        }
        case "bol": {
          if (sp === 0) {
            pc++;
          } else {
            failHere(inst, "^ only holds at the start of the input.");
            dropTo(path.length - 1);
            pathSet.delete(k);
            if (!backtrack()) break inner;
          }
          break;
        }
        case "eol": {
          if (sp === n) {
            pc++;
          } else {
            failHere(inst, "$ only holds at the end of the input.");
            dropTo(path.length - 1);
            pathSet.delete(k);
            if (!backtrack()) break inner;
          }
          break;
        }
        case "split": {
          splits++;
          const prefer =
            inst.why === "alt"
              ? "Try the left alternative first."
              : inst.why === "opt"
                ? "Greedy optional: try to take it."
                : "Greedy quantifier: try to take one more.";
          record(
            events,
            eventLimit,
            {
              pc,
              sp,
              start,
              verb: "split",
              op: opName(inst),
              detail: prefer,
              from: inst.a,
              to: inst.b,
            },
            steps,
          );
          choices.push({ pc: inst.y, sp, pathLen: path.length });
          pc = inst.x;
          break;
        }
        case "jmp": {
          pc = inst.to;
          break;
        }
        case "enter_atomic": {
          marks.push(choices.length);
          pc++;
          break;
        }
        case "commit": {
          const mark = marks.pop() ?? 0;
          while (choices.length > mark) choices.pop();
          pc++;
          break;
        }
        case "match": {
          matched = true;
          span = [start, sp];
          record(
            events,
            eventLimit,
            {
              pc,
              sp,
              start,
              verb: "match",
              op: "match",
              detail: `Match, indices ${start}–${sp}.`,
              from: inst.a,
              to: inst.b,
            },
            steps,
          );
          break outer;
        }
      }
    }
  }

  return {
    matched,
    span,
    steps,
    capped,
    visits,
    events,
    startsTried,
    splits,
    backs,
    eats,
    fails,
    cycles,
  };
}

/**
 * Thompson's construction executed simultaneously: at each input index,
 * every reachable instruction is processed once. The same (pc, sp) is never
 * retried, which is why this is O(|input| · |program|) and why RE2, Go
 * regexp and Rust's regex are immune to the explosion the backtracker shows.
 */
export function nfaExec(
  prog: Op[],
  input: string,
  opts?: { search?: boolean; anchored?: boolean },
): { matched: boolean; steps: number; span: [number, number] | null } {
  const n = input.length;
  const search = opts?.search !== false && !opts?.anchored;
  const last = search ? n : 0;
  let steps = 0;

  const close = (set: Set<number>, pc: number, sp: number) => {
    const stack = [pc];
    while (stack.length) {
      const p = stack.pop()!;
      if (set.has(p)) continue;
      const inst = prog[p];
      if (!inst) continue;
      set.add(p);
      steps++;
      if (inst.op === "split") {
        stack.push(inst.y, inst.x);
      } else if (inst.op === "jmp") {
        stack.push(inst.to);
      } else if (inst.op === "enter_atomic" || inst.op === "commit") {
        stack.push(p + 1);
      } else if (inst.op === "bol") {
        if (sp === 0) stack.push(p + 1);
      } else if (inst.op === "eol") {
        if (sp === n) stack.push(p + 1);
      }
    }
  };

  const hasMatch = (set: Set<number>) => {
    for (const p of set) if (prog[p]?.op === "match") return true;
    return false;
  };

  for (let start = 0; start <= last; start++) {
    let clist = new Set<number>();
    close(clist, 0, start);
    if (hasMatch(clist)) return { matched: true, steps, span: [start, start] };

    for (let sp = start; sp < n; sp++) {
      const ch = input[sp];
      const nlist = new Set<number>();
      for (const p of clist) {
        const inst = prog[p];
        if (!inst) continue;
        if (inst.op === "char" && inst.c === ch) close(nlist, p + 1, sp + 1);
        else if (inst.op === "any" && ch !== "\n") close(nlist, p + 1, sp + 1);
        else if (inst.op === "cls" && inst.test(ch)) close(nlist, p + 1, sp + 1);
      }
      clist = nlist;
      if (hasMatch(clist)) return { matched: true, steps, span: [start, sp + 1] };
      if (clist.size === 0) break;
    }

    if (hasMatch(clist)) return { matched: true, steps, span: [start, n] };
    const tail = new Set<number>();
    for (const p of clist) {
      if (prog[p]?.op === "eol") close(tail, p + 1, n);
    }
    if (hasMatch(tail)) return { matched: true, steps, span: [start, n] };
  }

  return { matched: false, steps, span: null };
}

export function run(pattern: string, input: string, opts?: Omit<ExecOpts, "input">): Run {
  const parsed = parse(pattern);
  if (!parsed.ok) {
    return {
      matched: false,
      span: null,
      steps: 0,
      capped: false,
      visits: Array.from({ length: input.length }, () => 0),
      events: [],
      startsTried: 0,
      splits: 0,
      backs: 0,
      eats: 0,
      fails: 0,
      cycles: 0,
      nfaSteps: 0,
      nfaMatched: false,
      error: parsed.error + (parsed.at >= 0 ? ` (at ${parsed.at})` : ""),
      prog: [],
      ast: null,
      anchored: false,
    };
  }
  const prog = compile(parsed.ast);
  const anchored = opts?.anchored ?? parsed.anchored;
  const back = exec(prog, { input, search: opts?.search, stepLimit: opts?.stepLimit, eventLimit: opts?.eventLimit, anchored });
  const nfa = nfaExec(prog, input, { search: opts?.search, anchored });
  return {
    ...back,
    nfaSteps: nfa.steps,
    nfaMatched: nfa.matched,
    error: null,
    prog,
    ast: parsed.ast,
    anchored,
  };
}

export function highlight(pattern: string, from: number, to: number): { before: string; mid: string; after: string } {
  return {
    before: pattern.slice(0, from),
    mid: pattern.slice(from, to),
    after: pattern.slice(to),
  };
}

export function fmtSteps(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)} billion`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)} million`;
  return n.toLocaleString("en-GB");
}

/** Closed form for the number of ways `(a|a)*` can consume n a's: 2^n. */
export function waysOr(n: number): number {
  if (n < 0 || n > 53) return Number.POSITIVE_INFINITY;
  return 2 ** n;
}

/**
 * Compositions of n into ordered positive parts: 2^{n-1}. That is how many
 * ways `(a+)+` can split a run of n a's — the nested-quantifier hazard.
 */
export function waysPlus(n: number): number {
  if (n <= 0) return n === 0 ? 1 : 0;
  if (n > 53) return Number.POSITIVE_INFINITY;
  return 2 ** (n - 1);
}

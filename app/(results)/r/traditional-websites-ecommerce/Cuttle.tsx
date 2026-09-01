"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from "react";

import {
  BY_SKU,
  FAMILIES,
  LINE_COUNT,
  money,
  productBySku,
  searchCatalogue,
  siblings,
} from "./catalog";
import s from "./cuttle.module.css";
import {
  ANSWERS,
  FOLLOW,
  JOBS,
  jobFromQuery,
  pickLine,
  type JobId,
} from "./knowledge";
import {
  CATEGORY_LABEL,
  CATALOGUE_CLAIM,
  type Category,
  type Mode,
  type Product,
  type Ticket,
  type TicketLine,
} from "./types";

const VAT = 0.2;
const STORAGE_TICKET = "cuttle-ticket";
const STORAGE_LAST = "cuttle-last";
const STORAGE_NO = "cuttle-ticket-no";

const DEPTS: Category[] = [
  "wood-screws",
  "machine-screws",
  "self-tappers",
  "nails",
  "bolts",
  "nuts",
  "washers",
  "plugs",
  "hinges",
  "locks",
  "chain",
  "hammers",
  "tools",
  "ironmongery",
];

function loadLines(): TicketLine[] {
  try {
    const raw = localStorage.getItem(STORAGE_TICKET);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as TicketLine[];
    return parsed.filter((l) => BY_SKU.has(l.sku) && l.qty > 0);
  } catch {
    return [];
  }
}

function loadLast(): Ticket | null {
  try {
    const raw = localStorage.getItem(STORAGE_LAST);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Ticket;
    parsed.lines = parsed.lines.filter((l) => BY_SKU.has(l.sku));
    return parsed.lines.length ? parsed : null;
  } catch {
    return null;
  }
}

function nextTicketId(): string {
  try {
    const n = Number(localStorage.getItem(STORAGE_NO) ?? "841") + 1;
    localStorage.setItem(STORAGE_NO, String(n));
    return `C-${String(n).padStart(4, "0")}`;
  } catch {
    return "C-0842";
  }
}

function stampSound() {
  const Ctx = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctx) return;
  const ctx = new Ctx();
  const t = ctx.currentTime;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = "square";
  osc.frequency.setValueAtTime(220, t);
  osc.frequency.exponentialRampToValueAtTime(70, t + 0.07);
  g.gain.setValueAtTime(0.06, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
  osc.connect(g);
  g.connect(ctx.destination);
  osc.start(t);
  osc.stop(t + 0.11);
  osc.onended = () => void ctx.close();
}

function goodsPence(lines: TicketLine[]): number {
  return lines.reduce((sum, line) => {
    const p = BY_SKU.get(line.sku);
    return p ? sum + p.pricePence * line.qty : sum;
  }, 0);
}

function soldAs(p: Product): string {
  if (p.unit === "metre") return "per metre";
  if (p.unit === "each") return "each";
  if (p.packQty >= 100) return `box of ${String(p.packQty)}`;
  if (p.packQty > 1) return `card of ${String(p.packQty)}`;
  return "each";
}

export default function Cuttle() {
  const searchId = useId();
  const skuId = useId();
  const skuRef = useRef<HTMLInputElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const [mode, setMode] = useState<Mode>("shutter");
  const [from, setFrom] = useState<"trade" | "ask">("trade");
  const [sku, setSku] = useState<string | null>(null);
  const [lines, setLines] = useState<TicketLine[]>([]);
  const [last, setLast] = useState<Ticket | null>(null);
  const [ready, setReady] = useState(false);
  const [tradeQ, setTradeQ] = useState("");
  const [searchQ, setSearchQ] = useState("");
  const [dept, setDept] = useState<Category | null>(null);
  const [familyId, setFamilyId] = useState<string | null>(null);
  const [job, setJob] = useState<JobId | null>(null);
  const [answerId, setAnswerId] = useState<string | null>(null);
  const [qty, setQty] = useState(1);
  const [ticketOpen, setTicketOpen] = useState(false);
  const [name, setName] = useState("");
  const [collect, setCollect] = useState<"yard" | "van">("yard");
  const [phone, setPhone] = useState("");
  const [done, setDone] = useState<Ticket | null>(null);
  const [armed, setArmed] = useState(false);

  useEffect(() => {
    setLines(loadLines());
    setLast(loadLast());
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(STORAGE_TICKET, JSON.stringify(lines));
  }, [lines, ready]);

  const open = useCallback((next: "trade" | "ask") => {
    setArmed(true);
    setFrom(next);
    setMode(next);
    setTicketOpen(false);
    if (next === "trade") {
      window.setTimeout(() => skuRef.current?.focus(), 40);
    }
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      const typing = tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
      if (mode === "shutter" && !typing) {
        if (e.key === "t" || e.key === "T") {
          e.preventDefault();
          open("trade");
        }
        if (e.key === "a" || e.key === "A") {
          e.preventDefault();
          open("ask");
        }
      }
      if (e.key === "Escape") {
        if (ticketOpen) {
          setTicketOpen(false);
          return;
        }
        if (mode === "product") {
          setMode(from);
          return;
        }
        if (mode === "checkout") {
          setMode(from);
          return;
        }
        if (mode === "trade" || mode === "ask") {
          setMode("shutter");
        }
      }
      if (e.key === "/" && !typing && mode !== "shutter") {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mode, from, ticketOpen, open]);

  const product = sku ? BY_SKU.get(sku) : undefined;
  const goods = goodsPence(lines);
  const vat = Math.round(goods * VAT);
  const total = goods + vat;
  const count = lines.reduce((n, l) => n + l.qty, 0);

  const addLine = (nextSku: string, addQty: number) => {
    if (!BY_SKU.has(nextSku) || addQty < 1) return;
    setLines((prev) => {
      const i = prev.findIndex((l) => l.sku === nextSku);
      if (i === -1) return [...prev, { sku: nextSku, qty: addQty }];
      return prev.map((l, idx) => (idx === i ? { ...l, qty: l.qty + addQty } : l));
    });
    setTicketOpen(true);
    if (armed) stampSound();
  };

  const showProduct = (next: Product, origin: "trade" | "ask") => {
    setSku(next.sku);
    setFrom(origin);
    setQty(1);
    setMode("product");
  };

  const place = () => {
    const id = nextTicketId();
    const ticket: Ticket = {
      id,
      lines: [...lines],
      placedAt: new Date().toISOString(),
    };
    setDone(ticket);
    localStorage.setItem(STORAGE_LAST, JSON.stringify(ticket));
    setLast(ticket);
    setLines([]);
    localStorage.removeItem(STORAGE_TICKET);
    setMode("done");
    setTicketOpen(false);
    if (armed) stampSound();
  };

  return (
    <div className={s.root} data-mode={mode}>
      <a className={s.skip} href="#main">
        Skip to the counter
      </a>

      {mode === "shutter" ? (
        <Shutter onTrade={() => open("trade")} onAsk={() => open("ask")} last={last} />
      ) : (
        <>
          <header className={s.mast}>
            <button type="button" className={s.word} onClick={() => setMode("shutter")} aria-label="Cuttle, close the counter">
              <span className={s.wordKicker}>Est. 1886</span>
              Cuttle
            </button>
            <label className={s.searchLabel} htmlFor={searchId}>
              Look up
              <input
                id={searchId}
                ref={searchRef}
                className={s.search}
                type="search"
                value={searchQ}
                autoComplete="off"
                spellCheck={false}
                placeholder="SKU, or the job — oak outdoors…"
                onChange={(e) => setSearchQ(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key !== "Enter") return;
                  const q = searchQ.trim();
                  if (!q) return;
                  const known = jobFromQuery(q);
                  if (known) {
                    setJob(null);
                    setAnswerId(known.id);
                    setFrom("ask");
                    setMode("ask");
                    setSearchQ("");
                    return;
                  }
                  const hit = productBySku(q);
                  if (hit) {
                    showProduct(hit, from);
                    setSearchQ("");
                  }
                }}
              />
            </label>
            <nav className={s.mastNav} aria-label="Counter">
              <button
                type="button"
                className={s.mastBtn}
                data-on={mode === "trade" || (mode === "product" && from === "trade") ? "1" : "0"}
                onClick={() => {
                  setFrom("trade");
                  setMode("trade");
                }}
              >
                Trade
              </button>
              <button
                type="button"
                className={s.mastBtn}
                data-on={mode === "ask" || (mode === "product" && from === "ask") ? "1" : "0"}
                onClick={() => {
                  setFrom("ask");
                  setMode("ask");
                }}
              >
                Ask
              </button>
              <button
                type="button"
                className={s.ticketBtn}
                onClick={() => setTicketOpen((v) => !v)}
                aria-expanded={ticketOpen}
              >
                Ticket
                <span className={s.ticketN}>{count}</span>
              </button>
            </nav>
          </header>

          <div className={s.floor}>
            <main id="main" className={s.desk}>
              {searchQ.trim() ? (
                <SearchPanel
                  q={searchQ}
                  onClear={() => setSearchQ("")}
                  onProduct={(p) => {
                    setSearchQ("");
                    showProduct(p, from);
                  }}
                  onFamily={(id) => {
                    setSearchQ("");
                    setDept(FAMILIES.find((f) => f.id === id)?.category ?? null);
                    setFamilyId(id);
                    setFrom("trade");
                    setMode("trade");
                  }}
                  onJob={(id) => {
                    setSearchQ("");
                    setAnswerId(id);
                    setFrom("ask");
                    setMode("ask");
                  }}
                />
              ) : null}

              {mode === "trade" && !searchQ.trim() ? (
                <TradeDesk
                  skuId={skuId}
                  skuRef={skuRef}
                  tradeQ={tradeQ}
                  setTradeQ={setTradeQ}
                  last={last}
                  dept={dept}
                  setDept={setDept}
                  familyId={familyId}
                  setFamilyId={setFamilyId}
                  onProduct={(p) => showProduct(p, "trade")}
                  onReorder={(ticket) => {
                    setLines((prev) => {
                      const next = [...prev];
                      for (const line of ticket.lines) {
                        const i = next.findIndex((l) => l.sku === line.sku);
                        if (i === -1) next.push({ ...line });
                        else next[i] = { ...next[i], qty: next[i].qty + line.qty };
                      }
                      return next;
                    });
                    setTicketOpen(true);
                    if (armed) stampSound();
                  }}
                />
              ) : null}

              {mode === "ask" && !searchQ.trim() ? (
                <AskDesk
                  job={job}
                  setJob={(id) => {
                    setJob(id);
                    setAnswerId(null);
                  }}
                  answerId={answerId}
                  setAnswerId={setAnswerId}
                  onProduct={(p) => showProduct(p, "ask")}
                  onAdd={(p) => addLine(p.sku, 1)}
                />
              ) : null}

              {mode === "product" && product && !searchQ.trim() ? (
                <ProductPage
                  product={product}
                  qty={qty}
                  setQty={setQty}
                  onPick={(p) => {
                    setSku(p.sku);
                    setQty(1);
                  }}
                  onAdd={() => addLine(product.sku, qty)}
                  onBack={() => setMode(from)}
                  backLabel={from === "ask" ? "Back to the ask" : "Back to the trade desk"}
                />
              ) : null}

              {mode === "checkout" && !searchQ.trim() ? (
                <Checkout
                  lines={lines}
                  goods={goods}
                  vat={vat}
                  total={total}
                  name={name}
                  setName={setName}
                  collect={collect}
                  setCollect={setCollect}
                  phone={phone}
                  setPhone={setPhone}
                  onPlace={place}
                  onBack={() => setMode(from)}
                />
              ) : null}

              {mode === "done" && done && !searchQ.trim() ? (
                <Done ticket={done} name={name} collect={collect} onAgain={() => {
                  setMode("shutter");
                  setName("");
                  setPhone("");
                  setJob(null);
                  setAnswerId(null);
                  setDept(null);
                  setFamilyId(null);
                }} />
              ) : null}
            </main>

            <aside className={s.slip} data-open={ticketOpen ? "1" : "0"} aria-label="Ticket">
              <div className={s.slipHead}>
                <h2>Ticket</h2>
                <p>Prices ex VAT. Modelled. Nothing is charged.</p>
                <button type="button" className={s.slipClose} onClick={() => setTicketOpen(false)}>
                  Close
                </button>
              </div>
              {lines.length === 0 ? (
                <p className={s.empty}>Nothing on the ticket yet.</p>
              ) : (
                <ul className={s.slipList}>
                  {lines.map((line) => {
                    const p = BY_SKU.get(line.sku);
                    if (!p) return null;
                    return (
                      <li key={line.sku}>
                        <div>
                          <button
                            type="button"
                            className={s.slipOpen}
                            onClick={() => {
                              showProduct(p, from);
                              setTicketOpen(false);
                            }}
                          >
                            <p className={s.slipSku}>{p.sku}</p>
                            <p className={s.slipName}>{p.name}</p>
                          </button>
                          <p className={s.slipMeta}>
                            {soldAs(p)} · {money(p.pricePence)}
                          </p>
                        </div>
                        <div className={s.slipQty}>
                          <button
                            type="button"
                            aria-label="Fewer"
                            onClick={() =>
                              setLines((prev) =>
                                prev
                                  .map((l) => (l.sku === line.sku ? { ...l, qty: l.qty - 1 } : l))
                                  .filter((l) => l.qty > 0),
                              )
                            }
                          >
                            −
                          </button>
                          <span>{line.qty}</span>
                          <button
                            type="button"
                            aria-label="More"
                            onClick={() =>
                              setLines((prev) =>
                                prev.map((l) => (l.sku === line.sku ? { ...l, qty: l.qty + 1 } : l)),
                              )
                            }
                          >
                            +
                          </button>
                        </div>
                        <p className={s.slipSum}>{money(p.pricePence * line.qty)}</p>
                      </li>
                    );
                  })}
                </ul>
              )}
              <dl className={s.slipTot}>
                <div>
                  <dt>Goods</dt>
                  <dd>{money(goods)}</dd>
                </div>
                <div>
                  <dt>VAT 20%</dt>
                  <dd>{money(vat)}</dd>
                </div>
                <div data-strong="1">
                  <dt>Ticket</dt>
                  <dd>{money(total)}</dd>
                </div>
              </dl>
              <button
                type="button"
                className={s.checkout}
                disabled={lines.length === 0 || mode === "done"}
                onClick={() => {
                  setTicketOpen(false);
                  setMode("checkout");
                }}
              >
                Make up the ticket
              </button>
            </aside>
          </div>
        </>
      )}

      <p className={s.brief}>
        <Link href="/tasks/traditional-websites-ecommerce" prefetch={false}>
          Brief
        </Link>
      </p>
    </div>
  );
}

function Shutter({
  onTrade,
  onAsk,
  last,
}: {
  onTrade: () => void;
  onAsk: () => void;
  last: Ticket | null;
}) {
  return (
    <main id="main" className={s.shutter}>
      <dl className={s.hours}>
        <div>
          <dt>Counter</dt>
          <dd>Mon–Fri 07:00–16:30</dd>
        </div>
        <div>
          <dt>Saturday</dt>
          <dd>08:00–12:00</dd>
        </div>
        <div>
          <dt>Sunday</dt>
          <dd>Shut</dd>
        </div>
        <div>
          <dt>Yard</dt>
          <dd>14 Sheep Street, Kettleton</dd>
        </div>
        <div>
          <dt>Telephone</dt>
          <dd>01632 960 188</dd>
        </div>
      </dl>
      <div className={s.enamel}>
        <p className={s.est}>Established 1886</p>
        <h1 className={s.cuttle}>Cuttle</h1>
        <p className={s.iron}>Ironmonger</p>
        <p className={s.please}>Please state your business</p>
      </div>
      <div className={s.doors}>
        <button type="button" className={s.door} onClick={onTrade} aria-label="Trade">
          <span className={s.doorKicker}>Press T</span>
          <span className={s.doorTitle}>Trade</span>
          <span className={s.doorCopy}>
            I know the SKU, or I want last time again. A box of two hundred. No theatre.
          </span>
          {last ? (
            <span className={s.doorLast}>Last ticket {last.id} · {last.lines.length} lines</span>
          ) : null}
        </button>
        <button type="button" className={s.door} data-ask="1" onClick={onAsk} aria-label="Ask">
          <span className={s.doorKicker}>Press A</span>
          <span className={s.doorTitle}>Ask</span>
          <span className={s.doorCopy}>
            Something broke. I do not know the name. Tell the counter the job.
          </span>
        </button>
      </div>
      <ul className={s.notices}>
        <li>No credit under forty pounds</li>
        <li>Trade prices, VAT on the ticket</li>
        <li>Chain cut to the metre</li>
        <li>Thursday van inside twelve miles</li>
        <li>Ask if the photograph would not tell you</li>
      </ul>
      <p className={s.honest}>
        Modelled stock of {LINE_COUNT.toLocaleString("en-GB")} lines, generated from trade
        dimensions — material, head, drive, gauge, length, finish, pack — standing in for a
        counter of about {CATALOGUE_CLAIM.toLocaleString("en-GB")}. Thirty-one wood-screw
        families, eleven hammers, chain by the metre. Thread pitch is from common British
        tables, not a box we measured. Prices are invented. Nothing here can be ordered.
      </p>
    </main>
  );
}

function SearchPanel({
  q,
  onClear,
  onProduct,
  onFamily,
  onJob,
}: {
  q: string;
  onClear: () => void;
  onProduct: (p: Product) => void;
  onFamily: (id: string) => void;
  onJob: (id: string) => void;
}) {
  const known = jobFromQuery(q);
  const hit = useMemo(() => searchCatalogue(q), [q]);

  return (
    <section className={s.panel} aria-label="Look-up">
      <div className={s.panelHead}>
        <h2>Look-up</h2>
        <button type="button" onClick={onClear}>
          Clear
        </button>
      </div>
      {known ? (
        <div className={s.advice}>
          <p className={s.adviceKicker}>The counter would say</p>
          <p>{known.said}</p>
          <button type="button" className={s.textBtn} onClick={() => onJob(known.id)}>
            Open that answer
          </button>
        </div>
      ) : null}
      {hit.kind === "exact" ? (
        <button type="button" className={s.lineBtn} onClick={() => onProduct(hit.product)}>
          <span className={s.mono}>{hit.product.sku}</span>
          <span>{hit.product.name}</span>
        </button>
      ) : null}
      {hit.kind === "narrow" ? (
        <>
          <p className={s.reason}>{hit.reason}</p>
          <ul className={s.familyList}>
            {hit.families.map((f) => (
              <li key={f.id}>
                <button type="button" onClick={() => onFamily(f.id)}>
                  {f.name}
                </button>
              </li>
            ))}
          </ul>
        </>
      ) : null}
      {hit.kind === "family" ? (
        <>
          <p className={s.reason}>
            That is the {hit.family.name} family. Sizes are a table, not a pile of photographs.
          </p>
          <button type="button" className={s.textBtn} onClick={() => onFamily(hit.family.id)}>
            Open the size table
          </button>
        </>
      ) : null}
      {hit.kind === "list" ? (
        <ul className={s.familyList}>
          {hit.products.map((p) => (
            <li key={p.sku}>
              <button type="button" className={s.lineBtn} onClick={() => onProduct(p)}>
                <span className={s.mono}>{p.sku}</span>
                <span>{p.name}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      {hit.kind === "empty" && !known ? (
        <p className={s.reason}>
          Nothing under that name. Try a SKU, or say the job — oak outdoors, hinge pulled out,
          front door lock.
        </p>
      ) : null}
    </section>
  );
}

function TradeDesk({
  skuId,
  skuRef,
  tradeQ,
  setTradeQ,
  last,
  dept,
  setDept,
  familyId,
  setFamilyId,
  onProduct,
  onReorder,
}: {
  skuId: string;
  skuRef: RefObject<HTMLInputElement | null>;
  tradeQ: string;
  setTradeQ: (v: string) => void;
  last: Ticket | null;
  dept: Category | null;
  setDept: (c: Category | null) => void;
  familyId: string | null;
  setFamilyId: (id: string | null) => void;
  onProduct: (p: Product) => void;
  onReorder: (t: Ticket) => void;
}) {
  const match = productBySku(tradeQ);
  const prefix = tradeQ.trim().length >= 3
    ? FAMILIES.filter((f) => f.id.toLowerCase().includes(tradeQ.trim().toLowerCase()) || f.name.toLowerCase().includes(tradeQ.trim().toLowerCase())).slice(0, 6)
    : [];
  const families = dept ? FAMILIES.filter((f) => f.category === dept) : [];
  const family = FAMILIES.find((f) => f.id === familyId);

  return (
    <section className={s.panel}>
      <p className={s.deskKicker}>Trade desk</p>
      <h2 className={s.deskTitle}>SKU, last ticket, or the board</h2>
      <label className={s.skuLabel} htmlFor={skuId}>
        SKU
        <input
          id={skuId}
          ref={skuRef}
          className={s.sku}
          value={tradeQ}
          autoComplete="off"
          spellCheck={false}
          placeholder="WS-A2-CSK-PZ-8-50-200"
          onChange={(e) => setTradeQ(e.target.value.toUpperCase())}
          onKeyDown={(e) => {
            if (e.key === "Enter" && match) onProduct(match);
          }}
        />
      </label>
      {match ? (
        <button type="button" className={s.lineBtn} onClick={() => onProduct(match)}>
          <span className={s.mono}>{match.sku}</span>
          <span>
            {match.name} · {soldAs(match)} · {money(match.pricePence)}
          </span>
        </button>
      ) : prefix.length > 0 && !match ? (
        <ul className={s.familyList}>
          {prefix.map((f) => (
            <li key={f.id}>
              <button
                type="button"
                onClick={() => {
                  setDept(f.category);
                  setFamilyId(f.id);
                }}
              >
                {f.name}
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {last ? (
        <div className={s.last}>
          <div>
            <p className={s.adviceKicker}>Last ticket {last.id}</p>
            <p>
              {last.lines.length} lines ·{" "}
              {money(goodsPence(last.lines) + Math.round(goodsPence(last.lines) * VAT))} inc VAT
            </p>
          </div>
          <button type="button" className={s.textBtn} onClick={() => onReorder(last)}>
            Same again
          </button>
        </div>
      ) : (
        <p className={s.hint}>
          No last ticket on this machine. A finished ticket will sit here so the next box is thirty
          seconds, not a search.
        </p>
      )}

      <h3 className={s.boardTitle}>The board</h3>
      <p className={s.hint}>
        Departments, then families, then a size table. Not a grid of the same photograph four
        hundred times.
      </p>
      <ul className={s.board}>
        {DEPTS.map((c) => (
          <li key={c}>
            <button
              type="button"
              data-on={dept === c ? "1" : "0"}
              onClick={() => {
                setDept(c);
                setFamilyId(null);
              }}
            >
              {CATEGORY_LABEL[c]}
            </button>
          </li>
        ))}
      </ul>

      {dept && !familyId ? (
        <ul className={s.familyList}>
          {families.map((f) => (
            <li key={f.id}>
              <button type="button" onClick={() => setFamilyId(f.id)}>
                <span>{f.name}</span>
                <span className={s.muted}>{f.skus.length} lines</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {family ? (
        <FamilyTable
          familyId={family.id}
          title={family.name}
          onProduct={onProduct}
          onBack={() => setFamilyId(null)}
        />
      ) : null}
    </section>
  );
}

function FamilyTable({
  familyId,
  title,
  onProduct,
  onBack,
}: {
  familyId: string;
  title: string;
  onProduct: (p: Product) => void;
  onBack: () => void;
}) {
  const rows = PRODUCTS_BY_FAMILY(familyId);
  const sample = rows[0];
  return (
    <div className={s.matrixWrap}>
      <div className={s.panelHead}>
        <h3>{title}</h3>
        <button type="button" onClick={onBack}>
          Families
        </button>
      </div>
      {sample ? <p className={s.counterNote}>{sample.counterNote}</p> : null}
      <div className={s.tableScroll}>
        <table className={s.matrix}>
          <caption className={s.vh}>Sizes and packs in this family</caption>
          <thead>
            <tr>
              <th scope="col">Line</th>
              <th scope="col">Pack</th>
              <th scope="col">ex VAT</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => (
              <tr key={p.sku}>
                <td>
                  <button type="button" className={s.cell} onClick={() => onProduct(p)}>
                    <span className={s.mono}>{p.sku}</span>
                    <span>{matrixLabel(p)}</span>
                  </button>
                </td>
                <td>{soldAs(p)}</td>
                <td>{money(p.pricePence)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PRODUCTS_BY_FAMILY(id: string): Product[] {
  const all = siblings({ familyId: id } as Product).sort((a, b) => a.sku.localeCompare(b.sku));
  return uniqueSizes(all);
}

function matrixLabel(p: Product): string {
  const gauge = p.specs.find((x) => x.label === "Gauge")?.value;
  const length = p.specs.find((x) => x.label === "Length")?.value;
  const thread = p.specs.find((x) => x.label === "Thread")?.value;
  const size = p.specs.find((x) => x.label === "Size")?.value;
  return [gauge, length ?? size, thread && !gauge ? thread : null].filter(Boolean).join(" · ") || p.name;
}

function AskDesk({
  job,
  setJob,
  answerId,
  setAnswerId,
  onProduct,
  onAdd,
}: {
  job: JobId | null;
  setJob: (id: JobId) => void;
  answerId: string | null;
  setAnswerId: (id: string) => void;
  onProduct: (p: Product) => void;
  onAdd: (p: Product) => void;
}) {
  const answer = answerId ? ANSWERS[answerId] : undefined;
  const line = answer ? pickLine(answer) : undefined;
  const follows = job ? FOLLOW[job] : [];

  return (
    <section className={s.panel}>
      <p className={s.deskKicker}>Ask the counter</p>
      <h2 className={s.deskTitle}>What is the job</h2>
      <p className={s.hint}>
        Names are what the tradesperson already has. If you do not have the name, say what broke.
      </p>
      <ul className={s.jobs}>
        {JOBS.map((j) => (
          <li key={j.id}>
            <button type="button" data-on={job === j.id ? "1" : "0"} onClick={() => setJob(j.id)}>
              {j.title}
            </button>
          </li>
        ))}
      </ul>
      {job ? (
        <>
          <h3 className={s.boardTitle}>{JOBS.find((j) => j.id === job)?.ask}</h3>
          <ul className={s.jobs}>
            {follows.map((f) => (
              <li key={f.id}>
                <button
                  type="button"
                  data-on={answerId === f.id ? "1" : "0"}
                  onClick={() => setAnswerId(f.id)}
                >
                  {f.label}
                </button>
              </li>
            ))}
          </ul>
        </>
      ) : null}
      {answer && line ? (
        <div className={s.advice}>
          <p className={s.adviceKicker}>The counter</p>
          <p>{answer.said}</p>
          <p className={s.warn}>{answer.warn}</p>
          <div className={s.reco}>
            <p className={s.mono}>{line.sku}</p>
            <p>{line.name}</p>
            <p>
              {soldAs(line)} · {money(line.pricePence)} ex VAT
            </p>
            <div className={s.recoBtns}>
              <button type="button" className={s.textBtn} onClick={() => onProduct(line)}>
                The line — specs, sizes, thread
              </button>
              <button type="button" className={s.add} onClick={() => onAdd(line)}>
                Put it on the ticket
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function ProductPage({
  product,
  qty,
  setQty,
  onPick,
  onAdd,
  onBack,
  backLabel,
}: {
  product: Product;
  qty: number;
  setQty: (n: number) => void;
  onPick: (p: Product) => void;
  onAdd: () => void;
  onBack: () => void;
  backLabel: string;
}) {
  const kin = siblings(product);
  const packs = kin.filter((p) => sameSize(p, product) && p.sku !== product.sku);
  const sizes = uniqueSizes(kin);

  return (
    <article className={s.product}>
      <button type="button" className={s.back} onClick={onBack}>
        {backLabel}
      </button>
      <p className={s.mono}>{product.sku}</p>
      <h2>{product.name}</h2>
      <p className={s.family}>{product.familyName}</p>
      <p className={s.counterNote}>{product.counterNote}</p>
      <dl className={s.specs}>
        {product.specs.map((row) => (
          <div key={row.label}>
            <dt>{row.label}</dt>
            <dd>{row.value}</dd>
          </div>
        ))}
        <div>
          <dt>Price</dt>
          <dd>
            {money(product.pricePence)} ex VAT · {soldAs(product)}
          </dd>
        </div>
      </dl>
      <div className={s.forGrid}>
        <div>
          <h3>What it is for</h3>
          <ul>
            {product.for.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
        </div>
        <div>
          <h3>Not for</h3>
          <ul>
            {product.notFor.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
        </div>
      </div>
      {sizes.length > 1 ? (
        <div>
          <h3 className={s.boardTitle}>Other sizes in this family</h3>
          <ul className={s.sizeChips}>
            {sizes.map((row) => (
              <li key={row.sku}>
                <button
                  type="button"
                  data-on={sameSize(row, product) ? "1" : "0"}
                  onClick={() => onPick(row)}
                >
                  {matrixLabel(row)}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {packs.length > 0 ? (
        <div>
          <h3 className={s.boardTitle}>Pack</h3>
          <ul className={s.sizeChips}>
            <li>
              <button type="button" data-on="1">
                {soldAs(product)}
              </button>
            </li>
            {packs.map((p) => (
              <li key={p.sku}>
                <button type="button" onClick={() => onPick(p)}>
                  {soldAs(p)} · {money(p.pricePence)}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      <div className={s.buy}>
        <label>
          {product.unit === "metre" ? "Metres" : "How many"}
          <input
            type="number"
            min={1}
            max={99}
            value={qty}
            onChange={(e) => setQty(Math.max(1, Math.min(99, Number(e.target.value) || 1)))}
          />
        </label>
        <button type="button" className={s.add} onClick={onAdd}>
          Put {qty === 1 ? "it" : `${String(qty)}`} on the ticket · {money(product.pricePence * qty)}
        </button>
      </div>
      <p className={s.hint}>
        Modelled line. Thread and TPI from common tables. Not a photograph — the difference is in
        the spec.
      </p>
    </article>
  );
}

function sameSize(a: Product, b: Product): boolean {
  const pick = (p: Product) =>
    ["Gauge", "Length", "Thread", "Size"]
      .map((k) => p.specs.find((x) => x.label === k)?.value ?? "")
      .join("|");
  return pick(a) === pick(b);
}

function uniqueSizes(list: Product[]): Product[] {
  const seen = new Set<string>();
  const out: Product[] = [];
  for (const p of list) {
    const key = ["Gauge", "Length", "Thread", "Size"]
      .map((k) => p.specs.find((x) => x.label === k)?.value ?? "")
      .join("|");
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(p);
  }
  return out;
}

function Checkout({
  lines,
  goods,
  vat,
  total,
  name,
  setName,
  collect,
  setCollect,
  phone,
  setPhone,
  onPlace,
  onBack,
}: {
  lines: TicketLine[];
  goods: number;
  vat: number;
  total: number;
  name: string;
  setName: (v: string) => void;
  collect: "yard" | "van";
  setCollect: (v: "yard" | "van") => void;
  phone: string;
  setPhone: (v: string) => void;
  onPlace: () => void;
  onBack: () => void;
}) {
  const can = name.trim().length > 1 && (collect === "yard" || phone.trim().length > 8);
  return (
    <section className={s.panel}>
      <button type="button" className={s.back} onClick={onBack}>
        Back to the desk
      </button>
      <p className={s.deskKicker}>Make up the ticket</p>
      <h2 className={s.deskTitle}>Collection, not a basket</h2>
      <p className={s.hint}>
        Trade prices, VAT on top. Collect from the yard on Sheep Street, or the Thursday van
        inside twelve miles. This is a demonstration. The ticket will be stamped and nothing will
        be charged.
      </p>
      <ul className={s.slipList}>
        {lines.map((line) => {
          const p = BY_SKU.get(line.sku);
          if (!p) return null;
          return (
            <li key={line.sku}>
              <div>
                <p className={s.slipSku}>{p.sku}</p>
                <p className={s.slipName}>{p.name}</p>
              </div>
              <p>
                {line.qty} × {soldAs(p)}
              </p>
              <p className={s.slipSum}>{money(p.pricePence * line.qty)}</p>
            </li>
          );
        })}
      </ul>
      <dl className={s.slipTot}>
        <div>
          <dt>Goods</dt>
          <dd>{money(goods)}</dd>
        </div>
        <div>
          <dt>VAT 20%</dt>
          <dd>{money(vat)}</dd>
        </div>
        <div data-strong="1">
          <dt>Ticket</dt>
          <dd>{money(total)}</dd>
        </div>
      </dl>
      <label className={s.field}>
        Name, or the account
        <input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
      </label>
      <fieldset className={s.fieldset}>
        <legend>How it leaves</legend>
        <label>
          <input
            type="radio"
            name="collect"
            checked={collect === "yard"}
            onChange={() => setCollect("yard")}
          />
          Collect from the yard, Sheep Street
        </label>
        <label>
          <input
            type="radio"
            name="collect"
            checked={collect === "van"}
            onChange={() => setCollect("van")}
          />
          Thursday van, inside twelve miles
        </label>
      </fieldset>
      {collect === "van" ? (
        <label className={s.field}>
          Telephone for the van
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            autoComplete="tel"
          />
        </label>
      ) : null}
      <button type="button" className={s.add} disabled={!can} onClick={onPlace}>
        Stamp the ticket
      </button>
    </section>
  );
}

function Done({
  ticket,
  name,
  collect,
  onAgain,
}: {
  ticket: Ticket;
  name: string;
  collect: "yard" | "van";
  onAgain: () => void;
}) {
  const goods = goodsPence(ticket.lines);
  const vat = Math.round(goods * VAT);
  return (
    <section className={s.panel}>
      <p className={s.deskKicker}>Stamped</p>
      <h2 className={s.deskTitle}>{ticket.id}</h2>
      <p>
        {name.trim() || "Counter sale"} ·{" "}
        {collect === "yard" ? "Collect from the yard" : "Thursday van"}
      </p>
      <p className={s.hint}>
        A demonstration ticket. Nothing was ordered, reserved, or charged. The last ticket will be
        waiting on the trade desk if you come back.
      </p>
      <ul className={s.slipList}>
        {ticket.lines.map((line) => {
          const p = BY_SKU.get(line.sku);
          if (!p) return null;
          return (
            <li key={line.sku}>
              <div>
                <p className={s.slipSku}>{p.sku}</p>
                <p className={s.slipName}>{p.name}</p>
              </div>
              <p>× {line.qty}</p>
              <p className={s.slipSum}>{money(p.pricePence * line.qty)}</p>
            </li>
          );
        })}
      </ul>
      <p className={s.mono}>
        Goods {money(goods)} · VAT {money(vat)} · Ticket {money(goods + vat)}
      </p>
      <button type="button" className={s.textBtn} onClick={onAgain}>
        Close the shutter
      </button>
    </section>
  );
}

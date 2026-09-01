"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";

import { BASE, NAV, TASK, VERSION, href, pageBySlug } from "./catalog";
import s from "./docs.module.css";
import { HINTS, searchDocs, type Hit } from "./search";

function kindLabel(kind: string): string {
  if (kind === "api") return "API";
  if (kind === "concept") return "Concept";
  if (kind === "guide") return "Guide";
  if (kind === "limit") return "Limits";
  if (kind === "migrate") return "Migrate";
  return "Docs";
}

function mark(text: string, q: string): ReactNode {
  const query = q.trim();
  if (!query) return text;
  const i = text.toLowerCase().indexOf(query.toLowerCase());
  if (i < 0) return text;
  return (
    <>
      {text.slice(0, i)}
      <mark className={s.mark}>{text.slice(i, i + query.length)}</mark>
      {text.slice(i + query.length)}
    </>
  );
}

export function Shell({
  slug,
  children,
}: {
  slug: string;
  children: ReactNode;
}) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const [active, setActive] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  const listId = useId();
  const hits = q.trim() ? searchDocs(q) : [];

  const go = useCallback(
    (hit: Hit) => {
      const hash = hit.rec.hash ? `#${hit.rec.hash}` : "";
      router.push(`${href(hit.rec.slug)}${hash}`);
      setQ("");
      setOpen(false);
      setNavOpen(false);
      input.current?.blur();
    },
    [router],
  );

  useEffect(() => {
    setNavOpen(false);
    setOpen(false);
    setQ("");
  }, [slug]);

  useEffect(() => {
    function onKey(e: KeyboardEvent | globalThis.KeyboardEvent) {
      const tag = (e.target as HTMLElement | null)?.tagName;
      const typing =
        tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || (e.target as HTMLElement | null)?.isContentEditable;
      if (e.key === "/" && !typing && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        input.current?.focus();
        setOpen(true);
      }
      if (e.key === "Escape") {
        setOpen(false);
        setNavOpen(false);
        input.current?.blur();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    setActive(0);
  }, [q]);

  function onInputKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((n) => Math.min(n + 1, Math.max(hits.length - 1, 0)));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((n) => Math.max(n - 1, 0));
    } else if (e.key === "Enter" && hits[active]) {
      e.preventDefault();
      go(hits[active]);
    }
  }

  const page = pageBySlug(slug);

  return (
    <div className={s.shell}>
      <a className={s.skip} href="#main">
        Skip to content
      </a>
      <header className={s.top}>
        <Link className={s.brand} href={BASE} aria-label="Instant documentation home">
          <em>Instant</em>
          <span className={s.ver}>{VERSION}</span>
        </Link>
        <div className={s.search}>
          <input
            ref={input}
            type="text"
            inputMode="search"
            role="combobox"
            aria-expanded={open && q.trim().length > 0}
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={hits[active] ? `${listId}-${active}` : undefined}
            placeholder="dst, Instant.parse, add a month…"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={onInputKey}
            enterKeyHint="search"
            autoCorrect="off"
            autoCapitalize="none"
            spellCheck={false}
          />
          <span className={s.kbd} aria-hidden>
            /
          </span>
          {open && q.trim() ? (
            <div className={s.results} id={listId} role="listbox" aria-label="Search results">
              {hits.length === 0 ? (
                <p className={s.empty}>
                  Nothing for “{q}”. Try{" "}
                  {HINTS.map((h, i) => (
                    <span key={h}>
                      {i ? ", " : ""}
                      <code>{h}</code>
                    </span>
                  ))}
                  .
                </p>
              ) : (
                hits.map((hit, i) => (
                  <button
                    key={`${hit.rec.slug}-${hit.rec.hash ?? ""}-${hit.rec.title}`}
                    id={`${listId}-${i}`}
                    type="button"
                    role="option"
                    aria-selected={i === active}
                    data-active={i === active}
                    className={s.hit}
                    onMouseEnter={() => setActive(i)}
                    onClick={() => go(hit)}
                  >
                    <span className={s.hitKind}>{kindLabel(hit.rec.kind)}</span>
                    <span>
                      <span className={s.hitTitle}>{mark(hit.rec.title, q)}</span>
                      {hit.rec.signature ? (
                        <div className={s.hitSig}>{hit.rec.signature}</div>
                      ) : null}
                      <div className={s.hitSnip}>{mark(hit.snippet, q)}</div>
                    </span>
                  </button>
                ))
              )}
            </div>
          ) : null}
        </div>
        <button
          type="button"
          className={s.menuBtn}
          aria-expanded={navOpen}
          aria-controls="docs-nav"
          onClick={() => setNavOpen((v) => !v)}
        >
          {navOpen ? "Close" : "Contents"}
        </button>
        <Link className={s.task} href={TASK}>
          task
        </Link>
      </header>
      <div className={s.body}>
        {navOpen ? (
          <button
            type="button"
            className={s.backdrop}
            aria-label="Close contents"
            onClick={() => setNavOpen(false)}
          />
        ) : null}
        <nav id="docs-nav" className={s.nav} data-open={navOpen} aria-label="Documentation">
          {NAV.map((group) => (
            <div key={group.section}>
              <h2>{group.section}</h2>
              {group.slugs.map((id) => {
                const meta = pageBySlug(id);
                if (!meta) return null;
                return (
                  <Link
                    key={id}
                    href={href(id)}
                    aria-current={slug === id ? "page" : undefined}
                    onClick={() => setNavOpen(false)}
                  >
                    {meta.title === "API" && id === "api" ? "Overview" : meta.title}
                  </Link>
                );
              })}
            </div>
          ))}
          <p className={s.navTask}>
            <Link href={TASK}>task</Link>
          </p>
        </nav>
        <main id="main" className={s.main} aria-label={page?.title ?? "Documentation"}>
          {children}
        </main>
      </div>
    </div>
  );
}

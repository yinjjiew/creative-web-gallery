"use client";

/**
 * The desk. Left: the proof, operated with a real pointer. Right: the map of
 * journeys and the score of the selected one. Selecting a station inspects a
 * pose; selecting a slur edits the in-between. That is the whole instrument.
 */

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";

import { Graph } from "./Graph";
import { Live } from "./Live";
import { Score } from "./Score";
import { classNameOf, compileSheet } from "./css";
import s from "./desk.module.css";
import { emitDocument, gestureLabel } from "./emit";
import {
  INKS,
  REPLY_MS,
  SPECIMENS,
  addEdge,
  addState,
  bindGesture,
  bestTravel,
  edgeFor,
  edgeOf,
  fresh,
  patchEdge,
  patchPose,
  patchVoice,
  poseOf,
  removeEdge,
  removeState,
  totalMs,
  type Doc,
  type Gesture,
  type SpecimenId,
  type VoiceId,
} from "./model";

const TASK = "/tasks/creative-tools-ui-component-creator";
const REDUCED = "(prefers-reduced-motion: reduce)";

function usePrefersReducedMotion() {
  return useSyncExternalStore(
    (onChange) => {
      const q = window.matchMedia(REDUCED);
      q.addEventListener("change", onChange);
      return () => q.removeEventListener("change", onChange);
    },
    () => window.matchMedia(REDUCED).matches,
    () => false
  );
}

export default function Desk() {
  const uid = useId();
  const rootClass = classNameOf(uid);
  const reduced = usePrefersReducedMotion();

  const [doc, setDoc] = useState<Doc>(() => fresh("switch"));
  const [state, setState] = useState("off");
  const [edgeId, setEdgeId] = useState("e-off-on");
  const [selectedEdge, setSelectedEdge] = useState<string | null>("e-off-on");
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [firedEdge, setFiredEdge] = useState<string | null>(null);
  const [play, setPlay] = useState<{ t0: number; ms: number } | null>(null);
  const [playhead, setPlayhead] = useState<number | null>(null);
  const [awaitReply, setAwaitReply] = useState(false);
  const [wireFrom, setWireFrom] = useState<string | null>(null);
  const [naming, setNaming] = useState(false);
  const [nameDraft, setNameDraft] = useState("Warn");
  const [copied, setCopied] = useState<string | null>(null);
  const [sheet, setSheet] = useState<"tsx" | "css">("tsx");
  const replyTimer = useRef<number>(0);
  const pointerArmed = useRef(false);

  const sheetCss = useMemo(() => compileSheet(doc, `.${rootClass}`), [doc, rootClass]);
  const artifact = useMemo(() => emitDocument(doc), [doc]);
  const selected = selectedEdge ? edgeOf(doc, selectedEdge) : undefined;
  const inspecting = selectedState ? poseOf(doc, selectedState) : undefined;

  useEffect(() => {
    if (!play) {
      setPlayhead(null);
      return;
    }
    let frame = 0;
    const tick = (now: number) => {
      const t = now - play.t0;
      setPlayhead(t);
      if (t < play.ms) frame = window.requestAnimationFrame(tick);
      else {
        setPlayhead(play.ms);
        setFiredEdge(null);
      }
    };
    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, [play]);

  const travel = useCallback(
    (id: string) => {
      const edge = edgeOf(doc, id);
      if (!edge) return;
      setEdgeId(edge.id);
      setState(edge.to);
      setSelectedEdge(edge.id);
      setSelectedState(null);
      setFiredEdge(edge.id);
      const ms = reduced ? 1 : totalMs(edge);
      setPlay({ t0: performance.now(), ms });
    },
    [doc, reduced]
  );

  const take = useCallback(
    (gesture: Gesture) => {
      const edge = edgeFor(doc, state, gesture);
      if (!edge) return;
      travel(edge.id);
      if (edge.to === "pending" && gesture !== "reply") {
        window.clearTimeout(replyTimer.current);
        replyTimer.current = window.setTimeout(() => {
          const reply = edgeFor(
            { ...doc, edges: doc.edges },
            "pending",
            "reply"
          );
          if (reply) travel(reply.id);
        }, doc.replyMs);
      }
    },
    [doc, state, travel]
  );

  useEffect(() => () => window.clearTimeout(replyTimer.current), []);

  function load(id: SpecimenId) {
    const next = fresh(id);
    setDoc(next);
    setState(next.states[0].id);
    setEdgeId(next.edges[0]?.id ?? "");
    setSelectedEdge(next.edges[0]?.id ?? null);
    setSelectedState(null);
    setAwaitReply(false);
    setWireFrom(null);
    setNaming(false);
    window.clearTimeout(replyTimer.current);
  }

  function activate() {
    if (state === "pending") return;
    if (doc.specimen === "switch" && awaitReply && (state === "off" || state === "on")) {
      const toPending = edgeOf(doc, state === "off" ? "e-off-pending" : "e-on-pending");
      if (toPending) {
        travel(toPending.id);
        window.clearTimeout(replyTimer.current);
        replyTimer.current = window.setTimeout(() => {
          const replyId = state === "off" ? "e-pending-on" : "e-pending-off";
          const reply = edgeOf(doc, replyId) ?? edgeFor(doc, "pending", "reply");
          if (reply) travel(reply.id);
        }, doc.replyMs);
        return;
      }
    }
    if (edgeFor(doc, state, "click")) {
      take("click");
      return;
    }
    if (edgeFor(doc, state, "up")) {
      take("up");
      return;
    }
    const toPending = doc.edges.find((e) => e.from === state && e.to === "pending");
    if (toPending) travel(toPending.id);
  }

  function onProofClick() {
    if (pointerArmed.current) {
      pointerArmed.current = false;
      return;
    }
    activate();
  }

  function onSelectState(id: string) {
    if (wireFrom) {
      if (wireFrom !== id) setDoc((d) => addEdge(d, wireFrom, id));
      setWireFrom(null);
      return;
    }
    setSelectedState(id);
    setSelectedEdge(null);
    const hop = bestTravel(doc, state, id);
    if (hop) travel(hop.id);
    else {
      setEdgeId("");
      setState(id);
    }
  }

  function onWire(id: string) {
    if (!wireFrom) {
      setWireFrom(id);
      return;
    }
    if (wireFrom !== id) setDoc((d) => addEdge(d, wireFrom, id));
    setWireFrom(null);
  }

  async function copy(which: "tsx" | "css" | "both") {
    const text =
      which === "tsx" ? artifact.tsx : which === "css" ? artifact.css : `${artifact.tsx}\n\n/* ${artifact.stem}.css */\n${artifact.css}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(which);
      window.setTimeout(() => setCopied(null), 1400);
    } catch {
      setCopied(null);
    }
  }

  function confirmStation() {
    const from = selectedState ?? state;
    setDoc((d) => addState(d, from, nameDraft.trim() || "Station"));
    setNaming(false);
  }

  const liveDisabled = state === "pending";

  return (
    <div className={s.shell}>
      <style>{sheetCss}</style>
      <header className={s.mast}>
        <div className={s.mastRow}>
          <h1 className={s.brand}>Statecraft</h1>
          <Link href={TASK} className={s.task}>
            Task
          </Link>
        </div>
        <p className={s.lede}>
          A component is not a picture of rest. It is a set of journeys. This
          desk authors the journeys — how long they take, how they ease, which
          voice leaves first — and the control on the plate is the proof.
          Operate it with a pointer or the keyboard. The slur that fires is the
          work. Export is the same React and CSS the proof already runs, not a
          picture of a button.
        </p>
      </header>

      <aside className={s.plate} aria-label="Live proof">
        <p className={s.kicker}>Proof</p>
        <div className={s.well}>
          <Live
            doc={doc}
            rootClass={`${rootClass} ${s.proofFace}`}
            state={state}
            edge={edgeId}
            disabled={liveDisabled}
            onClick={onProofClick}
            onEnter={() => take("enter")}
            onLeave={() => take("leave")}
            onDown={() => {
              if (edgeFor(doc, state, "down")) pointerArmed.current = true;
              take("down");
            }}
            onUp={() => {
              take("up");
            }}
          />
        </div>
        <p className={s.prompt}>
          {doc.specimen === "switch"
            ? "Flip it. The thumb, the well, and the word are three voices on one journey."
            : "Press it. Hover, arm, wait, resolve — each crossing is a journey you can rewrite."}
        </p>
        <div className={s.plates} role="group" aria-label="Specimen">
          {SPECIMENS.map((sp) => (
            <button
              key={sp.id}
              type="button"
              className={`${s.plateBtn} ${doc.specimen === sp.id ? s.plateOn : ""}`}
              aria-pressed={doc.specimen === sp.id}
              onClick={() => load(sp.id)}
            >
              <strong>{sp.label}</strong>
              <span>{sp.hint}</span>
            </button>
          ))}
        </div>
        {doc.specimen === "switch" ? (
          <label className={s.wait}>
            <input
              type="checkbox"
              checked={awaitReply}
              onChange={(ev) => setAwaitReply(ev.target.checked)}
            />
            Click waits for a reply
          </label>
        ) : (
          <p className={s.waitNote}>Reply arrives in {doc.replyMs}ms — that is when Pending walks to Done.</p>
        )}
        <div className={s.reply} role="group" aria-label="Reply time">
          {REPLY_MS.map((ms) => (
            <button
              key={ms}
              type="button"
              className={`${s.tick} ${doc.replyMs === ms ? s.tickOn : ""}`}
              aria-pressed={doc.replyMs === ms}
              onClick={() => setDoc((d) => ({ ...d, replyMs: ms }))}
            >
              {ms}ms
            </button>
          ))}
        </div>
      </aside>

      <section className={s.map} aria-label="Journeys">
        <div className={s.mapHead}>
          <p className={s.kicker}>Journeys</p>
          <div className={s.mapActs}>
            <button
              type="button"
              className={`${s.textBtn} ${wireFrom ? s.textOn : ""}`}
              aria-pressed={Boolean(wireFrom)}
              onClick={() => setWireFrom(wireFrom ? null : selectedState ?? state)}
            >
              {wireFrom ? "Click a station to land" : "Draw journey"}
            </button>
            <button type="button" className={s.textBtn} onClick={() => setNaming((v) => !v)}>
              Add station
            </button>
          </div>
        </div>
        {naming ? (
          <div className={s.nameRow}>
            <input
              className={s.nameInput}
              value={nameDraft}
              maxLength={18}
              aria-label="Station name"
              onChange={(ev) => setNameDraft(ev.target.value)}
              onKeyDown={(ev) => {
                if (ev.key === "Enter") confirmStation();
                if (ev.key === "Escape") setNaming(false);
              }}
            />
            <button type="button" className={s.textBtn} onClick={confirmStation}>
              Place
            </button>
          </div>
        ) : null}
        <Graph
          doc={doc}
          selectedEdge={selectedEdge}
          selectedState={selectedState}
          liveState={state}
          firedEdge={firedEdge}
          wireFrom={wireFrom}
          onSelectEdge={(id) => {
            setSelectedEdge(id);
            setSelectedState(null);
            setWireFrom(null);
          }}
          onSelectState={onSelectState}
          onWire={onWire}
        />
        <p className={s.mapHint}>
          {wireFrom
            ? "The next station you touch receives a journey from the one already marked."
            : "Click a slur to edit it. Click a station to travel there. Arrow keys walk the journeys."}
        </p>
      </section>

      {selected ? (
        <Score
          doc={doc}
          edge={selected}
          playhead={playhead}
          onDuration={(ms) => setDoc((d) => patchEdge(d, selected.id, { duration: ms }))}
          onEasing={(id) => setDoc((d) => patchEdge(d, selected.id, { easing: id }))}
          onDelay={(voice: VoiceId, delay) => setDoc((d) => patchVoice(d, selected.id, voice, delay))}
          onBind={(g) => setDoc((d) => bindGesture(d, selected.id, g))}
          onRemove={() => {
            setDoc((d) => removeEdge(d, selected.id));
            setSelectedEdge(doc.edges.find((e) => e.id !== selected.id)?.id ?? null);
          }}
        />
      ) : inspecting ? (
        <section className={s.pose} aria-label="Station pose">
          <header className={s.scoreHead}>
            <p className={s.phrase}>
              Station <em>{inspecting.name}</em>
            </p>
            <p className={s.phraseMeta}>A still. The journey is the work — pick a slur.</p>
            {doc.states.length > 2 ? (
              <button
                type="button"
                className={s.textBtn}
                onClick={() => {
                  setDoc((d) => removeState(d, inspecting.id));
                  setSelectedState(null);
                  if (state === inspecting.id) setState(doc.states.find((p) => p.id !== inspecting.id)?.id ?? state);
                }}
              >
                Drop station
              </button>
            ) : null}
          </header>
          <label className={s.poseName}>
            Name
            <input
              value={inspecting.name}
              maxLength={18}
              onChange={(ev) =>
                setDoc((d) => patchPose(d, inspecting.id, { name: ev.target.value, word: ev.target.value }))
              }
            />
          </label>
          <div className={s.inks} role="group" aria-label="Well ink">
            {INKS.map((hex) => (
              <button
                key={hex}
                type="button"
                className={`${s.ink} ${inspecting.well === hex ? s.inkOn : ""}`}
                style={{ background: hex }}
                aria-label={`Well ${hex}`}
                aria-pressed={inspecting.well === hex}
                onClick={() => setDoc((d) => patchPose(d, inspecting.id, { well: hex }))}
              />
            ))}
          </div>
          <p className={s.railHint}>
            Ink is a well, not a slider. The quality you are authoring is how
            this station is left, and how the next one is arrived at.
          </p>
        </section>
      ) : (
        <section className={s.pose}>
          <p className={s.phraseMeta}>Pick a journey on the map. That is the object.</p>
        </section>
      )}

      <section className={s.export} aria-label="Export">
        <div className={s.exportHead}>
          <p className={s.kicker}>Export</p>
          <div className={s.exportTabs} role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={sheet === "tsx"}
              className={`${s.tick} ${sheet === "tsx" ? s.tickOn : ""}`}
              onClick={() => setSheet("tsx")}
            >
              {artifact.stem}.tsx
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={sheet === "css"}
              className={`${s.tick} ${sheet === "css" ? s.tickOn : ""}`}
              onClick={() => setSheet("css")}
            >
              {artifact.stem}.css
            </button>
          </div>
          <div className={s.exportActs}>
            <button type="button" className={s.textBtn} onClick={() => copy(sheet)}>
              {copied === sheet ? "Copied" : "Copy"}
            </button>
            <button type="button" className={s.textBtn} onClick={() => copy("both")}>
              {copied === "both" ? "Copied" : "Copy both"}
            </button>
          </div>
        </div>
        <pre className={s.code} tabIndex={0}>
          {sheet === "tsx" ? artifact.tsx : artifact.css}
        </pre>
        <p className={s.exportNote}>
          The proof on the plate is already running this sheet. A journey that
          cannot be expressed as CSS transitions is not offered.{" "}
          {selected ? `${selected.from} → ${selected.to} is taken on ${gestureLabel(selected.gesture)}.` : ""}
        </p>
      </section>
    </div>
  );
}

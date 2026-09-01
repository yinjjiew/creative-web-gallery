"use client";

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";

import { compile } from "./compile";
import {
  applyRecipe,
  DEFAULT_RECIPE,
  nudgeLayer,
  RECIPES,
  resample,
  slug,
} from "./recipes";
import Surface from "./Surface";
import {
  BLEND_LABEL,
  BLENDS,
  KIND_HINT,
  KIND_LABEL,
  KIND_PARAMS,
  KINDS,
  layer,
  luminance,
  type Blend,
  type Kind,
  type Layer,
} from "./types";
import s from "./bench.module.css";

const TASK = "/tasks/creative-tools-shader-generator";
const REDUCED = "(prefers-reduced-motion: reduce)";

function usePrefersReducedMotion() {
  return useSyncExternalStore(
    (onChange) => {
      const q = window.matchMedia(REDUCED);
      q.addEventListener("change", onChange);
      return () => q.removeEventListener("change", onChange);
    },
    () => window.matchMedia(REDUCED).matches,
    () => false,
  );
}

function isField(el: EventTarget | null) {
  if (!(el instanceof HTMLElement)) return false;
  const tag = el.tagName;
  return tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA" || el.isContentEditable;
}

function patch(layers: Layer[], id: string, next: Partial<Layer>): Layer[] {
  return layers.map((L) => (L.id === id ? { ...L, ...next } : L));
}

function moveLayer(layers: Layer[], id: string, dir: 1 | -1): Layer[] {
  const i = layers.findIndex((L) => L.id === id);
  const j = i + dir;
  if (i < 0 || j < 0 || j >= layers.length) return layers;
  const copy = layers.slice();
  const [item] = copy.splice(i, 1);
  copy.splice(j, 0, item!);
  return copy;
}

export default function Bench() {
  const reduced = usePrefersReducedMotion();
  const liveId = useId();
  const [recipeId, setRecipeId] = useState(DEFAULT_RECIPE.id);
  const [recipeName, setRecipeName] = useState(DEFAULT_RECIPE.name);
  const [layers, setLayers] = useState<Layer[]>(() => applyRecipe(DEFAULT_RECIPE));
  const [selected, setSelected] = useState<string>(() => {
    const stack = applyRecipe(DEFAULT_RECIPE);
    return stack[stack.length - 1]!.id;
  });
  const [copied, setCopied] = useState(false);
  const [announce, setAnnounce] = useState("Portland laid on the slab.");
  const [failed, setFailed] = useState(false);
  const [sourceOpen, setSourceOpen] = useState(true);

  const current = layers.find((L) => L.id === selected) ?? layers[layers.length - 1];
  const compiled = useMemo(() => compile(layers, recipeName), [layers, recipeName]);

  const apply = useCallback((recipe: (typeof RECIPES)[number]) => {
    const next = applyRecipe(recipe);
    setLayers(next);
    setRecipeId(recipe.id);
    setRecipeName(recipe.name);
    setSelected(next[next.length - 1]!.id);
    setAnnounce(`${recipe.name} laid on the slab. ${next.length} layers compiled.`);
  }, []);

  const copySource = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(compiled.exported);
      setCopied(true);
      setAnnounce("Fragment shader copied.");
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setAnnounce("Clipboard refused. Select the source and copy it yourself.");
    }
  }, [compiled.exported]);

  const download = useCallback(() => {
    const blob = new Blob([compiled.exported], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `substrate-${slug(recipeName)}.frag`;
    a.click();
    URL.revokeObjectURL(url);
    setAnnounce(`Wrote substrate-${slug(recipeName)}.frag`);
  }, [compiled.exported, recipeName]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (isField(e.target)) return;
      if (e.metaKey || e.ctrlKey) {
        if (e.key === "c" && !e.shiftKey) return;
        if (e.key === "c" && e.shiftKey) {
          e.preventDefault();
          void copySource();
        }
        return;
      }
      const n = Number(e.key);
      if (n >= 1 && n <= RECIPES.length) {
        const recipe = RECIPES[n - 1];
        if (recipe) apply(recipe);
        return;
      }
      if (e.key === "c") {
        void copySource();
        return;
      }
      if (e.key === "n") {
        if (!current) return;
        const next = nudgeLayer(current);
        setLayers((ls) => patch(ls, current.id, next));
        setRecipeName("Study");
        setRecipeId("");
        setAnnounce(`Nudged ${current.name}.`);
        return;
      }
      if (e.key === "r") {
        const next = resample();
        setLayers(next);
        setRecipeId("");
        setRecipeName("Study");
        setSelected(next[next.length - 1]!.id);
        setAnnounce(`Resampled. ${next.length} layers.`);
        return;
      }
      if (e.key === "v" && current) {
        setLayers((ls) => patch(ls, current.id, { visible: !current.visible }));
        setAnnounce(`${current.name} ${current.visible ? "hidden" : "shown"}.`);
        return;
      }
      if ((e.key === "[" || e.key === "]") && current) {
        const delta = e.key === "]" ? 0.05 : -0.05;
        const opacity = Math.min(1, Math.max(0.05, current.opacity + delta));
        setLayers((ls) => patch(ls, current.id, { opacity }));
        return;
      }
      if (e.key === "j" || e.key === "k") {
        const visual = [...layers].reverse();
        const i = visual.findIndex((L) => L.id === selected);
        const j = e.key === "j" ? Math.min(visual.length - 1, i + 1) : Math.max(0, i - 1);
        if (visual[j]) setSelected(visual[j]!.id);
        return;
      }
      if ((e.key === "Backspace" || e.key === "Delete") && current && layers.length > 1) {
        e.preventDefault();
        const next = layers.filter((L) => L.id !== current.id);
        setLayers(next);
        setSelected(next[next.length - 1]!.id);
        setRecipeName("Study");
        setRecipeId("");
        setAnnounce(`Lifted ${current.name}.`);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [apply, copySource, current, layers, selected]);

  const addKind = (kind: Kind) => {
    const next = layer({
      kind,
      blend: kind === "fill" ? "normal" : "overlay",
      opacity: kind === "fill" ? 1 : 0.4,
    });
    setLayers((ls) => [...ls, next]);
    setSelected(next.id);
    setRecipeName("Study");
    setRecipeId("");
    setAnnounce(`Deposited ${KIND_LABEL[kind]}.`);
  };

  return (
    <div className={s.shell}>
      <a className={s.task} href={TASK}>
        Task
      </a>
      <div id={liveId} className={s.live} aria-live="polite">
        {announce}
      </div>

      <header className={s.head}>
        <div className={s.brand}>
          <h1 className={s.title}>Substrate</h1>
          <p className={s.dek}>
            Materials as a stack of deposits — opacity, blend, clip — compiled
            live to GLSL you can take with you. Not a node graph. Not a sphere.
          </p>
          <p className={s.note}>
            {RECIPES.find((r) => r.id === recipeId)?.note ??
              "A study. Nudge a layer, or deposit another kind."}
          </p>
        </div>
        <ol className={s.recipes} aria-label="Sample library">
          {RECIPES.map((recipe, i) => (
            <li key={recipe.id}>
              <button
                type="button"
                className={s.chip}
                aria-pressed={recipeId === recipe.id}
                onClick={() => apply(recipe)}
              >
                <span className={s.chipName}>{recipe.name}</span>
                <span className={s.chipKey}>{i + 1}</span>
              </button>
            </li>
          ))}
        </ol>
      </header>

      <div className={s.main}>
        <section className={s.well} aria-label="Material slab">
          {failed ? (
            <div className={s.fallback} role="status">
              <p>This machine has no WebGL, so the slab cannot light.</p>
              <p>The compiled fragment shader below is still real, and still yours.</p>
            </div>
          ) : (
            <Surface
              fragment={compiled.preview}
              uniforms={compiled.uniforms}
              onFail={() => setFailed(true)}
            />
          )}
          <p className={s.wellHint}>
            Drag the slab to pan. Keys <kbd>+</kbd> <kbd>−</kbd> zoom, <kbd>0</kbd> resets.
            {reduced ? " Motion is still." : ""}
          </p>
        </section>

        <section className={s.desk} aria-label="Layer stack">
          <div className={s.deskHead}>
            <h2>Strata</h2>
            <p>Surface at the top. Bed at the bottom.</p>
          </div>
          <ul className={s.core} role="listbox" aria-label="Deposits" aria-activedescendant={selected}>
            {[...layers].reverse().map((L, visualIndex) => {
              const dark = luminance(L.colorA) < 0.45;
              return (
                <li key={L.id} id={L.id}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={L.id === selected}
                    className={s.stratum}
                    style={{
                      background: `linear-gradient(90deg, ${L.colorA}, ${L.colorB})`,
                      color: dark ? "#f4efe4" : "#1c1812",
                      opacity: L.visible ? 1 : 0.42,
                    }}
                    onClick={() => setSelected(L.id)}
                  >
                    <span className={s.stratumName}>{L.name}</span>
                    <span className={s.stratumMeta}>
                      {KIND_LABEL[L.kind].toLowerCase()} · {BLEND_LABEL[L.blend].toLowerCase()} ·{" "}
                      {Math.round(L.opacity * 100)}
                      {L.clip ? " · clip" : ""}
                    </span>
                    <span className={s.stratumIndex}>{visualIndex === 0 ? "surface" : visualIndex === layers.length - 1 ? "bed" : ""}</span>
                  </button>
                </li>
              );
            })}
          </ul>

          {current ? (
            <LayerEditor
              layer={current}
              canRemove={layers.length > 1}
              canUp={layers.findIndex((L) => L.id === current.id) < layers.length - 1}
              canDown={layers.findIndex((L) => L.id === current.id) > 0}
              onChange={(next) => {
                setLayers((ls) => patch(ls, current.id, next));
                setRecipeName("Study");
                setRecipeId("");
              }}
              onNudge={() => {
                const next = nudgeLayer(current);
                setLayers((ls) => patch(ls, current.id, next));
                setRecipeName("Study");
                setRecipeId("");
                setAnnounce(`Nudged ${current.name}.`);
              }}
              onMove={(dir) => {
                setLayers((ls) => moveLayer(ls, current.id, dir));
                setRecipeName("Study");
                setRecipeId("");
              }}
              onRemove={() => {
                const next = layers.filter((L) => L.id !== current.id);
                setLayers(next);
                setSelected(next[next.length - 1]!.id);
                setRecipeName("Study");
                setRecipeId("");
                setAnnounce(`Lifted ${current.name}.`);
              }}
            />
          ) : null}

          <div className={s.deposit}>
            <p className={s.depositLabel}>Deposit</p>
            <div className={s.depositRow}>
              {KINDS.map((kind) => (
                <button
                  key={kind}
                  type="button"
                  className={s.kindBtn}
                  title={KIND_HINT[kind]}
                  onClick={() => addKind(kind)}
                >
                  {KIND_LABEL[kind]}
                </button>
              ))}
            </div>
            <div className={s.actions}>
              <button
                type="button"
                className={s.textBtn}
                onClick={() => {
                  const next = resample();
                  setLayers(next);
                  setRecipeId("");
                  setRecipeName("Study");
                  setSelected(next[next.length - 1]!.id);
                  setAnnounce(`Resampled. ${next.length} layers.`);
                }}
              >
                Resample
              </button>
              <span className={s.keys}>
                <kbd>1</kbd>–<kbd>8</kbd> samples · <kbd>n</kbd> nudge · <kbd>r</kbd> resample ·{" "}
                <kbd>c</kbd> copy
              </span>
            </div>
          </div>
        </section>
      </div>

      <section className={s.source}>
        <div className={s.sourceHead}>
          <button
            type="button"
            className={s.sourceToggle}
            aria-expanded={sourceOpen}
            onClick={() => setSourceOpen((v) => !v)}
          >
            <h2>Compiled GLSL</h2>
            <span>{sourceOpen ? "Hide" : "Show"}</span>
          </button>
          <div className={s.sourceActs}>
            <button type="button" className={s.textBtn} onClick={() => void copySource()}>
              {copied ? "Copied" : "Copy shader"}
            </button>
            <button type="button" className={s.textBtn} onClick={download}>
              Download .frag
            </button>
          </div>
        </div>
        {sourceOpen ? (
          <pre className={s.code} tabIndex={0} aria-label="Generated fragment shader">
            <code>{compiled.exported}</code>
          </pre>
        ) : null}
      </section>
    </div>
  );
}

function LayerEditor({
  layer: L,
  canRemove,
  canUp,
  canDown,
  onChange,
  onNudge,
  onMove,
  onRemove,
}: {
  layer: Layer;
  canRemove: boolean;
  canUp: boolean;
  canDown: boolean;
  onChange: (next: Partial<Layer>) => void;
  onNudge: () => void;
  onMove: (dir: 1 | -1) => void;
  onRemove: () => void;
}) {
  const params = KIND_PARAMS[L.kind];
  return (
    <div className={s.editor}>
      <div className={s.editorHead}>
        <label className={s.field}>
          <span>Name</span>
          <input
            type="text"
            value={L.name}
            maxLength={18}
            onChange={(e) => onChange({ name: e.target.value })}
          />
        </label>
        <label className={s.field}>
          <span>Kind</span>
          <select
            value={L.kind}
            onChange={(e) => {
              const kind = e.target.value as Kind;
              onChange({ kind, name: L.name === KIND_LABEL[L.kind] ? KIND_LABEL[kind] : L.name });
            }}
          >
            {KINDS.map((k) => (
              <option key={k} value={k}>
                {KIND_LABEL[k]}
              </option>
            ))}
          </select>
        </label>
        <label className={s.field}>
          <span>Blend</span>
          <select value={L.blend} onChange={(e) => onChange({ blend: e.target.value as Blend })}>
            {BLENDS.map((b) => (
              <option key={b} value={b}>
                {BLEND_LABEL[b]}
              </option>
            ))}
          </select>
        </label>
      </div>
      <p className={s.hint}>{KIND_HINT[L.kind]}</p>
      <label className={s.slider}>
        <span>Opacity {Math.round(L.opacity * 100)}</span>
        <input
          type="range"
          min={0.05}
          max={1}
          step={0.01}
          value={L.opacity}
          onChange={(e) => onChange({ opacity: Number(e.target.value) })}
        />
      </label>
      {params.includes("colorA") ? (
        <label className={s.color}>
          <span>Pigment A</span>
          <input type="color" value={L.colorA} onChange={(e) => onChange({ colorA: e.target.value })} />
          <input
            type="text"
            spellCheck={false}
            value={L.colorA}
            onChange={(e) => {
              const v = e.target.value;
              if (/^#[0-9a-fA-F]{6}$/.test(v)) onChange({ colorA: v });
            }}
          />
        </label>
      ) : null}
      {params.includes("colorB") ? (
        <label className={s.color}>
          <span>Pigment B</span>
          <input type="color" value={L.colorB} onChange={(e) => onChange({ colorB: e.target.value })} />
          <input
            type="text"
            spellCheck={false}
            value={L.colorB}
            onChange={(e) => {
              const v = e.target.value;
              if (/^#[0-9a-fA-F]{6}$/.test(v)) onChange({ colorB: v });
            }}
          />
        </label>
      ) : null}
      {params.includes("scale") ? (
        <label className={s.slider}>
          <span>Scale {L.scale.toFixed(1)}</span>
          <input
            type="range"
            min={0.4}
            max={120}
            step={0.1}
            value={L.scale}
            onChange={(e) => onChange({ scale: Number(e.target.value) })}
          />
        </label>
      ) : null}
      {params.includes("rotate") ? (
        <label className={s.slider}>
          <span>Rotate {Math.round(L.rotate)}°</span>
          <input
            type="range"
            min={-180}
            max={180}
            step={1}
            value={L.rotate}
            onChange={(e) => onChange({ rotate: Number(e.target.value) })}
          />
        </label>
      ) : null}
      {params.includes("sharpness") ? (
        <label className={s.slider}>
          <span>Sharpness {L.sharpness.toFixed(2)}</span>
          <input
            type="range"
            min={0.05}
            max={0.95}
            step={0.01}
            value={L.sharpness}
            onChange={(e) => onChange({ sharpness: Number(e.target.value) })}
          />
        </label>
      ) : null}
      {params.includes("warp") ? (
        <label className={s.slider}>
          <span>Warp {L.warp.toFixed(2)}</span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={L.warp}
            onChange={(e) => onChange({ warp: Number(e.target.value) })}
          />
        </label>
      ) : null}
      {params.includes("seed") ? (
        <label className={s.slider}>
          <span>Seed {L.seed.toFixed(2)}</span>
          <input
            type="range"
            min={0}
            max={12}
            step={0.01}
            value={L.seed}
            onChange={(e) => onChange({ seed: Number(e.target.value) })}
          />
        </label>
      ) : null}
      <div className={s.toggles}>
        <label>
          <input
            type="checkbox"
            checked={L.visible}
            onChange={(e) => onChange({ visible: e.target.checked })}
          />
          Visible
        </label>
        <label>
          <input
            type="checkbox"
            checked={L.clip}
            onChange={(e) => onChange({ clip: e.target.checked })}
          />
          Clip to bed
        </label>
        <label>
          <input
            type="checkbox"
            checked={L.invert}
            onChange={(e) => onChange({ invert: e.target.checked })}
          />
          Invert
        </label>
      </div>
      <div className={s.editorActs}>
        <button type="button" className={s.textBtn} onClick={onNudge}>
          Nudge
        </button>
        <button type="button" className={s.textBtn} disabled={!canUp} onClick={() => onMove(1)}>
          Raise
        </button>
        <button type="button" className={s.textBtn} disabled={!canDown} onClick={() => onMove(-1)}>
          Lower
        </button>
        <button type="button" className={s.textBtn} disabled={!canRemove} onClick={onRemove}>
          Lift
        </button>
      </div>
    </div>
  );
}

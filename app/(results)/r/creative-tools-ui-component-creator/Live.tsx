/**
 * The proof. Same DOM the export prints. Same sheet the compiler writes.
 * Operating this is the first gesture — not a preview scrubber.
 */

import type { Doc, Mark } from "./model";

export function Live({
  doc,
  rootClass,
  state,
  edge,
  disabled,
  onClick,
  onEnter,
  onLeave,
  onDown,
  onUp,
}: {
  doc: Doc;
  rootClass: string;
  state: string;
  edge: string;
  disabled?: boolean;
  onClick: () => void;
  onEnter: () => void;
  onLeave: () => void;
  onDown: () => void;
  onUp: () => void;
}) {
  const words = [...new Set(doc.states.map((p) => p.word))];
  const markSet = new Set<Mark>(doc.states.map((p) => p.mark));
  const isSwitch = doc.specimen === "switch";

  return (
    <button
      type="button"
      role={isSwitch ? "switch" : undefined}
      aria-checked={isSwitch ? state === "on" : undefined}
      aria-busy={state === "pending"}
      aria-label={isSwitch ? "Live switch" : "Live commit"}
      className={rootClass}
      data-state={state}
      data-edge={edge}
      disabled={disabled}
      onClick={onClick}
      onPointerEnter={onEnter}
      onPointerLeave={onLeave}
      onPointerDown={onDown}
      onPointerUp={onUp}
    >
      {isSwitch ? (
        <span className="scTrack" aria-hidden="true">
          <span className="scThumb" />
        </span>
      ) : null}
      <span className="scWord">
        {words.map((w) => (
          <span key={w} data-word={w}>
            {w}
          </span>
        ))}
      </span>
      {markSet.has("spin") ? <span className="scMark" data-mark="spin" aria-hidden="true" /> : null}
      {markSet.has("check") ? <span className="scMark" data-mark="check" aria-hidden="true" /> : null}
    </button>
  );
}

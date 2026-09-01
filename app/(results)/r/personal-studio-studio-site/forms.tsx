import type { ReactElement, ReactNode } from "react";

type MarkProps = {
  title: string;
};

function Frame({ title, children }: MarkProps & { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 64 80"
      aria-hidden="true"
      focusable="false"
      className="mark"
    >
      <title>{title}</title>
      <line x1="6" y1="73" x2="58" y2="73" />
      {children}
    </svg>
  );
}

function Lounge() {
  return (
    <Frame title="Lounge">
      <path d="M10 70 V52 H54 V70" />
      <path d="M12 52 C14 38 18 28 28 24 L34 50" />
      <ellipse cx="32" cy="48" rx="20" ry="7" />
    </Frame>
  );
}

function Tub() {
  return (
    <Frame title="Tub">
      <path d="M14 70 C12 48 16 28 32 24 C48 28 52 48 50 70" />
      <path d="M20 58 H44" />
    </Frame>
  );
}

function Sled() {
  return (
    <Frame title="Sled">
      <path d="M16 36 L40 28 L44 50 H18 Z" />
      <path d="M14 70 C14 62 14 54 18 50 H46 C52 54 54 64 54 70" />
    </Frame>
  );
}

function Ash() {
  return (
    <Frame title="Ash">
      <rect x="16" y="46" width="32" height="6" />
      <path d="M18 46 L26 28 H40 L48 46" />
      <path d="M20 52 V70 M28 52 V70 M36 52 V70 M44 52 V70" />
    </Frame>
  );
}

function Cantilever() {
  return (
    <Frame title="Cantilever">
      <path d="M14 70 C14 58 14 40 22 36 H48 L44 28 H24 C12 32 10 52 10 70" />
      <path d="M22 36 H50" />
    </Frame>
  );
}

function Perch() {
  return (
    <Frame title="Perch">
      <ellipse cx="32" cy="30" rx="10" ry="4" />
      <path d="M32 34 V70" />
      <path d="M20 54 H44" />
      <path d="M24 70 H40" />
    </Frame>
  );
}

function Wing() {
  return (
    <Frame title="Wing">
      <path d="M18 70 V32 C18 16 24 10 32 10 C40 10 46 16 46 32 V70" />
      <path d="M18 40 H14 V56 H18 M46 40 H50 V56 H46" />
      <path d="M20 52 H44" />
    </Frame>
  );
}

function Slab() {
  return (
    <Frame title="Slab">
      <path d="M18 50 H46 L42 28 H22 Z" />
      <path d="M22 50 V70 M42 50 V70" />
    </Frame>
  );
}

function Loaf() {
  return (
    <Frame title="Loaf">
      <ellipse cx="32" cy="52" rx="20" ry="12" />
      <path d="M16 58 V70 M48 58 V70" />
      <path d="M22 44 C24 32 28 26 34 28" />
    </Frame>
  );
}

function Disc() {
  return (
    <Frame title="Disc">
      <ellipse cx="32" cy="36" rx="14" ry="5" />
      <path d="M32 41 V62" />
      <ellipse cx="32" cy="66" rx="16" ry="5" />
    </Frame>
  );
}

function Fourleg() {
  return (
    <Frame title="Four-leg">
      <path d="M18 50 H46 L43 32 H21 Z" />
      <path d="M18 50 H14 V40 H18 M46 50 H50 V40 H46" />
      <path d="M22 50 V70 M28 50 V70 M36 50 V70 M42 50 V70" />
    </Frame>
  );
}

function Brass() {
  return (
    <Frame title="Brass">
      <rect x="22" y="18" width="20" height="44" rx="3" />
      <circle cx="32" cy="28" r="6" />
      <path d="M32 34 V50" />
      <path d="M26 58 H38" />
    </Frame>
  );
}

function Fold() {
  return (
    <Frame title="Fold">
      <path d="M16 28 H36 L48 44 H28 Z" />
      <path d="M28 44 L20 62 H40 L48 44" />
      <circle cx="24" cy="36" r="3" />
    </Frame>
  );
}

function Ring() {
  return (
    <Frame title="Ring">
      <rect x="24" y="16" width="16" height="48" rx="2" />
      <circle cx="32" cy="28" r="5" />
      <circle cx="32" cy="48" r="8" />
    </Frame>
  );
}

function Right() {
  return (
    <Frame title="Right">
      <rect x="20" y="22" width="18" height="40" rx="2" />
      <path d="M38 36 H52 L48 48 H38" />
      <circle cx="29" cy="32" r="4" />
    </Frame>
  );
}

function Clad() {
  return (
    <Frame title="Clad">
      <rect x="22" y="20" width="20" height="42" rx="2" />
      <path d="M22 26 H42 M22 56 H42" />
      <path d="M26 20 V14 H38 V20" />
    </Frame>
  );
}

function Mini() {
  return (
    <Frame title="Mini">
      <rect x="26" y="30" width="12" height="22" rx="2" />
      <circle cx="32" cy="38" r="3" />
    </Frame>
  );
}

function Dumpy() {
  return (
    <Frame title="Dumpy">
      <rect x="20" y="24" width="24" height="36" rx="4" />
      <path d="M24 42 H40" />
      <circle cx="32" cy="34" r="5" />
      <path d="M32 60 V70" />
    </Frame>
  );
}

function Tcant() {
  return (
    <Frame title="Cantilever table">
      <path d="M8 34 H56" />
      <path d="M12 34 V70 H28 V38" />
    </Frame>
  );
}

function Well() {
  return (
    <Frame title="Well">
      <path d="M8 34 H56" />
      <path d="M16 34 V70 M48 34 V70" />
      <rect x="24" y="38" width="16" height="10" />
    </Frame>
  );
}

function Elm() {
  return (
    <Frame title="Elm">
      <path d="M8 36 Q32 28 56 36" />
      <path d="M16 36 V70 M48 36 V70" />
    </Frame>
  );
}

function Hairpin() {
  return (
    <Frame title="Hairpin">
      <path d="M8 34 H56" />
      <path d="M18 34 C18 52 10 70 10 70 M22 34 C22 52 30 70 30 70" />
      <path d="M42 34 C42 52 34 70 34 70 M46 34 C46 52 54 70 54 70" />
    </Frame>
  );
}

function Plane() {
  return (
    <Frame title="Plane">
      <path d="M8 34 H56" />
      <path d="M16 34 V70 M48 34 V70" />
    </Frame>
  );
}

function Beech() {
  return (
    <Frame title="Beech">
      <path d="M8 32 H56" />
      <path d="M8 36 H56" />
      <path d="M16 36 V70 M48 36 V70" />
      <path d="M16 58 H48" />
      <path d="M20 36 V48" />
    </Frame>
  );
}

const MARKS: Record<string, () => ReactElement> = {
  lounge: Lounge,
  tub: Tub,
  sled: Sled,
  ash: Ash,
  cantilever: Cantilever,
  perch: Perch,
  wing: Wing,
  slab: Slab,
  loaf: Loaf,
  disc: Disc,
  fourleg: Fourleg,
  brass: Brass,
  fold: Fold,
  ring: Ring,
  right: Right,
  clad: Clad,
  mini: Mini,
  dumpy: Dumpy,
  tcant: Tcant,
  well: Well,
  elm: Elm,
  hairpin: Hairpin,
  plane: Plane,
  beech: Beech,
};

export function FormMark({ mark }: { mark: string }) {
  const Draw = MARKS[mark];
  if (!Draw) return null;
  return <Draw />;
}

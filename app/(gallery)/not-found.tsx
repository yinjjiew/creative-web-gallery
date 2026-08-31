import Link from "next/link";

export default function NotFound() {
  return (
    <div className="shell" style={{ padding: "6rem 0 8rem", maxWidth: "34rem" }}>
      <h1 style={{ fontSize: "clamp(2rem, 6vw, 3rem)", lineHeight: 1.05 }}>
        Not in the catalogue.
      </h1>
      <p
        style={{
          color: "var(--ink-soft)",
          fontSize: "1.0625rem",
          lineHeight: 1.6,
          padding: "1.25rem 0 2rem",
        }}
      >
        There is no task, setting or ability at this address.
      </p>
      <Link
        href="/"
        className="mono"
        style={{
          color: "var(--signal)",
          borderBottom: "1px solid currentColor",
          paddingBottom: 2,
        }}
      >
        Back to the index
      </Link>
    </div>
  );
}

import { Fragment, type ReactNode } from "react";

/** The Promhance wordmark: "Prom" in white, "hance" in blue. Use inside titles. */
export function Brand() {
  return (
    <span>
      <span className="text-white">Prom</span>
      <span className="text-blue-400">hance</span>
    </span>
  );
}

/**
 * Returns `text` with every "Promhance" replaced by the two-tone wordmark.
 * For heading strings passed around as props, e.g. `{brandify(heading)}`.
 */
export function brandify(text: string): ReactNode {
  const parts = text.split("Promhance");
  if (parts.length === 1) return text;
  return parts.map((part, i) => (
    <Fragment key={i}>
      {i > 0 && <Brand />}
      {part}
    </Fragment>
  ));
}

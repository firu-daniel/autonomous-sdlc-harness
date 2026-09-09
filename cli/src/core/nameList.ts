/**
 * The one rendering of "a set of names, on one line" every command reports a name set through.
 *
 * It is its own module because every command that reports a name set renders it through this — the
 * layer-gap pair (`doctor`'s `layer-drift` detail and `init`'s uncovered-directory line, one
 * derivation between them in `core/layerCoverage.ts`) and the write plan's `merged` action qualifier
 * (`core/writer.ts`) included. A private copy in any of them would be free to drift in its separator
 * or its cap and make one repository read as two different answers.
 */

/**
 * How many names a count-plus-names detail spells out before it summarises the rest.
 *
 * Deliberately **not** exported: the cap is only meaningful through {@link nameList}, and a caller
 * reading it would be a caller re-implementing the rendering this module exists to hold alone.
 */
const DETAIL_NAME_CAP = 6;

/** `a, b, c, +4 more` — a name list that stays one line however long it gets. */
export function nameList(names: readonly string[]): string {
  const head = names.slice(0, DETAIL_NAME_CAP).join(', ');
  const rest = names.length - DETAIL_NAME_CAP;
  return rest > 0 ? `${head}, +${rest} more` : head;
}

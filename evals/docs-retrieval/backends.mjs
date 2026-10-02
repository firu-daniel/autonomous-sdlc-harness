/**
 * The docs-retrieval eval's backend vocabulary, and the block id each backend's figures are written under.
 *
 * **The rule this module exists to enforce: the backend set is declared once, here, and every flag
 * check, block key and provenance line reads it** — the way `evals/docs-retrieval/arms.mjs` is the arm
 * table's single declaration. `evals/docs-retrieval/args.mjs` defers a `--backend` label's legality to
 * {@link backendFor}, and `evals/docs-retrieval/results.mjs` keys a corpus's block by
 * {@link corpusBlockId}.
 *
 * **An explicit `typescript` gets its own key, `<corpus>@typescript`, rather than the unlabelled one.**
 * The same-session TypeScript re-run must not overwrite the eval branch's recorded unlabelled block,
 * which `docs/retrieval-eval-results.md` → `## Threshold calibration`, `## The query-log pass` and
 * `evals/docs-retrieval/check-floor.mjs`'s floor all stand on. Only a run naming no backend writes the
 * unlabelled block.
 */

/** Every backend a run may name, in the order a refusal lists them. */
export const BACKENDS = Object.freeze(['typescript', 'python']);

/** `label` as a {@link BACKENDS} entry, refused by name against that list. */
export function backendFor(label) {
  if (!BACKENDS.includes(label)) {
    throw new Error(`eval: unknown backend ${label}; the backends are ${BACKENDS.join(', ')}`);
  }
  return label;
}

/** The results-file block id: the corpus id for a run naming no backend, `<corpus>@<backend>` otherwise. */
export function corpusBlockId(corpusId, backend) {
  return backend === undefined ? corpusId : `${corpusId}@${backend}`;
}

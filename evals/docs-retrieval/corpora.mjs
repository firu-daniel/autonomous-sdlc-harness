/**
 * Resolving a corpus id to the `HarnessConfig` the docs-retrieval eval reads that corpus through.
 *
 * **The rule this module exists to enforce: the eval owns the retrieval *gate* and nothing else of
 * the configuration.** `cli/src/retrieval/session.ts` refuses to open a session unless
 * `retrievalApplies(config)` — `phases.docs` and `docs.retrieval` both true — and this repository's
 * `harness.config.json` has `phases.docs: false` and no `docs` key. That file is deliberately not
 * changed. `cli/src/retrieval/corpus.ts`'s header states that the gate "is its callers' to check,
 * not this module's", so the eval supplies `phases` and `docs` itself and drives `corpusFiles` →
 * `refreshIndex` → `searchDocs` directly, never `openRetrieval`.
 *
 * **The other half of that boundary: the eval does not own `layers[]`.** The same header in
 * `cli/src/retrieval/corpus.ts` states the corpus is "every Markdown file under `docs.root` plus
 * every conventions document `layers[]` names — nothing else, and no copy of that list elsewhere".
 * So `self-docs` reads `layers[]` and `stateDir` out of the resolved checkout's real
 * `harness.config.json` verbatim and overrides `docs.root` alone: no layer list is retyped here, not
 * as a literal, not as a default, not as a fallback. A layer added to that file is covered by the
 * next run with no edit to this one. A configuration that is absent or carries no `layers` is
 * refused by name rather than substituted for.
 *
 * **`self-docs` is a moving corpus.** `docs.root: 'docs'` holds *every* `*.md` under `docs/`,
 * including the documents a branch writes there while the eval is being built — the eval's own file
 * of record among them. The corpus is not filtered to pin it, because `refreshIndex` calls
 * `corpusFiles` itself. Instead every figure taken over `self-docs` is stamped with the
 * `{ files, chunks }` snapshot `buildIndex` returns (`evals/docs-retrieval/index-build.mjs`), and
 * two figures carrying different stamps are not a before/after pair.
 */

import { readFileSync } from 'node:fs';
import { isAbsolute, join, relative, sep } from 'node:path';

import { CONFIG_FILENAME, DEFAULTS } from '../../cli/dist/config/model.js';

/** The corpus ids this module composes without an operator naming any path. Every message lists these. */
export const BUILT_IN_CORPORA = Object.freeze(['fixture-catalog', 'self-docs']);

/** The id an operator-composed corpus reports itself under; it mirrors nothing in this repository. */
export const AD_HOC_CORPUS = 'ad-hoc';

/**
 * `fixture-catalog` is read as a repository of its own, rooted here.
 *
 * A corpus is resolved against a root, and every `ref` a query set carries is `path#anchor` **as
 * `SearchHit.ref` renders it**, which is the path relative to that root. The committed set
 * `evals/docs-retrieval/queries/fixture-catalog.jsonl` labels `docs/routing.md#zone-graph` and its
 * siblings, so the root the fixture is read against is the directory holding its `docs/` — not the
 * checkout. Rooting it at the checkout instead would prefix every rendered ref with this path and
 * miss every label in the set.
 */
const FIXTURE_CATALOG_ROOT = 'evals/docs-retrieval/corpora/fixture-catalog';

/** `docs.root` of both `fixture-catalog` and `self-docs` — each relative to its own root above. */
const DOCS_ROOT = 'docs';

/** The gate every composed config carries, so the eval's config would satisfy `retrievalApplies`. */
function gated(root, layers, stateDir) {
  return { stateDir, docs: { retrieval: true, root }, layers, phases: { docs: true } };
}

/** `layers[]` and `stateDir` of the checkout at `repoRoot`, verbatim; refused by name when absent. */
function adoptedConfig(repoRoot) {
  const path = join(repoRoot, CONFIG_FILENAME);
  let parsed;
  try {
    parsed = JSON.parse(readFileSync(path, 'utf8'));
  } catch (error) {
    throw new Error(
      `eval: corpus self-docs needs the layer list of ${path}, which could not be read: ${error.message}`,
    );
  }
  if (!Array.isArray(parsed.layers) || parsed.layers.length === 0) {
    throw new Error(
      `eval: corpus self-docs needs the layer list of ${path}, which carries no layers[]; ` +
        'the eval never substitutes one, because the conventions list has exactly one home',
    );
  }
  return { layers: parsed.layers, stateDir: typeof parsed.stateDir === 'string' ? parsed.stateDir : DEFAULTS.stateDir };
}

/**
 * The `{ id, config, repoRoot }` the eval reads a corpus through.
 *
 * `corpus` names a built-in id, or is absent when `docsRoot` composes an ad-hoc corpus from an
 * operator's own paths — which is how the eval runs against an adopter's checkout. `conventions` is
 * the conventions documents that ad-hoc corpus carries, zero or more.
 *
 * The returned `repoRoot` is what `corpusFiles` and `refreshIndex` are called with, and it is the
 * `repoRoot` argument for every corpus but `fixture-catalog`, which is read as its own repository —
 * see {@link FIXTURE_CATALOG_ROOT}. Pass it on rather than re-deriving it, or every rendered `ref`
 * carries the wrong prefix.
 */
export function corpusConfig({ repoRoot, corpus, docsRoot, conventions = [] }) {
  if (corpus === 'self-docs') {
    const adopted = adoptedConfig(repoRoot);
    return { id: corpus, config: gated(DOCS_ROOT, adopted.layers, adopted.stateDir), repoRoot };
  }
  if (corpus === 'fixture-catalog') {
    return {
      id: corpus,
      config: gated(DOCS_ROOT, [], DEFAULTS.stateDir),
      repoRoot: join(repoRoot, FIXTURE_CATALOG_ROOT),
    };
  }
  if (corpus !== undefined) {
    throw new Error(`eval: unknown corpus ${corpus}; the built-in ids are ${BUILT_IN_CORPORA.join(' and ')}`);
  }
  if (typeof docsRoot !== 'string' || docsRoot === '') {
    throw new Error(
      `eval: an ad-hoc corpus needs --docs-root; the built-in ids are ${BUILT_IN_CORPORA.join(' and ')}`,
    );
  }
  const layers = conventions.map((path, index) => ({
    name: `ad-hoc-${index + 1}`,
    path: '.',
    conventions: repoRelative(repoRoot, path),
  }));
  return {
    id: AD_HOC_CORPUS,
    config: gated(repoRelative(repoRoot, docsRoot), layers, DEFAULTS.stateDir),
    repoRoot,
  };
}

/**
 * Every path in a `HarnessConfig` is repo-relative (`.claude/context/conventions.md` →
 * `## Configuration is the source of truth…`), while `evals/docs-retrieval/args.mjs` resolves every
 * operator path against `--repo`. This is the one conversion between the two, and it applies to the
 * ad-hoc corpus alone: the built-in ids carry repo-relative literals already.
 */
function repoRelative(repoRoot, path) {
  return (isAbsolute(path) ? relative(repoRoot, path) : path).split(sep).join('/');
}

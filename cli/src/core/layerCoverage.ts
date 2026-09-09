/**
 * Which source directories under the application directory no `layers[]` entry covers, and so route
 * to the catch-all row every profile ends with.
 *
 * **The rule this module exists to enforce: there is one derivation of that set.** `doctor` grades it
 * as its `layer-drift` check and `init` reports it at the end of an adoption run, and two copies of
 * the look-in set or of the exclusion list would let one repository be described in two different
 * terms by two commands an adopter runs minutes apart. The grading and the wording stay with each
 * caller; the set does not.
 *
 * It reads directory entries and resolves each candidate against the repository's ignore rules, and
 * writes nothing.
 */

import { readdirSync } from 'node:fs';
import { join, posix } from 'node:path';

import { DEFAULTS, LAYER_CATCH_ALL_PATH, type HarnessConfig } from '../config/model.js';
import { pathIsIgnored } from './git.js';
import { normalizeRepoPathStrict } from './repoPaths.js';

/** The dependency tree, excluded by name because no adopter's layer profile is ever about it. */
const VENDOR_DIRECTORY = 'node_modules';

/**
 * Whether one repo-relative path is another or sits under it. Both arguments are already normalised,
 * so this is the whole containment test — the segment boundary is what stops `srcx` matching `src`.
 */
function isWithin(inner: string, outer: string): boolean {
  return inner === outer || inner.startsWith(`${outer}/`);
}

/** The names of the directories directly inside a path. Never throws — an unreadable one has none. */
function subdirectoryNames(path: string): readonly string[] {
  try {
    return readdirSync(path, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name);
  } catch {
    return [];
  }
}

/** A `layers[]` row that can cover something: its reporting name and its normalised path. */
export interface CoveringLayer {
  readonly name: string;
  readonly path: string;
}

/** The coverage answer for one repository, as {@link layerCoverage} derives it. */
export interface LayerCoverage {
  /**
   * Whether the question applies at all. `false` on a profile carrying nothing but the catch-all
   * row, where every directory would qualify and the answer would be the whole tree;
   * {@link candidates} and {@link uncovered} are then empty and a caller reports that state as
   * itself rather than as coverage.
   */
  readonly graded: boolean;
  /** The application directory the candidates were enumerated under, normalised. */
  readonly appDir: string;
  /** The non-catch-all rows coverage was tested against. */
  readonly covering: readonly CoveringLayer[];
  /** Every source directory considered, covered or not. */
  readonly candidates: readonly string[];
  /** The subset of {@link candidates} no row in {@link covering} covers. */
  readonly uncovered: readonly string[];
}

/** The not-graded answer, so the gate below and its callers cannot spell "empty" two ways. */
function notGraded(appDir: string): LayerCoverage {
  return { graded: false, appDir, covering: [], candidates: [], uncovered: [] };
}

/**
 * The uncovered source directories under `appDir`, and the inputs the answer was derived from.
 *
 * **The gate is Finding 38's own amendment**: a profile that is nothing but the catch-all row makes
 * every directory qualify, so this returns `graded: false` there and that state is the caller's to
 * report, once, as itself.
 *
 * **It reads no `detection` field, and a recorded review deliberately does not silence it**: a
 * verdict describes the profile at the moment it was reviewed, and a layer hand-added afterwards is
 * exactly the drift this derivation exists to name.
 *
 * **The directories looked in are two levels of the configuration rather than one.** `init` writes
 * `appDir: "."` with layer paths under `src/` (`generators/harnessConfig.ts`, `detect/presets.ts`),
 * so `appDir`'s only child is `src` and a drifted sibling *inside* `src/` would never be a candidate;
 * adding each configured layer path's proper ancestors to the look-in set is what reaches
 * `src/common`, the shape the finding is filed on.
 *
 * **The exclusions are dot-names, {@link VENDOR_DIRECTORY}, the harness's own four configured
 * directories — `stateDir`, `scriptsDir`, `githooksDir` and the documentation root — and whatever
 * the repository's own ignore rules already exclude, and the list stays that short**: every entry
 * on it is either a directory the harness itself configures or a declaration the repository has
 * already made, where a longer built-in one would be this module inventing an opinion about the
 * adopter's tree, and the gate above is what removes the noise.
 *
 * `config.layers` is read defensively rather than trusted: a value that is not an array yields the
 * not-graded answer, which is the same arm as a profile with no covering row, because in both cases
 * there is nothing to test coverage against. `config/check.ts` is what reports the shape itself.
 */
export function layerCoverage(options: { readonly repoRoot: string; readonly config: HarnessConfig }): LayerCoverage {
  const { repoRoot, config } = options;
  const appDir = normalizeRepoPathStrict(config.appDir ?? DEFAULTS.appDir);
  if (!Array.isArray(config.layers)) return notGraded(appDir);

  // The rows that can cover anything: the catch-all covers everything by construction, which is why
  // it is excluded here rather than treated as coverage. A value that is not a non-empty string is
  // `config/check.ts`'s finding, so it is skipped rather than turned into a second one, and the row
  // is identified by `path` rather than by the name `general` ({@link LAYER_CATCH_ALL_PATH}).
  const covering: CoveringLayer[] = [];
  for (const [index, layer] of config.layers.entries()) {
    const path = layer?.path;
    if (typeof path !== 'string' || path.trim() === '') continue;
    const normalized = normalizeRepoPathStrict(path);
    if (normalized === LAYER_CATCH_ALL_PATH) continue;
    const name = layer?.name;
    covering.push({ name: typeof name === 'string' && name.trim() !== '' ? name : `layers[${index}]`, path: normalized });
  }

  // The gate, before anything is enumerated, and the one arm there is.
  if (covering.length === 0) return notGraded(appDir);

  // Step (i): the application directory, plus every proper ancestor of a configured layer path that
  // lies at or below it.
  const lookIn = new Set<string>([appDir]);
  for (const layer of covering) {
    for (let dir = posix.dirname(layer.path); dir !== LAYER_CATCH_ALL_PATH && dir !== '/'; dir = posix.dirname(dir)) {
      // A configured path that leaves the repository is the config check's finding; reading a
      // directory outside the tree is not this module's business.
      if (dir.split('/')[0] === '..') break;
      if (appDir === LAYER_CATCH_ALL_PATH || isWithin(dir, appDir)) lookIn.add(dir);
    }
  }

  // Step (ii): the immediate sub-directories of each, less the harness's own trees. A directory
  // that cannot be read yields nothing — absence is an ordinary answer here.
  const harnessDirs = [
    config.stateDir,
    config.scriptsDir ?? DEFAULTS.scriptsDir,
    config.githooksDir ?? DEFAULTS.githooksDir,
    config.docs?.root,
  ]
    .filter((value): value is string => typeof value === 'string' && value.trim() !== '')
    .map((value) => normalizeRepoPathStrict(value));

  const candidates: string[] = [];
  for (const dir of lookIn) {
    for (const name of subdirectoryNames(join(repoRoot, dir))) {
      if (name.startsWith('.') || name === VENDOR_DIRECTORY) continue;
      const candidate = dir === LAYER_CATCH_ALL_PATH ? name : `${dir}/${name}`;
      if (harnessDirs.some((harness) => isWithin(harness, candidate))) continue;
      // A directory the repository itself declares is not source. Asking git is the repository's
      // own answer rather than a built-in opinion about the adopter's tree, and it is what keeps a
      // build output — `dist/`, `coverage/` — from being reported as a layer nobody wrote a row
      // for. Only a definite `true` excludes: `pathIsIgnored` returns `undefined` where git could
      // not answer, and an unanswerable probe leaves the candidate in.
      if (pathIsIgnored(repoRoot, candidate) === true) continue;
      if (!candidates.includes(candidate)) candidates.push(candidate);
    }
  }

  // Coverage in both directions: a layer at `internal` covers `internal/api`, and `src` is covered
  // by its own child layers.
  const uncovered = candidates.filter(
    (candidate) => !covering.some((layer) => isWithin(layer.path, candidate) || isWithin(candidate, layer.path)),
  );

  return { graded: true, appDir, covering, candidates, uncovered };
}

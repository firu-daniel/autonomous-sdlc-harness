/**
 * One question, asked nowhere else: **does a direct subdirectory of the repository root look like the
 * application?**
 *
 * It is a module of its own rather than a widening of `detect/signals.ts` or `detect/presets.ts`
 * because it is a new responsibility with a hard boundary: **nothing is derived from what it finds.**
 * No preset, no layer, no command line and no config value may ever be taken from this answer. Its one
 * consumer is a note `init` prints — the directory it found, the manifest it found there, and the
 * `--app-dir` re-run that would point detection at that tree — and the adopter decides.
 *
 * A **single** hit or nothing. Zero hits is silence for the obvious reason; two or more is silence
 * because a repository holding several applications is undefined here, and naming one of them would be
 * a recommendation this module has no basis for making.
 */

import { DetectContext, findAnyReadManifest } from './signals.js';

/** The directory a repository's application appears to sit in, and the manifest that says so. */
export interface NestedApplication {
  /** Repo-relative name of the direct subdirectory — never `.`, never nested further. */
  readonly dir: string;
  /** Repo-relative path of the manifest found under it, exactly as `findAnyReadManifest` answered it. */
  readonly manifest: string;
}

/**
 * Direct subdirectories never treated as the application, skipped before a probe is spent on them.
 *
 * **This module's own list, deliberately not `detect/signals.ts`'s `NON_PACKAGE_DIR_NAMES`.** That one
 * answers a different question — which child is the importable Python package — and this one has an
 * exclusion that question does not need: a build-output or dependency tree legitimately contains a
 * manifest (a dependency's own `package.json`, a vendored module, a staged `dist/`), and that is precisely
 * where a false *single* hit would come from. Sharing a list would tie each question's exclusions to
 * the other's.
 */
const NON_APPLICATION_DIR_NAMES: ReadonlySet<string> = new Set([
  'build',
  'dist',
  'docs',
  'examples',
  'node_modules',
  'out',
  'target',
  'test',
  'tests',
  'vendor',
  'venv',
]);

/**
 * The one direct subdirectory of `repoRoot` that carries a manifest `init` reads, or `undefined`.
 *
 * The probe is `findAnyReadManifest` over a `DetectContext(repoRoot, child)` — the same manifest table
 * detection itself uses, so a directory named here is one a re-run with `--app-dir` would actually
 * detect. Children come from `DetectContext.childDirNames`, which is sorted and excludes
 * dot-directories, so the scan is deterministic regardless of directory order on disk.
 *
 * **The residual, and the gate that removes it.** A child context's `manifestRoots` is
 * `[child, '.']`, and `findAnyReadManifest` walks its locator list **locator-first**, each locator
 * over both entries, answering the first hit. So a locator answering from the `.` leg — a manifest at
 * the root, or one a locator finds under a root subdirectory it scans of its own — pre-empts a later
 * locator's genuine hit inside `<child>/`, and a real nested application would read as no hit. The
 * locator list is not exported and the module holding it is fenced, so it cannot be walked here.
 * Instead the root is probed **once, before the children**: if `findAnyReadManifest` answers anything
 * for `DetectContext(repoRoot, '.')`, this probe is **inconclusive** and the function answers
 * `undefined` — printing nothing is the conservative failure, never a wrong note. If it answers
 * `undefined`, no locator can answer from the `.` leg of any child context either, and the per-child
 * prefix test below is provably sound.
 */
export function findNestedApplicationDir(repoRoot: string): NestedApplication | undefined {
  const root = new DetectContext(repoRoot);
  if (findAnyReadManifest(root) !== undefined) return undefined;

  let found: NestedApplication | undefined;
  for (const dir of root.childDirNames('.')) {
    if (NON_APPLICATION_DIR_NAMES.has(dir)) continue;
    const manifest = findAnyReadManifest(new DetectContext(repoRoot, dir));
    // A manifest reached through the `.` leg is the repository's, not this directory's — and the gate
    // above has already established that no such manifest exists, which is what makes the prefix test
    // an exact statement about `<dir>/` rather than a guess.
    if (manifest === undefined || !manifest.startsWith(`${dir}/`)) continue;
    if (found !== undefined) return undefined;
    found = { dir, manifest };
  }
  return found;
}

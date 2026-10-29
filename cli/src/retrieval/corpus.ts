/**
 * Enumerating the files docs retrieval indexes.
 *
 * **The rule this module exists to enforce: the corpus is exactly every Markdown file under
 * `docs.root` plus every conventions document `layers[]` names — nothing else, and no copy of that
 * list elsewhere.** The gate (`retrievalApplies` in `cli/src/config/model.ts`) is its callers' to
 * check, not this module's.
 *
 * Nothing here throws on a missing path: the corpus is navigation, so an absent `docs.root`, a missing
 * conventions document or a path resolving outside the repository becomes a warning line and the
 * rest of the corpus is still returned.
 *
 * A path is checked both lexically and **physically**: after symlink resolution it must still lie
 * inside the repository's real root, so a symlink whose target is outside is skipped with a warning,
 * while one resolving inside is kept under its own repo-relative spelling, never its target's. The
 * real root is resolved with the JS `realpathSync`, not `.native`, so it folds no case, matching the
 * Python port's `os.path.realpath`. Walk warnings are sorted by path, so their order does not depend
 * on directory order. Residual: the check runs at enumeration; a link retargeted between
 * enumeration and the read is not checked again.
 */

import { readdirSync, realpathSync, statSync } from 'node:fs';
import { join, relative, resolve, sep } from 'node:path';

import type { HarnessConfig } from '../config/model.js';
import { insideRepo } from '../core/paths.js';
import { normalizeRepoDir } from '../core/repoPaths.js';

/** The files the corpus holds and what was skipped on the way. */
export interface CorpusFiles {
  /** Repo-relative, forward slashes, de-duplicated, in code-unit order. */
  readonly files: readonly string[];
  readonly warnings: readonly string[];
}

function toRepoRelative(repoRoot: string, absolute: string): string {
  return relative(repoRoot, absolute).split(sep).join('/');
}

/** `realpathSync(repoRoot)`, or the lexical `resolve(repoRoot)` when it cannot be resolved. */
function realRootOf(repoRoot: string): string {
  try {
    return realpathSync(repoRoot);
  } catch {
    return resolve(repoRoot);
  }
}

/** Whether `candidate`'s real path lies inside `realRoot`; `undefined` when it cannot be resolved. */
function physicallyInside(realRoot: string, candidate: string): boolean | undefined {
  let real: string;
  try {
    real = realpathSync(candidate);
  } catch {
    return undefined;
  }
  return insideRepo(realRoot, real);
}

function byCodeUnit(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

/**
 * Every `*.md` under `dir`, recursively, lexically: a symlinked directory is not descended into and a
 * dangling link is dropped. Where a symlinked file points is the caller's physical check.
 */
function markdownUnder(dir: string, out: string[]): void {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      markdownUnder(full, out);
      continue;
    }
    if (!entry.name.endsWith('.md')) continue;
    if (entry.isFile() || (entry.isSymbolicLink() && statSync(full, { throwIfNoEntry: false })?.isFile() === true)) {
      out.push(full);
    }
  }
}

/** The corpus of `config` in the repository at `repoRoot`. Callers check `retrievalApplies` first. */
export function corpusFiles(repoRoot: string, config: HarnessConfig): CorpusFiles {
  const absolute: string[] = [];
  const warnings: string[] = [];
  const realRoot = realRootOf(repoRoot);

  const root = config.docs?.root;
  if (root === undefined) {
    warnings.push('docs.root is not set, so no documentation directory is indexed');
  } else {
    const dir = normalizeRepoDir(root);
    const full = join(repoRoot, dir);
    if (!insideRepo(repoRoot, full)) {
      warnings.push(`docs.root ${dir} resolves outside the repository and was skipped`);
    } else if (statSync(full, { throwIfNoEntry: false })?.isDirectory() !== true) {
      warnings.push(`docs.root ${dir} is not a directory, so no documentation directory is indexed`);
    } else if (physicallyInside(realRoot, full) !== true) {
      warnings.push(`docs.root ${dir} resolves outside the repository and was skipped`);
    } else {
      const walked: string[] = [];
      markdownUnder(full, walked);
      const escaped: string[] = [];
      for (const candidate of walked) {
        const inside = physicallyInside(realRoot, candidate);
        if (inside === true) absolute.push(candidate);
        else if (inside === false) escaped.push(toRepoRelative(repoRoot, candidate));
      }
      for (const rel of escaped.sort(byCodeUnit)) {
        warnings.push(`docs.root file ${rel} resolves outside the repository and was skipped`);
      }
    }
  }

  for (const layer of config.layers ?? []) {
    const conventions = layer.conventions;
    if (typeof conventions !== 'string' || conventions === '') continue;
    const path = normalizeRepoDir(conventions);
    const full = join(repoRoot, path);
    if (!insideRepo(repoRoot, full)) {
      warnings.push(`conventions document ${path} of layer ${layer.name} resolves outside the repository and was skipped`);
    } else if (statSync(full, { throwIfNoEntry: false })?.isFile() !== true) {
      warnings.push(`conventions document ${path} of layer ${layer.name} is missing and was skipped`);
    } else {
      const inside = physicallyInside(realRoot, full);
      if (inside === false) {
        warnings.push(`conventions document ${path} of layer ${layer.name} resolves outside the repository and was skipped`);
      } else if (inside === undefined) {
        warnings.push(`conventions document ${path} of layer ${layer.name} is missing and was skipped`);
      } else {
        absolute.push(full);
      }
    }
  }

  const files = [...new Set(absolute.map((path) => toRepoRelative(repoRoot, path)))].sort(byCodeUnit);
  return { files, warnings };
}

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
 */

import { readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

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

/** Every `*.md` under `dir`, recursively; a symlinked directory is not descended into. */
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
    } else {
      markdownUnder(full, absolute);
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
      absolute.push(full);
    }
  }

  const files = [...new Set(absolute.map((path) => toRepoRelative(repoRoot, path)))].sort((a, b) =>
    a < b ? -1 : a > b ? 1 : 0,
  );
  return { files, warnings };
}

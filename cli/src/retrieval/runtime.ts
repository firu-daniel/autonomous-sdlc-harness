/**
 * How the docs-retrieval packages reach this CLI: the optional peer set, the machine cache paths the
 * runtime installation and the model weights live at, the one predicate for "is the runtime
 * installed?", the loader and the entry resolver.
 *
 * **The rule this module exists to enforce: a retrieval package is loaded only by a dynamic `import()`
 * in this module, and only on a path that retrieves.** The packages are optional peers
 * (`.claude/context/conventions.md` → `## The stack…`, the docs-retrieval carve-out), so a verb that
 * does not retrieve must run on an installation that has none of them. `cli/test/retrieval-loading.test.mjs`
 * guards the source for a static import or an `import()` elsewhere, and runs the non-retrieval verbs
 * under a resolve hook that refuses every peer.
 *
 * **Why a runtime directory at all.** A CLI run out of `npx`'s cache does not resolve a package
 * installed in the adopting project: Node resolves a bare specifier from the importing file's
 * location. So `init` installs the peers and this CLI, at its own version, into
 * {@link retrievalRuntimeDir}, and nothing in this package resolves a peer against a second base.
 *
 * **The declared mirrors.** Two files outside the package spell literals this module owns:
 * - `cli/templates/scripts/docs-search-server.sh` mirrors all three — {@link RETRIEVAL_CACHE_DIRNAME},
 *   {@link RETRIEVAL_RUNTIME_DIRNAME} and {@link RUNTIME_CLI_RELATIVE} — as the path
 *   `$(hr_cache_dir)/retrieval/runtime/node_modules/autonomous-sdlc-harness/dist/cli.js`, which it
 *   `exec`s. `hr_cache_dir` itself mirrors `machineCacheDir()`, declared in `machine/paths.ts` →
 *   choice 2.
 * - `cli/templates/github/workflows/harness-run.yml` mirrors {@link RETRIEVAL_CACHE_DIRNAME} in the
 *   `actions/cache` path `${XDG_CACHE_HOME:-$HOME/.cache}/autonomous-sdlc-harness/retrieval`, in both
 *   the `run` and the `warm` job; its prefix mirrors `machineCacheDir()`, declared in the same choice.
 *
 * A change to a mirrored literal is an edit to every file that mirrors it, in the same change; a
 * mirror this header does not declare is a defect (`.claude/context/conventions.md` →
 * `## Configuration is the source of truth…`, the persisted-key bullet).
 */

import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';

import { HarnessError, internal } from '../core/errors.js';
import { isJsonObject, readJsonFile } from '../core/json.js';
import { packageRoot } from '../core/paths.js';
import { machineCacheDir } from '../machine/paths.js';

/** The directory under `machineCacheDir()` every retrieval artifact lives in. */
export const RETRIEVAL_CACHE_DIRNAME = 'retrieval';

/** The runtime installation's directory under {@link RETRIEVAL_CACHE_DIRNAME}. */
export const RETRIEVAL_RUNTIME_DIRNAME = 'runtime';

/** The model weights' directory under {@link RETRIEVAL_CACHE_DIRNAME}. */
const RETRIEVAL_MODELS_DIRNAME = 'models';

/** The CLI entry inside {@link retrievalRuntimeDir}, relative to it. */
export const RUNTIME_CLI_RELATIVE = 'node_modules/autonomous-sdlc-harness/dist/cli.js';

/** The runtime's installed copy of this package, two levels above its entry. */
const RUNTIME_CLI_PACKAGE_RELATIVE = dirname(dirname(RUNTIME_CLI_RELATIVE));

/** `<machineCacheDir()>/retrieval/runtime` — where `init` installs the peers and this CLI. */
export function retrievalRuntimeDir(): string {
  return join(machineCacheDir(), RETRIEVAL_CACHE_DIRNAME, RETRIEVAL_RUNTIME_DIRNAME);
}

/** `<machineCacheDir()>/retrieval/models` — the model weights, shared by every repository and worktree. */
export function retrievalModelCacheDir(): string {
  return join(machineCacheDir(), RETRIEVAL_CACHE_DIRNAME, RETRIEVAL_MODELS_DIRNAME);
}

/** This package's own manifest, which a packaging fault alone can make unreadable. */
function ownManifest(): { [key: string]: unknown } {
  const manifestPath = join(packageRoot(), 'package.json');
  const manifest = readJsonFile(manifestPath);
  if (!isJsonObject(manifest)) throw internal(`this CLI's own manifest could not be read at ${manifestPath}`);
  return manifest;
}

/** A string field of this package's own manifest. */
export function ownManifestString(key: 'name' | 'version'): string {
  const value = ownManifest()[key];
  if (typeof value !== 'string' || value === '') throw internal(`this CLI's own manifest carries no ${key}`);
  return value;
}

/**
 * Every `peerDependencies` entry of this package's own manifest whose `peerDependenciesMeta` marks it
 * optional. The manifest is the single declaration of the set; no package name is typed here.
 */
export function retrievalPeers(): readonly { name: string; range: string }[] {
  const manifest = ownManifest();
  const peers = manifest['peerDependencies'];
  const meta = manifest['peerDependenciesMeta'];
  if (!isJsonObject(peers)) return [];
  return Object.entries(peers)
    .filter(([name]) => {
      const entry = isJsonObject(meta) ? meta[name] : undefined;
      return isJsonObject(entry) && entry['optional'] === true;
    })
    .map(([name, range]) => ({ name, range: String(range) }));
}

/** The installed version of the runtime's copy of this CLI, or `undefined` when unreadable. */
function runtimeCliVersion(runtime: string): string | undefined {
  try {
    const manifest = readJsonFile(join(runtime, RUNTIME_CLI_PACKAGE_RELATIVE, 'package.json'));
    const version = isJsonObject(manifest) ? manifest['version'] : undefined;
    return typeof version === 'string' ? version : undefined;
  } catch {
    return undefined;
  }
}

/**
 * **The one predicate for "is the runtime installed?"** Three file tests against
 * {@link retrievalRuntimeDir}, resolving and loading nothing: (1) the CLI entry at
 * {@link RUNTIME_CLI_RELATIVE} exists; (2) that CLI's `package.json` carries this package's own
 * version; (3) every {@link retrievalPeers} name has a `node_modules/<name>/package.json`. `missing`
 * names this package when (1) or (2) fails, then each peer failing (3).
 *
 * Consumers: `setUpRetrieval` (Task 12) skips the install only when `installed`, and
 * `RETRIEVAL_DEPENDENCIES_CHECK` (Task 13) passes only when `installed`. Test (1) is the file
 * `docs-search-server.sh` `exec`s, so a passing `doctor` implies a launcher that finds its entry.
 * Neither consumer re-spells these tests (`.claude/context/conventions.md` →
 * `### Where a new responsibility goes`).
 */
export function retrievalRuntimeState(): { installed: boolean; version: string | undefined; missing: readonly string[] } {
  const runtime = retrievalRuntimeDir();
  const version = runtimeCliVersion(runtime);
  const missing: string[] = [];
  if (!existsSync(join(runtime, RUNTIME_CLI_RELATIVE)) || version !== ownManifestString('version')) {
    missing.push(ownManifestString('name'));
  }
  for (const { name } of retrievalPeers()) {
    if (!existsSync(join(runtime, 'node_modules', name, 'package.json'))) missing.push(name);
  }
  return { installed: missing.length === 0, version, missing };
}

/** The package a specifier addresses: its first segment, or its first two under an `@scope/`. */
function packageOf(specifier: string): string {
  const segments = specifier.split('/');
  return (specifier.startsWith('@') ? segments.slice(0, 2) : segments.slice(0, 1)).join('/');
}

/**
 * Load a module of one retrieval peer. A specifier outside the peer set is a fault in this CLI; a
 * peer this installation cannot resolve is the adopter's to install, and the message says how.
 */
export async function loadRetrievalModule<T>(specifier: string): Promise<T> {
  const name = packageOf(specifier);
  if (!retrievalPeers().some((peer) => peer.name === name)) {
    throw internal(`loadRetrievalModule was asked for ${specifier}, which is not an optional retrieval peer`);
  }
  try {
    return (await import(specifier)) as T;
  } catch (error) {
    if ((error as NodeJS.ErrnoException | null)?.code !== 'ERR_MODULE_NOT_FOUND') throw error;
    throw new HarnessError(
      `docs retrieval needs the optional package ${name}, which this installation cannot load. Run \`npx autonomous-sdlc-harness init\` in a repository with docs.retrieval on: it installs the package into ${retrievalRuntimeDir()}, and the retrieval commands run from that installation`,
    );
  }
}

/**
 * The CLI entry a non-serving retrieval child process runs: this installation's `dist/cli.js` when
 * `import.meta.resolve` succeeds for every peer (resolution only), otherwise the runtime's entry when
 * that file exists, otherwise `undefined`. The runtime answer's `source` is {@link RETRIEVAL_RUNTIME_DIRNAME},
 * so that literal is typed once in this area.
 *
 * Call it only on a retrieval path: a resolve hook sees `import.meta.resolve` too.
 *
 * It is **not** the answer to "is the runtime installed?" and not what the launcher runs — both are
 * {@link retrievalRuntimeState}'s — so a `this-installation` answer skips no install and passes no
 * check. Consumers: Task 12 (the entry for `docs fetch-models`) and Task 13 (the entry for the
 * `retrieval-index` probe).
 */
export function retrievalCliEntry():
  | { entry: string; source: 'this-installation' | typeof RETRIEVAL_RUNTIME_DIRNAME }
  | undefined {
  const resolvesHere = retrievalPeers().every(({ name }) => {
    try {
      import.meta.resolve(name);
      return true;
    } catch {
      return false;
    }
  });
  if (resolvesHere) return { entry: join(packageRoot(), 'dist', 'cli.js'), source: 'this-installation' };
  const runtimeEntry = join(retrievalRuntimeDir(), RUNTIME_CLI_RELATIVE);
  return existsSync(runtimeEntry) ? { entry: runtimeEntry, source: RETRIEVAL_RUNTIME_DIRNAME } : undefined;
}

/**
 * Where this harness's plugin lives on **this** machine — both roots of it — read from the records
 * the agent runner keeps.
 *
 * **The rule this module exists to enforce: the plugin's roots are resolved here and nowhere else in
 * the CLI, and each is re-derived on every call.** The install root carries the plugin's version in
 * its path, so a value written down once — into a generated permission entry, into a document —
 * stops being true at the next plugin upgrade while still looking right. A caller that wants a root
 * asks for it now; nothing here caches, and nothing here may be persisted.
 *
 * **Why there are two.** A helper named in an **instruction file** arrives as bytes and the agent
 * resolves the root itself; a helper named in an **agent definition body** has `${CLAUDE_PLUGIN_ROOT}`
 * substituted by the runtime. On a `directory`-sourced marketplace those two were measured to differ
 * (2026-08-26): the runtime substituted `<installLocation>/plugin` — the live source tree — while
 * `installPath` named a version-pinned cache snapshot. So {@link pluginInstallRoot} answers "where
 * the runner installed it" and {@link pluginRuntimeRoot} answers "what the runtime substitutes",
 * and on a git-sourced marketplace the two collapse to one directory.
 *
 * The files are the **agent runner's**, not this CLI's, both under {@link claudeHome}'s `plugins/`:
 * `installed_plugins.json` for the install root, and `known_marketplaces.json` — plus the
 * `.claude-plugin/marketplace.json` its `installLocation` points at — for the runtime root. Two
 * consequences follow and both are deliberate.
 *
 * 1. **They are read-only, always.** No function here writes, creates a directory, or repairs
 *    anything. A format this CLI does not recognise is the runner's to change and not ours to
 *    correct.
 * 2. **Their shape is navigated, not validated.** `version` is read past rather than pinned: a bump
 *    that adds a field would otherwise turn every working machine into a finding. Only the fields a
 *    root is navigated for are looked at, and they are checked where they are used: `installPath`
 *    on a plugin row, and `source.source` plus `installLocation` on a marketplace entry together
 *    with the plugin `source` in the manifest that entry locates. That is the opposite of
 *    `machine/registry.ts`'s `schema` handling, and the reason is ownership: that file is this
 *    CLI's own and a version it does not know means a newer CLI wrote it, while these belong to
 *    another program that may change them at any release.
 *
 * **Every failure is `undefined`, never a throw** — file absent, unreadable, unparseable, key
 * absent, no usable row. A machine where the plugin is not installed is an answer a caller has
 * something correct to do with, which is the discipline `core/git.ts`'s `hasCommits` states for the
 * same reason: the one consumer is a `doctor` check, and "not installed" is a state it reports. It
 * is also why {@link pluginRuntimeRoot} falls back to the install root rather than throwing on a
 * record it cannot navigate.
 */

import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

import { isJsonObject, readJsonFile, type JsonValue } from '../core/json.js';
import { PLUGIN_NAME } from '../core/pluginIdentity.js';
import { MARKETPLACE_NAME, PLUGIN_KEY } from '../generators/projectSettings.js';
import { claudeHome } from './paths.js';

/** The runner's plugin directory under {@link claudeHome}, and the two records inside it. */
const PLUGINS_DIRNAME = 'plugins';
const INSTALLED_PLUGINS_FILENAME = 'installed_plugins.json';
const KNOWN_MARKETPLACES_FILENAME = 'known_marketplaces.json';

/** The object keying every installed plugin's rows, and the fields one row is selected on. */
const PLUGINS_KEY = 'plugins';
const INSTALL_PATH_FIELD = 'installPath';
const SCOPE_FIELD = 'scope';
const PROJECT_PATH_FIELD = 'projectPath';

/** The marketplace entry's own fields, and the source type whose install location is a live tree. */
const SOURCE_FIELD = 'source';
const DIRECTORY_SOURCE = 'directory';
const INSTALL_LOCATION_FIELD = 'installLocation';

/** The marketplace manifest inside an install location, and the field one plugin entry is found by. */
const MARKETPLACE_MANIFEST_DIRNAME = '.claude-plugin';
const MARKETPLACE_MANIFEST_FILENAME = 'marketplace.json';
const NAME_FIELD = 'name';

/**
 * The directory of helper scripts inside an install root — the segment {@link pluginScriptsDir}
 * joins, and the one a reader outside this module recognises a helper path by. Exported so that
 * reader imports it instead of keeping a second copy: a copy of a literal is a copy that can drift,
 * and reading the name resolves no plugin and touches no filesystem.
 */
export const SCRIPTS_DIRNAME = 'scripts';

/** The suffix a helper script is named with. */
const SCRIPT_SUFFIX = '.sh';

/** The record's absolute path. A pure string: asking where it is never creates anything. */
export function installedPluginsPath(): string {
  return join(claudeHome(), PLUGINS_DIRNAME, INSTALLED_PLUGINS_FILENAME);
}

/** The marketplace register's absolute path, resolved the same pure way. */
export function knownMarketplacesPath(): string {
  return join(claudeHome(), PLUGINS_DIRNAME, KNOWN_MARKETPLACES_FILENAME);
}

/** One row's install root, or `undefined` when the row is not one or does not carry a usable path. */
function installPathOf(row: JsonValue | undefined): string | undefined {
  if (!isJsonObject(row)) return undefined;
  const value = row[INSTALL_PATH_FIELD];
  return typeof value === 'string' && value !== '' ? value : undefined;
}

/** Whether a row was installed at the given scope. */
function atScope(row: JsonValue, scope: string): boolean {
  return isJsonObject(row) && row[SCOPE_FIELD] === scope;
}

/**
 * The install root of this harness's plugin, or `undefined` when this machine has none.
 *
 * **The selection rule, in order**, because one plugin carries a row per scope it was enabled at and
 * they can name different versions:
 *
 * 1. a `project`-scope row whose `projectPath` is `repoRoot` — the row describing *this* repository,
 *    which is the one a run started here resolves the plugin through;
 * 2. failing that, a `user`-scope row — enabled once for the account, so it applies here too;
 * 3. failing that, the first row carrying a usable `installPath`, so a scope this CLI has not been
 *    taught yet still yields an answer rather than a false "not installed".
 *
 * `repoRoot` is optional so a caller with no repository can still ask; it then starts at step 2.
 */
export function pluginInstallRoot(repoRoot?: string): string | undefined {
  let parsed: JsonValue | undefined;
  try {
    parsed = readJsonFile(installedPluginsPath());
  } catch {
    return undefined;
  }
  if (!isJsonObject(parsed)) return undefined;

  const plugins = parsed[PLUGINS_KEY];
  if (!isJsonObject(plugins)) return undefined;

  const rows = plugins[PLUGIN_KEY];
  if (!Array.isArray(rows)) return undefined;

  const usable = rows.filter((row) => installPathOf(row) !== undefined);
  const here =
    repoRoot === undefined
      ? undefined
      : usable.find((row) => atScope(row, 'project') && isJsonObject(row) && row[PROJECT_PATH_FIELD] === repoRoot);
  return installPathOf(here ?? usable.find((row) => atScope(row, 'user')) ?? usable[0]);
}

/**
 * The root the **runtime** substitutes for `${CLAUDE_PLUGIN_ROOT}`, or the install root when this
 * machine gives no reason to think they differ.
 *
 * **The one case where they differ is a `directory`-sourced marketplace.** The runner reads such a
 * marketplace's manifest in place — `known_marketplaces.json` gives the entry an `installLocation`
 * equal to the source tree — while still installing the plugin as a version-pinned snapshot under
 * `installPath`. Measured 2026-08-26 on `claude` 2.1.246: a sub-agent's `${CLAUDE_PLUGIN_ROOT}`
 * resolved to `<installLocation>/<the manifest's plugin source>`, not to `installPath`. So the
 * derivation is the runner's own two records, in order: the marketplace entry for the location, and
 * the manifest at that location for this plugin's relative `source`.
 *
 * **Anything else collapses to {@link pluginInstallRoot}** — a git source, an entry this CLI cannot
 * navigate, a manifest that does not name this plugin, a `source` that is not a relative path
 * string. A git-sourced adopter therefore gets one root, which is correct: there the two are the
 * same directory. `repoRoot` is passed through to the fallback and is otherwise unused.
 */
export function pluginRuntimeRoot(repoRoot?: string): string | undefined {
  const fallback = () => pluginInstallRoot(repoRoot);

  let parsed: JsonValue | undefined;
  try {
    parsed = readJsonFile(knownMarketplacesPath());
  } catch {
    return fallback();
  }
  if (!isJsonObject(parsed)) return fallback();

  const entry = parsed[MARKETPLACE_NAME];
  if (!isJsonObject(entry)) return fallback();

  const source = entry[SOURCE_FIELD];
  if (!isJsonObject(source) || source[SOURCE_FIELD] !== DIRECTORY_SOURCE) return fallback();

  const location = entry[INSTALL_LOCATION_FIELD];
  if (typeof location !== 'string' || location === '') return fallback();

  let manifest: JsonValue | undefined;
  try {
    manifest = readJsonFile(join(location, MARKETPLACE_MANIFEST_DIRNAME, MARKETPLACE_MANIFEST_FILENAME));
  } catch {
    return fallback();
  }
  if (!isJsonObject(manifest)) return fallback();

  const plugins = manifest[PLUGINS_KEY];
  if (!Array.isArray(plugins)) return fallback();

  const row = plugins.find((candidate) => isJsonObject(candidate) && candidate[NAME_FIELD] === PLUGIN_NAME);
  const relative = isJsonObject(row) ? row[SOURCE_FIELD] : undefined;
  if (typeof relative !== 'string' || relative === '') return fallback();

  return join(location, relative);
}

/**
 * The helper scripts shipped inside an install root, by filename, in codepoint order.
 *
 * **Read from the directory rather than listed here**, and that is the point: the names are declared
 * once, in the plugin's own `scripts/README.md`, and a copy in the CLI would be a second declaration
 * that drifts the first time a helper is added or renamed. Sorted so one machine reports them the
 * same way twice, whatever order the filesystem enumerates in.
 *
 * An unreadable or absent directory is an empty list, for the module header's reason: it is the
 * runner's tree, and a caller grades what it found rather than being stopped by what it did not.
 */
export function pluginHelperScripts(installRoot: string): readonly string[] {
  const dir = pluginScriptsDir(installRoot);
  let names: string[];
  try {
    names = readdirSync(dir);
  } catch {
    return [];
  }
  return names
    .filter((name) => name.endsWith(SCRIPT_SUFFIX))
    .filter((name) => {
      try {
        return statSync(join(dir, name)).isFile();
      } catch {
        return false;
      }
    })
    .sort();
}

/** `<installRoot>/scripts` — the directory {@link pluginHelperScripts} enumerates. */
export function pluginScriptsDir(installRoot: string): string {
  return join(installRoot, SCRIPTS_DIRNAME);
}

/** `<installRoot>/scripts/<name>` — the path a helper is invoked by, joined here and nowhere else. */
export function pluginHelperPath(installRoot: string, name: string): string {
  return join(pluginScriptsDir(installRoot), name);
}

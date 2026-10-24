/**
 * Generator: the unattended profile's write protection — the set of paths a run may not write, and
 * the two rule forms each is protected in.
 *
 * **The rule this module exists to enforce: anything that runs outside the sandbox must not be
 * writable from inside it.** Every path {@link protectedPaths} names is protected on both sides: a
 * `sandbox.filesystem.denyWrite` entry for sandboxed commands, and an `Edit` deny rule for Claude's
 * file tools, which run outside the sandbox and which the profile's own `Edit(//<repoRoot>/**)` allow
 * would otherwise reach. There is no `Write` rule: `Edit(path)` rules cover every file-editing tool,
 * `Write` included, and a `Write(path)` rule is accepted, never consulted, and warned about at startup
 * (`docs/sandbox-verification.md` → F4).
 *
 * Every path is built through its owner — the outer-loop table and its path builders, the hooks
 * directory resolver, the MCP wiring's path, the profile's and the settings files' paths, the
 * configuration file's name, the run registry's two segments — never joined by hand, so the file protected is the file the writer wrote. `doctor` grades a profile on disk against
 * {@link protectedPaths} and {@link fileToolDenyRules}, so they are the one statement of the set.
 *
 * The set: the main checkout's outer-loop scripts and their library, the hooks directories, the MCP
 * wiring, the profile and the settings files, the plugin roots, the main checkout's whole `.git`, its
 * configuration file and run registry, a `.git` at each scripts-directory level, and, under the
 * sibling-run-copy glob, the same hooks, MCP and settings paths plus the {@link COPY_GIT_PATHS} rows.
 * **A run copy's `.git` must never be covered as a whole, by glob or by exact path:** on a clone that
 * closes it to the run's own sandboxed git (`docs/sandbox-verification.md` CL4), so only the trust
 * files in {@link COPY_GIT_PATHS} are protected under it. {@link retiredProtectedPaths} names the
 * entry an earlier release wrote that broke this.
 *
 * Two relative sets are projections of {@link protectedPaths}, filtered and re-rooted from its answer
 * and never listed again: {@link copySurfacePaths}, the run-copy-relative paths outside `.git` that an
 * unsandboxed checkout of a run's branch refuses to install run-authored content at, and
 * {@link jobSurfacePaths}, the checkout-relative paths outside any `.git` that a remote job's surface
 * check compares against the default branch before the job runs or loads anything from its own
 * checkout, which leaves out the run registry: a remote job neither runs nor loads it.
 *
 * Mirrors outside this package, each held equal by the suite named:
 * - `hr_run_protected_rel_paths` in `cli/templates/scripts/lib/harness-run-lib.sh` prints
 *   {@link copySurfacePaths}' lines in the same order (`cli/test/outer-loop-scripts.test.mjs`).
 * - `cli/templates/scripts/autonomous-watcher.sh` holds a copy of {@link COPY_GIT_PATHS}, each row's
 *   relative path and kind (`cli/test/watcher-run-profile.test.mjs`).
 * - The same script's `run_profile_render` holds a copy of {@link fileToolDenyRules}' kind → rule map
 *   (`cli/test/watcher-run-profile.test.mjs`): `file` → `Edit(/<p>)`; `directory` → `Edit(/<p>/**)`;
 *   `entry` → `Edit(/<p>)`, `Edit(/<p>/**)`. Any change to that map is an edit to `run_profile_render`
 *   in the same change.
 *
 * A mirror this header does not declare is a defect.
 */

import { isAbsolute, join, relative, sep } from 'node:path';

import { CONFIG_FILENAME, DEFAULTS, retrievalApplies, type HarnessConfig } from '../config/model.js';
import { internal } from '../core/errors.js';
import { appendUnique, listAt, type JsonObject, type JsonValue } from '../core/json.js';
import { defaultProjectName, worktreeGlob } from '../core/paths.js';
import { normalizeRepoDir } from '../core/repoPaths.js';
import { resolveGithooksDir } from './githooks.js';
import {
  DOCS_SEARCH_SERVER_SCRIPT_NAME,
  OUTER_LOOP_SCRIPTS,
  outerLoopRelativePath,
  outerLoopScriptPath,
  outerLoopScriptsDir,
  RUN_LIBRARY_SCRIPT_NAME,
  type OuterLoopScript,
} from './outerLoopScripts.js';
import { appendReadme, assertUsableInEntry, normalizedRoot, PROFILE_PATH } from './profileEntries.js';
import { SETTINGS_LOCAL_PATH, SETTINGS_PATH } from './projectSettings.js';
import { MCP_PATH } from './repoRoot.js';
import { SANDBOX_KEY } from './sandboxProfile.js';
import { RUN_LOGS_DIR, RUN_REGISTRY_FILENAME } from './stateDir.js';

/** How a protected path is denied; {@link fileToolDenyRules} maps each to its rules. */
export type ProtectedKind = 'file' | 'directory' | 'entry';

/** One path the profile write-protects. */
export interface ProtectedPath {
  /** Absolute, or a pattern under the sibling-worktree glob. */
  readonly path: string;
  /**
   * `entry` is a path that must not come to exist at all, as a file or as a directory: its file-tool
   * rules cover both the path and everything under it.
   */
  readonly kind: ProtectedKind;
  /** One clause, rendered into the profile's `_README` and into `doctor`'s message. */
  readonly reason: string;
}

/** What {@link protectedPaths} reads. */
export interface ProtectedPathsInput {
  readonly repoRoot: string;
  readonly workRoot: string;
  readonly config: HarnessConfig;
  /** The profile's own `permissions.additionalDirectories`, final. */
  readonly additionalDirectories: readonly string[];
}

/** What {@link applyWriteProtection} reads; `additionalDirectories` comes from the profile itself. */
export interface WriteProtectionInput {
  readonly repoRoot: string;
  readonly workRoot: string;
  readonly config: HarnessConfig;
}

const GIT_DIR = '.git';

/** One trust file under a run copy's `.git`, protected under the sibling-run-copy glob. */
export interface CopyGitPath {
  /** Relative to the run copy, `/`-separated. */
  readonly path: string;
  readonly kind: ProtectedKind;
  readonly reason: string;
}

/**
 * The run-copy `.git` paths the profile protects, in order. The runtime already refuses the first
 * three to the cwd repository's sandboxed git and leaves the last three open
 * (`docs/sandbox-verification.md` CL5); the first three are restated so the protection does not rest
 * on an undocumented default.
 */
export const COPY_GIT_PATHS: readonly CopyGitPath[] = Object.freeze([
  {
    path: `${GIT_DIR}/config`,
    kind: 'file',
    reason: "the unsandboxed wrappers' clone trust check and every git call in that run copy read it",
  },
  { path: `${GIT_DIR}/hooks`, kind: 'directory', reason: "it is git's default hooks directory for that run copy" },
  {
    path: `${GIT_DIR}/objects/info/alternates`,
    kind: 'file',
    reason: "the unsandboxed wrappers' clone trust check reads where that run copy borrows objects from",
  },
  {
    path: `${GIT_DIR}/commondir`,
    kind: 'entry',
    reason: "a planted one would redirect that run copy's git to another repository's configuration and hooks",
  },
  {
    path: `${GIT_DIR}/config.worktree`,
    kind: 'entry',
    reason: 'a planted one would be read by every git call in that run copy once extensions.worktreeConfig is on',
  },
  {
    path: `${GIT_DIR}/objects/info/http-alternates`,
    kind: 'entry',
    reason: 'a planted one would point that run copy at objects from another repository',
  },
]);

/** The main checkout's run registry, under the configured `stateDir`. */
function runRegistryPath(repoRoot: string, config: HarnessConfig): string {
  return join(repoRoot, normalizeRepoDir(config.stateDir ?? DEFAULTS.stateDir), RUN_LOGS_DIR, RUN_REGISTRY_FILENAME);
}

/**
 * Every directory strictly below `repoRoot` on the way to the scripts directory, that directory
 * included — `scripts` for the default, `tools` and `tools/harness` for `tools/harness`. None when
 * the scripts directory is the root itself or resolves outside it.
 */
function scriptsDirLevels(repoRoot: string, scriptsDir: string): readonly string[] {
  const rel = relative(repoRoot, join(repoRoot, scriptsDir));
  if (rel === '' || isAbsolute(rel) || rel === '..' || rel.startsWith(`..${sep}`)) return [];
  const segments = rel.split(sep);
  return segments.map((_, index) => join(repoRoot, ...segments.slice(0, index + 1)));
}

/** The outer-loop row whose file is `file`, or an internal fault when the table lost it. */
function rowNamed(file: string): OuterLoopScript {
  const row = OUTER_LOOP_SCRIPTS.find((script) => script.file === file);
  if (row === undefined) throw internal(`the outer-loop script table has no row for ${file}, which the write protection names`);
  return row;
}

/** The run library's row: its `subdir` is the directory the unsandboxed wrappers source from. */
function libraryDir(): string {
  const { subdir } = rowNamed(RUN_LIBRARY_SCRIPT_NAME);
  if (subdir === undefined) throw internal(`the outer-loop script table places ${RUN_LIBRARY_SCRIPT_NAME} in no subdirectory`);
  return subdir;
}

/**
 * The write-protected set, in a fixed order: the main checkout's copy of every top-level outer-loop
 * script (the unsandboxed wrappers first) and the wrappers' library, the hooks
 * directories, the MCP launch surface, the profile and the project settings files, the plugin roots,
 * the main checkout's whole `.git`, the {@link COPY_GIT_PATHS} rows under the sibling-run-copy glob,
 * the main checkout's configuration file, the run registry by its exact path, and a `.git` at each
 * level of the scripts directory. The configuration file and the `.git` levels are protected because the wrappers place
 * their main checkout from their own location, as the nearest directory holding a `.git` that is a
 * real directory without a `commondir` (`cli/templates/scripts/lib/harness-run-lib.sh` →
 * `hr_wrapper_main_of`); the run registry because the clone arm of the wrappers' target check reads
 * which run copy a branch has from it.
 *
 * The main checkout's `.git` is protected as one directory: objects reach it only through sync-in's
 * fetch, which runs outside the sandbox, and git and the unsandboxed wrappers follow its
 * configuration, hooks, `commondir`, worktree records and legacy remotes, so no sandboxed write into
 * it is needed and any could redirect them. A legacy worktree run's record lies under it too; the
 * runtime already keeps a record outside the session's cwd closed to sandboxed git
 * (`docs/sandbox-verification.md` G2), so such a run's commits go through the excluded
 * `commit-on-branch.sh` either way.
 */
export function protectedPaths({
  repoRoot,
  workRoot,
  config,
  additionalDirectories,
}: ProtectedPathsInput): readonly ProtectedPath[] {
  const glob = worktreeGlob(workRoot, config.projectName ?? defaultProjectName(repoRoot));
  const scriptsDir = outerLoopScriptsDir(config);
  const lib = libraryDir();
  const githooksDir = resolveGithooksDir(config);
  const stateDirAbs = normalizedRoot(join(repoRoot, normalizeRepoDir(config.stateDir ?? DEFAULTS.stateDir)));
  const paths: ProtectedPath[] = [];

  for (const row of OUTER_LOOP_SCRIPTS.filter((script) => script.runsUnsandboxed === true)) {
    paths.push({
      path: outerLoopScriptPath(repoRoot, config, outerLoopRelativePath(row)),
      kind: 'file',
      reason: `the main checkout's ${row.file} runs outside the sandbox`,
    });
  }
  for (const row of OUTER_LOOP_SCRIPTS.filter(
    (script) =>
      script.subdir === undefined && script.runsUnsandboxed !== true && script.file !== DOCS_SEARCH_SERVER_SCRIPT_NAME,
  )) {
    paths.push({
      path: outerLoopScriptPath(repoRoot, config, outerLoopRelativePath(row)),
      kind: 'file',
      reason: `the run watcher, the remote job or a person runs the main checkout's ${row.file} outside the sandbox`,
    });
  }
  paths.push({
    path: outerLoopScriptPath(repoRoot, config, lib),
    kind: 'directory',
    reason: 'the unsandboxed wrappers source their run library from it',
  });

  paths.push(
    { path: join(repoRoot, githooksDir), kind: 'directory', reason: 'git runs the pre-push hook from it, outside the sandbox' },
    { path: join(glob, githooksDir), kind: 'directory', reason: "a run copy's pre-push hook runs from it, outside the sandbox" },
  );

  paths.push(
    { path: join(repoRoot, MCP_PATH), kind: 'file', reason: 'the agent runner starts the MCP servers it declares outside the sandbox' },
    { path: join(glob, MCP_PATH), kind: 'file', reason: "a run copy's MCP servers start outside the sandbox" },
    {
      path: join(repoRoot, PROFILE_PATH),
      kind: 'file',
      reason: "the run watcher renders every local run's --settings file from it, and a remote job passes it with --settings",
    },
    { path: join(repoRoot, SETTINGS_PATH), kind: 'file', reason: 'Claude Code runs the hooks it declares outside the sandbox' },
    { path: join(glob, SETTINGS_PATH), kind: 'file', reason: "a run copy's session runs the hooks it declares outside the sandbox" },
    { path: join(repoRoot, SETTINGS_LOCAL_PATH), kind: 'file', reason: 'Claude Code runs the hooks it declares outside the sandbox' },
    { path: join(glob, SETTINGS_LOCAL_PATH), kind: 'file', reason: "a run copy's session runs the hooks it declares outside the sandbox" },
  );
  if (retrievalApplies(config)) {
    const docs = outerLoopRelativePath(rowNamed(DOCS_SEARCH_SERVER_SCRIPT_NAME));
    paths.push(
      {
        path: outerLoopScriptPath(repoRoot, config, docs),
        kind: 'file',
        reason: 'the docs MCP server is launched from it, outside the sandbox',
      },
      {
        path: join(glob, scriptsDir, ...docs.split('/')),
        kind: 'file',
        reason: "a run copy's docs MCP server is launched from it, outside the sandbox",
      },
      {
        path: join(glob, scriptsDir, lib),
        kind: 'directory',
        reason: "a run copy's docs MCP launcher sources its library from it",
      },
    );
  }

  for (const directory of additionalDirectories) {
    if (normalizedRoot(directory) === stateDirAbs) continue;
    paths.push({ path: directory, kind: 'directory', reason: 'the plugin guard hooks run from it, outside the sandbox' });
  }

  paths.push({
    path: join(repoRoot, GIT_DIR),
    kind: 'directory',
    reason:
      "objects reach it only through sync-in's fetch, and git and the unsandboxed wrappers follow its configuration, hooks, commondir, worktree records and legacy remotes",
  });
  for (const row of COPY_GIT_PATHS) {
    paths.push({ path: join(glob, ...row.path.split('/')), kind: row.kind, reason: row.reason });
  }
  paths.push(
    {
      path: join(repoRoot, CONFIG_FILENAME),
      kind: 'file',
      reason: 'the unsandboxed wrappers take githooksDir, defaultBranch and protectedBranches from it',
    },
    {
      path: runRegistryPath(repoRoot, config),
      kind: 'file',
      reason: "the unsandboxed wrappers' clone trust check reads which run copy each branch has from it",
    },
  );
  for (const level of scriptsDirLevels(repoRoot, scriptsDir)) {
    paths.push({
      path: join(level, GIT_DIR),
      kind: 'entry',
      reason: 'a .git here would make this directory the main checkout the unsandboxed wrappers place themselves in',
    });
  }

  return paths;
}

/**
 * The entries an earlier release wrote that {@link protectedPaths} no longer does, each with why it was
 * retired; `doctor` grades a profile still carrying one.
 */
export function retiredProtectedPaths({ repoRoot, workRoot, config }: WriteProtectionInput): readonly ProtectedPath[] {
  const glob = worktreeGlob(workRoot, config.projectName ?? defaultProjectName(repoRoot));
  return [
    {
      path: join(glob, GIT_DIR),
      kind: 'file',
      reason: "on a clone it closes the whole .git to the run's own sandboxed git",
    },
  ];
}

/**
 * Where the two projections below place the checkout and the worktree root. Neither is read from disk:
 * each projection keeps only paths relative to one of them, so any pair that does not nest gives the
 * same answer.
 */
const PLACEHOLDER_REPO_ROOT = join(sep, 'harness-placeholder', 'repo');
const PLACEHOLDER_WORK_ROOT = join(sep, 'harness-placeholder', 'work');

/** {@link protectedPaths} at the placeholder roots, with no plugin root: neither projection keeps one. */
function placeholderProtectedPaths(config: HarnessConfig): readonly ProtectedPath[] {
  return protectedPaths({
    repoRoot: PLACEHOLDER_REPO_ROOT,
    workRoot: PLACEHOLDER_WORK_ROOT,
    config,
    additionalDirectories: [],
  });
}

/** `path` relative to `root` with `/` separators, or `undefined` when it is `root` itself or not under it. */
function relativeUnder(root: string, path: string): string | undefined {
  const rel = relative(root, path);
  if (rel === '' || isAbsolute(rel) || rel === '..' || rel.startsWith(`..${sep}`)) return undefined;
  return rel.split(sep).join('/');
}

/** Each distinct value once, in first-seen order. */
function distinct(values: readonly string[]): readonly string[] {
  return [...new Set(values)];
}

/**
 * The worktree-relative protected set: {@link protectedPaths}' entries under the sibling-worktree
 * glob, the glob prefix stripped and every entry inside `.git` dropped — `<githooksDir>`,
 * `.mcp.json`, `.claude/settings.json`, `.claude/settings.local.json`, then, where docs retrieval
 * applies, `<scriptsDir>/docs-search-server.sh` and `<scriptsDir>/lib`. `/`-separated, no trailing
 * `/`, in {@link protectedPaths}' order, which is the order `hr_run_protected_rel_paths` prints.
 */
export function copySurfacePaths(config: HarnessConfig): readonly string[] {
  const glob = worktreeGlob(PLACEHOLDER_WORK_ROOT, config.projectName ?? defaultProjectName(PLACEHOLDER_REPO_ROOT));
  const paths: string[] = [];
  for (const { path } of placeholderProtectedPaths(config)) {
    const rel = relativeUnder(glob, path);
    if (rel !== undefined && rel !== GIT_DIR && !rel.startsWith(`${GIT_DIR}/`)) paths.push(rel);
  }
  return distinct(paths);
}

/**
 * The repo-relative set a remote job runs or loads from its own checkout: {@link protectedPaths}'
 * entries under the checkout itself, minus everything inside `.git`, a `.git` at any scripts
 * directory level, and the run registry. Plugin roots and the worktree entries lie outside the checkout and fall away.
 * `/`-separated, deduplicated, in {@link protectedPaths}' order.
 */
export function jobSurfacePaths(config: HarnessConfig): readonly string[] {
  const registry = runRegistryPath(PLACEHOLDER_REPO_ROOT, config);
  const paths: string[] = [];
  for (const { path } of placeholderProtectedPaths(config)) {
    if (path === registry) continue;
    const rel = relativeUnder(PLACEHOLDER_REPO_ROOT, path);
    if (rel === undefined || rel.split('/').includes(GIT_DIR)) continue;
    paths.push(rel);
  }
  return distinct(paths);
}

/**
 * The `Edit` deny rules for one protected path, in the `//` absolute form: the path for a `file`,
 * everything under it for a `directory`, and both for an `entry`. `Edit` alone covers `Write` (module
 * header).
 */
export function fileToolDenyRules(entry: ProtectedPath): readonly string[] {
  if (entry.kind === 'entry') return [`Edit(/${entry.path})`, `Edit(/${entry.path}/**)`];
  return [entry.kind === 'directory' ? `Edit(/${entry.path}/**)` : `Edit(/${entry.path})`];
}

/** The list at `path` in the rendered profile, or an internal fault naming where the template lost its shape. */
function profileList(profile: JsonObject, path: readonly string[]): JsonValue[] {
  return listAt(profile, path, () => internal(`the permission-profile template has no \`${path.join('.')}\` list`));
}

/**
 * Write-protect {@link protectedPaths} in the rendered profile, in place: each path into
 * `sandbox.filesystem.denyWrite`, its {@link fileToolDenyRules} into `permissions.deny`, and one
 * `_README` line naming the set. Applied with the sandbox opted out too: the file-tool rules hold
 * without it.
 *
 * `githooksDir` is screened first with the adopter-fixable code: no other screen covers it, and the
 * generated-entry check after this would bill it to this CLI.
 */
export function applyWriteProtection(profile: JsonObject, { repoRoot, workRoot, config }: WriteProtectionInput): void {
  assertUsableInEntry(
    resolveGithooksDir(config),
    `the configured githooksDir ${JSON.stringify(config.githooksDir)}`,
    `Set githooksDir in ${CONFIG_FILENAME} to a directory whose path carries no such character, then run init again`,
  );

  const additionalDirectories = profileList(profile, ['permissions', 'additionalDirectories']).filter(
    (entry): entry is string => typeof entry === 'string',
  );
  const paths = protectedPaths({ repoRoot, workRoot, config, additionalDirectories });

  appendUnique(
    profileList(profile, [SANDBOX_KEY, 'filesystem', 'denyWrite']),
    paths.map(({ path }) => path),
  );
  appendUnique(profileList(profile, ['permissions', 'deny']), paths.flatMap(fileToolDenyRules));

  appendReadme(
    profile,
    `WHAT RUNS OUTSIDE THE SANDBOX CANNOT BE WRITTEN FROM INSIDE IT: each path below is in \`sandbox.filesystem.denyWrite\` and has an \`Edit\` rule in \`deny\`, because the file tools run outside the sandbox. ${paths
      .map(({ path, reason }) => `${path} - ${reason}`)
      .join('; ')}. How the Linux sandbox treats a \`denyWrite\` entry containing \`*\` is unverified - it may skip one, or expand it to the paths that exist when the sandbox starts - so on Linux only the file-tool side is relied on for the globbed entries: a run copy's hooks directory, MCP wiring and settings files, its ${COPY_GIT_PATHS.map(
      ({ path }) => path,
    ).join(', ')}, and its docs-search-server.sh and library when docs retrieval applies. The run watcher passes each run a per-run copy of this file that adds that run's own copy's paths, and every other live worktree's .git pointer, by exact path, which holds on Linux too. A run's own edit under a protected worktree path, such as a change to its hooks directory or to ${MCP_PATH}, or to ${SETTINGS_PATH}, is refused by design.`,
  );
}

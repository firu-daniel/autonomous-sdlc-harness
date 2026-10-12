/**
 * Generator: the unattended profile's write protection — the set of paths a run may not write, and
 * the two rule forms each is protected in.
 *
 * **The rule this module exists to enforce: anything that runs outside the sandbox must not be
 * writable from inside it.** Every path {@link protectedPaths} names is protected on both sides: a
 * `sandbox.filesystem.denyWrite` entry for sandboxed commands, and an `Edit` and a `Write` deny rule
 * for Claude's file tools, which run outside the sandbox and which the profile's own
 * `Edit(//<repoRoot>/**)` / `Write(//<repoRoot>/**)` allows would otherwise reach.
 *
 * Every path is built through its owner — the outer-loop table and its path builders, the hooks
 * directory resolver, the MCP wiring's path, the configuration file's name — never joined by hand,
 * so the file protected is the file the writer wrote. `doctor` grades a profile on disk against
 * {@link protectedPaths} and {@link fileToolDenyRules}, so they are the one statement of the set.
 *
 * **Import cycle, deliberate:** this module imports from `permissionProfile.ts`, whose
 * `renderProfile` calls {@link applyWriteProtection}, and from `repoRoot.ts` and `sandboxProfile.ts`,
 * which both import `permissionProfile.ts`. Every binding imported from any of them is used at call
 * time only, never while a module is being evaluated; keep it that way.
 */

import { join } from 'node:path';

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
import { appendReadme, assertUsableInEntry, normalizedRoot } from './permissionProfile.js';
import { MCP_PATH } from './repoRoot.js';
import { SANDBOX_KEY } from './sandboxProfile.js';

/** One path the profile write-protects. */
export interface ProtectedPath {
  /** Absolute, or a pattern under the sibling-worktree glob. */
  readonly path: string;
  readonly kind: 'file' | 'directory';
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

/** The main repository's git directory, its default hooks directory and its two config files. */
const GIT_DIR = '.git';
const GIT_DEFAULT_HOOKS = 'hooks';
const GIT_CONFIG = 'config';
const GIT_CONFIG_WORKTREE = 'config.worktree';

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
 * The write-protected set, in a fixed order: the unsandboxed wrappers and their library, the hooks
 * directories, the MCP launch surface, the plugin roots, the main repository's git configuration and
 * the main checkout's configuration file.
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
  paths.push({
    path: outerLoopScriptPath(repoRoot, config, lib),
    kind: 'directory',
    reason: 'the unsandboxed wrappers source their run library from it',
  });

  paths.push(
    { path: join(repoRoot, githooksDir), kind: 'directory', reason: 'git runs the pre-push hook from it, outside the sandbox' },
    { path: join(glob, githooksDir), kind: 'directory', reason: "a worktree's pre-push hook runs from it, outside the sandbox" },
    {
      path: join(repoRoot, GIT_DIR, GIT_DEFAULT_HOOKS),
      kind: 'directory',
      reason: "it is git's default hooks directory, which the wrappers' hooks pin accepts",
    },
  );

  paths.push(
    { path: join(repoRoot, MCP_PATH), kind: 'file', reason: 'the agent runner starts the MCP servers it declares outside the sandbox' },
    { path: join(glob, MCP_PATH), kind: 'file', reason: "a worktree's MCP servers start outside the sandbox" },
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
        reason: "a worktree's docs MCP server is launched from it, outside the sandbox",
      },
      {
        path: join(glob, scriptsDir, lib),
        kind: 'directory',
        reason: "a worktree's docs MCP launcher sources its library from it",
      },
    );
  }

  for (const directory of additionalDirectories) {
    if (normalizedRoot(directory) === stateDirAbs) continue;
    paths.push({ path: directory, kind: 'directory', reason: 'the plugin guard hooks run from it, outside the sandbox' });
  }

  paths.push(
    {
      path: join(repoRoot, GIT_DIR, GIT_CONFIG),
      kind: 'file',
      reason: "the unsandboxed wrappers read the hooks pin's core.hooksPath from it",
    },
    {
      path: join(repoRoot, GIT_DIR, GIT_CONFIG_WORKTREE),
      kind: 'file',
      reason: 'every git call in the main checkout reads it once extensions.worktreeConfig is on',
    },
    {
      path: join(repoRoot, CONFIG_FILENAME),
      kind: 'file',
      reason: "the hooks pin compares against the githooksDir it names",
    },
  );

  return paths;
}

/** The `Edit` and `Write` deny rules for one protected path, in the `//` absolute form. */
export function fileToolDenyRules(entry: ProtectedPath): readonly string[] {
  const target = entry.kind === 'directory' ? `${entry.path}/**` : entry.path;
  return [`Edit(/${target})`, `Write(/${target})`];
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
    `WHAT RUNS OUTSIDE THE SANDBOX CANNOT BE WRITTEN FROM INSIDE IT: each path below is in \`sandbox.filesystem.denyWrite\` and has an \`Edit\` and a \`Write\` rule in \`deny\`, because the file tools run outside the sandbox. ${paths
      .map(({ path, reason }) => `${path} - ${reason}`)
      .join('; ')}. Linux skips a \`denyWrite\` entry containing \`*\`, so there the worktree-glob entries - the worktree's hooks directory and MCP wiring, and its docs-search-server.sh and library when docs retrieval applies - hold on the file-tool side only. A run's own edit under a protected worktree path, such as a change to its hooks directory or to ${MCP_PATH}, is refused by design.`,
  );
}

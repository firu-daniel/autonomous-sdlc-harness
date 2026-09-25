/**
 * Generator: the outer-loop scripts — the run watcher, the git wrappers, the worktree tooling, the
 * flow walker with its gate library and flow graph, and the shared library they all source —
 * written into the adopter's configured `scriptsDir`.
 *
 * **The rule this module exists to enforce: {@link OUTER_LOOP_SCRIPTS} is the single declaration of
 * which outer-loop files ship, where each one lands, what mode it carries and which of them an
 * agent may be allowed to run.** A file is added to the set by adding its template and its row and
 * nothing else: the template path, the write, the invocation string and the permission profile's
 * decision are all derived from the row. A `.sh` name spelled as a string literal anywhere else in
 * the CLI is a second source for this table and will drift from it.
 *
 * ## Three non-obvious choices, and where each comes from
 *
 * 1. **These templates carry no `{{token}}` and are copied verbatim.** The wrapper generator
 *    renders tokens because a wrapper's body is a *detected* value; nothing here is. Every one of
 *    these scripts reads `<repo_root>/harness.config.json` at run time through the one shared
 *    library the `lib` row below writes beside them, because a guard whose protected-branch set was
 *    frozen into a file when `init` ran enforces the wrong set the moment `protectedBranches` changes —
 *    and that failure is silent. Verbatim copies are also what makes the `create-if-absent` re-run
 *    contract trivial here: there is no generated content for a second run to disagree about.
 * 2. **The set is written whatever the repository looks like — there is no selection rule.** The
 *    wrapper set has one (`selectWrapper`) because a wrapper exists only for a command that
 *    resolved. These scripts are the flow's own machinery rather than a view of the adopter's
 *    commands, so every row is written on every run, and the only question a consumer asks about a
 *    row is {@link OuterLoopScript.agentInvocable}.
 * 3. **The invocation string comes from `scriptInvocation`, in `generators/scripts.ts`.** That is
 *    the single producer of `bash <scriptsDir>/<file>`, and the permission profile derives its
 *    three allow forms from that exact string. Formatting the same shape here would be a second
 *    producer, and the two would disagree the first time either is corrected.
 *
 * ## Scope this release
 *
 * This module is the **writer**. The set below grows one row at a time as each script's template
 * lands, and the ordering rule is the one stated on {@link OUTER_LOOP_SCRIPTS}: a row arrives in
 * the same change as its template, never before it, so a generated permission profile can never
 * allow-list a file that was never written.
 */

import { join } from 'node:path';

import { DEFAULTS, type HarnessConfig } from '../config/model.js';
import { readTemplate } from '../core/paths.js';
import { normalizeRepoDir } from '../core/repoPaths.js';
import type { WritePlan } from '../core/writer.js';
import { scriptInvocation } from './scripts.js';

/**
 * One outer-loop file: what it is called, where under `scriptsDir` it lands, the mode it carries
 * and whether a dispatched agent is ever the thing that runs it.
 */
export interface OuterLoopScript {
  /** File name, in `cli/templates/scripts/` and in the adopter's `scriptsDir` alike. */
  readonly file: string;
  /**
   * The subdirectory of `scriptsDir` the file lands in, mirrored in the template tree. Absent means
   * directly in `scriptsDir`, which is where every *invoked* script lives.
   */
  readonly subdir?: 'lib' | 'flows';
  /**
   * The file mode. `0o755` for a script something executes; `0o644` for one that is only ever
   * sourced or read as data, because an executable bit on a sourced library invites a caller to run
   * it instead.
   */
  readonly mode: number;
  /**
   * **The input to the permission profile's entries for these scripts, and the only one.** `true`
   * exactly when a *dispatched agent* or *the orchestrating session* is the thing that runs the
   * file — the git wrappers an agent is told to commit, push and refresh its branch through, the
   * scratch runner it executes a probe or a mutation check with, and the flow walker the
   * orchestrating session steps a flow with. The watcher, the daemon wrappers and
   * the worktree and cleanup scripts are run by the watcher process or by a person, so they are
   * `false`: the flag records which of those two runs a script, and the profile follows it so an
   * agent is not handed an entry for a script nothing dispatches it to run.
   *
   * **This flag decides the permission profile and nothing else.** It does not make a script
   * unreachable: the plugin's script-allowlist guard auto-allows a `.sh` under `scriptsDir`
   * whose basename it does not deny (bounded by that guard's construct scan, which withholds the
   * allow from a command carrying `$(…)`, a backtick, `|`, `<`, a non-`${IDENT}` braced form, or a
   * `>` that is neither a descriptor duplication nor a redirection to the literal `/dev/null`), so a
   * row that must not be agent-runnable needs an entry in
   * that guard's `DENY_SCRIPT_BASENAMES` as well as `agentInvocable: false` here. Only three of
   * the `false` rows carry that entry today — `autonomous-watcher.sh`, `restart-watcher.sh` and
   * `cleanup-merged-worktrees.sh`. For the worktree scripts, the notifier, the stream formatter and
   * the docs-retrieval server launcher — which the agent runner starts from `.mcp.json` —
   * `false` is a calling convention rather than a gate: the guard auto-allows them, deliberately.
   *
   * A row is added by the change that adds its template, so this flag can only ever describe a
   * file that is really written — which is what keeps a generated profile from allow-listing a
   * path that resolves to nothing.
   */
  readonly agentInvocable: boolean;
}

/**
 * The run watcher's file name, named on its own because a second consumer needs it: `daemon/backend.ts`
 * resolves the script the daemon runs as `<repoRoot>/<scriptsDir>/<this>`, and the daemon and the
 * writer disagreeing about the name would install a unit whose program was never written.
 *
 * It is still one declaration — the row below is built from it — so the file is renamed here and
 * nowhere else.
 */
export const WATCHER_SCRIPT_NAME = 'autonomous-watcher.sh';

/**
 * The notifier's file name, named on its own for the same reason {@link WATCHER_SCRIPT_NAME} is:
 * `doctor --test-notification` runs this file, so the command and the writer would otherwise be two
 * spellings of one name — the second source this module's header refuses.
 *
 * The row below is built from it, so the file is renamed here and nowhere else.
 */
export const NOTIFY_SCRIPT_NAME = 'autonomous-notify.sh';

/**
 * The docs-retrieval server launcher's file name, named on its own for the same reason
 * {@link WATCHER_SCRIPT_NAME} is: `generators/repoRoot.ts` → `retrievalWiring` joins it into
 * `.mcp.json`'s launcher argument, and that argument and the writer disagreeing would declare a
 * server whose program was never written.
 *
 * The row below is built from it, so the file is renamed here and nowhere else.
 */
export const DOCS_SEARCH_SERVER_SCRIPT_NAME = 'docs-search-server.sh';

/**
 * The whole outer-loop set, in the order `init` writes it: the shared library first, because every
 * other row sources it, and each further library or data file before the script that sources or
 * reads it.
 *
 * **Declared once, here.** One row is one line, and adding a script is adding its template plus its
 * row — no condition threaded through the writer, no second list to keep in step.
 */
export const OUTER_LOOP_SCRIPTS: ReadonlyArray<OuterLoopScript> = Object.freeze([
  Object.freeze({ file: 'harness-run-lib.sh', subdir: 'lib', mode: 0o644, agentInvocable: false }),
  Object.freeze({ file: 'commit-on-branch.sh', mode: 0o755, agentInvocable: true }),
  Object.freeze({ file: 'push-branch.sh', mode: 0o755, agentInvocable: true }),
  Object.freeze({ file: 'refresh-branch.sh', mode: 0o755, agentInvocable: true }),
  // The one row that executes an ARGUMENT, so its safety is in the script rather than in this flag:
  // it runs a file only from `<state_dir>/scratch/` and refuses every other path. It carries NO
  // `DENY_SCRIPT_BASENAMES` entry in the script-allowlist guard, and that omission is the decision —
  // the guard route is what makes the runner reachable on an adoption whose profile has not been
  // regenerated, which is the whole point of shipping it as a script rather than as an interpreter
  // allow entry.
  Object.freeze({ file: 'scratch-run.sh', mode: 0o755, agentInvocable: true }),
  // Sourced and read by `flow-walker.sh` from its own directory, never run.
  Object.freeze({ file: 'flow-walker-gates.sh', subdir: 'lib', mode: 0o644, agentInvocable: false }),
  Object.freeze({ file: 'task_plan_writing.graph.json', subdir: 'flows', mode: 0o644, agentInvocable: false }),
  // Run by the orchestrating session; no `DENY_SCRIPT_BASENAMES` entry, because it must be reachable.
  Object.freeze({ file: 'flow-walker.sh', mode: 0o755, agentInvocable: true }),
  Object.freeze({ file: 'create-worktree.sh', mode: 0o755, agentInvocable: false }),
  Object.freeze({ file: 'setup-worktree.sh', mode: 0o755, agentInvocable: false }),
  // Started by the agent runner from `.mcp.json`, never by a dispatched agent's Bash call, so `false`
  // is a calling convention. No `DENY_SCRIPT_BASENAMES` entry: the guard auto-allowing it runs
  // nothing destructive.
  Object.freeze({ file: DOCS_SEARCH_SERVER_SCRIPT_NAME, mode: 0o755, agentInvocable: false }),
  Object.freeze({ file: 'cleanup-merged-worktrees.sh', mode: 0o755, agentInvocable: false }),
  Object.freeze({ file: 'autonomous-format-stream.sh', mode: 0o755, agentInvocable: false }),
  Object.freeze({ file: NOTIFY_SCRIPT_NAME, mode: 0o755, agentInvocable: false }),
  Object.freeze({ file: WATCHER_SCRIPT_NAME, mode: 0o755, agentInvocable: false }),
  Object.freeze({ file: 'restart-watcher.sh', mode: 0o755, agentInvocable: false }),
] as const);

/** The templates' subdirectory under `cli/templates/`, addressed as {@link readTemplate} wants it. */
const TEMPLATE_DIR = 'scripts';

/** Everything {@link writeOuterLoopScripts} needs. */
export interface OuterLoopScriptsOptions {
  /** The resolved repository root the scripts are written under. */
  readonly repoRoot: string;
  /** The config `init` is about to write, or the one already on disk on a re-run. */
  readonly config: HarnessConfig;
  /** The command's write plan; this generator enqueues into it and never touches `fs` itself. */
  readonly plan: WritePlan;
}

/** One outer-loop script that was written, or that a `--dry-run` reported it would write. */
export interface WrittenOuterLoopScript extends OuterLoopScript {
  /**
   * The **repo-relative** `bash <scriptsDir>/<file>` this script is invoked by — `scriptInvocation`'s
   * return value, unmodified, and form (i) of the three the permission profile emits for a row that
   * is {@link OuterLoopScript.agentInvocable}.
   */
  readonly invocation: string;
}

/** What the generator produced, for the profile generator and for `init`'s summary. */
export interface OuterLoopScriptsResult {
  /** The `scriptsDir` actually used: the config's value or the schema default, without a trailing `/`. */
  readonly scriptsDir: string;
  /**
   * The scripts that were written, in {@link OUTER_LOOP_SCRIPTS} order.
   *
   * **Read this, not the table, to decide what may be allow-listed**, and read each row's
   * `agentInvocable` to decide whether it may be at all.
   */
  readonly written: readonly WrittenOuterLoopScript[];
  /** Informational lines, one each, for the reporter's `info` — as `init` drains every generator's. */
  readonly notes: readonly string[];
}

/**
 * A row's path relative to `scriptsDir`, which is also its path under `cli/templates/scripts/`.
 *
 * Exported because the permission profile needs the same answer: its repo-root-absolute and
 * sibling-worktree forms are that path joined to a root, and a row in a subdirectory is the case
 * where re-deriving it from `file` alone would name a file that is not there.
 */
export function outerLoopRelativePath(script: OuterLoopScript): string {
  return script.subdir === undefined ? script.file : `${script.subdir}/${script.file}`;
}

/**
 * The directory these scripts are written into: the configured `scriptsDir`, normalized, or the
 * schema's default for an unset key.
 *
 * The one expression for it, because a reader that wanted the same answer would otherwise spell it
 * again — and a resolver disagreeing with the writer by a trailing slash or by a default names a
 * file that was never written there.
 */
export function outerLoopScriptsDir(config: HarnessConfig): string {
  return normalizeRepoDir(config.scriptsDir ?? DEFAULTS.scriptsDir);
}

/**
 * Where one of these scripts lands in a wired repository — `<repoRoot>/<scriptsDir>/<relativePath>`.
 *
 * `relativePath` is {@link outerLoopRelativePath}'s answer for the row, which for every row outside
 * `lib/` is the file name itself. Both readers of a written script — `daemon/backend.ts` for the
 * watcher the daemon runs, and `doctor` for the notifier `--test-notification` invokes — resolve it
 * through this function rather than joining the three parts again, so no reader can look for a
 * script somewhere the writer would not have put it.
 */
export function outerLoopScriptPath(repoRoot: string, config: HarnessConfig, relativePath: string): string {
  return join(repoRoot, outerLoopScriptsDir(config), ...relativePath.split('/'));
}

/**
 * Enqueue the outer-loop scripts for the configured `scriptsDir`: `ensure-dir` on the directory and
 * on every subdirectory a row asks for, then one `create-if-absent` write per row, its content read
 * from the matching template and copied through unchanged.
 *
 * `create-if-absent` is the re-run contract for this artifact, and it means what it says: an adopter
 * who edited a generated script keeps that edit byte-for-byte on the next `init`. `--force`
 * overwrites, and only after the write engine has taken a `.bak` of what was there.
 *
 * Nothing here touches the filesystem: the generator plans, and `init` applies the plan once.
 */
export function writeOuterLoopScripts({ repoRoot, config, plan }: OuterLoopScriptsOptions): OuterLoopScriptsResult {
  const scriptsDir = outerLoopScriptsDir(config);
  const written: WrittenOuterLoopScript[] = [];
  const ensured = new Set<string>();

  plan.add({ path: join(repoRoot, scriptsDir), policy: 'ensure-dir', label: 'outer-loop scripts directory' });

  for (const script of OUTER_LOOP_SCRIPTS) {
    const { subdir } = script;
    if (subdir !== undefined && !ensured.has(subdir)) {
      ensured.add(subdir);
      plan.add({
        path: join(repoRoot, scriptsDir, subdir),
        policy: 'ensure-dir',
        label: `outer-loop scripts directory ${subdir}`,
      });
    }

    const relative = outerLoopRelativePath(script);
    plan.add({
      path: join(repoRoot, scriptsDir, ...relative.split('/')),
      policy: 'create-if-absent',
      content: readTemplate(`${TEMPLATE_DIR}/${relative}`),
      label: `outer-loop script ${relative}`,
      mode: script.mode,
    });
    written.push({ ...script, invocation: scriptInvocation(scriptsDir, relative) });
  }

  const notes =
    written.length === 0
      ? []
      : [
          `${written.length} outer-loop ${written.length === 1 ? 'script was' : 'scripts were'} written into ${scriptsDir}/: they are copied verbatim rather than generated, because each one reads harness.config.json at run time instead of carrying values frozen in when init ran — so a re-run leaves an edited copy exactly as it is, and --force regenerates it after copying the current file to <name>.bak`,
        ];

  return { scriptsDir, written, notes };
}

/**
 * The machine-local directories this CLI addresses, resolved once: its own three, and the agent
 * runner's configuration home.
 *
 * **The rule this module exists to enforce: the environment variables that move any of them are read
 * here and nowhere else in the CLI.**
 * `grep -rn 'XDG_STATE_HOME\|XDG_CONFIG_HOME\|XDG_CACHE_HOME\|CLAUDE_CONFIG_DIR' cli/src` answers with this file
 * alone, which is the property that makes the resolution correctable in one place — a second reader
 * would be a second answer, and the two would disagree exactly on the machines whose environment is
 * not the default one.
 *
 * ## Three things this module is careful about
 *
 * 1. **It addresses the usage lane's directory; it never re-defines it.** {@link machineStateDir}
 *    is the same directory `docs/watcher.md` §5 publishes as the home of `usage-state.json` and
 *    `run-lane.lock/`, and that section is the format of record for both artifacts. Nothing here
 *    describes their shape, their merge rule or their lock protocol: a TypeScript consumer reads
 *    them there, and this module only says where the directory is.
 * 2. **The resolution matches the shell half byte for byte**, because the two halves address one
 *    directory on one machine: `hr_lane_dir()` in the generated `lib/harness-run-lib.sh` reads
 *    `XDG_STATE_HOME`, falls back to `$HOME/.local/state` when it is **unset or empty**, strips one
 *    trailing slash, and appends {@link MACHINE_DIR_NAME}. So does {@link resolveMachineDir}, with
 *    `homeRoot()` — `core/paths.ts`'s single definition of the account home — standing in for
 *    `$HOME`. `hr_cache_dir()` in `cli/templates/scripts/lib/harness-run-lib.sh` mirrors
 *    {@link machineCacheDir} the same way, over `XDG_CACHE_HOME` and `$HOME/.cache`: the retrieval
 *    launcher resolves the runtime it `exec`s through it, so a change to either resolution is an
 *    edit to both. `cli/templates/github/workflows/harness-run.yml` mirrors {@link machineCacheDir}'s
 *    resolution too — `XDG_CACHE_HOME`, else `$HOME/.cache`, then {@link MACHINE_DIR_NAME} — in its
 *    retrieval-cache path, so a change to that resolution or to {@link MACHINE_DIR_NAME} is an edit
 *    to the workflow template as well. A variable holding a relative path yields a relative directory here exactly as it
 *    does there. Only a target on a `WritePlan` is refused for that, and of these two directories
 *    the one that goes on a plan is {@link machineConfigDir} — `generators/notifications.ts`
 *    enqueues it under `allowOutsideRepo`. `machine/registry.ts` writes {@link machineStateDir}
 *    directly, so a relative base there lands under the process's working directory.
 * 3. **A read never creates any of these directories.** Every function here is pure string
 *    resolution — nothing touches the filesystem — so a `doctor` check or any other reader can ask
 *    where a file would be without bringing its directory into existence. Creation belongs to a
 *    writer, and a writer creates it at {@link MACHINE_DIR_MODE}: these directories hold an
 *    account's push credential and its cross-repository run state, neither of which is another
 *    account's to read. {@link claudeHome} is the one directory here **no** part of this CLI
 *    creates or writes into at all — it is the agent runner's, and this CLI only reads from it.
 */

import { homeRoot } from '../core/paths.js';

/**
 * The one directory name every machine-local tree of this CLI carries, under whichever base applies.
 *
 * It is the package name, and it is shared with the shell half's `hr_lane_dir`. Changing it here
 * without changing it there would leave two components each believing they hold the machine.
 */
export const MACHINE_DIR_NAME = 'autonomous-sdlc-harness';

/**
 * The mode a writer creates either directory at: the owner's, and nobody else's.
 *
 * The same `0700` the shell half applies with an explicit `chmod` after its `mkdir -p`, and for
 * the same reason — the mode argument of a directory creation is masked by the process umask and
 * does nothing at all for a directory that already exists, so it is applied as its own step.
 */
export const MACHINE_DIR_MODE = 0o700;

/**
 * `<base>/autonomous-sdlc-harness` for one XDG base variable and its fallback, in the shell half's
 * exact order: the variable when it holds something, the fallback under {@link homeRoot} otherwise,
 * then one trailing slash stripped.
 *
 * The result is joined with a literal separator rather than through `path.join`, which would
 * normalise a base of `/` into a relative result — the one input where the two spellings differ,
 * and the shell half's answer is the absolute one.
 */
function resolveMachineDir(variable: string, fallback: string): string {
  const configured = process.env[variable];
  const base = configured === undefined || configured === '' ? `${homeRoot()}/${fallback}` : configured;
  const stripped = base.endsWith('/') ? base.slice(0, -1) : base;
  return `${stripped}/${MACHINE_DIR_NAME}`;
}

/**
 * The machine-local **state** directory — `${XDG_STATE_HOME:-$HOME/.local/state}/autonomous-sdlc-harness`.
 *
 * What lives in it is machine-scoped run state that no single repository owns: the usage lane's two
 * artifacts, published by `docs/watcher.md` §5, and the registry of initialized repositories, which
 * that section is explicit is a different artifact defined elsewhere.
 */
export function machineStateDir(): string {
  return resolveMachineDir('XDG_STATE_HOME', '.local/state');
}

/**
 * The machine-local **configuration** directory — `${XDG_CONFIG_HOME:-$HOME/.config}/autonomous-sdlc-harness`.
 *
 * What lives in it is an operator's own settings rather than a repository's: `docs/watcher.md` §6's
 * `push.env` is the one file this release puts there, and it comes first in that section's
 * precedence because a push credential belongs to a person and a machine rather than to a checkout.
 */
export function machineConfigDir(): string {
  return resolveMachineDir('XDG_CONFIG_HOME', '.config');
}

/**
 * The machine-local **cache** directory — `${XDG_CACHE_HOME:-$HOME/.cache}/autonomous-sdlc-harness`.
 *
 * What lives in it is re-creatable and shared by every repository on the machine: the docs-retrieval
 * runtime installation and its model weights, whose paths `retrieval/runtime.ts` owns.
 */
export function machineCacheDir(): string {
  return resolveMachineDir('XDG_CACHE_HOME', '.cache');
}

/**
 * The environment variable that relocates the agent runner's configuration home, and the directory
 * name it falls back to under {@link homeRoot}.
 */
const CLAUDE_HOME_VARIABLE = 'CLAUDE_CONFIG_DIR';
const CLAUDE_HOME_FALLBACK = '.claude';

/**
 * The **agent runner's** configuration home — `${CLAUDE_CONFIG_DIR:-$HOME/.claude}`.
 *
 * Not this CLI's directory and never written to: what it holds that the CLI reads is the record of
 * which plugins are installed and where (`machine/plugins.ts`), which is the one machine-local fact
 * `init` cannot generate an answer for. It is resolved here rather than beside that reader for the
 * module rule above — one home for the variable, so a scratch home an operator or a test points the
 * runner at moves every reader with it instead of half of them.
 *
 * Same three properties as the two directories above: the variable when it holds something, the
 * fallback otherwise, one trailing slash stripped, and no filesystem touch.
 */
export function claudeHome(): string {
  const configured = process.env[CLAUDE_HOME_VARIABLE];
  const base =
    configured === undefined || configured === '' ? `${homeRoot()}/${CLAUDE_HOME_FALLBACK}` : configured;
  return base.endsWith('/') ? base.slice(0, -1) : base;
}

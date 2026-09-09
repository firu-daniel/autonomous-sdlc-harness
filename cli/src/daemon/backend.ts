/**
 * Which service manager this host can install the run daemon into, and where the run watcher is.
 *
 * **The rule this module exists to enforce: there is one detection, and `doctor` and `daemon` both
 * import it.** The two commands must agree — `doctor` telling an operator the daemon is installable
 * while `daemon install` refuses, or the reverse, is worse than either answer alone, because the
 * operator has no way to tell which one is wrong. A second copy of the probe in the command that
 * wanted a slightly different message is how that disagreement starts, so the messages live here
 * too, as the `reason` string each result carries.
 *
 * Two invariants hold in every probe below:
 *
 * 1. **`execFileSync` with an argv array, never a shell string** — no `shell: true`, no `which`
 *    pipeline, no interpolation. A pipeline would be a compound command, which an unattended run's
 *    permission profile cannot allow-list as one literal, and which stalls rather than failing.
 * 2. **Every probe is bounded and its output discarded.** A service manager that hangs must cost a
 *    timeout rather than the run: `doctor` is the command an operator reaches for *because*
 *    something is wrong with the host, and it has to answer.
 *
 * ## The watcher is the repository's, not this package's
 *
 * The daemon runs one script — the run watcher — and `init` writes it into the adopter's configured
 * `scriptsDir` with the rest of the outer-loop set. {@link resolveWatcherPath} therefore joins the
 * repository root to that configured directory, and {@link WATCHER_ABSENCE_MESSAGE} is the one
 * sentence both commands use when nothing is there: `doctor` reports it as a warning, so a
 * repository whose watcher was deleted still exits 0, and `daemon install` refuses, because
 * installing a unit whose `ExecStart` points at nothing gives a service that restarts forever and
 * logs nothing anyone reads.
 *
 * The path is **repo-relative and not a configuration key of its own**: `scriptsDir` already is one,
 * and the file name comes from `generators/outerLoopScripts.ts`'s table — the single declaration of
 * which outer-loop files ship and where each lands — so the writer and the daemon cannot disagree
 * about what the daemon runs. Resolving against the repository is also what keeps the rendered
 * unit's `ExecStart` inside the same repository its `WorkingDirectory` already names: a CLI invoked
 * through `npx` lives in a cache directory that is deleted out from under a long-running service,
 * and a package-relative program would have made that path a daemon's `ExecStart`. `--watcher`
 * overrides it for developing against a watcher that is not the written one.
 */

import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join, resolve } from 'node:path';

import type { HarnessConfig } from '../config/model.js';
import { homeRoot } from '../core/paths.js';
import { outerLoopScriptPath, WATCHER_SCRIPT_NAME } from '../generators/outerLoopScripts.js';

/** The service manager the run daemon is installed into, or `none` when this host has neither. */
export type DaemonBackendKind = 'launchd' | 'systemd' | 'none';

/** What {@link detectBackend} found. */
export interface DaemonBackend {
  /** The service manager to use, or `none`. */
  readonly kind: DaemonBackendKind;
  /**
   * One line saying what was found and — for `none` — what the operator can do about it. Written
   * for a person reading `doctor`'s report or a refusal from `daemon install`.
   */
  readonly reason: string;
  /**
   * The **directory** this backend loads a user unit from — `~/Library/LaunchAgents` for launchd,
   * `~/.config/systemd/user` for systemd — and `undefined` for `none`.
   *
   * It is a directory rather than a file because the file's name is derived from the repository
   * the daemon is installed for, which detection has no access to; `daemon/units.ts` joins this to
   * the name it computes, so the install location has one definition and the two halves cannot
   * disagree.
   */
  readonly unitPath?: string;
}

/** `launchctl`'s `--version`-equivalent: it prints the running launchd's version and exits 0. */
const LAUNCHCTL_PROBE: readonly string[] = Object.freeze(['version']);

/** `systemctl`'s version probe — resolution of the binary only, not of a user instance. */
const SYSTEMCTL_PROBE: readonly string[] = Object.freeze(['--version']);

/**
 * The per-user-instance probe.
 *
 * `--user show-environment` exits 0 exactly when the calling account's systemd manager is reachable
 * over its bus, which is the condition a user unit needs and the binary's presence does not imply —
 * a container image or an `ssh` session with no user bus has `systemctl` and no manager to talk to.
 * `is-system-running` is the obvious alternative and is wrong here: it reports `degraded` with a
 * non-zero status on a perfectly usable host, which would demote a working backend to `none`.
 */
const SYSTEMD_USER_PROBE: readonly string[] = Object.freeze(['--user', 'show-environment']);

/** Longest a probe may take before it is treated as "this tool did not answer". */
const PROBE_TIMEOUT_MS = 5_000;

/** The launchd user-agent directory, relative to the account home. */
const LAUNCHD_UNIT_DIR: readonly string[] = Object.freeze(['Library', 'LaunchAgents']);

/** The systemd user-unit directory, relative to the account home. */
const SYSTEMD_UNIT_DIR: readonly string[] = Object.freeze(['.config', 'systemd', 'user']);

/**
 * The single sentence both commands use for the watcher's absence.
 *
 * Exported rather than written twice so a `doctor` warning and a `daemon install` refusal cannot
 * describe the same condition differently — the second-worst outcome after describing it wrongly.
 *
 * It names the two ways a wired repository reaches this state, because they are the two the operator
 * has to choose between: the file was removed, or `scriptsDir` was changed and `init` has not been
 * run since. Both are repaired by the same command, which is why the remedy is one sentence.
 */
export const WATCHER_ABSENCE_MESSAGE =
  'the run watcher is written into the configured scriptsDir by `init`, so nothing there means it was removed, or scriptsDir was changed without a re-run';

/** Where the run watcher is, and whether it is there. */
export interface WatcherPath {
  /** Absolute path — under the repository's configured `scriptsDir`, or the `--watcher` override resolved. */
  readonly path: string;
  /** A plain existence check: an `init`-wired repository that nobody has edited answers true. */
  readonly present: boolean;
}

/** Everything {@link resolveWatcherPath} needs, and what each caller already has to hand. */
export interface WatcherLocation {
  /** The resolved repository root — the checkout `init` wrote the outer-loop scripts under. */
  readonly repoRoot: string;
  /** That repository's configuration, read for `scriptsDir` and for nothing else. */
  readonly config: HarnessConfig;
  /** `--watcher`: a development override, resolved against the current directory. */
  readonly override?: string;
}

/**
 * Run a tool with a fixed argument vector and report whether it answered.
 *
 * Both failure modes collapse to `false` on purpose: a tool that is not on PATH and a tool that
 * exited non-zero are the same answer to the only question asked — can this host's service manager
 * be driven from here. The distinction that *does* matter, between "no systemctl" and "systemctl
 * with no user instance", is drawn by which probe failed, not by how it failed.
 */
function toolResponds(command: string, args: readonly string[]): boolean {
  try {
    execFileSync(command, [...args], {
      stdio: ['ignore', 'ignore', 'ignore'],
      timeout: PROBE_TIMEOUT_MS,
      windowsHide: true,
    });
    return true;
  } catch {
    return false;
  }
}

/** `~/Library/LaunchAgents` — where a launchd user agent is installed. */
export function launchdUnitDir(): string {
  return join(homeRoot(), ...LAUNCHD_UNIT_DIR);
}

/** `~/.config/systemd/user` — where a systemd user unit is installed. */
export function systemdUnitDir(): string {
  return join(homeRoot(), ...SYSTEMD_UNIT_DIR);
}

/**
 * Detect the service manager the run daemon can be installed into.
 *
 * The order is fixed and first-match-wins:
 *
 * 1. **launchd**, when this is macOS *and* `launchctl` answers. The platform check comes first
 *    because launchd is not something a non-macOS host has a working `launchctl` for.
 * 2. **systemd**, when `systemctl` answers *and* the calling account's user instance is reachable.
 *    Both halves are required: a `systemctl` with no user manager behind it produces a unit file
 *    that installs and never starts, which is the failure this second probe exists to turn into an
 *    up-front `none` with a fixable reason.
 * 3. **none** otherwise, always with a reason naming what was missing. `none` is a statement about
 *    the host, not an error — the caller decides whether it is fatal (`daemon install`) or a
 *    reported condition (`doctor`).
 */
export function detectBackend(): DaemonBackend {
  const platform = process.platform;
  const isMac = platform === 'darwin';

  if (isMac && toolResponds('launchctl', LAUNCHCTL_PROBE)) {
    return {
      kind: 'launchd',
      reason: 'macOS with a responding launchctl: the run daemon installs as a launchd user agent',
      unitPath: launchdUnitDir(),
    };
  }

  if (toolResponds('systemctl', SYSTEMCTL_PROBE)) {
    if (toolResponds('systemctl', SYSTEMD_USER_PROBE)) {
      return {
        kind: 'systemd',
        reason: 'systemd with a reachable per-user instance: the run daemon installs as a user unit',
        unitPath: systemdUnitDir(),
      };
    }
    return {
      kind: 'none',
      reason:
        'systemctl responded but this account has no reachable systemd user instance (systemctl --user show-environment failed), so a user unit would install and never start: run the install from a logged-in session of the account that will own the run, or enable lingering for that account',
    };
  }

  if (isMac) {
    return {
      kind: 'none',
      reason:
        'this host reports itself as macOS but launchctl did not answer, and there is no systemctl either: the run daemon has no service manager to install into here',
    };
  }

  return {
    kind: 'none',
    reason: `no supported service manager on ${platform}: the run daemon needs launchd (macOS) or a systemd user instance`,
  };
}

/**
 * Where the run watcher is, and whether it is there.
 *
 * With no override the answer is `<repoRoot>/<scriptsDir>/<watcher>` — where `init` wrote it, taken
 * from the writer's own {@link outerLoopScriptPath} so the daemon and the generator cannot resolve
 * one configured `scriptsDir` differently. A `--watcher` value is resolved against the current
 * directory instead, so a relative one behaves the way a path typed on a command line does.
 *
 * `present` is a plain existence check and is deliberately not upgraded to an executability or
 * shebang check: the generated copy is the adopter's to edit, and a stricter probe here would start
 * refusing to install a daemon over an edit that is none of this command's business.
 */
export function resolveWatcherPath({ repoRoot, config, override }: WatcherLocation): WatcherPath {
  const trimmed = override?.trim();
  const path =
    trimmed !== undefined && trimmed !== ''
      ? resolve(trimmed)
      : outerLoopScriptPath(repoRoot, config, WATCHER_SCRIPT_NAME);
  return { path, present: existsSync(path) };
}

/**
 * The full sentence for a missing watcher, built from {@link WATCHER_ABSENCE_MESSAGE} so the
 * warning `doctor` prints and the refusal `daemon install` throws say the same thing about the same
 * path.
 */
export function watcherMissingMessage(path: string): string {
  return `no run watcher at ${path}: ${WATCHER_ABSENCE_MESSAGE}. Re-run \`init\` to write it back, or point --watcher at a watcher script of your own`;
}

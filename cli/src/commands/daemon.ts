/**
 * Command: `daemon` — this repository's run daemon on the service manager this host has: installing,
 * starting and stopping it, and listing every repository on this machine one is installed for.
 *
 * **The rule this module exists to enforce: the unit is written, loaded and addressed from one
 * answer.** The backend comes from `daemon/backend.ts` — the same detection `doctor` reports, so the
 * two commands can never tell an operator different things about one host — and the unit's text, its
 * install path and the identifier the service manager knows it by come from a single `renderUnit`
 * call, so a daemon cannot be installed under one name and then addressed by another. This file
 * orders those answers, writes at most one unit file and one entry in the registry
 * `machine/registry.ts` owns, and runs at most one external command; it derives none of them itself.
 *
 * ## Four non-obvious choices, and where each comes from
 *
 * 1. **launchd is driven; systemd is instructed.** The settled decision behind this command is
 *    "launchd on macOS plus a *documented* systemd unit template", and the asymmetry is the whole of
 *    what that means: a per-user systemd instance is not reliably addressable from an arbitrary
 *    process — an ssh session or a container with no user bus has `systemctl` and no manager behind
 *    it — and a `systemctl --user` call that fails there fails silently enough to look like success.
 *    So on systemd this command writes the unit and **prints** the two commands the operator runs
 *    themselves. An instruction that works beats a call that might not.
 * 2. **A missing watcher is a refusal, not a warning — and the watcher is the repository's own.**
 *    `init` writes it into the configured `scriptsDir`, so `daemon/backend.ts` resolves it under the
 *    repository root and the rendered unit's `ExecStart` names a path inside the very repository its
 *    `WorkingDirectory` already names. That is what makes an `npx`-installed CLI a non-issue: the
 *    package directory it ran from can be evicted from the cache without the service losing its
 *    program. `doctor` grades an absence a warning, because a repository whose watcher was deleted
 *    must still exit 0; `install` refuses, because a unit whose program does not exist installs
 *    cleanly and then restarts forever, logging into files nobody reads. Both use
 *    `daemon/backend.ts`'s one sentence for the condition. `--watcher` points the unit at a watcher
 *    of your own, which is how the lifecycle is exercised against a watcher under development.
 * 3. **Every refusal holds under `--dry-run` too.** A dry run computes against the real host — real
 *    detection, real watcher probe, real unit-file existence — and the preview of a run that would
 *    refuse is that refusal. A dry run that skipped the checks in order to print something would
 *    hide exactly the conditions it is run to discover.
 * 4. **`list` is the one verb that does not stand in a repository.** Every other verb opens with
 *    `resolveRepoRoot(ctx.cwd)` and `requireConfig`, because it acts on *this* repository's daemon.
 *    `list` reads machine state — `machine/registry.ts`'s registry of every repository a daemon was
 *    installed for — so it has to answer from anywhere, including a directory that is not a
 *    repository at all: an operator asking "what is armed on this machine" is very often standing
 *    outside all of them. It marks this checkout's row when there is one, and says nothing when
 *    there is not.
 *
 * ## What this command deliberately does not do
 *
 * - **It removes nothing from disk.** There is no uninstall verb: `stop` boots the service out of
 *   the session and leaves the unit file where `install` put it, so no verb here has any reason to
 *   delete a path. `list --prune` is not an exception — it removes stale *entries* from the machine
 *   registry through `machine/registry.ts` and never the unit file, the repository or a directory
 *   any of them named. Were a path-removing verb added, it would remove that single file in-process
 *   through `fs.rm` — the CLI never shells out a recursive removal (`cli.ts` header), because a
 *   user-level deny rule on that command is realistic, is evaluated before any allow, and silently
 *   blocks teardown.
 * - **It shells nothing out.** Every external invocation below is `execFileSync` with an argument
 *   vector: no shell string, no compound statement, no quoted path. That is the same form the
 *   generated permission profile teaches an unattended run to allow-list, and a call the CLI makes in
 *   any other form would be one the profile it generates cannot admit.
 * - **It does not write the watcher, and it never repairs one.** `init` writes the outer-loop scripts
 *   into the configured `scriptsDir`; this command resolves the watcher's path, refuses when nothing
 *   is there, and names it in the unit. Writing a missing one here would be a second writer for a
 *   generated file, aimed at a repository the operator only asked to install a service for.
 */

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';

import { requireConfig } from '../config/io.js';
import { EXIT, HarnessError } from '../core/errors.js';
import { probeRepoRoot, resolveRepoRoot } from '../core/git.js';
import { packageScriptsDir } from '../core/paths.js';
import { WritePlan } from '../core/writer.js';
import {
  detectBackend,
  resolveWatcherPath,
  watcherMissingMessage,
  type DaemonBackend,
  type DaemonBackendKind,
} from '../daemon/backend.js';
import { renderUnit, repoSlug, unitEnvValue, type RenderedUnit } from '../daemon/units.js';
import {
  inspect,
  readRegistry,
  registryPath,
  removeRepositories,
  upsertRepository,
  type InspectedEntry,
} from '../machine/registry.js';
import type { CommandContext, Subcommand } from './registry.js';

/** The command's one-line summary, in the usage block and at the head of its own `--help`. */
const SUMMARY = 'Install, start, stop and list run daemons (launchd on macOS, systemd unit template elsewhere)';

/** The roadmap item this command belongs to, as the registry reports it. */
const ROADMAP_ITEM = 13;

/**
 * The verbs, in the order `--help` lists them and the order they are used in.
 *
 * **This array is the verb list's one home.** Every sentence in this file that spells the list out —
 * {@link INVOCATION_FORM}, {@link verbList} — derives it from here rather than repeating it, so a
 * verb added below cannot leave a stale enumeration behind in a refusal or in the usage block.
 */
const VERBS = ['install', 'start', 'stop', 'list'] as const;

/** One of {@link VERBS}. */
type DaemonVerb = (typeof VERBS)[number];

/** The flag every verb but `list` takes: a development override for the resolved watcher. */
const WATCHER_FLAG = '--watcher';

/** The flag only `list` takes: drop the entries this listing graded stale. */
const PRUNE_FLAG = '--prune';

/** How the CLI is typed, for the messages that tell an operator what to run next. The `npx` prefix is not decoration: the rule for which occurrences carry it is stated once in `commands/init.ts`, beside its own `CLI`. */
const CLI = 'npx autonomous-sdlc-harness';

/** Mode of the written unit file: readable by the service manager, writable only by its owner. */
const UNIT_MODE = 0o644;

/** What a `PATH` is split on. Both backends are POSIX-only, so there is one separator to know. */
const PATH_SEPARATOR = ':';

/**
 * The one line explaining why the `systemctl` commands are printed rather than run. Stated once and
 * used by the three verbs that drive the service manager, so the reason cannot be given differently
 * depending on which verb the operator reached first. `list` touches no service manager and prints
 * no `systemctl` instruction, so it is the one verb that never reaches this.
 */
const SYSTEMD_PRINTED_REASON =
  'printed rather than run: a per-user systemd instance is not reliably addressable from an arbitrary process, and a systemctl call that quietly fails is worse than an instruction that works';

/**
 * How the command is invoked, written once: the registry's generic `daemon [options]` synopsis line
 * cannot show a required verb, and a refusal quotes the same form back at whoever typed it wrong.
 */
const INVOCATION_FORM = `${CLI} daemon <${VERBS.join('|')}> [${WATCHER_FLAG} <path>] [${PRUNE_FLAG}]`;

/** The lines the registry renders under this command's synopsis. */
const DAEMON_USAGE: readonly string[] = Object.freeze([
  `The verb is required: ${INVOCATION_FORM}`,
  '',
  'Verbs:',
  '  install  Render the unit for the detected backend, write it, load it, and register the repository',
  '  start    Start the installed daemon',
  '  stop     Stop the daemon loaded under this repository\'s label, whether or not its unit file is still there',
  '  list     List the repositories on this machine a daemon has been installed for',
  '',
  'Daemon options:',
  `  ${WATCHER_FLAG} <path>  Use this watcher script instead of the one init wrote into scriptsDir`,
  `  ${PRUNE_FLAG}           Remove the entries this listing graded stale — entries only, never a file`,
  '',
  `${PRUNE_FLAG} is accepted on list alone and ${WATCHER_FLAG} on the verbs that address a unit: a flag typed`,
  'on a verb that has no use for it is refused rather than quietly ignored.',
  '',
  'On macOS the lifecycle is driven for you with launchctl. On systemd the unit is written and the',
  'systemctl --user commands to load, start or stop it are printed for you to run: a per-user systemd',
  'instance is not reliably addressable from an arbitrary process.',
  '',
  'list needs neither a repository nor a harness.config.json: it reads the machine-local registry that',
  'install records every installation in, and marks this checkout when it is run inside one.',
  '',
  'The unit file is written outside the repository, at ~/Library/LaunchAgents (launchd) or',
  '~/.config/systemd/user (systemd) — one of the three paths this CLI writes there, with the machine',
  'registry repos.json that install records this repository in and the push.env that',
  'init --notifications writes. It is create-if-absent; --force regenerates it after writing a .bak',
  'sibling, and applies to install only.',
  'The file write is idempotent; the load is not — re-installing over an agent already loaded under',
  'this label exits non-zero rather than reporting a success: stop it first, then install again.',
  '',
  '--dry-run reports the unit path, the label, the exact commands and what a --prune would remove,',
  'and runs and writes nothing — including nothing into the registry.',
  'Every refusal still applies under it, so a dry run cannot report a success a real run would not have.',
]);

/** What {@link parseInvocation} extracted from the arguments left after the global flags. */
interface DaemonInvocation {
  readonly verb: DaemonVerb;
  /** `--watcher`, a development override for the watcher under the configured `scriptsDir`. */
  readonly watcher?: string;
  /** `--prune`, `list`'s own flag: remove the entries this listing graded stale. */
  readonly prune: boolean;
}

/**
 * {@link VERBS} as a sentence, for a refusal — `install, start, stop or list` as this release stands.
 *
 * Derived from the array rather than written out, so a verb added there reaches every refusal that
 * names the verbs without anyone remembering to come here.
 */
function verbList(): string {
  return `${VERBS.slice(0, -1).join(', ')} or ${VERBS[VERBS.length - 1] as string}`;
}

/**
 * Which verbs one local flag is meaningful on. A flag typed anywhere else is refused.
 *
 * The file's standard, applied to flags as {@link parseInvocation} applies it to verbs: a `--prune`
 * on `start` or a `--watcher` on `list` is a request the command cannot carry out, and silently
 * dropping it would report a success for something other than what was typed. `list` addresses no
 * unit, so there is no watcher for it to override; every other verb addresses one and has no
 * registry entries to drop.
 */
const FLAG_VERBS: Readonly<Record<string, readonly DaemonVerb[]>> = Object.freeze({
  [WATCHER_FLAG]: VERBS.filter((verb) => verb !== 'list'),
  [PRUNE_FLAG]: ['list'],
});

/** The usage a bad invocation is refused with: the verbs, and where the rest of it is. */
function usageHint(): string {
  return `usage: \`${INVOCATION_FORM}\` — run \`${CLI} daemon --help\` for the full usage`;
}

/**
 * Refuse a flag on a verb it means nothing to, naming the verbs it does mean something to.
 *
 * Checked after the whole argument list has been read rather than as each token arrives, because a
 * flag may legitimately be typed before its verb — `daemon --prune list` is the same invocation as
 * `daemon list --prune`, and neither can be judged until the verb is known.
 */
function assertFlagVerb(flag: string, verb: DaemonVerb): void {
  const allowed = FLAG_VERBS[flag] as readonly DaemonVerb[];
  if (allowed.includes(verb)) return;
  throw new HarnessError(
    `daemon: ${flag} means nothing to ${verb} — it belongs to ${allowed.join(', ')}; ${usageHint()}`,
  );
}

/**
 * Parse the verb and the two local flags.
 *
 * A missing verb, an unknown verb, a second verb, an unrecognised flag and a known flag on a verb
 * that has no use for it are all refusals rather than defaults or silent drops: this command loads
 * and unloads a background service and prunes a machine-wide index, so "did something other than
 * what was typed" is the outcome worth the most to prevent, and there is no verb harmless enough to
 * be the default.
 */
function parseInvocation(argv: readonly string[]): DaemonInvocation {
  let verb: DaemonVerb | undefined;
  let watcher: string | undefined;
  let prune = false;

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index] as string;
    const separator = token.startsWith('--') ? token.indexOf('=') : -1;
    const name = separator > 0 ? token.slice(0, separator) : token;
    const inlineValue = separator > 0 ? token.slice(separator + 1) : undefined;

    if (name === WATCHER_FLAG) {
      let value = inlineValue;
      if (value === undefined) {
        index += 1;
        value = argv[index];
      }
      if (value === undefined || value === '') {
        throw new HarnessError(`daemon: ${WATCHER_FLAG} requires <path>`);
      }
      watcher = value;
      continue;
    }

    if (name === PRUNE_FLAG) {
      // It takes no value, so `--prune=<anything>` is a misunderstanding of what it does rather
      // than a value to interpret — and the thing it would be misunderstood into is a removal.
      if (inlineValue !== undefined) {
        throw new HarnessError(`daemon: ${PRUNE_FLAG} takes no value — ${usageHint()}`);
      }
      prune = true;
      continue;
    }

    if (token.startsWith('-')) {
      throw new HarnessError(`daemon: unknown option ${JSON.stringify(name)} — ${usageHint()}`);
    }

    if (!(VERBS as readonly string[]).includes(token)) {
      throw new HarnessError(`daemon: unknown verb ${JSON.stringify(token)} — expected ${verbList()}; ${usageHint()}`);
    }
    if (verb !== undefined) {
      throw new HarnessError(`daemon: unexpected argument ${JSON.stringify(token)} after ${verb} — ${usageHint()}`);
    }
    verb = token as DaemonVerb;
  }

  if (verb === undefined) throw new HarnessError(`daemon: no verb given — expected ${verbList()}; ${usageHint()}`);
  if (watcher !== undefined) assertFlagVerb(WATCHER_FLAG, verb);
  if (prune) assertFlagVerb(PRUNE_FLAG, verb);

  return watcher === undefined ? { verb, prune } : { verb, watcher, prune };
}

/**
 * A detected backend with a unit to install: `none` removed from the type as well as from the
 * possibilities, so the value can be recorded in a registry entry without a second narrowing.
 */
type InstalledBackend = DaemonBackend & { readonly kind: Exclude<DaemonBackendKind, 'none'> };

/**
 * The detected backend, or a refusal naming the platform and what an operator can still do.
 *
 * `none` is a statement about the host rather than a fault, which is why detection returns it and
 * `doctor` prints it; for this command it is fatal, since there is nothing to install into. The
 * refusal points at the shipped systemd template, because the one remaining path on an unsupported
 * host is to adapt it by hand — the template carries every value this command would have substituted.
 */
function requireBackend(): InstalledBackend {
  const backend = detectBackend();
  if (backend.kind === 'launchd' || backend.kind === 'systemd') return { ...backend, kind: backend.kind };

  throw new HarnessError(
    `no service manager to install the run daemon into on ${process.platform}: ${backend.reason}. To run the daemon here anyway, adapt the systemd user-unit template shipped in this package's scripts directory (${packageScriptsDir()}) by hand`,
  );
}

/**
 * The calling account's numeric id, which every `launchctl` domain target below is built from.
 *
 * Unreachable in practice — the launchd backend is only ever returned on macOS, where `getuid` is
 * always there — so its absence means detection and this command disagree about what platform the
 * process is on, which is a fault in this CLI rather than in the host.
 */
function requireUid(): number {
  const getuid = process.getuid;
  if (getuid === undefined) {
    throw new HarnessError(
      'detection reported the launchd backend, but this runtime exposes no POSIX user id to build the launchctl domain target from',
      EXIT.INTERNAL,
    );
  }
  return getuid.call(process);
}

/** A finished external invocation: the status it exited with, and whatever it said about it. */
interface ToolResult {
  readonly status: number;
  /** Trimmed stderr, or the spawn failure's own message when there was no output. */
  readonly output: string;
}

/**
 * Run one tool with a fixed argument vector and report how it exited.
 *
 * A non-zero status is returned rather than thrown, so the caller can render it as the readable line
 * this command's contract promises before deciding what it means. A tool that could not be spawned
 * at all *is* thrown, because it is a different condition with a different fix: detection said this
 * host has the service manager, and the binary then was not there.
 */
function runTool(command: string, args: readonly string[]): ToolResult {
  try {
    execFileSync(command, [...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true });
    return { status: 0, output: '' };
  } catch (error) {
    const failure = error as NodeJS.ErrnoException & { status?: number | null; stderr?: string | null };
    if (failure.code === 'ENOENT') {
      throw new HarnessError(
        `${command} is not on PATH, although the daemon backend was detected as available: nothing was changed`,
      );
    }
    const status = typeof failure.status === 'number' ? failure.status : EXIT.FAILURE;
    const stderr = typeof failure.stderr === 'string' ? failure.stderr.trim() : '';
    return { status, output: stderr === '' ? failure.message : stderr };
  }
}

/**
 * How an invocation is shown to a person: the program and its arguments, space-joined.
 *
 * **Display only.** Nothing built here is ever executed — every call goes out as the argument vector
 * itself — so a value containing a space renders ambiguously and still runs as one argument.
 */
function commandLine(command: string, args: readonly string[]): string {
  return [command, ...args].join(' ');
}

/** `systemctl --user <words…>` — the exact line an operator types, printed and never run. */
function systemctlLine(...words: readonly string[]): string {
  return commandLine('systemctl', ['--user', ...words]);
}

/**
 * Run one service-manager command, report the status as a line, and refuse on a non-zero one.
 *
 * The status is reported either way, because "it ran and said 3" is the only useful thing to know
 * about a service manager that declined, and `hint` says what that usually means for the verb that
 * asked — a service already loaded, or one that was not running to begin with.
 */
function drive(ctx: CommandContext, command: string, args: readonly string[], hint: string): void {
  const line = commandLine(command, args);
  const result = runTool(command, args);

  if (result.status === 0) {
    ctx.report.ok(`${line} — exit 0`);
    return;
  }
  const detail = result.output === '' ? '' : `: ${result.output}`;
  throw new HarnessError(`${line} — exit ${result.status}${detail}. ${hint}`);
}

/**
 * The two values an operator needs to address this service by hand, and the one a dry run is asked
 * for: where the unit is, and what the service manager calls it.
 *
 * Routed through the reporter's `result` sink — stdout whatever the flags are — rather than through
 * narration, and on the same sink in both modes: they are what the command was run to find out, and
 * a quiet run that printed neither would leave the operator with nothing to type.
 */
function describeUnit(ctx: CommandContext, backend: DaemonBackend, unit: RenderedUnit): void {
  ctx.report.info(`backend: ${backend.kind} — ${backend.reason}`);
  ctx.report.result(`unit: ${unit.targetPath}`);
  ctx.report.result(`label: ${unit.label}`);
}

/** An error's message, for a line that reports a failure without being one. */
function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/**
 * What the unit already installed says about its `PATH` — the left-hand side of {@link reportEnvPath}.
 *
 * Three answers, not two. `comparable: false` covers both "nothing is installed there" and "what is
 * there could not be read": a comparison is one extra line and never a reason to refuse, so an
 * unreadable unit leaves the install reporting exactly what it reported before this comparison
 * existed. `comparable: true` with `envPath: undefined` is the third and a different one — a unit
 * that is there and carries no environment key at all.
 */
type InstalledEnvPath =
  | { readonly comparable: false }
  | { readonly comparable: true; readonly envPath: string | undefined };

/**
 * Read the installed unit's `PATH` back, through the parse that inverts the escaping the render wrote
 * (`daemon/units.ts`, {@link unitEnvValue}). Neither the path nor the backend is re-derived: both
 * come from the `renderUnit` result the caller already holds, per that module's founding rule.
 */
function installedEnvPath(kind: 'launchd' | 'systemd', path: string): InstalledEnvPath {
  if (!existsSync(path)) return { comparable: false };
  try {
    return { comparable: true, envPath: unitEnvValue(kind, readFileSync(path, 'utf8'), 'PATH') };
  } catch {
    return { comparable: false };
  }
}

/** The entries of `value` that `other` does not hold, in `value`'s own order and each named once. */
function entriesNotIn(value: string, other: string): readonly string[] {
  const present = new Set(other.split(PATH_SEPARATOR));
  const missing: string[] = [];
  for (const entry of value.split(PATH_SEPARATOR)) {
    if (!present.has(entry) && !missing.includes(entry)) missing.push(entry);
  }
  return missing;
}

/**
 * Report the `PATH` this install carries, and say whether it moved.
 *
 * On a **first** install the whole value is printed: there is nothing to diff it against, and it is
 * the one value in the unit that comes from the environment rather than from the repository, which
 * only the operator can say reaches their toolchain. A dry run renders the same value it would
 * write, so that line is this machine's own `PATH` printed by a run that writes nothing. On a
 * **re-install** the whole value in the same line and the same place is precisely what carries no
 * signal, so what is printed instead is the difference from the unit on disk — `+` for an entry this
 * install adds, `-` for one it drops, and a single line when there is neither. A key appearing or
 * disappearing is stated rather than diffed, because a set difference against nothing reads as a
 * first install.
 *
 * A dropped entry additionally goes to `warn`: a toolchain directory leaving the daemon's `PATH` is
 * the failure `daemon/units.ts` choice 5 exists to prevent, and is what `doctor`'s `daemon-path`
 * check reports later as a command the daemon cannot resolve.
 *
 * **`willReplace` decides whether the comparison may be worded as a change**, and every arm that
 * asserts one is gated on it. The unit write is `create-if-absent`, so a re-install without
 * `--force` keeps the file on disk and the daemon goes on running on exactly the `PATH` it had:
 * warning there that a directory *left* names a loss that did not happen, and its remedy — re-install
 * from a richer shell — is the same run declining to write again. On that arm the entries are still
 * printed, because the divergence between this shell and the installed unit is what the operator came
 * for, but they are printed as a comparison, on `info` (nothing was lost, so nothing needs a human),
 * and they name `--force` as what acts on it.
 *
 * **`dryRun` decides the tense of the arms `willReplace` opened.** `--force --dry-run` plans a
 * replacement and commits none, so those same sentences would assert a change from a run that writes
 * nothing — and the two that report a dropped directory go to `warn`, which prints under `--quiet`
 * where the step header saying this is a preview does not. Each therefore switches verb and says the
 * loss has not happened yet, the way `renderProfile` and `writeClaudeContext` word their own previews.
 * The comparison arms need no such gate: they are true in either mood.
 *
 * Returns whether the daemon's `PATH` moved — the second half of {@link bootstrapRefusedHint} — which
 * a run that writes nothing never did, and never reads there: `install` returns before `drive` under
 * `--dry-run`.
 */
function reportEnvPath(
  ctx: CommandContext,
  unit: RenderedUnit,
  installed: InstalledEnvPath,
  willReplace: boolean,
  dryRun: boolean,
): boolean {
  const previous = installed.comparable ? installed.envPath : undefined;
  const forceHint = `re-run \`${CLI} daemon install --force\` to write this shell's PATH into it, after a .bak`;

  if (unit.envPath === undefined) {
    if (!willReplace) {
      ctx.report.warn(
        `this shell has no PATH, so a unit rendered from it would carry no environment key — but this run keeps the unit already at ${unit.targetPath}, so what the daemon runs on does not change. A forced re-install from this shell would drop it to the service manager's own default directories`,
      );
      return false;
    }
    const noKeyRemedy = `re-run \`${CLI} daemon install --force\` from a shell whose PATH reaches the toolchain, or add the PATH by hand to ${unit.targetPath} and reload the unit`;
    ctx.report.warn(
      dryRun
        ? `this shell has no PATH, so the unit this run would write carries no environment key and would leave the daemon on the service manager's own default directories — this run writes nothing, so it is not there yet: ${noKeyRemedy}`
        : `this shell has no PATH, so the unit carries no environment key and the daemon will run on the service manager's own default directories: ${noKeyRemedy}`,
    );
    if (previous === undefined) return false;
    ctx.report.warn(
      `the unit already installed carries a PATH and this one carries none, so replacing it ${
        dryRun ? 'would drop' : 'drops'
      } the daemon to those defaults. What is installed today: ${previous}`,
    );
    return true;
  }

  if (!installed.comparable) {
    // Nothing installed, or a unit that could not be read. The first replaces; the second is a file
    // this run keeps, so the value is named as the one it would have written rather than as the
    // daemon's.
    ctx.report.info(
      willReplace
        ? `PATH the daemon will run on: ${unit.envPath}`
        : `the unit already at ${unit.targetPath} could not be read for a PATH comparison, and this run keeps it: the PATH this shell would install is ${unit.envPath}`,
    );
    return false;
  }

  if (previous === undefined) {
    if (!willReplace) {
      ctx.report.info(
        `the unit already installed carries no PATH and this run keeps it, so the daemon stays on the service manager's own default directories: ${forceHint} — this shell's is ${unit.envPath}`,
      );
      return false;
    }
    ctx.report.info(
      dryRun
        ? `the unit already installed carries no PATH, and the one this run would write carries: ${unit.envPath}`
        : `the unit already installed carries no PATH, and this one carries: ${unit.envPath}`,
    );
    return true;
  }

  if (previous === unit.envPath) {
    // The one comparison that is the same sentence either way: nothing moved and nothing would.
    ctx.report.info('PATH unchanged from the installed unit');
    return false;
  }

  const added = entriesNotIn(unit.envPath, previous);
  const removed = entriesNotIn(previous, unit.envPath);
  if (added.length === 0 && removed.length === 0) {
    // Same entries, different order — a real change when it is written, since a PATH resolves left
    // to right, and nothing at all when the unit is kept.
    ctx.report.info(
      willReplace
        ? 'PATH holds the same entries as the installed unit, in a different order'
        : `PATH holds the same entries as the installed unit in a different order, and this run keeps that unit: ${forceHint}`,
    );
    return willReplace;
  }

  if (!willReplace) {
    ctx.report.info(
      `the unit already installed carries a different PATH from this shell's, and this run keeps that unit: ${added.length} ${added.length === 1 ? 'directory' : 'directories'} this shell has that it does not, ${removed.length} it has that this shell does not. ${forceHint}`,
    );
    for (const entry of added) ctx.report.info(`  + ${entry}`);
    for (const entry of removed) ctx.report.info(`  - ${entry}`);
    return false;
  }

  ctx.report.info(
    dryRun
      ? "PATH would differ from the installed unit (+ this install's, - the installed unit's):"
      : "PATH differs from the installed unit (+ this install's, - the installed unit's):",
  );
  for (const entry of added) ctx.report.info(`  + ${entry}`);
  for (const entry of removed) ctx.report.warn(`  - ${entry}`);
  if (removed.length > 0) {
    ctx.report.warn(
      `a directory leaving the daemon's PATH is what \`${CLI} doctor\`'s daemon-path check reports later as a command the daemon cannot resolve${
        dryRun
          ? ': this run writes nothing, so nothing has left it yet — re-run without --dry-run from a shell whose PATH reaches the toolchain if that was not intended'
          : ': if that was not intended, re-install from a shell whose PATH reaches the toolchain'
      }`,
    );
  }
  return true;
}

/**
 * What a refused `launchctl bootstrap` means, in the two states an install can be refused in.
 *
 * The second arm exists because the exit code says the load failed, not that the environment moved:
 * the agent still loaded runs on the `PATH` it was loaded with, the unit file now carries a different
 * one, and the `.bak` beside it holds the only copy on disk of what is actually running. It is
 * composed from what this run measured — `backupPath` is given only when the unit was replaced *and*
 * the `PATH` changed — so an unrelated refusal is not decorated with a story that does not apply.
 */
function bootstrapRefusedHint(unit: RenderedUnit, backupPath: string | undefined): string {
  const remedy = `run \`${CLI} daemon stop\` first, then install again`;
  if (backupPath === undefined) {
    return `An agent already loaded under this label cannot be bootstrapped a second time: ${remedy}`;
  }
  return `An agent already loaded under this label cannot be bootstrapped a second time, and this install moved its PATH, so three things now disagree: the agent still running was loaded with the previous PATH, ${unit.targetPath} carries the one written just now, and ${backupPath} holds the only copy on disk of what is running. To make the running daemon and the unit file agree, ${remedy}`;
}

/**
 * Record this repository in the machine registry — the one write `install` makes besides the unit.
 *
 * **Every value comes from the answers the unit itself was written from**: the `renderUnit` result
 * (`label`, `targetPath`, the descriptive `projectName` its text carries) and the detected backend.
 * Nothing is re-derived here, which is what stops an entry describing a unit that does not exist
 * under that name — the same rule `daemon/units.ts` exists to enforce, extended one artifact further.
 *
 * **A failed registration warns and does not fail the install.** The unit is on disk and the service
 * is loadable at that point; a machine-wide index that could not be updated costs a line in
 * `daemon list` and nothing else, and reporting the install as failed would send an operator to
 * repair something that already worked. `docs/watcher.md` §7 is why that trade is safe: the registry
 * is derived state, and re-running `daemon install` rebuilds the entry.
 *
 * Registration happens on **both** backends. On systemd the load is the operator's, but the unit
 * file has been written either way, and this index mirrors installed units rather than running ones.
 */
function register(ctx: CommandContext, repoRoot: string, backend: InstalledBackend, unit: RenderedUnit): void {
  try {
    upsertRepository({
      root: repoRoot,
      projectName: unit.projectName,
      label: unit.label,
      backend: backend.kind,
      unitPath: unit.targetPath,
      registered_at: Math.floor(Date.now() / 1000),
    });
    ctx.report.ok(`registered ${repoRoot} in ${registryPath()}`);
  } catch (error) {
    ctx.report.warn(
      `the daemon is installed, but this repository could not be recorded in ${registryPath()} (${messageOf(error)}): \`${CLI} daemon list\` will not show it until a later \`daemon install\` succeeds in writing it`,
    );
  }
}

/** `daemon install`: write the unit, register the repository, then load it or print how to. */
function install(ctx: CommandContext, invocation: DaemonInvocation): number {
  const repoRoot = resolveRepoRoot(ctx.cwd);
  const config = requireConfig(repoRoot);
  const backend = requireBackend();

  // Before anything is rendered or enqueued: a unit whose program is absent is worse than no unit,
  // because it installs, starts, fails and is restarted forever.
  const watcher = resolveWatcherPath({ repoRoot, config, override: invocation.watcher });
  if (!watcher.present) throw new HarnessError(watcherMissingMessage(watcher.path));

  // `process.env.PATH` is the whole of the capture: a user unit runs on the service manager's
  // environment, not this shell's, so the PATH this command was typed at is the only evidence of
  // where the adopter's toolchain lives (`daemon/units.ts`, choice 5).
  const unit = renderUnit({ backend, config, repoRoot, watcherPath: watcher.path, envPath: process.env['PATH'] });

  ctx.report.step(ctx.flags.dryRun ? 'daemon install (dry run — nothing is written and nothing is run)' : 'daemon install');
  describeUnit(ctx, backend, unit);
  ctx.report.info(`watcher: ${watcher.path}`);

  // The installed unit is read here, before the plan below is built: that is the last moment the
  // value this install replaces still exists, and reading it before rather than after the write is
  // what lets a dry run report the comparison a real run would make. What is compared is the PATH
  // `renderUnit` says it wrote, never a second reading of the environment.
  //
  // The plan's own decision is handed to the report rather than left for it to assume: the unit
  // write below is `create-if-absent`, so this run replaces the file only when `--force` is given or
  // nothing is there, and a comparison against a unit the run then keeps must not be worded as a
  // change to it. Same predicate as the plan's, evaluated before the plan for the same reason the
  // read above is — and, like the plan's, it is only half the answer: `--dry-run` skips the one
  // commit boundary `core/writer.ts` has, so a replacement it plans is still a replacement that does
  // not happen. Both facts go to the report, which words the difference and its tense from them.
  const willReplace = ctx.flags.force || !existsSync(unit.targetPath);
  const pathMoved = reportEnvPath(
    ctx,
    unit,
    installedEnvPath(backend.kind, unit.targetPath),
    willReplace,
    ctx.flags.dryRun,
  );

  // One of the writes the CLI makes outside the repository — the others are the machine-local
  // push-notification settings file `init --notifications` writes (`generators/notifications.ts`)
  // and the registry entry below — and each is machine-local by its artifact's definition rather
  // than by its command's choice: a user unit lives in the account's home because that is where a
  // user service manager reads units from. `create-if-absent` keeps a re-install from silently
  // discarding an operator's edits to the unit; `--force` regenerates it after the engine has
  // written a `.bak` sibling.
  const plan = new WritePlan();
  plan.add({
    path: unit.targetPath,
    policy: 'create-if-absent',
    content: unit.text,
    label: `${backend.kind} unit`,
    mode: UNIT_MODE,
    allowOutsideRepo: true,
  });
  const [written] = plan.apply({ repoRoot, report: ctx.report, dryRun: ctx.flags.dryRun, force: ctx.flags.force });

  // After the unit exists and before the service manager is addressed. `upsertRepository` writes
  // when it is called and is not on the plan above (`machine/registry.ts`'s last paragraph), so a
  // dry run reports the registration it would make instead of making it.
  if (ctx.flags.dryRun) ctx.report.result(`would register ${repoRoot} in ${registryPath()}`);
  else register(ctx, repoRoot, backend, unit);

  if (backend.kind === 'systemd') {
    ctx.report.result(systemctlLine('daemon-reload'));
    ctx.report.result(systemctlLine('enable', '--now', unit.label));
    ctx.report.info(SYSTEMD_PRINTED_REASON);
    return EXIT.OK;
  }

  const args = ['bootstrap', `gui/${requireUid()}`, unit.targetPath];
  if (ctx.flags.dryRun) {
    ctx.report.result(`would run: ${commandLine('launchctl', args)}`);
    return EXIT.OK;
  }
  // The `.bak` is named only when this install both replaced the unit and moved its PATH, which is
  // the state where the running daemon, the file and the backup are three different answers.
  const replaced = pathMoved && written?.effect === 'backed-up-and-replaced' ? written.backupPath : undefined;
  drive(ctx, 'launchctl', args, bootstrapRefusedHint(unit, replaced));
  return EXIT.OK;
}

/**
 * `daemon start` / `daemon stop`.
 *
 * The unit is re-rendered rather than looked up, because rendering is what produces the label and the
 * install path *together*: composing the label here from the configuration would be a second
 * derivation of it, and the day the two disagreed the daemon would be one no `stop` could reach.
 * Its text is discarded — nothing is written by either verb.
 *
 * The file precondition is `start`'s alone. What `stop` is asked is whether an agent is loaded under
 * this label, which the unit file's presence does not answer and `bootout` does not need — the label
 * arrives from the same `renderUnit` call the path does, so nothing is re-derived to reach it, and a
 * unit file deleted by hand while its agent is still loaded (the only removal route this CLI
 * documents, per the header) must leave a note behind rather than a stranded daemon. `start` keeps
 * the precondition, and for two reasons rather than one: on systemd the `systemctl --user start`
 * line it prints reads the unit file, so the file is a real requirement; on launchd `kickstart`
 * addresses a loaded label and would not need it either, so the check there is a deliberate guard —
 * a missing unit almost always means the operator wants `install`, and `start` is the one verb
 * whose pointing at `install` leads nowhere circular.
 */
function lifecycle(ctx: CommandContext, invocation: DaemonInvocation, verb: 'start' | 'stop'): number {
  const repoRoot = resolveRepoRoot(ctx.cwd);
  const config = requireConfig(repoRoot);
  const backend = requireBackend();
  const watcher = resolveWatcherPath({ repoRoot, config, override: invocation.watcher });
  // Rendered for its label and its path; the text — and so this PATH — is discarded. The value is
  // supplied all the same because `renderUnit` requires one, which is what stops a second call site
  // from quietly rendering a different unit than the one `install` writes.
  const unit = renderUnit({ backend, config, repoRoot, watcherPath: watcher.path, envPath: process.env['PATH'] });

  const installed = existsSync(unit.targetPath);
  if (verb === 'start' && !installed) {
    throw new HarnessError(
      `no ${backend.kind} unit at ${unit.targetPath}, so there is nothing to ${verb}: run \`${CLI} daemon install\` first`,
    );
  }

  ctx.report.step(ctx.flags.dryRun ? `daemon ${verb} (dry run — nothing is run)` : `daemon ${verb}`);
  describeUnit(ctx, backend, unit);
  // Reported under `--dry-run` too (choice 3 in the header): a dry run that dropped this would hide
  // the state it was run to discover. It names no next command — an `install` over a still-loaded
  // agent is the one that is guaranteed to fail.
  if (!installed) ctx.report.warn(missingUnitNote(repoRoot, backend, unit, verb));

  if (backend.kind === 'systemd') {
    ctx.report.result(systemctlLine(verb, unit.label));
    ctx.report.info(SYSTEMD_PRINTED_REASON);
    return EXIT.OK;
  }

  const uid = requireUid();
  const target = `gui/${uid}/${unit.label}`;
  // `kickstart -k` starts the service and restarts it if it was already running, which is what makes
  // `start` usable as "make it be running" after the unit has been regenerated.
  const args = verb === 'start' ? ['kickstart', '-k', target] : ['bootout', target];
  const hint =
    verb === 'start'
      ? `The unit file is installed but may not be loaded into this login session: run \`${CLI} daemon install\` to bootstrap it, then start it`
      : 'Nothing was loaded under that label, or it had already been booted out; check with `launchctl print` on the domain target above';

  if (ctx.flags.dryRun) {
    ctx.report.result(`would run: ${commandLine('launchctl', args)}`);
    return EXIT.OK;
  }
  drive(ctx, 'launchctl', args, hint);
  return EXIT.OK;
}

/**
 * The note {@link lifecycle} prints when no unit file is at the install path.
 *
 * Only `stop` reaches it — `start` refuses above — and neither the label nor the command turns on the
 * file, so nothing about the *action* is decided here. What is decided is the sentence: an absent
 * unit has two causes, and asserting the wrong one sends an operator hunting a file they never had.
 *
 * **Why the registry is read here and nowhere else in {@link lifecycle}.** It is the only record that
 * separates them. `machine/registry.ts` holds an entry per `install`, so an entry naming this root
 * *and this unit path* with no file there is the one state this CLI can attribute: it removes no
 * path, so a hand removed that one. Both fields are compared because each rules out a different
 * impostor — a truncated slug can be shared by two checkouts, and an entry written under another
 * `HOME` names a unit this run was never asked about.
 *
 * **The converse does not hold, which is why the other wording names both causes.** The read fails
 * open (`readRegistry`), and `list --prune` drops the entry of a repository whose unit is already
 * gone — so "no entry" is not "no install", and the note says what it saw rather than picking one.
 */
function missingUnitNote(
  repoRoot: string,
  backend: DaemonBackend,
  unit: RenderedUnit,
  verb: 'start' | 'stop',
): string {
  const entry = readRegistry().repos[repoSlug(repoRoot)];
  const attributable = entry?.root === repoRoot && entry?.unitPath === unit.targetPath;
  const cause = attributable
    ? `${registryPath()} records an install from this checkout, and this CLI removes no path — so the unit file was removed by hand`
    : 'either no daemon was installed from this checkout, or its unit file was removed by hand — this CLI removes no path';
  return `no ${backend.kind} unit at ${unit.targetPath}: ${cause}; this ${verb} acts on the label above, which is rendered from the repository root and needs no file`;
}

/**
 * The slug of the repository this command was run in, or `undefined` when it was not run in one.
 *
 * Probed rather than resolved: `list` must answer from anywhere (choice 4 in the header), so being
 * outside a repository is an ordinary answer here and not a refusal. The slug comes from the same
 * `repoSlug` the registry is keyed on and the unit is named by, so "this checkout" means the same
 * thing in a listing as it does in a label.
 */
function currentSlug(cwd: string): string | undefined {
  const probe = probeRepoRoot(cwd);
  return probe.kind === 'repository' ? repoSlug(probe.root) : undefined;
}

/** `1 stale entry` / `N stale entries` — the count a prune reports, in the grammar it deserves. */
function staleCount(count: number): string {
  return count === 1 ? '1 stale entry' : `${count} stale entries`;
}

/**
 * One entry as a line: where it is, what it was installed into, what it is called, and — only when
 * it is not `ok` — how it is stale. A leading `*` marks the repository the command was run in.
 */
function entryLine(inspected: InspectedEntry, here: string | undefined): string {
  const marker = inspected.slug === here ? '*' : ' ';
  const state = inspected.state === 'ok' ? '' : `  [${inspected.state}]`;
  const { root, backend, label } = inspected.entry;
  return `${marker} ${inspected.slug}  ${root}  ${backend}  ${label}${state}`;
}

/**
 * `--prune`: drop exactly the entries this listing graded stale, and say what went.
 *
 * **It removes entries and nothing else** — never a unit file, never a repository, never a
 * directory, and never through a shelled-out command (the header's "removes nothing from disk").
 * The slugs are the ones {@link inspect} graded a moment ago rather than a second grading of its
 * own, so what is removed is what was printed.
 *
 * The count is `removeRepositories`' own answer rather than the number of lines above it, because a
 * `daemon install` running concurrently in one of those repositories may legitimately have re-added
 * an entry between the grading and the removal.
 */
function prune(ctx: CommandContext, entries: readonly InspectedEntry[]): void {
  const stale = entries.filter((entry) => entry.state !== 'ok');
  if (stale.length === 0) {
    // Said even when there was nothing to prune, and even when there was nothing at all: a flag
    // that was typed and then produced no line of its own reads as a flag that was ignored.
    ctx.report.result(
      entries.length === 0
        ? 'nothing to prune: no repositories are registered'
        : 'nothing to prune: every registered repository is still there, with its unit installed',
    );
    return;
  }

  if (ctx.flags.dryRun) {
    for (const entry of stale) ctx.report.result(`would remove ${entry.slug} (${entry.state})`);
    ctx.report.result(`would remove ${staleCount(stale.length)} from ${registryPath()}`);
    return;
  }

  const removed = removeRepositories(stale.map((entry) => entry.slug));
  for (const entry of stale) ctx.report.result(`removed ${entry.slug} (${entry.state})`);
  ctx.report.result(`removed ${staleCount(removed)} from ${registryPath()}`);
}

/**
 * `daemon list [--prune]`: what is armed on this machine.
 *
 * The enumeration goes to the `result` sink rather than to `info` — stdout whatever the flags are —
 * for the reason {@link describeUnit} records for the unit path and the label: it is what the
 * command was run for, and a `--quiet` run that printed none of it would have answered nothing.
 *
 * **An empty registry is exit 0 and one line.** Nothing is wrong with a machine that has no daemons
 * installed, so the answer is the fact plus what would change it, not a refusal.
 */
function list(ctx: CommandContext, invocation: DaemonInvocation): number {
  const entries = inspect(readRegistry());
  const here = currentSlug(ctx.cwd);

  const dryPrune = invocation.prune && ctx.flags.dryRun;
  ctx.report.step(dryPrune ? 'daemon list (dry run — nothing is removed)' : 'daemon list');
  ctx.report.info(`registry: ${registryPath()}`);

  if (entries.length === 0) {
    ctx.report.result(
      `no repositories are registered on this machine: \`${CLI} daemon install\`, run in a wired repository, is what adds one`,
    );
  } else {
    for (const entry of entries) ctx.report.result(entryLine(entry, here));
    if (entries.some((entry) => entry.slug === here)) {
      ctx.report.info('* marks the repository this command was run in');
    }
  }

  if (invocation.prune) prune(ctx, entries);
  return EXIT.OK;
}

/** Parse the verb and hand off. Every verb returns its own exit code and throws to refuse. */
async function run(ctx: CommandContext): Promise<number> {
  const invocation = parseInvocation(ctx.argv);
  if (invocation.verb === 'install') return install(ctx, invocation);
  if (invocation.verb === 'list') return list(ctx, invocation);
  return lifecycle(ctx, invocation, invocation.verb);
}

/**
 * The registry row for this command.
 *
 * Exported as the row itself rather than as a `run` the table wraps, so the summary, the usage lines
 * and the behaviour stay in the file that owns them. The import back to `commands/registry.ts` is
 * type-only and therefore erased, so the table can list this row without a runtime cycle.
 */
export const DAEMON_COMMAND: Subcommand = {
  name: 'daemon',
  summary: SUMMARY,
  roadmapItem: ROADMAP_ITEM,
  usage: DAEMON_USAGE,
  run,
};

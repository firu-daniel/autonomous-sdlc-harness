/**
 * Command: `doctor` — verify an adopted repository's wiring, and make the exit status the contract.
 *
 * **The rule this module exists to enforce: the exit status is the answer, and the report is the
 * explanation.** A caller that branches on `doctor` — CI, the run daemon before it starts a run, an
 * operator's `&&` — reads `$?` and nothing else, so the two codes are defined here and are the whole
 * interface: **0 when no check failed**, including a run whose only findings were warnings, and
 * **1 when any check failed**. A warning names something worth fixing that does not stop a run; a
 * failure names something that does. Everything printed exists to say *why*.
 *
 * ## Three non-obvious choices, and where each comes from
 *
 * 1. **Warnings do not fail the command**, which is what makes the exit status usable at all. The
 *    condition a freshly wired repository still ships with unresolved — the marketplace entry, which
 *    needs a published repository — would otherwise make every such repository exit non-zero for
 *    something no adopter can fix, and a check nobody can make green is a check everybody starts
 *    ignoring.
 * 2. **Every check runs, whatever the earlier ones answered.** `doctor` is reached for *because*
 *    something is wrong, so a report that stopped at the first failure would get shorter the worse
 *    the repository is. The evaluation and its per-check error containment are `doctor/checks.ts`'s;
 *    this file orders, prints and counts.
 * 3. **The counts summary prints even under `--quiet`.** Quiet here means "only what needs attention,
 *    and the verdict": the `PASS` lines are dropped, the `WARN` and `FAIL` lines go to stderr as the
 *    reporter sends everything that needs a human, and the summary goes to stdout regardless —
 *    otherwise a quiet run has nothing on stdout to read its result from (`core/report.ts`,
 *    {@link Reporter.result}). It shares that stream with any other line this command routes through
 *    `result()`, which under `--dry-run` is {@link TEST_NOTIFICATION_FLAG}'s `would run:` preview.
 *
 * ## What this command deliberately does not do
 *
 * - **It repairs nothing and writes nothing** beyond the temp file the writability probe creates and
 *   removes in place. Every finding names what to run instead — `init`, `init --force`, or an edit to
 *   one config key — so `doctor` stays safe to run against a repository in any state, at any time.
 * - **It launches no browser and starts no MCP server.** Reachability is command resolution on
 *   `PATH`, plus — under {@link CHECK_REGISTRY_FLAG} — one read-only registry metadata query per
 *   pinned package, which fetches nothing and starts nothing either. Driving a browser belongs to the
 *   interactive-test phase and its agent alone.
 * - **A default run sends nothing.** The `notifications` check is a pure read of whichever settings
 *   file the notifier resolves; everything here with network reach is behind a flag —
 *   {@link TEST_NOTIFICATION_FLAG}, a delivery, which no default run and no `--dry-run` run makes,
 *   and {@link CHECK_REGISTRY_FLAG}, a metadata read that changes nothing anywhere and so is not
 *   suppressed by `--dry-run`. A POST fired by every `doctor` — in CI, from an `&&` chain, from the
 *   run daemon before it starts a run — would cost the command every property above.
 */

import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';

import { EXIT, HarnessError } from '../core/errors.js';
import { currentBranch } from '../core/git.js';
import {
  buildCheckContext,
  countByStatus,
  runChecks,
  type CheckContext,
  type CheckStatus,
} from '../doctor/checks.js';
import { NOTIFY_SCRIPT_NAME, outerLoopScriptPath } from '../generators/outerLoopScripts.js';
import type { CommandContext, Subcommand } from './registry.js';

/** The command's one-line summary, in the usage block and at the head of its own `--help`. */
const SUMMARY =
  'Check git/worktree availability, permission profile, daemon backend, MCP reachability, stateDir writability';

/** The roadmap item this command belongs to, as the registry reports it. */
const ROADMAP_ITEM = 13;

/** An option this command takes of its own: an action, not a check. */
const TEST_NOTIFICATION_FLAG = '--test-notification';

/**
 * An option this command takes of its own: it widens one check's question and changes nothing.
 *
 * Off by default, which is the whole design. The browser-wiring check resolves each declared server's
 * launch command on `PATH`, and that is an answer a default `doctor` can give in CI, inside an `&&`
 * chain and offline — but it says nothing about whether the pinned packages those servers are
 * launched with can actually be fetched, which is what an adopter behind a proxy, on a mirror or
 * air-gapped finds out at the first interactive-test dispatch instead. This flag asks now.
 */
const CHECK_REGISTRY_FLAG = '--check-registry';

/**
 * Every option this command takes of its own, in the order `--help` lists them.
 *
 * Declared as the list rather than spelled into the refusal message, so the message a mistyped flag
 * gets names whatever the command actually accepts and cannot fall behind it.
 */
const OWN_FLAGS: readonly string[] = Object.freeze([TEST_NOTIFICATION_FLAG, CHECK_REGISTRY_FLAG]);

/**
 * The event word the test send carries.
 *
 * Deliberately **not** one of the notifier's seven lifecycle words. That vocabulary is a contract
 * owned by the watcher — `completed`, `parked`, `paused`, `failed`, `launched`, `resumed`,
 * `park_loop` — and sending one from here would put a message an operator reads as a real run's
 * outcome into the same stream real ones arrive in. The script's header states that an unrecognized word is still delivered, under a
 * generic title, and its dispatcher's `*)` branch is where this one lands: the message reads
 * `Run '<branch>': doctor-test.` and cannot be mistaken for a lifecycle event.
 */
const TEST_NOTIFICATION_EVENT = 'doctor-test';

/**
 * How long the notifier may take before the send is abandoned.
 *
 * Its POST arm is a `curl -m 10` retried once with a second body shape, so a run against an endpoint
 * that accepts the connection and never answers costs about twenty seconds by design. This is that,
 * with room to spare: a bound rather than a deadline, so a slow endpoint is reported instead of
 * hanging the command an operator ran to find out what is wrong.
 */
const NOTIFIER_TIMEOUT_MS = 45_000;

/** How each status is labelled at the head of its line. Fixed width, so the details column aligns. */
const STATUS_LABEL: Readonly<Record<CheckStatus, string>> = {
  pass: 'PASS',
  warn: 'WARN',
  fail: 'FAIL',
};

/**
 * The lines the registry renders under this command's synopsis.
 *
 * The exit contract is stated **here**, in the text `doctor --help` prints, because that is where a
 * CI caller looks before writing the condition it will rely on — a contract documented only in a
 * source comment is one the caller has to guess at.
 */
const DOCTOR_USAGE: readonly string[] = Object.freeze([
  'Doctor options (the global options above apply too):',
  `  ${TEST_NOTIFICATION_FLAG}  Send one test notification through this repository's own`,
  '                       autonomous-notify.sh, after the report',
  `  ${CHECK_REGISTRY_FLAG}     Ask the registry whether each pinned MCP server package can be`,
  '                       fetched, inside the browser-wiring check',
  '',
  'A default run sends nothing: the notifications check reads which settings file the notifier',
  `resolves and prints no value from it, and only ${TEST_NOTIFICATION_FLAG} delivers a message. The`,
  `test send carries the event word ${TEST_NOTIFICATION_EVENT}, which is none of the watcher's seven`,
  "lifecycle words, so it cannot be read as a real run's outcome. It does not change the exit status:",
  'a best-effort notifier that could not reach an endpoint is not a failed check. Under --dry-run it',
  'reports the invocation it would make and sends nothing, after every refusal a real run would make.',
  '',
  `${CHECK_REGISTRY_FLAG} is off by default, and that is what keeps a default run reachable from CI, from`,
  'an && chain and from the run daemon: with it off nothing here touches a network, and the answer is',
  'the same offline. The interactive-test servers are launched with `npx -y`, so their pinned packages',
  'are fetched from the registry on first use rather than installed by init, which the browser-wiring',
  'line says on every run, rather than letting a pass be read as a promise they can be. With it on,',
  'each pin is looked up with `npm view <spec> version` — a metadata read that fetches and installs',
  'nothing — and one that cannot be reached warns. It never changes the exit status, and --dry-run',
  'does not suppress it: a metadata read changes nothing, here or anywhere else.',
  '',
  'Exit status is the contract — branch on it rather than on the report text:',
  '  0  no check failed: every check passed, or the only findings were warnings',
  '  1  at least one check failed',
  '',
  'A warning never changes the exit status: it names something worth fixing that does not stop a',
  'run. A failure names something that does.',
  '',
  'Every check is evaluated, whatever the earlier ones answered, so one report names everything',
  'wrong with the repository rather than only the first thing.',
  '',
  '--quiet drops the PASS lines. The WARN and FAIL lines print on stderr, and the counts summary on',
  `stdout, whatever the flags are; so does the ${TEST_NOTIFICATION_FLAG} \`would run:\` preview under`,
  '--dry-run, which is the second stdout line that combination prints.',
  '',
  'Nothing is repaired and nothing is written, beyond a temp file the writability probe creates and',
  'removes inside the configured stateDir. No MCP server is started and no browser is launched:',
  `reachability is command resolution on PATH, plus — under ${CHECK_REGISTRY_FLAG} — one read-only`,
  'registry metadata query per pinned package.',
]);

/** What the recognised options asked for. */
interface DoctorOptions {
  /**
   * Whether {@link TEST_NOTIFICATION_FLAG} was given: the run's only action, and its only side effect.
   *
   * Still both, with a second flag beside it: {@link CHECK_REGISTRY_FLAG} reaches a network but reads
   * metadata, so it changes nothing on this machine, in the repository or at the endpoint — which is
   * also why it is the one of the two `--dry-run` does not suppress.
   */
  readonly testNotification: boolean;
  /**
   * Whether {@link CHECK_REGISTRY_FLAG} was given: the browser-wiring check's registry probe, which
   * is otherwise off and is the only question in a `doctor` run that reaches a network by itself.
   */
  readonly checkRegistry: boolean;
}

/**
 * Every option `doctor` takes of its own is recognised here, so anything else left after the global
 * flags is a mistake.
 *
 * Refused rather than ignored, for `init`'s reason: a mistyped flag that is quietly dropped produces
 * a check run that answered a different question than the one asked, and here the caller is
 * branching on the result. The flags that *are* recognised are refused in the other direction too —
 * a misspelling of one names every option this command accepts, so the operator whose test send
 * silently never happened, or whose registry probe silently never ran, is told rather than left to
 * wonder whether the thing itself is broken.
 */
function parseOptions(argv: readonly string[]): DoctorOptions {
  let testNotification = false;
  let checkRegistry = false;
  for (const token of argv) {
    if (token === TEST_NOTIFICATION_FLAG) {
      testNotification = true;
      continue;
    }
    if (token === CHECK_REGISTRY_FLAG) {
      checkRegistry = true;
      continue;
    }
    throw new HarnessError(
      token.startsWith('-')
        ? `doctor: unknown option ${JSON.stringify(token)} — the options doctor takes of its own are ${OWN_FLAGS.join(' and ')}; run \`npx autonomous-sdlc-harness doctor --help\` for them and for the global options it accepts`
        : `doctor: unexpected argument ${JSON.stringify(token)} — doctor takes no arguments, and checks the repository containing the current directory (or --cwd)`,
    );
  }
  return { testNotification, checkRegistry };
}

/** `Summary: 9 pass, 3 warn, 0 fail — exit 0 (no check failed; warnings do not fail the command)`. */
function summaryLine(pass: number, warn: number, fail: number): string {
  const verdict =
    fail === 0
      ? 'exit 0 (no check failed; warnings do not fail the command)'
      : `exit 1 (${fail} check${fail === 1 ? '' : 's'} failed)`;
  return `Summary: ${pass} pass, ${warn} warn, ${fail} fail — ${verdict}`;
}

/** One finished notifier invocation: how it exited, and the lines it printed about it. */
interface NotifierResult {
  /** The script's exit status, or `undefined` when it could not be run or did not finish. */
  readonly status?: number;
  /** Its stderr, one line per element, quoted back unmodified — it prints paths and key names only. */
  readonly lines: readonly string[];
  /** Present when the invocation itself failed: a spawn error, or the timeout. */
  readonly problem?: string;
}

/**
 * Run the notifier once with a **fixed argument vector** — the CLI's standing rule, and here also
 * what keeps a branch name carrying shell metacharacters from being re-parsed. `bash <script>` is the
 * form the daemon's own unit uses for the watcher beside it, so an adopter who cleared the executable
 * bit off a generated script still gets a delivery check rather than a spawn error.
 *
 * **`spawnSync` rather than `execFileSync`**, which is what every other probe in this CLI uses. The
 * two take the same argument vector and the same bounds; they differ in exactly the thing this call
 * exists for. `execFileSync` returns *stdout* and surfaces a child's stderr only on the error path,
 * and this script's contract is that it **exits 0 whatever happened** and says what it did on stderr
 * — so the run this flag is most often used to check, the one that degraded to desktop-only, is
 * precisely the run whose one line `execFileSync` would discard.
 *
 * A non-zero status is returned rather than thrown for the same reason: the script never fails its
 * caller, so a status other than 0 is a finding to print rather than a reason for this command to
 * change what it answers.
 */
function runNotifier(script: string, args: readonly string[]): NotifierResult {
  const result = spawnSync('bash', [script, ...args], {
    encoding: 'utf8',
    stdio: ['ignore', 'ignore', 'pipe'],
    timeout: NOTIFIER_TIMEOUT_MS,
    windowsHide: true,
  });

  const lines =
    typeof result.stderr === 'string'
      ? result.stderr
          .split('\n')
          .map((line) => line.trimEnd())
          .filter((line) => line !== '')
      : [];

  // A stopped child is reported by the signal that stopped it rather than as "timed out": the bound
  // this call sets is the likely cause and is named, but a `kill` from elsewhere arrives the same way
  // and a message asserting the timeout would be wrong exactly when an operator is chasing something.
  const stopped = (signal: string): string =>
    `the notifier was stopped by ${signal} before it finished; the bound on this call is ${NOTIFIER_TIMEOUT_MS / 1000}s`;

  if (result.error !== undefined) {
    const failure = result.error as NodeJS.ErrnoException;
    if (failure.code === 'ENOENT') return { lines, problem: `bash is not on PATH, so ${script} could not be run` };
    if (result.signal !== null) return { lines, problem: stopped(result.signal) };
    return { lines, problem: `the notifier could not be run to completion: ${failure.message}` };
  }
  if (result.signal !== null) return { lines, problem: stopped(result.signal) };
  return result.status === null ? { lines } : { status: result.status, lines };
}

/**
 * Send one test notification through the repository's own notifier — the whole of what
 * {@link TEST_NOTIFICATION_FLAG} adds.
 *
 * Three properties, and each of them is why this lives here rather than inside a check:
 *
 * 1. **It runs after the report and the summary**, so a repository whose wiring is broken still gets
 *    its findings printed before anything is attempted with them.
 * 2. **It goes through `autonomous-notify.sh`**, resolved under the configured `scriptsDir` the way
 *    `daemon/backend.ts` resolves its sibling the watcher. A message built here instead would be a
 *    second implementation of the delivery contract — the credential precedence, the two arms, the
 *    title format — and the delivery an operator is testing is the script's, not this command's.
 * 3. **It cannot move the exit status.** That stays "0 when no check failed", so a CI caller's
 *    condition means the same thing whether or not this flag was passed, and an unreachable endpoint
 *    — a best-effort arm doing exactly what its contract says — is not a failed check.
 *
 * A fourth, which is the CLI's rule rather than this flag's: **`--dry-run` sends nothing.** A delivery
 * reaches a remote endpoint and a desktop banner, so it is a mutation sitting outside any write plan
 * and is skipped for the same reason `init`'s first commit and `daemon install`'s registry entry are.
 * The preview is taken **after** every refusal below, so a dry run reports each of them exactly as a
 * real run would and cannot claim a send a real run would not have made.
 */
function sendTestNotification(ctx: CommandContext, checks: CheckContext): void {
  ctx.report.step(
    ctx.flags.dryRun
      ? `test notification (event ${TEST_NOTIFICATION_EVENT}; dry run — nothing is sent)`
      : `test notification (event ${TEST_NOTIFICATION_EVENT})`,
  );

  const { repoRoot, config } = checks;
  if (repoRoot === undefined || config === undefined) {
    ctx.report.warn(
      `${TEST_NOTIFICATION_FLAG} sent nothing: ${repoRoot === undefined ? 'the repository root did not resolve' : 'the configuration could not be read'}, so the notifier could not be located — see the report above, and fix that finding first`,
    );
    return;
  }

  const script = outerLoopScriptPath(repoRoot, config, NOTIFY_SCRIPT_NAME);
  if (!existsSync(script)) {
    ctx.report.warn(
      `${TEST_NOTIFICATION_FLAG} sent nothing: no notifier at ${script}. \`init\` writes it into the configured scriptsDir, so nothing there means it was removed or scriptsDir was changed without a re-run — run \`npx autonomous-sdlc-harness init\` to write it back. The exit status is the checks' and is unchanged`,
    );
    return;
  }

  const branch = currentBranch(repoRoot) ?? config.defaultBranch;
  if (typeof branch !== 'string' || branch.trim() === '') {
    ctx.report.warn(
      `${TEST_NOTIFICATION_FLAG} sent nothing: this checkout has no branch to name — a detached HEAD, or a git that would not answer — and defaultBranch is ${JSON.stringify(branch)}, so the notifier would have been called with no branch, which is the one thing it refuses`,
    );
    return;
  }

  // The last thing checked, and the only one that is about this run's mode rather than the
  // repository's state: everything above is a refusal a real run would have made too.
  if (ctx.flags.dryRun) {
    ctx.report.result(`would run: bash ${script} ${TEST_NOTIFICATION_EVENT} ${branch}`);
    ctx.report.info(
      `${TEST_NOTIFICATION_FLAG} sent nothing: this was a dry run, and a delivery reaches a remote endpoint and a desktop banner — a change outside this repository, which is what --dry-run skips`,
    );
    return;
  }

  const result = runNotifier(script, [TEST_NOTIFICATION_EVENT, branch]);
  ctx.report.info(
    `${script} ${TEST_NOTIFICATION_EVENT} ${branch}${result.status === undefined ? '' : ` — exited ${result.status}`}`,
  );
  // Quoted back unmodified: the script prints one line per arm that did not deliver and never prints
  // a value, so the line an operator needs is already the line it wrote.
  for (const line of result.lines) ctx.report.warn(line);
  if (result.problem !== undefined) ctx.report.warn(`${TEST_NOTIFICATION_FLAG}: ${result.problem}`);
  ctx.report.info(
    `${TEST_NOTIFICATION_FLAG} does not change the exit status: delivery is best-effort, and an endpoint that could not be reached is not a failed check`,
  );
}

/**
 * Build the context once, evaluate every check, print one line each, and return the exit code.
 *
 * The three streams are the reporter's own contract and are what `--quiet` is implemented by: a
 * `PASS` line is narration and goes through `info`, a `WARN` through `warn` and a `FAIL` through
 * `fail` — both of which print on stderr whatever the flags are — and the summary through `result`,
 * which prints on stdout whatever the flags are.
 *
 * The check context is kept rather than passed straight through, because the test send needs the same
 * repository root and configuration the checks were answered from: resolving them a second time could
 * answer differently from the report the operator is reading.
 */
async function run(ctx: CommandContext): Promise<number> {
  const options = parseOptions(ctx.argv);

  const checks = buildCheckContext(ctx.cwd, options.checkRegistry);
  const results = runChecks(checks);
  const width = Math.max(...results.map((result) => result.id.length));

  ctx.report.step(`checks (${ctx.cwd})`);
  for (const result of results) {
    const line = `${STATUS_LABEL[result.status]}  ${result.id.padEnd(width)}  ${result.detail}`;
    if (result.status === 'pass') ctx.report.info(line);
    else if (result.status === 'warn') ctx.report.warn(line);
    else ctx.report.fail(line);
  }

  const counts = countByStatus(results);
  ctx.report.result(summaryLine(counts.pass, counts.warn, counts.fail));

  if (options.testNotification) sendTestNotification(ctx, checks);

  return counts.fail > 0 ? EXIT.FAILURE : EXIT.OK;
}

/**
 * The registry row for this command.
 *
 * Exported as the row itself rather than as a `run` the table wraps, so the summary, the usage lines
 * and the behaviour stay in the file that owns them. The import back to `commands/registry.ts` is
 * type-only and therefore erased, so the table can list this row without a runtime cycle.
 */
export const DOCTOR_COMMAND: Subcommand = {
  name: 'doctor',
  summary: SUMMARY,
  roadmapItem: ROADMAP_ITEM,
  usage: DOCTOR_USAGE,
  run,
};

/**
 * The CLI's one way to ask a question.
 *
 * **The rule, stated here and in `docs/cli.md` §2 and nowhere else.** Every interactive
 * decision has three parts:
 *
 * 1. **a flag that supplies the answer**, which is the actual interface;
 * 2. **a documented non-interactive default**, which is exactly the behaviour the release
 *    already had before the decision became askable;
 * 3. **a prompt**, shown only when the flag was absent *and* both stdin and stdout are a TTY.
 *
 * **A run that cannot be prompted never blocks.** It takes the default. Which of the two
 * reasons it could not be prompted decides who says so: with no terminal, this module prints
 * one line naming the flag that chooses otherwise; under `--non-interactive` or `--quiet` —
 * which force that same default-taking path even on a terminal, for a CI runner that allocates
 * one — it returns the default **silently**, and a caller that needs the decision narrated
 * prints its own note (`commands/init.ts`'s analyze offer and `qa.driver` do).
 *
 * That is what keeps `init` deterministic: with no terminal, its output is a function of its
 * flags and the repository alone, so a second `init` over the same repository produces the same
 * result and the recorded preset stays re-derivable from the detection table by hand. No prompt
 * may exist without its flag and its default — a prompt whose answer has no flag would make an
 * unattended run's result unreachable rather than merely defaulted.
 *
 * **Every question this module prints is preceded by one blank line**, so no caller adds its own:
 * the interactive prompt, each re-ask, and the no-terminal note that stands in for a question that
 * could not be put. A question printed hard against the narration above it reads as one more
 * statement of fact rather than as something to answer.
 *
 * Two implementation constraints, both inherited:
 *
 * - **Nothing here writes through `console`.** The question goes out through the `Reporter`
 *   like every other line the CLI prints, so `--quiet` behaves the same here as everywhere.
 *   The reporter is line-oriented, so the answer is typed on the line *below* the question
 *   rather than after it — worth the plain, diffable output.
 * - **No runtime dependency.** The package declares none and one line of input is not worth
 *   the first, so the answer is read from fd 0 with `node:fs` and decoded once at the end.
 */

import { readSync } from 'node:fs';
import { isatty } from 'node:tty';

import type { GlobalFlags } from '../commands/registry.js';
import type { Reporter } from './report.js';

/** What a prompt is handed: the parsed global flags, and the one output surface. */
export interface PromptContext {
  readonly flags: GlobalFlags;
  readonly report: Reporter;
}

export interface AskOptions {
  /** The question, as one line and without a trailing `?`-plus-default — the default is rendered here. */
  readonly question: string;
  /** What a run that cannot be prompted answers. This is the release's existing behaviour. */
  readonly defaultAnswer: boolean;
  /** The flag that supplies the answer, e.g. `--git-init`. Named in the no-terminal note. */
  readonly flag: string;
  /**
   * A clause naming what passing the flag does, rendered as `Pass <flag> <flagHint>.` — so
   * `{ flag: '--git-init', flagHint: 'to initialise one and make the first commit' }` prints
   * `Pass --git-init to initialise one and make the first commit.`
   */
  readonly flagHint: string;
}

export interface AskLineOptions {
  /** The question, as one line. The default, when there is one, is rendered after it. */
  readonly question: string;
  /** The flag that supplies the value, e.g. `--qa-driver`. Named in the no-terminal note. */
  readonly flag: string;
  /** What a run that cannot be prompted answers, and what an empty line accepts. */
  readonly defaultValue?: string;
}

/** Standard input. Read directly rather than through `process.stdin`, which is asynchronous. */
const STDIN_FD = 0;

/** Standard output, named as a descriptor for the same reason: the probe below must not open a stream. */
const STDOUT_FD = 1;

/** How many times an unrecognised yes/no answer is re-asked before the default is taken. */
const REPROMPT_LIMIT = 2;

/** How long, and how many times, an `EAGAIN` read is retried before input is given up on. */
const EAGAIN_RETRY_LIMIT = 100;
const EAGAIN_RETRY_MS = 10;

/**
 * True when a question can actually be put to someone: a terminal on **both** ends. stdout
 * alone is not enough (the question would print into a pipe with nobody to answer it) and
 * stdin alone is not enough (the answer would be typed against an invisible prompt).
 *
 * **Asked of the descriptors rather than of `process.stdin.isTTY`, and that is load-bearing
 * rather than stylistic.** `process.stdin` is a lazy getter: the first access constructs a
 * `tty.ReadStream` on fd 0, which on POSIX leaves that descriptor **non-blocking**. The very
 * next thing this module does with fd 0 is {@link readLineSync}'s `readSync`, which then
 * throws `EAGAIN` on a terminal nobody has typed into yet — so the probe would manufacture
 * exactly the condition the retry loop below exists to absorb, and every prompt would take
 * its default after a second of retries. `isatty` asks libuv what the descriptor is and
 * changes nothing about it.
 */
function isInteractiveTerminal(): boolean {
  return isatty(STDIN_FD) && isatty(STDOUT_FD);
}

/** Sleep without a timer, so the read loop below can stay synchronous. */
function sleepSync(milliseconds: number): void {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, milliseconds);
}

/**
 * Read one line from fd 0, a byte at a time, and decode it once. Returns `undefined` at end of
 * input or on a read error — both mean no answer is coming, so the caller takes the default
 * rather than re-asking into a closed stream.
 */
function readLineSync(): string | undefined {
  const byte = Buffer.alloc(1);
  const bytes: number[] = [];
  let eagainRetries = 0;

  for (;;) {
    let read: number;
    try {
      read = readSync(STDIN_FD, byte, 0, 1, null);
    } catch (error) {
      // A terminal left in non-blocking mode by the parent process has nothing to read *yet*,
      // which is not the same as having nothing to read. Retry briefly, then give up. The
      // parent is the only admissible cause: nothing in this module may touch fd 0 through
      // `process.stdin`, which would make this process the cause and this loop a mask for it.
      if ((error as NodeJS.ErrnoException).code === 'EAGAIN' && eagainRetries < EAGAIN_RETRY_LIMIT) {
        eagainRetries += 1;
        sleepSync(EAGAIN_RETRY_MS);
        continue;
      }
      return undefined;
    }

    if (read === 0) return bytes.length === 0 ? undefined : Buffer.from(bytes).toString('utf8');
    const value = byte[0] as number;
    if (value === 0x0a) return Buffer.from(bytes).toString('utf8');
    bytes.push(value);
  }
}

/**
 * Why this run cannot prompt, or `undefined` when it can. One place decides it, so `askYesNo`
 * and `askLine` cannot answer the question differently.
 *
 * `--quiet` counts: it suppresses the stdout side of the reporter, so a prompt issued under it
 * would block on a question nobody was shown. Neither flag prints the no-terminal note: under
 * `--quiet` it would be suppressed with the rest of the narration anyway, and under
 * `--non-interactive` the default-taking path is what was asked for, so a caller that needs it
 * narrated owns the line.
 */
function nonInteractiveReason(ctx: PromptContext): 'flag' | 'no-terminal' | undefined {
  if (ctx.flags.nonInteractive || ctx.report.quiet) return 'flag';
  if (!isInteractiveTerminal()) return 'no-terminal';
  return undefined;
}

/**
 * Can this run actually put a question to someone?
 *
 * The same decision {@link askYesNo} and {@link askLine} take, exported for a caller that has to
 * **narrate** the two paths differently rather than only answer differently — `init`'s `qa.driver`,
 * whose note either records what was chosen or says a run that could not be asked took the
 * documented default and names the flag that chooses otherwise. Exported as this predicate rather
 * than re-derived from the descriptor probe at the call site, so `--non-interactive` and `--quiet`
 * keep one decider: a second one could disagree, and the disagreement would be a prompt issued
 * under `--quiet` blocking on a question nobody was shown.
 */
export function canPrompt(ctx: PromptContext): boolean {
  return nonInteractiveReason(ctx) === undefined;
}

/**
 * The blank line before a question, emitted through the same `info` the question itself goes out on
 * — so `--quiet` suppresses the separator with the line it separates and the reporter's contract is
 * unchanged. Under `'flag'` neither is printed and neither is this.
 *
 * **Unconditional.** This module holds no cross-call state and the reporter exposes none, so the one
 * question that can be a run's first printed line (`init`'s git-init offer, asked before anything
 * else prints) costs a leading blank line — cheaper than a state flag on the reporter.
 */
function separate(ctx: PromptContext): void {
  ctx.report.info('');
}

/**
 * Ask a yes/no question. Returns `options.defaultAnswer` on every path that cannot prompt, and
 * on a terminal maps `y`/`yes` and `n`/`no` (either case), an empty line to the default, and
 * anything else to a re-ask — {@link REPROMPT_LIMIT} times, then the default.
 */
export function askYesNo(options: AskOptions, ctx: PromptContext): boolean {
  const reason = nonInteractiveReason(ctx);
  if (reason === 'flag') return options.defaultAnswer;
  if (reason === 'no-terminal') {
    separate(ctx);
    ctx.report.info(
      `${options.question} — no terminal to ask on, so the default stands: ` +
        `${options.defaultAnswer ? 'yes' : 'no'}. Pass ${options.flag} ${options.flagHint}.`,
    );
    return options.defaultAnswer;
  }

  const suffix = options.defaultAnswer ? '[Y/n]' : '[y/N]';
  for (let attempt = 0; attempt <= REPROMPT_LIMIT; attempt += 1) {
    // Inside the loop: a re-ask is a fresh question, printed under the answer that did not parse.
    separate(ctx);
    ctx.report.info(`${options.question} ${suffix}`);
    const answer = readLineSync();
    if (answer === undefined) return options.defaultAnswer;

    const normalised = answer.trim().toLowerCase();
    if (normalised === '') return options.defaultAnswer;
    if (normalised === 'y' || normalised === 'yes') return true;
    if (normalised === 'n' || normalised === 'no') return false;
  }
  ctx.report.info(`No yes-or-no answer given, so the default stands: ${options.defaultAnswer ? 'yes' : 'no'}.`);
  return options.defaultAnswer;
}

/**
 * Ask for a value. Returns `options.defaultValue` — `undefined` when there is none — on every
 * path that cannot prompt and on an empty line. The answer is trimmed and otherwise returned
 * as typed: what counts as a valid value is the caller's to decide and to report.
 */
export function askLine(options: AskLineOptions, ctx: PromptContext): string | undefined {
  const reason = nonInteractiveReason(ctx);
  if (reason === 'flag') return options.defaultValue;
  if (reason === 'no-terminal') {
    const outcome = options.defaultValue === undefined ? 'nothing is set' : `the default stands: ${options.defaultValue}`;
    separate(ctx);
    ctx.report.info(`${options.question} — no terminal to ask on, so ${outcome}. Pass ${options.flag} to set it.`);
    return options.defaultValue;
  }

  const suffix = options.defaultValue === undefined ? '' : ` [${options.defaultValue}]`;
  separate(ctx);
  ctx.report.info(`${options.question}${suffix}`);
  const answer = readLineSync();
  if (answer === undefined) return options.defaultValue;

  const trimmed = answer.trim();
  return trimmed === '' ? options.defaultValue : trimmed;
}

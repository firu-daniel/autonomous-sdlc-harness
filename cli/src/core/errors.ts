/**
 * The CLI's error and exit-code contract.
 *
 * Two rules hold across the whole package:
 *
 * 1. **Nothing calls `process.exit()`.** A command signals failure by throwing a
 *    `HarnessError` (or by returning an exit code from `run`); the entry point in
 *    `cli.ts` is the single place where a thrown value becomes `process.exitCode`.
 *    Exiting outright can truncate stdout mid-write when it is piped.
 * 2. **Every non-zero exit carries a message naming its cause.** A bare non-zero exit
 *    with no explanation is indistinguishable from a crash to the run daemon.
 */

/**
 * The exit codes this CLI produces. Callers that branch on the CLI's result — the run
 * daemon, CI, the acceptance gates in `docs/development.md` — read these and nothing else.
 */
export const EXIT = {
  /** `0` — success: the command did what it was asked to do, including `--help` and `--version`. */
  OK: 0,
  /**
   * `1` — a command-level refusal or a failed check. Expected and actionable: an unknown
   * command, bad usage, a `doctor` FAIL, a write refused by the re-run contract. Always
   * accompanied by a message naming the cause.
   */
  FAILURE: 1,
  /**
   * `2` — an unexpected internal fault: a thrown value the CLI did not model. Reaching this
   * code means the CLI hit a bug, not that the adopting repository is misconfigured.
   */
  INTERNAL: 2,
} as const;

/**
 * The union of the values in {@link EXIT} — the whole of what a {@link HarnessError} may carry,
 * so an exit code outside the three documented above is a compile error rather than a number the
 * run daemon has to interpret.
 */
export type ExitCode = (typeof EXIT)[keyof typeof EXIT];

/**
 * An error the CLI raised deliberately: it carries a message written for the person
 * running the command and the exit code that message should produce.
 *
 * Throw this for anything the CLI anticipated (a refusal, a failed check, bad usage).
 * Leave every other failure to propagate as-is — `cli.ts` reports those as `(unexpected)`
 * and exits {@link EXIT.INTERNAL}, which is the signal that the fault is a CLI bug.
 */
export class HarnessError extends Error {
  constructor(
    message: string,
    readonly exitCode: ExitCode = EXIT.FAILURE,
  ) {
    super(message);
    this.name = 'HarnessError';
  }
}

/**
 * The sentence every internal fault ends with: the one thing the reader most needs to know about a
 * message they cannot act on, which is that they are not the one who has to.
 */
const INTERNAL_SUFFIX = 'this is a fault in this CLI rather than in the repository it was run against';

/**
 * A fault in this CLI or in the assets it ships — a template disagreeing with the generator that
 * renders it, a write request the engine cannot satisfy, a value two modules were supposed to agree
 * on and did not. Exits {@link EXIT.INTERNAL}, with {@link INTERNAL_SUFFIX} appended.
 *
 * **Use this rather than `new HarnessError(…, EXIT.INTERNAL)` for anything the adopting repository
 * cannot fix.** The two codes are read by different audiences — {@link EXIT.FAILURE} says "correct
 * your configuration and run it again", {@link EXIT.INTERNAL} says "this build is broken" — and the
 * trailing sentence is what makes the difference legible in the message as well as in the status.
 * Passing a message that already carries its own version of that sentence would say it twice.
 *
 * It lives here rather than in each module that throws one because it was copied into five of them
 * before it was written down once, and four of those copies had already drifted in punctuation from
 * the fifth.
 */
export function internal(message: string): HarnessError {
  return new HarnessError(`${message}: ${INTERNAL_SUFFIX}`, EXIT.INTERNAL);
}

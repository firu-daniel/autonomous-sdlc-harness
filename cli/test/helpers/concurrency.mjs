/**
 * How many cases of one test file run at once.
 *
 * **The rule this module exists to enforce: one file-wide bound on concurrent cases, and one way to
 * turn it off.** `node --test` runs files in parallel but the cases of one file in series, and a case
 * here is a serial chain of subprocesses, so a slow file uses one core however many the machine has.
 * A suite opened with {@link concurrentSuite} runs its cases {@link CASE_CONCURRENCY} at a time;
 * setting the variable {@link CONCURRENCY_VARIABLE} names to `1` runs them in series again, which is
 * the way to rule concurrency out while diagnosing a failure.
 *
 * `node --test test` treats every file beneath a directory named `test` as a test file, so this one
 * is loaded as a test file of its own (as `fixture.mjs`'s header records). Reading the variable is
 * the only thing it does at import time, so a bad value fails that load by name.
 *
 * ## One non-obvious choice
 *
 * 1. **The default is never below 2, even on one core.** A case's own process is idle while the
 *    subprocess it awaits runs, so a second case in flight uses that idle time on any machine.
 */

import { availableParallelism } from 'node:os';
import { describe } from 'node:test';

/** The environment variable that overrides {@link CASE_CONCURRENCY}. */
export const CONCURRENCY_VARIABLE = 'HARNESS_TEST_CONCURRENCY';

/** Unset: the default. A positive integer: that bound. Anything else: refused by name. */
function caseConcurrency() {
  const value = process.env[CONCURRENCY_VARIABLE];
  if (value === undefined) return Math.max(2, availableParallelism());
  if (/^[1-9][0-9]*$/.test(value)) return Number(value);
  throw new Error(
    `${CONCURRENCY_VARIABLE} is set to \`${value}\`; it takes a positive integer, and \`1\` runs every case in series.`,
  );
}

/** How many cases of one {@link concurrentSuite} run at once. */
export const CASE_CONCURRENCY = caseConcurrency();

/**
 * A `describe` whose cases run {@link CASE_CONCURRENCY} at a time.
 *
 * @param {string} name the suite's title.
 * @param {() => void} fn registers the suite's cases.
 */
export function concurrentSuite(name, fn) {
  return describe(name, { concurrency: CASE_CONCURRENCY }, fn);
}

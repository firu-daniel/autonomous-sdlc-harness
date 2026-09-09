/**
 * Normalising the repo-relative paths `harness.config.json` holds.
 *
 * **The rule this module exists to enforce: there is one normalisation, and the variant that
 * resolves `..` is spelled differently from the one that does not.** Every path in the config file
 * is repo-relative (`docs/config.md` §5), so nothing here resolves against the filesystem or against
 * a repository root — these are string functions over already-relative values, which is what makes
 * them safe to apply to a value read from a file that has not been validated yet.
 *
 * They are separate from `core/paths.ts` deliberately: that module's rule is that every path in it is
 * *derived at runtime* — resolved by a `git` call or from the installed package's own location, on
 * every run. A pure normalisation of a configured string is the opposite kind of value, and putting
 * it there would weaken a header that a review reads as a guarantee.
 *
 * ## Why there are two, and why they are not called the same thing
 *
 * They were, once. Seven modules carried a private copy of this function; six had the lax body and
 * one had the strict one, and two of those seven had given their copy the *same name* under an
 * identical doc comment. A caller moved between those two files silently changed behaviour on a path
 * containing `..` — no compile error, no test, and the only visible symptom would have been two
 * writes landing on one target. The names below differ so that can never be true again: a reader who
 * sees `Strict` knows a `..` is resolved, and one who sees {@link normalizeRepoDir} knows it is not.
 */

import { posix } from 'node:path';

/**
 * A repo-relative directory as `harness.config.json` writes it: forward slashes, no trailing
 * separator, no leading `./`. The repository root normalises to `.`.
 *
 * **This is the default — reach for it unless the caller has the specific reason below.** It leaves
 * a `..` segment exactly where it found it, which is the right answer for the callers that pass the
 * result on to be joined, matched or printed: a `.gitignore` pattern is matched literally rather than
 * resolved, so silently rewriting one would change which files it covers, and a value substituted
 * into a permission entry has to stay the string the guard will actually see.
 */
export function normalizeRepoDir(value: string): string {
  const forwardSlashed = value.replace(/\\/g, '/').replace(/\/+$/, '');
  const withoutLeadingDot = forwardSlashed.replace(/^\.\//, '');
  return withoutLeadingDot === '' ? '.' : withoutLeadingDot;
}

/**
 * The same normalisation, plus `posix.normalize`: `.` and `..` segments are resolved and repeated
 * slashes collapsed, so every spelling of one location yields one string.
 *
 * **For a caller that keys on the result** — deduplicating configured paths before enqueueing a write
 * at each. Two spellings of one path that survive as two keys become two writes aiming at one target,
 * which the write engine refuses outright, so the resolution has to happen before the map rather than
 * after it.
 *
 * Do not substitute it for {@link normalizeRepoDir} to be "safer": resolving `..` in a value that is
 * about to be matched literally changes what it matches.
 */
export function normalizeRepoPathStrict(value: string): string {
  return posix.normalize(value.replace(/\\/g, '/').replace(/\/+$/, ''));
}

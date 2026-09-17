/**
 * The one spelling of what an adopter does about a source directory no layer covers, and of the
 * recorded layer-profile review that changes the answer.
 *
 * **The rule this module exists to enforce: the two commands that report the gap give the same
 * remedy.** `init` names the uncovered directories at the end of an adoption run and `doctor` warns
 * about the same set from its `layer-drift` check, both over one derivation
 * (`core/layerCoverage.ts`); a second spelling of the remedy in the second caller would let one
 * repository be told two different things by two commands run minutes apart — which is the
 * asymmetry the shared derivation was extracted to close, re-created one level up in the wording.
 *
 * **A recorded verdict changes the remedy and never the grade.** A review is a statement about the
 * profile at the moment it was reviewed, so a directory that appeared afterwards still drifts
 * (`core/layerCoverage.ts` grades it, and reads no `detection` field at all). What it does change is
 * where the adopter is sent: telling somebody who has already recorded a decision to run the command
 * that reaches that decision is an instruction to re-derive what the file already holds.
 *
 * Every field of a recorded review is optional (`config/model.ts`), so each is rendered only where
 * it is present — no `undefined` token may reach an adopter.
 *
 * Both callers pass their command spellings in rather than this module importing them: `init` and
 * `doctor` each keep their own `CLI` and take `ANALYZE_COMMAND` from `core/pluginIdentity.ts`, and
 * this module names neither.
 * `init --reset-config` is named by neither arm: it rebuilds the whole file from a fresh detection,
 * which is not a remedy for one uncovered directory.
 *
 * It composes strings and reads nothing.
 */

import type { HarnessLayerReview } from '../config/model.js';

/** What a caller hands the composer: the record in effect, and its own two command spellings. */
export interface LayerGapRemedyOptions {
  /** The recorded layer-profile review, when the config in effect carries one. */
  readonly review?: HarnessLayerReview;
  /** The analyze command as the calling surface spells it. */
  readonly analyzeCommand: string;
  /** How the calling surface tells an adopter to type this CLI. */
  readonly cli: string;
}

/**
 * The recorded review as one clause, or `undefined` where there is nothing recorded to name.
 *
 * The verdict is the whole of what makes a record a record, so a review carrying no `verdict` reads
 * as no review at all; `at` is appended only where it is there. **Capitalised**, because both
 * callers splice it after a full stop and it is therefore always sentence-initial.
 */
export function recordedVerdictClause(review: HarnessLayerReview | undefined): string | undefined {
  const verdict = review?.verdict;
  if (verdict === undefined) return undefined;
  const at = review?.at;
  const recorded = typeof at === 'string' && at.trim() !== '' ? `, recorded ${at}` : '';
  return `A layer-profile review is recorded here — verdict \`${verdict}\`${recorded}`;
}

/**
 * What to do about the uncovered directories, split on whether a review is already recorded.
 *
 * **No record** — the standing remedy: the profile comes from a session that reads the code, and the
 * spelling named is the `skip`-answering one rather than the `--yes` run, which takes `merge` on
 * every already-filled document and rewrites documents nobody asked to touch.
 *
 * **A record** — `config set layers` leads, because it is the direct route for a directory that is a
 * real layer and needs no session at all, and the analyze sentence names the one condition under
 * which re-running is worth anything: the tree has moved since the review.
 */
export function layerGapRemedy(options: LayerGapRemedyOptions): string {
  const { review, analyzeCommand, cli } = options;
  const configSetLayers = `${cli} config set layers`;

  if (review?.verdict === undefined) {
    return `If any of them is a real layer, run \`${analyzeCommand}\` in a session here and answer \`skip\` for every already-filled document; a no-argument run with \`--yes\` takes \`merge\` on all of them and rewrites documents nobody asked to touch. The profile itself is applied through \`${configSetLayers}\``;
  }

  return `If any of them is a real layer, add its row with \`${configSetLayers}\`, which is what applies a profile and is the whole of the change. Re-running \`${analyzeCommand}\` is worth something only where the tree has moved since that review: over the tree it already read it re-derives the decision this record holds. If you do run it, answer \`skip\` for every already-filled document — a no-argument run with \`--yes\` takes \`merge\` on all of them and rewrites documents nobody asked to touch`;
}

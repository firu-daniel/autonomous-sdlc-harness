/**
 * Generator: the run-artifact tree `init` materialises at the configured `stateDir`.
 *
 * **The rule this module exists to enforce: {@link STATE_DIR_ENTRIES} is the single declaration of
 * which directories the tree has and which phase each one belongs to.** One row is one line, so a
 * directory is added or gated by editing a row rather than by threading a condition through the
 * writer, and `doctor` asks {@link selectedStateDirs} what should be there instead of re-deriving
 * the list from its own copy. A second copy of this table anywhere is a copy that will drift.
 *
 * ## Three non-obvious choices, and where each comes from
 *
 * 1. **A phase that is off gets no directories at all.** An adopter who never runs the parity phase
 *    has no reference implementation to compare against, so a `business_parity_*` directory in
 *    their tree would be an empty slot they cannot fill and cannot tell from one the flow forgot to
 *    write. Turning the phase on in `harness.config.json` and re-running `init` creates them, which
 *    is why the omission is safe as well as tidy.
 * 2. **The two ledgers are `create-if-absent` and are never truncated or rewritten.** They
 *    accumulate over a project's whole life and are the only copy of that history — the write
 *    engine's table says the same (`core/writer.ts`) — so a re-run leaves a ledger with content in
 *    it byte-identical. This is the artifact where the re-run contract is not a nicety: an
 *    overwrite here destroys a record nothing else holds.
 * 3. **Templates are copied verbatim; there is no token substitution in this generator.** The
 *    wrapper-script generator renders `{{token}}`s because a wrapper's body is a *detected* value;
 *    nothing in this tree depends on one, and a README that named its own configured path would go
 *    stale the moment the adopter moved the tree. A path a reader wants is read from the config.
 *
 * ## Scope this release
 *
 * This module is the **writer**, and what it writes out is a contract per directory: each README
 * states what one file in its directory is and exactly how it is named, who writes it and who reads
 * it by role, when it appears and when it is superseded, and the one mistake a reader would
 * otherwise make. The tree's root README frames the set, and the two ledgers carry a worked example
 * entry each. Every row here has a file at its final path and name, so revising a contract is an
 * edit in place rather than a second layout.
 *
 * Four of this tree's directories are runtime surfaces whose *contents* are machine-local — the two
 * the run daemon writes, the park-and-ask clarification channel, and the scratch directory an agent
 * writes a probe file into — but which of them an ignore rule
 * may cover is settled in the generator that writes the repository's ignore file
 * (`generators/repoRoot.ts`), not here: a directory with a row in {@link STATE_DIR_ENTRIES} has a
 * committed README and is therefore ignored **by its contents** with a negation for that file, because
 * a whole-directory rule takes the README with it and no negation can bring it back. That generator
 * reads this table to check the row still exists, so a directory removed on either side fails loudly
 * rather than leaving a rule pointing at nothing.
 */

import { join } from 'node:path';

import { DEFAULTS, STATE_DIR_DOT_PATTERN, type HarnessConfig, type HarnessPhases } from '../config/model.js';
import { HarnessError } from '../core/errors.js';
import { readTemplate } from '../core/paths.js';
import { normalizeRepoDir } from '../core/repoPaths.js';
import type { WritePlan } from '../core/writer.js';

/** The phase a directory belongs to. A row without one is written whatever the phases are. */
export type StateDirPhase = keyof HarnessPhases;

/** One directory of the tree: its name, and the phase that owns it when it is not always written. */
export interface StateDirEntry {
  /** Directory name, directly beneath `stateDir`. Also the template subdirectory its README is in. */
  readonly dir: string;
  /** Written only when this phase is on. Absent means always written. */
  readonly phase?: StateDirPhase;
}

/**
 * Every directory of the run-artifact tree, in the order `init` writes it: the always-on set
 * first, then the phase-gated ones grouped by phase.
 *
 * The set comes from the artifact families the flow actually writes — one directory per family,
 * with the per-item findings directories kept separate from the reviews they re-check, because the
 * two have different writers and different readers.
 */
export const STATE_DIR_ENTRIES: ReadonlyArray<StateDirEntry> = Object.freeze([
  // Always written.
  Object.freeze({ dir: 'task_prompts' }),
  Object.freeze({ dir: 'story_plans' }),
  Object.freeze({ dir: 'task_plans' }),
  Object.freeze({ dir: 'code_reviews' }),
  Object.freeze({ dir: 'task_plan_reviews' }),
  Object.freeze({ dir: 'task_plan_point_reviews' }),
  Object.freeze({ dir: 'review_plan_reviews' }),
  Object.freeze({ dir: 'review_plan_point_reviews' }),
  Object.freeze({ dir: 'skeptic_reviews' }),
  Object.freeze({ dir: 'skeptic_review_plan_reviews' }),
  Object.freeze({ dir: 'skeptic_review_point_reviews' }),
  Object.freeze({ dir: 'architecture_reviews' }),
  Object.freeze({ dir: 'architecture_branch_reviews' }),
  Object.freeze({ dir: 'architecture_branch_review_point_reviews' }),
  Object.freeze({ dir: 'architecture_user_review_reviews' }),
  Object.freeze({ dir: 'user_reviews' }),
  Object.freeze({ dir: 'user_review_fix_plan_point_reviews' }),
  Object.freeze({ dir: 'flow_progress' }),
  Object.freeze({ dir: 'branch_statistics' }),
  Object.freeze({ dir: 'autonomous_inbox' }),
  Object.freeze({ dir: 'autonomous_logs' }),
  Object.freeze({ dir: 'clarifications' }),
  // The fourth of the runtime surfaces whose contents are machine-local, and the reason it sits with
  // the three above rather than under a phase: an implementer or a reviewer in *any* phase may need
  // to run a probe, so gating it would take the capability away from the phases that ask for it most.
  Object.freeze({ dir: 'scratch' }),
  Object.freeze({ dir: 'improvement_observations' }),
  Object.freeze({ dir: 'clarification_digests' }),
  Object.freeze({ dir: 'dispatch_additions' }),
  // The interactive-test phase.
  Object.freeze({ dir: 'qa_reviews', phase: 'qa' }),
  Object.freeze({ dir: 'qa_review_point_reviews', phase: 'qa' }),
  Object.freeze({ dir: 'ui_test_plans', phase: 'qa' }),
  Object.freeze({ dir: 'ui_test_plan_reviews', phase: 'qa' }),
  // The documentation phase.
  Object.freeze({ dir: 'docs_catalog', phase: 'docs' }),
  // The reference-implementation-parity phase.
  Object.freeze({ dir: 'business_parity_reviews', phase: 'parity' }),
  Object.freeze({ dir: 'business_parity_branch_reviews', phase: 'parity' }),
  Object.freeze({ dir: 'business_parity_branch_review_point_reviews', phase: 'parity' }),
  Object.freeze({ dir: 'business_parity_user_review_reviews', phase: 'parity' }),
] as const);

/**
 * The long-lived ledgers at the root of the tree, which are files rather than directories and are
 * written whatever the phases are.
 */
export const STATE_DIR_LEDGERS: readonly string[] = Object.freeze(['lessons.md', 'improvement_suggestions.md']);

/** The templates' subdirectory under `cli/templates/`, addressed as {@link readTemplate} wants it. */
const TEMPLATE_DIR = 'state-dir';

/** The per-directory contract file, in the template tree and in the adopter's tree alike. */
const README_FILENAME = 'README.md';

/**
 * The template for the tree's own top-level README.
 *
 * Named apart from the per-directory ones because `templates/state-dir/README.md` already describes
 * the *template* directory to a reader of this repository, and is not written to an adopter.
 */
const ROOT_README_TEMPLATE = 'README-root.md';

/** Everything {@link writeStateDir} needs. */
export interface StateDirOptions {
  /** The resolved repository root the tree is written under. */
  readonly repoRoot: string;
  /** The config `init` is about to write, or the one already on disk on a re-run. */
  readonly config: HarnessConfig;
  /** The command's write plan; this generator enqueues into it and never touches `fs` itself. */
  readonly plan: WritePlan;
}

/** What the generator produced, for `init`'s summary and for `doctor`. */
export interface StateDirResult {
  /** The `stateDir` actually used, repo-relative and without a trailing `/`. */
  readonly stateDir: string;
  /** Absolute path of the tree's root. */
  readonly root: string;
  /** The directories written, repo-relative, in {@link STATE_DIR_ENTRIES} order. */
  readonly directories: readonly string[];
  /** The phase-gated directories not written, repo-relative — for a summary that says what is absent. */
  readonly skipped: readonly string[];
  /** Informational lines, one each, for the reporter's `info`. */
  readonly notes: readonly string[];
}

/**
 * Re-assert the two things `stateDir` must be before a single directory is enqueued under it.
 *
 * The schema checks both and so does `config/check.ts`, and this checks them **again** deliberately:
 * a config can be hand-edited between the run that validated it and this one, and by the time a
 * dot-named tree has been created the failure is invisible — an unattended run may not be permitted
 * to write beneath a dot-path at all, and it reports success with no artifacts to show for it. That is a condition the adopter fixes by editing one key, so it carries the default
 * exit code rather than the internal one.
 *
 * The check runs against the **raw** configured value rather than the normalised one: normalising
 * strips a leading `./`, which is itself a dot segment the rule refuses.
 */
function assertWritableStateDir(raw: string): string {
  if (STATE_DIR_DOT_PATTERN.test(raw)) {
    throw new HarnessError(
      `stateDir is ${JSON.stringify(raw)}, which has a path segment starting with '.': the run-artifact tree must not be dot-named or reach through a dot segment, because it has to be writable by an unattended run and a dot-path is where a host reserves directories an unattended run may not write to — measured for .claude/**, where such a run completes with exit 0 having written nothing. Set stateDir in harness.config.json to a name without a leading dot; do not "fix" it back to a dot-name`,
    );
  }

  const normalized = normalizeRepoDir(raw.trim());
  if (normalized === '.' || normalized === '') {
    throw new HarnessError(
      `stateDir is ${JSON.stringify(raw)}, which names the repository root rather than a directory in it: the run-artifact tree is a directory of its own, and writing it at the root would scatter the flow's artifact directories through the repository. Set stateDir in harness.config.json to a directory name`,
    );
  }
  return normalized;
}

/** Whether a phase is on. Absent phases are off, which is the schema's default for all three. */
function phaseEnabled(phases: HarnessPhases | undefined, phase: StateDirPhase): boolean {
  return phases?.[phase] === true;
}

/**
 * The directories that belong in the tree for a given set of phases, in table order.
 *
 * Exported so `doctor` reports a missing directory against the same list `init` writes, rather than
 * against a second copy of it that can disagree.
 */
export function selectedStateDirs(phases: HarnessPhases | undefined): readonly StateDirEntry[] {
  return STATE_DIR_ENTRIES.filter((entry) => entry.phase === undefined || phaseEnabled(phases, entry.phase));
}

/**
 * Enqueue the run-artifact tree: `ensure-dir` for the root and for every selected directory, and
 * `create-if-absent` for the tree's README, each directory's README and both ledgers.
 *
 * `ensure-dir` is the whole of the directory contract — it is idempotent by construction, so a
 * second `init` reports the tree as ensured and changes nothing, and it never removes a directory
 * an adopter added. `create-if-absent` is the contract for every file here: the READMEs because the
 * adopter may have rewritten a contract sentence to match how their team uses the directory, and
 * the ledgers because they accumulate and an overwrite would destroy history.
 *
 * The two differ in what `--force` may do to them. A README is template content, so `--force`
 * replaces one after the write engine has taken a `.bak`, and the adopter's sentence is a `.bak`
 * away. **The ledgers are outside `--force` entirely** (`forceOverride: 'never'`): nothing can
 * re-derive an accumulating ledger, and the engine's `.bak` is single-generation — it is
 * overwritten rather than chained — so "recoverable" would only ever have meant "recoverable until
 * the next forced run". `--force` is an operation this CLI's own remedy messages routinely send an
 * adopter to, so a ledger has to survive it however many times it is run.
 *
 * Nothing here touches the filesystem: the generator plans, and `init` applies the plan once.
 */
export function writeStateDir({ repoRoot, config, plan }: StateDirOptions): StateDirResult {
  const stateDir = assertWritableStateDir(config.stateDir ?? DEFAULTS.stateDir);
  const root = join(repoRoot, stateDir);
  const directories: string[] = [];
  const skipped: string[] = [];
  const notes: string[] = [];

  plan.add({ path: root, policy: 'ensure-dir', label: 'run-artifact tree' });
  plan.add({
    path: join(root, README_FILENAME),
    policy: 'create-if-absent',
    content: readTemplate(`${TEMPLATE_DIR}/${ROOT_README_TEMPLATE}`),
    label: 'run-artifact tree README',
  });

  for (const ledger of STATE_DIR_LEDGERS) {
    plan.add({
      path: join(root, ledger),
      policy: 'create-if-absent',
      content: readTemplate(`${TEMPLATE_DIR}/${ledger}`),
      label: `ledger ${ledger}`,
      // Outside `--force` entirely (`core/writer.ts`'s `WriteRequest.forceOverride`), and for the
      // same reason `harness.config.json` is: an accumulating ledger has no derivable content to
      // regenerate, so an overwrite is pure loss — and the engine's `.bak` is single-generation, so
      // a second forced run takes the history with it. `--force` is an operation this CLI's own
      // remedy messages send an adopter to, so it has to be safe to run twice.
      forceOverride: 'never',
    });
  }

  for (const entry of STATE_DIR_ENTRIES) {
    const relative = `${stateDir}/${entry.dir}`;
    if (entry.phase !== undefined && !phaseEnabled(config.phases, entry.phase)) {
      skipped.push(relative);
      continue;
    }

    plan.add({ path: join(root, entry.dir), policy: 'ensure-dir', label: `artifact directory ${entry.dir}` });
    plan.add({
      path: join(root, entry.dir, README_FILENAME),
      policy: 'create-if-absent',
      content: readTemplate(`${TEMPLATE_DIR}/${entry.dir}/${README_FILENAME}`),
      label: `artifact directory README ${entry.dir}`,
    });
    directories.push(relative);
  }

  if (skipped.length > 0) {
    notes.push(
      `${skipped.length} artifact ${skipped.length === 1 ? 'directory belongs' : 'directories belong'} to a phase that is off, so ${skipped.length === 1 ? 'it was' : 'they were'} not created: turn the phase on in harness.config.json and re-run init to add ${skipped.length === 1 ? 'it' : 'them'}`,
    );
  }

  return { stateDir, root, directories, skipped, notes };
}

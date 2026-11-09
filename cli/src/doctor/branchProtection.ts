/**
 * What a protected branch needs blocked on the remote — direct pushes, force pushes, deletion — the
 * two GitHub endpoints that answer for one branch, the parsers of those answers, and the pure
 * grading of a branch's answers into a coverage state and the one-line sentence `doctor` prints.
 *
 * **The rule this module exists to enforce: a protected branch is reported covered only when
 * GitHub's answers prove direct pushes, force pushes and deletion all blocked, and an answer that
 * could not be read is graded neither covered nor missing.**
 *
 * This module reads nothing and spawns nothing, like `cli/src/doctor/keepAwake.ts`: every answer
 * reaches it as an argument — a `gh api` stdout string or an already-classified read — gathered by
 * `cli/src/doctor/checks.ts`, which also maps {@link describeCoverage}'s grade onto its outcome.
 *
 * **Not graded: ruleset bypass actors and the org-level ruleset view.** The per-branch rules
 * endpoint returns the rules in force without who may bypass them, so a rule is credited as it is
 * listed.
 *
 * **An absent or malformed classic field credits nothing.** Crediting a need from a field this
 * module cannot read would report a branch covered on an unproven answer.
 */

/** A thing a protected branch needs blocked on the remote. */
export type ProtectionNeed = 'push' | 'force-push' | 'deletion';

/** Every need, in the order the sentence names them. */
export const PROTECTION_NEEDS: readonly ProtectionNeed[] = ['push', 'force-push', 'deletion'];

/** How the sentence names each need. */
export const PROTECTION_NEED_LABEL: Readonly<Record<ProtectionNeed, string>> = {
  push: 'direct pushes',
  'force-push': 'force pushes',
  deletion: 'deletion',
};

/** The need each rule `type` of GitHub's REST *Get rules for a branch* answer blocks. */
export const RULESET_RULE_NEED: Readonly<Record<string, ProtectionNeed>> = {
  pull_request: 'push',
  update: 'push',
  non_fast_forward: 'force-push',
  deletion: 'deletion',
};

/** The rules in force on one branch; `gh` fills `{owner}`/`{repo}` from the checkout. */
export function branchRulesEndpoint(branch: string): string {
  return `repos/{owner}/{repo}/rules/branches/${encodeURIComponent(branch)}?per_page=100`;
}

/** One branch's classic branch protection; `gh` fills `{owner}`/`{repo}` from the checkout. */
export function classicProtectionEndpoint(branch: string): string {
  return `repos/{owner}/{repo}/branches/${encodeURIComponent(branch)}/protection`;
}

/** The refusal text of the classic endpoint that means *no classic protection*, not *unreadable*. */
export const CLASSIC_UNPROTECTED_PATTERN = /Branch not protected|Branch not found/i;

/** What a branch's classic protection blocks, and whether administrators are exempt from it. */
export interface ClassicProtection {
  readonly blocks: ReadonlySet<ProtectionNeed>;
  readonly adminsExempt: boolean;
}

/** The rules endpoint's answer for one branch. */
export type RulesetRead = { kind: 'read'; blocks: ReadonlySet<ProtectionNeed> } | { kind: 'unreadable'; why: string };

/** The classic endpoint's answer for one branch; `not-asked` when the rulesets already settled it. */
export type ClassicRead =
  | { kind: 'read'; protection: ClassicProtection }
  | { kind: 'none' }
  | { kind: 'unreadable'; why: string }
  | { kind: 'not-asked' };

/** One branch's grade: the needs nothing blocks, and the needs no readable answer settles. */
export interface BranchCoverage {
  readonly branch: string;
  readonly state: 'covered' | 'partial' | 'uncovered' | 'unknown';
  readonly missing: readonly ProtectionNeed[];
  readonly undetermined: readonly ProtectionNeed[];
  /** Why {@link undetermined} could not be settled — each unreadable source's reason; empty when it is empty. */
  readonly why: string;
  readonly notes: readonly string[];
}

const NOT_ASKED_WHY = 'its branch protection was not asked';

type JsonObject = Readonly<Record<string, unknown>>;

function isObject(value: unknown): value is JsonObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseJson(stdout: string): unknown {
  try {
    return JSON.parse(stdout);
  } catch {
    return undefined;
  }
}

/** Whether `value` is an object whose `enabled` is exactly `enabled`. */
function enabledIs(value: unknown, enabled: boolean): boolean {
  return isObject(value) && value['enabled'] === enabled;
}

/** The needs a rules answer blocks — unknown rule types ignored — or `undefined` for a shape it does not read. */
export function rulesetBlocksOf(stdout: string): ReadonlySet<ProtectionNeed> | undefined {
  const parsed = parseJson(stdout);
  if (!Array.isArray(parsed)) return undefined;
  const blocks = new Set<ProtectionNeed>();
  for (const rule of parsed) {
    if (!isObject(rule) || typeof rule['type'] !== 'string') return undefined;
    const type = rule['type'];
    if (Object.hasOwn(RULESET_RULE_NEED, type)) blocks.add(RULESET_RULE_NEED[type] as ProtectionNeed);
  }
  return blocks;
}

/** What a classic protection answer blocks, or `undefined` for a shape it does not read. */
export function classicProtectionOf(stdout: string): ClassicProtection | undefined {
  const parsed = parseJson(stdout);
  if (!isObject(parsed)) return undefined;
  const blocks = new Set<ProtectionNeed>();
  if (isObject(parsed['required_pull_request_reviews']) || enabledIs(parsed['lock_branch'], true)) blocks.add('push');
  if (enabledIs(parsed['allow_force_pushes'], false)) blocks.add('force-push');
  if (enabledIs(parsed['allow_deletions'], false)) blocks.add('deletion');
  return { blocks, adminsExempt: !enabledIs(parsed['enforce_admins'], true) };
}

/** Whether the rules answer alone blocks every need — exactly when the classic endpoint is not asked. */
export function rulesetsSettle(rulesets: RulesetRead): boolean {
  return rulesets.kind === 'read' && PROTECTION_NEEDS.every((need) => rulesets.blocks.has(need));
}

/** Grades one branch from its two answers; pure, so every state is testable without a remote. */
export function assessBranch(branch: string, rulesets: RulesetRead, classic: ClassicRead): BranchCoverage {
  const blocked = new Set<ProtectionNeed>();
  if (rulesets.kind === 'read') for (const need of rulesets.blocks) blocked.add(need);
  if (classic.kind === 'read') for (const need of classic.protection.blocks) blocked.add(need);

  const rulesetsBlockAll = rulesetsSettle(rulesets);
  const classicUnread = classic.kind === 'unreadable' || (classic.kind === 'not-asked' && !rulesetsBlockAll);
  const anyUnread = rulesets.kind === 'unreadable' || classicUnread;

  const unblocked = PROTECTION_NEEDS.filter((need) => !blocked.has(need));
  const missing = anyUnread ? [] : unblocked;
  const undetermined = anyUnread ? unblocked : [];

  const notes: string[] = [];
  if (classic.kind === 'read' && classic.protection.blocks.has('push') && classic.protection.adminsExempt) {
    notes.push(
      `\`${branch}\`'s branch protection does not include administrators, so an administrator's direct push is not blocked by it`,
    );
  }

  let state: BranchCoverage['state'];
  if (missing.length === 0 && undetermined.length === 0) state = 'covered';
  else if (undetermined.length > 0) state = 'unknown';
  else if (missing.length === PROTECTION_NEEDS.length) state = 'uncovered';
  else state = 'partial';

  const whys: string[] = [];
  if (undetermined.length > 0) {
    if (rulesets.kind === 'unreadable') whys.push(rulesets.why);
    if (classic.kind === 'unreadable') whys.push(classic.why);
    else if (classicUnread) whys.push(NOT_ASKED_WHY);
  }

  return { branch, state, missing, undetermined, why: whys.join('; '), notes };
}

/** Collapses every whitespace run, newlines included, so a `gh` refusal cannot break the line. */
function oneLine(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

function joinWords(words: readonly string[]): string {
  if (words.length <= 1) return words.join('');
  return `${words.slice(0, -1).join(', ')} and ${words[words.length - 1]}`;
}

function needsPhrase(needs: readonly ProtectionNeed[]): string {
  return joinWords(needs.map((need) => PROTECTION_NEED_LABEL[need]));
}

/** Every need a protected branch has, as one phrase — the one spelling every line naming the whole set prints. */
export const ALL_PROTECTION_NEEDS_PHRASE = needsPhrase(PROTECTION_NEEDS);

const REASON =
  "the commit, push and refresh wrappers run outside the sandbox from the main checkout, which the harness protects on this machine only — the remote's protection is yours";

const REMEDY =
  'add a ruleset under Settings → Rules → Rulesets targeting the branch, with Restrict deletions, Block force pushes and Require a pull request before merging';

/**
 * The grade and one-line sentence for every assessed branch and every glob left unchecked: `pass`
 * only when every branch is covered and no glob was named.
 */
export function describeCoverage(
  coverages: readonly BranchCoverage[],
  globs: readonly string[],
): { readonly grade: 'pass' | 'warn'; readonly detail: string } {
  const covered = coverages.filter((coverage) => coverage.state === 'covered');
  const coveredNames = covered.map((coverage) => `\`${coverage.branch}\``);
  const notes = coverages.flatMap((coverage) => coverage.notes.map(oneLine));

  if (covered.length === coverages.length && globs.length === 0) {
    const proved =
      coveredNames.length === 0
        ? 'no protected branch names one branch to check'
        : `a ruleset or branch protection blocks ${ALL_PROTECTION_NEEDS_PHRASE} on ${joinWords(coveredNames)}`;
    return { grade: 'pass', detail: oneLine([proved, ...notes].join('; ')) };
  }

  const parts: string[] = [];
  for (const coverage of coverages) {
    if (coverage.state === 'covered') continue;
    if (coverage.missing.length > 0) {
      parts.push(`\`${coverage.branch}\`: no ruleset or branch protection blocks ${needsPhrase(coverage.missing)}`);
    }
    if (coverage.undetermined.length > 0) {
      const verb = coverage.undetermined.length === 1 && coverage.undetermined[0] === 'deletion' ? 'is' : 'are';
      const why = coverage.why === '' ? '' : `: ${oneLine(coverage.why)}`;
      parts.push(`\`${coverage.branch}\`: cannot tell whether ${needsPhrase(coverage.undetermined)} ${verb} blocked${why}`);
    }
  }
  for (const glob of globs) {
    parts.push(`\`${glob}\` names a namespace rather than one branch; confirm a ruleset targets it`);
  }
  if (coveredNames.length > 0) parts.push(`covered: ${joinWords(coveredNames)}`);
  parts.push(REASON, REMEDY, ...notes);
  return { grade: 'warn', detail: oneLine(parts.join('; ')) };
}

/**
 * Generator: the caller-agnostic pre-push guard `init` writes into the configured `githooksDir`,
 * and the one git setting that makes it run.
 *
 * **The rule this module exists to enforce: the branch names the guard protects come from
 * configuration, and the guard is a backstop rather than a convention.** git runs a hook resolved
 * through `core.hooksPath` on *every* push **git** performs, whoever invoked git — a person, a
 * wrapper script, or a run whose own guard only ever sees the command string an agent submitted and
 * therefore never sees a push spawned indirectly. Caller-agnostic *within git* is the whole of that
 * claim, and the boundary is where git ends: a tool that implements push against the git backend
 * itself, as `jj git push` does, performs no git push and runs no git hook, so this file is not on
 * that path at all. Two things are — the session-level `PreToolUse` protected-branch guard the
 * plugin installs, which sees `jj git push` and draws the identical decision on one whose **target
 * is named** (measured), and a forge-side branch ruleset, which is the only true floor, which
 * nothing here provisions, and which is the only cover for a `jj git push` that names no bookmark.
 * `doctor`'s `jj-repository` check (`doctor/checks.ts`) is where an adopter on such a repository is
 * told all three, and where the bound on the second one is stated in full. That is what makes this the last line of defence for the "never land on a
 * protected branch" boundary within git, and why the protected set is substituted from the adopter's
 * configuration rather than baked into the shipped script.
 *
 * **The set, and the one way it goes stale.** {@link resolveProtectedBranches} resolves
 * *(`protectedBranches`, else that key's schema default)* ∪ *{`defaultBranch`}* — the same set
 * `hr_protected_patterns` in `scripts/lib/harness-run-lib.sh` gives the git wrappers, so one
 * configuration yields one set on both sides. What differs is **when**: the wrappers re-resolve it
 * from `harness.config.json` on every call, while this hook carries the set that was substituted
 * into its `case` label when `init` wrote it, because the hook is `create-if-absent`. So an edit to
 * `protectedBranches` binds a wrapper at once and binds the hook only at `init --force` (or after
 * deleting the hook and re-running `init`), and until then the two enforce different sets. A third
 * run re-renders it as a **consequence** rather than as a way to change the set: `init
 * --reset-config` rebuilds `harness.config.json` itself, and {@link writeGitHooks} re-renders the
 * hook from the rebuilt file — after a `.bak` — but only when the `case` label the hook carried no
 * longer matches the set that file resolves, and never when that label cannot be read. The
 * asymmetry is the point: `--force` re-renders unconditionally, `--reset-config` re-renders only a
 * hook its own rebuild made wrong. Which
 * resolution is authoritative follows the caller: a **push** is judged by the `case` label in the
 * written file, because git runs that file; a **wrapper** is judged by what the library returns.
 * Both sides of that comparison are exported rather than re-derived by whoever needs them —
 * {@link resolveProtectedBranches} for the configured set, {@link readProtectedCaseLabel} for the
 * set a written hook carries, {@link caseLabelMatches} for whether the two agree, and
 * {@link isGlobPattern} for whether an entry names one branch or a namespace — and the consumers
 * they exist for are `doctor`'s `pre-push-guard` and `protected-set` checks and
 * {@link writeGitHooks}' own re-render arm.
 * This is the one artifact deliberately exempt from choice 1 in `generators/outerLoopScripts.ts` —
 * git resolves a hook as a file at `core.hooksPath`, and `create-if-absent` keeps that file the
 * adopter's to edit.
 *
 * ## Three non-obvious choices, and where each comes from
 *
 * 1. **`init` points `core.hooksPath` at the configured directory only when it is unset or already
 *    equal — never when it points somewhere else.** An adopter who has already wired their hooks
 *    somewhere has made a decision the harness does not get to overrule silently, and a hooks path
 *    is a single value: taking it over would disable every hook they had. The mismatch is reported
 *    with **both** values so the fix is a one-line choice rather than a search.
 * 2. **The value written is repo-relative.** git resolves a relative `core.hooksPath` from the top
 *    of the working tree the hook runs in, so one value serves the repository and every additional
 *    working copy of it, each resolving to its own committed copy of the directory. An absolute
 *    path would pin every working copy to the first one that ran `init` — and the config file's
 *    paths are repo-relative anyway (`docs/config.md` §5).
 * 3. **The protected set is validated before it is substituted.** The patterns land inside a shell
 *    `case`, where `|` separates alternatives and `)` ends the list, so an entry carrying either
 *    would silently change what the guard matches — or produce a script that does not parse, which
 *    on a hook means every push fails. A glob (`release/*`) is the one metacharacter that is meant
 *    to be there and is what `protectedBranches` documents as its own feature.
 *
 * ## Where the filesystem and git are touched, and why they are split
 *
 * {@link writeGitHooks} is a planner like every other generator: it enqueues the hook into the
 * command's write plan and mutates nothing. It does **read** one file — the hook already at
 * `<githooksDir>/<PRE_PUSH_HOOK>`, and only on the run that rebuilt the config — because the
 * re-render arm's gate is what that file's `case` label says; a read is not a write, and the
 * decision it feeds still reaches the filesystem only through the plan.
 * {@link pointHooksPath} is the **mutation** — the CLI's
 * only write to git configuration — and is a separate exported function so `init` calls it *after*
 * the plan has been applied, when the hook it enables actually exists, and skips the write under
 * `--dry-run` while still reporting what it would have done.
 *
 * That is also why the two `git` calls below are here rather than in `core/git.ts`: that module
 * owns the *repository-state and path-resolution* probes, every one of which is read-only by
 * design, while these read and write a repository **setting**. `core/git.ts` names this module as
 * its one deliberate exception, and the two clauses are halves of the same rule: a third git
 * invocation anywhere in the package belongs there rather than here. Both nonetheless keep its first invariant — `execFileSync` with an argv
 * array and never a shell string. Its second — *literal* arguments with nothing interpolated —
 * holds for the read, whose probe is a frozen constant, but not for the write: that one passes the
 * configured `githooksDir` as an element of the argument vector. It is safe there precisely because
 * there is no shell to re-split it, and because {@link resolveGithooksDir} has already refused the
 * one value — the repository root — whose consequence would not be a one-key fix. That value is the
 * module's only interpolated git argument, and a second one would need the same two guarantees
 * spelled out before it is added.
 */

import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

import { CONFIG_FILENAME, DEFAULTS, type HarnessConfig } from '../config/model.js';
import { HarnessError } from '../core/errors.js';
import { readTemplate } from '../core/paths.js';
import { normalizeRepoDir } from '../core/repoPaths.js';
import { renderTemplate } from '../core/templating.js';
import type { WritePlan } from '../core/writer.js';

/** The templates' subdirectory under `cli/templates/`, addressed as {@link readTemplate} wants it. */
const TEMPLATE_DIR = 'githooks';

/** The hook's file name, in the template tree and in the adopter's `githooksDir` alike. */
export const PRE_PUSH_HOOK = 'pre-push';

/** Executable, because git runs the file rather than sourcing it. */
const HOOK_MODE = 0o755;

/** The git setting that decides which directory git looks for hooks in. */
const HOOKS_PATH_KEY = 'core.hooksPath';

/** The read probe, as one frozen literal so a review can see no flag was added to it. */
const GIT_READ_HOOKS_PATH: readonly string[] = Object.freeze(['config', '--get', HOOKS_PATH_KEY]);

/** git's exit status for `config --get <key>` when the key is simply not set anywhere. */
const GIT_KEY_NOT_FOUND = 1;

/** The token the protected-branch `case` pattern is substituted into. */
const CASE_TOKEN = 'protectedBranchesCase';

/** How the `case` list separates its alternatives. */
const CASE_SEPARATOR = '|';

/** The `case` statement the template opens; the label {@link CASE_TOKEN} renders is the line below it. */
const CASE_OPENER = 'case "$target" in';

/** How a `case` label ends, which is what makes the label tellable from the lines around it. */
const CASE_LABEL_END = ')';

/**
 * What a protected-branch pattern may not contain, and how a message names it.
 *
 * Everything that ends a `case` label, separates its alternatives, or opens a substitution — a
 * pattern carrying one of these changes what the guard matches, or produces a hook that does not
 * parse, in which case every push fails. `*`, `?` and `[…]` are deliberately absent from the list:
 * a `case` label is a glob, and a glob entry is what `protectedBranches` documents as the way to
 * protect a whole namespace with one entry.
 */
const FORBIDDEN_IN_PATTERN: ReadonlyArray<readonly [needle: string, described: string]> = Object.freeze([
  [CASE_SEPARATOR, 'a case-alternation separator (|)'],
  [')', 'a parenthesis, which ends a case label'],
  ['(', 'a parenthesis'],
  [';', 'a shell operator (;)'],
  ['&', 'a shell operator (&)'],
  ['$', 'a shell substitution ($)'],
  ['`', 'a backquote'],
  ['"', 'a double quote'],
  ["'", 'a single quote'],
  ['\\', 'a backslash'],
  ['<', 'a shell redirect (<)'],
  ['>', 'a shell redirect (>)'],
  [' ', 'a space'],
  ['\t', 'a tab'],
  ['\n', 'a newline'],
] as const);

/**
 * The three characters {@link FORBIDDEN_IN_PATTERN} deliberately admits, read from the other side:
 * what makes an entry a pattern rather than a branch name.
 */
const GLOB_METACHARACTERS: readonly string[] = Object.freeze(['*', '?', '[']);

/**
 * Whether a protected-branch entry is a glob — an entry the `case` label matches by pattern rather
 * than by name.
 *
 * **Exported so a consumer that has to tell a namespace entry from a branch name reads the character
 * set here** rather than spelling a second one that could drift from what
 * {@link FORBIDDEN_IN_PATTERN} admits. The consumer is `doctor`'s `protected-set` check, which looks
 * every listed entry up as a branch and cannot look a glob up at all: `release/*` names no single
 * ref, and it is what `protectedBranches` documents as the way to protect a whole namespace with one
 * entry — including a namespace an adopter wrote ahead of using it.
 */
export function isGlobPattern(entry: string): boolean {
  return GLOB_METACHARACTERS.some((needle) => entry.includes(needle));
}

/**
 * The set a **written** hook enforces — the alternatives of its `case` label — or `undefined` when
 * the file carries no label to read. {@link writeGitHooks}' inverse, and the only way to learn what
 * a hook on disk protects.
 *
 * It reads that **label**, not the file as a whole, which is the discipline `docs/development.md`
 * §5 gate 7 leg (iv) states as *"Read that label specifically, and not the file as a whole"*: the
 * hook's own header names `release/*` as an example entry, so a search for a branch name across the
 * file answers yes on a hook whose guard would never match it.
 *
 * Nothing is unescaped, because nothing was escaped: {@link FORBIDDEN_IN_PATTERN} refused every
 * character that would change how the label parses before it was written, which is what makes a
 * split on {@link CASE_SEPARATOR} exact rather than a best effort.
 *
 * **`undefined` is the answer for every shape that is not a readable label, and an empty list is
 * never returned.** A hook an adopter rewrote is a legitimate state a consumer has to be able to
 * report *as* unreadable; answering it with the empty set would report it as protecting nothing,
 * which is the one state {@link resolveProtectedBranches} exists to keep a guard out of.
 */
export function readProtectedCaseLabel(hookText: string): readonly string[] | undefined {
  const lines = hookText.split('\n');
  const opener = lines.findIndex((line) => line.includes(CASE_OPENER));
  if (opener === -1) return undefined;

  const label = lines.slice(opener + 1).find((line) => line.trim() !== '')?.trim();
  if (label === undefined || !label.endsWith(CASE_LABEL_END)) return undefined;

  const patterns = label
    .slice(0, -CASE_LABEL_END.length)
    .trim()
    .split(CASE_SEPARATOR)
    .map((pattern) => pattern.trim());
  return patterns.some((pattern) => pattern === '') ? undefined : patterns;
}

/**
 * Whether a label read out of a hook and a resolved set are the same set — the one comparison every
 * consumer of the two readers above makes, so that none of them writes its own.
 *
 * **Order- and duplicate-insensitive.** A `case` list is an alternation, in which order carries no
 * meaning, and {@link resolveProtectedBranches} de-duplicates through a `Set` before a label is
 * rendered from it. Reporting a hand-reordered but equivalent label as drift would be a check
 * nobody keeps green, and the adopter who edited that label by hand is exactly the reader it has to
 * stay useful to.
 */
export function caseLabelMatches(label: readonly string[], resolved: readonly string[]): boolean {
  const written = new Set(label);
  const configured = new Set(resolved);
  return written.size === configured.size && [...written].every((pattern) => configured.has(pattern));
}

/** Everything {@link writeGitHooks} needs. */
export interface GitHooksOptions {
  /** The resolved repository root the hook is written under. */
  readonly repoRoot: string;
  /** The config `init` is about to write, or the one already on disk on a re-run. */
  readonly config: HarnessConfig;
  /** The command's write plan; this generator enqueues into it and never writes through `fs` itself. */
  readonly plan: WritePlan;
  /**
   * Did this run **rebuild** `harness.config.json` — `init --reset-config`? The **one** input to the
   * re-render decision, and deliberately not a second one: the hook is re-rendered only where the
   * run that made its label wrong is the same run, so every ordinary re-run stays out of that path
   * entirely. `init` passes `flags.resetConfig`; nothing else sets it.
   */
  readonly configRebuilt?: boolean;
  /**
   * Wording only — the re-render decision is computed identically in both modes, which is what makes
   * a dry run a faithful preview. It reaches the **tense** of the re-render note, which would
   * otherwise claim a replacement and a `.bak` a preview never made (`docs/cli.md` §1).
   */
  readonly dryRun?: boolean;
}

/** What the generator produced, for `init`'s summary, for {@link pointHooksPath} and for `doctor`. */
export interface GitHooksResult {
  /** The `githooksDir` actually used: the config's value or the schema default, without a trailing `/`. */
  readonly githooksDir: string;
  /** Repo-relative path of the hook that was enqueued. */
  readonly hookPath: string;
  /** The patterns substituted into the guard, in the order they appear in its `case` list. */
  readonly protectedBranches: readonly string[];
  /** Things needing attention, one line each, for the reporter's `warn`. */
  readonly warnings: readonly string[];
  /** Informational lines, one each, for the reporter's `info`. */
  readonly notes: readonly string[];
}

/**
 * What {@link pointHooksPath} did, or under `--dry-run` what a real run would have done.
 *
 * - `set` — the setting was absent and now names the configured directory.
 * - `already-set` — it already resolved to that directory; nothing was written.
 * - `left-alone` — it names a different directory, which is the adopter's decision to keep.
 * - `unavailable` — git could not be asked or could not be told; the guard is inert until it is.
 */
export type HooksPathEffect = 'set' | 'already-set' | 'left-alone' | 'unavailable';

/** Everything {@link pointHooksPath} needs. */
export interface HooksPathOptions {
  /** The resolved repository root whose configuration is being read and written. */
  readonly repoRoot: string;
  /** The configured `githooksDir`, repo-relative — {@link GitHooksResult.githooksDir}. */
  readonly githooksDir: string;
  /** Decide and report, and write nothing. The decision is computed identically in both modes. */
  readonly dryRun?: boolean;
}

/** What {@link pointHooksPath} decided. */
export interface HooksPathResult {
  /** What a real run does or did — never affected by `--dry-run`, which is what makes it a preview. */
  readonly effect: HooksPathEffect;
  /** False under `--dry-run`, and under every effect that writes nothing. */
  readonly applied: boolean;
  /** The value `init` wants the setting to hold. */
  readonly configured: string;
  /** What the setting held when it was read, when it held anything. */
  readonly existing?: string;
  /** Things needing attention, one line each, for the reporter's `warn`. */
  readonly warnings: readonly string[];
  /** Informational lines, one each, for the reporter's `info`. */
  readonly notes: readonly string[];
}

/**
 * The configured hooks directory, refused when it names the repository root.
 *
 * `core.hooksPath` makes git treat *every* file in the directory it names as a candidate hook, so
 * pointing it at the root would put the repository's whole top level in that role. The fix is one
 * key, so it carries the ordinary exit code.
 *
 * **Exported so a check grades the hook at the path the generator wrote it to**, rather than
 * resolving a second one. It still throws on that value from a `doctor` check as it does from
 * `init`, and that is the intended handling: `runChecks` turns a thrown value into that check's own
 * `fail` naming the check that threw, so a caller catching it would be replacing a reported failure
 * with a quieter one (`doctor/checks.ts` → `runChecks`).
 */
export function resolveGithooksDir(config: HarnessConfig): string {
  const normalized = normalizeRepoDir((config.githooksDir ?? DEFAULTS.githooksDir).trim());
  if (normalized === '.' || normalized === '') {
    throw new HarnessError(
      `githooksDir is ${JSON.stringify(config.githooksDir)}, which names the repository root rather than a directory in it: git treats every file in the directory core.hooksPath names as a candidate hook, so the repository's whole top level would be in that role. Set githooksDir in harness.config.json to a directory name`,
    );
  }
  return normalized;
}

/**
 * The patterns the guard refuses a push to: `protectedBranches` — or, when the key is absent, that
 * key's schema default — trimmed and de-duplicated, then **unioned with `defaultBranch`**.
 *
 * The union is what makes the hook enforce the set `hr_protected_patterns` resolves for the git
 * wrappers, which unions `defaultBranch` too. Without it the two disagreed in the direction that
 * fails silently: a `protectedBranches` not listing the default branch left the wrappers refusing a
 * commit on it while the hook — the last line of defence, and the only one a push spawned
 * indirectly reaches — let the push through. A union only ever widens a refusal, so the branch work
 * merges back into is protected whatever the list says, and `defaultBranch` faces the same
 * {@link FORBIDDEN_IN_PATTERN} check as a listed entry because it lands in the same `case` label.
 *
 * An empty list is therefore exactly "only the default branch", and says so. Protecting nothing is
 * the one reading of an empty list that leaves the guard as a hook that runs on every push and
 * never refuses one — a backstop that silently protects nothing is worse than no backstop, because
 * its presence is what everything else relies on.
 *
 * **Exported so a consumer comparing a written hook against the configuration resolves the set
 * here** rather than spelling the union out a second time. `warn` stays a required parameter: the
 * empty-list warning belongs to the run that *writes* a hook, so a consumer that only wants the set
 * passes a no-op and reports the state it found in its own words.
 */
export function resolveProtectedBranches(
  config: HarnessConfig,
  warn: (message: string) => void,
): readonly string[] {
  const configured = (config.protectedBranches ?? DEFAULTS.protectedBranches).map((entry) => entry.trim());
  const listed = [...new Set(configured.filter((entry) => entry !== ''))];
  const defaultBranch = config.defaultBranch.trim() === '' ? DEFAULTS.defaultBranch : config.defaultBranch.trim();

  if (listed.length === 0) {
    warn(
      `protectedBranches lists no branch, so the pre-push guard was written to protect ${JSON.stringify(defaultBranch)} and nothing else - the branch work merges back into, which is in the set whatever the list says. A guard that refuses nothing runs on every push and stops none of them, which is the one state it must not be in: list the branches in protectedBranches in ${CONFIG_FILENAME} (or set the key with \`config set protectedBranches '<json>'\`), then re-run init --force, which copies the generated ${PRE_PUSH_HOOK} hook to a .bak sibling and re-renders it from the config in effect - --force overwrites generated files but never ${CONFIG_FILENAME}, which init reads on every run, so the list just written is the one the hook is rendered from. Without --force: delete the generated ${PRE_PUSH_HOOK} hook and re-run init, which re-renders it because the hook is create-if-absent`,
    );
  }

  const patterns = [...new Set([...listed, defaultBranch])];

  for (const pattern of patterns) {
    const source = listed.includes(pattern) ? 'protectedBranches entry' : 'defaultBranch';
    for (const [needle, described] of FORBIDDEN_IN_PATTERN) {
      if (!pattern.includes(needle)) continue;
      throw new HarnessError(
        `the ${source} ${JSON.stringify(pattern)} contains ${described}, and the protected set is substituted into a shell case list in the pre-push hook: an entry carrying one either changes which branches the guard matches or leaves a hook that does not parse, in which case every push fails. Use a glob such as release/* to cover a namespace, and keep each entry a single branch pattern`,
      );
    }
  }

  return patterns;
}

/**
 * Render the hook through {@link renderTemplate}.
 *
 * **`assertNoneSurvive` is off**: the value substituted in is the protected-branch set, which is the
 * adopter's, and {@link FORBIDDEN_IN_PATTERN} has already refused every character that could change
 * what the guard matches. A branch pattern that merely *looked* like a token is not a fault in this
 * CLI, which is all the post-check would be able to report it as.
 */
function renderHook(values: Readonly<Record<string, string>>): string {
  return renderTemplate(readTemplate(`${TEMPLATE_DIR}/${PRE_PUSH_HOOK}`), values, {
    describe: `the ${PRE_PUSH_HOOK} template`,
  });
}

/**
 * What the hook **already on disk** says, on the one run allowed to act on it — the re-render gate,
 * as four states rather than a boolean, because three of them mean *leave it alone* for three
 * different reasons and each has its own report.
 *
 * - `absent` — nothing is there, so the ordinary `create-if-absent` create writes it. Also the
 *   answer for a file that cannot be read at all: an unreadable path is `plan.apply`'s to refuse,
 *   and a generator that turned it into a second refusal here would report one fault twice.
 * - `unreadable` — a file whose `case` label {@link readProtectedCaseLabel} cannot get back out.
 *   That is a hook the adopter rewrote, and rebuilding a configuration is not consent to discard
 *   it: the engine's `.bak` is single-generation, so replacing it would spend the one reprieve on
 *   the only copy of something nothing can regenerate.
 * - `equal` — the label already is the resolved set, so an unchanged re-run stays a no-op and no
 *   `.bak` is minted for nothing.
 * - `stale` — the label and the set disagree, which is the only state this exists for.
 */
type WrittenGuard =
  | { readonly kind: 'absent' | 'unreadable' | 'equal' }
  | { readonly kind: 'stale'; readonly label: readonly string[] };

/** The generator's one read: the hook that is there, graded against the set just resolved. */
function inspectWrittenGuard(hookFile: string, resolved: readonly string[]): WrittenGuard {
  let hookText: string;
  try {
    hookText = readFileSync(hookFile, 'utf8');
  } catch {
    return { kind: 'absent' };
  }

  const label = readProtectedCaseLabel(hookText);
  if (label === undefined) return { kind: 'unreadable' };
  return caseLabelMatches(label, resolved) ? { kind: 'equal' } : { kind: 'stale', label };
}

/**
 * Enqueue the pre-push guard: `ensure-dir` on the configured `githooksDir`, then the rendered hook
 * as `create-if-absent` with the executable bit.
 *
 * `create-if-absent` is the re-run contract for this artifact: the adopter may have tightened the
 * guard, and a second `init` leaves an edited hook byte-identical — which is why the note below says
 * what a **kept** hook carries rather than restating the set the config in effect holds. `--force`
 * regenerates the hook, after the write engine has copied it to a `.bak` sibling, and that *is* the
 * way to pick up a change to `protectedBranches`: config is read-if-present on every run, so an edit
 * living only in `harness.config.json` survives `--force` and is what the hook is re-rendered from.
 * Without `--force`, deleting the hook and re-running `init` re-renders it the same way, and is the
 * way to pick the change up without regenerating any other artifact.
 *
 * **The one run that also re-renders it is the run that rebuilt the config it is rendered from.**
 * The artifact stays `create-if-absent`; what changes is that a `--reset-config` run
 * ({@link GitHooksOptions.configRebuilt}) answers the overwrite question for *this* request with
 * `forceOverride: 'always'` when — and only when — {@link inspectWrittenGuard} reports the written
 * label `stale` against the set the rebuilt config resolves. Without it the documented remedy
 * produced the defect: `--reset-config --default-branch <name>` is what corrects `defaultBranch`,
 * and it left the guard enforcing the branch set it was written with. The asymmetry with `--force`
 * is deliberate — `--force` re-renders unconditionally, this run re-renders only a hook its own
 * rebuild made wrong — and the other three states are left byte-identical, an `unreadable` one with
 * a warning naming `doctor`'s `pre-push-guard` check.
 *
 * Nothing here writes to the filesystem or touches git: the generator reads the hook that is there,
 * plans, `init` applies the plan, and {@link pointHooksPath} is called afterwards to make the hook
 * take effect.
 */
export function writeGitHooks({
  repoRoot,
  config,
  plan,
  configRebuilt = false,
  dryRun = false,
}: GitHooksOptions): GitHooksResult {
  const warnings: string[] = [];
  const notes: string[] = [];

  const githooksDir = resolveGithooksDir(config);
  const protectedBranches = resolveProtectedBranches(config, (message) => warnings.push(message));
  const hookPath = `${githooksDir}/${PRE_PUSH_HOOK}`;

  // Read only where the run may act on the answer, so an ordinary re-run does not so much as open
  // the file it is contractually required to keep.
  const written = configRebuilt
    ? inspectWrittenGuard(join(repoRoot, hookPath), protectedBranches)
    : undefined;
  const reRender = written?.kind === 'stale';

  plan.add({ path: join(repoRoot, githooksDir), policy: 'ensure-dir', label: 'git hooks directory' });
  plan.add({
    path: join(repoRoot, hookPath),
    policy: 'create-if-absent',
    content: renderHook({ [CASE_TOKEN]: protectedBranches.join(CASE_SEPARATOR) }),
    label: `git hook ${PRE_PUSH_HOOK}`,
    mode: HOOK_MODE,
    // The write engine's own mechanism, not a fifth policy: `'always'` copies the target to
    // `<path>.bak` and replaces it on a run with no --force at all (`core/writer.ts`).
    ...(reRender ? { forceOverride: 'always' as const } : {}),
  });

  // "A hook that was already there is kept" is a claim about *this* run, so it may not stand on the
  // run that re-rendered the file, one note below the line saying so. The re-render arm states the
  // artifact's property and leaves what happened to that note, which is the one that carries a tense.
  const keptClause = reRender
    ? `so the hook carries the set that was substituted into its case label`
    : `so a hook that was already there is kept exactly as it is and still carries the set it was written with`;
  notes.push(
    `${hookPath} is generated to refuse a push whose target branch is ${protectedBranches.join(', ')}, whoever invokes git - on every push git itself performs, which is not every push: a tool that implements push against the git backend directly, as \`jj git push\` does, runs no git hook, and doctor's jj-repository check reports that where it applies. The set is protectedBranches unioned with defaultBranch, which is in the set whatever the list says. It is committed, so it travels with the checkout, and the branch set is substituted at write time - ${keptClause}, while the git wrappers re-read ${CONFIG_FILENAME} on every call: until the hook is re-rendered the two can enforce different sets, and a push is judged by this file. To change the set: edit the case list in ${hookPath} by hand and keep protectedBranches in ${CONFIG_FILENAME} in step with it, or edit that key (\`config set protectedBranches '<json>'\`) and re-run init --force, which copies ${hookPath} to ${hookPath}.bak and re-renders it from the config in effect - --force overwrites generated files but never ${CONFIG_FILENAME}, which init reads on every run, so the edited set is the one the hook is rendered from. Without --force: delete ${hookPath} and re-run init, which re-renders the hook because it is create-if-absent`,
  );

  if (written?.kind === 'stale') {
    notes.push(
      dryRun
        ? `${hookPath} carries the case label ${written.label.join(', ')} and the ${CONFIG_FILENAME} this run would rebuild resolves ${protectedBranches.join(', ')}, so the hook would be re-rendered from the rebuilt file and the file that is there would be copied to ${hookPath}.bak first - a guard left carrying the old label is what enforces a branch set the rebuild made wrong. Any hand edit in it would be in that .bak rather than in the guard git then runs, so anything you meant to keep would have to be put back by hand. This was a dry run, so nothing was written and nothing was backed up`
        : `${hookPath} carried the case label ${written.label.join(', ')} and the rebuilt ${CONFIG_FILENAME} resolves ${protectedBranches.join(', ')}, so the hook was re-rendered from it and the file that was there is at ${hookPath}.bak - a guard left carrying the old label is what enforces a branch set the rebuild made wrong. Any hand edit in it is in that .bak rather than in the guard git now runs, so anything you meant to keep has to be put back by hand`,
    );
  }

  // Tense-free on purpose, unlike the note above it: this arm writes nothing in either mode, so
  // there is no completion to claim and a --dry-run wording would be the same sentence.
  if (written?.kind === 'unreadable') {
    warnings.push(
      `${hookPath} is there but carries no case label in the generated shape, so what it protects cannot be read out of it and cannot be compared with the protected set this run resolved (${protectedBranches.join(', ')}): a hook in that state is left exactly as it is, because rebuilding ${CONFIG_FILENAME} is not consent to discard a guard somebody wrote by hand. \`doctor\`'s pre-push-guard check reports this state on every run: read the file to see what it refuses, then either put the set back in its case label by hand or delete ${hookPath} and re-run init, which re-renders it because the hook is create-if-absent`,
    );
  }

  return { githooksDir, hookPath, protectedBranches, warnings, notes };
}

/** One git invocation, with the arguments passed as an argv array and stdin closed. */
function runGit(args: readonly string[], cwd: string): string {
  return execFileSync('git', [...args], {
    cwd,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true,
  }).trim();
}

/** What the setting holds now: its value, `undefined` when unset, or why it could not be read. */
function readHooksPath(repoRoot: string): { value?: string; error?: string } {
  try {
    const value = runGit(GIT_READ_HOOKS_PATH, repoRoot);
    return value === '' ? {} : { value };
  } catch (error) {
    const failure = error as NodeJS.ErrnoException & { status?: number };
    if (failure.status === GIT_KEY_NOT_FOUND) return {};
    if (failure.code === 'ENOENT') return { error: 'git is not on PATH' };
    return { error: failure.message };
  }
}

/** True when two spellings of a hooks path name the same directory. Absolute and relative both. */
function sameDirectory(repoRoot: string, existing: string, configured: string): boolean {
  return resolve(repoRoot, existing) === resolve(repoRoot, configured);
}

/**
 * Point `core.hooksPath` at the configured `githooksDir` — **only** when it is unset or already
 * resolves there.
 *
 * This is the CLI's one write to git configuration, and the whole reason it is a separate function
 * from the generator above: `init` calls it after the write plan has been applied, so the setting
 * is never made to name a directory whose hook has not been written yet, and a `--dry-run` reports
 * the decision without making it.
 *
 * Every outcome that is not `set` leaves the repository exactly as it was and explains itself: a
 * hooks path pointing elsewhere is the adopter's own wiring, and taking it over would disable every
 * hook they have there. None of them fails the command — the rest of `init` is unaffected, and the
 * fix is a single documented command.
 */
export function pointHooksPath({ repoRoot, githooksDir, dryRun = false }: HooksPathOptions): HooksPathResult {
  const configured = normalizeRepoDir(githooksDir);
  const manualFix = `git config ${HOOKS_PATH_KEY} ${configured}`;
  const warnings: string[] = [];
  const notes: string[] = [];

  const current = readHooksPath(repoRoot);

  if (current.error !== undefined) {
    warnings.push(
      `${HOOKS_PATH_KEY} could not be read (${current.error}), so it was left alone and the pre-push guard does not run yet: set it with \`${manualFix}\` from the repository root`,
    );
    return { effect: 'unavailable', applied: false, configured, warnings, notes };
  }

  if (current.value !== undefined) {
    if (!sameDirectory(repoRoot, current.value, configured)) {
      warnings.push(
        `${HOOKS_PATH_KEY} already points at ${current.value}, not at the configured githooksDir ${configured}, so init left it exactly as it is - taking it over would disable whatever hooks you have there. The pre-push guard does not run until the two agree: either point it here with \`${manualFix}\`, or set githooksDir in harness.config.json to ${current.value} and re-run init`,
      );
      return { effect: 'left-alone', applied: false, configured, existing: current.value, warnings, notes };
    }

    notes.push(`${HOOKS_PATH_KEY} already resolves to ${configured}, so it was left as it is`);
    return { effect: 'already-set', applied: false, configured, existing: current.value, warnings, notes };
  }

  if (dryRun) {
    notes.push(`${HOOKS_PATH_KEY} is unset and would be set to ${configured}`);
    return { effect: 'set', applied: false, configured, warnings, notes };
  }

  try {
    // `configured` is the module's only interpolated git argument - safe as an argv element (no
    // shell re-splits it) and already refused by resolveGithooksDir when it names the repo root.
    runGit(['config', HOOKS_PATH_KEY, configured], repoRoot);
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    warnings.push(
      `${HOOKS_PATH_KEY} could not be set (${detail}), so the pre-push guard does not run yet: set it with \`${manualFix}\` from the repository root`,
    );
    return { effect: 'unavailable', applied: false, configured, warnings, notes };
  }

  notes.push(
    `${HOOKS_PATH_KEY} now points at ${configured}, so the hooks committed there run for this checkout. The value is repo-relative, which git resolves from the top of the working tree the hook runs in, so an additional working copy of this repository resolves it to its own copy of the directory rather than to this one`,
  );
  return { effect: 'set', applied: true, configured, warnings, notes };
}

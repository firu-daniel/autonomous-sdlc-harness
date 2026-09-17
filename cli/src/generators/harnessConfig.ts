/**
 * Generator: the adopting repository's `harness.config.json`.
 *
 * It assembles one object out of stack detection and the explicit `init` flags, refuses to write
 * one it can already tell is invalid, and enqueues it under the `create-if-absent` contract so a
 * second `init` never rewrites a config the adopter has edited unless it was asked to — which is
 * the whole of what `--reset-config` is. It is the artifact the schema gate
 * validates, so everything below is written to satisfy `schemas/harness.config.schema.json` rather
 * than to look tidy.
 *
 * ## Three non-obvious choices, and where each comes from
 *
 * 1. **The generated file omits `$schema`.** The key is optional, and `docs/config.md` §5 fixes its
 *    frame: "its value is a URI or a path resolved relative to this file's own location, not a
 *    repo-relative path". An adopter's repository has no stable relative path to a schema shipped
 *    inside an installed package, so any value written here would be wrong somewhere.
 *    `examples/harness.config.json` keeps the key because that file sits beside the schema.
 * 2. **An optional section is omitted entirely rather than emitted empty or null.**
 *    `additionalProperties: false` holds at every level, and an empty `qa: {}` or a
 *    `parity: { }` says nothing a reader or `doctor` can act on while looking like a decision that
 *    was made. Off means absent. The same reasoning omits `clientEnvPrefix`: its default is `null`,
 *    nothing in a repository states it, and a reader that wants its effective value reads
 *    `DEFAULTS`.
 * 3. **`commands.typecheck` / `test` / `devServer` hold the wrapper *invocation*; `build` and
 *    `depInstall` hold the **raw** detected line** (the `commands` object of
 *    `examples/harness.config.json`).
 *    The invocation string is never formatted here — it comes from `generators/scripts.ts`'s
 *    {@link wrapperInvocation}, and the file name from its {@link WRAPPER_SCRIPTS} table — because
 *    the value written here, the wrapper file that generator writes, and the permission profile's
 *    repo-relative allow entry are three views of one string, and drift between them is invisible
 *    until an unattended run stalls on a command matching neither `allow` nor `deny`.
 *
 * **Every path written into this file is repo-relative** (`docs/config.md` §5), `commands.*`
 * included: commands are executed from the repository root. The profile's absolute and
 * worktree-glob twins of a wrapper path exist so that this repo-relative value can stay
 * schema-conformant — writing an absolute path here to "match the profile" would break the rule the
 * twins were added to preserve.
 *
 * ## What this generator deliberately does not decide
 *
 * - **Flag-shaped refusals.** A `--state-dir` naming a dot-directory is an adopter-fixable usage
 *   error that the `init` flag surface refuses before anything is assembled. The
 *   {@link EXIT.INTERNAL} throw below is the backstop for the other case — a config this generator
 *   itself assembled wrongly, which no adopter can fix.
 * - **`deploy`.** It is an adopter-added section this release never generates; the wrapper-script
 *   and permission-profile generators both gate their deploy handling on its presence, so emitting
 *   an empty one here would turn a deliberate absence into a half-configured deploy.
 */

import { checkConfigShape, formatProblem, hasErrors } from '../config/check.js';
import { configExists, loadConfig, saveConfig } from '../config/io.js';
import {
  asQaDriver,
  CONFIG_FILENAME,
  CONFIG_VERSION,
  DEFAULTS,
  isPlaceholder,
  QA_DRIVER_IMPLEMENTED,
  qaDriverChoices,
  type HarnessCommands,
  type HarnessConfig,
  type HarnessDetection,
  type HarnessQaDriver,
} from '../config/model.js';
import { EXIT, HarnessError } from '../core/errors.js';
import {
  branchResolves,
  checkedOutBranch,
  configuredInitDefaultBranch,
  hasCommits,
  remoteHeadBranch,
  type HeadProbe,
} from '../core/git.js';
import { defaultProjectName } from '../core/paths.js';
import type { WritePlan } from '../core/writer.js';
import { buildPreset, type PresetProfile, type RawCommands } from '../detect/presets.js';
import type { DetectionResult } from '../detect/signals.js';
import { WRAPPER_SCRIPTS, wrapperInvocation, type WrapperFile, type WrapperKey } from './scripts.js';

/**
 * Branch names a repository's integration line conventionally has — the trigger for the **second**
 * arm of {@link warnAboutGuessedBranch}, and nothing else.
 *
 * It does not decide the value: {@link resolveDefaultBranch} detects that, and a repository whose
 * integration line is called `develop` or `trunk` is wired to *that* name rather than overridden
 * with a conventional one. Its role narrowed when the guard gained an arm that tests **resolution**:
 * a guessed name resolving to no branch here is wrong whatever it is called, and that arm catches
 * the case this list is blind to by construction — a conventional `main` guessed into a repository
 * that has no `main`, which is the commonest wrong answer. What is left for the list is the weaker
 * signal the resolution test cannot give: a name that *does* resolve but reads like the feature
 * branch `init` happened to run from, wired in as the line work merges back into.
 *
 * The constant keeps its name and its two entries, so it stays greppable against the finding.
 */
const DEFAULT_LOOKING_BRANCHES: readonly string[] = ['main', 'master'];

/**
 * How the CLI is typed, for the remedies the guard prints. The `npx` prefix rule is stated once in
 * `commands/init.ts`, beside its own `CLI`.
 */
const CLI = 'npx autonomous-sdlc-harness';

/**
 * Seed for `qa.credentialsPath`: the gitignored file the interactive test phase reads accounts
 * from. Exported because the generator that writes the `.example` companion has to put it beside
 * the file an adopter is being told to create, and a second spelling here would separate them.
 */
export const QA_CREDENTIALS_PATH = '.claude/qa-accounts.env';

/** Seed for `docs.root` when `--docs-root` is not given. */
const DEFAULT_DOCS_ROOT = 'docs';

/**
 * Seed for `pushEnvPath`, written whatever the phases are: the *path* is repo-scoped configuration
 * that is the same for everyone who clones, while the file it names is machine-local and is added
 * to `.gitignore` by the repo-root generator. Exported for the same reason as
 * {@link QA_CREDENTIALS_PATH}: its `.example` companion is written beside it.
 */
export const PUSH_ENV_PATH = '.claude/push-notify.env';

/**
 * How one `commands.*` key's value is written, in the schema's key order.
 *
 * A discriminated union rather than a boolean field, so a `wrapped: true` row can only carry a key
 * the wrapper table actually has — `build` and `depInstall` are unwrappable in the type, not just
 * by convention.
 */
type CommandPlanEntry =
  | { readonly key: Extract<WrapperKey, keyof HarnessCommands>; readonly wrapped: true }
  | { readonly key: 'build' | 'depInstall'; readonly wrapped: false };

/** The five command keys, in schema order, so the assembled object serializes in that order. */
const COMMAND_PLAN: readonly CommandPlanEntry[] = [
  { key: 'typecheck', wrapped: true },
  { key: 'test', wrapped: true },
  { key: 'build', wrapped: false },
  { key: 'devServer', wrapped: true },
  { key: 'depInstall', wrapped: false },
];

/** The `init` flags this generator reads. Every one is optional; the flag surface owns parsing them. */
export interface HarnessConfigFlags {
  /** `--project-name`. Defaults to the repository directory name. */
  readonly projectName?: string;
  /** `--default-branch`. Detected from the repository when absent — see {@link resolveDefaultBranch}. */
  readonly defaultBranch?: string;
  /** `--state-dir`. Defaults to the schema's `sdlc-harness/`. */
  readonly stateDir?: string;
  /** `--qa`, `--docs`, `--parity`: the three phase toggles, each off unless given. */
  readonly qa?: boolean;
  readonly docs?: boolean;
  readonly parity?: boolean;
  /**
   * `--qa-driver`. Read only when `--qa` is on; {@link resolveQaDriver} answers it otherwise.
   *
   * Typed as the enum rather than as a raw string because the flag surface validates it at parse
   * time (`commands/init.ts`), so an illegal value never reaches this generator and there is no
   * unreachable branch here pretending otherwise.
   */
  readonly qaDriver?: HarnessQaDriver;
  /** `--docs-root`. Read only when `--docs` is on. */
  readonly docsRoot?: string;
  /** `--docs-retrieval`. Read only when `--docs` is on. */
  readonly docsRetrieval?: boolean;
  /** `--reference-impl`. Read only when `--parity` is on. */
  readonly referenceImpl?: string;
}

/** Everything {@link buildConfig} needs. */
export interface BuildConfigOptions {
  /** The resolved repository root the config is being written for. */
  readonly repoRoot: string;
  /**
   * Stack detection's result. `--app-dir` reaches this generator through `detection.context.appDir`
   * rather than through {@link HarnessConfigFlags}: the context holds that flag already normalised,
   * and it is the tree detection actually probed, so reading the flag a second time here could
   * write an `appDir` the layer profile was not derived from.
   */
  readonly detection: DetectionResult;
  /**
   * The preset profile built from {@link detection}.
   *
   * Optional so a caller holding only a detection result can build a config, but `init` passes the
   * profile it already built: `buildPreset` drains the detection context's warning **and note**
   * lists, so a second call would silently return neither and leave whichever caller ran first
   * holding them all.
   */
  readonly preset?: PresetProfile;
  readonly flags: HarnessConfigFlags;
  /**
   * Sink for a line the adopter should see. Called rather than printed, so this stays a pure
   * assembler: {@link writeHarnessConfig} collects into {@link HarnessConfigResult.warnings} and
   * `init` forwards those to the reporter.
   */
  readonly warn?: (message: string) => void;
  /**
   * Sink for a warning that is owed **only if the config assembled here is the one the repository
   * ends up with** — every line whose sentence asserts what the configuration now holds.
   * {@link buildConfig}'s header carries the one rule that decides this sink against {@link warn}.
   *
   * Separate from {@link warn} because this assembler cannot know: {@link writeHarnessConfig}
   * discards the whole generated config where a file already exists and `--reset-config` was not
   * given, and a `--quiet`-surviving warning about what every interactive-test dispatch does is
   * false of a repository carrying a different driver. That caller publishes these into
   * {@link HarnessConfigResult.warnings} on the write path and, on the kept path, drops them and
   * reports the kept file's own warning-severity problems in their place; a caller that omits the
   * sink builds a config and is told nothing it cannot act on.
   */
  readonly warnIfWritten?: (message: string) => void;
  /**
   * {@link warnIfWritten}'s twin for the informational stream: a note that is owed **only if the
   * config assembled here is the one the repository ends up with**, routed by the same rule in
   * {@link buildConfig}'s header. Collected into {@link HarnessConfigResult.notes}, which `init`
   * prints in its notes block rather than as a warning. A generated value that is right for most
   * adopters but which some will want to change belongs on this stream: a warning that fires on
   * every correct run is how a warning list stops being read.
   *
   * The **only** note sink, because every note this assembler raises asserts what the configuration
   * now holds. The stream's immediate arm — a note about what this invocation carried, the shape
   * {@link warn} already holds two of — is added beside `warn` and wired in
   * {@link writeHarnessConfig} by the line that first needs one, rather than kept declared here
   * where a caller could pass it and never be called.
   *
   * Deferred for {@link warnIfWritten}'s reason, and the symptom is the same sentence read back
   * over a file it is not about: this assembler cannot know whether its config lands, so a note
   * asserting what a key *was written as* is false of a re-run that kept a file naming something
   * else — `defaultBranch and protectedBranches were taken from the checked-out branch
   * "feat_add_search"`, printed by a run whose repository is wired to `trunk`.
   * {@link writeHarnessConfig} publishes these into {@link HarnessConfigResult.notes} on the write
   * path and, on the kept path, drops them and states the values the kept file actually holds in
   * their place; a caller that omits the sink builds a config and is told nothing that would be
   * true only of a write.
   */
  readonly noteIfWritten?: (message: string) => void;
  /**
   * Ask which driver the interactive test phase should run, answering `undefined` on every run that
   * could not be asked — no terminal, `--non-interactive`, `--quiet` — which is what tells
   * {@link resolveQaDriver} to take the documented default *and say that is what happened*.
   *
   * A callback for the same reason {@link warn} and {@link noteIfWritten} are sinks: this generator
   * prints nothing and knows nothing about terminals, so the reporter stays on `init`'s side of the
   * line. It is called at most once, only while `phases.qa` is on and only when no `--qa-driver`
   * was given, so passing it costs a caller no prompt it did not need.
   */
  readonly askDriver?: () => string | undefined;
  /**
   * Ask whether to turn docs retrieval on, answering `undefined` on every run that could not be
   * asked, on {@link askDriver}'s terms. Called at most once, only while `phases.docs` is on and only
   * when `--docs-retrieval` was not given.
   */
  readonly askRetrieval?: () => boolean | undefined;
}

/**
 * Which rung supplied the `appDir` stack detection probed — `--app-dir`, the config file's own
 * value, or the `.` fallback. Declared here because {@link HarnessConfigOptions.appDirSource} is the
 * only thing outside `commands/init.ts` that reads it; `DetectionAppDir.source` there carries what
 * each value means and why the field is required rather than inferred.
 */
export type AppDirSource = 'flag' | 'config' | 'default';

/** Everything {@link writeHarnessConfig} needs, beyond what {@link buildConfig} takes. */
export interface HarnessConfigOptions
  extends Omit<BuildConfigOptions, 'warn' | 'warnIfWritten' | 'noteIfWritten'> {
  /** The command's write plan; this generator enqueues into it and never touches `fs` itself. */
  readonly plan: WritePlan;
  /**
   * Which rung the `appDir` in {@link BuildConfigOptions.detection} came from, and the one input to
   * the `appDir` clause of the `--reset-config` note.
   *
   * Passed rather than assumed because the note's claim is only true on one of the three: a rebuild
   * over a config that could not be read gets no configured value at all, so a note asserting the
   * application directory was re-read from the file being rebuilt would tell an adopter their layer
   * scopes survived on the one run that collapsed them to the repository root. Absent — for a caller
   * that resolved no rung — the clause is written from `'default'`, the answer that claims least.
   */
  readonly appDirSource?: AppDirSource;
  /**
   * `init --reset-config`: the **only** input to the decision this generator takes, which is which
   * config is *in effect* rather than merely what lands on disk. Without it an existing file is read
   * and its values are the ones every later generator writes against; with it the file is copied to
   * a `.bak` and the freshly built config takes effect.
   *
   * The run's `--force` is deliberately **not** an input and is not passed here at all: it upgrades
   * the other `create-if-absent` artifacts and stops at this one, which is why *edit the config,
   * re-run `init --force`* regenerates the hook, the profile and the stubs from the edit instead of
   * discarding it first. Both arms therefore fix their own overwrite answer through `saveConfig`'s
   * `forceOverride` rather than leaving it to the run's flag (`config/io.ts`).
   *
   * It **re-derives** — from stack detection and this command line — rather than restoring some
   * earlier file, and the note this generator pushes says so in those words. The two are different
   * promises and only one of them is keepable; the flag's own JSDoc in `commands/init.ts` carries
   * the reasoning.
   */
  readonly resetConfig?: boolean;
  /**
   * The run's `--dry-run`, and the one thing it is allowed to change here: the **tense** of the
   * start-over note. It is deliberately not an input to any decision this generator takes —
   * {@link HarnessConfigResult.kept} is computed the same way in both modes, which is what makes a
   * dry run a faithful preview — but a note in the past tense on a run that wrote nothing claims a
   * rebuild and a `.bak` that do not exist (`commands/init.ts`'s `alreadyARepositoryNotes` carries
   * the same split for the same reason).
   */
  readonly dryRun?: boolean;
}

/** What the generator produced, for `init` and for the generators that read the config after it. */
export interface HarnessConfigResult {
  /**
   * **The config actually in effect** — the freshly built one when it was (or would be) written,
   * and the one already on disk when that was kept. Every later generator reads this, so a re-run
   * against an edited config writes against the adopter's values rather than the ones `init` would
   * have chosen.
   */
  readonly config: HarnessConfig;
  /** Absolute path of the config file. */
  readonly path: string;
  /**
   * True when an existing file was left exactly as it stood, so {@link config} came off disk —
   * which is every run against a wired repository except `--reset-config`. `--force` is not an
   * exception to it: the flag never reaches this decision.
   */
  readonly kept: boolean;
  /** Things needing attention, one line each, for the reporter's `warn`. */
  readonly warnings: readonly string[];
  /** Informational lines, one each, for the reporter's `info`. */
  readonly notes: readonly string[];
}

/**
 * The wrapper file one command key is invoked through, read from the wrapper table rather than
 * spelled out, so no `.sh` name is written down twice in the CLI.
 */
function wrapperFileFor(key: WrapperKey): WrapperFile {
  const script = WRAPPER_SCRIPTS.find((entry) => entry.key === key);
  if (script === undefined) {
    throw new HarnessError(
      `no wrapper script is declared for the ${key} command, so the value written into commands.${key} could not be derived from the wrapper table: the config generator and the wrapper generator disagree about the wrapper set, which is a fault in this CLI rather than in the repository it was run against`,
      EXIT.INTERNAL,
    );
  }
  return script.file;
}

/**
 * The `commands` object: the wrapper invocation for the three wrapped keys, the raw detected line
 * for the two that are not, and an optional key detection did not resolve left absent.
 *
 * **A key still holding the placeholder is written as the placeholder**, not as an invocation: the
 * config check's warning and `doctor` both look for that marker, and the wrapper generator writes
 * no script for it — so pointing `commands.typecheck` at a wrapper that was never written would
 * turn a visible "you still have to set this" into a command that fails on a missing file.
 */
function buildCommands(scriptsDir: string, raw: RawCommands): HarnessCommands {
  const commands: Partial<HarnessCommands> = {};

  for (const entry of COMMAND_PLAN) {
    const line = raw[entry.key];
    if (line === undefined) continue;
    commands[entry.key] =
      entry.wrapped && !isPlaceholder(line) ? wrapperInvocation(scriptsDir, wrapperFileFor(entry.key)) : line;
  }

  // `RawCommands` types both verifiers as required and the preset builder fills either one it
  // could not detect with a placeholder, so the loop cannot leave them unset. Checked rather than
  // asserted, because the cast below is exactly what would hide it if that ever changed.
  if (commands.typecheck === undefined || commands.test === undefined) {
    throw new HarnessError(
      'the detected command set is missing typecheck or test, which the config schema requires: the two verification commands are what "this change is done" means',
      EXIT.INTERNAL,
    );
  }
  return commands as HarnessCommands;
}

/**
 * The `detection` object: stack detection's own result, copied into the config it produced, so an
 * adopted repository states which layout was detected and on what evidence — which is what stops a
 * `flat` fallback profile from being indistinguishable from a deliberately chosen one.
 *
 * Keys are set in the schema's order, as everywhere else in this generator. **`evidence` is set
 * only when there is one** — absent rather than present-and-`undefined`, the discipline
 * {@link buildPreset}'s `rawCommands` uses — so a `--preset` run lands `signal: "forced"`
 * (`FORCED_SIGNAL_ID`, `detect/signals.ts`) with **no** `evidence` key at all, because no signal row
 * was evaluated and there is nothing it matched on. That absence is what a reader of the adoption
 * commit tells a forced preset from a detected one by.
 *
 * **`commandFamily` follows the same discipline** and for the same reason as recording it at all:
 * the family that derived `commands.*` is selected independently of the preset, so it cannot be read
 * back off `preset`, and a run with no family to name writes no key rather than a null.
 *
 * **What "no family to name" means is the caller's gate, not this function's.** A family answers off
 * a *command set* (`buildPreset`'s loop, `detect/presets.ts`), which is not the two required keys: the
 * Xcode arm can return an empty object, `composer`/`bundler` a `depInstall` alone, `npm` a `build`
 * alone. Recording such a winner would put a family id beside a placeholder `commands.typecheck` and
 * `commands.test` — the state every description of this key tells its reader cannot occur. So
 * {@link buildConfig} passes the id only where {@link PresetProfile.resolvedRequired} is non-empty,
 * on the same single-derivation rule the reporting lines in `detect/presets.ts` read it by, and the
 * written key means **this family derived at least one of the two required commands**.
 *
 * **No `review` key is written here.** It is the `/harness-analyze` command's to record through
 * `config set detection.review`, and an empty object would read as a review that happened.
 *
 * **Written on the run that generates the file, and never refreshed by a plain re-run.**
 * `harness.config.json` is one of the artifacts `--force` does not upgrade (`docs/cli.md` §3), so a
 * re-run keeps whatever record the file already holds and `--reset-config` is what rebuilds it —
 * the same sentence {@link writeHarnessConfig}'s deferred start-over note already makes about every
 * other re-derived value. The finding this implements said `init --force` refreshes it; that was
 * corrected against `docs/cli.md` §3, and no refresh path is added here.
 */
function buildDetection(detection: DetectionResult, commandFamily: string | undefined): HarnessDetection {
  const record: HarnessDetection = { preset: detection.preset, signal: detection.matchedSignal };
  if (detection.evidence !== undefined) record.evidence = detection.evidence;
  if (commandFamily !== undefined) record.commandFamily = commandFamily;
  return record;
}

/**
 * The two incantations that actually change a `defaultBranch` this guard has just questioned, and
 * the closing clause of both its arms.
 *
 * **A bare `--default-branch` is deliberately not among them.** This guard's messages reach an
 * adopter only through {@link BuildConfigOptions.warnIfWritten}, which publishes them exactly on the
 * runs where this config *landed* — so by the time one is read the repository has a
 * {@link CONFIG_FILENAME}, and the next `init` keeps that file and discards the flag while printing
 * a note that reads as if it had been applied. Naming the flag alone is what sent an adopter to the
 * one route that could not work.
 *
 * `config set` is named first because it changes the single key and re-derives nothing else.
 * `--reset-config`'s cost is quoted from that flag's own `INIT_OPTIONS` summary (`commands/init.ts`)
 * rather than paraphrased, so the flag is not described two ways in one tool.
 */
const GUESSED_BRANCH_REMEDY = `run \`git branch -a\` to see what this repository has, then name its integration line with \`${CLI} config set defaultBranch <branch>\`, which changes that one key — or \`${CLI} init --reset-config --default-branch <branch>\`, which rebuilds ${CONFIG_FILENAME} from detection and the flags, after a .bak`;

/**
 * The warning the three *guessing* rungs carry, and neither of the two that state rather than guess.
 *
 * Two ordered arms, and the order is the point:
 *
 * 1. **The name resolves to nothing here.** That is wrong whatever the name is, because both readers
 *    of the value are then reading a ref that is not there. The consequence clause is worded from
 *    `doctor`'s `DEFAULT_BRANCH_CHECK` failure sentence (`doctor/checks.ts`), which asks this same
 *    question of this same value later, so `init` and `doctor` do not spell one fact two ways.
 * 2. **The name resolves, but is not one an integration line conventionally has**
 *    ({@link DEFAULT_LOOKING_BRANCHES}) — the weaker signal, and the arm that was the whole guard
 *    before: `init` run from a feature branch, with an `origin/HEAD` that names nothing to outrank
 *    it.
 *
 * **{@link hasCommits} gates arm 1, and that gate is the arm's own precondition rather than a
 * nicety.** In a repository with no commit *nothing* resolves, so an ungated arm 1 would fire on
 * every `--git-init` adoption and on every repository wired between `git init` and its first commit
 * — which is exactly the noise this warning exists not to be. The same split is why `doctor` grades
 * that state a `warn` rather than a `fail`.
 *
 * The value is kept rather than replaced — replacing it is what the removed heuristic did, and it
 * turned "your integration line is called `develop`" into a config nobody was told was wrong. So the
 * detected name is written, and the remedies that correct it are named in the same line
 * ({@link GUESSED_BRANCH_REMEDY}).
 *
 * **Deferred**, by {@link buildConfig}'s rule: both sentences assert what `defaultBranch` and
 * `protectedBranches` *were written as*, which is false of a re-run that kept a file naming something
 * else.
 */
function warnAboutGuessedBranch(
  repoRoot: string,
  branch: string,
  source: string,
  defer: (message: string) => void,
): void {
  if (hasCommits(repoRoot) && branchResolves(repoRoot, branch) === 'none') {
    defer(
      `defaultBranch and protectedBranches were taken from ${source} as ${JSON.stringify(branch)}, and this repository has neither a local branch nor an origin/ remote-tracking ref by that name: a branch review takes its diff base from this value and the protected-branch guards decide what an unattended run may push by matching against it, so neither works — the diff is against a ref git cannot find, and the guard matches no branch and therefore stops nothing. To fix it, ${GUESSED_BRANCH_REMEDY}`,
    );
    return;
  }
  if (DEFAULT_LOOKING_BRANCHES.includes(branch)) return;
  defer(
    `defaultBranch and protectedBranches were taken from ${source} as ${JSON.stringify(branch)}, with no origin/HEAD to confirm it, and that is not one of the names an integration line conventionally has (${DEFAULT_LOOKING_BRANCHES.join(', ')}): if init ran from a feature branch it has just wired that branch in as the line work merges back into, so ${GUESSED_BRANCH_REMEDY}`,
  );
}

/**
 * The clause rungs 3 and 4 open with: what the rungs above them failed to answer, worded from the
 * fact this checkout actually presented.
 *
 * A detached `HEAD` and a repository with no branch at all both demote the detection a rung, but
 * only one of them is a repository with nothing to offer. Saying *no checked-out branch answered*
 * over a detached `HEAD` reads as the second while describing the first — and on a colocated `jj`
 * repository, where a detached `HEAD` is the steady state after every `jj new`, that is the wording
 * every adoption run would land. So the detached case names the fact it met, inside a note that
 * already closes by naming `--default-branch`; every other answer keeps today's sentence exactly.
 */
function unansweredAbove(head: HeadProbe, alsoInitDefaultBranch: boolean): string {
  if (head.kind === 'detached') {
    const detached =
      'no origin/HEAD is known here and HEAD is detached, so the checked-out branch could not answer — a detached HEAD is the ordinary working state of a colocated jj repository, and it is what demoted this detection a rung';
    return alsoInitDefaultBranch ? `${detached}, and no init.defaultBranch answered either` : detached;
  }
  return alsoInitDefaultBranch
    ? 'no origin/HEAD, no checked-out branch and no init.defaultBranch answered'
    : 'no origin/HEAD and no checked-out branch answered';
}

/**
 * `defaultBranch`, by **detection rather than assumption**, in one settled order:
 *
 * 0. `--default-branch`, which wins outright and is reported as the source it is;
 * 1. `origin/HEAD` — the repository's own statement of its integration line, and the one rung never
 *    second-guessed;
 * 2. the branch `HEAD` names — **including one no commit has landed on yet**, which is the state of
 *    every repository `init` wires that has no commit, whether `--git-init` created it or the
 *    adopter did and never committed into it, and the branch `init`'s own first commit is about to
 *    create ({@link checkedOutBranch} answers it there). That probe has **three** answers, not two,
 *    and the rung falls through on either of the other two — a detached `HEAD` and a repository with
 *    no branch to name — carrying which of them it met into the notes rungs 3 and 4 write
 *    ({@link unansweredAbove});
 * 3. git's configured `init.defaultBranch`;
 * 4. the schema default.
 *
 * The order is the whole of it. `master` repositories are common, and a `main` assumed over one is
 * silent in every direction it is wrong: it is a valid config, so nothing refuses it, while every
 * branch diff, every review's diff base and the protected-branch guard are all taken from it. That
 * is why each rung reports **which one answered** through {@link BuildConfigOptions.noteIfWritten}
 * rather than only reporting the value, and why every rung that is a *guess* — 2, 3 and 4 —
 * additionally runs {@link warnAboutGuessedBranch} over what it produced. **Rung 4 included**:
 * writing the schema default into a repository that has no branch by that name is the guess that is
 * wrong most often, and it is the one rung that used to say nothing at all.
 *
 * Rungs 0 and 1 stay silent, each for its own reason: `--default-branch` is the adopter's own
 * statement of the value, which `doctor`'s `default-branch` check grades standing rather than at
 * write time; and `origin/HEAD` is the repository's own answer, the rung this header already calls
 * never second-guessed.
 *
 * `doctor`'s `default-branch` check is the other half: it re-reads the configured name and reports
 * whether the repository can still resolve it.
 *
 * **Every one of the five rung notes is deferred** ({@link BuildConfigOptions.noteIfWritten}), by
 * {@link buildConfig}'s rule: each says what `defaultBranch` and `protectedBranches` were set from,
 * which is false of a re-run that kept a file naming something else. The `note` parameter is that
 * deferred sink.
 */
function resolveDefaultBranch(
  repoRoot: string,
  flag: string | undefined,
  defer: (message: string) => void,
  note: (message: string) => void,
): string {
  if (flag !== undefined) {
    note(
      `defaultBranch and protectedBranches were set from --default-branch as ${JSON.stringify(flag)}, so nothing about the repository was consulted`,
    );
    return flag;
  }

  const fromRemoteHead = remoteHeadBranch(repoRoot);
  if (fromRemoteHead !== undefined) {
    note(
      `defaultBranch and protectedBranches were detected from origin/HEAD as ${JSON.stringify(fromRemoteHead)}, which is the repository's own statement of the line work merges back into; --default-branch overrides it`,
    );
    return fromRemoteHead;
  }

  const head = checkedOutBranch(repoRoot);
  if (head.kind === 'branch') {
    note(
      `no origin/HEAD is known here, so defaultBranch and protectedBranches were taken from the checked-out branch ${JSON.stringify(head.name)}; --default-branch overrides it`,
    );
    warnAboutGuessedBranch(repoRoot, head.name, 'the checked-out branch', defer);
    return head.name;
  }

  const configured = configuredInitDefaultBranch(repoRoot);
  if (configured !== undefined) {
    note(
      `${unansweredAbove(head, false)}, so defaultBranch and protectedBranches were taken from git's init.defaultBranch as ${JSON.stringify(configured)}; --default-branch overrides it`,
    );
    warnAboutGuessedBranch(repoRoot, configured, "git's init.defaultBranch setting", defer);
    return configured;
  }

  const fallback = DEFAULTS.defaultBranch;
  note(
    `${unansweredAbove(head, true)}, so defaultBranch and protectedBranches were written as the schema default ${JSON.stringify(fallback)}; --default-branch overrides it`,
  );
  warnAboutGuessedBranch(repoRoot, fallback, 'the schema default', defer);
  return fallback;
}

/**
 * The rung-independent half of {@link resolveQaDriver}: return the value that rung settled on, and
 * record once — on **any** rung — the statement owed when it is a driver this release declares but
 * does not implement ({@link QA_DRIVER_IMPLEMENTED}, the one owner of that state). Every rung returns
 * through here, so the statement cannot be attached to some rungs and not others.
 *
 * **Recorded, not emitted.** Whether the statement is *true* is not known here: `resolveQaDriver`
 * runs on the generation path alone, and {@link writeHarnessConfig} discards the whole generated
 * config where a file already exists and `--reset-config` was not given. "Every interactive-test
 * dispatch returns a blocker" is false of a repository whose own file carries a different driver, so
 * only that caller — the one place that knows whether this config lands — decides to publish it. The
 * standing reporter for what is *in* a config is `doctor`'s `browser-wiring` check, which names the
 * driver and its status on every run; this line is about the choice being made here.
 *
 * **Published as a `warn`, not a `note`, deliberately.** The cost lands hours later at the first
 * interactive-test dispatch, and `warn` is the one stream that survives `--quiet` (`core/report.ts`)
 * — which is the unattended run that most needs to have been told. Nothing about the exit status
 * changes: `init` does not fail on a warning, and a legal, schema-valid, deliberately-supported
 * configuration stays writable — the two mobile values exist so a mobile project can record what it
 * is.
 */
function settleQaDriver(driver: HarnessQaDriver, defer: (message: string) => void): HarnessQaDriver {
  if (QA_DRIVER_IMPLEMENTED[driver]) return driver;
  defer(
    `this run resolved qa.driver to ${JSON.stringify(driver)}, and that variant of the interactive test agent ships declared but not implemented in this release: every interactive-test dispatch returns a blocker instead of running a test. The configuration is otherwise correct and nothing else is withheld by it — if this application is in fact reachable by a browser, \`config set qa.driver ${DEFAULTS.qa.driver}\` in ${CONFIG_FILENAME} is the whole change`,
  );
  return driver;
}

/**
 * `qa.driver`, in one settled order: `--qa-driver`, then the answer to the question `init` puts on a
 * terminal, then the schema default.
 *
 * **Why it is asked at all.** The default drives a browser, and it is the one generated value that
 * can be wrong in a way nothing downstream catches: every other key of a mobile project's config is
 * correct, the file validates, `doctor` passes — and the interactive test phase runs an agent that
 * cannot reach the application. Writing it silently made that a choice nobody was asked to make.
 *
 * The rungs are reported apart rather than together, because the useful thing to say differs by
 * rung: a run that was asked is told what it chose, and only a run that could not be asked is
 * pointed at `config set qa.driver`. Telling an adopter to go and set a key they had just answered
 * is what the note this replaces did.
 *
 * An answer that is not one of the drivers falls back to the default **with a deferred warning**
 * rather than being written — deferred by {@link buildConfig}'s rule, since the sentence asserts what
 * `qa.driver` was written as: the prompt must not be able to produce a config the schema rejects, since
 * {@link writeHarnessConfig}'s guard would then exit {@link EXIT.INTERNAL} and blame this CLI for
 * the adopter's typo. Its list of the legal values comes from {@link qaDriverChoices}, the same
 * renderer `init`'s question and its `--qa-driver` refusal print, so a value's release status is
 * stated identically wherever one is offered or rejected.
 *
 * The per-rung note says *what answered*; {@link settleQaDriver} records a second line saying *what
 * that value costs*, on whichever rung answered, for the caller to publish only where this config is
 * the one that lands. They are kept apart for the same reason the rungs are.
 *
 * **All three rung notes are deferred too** ({@link BuildConfigOptions.noteIfWritten}), by the same
 * rule: each says what `qa.driver` was written as, which a kept re-run's own file may contradict.
 * The `note` parameter is that deferred sink.
 */
function resolveQaDriver(
  flag: HarnessQaDriver | undefined,
  ask: (() => string | undefined) | undefined,
  note: (message: string) => void,
  defer: (message: string) => void,
): HarnessQaDriver {
  const fallback = DEFAULTS.qa.driver;

  if (flag !== undefined) {
    note(
      `the interactive test phase is on, so qa.driver was set from --qa-driver as ${JSON.stringify(flag)} and nothing was asked`,
    );
    return settleQaDriver(flag, defer);
  }

  const answer = ask?.();
  if (answer !== undefined) {
    const chosen = asQaDriver(answer);
    if (chosen !== undefined) {
      note(
        `the interactive test phase is on, so qa.driver was written as ${JSON.stringify(chosen)} — the answer given when init asked which driver reaches this application; --qa-driver answers it without being asked`,
      );
      return settleQaDriver(chosen, defer);
    }
    defer(
      `${JSON.stringify(answer)} is not one of the drivers the interactive test phase can run (${qaDriverChoices()}), so qa.driver was written as the default ${JSON.stringify(fallback)} instead: re-run with --qa-driver, or set the key in ${CONFIG_FILENAME} with \`config set qa.driver <value>\``,
    );
    return settleQaDriver(fallback, defer);
  }

  note(
    `the interactive test phase is on and this run could not be asked which driver it should run — no terminal, or --non-interactive — so qa.driver was written as the documented default ${JSON.stringify(fallback)}, which reaches the application by driving a browser: pass --qa-driver to choose one without being asked, and a project whose application is not a browser application sets qa.driver in ${CONFIG_FILENAME} with \`config set qa.driver <value>\`, which names the values it accepts, before the phase runs`,
  );
  return settleQaDriver(fallback, defer);
}

/**
 * Assemble the config from detection plus the flags.
 *
 * Keys are set in the schema's own order, because the write engine serializes the object as it
 * stands and JSON keeps insertion order: assembling in schema order is what makes the generated
 * file read like `examples/harness.config.json` and what makes an unchanged re-write byte-identical.
 * Nothing here touches the filesystem beyond the read-only git probes behind
 * {@link resolveDefaultBranch}.
 *
 * ## Which sink a line goes to — one rule, so a later line is not routed by feel
 *
 * **A line whose sentence asserts what the configuration now holds goes to the deferred sink of its
 * stream — {@link BuildConfigOptions.warnIfWritten} for a warning,
 * {@link BuildConfigOptions.noteIfWritten} for a note; a line about the flags this invocation
 * carried stays on the immediate sink, {@link BuildConfigOptions.warn}.**
 * {@link writeHarnessConfig} discards this whole config on a kept re-run, so the first kind is false
 * there and the second is true either way. The note stream has no immediate sink because no line
 * here needs one: a note about what this invocation carried adds a `note` option beside `warn`,
 * binds it here and wires it in {@link writeHarnessConfig}, rather than being routed by feel into a
 * deferred sink whose sentences it does not fit. By that rule {@link warnAboutGuessedBranch} (what
 * `defaultBranch` and `protectedBranches` were written as), {@link resolveQaDriver}'s unknown-answer
 * arm (what `qa.driver` was written as) and {@link settleQaDriver} (what the written driver costs)
 * are deferred warnings, and {@link resolveDefaultBranch}'s five rung notes together with
 * {@link resolveQaDriver}'s three and the docs-retrieval could-not-ask note are deferred notes —
 * every note this assembler has. The
 * `--qa-driver` without `--qa` and `--parity` without `--reference-impl` arms below are not
 * deferred: each is about a flag the adopter typed on this command line.
 */
export function buildConfig({
  repoRoot,
  detection,
  preset,
  flags,
  warn,
  noteIfWritten,
  warnIfWritten,
  askDriver,
  askRetrieval,
}: BuildConfigOptions): HarnessConfig {
  const report = warn ?? ((): void => {});
  const informIfWritten = noteIfWritten ?? ((): void => {});
  const defer = warnIfWritten ?? ((): void => {});
  const profile = preset ?? buildPreset(detection);
  const scriptsDir = DEFAULTS.scriptsDir;
  const defaultBranch = resolveDefaultBranch(repoRoot, flags.defaultBranch, defer, informIfWritten);
  const phases = { qa: flags.qa ?? false, docs: flags.docs ?? false, parity: flags.parity ?? false };

  const config: HarnessConfig = {
    // `$schema` is deliberately absent — see choice 1 in the module header.
    version: CONFIG_VERSION,
    projectName: flags.projectName ?? defaultProjectName(repoRoot),
    defaultBranch,
    // The branch work merges back into is the one an automated run must never push to directly.
    protectedBranches: [defaultBranch],
    stateDir: flags.stateDir ?? DEFAULTS.stateDir,
    appDir: detection.context.appDir,
    scriptsDir,
    githooksDir: DEFAULTS.githooksDir,
    agentModel: DEFAULTS.agentModel,
    pushEnvPath: PUSH_ENV_PATH,
    // `clientEnvPrefix` is deliberately absent — see choice 2 in the module header.
    // Sits directly above the `layers` profile it explains, which is the schema's own order.
    // The family id is recorded only where that family derived one of the two required commands —
    // see {@link buildDetection}'s `commandFamily` paragraph for why answering is not enough.
    detection: buildDetection(detection, profile.resolvedRequired.length === 0 ? undefined : profile.commandFamily),
    // Copied entry by entry so the written config owns its layer objects and a later edit to it
    // cannot reach back into the preset the detection result still holds.
    layers: profile.layers.map((layer) => ({ ...layer })),
    commands: buildCommands(scriptsDir, profile.rawCommands),
    phases,
  };

  if (phases.qa) {
    // `driver` first, in the schema's own key order, and resolved rather than defaulted: which
    // variant of the interactive test agent the phase runs has to be visible in the config an
    // adopter commits, and {@link resolveQaDriver} is what keeps it from being a choice nobody was
    // asked to make. Every rung reports itself, so the run says which one answered.
    const driver = resolveQaDriver(flags.qaDriver, askDriver, informIfWritten, defer);
    config.qa = { driver, portSeed: DEFAULTS.qa.portSeed, credentialsPath: QA_CREDENTIALS_PATH };
  } else if (flags.qaDriver !== undefined) {
    // Warned rather than refused, and deliberately not written: no `qa` section exists while the
    // phase is off (choice 2 in the module header), so the value would have nowhere to go and
    // nothing to read it. The flag is only ever given on purpose, so silence would be worse — it
    // reads as a run that turned the phase on.
    report(
      '--qa-driver was given without --qa, so it was not written anywhere: qa.driver is read only while the interactive test phase is on, and no qa section is written while it is off — re-run with --qa to turn the phase on and set the driver in the same run',
    );
  }
  if (phases.docs) {
    const asked = flags.docsRetrieval === true ? true : askRetrieval?.();
    if (asked === undefined) {
      informIfWritten(
        `docs retrieval stays off: this run could not ask. Pass --docs-retrieval to turn it on, or later run \`${CLI} config set docs.retrieval true\` and then \`init --force\``,
      );
    }
    // The key is written only when on: an absent key is the schema default, so a declined or unasked
    // run writes the `docs` section it wrote before retrieval existed.
    config.docs = { root: flags.docsRoot ?? DEFAULT_DOCS_ROOT, ...(asked === true ? { retrieval: true } : {}) };
  }
  if (phases.parity) {
    // Omitted rather than written empty when there is nothing to put in it: the phase toggle is
    // still on and the config check warns about the missing path, which is the actionable half.
    if (flags.referenceImpl === undefined) {
      report(
        '--parity was given without --reference-impl, so no parity section was written: set parity.referenceImplPath in harness.config.json before the phase runs, or it has nothing to compare a change against',
      );
    } else {
      config.parity = { referenceImplPath: flags.referenceImpl };
    }
  }

  return config;
}

/**
 * The kept-config note's `qa.driver` clause: the driver that file puts in force, or nothing at all.
 *
 * Conditioned on `phases.qa` rather than on the section's presence, because the key is read only
 * while the interactive test phase is on (choice 2 in the module header) — naming a driver for a
 * repository that runs no interactive test would report a value nothing consults. A phase that is on
 * over a file missing the key is left unnamed for the same reason: this note states what it read,
 * and what a config *holds* is `doctor`'s `browser-wiring` check to grade.
 */
function keptQaDriverClause(config: HarnessConfig): string {
  const driver = config.phases?.qa === true ? config.qa?.driver : undefined;
  return driver === undefined ? '' : `, and runs the interactive test phase with qa.driver ${JSON.stringify(driver)}`;
}

/**
 * Build the config and enqueue it as `create-if-absent`, returning the config **in effect**.
 *
 * The order matters and is the point of the function:
 *
 * 1. assemble, collecting anything the adopter should know — including the lines of **both** streams
 *    that are only true if this config is the one that lands, held apart until step 3 has decided
 *    ({@link BuildConfigOptions.warnIfWritten}, {@link BuildConfigOptions.noteIfWritten});
 * 2. check the assembled object **before** enqueuing anything — `init` must never produce a config
 *    it can already tell is invalid, and an invalid one here is a fault in this CLI, so it exits
 *    {@link EXIT.INTERNAL} rather than blaming the repository;
 * 3. decide which config the rest of `init` writes against. An existing file is **always** kept and
 *    is that config; only `--reset-config` rebuilds it, in which case the write engine copies it to
 *    `<path>.bak` and the fresh one takes effect. `--force` does not enter into it — it upgrades
 *    the other `create-if-absent` artifacts and stops at this one, which is exactly what makes
 *    *edit the config, re-run `init --force`* regenerate the hook, the profile and the stubs from
 *    the edit rather than from a file rebuilt over it. `--dry-run` does not enter into it either:
 *    the outcome is computed the same way in both modes, which is what makes a dry run a faithful
 *    preview — it reaches this generator only for the **tense** of the start-over note, which would
 *    otherwise claim a rebuild and a `.bak` that a preview never made ({@link
 *    HarnessConfigOptions.dryRun});
 * 4. enqueue. Always — including when the file is kept, so the run's action log records that it was
 *    seen and left alone rather than silently skipped.
 *
 * The write itself, the `.bak` and the `--dry-run` suppression all belong to the write engine; this
 * generator has no filesystem-mutating call.
 */
export function writeHarnessConfig({
  repoRoot,
  detection,
  preset,
  flags,
  plan,
  resetConfig = false,
  dryRun = false,
  appDirSource = 'default',
  askDriver,
  askRetrieval,
}: HarnessConfigOptions): HarnessConfigResult {
  const warnings: string[] = [];
  const notes: string[] = [];
  // Both held back until `kept` is known, and published or dropped there — one list per stream
  // ({@link BuildConfigOptions.warnIfWritten}, {@link BuildConfigOptions.noteIfWritten}).
  const ifWritten: string[] = [];
  const notesIfWritten: string[] = [];

  const generated = buildConfig({
    repoRoot,
    detection,
    ...(preset === undefined ? {} : { preset }),
    ...(askDriver === undefined ? {} : { askDriver }),
    ...(askRetrieval === undefined ? {} : { askRetrieval }),
    flags,
    warn: (message) => warnings.push(message),
    warnIfWritten: (message) => ifWritten.push(message),
    noteIfWritten: (message) => notesIfWritten.push(message),
  });

  // Errors only. A warning is expected on a generated config — an undetected command's placeholder
  // is one — and the preset builder has already reported the ones an adopter can act on, so
  // repeating them here would print each twice.
  const problems = checkConfigShape(generated);
  if (hasErrors(problems)) {
    const detail = problems
      .filter((problem) => problem.severity === 'error')
      .map(formatProblem)
      .join('; ');
    throw new HarnessError(
      `init assembled a ${CONFIG_FILENAME} that is already invalid, so nothing was written: ${detail}. This is a fault in this CLI rather than in the repository it was run against`,
      EXIT.INTERNAL,
    );
  }

  const kept = !resetConfig && configExists(repoRoot);
  let effective = generated;

  if (kept) {
    const loaded = loadConfig(repoRoot);
    if (loaded.config === undefined || hasErrors(loaded.problems)) {
      const detail = loaded.problems.map(formatProblem).join('; ');
      throw new HarnessError(
        `${CONFIG_FILENAME} is already present at ${loaded.path} but cannot be used, and init will not overwrite it: ${detail}. Fix it, or re-run with --reset-config to copy it to ${CONFIG_FILENAME}.bak and regenerate`,
      );
    }
    effective = loaded.config;
    notes.push(
      `${CONFIG_FILENAME} already exists and was left exactly as it is, so the rest of init used the values in it; re-run with --reset-config to regenerate it, which copies the current file to ${CONFIG_FILENAME}.bak first`,
    );
    // What replaces the discarded config's **notes**, and the reason those are dropped rather than
    // simply gated: exactly one of `resolveDefaultBranch`'s rungs fires on any run, so dropping it
    // silently would leave the notes block unable to answer *what branch is this repository wired
    // to* at all. This says it from `effective` — the file that is there — instead of from the
    // detection this run threw away, which is the sentence the finding measured as a false report.
    // It names the file rather than saying "that file", so it does not depend on standing next to
    // the note above it in a block whose order is the caller's.
    //
    // `protectedBranches` falls back to the one branch that is protected whatever the key lists
    // (`config/model.ts`), so an absent key is reported as what the guards actually match rather
    // than as the schema's own default, which need not be this file's `defaultBranch`.
    notes.push(
      `${CONFIG_FILENAME} wires this repository to defaultBranch ${JSON.stringify(effective.defaultBranch)} and protects ${JSON.stringify(effective.protectedBranches ?? [effective.defaultBranch])}${keptQaDriverClause(effective)}, whatever this run's flags and detection resolved: change one of them with \`${CLI} config set <key> <value>\`, which changes that one key — or \`${CLI} init --reset-config\`, which rebuilds ${CONFIG_FILENAME} from detection and the flags, after a .bak`,
    );
    // What replaces the discarded config's warnings rather than leaving the kept path silent: the
    // problems of the file that is actually there, from the same checker `doctor`'s `config` check
    // reports them with. Errors are already the refusal above, so this is the warning severity only
    // — a kept key still holding the placeholder is named as a placeholder *in that file*, which is
    // the sentence the dropped generated ones only looked like.
    warnings.push(...loaded.problems.filter((problem) => problem.severity === 'warning').map(formatProblem));
  }

  // Published only where the generated config is the one that lands. On a kept-config re-run the
  // value this run resolved is not the value the repository carries, so the sentence's own claim —
  // that every interactive-test dispatch returns a blocker — would be false of the repository in
  // front of the adopter, three lines below a note saying the file was left exactly as it is. What
  // is *in* a kept config is `doctor`'s `browser-wiring` check to report, on every run.
  if (!kept) warnings.push(...ifWritten);

  // The note stream's half of the same gate, published at the same point and for the same reason:
  // every one of these asserts what a key was written as, and a kept re-run wrote no key. The kept
  // path's replacement is pushed above, so the block says what is in force rather than nothing.
  if (!kept) notes.push(...notesIfWritten);

  // A **note**, not a warning: a start-over that was asked for is not something needing attention.
  // It is pushed only when there was a file to rebuild — on a first `init` the flag changes nothing
  // and there is nothing to say. What it has to say is what the rebuild did *not* do: it did not
  // restore the previous file, and it did not regenerate everything else in the repository.
  //
  // Two texts, because three of its claims — the rebuild, the `.bak` the previous file "is at", and
  // the artifacts written from the rebuilt config — are things `--dry-run` does not do, and a note
  // that states them anyway reports a success a real run would not have had (`docs/cli.md` §1).
  // Only the **tense** splits: the `if` above and the `kept` it mirrors stay mode-independent, which
  // is what step 3's JSDoc promises and what makes the preview faithful.
  if (resetConfig && configExists(repoRoot)) {
    // The `appDir` half is **reported, not asserted**: it is re-read from the file being rebuilt
    // only where that file answered ({@link HarnessConfigOptions.appDirSource}). On the other two
    // rungs the sentence names the directory the layer scopes were actually derived under, which is
    // the fact an adopter acts on; *why* rung 2 did not answer is the resolver's warning to give,
    // and it gives one whenever there was a file to answer from (`commands/init.ts`).
    const appDirClause =
      appDirSource === 'config'
        ? `appDir is re-read from the file being rebuilt, so every layer scope is re-derived under the same application directory`
        : `appDir is ${JSON.stringify(detection.context.appDir)} — ${appDirSource === 'flag' ? 'the directory --app-dir named on this command line' : 'the repository root, because the file being rebuilt supplied no appDir this run could use'} — so every layer scope is re-derived under that directory`;
    const consequence = `It is re-derived rather than restored: ${appDirClause}, but any value that lived only in the edited file — a phase toggle, an added protectedBranches entry, a corrected command line — becomes whatever detection and the flags say, so anything you meant to keep has to be given as a flag on this run or set again afterwards with \`config set\`.`;
    // The closing clause carries one exception, and it is stated here because this note is the
    // enumeration of what a rebuild costs. A guard still enforcing the pre-rebuild set is a state
    // the rebuild itself creates, so the run that creates it is the run that clears it
    // (`generators/githooks.ts`); which branch sets those were is that generator's own note to give,
    // and is not restated here.
    notes.push(
      dryRun
        ? `${CONFIG_FILENAME} would be rebuilt from stack detection and this command line because --reset-config was given, and the file that is there would be copied to ${CONFIG_FILENAME}.bak first. ${consequence} Everything generated after it would be written from the rebuilt config, while the create-if-absent artifacts already on disk would be kept unless --force was given too — with one exception, the pre-push guard: where its case label no longer matched the set the rebuilt config resolves it would be re-rendered from that config, after being copied to a .bak beside it, and where the label could not be read at all it would be left exactly as it is. This was a dry run, so nothing was written and nothing was backed up`
        : `${CONFIG_FILENAME} was rebuilt from stack detection and this command line because --reset-config was given, and the file that was there is at ${CONFIG_FILENAME}.bak. ${consequence} Everything generated after it in this run was written from the rebuilt config, while the create-if-absent artifacts already on disk were kept unless --force was given too — with one exception, the pre-push guard: where its case label no longer matched the set the rebuilt config resolves it was re-rendered from that config, after being copied to a .bak beside it, and where the label could not be read at all it was left exactly as it is`,
    );
  }

  // The request answers the overwrite question itself in **both** directions (`config/io.ts`), which
  // is what takes this one artifact out of the run's `--force` entirely: `'never'` keeps the file a
  // `--force` run would otherwise have replaced — and replaced *before* every artifact that reads it
  // was regenerated from the replacement — while `'always'` lets `--reset-config` rebuild it after a
  // `.bak` on a run with no `--force` at all. Neither arm consults the flag, so the contract is
  // structural rather than a condition a later edit could re-introduce.
  const path = saveConfig(repoRoot, generated, plan, { forceOverride: kept ? 'never' : 'always' });
  return { config: effective, path, kept, warnings, notes };
}

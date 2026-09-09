/**
 * Command: `init` — wire an adopting repository, once, deterministically.
 *
 * **The rule this module exists to enforce: `init` orders and reports; it decides nothing.** Every
 * value written here comes from stack detection or from a generator, and every byte reaches the
 * filesystem through one {@link WritePlan} applied once at the end. That is what makes the command
 * reproducible: a second `init` over the same repository produces the same result, and an adopter can
 * re-derive the recorded preset from the detection table by hand. It is also why judgement-dependent
 * work — reading real code to refine a layer profile, filling a conventions stub — belongs to
 * `/harness-analyze` and is deliberately absent from this file. The offer to run it
 * ({@link resolveAnalyzeOffer}) adds no model call and no external process here: the answer's whole
 * material effect is which banner wording the generated always-loaded file carries and which closing
 * pointer this run prints.
 *
 * ## Three non-obvious choices, and where each comes from
 *
 * 1. **The whole run is one plan, applied after every generator has spoken.** A generator enqueues
 *    and returns; no generator touches the filesystem. So `--dry-run` cannot leak a write no matter
 *    what a generator enqueued, and a refusal raised against the last request cannot leave the first
 *    ten on disk — the write engine checks the whole plan before committing any of it
 *    (`core/writer.ts`). **Three mutations sit outside that plan**, and each is confined by a
 *    condition of its own rather than by a shared one: `initRepository` before the plan is built
 *    runs only where there is no repository yet ({@link resolveTargetRepository}); `pointHooksPath`
 *    after it has been applied writes `core.hooksPath` only where that setting is unset
 *    (`generators/githooks.ts`); and `commitAll`, after it as well, runs only in a repository with
 *    no commit ({@link commitGeneratedFiles}) — so none of them can reach an established history or
 *    an adopter's own hooks directory. So `--dry-run`'s "cannot leak a write" guarantee no longer
 *    rests on the plan's structure alone — it rests on that structure **plus one explicit `dryRun`
 *    guard at each of those three calls**, which is three guards to check rather than a structural
 *    argument that covers everything. The commit's position is load-bearing for a second reason: the
 *    managed `.gitignore` block arrives with the plan, and it is what keeps the commit's `git add -A`
 *    from staging the run-control artifacts — so a commit made before `plan.apply` would commit
 *    exactly the files that must never be committed (`generators/repoRoot.ts`).
 * 2. **The config generator runs first and hands back the config *in effect*, and every later
 *    generator reads that object rather than the flags.** Whenever a config file is there it is
 *    kept and read, on every run and `--force` included, so the config in effect is the adopter's
 *    own — which is the only way `init` writes the state tree, the profile and the hook against the
 *    values the adopter edited rather than against the ones `init` would have chosen again. Only
 *    `--reset-config` rebuilds it, and it says so (`generators/harnessConfig.ts`).
 * 3. **The scripts are written immediately after the config and before the profile** — the wrappers
 *    and then the outer-loop set, both into the configured `scriptsDir`. The permission profile
 *    allow-lists their literal paths, so a run that wrote the profile without them would allow-list
 *    files that do not exist, leaving the configured verification commands matching neither `allow`
 *    nor `deny` — which in an unattended run is a stall rather than a refusal
 *    (`generators/scripts.ts`, `generators/outerLoopScripts.ts`, `generators/permissionProfile.ts`).
 *
 * ## The refusals, and why they come before the plan is built
 *
 * `init` is a writer aimed at a repository, so a mis-scoped run is destructive rather than merely
 * wrong. All three preconditions are **settled** before a single generator is called — two by a
 * check the flags alone answer, the third by an answer (the flag, a prompt on a terminal, or the
 * non-interactive default) — and that is the property the ordering exists for: a plan that is never
 * built cannot be half-applied.
 *
 * They are ordered by **what each one needs**, and the git gate is what makes that ordering
 * load-bearing rather than cosmetic: its accept path creates a repository, which is one of the three
 * mutations outside the plan. So every refusal answerable from the parsed flags is raised ahead of
 * it, and a refused run leaves the adopter's directory exactly as it found it. The same reasoning
 * puts {@link parseQaDriver} — and the refusal of a command line giving both spellings of the
 * analyze offer — inside the parser, one step earlier still.
 *
 * - **`--state-dir` names a dot-directory** — an unattended run may not be permitted to write
 *   beneath one, so the tree would be created and then silently lose every artifact produced under
 *   it (`docs/config.md` §3).
 *   Answerable from the flag, so it is raised before the git gate — as is `--preset`'s closed-set
 *   check (`detect/signals.ts`), the flag surface's other pure-argument refusal;
 * - **not inside a git repository, and the run was not told to create one** — the root every write
 *   is confined to cannot be resolved (`core/git.ts`), and the worktree-based flow this wires cannot
 *   prepare a checkout without one. Git stays a hard gate and nothing is ever created silently:
 *   `--git-init` creates the repository, a terminal without the flag is asked, and a run that cannot
 *   be asked refuses — which is the behaviour every earlier release had (`core/prompt.ts`,
 *   `docs/cli.md` §2);
 * - **the resolved root is the harness's own repository** — `init` at this repository's root would
 *   wire the harness itself, which is the trap that makes `docs/development.md` §5's gate 2 unsafe
 *   the moment this command works. Last of the three because it is the one check that needs the root
 *   the gate above resolved.
 *
 * ## What this command deliberately does not do
 *
 * - **It reads no template and formats no generated content.** Every artifact's shape, re-run policy
 *   and warning text belongs to the generator that owns it; duplicating any of it here would be a
 *   second source for a decision that already has one.
 * - **It writes no guard hooks into the adopter's settings**, and takes no browser wiring decision:
 *   the plugin's own hooks compose with the adopter's, and `.mcp.json` is the repo-root generator's
 *   to gate on `browserWiringApplies` (`config/model.ts`) — the one predicate that generator and the
 *   permission profile both read, so the condition is not restated here to go stale. This command
 *   *calls* that predicate, once, to decide whether the closing report owes the registry sentence
 *   ({@link reportNextSteps}); calling it is not restating it.
 */

import { existsSync, readFileSync, realpathSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';

import { formatProblem } from '../config/check.js';
import { configExists, loadConfig } from '../config/io.js';
import {
  answersNone,
  asQaDriver,
  browserWiringApplies,
  CONFIG_FILENAME,
  DEFAULTS,
  isPlaceholder,
  qaDriverChoices,
  STATE_DIR_DOT_PATTERN,
  type HarnessCommands,
  type HarnessConfig,
  type HarnessQaDriver,
} from '../config/model.js';
import { EXIT, HarnessError } from '../core/errors.js';
import { commitAll, hasCommits, initRepository, probeRepoRoot } from '../core/git.js';
import { readJsonFile } from '../core/json.js';
import { layerCoverage } from '../core/layerCoverage.js';
import { layerGapRemedy, recordedVerdictClause } from '../core/layerGapRemedy.js';
import { nameList } from '../core/nameList.js';
import { insideRepo, packageRoot } from '../core/paths.js';
import { askLine, askYesNo, canPrompt } from '../core/prompt.js';
import { normalizeRepoDir, normalizeRepoPathStrict } from '../core/repoPaths.js';
import { WritePlan } from '../core/writer.js';
import { findNestedApplicationDir } from '../detect/nestedApplication.js';
import {
  buildPreset,
  commandSourceClaim,
  searchedRoots,
  SHARED_CONVENTIONS_PATH,
  type PresetProfile,
} from '../detect/presets.js';
import {
  detectPreset,
  parsePresetName,
  FLAT_FALLBACK_SIGNAL_ID,
  FORCED_SIGNAL_ID,
  type DetectionResult,
} from '../detect/signals.js';
import {
  writeClaudeContext,
  CLAUDE_MD_PATH,
  RESERVED_ANALYZE_TARGETS,
  SETUP_PENDING_OPEN,
  isUntouchedSkeletonText,
  type AnalyzeOffer,
} from '../generators/claudeContext.js';
import { pointHooksPath, writeGitHooks } from '../generators/githooks.js';
import { writeHarnessConfig, type AppDirSource, type HarnessConfigFlags } from '../generators/harnessConfig.js';
import { writeNotifications, GUIDED_ENDPOINT_EXAMPLE } from '../generators/notifications.js';
import { writeOuterLoopScripts } from '../generators/outerLoopScripts.js';
import { writePermissionProfile } from '../generators/permissionProfile.js';
import {
  writeProjectSettings,
  MARKETPLACE_FLAG,
  MARKETPLACE_NAME,
  MARKETPLACES_KEY,
  PLUGIN_NAME,
  SETTINGS_PATH,
  SLUG_SHAPE,
  type ProjectSettingsFlags,
  type ProjectSettingsResult,
} from '../generators/projectSettings.js';
import { writeRepoRootFiles, MCP_PATH } from '../generators/repoRoot.js';
import {
  configKeyPath,
  configuredCommand,
  wrapperCommandLine,
  wrapperPath,
  writeWrapperScripts,
  WRAPPER_SCRIPTS,
  type WrapperBody,
  type WrapperKey,
  type WrapperScriptsResult,
  type WrittenWrapper,
} from '../generators/scripts.js';
import { writeStateDir } from '../generators/stateDir.js';
import type { CommandContext, Subcommand } from './registry.js';

/** The command's one-line summary, in the usage block and at the head of its own `--help`. */
const SUMMARY =
  'Wire a repository: config, scripts, state tree, permission profile, project settings, conventions stubs';

/** The roadmap item this command belongs to, as the registry reports it. */
const ROADMAP_ITEM = 13;

/** The analyze command's own name, without the leading `/` and without the plugin prefix. */
const ANALYZE_COMMAND_NAME = 'harness-analyze';

/** The analyze command as a line addressing the adopter names it — step C of the install story. */
const ANALYZE_COMMAND = `/${ANALYZE_COMMAND_NAME}`;

/**
 * The same command, spelled as something **executed** rather than read.
 *
 * A session's `/` picker lists every command of this plugin under the plugin's own prefix and
 * fuzzy-matches a bare name onto it, so {@link ANALYZE_COMMAND} reaches the command wherever a
 * person types it into a session. A command passed as a session's **first message** — which is
 * what {@link ANALYZE_INVOCATION} does — meets no picker and is matched exactly, so the bare
 * form fails there with `Unknown command`. That the **prefixed** form succeeds where the bare
 * one fails is not established: the only measurement in this tree is headless and negative on
 * both spellings (root `README.md`, `### Measured while building that evidence, and not fixed
 * here`), and the interactive first-message form waits on the hand-run gate — if that comes back
 * negative the printed line is dropped rather than respelled (`docs/analyze.md` §9). The prefix
 * is taken from {@link PLUGIN_NAME}, which mirrors the plugin manifest, rather than written out
 * here.
 */
const ANALYZE_COMMAND_QUALIFIED = `/${PLUGIN_NAME}:${ANALYZE_COMMAND_NAME}`;

/**
 * How this CLI is typed, for every line that tells an adopter to run something — stated here once
 * for the whole command surface.
 *
 * **The rule, one line: an occurrence an adopter is told to *run* carries the `npx` prefix; an
 * occurrence that is the tool's *name* does not.** The bare `autonomous-sdlc-harness …` form
 * resolves only where something installed a global binary, and no documented adoption path does:
 * root `README.md`'s quick start is `npx autonomous-sdlc-harness …` throughout and
 * `docs/development.md`'s contributor loop is `node cli/dist/cli.js …`. `npx` is the safe superset
 * — it runs an already-installed global binary as well as fetching a published one — so it is the
 * one adopter-facing spelling rather than a second special case. Under the name half of the rule
 * the prefix is wrong and is not added: the `autonomous-sdlc-harness: <message>` error prefix and
 * the `--version` banner in `cli.ts`, {@link MARKETPLACE_NAME}, `MACHINE_DIR_NAME`,
 * `LAUNCHD_LABEL_PREFIX`, and the managed `.gitignore` block header in `generators/repoRoot.ts`.
 * There is no third category.
 */
const CLI = 'npx autonomous-sdlc-harness';

/**
 * This verb, written in full wherever a line addresses the adopter.
 *
 * An adopter about to be offered {@link ANALYZE_COMMAND} meets two initializers — this one and the
 * host tool's own, which also writes an always-loaded project file — so a bare `init` in an
 * adopter-facing line names neither of them unambiguously (`docs/analyze.md` §9).
 */
const INIT_VERB = `${CLI} init`;

/** The command that verifies what this one wired, named in the closing pointer. */
const DOCTOR_COMMAND = `${CLI} doctor`;

/**
 * The command that arms the inbox, named in the closing pointer's last step while `phases.qa` is on.
 *
 * Spelled here rather than left to prose because it is one of the two operator steps that step names,
 * and the other one — the `permissions.allow` entries — deliberately has no constant: its lines carry
 * a machine-local path this command cannot see, and `doctor`'s `plugin-permissions` check prints them
 * (`docs/cli.md` §7).
 */
const DAEMON_INSTALL_COMMAND = `${CLI} daemon install`;

/**
 * The command that answers, before the phase ever runs, whether the pinned MCP server packages can be
 * fetched from this machine's registry — named in the registry sentence step 4 adds while
 * `browserWiringApplies` holds (`doctor/checks.ts`'s browser-wiring check, `commands/doctor.ts`).
 */
const DOCTOR_CHECK_REGISTRY_COMMAND = `${DOCTOR_COMMAND} --check-registry`;

/**
 * How `.mcp.json` launches those servers, as the sentence names it.
 *
 * The launcher, not the specs: the two package names and their pinned versions live in
 * `templates/repo/mcp.json` and are enumerated by the `doctor` check above, so a third copy here
 * would go stale on the next pin bump.
 */
const MCP_LAUNCHER = 'npx -y';

/**
 * The agent runner as it is typed at a shell, and the two lines of the closing report that name it.
 *
 * Both are strings a person retypes: this CLI executes neither, and {@link INIT_VERB} starts no
 * process and opens no window. {@link MARKETPLACE_ADD_COMMAND} is spelled as `docs/development.md`
 * §1 attests the host tool's own verb — the adopter form of `claude plugin marketplace add`, over
 * the slug shape the flag beside it takes — and no other host-tool verb is invented here.
 */
const AGENT_CLI = 'claude';
const MARKETPLACE_ADD_COMMAND = `${AGENT_CLI} plugin marketplace add ${SLUG_SHAPE}`;
const ANALYZE_INVOCATION = `${AGENT_CLI} "${ANALYZE_COMMAND_QUALIFIED}"`;

/** The verb that applies a layer-profile revision — the one writer of `layers[]` (`docs/analyze.md` §3). */
const CONFIG_SET_LAYERS_COMMAND = `${CLI} config set layers`;

/** The one-key form of the same verb, named in step 3 for the two run settings (`commands/config.ts`). */
const CONFIG_SET_COMMAND = `${CLI} config set <key> <value>`;

/**
 * The marketplace manifest at a repository root, and the CLI package inside it.
 *
 * Together with the package **name** below they are the whole of how `init` recognises the harness's
 * own repository. Two signals rather than one because either alone is ordinary: a repository may
 * publish its own marketplace, and a repository may have a `cli/` package — only a repository with
 * both, whose CLI package is *this* package, is the one `init` must not be aimed at.
 */
const MARKETPLACE_MANIFEST = join('.claude-plugin', 'marketplace.json');
const CLI_MANIFEST = join('cli', 'package.json');

/** The flag whose value the dot-directory refusal is raised against. */
const STATE_DIR_FLAG = '--state-dir';

/** The flag that answers the git gate — named in the prompt, in the refusal, and in the note. */
const GIT_INIT_FLAG = '--git-init';

/**
 * The flag that overrides the configured application directory — named in the rung-2 note and in the
 * warning a configured value that could not be used raises ({@link resolveDetectionAppDir}).
 */
const APP_DIR_FLAG = '--app-dir';

/** The flag that answers the QA-driver question — named in the prompt, the refusal and the note. */
const QA_DRIVER_FLAG = '--qa-driver';

/**
 * The two spellings that answer the analyze offer — one accept, one decline, and neither given is
 * the state {@link resolveAnalyzeOffer} answers with the documented default.
 *
 * The one `--no-*` pair in this flag surface, and the precedent it sets: **two flags, two keys, one
 * tri-state**. A single key cannot tell an absent flag from an explicit decline, and the flag table's
 * discriminated union admits no negated-switch kind — a row pairs a switch with a boolean key or it
 * is not a switch row at all.
 */
const ANALYZE_FLAG = '--analyze';
const NO_ANALYZE_FLAG = '--no-analyze';

/** The flag that answers the notification opt-in — named in the prompt and in the no-terminal note. */
const NOTIFICATIONS_FLAG = '--notifications';

/** The flag that supplies the endpoint the opt-in needs, and without which nothing is written. */
const PUSH_URL_FLAG = '--push-url';

/**
 * The subject of the first commit, which `init` makes in any repository it wires that has no commit
 * yet — the one this run created, and the one it found in that state.
 *
 * A fixed sentence with nothing of this machine in it: no absolute path, no branch name, no
 * operator's label. The commit lands in a repository that is about to be shared, and everything a
 * reader of its history needs is what happened, not where it was run.
 */
const FIRST_COMMIT_MESSAGE = 'chore: adopt the autonomous SDLC harness';

/**
 * The flags `init` takes, all optional.
 *
 * It **extends** the two generator flag interfaces rather than restating their keys, and
 * {@link initOptions} checks the table below carries a row for every key of the result — so a key
 * added to either one is a compile error until it has one. That is the failure this shape exists to
 * prevent: a flag the parser does not know is refused as unknown, and a flag no generator reads is
 * accepted and ignored.
 */
export interface InitFlags extends HarnessConfigFlags, ProjectSettingsFlags {
  /** `--git-init`. Answers the git gate: create the repository rather than refusing or asking. */
  readonly gitInit?: boolean;
  /**
   * `--reset-config`. The genuine start-over path: rebuild {@link CONFIG_FILENAME} from stack
   * detection and this command line, after the write engine has copied the file that is there to a
   * `.bak` sibling. Without it an existing config is read and is the one in effect.
   *
   * **A flag on `init` rather than a verb of its own**, because the rebuild needs stack detection,
   * the preset and the *whole* config-flag surface this interface already carries — `--preset`,
   * `--app-dir`, `--project-name`, `--default-branch`, `--state-dir`, the three phase toggles and
   * their inputs. A `config reset` verb would have to re-declare every one of them, which is the
   * second flag surface the `extends` above exists to prevent; `config` keeps what it owns, which
   * is per-*key* writes.
   *
   * **It re-derives; it does not restore.** Detection is deterministic and the command line is the
   * other input, so re-deriving needs no state persisted anywhere — while a `.bak` is not a promise
   * anyone can keep: there is none on a first `init`, and `config set` writes one too, so the
   * newest `.bak` may be one key old rather than the pre-`init` file. Re-deriving is also the only
   * variant that can *change* a value — turn a phase on — which is what a start-over is for. What
   * the run prints says exactly that and never says "restored" (`generators/harnessConfig.ts`).
   */
  readonly resetConfig?: boolean;
  /**
   * `--analyze`. Accepts the offer to run {@link ANALYZE_COMMAND} in this repository's first
   * session, whose documented default is yes.
   *
   * **Two keys rather than one**, with {@link InitFlags.noAnalyze}: {@link parseInitFlags} names
   * every switch key in its return object, which is what makes each of them `false` when absent — so
   * a single boolean could not tell "the flag was absent" from "`--no-analyze` was given", and the
   * yes-default would be unreachable. {@link resolveAnalyzeOffer} folds the pair back into one
   * answer; a command line giving both is refused in the parser.
   */
  readonly analyze?: boolean;
  /** `--no-analyze`. Declines that offer, and records the declined wording in the generated file. */
  readonly noAnalyze?: boolean;
  /** `--notifications`. Answers the push-notification opt-in, whose documented default is off. */
  readonly notifications?: boolean;
  /** `--push-url`. The endpoint the opt-in posts to; read only when the opt-in was taken. */
  readonly pushUrl?: string;
  /** `--preset`. Bypasses the detection table entirely; validated at parse time. */
  readonly preset?: string;
  /** `--app-dir`. The tree detection probes, when the repository nests its application. */
  readonly appDir?: string;
  /** `--reference-toolchain-path`. Read only when the parity phase is on. */
  readonly referenceToolchainPath?: string;
}

/**
 * The keys {@link InitFlags} holds a boolean in: the three phase toggles, the two flags whose
 * subject is the *shape* of this run rather than a value written into the config — `--git-init`,
 * which decides whether there is a repository to wire at all, and `--reset-config`, which decides
 * whether the config in it is read or rebuilt — and the {@link ANALYZE_FLAG} /
 * {@link NO_ANALYZE_FLAG} pair, whose two keys are one tri-state: which wording the generated
 * always-loaded file's setup-pending banner carries, and which closing pointer this run prints.
 */
type SwitchFlagKey = {
  [K in keyof InitFlags]-?: InitFlags[K] extends boolean | undefined ? K : never;
}[keyof InitFlags];

/** Every other key: the ones whose flag consumes the next argument. */
type ValueFlagKey = Exclude<keyof InitFlags, SwitchFlagKey>;

/**
 * One row of the flag table: the single source for both the parser and the `--help` block.
 *
 * A discriminated union rather than a `kind` field beside an optional `placeholder`, so a row can
 * only pair a switch with a boolean-valued key and a value flag with a string-valued one. The
 * alternative is a table that compiles while parsing `--qa` into a key the generators read as a
 * path — which nothing downstream could detect, because both are `undefined` when the flag is
 * absent and the flag is absent on almost every run.
 *
 * **`configValue` marks the discarded class, on the row rather than in a list beside it.** Its
 * membership test is about where the value is **written**: the flag's value is written to a
 * {@link CONFIG_FILENAME} key, so a run that reads that file instead of writing it writes that value
 * nowhere — which is what {@link discardedConfigFlagsWarning} says out loud, and the field holds the
 * config key so that warning can name a per-key remedy rather than a shape. It is deliberately not a
 * test about everything the flag reaches: see the marked sub-case below.
 *
 * Three groups of row look like members and are not, and a later row is classified against them
 * rather than guessed: `--marketplace` reaches the committed `.claude/settings.json`
 * (`generators/projectSettings.ts`) and `--reference-toolchain-path` reaches the permission profile
 * (`generators/permissionProfile.ts`), so both still take effect on a kept run; and the run-shape
 * rows — `--git-init`, `--reset-config`, the {@link ANALYZE_FLAG} / {@link NO_ANALYZE_FLAG} pair,
 * {@link NOTIFICATIONS_FLAG} and {@link PUSH_URL_FLAG} — are about the shape of the run or about
 * artifacts outside the repository's config.
 *
 * **Marked *and* detection-steering** is the sub-case, and {@link InitOption.steersDetection} is how
 * a row states it: `--preset` and {@link APP_DIR_FLAG} write a config key like every other marked
 * row, and are also inputs to stack detection, whose output reaches a generator that does not read
 * the config — a kept run with `--force` re-renders each wrapper body from *this* run's detected raw
 * line (`generators/scripts.ts`, `resolveBody` precedence 2). So the warning names them as flags
 * whose value went unwritten, and says what they still steered, rather than claiming they reached
 * this file and nothing else. Where a marked value also selects a derived section *inside* the file —
 * `--preset` picks `layers` from `detection.preset` — the key named is still the one the value is
 * written to, and the warning says in the same sentence that only `--reset-config` re-derives the
 * rest.
 */
type InitOption =
  | {
      readonly key: ValueFlagKey;
      /** The flag as it is typed. */
      readonly flag: string;
      readonly kind: 'value';
      /** The value placeholder, for the usage line and for the "requires a value" refusal. */
      readonly placeholder: string;
      readonly summary: string;
      /** Set on a discarded-class row: the config key this flag's value is written to (type header). */
      readonly configValue?: string;
      /** Set where that value is also a stack-detection input, which `--force` re-renders from (type header). */
      readonly steersDetection?: true;
    }
  | {
      readonly key: SwitchFlagKey;
      readonly flag: string;
      readonly kind: 'switch';
      readonly summary: string;
      /** Set on a discarded-class row: the config key this flag's value is written to (type header). */
      readonly configValue?: string;
      /** Set where that value is also a stack-detection input, which `--force` re-renders from (type header). */
      readonly steersDetection?: true;
    };

/**
 * Freeze the flag table, and check it covers the whole flag surface.
 *
 * `rows` infers its literal key union; the second parameter is empty — and the call therefore
 * complete — only when that union covers every {@link InitFlags} key. A key left without a row makes
 * this call a missing-argument error whose expected type is that key, which is what turns "extends
 * the generator flag interfaces" into an enforced table rather than a convention.
 */
function initOptions<T extends readonly InitOption[]>(
  rows: T,
  ..._rowsMissingFor: Exclude<keyof InitFlags, T[number]['key']> extends never
    ? []
    : [missing: Exclude<keyof InitFlags, T[number]['key']>]
): readonly InitOption[] {
  return Object.freeze(rows);
}

/**
 * The flag surface, in the order `--help` prints it: the gate that decides whether there is a
 * repository to wire at all, then the one that decides whether the config in it is read or rebuilt,
 * then the two that decide what is detected, then the values written into the config, then the three
 * phase toggles with their own inputs beside them, then the onboarding slug, then the pair that
 * answers the offer to analyze this repository — which decides the wording the generated
 * always-loaded file carries — and last the pair that decides whether this account gets told when an
 * unattended run finishes, which is the one pair that writes nothing into the repository at all.
 *
 * The first two sit together, and ahead of everything else, because they are the rows whose subject
 * is the **shape of the run** rather than a value in the generated file: one settles what `init` is
 * aimed at, the other settles whether it generates that file at all or reads the one already there.
 * `--reset-config` would otherwise be filed among the config values it re-derives, which is the one
 * thing it is not — it writes none of them itself.
 *
 * Every row is optional and every one has a documented default — for the config values, in the
 * generator that reads it; for {@link GIT_INIT_FLAG}, in {@link resolveTargetRepository}, whose
 * default is the refusal every earlier release raised; and for `--reset-config`, in
 * `generators/harnessConfig.ts`, whose default is to read the file that is already there. `init`
 * supplies no default of its own beyond that, so an absent flag and a flag never added are the same
 * thing to everything downstream.
 */
const INIT_OPTIONS: readonly InitOption[] = initOptions([
  {
    key: 'gitInit',
    flag: GIT_INIT_FLAG,
    kind: 'switch',
    summary: 'Create a git repository when the target directory is not in one (otherwise init refuses)',
  },
  {
    key: 'resetConfig',
    flag: '--reset-config',
    kind: 'switch',
    summary: `Rebuild ${CONFIG_FILENAME} from detection and the flags, after a .bak (init otherwise reads it)`,
  },
  {
    key: 'preset',
    flag: '--preset',
    kind: 'value',
    placeholder: '<name>',
    summary: 'Force a layer preset instead of detecting one',
    configValue: 'detection.preset',
    steersDetection: true,
  },
  {
    key: 'appDir',
    flag: APP_DIR_FLAG,
    kind: 'value',
    placeholder: '<dir>',
    summary: 'Repo-relative directory of the application, when the repository nests it',
    configValue: 'appDir',
    steersDetection: true,
  },
  {
    key: 'projectName',
    flag: '--project-name',
    kind: 'value',
    placeholder: '<name>',
    summary: 'Short project identifier (default: the repository directory name)',
    configValue: 'projectName',
  },
  {
    key: 'defaultBranch',
    flag: '--default-branch',
    kind: 'value',
    placeholder: '<branch>',
    summary: 'The branch work merges back into, and the one a run may never push to',
    configValue: 'defaultBranch',
  },
  {
    key: 'stateDir',
    flag: STATE_DIR_FLAG,
    kind: 'value',
    placeholder: '<dir>',
    summary: 'Repo-relative run-artifact directory; must not be dot-named',
    configValue: 'stateDir',
  },
  { key: 'qa', flag: '--qa', kind: 'switch', summary: 'Turn the interactive test phase on', configValue: 'phases.qa' },
  {
    key: 'qaDriver',
    flag: QA_DRIVER_FLAG,
    kind: 'value',
    placeholder: '<driver>',
    summary: 'Which interactive-test driver the QA phase runs (with --qa)',
    configValue: 'qa.driver',
  },
  {
    key: 'docs',
    flag: '--docs',
    kind: 'switch',
    summary: 'Turn the documentation phase on',
    configValue: 'phases.docs',
  },
  {
    key: 'docsRoot',
    flag: '--docs-root',
    kind: 'value',
    placeholder: '<dir>',
    summary: 'Documentation root the docs phase keeps current (with --docs)',
    configValue: 'docs.root',
  },
  {
    key: 'parity',
    flag: '--parity',
    kind: 'switch',
    summary: 'Turn the reference-parity phase on',
    configValue: 'phases.parity',
  },
  {
    key: 'referenceImpl',
    flag: '--reference-impl',
    kind: 'value',
    placeholder: '<path>',
    summary: 'Checkout of the reference implementation to compare against (with --parity)',
    configValue: 'parity.referenceImplPath',
  },
  {
    key: 'referenceToolchainPath',
    flag: '--reference-toolchain-path',
    kind: 'value',
    placeholder: '<abs>',
    summary: "Absolute directory of the reference implementation's own toolchain (with --parity)",
  },
  {
    key: 'marketplace',
    flag: '--marketplace',
    kind: 'value',
    placeholder: '<owner>/<repo>',
    summary: 'Marketplace repository written into the committed .claude/settings.json',
  },
  // Two rows, two keys, one tri-state — the reasoning is at {@link ANALYZE_FLAG}, and
  // {@link resolveAnalyzeOffer} is what folds the pair into a single answer.
  {
    key: 'analyze',
    flag: ANALYZE_FLAG,
    kind: 'switch',
    summary: `Offer to run ${ANALYZE_COMMAND} after wiring (the default; ${NO_ANALYZE_FLAG} declines)`,
  },
  {
    key: 'noAnalyze',
    flag: NO_ANALYZE_FLAG,
    kind: 'switch',
    summary: 'Decline the analyze offer, and record the declined wording',
  },
  {
    key: 'notifications',
    flag: NOTIFICATIONS_FLAG,
    kind: 'switch',
    summary: 'Set up push notifications for unattended runs (default: off)',
  },
  {
    key: 'pushUrl',
    flag: PUSH_URL_FLAG,
    kind: 'value',
    placeholder: '<url>',
    summary: 'Endpoint unattended-run notifications are posted to (with --notifications)',
  },
] as const);

/**
 * A flag value as a reader can retype it: quoted only where a shell would otherwise split or expand
 * it, so the remedy below stays copy-pasteable for an ordinary branch name and stays correct for a
 * path with a space in it.
 */
function retypable(value: string): string {
  return /^[A-Za-z0-9._/@-]+$/.test(value) ? value : JSON.stringify(value);
}

/**
 * The warning a kept-config run owes for the flags whose values it resolved and threw away, or
 * `undefined` when this command line carried none.
 *
 * Derived from {@link INIT_OPTIONS} and the parsed flags rather than from a list of its own — a row
 * is in the discarded class exactly when it carries {@link InitOption.configValue} (the membership
 * test is in that type's header), so a flag added to the table is classified there and here at once.
 * *Given* is `true` for a switch rather than merely present, because {@link parseInitFlags} names
 * every switch key on every run and presence alone would name flags nobody passed.
 *
 * A **warning** rather than a note: it survives `--quiet` (`core/report.ts`), and an unattended run
 * that passed a flag which did nothing is exactly the reader who needs to have been told. It names
 * both routes because they are not the same repair — `config set` changes the one key it is given
 * and re-derives nothing else, while `--reset-config` rebuilds the whole file from detection and
 * this command line, which is the only route that also re-derives what a value implies.
 *
 * **It claims the unwritten value, never that the flag did nothing.** A dropped row carrying
 * {@link InitOption.steersDetection} did steer this run's stack detection, and a kept run with
 * `--force` re-renders the wrapper bodies from that detection (`generators/scripts.ts`,
 * `resolveBody` precedence 2) — so the clause naming that is added when, and only when, such a row
 * is among the dropped. A reader told a flag reached nothing reaches for `--reset-config`, which
 * rebuilds the whole file and discards every hand-set value, to get an effect a plain re-run had
 * already had half of.
 */
function discardedConfigFlagsWarning(flags: InitFlags): string | undefined {
  const dropped: { flag: string; configKey: string; invocation: string; steersDetection: boolean }[] = [];
  for (const option of INIT_OPTIONS) {
    const configKey = option.configValue;
    if (configKey === undefined) continue;
    const steersDetection = option.steersDetection === true;
    if (option.kind === 'switch') {
      if (flags[option.key] === true) {
        dropped.push({ flag: option.flag, configKey, invocation: option.flag, steersDetection });
      }
      continue;
    }
    const value = flags[option.key];
    if (value === undefined) continue;
    dropped.push({ flag: option.flag, configKey, invocation: `${option.flag} ${retypable(value)}`, steersDetection });
  }
  if (dropped.length === 0) return undefined;

  const one = dropped.length === 1;
  const keyRemedies = dropped.map((entry) => `\`${CLI} config set ${entry.configKey} <value>\``).join(', ');
  const steering = dropped.filter((entry) => entry.steersDetection).map((entry) => entry.flag);
  const steeringClause =
    steering.length === 0
      ? ''
      : ` ${steering.join(', ')} also steer${steering.length === 1 ? 's' : ''} stack detection, and still did on this run: what \`--force\` then re-renders from that detection is the wrapper scripts, not this file.`;
  return `${dropped.map((entry) => entry.flag).join(', ')} ${one ? 'was' : 'were'} given, and ${CONFIG_FILENAME} was read rather than written on this run: ${one ? 'that flag supplies a value' : 'each of those flags supplies a value'} for a key of that file, so no such value was written and the keys in the file are the ones every generator after it read.${steeringClause} Apply ${one ? 'it' : 'them'} by rebuilding the file from detection and this command line with \`${INIT_VERB} --reset-config ${dropped.map((entry) => entry.invocation).join(' ')}\`, which copies the file that is there to a .bak first and is the only route that also re-derives what a value implies — or change ${one ? 'the key' : 'the keys'} alone with ${keyRemedies}`;
}

/** The command's own `Options:` rows, invocation-aligned, derived from {@link INIT_OPTIONS}. */
function initOptionLines(): readonly string[] {
  const invocations = INIT_OPTIONS.map(
    (option) => `${option.flag}${option.kind === 'switch' ? '' : ` ${option.placeholder}`}`,
  );
  const width = Math.max(...invocations.map((invocation) => invocation.length));
  return INIT_OPTIONS.map((option, index) => `  ${(invocations[index] as string).padEnd(width)}  ${option.summary}`);
}

/**
 * The lines the registry renders under this command's synopsis. The entry point appends the global
 * options after them, so `init --help` prints both sets and exits 0 without reaching {@link run} —
 * which is what keeps `--help` safe to invoke against a command that writes files.
 */
const INIT_USAGE: readonly string[] = Object.freeze([
  'Init options (every one optional):',
  ...initOptionLines(),
]);

/**
 * Parse the arguments left after the entry point consumed the global flags.
 *
 * **An unrecognised flag is a refusal, never a silent ignore.** A mistyped flag that is quietly
 * dropped produces a repository wired differently from what was asked for, and the difference is
 * only visible later, in a generated file nobody re-reads. A positional argument is refused for the
 * same reason: `init` takes none, so one is a mistyped flag or a command that does not exist.
 */
/**
 * The {@link QA_DRIVER_FLAG} value, checked against the schema's own enum — the flag surface's twin
 * of `parsePresetName`, and the only value flag whose legal values are a closed set.
 *
 * It is settled at the flag rather than left to the config check for two reasons. The generated
 * config would be refused by {@link writeHarnessConfig}'s guard as {@link EXIT.INTERNAL}, which
 * blames this CLI for a value the adopter typed; and the two mobile values name agent variants
 * closely enough (`mobile-maestro`, `mobile-mcp`) that reaching for the wrong one is a plausible
 * mistake rather than a contrived one, so the refusal lists all three — from `qaDriverChoices`, the
 * same renderer {@link askQaDriver} puts the values through, so the two surfaces cannot disagree
 * about which of them this release implements. This is also the only one of the two a subprocess can
 * reach, and so the one `test/init.test.mjs` asserts the marking on behaviourally.
 */
function parseQaDriver(value: string): HarnessQaDriver {
  const driver = asQaDriver(value);
  if (driver === undefined) {
    throw new HarnessError(
      `init: unknown ${QA_DRIVER_FLAG} ${JSON.stringify(value)}: expected one of ${qaDriverChoices()}`,
    );
  }
  return driver;
}

function parseInitFlags(argv: readonly string[]): InitFlags {
  const values = new Map<ValueFlagKey, string>();
  const switches = new Set<SwitchFlagKey>();

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index] as string;
    const separator = token.startsWith('--') ? token.indexOf('=') : -1;
    const name = separator > 0 ? token.slice(0, separator) : token;
    const inlineValue = separator > 0 ? token.slice(separator + 1) : undefined;
    const option = INIT_OPTIONS.find((candidate) => candidate.flag === name);

    if (option === undefined) {
      throw new HarnessError(
        token.startsWith('-')
          ? `init: unknown option ${JSON.stringify(name)} — run \`${INIT_VERB} --help\` for the options it takes`
          : `init: unexpected argument ${JSON.stringify(token)} — ${INIT_VERB} takes options only, and writes into the repository containing the current directory (or --cwd)`,
      );
    }

    if (option.kind === 'switch') {
      if (inlineValue !== undefined) throw new HarnessError(`init: ${name} does not take a value`);
      switches.add(option.key);
      continue;
    }

    let value = inlineValue;
    if (value === undefined) {
      index += 1;
      value = argv[index];
    }
    if (value === undefined || value === '') throw new HarnessError(`init: ${name} requires ${option.placeholder}`);
    values.set(option.key, value);
  }

  // Sound by construction rather than by inspection: {@link InitOption} admits a string only under a
  // `ValueFlagKey` and a switch only under a `SwitchFlagKey`, so every entry assembled here holds
  // the type the interface declares for its key. The switches are named one by one rather than
  // collected because the list below is meant to be the whole of {@link SwitchFlagKey} — that is
  // what makes each of them `false` when absent rather than missing, and a key added to that type
  // and not here is a flag the parser accepts and every generator then reads as `undefined`.
  //
  // `qaDriver` is the one exception and is re-set from {@link parseQaDriver} below, because its
  // declared type is the enum rather than `string`: the collected raw value would satisfy the cast
  // and not the type. Checking it here — inside the parser, before the git gate and every other
  // precondition — is also what keeps a mistyped driver from costing an adopter a repository this
  // run created and then refused to wire.
  const qaDriver = values.get('qaDriver');

  // The analyze pair is refused here for that same reason and at that same point: a contradictory
  // command line must not cost an adopter a repository this run created and then declined to wire.
  if (switches.has('analyze') && switches.has('noAnalyze')) {
    throw new HarnessError(
      `init: ${ANALYZE_FLAG} and ${NO_ANALYZE_FLAG} answer the same question opposite ways and both were given: pass one, or neither — with neither, the documented default accepts the offer`,
    );
  }

  return {
    ...Object.fromEntries([...values]),
    ...(qaDriver === undefined ? {} : { qaDriver: parseQaDriver(qaDriver) }),
    gitInit: switches.has('gitInit'),
    resetConfig: switches.has('resetConfig'),
    analyze: switches.has('analyze'),
    noAnalyze: switches.has('noAnalyze'),
    notifications: switches.has('notifications'),
    qa: switches.has('qa'),
    docs: switches.has('docs'),
    parity: switches.has('parity'),
  } as InitFlags;
}

/** The `name` of a JSON manifest, or `undefined` when there is no readable one with a name. */
function packageNameAt(manifestPath: string): string | undefined {
  let parsed: ReturnType<typeof readJsonFile>;
  try {
    parsed = readJsonFile(manifestPath);
  } catch {
    // A manifest that does not parse belongs to a repository this command has no opinion about:
    // the question here is only "is this the harness's own repository", and an unreadable answer
    // is a no.
    return undefined;
  }
  if (parsed === undefined || parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) return undefined;
  const name = parsed['name'];
  return typeof name === 'string' && name !== '' ? name : undefined;
}

/** This package's own `name`, read from the manifest beside the compiled tree. */
function ownPackageName(): string {
  const manifestPath = join(packageRoot(), 'package.json');
  const name = packageNameAt(manifestPath);
  if (name === undefined) {
    throw new HarnessError(
      `this CLI's own manifest could not be read at ${manifestPath}, so init could not check whether it was aimed at the harness's own repository: this is a fault in this CLI rather than in the repository it was run against`,
      EXIT.INTERNAL,
    );
  }
  return name;
}

/**
 * Refuse a run aimed at the repository this CLI itself lives in.
 *
 * Wiring the harness's own repository is never what was meant, and it is a plausible accident:
 * `docs/development.md` §5's gate 2 documents running the built CLI from this root, which was a
 * refusal check for as long as `init` refused everything. Once it works, that invocation would
 * generate a config, a state tree and a permission profile into the harness's own tree.
 */
function assertNotHarnessOwnRepository(repoRoot: string): void {
  if (!existsSync(join(repoRoot, MARKETPLACE_MANIFEST))) return;
  if (packageNameAt(join(repoRoot, CLI_MANIFEST)) !== ownPackageName()) return;

  throw new HarnessError(
    `refusing to wire the harness's own repository; run \`${INIT_VERB}\` in the repository you want to adopt it. ${repoRoot} carries ${MARKETPLACE_MANIFEST} and a ${CLI_MANIFEST} naming this package, so it is the harness itself rather than an adopting project: wiring it would generate a ${CONFIG_FILENAME}, a run-artifact tree and a permission profile into the tree that ships them. Run ${INIT_VERB} from the adopting repository, or point it at one with --cwd <path>`,
  );
}

/**
 * Refuse a `--state-dir` that names, or reaches through, a dot-directory — **before** anything is
 * assembled from it.
 *
 * The reason is the one `docs/config.md` §3 gives and the one the tree generator repeats: the
 * run-artifact tree has to be writable by an unattended run, and a dot-path is where a host reserves
 * directories an unattended run may not write to. The failure is therefore silent — the tree is
 * created, the run reports success, and every artifact it produced is gone. Refusing at the flag is what makes it an adopter-fixable usage error with the ordinary exit
 * code, rather than the internal-fault exit the config generator's backstop would raise on a config
 * this CLI had already assembled.
 */
function assertUsableStateDir(value: string | undefined): void {
  if (value === undefined) return;
  if (!STATE_DIR_DOT_PATTERN.test(value.trim())) return;

  throw new HarnessError(
    `${STATE_DIR_FLAG} ${JSON.stringify(value)} has a path segment starting with '.', and the run-artifact tree must not be dot-named or reach through a dot segment: it has to be writable by an unattended run, and a dot-path is where a host reserves directories an unattended run may not write to — measured for .claude/**, where such a run completes with exit 0 having written nothing. Pass a name without a leading dot; do not "fix" it back to a dot-name`,
  );
}

/** The repository every write is confined to, and what the run should say about how it got there. */
interface TargetRepository {
  /** `<repo_root>` — as git reports it, never as the caller spelled it. */
  readonly root: string;
  /**
   * Whether **this run** created the repository — which decides what the run *says*, not what it
   * commits: the note below, and the line the commit reports itself with
   * ({@link commitGeneratedFiles}), which names what was staged differently for a repository that
   * was already there.
   *
   * `false` under `--dry-run`, because a dry run creates nothing: the flag says what happened, not
   * what a real run would have done.
   *
   * **It no longer gates the first commit.** It once did, on the reasoning that a repository the
   * adopter made themselves and has not committed into yet is theirs to stage and describe. But the
   * harm the commit exists to prevent is a repository **state** rather than an authorship —
   * `git worktree add` cannot prepare a checkout from a repository with no commit, whoever left it
   * in that condition — so what decides the commit is {@link hasCommits}, and a repository with
   * history is untouched by construction.
   */
  readonly created: boolean;
  /**
   * Lines for the run's notes block. Empty when there is no outcome to report — which is most runs
   * that found a repository and did not pass {@link GIT_INIT_FLAG}, since a flag that was never
   * given has nothing to say about what did or did not happen. **Not all of them:** a `--dry-run`
   * that found a repository with no commit reports the first commit a real run would make there
   * whether or not the flag was given, because that mutation is gated on the repository's state
   * rather than on the flag ({@link alreadyARepositoryNotes}).
   */
  readonly notes: readonly string[];
}

/**
 * What the run says about a directory that was **already** inside a repository — what
 * {@link GIT_INIT_FLAG} meant there, and what this run does about that repository's own history. The
 * case was silent until Task 8, and the silence is what let a run leave the exact state
 * {@link commitGeneratedFiles} exists to prevent without anything saying so.
 *
 * **Notes, never warnings.** A provisioning script that passes the flag whether or not the directory
 * is fresh is a *correct* run, and a warning that fires on every correct run is how a warning list
 * stops being read (`generators/harnessConfig.ts`).
 *
 * **Two gates, because the two facts are about different things.** What the flag did here is a
 * statement *about the flag*, so a run that never asked for a repository is told none of it. Whether
 * the first commit happens is a statement about the repository's **state**:
 * {@link commitGeneratedFiles} stopped consulting the flag once the commit became a fix for an unborn
 * `HEAD` rather than a courtesy to a repository this run created — so a preview gated on the flag
 * would leave the ordinary no-flag adoption (an adopter's own `git init`, never committed into)
 * silent about the one mutation outside the plan a real run makes there. That is `docs/cli.md` §1's
 * "a dry run cannot report a success a real run would not have" contract read in its other
 * direction: a dry run may not omit a mutation a real run makes either.
 *
 * Four texts — three gated on the flag, one on {@link hasCommits} alone:
 *
 * - **Flag given, the repository has history.** Nothing was created and nothing is committed —
 *   {@link commitGeneratedFiles} short-circuits on {@link hasCommits}, so the *commit* half reads the
 *   same in both modes: it is the repository's state that decides it, not the run's. The *wiring*
 *   half is the run's own work, so it splits — "this run only wires it" on a real run, "a real run
 *   would only wire it" under `--dry-run`, which wires nothing.
 * - **Flag given, no commit yet.** Nothing was created, said on its own: the commit half of this
 *   state is one of the two lines below, neither of which is about the flag.
 * - **No commit yet, real run — flag gated.** This run *does* make the first commit, for the reason
 *   that guard exists: `git worktree add` cannot prepare a checkout from a repository with no commit.
 *   A real run's account of the commit it actually made is {@link commitGeneratedFiles}' `ok` line,
 *   which every commit-less real run already gets; this line is the promise made before the plan is
 *   applied, and it stays flag-gated so a no-flag run is not told the same thing twice.
 * - **No commit yet, `--dry-run` — gated on the state alone.** The same two facts in the conditional,
 *   printed whether or not the flag was given, because that is the gate the commit itself is under
 *   and a dry run is the only run with nothing after the fact to say it.
 *
 * Asking {@link hasCommits} here costs a second probe and is safe: nothing commits between this call
 * and {@link commitGeneratedFiles}, so the note and the commit cannot disagree.
 */
function alreadyARepositoryNotes(ctx: CommandContext, flags: InitFlags, root: string): readonly string[] {
  const commits = hasCommits(root);
  const notes: string[] = [];

  if (flags.gitInit === true) {
    const nothingCreated = `${GIT_INIT_FLAG} was given and nothing was created: this directory is already inside a git repository at ${root}`;
    notes.push(
      commits
        ? `${nothingCreated}, and that repository has history — init never commits into an established history, so ${
            ctx.flags.dryRun ? 'a real run would only wire it' : 'this run only wires it'
          }`
        : nothingCreated,
    );
  }

  const worktreeReason =
    'because `git worktree add` cannot prepare a checkout from a repository with no commit';
  if (!commits && ctx.flags.dryRun) {
    notes.push(
      `this repository has no commit yet, so a real run would make the first commit here — \`git add -A\` would stage everything in the working tree, what init generated and whatever was already here, with the managed .gitignore block deciding what is left out — ${worktreeReason}. This was a dry run, so nothing was written and nothing was committed`,
    );
  } else if (!commits && flags.gitInit === true) {
    notes.push(
      `this repository has no commit yet, so init makes the first commit from what is in the working tree once the plan has been applied, ${worktreeReason}`,
    );
  }

  return notes;
}

/**
 * Settle the one precondition that has an *answer* rather than only a verdict: is there a repository
 * to wire, and — when there is not — may this run create one.
 *
 * **Git stays a hard gate; nothing is ever created silently.** The repository appears only because
 * {@link GIT_INIT_FLAG} said so, or because someone at a terminal answered yes. A run that cannot be
 * asked takes the documented default and refuses, which is exactly what every release before the
 * offer did — so an unattended run's outcome is unchanged (`core/prompt.ts`).
 *
 * **And every outcome of the flag is reported, including the one where it did nothing.** Passing
 * {@link GIT_INIT_FLAG} into a directory that is already a repository creates nothing, which is
 * correct and used to be silent; it now carries a note saying so and saying what this run does about
 * that repository's own history ({@link alreadyARepositoryNotes}).
 *
 * It is called where `resolveRepoRoot` used to be — before the harness-own-repository check and
 * before the first generator, so the accept path still runs before a single write is enqueued and
 * the refusal path still leaves a plan that was never built. **After** the two refusals the flags
 * alone answer, though, and that half of the ordering is this function's doing: its accept path
 * creates a repository, so a refusal raised later would leave one behind in a directory the run then
 * declined to wire — a repository the adopter never asked for and was never told about. The
 * corrected re-run would then find it simply *there*, take it as the root every write is confined to
 * without putting the question this gate exists to put, and — since it has no commit —
 * {@link commitGeneratedFiles} would commit the whole of that directory's working tree into it.
 *
 * **Only git's own "not a git repository" is an offer.** A `git` that is not on PATH, and a `git`
 * that refused to answer (`detected dubious ownership`, an unreadable object store), each throw the
 * probe's own message unchanged: the first is a missing prerequisite whose accept path would fail
 * for the same reason, and the second may well be a refusal *inside* an existing repository, where
 * creating one is the wrong move and git's own sentence is the remedy.
 */
function resolveTargetRepository(ctx: CommandContext, flags: InitFlags): TargetRepository {
  const probe = probeRepoRoot(ctx.cwd);
  if (probe.kind === 'repository') {
    // Nothing to decide — but a run that passed the flag anyway gets told what that meant here, and
    // a dry run over a commit-less repository gets the first commit previewed whether or not it did,
    // rather than the silence that let a commit-less repository be wired and left uncommitted with
    // nothing said ({@link alreadyARepositoryNotes}).
    return { root: probe.root, created: false, notes: alreadyARepositoryNotes(ctx, flags, probe.root) };
  }
  if (probe.kind !== 'not-a-repository') throw new HarnessError(probe.message);

  const accepted =
    flags.gitInit === true ||
    askYesNo(
      {
        question: `No git repository at ${ctx.cwd}. Create one here and wire it?`,
        defaultAnswer: false,
        flag: GIT_INIT_FLAG,
        flagHint: 'to create one without being asked',
      },
      { flags: ctx.flags, report: ctx.report },
    );

  if (!accepted) {
    throw new HarnessError(
      `${probe.message}. Every path init writes is confined to a repository root, and the worktree-based flow it wires cannot prepare a checkout without one, so this is a gate rather than something init works around. Pass ${GIT_INIT_FLAG} to create a repository here, run ${INIT_VERB} from inside an existing one, or point it at one with --cwd <path>`,
    );
  }

  if (ctx.flags.dryRun) {
    // The preview reports the decision without making it, and the rest of the plan is previewed
    // against `cwd` as the root. Resolved through `realpathSync` rather than taken as spelled, for
    // the reason the real path below re-probes: a caller's directory may reach its target through a
    // symlink (`/tmp` on macOS is one), and a preview whose absolute paths differ from the ones a
    // real run writes is not the faithful preview `docs/cli.md` §1 promises. This is an explicit
    // `dryRun` guard rather than a consequence of the plan's structure, because `initRepository`
    // writes outside the plan: a dry run may not report a success a real run would not have, and it
    // may not create a repository in order to say so.
    const root = realpathSync(ctx.cwd);
    ctx.report.info(`would create a git repository at ${root}`);
    return {
      root,
      created: false,
      notes: [
        `no git repository was created — this was a dry run; with ${GIT_INIT_FLAG} a real run creates one at ${root}, wires it, and makes the first commit from everything in this directory's working tree — what it generated and whatever was already here — with the managed .gitignore block deciding what is left out`,
      ],
    };
  }

  initRepository(ctx.cwd);

  // Re-probed rather than assumed: `rev-parse --show-toplevel` answers with the physical path, and
  // the caller's directory may reach it through a symlink (`/tmp` on macOS is one). Taking `cwd`
  // here would spell every absolute path the generators write differently from the root git reports,
  // and nothing downstream would notice.
  const created = probeRepoRoot(ctx.cwd);
  if (created.kind !== 'repository') throw new HarnessError(created.message);

  ctx.report.ok(`created a git repository at ${created.root}`);
  return {
    root: created.root,
    created: true,
    notes: [
      `the git repository at ${created.root} was created by this run — init makes the first commit from everything in this directory's working tree, what it generated and whatever was already here, with the managed .gitignore block deciding what is left out, because \`git worktree add\` cannot prepare a checkout from a repository with no commit`,
    ],
  };
}

/**
 * Make the first commit — in any repository being wired that has no commit yet, and only from what
 * is on disk once the whole plan has been applied.
 *
 * **Why it exists at all:** a repository with an unborn `HEAD` is one `git worktree add` away from
 * failing, and that is a fact about the repository's **state** rather than about who created it. So
 * an adopter who accepted the offer — or who ran `init` inside a repository they had made and not
 * yet committed into — would have a correctly wired repository from which the worktree-based flow
 * this command exists to enable cannot prepare a single checkout: one non-obvious step away from
 * working, with nothing in the run saying so. `doctor` reports it, but `doctor` cannot be relied on
 * to have run.
 *
 * Two conditions, each answering a different way this could be wrong:
 *
 * - **`dryRun`** — the third of the three explicit guards named in choice 1 of the module header. A
 *   dry run has applied no plan, so there would be nothing of its own to commit anyway; the guard
 *   is written all the same, because the guarantee it protects is "a dry run mutates nothing" and
 *   that must not rest on what some other function did elsewhere in the file.
 * - **{@link hasCommits}** — a repository with history is never committed into. This one check is
 *   the whole of that property and it holds by construction rather than by inspection: it
 *   short-circuits before `commitAll` is reached, so no path from here reaches a commit on top of
 *   somebody's work.
 *
 * **Two consequences, both said out loud rather than left implicit.** First, an established
 * repository is untouched, whoever wired it and whether or not this run created anything — the
 * check above is the whole reason, and there is no second one to keep in step with it. Second,
 * `git add -A` stages the **whole working tree** — what `init` generated and whatever was already in
 * the directory — in either arm, with the managed `.gitignore` block the plan just wrote deciding
 * what is left out (`generators/repoRoot.ts`). A repository `--git-init` created is not an
 * exception: detection read that directory's manifests before the plan was built, so there is
 * content there to stage. That single-commit shape is deliberate — one shape, one message — so the
 * run **reports which arm it was in**, because *who* left the repository without a commit is what
 * differs, not what got staged.
 *
 * **A refusal is a warning, not a failure.** Everything the run was asked to wire is on disk and
 * correct by the time this runs, so exiting non-zero would report a failed adoption because of a
 * step the adopter can finish with two commands. The overwhelmingly common cause is a machine with
 * no commit identity — which `init` deliberately does not set, because an identity is the
 * operator's and inventing one authors commits as somebody who does not exist — so the warning
 * carries the exact commands rather than only git's account of the refusal.
 */
function commitGeneratedFiles(ctx: CommandContext, target: TargetRepository): readonly string[] {
  if (ctx.flags.dryRun || hasCommits(target.root)) return [];

  const result = commitAll(target.root, FIRST_COMMIT_MESSAGE);
  if (result.committed) {
    ctx.report.ok(
      target.created
        ? `committed this directory as the repository's first commit: ${FIRST_COMMIT_MESSAGE}. \`git add -A\` staged everything in the working tree — what init generated and whatever was already here — with the managed .gitignore block deciding what was left out`
        : `this repository was already here and had no commit yet, so init made its first one: ${FIRST_COMMIT_MESSAGE}. \`git add -A\` staged everything in the working tree — what init generated and whatever was already here — with the managed .gitignore block deciding what was left out, because \`git worktree add\` cannot prepare a checkout from a repository with no commit`,
    );
    return [];
  }

  return [
    `this repository has no commit yet: git declined to make one — ${result.reason}. Everything init generated is on disk and correct; only the commit is missing, and \`git worktree add\` fails against a repository with no commit, so the worktree-based flow cannot prepare a checkout until there is one. Most often the machine has no commit identity, which init does not set for you: run \`git config user.email "you@example.com"\` and \`git config user.name "Your Name"\`, then \`git add -A && git commit -m "${FIRST_COMMIT_MESSAGE}"\``,
  ];
}

/**
 * Ask which driver the interactive test phase should run — or answer `undefined` on every run that
 * cannot be asked, which is what tells the config generator to take the documented default and to
 * say so rather than pretending a choice was made.
 *
 * **`undefined` rather than the default itself** is the whole reason this wrapper exists: `askLine`
 * answers a no-terminal run with `defaultValue`, so a caller taking its return alone cannot tell an
 * adopter who chose `web-playwright` from a CI run that was never asked — and the two want opposite
 * notes. {@link canPrompt} is the same predicate `askLine` itself uses, so `--non-interactive` and
 * `--quiet` are honoured here on exactly the terms they are honoured everywhere.
 *
 * The question **back-references** the detected preset instead of naming it. It used to open on
 * `` detected the `<preset>` layer preset ``, which is verbatim the opening clause of the detection
 * line printed immediately above it: the two read as one narration line printed twice, so the eye
 * skips the second and the question with it. What the naming was for still holds — the detection
 * table is file-existence only and has no mobile row (`docs/cli.md` §4), so what `init` found says
 * nothing about how the application is reached — and the back-reference carries it without
 * re-printing the line the adopter has just read. The preset is therefore no longer an input, and
 * the call site's ordering (after the detection line) is what the back-reference depends on.
 *
 * The values come from `qaDriverChoices`, so the two that ship declared-not-implemented are marked
 * **where the choice is made** rather than only in documents a reader opens after choosing.
 */
function askQaDriver(ctx: CommandContext): string | undefined {
  const promptCtx = { flags: ctx.flags, report: ctx.report };
  if (!canPrompt(promptCtx)) return undefined;

  return askLine(
    {
      question: `the detected preset says nothing about how this project's application is reached: which driver should the interactive test phase run? (${qaDriverChoices()})`,
      flag: QA_DRIVER_FLAG,
      defaultValue: DEFAULTS.qa.driver,
    },
    promptCtx,
  );
}

/** What the analyze offer resolved to, and the pre-plan facts the closing pointer is worded against. */
interface AnalyzeOfferResolution {
  /** The answer, as {@link writeClaudeContext} takes it. */
  readonly offer: AnalyzeOffer;
  /**
   * True on the skip branch alone: nothing was left to fill, so no answer was taken and `offer` is a
   * placeholder rather than a record. The closing wording keys on this **before** it keys on `offer`
   * ({@link analyzeRecordSentence}), because "the conventions documents are yours to write by hand"
   * is false of the one state that reaches it.
   */
  readonly nothingToFill: boolean;
  /** Lines for the run's notes block: the unasked-decision note, or the skip branch's. */
  readonly notes: readonly string[];
  /**
   * Whether the always-loaded project file was on disk **before** the plan was built. Together with
   * the run's `--force` it is what decides which of the write engine's three outcomes that file had,
   * and therefore which closing wording is true ({@link analyzeRecordSentence}).
   */
  readonly claudeMdExisted: boolean;
  /**
   * The conventions documents that were **not** untouched skeletons when this run started. Empty on
   * a fresh adoption; on **any** forced run it is the list the closing pointer names as regenerated —
   * independently of {@link claudeMdExisted}, which is a fact about a different file.
   */
  readonly filledConventions: readonly string[];
}

/**
 * The conventions documents this repository has: every distinct `layers[].conventions` value, plus
 * the shared cross-layer document whether or not a layer points at it.
 *
 * **The walk is deliberately duplicated and bounded to the walk.** `generators/claudeContext.ts`
 * applies the same rule when it collects the stubs, and it is module-private on this branch — so
 * each consumer of the rule walks `layers[]` itself, while all of them take the shared document's
 * path from {@link SHARED_CONVENTIONS_PATH}, the one exported constant, rather than re-spelling a
 * context path. `doctor`'s `setup-analysis` check states the same derivation in its own comment.
 */
function conventionsDocuments(config: HarnessConfig): readonly string[] {
  return [
    ...new Set(
      [SHARED_CONVENTIONS_PATH, ...config.layers.map((layer) => layer.conventions)].map(normalizeRepoPathStrict),
    ),
  ];
}

/**
 * The **untouched-skeleton test** applied to one document — {@link isUntouchedSkeletonText}, which
 * is the predicate itself and lives beside the two markers it is built from. `doctor` and the
 * analyze command apply the same test, so the three cannot disagree about what "unfilled" means,
 * and an adopter who wrote a document by hand is never treated as having left a skeleton.
 *
 * What this adds is the reading, and the answer for a document that cannot be read: **untouched**,
 * because here that means a document `init` is about to create for the first time — which is what
 * keeps a fresh adoption from taking the skip branch below.
 */
function isUntouchedSkeleton(repoRoot: string, repoRelative: string): boolean {
  let content: string;
  try {
    content = readFileSync(join(repoRoot, repoRelative), 'utf8');
  } catch {
    return true;
  }
  return isUntouchedSkeletonText(content);
}

/** True when the always-loaded file is there and still carries an opened setup-pending banner. */
function hasOpenSetupBanner(repoRoot: string): boolean {
  try {
    return readFileSync(join(repoRoot, CLAUDE_MD_PATH), 'utf8').includes(SETUP_PENDING_OPEN);
  } catch {
    return false;
  }
}

/**
 * Settle the offer to run {@link ANALYZE_COMMAND} in this repository's first session.
 *
 * **The third of the four questions this command puts**, and — like all four — settled before
 * `plan.apply`, so no answer is taken after anything has been written: the repository itself
 * ({@link resolveTargetRepository}), which driver the interactive test phase runs
 * ({@link askQaDriver}, asked lazily inside the config generator), this offer, and push
 * notifications ({@link resolveNotifications}). Moving the call site breaks that order and this
 * sentence with it.
 *
 * **The documented default is yes, and the interaction rule's continuity clause holds in two halves
 * rather than one** (`docs/cli.md` §2). The *pointer* half is exactly the behaviour this release
 * already had: every earlier release ended by telling every adopter to run this command
 * ({@link reportNextSteps}), so taking the default leaves the run saying what it has always said and
 * *declining* is the new option — which is why the default is yes. The *recorded-intent* half is
 * **new in this release**: no earlier release wrote any banner into the generated always-loaded file,
 * and the declined answer writes one too.
 *
 * There is deliberately **no** size threshold, duration estimate or any other condition that
 * silently declines — the adopter consented to this specific work — and the answer costs this
 * command no model call and no external process.
 */
function resolveAnalyzeOffer(
  ctx: CommandContext,
  flags: InitFlags,
  repoRoot: string,
  config: HarnessConfig,
): AnalyzeOfferResolution {
  // Read from the filesystem **before** the plan is built, because the generator enqueues the banner
  // while the plan is being assembled: by the time it has spoken, "was this file already there" and
  // "was this document still a skeleton" are no longer answerable, and the answer is an *input* to
  // that generator rather than a reading of what it produced.
  const documents = conventionsDocuments(config);
  const filledConventions = documents.filter((path) => !isUntouchedSkeleton(repoRoot, path));
  const facts = { claudeMdExisted: existsSync(join(repoRoot, CLAUDE_MD_PATH)), filledConventions };

  // (1) The flag pair folded into the tri-state, with no prompt either way. Both-given was refused in
  // the parser, so at most one is true here — and neither being true is the "not answered" state the
  // rest of this function handles.
  if (flags.noAnalyze === true) return { offer: 'declined', nothingToFill: false, notes: [], ...facts };
  if (flags.analyze === true) return { offer: 'accepted', nothingToFill: false, notes: [], ...facts };

  // (2) The skip branch: nothing is left to fill, and nothing this run does will unfill it. All
  // three conditions have to hold, and each is load-bearing:
  //
  // (2a) **the run is not forced.** `--force` upgrades every `create-if-absent` request without its
  //      own `forceOverride` to overwrite-after-backup (`core/writer.ts`), and the conventions stubs
  //      are enqueued that way for every document that is not already a skeleton
  //      (`generators/claudeContext.ts` fixes `forceOverride: 'never'` on that one case, where the
  //      `.bak` holds the only surviving analysis) — so a forced run over an analyzed repository
  //      rewrites every filled document back to its skeleton and regenerates the always-loaded file
  //      from the template. "Nothing is left to fill" is then true of the tree this run *found* and
  //      false of the tree it is *about to produce*, and this branch reads the found one.
  // (2b) **no document is still an untouched skeleton** ({@link isUntouchedSkeleton}, both halves).
  // (2c) **the always-loaded file exists and carries no open banner.** It exists, so an unforced run
  //      keeps it and no banner can be written into it whatever the answer; and no open banner,
  //      because one still there is a pass that never completed — precisely the case that must not go
  //      unasked. Deliberately not "does not exist or has no open banner": a repository whose
  //      documents are filled but whose always-loaded file was deleted is one this run *creates* that
  //      file for, so a banner will be written and its wording has to be chosen by an answer.
  if (
    !ctx.flags.force &&
    filledConventions.length === documents.length &&
    facts.claudeMdExisted &&
    !hasOpenSetupBanner(repoRoot)
  ) {
    // `offer` is a placeholder on this path — no answer was taken. (2a) + (2c) keep it out of the
    // generator: the file is kept, so no banner is written whatever it says. It is `nothingToFill`
    // that keeps the closing wording from reading it as a declined answer.
    return {
      offer: 'declined',
      nothingToFill: true,
      notes: [
        `the conventions documents are already filled, so ${ANALYZE_COMMAND} was not offered again — run it at any time to revise them, and \`${DOCTOR_COMMAND}\` for what is still unfilled`,
      ],
      ...facts,
    };
  }

  const promptCtx = { flags: ctx.flags, report: ctx.report };

  // (3) A run that cannot be asked takes the documented default and says so **here**, rather than
  // leaving the note to {@link askYesNo}: that function prints only on its `'no-terminal'` path and
  // returns the default silently under `--non-interactive` and `--quiet` (`core/prompt.ts`), so the
  // note would be missing from exactly the unattended run that most needs it. One line, one
  // producer, both reasons — and through the reporter's `info` like every other narration, so
  // `--quiet` still suppresses it with the rest.
  if (!canPrompt(promptCtx)) {
    return {
      offer: 'accepted',
      nothingToFill: false,
      notes: [
        `the analyze offer was not put — no terminal, --non-interactive or --quiet — so it took its documented default and was accepted: pass ${NO_ANALYZE_FLAG} to decline it without being asked`,
      ],
      ...facts,
    };
  }

  // (4) A terminal, and neither flag given: the one question this offer puts. The bracketed default
  // is yes, and the question says what is about to happen and where it happens.
  const accepted = askYesNo(
    {
      question: `Run ${ANALYZE_COMMAND} in this repository's first session? It reads this repository's code and writes its conventions documents from what it finds — it runs in a session rather than here, so ${INIT_VERB} analyzes nothing itself.`,
      defaultAnswer: true,
      flag: NO_ANALYZE_FLAG,
      flagHint: 'to decline it without being asked',
    },
    promptCtx,
  );

  return { offer: accepted ? 'accepted' : 'declined', nothingToFill: false, notes: [], ...facts };
}

/** The opt-in and the endpoint, as {@link writeNotifications} takes them. */
interface NotificationAnswers {
  readonly enabled: boolean;
  readonly pushUrl?: string;
}

/**
 * Settle whether this account gets told when an unattended run finishes, and where.
 *
 * **The documented default is off**, which is exactly what every release before this one did:
 * delivery has shipped since the outer-loop scripts did, and nobody was ever asked, so an operator
 * who never read `docs/watcher.md` §6 got a desktop banner where one was available and nothing else.
 * The default therefore changes no existing behaviour — it is the *asking* that is new.
 *
 * The two questions are asked in order and the second only inside the first's yes, because an
 * endpoint is meaningless without the opt-in and the opt-in writes nothing without an endpoint. The
 * endpoint question carries no default: `askLine` answers `undefined` with none, and `undefined` is
 * what routes the run to the generator's guided-setup note rather than to a file — writing an empty
 * machine-local file would shadow a repository-side one that already has values
 * (`generators/notifications.ts`, choice 1).
 *
 * A `--push-url` passed **without** the opt-in is left in place rather than dropped here: the
 * generator owns what that means and warns about it, as it owns every other line about the artifact
 * it writes.
 */
function resolveNotifications(ctx: CommandContext, flags: InitFlags): NotificationAnswers {
  const promptCtx = { flags: ctx.flags, report: ctx.report };
  const enabled =
    flags.notifications === true ||
    askYesNo(
      {
        question: 'Set up push notifications for unattended runs?',
        defaultAnswer: false,
        flag: NOTIFICATIONS_FLAG,
        flagHint: 'to set them up without being asked',
      },
      promptCtx,
    );

  const pushUrl =
    flags.pushUrl ??
    (enabled
      ? askLine(
          {
            question: `Where should notifications be posted? (any endpoint that accepts a POST, e.g. ${GUIDED_ENDPOINT_EXAMPLE})`,
            flag: PUSH_URL_FLAG,
          },
          promptCtx,
        )
      : undefined);

  return pushUrl === undefined ? { enabled } : { enabled, pushUrl };
}

/** What detection concluded, as one line the summary can carry. */
function detectionLine(detection: DetectionResult): string {
  if (detection.matchedSignal === FORCED_SIGNAL_ID) {
    return `--preset selected the \`${detection.preset}\` layer preset, so no detection signal was evaluated`;
  }
  const evidence = detection.evidence === undefined ? '' : ` — ${detection.evidence}`;
  return `detected the \`${detection.preset}\` layer preset (signal ${detection.matchedSignal}${evidence})`;
}

/**
 * What answered for the **commands**, as the second line of the same step — the half
 * {@link detectionLine} says nothing about, because that line is a verdict on the layer preset alone.
 *
 * The two halves are decided independently (`detect/presets.ts`, `COMMAND_FAMILIES`), so a run whose
 * layer table fell to `flat:fallback` while a family answered off the root manifest reported only the
 * pessimistic half: a grep of a whole init capture for any manifest or family name returned nothing.
 *
 * **It reads {@link PresetProfile}'s recorded fields and derives none of them.** The pair naming the
 * source is {@link PresetProfile.commandManifest}'s, and which required keys that source actually
 * supplied is {@link PresetProfile.resolvedRequired}'s — both composed by `commandSourceClaim`, the
 * same composer the two detection notes use, so one run's output cannot name that source two ways
 * nor claim a key the same run warns is a placeholder. Never an entry picked out of
 * {@link PresetProfile.readManifests} by position: those two lists are ordered by different tables.
 * `readManifests` is read here for a **count** and nothing else.
 *
 * It states no rule about the search and claims nothing about whether the other manifests were
 * consulted: the collision's detail is the tiebreak note's, and the clause pointing at it is gated on
 * that note being **published** as well as raised. Raising it is `buildPreset`'s gate
 * (`readManifests.length > 1`); publishing it is the `config.kept` gate at the call site, which drops
 * `profile.notes` wholesale on a kept re-run (`generatedConfigNotes`). Reproducing the raise gate
 * alone is what let this clause point at a note the run never printed, so `kept` suppresses it.
 *
 * `kept` also decides the **verb**. Every other line of this shape asserts what a key *was written
 * as*, and a kept re-run wrote no key — the standing local rule `generators/harnessConfig.ts` gates
 * `notesIfWritten` on. So on a kept re-run this line reports what **detection resolved**, never what
 * is in effect; what is in effect is the kept file's, and `writeHarnessConfig`'s replacement note
 * says so.
 *
 * @param options.kept whether this run keeps an existing config rather than writing one — the same
 *   fact `writeHarnessConfig` computes as `kept`, derived at the call site because this line prints
 *   before that generator runs.
 */
function commandSourceLine(
  profile: PresetProfile,
  detection: DetectionResult,
  options: { readonly kept: boolean },
): string {
  const resolvedNoLine = options.kept
    ? 'this run resolved no line for commands.typecheck or commands.test'
    : 'commands.typecheck and commands.test carry placeholders';

  if (profile.commandFamily !== undefined) {
    const claim = commandSourceClaim(
      {
        family: profile.commandFamily,
        manifest: profile.commandManifest,
        resolvedRequired: profile.resolvedRequired,
      },
      options.kept ? 'detection-resolved' : 'came-from',
    );
    const others =
      !options.kept && profile.readManifests.length > 1
        ? profile.readManifests.filter((entry) => entry !== profile.commandManifest).length
        : 0;
    const collision =
      others === 0
        ? ''
        : ` — ${others} other manifest${others === 1 ? '' : 's'} init reads ${
            others === 1 ? 'is' : 'are'
          } present too, and the tiebreak note names ${others === 1 ? 'it' : 'them'} and what became of ${
            others === 1 ? 'it' : 'them'
          }`;
    return `${claim}${collision}`;
  }

  // The one positional read of this list, and it is in the arm where **no family answered**: there is
  // nothing to pair a manifest with here, only a present file to name so the placeholder pair is not
  // reported against a repository that looks empty. The prohibition is on pairing an entry with a
  // family by position ({@link PresetProfile.commandManifest}), and no arm above does that.
  const [first] = profile.readManifests;
  if (first === undefined) {
    return `no command family answered: no manifest init reads is present in ${searchedRoots(
      detection.context,
    )}, so ${resolvedNoLine}`;
  }

  const rest = profile.readManifests.length - 1;
  const alongside = rest === 0 ? '' : ` (with ${rest} other manifest${rest === 1 ? '' : 's'} init reads)`;
  return `no command family answered, so ${resolvedNoLine} — \`${first}\` is present${alongside} and supplied neither line`;
}

/**
 * The command keys the `commands` step walks, in the fixed order it prints them: the two verifiers
 * first, then the dev server, then the two unwrapped lines, then the deploy command on its own
 * object.
 *
 * Order is stated here rather than taken from `WRAPPER_SCRIPTS`, because the report covers **more**
 * than the wrapper set — `build` and `depInstall` are deliberately never wrapped
 * (`generators/scripts.ts`) and are still commands this run put into effect.
 */
const COMMAND_REPORT_ORDER: readonly (keyof HarnessCommands | 'deploy')[] = Object.freeze([
  'typecheck',
  'test',
  'devServer',
  'build',
  'depInstall',
  'deploy',
] as const);

/** The same key as a {@link WrapperKey}, or `undefined` for one of the two unwrapped keys. */
function asWrapperKey(key: keyof HarnessCommands | 'deploy'): WrapperKey | undefined {
  return WRAPPER_SCRIPTS.find((script) => script.key === key)?.key;
}

/** What a wrapped row prints in place of a command line for {@link WrapperBody}'s `unresolved` body. */
const RUNS_NO_COMMAND = 'runs no command; the wrapper reports what to fix';

/**
 * The body the wrapper **on disk** carries, or `undefined` when this run is the one that writes it.
 *
 * The path is composed from the generator's own `scriptsDir` and `file`, never parsed back out of a
 * `commands.*` value — `configuredWrapperFile`'s standing prohibition (`generators/scripts.ts`).
 * This runs while the plan is still being built, so `existsSync` answers about the repository as this
 * run found it. `--force` upgrades `create-if-absent` to overwrite-after-`.bak` (`core/writer.ts`), so
 * a forced run writes its own body and the file on disk has nothing to say.
 *
 * A read that throws is answered `unrecognised`, the same state an adopter's unreadable edit reports:
 * both mean *this command cannot say what that file runs*, and neither is a licence to guess.
 */
function keptWrapperBody(options: {
  readonly repoRoot: string;
  readonly scriptsDir: string;
  readonly file: string;
  readonly force: boolean;
}): WrapperBody | undefined {
  const path = join(options.repoRoot, options.scriptsDir, options.file);
  if (options.force || !existsSync(path)) return undefined;
  try {
    return wrapperCommandLine(readFileSync(path, 'utf8'));
  } catch {
    return { kind: 'unrecognised' };
  }
}

/**
 * One wrapped key's row: what that wrapper will run, and where that line came from.
 *
 * **The kept line and the resolved line stay two facts rather than one.** Where they differ the row
 * leads with the kept line, because that is what executes, and names the resolved one after it — an
 * adopter who edited a wrapper to correct its command and re-ran `init` is exactly the reader who
 * needs to see both, and that difference is the state `--force` exists for.
 */
function wrappedRowLine(options: {
  readonly keyPath: string;
  readonly wrapper: WrittenWrapper;
  readonly kept: WrapperBody | undefined;
  readonly dryRun: boolean;
}): string {
  const { keyPath, wrapper, kept, dryRun } = options;
  const head = `${keyPath} -> ${wrapper.invocation} ->`;
  const resolved = wrapper.unresolved ? RUNS_NO_COMMAND : wrapper.command;

  if (kept === undefined) {
    const writes = dryRun ? 'a real run would write it' : 'this run writes it';
    return `${head} ${resolved} — the line this run resolved for ${wrapper.file}; ${writes}`;
  }
  if (kept.kind === 'unrecognised') {
    return `${head} ${resolved} — the line this run resolved for ${wrapper.file}; the wrapper on disk could not be read, so what that file runs is not reported here`;
  }

  const runs = kept.kind === 'unresolved' ? RUNS_NO_COMMAND : kept.command;
  const difference =
    runs === resolved ? '' : `; this run resolved ${resolved}, and --force is what replaces the file with it`;
  return `${head} ${runs} — the line ${wrapper.file} already carries${difference}`;
}

/**
 * The residue an answered key leaves behind, as a clause, or `''` when there is none.
 *
 * The answered row says what **this run** did; this says what an earlier one left. Wrappers are
 * `create-if-absent` and no generator deletes, so a repository that had a real command — whose `init`
 * wrote the wrapper and its allow entries — and later answers the key keeps that file. The clause is
 * printed only when the file is actually there, so the row never names a residue this repository does
 * not have.
 *
 * The permission half is split on `force` because that is the flag that regenerates the profile: an
 * unforced run leaves the entries naming the file exactly where they are, and a forced one is itself
 * the run that drops them. `existsSync` answers about the repository as this run found it, so a dry
 * run reports the same residue a real one would.
 */
function answeredNoneResidue(options: {
  readonly repoRoot: string;
  readonly scriptsDir: string;
  readonly key: WrapperKey | undefined;
  readonly force: boolean;
  readonly dryRun: boolean;
}): string {
  const { repoRoot, scriptsDir, key, force, dryRun } = options;
  if (key === undefined) return '';
  const file = WRAPPER_SCRIPTS.find((script) => script.key === key)?.file;
  if (file === undefined || !existsSync(join(repoRoot, scriptsDir, file))) return '';

  const entries = force
    ? `this run ${dryRun ? 'would regenerate' : 'regenerated'} the profile without its permission entries`
    : 'its permission entries are still in the profile, and init --force is what clears them';
  return `; ${wrapperPath(scriptsDir, file)} an earlier run wrote is still on disk — nothing here deletes it — and ${entries}`;
}

/**
 * Every command line this run put in effect, one line per key — what the `commands` step prints,
 * identically in a real run and under `--dry-run`, save for the write provenance a dry run states in
 * the conditional.
 *
 * **A wrapped row's third field is the line that will *run*, which is not always the line this run
 * resolved.** Wrappers are `create-if-absent` (`generators/scripts.ts`), so over a wrapper already on
 * disk the body resolved here is discarded and the kept file keeps running its own line —
 * {@link WrittenWrapper.command} carries that caveat, and {@link keptWrapperBody} is what reads the
 * file so the row does not inherit it. Each row therefore says which of the two it printed.
 *
 * Composed from the config **in effect** plus the generator's own answer, never from detection: on a
 * kept re-run the adopter's file is what every later generator read, and it is what an unattended run
 * will execute.
 */
function commandReportLines(options: {
  readonly repoRoot: string;
  readonly config: HarnessConfig;
  readonly wrappers: WrapperScriptsResult;
  readonly force: boolean;
  readonly dryRun: boolean;
}): readonly string[] {
  const { repoRoot, config, wrappers, force, dryRun } = options;
  const lines: string[] = [];

  for (const key of COMMAND_REPORT_ORDER) {
    const wrapperKey = asWrapperKey(key);
    const keyPath = wrapperKey === undefined ? `commands.${key}` : configKeyPath(wrapperKey);
    const configured = configuredCommand(config, key);
    const wrapper = wrappers.written.find((entry) => entry.key === key);

    // Both of the next two arms are read before the wrapper lookup, for the same reason by two
    // different routes: `selectWrapper` writes no file for either value, so there is no line to
    // print behind it.

    // The placeholder first, because it is the one value that is neither a command nor a wrapper
    // invocation: `selectWrapper` writes no file for it, so there is no line to print behind it.
    if (configured !== undefined && isPlaceholder(configured)) {
      lines.push(
        `${keyPath} -> ${configured} — the placeholder init writes for a command it could not detect${
          wrapperKey === undefined ? '' : ', so no wrapper was written for it'
        }; nothing runs until it is set`,
      );
      continue;
    }

    // The sentinel next, gated on the key and not on the value's shape: `answersNone` answers for
    // `typecheck` alone, so none of the other five keys prints this row for a line this run did in
    // fact wrap and allow-list. `init` never writes the sentinel, so this row is reachable only on
    // a re-run over a config an adopter has already answered.
    if (answersNone(key, configured)) {
      lines.push(
        `${keyPath} -> ${configured} — this repository states it has no such command${
          wrapperKey === undefined ? '' : ', so no wrapper was written for it'
        }; this run allow-listed none, and nothing runs for this key${answeredNoneResidue({
          repoRoot,
          scriptsDir: wrappers.scriptsDir,
          key: wrapperKey,
          force,
          dryRun,
        })}`,
      );
      continue;
    }

    if (wrapper !== undefined) {
      const kept = keptWrapperBody({ repoRoot, scriptsDir: wrappers.scriptsDir, file: wrapper.file, force });
      if (wrapper.unresolved || configured === wrapper.invocation || configured === undefined) {
        lines.push(wrappedRowLine({ keyPath, wrapper, kept, dryRun }));
      } else {
        // Precedence 1 of `resolveBody`: the key holds a raw line, and this run inlines it into the
        // wrapper the permission profile allow-lists — but only where that file is not already there,
        // which is `create-if-absent`'s whole contract.
        const inlined =
          kept === undefined
            ? `, which this run ${dryRun ? 'would inline' : 'inlined'} into ${wrapper.file}: the wrapper is the form the permission profile allow-lists`
            : kept.kind === 'unrecognised'
              ? `; ${wrapper.file} is already on disk and could not be read, so what that file runs is not reported here`
              : `; ${wrapper.file} is already on disk and carries ${
                  kept.kind === 'unresolved' ? RUNS_NO_COMMAND : kept.command
                }, and --force is what replaces the file with this line`;
        lines.push(`${keyPath} -> ${configured} — a raw command line${inlined}`);
      }
      continue;
    }

    // No wrapper: either one of the two keys that are never wrapped, or an optional wrapped key this
    // repository set no line for — which prints nothing at all.
    if (configured === undefined) continue;
    lines.push(
      `${keyPath} -> ${configured} — run as configured; this key is not wrapped and is not allow-listed`,
    );
  }

  return lines;
}

/** What {@link resolveDetectionAppDir} answers with. */
interface DetectionAppDir {
  /** The value handed to `detectPreset` — repo-relative, `.` when the repository is the application. */
  readonly appDir: string;
  /**
   * Which rung **answered**, which is not always the rung that was consulted: a configured value the
   * screen below rejected reports `'default'`, because `.` is the directory detection actually
   * probed. A required field rather than something a reader infers from the two optional message
   * fields — a caller gating on the silent rung-3 case would be disarmed the first time a rung gains
   * a message.
   */
  readonly source: AppDirSource;
  /** A line for the run's notes block, on the rung that has something to say. */
  readonly note?: string;
  /** A line for the run's warnings block, when a configured value could not be used. */
  readonly warning?: string;
}

/** True when `path` names a directory that is there — the second half of the rung-2 screen. */
function isDirectory(path: string): boolean {
  return statSync(path, { throwIfNoEntry: false })?.isDirectory() === true;
}

/**
 * The `appDir` **stack detection probes**, in one settled order:
 *
 * 1. {@link APP_DIR_FLAG}, this command line's own statement;
 * 2. {@link CONFIG_FILENAME}'s `appDir` — the tree the repository already declares;
 * 3. `.`, the repository as its own application.
 *
 * Rung 2 is what this function exists for. The sole `detectPreset` call read the flag or `.` and
 * never the file, which both JSDoc blocks on the receiving end already documented it as reading
 * (`detect/signals.ts`, `DetectContext`'s constructor and `detectPreset`). Without it a plain re-run on a
 * nested-app repository detects the *root's* layout and reports it beside layers read from the kept
 * config, and `init --reset-config` — the path this CLI prescribes for rebuilding a configuration —
 * re-derives every layer scope under `.`, forgetting an application directory that was `init`'s own
 * output, with no line of output naming what was lost.
 *
 * **The two bad-value arms are deliberately asymmetric, and that asymmetry is the point.** A
 * flag-sourced value outside the repository keeps `DetectContext`'s hard refusal — it is a typo
 * or a mis-scoped invocation, and this function does not screen it. Anything **config**-sourced —
 * a value that cannot be used, and equally a file that cannot be read at all — falls back to `.`
 * with a warning instead: `--reset-config` is the documented route to repair a broken configuration,
 * so a refusal sourced from the very file being rebuilt would make a repository with a bad `appDir`
 * unrepairable by the one command documented to repair it. Silence is the arm that is not available
 * on any of them: `.` re-derives every layer scope under the repository root.
 *
 * Modelled on `resolveDefaultBranch` (`generators/harnessConfig.ts`), the shipped precedent for a
 * per-rung resolver that reports **which rung answered** rather than only the value.
 */
function resolveDetectionAppDir(repoRoot: string, flags: InitFlags): DetectionAppDir {
  // Rung 1, and silent: the flag is on the adopter's own command line, so a note restating it tells
  // them nothing they cannot already see.
  if (flags.appDir !== undefined) return { appDir: flags.appDir, source: 'flag' };

  // Rung 2. `loadConfig` never throws — an absent or malformed file is reported as a problem and
  // answers `config: undefined` (`config/io.ts`). The type check is not redundant with that: the
  // returned type is an assertion about the parsed value rather than a guarantee.
  const loaded = loadConfig(repoRoot);
  const configured = loaded.config?.appDir;
  if (typeof configured !== 'string' || configured === '') {
    // A file that is there but did not parse is not the same answer as no file at all, and the two
    // are told apart here because `--reset-config` — the documented repair for exactly that file —
    // is the run that reaches this branch: a silent `.` re-derives every layer scope under the root
    // while the rebuild note says the application directory survived. Third arm of the same screen
    // the two bad-value rejections below carry, and it warns for the same reason they do.
    if (loaded.config === undefined && configExists(repoRoot)) {
      return {
        appDir: '.',
        source: 'default',
        warning: `${CONFIG_FILENAME} is present at ${loaded.path} but could not be read, so no configured appDir answered and stack detection probed the repository root instead: ${loaded.problems.map(formatProblem).join('; ')}. Every layer scope this run derives is under the repository root: re-run with ${APP_DIR_FLAG} <dir> to name the application directory this repository actually has`,
      };
    }
    return { appDir: '.', source: 'default' };
  }

  const absolute = resolve(repoRoot, configured);
  const rejection = !insideRepo(repoRoot, absolute)
    ? 'resolves outside the repository'
    : isDirectory(absolute)
      ? undefined
      : 'names no directory that is there';
  if (rejection !== undefined) {
    // `source` is `'default'` rather than `'config'`: the file was consulted, and `.` is what
    // answered.
    return {
      appDir: '.',
      source: 'default',
      warning: `${CONFIG_FILENAME} sets appDir to ${JSON.stringify(configured)}, which ${rejection}, so stack detection probed the repository root instead — refusing here would leave a repository with a bad appDir unrepairable by \`${INIT_VERB} --reset-config\`, which is the documented way to rebuild that file. Every layer scope this run derives is under the repository root: re-run with ${APP_DIR_FLAG} <dir> to name the application directory this repository actually has`,
    };
  }

  return {
    appDir: configured,
    source: 'config',
    // Worded to stay true of the `.` an already-wired flat repository carries: it says which rung
    // the value came from, not that the value differs from the root.
    note: `stack detection probed ${JSON.stringify(configured)} — the appDir ${CONFIG_FILENAME} already declares — rather than a directory given on this command line; ${APP_DIR_FLAG} <dir> overrides it, and \`${APP_DIR_FLAG} .\` points detection at the repository root`,
  };
}

/**
 * The directory this run was **invoked in**, repo-relative — and `undefined` when that is the
 * repository root itself, which is the ordinary case and has nothing to report.
 *
 * `realpathSync` rather than `ctx.cwd` as it was spelled, for the reason
 * {@link resolveTargetRepository}'s `--dry-run` arm resolves the same value: git answers with the
 * physical path, and a caller's directory may reach it through a symlink (`os.tmpdir()` and `/var` on
 * macOS are two). A lexical comparison against an unresolved `cwd` would call an ordinary root-level
 * run nested and print the lines below on every one of them.
 *
 * Outside the root is `undefined` too, and unreachable rather than handled: the root came from a
 * probe of this very directory ({@link resolveTargetRepository}), so a `cwd` outside it is a state no
 * invocation produces.
 */
function invocationBelowRoot(ctx: CommandContext, repoRoot: string): string | undefined {
  const invokedIn = realpathSync(ctx.cwd);
  if (!insideRepo(repoRoot, invokedIn)) return undefined;
  const rel = normalizeRepoDir(relative(repoRoot, invokedIn));
  return rel === '.' ? undefined : rel;
}

/**
 * The source directories the config **in effect** covers with no layer, as one note — or `undefined`
 * where there are none to name.
 *
 * **The set and the remedy are both somebody else's**: `core/layerCoverage.ts` derives the
 * directories, `core/nameList.ts` renders them and `core/layerGapRemedy.ts` composes what to do
 * about them, all three shared with `doctor`'s `layer-drift` check. This function decides only that
 * `init` says it, and the two commands are then one statement rather than two findings — which is
 * the whole point: before this line, a gap in a detected profile appeared in `doctor` alone, so an
 * adopter who read `init` and never ran `doctor` learned nothing about it.
 *
 * **A note, never a warning.** A freshly detected repository routing one directory to the catch-all
 * is an ordinary adoption outcome, and this command's warnings are reserved for what needs fixing.
 *
 * **Nothing is said where `layerCoverage` does not grade**: that state is the catch-all-only profile,
 * which `buildPreset` already warns about and `LAYER_PROFILE_CHECK` reports as itself, and a second
 * line here would report it twice.
 */
function layerGapNote(repoRoot: string, config: HarnessConfig): string | undefined {
  const { graded, appDir, candidates, uncovered } = layerCoverage({ repoRoot, config });
  if (!graded || uncovered.length === 0) return undefined;

  const one = uncovered.length === 1;
  const clause = recordedVerdictClause(config.detection?.review);
  const remedy = layerGapRemedy({ review: config.detection?.review, analyzeCommand: ANALYZE_COMMAND, cli: CLI });
  return (
    `${uncovered.length} of the ${candidates.length} source directories under \`${appDir}\` ${one ? 'is' : 'are'} covered by no layer and ${one ? 'routes' : 'route'} to the catch-all: ${nameList(uncovered)} — an implementer and a reviewer working there are handed the shared cross-layer document rather than that layer's own rules.` +
    `${clause === undefined ? '' : ` ${clause}.`} ${remedy}. \`${DOCTOR_COMMAND}\`'s \`layer-drift\` check reports this same set, so the two commands are one statement rather than two findings`
  );
}

/**
 * Wire one repository: detect, build the whole write plan bottom-up, apply it once, report what
 * happened, and end by pointing at the analyze command.
 *
 * The generator order below is load-bearing and is stated in one place, here: the config first
 * because everything after it reads the config **in effect**; the wrapper scripts and then the
 * outer-loop scripts, because the profile allow-lists their literal paths and both land in the
 * configured `scriptsDir`; the state tree and the conventions stubs; the profile;
 * the committable project settings; the repository-root files; the account's own push-notification
 * settings, which are the one target outside the repository and are ordered here only because their
 * question is the last one the run puts; and the git hook last, with
 * `core.hooksPath` pointed at it only **after** the plan has been applied and the hook it enables
 * therefore exists — and after that, in a repository that has no commit yet, the first commit
 * ({@link commitGeneratedFiles}).
 */
async function run(ctx: CommandContext): Promise<number> {
  const flags = parseInitFlags(ctx.argv);

  // Settled from the flags alone, and therefore ahead of the git gate: `resolveTargetRepository` may
  // create a repository, and a refusal raised after it would leave one behind in a directory this run
  // then declined to wire — the harm {@link parseQaDriver} is checked inside the parser to avoid.
  assertUsableStateDir(flags.stateDir);
  const forcedPreset = flags.preset === undefined ? undefined : parsePresetName(flags.preset);

  // Every precondition that needs the repository is settled here, before a generator is called and
  // therefore before anything is enqueued: a plan that is never built cannot be half-applied. The
  // first is settled by an answer — the flag, a prompt, or the non-interactive default — the second
  // by a check against the root that answer resolved.
  const target = resolveTargetRepository(ctx, flags);
  const repoRoot = target.root;
  assertNotHarnessOwnRepository(repoRoot);

  // The one fact the rest of this run is relative to, named before any of it: every path below is
  // under this root, and until this line an adopter standing in a subdirectory had ninety lines of
  // output and nothing saying where they landed. A **step** rather than a note, and the same shape
  // `doctor` opens with (`commands/doctor.ts`'s `checks (<root>)`), so the two commands name a
  // repository the same way — a note would print at the end, after the reader has already read the
  // run relative to an unnamed root. `--quiet` suppresses it with the rest of the narration, which is
  // correct: a quiet run has no reader to orient.
  ctx.report.step(`wiring (${repoRoot})`);

  // Settled before anything is reported, and after the refusals above so nothing is enqueued if this
  // one refuses too — a flag-sourced value outside the repository still throws out of
  // `DetectContext` ({@link resolveDetectionAppDir}). The whole answer stays in scope rather than
  // only its value: `appDir.source` is what a later reader gates on, and it is the only carrier of
  // which rung produced the directory detection probed.
  const appDir = resolveDetectionAppDir(repoRoot, flags);
  const detection = detectPreset(repoRoot, appDir.appDir, forcedPreset);
  const profile = buildPreset(detection);

  // Collected rather than printed as they arrive, so the run reports its actions first and its
  // caveats after them — a warning raised by the first generator is otherwise scrolled off by the
  // hundred action lines that follow it.
  const warnings: string[] = [];
  // `target.notes` leads: it is a repository fact, true whichever config this run ends up with, and
  // it stays unconditional.
  const notes: string[] = [...target.notes];

  // The four detection lists, held back rather than seeded: every line in them describes the config
  // this run **generated**, which `writeHarnessConfig` discards on a kept re-run — a placeholder
  // warning naming a key the kept file resolved, a note naming the manifest a `commands.*` value the
  // kept file does not hold was derived from. Warnings and notes move behind one `config.kept` gate
  // below for that one reason, and neither may be pinned here as unconditional.
  const generatedConfigWarnings = [...detection.warnings, ...profile.warnings];
  const generatedConfigNotes = [...detection.notes, ...profile.notes];

  // The resolver's own two lines are statements about **this invocation** — which rung supplied the
  // directory detection probed, and what a configured value that could not be used cost — so they are
  // unconditional, like `target.notes` and unlike the four lists above them: both stay true of a
  // re-run that keeps the very file rung 2 read. Same rule as the sink split in
  // `generators/harnessConfig.ts`'s `buildConfig`, one level up.
  if (appDir.warning !== undefined) warnings.push(appDir.warning);
  if (appDir.note !== undefined) notes.push(appDir.note);

  // Two more statements about **this invocation**, and unconditional for the same reason those two
  // are. Both are gated on `appDir.source` — the field, never the absence of the two message
  // fields ({@link DetectionAppDir}) — so an adopter who has already answered the application-directory
  // question, on this command line or in the file, is not told to answer it again.
  //
  // The first is a **note**: wiring the root is what `init` is supposed to do from anywhere inside the
  // repository, and a warning that fires on every correct run is how a warning list stops being read
  // (`generators/harnessConfig.ts`). The second is a warning, and only where detection recognised
  // nothing — in a repository that nests its application that is the one case where the silent `.`
  // is the likeliest *cause* rather than an incidental fact. It is pushed as a second line rather than
  // folded into `FLAT_FALLBACK_WARNING`, which is detection's and knows nothing about the directory
  // this command was invoked in (`detect/signals.ts`).
  const invokedIn = invocationBelowRoot(ctx, repoRoot);
  if (invokedIn !== undefined && appDir.source === 'default') {
    notes.push(
      `init was run in ${invokedIn} and wired the repository at ${repoRoot}, which is where every file it writes lands; appDir is ${JSON.stringify(appDir.appDir)}, because no application directory this run could use was named. If ${invokedIn} is the application, re-run with ${APP_DIR_FLAG} ${invokedIn}`,
    );
    if (detection.matchedSignal === FLAT_FALLBACK_SIGNAL_ID) {
      warnings.push(
        `no detection signal matched, so the \`flat\` preset caught this run — and stack detection probed the repository root while init was run in ${invokedIn}. Where a repository nests its application, an application that was never named is the likeliest reason nothing is recognised: re-run with ${APP_DIR_FLAG} ${invokedIn} to detect that tree instead, before reaching for ${ANALYZE_COMMAND}`,
      );
    }
  }

  // The third statement about **this invocation**, and the one that reaches the repository the
  // finding is actually about: an application that sits entirely in one subdirectory, adopted from
  // the root with a `flat` fallback and a placeholder for both required commands, where nothing in
  // the output named the subdirectory or the flag that would detect it.
  //
  // Gated on the same `appDir.source === 'default'` the two lines above are — an adopter who has
  // already named an application directory is not asked again — plus the fallback, because a
  // recognised layout is not a repository that failed to see its application. The third condition is
  // the block above: where the run was started **at or below** the directory this probe would name,
  // that block already points into that tree, and two `--app-dir` remedies for one condition is worse
  // than the duplication this condition exists to prevent.
  //
  // A **note**, never a warning: a repository is not at fault for nesting its application, and this
  // run is otherwise correct. Printed on `--dry-run` as on a real run, like the two lines above it,
  // because it is a statement about what this invocation detected rather than about what it wrote.
  if (detection.matchedSignal === FLAT_FALLBACK_SIGNAL_ID && appDir.source === 'default') {
    const nested = findNestedApplicationDir(repoRoot);
    // `findNestedApplicationDir` only ever names a direct child of the root, so the equality leg
    // covers every directory it can return; the `startsWith` leg is for the *invocation* side — a
    // run started deeper than that child (`service/api` under a probed `service`).
    const startedInside =
      invokedIn !== undefined &&
      nested !== undefined &&
      (invokedIn === nested.dir || invokedIn.startsWith(`${nested.dir}/`));
    if (nested !== undefined && !startedInside) {
      notes.push(
        `no detection signal matched at the repository root, and \`${nested.dir}\` holds \`${nested.manifest}\` — a manifest init reads — so the application may be that directory rather than the repository. Nothing here adopts it: which directory is the application is your statement, not a detection result. Re-run with \`${APP_DIR_FLAG} ${nested.dir}\` to point detection at that tree instead`,
      );
    }
  }

  // Both halves of detection, in one step: the layer preset, then what answered for the commands.
  // The second line is a statement about what **this invocation** detected rather than about what it
  // wrote, so it is printed on `--dry-run` exactly as on a real run — and `--quiet` suppresses it with
  // the rest of the narration, which needs no code here (`core/report.ts`).
  //
  // `writeHarnessConfig` computes the same fact as `kept` (`generators/harnessConfig.ts`), and it is
  // derived a second time here rather than read off `config` because this step prints **before** that
  // generator runs. Moving the line below the generator would separate it from its own step heading.
  // It governs both of the second line's claims: what the two command keys were resolved *as*, and
  // whether the tiebreak note it points at is published at all.
  const configKept = !flags.resetConfig && configExists(repoRoot);

  ctx.report.step('stack detection');
  ctx.report.info(detectionLine(detection));
  ctx.report.info(commandSourceLine(profile, detection, { kept: configKept }));

  const plan = new WritePlan();

  const config = writeHarnessConfig({
    repoRoot,
    detection,
    preset: profile,
    flags,
    plan,
    // No `force:` — the run's `--force` is not an input to this generator (`harnessConfig.ts`).
    // `plan.apply` below still passes it, so it governs every other create-if-absent artifact.
    resetConfig: flags.resetConfig,
    // Wording only — the decision above is mode-independent (`harnessConfig.ts`).
    dryRun: ctx.flags.dryRun,
    // Wording only too, and the rung rather than the value: the start-over note may claim `appDir`
    // was re-read from the file being rebuilt only where rung 2 answered.
    appDirSource: appDir.source,
    // Lazy on purpose: the generator calls it only while the interactive test phase is on and only
    // when `--qa-driver` did not already answer, so no run that did not need the question is asked
    // it. It is put here, after the detection line has been printed, because the question
    // back-references it ({@link askQaDriver}) — "the detected preset" names nothing an adopter who
    // has not read that line can resolve.
    askDriver: () => askQaDriver(ctx),
  });
  // `kept` is known only now, so this is where the four held-back lists are published or dropped —
  // ahead of `config.warnings`, which is the order they printed in before they were gated. A kept
  // re-run gets one note in their place instead of silence, and the kept file's own warnings come
  // from `writeHarnessConfig`, which reports them from the config check.
  //
  // This note is about **this run's detection**: the preset and command lines it produced went
  // unwritten. What the kept file puts in force is `writeHarnessConfig`'s own replacement note to
  // say, in the same block, and the two must stay distinct rather than converge on one sentence.
  //
  // The warning beside it is about **this command line**: which flags of it were dropped. It does
  // not repeat the note — one is about a detection nobody asked for, the other about values somebody
  // typed — and it is a warning rather than a third note for the reason its own header gives.
  if (config.kept) {
    notes.push(
      `stack detection ran to answer what ${CONFIG_FILENAME} already answers, so the preset and command lines it detected were not written and the values in that file are the ones in effect; re-run with --reset-config to rebuild the file from this run's detection`,
    );
    const discarded = discardedConfigFlagsWarning(flags);
    if (discarded !== undefined) warnings.push(discarded);
  } else {
    warnings.push(...generatedConfigWarnings);
    notes.push(...generatedConfigNotes);
  }

  warnings.push(...config.warnings);
  notes.push(...config.notes);

  // The config **in effect** from here on: freshly built, or the adopter's own when a re-run kept
  // the file that was already there.
  const effective = config.config;

  // Unconditional on `config.kept`, unlike the four detection lists above: this is derived from the
  // config **in effect**, so it stays true of a re-run that kept the adopter's own file — and that
  // population is the one that can carry a recorded review, which the note's remedy is fitted to.
  // Printed on `--dry-run` as on a real run, because it describes what this invocation detected.
  const layerGap = layerGapNote(repoRoot, effective);
  if (layerGap !== undefined) notes.push(layerGap);

  const wrappers = writeWrapperScripts({ repoRoot, config: effective, rawCommands: profile.rawCommands, plan });
  warnings.push(...wrappers.warnings);

  // What this run put in effect, before the file log rather than after it, so the reader has the
  // command lines in hand while reading which wrappers were written. Narration — `step` and `info`,
  // suppressed by `--quiet` like the rest of the action log (`core/report.ts`) — and no line of it
  // reaches `notes` or `warnings`, which stay the caveat channels. It is composed while the plan is
  // being built and writes nothing, so `--dry-run` prints the same rows over the same repository
  // state; the one thing it says differently is the write provenance, in the conditional.
  const commandLines = commandReportLines({
    repoRoot,
    config: effective,
    wrappers,
    force: ctx.flags.force,
    dryRun: ctx.flags.dryRun,
  });
  if (commandLines.length > 0) {
    ctx.report.step('commands');
    for (const line of commandLines) ctx.report.info(line);
  }

  // Immediately after the wrappers, into the same directory: the outer-loop scripts and the library
  // they source. Unlike the wrappers these are **not** configurable command lines — they carry no
  // token at all and read `harness.config.json` at run time — so a re-run leaves an adopter's edited
  // script byte-identical and `--force` regenerates it only after a `.bak`. They are written before
  // the permission profile for the same reason the wrappers are: the profile allow-lists the literal
  // paths of the agent-invocable ones, and a profile written first would name files that do not
  // exist (`generators/outerLoopScripts.ts`).
  const outerLoop = writeOuterLoopScripts({ repoRoot, config: effective, plan });
  notes.push(...outerLoop.notes);

  const state = writeStateDir({ repoRoot, config: effective, plan });
  notes.push(...state.notes);

  // The third of the four questions this run puts, and settled here because its answer is an
  // *input* to the generator below: that generator enqueues the banner while the plan is being
  // built, so a resolution taken afterwards would be reading a decision it was supposed to make.
  const analyze = resolveAnalyzeOffer(ctx, flags, repoRoot, effective);
  notes.push(...analyze.notes);

  const context = writeClaudeContext({
    repoRoot,
    config: effective,
    plan,
    // The offer's whole material effect on what is written: which of the two banner wordings the
    // generated always-loaded file carries, each ending in its own disposal sentence.
    analyzeOffer: analyze.offer,
    // The run's `--force`, because it is half of what decides whether the setup-pending banner
    // reached an always-loaded project file that was already there: an unforced run keeps that file
    // and the generator notes that no banner was written into it, a forced one regenerates it from
    // the template after a `.bak`.
    force: ctx.flags.force,
    // The run's `--dry-run`, which changes that note's tense and nothing else, the same contract
    // `analyzeRecordSentence` keeps for the closing pointer: both sentences print on one run, so a
    // dry run that reports a keep it did not make contradicts the line under it.
    dryRun: ctx.flags.dryRun,
  });
  warnings.push(...context.warnings);
  notes.push(...context.notes);

  const permissions = writePermissionProfile({
    repoRoot,
    config: effective,
    plan,
    // Authoritative: the profile may allow-list only what these two generators actually wrote — the
    // wrappers in full, and the outer-loop rows their own `agentInvocable` flag says an agent runs.
    written: wrappers.written,
    writtenOuterLoop: outerLoop.written,
    ...(flags.referenceToolchainPath === undefined
      ? {}
      : { referenceToolchainPath: flags.referenceToolchainPath }),
    // The run's `--force`, because it is the only run that replaces the profile: the generator reads
    // the file it is about to overwrite and carries forward the plugin-root entries `doctor` told the
    // adopter to paste in by hand, which nothing here can regenerate.
    force: ctx.flags.force,
    // The run's `--dry-run`, which changes that report's tense and nothing else — the same contract
    // the project-file generator above keeps.
    dryRun: ctx.flags.dryRun,
  });
  warnings.push(...permissions.warnings);
  notes.push(...permissions.notes);

  const settings = writeProjectSettings({ repoRoot, plan, flags });
  warnings.push(...settings.warnings);
  notes.push(...settings.notes);

  const repoFiles = writeRepoRootFiles({ repoRoot, config: effective, plan });
  notes.push(...repoFiles.notes);

  // The one generator whose target is outside the repository — the account's own push-notification
  // settings — and therefore the one place `init` asks a question whose answer nothing in the
  // repository records. It is enqueued into the same plan as everything else, so `--dry-run` skips
  // it for the same structural reason it skips the rest.
  const notifications = writeNotifications({
    repoRoot,
    config: effective,
    plan,
    ...resolveNotifications(ctx, flags),
  });
  notes.push(...notifications.notes);
  warnings.push(...notifications.warnings);

  const hooks = writeGitHooks({
    repoRoot,
    config: effective,
    plan,
    // The one input to the generator's re-render arm: this run rebuilt the config the hook is
    // rendered from, so a hook whose `case` label the rebuild made wrong is re-rendered on the same
    // run instead of waiting for a separate --force. The run's `--force` is not passed and is not
    // an input — `plan.apply` below still carries it, so it governs this artifact as it always did.
    configRebuilt: flags.resetConfig,
    // Wording only — the decision above is mode-independent (`generators/githooks.ts`).
    dryRun: ctx.flags.dryRun,
  });
  warnings.push(...hooks.warnings);
  notes.push(...hooks.notes);

  ctx.report.step(ctx.flags.dryRun ? 'files (dry run — nothing is written)' : 'files');
  plan.apply({ repoRoot, report: ctx.report, dryRun: ctx.flags.dryRun, force: ctx.flags.force });

  // After the plan, deliberately: this is the one git-configuration write, and pointing
  // `core.hooksPath` at a directory whose hook has not landed yet would enable nothing.
  const hooksPath = pointHooksPath({ repoRoot, githooksDir: hooks.githooksDir, dryRun: ctx.flags.dryRun });
  warnings.push(...hooksPath.warnings);
  notes.push(...hooksPath.notes);

  // The second post-plan step, and after the plan for a reason of its own: the managed `.gitignore`
  // block that decides what `git add -A` may stage arrived with the plan. Before the summary, so the
  // commit is reported inside the run's action log rather than after its closing pointer.
  warnings.push(...commitGeneratedFiles(ctx, target));

  ctx.report.summary();
  reportLines(ctx, notes, warnings);
  // `settings` carries the two facts step 1 states — the composite key and the resolved slug — so the
  // report is worded against what this run's plan actually held rather than against a second
  // resolution taken here.
  reportNextSteps(
    ctx,
    effective.layers.map((layer) => layer.name),
    analyze,
    ctx.flags.force,
    ctx.flags.dryRun,
    // The generator's fact, not a second reading: by the time this prints, the plan has been applied
    // and "did the bytes on disk differ from the ones this run rendered" is no longer answerable.
    context.claudeMdBackupWouldCarryContent,
    // The second fact only the generator can supply, and for the same reason: once the plan has been
    // applied, "was a .bak there before this run" is no longer answerable either.
    context.claudeMdBackupExisted,
    settings,
    effective.phases?.qa === true,
    // The second gate, and a different question from the one above it: whether this run declared any
    // browser wiring at all. Taken from the one predicate the two generators that write that wiring
    // read, never re-spelled here (`config/model.ts`).
    browserWiringApplies(effective),
  );

  return EXIT.OK;
}

/**
 * The caveats, after the action log: the informational lines first, then the ones needing attention.
 *
 * Warnings go to stderr and print even under `--quiet`, which is the reporter's contract and the
 * whole of what makes a quiet run silent unless something wants a human (`core/report.ts`).
 *
 * **One blank line between entries, and only between them.** Each note is a paragraph of several
 * sentences, and a dozen of them run together as one block otherwise. The heading keeps its first
 * note and nothing trails the block, so the separator marks where an entry ends rather than padding
 * the report.
 */
function reportLines(ctx: CommandContext, notes: readonly string[], warnings: readonly string[]): void {
  if (notes.length > 0) {
    ctx.report.step('notes');
    notes.forEach((note, index) => {
      if (index > 0) ctx.report.info('');
      ctx.report.info(`- ${note}`);
    });
  }
  for (const warning of warnings) ctx.report.warn(warning);
}

/**
 * Where the answer was recorded — keyed on **what the write engine actually did** to the
 * always-loaded file rather than on the answer alone, so no wording asserts a record the tree does
 * not carry.
 *
 * That file is `create-if-absent`, and `--force` upgrades exactly that policy to
 * overwrite-after-backup (`core/writer.ts`), so there are **three** outcomes and not two: *created*,
 * so the banner is in the file; *overwritten under `--force`*, so it is re-written and the previous
 * file survives only as its single `.bak`; and *kept*, so nothing was written into it at all. Nothing
 * here words anything as if `--force` could not reach this file.
 *
 * **The forced outcome has two wordings, and `claudeMdBackupWouldCarryContent` is which.** The
 * generator fixes `forceOverride: 'never'` on a file whose bytes already are the text it would write
 * (`generators/claudeContext.ts`), because that write would put nothing in the `.bak` and destroy
 * whatever is in the one already there. So the promise "anything a previous pass had filled into it is
 * in that `.bak` alone" is true of the run that overwrote the file and false of the run that kept it —
 * on which the `.bak` was never touched and still holds what the previous forced pass rescued. Only
 * the generator holds the rendered text, so the fact is taken from its result rather than recomputed.
 *
 * **The keep splits again on `claudeMdBackupExisted`.** A plain `init` followed by `init --force`
 * renders the same bytes twice, so the keep fires with no `.bak` ever written; that arm says no
 * backup was made instead of promising a surviving copy of content that was never displaced.
 *
 * **The conventions documents are a fourth fact, not a fourth outcome.** `--force` puts every filled
 * one back to a skeleton after its own `.bak` whatever happened to the always-loaded file, so that
 * clause is keyed on `filledConventions` alone and appended to whichever wording is true — this run's
 * report is the only carrier of it, `doctor` never names the `.bak` files.
 *
 * On the kept outcome the run itself is the carrier of the answer, and `doctor`'s `setup-analysis`
 * check is the standing one — it reads the unfilled markers rather than the banner. Nothing here
 * writes, patches or re-inserts anything.
 *
 * **`--dry-run` changes the tense and nothing else.** The outcome is computed from the same real
 * facts, so a dry run reports which wording it *would* have recorded and whether it would have been
 * recorded at all — `docs/cli.md` §1's contract read in its other direction, where a dry run may no
 * more claim a record it did not make than omit one a real run would. Two verb tokens rather than a
 * second set of wordings, which would drift from this one.
 */
function analyzeRecordSentence(
  analyze: AnalyzeOfferResolution,
  force: boolean,
  dryRun: boolean,
  backupWouldCarryContent: boolean,
  backupExisted: boolean,
): string {
  const records = dryRun ? 'would record' : 'records';

  const recorded =
    analyze.offer === 'accepted'
      ? `The setup-pending banner in ${CLAUDE_MD_PATH} ${records} that answer, so running it is the next session's first action.`
      : `The banner in ${CLAUDE_MD_PATH} ${records} that the analysis was declined — the conventions documents are yours to write by hand, ${ANALYZE_COMMAND} is still there if you change your mind, and the banner's own last sentence says how to be rid of the block.`;

  // What the forced run did to the **conventions documents**, computed from `filledConventions`
  // alone and never gated on the project file: the two are independent facts, and a first forced
  // `init` over hand-written rules — no project file yet — is the run that most needs to be told.
  // Said in one clause and given its subject at each of the two call sites below.
  const putBack =
    !force || analyze.filledConventions.length === 0
      ? ''
      : `${dryRun ? 'would also put' : 'also put'} ${analyze.filledConventions.join(', ')} back to skeletons after their own .bak siblings, so the analysis has to be run again — or those .bak files restored.`;

  if (!analyze.claudeMdExisted) return putBack === '' ? recorded : `${recorded} --force ${putBack}`;

  if (force) {
    // The forced re-run says what it did to the tree rather than what it found — which is the
    // counterpart of the skip branch's condition (2a): no run can both regenerate these documents and
    // report them as already filled.
    //
    // The keep is not a third answer about the *banner*: the file was kept because its bytes already
    // are the ones this run renders, banner included, so `recorded` is true of it by identity — an
    // adopter answering the offer differently between two runs renders different text, the file is
    // then not identical, and the arm above is the one that fires.
    if (!backupWouldCarryContent) {
      // And the keep itself has two wordings, because the `.bak` it leaves alone may not exist: a
      // plain `init` followed by `init --force` renders the same bytes both times, so the keep fires
      // in a tree where nothing was ever backed up. Naming a surviving copy there sends an adopter
      // after a file that is not on disk — the same defect class as the sentence this arm replaced.
      const backup = backupExisted
        ? ` and ${dryRun ? 'would leave' : 'left'} ${CLAUDE_MD_PATH}.bak alone — whatever a previous pass had filled into this file is still in that .bak`
        : `, and ${dryRun ? 'would write' : 'wrote'} no ${CLAUDE_MD_PATH}.bak, because there was nothing to back up`;
      return `${recorded} ${CLAUDE_MD_PATH} ${dryRun ? 'is' : 'was'} already byte-identical to the file this run generates, so --force ${dryRun ? 'would keep' : 'kept'} it${backup}, and ${ANALYZE_COMMAND} is what fills this one again.${putBack === '' ? '' : ` It ${putBack}`}`;
    }
    return `${recorded} --force ${dryRun ? 'would regenerate' : 'regenerated'} that whole file from the template after a single ${CLAUDE_MD_PATH}.bak, so anything a previous pass had filled into it ${dryRun ? 'would be' : 'is'} in that .bak alone.${putBack === '' ? '' : ` It ${putBack}`}`;
  }

  const kept = `${CLAUDE_MD_PATH} was already there and this run was not forced, so it ${
    dryRun ? 'would be kept' : 'was kept'
  } as it stands and nothing ${dryRun ? 'would be' : 'was'} recorded in it`;
  // The skip branch is read **before** `offer`, which is a placeholder there and not an answer: it
  // only ever reaches this outcome (unforced, and the file was already there), and the declined
  // wording below would tell an adopter whose documents are all written to write them by hand.
  if (analyze.nothingToFill) {
    return `${kept}: every conventions document is already written, so there was nothing to offer — \`${DOCTOR_COMMAND}\` names what is still unfilled at any time, and ${ANALYZE_COMMAND} revises a document whenever you want one revised.`;
  }

  return analyze.offer === 'accepted'
    ? `${kept}: tell the next session to run ${ANALYZE_COMMAND}, and \`${DOCTOR_COMMAND}\` names what is still unfilled at any time.`
    : `${kept}: the conventions documents are yours to write by hand, ${ANALYZE_COMMAND} is still there if you change your mind, and \`${DOCTOR_COMMAND}\` names what is still unfilled at any time.`;
}

/**
 * The closing report — step C of the install story — printed last and on every run that got here,
 * whatever was written and whatever the phases are. Four numbered steps in the order an adopter
 * performs them, and one pasteable line under the second. The step count does not move with the
 * phases (`docs/cli.md` §2 states it): the one phase-gated part of this report is a clause *inside*
 * step 4, never a fifth step.
 *
 * {@link INIT_VERB} deliberately stops short of the judgement calls: it detected a layout from file
 * existence alone and wrote skeletons for the conventions documents, and turning those into this
 * project's actual rules is the analyze command's. Saying so here is what keeps a freshly wired
 * repository from being mistaken for a finished one. The generated config is named because it is the
 * file the adopter edits to correct anything above.
 *
 * **Step 1 is the plugin wiring, and it is first because the ordering was the defect.** The report
 * used to open by telling every adopter to run a command that exists only in a session which resolves
 * this package's plugin, with the precondition for it stated nowhere above the instruction. An
 * ordered sequence is the fix rather than an annotation: the step that makes the command exist cannot
 * come after the step that runs it.
 *
 * **It states what *this run wrote*, never what this machine already has.** `init` cannot see the host
 * tool's install state — that lives in a user-level registry this command neither reads nor writes —
 * and probing for it would make the output a function of the machine rather than of the flags and the
 * repository — the determinism that lets a second `init` over the same repository produce the same
 * result and an adopter re-derive the recorded preset by hand (`docs/cli.md` §2). So the line
 * reports the keys the plan carried and stops: the enablement key always, the
 * `extraKnownMarketplaces` entry only where the owner slug resolved
 * (`generators/projectSettings.ts`). The unresolved arm names the flag, the slug shape and the
 * marketplace from that generator's own constants, so this line and the warning an adopter reads a
 * few lines earlier cannot drift apart. Under `--dry-run` it takes the conditional the rest of the
 * report keeps (`docs/cli.md` §1) — the `/reload-plugins` pointer included, which is why that clause
 * belongs to each arm rather than to the printed line: a dry run merged nothing to reload, and the
 * unresolved arm can offer it only after one of the two routes it names is taken.
 *
 * **Step 2 carries the settled vocabulary** (`docs/analyze.md` §1): the no-argument form, and
 * `<target>` over the configured layer names *plus* {@link RESERVED_ANALYZE_TARGETS} — the three
 * targets that name no layer. It states what the command does in the settled terms, including the
 * one thing it does not do: a layer-profile revision is proposed and reaches
 * `harness.config.json` only through {@link CONFIG_SET_LAYERS_COMMAND} after an explicit yes
 * (`docs/analyze.md` §3). And it ends with {@link analyzeRecordSentence} — given the generator's
 * `claudeMdBackupWouldCarryContent` and `claudeMdBackupExisted`, the two inputs to that sentence no
 * reading taken here could supply — so what the step claims about the tree is what the write engine actually did to it — in
 * the conditional under
 * `--dry-run`, which did nothing to it at all. Step 2 is where {@link ANALYZE_COMMAND} is named and
 * step 1 deliberately refers to it rather than spelling it, so "the numbered step that names the
 * command" identifies exactly one line of this report — which is how the tests find it.
 *
 * **{@link ANALYZE_INVOCATION} is printed under it, on its own line and on the accepted arm alone.**
 * A line naming a command to type still leaves the adopter to open a session first; a line to paste
 * does not, and it is indented under step 2 rather than numbered because it is that step's *how*
 * rather than a fifth thing to do. It names {@link AGENT_CLI} directly where the generated watcher
 * reaches the same binary through `${HARNESS_AGENT_CLI:-claude}`
 * (`templates/scripts/autonomous-watcher.sh`) — an override that belongs to a script's own
 * environment and would mean nothing on a line printed for a person to paste. It names
 * {@link ANALYZE_COMMAND_QUALIFIED} where step 2 above it names {@link ANALYZE_COMMAND}, and the
 * difference is the two paths rather than an inconsistency: step 2 is a name to type into a session,
 * whose picker resolves the bare form, while this line is a first message, which is matched exactly —
 * the introducing sentence says so, because a report that showed both spellings and explained neither
 * would read as a typo. It is withheld wherever
 * it would contradict the report around it: on the declined arm, whose answer the same step just
 * quoted; on the skip branch, where there is nothing to fill; and under `--dry-run`, which wired
 * nothing to run it against. On the unresolved-slug arm it is **printed but qualified** rather than
 * withheld — withholding would make it dead on every run of this package before its repository is
 * published — because step 1 has just said the session resolves the plugin only once one of the two
 * routes it names is taken, and handing the line over without that precondition would contradict it.
 * **The outcome is stated as intended on both arms**: whether the prefixed first-message form
 * succeeds is not established ({@link ANALYZE_COMMAND_QUALIFIED}), so the line an adopter acts on
 * immediately names the typed route as the measured one instead of asserting its own.
 *
 * **One blank line between the numbered steps, and none before that paste line.** Each step is a
 * paragraph of several sentences; the paste line is step 2's *how*, so it stays attached to the step
 * it belongs to rather than reading as a fifth entry.
 *
 * **Step 3 names the two run settings — as values that file *may carry*, never as values this run
 * wrote, since nothing here writes an `agentEffort` line — rather than {@link INIT_VERB} asking about
 * either**: `agentModel`'s default is a working value for every adopter and an absent `agentEffort` is
 * already resolved, no effort flag reaching the launch line at all, so a prompt would put a question
 * whose answer is already correct where the bar for asking is `resolveQaDriver`'s — a default that
 * cannot reach the application at all (`generators/harnessConfig.ts`) — and the failure actually left
 * open is the other one: a key that exists only in a file nobody is told to open.
 *
 * **Step 4 names the two operator steps `doctor` reports on, and it names them only while
 * `phases.qa` is on** — the parallel to step 3 above: that step names values instead of asking about
 * them, and this one names steps instead of performing them, because neither is `init`'s to perform.
 * The `permissions.allow` entries belong to the interactive-test phase's helper scripts and are
 * unreachable with the phase off, and a step every adopter is told about but only some owe is how a
 * closing list stops being read; the daemon half rides the same gate because it is already reported
 * to everyone by `doctor`'s `repo-registry` check. **Each half names its consequence, not just its
 * verb**, because the two fail differently: an uninstalled daemon is inert and legible — the file
 * dropped into the inbox sits there — while a missing permission entry is a silent stall on the first
 * unattended run, which is the one an adopter has to act on *before* that run rather than after it. The entry
 * form is not restated: those lines carry a machine-local root this command cannot see, which is why
 * only the daemon half has a constant here ({@link DAEMON_INSTALL_COMMAND}), and
 * `plugin/scripts/README.md` and `doctor`'s `plugin-permissions` check own it — so this step points
 * at {@link DOCTOR_COMMAND} for which of the two is still outstanding rather than carrying a list
 * that would drift from the one that prints the lines to paste.
 *
 * **Step 4 carries a second, separately gated sentence: the browser MCP servers are fetched on first
 * use.** `.mcp.json` launches them with {@link MCP_LAUNCHER}, so `init` installs nothing and an
 * adopter offline, behind a proxy, or on a mirror without those pins finds out at the first
 * interactive-test dispatch — after planning, implementation and both branch reviews have been paid
 * for. The sentence names {@link DOCTOR_CHECK_REGISTRY_COMMAND}, which answers it beforehand, and it
 * names no package or version: those live in `templates/repo/mcp.json` and that check enumerates
 * them. Its gate is `browserWiring` — `config/model.ts`'s `browserWiringApplies`, computed at the
 * call site — and **not** `qaPhase`, because a mobile-driver run has the phase on, owes the operator
 * steps above, and has no `.mcp.json` to fetch anything for. Two gates, two parameters, two
 * sentences; do not merge them.
 */
function reportNextSteps(
  ctx: CommandContext,
  layerNames: readonly string[],
  analyze: AnalyzeOfferResolution,
  force: boolean,
  dryRun: boolean,
  backupWouldCarryContent: boolean,
  backupExisted: boolean,
  wiring: Pick<ProjectSettingsResult, 'pluginKey' | 'marketplaceSlug'>,
  qaPhase: boolean,
  browserWiring: boolean,
): void {
  const targets = [...layerNames, ...RESERVED_ANALYZE_TARGETS].join(', ');

  const merged = dryRun ? 'would merge' : 'merged';
  const resolves = dryRun ? 'would resolve' : 'resolves';
  // The reload clause is inside each arm rather than appended to the line: it claims there is
  // something to pick up, which is false under `--dry-run`, and the unresolved arm owes its own
  // wording because the sentence before it withholds what the resolved arm's promises.
  const reloadResolved = dryRun ? '' : ' `/reload-plugins` picks it up in a session that was already open.';
  const reloadUnresolved = dryRun
    ? ''
    : ' Once either route is taken, `/reload-plugins` picks the change up in a session that was already open.';
  const wired =
    wiring.marketplaceSlug === undefined
      ? `This run ${merged} \`${wiring.pluginKey}\` into ${SETTINGS_PATH}, which enables the plugin the next step's command belongs to — but no \`${MARKETPLACES_KEY}\` entry ${
          dryRun ? 'would be' : 'was'
        } written, so a session here has never been told where that plugin comes from and ${resolves} it only if this machine already added the \`${MARKETPLACE_NAME}\` marketplace: run \`${MARKETPLACE_ADD_COMMAND}\` for this machine, or re-run ${INIT_VERB} with \`${MARKETPLACE_FLAG} ${SLUG_SHAPE}\` to write the entry into that committed file for everyone who clones it.${reloadUnresolved}`
      : `Nothing to install by hand: this run ${merged} \`${wiring.pluginKey}\` into ${SETTINGS_PATH} together with the \`${MARKETPLACES_KEY}\` entry naming ${wiring.marketplaceSlug}, and that file is committed — so a session opened in this repository ${resolves} the plugin the next step's command belongs to.${reloadResolved}`;

  // The paste line is gated on the answer **and** on this run having wired anything to run it
  // against. `nothingToFill` is read before `offer` for the reason {@link analyzeRecordSentence}
  // reads it first: `offer` is a placeholder on that path rather than an answer.
  const pasteable = !analyze.nothingToFill && analyze.offer === 'accepted' && !dryRun;
  // The sentence introducing the line carries the precondition step 1 just stated. On the unresolved
  // arm, handing the line over without that precondition would contradict the step above it, which
  // has said the session resolves the plugin only once one of the two routes it names is taken.
  const pasteReason =
    " It is spelled with the plugin prefix because a first message is matched exactly, where a session's command picker matches the name above.";
  // Whether the prefixed first message succeeds is unmeasured, so the outcome is named as intended
  // and the measured route is pointed at ({@link ANALYZE_COMMAND_QUALIFIED}, `docs/analyze.md` §9).
  const pasteUnconfirmed =
    ' That first-message form is not confirmed on the version measured here; the name above, typed into an open session, is the route that is.';
  const pasteIntro =
    wiring.marketplaceSlug === undefined
      ? ` Once the plugin resolves — step 1 names both routes — paste the line below at this repository's root: it is meant to start a session with that command already running.${pasteReason}${pasteUnconfirmed}`
      : ` Paste the line below at this repository's root: it is meant to start a session with that command already running.${pasteReason}${pasteUnconfirmed}`;

  ctx.report.step('next');
  ctx.report.info(`1. ${wired}`);
  ctx.report.info('');
  ctx.report.info(
    `2. Run ${ANALYZE_COMMAND} (or ${ANALYZE_COMMAND} <target> — targets: ${targets}) in this repository: it fills the conventions documents from this repository's real code, and proposes a layer-profile revision it applies only through \`${CONFIG_SET_LAYERS_COMMAND}\` after an explicit yes. ${INIT_VERB} detected this layout from file existence alone and deliberately judges none of it. ${analyzeRecordSentence(analyze, force, dryRun, backupWouldCarryContent, backupExisted)}${
      pasteable ? pasteIntro : ''
    }`,
  );
  // No separator before the paste line: it is step 2's continuation, which is what the indent says.
  if (pasteable) ctx.report.info(`   ${ANALYZE_INVOCATION}`);
  ctx.report.info('');
  ctx.report.info(
    `3. Read ${CONFIG_FILENAME} and correct anything above — it is the file everything here was generated from, it is committed, and after ${INIT_VERB} the copy in this repository is the only copy. Two of the values it may carry are the run settings nothing here could detect: \`agentModel\` chooses which model an unattended run talks to, and \`agentEffort\` pins the reasoning-effort level it runs at — leave it out and the runtime applies its own per-model default. Either one is changed with \`${CONFIG_SET_COMMAND}\`.`,
  );
  // The clause is the phase's, not the driver's: every interactive-test driver reaches the same
  // helper scripts under the plugin's root.
  const operatorSteps = qaPhase
    ? ` Two of the things it reports are an operator's and neither is done from here: \`${DAEMON_INSTALL_COMMAND}\`, without which nothing polls this repository's inbox and a file dropped into it simply sits there; and hand-adding the \`permissions.allow\` entries this machine's plugin roots need, without which an unattended run with the interactive-test phase on parks at the first helper script it reaches, with no error. Running it is how you find out which of the two is still outstanding, and it prints the entries to paste.`
    : '';
  // A second gate, deliberately not folded into the one above: that clause is the phase's, this one
  // is the browser wiring's. A mobile-driver run turns the phase on, owes the operator steps, and
  // declares no server and fetches nothing — so merging them would print this to an adopter with no
  // `.mcp.json` at all. The predicate is `browserWiringApplies`, passed in rather than re-spelled.
  const declared = dryRun ? 'would declare' : 'declared';
  const registryStep = browserWiring
    ? ` This run ${declared} the two browser MCP servers in ${MCP_PATH}, and they are launched with \`${MCP_LAUNCHER}\`: each pinned package is fetched from the registry the first time the interactive-test phase runs rather than installed now. Offline, behind a proxy, or on a mirror that does not carry those exact versions, that fails at the first interactive-test dispatch — after planning, implementation and both branch reviews have been paid for — and \`${DOCTOR_CHECK_REGISTRY_COMMAND}\` is what answers it before then.`
    : '';
  ctx.report.info('');
  ctx.report.info(`4. Run \`${DOCTOR_COMMAND}\` to verify the wiring.${operatorSteps}${registryStep}`);
}

/**
 * The registry row for this command.
 *
 * Exported as the row itself rather than as a `run` the table wraps, so the summary, the usage
 * lines and the behaviour stay in the file that owns them. The import back to `commands/registry.ts`
 * is type-only and therefore erased, so the table can list this row without a runtime cycle.
 */
export const INIT_COMMAND: Subcommand = {
  name: 'init',
  summary: SUMMARY,
  roadmapItem: ROADMAP_ITEM,
  usage: INIT_USAGE,
  run,
};

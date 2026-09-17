/**
 * `doctor`'s questions: what is asked of an adopted repository, and how each answer is graded.
 *
 * **The rule this module exists to enforce: one broken check may not hide the rest.** `doctor` is
 * the command an operator reaches for *because* something is wrong, so it has to answer about
 * everything it was asked about — a check that threw would otherwise abort the run at whichever
 * question happened to come first, and the report would be shorter the worse the repository is.
 * {@link runChecks} therefore evaluates every entry of {@link CHECKS} in order and turns a thrown
 * value into that check's own `fail`, so the count at the end is always over the whole list.
 *
 * ## Three non-obvious choices, and where each comes from
 *
 * 1. **Nothing here is re-derived from a second copy.** The backend detection and the watcher path
 *    are `daemon/backend.ts`'s, so `doctor` and `daemon` cannot describe one host differently; the
 *    config's shape rules are `config/check.ts`'s; the artifact-directory list is
 *    `generators/stateDir.ts`'s {@link selectedStateDirs}, the file paths are the generators' own
 *    exported constants, the ignore-rule spellings — including the superseded one — are
 *    `generators/repoRoot.ts`'s {@link clarificationsIgnoreRules} and the committed contract files
 *    those rules must leave committable are that module's {@link contentsIgnoredDirectories} rather
 *    than whatever negations the audited file still carries, and its managed block is found by
 *    that module's {@link GITIGNORE_BLOCK_HEADER}, the line the write engine itself matches on, the
 *    push-settings precedence is `generators/notifications.ts`'s {@link pushEnvCandidates}, the
 *    repository registry's location, reader and staleness grading are `machine/registry.ts`'s {@link registryPath},
 *    {@link readRegistry} and {@link inspect} — the same three `daemon list` enumerates through — and
 *    the writability probe is the write engine's {@link probeWritable}. A
 *    check that wanted a slightly different answer would be a second definition of the thing being
 *    checked, which is how a green `doctor` starts disagreeing with the run it is supposed to
 *    predict.
 * 2. **The grades are chosen so that a freshly wired repository exits 0 — once it has a remote.** A
 *    `fail` means the flow cannot run as configured; a `warn` means something is worth fixing and
 *    nothing stops. The condition a freshly wired repository still ships with unresolved — the marketplace
 *    entry, which needs a published repository (`generators/projectSettings.ts`) — is therefore a
 *    warning, as is a run watcher that was deleted or left behind by a moved `scriptsDir`
 *    (`daemon/backend.ts`), and the command's exit status stays a statement about whether the
 *    repository is *runnable* rather than about whether it is perfect.
 *
 *    **The remote is the one condition that qualifies that sentence, and it is deliberately a
 *    `fail`** — do not soften it back to a warning. A repository adopted by `init --git-init` has no
 *    remote by construction, so it is freshly wired and still exits non-zero: `create-worktree.sh`
 *    creates every run's checkout from `origin/<defaultBranch>`, so with no such ref the flow does
 *    not start at all and the report would otherwise be all-green about a repository nothing can run
 *    in. That is what separates it from the two checks whose remedies are also hand steps and which
 *    never fail (`notifications`, `repo-registry`): neither of those is a precondition for a run to
 *    begin, and this one is. The remedy is an adopter's to take — add a remote, push the branch —
 *    which is exactly the kind of condition the exit status is supposed to report.
 * 3. **Reachability is command resolution by default, and a read-only registry query at most — never
 *    a launch.** The browser-wiring check asks whether a declared server's launch command resolves on
 *    `PATH`; under {@link CheckContext.probeRegistry} it additionally asks the registry which version
 *    each pinned package has ({@link probeRegistrySpec}), which fetches no package and installs
 *    nothing. Neither arm starts a server or opens a browser. A `doctor` that launched a browser would
 *    be a `doctor` nobody runs in CI, and driving a browser is the interactive-test phase's job and
 *    its agent's alone. The registry query is behind a flag for the neighbouring reason: a default run
 *    reaches no network, so it answers the same in CI, in an `&&` chain and offline — and the run that
 *    did not ask says so, rather than leaving an adopter to read a pass as a promise the packages can
 *    be fetched.
 *
 * ## What this module deliberately does not do
 *
 * - **It writes nothing** beyond {@link probeWritable}'s temp file, which that function removes with
 *   an in-process `fs.rm` on a single file — never a shelled-out recursive removal, which a
 *   user-level `permissions.deny` can silently block (`cli.ts`'s header).
 * - **It repairs nothing.** Every failure names what to run — `init`, `init --force`, an edit to one
 *   config key — and `doctor` stays a command that is safe to run against a repository at any time.
 */

import { execFileSync } from 'node:child_process';
import { accessSync, constants as fsConstants, existsSync, readFileSync, statSync } from 'node:fs';
import { delimiter, join, posix, resolve as resolvePath } from 'node:path';

import { formatProblem, type ConfigProblem } from '../config/check.js';
import { loadConfig } from '../config/io.js';
import {
  answersNone,
  browserWiringApplies,
  COMMAND_NONE_SENTINEL,
  CONFIG_FILENAME,
  DEFAULTS,
  FALLBACK_PRESET,
  isPlaceholder,
  LAYER_CATCH_ALL_PATH,
  STATE_DIR_DOT_PATTERN,
  STATE_DIR_PATTERN,
  type HarnessConfig,
  type HarnessDetection,
} from '../config/model.js';
import {
  branchResolves,
  checkedOutBranch,
  commitsAhead,
  configuredRemotes,
  hasCommits,
  pathIsIgnored,
  remoteTrackingBranchResolves,
  resolveRepoRoot,
  worktreeList,
} from '../core/git.js';
import { isJsonObject, readJsonFile, type JsonObject, type JsonValue } from '../core/json.js';
import { layerCoverage } from '../core/layerCoverage.js';
import { layerGapRemedy, recordedVerdictClause } from '../core/layerGapRemedy.js';
import { nameList } from '../core/nameList.js';
import { readTemplate, workRoot } from '../core/paths.js';
import { ANALYZE_COMMAND } from '../core/pluginIdentity.js';
import { normalizeRepoPathStrict } from '../core/repoPaths.js';
import { probeWritable } from '../core/writer.js';
import { detectBackend, resolveWatcherPath, watcherMissingMessage } from '../daemon/backend.js';
import { renderUnit, repoSlug, unitEnvValue } from '../daemon/units.js';
import { LAYERLESS_BY_DESIGN_PRESETS, SHARED_CONVENTIONS_PATH, TESTS_LAYER_NAME } from '../detect/presets.js';
import { FORCED_SIGNAL_ID } from '../detect/signals.js';
import {
  CLAUDE_MD_PATH,
  RESERVED_ANALYZE_TARGETS,
  SETUP_PENDING_CLOSE,
  SETUP_PENDING_OPEN,
  SKELETON_GUIDANCE_MARKER,
  TASK_OFFER_PATH,
  UNFILLED_STUB_MARKER,
} from '../generators/claudeContext.js';
import {
  caseLabelMatches,
  isGlobPattern,
  PRE_PUSH_HOOK,
  readProtectedCaseLabel,
  resolveGithooksDir,
  resolveProtectedBranches,
} from '../generators/githooks.js';
import {
  PUSH_CMD_KEY,
  PUSH_URL_KEY,
  pushEnvCandidates,
  type PushEnvCandidate,
} from '../generators/notifications.js';
import { outerLoopScriptsDir } from '../generators/outerLoopScripts.js';
import {
  bashScriptRule,
  entryWord,
  isUnderDirectory,
  namesBrowserTool,
  normalizedRoot,
  pluginRootEntryTarget,
  PROFILE_PATH,
  readRule,
  renderProfile,
  TEMPLATE_PATH as PROFILE_TEMPLATE_PATH,
} from '../generators/permissionProfile.js';
import {
  ENABLED_PLUGINS_KEY,
  MARKETPLACE_ENTRY_SHAPE,
  MARKETPLACE_FLAG,
  MARKETPLACES_KEY,
  MARKETPLACE_NAME,
  marketplaceEntryDefect,
  PLUGIN_KEY,
  SETTINGS_PATH,
  SLUG_SHAPE,
} from '../generators/projectSettings.js';
import {
  clarificationsIgnoreRules,
  contentsIgnoredDirectories,
  GITIGNORE_BLOCK_HEADER,
  GITIGNORE_PATH,
  MCP_PATH,
} from '../generators/repoRoot.js';
import {
  configKeyPath,
  configuredWrapperFile,
  scriptInvocation,
  selectWrapper,
  wrappedKeyMismatch,
  wrappedKeyMismatchMessage,
  WRAPPER_SCRIPTS,
  wrapperCommandLine,
} from '../generators/scripts.js';
import { selectedStateDirs } from '../generators/stateDir.js';
import { machineConfigDir } from '../machine/paths.js';
import {
  installedPluginsPath,
  knownMarketplacesPath,
  pluginHelperPath,
  pluginHelperScripts,
  pluginInstallRoot,
  pluginRuntimeRoot,
  pluginScriptsDir,
} from '../machine/plugins.js';
import { inspect, readRegistry, registryPath, type EntryState, type InspectedEntry } from '../machine/registry.js';

/**
 * How the CLI is typed, for every remedy that tells an operator what to run next. The `npx` prefix
 * is not decoration: the rule for which occurrences carry it is stated once in `commands/init.ts`,
 * beside its own `CLI`.
 */
const CLI = 'npx autonomous-sdlc-harness';

/**
 * The outer-loop script whose precondition {@link REMOTE_CHECK} reports on, named the way this
 * module already names `harness-run-lib.sh` and `autonomous-notify.sh` — as a file in a sentence.
 * Nothing here resolves it or reads it; a check that needed its *path* would ask
 * `generators/outerLoopScripts.ts` for it rather than joining one here.
 */
const WORKTREE_SCRIPT = 'create-worktree.sh';

/**
 * The outer-loop script {@link BASE_FRESHNESS_CHECK}'s second remedy names, held beside
 * {@link WORKTREE_SCRIPT} for the same reason: it is a file named in a sentence. The invocation the
 * message prints is {@link scriptInvocation}'s — `generators/scripts.ts` is the one producer of
 * `bash <scriptsDir>/<file>` — so nothing here formats that shape a second time.
 */
const REFRESH_SCRIPT = 'refresh-branch.sh';

/**
 * How a check answers.
 *
 * - `pass` — the thing checked is as it should be.
 * - `warn` — something is worth fixing and the flow still runs. Never changes the exit status.
 * - `fail` — the flow cannot run as configured. Any one of these makes the command exit non-zero.
 */
export type CheckStatus = 'pass' | 'warn' | 'fail';

/** One check's answer: the grade, and the single line explaining it. */
export interface CheckOutcome {
  readonly status: CheckStatus;
  /**
   * One line, no newlines, naming what was found and — for anything but `pass` — what fixes it.
   *
   * **One exception, and it is the only one:** where the remedy is text an operator *copies* rather
   * than prose they read, the lines after the first are that text and nothing else, one item per
   * line. The reporter interpolates this value into its own line
   * (`commands/doctor.ts`), so those lines print unprefixed and are pasteable exactly as they stand
   * — which is the whole value of them, and why a check taking this exception may put nothing else
   * on them. {@link PLUGIN_PERMISSIONS_CHECK} is the one that does.
   */
  readonly detail: string;
}

/** One question, its stable identifier, and the code that answers it. */
export interface Check {
  /** Stable slug, printed at the head of the check's line so a report reads as a list of subjects. */
  readonly id: string;
  /** What this check is for, in one phrase. Used to name the check when its own code throws. */
  readonly title: string;
  /** Answers, and does not throw in the ordinary case — {@link runChecks} catches the rest. */
  run(ctx: CheckContext): CheckOutcome;
}

/** An evaluated check: its identity and its answer, in one record for the report. */
export interface CheckResult extends CheckOutcome {
  readonly id: string;
  readonly title: string;
}

/** How many checks ended in each status. The report's counts summary is this, rendered. */
export interface CheckCounts {
  readonly pass: number;
  readonly warn: number;
  readonly fail: number;
}

/**
 * Everything the checks read, resolved once.
 *
 * The three expensive or throwing reads — the repository root, the config and the permission
 * profile — happen in {@link buildCheckContext} rather than inside the checks that want them, so
 * several checks can report on one file without re-reading it and without each of them carrying its
 * own copy of "what if it is not there". Every field is optional for the same reason `doctor` exists:
 * the repository may be in any state, including one where none of them resolves.
 */
export interface CheckContext {
  /** The directory the command was aimed at: `--cwd` if given, else the process cwd. */
  readonly cwd: string;
  /** The repository root, or `undefined` when {@link cwd} is not inside a work tree. */
  readonly repoRoot?: string;
  /** Why the root did not resolve. Present exactly when {@link repoRoot} is absent. */
  readonly repoProblem?: string;
  /** The parsed config, or `undefined` when it is absent, unparsable or not an object. */
  readonly config?: HarnessConfig;
  /** Everything `config/check.ts` found wrong with it, including its absence. */
  readonly configProblems: readonly ConfigProblem[];
  /** Absolute path the config was looked for at. */
  readonly configPath?: string;
  /** The parsed permission profile, or `undefined` when it is absent or unreadable. */
  readonly profile?: JsonObject;
  /** Why the profile did not parse. Present exactly when {@link profile} is absent. */
  readonly profileProblem?: string;
  /** Absolute path the profile was looked for at. */
  readonly profilePath?: string;
  /**
   * Whether the run asked for the one question in this module that reaches the network:
   * {@link BROWSER_WIRING_CHECK}'s registry reachability probe, which `doctor --check-registry` turns
   * on and nothing else reads. `false` in every default run, which is what keeps every check here
   * answering the same in CI and offline.
   */
  readonly probeRegistry: boolean;
}

/** The permission lists a generated profile carries, in the order the template writes them. */
const PERMISSION_LISTS: readonly string[] = Object.freeze(['allow', 'deny', 'ask']);

/** An unsubstituted token, which a raw template's entry may carry and a rendered profile may not. */
const TOKEN_MARKER = '{{';

/** The profile key that starts the repository's declared MCP servers for a run. */
const ENABLED_SERVERS_KEY = 'enabledMcpjsonServers';

/** The key `.mcp.json` declares its servers under. */
const SERVERS_KEY = 'mcpServers';

/** How long the `jq` version probe may take before it is treated as no answer at all. */
const JQ_PROBE_TIMEOUT_MS = 5_000;

/**
 * How long one registry metadata read may take before that package is reported as unanswered.
 *
 * Wider than the `jq` bound beside it because this is the one probe in this module that crosses the
 * network, and the adopter it exists for is on the slow side of it — a corporate proxy, a distant
 * mirror, a cold cache. A bound tight enough to cut those off would report a working registry as
 * unreachable, which is the one wrong answer this check must not give. It is still a bound rather
 * than a deadline: a registry that accepts the connection and never answers costs this much per
 * pinned package and is then reported, and never hangs the command an operator ran to find out
 * what is wrong.
 */
const REGISTRY_PROBE_TIMEOUT_MS = 20_000;

/** The launcher whose declared package spec is fetched from the registry on first use, not installed. */
const REGISTRY_LAUNCHER = 'npx';

/** The client the reachability probe asks the registry through, and the name it is resolved by. */
const REGISTRY_CLIENT = 'npm';

/** The floor `plugin/hooks/README.md` §Prerequisites states, as the two numbers that decide it. */
const JQ_MIN_MAJOR = 1;
const JQ_MIN_MINOR = 5;

/**
 * The first `<major>.<minor>` in whatever `jq --version` printed.
 *
 * Deliberately loose, because the string has changed shape across the releases this floor spans —
 * `jq-1.7.1`, `jq-1.6`, `jq version 1.5`, and a distribution's own suffixed spelling — and the two
 * numbers are the only part of any of them this check decides on. A string carrying none of it is
 * graded rather than parsed anyway; see {@link JQ_CHECK}.
 */
const JQ_VERSION_PATTERN = /(\d+)\.(\d+)/;

/** How much of a probe's own output a detail quotes back before it elides the rest. */
const PROBE_OUTPUT_CAP = 60;

/** A subprocess's output as one bounded line — a {@link CheckOutcome} detail may carry no newline. */
function firstLine(output: string): string {
  const line = (output.split('\n')[0] ?? '').trim();
  return line.length > PROBE_OUTPUT_CAP ? `${line.slice(0, PROBE_OUTPUT_CAP)}…` : line;
}

/** A grade, as the checks below build one. */
function pass(detail: string): CheckOutcome {
  return { status: 'pass', detail };
}

function warn(detail: string): CheckOutcome {
  return { status: 'warn', detail };
}

function fail(detail: string): CheckOutcome {
  return { status: 'fail', detail };
}

/**
 * A check whose input never resolved, graded `fail`.
 *
 * `fail` rather than a fourth "skipped" status: the question was asked and has no answer, which is
 * not the same as an answer of "fine". The exit status is already non-zero from whichever check
 * reported the missing input, so this adds no false alarm — it adds the line that says which further
 * questions that failure left unanswered.
 */
function unevaluated(reason: string): CheckOutcome {
  return fail(`not evaluated, because ${reason}`);
}

/** A thrown value as a message. */
function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/** Whether something is at this path and is a directory. Never throws. */
function isDirectory(path: string): boolean {
  try {
    return statSync(path).isDirectory();
  } catch {
    return false;
  }
}

/** Whether this path names a file the current account may execute. Never throws. */
function isExecutableFile(path: string): boolean {
  try {
    if (!statSync(path).isFile()) return false;
    accessSync(path, fsConstants.X_OK);
    return true;
  } catch {
    return false;
  }
}

/**
 * Which directory of a `PATH` value holds an executable of this name, or `undefined` for none.
 *
 * Split out of {@link resolvesOnPath} because {@link DAEMON_PATH_CHECK} has to report *where* a
 * binary the daemon cannot reach actually lives on this machine, and a second walk of the same list
 * would be a second answer to what a `PATH` resolves.
 */
function locateOnPath(command: string, searchPath: string): string | undefined {
  return searchPath
    .split(delimiter)
    .filter((entry) => entry !== '')
    .find((directory) => isExecutableFile(join(directory, command)));
}

/**
 * Whether a launch command resolves to something executable — `PATH` lookup done in process.
 *
 * Deliberately not a shelled-out `which` or `command -v`: the first is one more binary to depend on
 * and the second needs a shell, and both are a spawn where a `stat` answers the question. A command
 * containing a separator is treated as a path, the way a shell treats one.
 *
 * `searchPath` defaults to this process's own `PATH`, which is what every caller but one asks.
 * {@link DAEMON_PATH_CHECK} passes the **installed unit's** `PATH` instead, because the question it
 * asks is about a file rather than about the shell `doctor` was typed at.
 */
function resolvesOnPath(command: string, searchPath: string = process.env['PATH'] ?? ''): boolean {
  if (command === '') return false;
  if (command.includes('/')) return isExecutableFile(resolvePath(command));
  return locateOnPath(command, searchPath) !== undefined;
}

/** One permission list's string entries, or none when the profile does not carry it as a list. */
function permissionEntries(profile: JsonObject, list: string): readonly string[] {
  const permissions = profile['permissions'];
  if (!isJsonObject(permissions)) return [];
  const entries = permissions[list];
  if (!Array.isArray(entries)) return [];
  return entries.filter((entry): entry is string => typeof entry === 'string');
}

/**
 * Every string in the profile that names a location: the three permission lists and the extra
 * directories a run is granted.
 *
 * Restricted to those rather than taken over the whole document, so the rationale block's prose —
 * which legitimately mentions paths — cannot answer a question about what the *rules* point at.
 */
function locationStrings(profile: JsonObject): readonly string[] {
  const strings = PERMISSION_LISTS.flatMap((list) => permissionEntries(profile, list));
  return [...strings, ...permissionEntries(profile, 'additionalDirectories')];
}

/**
 * The rule wrapper a permission entry is written in — `Edit(`…`)`, `Read(`…`)`, `Bash(`…`)` — matched
 * so the content inside it can be read as the path expression it is. An entry carrying no wrapper, as
 * `additionalDirectories` does, is its own content.
 */
const RULE_WRAPPER = /^[A-Za-z]+\(([\s\S]*)\)$/;

/**
 * The absolute path expressions inside one location string, each normalized to what it points at.
 *
 * Three shapes are handled at once because all three are in every generated profile: `Edit(//<abs>/**)`
 * and its `Write`/`Read` twins, whose leading `//` is the tool syntax marking an absolute path and is
 * collapsed here to the single slash the path itself carries; `Bash(bash <abs>/<script>:*)`, where the
 * path is the second whitespace-separated word and `:*` is the argument wildcard rather than part of
 * it; and a bare directory. A word not starting with `/` — `git`, `bash`, a repo-relative invocation —
 * names no root and is dropped.
 */
function absolutePathExpressions(entry: string): readonly string[] {
  const inner = RULE_WRAPPER.exec(entry)?.[1] ?? entry;
  return inner
    .split(/\s+/)
    .filter((word) => word.startsWith('/'))
    .map((word) => word.replace(/^\/+/, '/').replace(/:\*$/, ''));
}

/** One path segment as a matcher: `*` matches any run of non-separator characters, the rest is literal. */
function segmentMatcher(segment: string): RegExp {
  const source = segment.replace(/[.*+?^${}()|[\]\\]/g, (character) =>
    character === '*' ? '[^/]*' : `\\${character}`,
  );
  return new RegExp(`^${source}$`);
}

/**
 * Whether a path expression covers `repoRoot` — the two compared segment by segment, with `*` treated
 * as the wildcard it is, for as many segments as the shorter of the two has.
 *
 * That single rule is what makes each real case answer correctly, and it is why the comparison stops
 * at the shorter path rather than demanding equal depth:
 *
 * - `<work>/<project>-*` against a sibling worktree `<work>/<project>-feature_x` — equal depth, and
 *   the wildcard segment is the whole point (`core/paths.ts`'s `worktreeGlob`, emitted unconditionally);
 * - a wrapper-script rule under that same pattern — `<work>/<project>-<wildcard>/scripts/test.sh` —
 *   against that same root: the expression is *deeper* than the root, and a script rule inside a
 *   checkout names that checkout;
 * - `<work>/**` against `<work>/<project>` — the expression is *shallower*, and a rule spanning the
 *   directory above covers what is under it.
 *
 * A checkout the profile was not generated for still fails it: `<work>/<project>` and
 * `<work>/<project>-feature_x` differ in a literal segment, which is the moved-or-copied case the
 * check exists to report.
 */
function expressionCoversRoot(expression: string, repoRoot: string): boolean {
  const expressionSegments = expression.split('/').filter((segment) => segment !== '');
  const rootSegments = repoRoot.split('/').filter((segment) => segment !== '');
  if (expressionSegments.length === 0 || rootSegments.length === 0) return false;

  const depth = Math.min(expressionSegments.length, rootSegments.length);
  for (let index = 0; index < depth; index += 1) {
    if (!segmentMatcher(expressionSegments[index] as string).test(rootSegments[index] as string)) return false;
  }
  return true;
}

/**
 * Whether one location string covers `repoRoot`, asking of it as the **pattern** it is.
 *
 * The literal-substring test is kept as the first branch: it is the cheap answer for the checkout the
 * profile was generated at, and keeping it means the previously passing case is decided by exactly the
 * code that used to decide it. Only when it says no is the entry parsed as a path expression.
 */
function namesRoot(entry: string, repoRoot: string): boolean {
  if (entry.includes(repoRoot)) return true;
  return absolutePathExpressions(entry).some((expression) => expressionCoversRoot(expression, repoRoot));
}

/**
 * The `deny` entries the shipped template ships every generated profile with — the floor an adopter's
 * own profile is compared against.
 *
 * Read from the template rather than restated here, so there is one declaration of what the floor is:
 * a copy in this file would be the thing that goes stale the first time an entry is added to the
 * template, and a `doctor` that vouches for a floor by consulting its own copy of it vouches for
 * nothing. Entries carrying an unsubstituted token are skipped — the template is read raw, and a
 * token'd entry is not a literal any rendered profile would hold.
 */
function shippedDenyFloor(): readonly string[] {
  const parsed = JSON.parse(readTemplate(PROFILE_TEMPLATE_PATH)) as JsonValue;
  if (!isJsonObject(parsed)) return [];
  return permissionEntries(parsed, 'deny').filter((entry) => !entry.includes(TOKEN_MARKER));
}

/** The MCP servers the profile starts for a run, or none when it carries no such key. */
function serversStartedByProfile(profile: JsonObject): readonly string[] {
  const enabled = profile[ENABLED_SERVERS_KEY];
  if (!Array.isArray(enabled)) return [];
  return enabled.filter((entry): entry is string => typeof entry === 'string');
}

/**
 * Resolve everything the checks read, once.
 *
 * Nothing here throws: a repository `doctor` cannot resolve the root of is exactly the repository it
 * has to report on rather than crash against, and the same holds for a config or a profile that does
 * not parse. Each failure becomes a field the check that owns that subject renders.
 *
 * `probeRegistry` is the caller's answer rather than this function's, and it defaults to `false`: a
 * context built without it is the context every default run gets, and no check here reaches a network
 * unless the command was asked to.
 */
export function buildCheckContext(cwd: string, probeRegistry = false): CheckContext {
  let repoRoot: string | undefined;
  let repoProblem: string | undefined;
  try {
    repoRoot = resolveRepoRoot(cwd);
  } catch (error) {
    repoProblem = messageOf(error);
  }

  if (repoRoot === undefined) return { cwd, repoProblem, configProblems: [], probeRegistry };

  const loaded = loadConfig(repoRoot);
  const profilePath = join(repoRoot, PROFILE_PATH);

  let profile: JsonObject | undefined;
  let profileProblem: string | undefined;
  try {
    const parsed = readJsonFile(profilePath);
    if (parsed === undefined) {
      profileProblem = `no ${PROFILE_PATH} at ${profilePath}: this repository has no unattended-run permission profile — run \`${CLI} init\` to generate one`;
    } else if (!isJsonObject(parsed)) {
      profileProblem = `${profilePath} is not a JSON object, so it is not a settings file the agent runner can load`;
    } else {
      profile = parsed;
    }
  } catch (error) {
    profileProblem = messageOf(error);
  }

  return {
    cwd,
    repoRoot,
    config: loaded.config,
    configProblems: loaded.problems,
    configPath: loaded.path,
    profile,
    profileProblem,
    profilePath,
    probeRegistry,
  };
}

/** Is this repository inside a work tree at all — the precondition every repo-wiring check has. */
const GIT_CHECK: Check = {
  id: 'git',
  title: 'git is available and the current directory is inside a work tree',
  run: (ctx) =>
    ctx.repoRoot === undefined
      ? fail(
          ctx.repoProblem ??
            `the repository root of ${ctx.cwd} could not be resolved, so there is no repository to check`,
        )
      : pass(`git answered, and ${ctx.cwd} is inside the work tree rooted at ${ctx.repoRoot}`),
};

/**
 * What a `jj`-managed working copy keeps beside `.git` — and the whole of the check below's probe.
 * No `jj` binary is looked for and none is invoked.
 *
 * **What the directory establishes is that `jj` manages this working copy, and not that the
 * repository is colocated.** Measured on jj 0.44.0 and recorded in `docs/cli.md` §7, the
 * `jj-repository` bullet: a **non**-colocated repository's `.jj/repo/store/git_target` holds
 * `../../../.git`, so it too keeps a real non-bare `.git` at the working-copy root with `.jj/`
 * beside it, and this probe answers the same on both shapes. The one clause of the warning below
 * that is colocated-only says so in its own words.
 */
const JJ_DIR = '.jj';

/**
 * A `jj`-managed repository, told the things about itself the rest of this report assumes away.
 *
 * **The state this exists for is a report that is green and silent about a repository shape one of
 * its own claims is false in.** A colocated repository returned 18 pass, 4 warn, 0 fail with every
 * warning generic: nothing said that `<githooksDir>/pre-push` is a *git* hook which `jj git push`
 * does not run, and nothing said that the detached `HEAD` jj leaves a colocated repository in after
 * every `jj new` is the condition that demoted `defaultBranch` detection a rung
 * ({@link DEFAULT_BRANCH_CHECK}'s value, and `generators/harnessConfig.ts`'s rung 2). The first was
 * measured on one repository and one hook seconds apart: `git push` fired an instrumented hook,
 * `jj git push` did not run it at all, and the ref landed.
 *
 * **The other half is stated as plainly as the gap, and bounded to what was measured.** The same
 * measurement put `jj git push -b <protected>` in front of the plugin's session-level `PreToolUse`
 * protected-branch guard and got the identical refusal `git push origin <protected>` draws — a push
 * whose target is **named**. The bound is that target: `jj git push` with no bookmark argument
 * carries no target token for that guard's explicit-target arm, and its other arm — a push issued
 * while `HEAD` is on a protected branch — cannot fire wherever jj has detached `HEAD`, which is a
 * colocated repository's steady state, because a detached `HEAD` leaves `hc_current_branch` with no
 * branch to name. So the named form is refused by the session guard, the argument-less form is
 * refused by neither layer there, and a forge-side branch ruleset is the only thing that covers it.
 * Both halves go in: a warning read as
 * "the run is unprotected" sends an adopter hunting a hole that is not there, and one read as "the
 * session guard covers jj" sends them past the only layer that covers the default push.
 *
 * **A `warn`, never a `fail`, and do not promote it** — the module header's choice 2: nothing about
 * the flow stops, and both facts are standing properties of a repository shape rather than something
 * an adopter got wrong. It **repairs nothing** and invents no jj-side hook mechanism, because there
 * is none to name; what it can name is the session guard, a forge-side branch ruleset and the two
 * incantations that settle `defaultBranch` by hand.
 *
 * **The one git question it asks is {@link checkedOutBranch}'s**, so the detached-`HEAD` fact is
 * reported as present *now* rather than asserted in general — and it is that function rather than a
 * second probe, per the module header's choice 1.
 *
 * **The population it grades is a `jj`-managed repository, not a colocated one**, because
 * {@link JJ_DIR}'s probe cannot separate the two — its own comment carries that measurement — so no
 * grade here calls a repository colocated. Clauses (1) and (2) hold on both shapes: no `jj git push`
 * runs a git hook, whichever shape it is issued in, and the session guard judges the same command
 * string. The rung is **colocated-only** and is worded so: a colocated repository has jj export its
 * refs and `HEAD` to git on every command, while a non-colocated one does not and keeps git's own
 * `HEAD`, so nothing there costs that rung.
 *
 * **A plain git repository passes as "not graded"**, in {@link BASE_FRESHNESS_CHECK}'s wording. That
 * arm is what keeps `doctor` silent about jj for every adopter who does not use it.
 *
 * It reads **no configuration** — so it answers the same on a repository whose `harness.config.json`
 * is broken, which is a repository an adopter is especially likely to be running `doctor` against —
 * and it writes nothing.
 */
const JJ_REPOSITORY_CHECK: Check = {
  id: 'jj-repository',
  title: 'a jj-managed repository is told what the pre-push guard does not cover',
  run: (ctx) => {
    if (ctx.repoRoot === undefined) return unevaluated('the repository root did not resolve (see the git check)');

    if (!isDirectory(join(ctx.repoRoot, JJ_DIR))) {
      return pass(
        `not graded, because there is no ${JJ_DIR}/ beside .git and no jj therefore manages this working copy: neither the hook gap a \`jj git push\` opens nor the detection rung a colocated jj repository loses can arise in a plain git repository`,
      );
    }

    // Said of this checkout as it stands, never of jj in general: on a colocated repository the
    // answer flips at the next `jj new`, and an adopter reading "your HEAD is detached" about a
    // checkout whose HEAD is on a branch would discount the whole line.
    const head = checkedOutBranch(ctx.repoRoot);
    const rungNow =
      head.kind === 'detached'
        ? 'and HEAD is detached in this checkout right now, so that condition is present as you read this'
        : head.kind === 'branch'
          ? `and HEAD names ${head.name} in this checkout right now, so the rung can answer as things stand — on a colocated repository the next \`jj new\` is what detaches it again`
          : 'and HEAD names no branch in this checkout at all right now, so the rung cannot answer here for that reason instead';

    return warn(
      `this repository is managed by jj (there is a ${JJ_DIR}/ beside .git — which is what was read, and a colocated repository and a non-colocated one both have one), and three things follow that nothing else in this report says. (1) <githooksDir>/${PRE_PUSH_HOOK} — the path the pre-push-guard check below names in full — is a git hook: git runs it on every push git performs, whoever invoked git, and a tool that implements push against the git backend itself, as \`jj git push\` does, performs no git push and runs no git hook. Measured: one repository, one hook, seconds apart. So the committed guard covers \`git push\` and nothing else, and the caller it does not reach is a person at a terminal. (2) The session-level PreToolUse protected-branch guard the plugin installs does see \`jj git push\` and refuses one that NAMES a protected target, with the identical decision \`git push origin <protected>\` draws — also measured on \`jj git push -b <protected>\` — so that form is not exposed by (1). The bound is the named target: \`jj git push\` with no bookmark argument carries no target token for that guard's explicit-target arm, and its other arm — a push issued while HEAD is on a protected branch — cannot fire wherever jj has detached HEAD, which is a colocated repository's steady state, so there the argument-less push is refused by neither layer and a branch ruleset on the forge is the only thing that covers it. (3) On a COLOCATED repository — one where jj exports its refs and HEAD to git on every command — defaultBranch detection loses a rung: jj points git's HEAD at a raw commit id after every \`jj new\`, so the rung that reads the branch HEAD names cannot answer and the configured value came from a rung below it. A non-colocated repository exports nothing and keeps git's own HEAD, so nothing there costs that rung; which of the two shapes this is was not read — a ${JJ_DIR}/ beside .git does not say — but HEAD was, ${rungNow}. Nothing is repaired by this line and there is no jj-side hook to install: for an unattended run the session guard is the layer that fires where the push names its target and no layer fires where it does not, the only floor a person at a terminal cannot get around — and the only cover for the argument-less push — is a branch ruleset on the forge, which nothing here provisions, and where the rung cannot answer, settle the value by hand with \`${CLI} config set defaultBranch <branch>\` or \`${CLI} init --reset-config --default-branch <branch>\` rather than leaving it to detection`,
    );
  },
};

/**
 * Does the configured integration line name a branch this repository actually has?
 *
 * Detection settles the value once, at `init` time (`generators/harnessConfig.ts`), and everything
 * that happens to a repository afterwards can move the two apart without saying so: a branch
 * renamed, a clone whose branches are remote-tracking refs, a hand-edited config, an unborn `HEAD`
 * pointed elsewhere between wiring and the first commit. **A wrong value fails by skipping rather
 * than by erroring**, which is why it is asked here at all — a branch review takes its diff base
 * from it, and the protected-branch guards decide what an unattended run may push by matching it, so
 * a name that resolves nowhere is a diff against a ref git cannot find and a gate that matches no
 * branch and therefore stops nothing.
 *
 * The grades follow what is *knowable*, and the split is the module header's rule applied to a
 * repository between `git init` and its first commit:
 *
 * - **No commit at all is a `warn`.** `HEAD` points at a branch that does not exist until something
 *   is committed to it, so no name resolves and the configured one is unverifiable rather than
 *   wrong. That is the state every repository passes through between `git init` and its first
 *   commit, and what settles it is that commit — which `init` makes in any repository it wires that
 *   has none, whether it created that repository or adopted one already there, so what reaches this
 *   branch is mostly a run whose commit git declined for want of an identity. **The message names
 *   that cause and what closes it**, not only the commit: by the time an adopter reads this, the
 *   commit is the act that has already been refused, so naming it alone would point back at the
 *   failure. The remedy is worded exactly as `commitGeneratedFiles`' decline warning words it
 *   (`commands/init.ts`), so the two commands do not spell one fix two ways, and it names re-running
 *   `init` as well as committing by hand — that commit is guarded by `dryRun || hasCommits(...)`, so
 *   a repository still short of a commit is committed into on the next ordinary run. Failing here
 *   would turn a fixable state red.
 * - **A repository that has commits and resolves the name neither locally nor under `origin/` is a
 *   `fail`**, because both readers of the value are then reading a ref that is not there.
 *
 * Both resolutions pass: {@link branchResolves} answers `'remote'` for a clone that has the branch
 * only as a remote-tracking ref, which is the ordinary shape of a checkout that has never checked
 * it out, and a ref is what a diff base and a guard match both take.
 *
 * It runs git and writes nothing, so `doctor`'s "writes nothing beyond the writability probe's temp
 * file" contract is intact.
 */
const DEFAULT_BRANCH_CHECK: Check = {
  id: 'default-branch',
  title: 'the configured default branch resolves in this repository',
  run: (ctx) => {
    if (ctx.repoRoot === undefined) return unevaluated('the repository root did not resolve (see the git check)');
    if (ctx.config === undefined) return unevaluated(`${CONFIG_FILENAME} could not be read (see the config check)`);

    // The schema makes this key required and typed, so a value that is neither has already been
    // reported by the config check; asking git about it would only turn one finding into two.
    const branch = ctx.config.defaultBranch;
    if (typeof branch !== 'string' || branch.trim() === '') {
      return unevaluated(
        `defaultBranch is ${JSON.stringify(branch)} rather than a branch name (see the config check)`,
      );
    }

    if (!hasCommits(ctx.repoRoot)) {
      return warn(
        `this repository has no commit yet, so no branch resolves in it and the configured defaultBranch ${JSON.stringify(branch)} is unverifiable rather than wrong: git's HEAD names a branch that does not exist until something is committed to it, and this check answers for real from the first commit on. init makes that commit in any repository it wires that has none — whether it created the repository or found one already there — so reaching this warning means the commit was declined or never attempted: most often a machine with no commit identity, or a repository wired by an earlier release. Set an identity with \`git config user.email "you@example.com"\` and \`git config user.name "Your Name"\`, then re-run \`${CLI} init\`, which makes the commit on the next ordinary run because the repository still has none — or commit by hand with \`git add -A && git commit\``,
      );
    }

    const resolution = branchResolves(ctx.repoRoot, branch);
    if (resolution === 'local') {
      return pass(`defaultBranch is ${JSON.stringify(branch)}, and this repository has a local branch by that name`);
    }
    if (resolution === 'remote') {
      return pass(
        `defaultBranch is ${JSON.stringify(branch)}, which resolves in this checkout as origin/${branch} rather than as a local branch — the ordinary shape of a clone that has never checked it out, and a ref is what a branch review's diff base and a protected-branch match both take`,
      );
    }

    return fail(
      `defaultBranch is ${JSON.stringify(branch)}, and this repository has neither a local branch nor an origin/ remote-tracking ref by that name: a branch review takes its diff base from this value and the protected-branch guards decide what an unattended run may push by matching against it, so neither works — the diff is against a ref git cannot find, and the guard matches no branch and therefore stops nothing. Run \`git branch -a\` to see what this repository has, then \`${CLI} config set defaultBranch <branch>\``,
    );
  },
};

/**
 * Can a run be *started* here at all — is there a remote, and does the ref every run's checkout is
 * branched from exist?
 *
 * **The question nothing else asks.** `default-branch` above resolves the configured name and is
 * satisfied by a purely local branch; `worktrees` below asks whether git can list checkouts. Neither
 * touches the remote, so a repository with no `origin` reported clean while no run could begin in
 * it — the state the adoption rehearsal found, where the first drop archived within seconds on
 * `fatal: 'origin' does not appear to be a git repository`.
 *
 * The precondition is `create-worktree.sh`'s, and it is two steps rather than one: the new-branch
 * arm fetches `origin/<defaultBranch>` and then creates the worktree **from that ref**, and pushes
 * the new branch to `origin` afterwards. That script refuses both bad states itself, before it
 * creates anything (`exit 2`, naming the remedy and this check), so a repository missing one gets no
 * worktree and nothing downstream — no phase, no agent, no commit — runs. This check is what says so
 * before a prompt is dropped rather than in the run log of the drop that failed.
 *
 * Both bad states are a `fail`, for the reason choice 2 in the module header spells out: this is the
 * one hand-remediable condition that is a precondition for a run to begin, which is what separates
 * it from `notifications` and `repo-registry`. The second state is the one worth having a check for
 * — a remote is configured, so `git remote -v` reassures, and the ref the script actually names is
 * still not there.
 *
 * It asks {@link remoteTrackingBranchResolves} rather than {@link branchResolves}: the latter stops
 * at the local spelling, which the checkout of an integration line always has, so it would answer
 * `'local'` for exactly the repository this check has to fail.
 *
 * It runs git and writes nothing — no fetch, no network call — so `doctor`'s "writes nothing beyond
 * the writability probe's temp file" contract is intact and the answer is the same offline.
 */
const REMOTE_CHECK: Check = {
  id: 'remote',
  title: 'the flow can create a working copy from origin/<defaultBranch>',
  run: (ctx) => {
    if (ctx.repoRoot === undefined) return unevaluated('the repository root did not resolve (see the git check)');
    if (ctx.config === undefined) return unevaluated(`${CONFIG_FILENAME} could not be read (see the config check)`);

    const branch = ctx.config.defaultBranch;
    if (typeof branch !== 'string' || branch.trim() === '') {
      return unevaluated(
        `defaultBranch is ${JSON.stringify(branch)} rather than a branch name (see the config check)`,
      );
    }

    const remotes = configuredRemotes(ctx.repoRoot);
    if (remotes.length === 0) {
      return fail(
        `this repository has no remote configured, so no run can be started in it: ${WORKTREE_SCRIPT} fetches origin/${branch} and creates every run's checkout from that ref, and with no origin it refuses before a worktree exists — the flow stops before any phase begins. Add one and push the branch (\`git remote add origin <url> && git push -u origin ${branch}\`), or run the flow in a checkout that already has a remote`,
      );
    }

    if (!remoteTrackingBranchResolves(ctx.repoRoot, branch)) {
      return fail(
        `this repository has a remote (${nameList(remotes)}) but no origin/${branch} remote-tracking ref, so no run can be started in it: ${WORKTREE_SCRIPT} creates every run's checkout from origin/${branch}, and a local branch of that name does not satisfy it. Push the branch with \`git push -u origin ${branch}\`, or fetch it with \`git fetch origin ${branch}\` if it is already on the remote — and if the remote here is not called origin, add one that is`,
      );
    }

    return pass(
      `origin is configured (${nameList(remotes)}) and origin/${branch} resolves as a remote-tracking ref, which is what ${WORKTREE_SCRIPT} branches a run's checkout from`,
    );
  },
};

/**
 * Is the ref a run's working copy would be cut from **current** — or has this checkout got commits
 * on the integration line that were never pushed?
 *
 * **The question `remote` above cannot answer.** That one asks whether `origin/<defaultBranch>`
 * exists at all; a ref that exists and is behind the local branch satisfies it completely. So the
 * repository this reports on is one where every other line is green: `create-worktree.sh` branches
 * every run's working copy from `origin/<defaultBranch>`, and a run started there gets a base
 * missing whatever was not pushed — commonly the harness wiring itself, which is discovered only
 * after a planning phase has been paid for and the run has parked.
 *
 * **A `warn`, never a `fail`, and do not promote it.** The run does start and parks cleanly, so
 * this is not a precondition in the sense the module header's choice 2 reserves `fail` for — and a
 * check that failed a repository whose remote is a few commits behind is a check nobody keeps green.
 *
 * Two remedies, because there are two states to be in when it is read: `git push origin <branch>`
 * in the checkout that holds the commits, which is the fix at the source, and — for a working copy
 * that already exists and is already stale — `refresh-branch.sh --local`, which is the one refresh
 * route the protected-branch guard permits (that script's own header states why).
 *
 * **Two states are not findings and pass as "not graded"**, following {@link DAEMON_PATH_CHECK}'s
 * shape: each is another line's to report, and reporting it twice makes one finding two.
 *
 * - **No `origin/<branch>`** — `remote`, directly above, already fails over exactly that.
 * - **No local `<branch>`** — the repository between `git init` and its first commit, and the clone
 *   that has the branch only as a remote-tracking ref. Neither holds anything `origin/<branch>` is
 *   missing, and which of the two it is, is `default-branch`'s line to say. Grading either a
 *   failure would turn a repository red that both of those checks deliberately do not.
 *
 * It reads refs and counts commits, writes nothing, and issues **no fetch**, so `doctor`'s "writes
 * nothing beyond the writability probe's temp file" contract is intact and the answer is the same
 * offline — which also means it compares against the remote as this checkout last saw it, and says
 * so rather than making it current.
 */
const BASE_FRESHNESS_CHECK: Check = {
  id: 'base-freshness',
  title: "the ref a run's working copy is branched from is not behind this checkout",
  run: (ctx) => {
    if (ctx.repoRoot === undefined) return unevaluated('the repository root did not resolve (see the git check)');
    if (ctx.config === undefined) return unevaluated(`${CONFIG_FILENAME} could not be read (see the config check)`);

    const branch = ctx.config.defaultBranch;
    if (typeof branch !== 'string' || branch.trim() === '') {
      return unevaluated(
        `defaultBranch is ${JSON.stringify(branch)} rather than a branch name (see the config check)`,
      );
    }

    if (!remoteTrackingBranchResolves(ctx.repoRoot, branch)) {
      return pass(
        `not graded, because this repository has no origin/${branch} for a working copy to be cut from: that this is so is the remote check's line, directly above, and answering it twice would make one finding two`,
      );
    }

    // `branchResolves` answers `'local'` first, so anything else here means `refs/heads/<branch>` is
    // absent — the only two ways to reach that point are named in the header, and `origin/<branch>`
    // is known to resolve by the branch above.
    if (branchResolves(ctx.repoRoot, branch) !== 'local') {
      return pass(
        `not graded, because this checkout has no local ${branch} — a repository between git init and its first commit, or a clone that has the branch only as a remote-tracking ref — so it holds nothing origin/${branch} is missing; which of the two it is, is the default-branch line's to say`,
      );
    }

    const ahead = commitsAhead(ctx.repoRoot, `origin/${branch}`, branch);
    if (ahead === undefined) {
      return warn(
        `origin/${branch} and ${branch} both resolve here and git did not count the commits between them, so whether a run started now would be cut from a stale base is unknown: run \`git rev-list --count origin/${branch}..${branch}\` yourself before dropping one`,
      );
    }

    if (ahead > 0) {
      return warn(
        `${branch} is ${ahead} commit${ahead === 1 ? '' : 's'} ahead of origin/${branch}, so a run started now gets a stale base: ${WORKTREE_SCRIPT} branches every run's working copy from origin/${branch}, and nothing in those commits would be in it — which is how a whole planning phase gets paid for before anything discovers what is missing from the worktree. Push them from this checkout with \`git push origin ${branch}\`; a working copy that already exists catches up with \`${scriptInvocation(outerLoopScriptsDir(ctx.config), REFRESH_SCRIPT)} --local\`, the one refresh route the protected-branch guard permits. A warning rather than a failure because the run does start and parks cleanly`,
      );
    }

    return pass(
      `origin/${branch} contains every commit ${branch} has, as this checkout last saw the remote, so a working copy ${WORKTREE_SCRIPT} cuts from origin/${branch} carries everything this checkout has of the integration line`,
    );
  },
};

/**
 * Does the guard **on disk** refuse pushes to the branches the configuration names?
 *
 * **The question the three above cannot answer.** They grade the configured value; this grades the
 * file that enforces it. The hook is `create-if-absent` (`generators/githooks.ts`), so it carries
 * the set that was substituted into its `case` label when `init` wrote it, while every documented
 * way of correcting `defaultBranch` afterwards — `init --reset-config --default-branch <name>`,
 * `config set defaultBranch <name>`, an edit to `harness.config.json` — changes only the config. The
 * measured state is a repository reporting 18 pass, 4 warn, 0 fail whose hook **allowed** a push to
 * the integration line and **refused** one to an ordinary feature branch, because nothing anywhere
 * compared the rendered list to the value it was rendered from. This is that comparison, and it is
 * the one route-independent form of it: a hand edit to the hook reaches it too.
 *
 * **Every arm is a `pass` or a `warn`, never a `fail`, and do not promote it.** The flow runs — what
 * is wrong is which branch is guarded — and the true floor is a rule enforced by the host the
 * repository is pushed to (the hook's own header), which a repository that has one is not stopped by.
 *
 * Both sides of the comparison are the generator's, per the module header's choice 1:
 * {@link resolveProtectedBranches} for the configured set — `protectedBranches` ∪ `defaultBranch` —
 * {@link resolveGithooksDir} with {@link PRE_PUSH_HOOK} for where the file is, and
 * {@link readProtectedCaseLabel} for what it enforces. The sink passed to the first is a **no-op**:
 * an empty `protectedBranches` is the writing run's warning to give, and repeating it here would make
 * one finding two. {@link resolveGithooksDir} throws on a `githooksDir` naming the repository root,
 * which {@link runChecks} reports as this check's own failure — the handling that function documents.
 *
 * **What it deliberately does not grade:** whether `core.hooksPath` points at the directory the hook
 * is in. A hook that is present and unreached is `pointHooksPath`'s warning at `init` time
 * (`generators/githooks.ts`), and saying it again here would report one fault twice.
 *
 * The remedy names `init --force` and the delete-and-re-run route, and **never `--reset-config`**:
 * that rebuilds the whole config from detection and the flags, so an adopter clearing a divergence
 * by following it loses every hand-set value.
 *
 * It reads one file and writes nothing.
 */
const PRE_PUSH_GUARD_CHECK: Check = {
  id: 'pre-push-guard',
  title: 'the rendered pre-push guard protects the branches the configuration names',
  run: (ctx) => {
    if (ctx.repoRoot === undefined) return unevaluated('the repository root did not resolve (see the git check)');
    if (ctx.config === undefined) return unevaluated(`${CONFIG_FILENAME} could not be read (see the config check)`);

    const branch = ctx.config.defaultBranch;
    if (typeof branch !== 'string' || branch.trim() === '') {
      return unevaluated(
        `defaultBranch is ${JSON.stringify(branch)} rather than a branch name (see the config check)`,
      );
    }

    const configured = resolveProtectedBranches(ctx.config, () => {});
    const hookPath = `${resolveGithooksDir(ctx.config)}/${PRE_PUSH_HOOK}`;

    let hookText: string;
    try {
      hookText = readFileSync(join(ctx.repoRoot, hookPath), 'utf8');
    } catch {
      return warn(
        `there is no readable ${hookPath}, so nothing in this checkout judges a push against the protected set ${CONFIG_FILENAME} names (${nameList(configured)}): the guard the configuration describes is not there to refuse one. Re-run \`${CLI} init\`, which writes the hook because it is create-if-absent — no --force is needed while the file is absent`,
      );
    }

    const label = readProtectedCaseLabel(hookText);
    if (label === undefined) {
      return warn(
        `${hookPath} is there but carries no case label in the generated shape, so what it protects cannot be read out of it and cannot be compared with the set the configuration resolves (${nameList(configured)}): this hook was edited, or was not written by this CLI. Read the file to see what it refuses, or delete it and re-run \`${CLI} init\`, which re-renders it from the config because the hook is create-if-absent`,
      );
    }

    if (caseLabelMatches(label, configured)) {
      return pass(
        `${hookPath} refuses a push whose target branch is ${nameList(label)}, which is the set ${CONFIG_FILENAME} resolves — protectedBranches unioned with defaultBranch`,
      );
    }

    return warn(
      `${hookPath} refuses a push to ${nameList(label)}, and the configuration names ${nameList(configured)} (protectedBranches unioned with defaultBranch): git runs the file, so a push is judged by the hook's set and not by the config — a branch in one set and not the other is either pushed to unguarded or refused for no configured reason, and the two can be inverted entirely. Re-render with \`${CLI} init --force\`, which copies ${hookPath} to ${hookPath}.bak and re-renders it from the config in effect; without --force, delete ${hookPath} and re-run \`${CLI} init\``,
    );
  },
};

/**
 * Does every branch `protectedBranches` **lists** still exist in this repository?
 *
 * **The state this exists for is a guard permanently protecting a branch nobody will ever push to
 * again.** `config set defaultBranch <new>` changes one key of a pair the guards read together, so
 * the list keeps the abandoned name; {@link resolveProtectedBranches} unions the two, and the next
 * `init --force` renders `feat_add_search|trunk` into the hook while the wrappers resolve the same
 * set. Nothing ages the entry out, and nothing said it was there.
 *
 * **The decision, stated here so it is not re-litigated: a stale entry is reported, never removed.**
 * The union stays — it is what keeps the hook and the wrappers from disagreeing in the *unsafe*
 * direction (that function's own header) — and narrowing a protected set automatically is the one
 * direction that fails unsafely: a tool that dropped an entry it could not resolve would unprotect a
 * branch on the strength of a ref lookup. So this names what it found and names the edit; the
 * adopter makes it.
 *
 * **A `warn`, never a `fail`, and do not promote it.** Every guard still refuses more than it needs
 * to, which stops nothing — and an entry naming a branch that does not exist *yet* is a legitimate
 * thing to have configured.
 *
 * Three states are deliberately **not graded**, each because grading it would make one finding two
 * or nag about a supported use:
 *
 * - **A repository with no commit** — `pass`, in {@link BASE_FRESHNESS_CHECK}'s wording: no name
 *   resolves there, so nothing here is answerable, and which state that is, is `default-branch`'s
 *   line to say.
 * - **A glob entry** — skipped, on {@link FORBIDDEN_IN_PATTERN}'s own sentence: a `case` label is a
 *   glob, and a glob entry is what `protectedBranches` documents as the way to protect a whole
 *   namespace with one entry. The character set is {@link isGlobPattern}'s rather than a second one.
 * - **An entry equal to `defaultBranch`** — skipped, because that value's resolution is
 *   `default-branch`'s line, four checks above, and answering it twice would make one finding two.
 *
 * It reads refs through {@link branchResolves} and writes nothing, so `doctor`'s "writes nothing
 * beyond the writability probe's temp file" contract is intact and the answer is the same offline.
 */
const PROTECTED_SET_CHECK: Check = {
  id: 'protected-set',
  title: 'every protectedBranches entry names a branch this repository has',
  run: (ctx) => {
    if (ctx.repoRoot === undefined) return unevaluated('the repository root did not resolve (see the git check)');
    if (ctx.config === undefined) return unevaluated(`${CONFIG_FILENAME} could not be read (see the config check)`);

    const branch = ctx.config.defaultBranch;
    if (typeof branch !== 'string' || branch.trim() === '') {
      return unevaluated(
        `defaultBranch is ${JSON.stringify(branch)} rather than a branch name (see the config check)`,
      );
    }

    // The listed key alone, never the resolved union: the union's other member is `defaultBranch`,
    // and that member is `default-branch`'s to grade. An absent key takes its schema default, which
    // is the value the guards are rendered from (`generators/githooks.ts` → `resolveProtectedBranches`),
    // so the fallback is graded — but whether it answered is carried beside it, because a sentence
    // saying the file "lists" an entry it does not carry sends an adopter looking for a line that is
    // not there. `config set`'s own sibling clause (`commands/config.ts` → `siblingKeyState`) makes
    // the same distinction about the same key.
    const keyPresent = ctx.config.protectedBranches !== undefined;
    const configured = ctx.config.protectedBranches ?? DEFAULTS.protectedBranches;
    if (!Array.isArray(configured) || configured.some((entry) => typeof entry !== 'string')) {
      return unevaluated(
        `protectedBranches is ${JSON.stringify(ctx.config.protectedBranches)} rather than a list of branch patterns (see the config check)`,
      );
    }

    if (!hasCommits(ctx.repoRoot)) {
      return pass(
        `not graded, because this repository has no commit yet and so resolves no branch at all: that this is so is the default-branch check's line, four above, and answering it twice would make one finding two`,
      );
    }

    // Trimmed and de-duplicated as `resolveProtectedBranches` trims and de-duplicates them, so this
    // grades the entries the guards are actually rendered from.
    const defaultName = branch.trim();
    const listed = [...new Set(configured.map((entry) => entry.trim()).filter((entry) => entry !== ''))];
    const globs = listed.filter((entry) => isGlobPattern(entry));
    const graded = listed.filter((entry) => !isGlobPattern(entry) && entry !== defaultName);

    // Said wherever the grade lands, so a reader is never left wondering why an entry they can see
    // in the file is absent from the line.
    const skipped = [
      globs.length === 0
        ? ''
        : `${nameList(globs)} ${globs.length === 1 ? 'is a glob' : 'are globs'}, which name a namespace rather than one branch to look up`,
      listed.includes(defaultName)
        ? `${defaultName} is defaultBranch, whose own resolution is the default-branch check's line`
        : '',
    ].filter((note) => note !== '');
    const skippedNote = skipped.length === 0 ? '' : `; not graded here: ${skipped.join('; ')}`;

    // The one verb every arm below names the key with, so each says which of the two states it
    // graded rather than describing the file as carrying a line only the schema does.
    const listsVerb = keyPresent
      ? 'protectedBranches lists'
      : 'protectedBranches is not set, so it stands at its schema default';
    const defaultNote = keyPresent ? '' : '; protectedBranches is not set, so what is graded is its schema default';

    if (listed.length === 0) {
      // Protecting only `defaultBranch` is what an empty list resolves to, and warning about it is
      // the writing run's line (`resolveProtectedBranches`), not this one's.
      return pass(
        keyPresent
          ? `protectedBranches lists no branch, so it names none this repository could be missing`
          : `protectedBranches is not set and its schema default lists no branch, so it names none this repository could be missing`,
      );
    }

    if (graded.length === 0) {
      return pass(
        `${listsVerb} ${nameList(listed)}, and no entry of it is a branch name for this check to look up${skippedNote}`,
      );
    }

    const repoRoot = ctx.repoRoot;
    const missing = graded.filter((entry) => branchResolves(repoRoot, entry) === 'none');
    if (missing.length === 0) {
      return pass(
        `every protectedBranches entry this check grades resolves in this repository as a local branch or an origin/ remote-tracking ref (${nameList(graded)})${defaultNote}${skippedNote}`,
      );
    }

    // How the state was arrived at, and what the edit is called, both turn on whether the key
    // answered: an absent one was never edited, so nothing about it was left behind by a `config set`
    // and there is no entry to remove — the schema default simply outlived the integration line.
    const origin = keyPresent
      ? `commonly a feature branch that was merged and deleted after \`config set defaultBranch\` moved the integration line, which changes only that one key. Nothing removed ${missing.length === 1 ? 'it' : 'them'} automatically and nothing will`
      : `commonly a repository whose integration line was never the schema default: \`config set defaultBranch\` changes only that one key, and an unset protectedBranches goes on standing at its default. Nothing narrowed that default automatically and nothing will`;

    return warn(
      `${listsVerb} ${nameList(missing)}, which ${missing.length === 1 ? 'names a branch' : 'name branches'} this repository has neither locally nor under origin/: the effective protected set is ${keyPresent ? 'this list' : 'that default'} unioned with defaultBranch (${JSON.stringify(branch)}), so ${missing.length === 1 ? 'that entry' : 'those entries'} stay in the case label of every hook the next \`${CLI} init --force\` renders and in the set the git wrappers resolve on every call — ${origin}: narrowing a protected set is the one direction that fails unsafely, so the edit is yours — \`${CLI} config set protectedBranches '<json>'\` ${keyPresent ? '' : 'sets the key '}with the entries you want, then \`${CLI} init --force\` to re-render the guard from it. A warning rather than a failure because an over-wide set stops nothing, and a branch that does not exist yet is a legitimate thing to have ${keyPresent ? 'listed' : 'protected'}${skippedNote}`,
    );
  },
};

/**
 * `jq`, and the version floor its two consumers share.
 *
 * **This is the one prerequisite that fails silently on both sides of it**, which is why `doctor`
 * asks about it at all. An *absent* `jq` is a `fail`: the plugin's guards and the generated
 * outer-loop scripts both reach their configuration only through it, so with none on `PATH` neither
 * subsystem can work — and the fix is a one-line install. A `jq` *older than 1.5* is also a `fail`,
 * and it is the condition worth having a check for: both configuration loaders
 * (`plugin/hooks/lib/harness-config-lib.sh`, and the generated `lib/harness-run-lib.sh`) use jq 1.5
 * constructs, so an older `jq` makes the program a **compile** error rather than a missing binary —
 * every read fails, both subsystems take their unresolvable-configuration path, and the diagnostic an
 * operator reaches for first, `command -v jq`, succeeds throughout.
 *
 * The probe follows `daemon/backend.ts`'s discipline: `execFileSync` with a fixed argument vector,
 * never a shell string, bounded by a timeout. Existence is answered by {@link resolvesOnPath} rather
 * than by the spawn, so "not installed" and "installed but did not answer" are two findings instead
 * of one, and the second of them is a `warn` — as is a version string this check cannot parse. Both
 * mean `jq` is *there*, which is the state a harness may well work in, and failing a repository over
 * an unrecognised string would be a check nobody keeps green.
 *
 * It reads no configuration and touches no repository: the floor is a property of the machine, and
 * the check answers identically in a repository whose config is broken or absent.
 */
const JQ_CHECK: Check = {
  id: 'jq',
  title: `jq is on PATH and is ${JQ_MIN_MAJOR}.${JQ_MIN_MINOR} or newer`,
  run: () => {
    if (!resolvesOnPath('jq')) {
      return fail(
        `jq does not resolve on PATH: the plugin's guards and the generated outer-loop scripts both read harness.config.json through it, so every guard exits 0 silently and every script takes its closed path — install jq ${JQ_MIN_MAJOR}.${JQ_MIN_MINOR} or newer`,
      );
    }

    let output: string;
    try {
      output = execFileSync('jq', ['--version'], {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore'],
        timeout: JQ_PROBE_TIMEOUT_MS,
        windowsHide: true,
      });
    } catch (error) {
      return warn(
        `jq resolves on PATH but \`jq --version\` did not answer (${messageOf(error)}), so the ${JQ_MIN_MAJOR}.${JQ_MIN_MINOR} floor could not be checked here — run \`jq --version\` yourself before trusting the guards' and the scripts' configuration reads`,
      );
    }

    const printed = firstLine(output);
    const parsed = JQ_VERSION_PATTERN.exec(printed);
    if (parsed === null) {
      return warn(
        `jq resolves on PATH and \`jq --version\` printed ${JSON.stringify(printed)}, which carries no version number this check recognises, so the ${JQ_MIN_MAJOR}.${JQ_MIN_MINOR} floor could not be checked: a warning rather than a failure because jq is present and this harness may well work — compare that string against ${JQ_MIN_MAJOR}.${JQ_MIN_MINOR} by hand`,
      );
    }

    const major = Number(parsed[1]);
    const minor = Number(parsed[2]);
    const version = `${major}.${minor}`;
    if (major < JQ_MIN_MAJOR || (major === JQ_MIN_MAJOR && minor < JQ_MIN_MINOR)) {
      return fail(
        `jq on PATH is ${version} (\`jq --version\` printed ${JSON.stringify(printed)}), older than the ${JQ_MIN_MAJOR}.${JQ_MIN_MINOR} floor: both configuration loaders — the plugin's hooks/lib/harness-config-lib.sh and the generated scripts' lib/harness-run-lib.sh — use jq 1.5 constructs (input/inputs, @tsv, try…catch, error(), and the def s($k; $v) value-parameter form), so on this jq the load program is a compile error and every configuration read fails. Both subsystems treat that as an unresolvable configuration rather than as an error, so it does not announce itself: an ordinary push to a non-protected branch is denied, the commit guard asks on every commit, the remaining guards go silent, the scripts take their closed path — and \`command -v jq\` succeeds throughout. Install jq ${JQ_MIN_MAJOR}.${JQ_MIN_MINOR} or newer`,
      );
    }

    return pass(
      `jq ${version} is on PATH (\`jq --version\` printed ${JSON.stringify(printed)}), at or above the ${JQ_MIN_MAJOR}.${JQ_MIN_MINOR} floor the plugin's guards and the generated outer-loop scripts both need to resolve harness.config.json`,
    );
  },
};

/**
 * Can worktree-based runs be prepared here?
 *
 * A `warn` rather than a `fail`: the flow runs in a single checkout, and an adopter whose git cannot
 * list worktrees loses the isolation a parallel run wants rather than the ability to run at all.
 */
const WORKTREE_CHECK: Check = {
  id: 'worktrees',
  title: 'git worktree list answers, so worktree-based runs are possible',
  run: (ctx) => {
    if (ctx.repoRoot === undefined) return unevaluated('the repository root did not resolve (see the git check)');
    const checkouts = worktreeList(ctx.repoRoot);
    if (checkouts === undefined) {
      return warn(
        `git worktree list did not answer in ${ctx.repoRoot}, so a run cannot be given a checkout of its own: the flow still runs in this single working copy, and two runs then share it`,
      );
    }
    return pass(
      `git worktree list answers with ${checkouts.length} checkout${checkouts.length === 1 ? '' : 's'}, so a run can be given one of its own`,
    );
  },
};

/** Which service manager the run daemon can be installed into — `daemon/backend.ts`'s answer. */
const DAEMON_BACKEND_CHECK: Check = {
  id: 'daemon-backend',
  title: 'this host has a service manager the run daemon can be installed into',
  run: () => {
    const backend = detectBackend();
    if (backend.kind === 'none') return warn(`${backend.reason}, so \`daemon install\` will refuse on this host`);
    const where = backend.unitPath === undefined ? '' : `, and a user unit is installed into ${backend.unitPath}`;
    return pass(`${backend.kind}: ${backend.reason}${where}`);
  },
};

/**
 * Is the script the daemon runs there?
 *
 * **A warning, never a failure**, and the reason has survived the watcher moving into the repository:
 * `init` writes it into the configured `scriptsDir`, so an absence now means it was deleted or
 * `scriptsDir` was changed without a re-run. Both are one `init` away, and neither is a reason for a
 * repository that is otherwise wired to exit non-zero — the daemon is opt-in, and a run in the
 * foreground never touches this file.
 *
 * The path is the same one `daemon install` will refuse over, because both come from
 * `daemon/backend.ts` and neither joins it itself.
 */
const WATCHER_CHECK: Check = {
  id: 'run-watcher',
  title: 'the run watcher the daemon executes is present',
  run: (ctx) => {
    if (ctx.repoRoot === undefined) return unevaluated('the repository root did not resolve (see the git check)');
    if (ctx.config === undefined) {
      return unevaluated(`${CONFIG_FILENAME} could not be read, so the scriptsDir the watcher is written into is unknown (see the config check)`);
    }

    const watcher = resolveWatcherPath({ repoRoot: ctx.repoRoot, config: ctx.config });
    return watcher.present
      ? pass(`the run watcher is at ${watcher.path}`)
      : warn(watcherMissingMessage(watcher.path));
  },
};

/**
 * Whether this path names a regular file the current account may read — the same two tests the
 * notifier applies to a candidate (`[ -f ] && [ -r ]`), so `doctor` and the script agree about which
 * candidate exists. Never throws, and never creates anything: a candidate that is not there is
 * answered by a `stat`, so asking about the machine-local file does not bring its directory into
 * being.
 *
 * {@link COMMAND_PERMISSIONS_CHECK} asks it of a wrapper script, and readable is the right question
 * there too: every entry the profile carries for one is `bash <path>`, which reads the file rather
 * than executing it, so a wrapper whose mode bit was lost still runs and is not a finding.
 */
function isReadableFile(path: string): boolean {
  try {
    if (!statSync(path).isFile()) return false;
    accessSync(path, fsConstants.R_OK);
    return true;
  } catch {
    return false;
  }
}

/**
 * Which of the named keys a settings file assigns a non-empty value to — **by name, never by value**.
 *
 * The file is a shell fragment the notifier sources, so the parse is deliberately the small subset
 * that shape allows: comments and blank lines skipped, an optional `export` prefix dropped, the name
 * taken up to the first `=`, and the value read only far enough to ask whether anything is left after
 * trimming and after one pair of surrounding quotes. A later assignment replaces an earlier one,
 * because that is what sourcing the file does.
 *
 * The value never leaves this function: it is reduced to a boolean here, so no caller downstream has
 * one to print by accident. That is the check's one security property — a push URL is a bearer
 * credential for every endpoint worth pointing this at, and a terminal scrollback is not private.
 */
function nonEmptyKeys(text: string, keys: readonly string[]): readonly string[] {
  const present = new Map<string, boolean>();
  for (const raw of text.split('\n')) {
    const line = raw.trim().replace(/^export\s+/, '');
    if (line === '' || line.startsWith('#')) continue;
    const separator = line.indexOf('=');
    if (separator < 0) continue;
    const name = line.slice(0, separator).trim();
    if (!keys.includes(name)) continue;
    const value = line
      .slice(separator + 1)
      .trim()
      .replace(/^(['"])([\s\S]*)\1$/, '$2')
      .trim();
    present.set(name, value !== '');
  }
  return keys.filter((key) => present.get(key) === true);
}

/** `<path> (machine-local)` / `<path> (repository-side)` — how a candidate is named in a detail. */
function candidateLabel(candidate: PushEnvCandidate): string {
  return `${candidate.path} (${candidate.origin === 'machine' ? 'machine-local' : 'repository-side'})`;
}

/**
 * The clause both `warn` grades end with: what an unconfigured repository actually gets, and the
 * ways to configure it. Written once because the two states share the remedy — one has a file with
 * nothing in it and the other has no file — and a reader comparing the two reports should see one
 * answer to "so what do I do".
 *
 * It names the files by **role** rather than by path, because both branches that use it have
 * already spelled every candidate path in the same line; repeating them would make the one line an
 * operator has to read four paths long.
 *
 * The repository-side half of the remedy is only offered when there **is** a repository-side
 * candidate. A config with no `pushEnvPath` has none ({@link pushEnvCandidates}), and telling that
 * operator to fill a repository-side file by hand would send them to a file the notifier never
 * opens — the failure this whole check exists to prevent.
 */
function deliveryOptInAdvice(candidates: readonly PushEnvCandidate[]): string {
  const repositoryRemedy = candidates.some((candidate) => candidate.origin === 'repository')
    ? ', and the repository-side one is filled in by hand'
    : `; this repository configures no repository-side file, so filling one means setting \`pushEnvPath\` in ${CONFIG_FILENAME} first`;
  return `delivery is opt-in and defaults to nothing pushed, so with neither ${PUSH_URL_KEY} nor ${PUSH_CMD_KEY} set an unattended run's completed, parked and failed events reach a macOS desktop banner where one is available and nothing at all on a Linux host. \`${CLI} init --notifications --push-url <url>\` writes the machine-local file for you${repositoryRemedy}`;
}

/**
 * Which settings file an unattended run's notifier will actually read, and whether either delivery
 * arm is configured in it.
 *
 * **The precedence is not decided here.** `generators/notifications.ts`'s {@link pushEnvCandidates}
 * is the TypeScript side's one definition of the order `docs/watcher.md` §6 publishes — machine-local
 * first, the repository's configured `pushEnvPath` second **when the config names one**, the first
 * that exists winning and the other not read at all — and this check walks that list rather than
 * joining either path itself, so it never names a file the notifier would not open. Two
 * derivations of a first-wins order would differ exactly on the machine that has both files, which is
 * the only machine anybody asks this question about.
 *
 * **No value is ever printed**, in the detail line or in any failure text: the arms are reported by
 * key name only ({@link nonEmptyKeys} reduces each to a boolean before it returns), which is the
 * discipline `autonomous-notify.sh`'s header states for the delivery side and `init`'s generator for
 * the writing side.
 *
 * **It never fails.** Notifications are optional by design and a repository with none runs
 * everything, so the worst grade here is a `warn` — one saying what an unconfigured run gets and
 * naming both the flag and the two paths that change it. Grading it a failure would make an opt-in
 * nobody has to take decide the exit status of a repository that works.
 *
 * It reads at most one file and creates nothing, machine-local directory included.
 */
const NOTIFICATIONS_CHECK: Check = {
  id: 'notifications',
  title: 'the file an unattended run reads its notification settings from resolves',
  run: (ctx) => {
    if (ctx.repoRoot === undefined) return unevaluated('the repository root did not resolve (see the git check)');
    if (ctx.config === undefined) {
      return unevaluated(`${CONFIG_FILENAME} could not be read, so the repository-side candidate's path is unknown (see the config check)`);
    }

    const candidates = pushEnvCandidates(ctx.repoRoot, ctx.config);
    const resolved = candidates.find((candidate) => isReadableFile(candidate.path));

    if (resolved === undefined) {
      // The count comes off the list rather than being written into the sentence: a config with no
      // `pushEnvPath` has one candidate, and "neither" would then be a report about a second file
      // this repository does not have.
      const none = candidates.length === 1 ? 'the one candidate settings file does not exist' : 'neither candidate settings file exists';
      return warn(
        `${none}, so the notifier reads none: looked at ${candidates.map(candidateLabel).join(', then ')}. That is not a fault — ${deliveryOptInAdvice(candidates)}`,
      );
    }

    // The other candidate is named in every resolved answer, because "which of these two is in
    // effect" is the whole question an operator with a file in both places is asking — and it is
    // named for the *reason* it lost, which differs by which side won: a candidate below the winner
    // is shadowed however complete it is, while one above it lost only by not being there.
    const winner = candidates.indexOf(resolved);
    const others = candidates
      .filter((candidate) => candidate !== resolved)
      .map((candidate) =>
        candidates.indexOf(candidate) > winner
          ? `the other candidate, ${candidateLabel(candidate)}, is deliberately not read while this one is there`
          : `the higher-precedence candidate, ${candidateLabel(candidate)}, does not exist, and would be read instead of this one if it did`,
      )
      .join('; ');
    // Kept for the end of every answer below rather than folded into the sentence about the winner:
    // a clause about the *other* file between the winner and what the winner sets would leave every
    // "it sets…" with two candidate files behind it to refer to.
    const andTheOther = others === '' ? '' : ` — ${others}`;
    const head = `${candidateLabel(resolved)} is the settings file an unattended run's notifier reads, as the first candidate that exists`;

    let text: string;
    try {
      text = readFileSync(resolved.path, 'utf8');
    } catch (error) {
      return warn(`${head}, and it could not be read here (${messageOf(error)}), so what it configures is unknown${andTheOther}`);
    }

    const configured = nonEmptyKeys(text, [PUSH_URL_KEY, PUSH_CMD_KEY]);
    if (configured.length === 0) {
      return warn(
        `${head}, and it sets neither ${PUSH_URL_KEY} nor ${PUSH_CMD_KEY} to anything: ${deliveryOptInAdvice(candidates)}${andTheOther}`,
      );
    }

    return pass(
      `${head}, and it sets ${nameList(configured)}, so ${configured.length === 1 ? 'that delivery arm is' : 'both delivery arms are'} configured; no value from it is printed here or anywhere else${andTheOther}`,
    );
  },
};

/** What each stale grade means, in the words an operator can act on. `ok` has nothing to explain. */
const STALE_STATE_MEANING: Readonly<Record<Exclude<EntryState, 'ok'>, string>> = Object.freeze({
  'root-missing': 'the checkout the entry records is no longer there, so it was moved or removed after the daemon was installed',
  'not-a-repository': 'the path the entry records is still there but is no longer a repository root, so the checkout it named was replaced by something else',
  'unit-missing': 'the unit file the entry records has been deleted, so the service manager no longer has a daemon to run for it',
});

/** `1 other registered repository` / `N other registered repositories`, in the grammar it deserves. */
function otherRepositories(count: number): string {
  return count === 1 ? '1 other registered repository' : `${count} other registered repositories`;
}

/**
 * Is this repository armed on this machine, and is what the registry says about it still true?
 *
 * The two enumerating consumers of `repos.json` are `daemon list` and this check, and both ask
 * `machine/registry.ts` rather than deriving anything: the path is {@link registryPath}, the parse is
 * {@link readRegistry}, the staleness grading is {@link inspect}, and the key is the {@link repoSlug}
 * the daemon's own label carries. A second derivation of any of them would be a second answer to
 * "what is armed here", which is the failure that file's header exists to prevent.
 *
 * **It never fails, and that is settled by one sentence elsewhere:** `docs/watcher.md` §5 states the
 * registry is *not consulted before starting a run*. So nothing this check can find is a reason a run
 * cannot proceed. A repository with **no entry** is the ordinary state of one that runs in the
 * foreground — the same reasoning {@link WATCHER_CHECK} grades an opt-in subsystem's absence by — and
 * a **stale** entry costs an operator accuracy in `daemon list` rather than costing this repository a
 * run. Both warn.
 *
 * The count of *other* stale entries rides along on every grade, so one `doctor` run surfaces a
 * machine that has drifted; it is reported as a machine-level fact and never moves this repository's
 * own grade, because another checkout's moved directory is not this repository's fault or its fix.
 *
 * **It writes nothing, the machine-local directory included.** {@link readRegistry} fails open over
 * an absent file and {@link inspect} only stats and probes, so asking these questions cannot bring
 * `machineStateDir()` into being — which is the one place `doctor`'s "writes nothing" contract is
 * hardest to notice being broken, since it is outside the repository the snapshot test watches.
 * Pruning is `daemon list --prune`'s, never a read's.
 */
const REPO_REGISTRY_CHECK: Check = {
  id: 'repo-registry',
  title: 'this repository is recorded in the machine-local registry of installed daemons',
  run: (ctx) => {
    if (ctx.repoRoot === undefined) return unevaluated('the repository root did not resolve (see the git check)');

    const path = registryPath();
    const slug = repoSlug(ctx.repoRoot);
    const entries = inspect(readRegistry());
    const here = entries.find((entry) => entry.slug === slug);

    const staleElsewhere = entries.filter((entry) => entry.slug !== slug && entry.state !== 'ok').length;
    const andElsewhere =
      staleElsewhere === 0
        ? ''
        : `. Separately, ${otherRepositories(staleElsewhere)} on this machine ${staleElsewhere === 1 ? 'is' : 'are'} stale — a machine-level finding rather than this repository's: \`${CLI} daemon list\` shows which, and \`--prune\` drops them`;

    if (here === undefined) {
      return warn(
        `this repository is not registered in ${path}: no run daemon has been installed from this checkout, so nothing polls its inbox and a file dropped there simply sits until something starts a run by hand (docs/watcher.md §6 step 1). That is not a fault — the daemon is opt-in and a run in the foreground never needs one; \`${CLI} daemon install\`, run here, installs it and registers this checkout as ${slug}${andElsewhere}`,
      );
    }

    if (here.state !== 'ok') {
      return warn(
        `this repository is registered in ${path} as ${slug}, and that entry is stale [${here.state}]: ${STALE_STATE_MEANING[here.state]}. The listing is wrong rather than this repository being unrunnable — the registry is not consulted before a run starts (docs/watcher.md §5) — so correct it either way: re-install from this checkout with \`${CLI} daemon install\`, which rewrites the entry, or drop the entry with \`${CLI} daemon list --prune\`, which removes registry rows and nothing else${andElsewhere}`,
      );
    }

    return pass(
      `this repository is registered in ${path} as ${slug}: a ${here.entry.backend} daemon labelled ${here.entry.label}, whose unit file is installed at ${here.entry.unitPath}, and both the recorded checkout and that unit file are still there${andElsewhere}`,
    );
  },
};

/**
 * The file the machine-local `MAX_PARALLEL_RUNS` default is set in, under {@link machineConfigDir}.
 *
 * `autonomous-watcher.sh` sources it after resolving its own defaults, so the value in it is the cap
 * every daemon on this machine inherits. Named here as a string rather than resolved through a
 * shared constant because the shell half is the one that *sources* it; this side only reads a line.
 */
const WATCHER_ENV_FILENAME = 'watcher.env';

/**
 * The tunable that carries the cap, and the shipped default `autonomous-watcher.sh`'s `:-` applies.
 *
 * `MAX_PARALLEL_RUNS_DEFAULT` in `cli/templates/scripts/autonomous-watcher.sh` is the definition of
 * record; this is a mirror of it, because a TypeScript reader cannot evaluate that expansion. Change
 * one and change the other — `grep -rn MAX_PARALLEL_RUNS_DEFAULT cli/` reaches both.
 */
const MAX_PARALLEL_RUNS_VARIABLE = 'MAX_PARALLEL_RUNS';
const DEFAULT_MAX_PARALLEL_RUNS = '5';

/** One `MAX_PARALLEL_RUNS=` assignment, `export`ed or not, with the value as it was written. */
const MAX_PARALLEL_RUNS_ASSIGNMENT = new RegExp(`^[ \\t]*(?:export[ \\t]+)?${MAX_PARALLEL_RUNS_VARIABLE}[ \\t]*=(.*)$`);

/**
 * Where one repository keeps its **run** registry, relative to that repository's `stateDir`.
 *
 * `autonomous-watcher.sh`'s `REGISTRY="$LOGS_DIR/registry.json"` is the definition of record — this
 * is the first TypeScript reader of that file, and it reads it for a *report* only.
 */
const RUN_LOGS_DIR = 'autonomous_logs';
const RUN_REGISTRY_FILENAME = 'registry.json';

/** The record status that counts toward a repository's live runs. Half of the predicate; see below. */
const RUNNING_STATUS = 'running';

/** What a field reads as when the read that would have answered it faulted. Never a check's grade. */
const UNKNOWN_FIELD = 'unknown';

/**
 * Is this pid a process that exists, from this account's point of view?
 *
 * `process.kill(pid, 0)` **sends no signal**; it asks the kernel the question `kill -0` asks. `EPERM`
 * is `true` — the process is there and belongs to another account, which is the ordinary answer on a
 * shared machine and the one a naive `catch` would silently turn into "gone". `ESRCH`, and anything
 * else, is `false`.
 *
 * A pid of `0` or a negative one is rejected before the call rather than after: those spellings
 * address a process *group* rather than a process, so a garbage record must not reach the syscall.
 */
function pidIsAlive(pid: JsonValue | undefined): boolean {
  if (typeof pid !== 'number' || !Number.isInteger(pid) || pid <= 0) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    return (error as NodeJS.ErrnoException).code === 'EPERM';
  }
}

/**
 * How many runs one registered repository has in flight: records whose `status` is `running`
 * **and** whose pid answers {@link pidIsAlive}.
 *
 * **Both conditions, and the status filter is this report's own addition** — the same filter
 * `autonomous-watcher.sh`'s `footprint_live_runs` applies. The liveness half is NOT identical: this
 * side counts `EPERM` as alive (see {@link pidIsAlive}) and the shell's `kill -0 … 2>/dev/null`
 * cannot, so the two can differ by a run owned by another account on a shared machine. That is the
 * only case, and it is named rather than papered over. The watcher's `running_count` tests only the
 * pid, which is sound in the repository it runs in because `reconcile_stale_runs` demotes a dead
 * `running` record first on every pass; **no reconcile pass ever runs against a foreign root**, so a
 * bare pid walk there would count a `parked`, `paused` or `failed` record whose pid happens to have
 * been reused.
 *
 * An absent, unreadable or unparseable registry counts `0`: this is a report, and a repository whose
 * artifact tree cannot be read is better described as "none observed" than as a fault. It reads one
 * file and writes nothing.
 */
function liveRunCount(root: string, stateDir: string): number {
  let parsed: JsonValue | undefined;
  try {
    parsed = readJsonFile(join(root, stateDir, RUN_LOGS_DIR, RUN_REGISTRY_FILENAME));
  } catch {
    return 0;
  }
  if (!isJsonObject(parsed)) return 0;
  const runs = parsed['runs'];
  if (!isJsonObject(runs)) return 0;

  let live = 0;
  for (const key of Object.keys(runs)) {
    const record = runs[key];
    if (!isJsonObject(record)) continue;
    if (record['status'] !== RUNNING_STATUS) continue;
    if (pidIsAlive(record['pid'])) live += 1;
  }
  return live;
}

/**
 * The cap every daemon on this machine **inherits by default**, as the cell each row carries.
 *
 * The machine-local `watcher.env` value when it sets one, else the shipped `5`. A value that is not
 * a whole number falls back to `5` exactly as the shell's own `case "$cap" in ""|*[!0-9]*)` does, and
 * the last assignment in the file wins because that is what sourcing it would leave behind.
 *
 * **It is a default, not a foreign daemon's effective cap**, and the message says so: that daemon's
 * own environment may override it and nothing readable from here reveals whether it did. Stated as a
 * limit of the report rather than papered over — and carried **per row**, because the cap is per
 * repository (`autonomous-watcher.sh`'s tunable comment, `docs/watcher.md` §5) and a single
 * machine-scoped line would assert a machine-wide semantic the tree does not have.
 */
function inheritedCap(): string {
  let text: string;
  try {
    text = readFileSync(join(machineConfigDir(), WATCHER_ENV_FILENAME), 'utf8');
  } catch (error) {
    // Absent is the ordinary case and means the shipped default is in force; anything else is a read
    // this process could not make, and the field says so rather than reporting a number it guessed.
    return (error as NodeJS.ErrnoException).code === 'ENOENT' ? DEFAULT_MAX_PARALLEL_RUNS : UNKNOWN_FIELD;
  }

  let value: string | undefined;
  for (const line of text.split('\n')) {
    const match = MAX_PARALLEL_RUNS_ASSIGNMENT.exec(line);
    if (match !== null) value = match[1];
  }
  if (value === undefined) return DEFAULT_MAX_PARALLEL_RUNS;

  // Quoted or bare, and a bare value ends at the first space — the two spellings an operator writes.
  const trimmed = value.trim();
  const unquoted = /^(['"])(.*)\1$/.exec(trimmed);
  const resolved = unquoted === null ? (trimmed.split(/[ \t]/)[0] ?? '') : (unquoted[2] ?? '');
  return /^\d+$/.test(resolved) ? resolved : DEFAULT_MAX_PARALLEL_RUNS;
}

/** A configured value that is actually a non-empty string, or `undefined` for everything else. */
function nonEmptyString(value: unknown): string | undefined {
  return typeof value === 'string' && value !== '' ? value : undefined;
}

/** One entry's reported row, and the two numbers the summary adds up. */
interface FootprintRow {
  readonly armed: boolean;
  readonly live: number;
  readonly text: string;
}

/**
 * One registered repository as the line the report prints.
 *
 * The identity fields are the entry's own and the grade is {@link inspect}'s; nothing is re-derived.
 * The four run-shaped fields — model, effort, live runs, cap — are read only for an `ok` entry,
 * because a root that is gone or is no longer a repository has no configuration to read and reading
 * it would report a neighbour's. **A read that faults degrades that field to `unknown` rather than
 * the check**: this is an advisory line, and one unreadable config elsewhere on the machine may not
 * cost the operator the rest of the report. Both reads report their fault by return rather than by
 * throwing, so the degradation is a branch on the returned state and not a `try`/`catch`.
 *
 * `agentModel` falls back to {@link DEFAULTS}`.agentModel`, the schema default a run would resolve.
 * `agentEffort` has **no** schema default, so an absent value is reported as the runtime applying its
 * own per-model default rather than as a level this report invented. An unreadable configuration
 * degrades the **live cell too**, to `0`: `stateDir` is then unknown, so {@link liveRunCount} is not
 * called at all rather than reading the schema default's path in a checkout that may not use it —
 * the value `autonomous-watcher.sh`'s `footprint_live_runs` prints for the same entry.
 */
function footprintRow(inspected: InspectedEntry, cap: string): FootprintRow {
  const { slug, entry, state } = inspected;
  // Every row carries the INHERITED default, this checkout's included: `doctor` is not the daemon
  // and cannot know what a unit's own environment resolved. `autonomous-watcher.sh`'s
  // `machine_footprint_report` prints its own resolved value on its own row, which it can; the
  // difference is stated in `docs/watcher.md` §7. That cell and the `unknown` / `—` spelling of an
  // unread model and effort are the only places the two rows differ in WORDING; no cell of either
  // row differs in VALUE.
  const capCell = `cap=${cap} (inherited default; this entry's own daemon environment may override, not derivable from here)`;
  const head = `${slug} [${state}] project=${entry.projectName} root=${entry.root}`;

  if (state !== 'ok') {
    return { armed: false, live: 0, text: `${head} — stale: ${STALE_STATE_MEANING[state]} — ${capCell}` };
  }

  // `loadConfig` never throws: an absent, unreadable or non-object document all come back as
  // `config: undefined` with the reason in `problems`. So the unreadable case is a RETURNED state,
  // not an exception — and it must read `unknown` rather than fall through to the schema defaults,
  // which would report a model this process never read. `autonomous-watcher.sh`'s
  // `machine_footprint_report` prints `—` for the same entry; the two may not disagree.
  const { config: loaded, problems } = loadConfig(entry.root);
  if (loaded === undefined) {
    const reason = problems[0]?.message ?? 'no readable harness.config.json';
    // No readable configuration means no known `stateDir`, so there is no run registry to read and
    // the schema default is a GUESS at another checkout's layout. `autonomous-watcher.sh`'s
    // `footprint_live_runs` reaches its registry through `hr_state_path`, which fails with the same
    // configuration read, and prints `0` rather than reading a registry it cannot locate. The two
    // halves may not disagree on a NUMBER, so this arm returns `0` here instead of falling through
    // to `liveRunCount`.
    return {
      armed: true,
      live: 0,
      text: `${head} model=${UNKNOWN_FIELD} (${reason}) effort=${UNKNOWN_FIELD} live=0 ${capCell}`,
    };
  }

  // Read through `nonEmptyString` rather than the declared types: this config was parsed from a
  // file in another checkout, which a hand-edit may have left holding a number where the schema
  // says string, and the report's job is to print what is there without throwing over it.
  const model = nonEmptyString(loaded.agentModel) ?? DEFAULTS.agentModel;
  const effort = nonEmptyString(loaded.agentEffort) ?? "unpinned, so the runtime's own default applies";
  const stateDir = nonEmptyString(loaded.stateDir) ?? DEFAULTS.stateDir;

  // `liveRunCount` is total by construction — it swallows its own read failure and returns `0` — so
  // a wrapper here could never fire and would be one more thing to keep true.
  const live = liveRunCount(entry.root, stateDir);

  return { armed: true, live, text: `${head} model=${model} effort=${effort} live=${live} ${capCell}` };
}

/**
 * What else is this machine armed to run, and at what settings?
 *
 * The same report `autonomous-watcher.sh status` prints, from the command an operator already runs to
 * ask what is wrong. {@link REPO_REGISTRY_CHECK} directly above answers for **this** checkout; this
 * one answers for the machine around it, and the two are meant to be read together: a repository that
 * is correctly armed on a machine already running several other repositories at high effort is a
 * different situation from the same repository alone, and neither line says that on its own.
 *
 * **It never fails**, for {@link REPO_REGISTRY_CHECK}'s reason: `docs/watcher.md` §5 states the
 * registry is not consulted before starting a run, and §7 that *"Nothing in this file may become a
 * precondition of anything"*. So nothing this check can find is a reason a run cannot proceed —
 * every disposition here is a `pass` or a `warn`, and this check must not become that section's
 * exception.
 *
 * **It reads and writes nothing, `machineStateDir()` included** — {@link readRegistry} fails open
 * over an absent file, {@link inspect} only stats and probes, and the two per-entry reads are a
 * config file and a run registry inside a repository that is not this one. Asking cannot bring the
 * machine-local directory into being, which is the corner of `doctor`'s "writes nothing" contract the
 * repository snapshot test cannot see.
 */
const MACHINE_FOOTPRINT_CHECK: Check = {
  id: 'machine-footprint',
  title: 'what this machine is armed to run, and at what parallelism, model and effort',
  run: () => {
    const path = registryPath();
    const entries = inspect(readRegistry());

    // Failing open means an unreadable file and an empty one are the same answer here, so the remedy
    // names both readings rather than asserting the one it cannot distinguish.
    if (entries.length === 0) {
      return warn(
        `no repository is registered in ${path}, which also reads that way when the file is unreadable or was hand-edited into something this release does not parse: this machine is armed to run nothing unattended, or the index of what it is armed to run has been lost. That is not a fault — the daemon is opt-in — and \`${CLI} daemon install\`, run in each checkout, rebuilds the index one entry at a time; this report never writes it`,
      );
    }

    const cap = inheritedCap();
    const rows = entries.map((entry) => footprintRow(entry, cap));
    const armed = rows.filter((row) => row.armed);
    const live = armed.reduce((total, row) => total + row.live, 0);
    const summary = `summary: armed=${armed.length} stale=${rows.length - armed.length} live=${live}`;
    const listing = rows.map((row) => row.text).join(' | ');

    if (armed.length === 0) {
      return warn(
        `every entry in ${path} is stale, so this machine's index of what it is armed to run no longer describes it: ${listing}. Nothing here stops a run — the registry is not consulted before one starts (docs/watcher.md §5) — so correct the listing either way: \`${CLI} daemon install\`, run in a checkout, rewrites that checkout's entry, and \`${CLI} daemon list --prune\` drops the rows whose checkouts are gone. ${summary}`,
      );
    }

    return pass(
      `this machine is armed to run ${armed.length === 1 ? '1 repository' : `${armed.length} repositories`}, from ${path}: ${listing}. ${summary}. The cap is per repository, so the machine's own ceiling is the sum of the caps of whatever is running at once, and parallelism × model × effort is the adopter's call: several concurrent high-effort runs will exhaust a rate-limit window that one would not`,
    );
  },
};

/**
 * The environment variable the run watcher reaches its agent binary through, and the name it falls
 * back to — `autonomous-watcher.sh`'s `AGENT_CLI="${HARNESS_AGENT_CLI:-claude}"`, the one place a
 * run's engine binary is chosen.
 *
 * **It is read out of the installed unit, never out of this process.** A user agent inherits the
 * service manager's environment rather than the login shell `doctor` was typed at, so this process's
 * value is the exact substitution {@link DAEMON_PATH_CHECK} exists to avoid: it would grade a binary
 * the daemon never invokes and leave the one it does invoke ungraded. `daemon/units.ts` choice 5
 * renders `PATH` and nothing else, so an unedited unit falls through to the default here just as the
 * watcher's `:-` does, and a unit an operator added the key to is graded against the CLI it names.
 */
const AGENT_CLI_VARIABLE = 'HARNESS_AGENT_CLI';
const DEFAULT_AGENT_CLI = 'claude';

/** One binary an unattended run invokes by name, and every configured reason it has to. */
interface RequiredBinary {
  /** The bare command name, as the outer loop types it. */
  readonly name: string;
  /** What requires it — a `commands.*` key, or the phrase naming a fixed consumer. */
  readonly sources: readonly string[];
}

/** Shell keywords and builtins no `PATH` resolves, so a line headed by one names no binary. */
const SHELL_HEADS: ReadonlySet<string> = new Set([
  '.',
  'cd',
  'eval',
  'exec',
  'export',
  'for',
  'if',
  'set',
  'source',
  'while',
]);

/** A leading `VAR=value` assignment, which a shell strips before it resolves the command. */
const ASSIGNMENT_PREFIX = /^[A-Za-z_][A-Za-z0-9_]*=/;

/**
 * The binary a raw command line resolves through `PATH`, or `undefined` when that line names none.
 *
 * A shell strips a leading run of `VAR=value` assignments before it resolves the command, so they are
 * skipped here for the same reason — the leading run only, so `npm test FOO=bar` keeps its head. A head
 * that is a shell keyword or builtin resolves through no `PATH` at all, and a compound line
 * (`cd app && npm test`) arrives here with one as its head; grading either warns about a binary no
 * machine has, under a remedy that cannot clear it. Both are left for the caller to report ungraded
 * rather than guessed at, which is the answer an unreadable wrapper already gets — and a compound is a
 * state the shipped wrappers warn against in their own comments.
 */
function commandHead(line: string): string | undefined {
  const tokens = line.trim().split(/\s+/).filter((token) => token !== '');
  let index = 0;
  while (index < tokens.length && ASSIGNMENT_PREFIX.test(tokens[index] ?? '')) index += 1;
  const head = tokens[index];
  if (head === undefined || SHELL_HEADS.has(head)) return undefined;
  return head;
}

/** One configured command line that reduced to a head, and where that head came from. */
interface CommandHeadEntry {
  /** The head {@link commandHead} derived — a bare name on `graded`, a path on `pathHeads`. */
  readonly head: string;
  /** What requires it, as a message names it: `commands.<key>`, or `<key path> → <wrapper path>`. */
  readonly source: string;
  /** The config key the line came from — `commands.<key>` or `deploy.command`. The discriminator a consumer that grades a subset filters on. */
  readonly key: string;
}

/**
 * Every configured command line's head, classified — **the one derivation of "which binary does this
 * line invoke by name"**, over the two places such a line lives ({@link requiredBinaries}'s header).
 *
 * **Four classes rather than two**, because the two consumers need different subsets and neither may
 * read silence as coverage. {@link DAEMON_PATH_CHECK} resolves `graded` against the installed **unit
 * file's** `PATH`, reports `ungraded` and `absent` through {@link describeUngraded}, and excludes
 * `deploy` entirely — no daemon-launched run deploys. {@link COMMAND_RESOLVES_CHECK} resolves the same
 * `graded` against **this machine's** `PATH` and grades `deploy` too, and must say *not graded* for
 * `pathHeads` and `ungraded` rather than warn about a binary no `PATH` decides: a `/` in the head
 * makes it the filesystem's to resolve, and a head that is a builtin, a compound's keyword, an
 * unreadable body or an unrecognised one is not a binary name at all.
 *
 * **The fifth state is deliberately absent.** A wrapper body {@link wrapperCommandLine} answers
 * `unresolved` for contributes to no class here: it runs no command at all, so there is no head to
 * grade and nothing for either consumer to warn about — `config` and `command-wrappers` report that
 * state between them. It is stated here so neither consumer reads its absence as a graded pass.
 */
interface CommandHeads {
  /** Bare names, which `PATH` decides. The only class either consumer resolves. */
  readonly graded: readonly CommandHeadEntry[];
  /** Heads containing a `/`: a path the filesystem and the working directory decide, not `PATH`. */
  readonly pathHeads: readonly CommandHeadEntry[];
  /** Lines that were read and yielded no head — builtin, compound, unreadable body, unrecognised body. `text` is the report spelling {@link describeUnreducible} prints. */
  readonly ungraded: readonly { readonly key: string; readonly text: string }[];
  /** A wrapper the config invokes and no file backs. `text` is the spelling {@link describeAbsentWrappers} prints. */
  readonly absent: readonly { readonly key: string; readonly text: string }[];
}

/**
 * Derives {@link CommandHeads} over the whole configured surface — every `commands.*` value that is a
 * raw line, `deploy.command`, and the raw line inside each of the four {@link WRAPPER_SCRIPTS}
 * wrappers a configured value invokes.
 *
 * **One derivation, because two consumers ask one question.** Deriving the head in each check would
 * put two answers behind "what does this line run", which is the drift this module forbids; each
 * consumer instead filters the classes it grades. Nothing is dropped silently here: the `/`-headed
 * class the daemon check discards is returned apart so a consumer that must *report* it can.
 *
 * **Two places, one head function.** For a `commands.*` value that is itself a raw command line — the
 * form `setup-worktree.sh`'s `run_configured` evaluates — the head is that value's first token: the
 * binary that has to resolve, the rest arguments. For a value holding the wrapper invocation `init`
 * writes (`bash <scriptsDir>/<name>.sh`) that head is `bash` and the executable line sits *inside*
 * the wrapper, so the head is the first token of the **wrapper's own** line, read through
 * {@link wrapperCommandLine} off the file {@link configuredWrapperFile} names. Both arms reduce
 * through {@link commandHead}, and it is not always the first token: a leading run of `VAR=value`
 * assignments is stripped the way a shell strips it. The second arm walks {@link WRAPPER_SCRIPTS}
 * rather than `config.commands` because {@link configuredWrapperFile} takes a `WrapperKey`, and
 * `commands` also carries `build` and `depInstall`, which are not one.
 *
 * **The line is read out of the wrapper rather than recorded beside the invocation in the config**,
 * because the wrapper is create-if-absent and `generators/scripts.ts`'s `writeWrapperScripts` hands
 * it to the adopter — *"the raw command line in each wrapper is the adopter's to correct"* — so a copy
 * in the config is a second source of truth that grades a string nothing runs the first time that
 * file is edited.
 *
 * **Two values yield no entry at all**, on either arm, because neither is a command line and neither
 * is this derivation's to report: a value still holding `init`'s placeholder, which
 * {@link CONFIG_CHECK} reports; and `commands.typecheck` answered with the `<none>` sentinel,
 * which {@link CONFIG_CHECK} passes silently and {@link COMMAND_WRAPPERS_CHECK} and
 * {@link COMMAND_PERMISSIONS_CHECK} name in their pass text.
 *
 * **The second skip is key-gated — {@link answersNone}, never a bare value test.** This loop walks
 * every `commands.*` key and `deploy.command`, so a value-shape-only skip would drop the sentinel on
 * `commands.test` too and grade nothing there, while `config/check.ts` warns on that same key that
 * its value *will be run*. Do not "simplify" it to a test of the value alone.
 *
 * **Both consumers inherit both skips**, which is why neither {@link requiredBinaries} nor
 * {@link COMMAND_RESOLVES_CHECK} carries one: a second skip at a consumer is a second answer to the
 * question this function exists to answer once.
 *
 * The `deploy` skip belongs to {@link requiredBinaries}, not here — it is that check's question,
 * and this helper's other consumer grades `deploy`. A `deploy` key absent from the config yields no
 * entry on either arm.
 */
function commandHeads(config: HarnessConfig, repoRoot: string): CommandHeads {
  const graded: CommandHeadEntry[] = [];
  const pathHeads: CommandHeadEntry[] = [];
  const ungraded: { key: string; text: string }[] = [];
  // Named `absent` rather than `missing`: in this module a *missing* binary is one a PATH does not
  // reach, which is a different finding with a different remedy.
  const absent: { key: string; text: string }[] = [];
  const classify = (head: string, source: string, key: string): void => {
    // `commandHead` drops empty tokens, so a returned head is never `''`.
    (head.includes('/') ? pathHeads : graded).push({ head, source, key });
  };

  // The key path is the source spelling on this arm, so `commands.*` entries keep today's text and
  // `deploy.command` arrives already spelled by `configKeyPath`, its one owner.
  // Each entry carries the bare command key beside its key path, because the sentinel skip below is
  // key-gated: `deploy.command` has no bare command key and passes `'deploy.command'`, which is not
  // one and so never answers `none`.
  const values: ReadonlyArray<readonly [string, string, unknown]> = [
    ...Object.entries(config.commands ?? {}).map(([key, value]) => [`commands.${key}`, key, value] as const),
    [configKeyPath('deploy'), 'deploy.command', config.deploy?.command] as const,
  ];
  for (const [keyPath, commandKey, value] of values) {
    if (typeof value !== 'string' || value.trim() === '' || isPlaceholder(value) || answersNone(commandKey, value)) continue;
    const head = commandHead(value);
    if (head === undefined) ungraded.push({ key: keyPath, text: keyPath });
    else classify(head, keyPath, keyPath);
  }

  for (const { key } of WRAPPER_SCRIPTS) {
    const wrapper = configuredWrapperFile(config, key);
    if (wrapper === undefined) continue;
    const keyPath = configKeyPath(key);

    let body: ReturnType<typeof wrapperCommandLine>;
    try {
      body = wrapperCommandLine(readFileSync(join(repoRoot, wrapper.path), 'utf8'));
    } catch (error) {
      // `doctor` reports; it never throws for a file an adopter may have deleted or made unreadable.
      // Which of the two it is decides the remedy printed, so the arms are kept apart here.
      if ((error as NodeJS.ErrnoException | null)?.code === 'ENOENT') absent.push({ key: keyPath, text: `${keyPath} (${wrapper.path})` });
      else ungraded.push({ key: keyPath, text: `${keyPath} (${wrapper.path}: ${messageOf(error)})` });
      continue;
    }

    // `unresolved` adds nothing and is *not* ungraded — see {@link CommandHeads}' fifth state.
    if (body.kind === 'command') {
      const head = commandHead(body.command);
      if (head === undefined) ungraded.push({ key: keyPath, text: `${keyPath} (${wrapper.path})` });
      else classify(head, `${keyPath} → ${wrapper.path}`, keyPath);
    } else if (body.kind === 'unrecognised') ungraded.push({ key: keyPath, text: `${keyPath} (${wrapper.path})` });
  }

  return { graded, pathHeads, ungraded, absent };
}

/**
 * The binaries a daemon-launched run has to resolve, derived from configuration rather than listed.
 *
 * **Config-derived is the point.** A hardcoded `npm` would be wrong for every adopter whose package
 * manager is not npm — the same class of defect as a hardcoded default branch. Three fixed members
 * join the derived ones, each because a shipped file invokes it by name: `git`, which every
 * outer-loop script runs; `jq`, which the generated `lib/harness-run-lib.sh` reaches every
 * configuration through and which {@link JQ_CHECK} already treats as a hard floor; and the agent CLI
 * above, whose name arrives as the installed unit's value — `undefined` or empty when the unit does
 * not set it, which is the default case because `${HARNESS_AGENT_CLI:-claude}` reads an empty value
 * as unset too.
 *
 * **The unit of comparison is the head of a command line**, over the two places such a line lives, and
 * deriving it is {@link commandHeads}' — this check classifies nothing itself, so it and its sibling
 * consumer cannot come to disagree about what a line runs. Grading only the `commands.*` value would
 * leave a repository whose every wrapped key holds `init`'s invocation — a Python or Go adoption —
 * with its whole toolchain ungraded, which is Finding 66; grading the wrapper bodies too is what
 * closes it, and keeping the value arm is what still grades `npm` on a Node adoption through
 * `commands.build`'s raw line.
 *
 * **`deploy` is skipped here, and the skip lives in this function rather than in the derivation** —
 * its command line lives on `deploy.command` rather than in `commands`, and no daemon-launched run
 * deploys, which is this check's question and not the derivation's. Every entry keyed
 * `deploy.command` is dropped from all three classes this check consumes.
 *
 * **{@link CommandHeads}' classes map onto this check's return.** `graded` folds into the binary
 * list; `pathHeads` are dropped silently, being paths the unit's `WorkingDirectory` and the
 * filesystem decide rather than any `PATH`; `ungraded` and `absent` pass through as the report
 * strings both result sentences carry, because a check that cannot derive a head must not go on
 * claiming it graded every binary a run invokes, and must not invent one it then warns about.
 *
 * **A wrapper that is not there is returned apart, in `absent`.** The ungraded three share one
 * remedy — repair the line — and a file that does not exist has no line to repair, so folding
 * `ENOENT` in with them printed an unfollowable instruction over the one state `init` clears by
 * itself (Finding 1).
 */
function requiredBinaries(
  config: HarnessConfig,
  repoRoot: string,
  unitAgentCli: string | undefined,
): {
  readonly binaries: readonly RequiredBinary[];
  readonly ungraded: readonly string[];
  readonly absent: readonly string[];
} {
  const found = new Map<string, string[]>();
  const ungraded: string[] = [];
  // Named `absent` rather than `missing`: in this module a *missing* binary is one the unit's PATH
  // does not reach, which is a different finding with a different remedy.
  const absent: string[] = [];
  const add = (name: string, source: string): void => {
    if (name === '' || name.includes('/')) return;
    const sources = found.get(name);
    if (sources === undefined) found.set(name, [source]);
    else if (!sources.includes(source)) sources.push(source);
  };

  const agent = unitAgentCli?.trim() ?? '';
  add('git', 'every outer-loop script');
  add('jq', "the outer-loop scripts' configuration reads");
  add(
    agent === '' ? DEFAULT_AGENT_CLI : agent,
    agent === ''
      ? `the watcher's agent binary (${AGENT_CLI_VARIABLE} unset in the unit, so the watcher's default)`
      : `the watcher's agent binary (${AGENT_CLI_VARIABLE}, as the unit sets it)`,
  );

  // `deploy` is this check's to skip, on both arms: its command line lives on `deploy.command`
  // rather than in `commands`, and no daemon-launched run deploys. {@link commandHeads} derives it
  // for its other consumer, which does grade it.
  const heads = commandHeads(config, repoRoot);
  const kept = <T extends { readonly key: string }>(entries: readonly T[]): readonly T[] =>
    entries.filter((entry) => entry.key !== configKeyPath('deploy'));

  // `pathHeads` are dropped here rather than reported: a head with a `/` in it is resolved against
  // the unit's `WorkingDirectory` and the filesystem, so no `PATH` grades it.
  for (const { head, source } of kept(heads.graded)) add(head, source);
  ungraded.push(...kept(heads.ungraded).map(({ text }) => text));
  absent.push(...kept(heads.absent).map(({ text }) => text));

  return { binaries: [...found].map(([name, sources]) => ({ name, sources })), ungraded, absent };
}

/**
 * The clauses both result sentences carry when a command line yielded no binary name.
 *
 * Two of them, because the remedy differs by reason and a printed remedy an operator cannot perform
 * is worse than none: {@link describeUnreducible} covers the lines that were read and would not
 * reduce, {@link describeAbsentWrappers} the wrappers no file backs. Both are appended to the `pass`
 * sentence as well as the `warn` one, and the `pass` sentence's universal claim is qualified in the
 * same breath: a check that could not reduce one of the lines it grades has not graded every binary
 * a run invokes and must not say it has.
 */
function describeUngraded(ungraded: readonly string[], absent: readonly string[]): string {
  const unreducible = describeUnreducible(ungraded);
  return `${unreducible}${describeAbsentWrappers(absent, unreducible !== '')}`;
}

/**
 * The clause for a command line that was read and yielded no binary name — an unreadable or
 * unrecognised wrapper, and a line {@link commandHead} reduces to no command.
 *
 * All three are repaired in the file, so they share the one remedy this sentence prints. Naming only
 * the first would send an operator to repair a forwarding line that is already correct.
 */
function describeUnreducible(ungraded: readonly string[]): string {
  if (ungraded.length === 0) return '';
  const one = ungraded.length === 1;
  return `. ${nameList(ungraded)} ${one ? 'is' : 'are'} **not** graded here: no binary name could be derived from ${one ? 'that command line' : 'those command lines'} — ${one ? 'it' : 'they'} could not be read, or ${one ? 'it is' : 'they are'} headed by a shell builtin or a compound rather than by a command \`PATH\` resolves — so whatever ${one ? 'it runs is' : 'they run are'} outside this comparison and a run may still fail there. Reduce ${one ? 'it' : 'them'} to one unindented \`<command> "$@"\` whose first word, after any leading \`VAR=value\`, is the binary itself, or read ${one ? 'it' : 'them'} yourself, then re-run \`${CLI} doctor\``;
}

/**
 * The clause for a wrapper the config invokes and no file backs.
 *
 * It is separate from {@link describeUnreducible} because neither half of that remedy can be
 * performed on a file that is not there: there is no line to reduce and nothing to read. The remedy
 * here is `init`'s, phrased as {@link watcherMissingMessage} phrases the same state for the sibling
 * asset it writes create-if-absent. It says more than "ungraded" because a wrapper that is gone is
 * not only outside this comparison — the config points every dispatch of that command at it, and the
 * permission profile allow-lists the same absent path — and this parenthetical is the whole report's
 * only mention of the fact: `command-wrappers` grades the configured value, never the file.
 *
 * `after` is whether {@link describeUnreducible} emitted a clause ahead of this one, which decides
 * only the "either" — this clause is also the whole ungraded report when no line failed to reduce.
 */
function describeAbsentWrappers(absent: readonly string[], after: boolean): string {
  if (absent.length === 0) return '';
  const one = absent.length === 1;
  return `. ${nameList(absent)} ${one ? 'is' : 'are'} **not** graded here${after ? ' either' : ''}, because ${one ? 'that wrapper file does not exist' : 'those wrapper files do not exist'}: ${one ? 'the key names a wrapper no file backs, so every dispatch of that command fails' : 'the keys name wrappers no files back, so every dispatch of those commands fails'} and the permission profile allow-lists ${one ? 'an absent path' : 'absent paths'}. Re-run \`${CLI} init\`, which writes wrappers create-if-absent, to put ${one ? 'it' : 'them'} back, then re-run \`${CLI} doctor\``;
}

/** `npm (commands.test, commands.build; on this machine in /opt/homebrew/bin)` — one missing binary. */
function describeMissing(binary: RequiredBinary): string {
  const directory = locateOnPath(binary.name, process.env['PATH'] ?? '');
  const where =
    directory === undefined
      ? "not on this shell's PATH either, so it is installed somewhere neither the daemon nor you resolve it from"
      : `on this machine in ${directory}`;
  return `${binary.name} (${binary.sources.join(', ')}; ${where})`;
}

/**
 * The remedy for a unit whose `PATH` is wrong or absent: re-render it, then make the service manager
 * re-read it. `daemon install` writes create-if-absent, so `--force` is the half that replaces an
 * installed unit, and `daemon stop` first is what lets a launchd agent be bootstrapped again.
 */
function reinstallAdvice(kind: 'launchd' | 'systemd'): string {
  const reload =
    kind === 'systemd'
      ? 'and run the `systemctl --user daemon-reload` and enable lines it prints, which it prints rather than runs'
      : 'which boots the rewritten agent back in with `launchctl bootstrap`';
  return `re-render the unit from a shell whose PATH does reach the toolchain: \`${CLI} daemon stop\`, then \`${CLI} daemon install --force\`, ${reload}`;
}

/**
 * Does the `PATH` in the **installed unit file** reach the binaries an unattended run invokes?
 *
 * **What this grades is a file rather than this machine, and the asymmetry below is why it has to be.**
 * `doctor` runs in a login shell, where the adopter's package manager and agent CLI resolve by
 * construction; the daemon runs on the service manager's environment, where on macOS only
 * `/usr/bin:/bin:/usr/sbin:/sbin` do. `daemon/units.ts` choice 5 captures the installing shell's
 * `PATH` into the unit to close that gap, and its one stated weakness is that the captured value
 * goes stale when the toolchain moves. That staleness is
 * only ever discovered by a real unattended run failing at its first configured command, which is
 * what this check exists to pre-empt. What that file's `PATH` is graded against now includes the
 * wrappers it has to reach: for every wrapped `commands.*` key {@link requiredBinaries} reads the
 * command line inside the wrapper the key invokes, so the comparison is against the project's own
 * toolchain rather than the `bash` that launches it.
 *
 * Nothing here is re-derived (this module's choice 1): the backend is `daemon/backend.ts`'s, the
 * unit's install path comes from {@link renderUnit} rather than being composed here — the rule
 * `daemon/units.ts`'s header states — and the resolution is {@link resolvesOnPath}, given the unit's
 * `PATH` instead of this process's, and the agent binary it resolves is the unit's too. The render is asked for its `targetPath` only, so it is passed
 * **no** `envPath`: the text this check would render is not the text it grades.
 *
 * **It never fails.** A foreground run is unaffected, the daemon is opt-in, and the remedy is an
 * operator step — the same shape of reason {@link REPO_REGISTRY_CHECK} never fails for. Two states are
 * not findings at all and pass silently: a host with no service manager, and a checkout no daemon
 * has been installed from. The second is `repo-registry`'s line to report, one above this one, and
 * a second warning about it would double every ordinary foreground repository's report.
 */
const DAEMON_PATH_CHECK: Check = {
  id: 'daemon-path',
  title: "the installed daemon's PATH reaches the binaries the outer loop runs",
  run: (ctx) => {
    if (ctx.repoRoot === undefined) return unevaluated('the repository root did not resolve (see the git check)');
    if (ctx.config === undefined) {
      return unevaluated(`${CONFIG_FILENAME} could not be read, so which binaries a run invokes is unknown (see the config check)`);
    }

    const backend = detectBackend();
    if (backend.kind === 'none') {
      return pass(`not graded, because no daemon can be installed on this host and so none carries a PATH: ${backend.reason}`);
    }

    const watcher = resolveWatcherPath({ repoRoot: ctx.repoRoot, config: ctx.config });
    const unit = renderUnit({
      backend,
      config: ctx.config,
      repoRoot: ctx.repoRoot,
      watcherPath: watcher.path,
      envPath: undefined,
    });

    let text: string;
    try {
      text = readFileSync(unit.targetPath, 'utf8');
    } catch (error) {
      if ((error as NodeJS.ErrnoException | null)?.code === 'ENOENT') {
        return pass(
          `not graded, because no ${backend.kind} unit is installed at ${unit.targetPath}: no daemon runs from this checkout, so there is no PATH to compare — whether one should be installed is the repo-registry line above, reported there once`,
        );
      }
      return warn(
        `the ${backend.kind} unit for ${unit.label} is at ${unit.targetPath} and could not be read (${messageOf(error)}), so the PATH it gives the daemon is unknown: read it yourself, or ${reinstallAdvice(backend.kind)}`,
      );
    }

    const { binaries: required, ungraded, absent } = requiredBinaries(
      ctx.config,
      ctx.repoRoot,
      unitEnvValue(backend.kind, text, AGENT_CLI_VARIABLE),
    );
    const envPath = unitEnvValue(backend.kind, text, 'PATH');
    if (envPath === undefined) {
      return warn(
        `the ${backend.kind} unit for ${unit.label} at ${unit.targetPath} carries no PATH, so the daemon runs on the service manager's own default directories — the state every unit installed before this key shipped is in, and on macOS that is /usr/bin:/bin:/usr/sbin:/sbin, where a Homebrew package manager and an agent CLI under ~/.local/bin both fail to resolve. An unattended run then dies at its first configured command with \`command not found\` while a foreground run is fine, because your shell's PATH is not this. To fix it, ${reinstallAdvice(backend.kind)}`,
      );
    }

    const missing = required.filter((binary) => !resolvesOnPath(binary.name, envPath));
    if (missing.length > 0) {
      return warn(
        `the ${backend.kind} unit for ${unit.label} at ${unit.targetPath} gives the daemon a PATH that does not reach ${missing.length === 1 ? 'a binary' : `${missing.length} binaries`} an unattended run invokes by name: ${nameList(missing.map(describeMissing))}. The captured PATH has gone stale, or the toolchain moved after the daemon was installed; a run dispatched by this daemon fails at that command and, once that one is repaired by hand, at the next. To fix it, ${reinstallAdvice(backend.kind)}${describeUngraded(ungraded, absent)}`,
      );
    }

    return pass(
      `the ${backend.kind} unit for ${unit.label} at ${unit.targetPath} carries a PATH reaching every binary an unattended run invokes by name${ungraded.length + absent.length > 0 ? ' that could be derived here' : ''}, each with what requires it: ${nameList(required.map((binary) => `${binary.name} (${binary.sources.join(', ')})`))}. This grades that file rather than this machine — the shell doctor runs in resolves what a service manager's environment does not${describeUngraded(ungraded, absent)}`,
    );
  },
};

/**
 * The config's shape, re-checked at runtime.
 *
 * The reason it is checked again at all is `docs/config.md` §3's: a config can be edited by hand
 * after the schema gate validated it, and every later check here reads values out of it. The
 * severities are `config/check.ts`'s own — an `error` blocks a write and fails here, a `warning`
 * (a `commands.*` placeholder the adopter never replaced, a phase that is on with its section
 * unfilled) is reported and does not stop anything.
 */
const CONFIG_CHECK: Check = {
  id: 'config',
  title: `${CONFIG_FILENAME} is present and structurally valid`,
  run: (ctx) => {
    if (ctx.repoRoot === undefined) return unevaluated('the repository root did not resolve (see the git check)');

    const errors = ctx.configProblems.filter((problem) => problem.severity === 'error');
    if (errors.length > 0) return fail(errors.map(formatProblem).join('; '));

    const warnings = ctx.configProblems.filter((problem) => problem.severity === 'warning');
    if (warnings.length > 0) return warn(warnings.map(formatProblem).join('; '));

    return pass(`${ctx.configPath as string} is present and every key it declares has the shape the schema states`);
  },
};

/**
 * The clause the two command checks append when a key answered `<none>` is why they graded less.
 *
 * **Both pass sentences of both checks**, for {@link UNRESOLVED_BODY_CLAUSE}'s reason: a repository
 * where another wrapped key holds a command line reaches the graded sentence, and a clause carried
 * only by the *not graded* one would leave the answered key named by no check anywhere in the report
 * — which is every ordinary adoption, `preset-php` included.
 *
 * One spelling, because those sentences say the same thing and an adopter comparing two
 * lines must not have to decide whether two wordings mean two states. It names the answered keys
 * apart from the unfilled ones so the line distinguishes **answered: none** from **not yet
 * answered** without the reader opening the config, and it says no other check reports the state —
 * `config/check.ts` passes it silently, which is what *answered* means.
 */
function describeAnsweredNone(keyPaths: readonly string[]): string {
  if (keyPaths.length === 0) return '';
  return `; ${nameList(keyPaths)} answers \`${COMMAND_NONE_SENTINEL}\` — this repository has no such command, which is an answer rather than an unfilled key, so no check reports it as one`;
}

/**
 * Does every wrapped `commands.*` key hold its wrapper invocation rather than a raw command line?
 *
 * The state this reports is the one a nested application's hand-fill path produces: `init` could not
 * detect a command, the adopter filled the key in with a real command line, and the permission
 * profile allow-lists the **wrapper** that line was then inlined into rather than the line itself. An
 * unattended run refuses every dispatch of that command — 25 `permission_denied` events in one
 * measured run — while nothing in the repository's own report mentions it. The condition is not
 * restated here: it is {@link wrappedKeyMismatch}'s and the sentence is
 * {@link wrappedKeyMismatchMessage}'s, so `init`, `config set` and this check cannot come to state one
 * defect three ways (this module's choice 1).
 *
 * **A warning, never a failure.** The repository still runs in the foreground, an agent that hits the
 * refusal can reach the wrapper by hand, and the remedy is one `config set` — the same shape of
 * reason {@link PROFILE_PATHS_CHECK} and {@link PLUGIN_PERMISSIONS_CHECK} never fail for.
 *
 * **(i) Disjoint from `config`, and from the `command-permissions` check beside it.** It asks
 * neither whether a key still holds `init`'s placeholder — that is {@link CONFIG_CHECK}'s, through
 * `config/check.ts`'s own warning — nor whether the wrapper exists under `scriptsDir` and the profile
 * carries its three allow entries, which is {@link COMMAND_PERMISSIONS_CHECK}'s. It also does not
 * grade `commands.typecheck` answered `<none>`: that key holds no command line, `config/check.ts`
 * passes it, and this check names it in either of its pass sentences rather than warning. On the repository
 * Finding 65 measured, both of those answer clean: the wrapper exists, all six entries are present,
 * and the configured string is refused anyway. Neither check subsumes the other.
 *
 * **(ii) The `daemon-path` cross-reference.** The wrapper form this check pushes adopters toward is
 * the form {@link DAEMON_PATH_CHECK} grades: {@link requiredBinaries} reads the command line inside
 * the wrapper a `commands.*` key invokes and takes *its* head, so such a key contributes the
 * project's toolchain rather than the `bash` that runs it (Finding 66). The two stay disjoint in the
 * same way as (i) — this one grades the configured **value**, that one the **file** the value names —
 * and reporting a raw line still rewrites nothing.
 */
const COMMAND_WRAPPERS_CHECK: Check = {
  id: 'command-wrappers',
  title: 'every wrapped commands.* key holds its wrapper invocation',
  run: (ctx) => {
    if (ctx.repoRoot === undefined) return unevaluated('the repository root did not resolve (see the git check)');
    if (ctx.config === undefined) return unevaluated(`${CONFIG_FILENAME} could not be read (see the config check)`);

    const graded: string[] = [];
    const findings: string[] = [];
    // The ungraded keys are collected in two lists rather than one: the pass sentence has to say
    // which are unfilled and which are answered, or a reader cannot tell the two apart.
    const unfilled: string[] = [];
    const answered: string[] = [];

    for (const { key } of WRAPPER_SCRIPTS) {
      // {@link selectWrapper} rather than a second read of the config: it is the exported accessor
      // that already knows `deploy` reads its command line off its own object, and it separates the
      // three states this check does not grade — a key carrying nothing, one still holding the
      // placeholder, and `typecheck` answered `<none>` — from the one it does. An answered key holds
      // no command line, so there is no invocation to grade against its wrapper.
      const { placeholder, answeredNone, configured } = selectWrapper(ctx.config, key);
      if (answeredNone) {
        answered.push(configKeyPath(key));
        continue;
      }
      if (configured === undefined || placeholder) {
        unfilled.push(configKeyPath(key));
        continue;
      }

      const mismatch = wrappedKeyMismatch(ctx.config, key);
      if (mismatch === undefined) graded.push(`${configKeyPath(key)} → ${configured}`);
      else findings.push(wrappedKeyMismatchMessage(key, mismatch));
    }

    if (findings.length > 0) return warn(findings.join('; '));

    if (graded.length === 0) {
      const unfilledClause =
        unfilled.length === 0
          ? ''
          : `: each of ${nameList(unfilled)} is unset or still holds the placeholder init wrote, which is the config check's line and is reported there once`;
      return pass(
        `not graded, because no wrapped key holds a command line${unfilledClause}${describeAnsweredNone(answered)}`,
      );
    }

    return pass(
      `${graded.join(', ')} — each holds the invocation of the wrapper the permission profile allow-lists, so an agent that runs the configured string exactly as written runs an allow-listed path${describeAnsweredNone(answered)}`,
    );
  },
};

/** One rendered entry the profile on disk does not carry, and the permission list it belongs in. */
type MissingCommandEntry = { readonly list: string; readonly entry: string };

/** One list's missing entries under a heading, so a paste lands in the right list. */
function renderListGroup(list: string, entries: readonly string[]): string {
  return `permissions.${list}:\n${entries.join('\n')}`;
}

/**
 * Does the profile carry the entries a **filled** `commands.*` key implies — and is the wrapper those
 * entries name actually there?
 *
 * **The state this reports is invisible to every other check.** `init` writes the wrapper allow
 * entries from the commands it **detected**, so a repository where it detected none gets placeholders
 * and no entries, and a key filled in afterwards — by hand, or by a run that supplied the command
 * itself — adds none. Nothing regenerates the profile on an ordinary re-run: that needs
 * `init --force`. Measured on one such adoption, `permissions.allow` carried no `test.sh` or
 * `typecheck.sh` entry where a normally-detected repository carries six, and the report was clean.
 * What it costs is the failure the profile exists to prevent — a command matching neither `allow` nor
 * `deny` does not prompt in print mode, it hangs.
 *
 * **The expectation is re-derived, never restated.** {@link renderProfile}, the producer `init` itself
 * uses, is called with no `written` list — so the wrapper selection falls back to
 * `selectWrapperScripts` — and with {@link workRoot}'s value, the same default
 * `writePermissionProfile` applies for a caller that supplies none; the entries naming each wrapper's
 * file are then read back out of what it produced. So this check cannot come to disagree with the
 * generator, and the three-forms-per-script invariant is asserted here from the outside instead of
 * being kept as a second copy of the forms (this module's choice 1).
 *
 * **Each list is compared against its own.** A rendered `allow` entry is looked for in `allow` and a
 * rendered `ask` entry — which the deploy wrapper's three are — in `ask`, never in a union of the two:
 * `ask` is evaluated before `allow`, so a wrapper entry that moved into it is the stall rather than
 * the grant, and which list a row belongs in stays the template's statement rather than a second one
 * here.
 *
 * **Disjoint from both neighbours, and the three read in one order: the slot, the value, the
 * entries.** {@link CONFIG_CHECK} grades a key still holding `init`'s placeholder — this check skips
 * exactly those keys, the unset ones and `commands.typecheck` answered `<none>`, and says which is
 * which in either of its pass sentences, since an answered key implies no wrapper and so no entry to
 * be missing — and
 * {@link COMMAND_WRAPPERS_CHECK} grades a key holding a raw command line rather than its wrapper
 * invocation. A repository answers both of those
 * clean and still fails this one: the measured repository holds the invocation, in a valid config,
 * with no entry for it anywhere in the profile.
 *
 * **A `warn`, never a `fail`**, for {@link PROFILE_PATHS_CHECK}'s and
 * {@link PLUGIN_PERMISSIONS_CHECK}'s reason: the repository still runs in the foreground, and the
 * profile is a file the adopter owns. **The absent wrapper and the missing entries are two sentences**
 * because they are two repairs — one is `init` writing a file it writes create-if-absent, the other
 * `init --force` regenerating a file an unforced run will not touch — and a merged list prints an
 * instruction that cannot be followed.
 *
 * **A profile generated for another checkout answers as missing everything**, which is true and is
 * {@link PROFILE_PATHS_CHECK}'s finding stated in the specific. Both name `init --force`, so a reader
 * acting on either line is acting on both.
 *
 * **Nothing underivable is guessed at.** No root, no config and no readable profile each report
 * `unevaluated` naming the check that owns that input — and so does a {@link renderProfile} that
 * throws, whether on an adopter value it cannot build an entry from or on a packaging fault, because a
 * check that could not derive the expectation may not report the profile as wrong.
 */
const COMMAND_PERMISSIONS_CHECK: Check = {
  id: 'command-permissions',
  title: 'the permission profile allow-lists the wrapper every filled commands.* key invokes',
  run: (ctx) => {
    const { repoRoot, config, profile } = ctx;
    if (repoRoot === undefined) return unevaluated('the repository root did not resolve (see the git check)');
    if (config === undefined) return unevaluated(`${CONFIG_FILENAME} could not be read (see the config check)`);
    if (profile === undefined) {
      return unevaluated(`${PROFILE_PATH} could not be read (see the permission-profile check)`);
    }

    // {@link selectWrapper} rather than a second read of the config, for {@link COMMAND_WRAPPERS_CHECK}'s
    // reason: it is the exported accessor that knows `deploy` reads its line off its own object, and it
    // separates the three states this check does not grade from the one it does. An answered-`none` key
    // is not filled: it implies no wrapper and so no entry to look for.
    const filled = WRAPPER_SCRIPTS.filter(({ key }) => {
      const { placeholder, answeredNone, configured } = selectWrapper(config, key);
      return configured !== undefined && !placeholder && !answeredNone;
    });
    const answered = WRAPPER_SCRIPTS.filter(({ key }) => selectWrapper(config, key).answeredNone).map(({ key }) =>
      configKeyPath(key),
    );

    if (filled.length === 0) {
      const unfilled = WRAPPER_SCRIPTS.map(({ key }) => configKeyPath(key)).filter((path) => !answered.includes(path));
      const unfilledClause =
        unfilled.length === 0
          ? ''
          : `: each of ${nameList(unfilled)} is unset or still holds the placeholder init wrote, which is the config check's line and is reported there once`;
      return pass(
        `not graded, because no wrapped key holds a command line and so none implies a permission entry${unfilledClause}${describeAnsweredNone(answered)}`,
      );
    }

    let expected: JsonObject;
    try {
      expected = renderProfile({ repoRoot, config, workRoot: workRoot(repoRoot) });
    } catch (error) {
      return unevaluated(
        `the profile this config implies could not be rendered (${messageOf(error)}), so what ${PROFILE_PATH} owes for ${nameList(filled.map(({ key }) => configKeyPath(key)))} could not be derived: a check that cannot derive the expectation must not report the profile as wrong`,
      );
    }

    const scriptsDir = outerLoopScriptsDir(config);
    const absent: string[] = [];
    const graded: string[] = [];
    const missing: MissingCommandEntry[] = [];
    let owed = 0;

    for (const { key, file } of filled) {
      const path = posix.join(scriptsDir, file);
      graded.push(`${configKeyPath(key)} → ${path}`);
      if (!isReadableFile(join(repoRoot, path))) absent.push(`${configKeyPath(key)} → ${path}`);

      for (const list of PERMISSION_LISTS) {
        const held = permissionEntries(profile, list);
        for (const entry of permissionEntries(expected, list).filter((rendered) => rendered.includes(file))) {
          owed += 1;
          if (!held.includes(entry)) missing.push({ list, entry });
        }
      }
    }

    const keys = `${filled.length} filled wrapped ${filled.length === 1 ? 'key' : 'keys'} (${nameList(filled.map(({ key }) => configKeyPath(key)))})`;

    // Its own sentence, and first: a wrapper that is not there is repaired by a different command than
    // an entry that is not there, and the entry lines below have to stay last for a paste to work.
    const one = absent.length === 1;
    const absentSentence =
      absent.length === 0
        ? ''
        : `${absent.length} of the ${filled.length} wrapper ${filled.length === 1 ? 'file' : 'files'} this repository's filled wrapped keys name ${one ? 'is' : 'are'} not readable under ${scriptsDir} — ${nameList(absent)} — so every entry naming ${one ? 'it' : 'them'} grants a path with no file at it, which is a repair of its own. Re-run \`${CLI} init\`, which writes each wrapper create-if-absent from the line its key holds.`;

    if (missing.length > 0) {
      const blocks = PERMISSION_LISTS.map((list) => ({
        list,
        entries: missing.filter((item) => item.list === list).map((item) => item.entry),
      }))
        .filter(({ entries }) => entries.length > 0)
        .map(({ list, entries }) => renderListGroup(list, entries));
      return warn(
        `${absentSentence}${absentSentence === '' ? '' : ' '}${PROFILE_PATH} is missing ${missing.length} of the ${owed} permission ${entryWord(owed)} this repository's ${keys} imply, so a command an agent runs from one of them matches neither allow nor deny and an unattended run hangs there with no diagnostic rather than failing. \`${CLI} init\` writes these entries from the commands it detected, so a key filled in afterwards carries none of them and no ordinary re-run adds them. Run \`${CLI} init --force\`, which regenerates the profile from the config as it now stands after copying the current one to a .bak sibling and carrying the plugin-root entries forward — or add each line below to that list in ${PROFILE_PATH} as its own string, unquoted exactly as it stands:\n${blocks.join('\n\n')}`,
      );
    }

    if (absentSentence !== '') {
      return warn(
        `${absentSentence} ${PROFILE_PATH} carries all ${owed} permission ${entryWord(owed)} this repository's ${keys} imply, so the entries are right and the ${one ? 'file is' : 'files are'} what is missing`,
      );
    }

    return pass(
      `${PROFILE_PATH} carries all ${owed} permission ${entryWord(owed)} this repository's ${keys} imply, and each names a wrapper that is readable: ${nameList(graded)}${describeAnsweredNone(answered)}`,
    );
  },
};

/**
 * `npm (commands.build, commands.depInstall)` — one head, with every configured line that runs it.
 *
 * Grouped by head rather than listed per line, so a package manager three keys reach is one name in
 * the report and not three; the sources are what say which line to correct, and a `<key> → <path>`
 * source is the line *inside* that wrapper while a bare key is the value in the config.
 */
function describeHeadSources(entries: readonly CommandHeadEntry[]): readonly string[] {
  const found = new Map<string, string[]>();
  for (const { head, source } of entries) {
    const sources = found.get(head);
    if (sources === undefined) found.set(head, [source]);
    else if (!sources.includes(source)) sources.push(source);
  }
  return [...found].map(([head, sources]) => `${head} (${sources.join(', ')})`);
}

/**
 * The clause for a command line whose head carries a `/`.
 *
 * Reported rather than resolved, and rather than dropped: a shell resolves such a head against the
 * filesystem and the directory the command runs in — never through `PATH` — so this check has no
 * question to ask about it, and warning that it is "not on `PATH`" would be a finding about a line
 * that may be perfectly correct. `./mvnw` is the form that makes this ordinary rather than exotic.
 */
function describePathHeads(pathHeads: readonly CommandHeadEntry[]): string {
  if (pathHeads.length === 0) return '';
  const one = pathHeads.length === 1;
  return `. ${nameList(describeHeadSources(pathHeads))} ${one ? 'is' : 'are'} **not** graded here: ${one ? 'that head carries a `/`' : 'those heads carry a `/`'}, so a shell resolves ${one ? 'it' : 'them'} against the filesystem and the directory the command runs in rather than through \`PATH\`, and this check decides nothing about ${one ? 'it' : 'them'}`;
}

/**
 * The clause both of this check's `pass` sentences carry about the one wrapper state that reaches
 * neither its graded nor its ungraded list.
 *
 * Stated rather than left silent, because a universal claim is only worth what its scope says: a
 * body {@link wrapperCommandLine} answers `unresolved` for runs no command at all, so there is no
 * head to resolve and nothing here to report — and a reader who does not know that reads this
 * check's `pass` as covering a wrapper that runs nothing.
 */
const UNRESOLVED_BODY_CLAUSE =
  'A wrapper whose body runs no command at all yields no head here and is claimed nothing about: the config and command-wrappers lines report that state between them';

/**
 * Does the command every configured line actually runs resolve on the `PATH` this run was given?
 *
 * **The three checks above grade the slot, the value and the entries; this one grades what the value
 * runs.** {@link CONFIG_CHECK} reports a key still holding `init`'s placeholder,
 * {@link COMMAND_WRAPPERS_CHECK} a key holding a raw line rather than its wrapper invocation, and
 * {@link COMMAND_PERMISSIONS_CHECK} the entries those keys imply and whether the wrapper file is
 * readable. A repository answers all three clean while every one of its wrappers exits 127 on every
 * invocation, because nothing asks whether the command *inside* the wrapper is installed. This asks
 * it, with `command -v` semantics, over every class {@link commandHeads} grades.
 *
 * **All four wrappers, `deploy.sh` included.** The reason {@link DAEMON_PATH_CHECK} leaves `deploy`
 * out — no daemon-launched run deploys — is that check's and does not hold here: this one grades the
 * shell `doctor` was typed at, which is the shell a deploy is dispatched from.
 *
 * **A `warn`, never a `fail`**, for {@link COMMAND_WRAPPERS_CHECK}'s stated reason: the repository
 * still runs in the foreground, and installing a tool is an operator step.
 *
 * **The three non-graded classes are reported rather than dropped**, each with why it is not graded —
 * a `/`-headed line is the filesystem's to resolve, a line that reduced to no binary name is
 * {@link describeUnreducible}'s, and a wrapper no file backs is {@link describeAbsentWrappers}'s —
 * and the `pass` sentence's universal claim is scoped to the heads that could be derived. An unfilled
 * `<configure this: …>` value is skipped by construction: {@link commandHeads} drops a value
 * {@link isPlaceholder} accepts before a head is taken, so such a key contributes nothing here and is
 * {@link CONFIG_CHECK}'s line.
 */
const COMMAND_RESOLVES_CHECK: Check = {
  id: 'command-resolves',
  title: "the command every configured commands.* line runs resolves on this machine's PATH",
  run: (ctx) => {
    if (ctx.repoRoot === undefined) return unevaluated('the repository root did not resolve (see the git check)');
    if (ctx.config === undefined) {
      return unevaluated(
        `${CONFIG_FILENAME} could not be read, so which command each configured line runs is unknown (see the config check)`,
      );
    }

    const heads = commandHeads(ctx.config, ctx.repoRoot);
    const notGraded = `${describePathHeads(heads.pathHeads)}${describeUngraded(
      heads.ungraded.map(({ text }) => text),
      heads.absent.map(({ text }) => text),
    )}`;

    if (heads.graded.length === 0) {
      return pass(
        `not graded, because no configured command line reduced to a bare binary name for a \`PATH\` to decide: a key still holding the placeholder init wrote is not a command line, and that is the config check's line, reported there once. ${UNRESOLVED_BODY_CLAUSE}${notGraded}`,
      );
    }

    const missing = heads.graded.filter(({ head }) => !resolvesOnPath(head));
    if (missing.length > 0) {
      const one = missing.length === 1;
      return warn(
        `${one ? 'a command' : `${missing.length} commands`} this repository's configured lines run ${one ? 'does' : 'do'} not resolve on the PATH this run was given: ${nameList(describeHeadSources(missing))}. Every dispatch of ${one ? 'that command' : 'those commands'} fails with \`command not found\`, and an unattended run dies at its first configured command. Two remedies: install the tool, or correct the raw command line the source names — a source spelled \`<key> → <path>\` is the line inside that wrapper, and a bare key is the value in ${CONFIG_FILENAME}. A warning rather than a failure, because the repository still runs in the foreground and installing a tool is an operator step. This grades the shell \`${CLI} doctor\` was typed at; whether the daemon's own environment reaches these binaries is the daemon-path line's question${notGraded}`,
      );
    }

    return pass(
      `every command head this check could derive from this repository's configured lines resolves on the PATH this run was given, each with what runs it: ${nameList(describeHeadSources(heads.graded))}. This grades the shell \`${CLI} doctor\` was typed at rather than a service manager's environment, which is the daemon-path line's question. ${UNRESOLVED_BODY_CLAUSE}${notGraded}`,
    );
  },
};

/**
 * `stateDir`, re-checked against both of the schema's clauses and then actually written into.
 *
 * This is the third of the three places `docs/config.md` §3 says the dot rule is enforced, and the
 * only one that runs against the value the repository *currently* holds. Both clauses are applied
 * separately, as the schema states them: the character-class `pattern` admits `.` and `/` after the
 * first character, so it alone would accept `sdlc/../.claude`, and the `(^|/)\.` clause is what
 * refuses a dot at the start of any segment. The dot clause is applied to the **raw** configured
 * value, since normalising one would strip a leading `./` that is itself a dot segment.
 *
 * Writability is answered by trying, through the write engine's {@link probeWritable}: a permission
 * bit, a read-only mount and a full filesystem are indistinguishable from a `stat`.
 */
const STATE_DIR_CHECK: Check = {
  id: 'state-dir',
  title: 'the run-artifact directory is not dot-named and can be written into',
  run: (ctx) => {
    if (ctx.repoRoot === undefined) return unevaluated('the repository root did not resolve (see the git check)');
    if (ctx.config === undefined) return unevaluated(`${CONFIG_FILENAME} could not be read (see the config check)`);

    const raw = ctx.config.stateDir;
    if (typeof raw !== 'string' || raw.trim() === '') {
      return fail(`stateDir is ${JSON.stringify(raw)} rather than a directory name, so there is no tree to check`);
    }

    if (STATE_DIR_DOT_PATTERN.test(raw)) {
      return fail(
        `stateDir is ${JSON.stringify(raw)}, which has a path segment starting with '.': the run-artifact tree has to be writable by an unattended run, and a dot-path is where a host reserves directories an unattended run may not write to — measured for .claude/**, where such a run completes with exit 0 having written nothing. Set stateDir in ${CONFIG_FILENAME} to a name without a leading dot; do not "fix" it back to a dot-name`,
      );
    }
    if (!STATE_DIR_PATTERN.test(raw)) {
      return fail(
        `stateDir is ${JSON.stringify(raw)}, which is not a legal directory name: it must start with a letter, a digit or an underscore, may then contain letters, digits, '.', '_', '-' and '/', and may end with one '/'`,
      );
    }

    // `resolve` rather than `join`: the two clauses above have already established that the value is
    // relative and dot-free, and resolving drops the trailing separator a configured `sdlc-harness/`
    // carries, so the path this check names is the one every other message names.
    const root = resolvePath(ctx.repoRoot, raw);
    if (!isDirectory(root)) {
      return fail(
        `stateDir is ${JSON.stringify(raw)} and there is no directory at ${root}: the run-artifact tree is missing — run \`${CLI} init\`, which creates it and rewrites nothing that is already there`,
      );
    }

    const problem = probeWritable(root);
    if (problem !== undefined) return fail(`${root} is ${problem}`);

    return pass(
      `${raw} is not dot-named, and a probe file was created and removed in ${root}, so a run can write its artifacts there`,
    );
  },
};

/**
 * Does the tree hold the artifact directories the configured phases call for?
 *
 * The list is {@link selectedStateDirs}'s, which is the same list `init` writes from — a second copy
 * here would drift the first time a directory was added or gated. A `warn`: `init` creates what is
 * missing and rewrites nothing, so this is the state a repository is in after a phase is turned on
 * and before the next `init`, which is a fixable condition rather than a broken one.
 */
const STATE_DIR_TREE_CHECK: Check = {
  id: 'artifact-tree',
  title: 'every artifact directory the configured phases call for is present',
  run: (ctx) => {
    if (ctx.repoRoot === undefined) return unevaluated('the repository root did not resolve (see the git check)');
    if (ctx.config === undefined) return unevaluated(`${CONFIG_FILENAME} could not be read (see the config check)`);

    // The same two clauses the state-dir check applies, asked here only as a precondition: a value
    // that fails either of them has already been reported there, and resolving it would name a
    // directory outside the repository or beneath a dot segment.
    const raw = ctx.config.stateDir;
    if (typeof raw !== 'string' || STATE_DIR_DOT_PATTERN.test(raw) || !STATE_DIR_PATTERN.test(raw)) {
      return unevaluated('stateDir does not name a usable directory (see the state-dir check)');
    }

    const root = resolvePath(ctx.repoRoot, raw);
    const expected = selectedStateDirs(ctx.config.phases);
    const missing = expected.filter((entry) => !isDirectory(join(root, entry.dir))).map((entry) => entry.dir);

    if (missing.length > 0) {
      return warn(
        `${missing.length} of the ${expected.length} artifact directories the configured phases call for are missing under ${root}: ${nameList(missing)} — run \`${CLI} init\` to create them; it rewrites nothing that is already there`,
      );
    }
    return pass(
      `all ${expected.length} artifact directories the configured phases call for are present under ${root}`,
    );
  },
};

/**
 * Setup's judgement half, reported as the four facts that decide it: a configured conventions
 * document with nothing behind it, one that is still an untouched skeleton, a configured
 * `layers[].path` naming no directory, and an always-loaded project file still carrying the
 * setup-pending banner.
 *
 * **It grades substring facts and never prose.** Whether a rule somebody wrote is a good rule is not
 * a question a `doctor` run can answer, and a check that tried would turn a repository red over a
 * document one person wrote and another would have written differently (`docs/analyze.md` §7). What
 * it costs to grade these four is nothing, and what it buys is that `doctor` predicts what a run in
 * this repository will find rather than reporting on wiring alone.
 *
 * **The document set is derived here, in the same terms `init`'s offer resolution derives it**
 * (`commands/init.ts`): every `layers[].conventions` value, normalized and deduplicated, plus
 * {@link SHARED_CONVENTIONS_PATH} whether or not a layer names it. `generators/claudeContext.ts`'s
 * own collector is module-private, so each consumer walks `layers[]` itself while all of them take
 * the shared document's path from that one exported constant — the duplication is bounded to the
 * walk, and the two cannot disagree about which documents should exist.
 *
 * **The layer's other pointer is graded in that same walk, because it is the scope rather than a
 * document.** `layers[].path` is what every dispatched agent is handed, and a path resolving to
 * nothing does not error — it returns no files, so each agent scoped to it reports having found
 * nothing wrong. `config/check.ts` grades that value as a non-empty string and makes no filesystem
 * call, which leaves a `statSync` per layer as the only thing that answers whether the directory is
 * there; a `statSync` is a deterministic fact, which is why it belongs in this check rather than
 * beside it. **The same root seen from the other direction is deliberately not graded here**: a
 * conventions document sitting in the tree for a layer `layers[]` does not carry needs a walk of the
 * conventions directory rather than a stat of a configured value, and is left for a later check.
 *
 * **"Unfilled" is the two-part test, never the marker alone** ({@link UNFILLED_STUB_MARKER}): each
 * template's footer tells a hand-writer to replace everything above it, so a document written by
 * hand has lost its guidance block while possibly keeping a trailing HTML comment nobody thought to
 * delete. Grading on the marker alone would report that finished document as unfilled in every
 * `doctor` run for the life of the repository, with the only stated remedy being the command that
 * adopter declined — which is exactly the state this check exists to *predict* rather than to
 * manufacture. Both halves are plain substrings, so the scope is unchanged. It is the same test
 * `init` and the analyze command apply.
 *
 * **Every state warns, and none fails.** An unfilled skeleton is a repository whose flow *runs*,
 * with worse results, so promoting it would make every freshly wired repository exit non-zero for
 * the one condition `init` cannot resolve on its own — the same reasoning the marketplace-entry
 * warning already carries (module header, choice 2).
 *
 * **Every warning names a remedy that does not require the declined command.** An unfilled document
 * is cleared by replacing its guidance block, by hand or by the command; the banner is cleared by
 * deleting its block, by hand or by the command; a missing document is `init`'s to write, or a
 * `layers[].conventions` value's to correct. A warning whose only route out is the command an
 * adopter turned down is a standing warning they can never clear.
 *
 * It reads files and writes none.
 */
const SETUP_ANALYSIS_CHECK: Check = {
  id: 'setup-analysis',
  title: 'the conventions documents and layer directories the configuration points at exist and have been filled in',
  run: (ctx) => {
    if (ctx.repoRoot === undefined) return unevaluated('the repository root did not resolve (see the git check)');
    if (ctx.config === undefined) {
      return unevaluated(`${CONFIG_FILENAME} could not be read, so which conventions documents this repository should have is unknown (see the config check)`);
    }
    if (!Array.isArray(ctx.config.layers)) {
      return unevaluated('layers does not list layer profiles, so the documents and directories it points at cannot be collected (see the config check)');
    }

    // One walk of `layers[]` for both of the pointers an entry carries: the document its implementer
    // reads, and the directory its work is scoped to. A value that is not a non-empty string is a
    // finding `config/check.ts` has already reported, so it is skipped rather than turned into a
    // second one.
    const sharedPath = normalizeRepoPathStrict(SHARED_CONVENTIONS_PATH);
    const configured = new Set<string>();
    const layerDirectories: { readonly name: string; readonly path: string }[] = [];
    for (const [index, layer] of ctx.config.layers.entries()) {
      const conventions = layer?.conventions;
      if (typeof conventions === 'string' && conventions.trim() !== '') {
        configured.add(normalizeRepoPathStrict(conventions));
      }

      const path = layer?.path;
      if (typeof path !== 'string' || path.trim() === '') continue;
      const name = layer?.name;
      layerDirectories.push({
        // A layer whose name is missing or blank is the config check's finding too; it is named here
        // by the key an adopter edits, so the line still points at exactly one row.
        name: typeof name === 'string' && name.trim() !== '' ? name : `layers[${index}]`,
        path: normalizeRepoPathStrict(path),
      });
    }
    const documents = [...new Set([sharedPath, ...configured])];

    // One pass: a document that is not there cannot also be a skeleton, so the two facts are
    // gathered from the single read each document gets.
    const missing: string[] = [];
    const unfilled: string[] = [];
    for (const path of documents) {
      let content: string;
      try {
        content = readFileSync(join(ctx.repoRoot, path), 'utf8');
      } catch {
        missing.push(path);
        continue;
      }
      if (content.includes(UNFILLED_STUB_MARKER) && content.includes(SKELETON_GUIDANCE_MARKER)) unfilled.push(path);
    }

    // The same normalisation the documents got, so `./src/data` and `src/data/` are one path — and
    // the repository root, which the catch-all layer carries, normalises to `.` and always resolves.
    const repoRoot = ctx.repoRoot;
    const brokenPaths = layerDirectories.filter((layer) => !isDirectory(join(repoRoot, layer.path)));

    // A repository whose always-loaded file is absent, or was never generated by this CLI, simply
    // has no banner — which is a state to report nothing about rather than a finding.
    let banner = false;
    try {
      banner = readFileSync(join(ctx.repoRoot, CLAUDE_MD_PATH), 'utf8').includes(SETUP_PENDING_OPEN);
    } catch {
      banner = false;
    }

    const findings: string[] = [];

    // Split by whether a layer actually points at the missing path, because the remedy differs: the
    // shared document is expected whether or not any layer names it, so when it is the missing one
    // and no layer points at it there is no configured value to correct.
    const missingConfigured = missing.filter((path) => configured.has(path));
    const missingShared = missing.filter((path) => !configured.has(path));
    if (missingConfigured.length > 0) {
      findings.push(
        `${missingConfigured.length} of the ${documents.length} conventions documents this repository should have ${missingConfigured.length === 1 ? 'is' : 'are'} not there: ${nameList(missingConfigured)} — each is a configured \`layers[].conventions\` value, so it is a pointer an implementer of that layer follows to nothing. Either the path is wrong, which \`${CLI} config set layers\` corrects, or the tree was never generated, which \`${CLI} init\` writes`,
      );
    }
    if (missingShared.length > 0) {
      findings.push(
        `the shared cross-layer document ${nameList(missingShared)} is not there, and no layer points at it: it holds the rules that span every layer and is written whether or not a layer names it, so there is no \`layers[].conventions\` value to correct — run \`${CLI} init\`, which creates it and rewrites nothing that is already there`,
      );
    }
    if (brokenPaths.length > 0) {
      findings.push(
        `${brokenPaths.length} of the ${layerDirectories.length} layers this repository configures ${brokenPaths.length === 1 ? 'points' : 'point'} at a directory that is not there: ${nameList(brokenPaths.map((layer) => `${layer.name} → ${layer.path}`))} — \`layers[].path\` is the scope every dispatched agent is handed, so a path resolving to nothing returns no files and every agent scoped to it reports having found nothing wrong. Either the path is wrong, which \`${CLI} config set layers\` corrects, or the directory was never created`,
      );
    }
    if (unfilled.length > 0) {
      findings.push(
        `${unfilled.length} of the ${documents.length} conventions documents this repository should have ${unfilled.length === 1 ? 'is' : 'are'} still an untouched skeleton: ${nameList(unfilled)} — the flow runs against ${unfilled.length === 1 ? 'it' : 'them'} and does worse work, because the rules its implementers and reviewers read are the ones nobody has written yet. Run \`${ANALYZE_COMMAND}\` in a session here, or write the rules in by hand: replacing the guidance block is what clears this, exactly as each document's own footer says`,
      );
    }
    if (banner) {
      findings.push(
        `${CLAUDE_MD_PATH} still carries the setup-pending banner, so every session in this repository is told on every turn that setup is unfinished: run \`${ANALYZE_COMMAND}\`, which removes the block as its last act, or delete the \`${SETUP_PENDING_OPEN}\` … \`${SETUP_PENDING_CLOSE}\` block by hand once those sections are written`,
      );
    }

    if (findings.length > 0) return warn(findings.join('; '));

    return pass(
      `all ${documents.length} conventions documents this repository should have are there, none is still an untouched skeleton, the ${layerDirectories.length} configured layer ${layerDirectories.length === 1 ? 'directory is' : 'directories are'} there, and ${CLAUDE_MD_PATH} carries no setup-pending banner`,
    );
  },
};

/**
 * Whether the always-loaded file's change-request fence points at rules that are on disk.
 *
 * **The failure it exists to make visible is a silent one.** The fence in `.claude/CLAUDE.md` names
 * {@link TASK_OFFER_PATH} and fails closed: an agent that cannot read that file makes no offer and
 * carries the request out in the session it arrived in. That is the right behaviour and it produces
 * no artifact, no error and no line anywhere, so a deleted or never-generated rules file turns the
 * offer off with nothing reporting it — which is what this check reports.
 *
 * **A project file that does not name the path is graded on what is beside it.** The rules file is
 * planned on every run and the always-loaded file is never upgraded by an unforced one, so an
 * adopter whose `.claude/CLAUDE.md` predates this feature comes out of the next `init` holding the
 * rules file with nothing pointing at it — the reverse dangle, and the state the feature is inert
 * in. That warns. Only a repository carrying neither half passes: no fence, and nothing on disk
 * for one to reach.
 *
 * **The finding warns and never fails.** The repository is fully functional — every request still
 * gets done, in the receiving session — so what is lost is the offer, not the run. A missing rules
 * file is reported with both routes, because this check cannot distinguish an accident from an
 * adopter turning the offer off: one `init` re-creates the file under `create-if-absent` and touches
 * nothing else, and removing the fence section from `.claude/CLAUDE.md` is the deliberate off-state
 * the check already passes on. The remedy for a missing fence costs the adopter something either
 * way, which is why it is offered as a choice rather than as one command.
 *
 * It reads one file, tests one for existence, and writes none.
 */
/**
 * The heading of the fence section in the always-loaded file, named by both warnings: adding it by
 * hand is the remedy when the rules file is there and the fence is not, and removing it is the
 * deliberate off-state offered when the fence is there and the rules file is not. Either way the
 * warning has to say which section. Spelled here rather than imported because the template is the
 * source and this is a quotation of it, not a use of it.
 */
const TASK_OFFER_SECTION = '## Where a change request runs';

const TASK_OFFER_RULES_CHECK: Check = {
  id: 'task-offer-rules',
  title: "the change-request offer's rules file is there for the fence that points at it",
  run: (ctx) => {
    if (ctx.repoRoot === undefined) return unevaluated('the repository root did not resolve (see the git check)');

    let projectFile: string;
    try {
      projectFile = readFileSync(join(ctx.repoRoot, CLAUDE_MD_PATH), 'utf8');
    } catch {
      return unevaluated(
        `${CLAUDE_MD_PATH} could not be read, so whether it points at ${TASK_OFFER_PATH} is unknown (see the setup-analysis check)`,
      );
    }

    const rulesPresent = existsSync(join(ctx.repoRoot, TASK_OFFER_PATH));

    if (!projectFile.includes(TASK_OFFER_PATH)) {
      if (rulesPresent) {
        return warn(
          `${TASK_OFFER_PATH} is there and ${CLAUDE_MD_PATH} does not name it, so the change-request offer is off in this repository and the rules file nobody reads is what says so: ${TASK_OFFER_PATH} is written on every run, while a ${CLAUDE_MD_PATH} that predates this feature is kept as it stands by every unforced \`${CLI} init\`. Add the \`${TASK_OFFER_SECTION}\` section to ${CLAUDE_MD_PATH} by hand, copying it from the template this CLI ships, or run \`${CLI} init --force\` — which re-renders the whole project file after one \`.bak\` and costs every section \`${ANALYZE_COMMAND}\` filled`,
        );
      }
      return pass(
        `neither ${CLAUDE_MD_PATH} nor this repository carries the change-request offer, so there is no fence and nothing pointing at a file that is not there: every request is carried out in the session that receives it, which is what a project file written before this feature does`,
      );
    }

    if (!rulesPresent) {
      return warn(
        `${CLAUDE_MD_PATH} names ${TASK_OFFER_PATH} and that file is not there, so the fence points at rules nobody can read: every change request in this repository is carried out in the session that receives it and no run is offered. This check cannot tell an accident from a deliberate removal, so it names both routes: if the offer is wanted, run \`${CLI} init\`, which re-creates that file under create-if-absent and touches nothing else; if it is not, remove the \`${TASK_OFFER_SECTION}\` section from ${CLAUDE_MD_PATH}, which is the off-state this check passes on`,
      );
    }

    return pass(
      `${CLAUDE_MD_PATH} names ${TASK_OFFER_PATH} and that file is there, so the change-request fence reaches the rules it points at`,
    );
  },
};

/**
 * The analyze target that addresses the layer profile, taken from the one list that declares the
 * reserved targets (`generators/claudeContext.ts`). Typed against that list rather than indexed into
 * it, so dropping the target from it is a compile error here rather than a remedy naming an argument
 * the command no longer takes.
 */
const LAYERS_TARGET: (typeof RESERVED_ANALYZE_TARGETS)[number] = 'layers';

/** The config key a review is recorded under, as both warning remedies tell an operator to set it. */
const REVIEW_KEY = 'detection.review';

/**
 * What detection recorded about *why* it chose the preset it chose, as a parenthetical.
 *
 * Every value is rendered only when the record carries it, and each absence has a phrase of its own:
 * `detection` declares no required sub-keys (`config/model.ts`, and the schema's own comment on why),
 * so a config carrying only `detection.review` reaches this with everything else absent, and a
 * detail printing the token `undefined` at an adopter is the one output this check may not produce.
 */
function detectionProvenance(detection: HarnessDetection): string {
  const signal = detection.signal === undefined ? 'no signal recorded' : `signal \`${detection.signal}\``;
  const evidence = detection.evidence === undefined ? '' : `, evidence \`${detection.evidence}\``;
  return `${signal}${evidence}`;
}

/**
 * Is the layer profile one that was detected or reviewed, or the unrecognised-layout fallback nobody
 * has looked at?
 *
 * **The gate is two conjuncts, and that is the point.** A profile carrying no row scoped below the
 * repository root is not a finding on its own — `monorepo` writes one deliberately
 * (`detect/presets.ts`), and so does an adopter who decided this repository has one scope — so what
 * tells the deliberate profile from the placeholder is the `detection` record beside it:
 * {@link FALLBACK_PRESET} is the signal table's unconditional last row, which means nothing was
 * recognised, and a record that names no preset — absent, or present holding only a review — means
 * nothing was ever said.
 * **A recorded preset is not by itself enough**, which is why the clearing arm reads
 * `LAYERLESS_BY_DESIGN_PRESETS` (`detect/presets.ts`) rather than "any preset but the fallback":
 * every other preset resolves a source root and writes the catch-all row alone only when that root
 * was absent — a `pubspec.yaml` with no `lib/`, a Gradle project with no `src/main`. That is an
 * unresolved layout, not a chosen one, and `buildPreset`'s one-time init warning about it is not
 * repeated by anything else.
 * **The `tests` row does not clear it either**, which is why it is excluded from the scoped rows
 * below: every preset splices that row in wherever the toolchain's conventional test root exists
 * (`presetLayers`, `detect/presets.ts`), independently of whether a source root resolved, so a
 * repository whose only row below the catch-all is `tests` has the unresolved **implementation**
 * profile this check grades. `buildPreset` gates its init warning on the source rows for the same
 * reason, so the two channels report that repository together.
 * A row is identified by its normalised `path` against {@link LAYER_CATCH_ALL_PATH} — never by the
 * name `general`, per that constant's own note — and the profile is graded on whether *any* row is
 * scoped below it rather than on the row count, because the schema permits more than one catch-all
 * row. That is the exact complement of the test {@link LAYER_DRIFT_CHECK} applies, so the two
 * partition the repositories between them rather than both standing down on one.
 *
 * **It is deliberately blind to the conventions documents.** {@link SETUP_ANALYSIS_CHECK} above
 * grades those, and its skeleton warning was the last indirect trace that a fallback profile had
 * never been examined — a trace `/autonomous-sdlc-harness:harness-analyze conventions` clears by filling the documents,
 * leaving `doctor` green about a profile nobody looked at. This check reads no document, so that
 * command does not move it.
 *
 * **A `detection.review` record is the one thing that clears it**, written by the analyze command's
 * `layers` target through `config set detection.review` or by hand. All three verdicts clear it
 * (`config/model.ts`'s `LAYER_REVIEW_VERDICTS`), the two declines included: what is graded is
 * whether the profile was considered, not what was concluded.
 *
 * **It never fails**, for {@link SETUP_ANALYSIS_CHECK}'s reason — an unreviewed profile is a
 * repository whose flow runs, with worse routing — and every warning arm names a remedy that does
 * not require the analyze command, per that check's own standing rule. **None of them names
 * `init --reset-config`**: that rebuilds the whole config from detection and the flags, keeping only
 * `appDir` (`docs/cli.md` §3), so an adopter clearing a cosmetic warning by following it loses every
 * hand-set value — a phase toggle turned on by hand, an added `protectedBranches` entry, a corrected
 * command line.
 *
 * It reads the config and writes nothing.
 */
const LAYER_PROFILE_CHECK: Check = {
  id: 'layer-profile',
  title: 'the layer profile is a resolved detection or a reviewed one rather than an unexamined catch-all',
  run: (ctx) => {
    if (ctx.repoRoot === undefined) return unevaluated('the repository root did not resolve (see the git check)');
    if (ctx.config === undefined) {
      return unevaluated(`${CONFIG_FILENAME} could not be read, so which layer profile this repository routes by is unknown (see the config check)`);
    }
    if (!Array.isArray(ctx.config.layers)) {
      return unevaluated('layers does not list layer profiles, so whether the profile is the generated catch-all cannot be told (see the config check)');
    }

    const layers = ctx.config.layers;
    const detection = ctx.config.detection;
    const review = detection?.review;

    // Ahead of the conjuncts, and the arm that grades nothing: a `layers[]` with no row at all is
    // `config/check.ts`'s finding rather than this one's, and is reported as not graded so one
    // finding does not become two.
    if (layers.length === 0) {
      return pass(
        `not graded, because layers[] carries no row at all, so there is no generated catch-all row to tell from a chosen profile: that a profile lists no layer is the config check's line to say`,
      );
    }

    // The provenance is carried into the shape arms as well, so the line a detected repository gets
    // names the preset it was detected as rather than only the row count. Dropped where there is
    // nothing to quote, for {@link detectionProvenance}'s reason.
    const recordedPreset =
      detection === undefined || detection.preset === undefined
        ? ''
        : `, and detection recorded the \`${detection.preset}\` preset (${detectionProvenance(detection)})`;

    // Conjunct 1, and the first pass arm: a row scoped below the repository root is a profile
    // somebody shaped, whatever `detection` says about it. Tested over the **set** rather than on
    // `layers.length === 1`, because the schema deliberately permits more than one catch-all row
    // (`layers.contains` asserts at least one and draft-07 states no upper bound, so `config/check.ts`
    // does not reject a second) — and a profile of two catch-all rows is still nothing but the row
    // init generates. Keyed on the row count it passed as "more than the generated catch-all row",
    // which is false, while `layer-drift` read the same repository as not-graded, so both stood down.
    // This is the exact complement of {@link LAYER_DRIFT_CHECK}'s gate, which is what makes the
    // partition property stated above and in the `CHECKS` comment hold. Each path is normalised with
    // that check's helper, so `"./"` is the catch-all to both; a value that is not a non-empty string
    // is `config/check.ts`'s finding and is skipped rather than turned into a second one.
    const scoped: string[] = [];
    for (const [index, layer] of layers.entries()) {
      const path = layer?.path;
      if (typeof path !== 'string' || path.trim() === '') continue;
      if (normalizeRepoPathStrict(path) === LAYER_CATCH_ALL_PATH) continue;
      const name = layer?.name;
      // The `tests` row is skipped for the reason stated above: it is spliced in by test root alone
      // and so says nothing about whether an implementation root resolved. Keyed on the name rather
      // than the path because the path is the per-toolchain spelling (`test/`, `spec/`, `src/test/`)
      // while the name is the one routing tag `TESTS_LAYER_NAME` fixes across every preset.
      if (name === TESTS_LAYER_NAME) continue;
      scoped.push(typeof name === 'string' && name.trim() !== '' ? name : `layers[${index}]`);
    }
    if (scoped.length > 0) {
      return pass(
        `layers[] carries ${layers.length} ${layers.length === 1 ? 'row' : 'rows'}, ${scoped.length} of them scoped below the catch-all ${JSON.stringify(LAYER_CATCH_ALL_PATH)} (${nameList(scoped)}), so the profile is more than the row init generates for an unrecognised layout${recordedPreset}`,
      );
    }

    // Conjunct 3, second: a recorded verdict says the profile was considered, and the rationale is
    // the half of that record a reader of the committed file actually acts on.
    if (review?.verdict !== undefined) {
      const rationale = review.rationale === undefined ? 'no rationale recorded' : `rationale ${JSON.stringify(review.rationale)}`;
      const at = review.at === undefined ? '' : `, recorded ${review.at}`;
      return pass(
        `the layer profile carries a recorded review — verdict \`${review.verdict}\`, ${rationale}${at} — so its catch-all-only profile is a profile that was looked at rather than the one init generated and nobody examined`,
      );
    }

    // Conjunct 2, last: a recorded preset whose catch-all-only profile is a *decision*
    // (`LAYERLESS_BY_DESIGN_PRESETS`, plus the fallback tested beside it, which is never in that set).
    // Narrowed to that set rather than to "any preset but the fallback": every other preset resolves
    // a source root and writes one row only when that root was **not** found, which is the state this
    // check exists to keep reporting. A record that names no preset is not a decision either — it
    // carries no more about the layout than an absent one — so it falls to the warn arms below.
    // The detail carries `init`'s half of the same statement — the dispatch consequence and the
    // next step — so either command alone leaves the adopter with the whole state; `buildPreset`
    // carries this arm's half, gated on the same set. It stays a pass: it names what would propose
    // a profile, not a remedy to run, which is what separates it from the warn arms.
    if (detection?.preset !== undefined && detection.preset !== FALLBACK_PRESET && LAYERLESS_BY_DESIGN_PRESETS.has(detection.preset)) {
      return pass(
        `detection recorded the \`${detection.preset}\` preset (${detectionProvenance(detection)}), whose catch-all-only profile is a decision rather than an unresolved source root — a monorepo's packages are a judgement call the preset table declines to make — so that record's profile is this repository's profile. \`init\` announced it once: every dispatch in this repository is routed to that one layer, and per-package or per-module layers are \`${ANALYZE_COMMAND}\`'s to propose`,
      );
    }

    const remedies = `Run \`${ANALYZE_COMMAND} ${LAYERS_TARGET}\` in a session here: the target proposes a profile or records that it considered one and declined, and either record clears this. It can also be cleared by hand with \`${CLI} config set ${REVIEW_KEY} '<json>'\``;

    // No recorded preset, whether or not a record exists: `detection` requires no key, so a
    // hand-written record holding only a review reaches here, and it says nothing about the layout.
    if (detection?.preset === undefined) {
      return warn(
        `this repository's ${CONFIG_FILENAME} records no detected layer preset, so its catch-all-only profile cannot be told from a profile somebody chose — the record predates this release, was hand-edited, or holds only a review. Run \`${ANALYZE_COMMAND} ${LAYERS_TARGET}\`, or record the review by hand with \`${CLI} config set ${REVIEW_KEY} '<json>'\``,
      );
    }

    // The forced arm evaluated no signal at all, so it has no evidence to quote and saying "the
    // fallback caught this run" of it would be false: `--preset` set the value on the command line.
    // It names the *recorded* preset rather than the fallback, because a forced preset that resolved
    // no source root reaches here carrying its own name.
    if (detection.signal === FORCED_SIGNAL_ID) {
      return warn(
        `the \`${detection.preset}\` preset was forced on the command line, so no layout signal was evaluated, and layers[] still carries no row scoped below the repository root — every dispatch in this repository is routed to that one layer. ${remedies}`,
      );
    }

    // A preset was recognised, but its source root was not: each of these presets writes the layer it
    // resolves and falls back to the catch-all alone when the directory is absent — a pubspec with no
    // `lib/`, a Gradle module with no `src/main`, a Gemfile with neither `app/` nor `lib/`.
    // `buildPreset` says so once at init, in a line that scrolls past on the adoption run and is
    // never repeated, so this is the arm that keeps saying it.
    if (detection.preset !== FALLBACK_PRESET) {
      return warn(
        `detection recorded the \`${detection.preset}\` preset (${detectionProvenance(detection)}), but that preset's source root was not found, so layers[] carries no row scoped below the repository root — every dispatch in this repository is routed to that one layer. ${remedies}`,
      );
    }

    return warn(
      `the layer profile is the unrecognised-layout fallback (${detectionProvenance(detection)}), not a detected or reviewed one, and layers[] still carries no row scoped below the repository root — every dispatch in this repository is routed to that one layer. ${remedies}`,
    );
  },
};

/**
 * Which source directories under the application directory no `layers[]` entry covers, and so route
 * to the catch-all row every profile ends with.
 *
 * **The set itself is {@link layerCoverage}'s, not this check's** — `init` reports the same
 * directories at the end of an adoption run, and a second derivation here would let the two commands
 * describe one repository differently. What stays here is the grading and the wording.
 *
 * **The not-graded arm is Finding 38's own amendment**: a profile that is nothing but the catch-all
 * row makes every directory qualify, so `layerCoverage` does not grade it and that state is
 * {@link LAYER_PROFILE_CHECK}'s to report, once, as itself.
 *
 * **A `warn`, never a `fail`**, for {@link SETUP_ANALYSIS_CHECK}'s reason — a repository routing a
 * directory to the catch-all runs, with worse routing. **The remedy is
 * `core/layerGapRemedy.ts`'s**, shared with `init`'s note so the two commands cannot word one
 * repository's next step two ways; that module is where either arm's spelling changes.
 *
 * **It reads `detection.review` for reporting only, never as a gate.** A recorded review does not
 * silence this check, and the reason is unchanged: a verdict describes the profile at the moment it
 * was reviewed, so a layer hand-added afterwards is exactly the drift this check exists to name, and
 * `layerCoverage` grades the same set either way. What the record changes is what the warning *says* —
 * it names the verdict and its date, so an adopter is not told about a decision the file already
 * holds as though nothing had been decided, and the remedy leads with `config set layers` instead of
 * sending them to the command that re-derives that decision.
 *
 * It reads directory entries and resolves each candidate against the repository's ignore rules, and
 * writes nothing.
 */
const LAYER_DRIFT_CHECK: Check = {
  id: 'layer-drift',
  title: 'every source directory under the application directory is covered by a layer',
  run: (ctx) => {
    if (ctx.repoRoot === undefined) return unevaluated('the repository root did not resolve (see the git check)');
    if (ctx.config === undefined) {
      return unevaluated(`${CONFIG_FILENAME} could not be read, so which directories the layer profile covers is unknown (see the config check)`);
    }
    const repoRoot = ctx.repoRoot;
    const config = ctx.config;
    if (!Array.isArray(config.layers)) {
      return unevaluated('layers does not list layer profiles, so which directories they cover cannot be collected (see the config check)');
    }

    const { graded, appDir, covering, candidates, uncovered } = layerCoverage({ repoRoot, config });

    if (!graded) {
      return pass(
        `not graded, because this repository's profile carries no row scoped below the repository root — nothing but the catch-all row every preset generates — so every directory would qualify and the report would be the whole tree; that state is \`${LAYER_PROFILE_CHECK.id}\`'s to report, once, as itself`,
      );
    }

    if (uncovered.length > 0) {
      // The recorded review is named, not obeyed: it describes the profile as it stood at review
      // time, so this check keeps naming every directory the profile does not cover, including any
      // added since. Dropped where there is nothing recorded to quote, and each field rendered only
      // where it is present, for {@link detectionProvenance}'s reason — no `undefined` token reaches
      // an adopter. Both the clause and the remedy are `core/layerGapRemedy.ts`'s single spelling,
      // shared with `init`'s gap note; this arm passes only its own command constants.
      const review = config.detection?.review;
      const clause = recordedVerdictClause(review);
      const remedy = layerGapRemedy({ review, analyzeCommand: ANALYZE_COMMAND, cli: CLI });
      return warn(
        `${uncovered.length} of the ${candidates.length} source directories under \`${appDir}\` ${uncovered.length === 1 ? 'is' : 'are'} covered by no layer and ${uncovered.length === 1 ? 'routes' : 'route'} to the catch-all: ${nameList(uncovered)} — an implementer and a reviewer working there are handed the shared cross-layer document rather than that layer's own rules.` +
          `${clause === undefined ? '' : ` ${clause}, which describes the profile as it stood then — this check still names every directory the profile does not cover, including any added since.`} ${remedy}`,
      );
    }

    return pass(
      `every source directory under \`${appDir}\` is covered by a layer — ${candidates.length} checked, against the ${covering.length} configured non-catch-all ${covering.length === 1 ? 'layer' : 'layers'} ${nameList(covering.map((layer) => `${layer.name} → ${layer.path}`))}`,
    );
  },
};

/**
 * The comment lines an earlier release wrote above the whole-directory rule, identified by a phrase
 * from each rather than by their full text.
 *
 * They are dead prose now — they state that the clarification channel has no committed README, which
 * the tree generator's row for it made false — and they survive a re-run for exactly the reason the
 * rule does. A substring is what is matched because those two lines were wrapped by the template
 * that emitted them and may have been re-wrapped by hand since; the phrases below are the parts that
 * carry the claim. Nothing the current template emits contains either of them, which is the property
 * the fresh-repository test in `test/doctor.test.mjs` holds in place.
 */
const SUPERSEDED_CLARIFICATION_COMMENTS: readonly string[] = Object.freeze([
  'created on first write rather than by init',
  'can be ignored as a whole directory',
]);

/**
 * A managed-block line that excepts a directory's committed contract file from a rule beside it,
 * with the path it re-includes captured.
 *
 * It decides **which remedy** a hidden path gets — a negation that is present and shadowed is a line
 * to move, a negation that is absent is a line to merge back — and it no longer decides *which paths
 * are asked about*: that set is {@link contentsIgnoredDirectories}'s, because a negation an adopter
 * deleted removes the path from the file and must not remove it from the question.
 */
const README_NEGATION_PATTERN = /^!(.+\/README\.md)$/;

/**
 * The managed block's own lines: the run of non-blank lines beneath {@link GITIGNORE_BLOCK_HEADER},
 * which is the extent the write engine maintains and the extent that constant's own doc states.
 *
 * Empty when the header is not in the file, which is a repository whose block was never written or
 * was renamed — there is then no block for a rule to be read out of, and the caller says so rather
 * than reading the adopter's own rules as the harness's.
 */
function managedBlockLines(lines: readonly string[]): readonly string[] {
  const headerIndex = lines.indexOf(GITIGNORE_BLOCK_HEADER);
  if (headerIndex < 0) return [];
  const block: string[] = [];
  for (let at = headerIndex + 1; at < lines.length && lines[at] !== ''; at += 1) block.push(lines[at] as string);
  return block;
}

/**
 * The ignore rule no re-run can repair: a whole-directory exclusion of the clarification channel,
 * left above the contents-plus-exception pair that replaced it.
 *
 * **This is the one wiring defect in this file whose remediation is a hand edit**, and that is what
 * makes it `doctor`'s to find. The managed block is appended to and never pruned
 * (`generators/repoRoot.ts`'s {@link clarificationsIgnoreRules}), so an upgraded repository keeps the
 * old line; git cannot re-include a file whose parent directory is excluded, so the exception under
 * it does nothing; and the visible result is one untracked file that looks exactly like a directory
 * the flow forgot to document. Every command still reports success — which is the silent-failure
 * shape this whole file exists to convert into a line someone reads.
 *
 * The grades follow what is actually hidden. Both rules present is a `fail`: the channel's committed
 * contract is being ignored right now. The old rule *alone* is a `warn` — that repository predates
 * the tree row, so there is no README to hide yet, and the finding is that the next `init` creates
 * one and appends the pair beneath a rule that will swallow it. The two superseded comment lines are
 * reported inside whichever of those the repository is in, rather than as a finding of their own, so
 * that one hand edit closes the whole thing instead of leaving prose that contradicts the comment
 * beside it.
 *
 * **On top of that diagnosis it tests the property the pass claims, and tests it with git.** For
 * every README {@link contentsIgnoredDirectories} says the tree generator commits into a
 * contents-ignored directory, {@link pathIsIgnored} is asked whether that path is excluded here; any
 * that is makes this a `fail` naming it, and a probe that did not answer makes it a `warn` saying so.
 * That covers every pair without naming one and without reading direction: a rule above a negation
 * and a rule below it hide the file identically, so the layout test this check used to end on looked
 * in one of the two directions the fault comes from — and printed a pass about a README `git add`
 * refused in the same working tree.
 *
 * **The subject set is the generator's, not the audited file's**, and that is the second half of the
 * same fault. Reading the paths out of the block's own negations makes a deleted negation delete the
 * question with it: the contents rule beside it still hides the README, and the check reports a pass
 * about the pairs that happen to have survived. So the block is read only to choose between the two
 * hand edits — move the contents rule back above a negation that is there, or re-run `init` to merge
 * back a negation that is not.
 *
 * The *effective* answer is the point, and that is what reverses the reasoning this comment used to
 * carry. Whether the channel's committed contract can be committed is a property of every ignore
 * rule in force here, however many files they are spread across, so only git can answer it. The
 * **remedy** is still one line in one managed block, which is why the messages below still name that
 * line: git says *that* a path is hidden, and this file says *which* line to move or delete.
 *
 * It reads the file, asks git that one read-only question per committed contract file, and writes
 * nothing.
 */
const IGNORE_RULES_CHECK: Check = {
  id: 'ignore-rules',
  title: 'the managed .gitignore block hides none of the files this repository commits',
  run: (ctx) => {
    if (ctx.repoRoot === undefined) return unevaluated('the repository root did not resolve (see the git check)');
    if (ctx.config === undefined) {
      return unevaluated(`${CONFIG_FILENAME} could not be read, so the stateDir the rules are spelled with is unknown (see the config check)`);
    }

    // The same precondition the artifact-tree check applies, and for the same reason: a stateDir
    // failing either schema clause has already been reported by the state-dir check, and rules
    // spelled with it would name a location no generated block ever held.
    const raw = ctx.config.stateDir;
    if (typeof raw !== 'string' || STATE_DIR_DOT_PATTERN.test(raw) || !STATE_DIR_PATTERN.test(raw)) {
      return unevaluated('stateDir does not name a usable directory (see the state-dir check)');
    }

    const path = join(ctx.repoRoot, GITIGNORE_PATH);
    let lines: readonly string[];
    try {
      lines = readFileSync(path, 'utf8')
        .split('\n')
        .map((line) => line.trim());
    } catch (error) {
      return warn(
        `${GITIGNORE_PATH} could not be read at ${path} (${messageOf(error)}), so none of the harness's ignore rules could be checked — and with none of them in force a single \`git add\` of the run-artifact tree commits the run-control files a run leaves in it, a committed STOP being the one that halts every run for everyone who clones. Run \`${CLI} init\`, which merges the managed block back in without touching the rest of the file`,
      );
    }

    const rules = clarificationsIgnoreRules(raw);
    const superseded = lines.includes(rules.supersededDirectoryRule);
    const current = lines.includes(rules.contents) || lines.includes(rules.readmeException);
    const staleComments = lines.filter(
      (line) => line.startsWith('#') && SUPERSEDED_CLARIFICATION_COMMENTS.some((marker) => line.includes(marker)),
    );
    const andTheComments =
      staleComments.length === 0
        ? ''
        : `, together with the ${staleComments.length} comment line${staleComments.length === 1 ? '' : 's'} above it that still describe this channel as having no committed README — the same change superseded them, and they now contradict the comment beside them`;

    if (superseded && current) {
      return fail(
        `${GITIGNORE_PATH} carries the whole-directory rule \`${rules.supersededDirectoryRule}\` as well as \`${rules.contents}\` and \`${rules.readmeException}\`: the directory rule comes first, and git cannot re-include a file whose parent directory is excluded, so the exception is inert and ${rules.readmePath} — the committed contract for what the park-and-ask channel holds — is ignored and stays untracked while init, doctor and every git command report success. The managed block is only appended to, so no re-run removes the line: delete \`${rules.supersededDirectoryRule}\` from ${path} by hand${andTheComments}, then \`git add ${rules.readmePath}\``,
      );
    }

    if (superseded) {
      return warn(
        `${GITIGNORE_PATH} carries the whole-directory rule \`${rules.supersededDirectoryRule}\` and neither of the two rules that replaced it: nothing is hidden yet, because this repository has no ${rules.readmePath} for it to hide — the next \`${CLI} init\` writes that README and appends \`${rules.contents}\` and \`${rules.readmeException}\` beneath the directory rule, which is the point at which the exception goes inert and the contract file silently stops being committable. Delete the line from ${path} now${andTheComments}`,
      );
    }

    if (!current) {
      return warn(
        `${GITIGNORE_PATH} carries neither \`${rules.contents}\` nor \`${rules.readmeException}\`, so nothing ignores the questions a parked run writes and the answers it is given — run \`${CLI} init\`, which merges the managed block back in without touching the rest of the file`,
      );
    }

    // The property, asked of git, for every contract file the tree generator commits rather than for
    // the one named above and rather than for whichever negations the file still carries. It runs
    // after the four arms above so their remedies — each naming a line an operator has to edit — are
    // not replaced by the generic one below, and before the stale-comment arm so that a `fail` about
    // a hidden file can never be reported as a warning about prose.
    const negated = new Set<string>();
    for (const line of managedBlockLines(lines)) {
      const readme = README_NEGATION_PATTERN.exec(line)?.[1];
      if (readme !== undefined) negated.add(readme);
    }
    const contractFiles = contentsIgnoredDirectories(raw).map((entry) => entry.readmePath);
    // Hidden with its negation still in the block, hidden with no negation left at all, and not
    // answered — three states with three different sentences to write.
    const shadowed: string[] = [];
    const unexcepted: string[] = [];
    const untested: string[] = [];
    for (const readme of contractFiles) {
      const verdict = pathIsIgnored(ctx.repoRoot, readme);
      if (verdict === undefined) untested.push(readme);
      else if (verdict) (negated.has(readme) ? shadowed : unexcepted).push(readme);
    }

    const hidden = [...shadowed, ...unexcepted];
    if (hidden.length > 0) {
      const one = hidden.length === 1;
      const remedies = [
        shadowed.length > 0
          ? `${nameList(shadowed)} ${shadowed.length === 1 ? 'is' : 'are'} excepted by a \`!\` negation the block still carries, and some rule in force matches the path *after* it — git resolves a path by the **last** pattern that matches, so the exception is inert: put the directory's contents rule — \`<dir>/*\` — back **above** its negation inside the managed block in ${path}, or delete the superseded rule that shadows it. No re-run removes or moves a line, so that edit is by hand`
          : '',
        unexcepted.length > 0
          ? `the managed block carries no \`!<path>\` negation for ${nameList(unexcepted)} at all: the line that excepts ${unexcepted.length === 1 ? "this directory's" : "these directories'"} committed contract file is missing from ${path}. Re-run \`${CLI} init\`, which merges it back in at its position inside the block`
          : '',
      ].filter((part) => part !== '');
      return fail(
        `git reports ${nameList(hidden)} ignored in this working tree, though the run-artifact tree generator commits ${one ? 'it' : 'each of them'} as the contract for what its directory holds: \`git add\` refuses ${one ? 'it' : 'them'} and ${one ? 'it stays' : 'they stay'} untracked while init, doctor and every git command report success. ${remedies.join('. ')}. Then \`git add\` each path named here`,
      );
    }

    if (untested.length > 0) {
      return warn(
        `git did not answer whether ${nameList(untested)} ${untested.length === 1 ? 'is' : 'are'} ignored here — \`git check-ignore\` exited with an error rather than a verdict — so the one thing this check exists to establish, that every README the tree generator commits into a contents-ignored directory is committable, was **not** measured and is not being claimed for ${untested.length === 1 ? 'that path' : 'those paths'}. Run \`git check-ignore -v -- <path>\` in ${ctx.repoRoot} to see what git refuses, then re-run \`${CLI} doctor\``,
      );
    }

    if (staleComments.length > 0) {
      return warn(
        `${GITIGNORE_PATH}'s managed block is functionally correct — \`${rules.contents}\` and \`${rules.readmeException}\` with no whole-directory rule above them — but still carries ${staleComments.length} comment line${staleComments.length === 1 ? '' : 's'} describing this channel as having no committed README, which the tree's row for it made false. Delete ${staleComments.length === 1 ? 'it' : 'them'} from ${path}: prose contradicting the rule beside it is what sends the next reader to re-add the rule that was just removed`,
      );
    }

    // Only what was measured: the pair is in the file, and git was asked about every contract file
    // the tree generator commits into a contents-ignored directory. A release that ignores none of
    // them by contents is said as that rather than as a count of nothing, so the sentence never
    // reports a measurement it did not make.
    const measured =
      contractFiles.length === 0
        ? 'the tree generator commits no contract file into a contents-ignored directory for git to be asked about'
        : `git reports ${nameList(contractFiles)} committable in this working tree`;
    return pass(
      `${GITIGNORE_PATH} ignores the clarification channel by its contents and excepts ${rules.readmePath}, and ${measured}`,
    );
  },
};

/**
 * The two project-scope keys that make a teammate's clone resolve the plugin.
 *
 * They are graded differently because they fail differently. Without `enabledPlugins` nothing about
 * this harness is enabled for anyone, including the adopter who just ran `init` — a `fail`. Without
 * the marketplace entry the plugin is enabled from a source the clone has never been told about,
 * which is a **clone-side** failure the adopter cannot see locally and which this release cannot
 * always avoid: the entry is omitted when this package's own repository URL does not yet name a
 * published account (`generators/projectSettings.ts`), so it is a `warn` naming the flag that
 * writes it.
 *
 * **The entry's presence is not the question; its shape is.** A clone resolves the plugin only from
 * an entry the host tool accepts, and one carrying the two inner fields at its top level is ignored
 * with a `Settings Warning` — the same clone-side outcome as no entry at all, which is why a
 * malformed one is graded the same `warn`. So the pass line's closing clause, *"a clone of this
 * repository resolves the plugin from the committed file"*, turns on the shape and not on the key:
 * it was asserted while only presence was tested, and {@link marketplaceEntryDefect} — asked of
 * `generators/projectSettings.ts`, never re-derived here — is what now earns it. The malformed
 * branch says so in the file, because this is the one defect an adopter cannot see locally: a
 * marketplace registered at user scope on the authoring machine resolves the plugin whatever the
 * committed file says.
 */
const PLUGIN_WIRING_CHECK: Check = {
  id: 'plugin-wiring',
  title: `${SETTINGS_PATH} carries both project-scope keys, the marketplace entry in a resolvable shape`,
  run: (ctx) => {
    if (ctx.repoRoot === undefined) return unevaluated('the repository root did not resolve (see the git check)');

    const path = join(ctx.repoRoot, SETTINGS_PATH);
    let parsed: JsonValue | undefined;
    try {
      parsed = readJsonFile(path);
    } catch (error) {
      return fail(messageOf(error));
    }

    if (parsed === undefined) {
      return fail(
        `no ${SETTINGS_PATH} at ${path}: nothing enables this harness's plugin in this repository — run \`${CLI} init\``,
      );
    }
    if (!isJsonObject(parsed)) return fail(`${path} is not a JSON object, so the agent runner cannot load it`);

    const enabled = parsed[ENABLED_PLUGINS_KEY];
    if (!isJsonObject(enabled) || !Object.hasOwn(enabled, PLUGIN_KEY)) {
      return fail(
        `${SETTINGS_PATH} has no ${ENABLED_PLUGINS_KEY} entry for ${PLUGIN_KEY}, so the plugin is not enabled in this repository for anyone who opens it — run \`${CLI} init\`, which merges the key in without touching anything else in the file`,
      );
    }
    if (enabled[PLUGIN_KEY] !== true) {
      return warn(
        `${SETTINGS_PATH} lists ${PLUGIN_KEY} under ${ENABLED_PLUGINS_KEY} with the value ${JSON.stringify(enabled[PLUGIN_KEY])} rather than true, so the plugin is registered and switched off`,
      );
    }

    const marketplaces = parsed[MARKETPLACES_KEY];
    if (!isJsonObject(marketplaces) || !Object.hasOwn(marketplaces, MARKETPLACE_NAME)) {
      return warn(
        `${SETTINGS_PATH} enables ${PLUGIN_KEY} but has no ${MARKETPLACES_KEY} entry for ${MARKETPLACE_NAME}: a teammate's clone will enable the plugin from a marketplace it has never been told about and will not resolve it, and nothing shows that here because this checkout already knows the marketplace — re-run init with --marketplace <owner>/<repo> to write the entry`,
      );
    }

    const defect = marketplaceEntryDefect(marketplaces[MARKETPLACE_NAME]);
    if (defect !== undefined) {
      return warn(
        `${SETTINGS_PATH}'s ${MARKETPLACES_KEY} entry for ${MARKETPLACE_NAME} is not a shape the agent runner accepts — ${defect}: the entry is ignored with a settings warning, so a teammate's clone enables the plugin from a marketplace it has never been told about and will not resolve it, exactly as if the key were absent, and nothing shows that here because this checkout already knows the marketplace. Re-running init does not repair it: ${SETTINGS_PATH} is merged missing keys only, so an entry that is already there is kept as it stands. Either edit it by hand to ${MARKETPLACE_ENTRY_SHAPE}, or delete the ${MARKETPLACE_NAME} key from ${MARKETPLACES_KEY} and run \`${CLI} init ${MARKETPLACE_FLAG} ${SLUG_SHAPE}\``,
      );
    }

    return pass(
      `${SETTINGS_PATH} enables ${PLUGIN_KEY} and declares the ${MARKETPLACE_NAME} marketplace in the shape the agent runner reads, so a clone of this repository resolves the plugin from the committed file`,
    );
  },
};

/** Is there a permission profile, and does it parse? Everything below reads it. */
const PROFILE_CHECK: Check = {
  id: 'permission-profile',
  title: `${PROFILE_PATH} exists and parses`,
  run: (ctx) => {
    if (ctx.repoRoot === undefined) return unevaluated('the repository root did not resolve (see the git check)');
    if (ctx.profile === undefined) return fail(ctx.profileProblem ?? `${PROFILE_PATH} could not be read`);
    return pass(`${ctx.profilePath as string} parses as the settings document an unattended run loads`);
  },
};

/**
 * Do the profile's absolute paths still name this checkout?
 *
 * The profile is generated with `<repo_root>`, `<work_root>` and the worktree glob resolved at `init`
 * time, so a repository cloned onto another machine — or moved — carries a profile whose rules point
 * at a location that no longer exists. A `warn`, because the fix is a re-run rather than an edit and
 * because a hand-tuned profile is a file the adopter may deliberately have pointed elsewhere.
 *
 * The question asked is "does any rule cover this root", not "is every path correct": a profile
 * generated here mentions the root in its edit, write and read rules, so its complete absence is the
 * signal.
 *
 * "Cover" is deliberately not "contain" ({@link namesRoot}). A generated profile names two locations —
 * the checkout it was generated at, and the sibling-worktree pattern that is emitted unconditionally
 * beside it — and a sibling worktree is covered by the second while appearing in neither as a
 * substring. Warning there would be a standing false alarm in exactly the checkouts the flow runs in,
 * and its remediation is the damaging part: an `init --force` inside a worktree regenerates the
 * **committed** profile with that worktree as `<repo_root>`, leaving the main checkout named by
 * nothing, since `<work>/<project>` does not match `<work>/<project>-*`.
 */
const PROFILE_PATHS_CHECK: Check = {
  id: 'profile-paths',
  title: "the permission profile's absolute paths name this checkout",
  run: (ctx) => {
    if (ctx.repoRoot === undefined) return unevaluated('the repository root did not resolve (see the git check)');
    if (ctx.profile === undefined) return unevaluated(`${PROFILE_PATH} could not be read (see the permission-profile check)`);

    const covered = locationStrings(ctx.profile).some((entry) => namesRoot(entry, ctx.repoRoot as string));
    return covered
      ? pass(
          `the profile's rules cover this repository root (${ctx.repoRoot}) — by naming it, or by a pattern such as the sibling-worktree glob that matches it — so they apply to this checkout`,
        )
      : warn(
          `neither a path nor a pattern in ${PROFILE_PATH} covers this repository root (${ctx.repoRoot}): the profile was generated for another location, so a run loading it would find its edit, write, read and script rules matching nothing here — re-run \`${CLI} init --force\` from the checkout the profile should be generated for, which writes a .bak sibling before regenerating it`,
        );
  },
};

/**
 * The closure that must **not** be in a generated profile: no `deny` entry may name a browser tool.
 *
 * A `deny` rule is evaluated before any `allow` and cannot be overridden, so a browser-namespace deny
 * here revokes the interactive-test agent's own explicitly granted access along with everyone else's.
 * That closure is made per agent, by each agent definition's `tools:` allowlist, and never in a
 * settings file. A `fail`: it is the one profile edit that silently disables a whole phase.
 *
 * What counts as a browser tool is {@link namesBrowserTool}, whose server names come from the
 * interactive-test fragment's `enabledMcpjsonServers` — so a deny of some other MCP namespace, which
 * is an adopter's to write, is neither failed here nor described as a browser deny.
 */
const PROFILE_BROWSER_DENY_CHECK: Check = {
  id: 'profile-browser-deny',
  title: 'the permission profile denies no browser tool',
  run: (ctx) => {
    if (ctx.profile === undefined) return unevaluated(`${PROFILE_PATH} could not be read (see the permission-profile check)`);

    const denied = permissionEntries(ctx.profile, 'deny').filter((entry) => namesBrowserTool(entry));
    if (denied.length > 0) {
      return fail(
        `${PROFILE_PATH} denies ${nameList(denied)}: a deny is evaluated before any allow and cannot be overridden, so this revokes the interactive-test agent's own grant and the phase can never drive a browser — remove the entr${denied.length === 1 ? 'y' : 'ies'}; the browser closure is made per agent, by each agent definition's tools allowlist`,
      );
    }
    return pass(`no entry in ${PROFILE_PATH}'s deny list names a browser tool`);
  },
};

/**
 * Does the profile still carry the `deny` floor a generated one ships with — the recursive removal
 * and the destructive branch operations no unattended run is asked about?
 *
 * The floor is the shipped template's own list ({@link shippedDenyFloor}), so this check cannot
 * vouch for a floor by consulting a second copy of it. A `warn` rather than a `fail`: the profile is
 * a file the adopter owns and may deliberately have restructured, and a run missing an entry is
 * worse-defended rather than unable to proceed. It is also the state a profile generated by an
 * earlier release is legitimately in, which is worth a line and not worth a non-zero exit.
 */
const PROFILE_DENY_FLOOR_CHECK: Check = {
  id: 'profile-deny-floor',
  title: 'the permission profile keeps the deny floor a generated one ships with',
  run: (ctx) => {
    if (ctx.profile === undefined) return unevaluated(`${PROFILE_PATH} could not be read (see the permission-profile check)`);

    const floor = shippedDenyFloor();
    if (floor.length === 0) {
      return warn(
        `the shipped permission-profile template ${PROFILE_TEMPLATE_PATH} declares no deny entries, so there is no floor to compare ${PROFILE_PATH} against: this is a fault in this CLI's packaging rather than in the repository it was run against`,
      );
    }

    const denied = permissionEntries(ctx.profile, 'deny');
    const missing = floor.filter((entry) => !denied.includes(entry));
    if (missing.length > 0) {
      return warn(
        `${PROFILE_PATH}'s deny list is missing ${missing.length} of the ${floor.length} entries a generated profile ships with: ${nameList(missing)} — an unattended run is one generated command away from each of them and would never be asked about it. Restore them, or regenerate the profile with \`${CLI} init --force\`, which writes a .bak sibling first`,
      );
    }
    return pass(`${PROFILE_PATH} carries all ${floor.length} deny entries a generated profile ships with`);
  },
};

/**
 * A `permissions.allow` entry a run needs, paired with what it does when the profile does not carry
 * it. The symptom travels with the entry so a report describes the consequence of the entries that
 * are **actually** missing rather than one selected by the phase: a helper entry and a read entry
 * cost different things, and reporting one as the other sends an operator to the wrong file.
 */
type RequiredEntry = { readonly rule: string; readonly symptom: string };

/** One graded plugin root, the runner record it was derived from, and what the profile owes at it. */
type PluginRootGroup = { readonly root: string; readonly label: string; readonly required: readonly RequiredEntry[] };

/** A group's heading, then its entries one per line, so a paste lands in the right place. */
function renderRootGroup(label: string, root: string, rules: readonly string[]): string {
  return `${label} — ${root}:\n${rules.join('\n')}`;
}

/**
 * The two fixed halves of {@link bashScriptRule}'s output, taken from the builder itself over a path
 * neither half can contain — so the helper form is recognised here rather than spelled a second time,
 * and a change to that builder cannot leave this reader matching the old shape.
 */
const HELPER_RULE_PROBE = '/probe';
const [HELPER_RULE_OPEN = '', HELPER_RULE_CLOSE = ''] = bashScriptRule(HELPER_RULE_PROBE).split(HELPER_RULE_PROBE);

/** Whether an entry is written in the helper form — {@link bashScriptRule}'s output over some path. */
function namesHelperScript(entry: string): boolean {
  return entry.startsWith(HELPER_RULE_OPEN) && entry.endsWith(HELPER_RULE_CLOSE);
}

/**
 * Does the permission profile grant what a run needs at the **plugin's** roots — the locations
 * `init` does not generate an entry for?
 *
 * The roots are knowable ({@link pluginInstallRoot} and {@link pluginRuntimeRoot} read them), but
 * `init` may run before the plugin is enabled, and the install root carries the plugin version in
 * its path, so an entry written once goes silently stale on an upgrade and no document can hold one
 * either: the entries are an operator's to add. Until this check existed the requirement lived only
 * in prose an adopter reaches by already knowing to look, and what a missing entry costs is a
 * **silent stall** — a run that reaches one of these helpers with nothing matching parks with no
 * error. So the check does the one thing a written-down answer cannot: it **re-resolves the roots on
 * every run** and prints the exact lines to paste, which turns that stall into a copy-paste and
 * catches a version bump that has silently invalidated entries added against a previous root.
 *
 * **Why two roots, and how each is derived.** A helper named in an **instruction file** arrives as
 * bytes and the agent resolves the root itself; one named in an **agent definition body** has
 * `${CLAUDE_PLUGIN_ROOT}` substituted by the runtime. Measured 2026-08-26 on a directory-sourced
 * marketplace, those two routes landed on different directories: a sub-agent resolved
 * `${CLAUDE_PLUGIN_ROOT}` to `<installLocation>/plugin` while `installPath` named a version-pinned
 * cache snapshot. Both are therefore graded — the install root from `installed_plugins.json`, the
 * runtime root from `known_marketplaces.json` plus the marketplace manifest it locates — and where
 * they resolve to one directory, which is every git-sourced adoption, the two sets dedup to one.
 *
 * **What is graded at each, and what deliberately is not.**
 *
 * - One rule per helper script at **every** graded root, required **only while `phases.qa` is true**,
 *   because those scripts are the interactive-test phase's alone. With the phase off this check says
 *   nothing whatever about them: a warning nobody with that phase off can act on is one they learn
 *   to skip.
 * - A `Read` rule at a runtime root that differs from the install root, **not** phase-gated:
 *   instruction files and samples are read by every unattended run, interactive-test phase or not.
 * - **No `Read` rule over the install root**, and the asymmetry is a measurement rather than a
 *   taste. Measured 2026-08-26, under a generated profile naming no rule over either root: sixteen
 *   `Read` calls under the install root succeeded, over eight distinct instruction files, while ten
 *   under the runtime root were refused in the same run.
 *
 * With nothing left to grade — the phase off at a single root — it reports **not graded** and names
 * which, rather than a pass an adopter would read as coverage.
 *
 * The helper names come from **reading `<root>/scripts/`** ({@link pluginHelperScripts}) at each
 * graded root and taking the union, never from a list kept here: they are declared once, in the
 * plugin's own `scripts/README.md`, and a copy in this file would be a second declaration that
 * drifts the first time one is added. Nothing here classifies a helper by its call site either —
 * the root set is what varies, and the name set stays read from disk.
 *
 * **It never fails**, for {@link REPO_REGISTRY_CHECK}'s reason: this is a machine-local gap with an
 * operator remedy, and the profile is a file the adopter owns. And when no root resolves it invents
 * none — it names the step and the file it read, because a fabricated path is worse than no path: an
 * operator would paste it and get a profile that is wrong in a way nothing reports.
 *
 * **A helper entry under no resolved root is named in every *graded* disposition and moves no
 * grade.** A profile carrying dead weight and every required entry still passes; one missing a
 * required entry still warns. Informational because the remedy is a deletion the adopter owns, and
 * because a check that failed over an entry costing nothing at run time is one adopters learn to
 * ignore. Only the helper form is tested: a `Read` granted over a reference implementation outside
 * the checkout — the parity phase's own case — is correct configuration, and naming it would be a
 * false positive.
 *
 * **Where no root resolves, those entries are counted rather than named**, both forms of them: the
 * disposition that grades nothing may not call an entry stale or required, but a count says the
 * check read the file rather than passing over it in silence — and it is the same set `init --force`
 * carries forward unverified on that arm (`generators/permissionProfile.ts`,
 * `carriedPluginRootEntries`).
 */
const PLUGIN_PERMISSIONS_CHECK: Check = {
  id: 'plugin-permissions',
  title: "the permission profile grants what a run needs at the plugin's roots",
  run: (ctx) => {
    if (ctx.repoRoot === undefined) return unevaluated('the repository root did not resolve (see the git check)');
    if (ctx.profile === undefined) return unevaluated(`${PROFILE_PATH} could not be read (see the permission-profile check)`);

    // Read here rather than beside `missing` below, because both the not-graded and the no-root
    // dispositions return above that point and each interpolates a count out of it. A pure read of
    // the profile: it neither writes nor throws on a malformed one, and `missing` is still computed
    // from it where it always was.
    const allowed = permissionEntries(ctx.profile, 'allow');
    // Hoisted with it, and for the same reason: the no-root count excludes this checkout's own
    // wrapper entries, whose repo-root-absolute form is byte-identical to a plugin helper's.
    const here = normalizedRoot(ctx.repoRoot);

    const installRoot = pluginInstallRoot(ctx.repoRoot);
    const runtimeRoot = pluginRuntimeRoot(ctx.repoRoot);
    // The runtime root leads, because it is the one carrying the extra requirement; de-duplicated,
    // so the ordinary machine — where the two records name one directory — prints one set of lines.
    const roots = [...new Set([runtimeRoot, installRoot].filter((root): root is string => root !== undefined))];
    const [firstRoot, ...furtherRoots] = roots;
    if (firstRoot === undefined) {
      // Counted, never named. Both dictated forms are counted — the helper `Bash` and the runtime
      // root's `Read` — because with no root resolved nothing distinguishes them, and they are the
      // set `init --force` carries forward unverified on this same arm. Naming one would require
      // calling it stale or required, which is a judgement no root answered for; the check's standing
      // rule that it invents nothing holds, so the disposition reports a number and no path.
      const ungraded = allowed.filter((entry) => {
        const target = pluginRootEntryTarget(entry);
        return target !== undefined && !isUnderDirectory(target, here);
      }).length;
      const dangling =
        ungraded === 0
          ? ''
          : `. ${PROFILE_PATH} carries ${ungraded} absolute-directory \`permissions.allow\` ${entryWord(ungraded)} outside this checkout that nothing here can grade until a root resolves, counted rather than named because calling one stale or required would be a judgement no record on this machine supports; \`${CLI} init --force\` carries ${ungraded === 1 ? 'it' : 'them'} forward unverified in the meantime`;
      return warn(
        `${installedPluginsPath()} records no install root for ${PLUGIN_KEY}, so the entries ${PROFILE_PATH} needs for it cannot be named and are not guessed at: enable the plugin — open this repository with the agent runner once, which applies the ${SETTINGS_PATH} keys \`${CLI} init\` wrote — and re-run \`${CLI} doctor\`, which reads the root back and prints the exact lines to paste${dangling}`,
      );
    }

    // Entries in the helper form whose directory no root here answers for. Two exclusions, both
    // load-bearing: the `Read` form is never tested, because a read granted over a reference
    // implementation outside the checkout is correct configuration; and nothing under this checkout
    // is, because a wrapper's own `bash <repo root>/<scriptsDir>/<file>.sh` renders byte-identically
    // to a plugin helper and `pluginRootEntryTarget` deliberately leaves that discrimination here.
    const resolvedRoots = roots.map(normalizedRoot);
    const strays = allowed.flatMap((entry) => {
      const target = namesHelperScript(entry) ? pluginRootEntryTarget(entry) : undefined;
      if (target === undefined || isUnderDirectory(target, here)) return [];
      return resolvedRoots.some((root) => isUnderDirectory(target, root)) ? [] : [`${entry} — ${target}`];
    });
    // Carried into all three surviving dispositions, so what the report says about dead weight does
    // not depend on which arm this machine happens to be in. Empty set, empty clause — as `partial`.
    const stray =
      strays.length === 0
        ? ''
        : ` ${PROFILE_PATH} also carries ${strays.length} helper ${entryWord(strays.length)} naming a directory no plugin root on this machine resolves — ${nameList(strays)} — so ${strays.length === 1 ? 'it is' : 'they are'} dead weight: the install root carries the plugin version, and an upgrade leaves an entry added against the previous one naming nothing. Nothing else grades ${strays.length === 1 ? 'it' : 'them'}; the entries this machine's roots do need are the ones this check grades. Delete ${strays.length === 1 ? 'it' : 'them'}, or run \`${CLI} init --force\`, which carries forward only the entries at a root that still resolves.`;

    const split = furtherRoots.length > 0;

    // A config that did not parse leaves the phase unknowable, so the report says the helper entries
    // were not graded rather than reading an absent phase as "off" and reporting a repository as
    // complete that is one unreadable file away from a stall.
    const phaseKnown = ctx.config !== undefined;
    const qaOn = ctx.config?.phases?.qa === true;
    const helpers = qaOn ? [...new Set(roots.flatMap((root) => pluginHelperScripts(root)))].sort() : [];

    const groups: readonly PluginRootGroup[] = roots.map((root) => ({
      root,
      label: split
        ? root === runtimeRoot
          ? `the directory this marketplace is sourced from (${knownMarketplacesPath()} → \`installLocation\` + the marketplace manifest's plugin \`source\`), which the runtime substitutes for \`\${CLAUDE_PLUGIN_ROOT}\``
          : `the install root ${installedPluginsPath()} records`
        : installRoot === undefined
          ? `the directory this marketplace is sourced from (the only root that resolved: ${installedPluginsPath()} records no install root)`
          : `the one plugin root this machine resolves, recorded in ${installedPluginsPath()}`,
      required: [
        // Outside the phase gate, and only where the runtime root is its own directory: reads at the
        // install root were measured to succeed ungranted, ten at the runtime root to be refused.
        ...(root === installRoot
          ? []
          : [{ rule: readRule(root), symptom: 'improvises in place of a contract file it is refused' }]),
        ...helpers.map((name) => ({
          rule: bashScriptRule(pluginHelperPath(root, name)),
          symptom: 'parks with no error at the first helper script it reaches',
        })),
      ],
    }));
    const required = groups.flatMap((group) => group.required);

    if (required.length === 0) {
      const reason = !phaseKnown
        ? `${CONFIG_FILENAME} could not be read, so the phase the helper scripts belong to is unknown (see the config check)`
        : qaOn
          ? `no helper script was found under ${pluginScriptsDir(firstRoot)}: a plugin root with no scripts directory is a broken or partial install, and re-enabling the plugin is what repairs it`
          : "phases.qa is off, and the helper scripts are that phase's alone";
      return pass(`not graded at this machine's plugin root (${firstRoot}), because ${reason}.${stray}`);
    }

    // Two graded roots and no helper name under either is still a broken install, and the read rule
    // alone would otherwise let it pass in silence once pasted.
    const partial =
      qaOn && helpers.length === 0
        ? ' No helper script was found under any graded root, so none is required here: that is a broken or partial install, which re-enabling the plugin repairs.'
        : '';
    // Stated once, in both dispositions, because an operator reading either has to know why a line
    // they already pasted at one root reappears at the other, and why only one root carries a read
    // rule. `coincide` is the ordinary machine: one directory, one set of entries, no read rule.
    const coincide = !split && installRoot !== undefined;
    const why =
      (split
        ? ` Both roots are graded because a helper named in an instruction file is resolved by the agent itself while one named in an agent definition body has \`\${CLAUDE_PLUGIN_ROOT}\` substituted by the runtime, and on this machine those two routes were measured to land on different directories.`
        : '') +
      (coincide
        ? ''
        : ` The \`Read\` entry is graded at the runtime root and not at the install root because reads at the install root were measured (2026-08-26) to succeed under a profile naming no rule over it, while ten at the runtime root were refused in that same run; it is outside the \`phases.qa\` gate, because instruction files and samples are read by every run.`);

    const missing = required.filter((entry) => !allowed.includes(entry.rule));

    if (missing.length > 0) {
      const symptoms = [...new Set(missing.map((entry) => entry.symptom))].join(', and ');
      const blocks = groups
        .map((group) => ({ group, rules: group.required.filter((entry) => missing.includes(entry)).map((entry) => entry.rule) }))
        .filter(({ rules }) => rules.length > 0)
        .map(({ group, rules }) => renderRootGroup(group.label, group.root, rules));
      return warn(
        `${PROFILE_PATH} is missing ${missing.length} of the ${required.length} \`permissions.allow\` ${entryWord(required.length)} this machine's plugin ${split ? 'roots need' : 'root needs'}, so an unattended run ${symptoms}. \`${CLI} init\` does not generate ${missing.length === 1 ? 'it' : 'them'} — a root is machine-local and the install root carries the plugin version, so an entry written once goes stale on an upgrade and this check re-derives ${split ? 'both' : 'it'} instead.${why}${partial}${stray} Add each line below to that list as its own string, unquoted exactly as it stands:\n${blocks.join('\n\n')}`,
      );
    }

    // Per-root counts only where there is more than one root to attribute them to; with a single
    // root the leading total already says how many, and repeating it reads as a second figure.
    const carried = groups
      .map((group) =>
        split ? `${group.label} — ${group.root}: ${group.required.length} ${entryWord(group.required.length)}` : `${group.label} — ${group.root}`,
      )
      .join('; ');
    return pass(
      `${PROFILE_PATH} carries all ${required.length} \`permissions.allow\` ${entryWord(required.length)} this machine's plugin ${split ? 'roots need' : 'root needs'} — ${carried}.${why}${partial}${stray}${coincide ? ` \`${readRule(firstRoot)}\` is deliberately not one of them — measured 2026-08-26, reads under that root succeed under a profile carrying no rule naming it.` : ''}`,
    );
  },
};

/** One `npx`-launched server and the package spec it would fetch, as {@link registrySpecs} derives it. */
interface RegistrySpec {
  /** The server's own key in `.mcp.json`'s `mcpServers` object. */
  readonly server: string;
  /** The `<name>@<version>` argument `npx` runs — the pin, exactly as the wiring declares it. */
  readonly spec: string;
}

/**
 * What one registry read answered about one spec.
 *
 * Three outcomes rather than a boolean, because the third is a different finding: `no-client` means
 * the question was never put, which is neither a reachable package nor an unreachable one, and
 * reporting it as a failed fetch would send an adopter looking for a registry problem that is really
 * an absent `npm`.
 */
type RegistryReachable = RegistrySpec & { readonly outcome: 'reachable'; readonly version: string };
type RegistryUnreachable = RegistrySpec & { readonly outcome: 'unreachable'; readonly printed: string };
type RegistryNotProbed = RegistrySpec & { readonly outcome: 'no-client' };
type RegistryProbe = RegistryReachable | RegistryUnreachable | RegistryNotProbed;

/**
 * The package specs a declared-server object would fetch from the registry on first use.
 *
 * The rule is `npx`'s own, and it is why the derivation is narrow: `npx` runs the first argument that
 * is not a flag, and the generated wiring puts `-y` in front of it, so that argument is fetched at
 * first use rather than installed by `init` — nothing is added to the adopter's `package.json` and no
 * global install happens. A server launched by **any other command** contributes nothing: whatever it
 * runs is already on the machine or is not, which is the question {@link resolvesOnPath} already
 * answers for it, and there is no fetch to probe.
 */
function registrySpecs(servers: JsonObject): readonly RegistrySpec[] {
  const specs: RegistrySpec[] = [];
  for (const [server, declaration] of Object.entries(servers)) {
    if (!isJsonObject(declaration)) continue;
    if (declaration['command'] !== REGISTRY_LAUNCHER) continue;
    const args = declaration['args'];
    if (!Array.isArray(args)) continue;
    const spec = args.find(
      (argument): argument is string =>
        typeof argument === 'string' && argument !== '' && !argument.startsWith('-'),
    );
    if (spec !== undefined) specs.push({ server, spec });
  }
  return specs;
}

/**
 * What a failed probe printed — its **stderr** first, which is where `npm` writes registry errors,
 * then its stdout, then the thrown value's own message when it printed nothing at all (a spawn
 * failure or the timeout, neither of which is the client speaking).
 */
function probeFailureText(error: unknown): string {
  const streams = error as { stderr?: unknown; stdout?: unknown };
  for (const stream of [streams.stderr, streams.stdout]) {
    const line = typeof stream === 'string' ? firstLine(stream) : '';
    if (line !== '') return line;
  }
  return firstLine(messageOf(error));
}

/**
 * Ask the registry which version one pinned spec has — the whole of what `doctor --check-registry`
 * adds, and the only thing in this module that reaches a network.
 *
 * `npm view <spec> version` is a metadata read: it fetches no package, installs nothing, writes
 * nothing into the repository and needs no browser. What it answers is the question a first
 * interactive-test dispatch would otherwise answer hours later — whether **this** pin can be reached
 * from **this** machine's registry, which an offline, proxied or mirrored adopter finds out at the
 * worst possible moment. The pin is what raises the stakes: a mirror carrying *some* version of a
 * package but not the declared one fails where an unpinned fetch might have succeeded.
 *
 * The probe follows {@link JQ_CHECK}'s discipline exactly — existence answered by
 * {@link resolvesOnPath} rather than by the spawn, so "no client" and "the client did not answer" are
 * two findings instead of one; `execFileSync` with a fixed argument vector, never a shell string,
 * bounded by a timeout; and nothing thrown, because a probe is a finding to print and one unreachable
 * package may not cost the report the rest of its answers.
 */
function probeRegistrySpec(candidate: RegistrySpec): RegistryProbe {
  if (!resolvesOnPath(REGISTRY_CLIENT)) return { ...candidate, outcome: 'no-client' };
  try {
    const output = execFileSync(REGISTRY_CLIENT, ['view', candidate.spec, 'version'], {
      encoding: 'utf8',
      // stderr is piped, not ignored: `npm` writes its registry errors there and nowhere else, and the
      // finding this probe exists for is which error it was — E404 (raise the pin) reads differently
      // from ENOTFOUND or a proxy 403 (fix the mirror), and the warning names both remedies. Naming
      // all three streams also keeps that text out of this command's own output, which is where an
      // unspecified `stdio` would forward it.
      stdio: ['ignore', 'pipe', 'pipe'],
      timeout: REGISTRY_PROBE_TIMEOUT_MS,
      windowsHide: true,
    });
    return { ...candidate, outcome: 'reachable', version: firstLine(output) };
  } catch (error) {
    return { ...candidate, outcome: 'unreachable', printed: probeFailureText(error) };
  }
}

/**
 * The interactive-test phase's wiring, when that phase is on — and, when it drives a browser, that
 * the browser half of it lines up.
 *
 * Three things have to line up and none of them fails loudly on its own: `.mcp.json` has to declare
 * the servers, the profile has to start the ones it allow-lists tools of, and the launch command has
 * to exist on this machine. A missing one leaves a tool that does not exist at run time, and an
 * un-loaded tool in print mode stalls rather than prompting. All are `warn`: the phase is optional,
 * and a repository whose browser wiring is incomplete still runs everything else.
 *
 * **Whether there is browser wiring to check at all is {@link browserWiringApplies}'s answer, not a
 * second one spelled here** (choice 1 in the module header). The generators write `.mcp.json` and the
 * profile's interactive-test fragment on exactly that predicate, so asking a differently-worded
 * question would make `doctor` report a mobile-configured repository as missing wiring `init`
 * deliberately withheld — a warning nobody can clear, and a check nobody can clear is a check
 * everybody starts ignoring.
 *
 * **No server is started and no browser is launched** — see choice 3 in the module header.
 *
 * **What resolving `npx` does not prove is the fourth thing, and it is why the default run says so.**
 * The declared servers are launched with `npx -y`, so each pinned package is fetched from the
 * registry on first use rather than installed by `init`: `npx` resolving says nothing about whether
 * the pin can be reached from this machine. Under {@link CheckContext.probeRegistry} that is measured
 * per spec ({@link probeRegistrySpec}) and an unreachable one warns beside the findings above; with
 * it off — every default run — the pass text states plainly that the packages are fetched on first
 * use and that this run did not check they can be, and names the flag that does.
 */
const BROWSER_WIRING_CHECK: Check = {
  id: 'browser-wiring',
  title: 'the interactive-test phase can reach the application',
  run: (ctx) => {
    if (ctx.repoRoot === undefined) return unevaluated('the repository root did not resolve (see the git check)');
    if (ctx.config === undefined) return unevaluated(`${CONFIG_FILENAME} could not be read (see the config check)`);

    if (ctx.config.phases?.qa !== true) {
      return pass(
        `phases.qa is off, so no browser wiring is expected: nothing drives a browser, and no ${MCP_PATH} is needed`,
      );
    }

    if (!browserWiringApplies(ctx.config)) {
      // Only a non-browser driver reaches here: the phase is on, and an absent `qa.driver` takes the
      // schema default, which is the browser one and so goes down the branch below.
      const driver = ctx.config.qa?.driver ?? DEFAULTS.qa.driver;
      return pass(
        `phases.qa is on with qa.driver ${driver}, which reaches the application through a device runner rather than a browser, so no browser wiring is expected: the mobile interactive-test variants are declared-not-implemented in this release and carry built-ins-only tool allowlists, so no MCP server is declared in ${MCP_PATH}, none is named in ${PROFILE_PATH}, and none is started`,
      );
    }

    const path = join(ctx.repoRoot, MCP_PATH);
    let parsed: JsonValue | undefined;
    try {
      parsed = readJsonFile(path);
    } catch (error) {
      return warn(messageOf(error));
    }
    if (parsed === undefined) {
      return warn(
        `phases.qa is on and there is no ${MCP_PATH} at ${path}, so no browser server is declared and the phase has nothing to drive — run \`${CLI} init\`, which merges the wiring in when the phase is on`,
      );
    }
    if (!isJsonObject(parsed)) return warn(`${path} is not a JSON object, so it declares no MCP server`);

    const servers = parsed[SERVERS_KEY];
    if (!isJsonObject(servers)) return warn(`${path} has no \`${SERVERS_KEY}\` object, so it declares no MCP server`);

    const declared = Object.keys(servers);
    if (declared.length === 0) return warn(`${path} declares no MCP server under \`${SERVERS_KEY}\``);

    const problems: string[] = [];

    const started = ctx.profile === undefined ? [] : serversStartedByProfile(ctx.profile);
    const undeclared = started.filter((name) => !declared.includes(name));
    if (undeclared.length > 0) {
      problems.push(
        `${PROFILE_PATH} starts ${nameList(undeclared)}, which ${MCP_PATH} does not declare, so the server never starts and the tools allow-listed for it do not exist at run time — an un-loaded tool stalls an unattended run rather than failing it`,
      );
    }
    if (ctx.profile !== undefined && started.length === 0) {
      problems.push(
        `${PROFILE_PATH} has no \`${ENABLED_SERVERS_KEY}\` list, so an unattended run starts none of these servers: the phase was turned on after the profile was generated — regenerate it with \`${CLI} init --force\`, which writes a .bak sibling first. No flag is part of the remedy: init reads ${CONFIG_FILENAME} on every run and never overwrites it, and this check reaches here only with phases.qa already true in that file, so --force regenerates the profile from the config in effect — the one this check just read`,
      );
    }

    const unresolved: string[] = [];
    for (const name of declared) {
      const server = servers[name];
      const command = isJsonObject(server) ? server['command'] : undefined;
      if (typeof command !== 'string' || command === '') {
        unresolved.push(`${name} (declares no launch command)`);
      } else if (!resolvesOnPath(command)) {
        unresolved.push(`${name} (${command} does not resolve on PATH)`);
      }
    }
    if (unresolved.length > 0) {
      problems.push(
        `${nameList(unresolved)} — the phase would fail to start ${unresolved.length === 1 ? 'that server' : 'those servers'} on this machine`,
      );
    }

    // What a resolved `npx` does not answer: whether the pins it would fetch can be reached from
    // here. Derived on every run so the sentence below can name them; probed only when asked.
    const specs = registrySpecs(servers);
    const specList = nameList(specs.map((candidate) => candidate.spec));
    const probes = ctx.probeRegistry ? specs.map(probeRegistrySpec) : [];

    const unreachable = probes.filter((probe): probe is RegistryUnreachable => probe.outcome === 'unreachable');
    if (unreachable.length > 0) {
      const said = unreachable
        .map((probe) => `${probe.spec} (${probe.server}: ${JSON.stringify(probe.printed)})`)
        .join(', ');
      problems.push(
        `\`${REGISTRY_CLIENT} view <spec> version\` could not reach ${said} from this machine's registry, so the interactive-test phase would fail at its first dispatch rather than here: these packages are fetched on first use, and a pinned version a mirror does not carry fails where an unpinned fetch might have succeeded — check the registry, proxy or mirror this machine resolves, or raise the pin to a version it carries`,
      );
    }

    // The question was never put, which is neither a reachable package nor an unreachable one: said
    // as its own sentence, wherever the grade lands, so nobody reads it as a registry problem.
    const noClient = probes.some((probe) => probe.outcome === 'no-client')
      ? ` The registry probe ran nothing: ${REGISTRY_CLIENT} does not resolve on PATH, so whether ${specList} can be fetched is still unchecked — this is an absent client rather than an unreachable registry, and \`${REGISTRY_LAUNCHER}\` launching these servers comes from the same install.`
      : '';

    if (problems.length > 0) return warn(`${problems.join('; ')}${noClient}`);

    const reached = probes.filter((probe): probe is RegistryReachable => probe.outcome === 'reachable');

    // Keyed on what was measured, never on the flag: `--check-registry` with no `npx`-launched
    // server declared, or with no `npm` on PATH, puts no question to a registry at all, and a line
    // that says otherwise is contradicted by the `noClient` sentence beside it.
    const resolution =
      reached.length > 0
        ? ', and the registry was read for metadata only'
        : ', because this check is command resolution only';

    const registryNote =
      specs.length === 0
        ? ''
        : ctx.probeRegistry
          ? reached.length === 0
            ? ''
            : ` ${reached.map((probe) => `${probe.spec} → ${probe.version}`).join(', ')} — each pinned package was reached in the registry with \`${REGISTRY_CLIENT} view <spec> version\`, a metadata read that fetched and installed nothing.`
          : ` These servers are launched with \`${REGISTRY_LAUNCHER} -y\`, so each pinned package — ${specList} — is fetched from the registry on first use rather than installed now; this run did not check that it can be, and \`${CLI} doctor --check-registry\` does.`;

    return pass(
      `${MCP_PATH} declares ${nameList(declared)} and every launch command resolves on PATH; no server was started and no browser was launched${resolution}.${registryNote}${noClient}`,
    );
  },
};

/**
 * The checks, in the order they are evaluated and reported: the host and the tools first, then the
 * repository's own wiring, then the permission profile and the browser half that depends on it.
 *
 * A reader works down that order, and so does a fix: a failed `git` check makes every question below
 * it unanswerable, and a missing profile makes the three profile checks unanswerable, so the first
 * failure in the list is almost always the one to act on. The two machine-level tool checks are kept
 * at the top for the same reason: they answer for the guards' and the scripts' behaviour, which a
 * repository-level finding further down would otherwise be read as the cause of.
 *
 * `jj-repository` sits immediately under `git` because it is that check's own question one step on:
 * `git` establishes that there **is** a work tree, and this says what **shape** of work tree it is.
 * Every branch line below it is qualified by that answer — the detection rung a detached `HEAD`
 * costs, and the caller set the committed pre-push hook actually reaches — which is why it is read
 * before them rather than after. On a plain git repository it says so in one line and grades nothing.
 *
 * `default-branch` and `remote` are the two repository-level questions placed between them, because
 * the first is the `git` check's own follow-up — the same repository, asked whether the name the
 * config carries is a branch it has — and the second completes it: a reader whose `default-branch`
 * line just passed reads next whether that name exists on a remote, which is the form the flow
 * actually needs it in. Neither `jq` answer can cause either or be caused by them, and everything
 * below them is independent of the branch.
 *
 * `base-freshness` closes that trio, immediately under `remote`, because it asks of the same ref the
 * one further question there is — not whether `origin/<defaultBranch>` exists but whether it is
 * current — and it is unanswerable until `remote`'s is answered, which is why it reports "not
 * graded" wherever that check has already failed rather than restating the failure.
 *
 * `pre-push-guard` closes that branch block, immediately under `base-freshness`, because it asks the
 * one remaining question about the same value: `default-branch` asks whether the configured name
 * resolves, `remote` and `base-freshness` ask what a run's checkout can be cut from, and this asks
 * whether the guard on disk is the one that value describes. It is placed after the trio rather than
 * before it so a reader who has just read three lines about one name reads next what enforces it.
 * `protected-set` sits immediately under it and closes that block from the opposite side: the two ask
 * whether the guard on disk matches the configuration, and whether the configuration still names
 * branches this repository has.
 *
 * `command-wrappers` sits immediately under `config`, which is the reading order of that block: is
 * the file valid, then do its command keys hold what a run can execute, then is the state directory
 * usable. The two are neighbours rather than one check because a key this one warns about is a key
 * the `config` line above it has just passed as structurally fine. `command-permissions` follows
 * directly under it and `command-resolves` closes the four, in the order they narrow on one key: the
 * **slot** (`config`, is it still the placeholder), the **value** (`command-wrappers`, is it the
 * wrapper invocation), the **entries** the value implies (`command-permissions`, does the profile
 * carry them and is the wrapper there), and then whether the thing the line actually runs exists on
 * this machine (`command-resolves`). Each reads something the one above it does not — the second
 * file for `command-permissions`, the machine for `command-resolves` — so a reader whose lines above
 * have all passed reads each as what a valid, filled-in, allow-listed config can still be missing.
 *
 * `setup-analysis` sits next to `artifact-tree` because the two answer the neighbouring halves of
 * "what did `init` write": the directories a run puts artifacts in, and the documents the agents it
 * dispatches read their rules from. `task-offer-rules` sits immediately under `setup-analysis`
 * because the two read the same file and grade the same namespace, and an operator reads them
 * together. `layer-profile` follows under those two, because
 * it asks the remaining question about the same act — whether the profile routing a dispatch to one
 * of those documents was detected or fallen back to — and it is the line a reader whose
 * `setup-analysis` line just passed needs next:
 * filled documents behind a profile nobody looked at is exactly the state the two lines together
 * distinguish. `layer-drift` closes that block, under the check whose subject it is gated on: the two
 * partition the repositories between them, one grading the profile that carries no row scoped below
 * the repository root and the other grading only the profiles that carry one, so no repository is
 * reported twice.
 *
 * `notifications` sits directly under `run-watcher` because the two are about the same thing from an
 * operator's side: whether an unattended run can be started unattended and then be *heard from*. The
 * watcher is the process that fires the events and the notifier is what carries them, so a reader
 * whose watcher line just warned reads the delivery line next rather than hunting for it below the
 * profile checks. `repo-registry`, `machine-footprint` and `daemon-path` close that same
 * daemon-adjacent block — backend, watcher, delivery, whether a daemon was ever actually installed
 * from this checkout, what else the machine around it is armed to run, and then whether the one that
 * was installed can reach its toolchain — so the six lines an operator asking "can this repository
 * run unattended" reads are consecutive. `machine-footprint` sits immediately under `repo-registry`
 * because the two are one question at two scopes — that check answers for *this* checkout, this one
 * for the machine around it — and they are meant to be read together. `daemon-path` comes last of
 * the six because it is the only one that grades an *installed* unit: it has nothing to say until the
 * five above it are answered, and it says so rather than guessing.
 *
 * `plugin-permissions` closes the profile block for the same shape of reason: it is the only profile
 * question whose other half is not in the repository at all — the plugin's machine-local install
 * root — so it is answerable only once the profile itself has been read, and a reader whose
 * profile lines all passed reads it as the last thing that can still be missing from that file.
 */
export const CHECKS: readonly Check[] = Object.freeze([
  GIT_CHECK,
  JJ_REPOSITORY_CHECK,
  DEFAULT_BRANCH_CHECK,
  REMOTE_CHECK,
  BASE_FRESHNESS_CHECK,
  PRE_PUSH_GUARD_CHECK,
  PROTECTED_SET_CHECK,
  JQ_CHECK,
  WORKTREE_CHECK,
  DAEMON_BACKEND_CHECK,
  WATCHER_CHECK,
  NOTIFICATIONS_CHECK,
  REPO_REGISTRY_CHECK,
  MACHINE_FOOTPRINT_CHECK,
  DAEMON_PATH_CHECK,
  CONFIG_CHECK,
  COMMAND_WRAPPERS_CHECK,
  COMMAND_PERMISSIONS_CHECK,
  COMMAND_RESOLVES_CHECK,
  STATE_DIR_CHECK,
  STATE_DIR_TREE_CHECK,
  SETUP_ANALYSIS_CHECK,
  TASK_OFFER_RULES_CHECK,
  LAYER_PROFILE_CHECK,
  LAYER_DRIFT_CHECK,
  IGNORE_RULES_CHECK,
  PLUGIN_WIRING_CHECK,
  PROFILE_CHECK,
  PROFILE_PATHS_CHECK,
  PROFILE_BROWSER_DENY_CHECK,
  PROFILE_DENY_FLOOR_CHECK,
  PLUGIN_PERMISSIONS_CHECK,
  BROWSER_WIRING_CHECK,
]);

/**
 * Evaluate every check in order and return one result each.
 *
 * **The try/catch is here rather than in each check**, so the property the module header states is
 * structural: a check cannot forget to catch, because it is not the thing catching. A thrown value
 * becomes that check's `fail` naming the check that threw, and the rest of the list still runs.
 */
export function runChecks(ctx: CheckContext): CheckResult[] {
  return CHECKS.map((check) => {
    let outcome: CheckOutcome;
    try {
      outcome = check.run(ctx);
    } catch (error) {
      outcome = fail(
        `the check itself threw and is reported as a failure rather than being allowed to stop the run: ${messageOf(error)}`,
      );
    }
    return { id: check.id, title: check.title, ...outcome };
  });
}

/** How many results ended in each status — the numbers the command's summary line renders. */
export function countByStatus(results: readonly CheckResult[]): CheckCounts {
  return {
    pass: results.filter((result) => result.status === 'pass').length,
    warn: results.filter((result) => result.status === 'warn').length,
    fail: results.filter((result) => result.status === 'fail').length,
  };
}

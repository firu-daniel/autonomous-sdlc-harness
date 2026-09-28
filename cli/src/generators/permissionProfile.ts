/**
 * Generator: the unattended-run permission profile — the renderer, and the write that lands it.
 *
 * **The rule this module exists to enforce: the generator must be incapable of producing an entry
 * that stalls an unattended run.** In print mode a tool call that matches neither `allow` nor
 * `deny` does not prompt and does not fail — it hangs, and the run parks with no diagnostic. Every
 * shape below is the way it is because some run already paid for the alternative, and each of those
 * three prices is stated once here and once in the template's own `_README`:
 *
 * 1. **Wrapper paths are unquoted literals.** The allow-list guard matches the raw command string,
 *    so a quoted path fails a `*.sh` match, falls through to a prompt and stalls.
 * 2. **One command per entry, never a compound.** A single `mkdir && cp && rm` block is refused
 *    where each of those commands succeeds on its own, because the joined string matches no entry.
 * 3. **The checkout *and* its sibling worktrees.** A glob that misses the worktree a run is
 *    executing in does not fail loudly; it silently skips whatever phase needed the path. A
 *    single-checkout adopter simply has no sibling for the second entry to match, which is why the
 *    worktree entries are unconditional rather than a second template.
 *
 * {@link assertRunnable} turns 1 and 2 from prose into a check: an entry carrying a quote or a
 * shell operator throws {@link EXIT.INTERNAL} before the profile can be written. That code is
 * deliberate, and it is why {@link assertRepositoryValuesUsable} screens the repository-side values
 * every entry is built from — the checkout path, `projectName`, `scriptsDir`, `stateDir` — against
 * the same shapes **first**, with the ordinary exit code and a message naming the value to change.
 * A checkout under a directory carrying `&` is the adopter's to fix in one rename; only what
 * survives that screen is a fault in this CLI or in its shipped template.
 *
 * ## Three non-obvious choices, and where each comes from
 *
 * 1. **Every wrapper is allow-listed in three forms, not one.** `commands.*` is repo-relative —
 *    every path in `harness.config.json` is (`docs/config.md` §5) — while a profile entry is
 *    conventionally absolute. A profile carrying only the absolute form would leave the configured
 *    verification command matching neither `allow` nor `deny`. So each selected wrapper contributes
 *    the repo-relative invocation an agent runs verbatim from the repository root, its
 *    repo-root-absolute twin for a caller that resolves the path first, and its sibling-worktree
 *    twin for a run executing in a second working copy. The agent-invocable outer-loop scripts land
 *    in the same directory and are emitted through the same row family, so they take the same three
 *    forms for the same reason rather than a shape of their own.
 * 2. **The wrapper set comes from {@link WRAPPER_SCRIPTS} and the invocation string from
 *    {@link wrapperInvocation}** — never from parsing a `commands.*` value back into a path. That
 *    value may legitimately be a raw command line an adopter wrote by hand, and parsing it is how
 *    the config, the wrapper files and this profile drift apart. Form (i) is
 *    {@link wrapperInvocation}'s own return value, so it is byte-identical to the string the config
 *    holds by construction rather than by inspection.
 * 3. **The template is parsed first and substituted second.** Substituting into the raw text and
 *    parsing afterwards would let a value containing a character JSON escapes — a backslash in a
 *    Windows-shaped path, a quote in a project name — produce a document that no longer parses, or
 *    worse, one that parses into something else. Parsing first means a substituted value can only
 *    ever be a string *inside* a JSON string.
 *
 * ## The browser half is a fragment, not a second profile
 *
 * The interactive-test phase's wiring lives in {@link QA_TEMPLATE_PATH} and is merged into the base
 * when — and only when — `phases.qa` is on **and** `qa.driver` is `web-playwright`
 * (`config/model.ts`'s `browserWiringApplies`, which the repository's own `.mcp.json` generator
 * reads too). An adopter who never drives a browser should pay neither the browser tool schemas in
 * every session's context nor a launched browser process, and that is as true of a mobile-driver
 * adopter with the phase on as of one with the phase off: the two mobile variants of the interactive
 * test agent ship declared-not-implemented with built-ins-only tool allowlists, so a fragment
 * written for them would start servers no agent can call. It is a **partial** profile rather than a
 * second full one: a second full file would have to be kept in step with the base by hand, and the
 * halves would drift the first time an entry was added to one of them. The fragment therefore
 * declares only what the phase adds, and {@link mergeInto} refuses any key the base already sets —
 * one producer per entry, the same rule the wrapper table follows.
 *
 * Its two keys do different jobs and both are needed: `enabledMcpjsonServers` starts the servers the
 * repository's MCP wiring declares, and the `mcp__…` `allow` entries gate which of their tools may
 * run. Without the enablement the tools do not exist at run time, and an un-loaded tool stalls a
 * print-mode run rather than failing it — which is why {@link assertBrowserWiring} checks the two
 * against each other in both directions.
 *
 * ## The docs-retrieval half is a fragment too
 *
 * {@link RETRIEVAL_TEMPLATE_PATH} is merged on the same terms when `config/model.ts`'s
 * `retrievalApplies` holds — `phases.docs` and `docs.retrieval` both on, the predicate the
 * repository's own `.mcp.json` generator reads for its retrieval half. It starts the one docs server
 * and allows its one tool, after the browser fragment, so the two `enabledMcpjsonServers` lists
 * concatenate de-duplicated. Its single allow entry must be `retrieval/server.ts`'s
 * `SEARCH_TOOL_PERMISSION`, and a template that says otherwise exits {@link EXIT.INTERNAL}: the
 * server registers the tool under that name, so any other entry is a grant for a tool that never
 * exists. {@link assertBrowserWiring} covers this half without a change of its own.
 *
 * ## The reference toolchain, and the plugin key that stays reserved
 *
 * When the parity phase is on, the reference implementation's own toolchain usually lives outside
 * the checkout, so its commands match no path-scoped entry above. `init --reference-toolchain-path`
 * supplies that directory and each `parity.toolchainCommands` value becomes one literal entry under
 * it. The path is machine-local, which is the case the plugin's `userConfig` mechanism exists for —
 * but a `userConfig` option is prompted at enable time, and the plugin key of the same name stays
 * **reserved** until the parity module ships the agent-side reader that consumes it. Until then the
 * CLI takes the path from the flag, and nothing prompts an adopter for a value nothing reads.
 *
 * ## What this module deliberately does not do
 *
 * - **It touches no filesystem beyond reading its two templates — and, on a forced run, the profile
 *   it is about to replace; under `init --plugin-root-entries`, the agent runner's plugin records.**
 *   {@link writePermissionProfile} enqueues the rendered profile into the
 *   command's write plan under the `create-if-absent` contract — the profile is hand-tuned after
 *   generation, and an overwrite silently drops the allow entries an adopter added to close a stall —
 *   and the write itself belongs to the write engine. `--force` is the one flag that suspends that
 *   contract, and therefore the one run under which those hand-added entries can be lost, so
 *   {@link carriedPluginRootEntries} reads the profile back and {@link renderProfile} carries forward
 *   every entry naming a plugin root this machine resolves (`machine/plugins.ts`, which reads the
 *   agent runner's own records) — and, where **no** root resolves at all, every absolute entry
 *   outside this checkout, unverified: a run that graded nothing revokes nothing. That is a read and
 *   not a question put to the adopter again: they
 *   were told once, by `doctor`, exactly which lines to paste. Preserving an entry is not generating
 *   one: by default nothing here generates one, and the once-open owner decision below is taken for
 *   the opt-in `init --plugin-root-entries` only, the default unchanged. Under that switch
 *   {@link generatedPluginRootEntries} reads the plugin records through {@link resolvedPluginRoots}
 *   on every run, forced or not, and still never tests whether the profile exists: whether the render
 *   lands is the write engine's `create-if-absent` answer, which `init` hands back to
 *   {@link pluginRootEntriesNote}. On a forced run the generated lines are appended before the
 *   carry-forward, which skips any line already in `allow`, so each line has one producer — the rule
 *   the browser-fragment section states.
 * - **It adds no `hooks` key.** The plugin ships its own guard hooks, which fire from the plugin,
 *   resolve their own root and append to the adopter's hooks rather than replacing them; writing
 *   them into user settings as well would run each guard twice. The template says so in a comment
 *   field, so the omission reads as a decision rather than as something to fix.
 * - **It adds no browser-namespace `deny`.** A deny is evaluated before any allow and cannot be
 *   overridden, so it would revoke the interactive-test agent's own grant. That closure is made per
 *   agent, by each agent definition's `tools:` allowlist.
 * - **It does not allow-list the interactive-test phase's own helper scripts.** Those helpers ship
 *   inside the plugin and are invoked `bash ${CLAUDE_PLUGIN_ROOT}/scripts/<name>.sh`. An entry that
 *   keeps the token buys nothing: the guard matches the raw command string, so a substitution
 *   anywhere in it defeats the match however the entry is worded (measured on `claude` 2.1.227; the
 *   runs, and the literal-path control that makes them attributable, are in `docs/development.md`
 *   §3, which also records that a directory-prefix entry misses even with a literal path). An entry
 *   naming a **resolved** root does match, and is measured to reach every one of these helpers
 *   whatever kind of file calls them (`plugin/scripts/README.md`) — so what keeps the entry out of
 *   this generator is not an unknowable root: the agent runner's own `installed_plugins.json` records one per plugin.
 *   It is that `init` may run **before** the plugin is enabled, leaving no root to read, and that
 *   the root carries the plugin **version**, so an entry written once goes silently stale on an
 *   upgrade. The resolving is therefore done at check time rather than here — `doctor`'s
 *   `plugin-permissions` check re-derives the root on every run and prints each missing line — and
 *   {@link QA_TEMPLATE_PATH}'s `_README` carries the entry *form* an adopter adds by hand, which the
 *   `create-if-absent` contract above — and, on the run that suspends it, the carry-forward named
 *   there — is what makes survive every later `init`. Whether `init` should also *write* those
 *   entries was an open owner decision, now taken for `--plugin-root-entries` only, default unchanged:
 *   inside a remote job the plugin is installed immediately before `init` runs and the profile dies
 *   with the job, so neither reason above holds there, while both still hold for the default.
 *   Moving the helpers somewhere a rule can name unconditionally — the adopter's own
 *   `scriptsDir`, which the three wrapper forms already reach — would remove the manual step but
 *   change the invocation form everywhere the shipped instruction corpus calls them, so it belongs
 *   to the item that ships them (`plugin/scripts/README.md`) and not to this module.
 * - **It emits no entry for an outer-loop script the table does not mark agent-invocable.** See
 *   below: that omission is the decision, not a gap.
 *
 * ## The outer-loop scripts, and which of them reach this file
 *
 * `init` writes a **second** family of scripts into the same `scriptsDir` the wrappers land in — the
 * run watcher, the git wrappers, the worktree tooling and the library they source. Their destination
 * is settled: they are written into the adopting repository, which is the form the shipped
 * instruction corpus already invokes them in, so the entry each one needs is an added row here
 * rather than a new mechanism.
 *
 * Only the rows {@link OUTER_LOOP_SCRIPTS} marks {@link OuterLoopScript.agentInvocable} get entries,
 * and each gets the same three forms a wrapper does, built by the same row family from the same
 * {@link scriptInvocation} return value. The set is taken from {@link writeOuterLoopScripts}'s own
 * `written` result when `init` supplies it — exactly as the wrapper set prefers `written` over
 * {@link selectWrapperScripts} — so this file cannot name a script that generator did not write.
 *
 * Two properties of those entries are load-bearing:
 *
 * - **They are `allow`, never `ask`.** The corpus invokes them on the unattended commit path, and
 *   `ask` is evaluated before `allow`, so an `ask` there is precisely the stall this module exists to
 *   prevent. The deploy wrapper's `ask` treatment is unaffected — it is a wrapper row, and a deploy
 *   is a decision a person makes.
 * - **Every other row gets nothing, deliberately.** The shared library is only ever sourced, and
 *   every remaining row — the watcher, the worktree and cleanup scripts, the notification helpers —
 *   is run by the watcher process or by a person. An entry for one of those would hand a dispatched
 *   agent a path to a branch deletion or a daemon restart, and the table's flag is where that
 *   judgement is recorded.
 *
 * A **second, independent** mechanism covers some of the same commands from the plugin side: the
 * script-allowlist guard auto-allows a Bash command when every script it runs resolves under the
 * configured scripts directory (or the same repo-relative path in a sibling worktree), no basename
 * is on its deny list, **and** nothing anywhere in the command string carries `$(…)`, a backtick,
 * `|`, `<`, a braced expansion other than a bare `${IDENT}`, or a `>` that is neither a descriptor
 * duplication nor a redirection to the literal `/dev/null` — that whole-string construct scan
 * withholds the allow wherever such a byte sits, a wrapper's own arguments included, and a `.sh`
 * token carrying a `$` is refused outright.
 *
 * The two are belt-and-braces rather than duplicates, and that bound is the second reason why. The
 * guard needs the plugin enabled and its configuration resolvable where a row in this file needs
 * neither; and the guard withholds on properties of the *command* — the constructs above — that
 * these rows, written as literal invocation prefixes, do not range over at all. Neither mechanism
 * is derivable from the other, so removing either narrows what an unattended run can spell.
 */

import { basename, dirname, isAbsolute, join, sep } from 'node:path';

import { browserWiringApplies, CONFIG_FILENAME, DEFAULTS, retrievalApplies, type HarnessConfig } from '../config/model.js';
import { HarnessError, internal } from '../core/errors.js';
import { isJsonObject, readJsonFile, type JsonObject, type JsonValue } from '../core/json.js';
import { defaultProjectName, readTemplate, workRoot as resolveWorkRoot, worktreeGlob } from '../core/paths.js';
import { normalizeRepoDir } from '../core/repoPaths.js';
import { containsToken, renderTemplate } from '../core/templating.js';
import type { WriteEffect, WritePlan } from '../core/writer.js';
import {
  installedPluginsPath,
  pluginHelperPath,
  pluginHelperScripts,
  pluginInstallRoot,
  pluginRuntimeRoot,
  SCRIPTS_DIRNAME,
} from '../machine/plugins.js';
import { SEARCH_TOOL_PERMISSION } from '../retrieval/server.js';
import {
  OUTER_LOOP_SCRIPTS,
  outerLoopRelativePath,
  type OuterLoopScript,
  type WrittenOuterLoopScript,
} from './outerLoopScripts.js';
import {
  scriptInvocation,
  selectWrapper,
  WRAPPER_SCRIPTS,
  wrapperInvocation,
  type WrapperFile,
  type WrapperKey,
  type WrittenWrapper,
} from './scripts.js';

/**
 * The template's home under `cli/templates/`, addressed as {@link readTemplate} wants it.
 *
 * Exported for the same reason {@link QA_TEMPLATE_PATH} is: the shipped template is the single
 * declaration of the profile's own floor, and `doctor` compares an adopter's `permissions.deny`
 * against it rather than keeping a second copy of the entries that must be there
 * (`doctor/checks.ts`).
 */
export const TEMPLATE_PATH = 'claude/settings.autonomous.json';

/**
 * The interactive-test fragment, merged into the base only when the phase is on and its driver is
 * the browser one — see the module header.
 *
 * A **partial** profile — see the module header. It is stored beside the base under the same
 * dot-less directory, and neither file is ever named with the adopter's leading dot inside this
 * repository (`cli/templates/claude/README.md`).
 *
 * Exported because the fragment's `enabledMcpjsonServers` list is the single declaration of which
 * browser servers a run starts, and the generator that writes the repository's own MCP wiring
 * checks its declared servers against it rather than keeping a second copy of the names
 * (`generators/repoRoot.ts`).
 */
export const QA_TEMPLATE_PATH = 'claude/settings.autonomous.qa.json';

/**
 * The docs-retrieval fragment, merged into the base only when `phases.docs` and `docs.retrieval` are
 * both on — see the module header.
 *
 * Exported for the reason {@link QA_TEMPLATE_PATH} is: its `enabledMcpjsonServers` list is the
 * declaration `generators/repoRoot.ts` checks the retrieval half of `.mcp.json` against.
 */
export const RETRIEVAL_TEMPLATE_PATH = 'claude/settings.autonomous.retrieval.json';

/** The adopter-side directory the rendered profile lands in. The dot is added here, at `init` time. */
const CLAUDE_DIR = '.claude';

/**
 * Where the rendered profile is written, relative to the adopting repository's root — and the path
 * an unattended run names in its own `--settings` flag.
 *
 * Exported because more than one caller has to say it: `init`'s summary points at it, and `doctor`
 * checks that the file is there and that the absolute paths inside it still resolve.
 */
export const PROFILE_PATH = `${CLAUDE_DIR}/settings.autonomous.json`;

/** The profile's rationale block: the array every generated explanation is appended to. */
const README_KEY = '_README';

/** The key that starts the repository's declared MCP servers for the run. Absent unless a fragment adds it. */
const ENABLED_SERVERS_KEY = 'enabledMcpjsonServers';

/** The prefix every MCP tool entry carries, and the pattern its server name is read out of. */
const MCP_ENTRY_PREFIX = 'mcp__';
const MCP_SERVER_PATTERN = /^mcp__(.+?)__/;

/** The interpreter every wrapper invocation starts with, per {@link wrapperInvocation}. */
const INVOCATION_PREFIX = 'bash ';

/** The three token names one row family marks its rows with — one per wrapper form. */
interface RowTokens {
  /** Form (i): the repo-relative `bash <scriptsDir>/<file>` the config holds. */
  readonly invocation: string;
  /** Form (ii): the bare file name, joined to the repo-root-absolute `scriptsDir`. */
  readonly file: string;
  /** Form (iii): the repo-relative path, joined to the sibling-worktree glob. */
  readonly path: string;
}

/**
 * Per-wrapper tokens: a template entry carrying one of these is a **form row**, emitted once per
 * selected wrapper script rather than once outright.
 */
const WRAPPER_ROW_TOKENS: RowTokens = Object.freeze({
  invocation: 'scriptInvocation',
  file: 'scriptFile',
  path: 'scriptPath',
});

/**
 * The same three forms, for the outer-loop rows a dispatched agent is the thing that runs.
 *
 * A separate token family rather than more values on the wrapper one, because the two sets are
 * selected by different rules and are answered for by different generators: a wrapper exists only
 * for a command that resolved, while an outer-loop script is written unconditionally and reaches
 * this file only if its row says an agent may run it. Keeping them apart is also what lets the
 * template put the two groups where a reader expects them — a run of rows per family — instead of
 * interleaving them.
 *
 * These rows live in `allow` and never in `ask`: see the module header.
 */
const OUTER_LOOP_ROW_TOKENS: RowTokens = Object.freeze({
  invocation: 'outerLoopInvocation',
  file: 'outerLoopFile',
  path: 'outerLoopPath',
});

/**
 * The same three forms, restricted to the deploy wrapper.
 *
 * The deploy rows live in `ask`, so a deploy stays a decision a person makes rather than one an
 * unattended run makes for them — and because `ask` is evaluated before `allow`, all three forms
 * are asked about rather than one. Asking about a single spelling would leave the other two
 * matching `allow` and running unattended, which is the opposite of what an `ask` entry is for. A
 * configuration with no `deploy.command` selects no deploy wrapper, and these rows then expand to
 * nothing at all.
 */
const DEPLOY_ROW_TOKENS: RowTokens = Object.freeze({
  invocation: 'deployInvocation',
  file: 'deployFile',
  path: 'deployPath',
});

/** A row family's token names as a list, for the "is this a form row?" test and the known-token set. */
function tokenNames(tokens: RowTokens): readonly string[] {
  return [tokens.invocation, tokens.file, tokens.path];
}

/**
 * What may never appear in a permission entry, and how a message names it.
 *
 * The quote characters are failure mode 1 and the operators are failure mode 2 (module header).
 * `$` is on the list for the same reason as the operators: a substitution is a different string to
 * whatever the guard matched, so an entry containing one cannot be relied on to match anything.
 * `///` is the third: a file rule marks an absolute path with a `//` prefix and the substituted
 * path brings its own leading slash, so a template row that adds a second one produces a rule that
 * silently matches no file — the same class of failure as a missed worktree glob, and just as quiet.
 */
const FORBIDDEN_IN_ENTRY: ReadonlyArray<readonly [needle: string, described: string]> = Object.freeze([
  ['///', 'a third slash on the `//` absolute-path prefix, which leaves a rule matching no file'],
  ['"', 'a double quote'],
  ["'", 'a single quote'],
  ['`', 'a backquote'],
  ['&', 'a shell operator (&)'],
  [';', 'a shell operator (;)'],
  ['|', 'a shell operator (|)'],
  ['$', 'a shell substitution ($)'],
  ['>', 'a shell redirect (>)'],
  ['<', 'a shell redirect (<)'],
  ['\n', 'a newline'],
] as const);

/** The permission lists checked by {@link assertRunnable}, in the order the template writes them. */
const PERMISSION_LISTS: readonly string[] = Object.freeze(['allow', 'deny', 'ask']);

/** How many `allow` entries one selected script must contribute — the three forms of choice 1. */
const FORMS_PER_SCRIPT = 3;

/**
 * One script under `scriptsDir` the profile allow-lists, with everything the three forms are built
 * from — a wrapper or an agent-invocable outer-loop script alike.
 *
 * The two families differ in how they are *selected* and in nothing else once selected, which is why
 * the row expansion, the count invariant and the token substitution all take this shape rather than
 * one per family.
 */
export interface SelectedScript {
  /**
   * The file's path **relative to `scriptsDir`**: a bare name for a script written directly in it,
   * `<subdir>/<name>` for one written below it.
   */
  readonly file: string;
  /** `bash <scriptsDir>/<file>` — {@link scriptInvocation}'s return value, unmodified. */
  readonly invocation: string;
  /** The repo-relative path that invocation names, i.e. the invocation without its interpreter. */
  readonly path: string;
}

/** One wrapper script the profile allow-lists: a {@link SelectedScript} that also names its config key. */
export interface SelectedWrapper extends SelectedScript {
  readonly key: WrapperKey;
  readonly file: WrapperFile;
}

/** Everything {@link renderProfile} needs. */
export interface RenderProfileOptions {
  /** The resolved repository root the profile is being generated for. */
  readonly repoRoot: string;
  /** The config in effect — the one `init` just built, or the adopter's own on a re-run. */
  readonly config: HarnessConfig;
  /** The directory holding the repository, and therefore its sibling worktrees (`core/paths.ts`). */
  readonly workRoot: string;
  /**
   * The wrappers the wrapper generator actually wrote, when the caller has them.
   *
   * **Authoritative when given.** Its own contract is "read this, not the table, to decide what may
   * be allow-listed" (`generators/scripts.ts`), and it is what keeps the profile from naming a file
   * that was never written. Omitted by a caller that has no write plan — the fixture tests, a later
   * `doctor` check — in which case the selection is derived from the config by
   * {@link selectWrapperScripts}.
   */
  readonly written?: readonly WrittenWrapper[];
  /**
   * The outer-loop scripts that generator actually wrote, when the caller has them — every row it
   * planned, not only the agent-invocable ones, which are filtered out here.
   *
   * **Authoritative when given**, for the same reason and under the same contract as `written`
   * (`generators/outerLoopScripts.ts`): the profile allow-lists literal paths, and a profile that
   * selected from the table while the writer selected from something else could name a file that is
   * not there. Omitted by a caller with no write plan, in which case the selection falls back to
   * {@link selectOuterLoopScripts}.
   */
  readonly writtenOuterLoop?: readonly WrittenOuterLoopScript[];
  /**
   * `init --reference-toolchain-path <absolute path>` — the directory holding the reference
   * implementation's own toolchain, which usually sits outside the checkout.
   *
   * Read **only** when `phases.parity` is on, and supplied by the flag rather than by the plugin
   * `userConfig` key of the same name, which stays reserved until its agent-side reader ships (see
   * the module header).
   */
  readonly referenceToolchainPath?: string;
  /**
   * The run's `--force` — the only condition under which the profile on disk is replaced, and
   * therefore the only run whose hand-added plugin-root entries can be lost. Absent means unforced,
   * and an unforced render calls {@link carriedPluginRootEntries} not at all, which is what keeps it
   * byte-identical to what it produced before this step existed.
   */
  readonly force?: boolean;
  /**
   * The run's `--dry-run`, which changes the carry-forward note's tense and nothing else: a dry run
   * computes and reports the carry-forward it would make and writes nothing (`docs/cli.md` §1's
   * faithful-preview contract).
   */
  readonly dryRun?: boolean;
  /**
   * `init --plugin-root-entries`: append the entries `doctor`'s `plugin-permissions` check requires at
   * every plugin root this machine resolves ({@link generatedPluginRootEntries}). Absent means off,
   * and an off render reads no plugin record for this purpose.
   */
  readonly pluginRootEntries?: boolean;
  /** Sink for that switch's render-time outcome, which {@link writePermissionProfile} returns. */
  readonly pluginRootOutcome?: (outcome: PluginRootEntriesOutcome) => void;
  /**
   * Sink for a line the adopter should see. Called rather than printed, so this stays a pure
   * renderer: {@link writePermissionProfile} collects into its result and `init` forwards those to
   * the reporter, the same way it drains every other generator's warnings.
   */
  readonly warn?: (message: string) => void;
  /**
   * Sink for a line that needs no attention but has to be said — what a forced run carried forward.
   * Called rather than printed for the same reason {@link RenderProfileOptions.warn} is, and
   * separate from it because a preservation that worked is not a warning.
   */
  readonly note?: (message: string) => void;
}

/**
 * Read one of this generator's templates and parse it.
 *
 * **Parsed before anything is substituted** — see choice 3 in the module header. Both a template
 * that does not parse and one that is not an object are packaging faults the adopter cannot act on,
 * so both name the template and exit {@link EXIT.INTERNAL}.
 */
function readTemplateObject(templatePath: string): JsonObject {
  const text = readTemplate(templatePath);
  let parsed: JsonValue;
  try {
    parsed = JSON.parse(text) as JsonValue;
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    throw internal(`the permission-profile template ${templatePath} is not valid JSON (${detail})`);
  }
  if (!isJsonObject(parsed)) throw internal(`the permission-profile template ${templatePath} is not a JSON object`);
  return parsed;
}

/** Two lists in order, with anything already in the first one not repeated from the second. */
function concatUnique(base: readonly JsonValue[], added: readonly JsonValue[]): JsonValue[] {
  const out = [...base];
  const seen = new Set(out.map((entry) => JSON.stringify(entry)));

  for (const entry of added) {
    const key = JSON.stringify(entry);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(entry);
  }

  return out;
}

/**
 * Merge a fragment into the base profile, in place. `label` names that fragment in the refusal.
 *
 * Three rules, and one refusal:
 *
 * - a key the base does not have is **added**, which is how `enabledMcpjsonServers` appears at all;
 * - two lists are **concatenated**, de-duplicated, base first — so the fragment's `allow` entries
 *   and its rationale lines land after the base's rather than replacing them;
 * - two objects are **merged** recursively, which is what carries `permissions.allow` down;
 * - anything else — a key the base already sets to a scalar — **throws**. A fragment adds its
 *   half; it does not get to overrule a decision the base profile made, and a value with two
 *   producers is how the two spellings drift apart.
 */
function mergeInto(base: JsonObject, fragment: JsonObject, at: string, label: string): void {
  for (const [key, value] of Object.entries(fragment)) {
    const where = at === '' ? key : `${at}.${key}`;
    const existing = base[key];

    if (existing === undefined) {
      base[key] = value;
    } else if (Array.isArray(existing) && Array.isArray(value)) {
      base[key] = concatUnique(existing, value);
    } else if (isJsonObject(existing) && isJsonObject(value)) {
      mergeInto(existing, value, where, label);
    } else {
      throw internal(
        `the ${label} fragment redeclares \`${where}\`, which the base permission-profile template already sets: the fragment adds its half rather than overruling the base, and one entry with two producers is how two spellings of it drift apart`,
      );
    }
  }
}

/**
 * The repo-relative path inside a script invocation — `bash scripts/test.sh` → `scripts/test.sh`.
 *
 * Derived from the invocation rather than re-joined from `scriptsDir` and the file name, so forms
 * (ii) and (iii) name the same file form (i) does even where the two spellings would differ: a
 * `scriptsDir` of `.` makes {@link scriptInvocation} return `bash test.sh`, while a naive join would
 * produce `./test.sh`. It throws rather than guessing if the invocation stops looking like
 * `bash <one path>`, because at that point this module's three forms no longer describe the string
 * the config holds.
 */
function invokedPath(invocation: string): string {
  const path = invocation.startsWith(INVOCATION_PREFIX) ? invocation.slice(INVOCATION_PREFIX.length) : '';
  if (path === '' || path.includes(' ')) {
    throw internal(
      `the script invocation ${JSON.stringify(invocation)} is not of the form "${INVOCATION_PREFIX}<path>", so the permission profile cannot derive its absolute and worktree forms from it`,
    );
  }
  return path;
}

/** One selected wrapper, built from the table's row and the single invocation formatter. */
function selected(key: WrapperKey, file: WrapperFile, scriptsDir: string): SelectedWrapper {
  const invocation = wrapperInvocation(scriptsDir, file);
  return { key, file, invocation, path: invokedPath(invocation) };
}

/**
 * The wrappers a config implies, in {@link WRAPPER_SCRIPTS} order — the fallback for a caller with
 * no `written` list.
 *
 * **The rule is not restated here: {@link selectWrapper} *is* the rule**, and the wrapper generator
 * that writes the files reaches its own answer by calling the same function. That is what makes this
 * a fallback rather than a second opinion — a profile can no longer allow-list a wrapper that was
 * never written, because there is no second selection to drift from the first.
 *
 * A caller that ran the wrapper generator passes its `written` list to {@link renderProfile}, which
 * is authoritative and skips this path entirely; the fixture tests assert the two agree end to end,
 * over the filesystem this module deliberately never touches.
 */
export function selectWrapperScripts(config: HarnessConfig): readonly SelectedWrapper[] {
  const scriptsDir = normalizeRepoDir(config.scriptsDir ?? DEFAULTS.scriptsDir);
  const result: SelectedWrapper[] = [];

  for (const { key, file } of WRAPPER_SCRIPTS) {
    if (!selectWrapper(config, key).selected) continue;
    result.push(selected(key, file, scriptsDir));
  }

  return result;
}

/** The `written` list mapped onto this module's shape, keeping the invocation string it carries. */
function fromWritten(written: readonly WrittenWrapper[]): readonly SelectedWrapper[] {
  return written.map(({ key, file, invocation }) => ({ key, file, invocation, path: invokedPath(invocation) }));
}

/** One outer-loop row, built from the table's row and the same single invocation formatter. */
function selectedOuterLoop(script: OuterLoopScript, scriptsDir: string): SelectedScript {
  const file = outerLoopRelativePath(script);
  const invocation = scriptInvocation(scriptsDir, file);
  return { file, invocation, path: invokedPath(invocation) };
}

/**
 * The outer-loop scripts a config implies — the fallback for a caller with no `writtenOuterLoop`
 * list.
 *
 * **The rule is not restated here either: {@link OuterLoopScript.agentInvocable} *is* the rule**,
 * and it is decided in the table beside the row that writes the file. There is no condition to
 * evaluate and therefore nothing for a second opinion to disagree with — a row that is written is a
 * row that may be listed, and only if its own flag says an agent runs it.
 *
 * Exported for the same caller {@link selectWrapperScripts} is: one that has a config and no write
 * plan.
 */
export function selectOuterLoopScripts(config: HarnessConfig): readonly SelectedScript[] {
  const scriptsDir = normalizeRepoDir(config.scriptsDir ?? DEFAULTS.scriptsDir);
  return OUTER_LOOP_SCRIPTS.filter((script) => script.agentInvocable).map((script) =>
    selectedOuterLoop(script, scriptsDir),
  );
}

/**
 * The `writtenOuterLoop` list mapped onto this module's shape, keeping each row's own invocation
 * string and dropping every row an agent is not the thing that runs.
 */
function fromWrittenOuterLoop(written: readonly WrittenOuterLoopScript[]): readonly SelectedScript[] {
  return written
    .filter((script) => script.agentInvocable)
    .map((script) => ({
      file: outerLoopRelativePath(script),
      invocation: script.invocation,
      path: invokedPath(script.invocation),
    }));
}

/** One row family: the tokens that mark a row, and the value set each copy of it is rendered with. */
interface RowFamily {
  readonly tokens: readonly string[];
  readonly values: ReadonlyArray<Readonly<Record<string, string>>>;
}

/** The values one script contributes to a row of the given family. */
function rowValues(script: SelectedScript, tokens: RowTokens): Readonly<Record<string, string>> {
  return {
    [tokens.invocation]: script.invocation,
    [tokens.file]: script.file,
    [tokens.path]: script.path,
  };
}

/** A family, built from its token names and the scripts its rows are emitted for. */
function rowFamily(tokens: RowTokens, scripts: readonly SelectedScript[]): RowFamily {
  return { tokens: tokenNames(tokens), values: scripts.map((script) => rowValues(script, tokens)) };
}

/** True when `text` carries any of `tokens`. */
function usesAny(text: string, tokens: readonly string[]): boolean {
  return tokens.some((token) => text.includes(`{{${token}}}`));
}

/**
 * Substitute one template string's tokens through {@link renderTemplate}.
 *
 * **This is the caller that needs `known` separate from `values`**, and the module's row expansion is
 * why: a per-wrapper row token is legal *in the template* but has a value only inside a row being
 * emitted for a script. Passing both sets keeps the two failures apart — a token the generator has
 * never heard of is a template that has outrun this module, while a known token in the wrong position
 * is a row family that lost track of its own extent — because they have different causes and
 * different fixes.
 *
 * `assertNoneSurvive` is off: the post-substitution sweep for this generator is
 * {@link assertRunnable}, which runs over every rendered *entry* rather than each string as it is
 * produced, and reports a leftover token as the stall it would cause.
 */
function substitute(text: string, values: Readonly<Record<string, string>>, known: ReadonlySet<string>): string {
  return renderTemplate(text, values, { describe: 'the permission-profile template', known });
}

/**
 * Render one array, expanding its **form rows**.
 *
 * A run of consecutive rows belonging to one family is expanded script-major: the whole run is
 * emitted once per selected script, so a script's three forms stay together and read as the unit
 * they are. A family with no selected script contributes nothing at all — which is how a
 * configuration without `deploy.command` produces a profile with no deploy entry rather than one
 * naming a wrapper that was never written.
 */
function renderArray(
  entries: readonly JsonValue[],
  globals: Readonly<Record<string, string>>,
  families: readonly RowFamily[],
  known: ReadonlySet<string>,
): JsonValue[] {
  const out: JsonValue[] = [];

  for (let index = 0; index < entries.length; ) {
    const entry = entries[index] as JsonValue;
    const family =
      typeof entry === 'string' ? families.find((candidate) => usesAny(entry, candidate.tokens)) : undefined;

    if (family === undefined) {
      out.push(renderValue(entry, globals, families, known));
      index += 1;
      continue;
    }

    const run: string[] = [];
    while (index < entries.length) {
      const row = entries[index];
      if (typeof row !== 'string' || !usesAny(row, family.tokens)) break;
      run.push(row);
      index += 1;
    }

    for (const values of family.values) {
      for (const row of run) out.push(substitute(row, { ...globals, ...values }, known));
    }
  }

  return out;
}

/** Render any template value: strings are substituted, arrays may expand, objects are walked. */
function renderValue(
  value: JsonValue,
  globals: Readonly<Record<string, string>>,
  families: readonly RowFamily[],
  known: ReadonlySet<string>,
): JsonValue {
  if (typeof value === 'string') return substitute(value, globals, known);
  if (Array.isArray(value)) return renderArray(value, globals, families, known);
  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, nested]) => [key, renderValue(nested, globals, families, known)]),
    );
  }
  return value;
}

/** The rendered profile's `permissions` object, or a throw when the template lost its shape. */
function permissionsOf(profile: JsonObject): JsonObject {
  const permissions = profile['permissions'];
  if (permissions === null || typeof permissions !== 'object' || Array.isArray(permissions)) {
    throw internal(
      'the permission-profile template has no `permissions` object, so nothing could be checked for the shapes that stall an unattended run',
    );
  }
  return permissions;
}

/** The entries of one permission list, or an empty list when the template does not carry it. */
function entriesOf(permissions: JsonObject, list: string): readonly string[] {
  const value = permissions[list];
  if (value === undefined) return [];
  if (!Array.isArray(value)) throw internal(`the permission-profile template's \`permissions.${list}\` is not a list`);
  return value.map((entry) => {
    if (typeof entry !== 'string') throw internal(`\`permissions.${list}\` carries an entry that is not a string`);
    return entry;
  });
}

/**
 * A `Read` rule over an absolute path, in the profile's own two-slash spelling: the `//` prefix that
 * anchors a rule at the filesystem root, then the path, which brings its own leading slash. The
 * generated profile's `Read(//<repo root>/**)` entries are this, and the template's `_README` is
 * where the two-slash rule is stated.
 *
 * It is also one of the two forms a **plugin-root** entry is written in: `doctor`'s
 * `plugin-permissions` check prints those lines for an operator to paste, and
 * {@link pluginRootEntryTarget} reads one back. This generator emits one for a plugin root only
 * under `init --plugin-root-entries`, through {@link pluginRootEntries} — the module header's decision.
 */
export function readRule(absolutePath: string): string {
  return `Read(/${absolutePath}/**)`;
}

/**
 * A wrapper-script rule, in the unquoted `Bash(bash <path>:*)` form every generated one uses — and
 * the other plugin-root form, for a helper under the plugin's own scripts directory. Same consumers,
 * and the same decision, as {@link readRule}.
 */
export function bashScriptRule(absolutePath: string): string {
  return `Bash(${INVOCATION_PREFIX}${absolutePath}:*)`;
}

/**
 * The fixed halves of the two builders above, taken from the builders themselves over a path none of
 * those halves can contain — so the inverse below recognises each form rather than spelling it a
 * second time, and a change to either builder cannot leave that inverse matching the old shape. Same
 * derivation, and the same reason, as `doctor/checks.ts`'s `HELPER_RULE_OPEN`.
 */
const RULE_PROBE = '/probe';
const [READ_RULE_OPEN = '', READ_RULE_CLOSE = ''] = readRule(RULE_PROBE).split(RULE_PROBE);
const [BASH_RULE_OPEN = '', BASH_RULE_CLOSE = ''] = bashScriptRule(RULE_PROBE).split(RULE_PROBE);

/** What a directory may not carry, or the entry names a pattern rather than a directory. */
const GLOB_CHARACTERS: readonly string[] = Object.freeze(['*', '?', '[', ']', '{', '}']);

/** The text an entry carries between one form's fixed opening and closing, if it is that form. */
function between(entry: string, open: string, close: string): string | undefined {
  if (entry.length < open.length + close.length) return undefined;
  if (!entry.startsWith(open) || !entry.endsWith(close)) return undefined;
  return entry.slice(open.length, entry.length - close.length);
}

/**
 * The directory a {@link bashScriptRule} entry's path sits two levels under, via the `scripts`
 * segment `machine/plugins.ts`'s `pluginScriptsDir` joins — imported from there rather than copied,
 * so a rename of that directory reaches this reader. Importing the name costs the extractor nothing
 * it is relied on for: it still reads a *string* back and answers the same way on a machine with no
 * plugin installed, which is what lets `doctor` and the carry-forward share it.
 */
function bashScriptRuleTarget(entry: string): string | undefined {
  const path = between(entry, BASH_RULE_OPEN, BASH_RULE_CLOSE);
  if (path === undefined) return undefined;
  const scriptsDir = dirname(path);
  if (basename(scriptsDir) !== SCRIPTS_DIRNAME) return undefined;
  return dirname(scriptsDir);
}

/**
 * The absolute directory a `permissions.allow` entry names, if it is written in one of the two forms
 * above — `Read(/<abs>/**)` and `Bash(bash <abs>/scripts/<name>:*)` both answer `<abs>` — and
 * `undefined` for everything else: an `mcp__…` entry, a command rule with no `bash ` prefix, a rule
 * whose path is repo-relative (`Bash(bash scripts/test.sh:*)`, the form {@link scriptInvocation}
 * returns), and a rule whose directory carries a glob character, which names a pattern rather than a
 * directory — the sibling-worktree spelling.
 *
 * **Telling a plugin root from the repository root is deliberately the caller's job.** Under the
 * default `scriptsDir`, a wrapper's repo-root-absolute entry renders byte-identically to what
 * {@link bashScriptRule} builds for a plugin helper, and `Read(//<repo root>/**)` to what
 * {@link readRule} builds for a plugin root — nothing in the entry string tells them apart, so an
 * extractor that answered for one and not the other would be inventing a difference the string does
 * not carry. This decides only which absolute directory an entry names; a caller asks whether that
 * directory is one of the roots it resolved, or none of them and not its own repository root.
 */
export function pluginRootEntryTarget(entry: string): string | undefined {
  const directory = between(entry, READ_RULE_OPEN, READ_RULE_CLOSE) ?? bashScriptRuleTarget(entry);
  if (directory === undefined || !isAbsolute(directory)) return undefined;
  return GLOB_CHARACTERS.some((character) => directory.includes(character)) ? undefined : directory;
}

/**
 * A directory in the one spelling {@link isUnderDirectory} compares against: no trailing separator,
 * no `.` or `..` segment. Exported so the normalisation the predicate assumes is stated once, beside
 * the predicate, rather than at each root a caller happens to resolve.
 */
export function normalizedRoot(path: string): string {
  return join(path, '.');
}

/**
 * Is `directory` `root` itself, or a path below it? Matched on the separator, so no sibling counts.
 *
 * Exported beside {@link pluginRootEntryTarget} because that function deliberately does not decide
 * whether the directory it returns is a plugin root, this checkout, or neither — this is the test
 * its two callers apply to the answer, and one copy is what keeps `init --force` and `doctor`'s
 * `plugin-permissions` check from disagreeing about the same entry.
 */
export function isUnderDirectory(directory: string, root: string): boolean {
  return directory === root || directory.startsWith(`${root}${sep}`);
}

/**
 * `entry` or `entries`, so a line agrees with the count it carries. Exported beside
 * {@link isUnderDirectory} because both sides of the entry vocabulary count the same noun —
 * `init --force` reporting what it carried forward, `doctor` reporting what the profile owes.
 */
export function entryWord(count: number): string {
  return count === 1 ? 'entry' : 'entries';
}

/**
 * The check that makes failure modes 1 and 2 unproducible rather than merely discouraged: no entry
 * in any permission list may carry a quote, a shell operator or a leftover token.
 *
 * It runs over the **rendered** entries, so it covers both what the template author wrote and what
 * substitution put there — a hand-quoted template row, and a row family that emitted a token it
 * never substituted. The adopting repository's own values reach these entries too, but never in a
 * shape this check can find: {@link assertRepositoryValuesUsable} refuses those before substitution,
 * which is what leaves every failure arriving here one the adopter could not have caused, and so
 * {@link EXIT.INTERNAL}.
 */
function assertRunnable(profile: JsonObject): void {
  const permissions = permissionsOf(profile);

  for (const list of PERMISSION_LISTS) {
    for (const entry of entriesOf(permissions, list)) {
      for (const [needle, described] of FORBIDDEN_IN_ENTRY) {
        if (entry.includes(needle)) {
          throw internal(
            `the generated permission entry ${JSON.stringify(entry)} in \`permissions.${list}\` contains ${described}, which the guard matches literally: the entry would fall through to a prompt and stall an unattended run`,
          );
        }
      }
      if (containsToken(entry)) {
        throw internal(
          `the generated permission entry ${JSON.stringify(entry)} in \`permissions.${list}\` still carries an unsubstituted token`,
        );
      }
    }
  }
}

/**
 * The pairing invariant, in the direction this module owns: every selected script — wrapper and
 * agent-invocable outer-loop row alike — contributes exactly {@link FORMS_PER_SCRIPT} `allow`
 * entries.
 *
 * Checked rather than assumed because the three forms live in the template, where a well-meaning
 * edit can drop one — and a dropped form is invisible until the run that used that spelling hangs.
 * The other direction (no entry names a script that was not written, and none names one an agent
 * must not run) is the fixture tests', which can see the filesystem this module deliberately never
 * touches.
 */
function assertEveryScriptListed(profile: JsonObject, scripts: readonly SelectedScript[]): void {
  const allow = entriesOf(permissionsOf(profile), 'allow');

  for (const script of scripts) {
    const count = allow.filter((entry) => entry.includes(script.file)).length;
    if (count !== FORMS_PER_SCRIPT) {
      throw internal(
        `the script ${script.file} is allow-listed in ${count} form(s) rather than ${FORMS_PER_SCRIPT}, so a caller using one of the missing spellings would match neither \`allow\` nor \`deny\``,
      );
    }
  }
}

/**
 * The servers the browser closure is about, read from {@link QA_TEMPLATE_PATH}'s
 * `enabledMcpjsonServers` — the single declaration of which browser servers a run starts. Read
 * rather than restated here: a browser server added there is covered with no second edit, and an
 * MCP namespace that is not a browser one is not mistaken for one.
 */
export function browserServerNames(): readonly string[] {
  const fragment = readTemplateObject(QA_TEMPLATE_PATH);
  const enabled = fragment[ENABLED_SERVERS_KEY];
  if (!Array.isArray(enabled)) {
    throw internal(
      `the interactive-test fragment ${QA_TEMPLATE_PATH} has no \`${ENABLED_SERVERS_KEY}\` list, so the browser servers a \`deny\` may not name cannot be read`,
    );
  }
  return enabled.map((entry) => {
    if (typeof entry !== 'string') {
      throw internal(`\`${ENABLED_SERVERS_KEY}\` in ${QA_TEMPLATE_PATH} carries an entry that is not a string`);
    }
    return entry;
  });
}

/**
 * Does this permission entry name a browser tool — in either spelling a settings file uses, the
 * whole-server `mcp__<server>` and the per-tool `mcp__<server>__<tool>`, with or without a trailing
 * `*`? Matched against {@link browserServerNames} rather than on the bare `mcp__` prefix, so a deny
 * of an unrelated MCP server is neither refused here nor reported as a browser deny by `doctor`.
 */
export function namesBrowserTool(entry: string): boolean {
  return browserServerNames().some((server) => {
    const namespace = `${MCP_ENTRY_PREFIX}${server}`;
    const index = entry.indexOf(namespace);
    if (index < 0) return false;
    const rest = entry.slice(index + namespace.length);
    return rest === '' || rest.startsWith('__') || rest.startsWith('*');
  });
}

/**
 * The browser closure, in the direction a generated file can get wrong: **no `deny` entry may name a
 * browser tool.**
 *
 * A deny is evaluated before any allow and cannot be overridden, so a namespace deny here would
 * revoke the interactive-test agent's own grant along with everyone else's. The closure is made per
 * agent instead, by each agent definition's `tools:` allowlist. Checked on the rendered profile
 * rather than trusted to the template, because the plausible way this gets re-introduced is an
 * adopter-shaped "tighten the deny list" edit to the shipped template.
 */
function assertNoBrowserDeny(profile: JsonObject): void {
  for (const entry of entriesOf(permissionsOf(profile), 'deny')) {
    if (!namesBrowserTool(entry)) continue;
    throw internal(
      `the generated \`permissions.deny\` names the browser tool ${JSON.stringify(entry)}, and a deny is evaluated before any allow and cannot be overridden, so it would revoke the interactive-test agent's own grant: that closure is made per agent, by each agent definition's tools allowlist, and never here`,
    );
  }
}

/**
 * The docs-retrieval fragment's allow list has to be exactly {@link SEARCH_TOOL_PERMISSION}, the name
 * the server registers its one tool under: any other entry allow-lists a tool that never exists, and
 * a second one widens a half that exists to grant one tool.
 */
function assertRetrievalGrant(fragment: JsonObject): void {
  const allow = entriesOf(permissionsOf(fragment), 'allow');
  if (allow.length !== 1 || allow[0] !== SEARCH_TOOL_PERMISSION) {
    throw internal(
      `the docs-retrieval fragment ${RETRIEVAL_TEMPLATE_PATH} allow-lists ${JSON.stringify(allow)}, where it must allow exactly ${JSON.stringify(SEARCH_TOOL_PERMISSION)}: that is the one tool the docs server registers, so any other entry grants a tool that never exists`,
    );
  }
}

/** The servers the profile starts for the run, or none when it carries no such key. */
function enabledServers(profile: JsonObject): readonly string[] {
  const value = profile[ENABLED_SERVERS_KEY];
  if (value === undefined) return [];
  if (!Array.isArray(value)) throw internal(`the generated \`${ENABLED_SERVERS_KEY}\` is not a list`);
  return value.map((entry) => {
    if (typeof entry !== 'string') throw internal(`\`${ENABLED_SERVERS_KEY}\` carries an entry that is not a string`);
    return entry;
  });
}

/**
 * The enablement and the grants have to agree, and the check runs in **both** directions because the
 * two disagreements fail differently and neither fails loudly:
 *
 * - a tool allowed whose server is not started does not exist at run time, and an un-loaded tool in
 *   print mode stalls rather than prompting — the failure this whole profile exists to prevent;
 * - a server started whose tools are all un-allowed launches a browser the run can never call, which
 *   costs every session the tool schemas and every run a process, for nothing.
 *
 * **A profile with neither half is the agreeing case, and passes deliberately.** That is every
 * profile the fragment was not merged into — the phase off, or the phase on with a mobile driver —
 * and it is why {@link enabledServers} answers "none" for an absent key rather than refusing one:
 * both loops below then run over empty sets, which is the two sides agreeing that there is no
 * browser wiring, not a check that was skipped.
 *
 * **It covers the docs-retrieval half as well**, unchanged: that fragment's server and its one tool
 * entry are read by the same two loops, so a profile holding either half or both is checked alike.
 */
function assertBrowserWiring(profile: JsonObject): void {
  const enabled = enabledServers(profile);
  const referenced = new Set<string>();

  for (const entry of entriesOf(permissionsOf(profile), 'allow')) {
    if (!entry.startsWith(MCP_ENTRY_PREFIX)) continue;
    const match = MCP_SERVER_PATTERN.exec(entry);
    if (match === null) {
      throw internal(
        `the generated allow entry ${JSON.stringify(entry)} starts with ${MCP_ENTRY_PREFIX} but does not name a server and a tool, so nothing can check that the server it belongs to is started`,
      );
    }
    referenced.add(match[1] as string);
  }

  for (const server of referenced) {
    if (enabled.includes(server)) continue;
    throw internal(
      `the generated profile allow-lists a tool of the MCP server ${JSON.stringify(server)}, which \`${ENABLED_SERVERS_KEY}\` does not start: the tool would not exist at run time, and an un-loaded tool stalls an unattended run rather than failing it`,
    );
  }

  for (const server of enabled) {
    if (referenced.has(server)) continue;
    throw internal(
      `the generated \`${ENABLED_SERVERS_KEY}\` starts the MCP server ${JSON.stringify(server)}, which no allow entry names a tool of: the run would pay for the server's tool schemas and its process and be unable to call it`,
    );
  }
}

/** The flag supplying the reference toolchain's directory, as a message should name it. */
const TOOLCHAIN_FLAG = '--reference-toolchain-path';

/**
 * {@link FORBIDDEN_IN_ENTRY} minus its `///` row, which is about a **file** rule's `//` absolute-path
 * prefix and says nothing about a command entry. Every other row applies to both.
 */
const FORBIDDEN_IN_COMMAND = FORBIDDEN_IN_ENTRY.filter(([needle]) => needle !== '///');

/** The fix for a *command* value: the one place a command carrying shell syntax can still live. */
const COMMAND_REMEDY =
  "Take it out of the value, or put the command in a wrapper script and let that script's literal path be what is allow-listed";

/**
 * Refuse an adopter-supplied value that cannot be made into an entry the guard will match.
 *
 * The same shapes {@link assertRunnable} catches, raised **before** the entry is built and with the
 * ordinary exit code: a toolchain path, a configured command or a configured directory carrying a
 * quote or a shell operator is a repository-side mistake with a repository-side fix, not the
 * packaging fault that check reports. `remedy` is what makes the message actionable, and it differs
 * per value — a command moves into a wrapper, a directory is renamed — so it is the caller's.
 */
function assertUsableInEntry(value: string, described: string, remedy: string = COMMAND_REMEDY): void {
  for (const [needle, why] of FORBIDDEN_IN_COMMAND) {
    if (!value.includes(needle)) continue;
    throw new HarnessError(
      `${described} contains ${why}, and the permission guard matches an entry literally: an entry built from it would match neither allow nor deny, which stalls an unattended run rather than failing it. ${remedy}`,
    );
  }
}

/** The repository-side values {@link assertRepositoryValuesUsable} screens, as `renderProfile` resolved them. */
interface RepositoryValues {
  readonly repoRoot: string;
  readonly projectName: string;
  readonly scriptsDir: string;
  readonly stateDir: string;
}

/**
 * Screen the values the adopting repository supplies, before any of them is substituted into an entry.
 *
 * Every entry carries the checkout path, and most carry `scriptsDir`, `stateDir` or the worktree glob
 * built from `projectName`. The schema constrains `projectName` and `scriptsDir` by length alone, and
 * nothing constrains where a repository is cloned to — so without this, a checkout at `~/work/R&D/app`
 * and an `init --project-name "Dan's App"` each reach {@link assertRunnable} and are billed to this
 * CLI, when the fix is one rename or one flag. `stateDir` already carries a schema pattern that
 * excludes every one of these characters and is screened anyway, so this is the whole set the profile
 * is built from rather than the subset that happens to be unguarded today.
 *
 * The checkout path goes first, and that is what lets the `projectName` message name the key without
 * qualification: the value that key falls back to is a segment of that path, so a directory name
 * carrying one of these characters has already been refused — with the remedy that applies to a
 * directory — before the name derived from it is looked at.
 */
function assertRepositoryValuesUsable({ repoRoot, projectName, scriptsDir, stateDir }: RepositoryValues): void {
  assertUsableInEntry(
    repoRoot,
    `the repository root ${JSON.stringify(repoRoot)}`,
    'Every entry in the profile is built from this path, so the fix is on disk rather than in the config: move or rename the checkout so that no segment of its path carries it, and run init again',
  );
  assertUsableInEntry(
    projectName,
    `the configured projectName ${JSON.stringify(projectName)}`,
    `The sibling-worktree entries are built from it: set projectName in ${CONFIG_FILENAME} to a name carrying no such character (\`config set projectName <name>\`, or \`init --project-name <name>\` on a first run), then run init again`,
  );
  assertUsableInEntry(
    scriptsDir,
    `the configured scriptsDir ${JSON.stringify(scriptsDir)}`,
    `Set scriptsDir in ${CONFIG_FILENAME} to a directory whose path carries no such character (\`config set scriptsDir <dir>\`), then run init again, which writes the scripts to the location it names`,
  );
  assertUsableInEntry(
    stateDir,
    `the configured stateDir ${JSON.stringify(stateDir)}`,
    `Set stateDir in ${CONFIG_FILENAME} to a directory whose path carries no such character (\`config set stateDir <dir>\`), then run init again`,
  );
}

/** Append a generated line to the profile's rationale block. */
function appendReadme(profile: JsonObject, line: string): void {
  const readme = profile[README_KEY];
  if (!Array.isArray(readme)) {
    throw internal(
      `the permission-profile template has no \`${README_KEY}\` list, so a generated group of entries could not be explained in the file it was written into`,
    );
  }
  readme.push(line);
}

/** Append generated `allow` entries after the template's own, adding none of them twice. */
function appendAllow(profile: JsonObject, entries: readonly string[]): void {
  const permissions = permissionsOf(profile);
  const allow = permissions['allow'];
  if (!Array.isArray(allow)) throw internal('the permission-profile template has no `permissions.allow` list to add to');
  for (const entry of entries) {
    if (!allow.includes(entry)) allow.push(entry);
  }
}

/** What {@link appendToolchainAllowances} reads. */
interface ToolchainContext {
  readonly config: HarnessConfig;
  readonly referenceToolchainPath?: string;
  readonly warn: (message: string) => void;
}

/**
 * One `allow` entry per `parity.toolchainCommands` value, each an exact literal under the directory
 * `init --reference-toolchain-path` named — and **nothing at all** when the flag is absent or the
 * parity phase is off.
 *
 * The phase gate is the one `docs/config.md` §4 puts on every parity input: the reference toolchain
 * is read only when that phase runs, so allow-listing a machine-local directory outside the checkout
 * for a repository that never compares against one would be granting a capability nothing uses. Each
 * of the three ways this can come out empty warns rather than failing, because each has a different
 * repository-side fix and none of them makes the rest of the profile wrong.
 */
function appendToolchainAllowances(profile: JsonObject, { config, referenceToolchainPath, warn }: ToolchainContext): void {
  const directory = referenceToolchainPath?.trim();

  if (config.phases?.parity !== true) {
    if (directory !== undefined && directory !== '') {
      warn(
        `${TOOLCHAIN_FLAG} was given but phases.parity is off, so no reference-toolchain entry was written: the path is read only when the parity phase runs`,
      );
    }
    return;
  }

  if (directory === undefined || directory === '') {
    warn(
      `the parity phase is on and no ${TOOLCHAIN_FLAG} was given, so the reference implementation's own toolchain is not allow-listed: it usually sits outside the checkout, where no other entry in the permission profile reaches it. Re-run init with ${TOOLCHAIN_FLAG} <absolute path> to add one entry per parity.toolchainCommands value`,
    );
    return;
  }

  if (!isAbsolute(directory)) {
    throw new HarnessError(
      `${TOOLCHAIN_FLAG} must be an absolute path, and ${JSON.stringify(directory)} is not: the entries built from it are matched literally against the command a caller runs, and a relative path names a different directory for every caller`,
    );
  }
  assertUsableInEntry(directory, `${TOOLCHAIN_FLAG} ${JSON.stringify(directory)}`);

  const commands = (config.parity?.toolchainCommands ?? []).map((command) => command.trim()).filter((c) => c !== '');
  if (commands.length === 0) {
    warn(
      `${TOOLCHAIN_FLAG} was given but parity.toolchainCommands lists nothing, so no reference-toolchain entry was written: name the reference implementation's own commands there - its static analysis, its formatter - and re-run init`,
    );
    return;
  }

  const entries = commands.map((command) => {
    assertUsableInEntry(command, `the parity.toolchainCommands entry ${JSON.stringify(command)}`);
    return `Bash(${join(directory, command)}:*)`;
  });

  appendAllow(profile, entries);
  appendReadme(
    profile,
    `THE REFERENCE TOOLCHAIN IS ALLOW-LISTED UNDER ONE ABSOLUTE PATH: the entries naming ${directory} were built from init's ${TOOLCHAIN_FLAG} flag and the parity.toolchainCommands list, because the implementation the parity phase compares against usually sits outside this checkout, where nothing else in this file reaches it. That directory is machine-local rather than repository-scoped, so it is the entry a clone on another machine is most likely to have to correct.`,
  );
}

/** The command that re-derives this machine's plugin roots and prints the lines to paste. */
const DOCTOR_COMMAND = 'npx autonomous-sdlc-harness doctor';

/**
 * The plugin roots this machine resolves, **runtime root first** — `doctor`'s own order — with the
 * `undefined` of a machine that records neither removed and the ordinary machine's two spellings of
 * one directory collapsed to one. Each is re-derived here per call, per `machine/plugins.ts`'s rule.
 */
function resolvedPluginRoots(repoRoot: string): readonly string[] {
  const roots = [pluginRuntimeRoot(repoRoot), pluginInstallRoot(repoRoot)];
  return [...new Set(roots.filter((root): root is string => root !== undefined).map(normalizedRoot))];
}

/** One entry a plugin root requires, and which of `doctor`'s two symptoms its absence causes. */
export interface PluginRootEntry {
  readonly kind: 'read' | 'helper';
  readonly rule: string;
}

/**
 * The helper-script names graded at every root: the sorted, de-duplicated union of
 * {@link pluginHelperScripts} over `roots` while `phases.qa` is on, and empty while it is off — the
 * helpers are that phase's alone. Called by `doctor`'s `plugin-permissions` check and by
 * {@link generatedPluginRootEntries}, so the two cannot grade different names.
 */
export function pluginRootHelpers(roots: readonly string[], qaOn: boolean): readonly string[] {
  return qaOn ? [...new Set(roots.flatMap((root) => pluginHelperScripts(root)))].sort() : [];
}

/**
 * The entries one root requires: {@link readRule} unless it is the install root — reads there were
 * measured to succeed ungranted (`doctor/checks.ts`, `PLUGIN_PERMISSIONS_CHECK`) — then
 * {@link bashScriptRule} for each of `helpers`, in that order. The one per-root builder, called by
 * that check and by {@link generatedPluginRootEntries}.
 */
export function pluginRootEntries(
  root: string,
  options: { readonly isInstallRoot: boolean; readonly helpers: readonly string[] },
): readonly PluginRootEntry[] {
  return [
    ...(options.isInstallRoot ? [] : [{ kind: 'read' as const, rule: readRule(root) }]),
    ...options.helpers.map((name) => ({ kind: 'helper' as const, rule: bashScriptRule(pluginHelperPath(root, name)) })),
  ];
}

/** What `--plugin-root-entries` did to the rendered profile: nothing asked, entries appended, or no root to name. */
export type PluginRootEntriesOutcome = 'off' | 'appended' | 'no-root';

/** The switch as a message names it — and as `init`'s option row spells it. */
export const PLUGIN_ROOT_ENTRIES_FLAG = '--plugin-root-entries';

/**
 * The entries `doctor`'s `plugin-permissions` check requires at every root {@link resolvedPluginRoots}
 * returns, built by the same two functions it calls, or `undefined` when no root resolves. An entry
 * a root path would make unmatchable is warned about and left out rather than handed to
 * {@link assertRunnable}, which would bill a machine-local path to this CLI.
 */
function generatedPluginRootEntries(
  repoRoot: string,
  config: HarnessConfig,
  warn: (message: string) => void,
): readonly string[] | undefined {
  const roots = resolvedPluginRoots(repoRoot);
  if (roots.length === 0) return undefined;
  const installRoot = pluginInstallRoot(repoRoot);
  const install = installRoot === undefined ? undefined : normalizedRoot(installRoot);
  const helpers = pluginRootHelpers(roots, config.phases?.qa === true);

  return roots
    .flatMap((root) => pluginRootEntries(root, { isInstallRoot: root === install, helpers }))
    .map(({ rule }) => rule)
    .filter((rule) => {
      const forbidden = FORBIDDEN_IN_ENTRY.find(([needle]) => rule.includes(needle));
      if (forbidden === undefined) return true;
      warn(
        `${PLUGIN_ROOT_ENTRIES_FLAG} left out ${JSON.stringify(rule)}: the plugin root it names contains ${forbidden[1]}, which the permission guard matches literally, so the entry would match nothing at run time`,
      );
      return false;
    });
}

/**
 * The note `init` reports for `--plugin-root-entries` once the plan is applied: the kept-profile line
 * when `effect` is `'kept'` and entries were appended; undefined otherwise. `effect` is the write
 * engine's answer for {@link PROFILE_PATH}, identical under `--dry-run`, so the line is too.
 */
export function pluginRootEntriesNote(outcome: PluginRootEntriesOutcome, effect: WriteEffect): string | undefined {
  if (outcome !== 'appended' || effect !== 'kept') return undefined;
  return `${PLUGIN_ROOT_ENTRIES_FLAG} had no effect: ${PROFILE_PATH} already exists and is kept under its create-if-absent contract, so the plugin-root entries this run rendered do not reach it. Run \`${DOCTOR_COMMAND}\` for the lines it lacks, or \`init --force ${PLUGIN_ROOT_ENTRIES_FLAG}\` to regenerate it after a .bak`;
}

/**
 * The `permissions.allow` entries of the profile currently on disk, or **an empty list for every way
 * that can fail** — absent, unreadable, not JSON, not an object, no `permissions`, no `allow`.
 *
 * This is a preservation courtesy on top of a `.bak` the write engine takes anyway, so it may never
 * turn a working `init` into a refusal; an element that is not a string is skipped for the same
 * reason rather than discarding the ones beside it.
 */
function existingAllowEntries(repoRoot: string): readonly string[] {
  let parsed: JsonValue | undefined;
  try {
    parsed = readJsonFile(join(repoRoot, PROFILE_PATH));
  } catch {
    return [];
  }
  if (!isJsonObject(parsed)) return [];
  const permissions = parsed['permissions'];
  if (!isJsonObject(permissions)) return [];
  const allow = permissions['allow'];
  if (!Array.isArray(allow)) return [];
  return allow.filter((entry): entry is string => typeof entry === 'string');
}

/** What the profile on disk carries that this generator cannot produce, split by whether it still resolves. */
interface CarryForward {
  /** Entries naming a plugin root this machine resolves, or a path under one. */
  readonly carried: readonly string[];
  /** Helper-form entries under no resolved root — the shape a plugin upgrade leaves behind. */
  readonly staleHelpers: readonly string[];
  /**
   * Every other absolute entry this generator does not preserve — a reference-implementation `Read`
   * among them, which `doctor`'s plugin-permissions check deliberately never names, on the stated
   * ground that a grant over the implementation the parity phase compares against is correct
   * configuration (`doctor/checks.ts`, `PLUGIN_PERMISSIONS_CHECK`'s header).
   */
  readonly notPreserved: readonly string[];
  /**
   * Whether any plugin root resolved here at all. False empties both left-behind lists, and is what
   * the report reads to keep every sentence it prints to what this run actually observed.
   */
  readonly rootsResolved: boolean;
}

/**
 * Read the profile `--force` is about to replace, and split its absolute-directory `allow` entries
 * three ways: the ones a root on this machine still answers for, the helper-form ones nothing
 * answers for, and every other absolute entry this generator does not preserve.
 *
 * **The two left-behind lists are separate because only one of them has a cause and a remedy.** A
 * helper-form entry under no resolved root is what a plugin upgrade strands, and `doctor` re-derives
 * the replacement; every other absolute entry is one this generator never produced and does not
 * preserve, and `doctor` is silent on it by design, so a single list would bill an adopter's
 * reference-implementation `Read` to an upgrade that did not touch it and send them to a report that
 * cannot mention it.
 *
 * **The under-a-resolved-root test is load-bearing and may never be relaxed to "defined".**
 * {@link pluginRootEntryTarget}'s stated contract is that a wrapper's repo-root-absolute form —
 * `Bash(bash <repoRoot>/scripts/test.sh:*)`, `Read(/<repoRoot>/**)` — is byte-shaped identically to a
 * plugin-helper entry and answers `<repoRoot>`; this test is what keeps those out of both left-behind
 * lists, since the generator produces them itself and would otherwise report its own output as an
 * adopter's hand-added line.
 *
 * **Graded nothing, therefore revoke nothing.** Where no root resolved — the module header's own
 * ordinary case, `init` running before the plugin is enabled, plus a shell resolving another
 * `CLAUDE_CONFIG_DIR`/`HOME` and a record momentarily unreadable — every absolute entry outside this
 * checkout is carried forward unverified and both left-behind lists stay empty. Neither of their
 * messages was earned: one blames an upgrade this run observed nothing about, the other claims
 * nothing re-derives an entry `doctor` re-derives on every run where a root answers. Preserving is
 * the only act the run has evidence for, and it is the direction {@link existingAllowEntries}'s
 * courtesy contract already points — it may never turn a working `init` into a revocation.
 *
 * **Branch order is load-bearing in two directions.** The under-a-resolved-root test stays first: a
 * `directory`-sourced marketplace can resolve a runtime root that lives *inside* the checkout (this
 * repository's own `plugin/` is such a source), so hoisting the `here` skip above it would stop
 * carrying that machine's entries. The zero-root branch sits *after* the `here` skip, so this
 * generator's own output is still reported on by neither list.
 */
function carriedPluginRootEntries({ repoRoot }: { readonly repoRoot: string }): CarryForward {
  const roots = resolvedPluginRoots(repoRoot);
  const rootsResolved = roots.length > 0;
  const here = normalizedRoot(repoRoot);
  const carried: string[] = [];
  const staleHelpers: string[] = [];
  const notPreserved: string[] = [];

  for (const entry of existingAllowEntries(repoRoot)) {
    const target = pluginRootEntryTarget(entry);
    if (target === undefined) continue;
    if (roots.some((root) => isUnderDirectory(target, root))) carried.push(entry);
    else if (isUnderDirectory(target, here)) continue; // This generator's own output — reported on by neither.
    // Nothing resolved, so nothing about this entry is knowable: neither left-behind message's cause
    // was observed and neither one's remedy applies. Unreachable on the resolved arm, so the
    // insertion changes nothing there.
    else if (!rootsResolved) carried.push(entry);
    else if (bashScriptRuleTarget(entry) !== undefined) staleHelpers.push(entry);
    else notPreserved.push(entry);
  }

  return { carried, staleHelpers, notPreserved, rootsResolved };
}

/** What {@link appendCarriedPluginRootEntries} reads, beyond the profile it appends to. */
interface CarryForwardContext {
  readonly repoRoot: string;
  readonly dryRun: boolean;
  readonly warn: (message: string) => void;
  readonly note: (message: string) => void;
}

/**
 * Carry the profile's resolved-plugin-root entries into the one replacing it, and say what was
 * carried and what was left behind.
 *
 * **Screened before appended.** Every carried entry passes the shapes {@link assertRunnable}
 * enforces first, and one that fails is warned about rather than carried: these are bytes an
 * *adopter* typed, and that check exits {@link EXIT.INTERNAL} on the stated ground that every failure
 * arriving there is one the adopter could not have caused.
 *
 * **Every sentence is conditioned on `rootsResolved`, the screening warnings included.** Where no
 * root resolved this run graded nothing, so it may not open a warning with "names a plugin root this
 * machine resolves" or a note with "naming this machine's plugin roots" — an assertion it did not
 * make. Each has a second wording claiming only what was observed, and each keeps its remedy.
 */
function appendCarriedPluginRootEntries(
  profile: JsonObject,
  { repoRoot, dryRun, warn, note }: CarryForwardContext,
): void {
  const { carried, staleHelpers, notPreserved, rootsResolved } = carriedPluginRootEntries({ repoRoot });
  const already = new Set(entriesOf(permissionsOf(profile), 'allow'));
  const usable: string[] = [];
  // What the screening warnings below may claim about an entry's directory. Spelled once, because
  // the two warnings differ only in the defect they go on to name.
  const names = rootsResolved
    ? 'names a plugin root this machine resolves but'
    : 'names an absolute directory this machine could not grade, and';

  for (const entry of carried) {
    if (already.has(entry)) continue;
    const forbidden = FORBIDDEN_IN_ENTRY.find(([needle]) => entry.includes(needle));
    if (forbidden !== undefined) {
      warn(
        `the ${PROFILE_PATH} entry ${JSON.stringify(entry)} ${names} contains ${forbidden[1]}, and the permission guard matches an entry literally: it is not carried into the regenerated profile, because an entry carrying that character matches nothing at run time. Re-add it by hand in a form that carries none, or run \`${DOCTOR_COMMAND}\` for the exact line`,
      );
      continue;
    }
    if (containsToken(entry)) {
      warn(
        `the ${PROFILE_PATH} entry ${JSON.stringify(entry)} ${names} still carries an unsubstituted \`{{token}}\`, so it matches nothing at run time and is not carried into the regenerated profile: run \`${DOCTOR_COMMAND}\` for the exact line to paste`,
      );
      continue;
    }
    usable.push(entry);
  }

  if (usable.length > 0) {
    appendAllow(profile, usable);
    note(
      rootsResolved
        ? `${usable.length} \`permissions.allow\` ${entryWord(usable.length)} naming this machine's plugin roots ${dryRun ? 'would be carried' : 'were carried'} forward into the regenerated ${PROFILE_PATH}: those are the lines \`doctor\`'s plugin-permissions check dictates and \`init\` does not generate, so --force ${dryRun ? 'would leave' : 'left'} them in place rather than revoking a permission set that was pasted in by hand`
        : `${usable.length} \`permissions.allow\` ${entryWord(usable.length)} naming an absolute directory outside this checkout ${dryRun ? 'would be carried' : 'were carried'} forward into the regenerated ${PROFILE_PATH} unverified: ${installedPluginsPath()} records no install root for this plugin on this machine, so nothing here could tell an entry \`doctor\` dictated from one a plugin upgrade stranded, and revoking a permission set that was pasted in by hand is the worse of the two errors. Enable the plugin and run \`${DOCTOR_COMMAND}\`, which re-derives the roots and names any entry that has gone stale`,
    );
  }

  // Tense from `dryRun` for the same reason the note above takes it: a preview writes nothing, so it
  // may not report a drop in the past tense (`docs/cli.md` §1). Verb from the same count the sentence
  // already spells, so the noun and the verb beside it agree.
  if (staleHelpers.length > 0) {
    const one = staleHelpers.length === 1;
    const dropped = `${one ? 'it' : 'they'} ${dryRun ? 'would not be' : one ? 'was not' : 'were not'}`;
    warn(
      `${staleHelpers.length} \`permissions.allow\` ${entryWord(staleHelpers.length)} in ${PROFILE_PATH} ${one ? 'names' : 'name'} an absolute directory that is neither this checkout nor a plugin root this machine resolves, so ${dropped} carried into the regenerated profile: a plugin upgrade moves the version-carrying install root, which leaves the entries written for the old one naming a directory nothing resolves. Run \`${DOCTOR_COMMAND}\`, which re-derives this machine's roots and prints the lines to paste. Left behind:\n${staleHelpers.join('\n')}`,
    );
  }

  // No cause claimed and no remedy named: these are entries no root on this machine ever answered
  // for, so nothing re-derives them and `doctor` — which passes over exactly this form — would send
  // the adopter through a report that cannot mention the entry they came to it about.
  if (notPreserved.length > 0) {
    const one = notPreserved.length === 1;
    const absent = `${one ? 'it' : 'they'} ${dryRun ? 'would not be' : one ? 'is not' : 'are not'} in`;
    const object = one ? 'it' : 'them';
    warn(
      `${notPreserved.length} \`permissions.allow\` ${entryWord(notPreserved.length)} in ${PROFILE_PATH} ${one ? 'names' : 'name'} an absolute directory outside this checkout that this generator does not produce and does not preserve — a grant over a reference implementation or another machine-local toolchain is the usual case — so ${absent} the regenerated profile. Nothing re-derives ${object}: add ${object} back by hand. Left behind:\n${notPreserved.join('\n')}`,
    );
  }
}

/**
 * Render the permission profile for one repository: the template, with every token resolved from
 * the runtime paths and the config in effect, and one group of three `allow` entries per wrapper
 * script that was written.
 *
 * Nothing here reads a path out of a file that ships and nothing here touches the filesystem beyond
 * reading the template: `<repo_root>`, `<work_root>` and `<worktree_glob>` are resolved per run
 * (`docs/config.md` §4), which is the whole reason the profile is generated rather than copied.
 */
export function renderProfile({
  repoRoot,
  config,
  workRoot,
  written,
  writtenOuterLoop,
  referenceToolchainPath,
  force = false,
  dryRun = false,
  pluginRootEntries: withPluginRootEntries = false,
  pluginRootOutcome,
  warn,
  note,
}: RenderProfileOptions): JsonObject {
  const scriptsDir = normalizeRepoDir(config.scriptsDir ?? DEFAULTS.scriptsDir);
  const stateDir = normalizeRepoDir(config.stateDir ?? DEFAULTS.stateDir);
  const projectName = config.projectName ?? defaultProjectName(repoRoot);

  // Before substitution, because after it these are indistinguishable from what the template wrote
  // and `assertRunnable` would bill the adopter's own directory name to this CLI (module header).
  assertRepositoryValuesUsable({ repoRoot, projectName, scriptsDir, stateDir });

  const globals: Record<string, string> = {
    repoRoot,
    workRoot,
    worktreeGlob: worktreeGlob(workRoot, projectName),
    scriptsDir,
    scriptsDirAbs: join(repoRoot, scriptsDir),
    stateDirAbs: join(repoRoot, stateDir),
    agentModel: config.agentModel ?? DEFAULTS.agentModel,
  };

  const scripts = written === undefined ? selectWrapperScripts(config) : fromWritten(written);
  const outerLoop =
    writtenOuterLoop === undefined ? selectOuterLoopScripts(config) : fromWrittenOuterLoop(writtenOuterLoop);
  const families: readonly RowFamily[] = [
    rowFamily(WRAPPER_ROW_TOKENS, scripts),
    rowFamily(
      DEPLOY_ROW_TOKENS,
      scripts.filter((script) => script.key === 'deploy'),
    ),
    rowFamily(OUTER_LOOP_ROW_TOKENS, outerLoop),
  ];

  const known = new Set([
    ...Object.keys(globals),
    ...tokenNames(WRAPPER_ROW_TOKENS),
    ...tokenNames(DEPLOY_ROW_TOKENS),
    ...tokenNames(OUTER_LOOP_ROW_TOKENS),
  ]);

  const profile = renderValue(readTemplateObject(TEMPLATE_PATH), globals, families, known) as JsonObject;

  // The browser half, and only when the phase that drives a browser is on **and** its driver is the
  // browser one — the same predicate the repository's own MCP wiring is gated on, imported rather
  // than restated so the two sides cannot answer the question differently. The fragment is rendered
  // through the same substitution as the base, so a token added to it later resolves — or is caught
  // as an unknown one — rather than shipping unsubstituted.
  if (browserWiringApplies(config)) {
    const fragment = renderValue(readTemplateObject(QA_TEMPLATE_PATH), globals, families, known) as JsonObject;
    mergeInto(profile, fragment, '', 'interactive-test');
  }

  // The docs-retrieval half, on `retrievalApplies` — the predicate `.mcp.json`'s retrieval half is
  // gated on — and after the browser fragment, so a profile carrying both lists the browser servers
  // first.
  if (retrievalApplies(config)) {
    const fragment = renderValue(readTemplateObject(RETRIEVAL_TEMPLATE_PATH), globals, families, known) as JsonObject;
    assertRetrievalGrant(fragment);
    mergeInto(profile, fragment, '', 'docs-retrieval');
  }

  // Before the toolchain entries and after the fragment, which is the window in which every `.sh`
  // entry in the profile came from a wrapper or outer-loop row: a toolchain command that happened
  // to be named like one of them would otherwise be counted as a fourth form of it.
  assertEveryScriptListed(profile, [...scripts, ...outerLoop]);

  appendToolchainAllowances(profile, {
    config,
    ...(referenceToolchainPath === undefined ? {} : { referenceToolchainPath }),
    warn: warn ?? ((): void => {}),
  });

  // In the same window, and before the carry-forward, whose `allow` check then skips every line
  // generated here: one producer per line (module header).
  let outcome: PluginRootEntriesOutcome = 'off';
  if (withPluginRootEntries) {
    const generated = generatedPluginRootEntries(repoRoot, config, warn ?? ((): void => {}));
    if (generated === undefined) {
      outcome = 'no-root';
      (warn ?? ((): void => {}))(
        `${PLUGIN_ROOT_ENTRIES_FLAG} was given but ${installedPluginsPath()} records no plugin root on this machine, so no plugin-root entry was written: run \`claude plugin install\` for this plugin before init, then run init again`,
      );
    } else {
      outcome = 'appended';
      appendAllow(profile, generated);
      appendReadme(
        profile,
        `THE PLUGIN-ROOT ENTRIES WERE WRITTEN BY init ${PLUGIN_ROOT_ENTRIES_FLAG}: they name this machine's plugin roots, which carry the plugin version, so they go stale on an upgrade. The switch is for a profile that lives no longer than the install it names - a remote job's.`,
      );
    }
  }
  pluginRootOutcome?.(outcome);

  // In the same window and for the same reason: a carried plugin helper whose basename happens to
  // match a wrapper's would be counted as a fourth form of that wrapper above. Gated on `force`,
  // which is the only run that replaces the file these entries are read out of — an unforced render
  // reads nothing and produces exactly what it did before this step existed.
  if (force) {
    appendCarriedPluginRootEntries(profile, {
      repoRoot,
      dryRun,
      warn: warn ?? ((): void => {}),
      note: note ?? ((): void => {}),
    });
  }

  assertRunnable(profile);
  assertNoBrowserDeny(profile);
  assertBrowserWiring(profile);
  return profile;
}

/** Everything {@link writePermissionProfile} needs, beyond what {@link renderProfile} takes. */
export interface PermissionProfileOptions
  extends Omit<RenderProfileOptions, 'workRoot' | 'warn' | 'note' | 'pluginRootOutcome'> {
  /** The command's write plan; this generator enqueues into it and never touches `fs` itself. */
  readonly plan: WritePlan;
  /**
   * The directory holding the repository, and therefore its sibling worktrees. Defaults to the
   * repository root's parent, which is what it is in every layout the worktree glob describes;
   * passed explicitly by a caller that has already resolved it.
   */
  readonly workRoot?: string;
}

/** What the generator produced, for `init`'s summary and for `doctor`. */
export interface PermissionProfileResult {
  /** Absolute path of the profile. */
  readonly path: string;
  /** The same path repo-relative — the value an unattended run passes to its own `--settings` flag. */
  readonly repoPath: string;
  /** Things needing attention, one line each, for the reporter's `warn`. */
  readonly warnings: readonly string[];
  /** Informational lines, one each, for the reporter's `info`. */
  readonly notes: readonly string[];
  /** What `--plugin-root-entries` did to the render — the first argument {@link pluginRootEntriesNote} takes. */
  readonly pluginRootEntries: PluginRootEntriesOutcome;
}

/**
 * Render the profile and enqueue it at {@link PROFILE_PATH} under the `create-if-absent` contract.
 *
 * That contract is the whole reason this is a separate step from rendering. The profile is
 * **hand-tuned after generation** — the entry an adopter adds to close a stall is the most valuable
 * line in the file and the least reproducible — so a second `init` leaves an existing one
 * byte-identical, and `--force` regenerates it only after the write engine has copied it to a `.bak`
 * sibling — carrying the plugin-root entries of the file it replaces into the one it writes, which is
 * the one group in that file this generator knowingly cannot produce ({@link renderProfile}).
 *
 * Nothing here touches the filesystem: the generator plans, and `init` applies the plan once.
 */
export function writePermissionProfile({
  repoRoot,
  config,
  plan,
  workRoot,
  written,
  writtenOuterLoop,
  referenceToolchainPath,
  force,
  dryRun,
  pluginRootEntries,
}: PermissionProfileOptions): PermissionProfileResult {
  const warnings: string[] = [];
  const notes: string[] = [];
  let outcome: PluginRootEntriesOutcome = 'off';

  const profile = renderProfile({
    repoRoot,
    config,
    workRoot: workRoot ?? resolveWorkRoot(repoRoot),
    ...(written === undefined ? {} : { written }),
    ...(writtenOuterLoop === undefined ? {} : { writtenOuterLoop }),
    ...(referenceToolchainPath === undefined ? {} : { referenceToolchainPath }),
    ...(force === undefined ? {} : { force }),
    ...(dryRun === undefined ? {} : { dryRun }),
    ...(pluginRootEntries === undefined ? {} : { pluginRootEntries }),
    pluginRootOutcome: (value) => {
      outcome = value;
    },
    warn: (message) => warnings.push(message),
    note: (message) => notes.push(message),
  });

  const path = join(repoRoot, PROFILE_PATH);
  plan.add({ path, policy: 'create-if-absent', content: profile, label: 'unattended permission profile' });

  return {
    path,
    repoPath: PROFILE_PATH,
    warnings,
    notes: [
      `${PROFILE_PATH} is committed, and it is machine-specific: the absolute paths in it are this checkout's, so a copy of this repository somewhere else needs doctor to re-check them and init --force to regenerate them. Select it per run with the agent runner's settings flag; it is never installed as the interactive default.`,
      ...notes,
    ],
    pluginRootEntries: outcome,
  };
}

/**
 * Generator: the project-command wrapper scripts `init` writes into the configured `scriptsDir`.
 *
 * **The rule this module exists to enforce: {@link WRAPPER_SCRIPTS} is the single source for the
 * wrapper set, and {@link scriptInvocation} is the single producer of the string that names *any*
 * script `init` writes into `scriptsDir`.** The generated config, the wrapper files and the
 * generated permission profile are three views of one string; drift between them is invisible until
 * an unattended run stalls on a command that matches neither `allow` nor `deny`, which in `-p` mode
 * is a stall rather than a prompt. So the config generator and the profile generator import from
 * here rather than formatting `bash …/….sh` themselves; {@link wrapperInvocation} is the typed
 * wrapper-only spelling of the same producer, and `generators/outerLoopScripts.ts` — whose files
 * land in the same directory and whose agent-invocable rows reach the same profile — calls
 * {@link scriptInvocation} directly rather than becoming a second producer of the shape.
 *
 * ## Three non-obvious choices, and where each comes from
 *
 * 1. **`commands.*` holds the wrapper *invocation*; the wrapper file holds the *raw* command
 *    line.** The `commands` object of `examples/harness.config.json` is the worked shape:
 *    `"typecheck": "bash packages/storefront/scripts/typecheck.sh"` in the config, with the
 *    `npm run …` / `pytest` / `go vet …` line inside the script. `deploy.command` (that
 *    file's `deploy` object) takes the same wrapper form on its own object. The wrappers
 *    exist because an unattended run's permission profile can allow-list a literal script
 *    path far more safely than an arbitrary command line (`cli/templates/scripts/README.md`).
 * 2. **`build` and `depInstall` are deliberately not wrapped**, and therefore never allow-listed:
 *    the same example config leaves both raw (`"npm run build --workspace …"`, `"npm ci"`),
 *    because they are orchestrator- or human-run rather than agent-run. That is the same reason
 *    the reference profile gates the package manager outright, which the generated profile's
 *    rationale block states. Wrapping them would hand an agent a script path it is allowed to
 *    run, which is exactly what those two must not have.
 * 3. **Each script prints its own verdict line** — `PASS: <name>` / `FAIL: <name> (exit n)` —
 *    so a caller never appends `; echo $?` to it. That compound form is what stalls an
 *    unattended run on a permission prompt, and a wrapper that reports its own result removes
 *    the reason to write one.
 *
 * ## Scope
 *
 * This module is the **writer**, and the templates it renders now carry their finished bodies —
 * self-anchoring to their own checkout, forwarding their arguments, and (for the dev server)
 * detaching the process and reporting its pid and log path. What they never carry is the command
 * line itself: that arrives from `commands.*` / `deploy.command` at render time. A wrapper this
 * module selects is written with its body rather than left for later, because `commands.*` points
 * at it and the permission profile allow-lists its literal path — writing a path the file does not
 * back would generate a profile naming a file that does not exist.
 *
 * The one thing here that does not write is {@link wrapperCommandLine}, which reads a written
 * wrapper's command line back out; it sits in this module rather than beside its caller for the
 * reason its own doc gives.
 */

import { join } from 'node:path';

import { answersNone, DEFAULTS, isPlaceholder, type HarnessCommands, type HarnessConfig } from '../config/model.js';
import { HarnessError } from '../core/errors.js';
import { readTemplate } from '../core/paths.js';
import { normalizeRepoDir } from '../core/repoPaths.js';
import { renderTemplate } from '../core/templating.js';
import type { WritePlan } from '../core/writer.js';
import { devServerPrestart, type RawCommands } from '../detect/presets.js';

/** The config key a wrapper's command line is read from. `deploy` reads `deploy.command`. */
export type WrapperKey = 'typecheck' | 'test' | 'devServer' | 'deploy';

/** The wrapper's file name, in `cli/templates/scripts/` and in the adopter's `scriptsDir` alike. */
export type WrapperFile = 'typecheck.sh' | 'test.sh' | 'start-dev-server.sh' | 'deploy.sh';

/** One wrapper: the config key that supplies its command line, and the file it is written to. */
export interface WrapperScript {
  readonly key: WrapperKey;
  readonly file: WrapperFile;
}

/**
 * The whole wrapper set, in the order `init` writes it.
 *
 * **Declared once, here.** A `.sh` name that appears as a string literal anywhere else in the CLI
 * is a second source for this table and will drift from it; the template path and the invocation
 * string are both derived from a row rather than spelled out again.
 */
export const WRAPPER_SCRIPTS: ReadonlyArray<WrapperScript> = Object.freeze([
  Object.freeze({ key: 'typecheck', file: 'typecheck.sh' }),
  Object.freeze({ key: 'test', file: 'test.sh' }),
  Object.freeze({ key: 'devServer', file: 'start-dev-server.sh' }),
  Object.freeze({ key: 'deploy', file: 'deploy.sh' }),
] as const);

/** The two wrappers written whatever the repository looks like: the flow's verification pair. */
const ALWAYS_SELECTED: ReadonlyArray<WrapperKey> = Object.freeze(['typecheck', 'test']);

/** Executable, because `commands.*` invokes the file rather than sourcing it. */
const SCRIPT_MODE = 0o755;

/** The templates' subdirectory under `cli/templates/`, addressed as {@link readTemplate} wants it. */
const TEMPLATE_DIR = 'scripts';

/** Everything {@link writeWrapperScripts} needs. */
export interface WrapperScriptsOptions {
  /** The resolved repository root the wrappers are written under. */
  readonly repoRoot: string;
  /** The config `init` is about to write, or the one already on disk on a re-run. */
  readonly config: HarnessConfig;
  /** Stack detection's **raw** command lines — never a wrapper invocation (`detect/presets.ts`). */
  readonly rawCommands: RawCommands;
  /** The command's write plan; this generator enqueues into it and never touches `fs` itself. */
  readonly plan: WritePlan;
}

/** One wrapper that was written, or that a `--dry-run` reported it would write. */
export interface WrittenWrapper extends WrapperScript {
  /**
   * The **repo-relative** `bash <scriptsDir>/<file>` this wrapper is invoked by — the literal
   * `commands.*` holds, and form (i) of the three the permission profile emits per script.
   */
  readonly invocation: string;
  /**
   * The raw command line **this run rendered into the wrapper body**: {@link resolveBody}'s `body`
   * verbatim, whichever of its three precedences won.
   *
   * It is returned rather than re-read from the file because wrappers are `create-if-absent`
   * ({@link writeWrapperScripts}): over a wrapper already on disk the body resolved here is
   * discarded and the kept file runs its own line. A consumer may therefore claim only *"the line
   * this run resolved"* from it — {@link wrapperCommandLine} is what reads the kept file.
   */
  readonly command: string;
  /**
   * True exactly on {@link unresolvedBody}'s branch, where {@link command} runs no command at all
   * and quotes this wrapper's own file name in its remedy message.
   *
   * It carries {@link command}'s caveat with it: it describes what this run resolved, not what a
   * kept file on disk holds.
   */
  readonly unresolved: boolean;
}

/** What the generator produced, for the config and profile generators that consume it. */
export interface WrapperScriptsResult {
  /** The `scriptsDir` actually used: the config's value or the schema default, without a trailing `/`. */
  readonly scriptsDir: string;
  /**
   * The wrappers that were written, in {@link WRAPPER_SCRIPTS} order.
   *
   * **Read this, not the table, to decide what may be allow-listed**: a wrapper that was not
   * written must not appear in the profile, and a wrapper that was must appear in every form a
   * caller may use. One entry per wrapper this run enqueued, each carrying the command line that
   * run resolved for it ({@link WrittenWrapper.command}).
   */
  readonly written: readonly WrittenWrapper[];
  /**
   * What the adopter should know, one line each. Returned rather than printed so the generator
   * stays a pure planner: `init` forwards these to the reporter's `warn`, the same way it drains
   * `PresetProfile.warnings`.
   */
  readonly warnings: readonly string[];
}

/** `<dir>/<file>`, POSIX-style, with a `.`-valued directory meaning the repository root. */
function posixJoin(dir: string, file: string): string {
  const normalized = normalizeRepoDir(dir);
  return normalized === '.' ? file : `${normalized}/${file}`;
}

/**
 * The interpreter {@link scriptInvocation} prefixes every path with, and the one string
 * {@link invokedPath} takes back off to name the file an invocation runs.
 */
const INVOCATION_PREFIX = 'bash ';

/**
 * The repo-relative path inside an invocation **this module produced** — never inside a configured
 * value. It is the inverse of {@link scriptInvocation} over that one producer's own output, which is
 * why it may slice a fixed prefix; a `commands.*` value may legitimately be a raw command line, and
 * parsing one back into a path is how the three views drift apart (`docs/cli.md` §6).
 */
function invokedPath(invocation: string): string {
  return invocation.slice(INVOCATION_PREFIX.length);
}

/** The `scriptsDir` every wrapper path is built from: the config's value or the schema default. */
function resolvedScriptsDir(config: HarnessConfig): string {
  return normalizeRepoDir(config.scriptsDir ?? DEFAULTS.scriptsDir);
}

/**
 * **The one producer of `bash <scriptsDir>/<file>`**, for every script `init` writes into the
 * configured `scriptsDir` — the wrappers here and the outer-loop scripts alike.
 *
 * Repo-relative, forward-slashed and unquoted, because commands are executed from the repository
 * root and every path in the config file is repo-relative. The profile's allow entry (i) is this
 * exact string; its repo-root-absolute and sibling-worktree twins are the profile's to derive and
 * are deliberately not produced here.
 *
 * `file` is a path relative to `scriptsDir`, so a script in a subdirectory is named by passing
 * `<subdir>/<file>` rather than by joining the pieces at the call site.
 */
export function scriptInvocation(scriptsDir: string, file: string): string {
  return `${INVOCATION_PREFIX}${posixJoin(scriptsDir, file)}`;
}

/**
 * The literal `commands.*` (or `deploy.command`) holds for one wrapper: {@link scriptInvocation}
 * narrowed to {@link WrapperFile}.
 *
 * It delegates rather than formatting the string itself, so the wrapper set and the outer-loop set
 * cannot come to be named in two subtly different ways, and the config, the profile and this
 * generator keep reading one function's answer. The narrower parameter type is the point of keeping
 * it: a caller that means "a wrapper" cannot pass an arbitrary name through it by mistake.
 */
export function wrapperInvocation(scriptsDir: string, file: WrapperFile): string {
  return scriptInvocation(scriptsDir, file);
}

/**
 * One wrapper's repo-relative path, forward-slashed — {@link wrapperInvocation} without the
 * interpreter, for a message that names the **file** rather than a line to run.
 *
 * Exported so a caller that has to speak about a wrapper on disk composes the path from this
 * module's own `scriptsDir` and {@link WrapperFile} instead of restating the join or slicing it back
 * out of an invocation ({@link invokedPath}'s standing prohibition).
 */
export function wrapperPath(scriptsDir: string, file: WrapperFile): string {
  return posixJoin(scriptsDir, file);
}

/**
 * Where a wrapper's command line is configured, as a message should name it.
 *
 * Exported for the `doctor` check that reports on the same keys: `deploy`'s command lives on its own
 * object, so a caller spelling the key family itself would name a `commands.deploy` no config has.
 */
export function configKeyPath(key: WrapperKey): string {
  return key === 'deploy' ? 'deploy.command' : `commands.${key}`;
}

/**
 * The configured command line for one key, trimmed, or `undefined` when the key carries none.
 *
 * Exported for the caller that reports the lines this run put in effect, which covers the unwrapped
 * `build` and `depInstall` too. `deploy` reads `deploy.command`, which is the same special case
 * {@link configKeyPath} exists for — a second copy of it elsewhere is a second answer to "where is
 * this key's line configured".
 */
export function configuredCommand(
  config: HarnessConfig,
  key: keyof HarnessCommands | 'deploy',
): string | undefined {
  const value = key === 'deploy' ? config.deploy?.command : config.commands[key];
  if (value === undefined) return undefined;
  const trimmed = value.trim();
  return trimmed === '' ? undefined : trimmed;
}

/** A wrapped key holding a raw command line, and the wrapper invocation it should hold instead. */
export interface WrappedKeyMismatch {
  /** The raw command line the key holds, trimmed — the string an agent is told to run as-is. */
  readonly configured: string;
  /** The wrapper invocation for this key at the configured `scriptsDir`, from the one producer. */
  readonly invocation: string;
  /** The wrapper the raw line was inlined into, which is the file the profile allow-lists. */
  readonly file: WrapperFile;
}

/**
 * **The one owner of "a wrapped `commands.*` key holds a raw command line rather than its wrapper
 * invocation".** `init` (through {@link resolveBody}), `doctor` and `config set` all ask this
 * function rather than each restating the condition, so the three cannot come to disagree about what
 * the defect is — the state a nested application's hand-fill path produces, where the permission
 * profile allow-lists the wrapper and the configured string is refused.
 *
 * It compares **byte-equality against {@link wrapperInvocation}**, the single producer of the form,
 * and never parses the configured value back into a path: that value may legitimately be a raw
 * command line, and parsing it is how the three views drift apart (`docs/cli.md` §6).
 *
 * Four states are deliberately **not** this defect:
 *
 * - **unset or empty** — there is nothing to compare, and nothing was inlined into a wrapper;
 * - **still the placeholder** — reported by the config check and by {@link writeWrapperScripts}, and
 *   no wrapper is written for it at all, so there is no allow-listed form for it to disagree with;
 * - **`commands.typecheck` answered `none`** — the adopter's statement that this repository has no
 *   type check, for which no wrapper is written at all, so there is again no allow-listed form for it
 *   to disagree with. The exemption is made **here** rather than left to {@link selectWrapper}'s arm
 *   because `config set` — the supported route to writing that answer — calls this predicate
 *   directly, and would otherwise print {@link wrappedKeyMismatchMessage}, an instruction to undo the
 *   answer. The exemption is key-gated like the arm, so it holds on that key only: `commands.test`
 *   holding the same string keeps its wrapper and still gets its mismatch report;
 * - **holding the invocation** — the normal state after a first `init`, and the state every correct
 *   adoption stays in.
 */
export function wrappedKeyMismatch(config: HarnessConfig, key: WrapperKey): WrappedKeyMismatch | undefined {
  const configured = configuredCommand(config, key);
  if (configured === undefined || isPlaceholder(configured) || answersNone(key, configured)) return undefined;

  // Read from the table rather than from a second `.sh` literal. A `WrapperKey` is that table's own
  // union, so the lookup cannot miss; `undefined` there is the same answer this function gives for
  // every other "nothing to report", which keeps a predicate from carrying an error path.
  const script = WRAPPER_SCRIPTS.find((entry) => entry.key === key);
  if (script === undefined) return undefined;

  const invocation = wrapperInvocation(resolvedScriptsDir(config), script.file);
  return configured === invocation ? undefined : { configured, invocation, file: script.file };
}

/**
 * The one sentence every consumer of {@link wrappedKeyMismatch} prints, so `init`, `doctor` and
 * `config set` cannot state one defect three ways.
 *
 * {@link configKeyPath} is applied here rather than by the caller, which is what names the `deploy`
 * row `deploy.command` instead of the `commands.deploy` that key does not have.
 *
 * **The re-run has a condition, and the sentence has to carry it.** Wrappers are written
 * `create-if-absent` ({@link writeWrapperScripts}), so a re-run inlines this line **only** where the
 * file is not there yet; over a wrapper already on disk the write engine keeps the file and the body
 * {@link resolveBody} just computed is discarded, leaving a message that named a plain re-run
 * prescribing a step that silently loses the adopter's line. Both arms are therefore named: the plain
 * re-run for the absent file, and `init --force` — which backs the file up to a `.bak` first — or
 * deleting it for the one that exists.
 *
 * **The two steps are ordered, and the sentence has to carry the order too** — because one of the
 * three sites sees this state *before* the wrapper exists. `config set` is the hand-fill boundary a
 * nested application reaches with the key still holding the placeholder, for which
 * {@link writeWrapperScripts} wrote no wrapper at all; that file is created by the **next** `init`,
 * from the raw line just stored, which is the absent arm. So the wrapper is named as the file that
 * line goes into rather than as one that already runs it, and the corrective `set` is named after the
 * write that has to precede it: performing it first leaves {@link resolveBody} nothing to inline —
 * precedence 1 no longer sees a raw line, precedence 2 finds only the placeholder detection produced
 * — and the wrapper is written to fail with the adopter's command line gone. That is the same
 * sequence `init`'s own undetected-command warning prescribes (`detect/presets.ts`, arm 1), so the
 * two read as one path.
 */
export function wrappedKeyMismatchMessage(
  key: WrapperKey,
  { configured, invocation }: WrappedKeyMismatch,
): string {
  const keyPath = configKeyPath(key);
  const wrapperPath = invokedPath(invocation);
  return (
    `${keyPath} holds a raw command line (${configured}) rather than the wrapper invocation; ` +
    `${wrapperPath} is the wrapper that line belongs in, and the invocation is the form the permission ` +
    `profile allow-lists. Wrappers are create-if-absent, so init writes ${wrapperPath} from this line ` +
    `only while that file does not exist: re-run init where it is absent, and where it is already on ` +
    `disk run init --force (which backs it up to ${wrapperPath}.bak first) or delete it and re-run. Then set ` +
    `${keyPath} to ${invocation} — setting it before the wrapper holds the line discards the line. ` +
    `An agent told to run the configured string as-is is refused on the raw line`
  );
}

/** What the selection rule says about one wrapper key, and the command line it read getting there. */
export interface WrapperSelection {
  /**
   * True when a wrapper file is written for this key — and therefore, and only therefore, when its
   * path may be allow-listed in the permission profile.
   */
  readonly selected: boolean;
  /**
   * True when the key still holds the marker `init` writes for a command it could not detect. It
   * selects nothing, and it is distinct from a plain `false` because it is one of the two unselected
   * cases the adopter should be told about: the fix is to fill the key in.
   */
  readonly placeholder: boolean;
  /**
   * True when `NONE_SENTINEL_KEY` holds the sentinel: the repository **states** it has no type check.
   * It selects nothing, and it is the second unselected-but-reportable case — distinct from
   * {@link placeholder}, an unanswered key, because here the fix is not to fill the key in.
   *
   * **Key-gated**: `false` for every key other than `NONE_SENTINEL_KEY`, so a `test` key holding the
   * same string keeps its wrapper and its allow entries.
   */
  readonly answeredNone: boolean;
  /** The configured command line, trimmed, or `undefined` when the key carries none. */
  readonly configured?: string;
}

/**
 * **The wrapper-selection rule, and the only place it is written down.** Its two callers —
 * {@link writeWrapperScripts}, which writes the files, and the permission profile's
 * `selectWrapperScripts`, which decides what may be allow-listed — both run this function rather
 * than each restating the rule:
 *
 * - `typecheck` and `test` always — the two commands the flow treats as "this change is done"
 *   (`config/check.ts`), so a repository always has both wrappers to point at;
 * - `start-dev-server.sh` only when a dev-server command resolved: a project without one has no
 *   server to start, and writing the wrapper anyway would put a path in the permission profile that
 *   nothing runs;
 * - `deploy.sh` only when the config carries `deploy.command`. `deploy` is an **adopter-added**
 *   section that `init` does not generate this release, so a fresh `init` selects no deploy wrapper;
 * - **nothing at all for a key still holding the placeholder**, which is reported separately so the
 *   caller that writes files can warn about it while the caller that only lists them stays quiet;
 * - **nothing at all for `commands.typecheck` answered `none`**, which is reported differently
 *   because the fix is not to fill it in — and only that key, because the same string on any other
 *   key is a command line this rule still writes a wrapper for.
 *
 * It is exported for exactly that second caller, which has to reach the same answer from a config
 * alone and no write plan. A selection rule with two producers is precisely how a profile comes to
 * allow-list a wrapper that was never written — an entry naming a file that does not exist — so the
 * two answers are the same code rather than two statements of it.
 */
export function selectWrapper(config: HarnessConfig, key: WrapperKey): WrapperSelection {
  const configured = configuredCommand(config, key);
  if (configured === undefined) {
    return { selected: ALWAYS_SELECTED.includes(key), placeholder: false, answeredNone: false };
  }
  if (isPlaceholder(configured)) return { selected: false, placeholder: true, answeredNone: false, configured };
  if (answersNone(key, configured)) return { selected: false, placeholder: false, answeredNone: true, configured };
  return { selected: true, placeholder: false, answeredNone: false, configured };
}

/**
 * What an adopter has to do for this wrapper to run something, as a message should say it.
 *
 * `deploy` gets its own sentence because the config key is never the missing piece there: the
 * wrapper is selected only when `deploy.command` is already set, and no deploy command is ever
 * detected, so naming `deploy.command` would name a key the adopter has set. The raw line goes in
 * the wrapper.
 */
function unresolvedFix(key: WrapperKey, file: WrapperFile): string {
  return key === 'deploy'
    ? `put the deploy command line in ${file}`
    : `set ${configKeyPath(key)} in harness.config.json`;
}

/**
 * The body written when no command line resolved: it says what to fix and fails, rather than
 * appearing to have run a check it never ran.
 *
 * This is the one body that exits before the template's verdict line, and deliberately: there is
 * no verdict to report because nothing was verified, and the message is the diagnostic. Letting
 * it fall through to `FAIL: <name>` would report a failed check where no check exists.
 *
 * It calls the template's own `harness_fail` rather than spelling out `echo … && exit 1`, and has
 * to: every template appends `"$@"` to this line, so a compound would hand the caller's arguments
 * to its last command — and `exit` given extra arguments refuses them, prints nothing but a shell
 * error and does not exit, which is the fall-through this body exists to avoid. A single command
 * that ignores the extra arguments is the shape that holds, and it is the shape the template's own
 * comment above that line asks for.
 */
function unresolvedBody(key: WrapperKey, file: WrapperFile): string {
  return `harness_fail "harness: ${unresolvedFix(key, file)}"`;
}

/**
 * Render a wrapper template through {@link renderTemplate}.
 *
 * **`assertNoneSurvive` is deliberately left off here**, and this is the one generator for which
 * that is true: the value substituted in is the adopter's own command line, which is allowed to
 * contain `{{…}}`. The pre-substitution check that the shared renderer always performs is what
 * covers the real fault — the template and this module disagreeing about the token set — without
 * refusing a legal command.
 */
function render(file: WrapperFile, values: Readonly<Record<string, string>>): string {
  return renderTemplate(readTemplate(`${TEMPLATE_DIR}/${file}`), values, {
    describe: `the wrapper template ${file}`,
  });
}

/** The pre-start line for a wrapper with nothing to run before its command: a shell no-op. */
const NO_PRESTART = ':';

/**
 * The `{{prestart}}` value for one wrapper — the line `start-dev-server.sh` runs to completion before
 * it launches, or {@link NO_PRESTART} for every other wrapper and every dev server with nothing to
 * build first.
 *
 * **It answers only for {@link resolveBody}'s second arm**, which the `body === rawCommands.devServer`
 * test is: an adopter whose `commands.devServer` holds a raw line chose that line, and prefixing a
 * build to somebody's own command is not this generator's call. Whether a *detected* line needs one is
 * `detect/presets.ts`'s fact, asked through {@link devServerPrestart} rather than re-derived here.
 *
 * The line carries no `"$@"`, so {@link wrapperCommandLine} still reads the launch line back out as
 * the wrapper's command — the property `doctor`'s `daemon-path` check depends on.
 */
function prestartLine(file: WrapperFile, body: string, rawCommands: RawCommands): string {
  if (file !== 'start-dev-server.sh' || body !== rawCommands.devServer) return NO_PRESTART;
  return devServerPrestart(rawCommands) ?? NO_PRESTART;
}

/** One wrapper's resolved command line, plus anything the adopter should be told about it. */
interface ResolvedBody {
  readonly body: string;
  readonly warning?: string;
  /**
   * True for the {@link unresolvedBody} branch: the body runs no command at all, and it names its
   * own wrapper file in the remedy message. The recursion assertion is asked only of a body that
   * runs something, so this branch skips it outright rather than leaving a body that merely quotes
   * its file name to {@link invokesScript} to clear.
   */
  readonly unresolved?: boolean;
}

/**
 * Resolve the command line a wrapper runs, in the one precedence that cannot produce a circular
 * pair:
 *
 * 1. **A raw line already in the config wins** — an adopter who edited `commands.typecheck` to a
 *    real command line meant it, and that is the reading under which
 *    `templates/scripts/README.md`'s "command lines come from `commands.*`" holds. It wins and is
 *    **reported**: the profile allow-lists the wrapper this line was just inlined into, not the line
 *    itself, so the arm carries {@link wrappedKeyMismatchMessage} as its warning.
 * 2. **Otherwise, when the configured value *is* this wrapper's own invocation** — the normal
 *    state after a first `init` — the body is stack detection's raw line. Inlining the
 *    self-reference instead would produce a script that runs itself forever, so
 *    {@link writeWrapperScripts} asserts against it explicitly rather than trusting this branch.
 * 3. **When neither resolves**, the body says what to fix and exits non-zero — for `deploy`, which
 *    step 2 can never supply, that is the wrapper rather than the config key.
 */
function resolveBody(
  { key, file }: WrapperScript,
  configured: string | undefined,
  invocation: string,
  rawCommands: RawCommands,
): ResolvedBody {
  const detected = key === 'deploy' ? undefined : rawCommands[key];

  // Precedence 1, and the moment Finding 65 describes: the raw line is inlined into the wrapper the
  // profile allow-lists, so this is the one place that holds both halves. The warning is built from
  // the strings this arm already has rather than by re-calling `wrappedKeyMismatch` — the same
  // condition and the same two strings, read once, so the report cannot disagree with the body that
  // was written. `deploy` reaches it too, and correctly: `deploy.command` takes the same wrapper
  // form on its own object (`docs/cli.md` §5).
  if (configured !== undefined && configured !== invocation) {
    return { body: configured, warning: wrappedKeyMismatchMessage(key, { configured, invocation, file }) };
  }
  if (detected !== undefined && detected.trim() !== '' && !isPlaceholder(detected)) return { body: detected.trim() };

  const fix = unresolvedFix(key, file);
  return {
    body: unresolvedBody(key, file),
    unresolved: true,
    warning:
      key === 'deploy'
        ? `deploy.command holds ${file}'s own invocation and no deploy command is ever detected, so ${file} was written as a wrapper that fails with a message: ${fix}`
        : `${configKeyPath(key)} could not be resolved to a command line, so ${key} was written as a wrapper that fails with a message: ${fix} and put the command line in the wrapper`,
  };
}

/** Shell operators that end a command, so the token after one is a command name again. */
const COMMAND_SEPARATORS: ReadonlySet<string> = new Set([';', '&&', '||', '|', '&', '(', '{', '!']);

/** Interpreters that run their first non-flag argument as a script file. */
const SCRIPT_INTERPRETERS: ReadonlySet<string> = new Set(['bash', 'sh', 'zsh', 'dash', 'ksh']);

/** One shell word as a path: quotes and a `./` prefix name the same file, a trailing `;` does not. */
function pathToken(token: string): string {
  const bare = token.replace(/^['"]/, '').replace(/['"]$/, '').replace(/;+$/, '');
  return bare.startsWith('./') ? bare.slice(2) : bare;
}

/**
 * True when `body` **runs** the repo-relative `path` — as a bare command (`./deploy.sh`,
 * `scripts/deploy.sh`) or as an interpreter's script argument (`bash scripts/deploy.sh`, `sh -x
 * scripts/deploy.sh`) — and false when it merely mentions it, as an argument to something else.
 *
 * A substring test cannot tell the two apart, and gets the difference wrong in a supported
 * configuration: with `scriptsDir: "."` the wrapper's path is its bare file name, so
 * `bash scripts/typecheck.sh` — a *different* file — contains it. Only a token in command position
 * counts.
 */
function invokesScript(body: string, path: string): boolean {
  let position: 'command' | 'interpreterArg' | 'argument' = 'command';

  for (const raw of body.split(/\s+/)) {
    if (raw === '') continue;
    const token = pathToken(raw);

    if (COMMAND_SEPARATORS.has(token)) {
      position = 'command';
      continue;
    }
    if (position === 'argument') continue;
    if (position === 'interpreterArg' && token.startsWith('-')) continue;
    if (token === path) return true;
    position = position === 'command' && SCRIPT_INTERPRETERS.has(token) ? 'interpreterArg' : 'argument';
  }

  return false;
}

/**
 * Enqueue the wrapper scripts for the configured `scriptsDir`: `ensure-dir` on the directory,
 * then one `create-if-absent` write per wrapper {@link selectWrapper} selects — which is the rule,
 * stated once there and applied identically by the permission profile's own fallback.
 *
 * Two unselected cases are the ones this caller handles differently, each warning rather than staying
 * silent, and each in its own words:
 *
 * - **the placeholder** — the key stays visible in `commands.*`, where the config check and `doctor`
 *   both report it, and the command deliberately fails rather than running something that was never
 *   verified, so the warning says to fill the key in;
 * - **`commands.typecheck` answered `none`** — an answer rather than an omission, so its warning
 *   states what was decided and what follows from it, and must not prescribe filling the key in,
 *   which would be an instruction to undo the answer. That branch is unreachable for any other key:
 *   {@link selectWrapper} never sets `answeredNone` for one.
 *
 * `create-if-absent` is the re-run contract for this artifact: the raw command line in each wrapper
 * is the adopter's to correct, so a second `init` leaves an edited wrapper byte-identical — which
 * also means a wrapper-body improvement shipped by this package reaches an already-wired repository
 * only on an explicit `--force`. `--force` overwrites only after the write engine has taken a
 * `.bak`.
 */
export function writeWrapperScripts({
  repoRoot,
  config,
  rawCommands,
  plan,
}: WrapperScriptsOptions): WrapperScriptsResult {
  const scriptsDir = resolvedScriptsDir(config);
  const warnings: string[] = [];
  const written: WrittenWrapper[] = [];

  plan.add({ path: join(repoRoot, scriptsDir), policy: 'ensure-dir', label: 'wrapper scripts directory' });

  for (const script of WRAPPER_SCRIPTS) {
    const { key, file } = script;
    const { selected, placeholder, answeredNone, configured } = selectWrapper(config, key);

    if (placeholder) {
      warnings.push(
        `${configKeyPath(key)} still holds the placeholder init wrote, so no ${file} was written and none is allow-listed: set it in harness.config.json and re-run init`,
      );
      continue;
    }
    if (answeredNone) {
      // What this run did, not what is on disk. An adopter who answers an already-filled key keeps
      // the `${file}` an earlier run wrote — wrappers are `create-if-absent` and nothing here
      // deletes — and its allow entries until a profile is regenerated, so a warning phrased as a
      // state would assert the opposite of the record's stated residue.
      warnings.push(
        `${configKeyPath(key)} states this repository has no such command, so this run wrote no ${file} and allow-listed none. A ${file} an earlier run wrote is left where it is, and the permission entries naming it are removed only by init --force, which regenerates the profile`,
      );
      continue;
    }
    if (!selected) continue;

    const invocation = wrapperInvocation(scriptsDir, file);
    const { body, warning, unresolved } = resolveBody(script, configured, invocation, rawCommands);

    // The assertion the precedence above exists to make impossible, stated anyway: a wrapper
    // whose body runs the wrapper is an infinite recursion, and the failure mode of not catching
    // it here is a run that hangs rather than one that reports anything. It is asked only of a
    // body that runs something: the unresolved body runs nothing and quotes its own file name.
    if (!unresolved && invokesScript(body, posixJoin(scriptsDir, file))) {
      throw new HarnessError(
        `${configKeyPath(key)} resolved to a command line that runs ${file} itself (${body}), which would recurse forever: set it to the raw command line the wrapper should run`,
      );
    }

    if (warning !== undefined) warnings.push(warning);

    plan.add({
      path: join(repoRoot, scriptsDir, file),
      policy: 'create-if-absent',
      content: render(file, { command: body, name: key, prestart: prestartLine(file, body, rawCommands) }),
      label: `wrapper script ${file}`,
      mode: SCRIPT_MODE,
    });
    written.push({ key, file, invocation, command: body, unresolved: unresolved === true });
  }

  return { scriptsDir, written, warnings };
}

/** What a wrapper file's argument-forwarding line says the wrapper runs — {@link wrapperCommandLine}. */
export type WrapperBody =
  /** The raw command line, trimmed: the string this wrapper actually executes. */
  | { readonly kind: 'command'; readonly command: string }
  /** {@link unresolvedBody}'s wrapper — it runs no command at all and reports what to fix. */
  | { readonly kind: 'unresolved' }
  /** No line the rule recognises: an adopter's edit, reported rather than guessed at. */
  | { readonly kind: 'unrecognised' };

/** The argument forwarding every wrapper template appends to the command line it was given. */
const FORWARDED_ARGUMENTS = '"$@"';

/** The first token of {@link unresolvedBody}, and the whole of what identifies that body. */
const UNRESOLVED_HEAD = 'harness_fail';

/**
 * The raw command line a wrapper runs, read back out of the file this module wrote.
 *
 * The rule keys on the templates' argument-forwarding convention — stated in `typecheck.sh`,
 * `test.sh` and `deploy.sh`'s own comment (*"They attach to the *last* command of the line below, so
 * keep that line one command rather than a compound"*) and followed by `start-dev-server.sh` — as the
 * **last** line with no leading whitespace that does not start with `#` and carries
 * {@link FORWARDED_ARGUMENTS}, truncated there and trimmed. Each exclusion buys one thing:
 *
 * - `#` drops the comment lines that quote `"$@"` while explaining the convention: every `"$@"` in the
 *   four wrapper templates other than the forwarding line is inside a comment;
 * - **last** rather than first keeps a preamble an adopter added above the command line from being
 *   read as the command;
 * - the indentation test is **defensive rather than template-driven**: no wrapper template renders an
 *   indented forwarding line, so it buys nothing today and exists so that an adopter-edited wrapper
 *   that forwards from inside a conditional or a function is reported `unrecognised` rather than
 *   mis-read.
 *
 * {@link unresolvedBody} is substituted into `{{command}}` like any other body, so that wrapper's
 * rendered line *is* a line this rule matches. It is classified by its first token rather than
 * excluded, because the distinction the caller needs is that it runs no command.
 *
 * **It lives beside the render it inverts**, for the reason `daemon/units.ts` gives for keeping
 * `unitEnvValue` beside `environmentStanza`: a change to the templates and a change to this parse are
 * then one edit in one file, and the round trip — the property this parse claims and cannot show on
 * its own — has both sides in one module.
 *
 * The wrapper is the **adopter's** file from `init` on ({@link writeWrapperScripts}: *"the raw command
 * line in each wrapper is the adopter's to correct"*), which is why an unreadable body is a reported
 * state rather than a fallback. Its one caller is `doctor`'s `daemon-path` check, which must treat
 * neither `unresolved` nor `unrecognised` as a binary the run needs.
 */
export function wrapperCommandLine(text: string): WrapperBody {
  // Reversed rather than indexed backwards, because `for…of` over the copy yields a `string` where
  // an index into it yields `string | undefined` under `noUncheckedIndexedAccess`.
  for (const line of text.split('\n').reverse()) {
    if (/^\s/.test(line) || line.startsWith('#')) continue;
    const forwarded = line.indexOf(FORWARDED_ARGUMENTS);
    if (forwarded === -1) continue;
    const command = line.slice(0, forwarded).trim();
    return command.split(/\s+/)[0] === UNRESOLVED_HEAD ? { kind: 'unresolved' } : { kind: 'command', command };
  }
  return { kind: 'unrecognised' };
}

/**
 * The wrapper file `key`'s configured value invokes, or `undefined` when that value is not this
 * wrapper's invocation — unset, empty, still the placeholder, or a raw command line alike.
 *
 * The path is **composed** from {@link WRAPPER_SCRIPTS} and {@link wrapperInvocation} and the
 * configured value compared to it byte-for-byte, never parsed back into a path: that is
 * {@link invokedPath}'s standing prohibition, and on a key holding a command line this predicate is
 * the exact complement of {@link wrappedKeyMismatch} — one answers *"the value is the wrapper"*, the
 * other *"the value is a raw line"*, off the same comparison, so the two cannot come to disagree about
 * what the wrapper form is.
 *
 * `path` is repo-relative and forward-slashed like every path in the config; joining it to a
 * repository root is the caller's. Its one caller is `doctor`'s `daemon-path` check, which reads the
 * file it names through {@link wrapperCommandLine}.
 */
export function configuredWrapperFile(
  config: HarnessConfig,
  key: WrapperKey,
): { readonly file: WrapperFile; readonly path: string } | undefined {
  // Read from the table rather than from a second `.sh` literal. A `WrapperKey` is that table's own
  // union, so the lookup cannot miss; `undefined` there is the same answer this function gives for
  // "the value is not this wrapper's invocation", which keeps a predicate from carrying an error path.
  const script = WRAPPER_SCRIPTS.find((entry) => entry.key === key);
  if (script === undefined) return undefined;

  const scriptsDir = resolvedScriptsDir(config);
  return configuredCommand(config, key) === wrapperInvocation(scriptsDir, script.file)
    ? { file: script.file, path: wrapperPath(scriptsDir, script.file) }
    : undefined;
}

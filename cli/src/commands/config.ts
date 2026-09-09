/**
 * Command: `config` — read and update `harness.config.json`.
 *
 * **The rule this module exists to enforce: this command is exactly as wide as the one line the
 * shipped documentation promises for it — read and update — and no wider.** It addresses one value
 * at a time by a dotted key path, prints it or replaces it, and hands every judgement about whether
 * the result is a legal config to `config/check.ts`. It is **not** a validator: the gate that checks
 * a file against `schemas/harness.config.schema.json` is `npm run validate:config`, whose validator
 * is a workspace development dependency this package does not ship and this command does not read.
 * The structural check that does run here runs on the **result of the edit**, and exists for exactly
 * one reason — to stop this command corrupting the file it was asked to change. It also runs on the
 * **input**: `get` and `set` refuse a `harness.config.json` that already carries an `error` problem,
 * before a value is read or a mutator applied. `list` does not — see below.
 *
 * ## Three non-obvious choices, and where each comes from
 *
 * 1. **There is no key table in this file.** A typo (`commands.tset`), an unknown section and a
 *    value whose type contradicts the one its key holds are all refused by the same mechanism: the
 *    edit is applied to a private copy and `config/check.ts` is run over the whole result, which
 *    already reports an unknown key at *every* level and the declared type of every declared key. A
 *    second table here would be a third copy of the key set — after the declared contract and
 *    `config/model.ts` — and the day it drifted, this command would refuse a legal key or write an
 *    illegal one.
 * 2. **`set` applies its write plan with `force: true`, always, and never with `--force`.**
 *    `config/io.ts` enqueues the update as `create-if-absent`, which is the write engine's only
 *    content-replacing policy; applied without force, the engine would record `kept` and the edit
 *    would silently not land. Forcing is therefore not an escalation here, it is the ordinary path —
 *    and it carries a safety property worth having for the one command whose job is to change a file
 *    the adopter owns: the engine copies the previous file to a `.bak` sibling before replacing it,
 *    so the values that were there stay one file away. The global `--force` flag is not consulted:
 *    there is nothing about this command for it to escalate.
 * 3. **A value is read as JSON first and as a plain string second.** `set phases.qa true` has to set
 *    the boolean rather than the four-letter word, and `set commands.test "bash scripts/test.sh"`
 *    has to set the string rather than fail to parse. Trying JSON and falling back gives both
 *    without a type flag, and a caller who wants the *string* `3` writes it as `'"3"'`.
 *
 * ## What this command deliberately does not do
 *
 * - **It does not fill in defaults.** `list` prints the file as it stands, because `get` reports an
 *   unset key as absent and exits non-zero; a `list` that merged declared defaults in would answer a
 *   question `get` answers differently, and the two views would disagree about the same file.
 * - **It does not refuse to `list` a broken config.** `list` is the one verb that prints a file
 *   carrying shape errors, reporting each as a warning on stderr, so the configuration most in need
 *   of repair is the one an adopter can still read. `get` and `set` refuse it: both act on a single
 *   value, and a value read out of a file whose shape is wrong is not one to act on.
 * - **It does not address a list element by element.** `layers` and `protectedBranches` are set and
 *   printed whole. Order matters in both, and a flat string path is a poor way to express an
 *   insertion, a removal or a reorder.
 * - **It does not remove a key.** A value can be replaced; deleting an optional key is a hand edit,
 *   which keeps the number of ways this command can shrink an adopter's config at zero.
 * - **It writes nothing but `harness.config.json`** (plus that file's `.bak` sibling, written by the
 *   engine), and it runs no external command. It does *read* one other file: a `set` of a branch-guard
 *   key opens the generated pre-push hook to grade its `case` label against the set the result
 *   resolves, because the alternative is asserting that state unread ({@link guardState}).
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { formatProblem } from '../config/check.js';
import { readParsedConfig, requireConfig, updateConfig } from '../config/io.js';
import {
  COMMAND_NONE_SENTINEL,
  CONFIG_FILENAME,
  DEFAULTS,
  NONE_SENTINEL_KEY,
  type HarnessConfig,
} from '../config/model.js';
import { EXIT, HarnessError } from '../core/errors.js';
import { resolveRepoRoot } from '../core/git.js';
import { formatJson, isJsonObject, type JsonObject, type JsonValue } from '../core/json.js';
import { WritePlan } from '../core/writer.js';
import {
  caseLabelMatches,
  PRE_PUSH_HOOK,
  readProtectedCaseLabel,
  resolveGithooksDir,
  resolveProtectedBranches,
} from '../generators/githooks.js';
import {
  configKeyPath,
  wrappedKeyMismatch,
  wrappedKeyMismatchMessage,
  WRAPPER_SCRIPTS,
  type WrapperKey,
} from '../generators/scripts.js';
import type { CommandContext, Subcommand } from './registry.js';

/**
 * The command's one-line summary, in the usage block and at the head of its own `--help`.
 *
 * It is the string the registry has carried since the skeleton, and `cli/README.md` repeats it. This
 * command implements that promise; it does not restate it more widely.
 */
const SUMMARY = 'Read and update harness.config.json';

/** The roadmap item this command belongs to, as the registry reports it. */
const ROADMAP_ITEM = 13;

/** How the CLI is typed, for the messages that tell an operator what to run next. The `npx` prefix is not decoration: the rule for which occurrences carry it is stated once in `commands/init.ts`, beside its own `CLI`. */
const CLI = 'npx autonomous-sdlc-harness';

/** The three verbs, in the order `--help` lists them. */
const VERBS = ['list', 'get', 'set'] as const;

/** One of {@link VERBS}. */
type ConfigVerb = (typeof VERBS)[number];

/** What each verb takes after itself, named as `--help` names it. The arity check reads this. */
const OPERANDS: Readonly<Record<ConfigVerb, readonly string[]>> = {
  list: [],
  get: ['<key>'],
  set: ['<key>', '<value>'],
};

/**
 * How the command is invoked, written once: the registry's generic `config [options]` synopsis line
 * cannot show a required verb, and a refusal quotes the same form back at whoever typed it wrong.
 */
const INVOCATION_FORM = `${CLI} config list | get <key> | set <key> <value>`;

/** The lines the registry renders under this command's synopsis. */
const CONFIG_USAGE: readonly string[] = Object.freeze([
  `The verb is required: ${INVOCATION_FORM}`,
  '',
  'Verbs:',
  `  list               Print ${CONFIG_FILENAME} as it stands, formatted, problems and all`,
  '  get <key>          Print one value, addressed by a dotted key path',
  '  set <key> <value>  Replace one value and write the file back',
  '',
  '<key> is a dotted path into the file: defaultBranch, commands.test, phases.qa, qa.portSeed,',
  'layers. A list is addressed as a whole — get layers prints it and set layers <json> replaces',
  'it — never element by element.',
  '',
  '<value> is read as JSON when it parses as JSON, and as a plain string when it does not:',
  '  set phases.qa true                       the boolean true',
  '  set qa.portSeed 3001                     the number 3001',
  '  set commands.test "bash scripts/test.sh" that string',
  `  ${`set commands.${NONE_SENTINEL_KEY} "${COMMAND_NONE_SENTINEL}"`.padEnd(40)} the answer that this repository has no type check`,
  '  set projectName \'"3"\'                    the string 3 rather than the number',
  '',
  'A <value> that would be read as one of the global options above is separated with --, which',
  'stops flag parsing: set commands.build -- --version.',
  '',
  'get prints a string raw and anything else as JSON, so a shell can consume it directly, and it',
  'exits non-zero when the key is not set. An optional key with no value is absent from the file',
  'rather than written as null, and no declared default is filled in for it.',
  '',
  'set refuses and writes nothing when the key is not one the file may carry — a typo is an error,',
  'not a new setting — when the value contradicts the type that key holds, or when the result would',
  'fail the structural check; every problem found is reported, not only the first. A dot-named',
  'stateDir is refused there, because the run-artifact tree has to be writable by an unattended run.',
  '',
  'set accepts a raw command line at commands.typecheck, commands.test, commands.devServer or',
  'deploy.command and reports it, because the next init writes the wrapper script from that line and',
  'the value the permission profile allow-lists is bash <scriptsDir>/<name>.sh.',
  '',
  `set commands.${NONE_SENTINEL_KEY} "${COMMAND_NONE_SENTINEL}" is the answer that this repository has no type check: exactly`,
  'that, unquoted and lower-case. It is an answer rather than an unfilled key, so it is accepted',
  `without a warning, no ${NONE_SENTINEL_KEY}.sh is written for it and no permission entry is implied. It is`,
  'recognised on that one key — written into any other commands.* key it is stored and run as a',
  'command line, and set says so — and a near miss such as none or <None> is a command line too,',
  'reported by name.',
  '',
  'set defaultBranch or protectedBranches reports what the edit leaves behind: the guards resolve the',
  'two keys into one protected set, so setting one alone leaves the other in it, and the committed',
  '<githooksDir>/pre-push hook keeps the branch set it was rendered with until init re-renders it.',
  '',
  `get and set refuse a ${CONFIG_FILENAME} that already fails the structural check, before the key is`,
  'read or the edit applied; every problem in it is named. list does not — it prints what parsed and',
  'reports the problems as warnings, so a config with a typo can still be read here and repaired by',
  'hand. Nothing that did not parse is printed: an absent or unparsable file is refused by all three.',
  '',
  `set writes a ${CONFIG_FILENAME}.bak sibling before replacing the file, every time, so the previous`,
  'values stay one file away. Key order and formatting are preserved, so the diff is the changed',
  'value and nothing else.',
  '',
  '--dry-run prints the before and after values and writes nothing. Every refusal still applies',
  'under it, so a dry run cannot report a success a real run would not have.',
  '',
  'This command reads and updates the file; it does not validate it against the contract published',
  'for editors and CI. `npm run validate:config` at the workspace root is that gate.',
]);

/** A parsed invocation. A union, so the operands a verb needs are present by construction. */
type ConfigInvocation =
  | { readonly verb: 'list' }
  | { readonly verb: 'get'; readonly key: string }
  | { readonly verb: 'set'; readonly key: string; readonly value: string };

/** `list, get or set` — the verb list as a sentence, for a refusal. */
function verbList(): string {
  return `${VERBS.slice(0, -1).join(', ')} or ${VERBS[VERBS.length - 1] as string}`;
}

/** The usage a bad invocation is refused with: the form, and where the rest of it is. */
function usageHint(): string {
  return `usage: \`${INVOCATION_FORM}\` — run \`${CLI} config --help\` for the full usage`;
}

/**
 * Parse the verb and its operands, positionally.
 *
 * The operands are taken by position rather than by pattern, so a value that begins with `-` is
 * still a value: `set commands.build "-x"` is a legal thing to want, and a parser that treated it as
 * a flag would refuse it. The one exception is a value spelled exactly like one of the six global
 * options, which the entry point consumes before this command is reached; `--` stops that parsing,
 * which is why the usage names it. A token in the *verb* or *key* position that begins with `-` is
 * refused, since neither can legally start that way and a mistyped flag is the likely cause.
 *
 * A missing verb, an unknown verb and a wrong operand count are refusals rather than defaults: `set`
 * changes a file the adopter owns, and there is no verb harmless enough to be the default.
 */
function parseInvocation(argv: readonly string[]): ConfigInvocation {
  const [verbToken, ...rest] = argv;

  if (verbToken === undefined) {
    throw new HarnessError(`config: no verb given — expected ${verbList()}; ${usageHint()}`);
  }
  if (verbToken.startsWith('-')) {
    throw new HarnessError(`config: unknown option ${JSON.stringify(verbToken)} — ${usageHint()}`);
  }
  if (!(VERBS as readonly string[]).includes(verbToken)) {
    throw new HarnessError(`config: unknown verb ${JSON.stringify(verbToken)} — expected ${verbList()}; ${usageHint()}`);
  }

  const verb = verbToken as ConfigVerb;
  const expected = OPERANDS[verb];
  if (rest.length < expected.length) {
    throw new HarnessError(`config ${verb}: expected \`config ${verb} ${expected.join(' ')}\` — ${usageHint()}`);
  }
  if (rest.length > expected.length) {
    const takes = expected.length === 0 ? 'takes no arguments' : `takes exactly ${expected.join(' ')}`;
    throw new HarnessError(
      `config ${verb}: unexpected argument ${JSON.stringify(rest[expected.length])} — config ${verb} ${takes}; ${usageHint()}`,
    );
  }

  if (verb === 'list') return { verb };

  // Present by the arity check above.
  const key = rest[0] as string;
  if (key.startsWith('-')) {
    throw new HarnessError(`config ${verb}: unknown option ${JSON.stringify(key)} — ${usageHint()}`);
  }
  return verb === 'get' ? { verb, key } : { verb, key, value: rest[1] as string };
}

/** A key path split into its segments, refusing anything that cannot address a key. */
function parseKeyPath(key: string): readonly string[] {
  if (key === '') throw new HarnessError(`config: the key is empty — ${usageHint()}`);
  const segments = key.split('.');
  if (segments.some((segment) => segment === '')) {
    throw new HarnessError(`config: ${JSON.stringify(key)} is not a key path: one of its segments is empty`);
  }
  return segments;
}

/** What a value is, for a message: `a list`, `a string`, `null`. */
function describe(value: JsonValue): string {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'a list';
  return `a ${typeof value}`;
}

/**
 * The refusal for a key path that tries to descend through something with no keys beneath it.
 *
 * The list case gets its own sentence because it has a different answer: the value is reachable, it
 * is simply addressed whole.
 */
function notAContainer(key: string, walked: string, value: JsonValue): HarnessError {
  if (Array.isArray(value)) {
    return new HarnessError(
      `config: ${key} reaches into ${walked}, which is a list — a list is addressed as a whole: \`${CLI} config get ${walked}\` prints it, and \`${CLI} config set ${walked} '<json>'\` replaces it`,
    );
  }
  return new HarnessError(`config: ${key} reaches into ${walked}, which holds ${describe(value)}, so it has no keys beneath it`);
}

/** The value at a key path, or `undefined` when nothing is set there. */
function readValue(config: JsonObject, key: string, segments: readonly string[]): JsonValue | undefined {
  let current: JsonValue = config;
  let walked = '';

  for (const segment of segments) {
    if (!isJsonObject(current)) throw notAContainer(key, walked, current);
    if (!Object.hasOwn(current, segment)) return undefined;
    current = current[segment] as JsonValue;
    walked = walked === '' ? segment : `${walked}.${segment}`;
  }
  return current;
}

/** What an assignment replaced, so the command can report the before value it overwrote. */
interface Assignment {
  readonly existed: boolean;
  /** The value that was there, when {@link existed}. */
  readonly previous: JsonValue | undefined;
}

/**
 * Set the value at a key path on a config object, in place, and report what was there.
 *
 * A **missing** intermediate section is created rather than refused, because that is the ordinary
 * case: `set qa.credentialsPath …` on a config with no `qa` section has to work. Creating it is safe
 * precisely because nothing here decides whether the section is a legal one — a mistyped section
 * name is created too, and is then reported by the structural check over the result, which names it
 * as an unknown key and refuses the write.
 */
function assignValue(config: JsonObject, key: string, segments: readonly string[], value: JsonValue): Assignment {
  const last = segments[segments.length - 1] as string;
  let current: JsonObject = config;
  let walked = '';

  for (const segment of segments.slice(0, -1)) {
    walked = walked === '' ? segment : `${walked}.${segment}`;
    const existing = Object.hasOwn(current, segment) ? (current[segment] as JsonValue) : undefined;
    if (existing === undefined) {
      const created: JsonObject = {};
      current[segment] = created;
      current = created;
      continue;
    }
    if (!isJsonObject(existing)) throw notAContainer(key, walked, existing);
    current = existing;
  }

  const existed = Object.hasOwn(current, last);
  const previous = existed ? (current[last] as JsonValue) : undefined;
  current[last] = value;
  return { existed, previous };
}

/**
 * A `<value>` operand as the JSON it parses as, or as itself when it does not parse.
 *
 * Falling back rather than refusing is what makes the common case typeable: almost every command
 * line, branch name and path an adopter sets here is not valid JSON, and requiring them to be
 * quoted twice would make the string case the awkward one.
 */
function parseValue(raw: string): JsonValue {
  try {
    return JSON.parse(raw) as JsonValue;
  } catch {
    return raw;
  }
}

/**
 * One value as a line of output: a string raw, anything else as the same JSON the file is written
 * in, minus the trailing newline the reporter adds itself.
 *
 * Raw for a string so `commands.test` can be substituted straight into a shell; JSON for everything
 * else so a list or an object round-trips back through `set`.
 */
function render(value: JsonValue): string {
  return typeof value === 'string' ? value : formatJson(value).trimEnd();
}

/**
 * `config list`: the file as it stands, in the CLI's single JSON format.
 *
 * It prints a config **carrying shape errors**, reporting each as a warning, where `get` and `set`
 * refuse one. That is what "as it stands" has to mean: an unknown-key typo or an out-of-range value
 * is exactly the state an adopter needs to see printed to repair it, and a `list` that refused it
 * would leave them with no way to read the file through this command at all. Nothing that did not
 * parse is printed — absent, unparsable or not a JSON object is still a refusal.
 */
function list(ctx: CommandContext): number {
  const repoRoot = resolveRepoRoot(ctx.cwd);
  const loaded = readParsedConfig(repoRoot);
  ctx.report.result(render(loaded.config as unknown as JsonValue));
  // After the result, and on stderr, so the printed file stays a parsable document on stdout.
  for (const problem of loaded.problems) ctx.report.warn(formatProblem(problem));
  return EXIT.OK;
}

/** `config get <key>`: one value, or a non-zero refusal naming the key that is not set. */
function get(ctx: CommandContext, key: string): number {
  const repoRoot = resolveRepoRoot(ctx.cwd);
  const config = requireConfig(repoRoot) as unknown as JsonObject;
  const value = readValue(config, key, parseKeyPath(key));

  if (value === undefined) {
    throw new HarnessError(
      `config get: ${key} is not set in ${CONFIG_FILENAME} — run \`${CLI} config list\` for every key the file carries. An optional key with no value is absent from the file rather than written as null, and no declared default is filled in for it`,
    );
  }

  ctx.report.result(render(value));
  return EXIT.OK;
}

/**
 * The wrapper keys a dotted `<key>` can have changed: the one it names, or **every** wrapper key
 * beneath it when the value set was the enclosing object. `set commands '<json>'` writes the same
 * values a per-key `set` would, so the boundary report has to see it too (`docs/cli.md` §5).
 *
 * Matched against {@link configKeyPath} over {@link WRAPPER_SCRIPTS} rather than against four path
 * literals here: `deploy`'s command lives at `deploy.command` rather than under `commands`, and a
 * second copy of that mapping is the key table choice 1 of the module header refuses to keep.
 */
function wrapperKeysFor(key: string): readonly WrapperKey[] {
  return WRAPPER_SCRIPTS.filter((entry) => {
    const path = configKeyPath(entry.key);
    return path === key || path.startsWith(`${key}.`);
  }).map((entry) => entry.key);
}

/**
 * The two keys the branch guards read **together**: the protected set every guard enforces is
 * `protectedBranches` unioned with `defaultBranch` (`generators/githooks.ts` →
 * `resolveProtectedBranches`), so an edit to either one moves the set and neither moves it alone.
 *
 * Typed as key names of {@link HarnessConfig} rather than written as path literals, so a release
 * that renames either key stops compiling here instead of leaving a report addressing a key the
 * file no longer carries — the second key table choice 1 of the module header refuses to keep.
 */
const BRANCH_GUARD_KEYS: readonly (keyof HarnessConfig)[] = ['defaultBranch', 'protectedBranches'];

/**
 * The branch-guard keys a dotted `<key>` can have changed, on {@link wrapperKeysFor}'s shape: the
 * one it names, or **every** guard key beneath it when the value set was an enclosing object.
 *
 * Both keys sit at the top level today, so `set protectedBranches '<json>'` — the whole list at
 * once — is reached by the **equality** arm, and the prefix arm has no subject in this release. It
 * is carried rather than dropped because it is what makes the helper survive either key moving
 * under a section, which is the one shape {@link wrapperKeysFor} already has and this one does not:
 * there, `test`'s command line is nested at `commands.test`, and the prefix arm is what
 * `set commands '<json>'` is matched by. A `<key>` addressing the document itself is refused by
 * {@link parseKeyPath} as an empty key path.
 */
function branchGuardKeysFor(key: string): readonly (keyof HarnessConfig)[] {
  return BRANCH_GUARD_KEYS.filter((path) => path === key || path.startsWith(`${key}.`));
}

/**
 * Where the guard git runs lives, resolved through the generator that writes it.
 *
 * Caught rather than propagated: a `githooksDir` naming the repository root is refused by `init` and
 * graded by `doctor` (`generators/githooks.ts` → `resolveGithooksDir`), and a `set` that has already
 * written the file it was asked to change may not turn into that refusal on a key that has nothing to
 * do with it. Where the directory does not resolve, the hook is named by its filename alone.
 */
function guardHookPath(config: HarnessConfig): string {
  try {
    return `${resolveGithooksDir(config)}/${PRE_PUSH_HOOK}`;
  } catch {
    return PRE_PUSH_HOOK;
  }
}

/**
 * What the guard on disk enforces, against the set the config now resolves.
 *
 * The label is **read** through the generator's own reader rather than asserted, which is the
 * discipline `doctor`'s `pre-push-guard` check and `writeGitHooks`' re-render arm already apply to
 * the same file: a `set` that told an adopter to run `init --force` over a guard that was already
 * right would spend the write engine's one `.bak` generation for nothing, on every generated
 * `create-if-absent` artifact in the repository.
 *
 * Both catches answer with a state rather than propagating, for {@link guardHookPath}'s reason — a
 * `set` that has already written the file it was asked to change may not turn into a refusal. An
 * unresolvable set is answered `'behind'`: it is the sentence this report carried before anything
 * was read, and a value no hook can be rendered from is not one the hook on disk carries.
 */
function guardState(
  repoRoot: string,
  config: HarnessConfig,
  hookPath: string,
): 'behind' | 'in-step' | 'absent' | 'unreadable' {
  let hookText: string;
  try {
    hookText = readFileSync(join(repoRoot, hookPath), 'utf8');
  } catch {
    return 'absent';
  }

  const label = readProtectedCaseLabel(hookText);
  if (label === undefined) return 'unreadable';

  try {
    return caseLabelMatches(label, resolveProtectedBranches(config, () => {})) ? 'in-step' : 'behind';
  } catch {
    return 'behind';
  }
}

/** Branch patterns as a sentence: `"main", "release/*"` — a list rendered inline rather than as the multi-line JSON {@link render} produces for one. */
function patternList(patterns: readonly string[]): string {
  return patterns.map((pattern) => JSON.stringify(pattern)).join(', ');
}

/**
 * What the sibling key holds while `defaultBranch` is being set, in the three states it can be in:
 * unset, and therefore standing at the schema default the guards are rendered from; listing nothing,
 * which resolves to the default branch and nothing else; or listing the names it lists.
 */
function siblingKeyState(listed: readonly string[] | undefined): string {
  if (listed === undefined) {
    return `protectedBranches is not set here, so it stands at its schema default (${patternList(DEFAULTS.protectedBranches)})`;
  }
  if (listed.length === 0) return 'protectedBranches lists no branch, so the set is defaultBranch and nothing else';
  return `protectedBranches still lists ${patternList(listed)}`;
}

/**
 * What an edit to one half of the guard pair leaves behind, in one line.
 *
 * The sibling half is written only for `defaultBranch`, because that is the direction with a value
 * to name: the key the adopter did **not** set still lists what it listed, and it is reported rather
 * than offered as a change — narrowing a protected set is the one direction that fails unsafely, and
 * this command does not remove a key at all (module header). The hook half is written for both, from
 * `writeGitHooks`' own note, so the two re-render routes are named here in the words that note and
 * `doctor`'s `pre-push-guard` check name them in — but only in the one state that is owed them:
 * {@link guardState} grades the file first, so a hook already carrying this set, a hook that is not
 * there and a hook nothing can read out of are each reported as themselves.
 */
function branchGuardMessage(
  repoRoot: string,
  config: HarnessConfig,
  matched: readonly (keyof HarnessConfig)[],
): string {
  const hookPath = guardHookPath(config);
  const sibling = !matched.includes('defaultBranch')
    ? ''
    : ` ${siblingKeyState(config.protectedBranches)}, and \`${CLI} config set protectedBranches '<json>'\` is what changes it: nothing removes an entry automatically and nothing will, because narrowing a protected set is the one direction that fails unsafely, so the edit is yours.`;
  const state = guardState(repoRoot, config, hookPath);
  const hook =
    state === 'behind'
      ? ` The committed ${hookPath} hook carries the branch set it was rendered with rather than the set the configuration resolves, and a push is judged by that file: re-render it with \`${CLI} init --force\`, which copies ${hookPath} to ${hookPath}.bak and re-renders it from the config in effect; without --force, delete ${hookPath} and re-run \`${CLI} init\`, which re-renders the hook because it is create-if-absent`
      : state === 'in-step'
        ? ` The committed ${hookPath} hook already carries the set this configuration resolves, so nothing is owed to it by this edit.`
        : state === 'absent'
          ? ` There is no readable ${hookPath}, so nothing in this checkout judges a push against this set: re-run \`${CLI} init\`, which writes the hook because it is create-if-absent.`
          : ` ${hookPath} carries no case label in the generated shape, so what it protects cannot be read out of it and cannot be compared with this set — \`${CLI} doctor\`'s pre-push-guard check reports that state on every run.`;
  return (
    `the protected set every guard resolves is protectedBranches unioned with defaultBranch, so setting one of those two keys alone leaves the other in the set.${sibling}` +
    hook
  );
}

/**
 * `config set <key> <value>`: replace one value, guarded, and write the file back.
 *
 * The edit goes through `config/io.ts`'s update path, which re-reads the file, applies the mutator
 * to a private copy, re-runs the structural check and refuses on any `error` — so a refusal here
 * leaves the file exactly as it was, whichever of the guards produced it. Key order and formatting
 * survive because the mutated object *is* the parsed file, written back through the one serializer.
 *
 * **The boundary.** This is the command an adopter fills a wrapped `commands.*` key in with, and the
 * last point at which the raw command line they typed and the wrapper invocation the permission
 * profile allow-lists are still distinguishable — by the time an agent is refused on the raw line,
 * neither `init` nor `doctor` can tell which of the two the adopter meant. So the value is reported
 * here, through {@link wrappedKeyMismatch}, whose sentence and condition this command shares with
 * those two rather than restating.
 *
 * It is a **warning, not a refusal**, and the value is stored exactly as typed: the schema accepts it,
 * the wrapper the next `init` writes runs it, and the documented repair for an undetected command is
 * a two-step that passes through this state (set the raw line, re-run `init`, set the wrapper form).
 * Normalising the value here — writing the invocation and putting the raw line in the wrapper —
 * would make `get` answer something other than what was `set`, and would break the module header's
 * *"It writes nothing but `harness.config.json`"*.
 */
function set(ctx: CommandContext, key: string, raw: string): number {
  const repoRoot = resolveRepoRoot(ctx.cwd);
  const segments = parseKeyPath(key);
  const value = parseValue(raw);

  const plan = new WritePlan();
  let assignment: Assignment | undefined;
  const updated = updateConfig(
    repoRoot,
    (config) => {
      assignment = assignValue(config as unknown as JsonObject, key, segments, value);
    },
    plan,
  );
  if (assignment === undefined) {
    throw new HarnessError('config set: the update was enqueued without the edit having been applied', EXIT.INTERNAL);
  }

  ctx.report.step(ctx.flags.dryRun ? `config set ${key} (dry run — nothing is written)` : `config set ${key}`);
  ctx.report.result(assignment.existed ? `${key} was ${render(assignment.previous as JsonValue)}` : `${key} was not set`);

  // Nothing to write is reported rather than performed: replacing a file with its own bytes would
  // still make a .bak sibling and still log a replacement, which reads as a change that was not one.
  const unchanged = assignment.existed && formatJson(assignment.previous as JsonValue) === formatJson(value);
  if (unchanged) {
    ctx.report.result(`${key} already holds that value, so ${CONFIG_FILENAME} was not rewritten`);
  } else {
    ctx.report.result(ctx.flags.dryRun ? `${key} would become ${render(value)}` : `${key} is now ${render(value)}`);
    // `force: true` unconditionally, and never `ctx.flags.force` — see choice 2 in the module header:
    // the update is enqueued as create-if-absent, so an unforced apply would keep the file and the
    // edit would silently not land. The engine writes the `.bak` sibling before replacing.
    plan.apply({ repoRoot, report: ctx.report, dryRun: ctx.flags.dryRun, force: true });
  }

  // Asked of `updated.config` — the value that is landing, not the one that was there — and outside
  // the arms above, so all three reach it: a `--dry-run` that withheld the line would report a
  // success a real run would not have, and a `set` that changed nothing still leaves a repository
  // carrying the defect.
  for (const wrapperKey of wrapperKeysFor(key)) {
    const mismatch = wrappedKeyMismatch(updated.config, wrapperKey);
    if (mismatch !== undefined) ctx.report.warn(wrappedKeyMismatchMessage(wrapperKey, mismatch));
  }

  // Beside the wrapper report, asked of the same object and outside the same arms, for the same
  // reason: an edit to one half of the guard pair leaves the sibling key behind on every path, and a
  // preview that withheld the line would report a success a real run would not have. What it says
  // about the hook is graded against the file rather than assumed — including on a --dry-run, where
  // the hook on disk is the one a real run would have left behind. One warning, whichever half was
  // matched.
  const branchGuardKeys = branchGuardKeysFor(key);
  if (branchGuardKeys.length > 0) ctx.report.warn(branchGuardMessage(repoRoot, updated.config, branchGuardKeys));

  // Warnings only — an error would have been refused above. Reported because a `set` is often the
  // fix for one of them, and the ones still outstanding are worth naming while the adopter is here.
  for (const problem of updated.problems) ctx.report.warn(formatProblem(problem));

  return EXIT.OK;
}

/** Parse the verb and hand off. Every verb returns its own exit code and throws to refuse. */
async function run(ctx: CommandContext): Promise<number> {
  const invocation = parseInvocation(ctx.argv);
  if (invocation.verb === 'list') return list(ctx);
  if (invocation.verb === 'get') return get(ctx, invocation.key);
  return set(ctx, invocation.key, invocation.value);
}

/**
 * The registry row for this command.
 *
 * Exported as the row itself rather than as a `run` the table wraps, so the summary, the usage lines
 * and the behaviour stay in the file that owns them. The import back to `commands/registry.ts` is
 * type-only and therefore erased, so the table can list this row without a runtime cycle.
 */
export const CONFIG_COMMAND: Subcommand = {
  name: 'config',
  summary: SUMMARY,
  roadmapItem: ROADMAP_ITEM,
  usage: CONFIG_USAGE,
  run,
};

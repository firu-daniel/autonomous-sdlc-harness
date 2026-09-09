/**
 * The structural check on a `harness.config.json` value: a write guard, and `doctor`'s runtime
 * re-check.
 *
 * **This is not a schema validator, and it must never grow into one.** The schema gate is
 * `npm run validate:config`, whose validator is a workspace-root development dependency; this
 * package declares no runtime dependencies and ships no JSON-Schema engine. What is here is a
 * hand-written check of exactly the constraints listed below, for the two moments that gate is not
 * present: before the CLI writes a config, and when `doctor` re-reads one that may have been
 * hand-edited since it was last validated (`docs/config.md` §3 — "a config can be edited by hand
 * after validation").
 *
 * **Update this file in the same change as any edit to `schemas/harness.config.schema.json`.** The
 * key sets below mirror the schema's `properties` and `required`, so a key added there and not here
 * is reported as unknown — a false error — and a key removed there and not here passes silently.
 *
 * ## What it checks
 *
 * The value is an object; every `required` key is present; `version` is the const `1`; no unknown
 * key at any level (mirroring `additionalProperties: false`, which is set at *every* level, so an
 * unknown key is a typo rather than a setting that is silently ignored); every declared key has the
 * declared type; every string key is non-empty (the schema's `minLength: 1`); `forge`, `agentEffort`,
 * `qa.driver`, `design.source`, `detection.preset` and `detection.review.verdict` each hold one of
 * the values their schema `enum` lists; `stateDir`
 * satisfies **both** of its clauses; `layers` is non-empty, each entry is complete with a legal
 * `name`, and at least one entry is the catch-all row the schema's `contains` clause requires;
 * `commands.typecheck` and `commands.test` are present and non-empty, with `<none>` graded on
 * `commands.typecheck` as the answer *this repository has no type check* and warned about anywhere
 * else it is written; `qa.portSeed` is an integer
 * within the schema's bounds — the only numeric constraint the schema states anywhere.
 *
 * ## What it deliberately does not re-implement
 *
 * - **`uniqueItems`** on `protectedBranches` and `parity.toolchainCommands`. A duplicate entry is
 *   redundant, not harmful, and the schema gate already reports it.
 * - **`$schema`'s URI form.** It is editor metadata resolved against the file's own location; the
 *   CLI never dereferences it.
 * - **Anything about the filesystem** — whether a configured directory exists, is writable, or
 *   whether a `conventions` document is really there. That is `doctor`'s job, not a shape check's,
 *   and a shape check that touched the disk could not be run against a config held in memory.
 */

import {
  AGENT_EFFORT_LEVELS,
  COMMAND_NONE_SENTINEL,
  CONFIG_VERSION,
  DESIGN_SOURCES,
  DETECTION_PRESET_NAMES,
  FORGE_KINDS,
  isNoneSentinel,
  isPlaceholder,
  LAYER_CATCH_ALL_PATH,
  LAYER_NAME_PATTERN,
  LAYER_REVIEW_VERDICTS,
  NONE_SENTINEL_KEY,
  PORT_SEED_MAX,
  PORT_SEED_MIN,
  QA_DRIVERS,
  STATE_DIR_DOT_PATTERN,
  STATE_DIR_PATTERN,
} from './model.js';

/** `error` blocks a write and fails `doctor`; `warning` is reported and does not block. */
export type ProblemSeverity = 'error' | 'warning';

/** One thing wrong with a config value. */
export interface ConfigProblem {
  /** Dotted key path — `qa.portSeed`, `layers[0].name` — or `''` for the document itself. */
  readonly path: string;
  readonly message: string;
  readonly severity: ProblemSeverity;
}

/** The schema's top-level `properties`, in schema order. */
const TOP_LEVEL_KEYS = [
  '$schema',
  'version',
  'projectName',
  'defaultBranch',
  'protectedBranches',
  'forge',
  'stateDir',
  'appDir',
  'scriptsDir',
  'githooksDir',
  'agentModel',
  'agentEffort',
  'pushEnvPath',
  'clientEnvPrefix',
  'detection',
  'layers',
  'commands',
  'phases',
  'qa',
  'docs',
  'parity',
  'deploy',
  'design',
] as const;

/** The schema's top-level `required`. */
const TOP_LEVEL_REQUIRED = ['version', 'defaultBranch', 'stateDir', 'layers', 'commands'] as const;

/** Top-level keys whose value is a plain non-empty string. Checked as a group. */
const TOP_LEVEL_STRING_KEYS = [
  '$schema',
  'projectName',
  'defaultBranch',
  'stateDir',
  'appDir',
  'scriptsDir',
  'githooksDir',
  'agentModel',
  'pushEnvPath',
] as const;

// `commandFamily` is checked as a string and deliberately **not** against `COMMAND_FAMILY_IDS`,
// unlike `detection.preset` below: it records which family answered on the run that wrote the file
// rather than routing anything, and no consumer in this release reads it — so an id retired by a
// later release would make an otherwise valid config unloadable and buy nothing.
const DETECTION_KEYS = ['preset', 'signal', 'evidence', 'commandFamily', 'review'] as const;
const DETECTION_STRING_KEYS = ['signal', 'evidence', 'commandFamily'] as const;
const REVIEW_KEYS = ['verdict', 'rationale', 'at'] as const;
const REVIEW_STRING_KEYS = ['rationale', 'at'] as const;
const LAYER_KEYS = ['name', 'path', 'conventions'] as const;
const COMMAND_KEYS = ['typecheck', 'test', 'build', 'devServer', 'depInstall'] as const;
const COMMAND_REQUIRED = ['typecheck', 'test'] as const;
const PHASE_KEYS = ['qa', 'docs', 'parity'] as const;
const QA_KEYS = ['driver', 'portSeed', 'credentialsPath', 'authProvider'] as const;
const QA_STRING_KEYS = ['credentialsPath', 'authProvider'] as const;
const DOCS_KEYS = ['root'] as const;
const PARITY_KEYS = ['referenceName', 'referenceImplPath', 'toolchainCommands'] as const;
const PARITY_STRING_KEYS = ['referenceName', 'referenceImplPath'] as const;
const DEPLOY_KEYS = ['provider', 'target', 'command'] as const;
const DESIGN_KEYS = ['source'] as const;

/** A plain object — not `null`, not an array. */
function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Collector, so every check can report and continue: the point of returning problems rather than
 * throwing is that `doctor` names everything wrong with a config in one pass instead of making the
 * adopter fix one thing per run.
 */
class Problems {
  readonly #found: ConfigProblem[] = [];

  error(path: string, message: string): void {
    this.#found.push({ path, message, severity: 'error' });
  }

  warn(path: string, message: string): void {
    this.#found.push({ path, message, severity: 'warning' });
  }

  get found(): ConfigProblem[] {
    return this.#found;
  }
}

/** `qa.portSeed` → `qa.portSeed`; `''` + `version` → `version`. */
function join(prefix: string, key: string): string {
  return prefix === '' ? key : `${prefix}.${key}`;
}

/** Report every key of `value` the schema does not declare at this level. */
function checkUnknownKeys(
  value: Record<string, unknown>,
  known: readonly string[],
  prefix: string,
  problems: Problems,
): void {
  for (const key of Object.keys(value)) {
    if (known.includes(key)) continue;
    problems.error(
      join(prefix, key),
      'unknown key: the schema rejects unknown keys at every level, so this is a typo rather than a setting that is silently ignored',
    );
  }
}

/**
 * Check one optional section: present ⇒ an object with no unknown keys. Returns the section when it
 * is usable, so the caller can go on checking inside it, and `undefined` otherwise.
 *
 * `prefix` is the dotted path of `parent`, empty for a top-level section. A section nested inside
 * another — `detection.review` — passes its parent's path, so a problem inside it is reported at the
 * path an adopter would edit rather than at a bare key name that appears nowhere in the file.
 */
function section(
  parent: Record<string, unknown>,
  key: string,
  known: readonly string[],
  problems: Problems,
  prefix = '',
): Record<string, unknown> | undefined {
  const value = parent[key];
  if (value === undefined) return undefined;
  const path = join(prefix, key);
  if (!isObject(value)) {
    problems.error(path, `must be an object, not ${describe(value)}`);
    return undefined;
  }
  checkUnknownKeys(value, known, path, problems);
  return value;
}

/** What a wrong value is, for a message: `an array`, `a string`, `null`. */
function describe(value: unknown): string {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'an array';
  const type = typeof value;
  return type === 'object' ? 'an object' : `a ${type}`;
}

/** A declared string key: present ⇒ a non-empty string (the schema's `minLength: 1`). */
function checkString(parent: Record<string, unknown>, key: string, prefix: string, problems: Problems): void {
  const value = parent[key];
  if (value === undefined) return;
  const path = join(prefix, key);
  if (typeof value !== 'string') {
    problems.error(path, `must be a string, not ${describe(value)}`);
    return;
  }
  if (value === '') problems.error(path, 'must not be empty');
}

/** A declared array-of-non-empty-strings key: `protectedBranches`, `parity.toolchainCommands`. */
function checkStringArray(parent: Record<string, unknown>, key: string, prefix: string, problems: Problems): void {
  const value = parent[key];
  if (value === undefined) return;
  const path = join(prefix, key);
  if (!Array.isArray(value)) {
    problems.error(path, `must be an array of strings, not ${describe(value)}`);
    return;
  }
  value.forEach((entry, index) => {
    if (typeof entry !== 'string') problems.error(`${path}[${index}]`, `must be a string, not ${describe(entry)}`);
    else if (entry === '') problems.error(`${path}[${index}]`, 'must not be empty');
  });
}

/** A declared boolean key: the three `phases` toggles. */
function checkBoolean(parent: Record<string, unknown>, key: string, prefix: string, problems: Problems): void {
  const value = parent[key];
  if (value === undefined) return;
  if (typeof value !== 'boolean') problems.error(join(prefix, key), `must be true or false, not ${describe(value)}`);
}

/**
 * A declared enum key: present ⇒ a string drawn from `allowed` (the schema's `enum`).
 *
 * The `allowed` set is always **imported** from `config/model.ts`, never spelled here: the enum is
 * the schema's, and a set restated at the point of use is a set that can disagree with the schema
 * in one of its two copies.
 *
 * `consequence` is the caller's one sentence about what choosing wrongly costs, appended to the
 * generic "not one of" line. A bare list of legal values tells an adopter what to type but not
 * which to pick, and every key this guards is one where the wrong pick is silent — an
 * unfilled `forge` is a decision not yet made, the default `qa.driver` reaches a browser that a
 * mobile application does not have, a value outside `agentEffort`'s set is never refused by the
 * runtime either: it warns, ignores the flag and runs at its own default, so the run costs a level
 * the file did not choose, an unfilled `design.source` is likewise a decision not yet made —
 * nothing reports that a change has no stated design source of truth — and the two `detection`
 * enums record what a run and a review concluded, which nothing re-derives afterwards.
 */
function checkEnum(
  parent: Record<string, unknown>,
  key: string,
  prefix: string,
  allowed: readonly string[],
  consequence: string,
  problems: Problems,
): void {
  const value = parent[key];
  if (value === undefined) return;
  const path = join(prefix, key);
  if (typeof value !== 'string') {
    problems.error(path, `must be a string, not ${describe(value)}`);
    return;
  }
  if (allowed.includes(value)) return;
  const legal = allowed.map((entry) => JSON.stringify(entry)).join(', ');
  problems.error(path, `${JSON.stringify(value)} is not one of ${legal}. ${consequence}`);
}

/**
 * `stateDir`'s two clauses, checked **separately and both**, exactly as the schema states them.
 *
 * A leading dot fails both, and both are reported: the redundancy is deliberate on the schema's
 * side — so a later edit to `pattern` cannot quietly drop the prohibition — and reporting only the
 * pattern failure would hide the reason that matters. The dot clause carries its own message
 * naming the unattended-write cause, because an adopter who reads "does not match a pattern" will
 * reasonably try to fix it by tidying the name toward a dot-directory, which is the exact change
 * that risks unattended runs.
 */
function checkStateDir(value: unknown, problems: Problems): void {
  if (typeof value !== 'string' || value === '') return; // already reported by checkString
  if (!STATE_DIR_PATTERN.test(value)) {
    problems.error(
      'stateDir',
      `${JSON.stringify(value)} is not a legal directory name: it must start with a letter, a digit or an underscore, may then contain letters, digits, '.', '_', '-' and '/', and may end with one '/'`,
    );
  }
  if (STATE_DIR_DOT_PATTERN.test(value)) {
    problems.error(
      'stateDir',
      `${JSON.stringify(value)} has a path segment starting with '.': the state directory must not be dot-named or reach through a dot segment, because the run-artifact tree has to be writable by an unattended run and a dot-path is where a host reserves directories an unattended run may not write to — measured for .claude/**, where such a run completes with exit 0 having written nothing. Do not "fix" this to a dot-name`,
    );
  }
}

/**
 * `layers`: a non-empty array of complete entries with legal names, one of which is the catch-all.
 *
 * The catch-all clause is the schema's `contains`, which asserts **at least one** matching entry.
 * More than one is deliberately **not** reported: this schema is draft-07, which has no
 * `maxContains`, so an upper bound is not expressible there, and this check exists to match the
 * schema rather than to exceed it — a config the schema gate accepts must not be one the write
 * guard refuses.
 */
function checkLayers(value: unknown, problems: Problems): void {
  if (value === undefined) return; // already reported as a missing required key
  if (!Array.isArray(value)) {
    problems.error('layers', `must be an array, not ${describe(value)}`);
    return;
  }
  if (value.length === 0) {
    problems.error(
      'layers',
      'must list at least one layer: a task is assigned to exactly one layer, so an empty list leaves no one to do the work',
    );
    return;
  }

  value.forEach((entry, index) => {
    const prefix = `layers[${index}]`;
    if (!isObject(entry)) {
      problems.error(prefix, `must be an object, not ${describe(entry)}`);
      return;
    }
    checkUnknownKeys(entry, LAYER_KEYS, prefix, problems);
    for (const key of LAYER_KEYS) {
      if (entry[key] === undefined) problems.error(join(prefix, key), 'is required');
      else checkString(entry, key, prefix, problems);
    }
    const name = entry['name'];
    if (typeof name === 'string' && name !== '' && !LAYER_NAME_PATTERN.test(name)) {
      problems.error(
        join(prefix, 'name'),
        `${JSON.stringify(name)} is not a legal layer name: lower-case letters, digits and hyphens, starting with a letter — it is the routing tag a task is assigned by, and it appears in a run's dispatch labels`,
      );
    }
  });

  // Reached only past the two returns above, so this never piles onto "must be an array" or "must
  // list at least one layer" — an adopter fixing the shape is not also told about the catch-all.
  const catchAll = JSON.stringify(LAYER_CATCH_ALL_PATH);
  if (!value.some((entry) => isObject(entry) && entry['path'] === LAYER_CATCH_ALL_PATH)) {
    problems.error(
      'layers',
      `at least one layer must have "path" set to ${catchAll}: work that matches no layer's path is assigned to that layer, and every run produces such work — its own artifacts, this config file, the scripts and hooks directories, CI files — so without the row that work has nowhere to go and the run stops on it. Add a layer with "path": ${catchAll} pointing at the shared conventions document; any name will do, and init writes it as "general"`,
    );
  }
}

/**
 * Is this value a near miss for {@link COMMAND_NONE_SENTINEL} — an adopter reaching for the answer
 * and not landing on it?
 *
 * Trimmed, stripped of one surrounding pair of matching quotes and case-folded: `none`, `<None>`
 * and a quoted spelling of the sentinel all reach here, and none of them is it. Without the warning
 * such a value
 * is stored as a command line, a wrapper is written with `none` as its body, that wrapper is
 * allow-listed, and nothing anywhere reports it until the run invokes it.
 */
function isNoneNearMiss(value: string): boolean {
  const bare = value.trim().replace(/^(['"])([\s\S]*)\1$/, '$2').trim().toLowerCase();
  return (bare === 'none' || bare === COMMAND_NONE_SENTINEL) && !isNoneSentinel(value);
}

/**
 * `commands`: the two required verifiers, the answered-`none` sentinel on `commands.typecheck`, and
 * the placeholder warning on any command key.
 */
function checkCommands(value: unknown, problems: Problems): void {
  if (value === undefined) return; // already reported as a missing required key
  if (!isObject(value)) {
    problems.error('commands', `must be an object, not ${describe(value)}`);
    return;
  }
  checkUnknownKeys(value, COMMAND_KEYS, 'commands', problems);

  for (const key of COMMAND_REQUIRED) {
    if (value[key] === undefined) {
      problems.error(
        join('commands', key),
        'is required: the two verification commands are what "this change is done" means, so the flow cannot proceed without them',
      );
    }
  }
  for (const key of COMMAND_KEYS) {
    checkString(value, key, 'commands', problems);
    const command = value[key];

    // The sentinel arm, ahead of the placeholder warning so a sentinel is never also read as a
    // placeholder. `isNoneSentinel` rather than `answersNone` here — deliberately ungated, because
    // this is the one site that must say something *different* on the other command keys.
    if (typeof command === 'string' && isNoneSentinel(command)) {
      if (key === NONE_SENTINEL_KEY) {
        // Answered: no problem is emitted. Stated rather than left as a bare fall-through, because
        // a silent skip is indistinguishable from the accidental silence this arm replaces — before
        // it, a sentinel passed the required-key check and the placeholder test without a word.
        continue;
      }
      problems.warn(
        join('commands', key),
        `${JSON.stringify(COMMAND_NONE_SENTINEL)} is recognised as "this repository has no such command" on commands.${NONE_SENTINEL_KEY} only. Here it is stored as a literal command line and will be run — which is what withdrawing a gate would have to look like, so it is reported rather than assumed`,
      );
      continue;
    }
    if (typeof command === 'string' && isNoneNearMiss(command)) {
      problems.warn(
        join('commands', key),
        `${JSON.stringify(command)} looks like the answered-none sentinel but is not it: the value must be exactly ${JSON.stringify(COMMAND_NONE_SENTINEL)}, unquoted and lower-case. As written it is a command line, so a wrapper is written for it, allow-listed, and run`,
      );
      continue;
    }

    if (typeof command === 'string' && isPlaceholder(command)) {
      problems.warn(
        join('commands', key),
        'still holds the placeholder init wrote because it could not detect this command — replace it, or the run stops the first time it is invoked',
      );
    }
  }
}

/** `qa.portSeed`: the schema's one numeric constraint. */
function checkPortSeed(qa: Record<string, unknown>, problems: Problems): void {
  const value = qa['portSeed'];
  if (value === undefined) return;
  if (typeof value !== 'number') {
    problems.error('qa.portSeed', `must be a whole number, not ${describe(value)}`);
    return;
  }
  if (!Number.isInteger(value)) {
    problems.error('qa.portSeed', `must be a whole number, not ${value}`);
    return;
  }
  if (value < PORT_SEED_MIN || value > PORT_SEED_MAX) {
    problems.error('qa.portSeed', `must be between ${PORT_SEED_MIN} and ${PORT_SEED_MAX}`);
  }
}

/**
 * A phase that is on with its section unfilled. A **warning**, not an error: the config is legal,
 * and the phase may still be reachable — the value could be supplied another way, or the phase may
 * fail later with a better message than a shape check can give. Blocking the write here would stop
 * an adopter from enabling a phase and filling its section in the next edit.
 *
 * **`qa.portSeed` sits beside the two `qa` keys graded here and is deliberately not graded itself.**
 * An absent `portSeed` is a *resolved* state: `3001` is its documented default, and the plugin's
 * instruction files and `plugin/scripts/find-free-port.sh` all state it and resolve it without ever
 * reading the key. `driver`'s consumers have no such stated fallback — they read the value and act
 * on what they find — so its absence is unresolved where `portSeed`'s is not. Do not "complete" the
 * set.
 *
 * **Presence only.** Whether a present `qa.driver` holds a legal value is
 * {@link checkConfigShape}'s `checkEnum` call, which grades an out-of-set value an `error`; a second
 * value check here would be a second copy of the enum's opinion.
 */
function checkPhaseSections(
  root: Record<string, unknown>,
  phases: Record<string, unknown> | undefined,
  problems: Problems,
): void {
  const enabled = (key: string): boolean => phases?.[key] === true;
  const missing = (sectionKey: string, key: string): boolean => {
    const value = root[sectionKey];
    return !isObject(value) || value[key] === undefined;
  };

  if (enabled('qa') && missing('qa', 'driver')) {
    problems.warn(
      'qa.driver',
      'phases.qa is on but no driver is configured. The browser wiring is not missing — the generators fall back to the schema default — what is missing is the choice of which driver reaches this application, which nobody has been asked to make. The interactive test flow reads the value with no such fallback and stops when it is anything other than "web-playwright". Set it with `config set qa.driver <value>`, which names the values it accepts',
    );
  }
  if (enabled('qa') && missing('qa', 'credentialsPath')) {
    problems.warn('qa.credentialsPath', 'phases.qa is on but no credentials file is configured, so the phase cannot reach an authenticated screen');
  }
  if (enabled('docs') && missing('docs', 'root')) {
    problems.warn('docs.root', 'phases.docs is on but no documentation root is configured, so the phase has nothing to keep current');
  }
  if (enabled('parity') && missing('parity', 'referenceImplPath')) {
    problems.warn('parity.referenceImplPath', 'phases.parity is on but no reference implementation is configured, so there is nothing to compare against');
  }
}

/**
 * Check a parsed value against the shape `harness.config.json` must have, and return everything
 * wrong with it — never throwing, so one pass names every problem.
 *
 * Takes `unknown` deliberately: its callers hold whatever `JSON.parse` produced, and the answer to
 * "is this a config at all" is one of the problems it reports rather than a precondition of
 * calling it.
 */
export function checkConfigShape(value: unknown): ConfigProblem[] {
  const problems = new Problems();

  if (!isObject(value)) {
    problems.error('', `must be a JSON object, not ${describe(value)}`);
    return problems.found;
  }

  checkUnknownKeys(value, TOP_LEVEL_KEYS, '', problems);
  for (const key of TOP_LEVEL_REQUIRED) {
    if (value[key] === undefined) problems.error(key, 'is required');
  }

  if (value['version'] !== undefined && value['version'] !== CONFIG_VERSION) {
    problems.error(
      'version',
      `must be ${CONFIG_VERSION}, not ${JSON.stringify(value['version'])}: this release recognises no other format version`,
    );
  }

  for (const key of TOP_LEVEL_STRING_KEYS) checkString(value, key, '', problems);
  checkStringArray(value, 'protectedBranches', '', problems);
  checkEnum(
    value,
    'forge',
    '',
    FORGE_KINDS,
    'The key is optional and nothing reads it in this release; set "none" to say the repository has no forge integration at all — work stays on branches and no pull request is opened — rather than leaving the decision unmade.',
    problems,
  );
  checkEnum(
    value,
    'agentEffort',
    '',
    AGENT_EFFORT_LEVELS,
    'The key is optional; leaving it out is what selects the per-model default the runtime applies, so an unset value is a resolved state rather than a missing one. A value outside this set is not refused by the runtime either — it warns, ignores the flag and runs at that default — so the run costs a level this file did not choose and nothing but this check says so.',
    problems,
  );

  // The one key the schema types as a union: a prefix, or `null` for a stack that has no such rule.
  const clientEnvPrefix = value['clientEnvPrefix'];
  if (clientEnvPrefix !== undefined && clientEnvPrefix !== null && typeof clientEnvPrefix !== 'string') {
    problems.error('clientEnvPrefix', `must be a string or null, not ${describe(clientEnvPrefix)}`);
  } else if (clientEnvPrefix === '') {
    problems.error('clientEnvPrefix', 'must not be empty: use null when the stack has no such rule');
  }

  checkStateDir(value['stateDir'], problems);
  checkLayers(value['layers'], problems);
  checkCommands(value['commands'], problems);

  // No required-key check inside `detection` or `detection.review`: the schema states none, so a
  // record holding only a `review` — the shape a repository whose config predates the key gets from
  // `config set detection.review` — is legal, and a config the schema gate accepts must not be one
  // the write guard refuses.
  const detection = section(value, 'detection', DETECTION_KEYS, problems);
  if (detection !== undefined) {
    checkEnum(
      detection,
      'preset',
      'detection',
      DETECTION_PRESET_NAMES,
      'It records which layer preset detection selected, so a value naming no real preset makes this record describe a detection that never happened — and nothing re-derives it, because harness.config.json is exempt from --force and a plain init re-run leaves the record standing.',
      problems,
    );
    for (const key of DETECTION_STRING_KEYS) checkString(detection, key, 'detection', problems);

    const review = section(detection, 'review', REVIEW_KEYS, problems, 'detection');
    if (review !== undefined) {
      checkEnum(
        review,
        'verdict',
        'detection.review',
        LAYER_REVIEW_VERDICTS,
        "It is what doctor's layer-profile check reads to see that the profile was reviewed, so a value outside this set is a record that check cannot read: the warning the review was written to clear stands, and the reviewing was done for nothing.",
        problems,
      );
      for (const key of REVIEW_STRING_KEYS) checkString(review, key, 'detection.review', problems);
    }
  }

  const phases = section(value, 'phases', PHASE_KEYS, problems);
  if (phases !== undefined) for (const key of PHASE_KEYS) checkBoolean(phases, key, 'phases', problems);

  const qa = section(value, 'qa', QA_KEYS, problems);
  if (qa !== undefined) {
    checkEnum(
      qa,
      'driver',
      'qa',
      QA_DRIVERS,
      'It selects which variant of the interactive test agent runs, and so how that agent reaches the application. The default drives a browser, so a project whose application is a mobile app has to set this key: leaving it out selects a driver that cannot reach the application at all. Both mobile values are declared but not implemented in this release: setting either makes every interactive-test dispatch return a blocker rather than run a test.',
      problems,
    );
    checkPortSeed(qa, problems);
    for (const key of QA_STRING_KEYS) checkString(qa, key, 'qa', problems);
  }

  const docs = section(value, 'docs', DOCS_KEYS, problems);
  if (docs !== undefined) for (const key of DOCS_KEYS) checkString(docs, key, 'docs', problems);

  const parity = section(value, 'parity', PARITY_KEYS, problems);
  if (parity !== undefined) {
    for (const key of PARITY_STRING_KEYS) checkString(parity, key, 'parity', problems);
    checkStringArray(parity, 'toolchainCommands', 'parity', problems);
  }

  const deploy = section(value, 'deploy', DEPLOY_KEYS, problems);
  if (deploy !== undefined) for (const key of DEPLOY_KEYS) checkString(deploy, key, 'deploy', problems);

  const design = section(value, 'design', DESIGN_KEYS, problems);
  if (design !== undefined) {
    checkEnum(
      design,
      'source',
      'design',
      DESIGN_SOURCES,
      'The key is optional and nothing reads it in this release; set "none" to say the project has no design source of truth at all — a change is built against no design — rather than leaving the decision unmade.',
      problems,
    );
  }

  checkPhaseSections(value, phases, problems);

  return problems.found;
}

/** True when any problem is an `error` — the write guard's question, and `doctor`'s FAIL test. */
export function hasErrors(problems: readonly ConfigProblem[]): boolean {
  return problems.some((problem) => problem.severity === 'error');
}

/**
 * One problem as a line: `stateDir: ...`, or just the message for a problem about the document
 * itself. Kept here so `doctor`, `config` and the write guard's refusal all render a problem the
 * same way.
 */
export function formatProblem(problem: ConfigProblem): string {
  return problem.path === '' ? problem.message : `${problem.path}: ${problem.message}`;
}

/**
 * `config list` / `get` / `set` against a repository `init` has wired.
 *
 * **The rule these tests exist to enforce: a refused `set` leaves the file exactly as it was.** This
 * is the one command whose job is to change a file the adopter owns, and it takes an arbitrary
 * dotted key path and an arbitrary value — so the interesting cases are the refusals, and the
 * assertion that matters about each of them is about the bytes on disk rather than about the
 * message. Every refusal below is checked with a whole-tree snapshot comparison, which also proves
 * the engine wrote no `.bak` for a write it never made.
 *
 * These run against the **compiled** CLI at `dist/cli.js`, so `npm run build` precedes `npm test`.
 *
 * ## Three non-obvious choices, and where each comes from
 *
 * 1. **A stored value is read back from the file and compared by type**, not by the text the command
 *    printed. `set phases.qa true` has to store the boolean rather than the four-letter word, and a
 *    rendered value looks identical either way — reading the parsed file is the only place the
 *    difference shows.
 * 2. **The unknown-key case uses a plausible typo of a real key**, because that is the case the
 *    refusal exists for: an adopter mistyping `commands.test` gets an error rather than a new setting
 *    that is silently ignored and never read by anything.
 * 3. **Nothing here asserts against a key table.** The command has none — every refusal comes from
 *    the structural check run over the result of the edit — so these tests exercise the same route an
 *    adopter's own mistake takes rather than a list that would have to be kept in step with it.
 */

import assert from 'node:assert/strict';
import { existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

import { createFixture, ignoredAmong, readJson, runCli, snapshotTree } from './helpers/fixture.mjs';

/** The file every verb reads, and the sibling a real `set` leaves the previous values in. */
const CONFIG_FILE = 'harness.config.json';
const BACKUP_FILE = `${CONFIG_FILE}.bak`;

/** The wrapper invocation `init` writes into `commands.test`, spelled out rather than imported. */
const TEST_COMMAND = 'bash scripts/test.sh';

/** A plausible typo of a declared key: the case the unknown-key refusal exists for. */
const TYPO_KEY = 'commands.tset';

/** The finding's own repository shape: `init` ran wired to a feature branch, so both branch keys name it. */
const FEATURE_BRANCH = 'feat_add_search';

/** The generated guard git actually runs, at the schema-default `githooksDir`. */
const PRE_PUSH_HOOK_FILE = 'githooks/pre-push';

/** The sentence the branch-guard report is recognised by: the fact both halves of the pair resolve into. */
const BRANCH_GUARD_PHRASE = 'protectedBranches unioned with defaultBranch';

/** The clause only the `defaultBranch` arm carries — the sibling key, named rather than offered as a change. */
const SIBLING_KEY_REMEDY = "config set protectedBranches '<json>'";

/**
 * The clause the hook half carries in the one state that earns it: the label on disk and the
 * resolved set disagree. It is the claim the whole hook half used to make unconditionally, so it is
 * what the two states below are negative controls against.
 */
const HOOK_BEHIND_CLAUSE = 'rather than the set the configuration resolves';

/**
 * The hand-fill a nested application forces: a real command line, rooted at the repository, for a
 * command `init` could not detect. It is the value Finding 65 measured 25 refused calls on.
 */
const RAW_TYPECHECK_COMMAND = 'npm --prefix packages/storefront run typecheck';

/** The same hand-fill for the other required verifier, so the object form carries two raw lines. */
const RAW_TEST_COMMAND = 'npm --prefix packages/storefront test';

/** The wrapper `commands.typecheck` is allow-listed as, spelled out rather than imported. */
const TYPECHECK_WRAPPER = 'bash scripts/typecheck.sh';

/** The wrapper file that invocation runs, as a path under the fixture. */
const TYPECHECK_WRAPPER_FILE = join('scripts', 'typecheck.sh');

/** The nested application whose hand-fill path reaches `set` with no wrapper on disk yet. */
const NESTED_APP_DIR = 'packages/storefront';

/**
 * The answered-`none` sentinel, spelled as the adopter types it. `set` is its only writer — `init`
 * never writes it — so this is the command whose acceptance of it is the published contract.
 */
const NONE_SENTINEL = '<none>';

/** The near miss: the word alone, which is a legal command line and not the answer. */
const NONE_NEAR_MISS = 'none';

/**
 * The three clauses `config/check.ts` reports the sentinel and its near miss with, matched as
 * clauses so a re-worded remedy leaves these cases about the state rather than about the wording.
 */
const NONE_KEY_GATE_CLAUSE = 'on commands.typecheck only';
const NONE_LITERAL_CLAUSE = 'stored as a literal command line';
const NONE_NEAR_MISS_CLAUSE = 'looks like the answered-none sentinel but is not it';

/**
 * The clause the message used to carry, retired because it is false at this boundary: on the
 * hand-fill path the key held the placeholder, so no wrapper was written for it at all.
 */
const RETIRED_RUNS_IT_CLAIM = 'is the script that runs it';

/** A repository whose stack detection resolves every command — the same seed `init`'s tests use. */
function nodeProjectFiles() {
  return {
    'package.json': {
      name: 'fixture-project',
      private: true,
      version: '0.0.0',
      scripts: { typecheck: 'echo typecheck', test: 'echo test', build: 'echo build', dev: 'echo dev' },
    },
    'README.md': '# fixture project\n',
  };
}

/**
 * Build a fixture, register its teardown against the test, wire it with `init`, and return it.
 *
 * `args` are passed through to `init`, so a case can start from a repository whose `qa` section was
 * written by the wiring run (`['--qa']`) rather than from one that has none at all.
 */
async function wiredFixture(t, args = []) {
  const fixture = await createFixture({ files: nodeProjectFiles() });
  t.after(fixture.cleanup);

  const result = await runCli(fixture.dir, ['init', ...args]);
  assert.equal(result.status, 0, `init exited ${result.status}\n${result.stdout}\n${result.stderr}`);
  return fixture.dir;
}

/** Run `config` and fail with the command's own output when it did not exit 0. */
async function configOk(dir, args) {
  const result = await runCli(dir, ['config', ...args]);
  const detail = `config ${args.join(' ')} exited ${result.status}\n${result.stdout}\n${result.stderr}`;
  assert.equal(result.status, 0, detail);
  return result;
}

test('get prints one value, raw, so a shell can consume it directly', async (t) => {
  const dir = await wiredFixture(t);

  const { stdout } = await configOk(dir, ['get', 'commands.test']);

  assert.equal(stdout.trim(), TEST_COMMAND);
});

test('set stores the value as JSON and leaves the previous file one file away', async (t) => {
  const dir = await wiredFixture(t);

  await configOk(dir, ['set', 'phases.qa', 'true']);

  // The boolean, not the word: a strict comparison is the only place the difference shows.
  assert.equal(readJson(join(dir, CONFIG_FILE)).phases.qa, true);
  assert.equal(readJson(join(dir, BACKUP_FILE)).phases.qa, false, `${BACKUP_FILE} does not hold the previous value`);

  // F72, at the place it was measured: the file the command just wrote is really on disk, which is
  // what makes the next assertion evidence rather than a question about a pathname. The negative
  // half is in the same call on purpose — a rule one character too broad would hide the
  // configuration itself and still pass a one-path assertion.
  assert.ok(existsSync(join(dir, BACKUP_FILE)), `${BACKUP_FILE} is not on disk, so asking git about it proves nothing`);
  assert.deepEqual(
    await ignoredAmong(dir, [BACKUP_FILE, CONFIG_FILE]),
    [BACKUP_FILE],
    'the documented `config set` path leaves an untracked file in `git status`, which is F72 — unless ' +
      `${CONFIG_FILE} is listed too, in which case the rule also hides the configuration it backs up`,
  );
});

/**
 * The arming moment: `config set phases.qa true` is the documented route to turning the phase on
 * without re-running `init`, and it writes no `qa` section — `init` writes one only under `--qa`, and
 * `init --force` never rewrites `harness.config.json` at all. So the command that arms the phase is
 * the only place an adopter can be told the driver was never chosen, and it has to say so there.
 *
 * The negative control is in the same case on purpose: a repository whose `qa` section `init --qa`
 * wrote carries all three keys, and if it warned too the assertion above would pass with the clause
 * firing unconditionally.
 */
test('set phases.qa true names the driver nobody chose, and a section init wired does not', async (t) => {
  const dir = await wiredFixture(t);

  const { stderr } = await configOk(dir, ['set', 'phases.qa', 'true']);

  assert.equal(readJson(join(dir, CONFIG_FILE)).phases.qa, true);
  assert.match(stderr, /qa\.driver/, 'arming the phase did not name the unset driver');
  // The repair, not just the condition: the key is set by a command, and the warning is where an
  // adopter learns which one.
  assert.match(stderr, /config set qa\.driver/);

  const wired = await wiredFixture(t, ['--qa']);
  const control = await configOk(wired, ['set', 'phases.qa', 'true']);
  assert.doesNotMatch(control.stderr, /qa\.driver/, 'a qa section init --qa wrote was warned about anyway');
});

test('set refuses a key the file may not carry, and writes nothing at all', async (t) => {
  const dir = await wiredFixture(t);
  const before = await snapshotTree(dir);

  const { status, stderr } = await runCli(dir, ['config', 'set', TYPO_KEY, 'echo nothing']);

  assert.equal(status, 1);
  assert.match(stderr, /unknown key/);
  // Byte-identical, and no `.bak`: a refused set is not a write that was rolled back, it is a write
  // that never happened.
  assert.deepEqual(await snapshotTree(dir), before, 'a refused set changed the tree');
});

test('set refuses a dot-named stateDir, for the reason that makes it worth refusing', async (t) => {
  const dir = await wiredFixture(t);
  const before = await snapshotTree(dir);

  const { status, stderr } = await runCli(dir, ['config', 'set', 'stateDir', '.hidden']);

  assert.equal(status, 1);
  assert.match(stderr, /path segment starting with '\.'/);
  assert.match(stderr, /an unattended run may not write to/);
  assert.deepEqual(await snapshotTree(dir), before, 'a refused set changed the tree');
});

/**
 * The five refusals the schema states as four `enum`s and a `contains`, in the order the keys
 * appear in the file. Each value is well-formed JSON of the right type — a string for the four
 * enum keys, a list of complete layer entries for `layers` — so the only thing wrong with any of
 * them is the constraint under test, and the refusal cannot be coming from a type or shape check.
 */
const CONSTRAINED_KEYS = [
  {
    key: 'forge',
    // A real forge, and not one of the three the enum lists: the case an adopter reaches by naming
    // the platform they actually use.
    value: 'bitbucket',
    names: /forge/,
    // The enum's own refusal, not the unknown-key refusal a dropped TOP_LEVEL_KEYS entry produces:
    // both name the key, and only this one proves the constraint is still enforced.
    states: /"bitbucket" is not one of "github", "gitlab", "none"/,
  },
  {
    key: 'agentEffort',
    // A plausible word rather than gibberish: the case an adopter reaches by naming the level they
    // meant, which is the only way this key is ever got wrong.
    value: 'extreme',
    names: /agentEffort/,
    states: /"extreme" is not one of "low", "medium", "high", "xhigh", "max"/,
  },
  {
    key: 'qa.driver',
    value: 'appium',
    names: /qa\.driver/,
    states: /"appium" is not one of "web-playwright", "mobile-maestro", "mobile-mcp"/,
  },
  {
    key: 'layers',
    // Every entry complete and legally named; what is missing is the catch-all row, which is the
    // one thing about this list a per-entry check cannot see.
    value: '[{"name":"app","path":"src","conventions":"docs/app.md"}]',
    names: /layers/,
    states: /at least one layer must have "path" set to "\."/,
  },
  {
    key: 'design.source',
    // A real design tool, and not one of the three the enum lists: the case an adopter reaches by
    // naming the tool their designs actually live in.
    value: 'sketch',
    names: /design\.source/,
    states: /"sketch" is not one of "figma", "penpot", "none"/,
  },
];

test('set refuses a value outside the legal set for a key, and a layer list with no catch-all row', async (t) => {
  const dir = await wiredFixture(t);
  const before = await snapshotTree(dir);

  for (const { key, value, names, states } of CONSTRAINED_KEYS) {
    const { status, stderr } = await runCli(dir, ['config', 'set', key, value]);

    assert.notEqual(status, 0, `config set ${key} ${value} was accepted`);
    assert.match(stderr, names, `the refusal of ${key} does not name the key`);
    assert.match(
      stderr,
      states,
      `${key} was refused, but not by the constraint under test — an unknown-key or shape refusal ` +
        'names the key too, so matching the key alone would keep this test green with the check removed',
    );
    assert.deepEqual(await snapshotTree(dir), before, `a refused set of ${key} changed the tree`);
  }
});

test('set stores a legal value for a key init writes no line for', async (t) => {
  const dir = await wiredFixture(t);

  await configOk(dir, ['set', 'agentEffort', 'xhigh']);

  // The other half of the enum: refusing "extreme" for the right reason would stay green with the
  // key rejected outright, and `init` writes no agentEffort line to read back instead.
  assert.equal(readJson(join(dir, CONFIG_FILE)).agentEffort, 'xhigh');
});

/**
 * **The rule these cases enforce: `docs.retrieval` may be `true` only while `phases.docs` is `true`**
 * — the schema's `allOf` clause, mirrored in `config/check.ts` as an error. The third case is the one
 * that shows the check is cross-field rather than a guard on setting the retrieval key: turning the
 * phase off under a file already holding the flag is refused by the same message.
 */
const RETRIEVAL_PHASE_REFUSAL = 'docs.retrieval is true but phases.docs is not';

test('set docs.retrieval true with phases.docs off is refused, and writes nothing', async (t) => {
  const dir = await wiredFixture(t);
  assert.equal(readJson(join(dir, CONFIG_FILE)).phases.docs, false, 'the fixture does not start with the docs phase off');
  const before = await snapshotTree(dir);

  const { status, stderr } = await runCli(dir, ['config', 'set', 'docs.retrieval', 'true']);

  assert.equal(status, 1);
  assert.ok(stderr.includes(RETRIEVAL_PHASE_REFUSAL), `the refusal is not the cross-field one:\n${stderr}`);
  assert.deepEqual(await snapshotTree(dir), before, 'a refused set changed the tree');
});

test('set docs.retrieval true with phases.docs on stores the boolean', async (t) => {
  const dir = await wiredFixture(t);
  await configOk(dir, ['set', 'phases.docs', 'true']);

  await configOk(dir, ['set', 'docs.retrieval', 'true']);

  assert.equal(readJson(join(dir, CONFIG_FILE)).docs.retrieval, true);
});

test('set phases.docs false under a file holding docs.retrieval true is refused, and writes nothing', async (t) => {
  const dir = await wiredFixture(t);
  await configOk(dir, ['set', 'phases.docs', 'true']);
  await configOk(dir, ['set', 'docs.retrieval', 'true']);
  const before = await snapshotTree(dir);

  const { status, stderr } = await runCli(dir, ['config', 'set', 'phases.docs', 'false']);

  assert.equal(status, 1);
  assert.ok(stderr.includes(RETRIEVAL_PHASE_REFUSAL), `the refusal is not the cross-field one:\n${stderr}`);
  assert.deepEqual(await snapshotTree(dir), before, 'a refused set changed the tree');
});

/**
 * The write path and the read guard agreeing about `detection.commandFamily`.
 *
 * The accepting arm is the one that matters: the key is written by `init` itself, so a guard that did
 * not know it would make **every** freshly adopted repository refuse `get` and `set`. It is asserted
 * through `get`, which refuses a config carrying any shape problem, so exiting 0 is the whole claim.
 * The value is not checked against the family id list, deliberately (`config/check.ts`), so only a
 * wrong *type* is a problem.
 */
test('the guard accepts the commandFamily init records, and reports a non-string one', async (t) => {
  const dir = await wiredFixture(t);
  const path = join(dir, CONFIG_FILE);

  const { stdout } = await configOk(dir, ['get', 'detection.commandFamily']);
  assert.equal(stdout.trim(), 'npm', 'init did not record the family that resolved the commands');

  const broken = readJson(path);
  broken.detection.commandFamily = 12;
  writeFileSync(path, `${JSON.stringify(broken, null, 2)}\n`);

  // Read back through a different key, so the refusal is the file's shape rather than the request.
  const refused = await runCli(dir, ['config', 'get', 'defaultBranch']);
  assert.equal(refused.status, 1, 'a non-string detection.commandFamily was accepted');
  assert.match(refused.stderr, /detection\.commandFamily/);
  assert.match(refused.stderr, /must be a string/);
});

test('list prints the file as it stands, and its output re-parses as that file', async (t) => {
  const dir = await wiredFixture(t);

  const { stdout } = await configOk(dir, ['list']);

  assert.deepEqual(JSON.parse(stdout), readJson(join(dir, CONFIG_FILE)));
});

test('list prints a config carrying a shape error, where get and set refuse it', async (t) => {
  const dir = await wiredFixture(t);
  const path = join(dir, CONFIG_FILE);
  const broken = readJson(path);
  broken[TYPO_KEY.split('.')[1]] = 'echo nothing';
  writeFileSync(path, `${JSON.stringify(broken, null, 2)}\n`);

  // The verb whose promise is "as it stands": the file is printed, and the problem named on stderr.
  const { stdout, stderr } = await configOk(dir, ['list']);
  assert.deepEqual(JSON.parse(stdout), broken);
  assert.match(stderr, /unknown key/);

  // The two verbs that act on a single value refuse the same file, on the input rather than a write.
  for (const args of [['get', 'defaultBranch'], ['set', 'defaultBranch', 'trunk']]) {
    const refused = await runCli(dir, ['config', ...args]);
    assert.equal(refused.status, 1, `config ${args.join(' ')} did not refuse a config with a shape error`);
    assert.match(refused.stderr, /unknown key/);
  }
});

test('--dry-run on a set reports the change and writes nothing', async (t) => {
  const dir = await wiredFixture(t);
  const before = await snapshotTree(dir);

  const { stdout } = await configOk(dir, ['--dry-run', 'set', 'defaultBranch', 'trunk']);

  assert.match(stdout, /^defaultBranch would become trunk$/m);
  assert.deepEqual(await snapshotTree(dir), before, '--dry-run wrote to the repository');
});

/**
 * The boundary: this is the command an adopter fills an undetected `commands.*` key in with, and the
 * last point at which the raw line they typed and the wrapper invocation the permission profile
 * allow-lists are still distinguishable. The value is stored **exactly as typed** — a `set` whose
 * `get` answered something else would surprise on the one command an adopter is told to use — so what
 * the command owes here is the report, and the assertions are both halves at once.
 *
 * The negative control is in the same case on purpose: the wrapper form is what a fresh `init` writes
 * and what the corrective `set` restores, so a warning firing there would fire on the repair.
 */
test('set stores a raw command line as typed and names the wrapper the profile allow-lists', async (t) => {
  const dir = await wiredFixture(t);

  const { stderr } = await configOk(dir, ['set', 'commands.typecheck', RAW_TYPECHECK_COMMAND]);

  assert.equal(readJson(join(dir, CONFIG_FILE)).commands.typecheck, RAW_TYPECHECK_COMMAND);
  // set and get still agree, which is what a normalising set would have broken.
  const read = await configOk(dir, ['get', 'commands.typecheck']);
  assert.equal(read.stdout.trim(), RAW_TYPECHECK_COMMAND);

  assert.match(stderr, /commands\.typecheck holds a raw command line/);
  assert.ok(stderr.includes(TYPECHECK_WRAPPER), 'the warning does not name the form to finish with');

  const control = await configOk(dir, ['set', 'commands.test', TEST_COMMAND]);
  assert.doesNotMatch(control.stderr, /raw command line/, 'the wrapper form was reported as a mismatch');
});

/**
 * A `set` that rewrites nothing still leaves a repository carrying the defect, so the arm that
 * reports `already holds that value` reaches the warning too. Without this, an adopter who re-typed
 * the same line to check it would be told the value is fine.
 */
test('a set that changes nothing still reports a raw command line already sitting in the key', async (t) => {
  const dir = await wiredFixture(t);
  await configOk(dir, ['set', 'commands.typecheck', RAW_TYPECHECK_COMMAND]);

  const { stdout, stderr } = await configOk(dir, ['set', 'commands.typecheck', RAW_TYPECHECK_COMMAND]);

  assert.match(stdout, /^commands\.typecheck already holds that value/m);
  assert.match(stderr, /commands\.typecheck holds a raw command line/);
});

/**
 * A dry run that withheld the warning would report a success a real run would not have, which is the
 * property `docs/cli.md` §1 states for the flag.
 */
test('--dry-run on a raw command line reports what it would cost and writes nothing', async (t) => {
  const dir = await wiredFixture(t);
  const before = await snapshotTree(dir);

  const { stdout, stderr } = await configOk(dir, ['--dry-run', 'set', 'commands.typecheck', RAW_TYPECHECK_COMMAND]);

  assert.match(stdout, /^commands\.typecheck would become npm --prefix packages\/storefront run typecheck$/m);
  assert.match(stderr, /commands\.typecheck holds a raw command line/);
  assert.ok(stderr.includes(TYPECHECK_WRAPPER), 'the warning does not name the form to finish with');
  assert.deepEqual(await snapshotTree(dir), before, '--dry-run wrote to the repository');
});

/**
 * The same values by the other route: `commands` is settable whole, and an object written there lands
 * the identical strings a per-key `set` would. A report resolved from the key path alone would see
 * nothing here, and the boundary would be bypassed by the form that fills both keys at once.
 *
 * The negative control writes the wrapper invocations through the same route, so a report firing on
 * every whole-object `set` would fail here rather than pass the assertion above unconditionally.
 */
test('set commands as an object reports every wrapped key the object filled with a raw line', async (t) => {
  const dir = await wiredFixture(t);

  const { stderr } = await configOk(dir, [
    'set',
    'commands',
    JSON.stringify({ typecheck: RAW_TYPECHECK_COMMAND, test: RAW_TEST_COMMAND }),
  ]);

  assert.match(stderr, /commands\.typecheck holds a raw command line/);
  assert.match(stderr, /commands\.test holds a raw command line/);

  const control = await configOk(dir, [
    'set',
    'commands',
    JSON.stringify({ typecheck: TYPECHECK_WRAPPER, test: TEST_COMMAND }),
  ]);
  assert.doesNotMatch(control.stderr, /raw command line/, 'the wrapper form was reported as a mismatch');
});

/**
 * A repository the hand-fill path is actually reached from: the command is declared by a **nested**
 * manifest, so `init` detected none, wrote the placeholder into `commands.typecheck`, and wrote **no
 * wrapper for it at all**. Every case above starts from `wiredFixture`, where `typecheck` was
 * detected and `scripts/typecheck.sh` therefore exists — which is the one state in which the retired
 * clause was true.
 */
async function nestedAppFixture(t) {
  const fixture = await createFixture({
    files: {
      'package.json': { name: 'fixture-project', private: true, version: '0.0.0' },
      [`${NESTED_APP_DIR}/package.json`]: {
        name: 'storefront',
        private: true,
        version: '0.0.0',
        scripts: { typecheck: 'echo typecheck', test: 'echo test' },
      },
    },
  });
  t.after(fixture.cleanup);

  const result = await runCli(fixture.dir, ['init']);
  assert.equal(result.status, 0, `init exited ${result.status}\n${result.stdout}\n${result.stderr}`);
  assert.match(
    readJson(join(fixture.dir, CONFIG_FILE)).commands.typecheck,
    /configure this/,
    'the fixture does not hold the placeholder the hand-fill path starts from',
  );
  assert.equal(
    existsSync(join(fixture.dir, TYPECHECK_WRAPPER_FILE)),
    false,
    'the fixture already holds the wrapper this case exists to be missing',
  );
  return fixture.dir;
}

/** The one warning line, or a failure carrying the whole report. */
function mismatchLine(stderr) {
  const line = stderr.split('\n').find((entry) => entry.includes('holds a raw command line'));
  assert.ok(line, `the set reported no mismatch:\n${stderr}`);
  return line;
}

/**
 * **The ordering, at the boundary where getting it wrong loses the adopter's command line.** The
 * wrapper is written by the *next* `init`, from the raw line this `set` stores — so a message that
 * says the wrapper already runs the line, and tells the adopter to set the invocation now, sends them
 * to a state where nothing holds the line: `init` finds no raw line in the key and only the
 * placeholder in detection, and writes a wrapper that fails.
 *
 * The two halves are asserted separately because they fail separately: the retired clause is a false
 * claim about the repository, and the missing re-run is a lost step. The order of the two remedies is
 * asserted as an order, since both strings would be present in a sentence that named them the wrong
 * way round.
 */
test('set names the re-run before the corrective set, on a key with no wrapper on disk yet', async (t) => {
  const dir = await nestedAppFixture(t);

  const { stderr } = await configOk(dir, ['set', 'commands.typecheck', RAW_TYPECHECK_COMMAND]);

  const line = mismatchLine(stderr);
  assert.ok(!line.includes(RETIRED_RUNS_IT_CLAIM), `the warning claims a wrapper that is not there:\n${line}`);
  assert.match(line, /[Rr]e-run init/, `the warning named no re-run:\n${line}`);
  assert.ok(line.includes(TYPECHECK_WRAPPER), `the warning does not name the form to finish with:\n${line}`);
  assert.ok(
    line.search(/[Rr]e-run init/) < line.indexOf(`set commands.typecheck to ${TYPECHECK_WRAPPER}`),
    `the warning names the corrective set before the re-run that has to precede it:\n${line}`,
  );
});

/**
 * The same message, walked end to end: doing what it says has to leave the repository in the state
 * every ordinary adoption is in — the wrapper carrying the adopter's command line, the key carrying
 * the invocation the permission profile allow-lists, and nothing left to warn about.
 */
test('following the warning inlines the command line and leaves the key clean', async (t) => {
  const dir = await nestedAppFixture(t);
  await configOk(dir, ['set', 'commands.typecheck', RAW_TYPECHECK_COMMAND]);

  const rerun = await runCli(dir, ['init']);
  assert.equal(rerun.status, 0, `init exited ${rerun.status}\n${rerun.stdout}\n${rerun.stderr}`);
  const wrapper = readFileSync(join(dir, TYPECHECK_WRAPPER_FILE), 'utf8');
  assert.ok(wrapper.includes(RAW_TYPECHECK_COMMAND), `the re-run did not inline the command line:\n${wrapper}`);

  const corrective = await configOk(dir, ['set', 'commands.typecheck', TYPECHECK_WRAPPER]);

  assert.equal(readJson(join(dir, CONFIG_FILE)).commands.typecheck, TYPECHECK_WRAPPER);
  assert.doesNotMatch(corrective.stderr, /raw command line/, 'the finished state was reported as a mismatch');
  // The line survives the corrective set, which is the whole point of the order: it is in the file
  // that runs it, not only in the key it was typed into.
  assert.ok(readFileSync(join(dir, TYPECHECK_WRAPPER_FILE), 'utf8').includes(RAW_TYPECHECK_COMMAND));
});

/** The one line of the report carrying `clause`, or a failure carrying the whole report. */
function reportedLine(stderr, clause, subject) {
  const line = stderr.split('\n').find((entry) => entry.includes(clause));
  assert.ok(line, `the set reported nothing about ${subject}:\n${stderr}`);
  return line;
}

/**
 * The answered-`none` state at the command that writes it. Unlike every refusal above, this is an
 * **accepted** `set` whose stored value is read back out of the file — and the assertion that
 * carries the case is a negative one: `wrappedKeyMismatch` is exempt on this key, so the report that
 * tells an adopter to set the key to the wrapper invocation must not fire. That message is an
 * instruction to undo the answer, and `set` is the one caller that reaches the predicate directly.
 */
test('set commands.typecheck to the none sentinel is accepted and prescribes no reversal', async (t) => {
  const dir = await wiredFixture(t);

  const { stderr } = await configOk(dir, ['set', 'commands.typecheck', NONE_SENTINEL]);

  assert.equal(readJson(join(dir, CONFIG_FILE)).commands.typecheck, NONE_SENTINEL);
  assert.ok(!stderr.includes('holds a raw command line'), `the answer was reported as a raw command line:\n${stderr}`);
  assert.ok(
    !stderr.includes(TYPECHECK_WRAPPER),
    `the report tells the adopter to set the answered key to a wrapper invocation, undoing the answer:\n${stderr}`,
  );
  assert.doesNotMatch(stderr, /[Rr]e-run init/, `the report prescribes a re-run against an answered key:\n${stderr}`);
});

/**
 * The near miss, which is not an error: `none` is a legal command line, and a repository whose type
 * check really is a script by that name must still be able to configure it. So the value is stored,
 * and what the command owes is the exact literal to type instead.
 */
test('set commands.typecheck to the word alone stores it and names the exact literal', async (t) => {
  const dir = await wiredFixture(t);

  const { stderr } = await configOk(dir, ['set', 'commands.typecheck', NONE_NEAR_MISS]);

  assert.equal(readJson(join(dir, CONFIG_FILE)).commands.typecheck, NONE_NEAR_MISS);
  const line = reportedLine(stderr, NONE_NEAR_MISS_CLAUSE, 'a value that is nearly the sentinel');
  assert.ok(line.includes(`"${NONE_SENTINEL}"`), `the warning does not name the exact literal to type:\n${line}`);
});

/**
 * **The key-gate negative control**, and the case that fails the moment any consumer drops
 * `answersNone`'s key argument. The sentinel is recognised on `commands.typecheck` alone, so on
 * `commands.test` it is a literal command line: it is warned about, it is stored, and — the half no
 * other case covers — the wrapped-key mismatch still fires, because that key now holds a raw line
 * rather than its wrapper invocation. A value-shape-only reader would silence all three.
 */
test('set commands.test to the sentinel is a command line: warned, stored, and still a mismatch', async (t) => {
  const dir = await wiredFixture(t);

  const { stderr } = await configOk(dir, ['set', 'commands.test', NONE_SENTINEL]);

  assert.equal(readJson(join(dir, CONFIG_FILE)).commands.test, NONE_SENTINEL);
  const gate = reportedLine(stderr, NONE_KEY_GATE_CLAUSE, 'the sentinel on a key it is not recognised on');
  assert.ok(gate.includes(NONE_LITERAL_CLAUSE), `the warning does not say the value is stored as a command line:\n${gate}`);
  assert.match(stderr, /commands\.test holds a raw command line/);
});

/** The one branch-guard warning line, or a failure carrying the whole report. */
function branchGuardLine(stderr) {
  const line = stderr.split('\n').find((entry) => entry.includes(BRANCH_GUARD_PHRASE));
  assert.ok(line, `the set reported nothing about the branch guards:\n${stderr}`);
  return line;
}

/**
 * **The finding's own route.** `config set defaultBranch <new>` changes one key of a pair the guards
 * read together: the sibling key keeps the abandoned name, and the committed hook — the file a push
 * is actually judged by — keeps the branch set it was rendered with. The measured state was a
 * repository whose hook allowed a push to the integration line and refused one to a feature branch,
 * with nothing at the point of edit saying so.
 *
 * All four clauses are asserted separately because they fail separately: the sibling key with no
 * value named is a report an adopter cannot act on, a hook not named is the half of the defect that
 * decides pushes, and a remedy naming one re-render route strands whoever cannot take that one.
 */
test('set defaultBranch names the sibling key and the hook that are now behind', async (t) => {
  const dir = await wiredFixture(t, ['--default-branch', FEATURE_BRANCH]);

  const { stderr } = await configOk(dir, ['set', 'defaultBranch', 'trunk']);

  const line = branchGuardLine(stderr);
  assert.ok(line.includes(`"${FEATURE_BRANCH}"`), `the warning does not name the value protectedBranches still holds:\n${line}`);
  assert.ok(line.includes(SIBLING_KEY_REMEDY), `the warning does not name the edit that changes it:\n${line}`);
  assert.ok(line.includes(PRE_PUSH_HOOK_FILE), `the warning does not name the hook a push is judged by:\n${line}`);
  assert.ok(line.includes('init --force'), `the warning names no re-render route:\n${line}`);
  assert.ok(
    line.includes(`delete ${PRE_PUSH_HOOK_FILE} and re-run`),
    `the warning names only the --force route, stranding an adopter who cannot regenerate everything:\n${line}`,
  );
});

/**
 * The other half of the pair, and the negative control for the sibling clause in the same case: a
 * `set` of `protectedBranches` leaves the hook exactly as stale, so the hook half fires — while the
 * key whose value the sibling clause names is the one that was just set, so that clause has no
 * subject and must not appear.
 */
test('set protectedBranches reports the hook, and not a sibling key it just set', async (t) => {
  const dir = await wiredFixture(t);

  const { stderr } = await configOk(dir, ['set', 'protectedBranches', '["main","release/*"]']);

  const line = branchGuardLine(stderr);
  assert.ok(line.includes(PRE_PUSH_HOOK_FILE), `the warning does not name the hook a push is judged by:\n${line}`);
  assert.ok(line.includes('init --force'), `the warning names no re-render route:\n${line}`);
  assert.ok(!line.includes(SIBLING_KEY_REMEDY), `the warning sends the adopter to the key they just set:\n${line}`);
});

/**
 * The negative control for the report as a whole: a key that reaches neither half of the guard pair
 * gets no branch-guard line. Without it every assertion above would pass with the report firing on
 * every `set`, which is the form of it that would be ignored.
 */
test('a set of a key outside the guard pair reports nothing about the branch guards', async (t) => {
  const dir = await wiredFixture(t);

  const { stderr } = await configOk(dir, ['set', 'commands.test', TEST_COMMAND]);

  assert.ok(!stderr.includes(BRANCH_GUARD_PHRASE), `an unrelated key was reported as a branch-guard edit:\n${stderr}`);
});

/**
 * The negative control for the hook half specifically, on the path `set` reaches with nothing to
 * write: a key re-set to the value it already holds leaves the rendered hook exactly in step, so the
 * clause that says it is behind — and the `init --force` it prescribes, which re-renders every
 * generated create-if-absent artifact behind a single-generation `.bak` — must not fire. The pair
 * fact and the sibling clause still do: neither depends on the hook.
 */
test('set of a key to the value it already holds does not report the hook as behind', async (t) => {
  const dir = await wiredFixture(t, ['--default-branch', FEATURE_BRANCH]);

  const { stdout, stderr } = await configOk(dir, ['set', 'defaultBranch', FEATURE_BRANCH]);

  assert.match(stdout, /already holds that value/, `the set rewrote a file it had nothing to change in:\n${stdout}`);
  const line = branchGuardLine(stderr);
  assert.ok(!line.includes(HOOK_BEHIND_CLAUSE), `an unchanged set claimed the hook is behind:\n${line}`);
  assert.ok(!line.includes('init --force'), `an unchanged set sent the adopter through a full re-render:\n${line}`);
  assert.ok(line.includes(SIBLING_KEY_REMEDY), `the sibling clause was dropped with the hook clause:\n${line}`);
});

/**
 * The other unhandled state, and the one the tree documents as a supported way to force a re-render:
 * with the guard deleted there is no file for a push to be judged by, so naming it as carrying a
 * stale set is a sentence about a file that is not there — and `init --force` is the wrong route,
 * because plain `init` writes a create-if-absent artifact that is absent.
 */
test('set with the guard deleted reports that no hook judges a push, not a stale one', async (t) => {
  const dir = await wiredFixture(t, ['--default-branch', FEATURE_BRANCH]);
  rmSync(join(dir, PRE_PUSH_HOOK_FILE));

  const { stderr } = await configOk(dir, ['set', 'defaultBranch', 'trunk']);

  const line = branchGuardLine(stderr);
  assert.ok(!line.includes(HOOK_BEHIND_CLAUSE), `a hook that is not there was reported as carrying a stale set:\n${line}`);
  assert.ok(
    line.includes(`no readable ${PRE_PUSH_HOOK_FILE}`),
    `the warning does not say the file a push is judged by is missing:\n${line}`,
  );
  assert.ok(!line.includes('init --force'), `the warning prescribes a re-render for a file that is absent:\n${line}`);
});

/**
 * A dry run that withheld the warning would report a success a real run would not have, which is the
 * property `docs/cli.md` §1 states for the flag — the same reason the wrapper report is emitted here.
 */
test('--dry-run on set defaultBranch still reports what would be behind, and writes nothing', async (t) => {
  const dir = await wiredFixture(t, ['--default-branch', FEATURE_BRANCH]);
  const before = await snapshotTree(dir);

  const { stderr } = await configOk(dir, ['--dry-run', 'set', 'defaultBranch', 'trunk']);

  const line = branchGuardLine(stderr);
  assert.ok(line.includes(`"${FEATURE_BRANCH}"`), `the warning does not name the value protectedBranches still holds:\n${line}`);
  assert.ok(line.includes(PRE_PUSH_HOOK_FILE), `the warning does not name the hook a push is judged by:\n${line}`);
  assert.deepEqual(await snapshotTree(dir), before, '--dry-run wrote to the repository');
});

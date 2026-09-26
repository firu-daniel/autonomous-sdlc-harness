/**
 * `doctor` against a wired repository, and against each way of breaking one — acceptance gate 5.
 *
 * **The rule these tests exist to enforce: the exit status is the whole interface, and a warning
 * does not move it.** A caller — CI, the run daemon before it starts a run, an operator's `&&` —
 * branches on `$?` and on nothing else. The condition a freshly wired repository still ships
 * unresolved is the marketplace entry, which needs a published repository; the first test below is
 * what keeps it a warning, because promoting it to a failure would make every freshly wired
 * repository exit non-zero for something no adopter can fix, and a check nobody can make green is a
 * check everybody starts ignoring. The run watcher used to be the second such condition and is not
 * any more — `init` writes it — so the same test now asserts that check **passes**, and the pair
 * below it covers the two states in which it still warns.
 *
 * These run against the **compiled** CLI at `dist/cli.js`, so `npm run build` precedes `npm test`;
 * `runCli` refuses with that sentence rather than leaving a module-resolution error to explain it.
 *
 * ## Four non-obvious choices, and where each comes from
 *
 * 1. **Every failing case is one hand edit to a repository `init` has already wired.** The edit is
 *    what the assertion is about, so a fixture that was never wired — or one broken in two places —
 *    would let a test pass for a reason it does not name. It is also the honest shape of the
 *    failure: a repository stops being green because someone edited it, not because it was generated
 *    wrongly.
 * 2. **`doctor` is asserted to leave the tree byte-identical.** "Repairs nothing, writes nothing" is
 *    what makes it safe to run against a repository in any state at any time, and it is a property
 *    worth proving rather than assuming — the writability probe does create a file inside `stateDir`,
 *    and a snapshot comparison is what shows it was removed again.
 * 3. **Assertions name the check id in the report line, not only the summary counts.** A run that
 *    exited 1 for a different reason than the edit made would otherwise pass, which is the one way a
 *    test like this can be green and worthless.
 * 4. **Cases run concurrently.** Every case is a serial chain of subprocesses, so run one after
 *    another the file uses one core. The cases sit in one `concurrentSuite` and run
 *    `CASE_CONCURRENCY` at a time (`test/helpers/concurrency.mjs`); the three slowest — the
 *    machine-footprint, daemon-path and plugin-permissions cases — also start their subtests together
 *    and await them as one. `HARNESS_TEST_CONCURRENCY=1` runs all of it in series. That is safe
 *    because no case shares anything with another: each builds its own repository with
 *    `wiredFixture`, every machine directory it points the CLI at (`HOME`, `XDG_STATE_HOME`,
 *    `XDG_CONFIG_HOME`, `CLAUDE_CONFIG_DIR`, the stub directories put first on `PATH`) is its own temp
 *    directory handed over through `runCli`'s `env`, a worktree is named after its case's own fixture,
 *    no case writes `process.env`, the only module-level state is read-only, `doctor` itself writes
 *    nothing, and no assertion depends on timing. **A new case keeps to that — its own fixture, every
 *    machine directory its own temp directory passed through `runCli`'s `env`, no `process.env` write,
 *    no timing assertion — or is placed after the suite closes, where it runs alone within this file.**
 */

import assert from 'node:assert/strict';
import {
  accessSync,
  constants as fsConstants,
  existsSync,
  mkdirSync,
  readFileSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { mkdtemp, readdir, realpath, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { basename, delimiter, dirname, join } from 'node:path';
import test from 'node:test';
import { pathToFileURL } from 'node:url';

import { CASE_CONCURRENCY, concurrentSuite } from './helpers/concurrency.mjs';
import {
  createFixture,
  plantModelFiles,
  plantRetrievalRuntime,
  readJson,
  retrievalEnv,
  runCli,
  runGit,
  snapshotTree,
  writeRetrievalConfig,
  PACKAGE_ROOT,
} from './helpers/fixture.mjs';

/**
 * A compiled module of the CLI, imported for the one answer a subprocess cannot be asked for: the
 * slug the machine registry is keyed on. A registry seeded under any other key is a registry the
 * check correctly reports nothing about, so the key has to be the CLI's own — `daemon.test.mjs`
 * pins the *derivation* against a table of literal path → slug pairs, which is what stops the two
 * files agreeing with each other and with nothing else.
 */
async function loadCompiled(relativePath) {
  const path = join(PACKAGE_ROOT, 'dist', relativePath);
  if (!existsSync(path)) {
    throw new Error(
      `${path} is missing. These tests run against the compiled CLI, so run \`npm run build\` before \`npm test\`.`,
    );
  }
  return import(pathToFileURL(path).href);
}

const { repoSlug, renderUnit, unitEnvValue } = await loadCompiled('daemon/units.js');
const { detectBackend } = await loadCompiled('daemon/backend.js');

/**
 * The generator's own reader for what a written hook protects, for the one case that asserts a
 * re-render put a stale entry back. It reads the `case` **label** rather than searching the file,
 * which the hook's own header is the reason for: that file names `release/*` as an example, so a
 * search across it answers yes for a pattern the guard would never match.
 */
const { readProtectedCaseLabel } = await loadCompiled('generators/githooks.js');

/**
 * The schema defaults, for the one case about a key that is **absent**: what such a key stands at is
 * the schema's answer, so a literal spelled here would make the case pass on a value the CLI no
 * longer uses.
 */
const { DEFAULTS } = await loadCompiled('config/model.js');

/**
 * What this host can install a daemon into, and a skip reason when it can install one nowhere.
 *
 * The daemon-path cases below grade an **installed** unit, so they need a backend to render one for;
 * every other case in this file is host-independent in this respect and none of them reads either.
 */
const BACKEND = detectBackend();
const NO_BACKEND = BACKEND.kind === 'none' ? `this host has no service manager: ${BACKEND.reason}` : false;

/** The two generated artifacts these tests edit, addressed as the contract spells them. */
const CONFIG_FILE = 'harness.config.json';
const PROFILE_FILE = '.claude/settings.autonomous.json';
const SETTINGS_FILE = '.claude/settings.json';

/** The script the daemon runs, written by `init` into the configured `scriptsDir`. */
const WATCHER_FILE = 'autonomous-watcher.sh';

/** The generated pre-push guard, at the default `githooksDir` no case in this file moves. */
const HOOK_FILE = 'githooks/pre-push';

/** The ignore file the managed block lives in, and the run-artifact directory at its default. */
const GITIGNORE_FILE = '.gitignore';
const STATE_DIR = 'sdlc-harness';

/** The key a project-scope `plugin marketplace add` writes, and the one this checks the absence of. */
const MARKETPLACES_KEY = 'extraKnownMarketplaces';

/** A slug that is shaped like a published repository, so `--marketplace` writes the entry. */
const FIXTURE_SLUG = 'fixture-owner/fixture-marketplace';

/** A browser tool entry — the one thing a generated profile's `deny` may never name. */
const BROWSER_TOOL = 'mcp__playwright__browser_navigate';

/** The browser wiring's own file, written only for the browser driver, and a driver that is not it. */
const MCP_FILE = '.mcp.json';
const QA_DRIVER_MOBILE = 'mobile-maestro';

/** The profile key naming the servers a run starts — the one the browser-wiring remedy restores. */
const ENABLED_SERVERS_KEY = 'enabledMcpjsonServers';

/** `doctor`'s summary line, with the counts left open and the verdict pinned. */
const CLEAN_SUMMARY = /^Summary: \d+ pass, [1-9]\d* warn, 0 fail — exit 0/m;

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
 * **What comes back has one commit on it**, on the branch the generated config names: the fixture is
 * a repository with no commit, and `init` makes the first commit in any repository it wires that has
 * no commit yet (`commands/init.ts`). A case whose subject is the commit-less state has to build
 * that state after this returns rather than assuming this leaves it — the `default-branch` warning
 * below is the one that does.
 *
 * **It also has an `origin` with the configured branch on it** (`helpers/fixture.mjs`), which is
 * what makes it a repository a run could actually be started in: `remote` is a failing check, so a
 * fixture without one would put every `CLEAN_SUMMARY` assertion in this file on the wrong side of
 * the exit contract. `remote: false` is how the case whose subject *is* that absence gets it.
 */
async function wiredFixture(t, args = [], { remote = true } = {}) {
  const fixture = await createFixture({ files: nodeProjectFiles(), remote });
  t.after(fixture.cleanup);

  const result = await runCli(fixture.dir, ['init', ...args]);
  assert.equal(result.status, 0, `init exited ${result.status}\n${result.stdout}\n${result.stderr}`);
  return fixture.dir;
}

/** A report line, as the reporter emits it: `!! FAIL  <id>  <detail>` on stderr. */
function failLine(id) {
  return new RegExp(`^!! FAIL\\s+${id}\\s`, 'm');
}

/** A report line, as the reporter emits it: `! WARN  <id>  <detail>` on stderr. */
function warnLine(id) {
  return new RegExp(`^! WARN\\s+${id}\\s`, 'm');
}

/** A report line, as the reporter emits it: `PASS  <id>  <detail>` on stdout — narration, unprefixed. */
function passLine(id) {
  return new RegExp(`^PASS\\s+${id}\\s`, 'm');
}

/**
 * A temp directory holding a `jq` that prints one chosen line, to be put **first** on `PATH`.
 *
 * The `jq` check asks what is on this machine, so the only honest way to test each of its answers is
 * to give the command a machine — a real executable it really resolves and really runs — rather than
 * to mock the probe. Prepending keeps the rest of `PATH` intact, so every other check answers exactly
 * as it does in the tests above and the assertion is about the one thing the stub changed.
 *
 * @param {import('node:test').TestContext} t
 * @param {string} line what the stub prints for `jq --version`.
 * @returns {Promise<string>} a `PATH` value with the stub ahead of everything else.
 */
async function jqStubPath(t, line) {
  const dir = await mkdtemp(join(tmpdir(), 'harness-jq-stub-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  writeFileSync(join(dir, 'jq'), `#!/bin/sh\nprintf '%s\\n' ${JSON.stringify(line)}\n`, { mode: 0o755 });
  return `${dir}${delimiter}${process.env.PATH ?? ''}`;
}

/** Where a name resolves to on this machine's `PATH`, or `undefined`. */
function resolveOnPath(name) {
  for (const entry of (process.env.PATH ?? '').split(delimiter)) {
    if (entry === '') continue;
    const candidate = join(entry, name);
    try {
      accessSync(candidate, fsConstants.X_OK);
      return candidate;
    } catch {
      // Not here; keep looking.
    }
  }
  return undefined;
}

/**
 * A `PATH` carrying git and nothing else — the machine an adopter who never installed `jq` has.
 *
 * Built by symlinking the real git into an otherwise empty directory rather than by filtering the
 * machine's own `PATH`: `jq` and git are commonly installed into the *same* directory, so a filter
 * would take git away with it and the fixture's repository checks would fail for a second reason the
 * assertions do not name.
 *
 * @param {import('node:test').TestContext} t
 * @returns {Promise<string>}
 */
async function pathWithoutJq(t) {
  const dir = await mkdtemp(join(tmpdir(), 'harness-nojq-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  const git = resolveOnPath('git');
  assert.ok(git, 'git does not resolve on PATH, so an environment without jq cannot be built for this test');
  symlinkSync(git, join(dir, 'git'));
  return dir;
}

/** Read a JSON file in the fixture, apply an edit in place, and write it back. */
function editJson(dir, relativePath, mutate) {
  const path = join(dir, relativePath);
  const parsed = JSON.parse(readFileSync(path, 'utf8'));
  mutate(parsed);
  writeFileSync(path, `${JSON.stringify(parsed, null, 2)}\n`, 'utf8');
}

/**
 * Read by the plugin-permissions cases below, and loaded here because a top-level `await` cannot
 * sit inside the suite callback. `PLUGIN_KEY` is imported from the compiled CLI for
 * {@link repoSlug}'s reason: a record seeded under any other key is a record the check correctly
 * reports nothing about, so it has to be the CLI's own string rather than this file's guess at it.
 */
const { MARKETPLACE_NAME, PLUGIN_KEY } = await loadCompiled('generators/projectSettings.js');
const { PLUGIN_NAME } = await loadCompiled('core/pluginIdentity.js');

concurrentSuite('doctor', () => { // body deliberately not re-indented: keeps the diff and `git blame` readable

test('doctor exits 0 on a freshly wired repository, warnings and all, and writes nothing', async (t) => {
  const dir = await wiredFixture(t);
  const before = await snapshotTree(dir);

  const { status, stdout, stderr } = await runCli(dir, ['doctor']);

  assert.equal(status, 0, `doctor exited ${status}\n${stdout}\n${stderr}`);
  assert.match(stdout, CLEAN_SUMMARY);
  // The script the daemon runs is written by the `init` this fixture just ran, so the check that
  // used to warn here reports it as present. A warning would mean the writer and the resolver
  // disagree about where it goes, which is a defect neither one reports on its own.
  assert.match(stdout, passLine('run-watcher'));
  assert.doesNotMatch(stderr, warnLine('run-watcher'));
  assert.deepEqual(await snapshotTree(dir), before, 'doctor wrote to the repository it was asked about');
});

test('the run-watcher check follows a custom scriptsDir', async (t) => {
  // `scriptsDir` is set before `init`, so the watcher is written where the resolver will look rather
  // than moved afterwards: the assertion is about the two agreeing, not about one of them.
  const fixture = await createFixture({ files: nodeProjectFiles() });
  t.after(fixture.cleanup);
  await runCli(fixture.dir, ['init']);
  editJson(fixture.dir, CONFIG_FILE, (config) => {
    config.scriptsDir = 'tools/harness';
  });
  const rewired = await runCli(fixture.dir, ['init']);
  assert.equal(rewired.status, 0, `the second init exited ${rewired.status}\n${rewired.stdout}\n${rewired.stderr}`);

  const watcher = join(fixture.dir, 'tools/harness', WATCHER_FILE);
  assert.ok(existsSync(watcher), `init did not write the watcher into the configured scriptsDir (${watcher})`);

  const { status, stdout, stderr } = await runCli(fixture.dir, ['doctor']);

  assert.equal(status, 0, `doctor exited ${status}\n${stdout}\n${stderr}`);
  assert.match(stdout, passLine('run-watcher'));
  assert.ok(stdout.includes(watcher), `the run-watcher check did not name the path under scriptsDir:\n${stdout}`);
});

test('a deleted run watcher warns and leaves the exit status at 0', async (t) => {
  const dir = await wiredFixture(t);
  await rm(join(dir, 'scripts', WATCHER_FILE));

  const { status, stdout, stderr } = await runCli(dir, ['doctor']);

  // Still a warning, for a new reason: the daemon is opt-in, and a repository whose watcher was
  // deleted is one `init` from repaired — not a repository that cannot be worked in.
  assert.equal(status, 0, `doctor exited ${status} on a condition that only warns\n${stdout}\n${stderr}`);
  assert.match(stderr, warnLine('run-watcher'));
  assert.match(stderr, /Re-run `init`/);
  assert.match(stdout, CLEAN_SUMMARY);
});

test('a sibling worktree is covered by the profile\'s worktree pattern and does not warn', async (t) => {
  const dir = await wiredFixture(t);
  // `init`'s own first commit is what makes the next two steps possible at all — `git worktree add`
  // cannot prepare a checkout from a repository with no commit, and the profile has to be *committed*
  // for the second checkout to carry it. This case used to make that commit by hand; it is now the
  // wiring run's, so the precondition is checked rather than re-created.
  await configuredBranchWithCommit(dir);

  // A real second checkout, made the way an adopter's run makes one, rather than a hand-written
  // profile: the assertion is about the glob the generator actually emitted, and only a worktree at a
  // path that glob matches — `<work_root>/<project>-*`, `core/paths.ts` — exercises it.
  const worktree = `${dir}-feature_x`;
  await runGit(dir, ['worktree', 'add', '-b', 'feature_x', worktree]);
  t.after(() => rm(worktree, { recursive: true, force: true }));

  // What makes this case the one the check used to get wrong: the committed profile carries no
  // occurrence of this checkout's path at all, so the pattern is the only thing that can cover it.
  const profile = readFileSync(join(worktree, PROFILE_FILE), 'utf8');
  assert.ok(!profile.includes(worktree), `${PROFILE_FILE} names the worktree literally, so this case proves nothing`);

  const { status, stdout, stderr } = await runCli(worktree, ['doctor']);

  // The remediation is what makes a false warning here expensive rather than merely noisy: `init
  // --force` inside a worktree regenerates the *committed* profile against the worktree's own path
  // and leaves the main checkout named by nothing.
  assert.doesNotMatch(stderr, warnLine('profile-paths'), `doctor warned about the profile's paths in a worktree the profile covers\n${stderr}`);
  assert.equal(status, 0, `doctor exited ${status} in a sibling worktree of a wired repository\n${stdout}\n${stderr}`);
  assert.match(stdout, CLEAN_SUMMARY);
});

test('a profile generated for another directory still warns, and leaves the exit status at 0', async (t) => {
  const dir = await wiredFixture(t);

  // The moved-or-copied checkout, as one hand edit: every path in the profile is re-pointed at a
  // directory name this repository does not have, which re-points the worktree pattern with it. The
  // case exists so that teaching the check about patterns cannot be done by making it answer yes to
  // everything — that fix would pass the worktree test above and lose the condition entirely.
  //
  // The new name is a *prefix* of the old rather than a suffix on purpose: a directory named by
  // appending to this one would carry this root as a literal substring, and the case would be decided
  // by the substring branch instead of by the pattern branch it is written for.
  const profilePath = join(dir, PROFILE_FILE);
  const elsewhere = `moved-${basename(dir)}`;
  writeFileSync(profilePath, readFileSync(profilePath, 'utf8').split(basename(dir)).join(elsewhere), 'utf8');

  const { status, stdout, stderr } = await runCli(dir, ['doctor']);

  assert.equal(status, 0, `doctor exited ${status} on a condition that only warns\n${stdout}\n${stderr}`);
  assert.match(stderr, warnLine('profile-paths'));
  assert.match(stdout, CLEAN_SUMMARY);
});

test('a stateDir that is dot-named, or reaches through a dot segment, fails', async (t) => {
  // Both spellings, because the schema states them as two clauses and only the second catches the
  // traversal: the character class admits `.` and `/` after the first character, so a check that
  // applied the pattern alone would accept a value resolving to a dot-directory at run time.
  for (const value of ['.sdlc-harness', 'sdlc/../.claude']) {
    await t.test(value, async (subtest) => {
      const dir = await wiredFixture(subtest);
      editJson(dir, CONFIG_FILE, (config) => {
        config.stateDir = value;
      });

      const { status, stderr } = await runCli(dir, ['doctor']);

      assert.equal(status, 1);
      assert.match(stderr, failLine('state-dir'));
      assert.match(stderr, /path segment starting with '\.'/);
      // The cause, not the symptom: an adopter who reads only "illegal name" tidies it toward a
      // dot-name, which is the exact change that loses every artifact of an unattended run.
      assert.match(stderr, /an unattended run may not write to/);
    });
  }
});

test('a repository whose config has been removed fails, and says what to run', async (t) => {
  const dir = await wiredFixture(t);
  await rm(join(dir, CONFIG_FILE));

  const { status, stderr } = await runCli(dir, ['doctor']);

  assert.equal(status, 1);
  assert.match(stderr, failLine('config'));
  assert.match(stderr, /npx autonomous-sdlc-harness init/);
});

/** The nested application whose hand-fill path produces the state the command-wrappers check grades. */
const NESTED_APP_DIR = 'packages/storefront';

/** The clause the one message builder in `generators/scripts.ts` opens with, matched as a clause. */
const WRAPPED_KEY_MISMATCH = 'holds a raw command line';

/** The answered-`none` sentinel, as an adopter writes it into `commands.typecheck`. */
const NONE_SENTINEL = '<none>';

/** The clause the two command checks name an answered key with — one spelling, both lines. */
const ANSWERED_NONE_CLAUSE = 'this repository has no such command';

/**
 * The keys a command check's *not graded* sentence lists as unset or still holding the placeholder.
 *
 * Read as a list rather than by substring, because the assertion the answered-`none` cases need is
 * that a key is **absent from this clause** while present elsewhere on the same line — which a
 * `includes` over the whole line cannot express.
 */
function unfilledKeys(line) {
  const match = /each of (.+?) is unset or still holds the placeholder/.exec(line);
  return match === null ? [] : match[1].split(', ');
}

/**
 * A wrapped `commands.*` key holding a raw command line is graded by `doctor`, and a report that
 * used to be all-green about a repository whose verification commands an unattended run is refused
 * now names the state.
 *
 * **Case (a) is the measured configuration**, and it discharges the `doctor` half of the finding's
 * `either … or …`: the mismatch is *named*. The trailing conjunct — *a subsequent run whose stream
 * carries no `permission_denied` for a configured verification command* — comes from a live agent
 * session, which a subprocess over a throwaway fixture cannot produce, and nothing on this branch
 * makes it true in any case: the raw line stays in `commands.typecheck` by design until the adopter
 * acts on this warning.
 *
 * **Case (c) is the disjointness assertion**, and it is why this is a second check rather than an
 * arm of the config one: the two grade different keys of the same file and neither answers for the
 * other.
 */
test('doctor grades a wrapped commands key holding a raw command line', async (t) => {
  await t.test('a hand-filled raw line warns, names both strings, and leaves the exit status at 0', async (subtest) => {
    const dir = await wiredFixture(subtest);
    // The remedy the undetected-command warning prescribes, applied literally: the root-anchored raw
    // command line a nested application needs, in the key the permission profile refuses it in.
    const rawLine = `npm --prefix ${NESTED_APP_DIR} run typecheck`;
    editJson(dir, CONFIG_FILE, (config) => {
      config.commands.typecheck = rawLine;
    });

    const { status, stdout, stderr } = await runCli(dir, ['doctor']);

    assert.equal(status, 0, `doctor exited ${status} on a condition that only warns\n${stdout}\n${stderr}`);
    assert.match(stderr, warnLine('command-wrappers'));
    const line = stderr.split('\n').find((entry) => entry.includes(WRAPPED_KEY_MISMATCH));
    assert.ok(line, `the report named no mismatch:\n${stderr}`);
    assert.ok(line.includes(rawLine), `the warning did not name the configured value:\n${line}`);
    assert.ok(line.includes('bash scripts/typecheck.sh'), `the warning did not name the value to set:\n${line}`);
    // The neighbouring question this check is not: the file is still structurally valid, and the
    // config line says so on the same report.
    assert.match(stdout, passLine('config'));
    assert.match(stdout, CLEAN_SUMMARY);
  });

  await t.test('the wrapper invocation every ordinary adoption holds passes', async (subtest) => {
    const dir = await wiredFixture(subtest);

    const { status, stdout, stderr } = await runCli(dir, ['doctor']);

    assert.equal(status, 0, `doctor exited ${status}\n${stdout}\n${stderr}`);
    assert.match(stdout, passLine('command-wrappers'));
    assert.doesNotMatch(stderr, warnLine('command-wrappers'));
    // Adding a check may not move a freshly wired repository off the exit contract.
    assert.match(stdout, CLEAN_SUMMARY);
  });

  await t.test('a key still holding the placeholder is the config check\'s line, not this one\'s', async (subtest) => {
    // No manifest, so nothing is detected and every command key keeps the placeholder `init` wrote.
    const fixture = await createFixture({ files: { 'README.md': '# fixture\n' } });
    subtest.after(fixture.cleanup);
    const wired = await runCli(fixture.dir, ['init']);
    assert.equal(wired.status, 0, `init exited ${wired.status}\n${wired.stdout}\n${wired.stderr}`);
    const config = readJson(join(fixture.dir, CONFIG_FILE));
    assert.match(config.commands.test, /configure this/, 'the fixture does not hold a placeholder to grade');

    const { status, stdout, stderr } = await runCli(fixture.dir, ['doctor']);

    assert.equal(status, 0, `doctor exited ${status} on a placeholder, which only warns\n${stdout}\n${stderr}`);
    assert.match(stdout, passLine('command-wrappers'));
    assert.match(stderr, warnLine('config'));
    assert.doesNotMatch(stderr, new RegExp(`^! WARN\\s+command-wrappers\\s.*${WRAPPED_KEY_MISMATCH}`, 'm'));
  });

  await t.test('a raw deploy command is named as deploy.command, the key it lives on', async (subtest) => {
    const dir = await wiredFixture(subtest);
    editJson(dir, CONFIG_FILE, (config) => {
      config.deploy = { command: 'npx firebase deploy --only hosting' };
    });

    const { status, stdout, stderr } = await runCli(dir, ['doctor']);

    assert.equal(status, 0, `doctor exited ${status} on a condition that only warns\n${stdout}\n${stderr}`);
    assert.match(stderr, warnLine('command-wrappers'));
    const line = stderr.split('\n').find((entry) => entry.includes(WRAPPED_KEY_MISMATCH));
    assert.ok(line, `the report named no mismatch:\n${stderr}`);
    // `deploy` is the one wrapped key whose command line is not under `commands`, so a message
    // spelling the key family would name a `commands.deploy` no config has.
    assert.ok(line.includes('deploy.command'), `the warning named the wrong key:\n${line}`);
    assert.ok(line.includes('bash scripts/deploy.sh'), `the warning did not name the deploy wrapper:\n${line}`);
  });
});

/**
 * `commands.typecheck` answered `<none>`, graded by the four checks that read the key.
 *
 * **The first case's fixture is the placeholder one** — no manifest, so `init` detected nothing —
 * which is the repository in which the two command checks reach their *not graded* sentence.
 * The edit is a single one to a repository `init` wired, and nothing is deleted: the ratified
 * record's stated residue is that an already-rendered wrapper stays on disk, so a case asserting a
 * removal would assert a behaviour the decision does not have.
 *
 * **The second case is the graded sentence**, on the wired fixture, and it is the `preset-php` shape:
 * every ordinary adoption has another wrapped key holding a command line, so a clause carried only by
 * the *not graded* sentence would leave the answered key named by no check anywhere in the report.
 *
 * **The third case is the key gate.** Every arm here is gated on `answersNone(key, …)`, so the
 * failure mode is a consumer "simplified" to a test of the value alone — which would skip the same
 * string on `commands.test` while `config/check.ts` warns that the value will be run.
 */
test('doctor grades commands.typecheck answered <none> as answered rather than as unfilled', async (t) => {
  await t.test('every check that reads the key grades it answered, and the exit status does not move', async (subtest) => {
    const fixture = await createFixture({ files: { 'README.md': '# fixture\n' } });
    subtest.after(fixture.cleanup);
    const wired = await runCli(fixture.dir, ['init']);
    assert.equal(wired.status, 0, `init exited ${wired.status}\n${wired.stdout}\n${wired.stderr}`);
    // The baseline the exit contract is asserted against, taken from the same repository before the
    // edit: a literal 0 alone would not show that the answer moved nothing.
    const baseline = await runCli(fixture.dir, ['doctor']);

    editJson(fixture.dir, CONFIG_FILE, (config) => {
      config.commands.typecheck = NONE_SENTINEL;
    });
    const before = await snapshotTree(fixture.dir);

    const { status, stdout, stderr } = await runCli(fixture.dir, ['doctor']);

    assert.equal(status, baseline.status, `the answer moved the exit status to ${status}\n${stdout}\n${stderr}`);
    assert.equal(status, 0, `doctor exited ${status} on a repository whose adopter answered a key\n${stdout}\n${stderr}`);

    // The config check: it passes the answered key silently, while still reporting the key beside it
    // that really is unfilled — which is what makes the negative half evidence rather than silence.
    const configWarning = warnBlock(stderr, 'config');
    assert.ok(configWarning, `the config check reported no placeholder, so this fixture grades nothing:\n${stderr}`);
    assert.ok(configWarning.includes('commands.test'), `the config check dropped the key that is unfilled:\n${configWarning}`);
    assert.ok(!configWarning.includes('commands.typecheck'), `the answered key was reported as a placeholder:\n${configWarning}`);

    // command-wrappers: named as answered, and not counted among the unset-or-placeholder keys.
    assert.match(stdout, passLine('command-wrappers'));
    const wrappers = reportLine(stdout, 'pass', 'command-wrappers');
    assert.ok(wrappers.includes('commands.typecheck answers'), `the answered key is not named as answered:\n${wrappers}`);
    assert.ok(wrappers.includes(ANSWERED_NONE_CLAUSE), `the line does not say what the answer means:\n${wrappers}`);
    assert.ok(
      !unfilledKeys(wrappers).includes('commands.typecheck'),
      `the answered key is listed as unset or still holding the placeholder:\n${wrappers}`,
    );
    assert.ok(unfilledKeys(wrappers).includes('commands.test'), `the unfilled key left that clause too:\n${wrappers}`);

    // command-permissions: an answered key implies no wrapper, so it grades no entry for one.
    assert.match(stdout, passLine('command-permissions'));
    const permissions = reportLine(stdout, 'pass', 'command-permissions');
    assert.ok(permissions.includes('commands.typecheck answers'), `the answered key is not named as answered:\n${permissions}`);
    assert.ok(permissions.includes(ANSWERED_NONE_CLAUSE), `the line does not say what the answer means:\n${permissions}`);
    assert.ok(
      !unfilledKeys(permissions).includes('commands.typecheck'),
      `the answered key is listed as unset or still holding the placeholder:\n${permissions}`,
    );

    // command-resolves: no binary is demanded for it, which is the `commandHeads` skip.
    assert.match(stdout, passLine('command-resolves'));
    assert.doesNotMatch(stderr, warnLine('command-resolves'));
    const resolves = reportLine(stdout, 'pass', 'command-resolves');
    assert.ok(!resolves.includes(NONE_SENTINEL), `the sentinel is graded as a binary name:\n${resolves}`);
    assert.ok(!resolves.includes('commands.typecheck'), `a binary is demanded for the answered key:\n${resolves}`);

    assert.deepEqual(await snapshotTree(fixture.dir), before, 'doctor wrote to the repository it was asked about');
  });

  await t.test('a repository that grades another wrapped key still names the answered one', async (subtest) => {
    // The wired fixture: `commands.test` holds its wrapper invocation, so both command checks take
    // their **graded** branch. This is the shape every ordinary adoption has — `preset-php` resolves
    // a test command and no typecheck — and the state is invisible in the whole report if the clause
    // rides the *not graded* sentence alone.
    const dir = await wiredFixture(subtest);
    editJson(dir, CONFIG_FILE, (config) => {
      config.commands.typecheck = NONE_SENTINEL;
    });

    const { status, stdout, stderr } = await runCli(dir, ['doctor']);

    assert.equal(status, 0, `doctor exited ${status} on a repository whose adopter answered a key\n${stdout}\n${stderr}`);

    for (const id of ['command-wrappers', 'command-permissions']) {
      assert.match(stdout, passLine(id));
      const line = reportLine(stdout, 'pass', id);
      // The graded half, asserted first: a check that stopped grading the filled key would satisfy
      // the answered-clause assertions below off its *not graded* sentence.
      assert.ok(line.includes('commands.test'), `${id} stopped grading the filled key:\n${line}`);
      assert.ok(!line.includes('not graded'), `${id} took its ungraded branch, so this is the other case:\n${line}`);
      assert.ok(line.includes('commands.typecheck answers'), `${id} left the answered key unnamed:\n${line}`);
      assert.ok(line.includes(ANSWERED_NONE_CLAUSE), `${id} does not say what the answer means:\n${line}`);
    }
  });

  await t.test('the same string on commands.test is a command line command-resolves does not skip', async (subtest) => {
    // The negative control for `commandHeads`'s key gate. `commands.test` holding the sentinel is a
    // raw command line the run will invoke, so this check has to reach it — a value-shape-only skip
    // would pass over it in silence while `config/check.ts` warns that it will be run.
    const dir = await wiredFixture(subtest);
    editJson(dir, CONFIG_FILE, (config) => {
      config.commands.test = NONE_SENTINEL;
    });

    const { status, stdout, stderr } = await runCli(dir, ['doctor']);

    assert.equal(status, 0, `doctor exited ${status} on a condition that only warns\n${stdout}\n${stderr}`);
    const line = reportLine(stderr, 'warn', 'command-resolves') ?? reportLine(stdout, 'pass', 'command-resolves');
    assert.ok(line, `command-resolves emitted no report at all:\n${stdout}\n${stderr}`);
    assert.ok(line.includes('commands.test'), `command-resolves passed over commands.test silently:\n${line}`);
  });
});

/** Where `init` writes the wrappers at the configured default, as the other suites spell it. */
const SCRIPTS_DIR = 'scripts';

/** The two verification keys a run that `init` detected nothing for fills in, and their wrappers. */
const HAND_FILLED = Object.freeze([
  Object.freeze({ key: 'typecheck', file: 'typecheck.sh' }),
  Object.freeze({ key: 'test', file: 'test.sh' }),
]);

/** A wrapper that exists and runs — the check asks whether the file is readable, not what it does. */
const WRAPPER_BODY = '#!/usr/bin/env bash\nexit 0\n';

/** The heading the missing entries are printed under, so a paste lands in the list they belong in. */
const PASTE_HEADING = 'permissions.allow:';

/** The clause the absent-wrapper sentence opens with, matched as a clause. */
const WRAPPER_NOT_READABLE = 'is not readable under';

/**
 * The three `permissions.allow` entries one wrapper implies: the repo-relative invocation, its
 * repo-root-absolute twin, and its sibling-worktree twin.
 *
 * Spelled here rather than read back from the generator the check itself calls — a case that derived
 * its expectation from the producer under test would go on passing against a producer that had
 * changed shape. `init.test.mjs` states the same three forms for the writer's side.
 */
function wrapperAllowEntries(dir, projectName, file) {
  const worktreeGlob = join(dirname(dir), `${projectName}-*`);
  return [
    `Bash(bash ${SCRIPTS_DIR}/${file}:*)`,
    `Bash(bash ${join(dir, SCRIPTS_DIR, file)}:*)`,
    `Bash(bash ${join(worktreeGlob, SCRIPTS_DIR, file)}:*)`,
  ];
}

/**
 * One report entry's whole detail: its `! WARN <id>` line and the lines it continues onto, up to the
 * next entry.
 *
 * A multi-line detail is why this exists — the pasteable entries are printed one per line under a
 * heading, so `stderr.includes(…)` alone would let another check's warning satisfy an assertion this
 * one is about, and the absence assertion below would be decided by wording elsewhere in the report.
 */
function warnBlock(stderr, id) {
  const lines = stderr.split('\n');
  const start = lines.findIndex((line) => warnLine(id).test(line));
  if (start === -1) return undefined;
  const rest = lines.slice(start + 1);
  const next = rest.findIndex((line) => /^(!! FAIL|! WARN)\s/.test(line));
  return [lines[start], ...(next === -1 ? rest : rest.slice(0, next))].join('\n');
}

/**
 * A repository in the state Finding 41 measured: `init` detected no commands, so it wrote the
 * placeholders and neither wrapper nor entry; the two verification keys were then filled in by hand
 * with the wrapper invocations and the wrapper files written beside them — the finding's *"the run
 * then supplied the commands itself"*.
 *
 * The starting state is **asserted rather than assumed**: a fixture whose profile already carried the
 * entries would let case (a) below pass while grading nothing.
 */
async function handFilledFixture(t) {
  // No manifest, so detection resolves nothing — the same seed the placeholder case above uses.
  const fixture = await createFixture({ files: { 'README.md': '# fixture\n' } });
  t.after(fixture.cleanup);
  const wired = await runCli(fixture.dir, ['init']);
  assert.equal(wired.status, 0, `init exited ${wired.status}\n${wired.stdout}\n${wired.stderr}`);

  const { permissions } = readJson(join(fixture.dir, PROFILE_FILE));
  for (const { file } of HAND_FILLED) {
    assert.ok(
      !permissions.allow.some((entry) => entry.includes(file)),
      `init allow-listed ${file} on a repository it detected no command for, so this fixture is not the state the finding measured`,
    );
  }

  editJson(fixture.dir, CONFIG_FILE, (config) => {
    for (const { key, file } of HAND_FILLED) config.commands[key] = `bash ${SCRIPTS_DIR}/${file}`;
  });
  for (const { file } of HAND_FILLED) {
    writeFileSync(join(fixture.dir, SCRIPTS_DIR, file), WRAPPER_BODY, { mode: 0o755 });
  }
  return fixture.dir;
}

/** The `projectName` the generated config carries, which the worktree form of every entry is built on. */
function projectNameOf(dir) {
  return readJson(join(dir, CONFIG_FILE)).projectName;
}

/**
 * The entries a filled `commands.*` key implies are graded, in both directions Finding 41 owes: a
 * repository whose keys were filled after `init` is warned and told what to paste, and a normally
 * detected one hears nothing from the first run onward.
 *
 * The fourth case is the other half of the same check: a wrapper **file** that is not there is a
 * different repair from an entry that is not there — `init` writes the file, `init --force`
 * regenerates the profile — so a report that merged the two would print an instruction that cannot be
 * followed.
 */
test('doctor grades the permission entries a filled commands key implies', async (t) => {
  await t.test('a hand-filled key with no entry warns, names every line to paste, and leaves the exit status at 0', async (subtest) => {
    const dir = await handFilledFixture(subtest);
    const before = await snapshotTree(dir);

    const { status, stdout, stderr } = await runCli(dir, ['doctor']);

    assert.equal(status, 0, `doctor exited ${status} on a condition that only warns\n${stdout}\n${stderr}`);
    assert.match(stderr, warnLine('command-permissions'));
    const block = warnBlock(stderr, 'command-permissions');
    assert.ok(block, `the report carried no command-permissions warning:\n${stderr}`);
    assert.ok(block.includes(PASTE_HEADING), `the warning named no list to paste into:\n${block}`);
    for (const { file } of HAND_FILLED) {
      for (const entry of wrapperAllowEntries(dir, projectNameOf(dir), file)) {
        assert.ok(block.includes(entry), `the warning did not name ${entry}:\n${block}`);
      }
    }
    // The neighbouring questions this check is not, answered clean on the same report: the config is
    // structurally valid, and every filled key holds its wrapper invocation rather than a raw line.
    assert.match(stdout, passLine('config'));
    assert.match(stdout, passLine('command-wrappers'));
    assert.match(stdout, CLEAN_SUMMARY);
    assert.deepEqual(await snapshotTree(dir), before, 'doctor wrote to the repository it was asked about');
  });

  await t.test('init --force writes the entries and the check goes silent', async (subtest) => {
    const dir = await handFilledFixture(subtest);
    const forced = await runCli(dir, ['init', '--force']);
    assert.equal(forced.status, 0, `init --force exited ${forced.status}\n${forced.stdout}\n${forced.stderr}`);

    const { status, stdout, stderr } = await runCli(dir, ['doctor']);

    assert.equal(status, 0, `doctor exited ${status}\n${stdout}\n${stderr}`);
    // On the check's status rather than on how much the report says: it names every finding, so a
    // case asserting the text got shorter would be graded by the other checks' wording.
    assert.match(stdout, passLine('command-permissions'));
    assert.doesNotMatch(stderr, warnLine('command-permissions'));
    // What the remedy actually did, so that silence here is the entries being present rather than the
    // check having stopped grading the keys it was warning about.
    const { permissions } = readJson(join(dir, PROFILE_FILE));
    for (const { file } of HAND_FILLED) {
      for (const entry of wrapperAllowEntries(dir, projectNameOf(dir), file)) {
        assert.ok(permissions.allow.includes(entry), `init --force left ${entry} out of ${PROFILE_FILE}`);
      }
    }
  });

  await t.test('a normally detected repository passes on the first doctor run', async (subtest) => {
    const dir = await wiredFixture(subtest);
    // Not vacuous: the entries this check grades really are in the profile the wiring run just wrote,
    // so a pass is the check finding them rather than finding nothing to grade.
    const { permissions } = readJson(join(dir, PROFILE_FILE));
    for (const { file } of HAND_FILLED) {
      for (const entry of wrapperAllowEntries(dir, projectNameOf(dir), file)) {
        assert.ok(permissions.allow.includes(entry), `a freshly wired repository does not carry ${entry}`);
      }
    }

    const { status, stdout, stderr } = await runCli(dir, ['doctor']);

    assert.equal(status, 0, `doctor exited ${status}\n${stdout}\n${stderr}`);
    assert.match(stdout, passLine('command-permissions'));
    assert.doesNotMatch(stderr, warnLine('command-permissions'));
    // Adding a check may not move a freshly wired repository off the exit contract.
    assert.match(stdout, CLEAN_SUMMARY);
  });

  await t.test('a deleted wrapper is its own sentence, not a line in the paste list', async (subtest) => {
    const dir = await wiredFixture(subtest);
    // One hand edit to a wired repository: the entries stay exactly as `init` wrote them, and the file
    // they name goes away — the half of this check `init --force` would not repair.
    const wrapper = HAND_FILLED[1].file;
    await rm(join(dir, SCRIPTS_DIR, wrapper));

    const { status, stdout, stderr } = await runCli(dir, ['doctor']);

    assert.equal(status, 0, `doctor exited ${status} on a condition that only warns\n${stdout}\n${stderr}`);
    assert.match(stderr, warnLine('command-permissions'));
    const block = warnBlock(stderr, 'command-permissions');
    assert.ok(block, `the report carried no command-permissions warning:\n${stderr}`);
    const sentence = block.split('\n').find((line) => line.includes(WRAPPER_NOT_READABLE));
    assert.ok(sentence, `the warning did not name the missing wrapper as a sentence of its own:\n${block}`);
    assert.ok(sentence.includes(`${SCRIPTS_DIR}/${wrapper}`), `the sentence named no wrapper path:\n${sentence}`);
    assert.ok(!block.includes(PASTE_HEADING), `the missing file was folded into the paste list:\n${block}`);
    assert.match(stdout, CLEAN_SUMMARY);
  });
});

test('a browser tool in the permission profile deny list fails', async (t) => {
  const dir = await wiredFixture(t);
  editJson(dir, PROFILE_FILE, (profile) => {
    profile.permissions.deny.push(BROWSER_TOOL);
  });

  const { status, stderr } = await runCli(dir, ['doctor']);

  assert.equal(status, 1);
  assert.match(stderr, failLine('profile-browser-deny'));
  // Graded a failure rather than a warning because it is the one profile edit that silently
  // disables a whole phase: a deny wins over the agent's own explicit grant.
  assert.match(stderr, /cannot be overridden/);
});

test('a jq at or above the floor passes and names the version', async (t) => {
  const dir = await wiredFixture(t);
  const PATH = await jqStubPath(t, 'jq-1.7.1');

  const { status, stdout, stderr } = await runCli(dir, ['doctor'], { PATH });

  assert.equal(status, 0, `doctor exited ${status} with a jq above the floor\n${stdout}\n${stderr}`);
  assert.match(stdout, passLine('jq'));
  assert.match(stdout, /1\.7/);
  assert.match(stdout, CLEAN_SUMMARY);
});

test('a jq below the 1.5 floor fails, names the version, and says why it is invisible', async (t) => {
  const dir = await wiredFixture(t);
  const PATH = await jqStubPath(t, 'jq-1.4');

  const { status, stderr } = await runCli(dir, ['doctor'], { PATH });

  assert.equal(status, 1);
  assert.match(stderr, failLine('jq'));
  assert.match(stderr, /1\.4/);
  // The cause, not the symptom, and the reason this check exists at all: an old jq is a *compile*
  // error in both configuration loaders, so the guards and the scripts read every repository as one
  // whose configuration cannot be resolved — while the diagnostic an operator reaches for first
  // keeps succeeding.
  assert.match(stderr, /compile error/);
  assert.match(stderr, /command -v jq/);
});

test('no jq on PATH at all fails, with the rest of the environment answering normally', async (t) => {
  const dir = await wiredFixture(t);
  const PATH = await pathWithoutJq(t);

  const { status, stdout, stderr } = await runCli(dir, ['doctor'], { PATH });

  assert.equal(status, 1);
  assert.match(stderr, failLine('jq'));
  // git resolving proves the environment was stripped of jq and of nothing else that matters, so
  // the failure above is the absence this test arranged rather than a broken PATH.
  assert.match(stdout, passLine('git'));
});

test('a jq whose version string is unrecognizable warns and leaves the exit status at 0', async (t) => {
  const dir = await wiredFixture(t);
  const PATH = await jqStubPath(t, 'jq (unversioned build)');

  const { status, stdout, stderr } = await runCli(dir, ['doctor'], { PATH });

  // A warning, because jq is *present*: failing a repository over a string this check does not
  // recognise would be a finding nobody can make green, and the harness may well work.
  assert.equal(status, 0, `doctor exited ${status} on a condition that only warns\n${stdout}\n${stderr}`);
  assert.match(stderr, warnLine('jq'));
  assert.match(stdout, CLEAN_SUMMARY);
});

test('the jq check answers the same in a repository whose config is gone', async (t) => {
  const dir = await wiredFixture(t);
  await rm(join(dir, CONFIG_FILE));
  const PATH = await jqStubPath(t, 'jq-1.7.1');

  const { status, stdout, stderr } = await runCli(dir, ['doctor'], { PATH });

  // Both problems are reported: the floor is a property of the machine, so an unreadable config
  // neither masks the jq answer nor is masked by it.
  assert.equal(status, 1);
  assert.match(stderr, failLine('config'));
  assert.match(stdout, passLine('jq'));
});

/**
 * The upgrade path the ignore-rules check exists for, seeded exactly as an upgraded repository holds
 * it: the two lines a current `init` writes, with the whole-directory rule an earlier release wrote
 * **above** them, because that order is the whole of why the exception below it does nothing.
 *
 * Written back through `init`'s own managed block rather than as a hand-made file, so what the check
 * reads is the block a re-run would produce over a pre-upgrade one.
 */
function seedSupersededClarificationsRule(dir, { comments = true } = {}) {
  const path = join(dir, GITIGNORE_FILE);
  const original = readFileSync(path, 'utf8');
  const contentsRule = `${STATE_DIR}/clarifications/*`;
  assert.ok(
    original.includes(`\n${contentsRule}\n`),
    `the generated ignore block carries no \`${contentsRule}\` line, so the legacy rule cannot be placed above it`,
  );
  const legacy = [
    ...(comments
      ? [
          '# The clarification channel is created on first write rather than by init, so it has no committed',
          '# README, which makes it the one part of the tree that can be ignored as a whole directory.',
        ]
      : []),
    `${STATE_DIR}/clarifications/`,
  ].join('\n');
  writeFileSync(path, original.replace(`\n${contentsRule}\n`, `\n${legacy}\n${contentsRule}\n`), 'utf8');
  return path;
}

test('a freshly wired repository passes the ignore-rules check', async (t) => {
  const dir = await wiredFixture(t);

  const { status, stdout, stderr } = await runCli(dir, ['doctor']);

  // The pass is the control for the two failing cases below, and it is also what keeps the check's
  // comment markers honest: they are substrings, and the current template's own prose must not
  // contain either of them.
  assert.equal(status, 0, `doctor exited ${status}\n${stdout}\n${stderr}`);
  assert.match(stdout, passLine('ignore-rules'));
  assert.doesNotMatch(stderr, warnLine('ignore-rules'));
});

test('a surviving whole-directory clarifications rule fails, and names every line to delete', async (t) => {
  const dir = await wiredFixture(t);
  const path = seedSupersededClarificationsRule(dir);

  const { status, stderr } = await runCli(dir, ['doctor']);

  assert.equal(status, 1);
  assert.match(stderr, failLine('ignore-rules'));
  // The exact line, because the remediation is a hand edit and an operator has to find it: the
  // managed block is only appended to, so no re-run can remove it for them.
  assert.ok(stderr.includes(`${STATE_DIR}/clarifications/`), `the failure does not name the rule to delete:\n${stderr}`);
  assert.ok(stderr.includes(path), `the failure does not name the file to edit:\n${stderr}`);
  // The cause, not the symptom — and the reason the negation beneath it is not the fix.
  assert.match(stderr, /cannot re-include a file whose parent directory is excluded/);
  // The two superseded comment lines are part of the same diagnosis, so one edit closes it.
  assert.match(stderr, /2 comment lines/);
});

test('the same rule without the stale comments fails without naming comment lines', async (t) => {
  const dir = await wiredFixture(t);
  seedSupersededClarificationsRule(dir, { comments: false });

  const { status, stderr } = await runCli(dir, ['doctor']);

  // A repository whose comments were already tidied is still broken by the rule, and the message
  // must not send its operator looking for lines that are not there.
  assert.equal(status, 1);
  assert.match(stderr, failLine('ignore-rules'));
  assert.doesNotMatch(stderr, /comment line/);
});

test('the stale comment lines alone warn and leave the exit status at 0', async (t) => {
  const dir = await wiredFixture(t);
  const path = join(dir, GITIGNORE_FILE);
  writeFileSync(
    path,
    readFileSync(path, 'utf8').replace(
      `\n${STATE_DIR}/clarifications/*\n`,
      `\n# The clarification channel is created on first write rather than by init, so it has no committed\n# README, which makes it the one part of the tree that can be ignored as a whole directory.\n${STATE_DIR}/clarifications/*\n`,
    ),
    'utf8',
  );

  const { status, stdout, stderr } = await runCli(dir, ['doctor']);

  // Nothing is hidden once the rule itself is gone, so this is a warning — but it is still reported,
  // because prose contradicting the rule beside it is what gets the rule re-added.
  assert.equal(status, 0, `doctor exited ${status} on a condition that only warns\n${stdout}\n${stderr}`);
  assert.match(stderr, warnLine('ignore-rules'));
  assert.match(stdout, CLEAN_SUMMARY);
});

/**
 * The four `<dir>/*` + `!<dir>/README.md` pairs the managed block carries, each of which the check
 * has to answer for. Named here rather than in the case below because the fault F48 measured is a
 * property of the block, not of any one directory: the check must name none of them, so the test
 * drives all four.
 */
const README_PAIR_DIRS = Object.freeze(['autonomous_logs', 'clarifications', 'autonomous_inbox', 'scratch']);

/**
 * The other way a pair breaks, and the one a layout test looking *above* the negation cannot see:
 * the contents rule moved **below** it, which is where an earlier release's `merge-lines` put a line
 * an adopter had deleted (F48). git resolves a path by the **last** pattern that matches, so the
 * README is hidden exactly as a whole-directory rule above the pair hides it.
 *
 * Seeded by hand rather than by re-running `init`, so what is under test is the check alone — the
 * writer no longer produces this state (`init.test.mjs` holds that), and a case that drove it
 * through the writer would go green the moment either half regressed.
 */
function seedContentsRuleBelowNegation(dir, name) {
  const path = join(dir, GITIGNORE_FILE);
  const contents = `${STATE_DIR}/${name}/*`;
  const exception = `!${STATE_DIR}/${name}/README.md`;
  const lines = readFileSync(path, 'utf8').split('\n');
  const at = lines.indexOf(exception);
  assert.ok(lines.includes(contents), `the generated block carries no \`${contents}\`, so it cannot be moved`);
  assert.notEqual(at, -1, `the generated block carries no \`${exception}\`, so this case proves nothing`);
  const without = lines.filter((line) => line !== contents);
  without.splice(without.indexOf(exception) + 1, 0, contents);
  writeFileSync(path, without.join('\n'), 'utf8');
  return path;
}

/**
 * The third way a pair breaks, and the one no set read out of the audited file can see: the
 * `!<dir>/README.md` negation deleted outright — by hand, or by a tidy-up that moved it out of the
 * managed block — with the contents rule beside it left standing. The README is hidden exactly as
 * the two cases above hide it, and a check deriving its subjects from the block's own negations
 * loses the path along with the line, so it reports a pass about the pairs that survived.
 *
 * Seeded by hand for the same reason as its sibling: what is under test is the check alone.
 */
function seedDeletedNegation(dir, name) {
  const path = join(dir, GITIGNORE_FILE);
  const exception = `!${STATE_DIR}/${name}/README.md`;
  const lines = readFileSync(path, 'utf8').split('\n');
  assert.ok(lines.includes(exception), `the generated block carries no \`${exception}\`, so this case proves nothing`);
  writeFileSync(path, lines.filter((line) => line !== exception).join('\n'), 'utf8');
  return path;
}

/**
 * Put a README back in the state an upgraded adopter's is in: on disk and **untracked**.
 *
 * `init` commits only in a repository that has no commit at all (§2), so every repository adopted
 * after its own first commit — which is every upgrade, and the adoption F48 was measured in — holds
 * these contract files uncommitted. The fixture's `init` did make that first commit, so without this
 * the path is tracked and git answers about the index instead of about the rules.
 */
async function untrack(dir, relativePath) {
  await runGit(dir, ['rm', '--cached', '--quiet', '--', relativePath]);
}

/**
 * git's own verdict on one path, asked exactly as the check asks it — the effective rules **and**
 * the index, not `--no-index`, because the question both are answering is whether `git add` of the
 * contract file would be refused.
 *
 * Exit 1 is git's answer "no rule matches" rather than a fault, so it is a `false` here; every other
 * non-zero status is re-thrown, since reading a broken invocation as "not ignored" would make this
 * cross-check agree with whatever the check said.
 */
async function gitIgnores(dir, relativePath) {
  try {
    await runGit(dir, ['check-ignore', '--quiet', '--', relativePath]);
    return true;
  } catch (error) {
    if (!/ exited 1:/.test(error.message)) throw error;
    return false;
  }
}

test('a contents rule below its own negation fails ignore-rules, and the repaired order passes', async (t) => {
  for (const name of README_PAIR_DIRS) {
    await t.test(name, async (subtest) => {
      const dir = await wiredFixture(subtest);
      const readme = `${STATE_DIR}/${name}/README.md`;
      await untrack(dir, readme);
      const intact = readFileSync(join(dir, GITIGNORE_FILE), 'utf8');

      // The control the whole case rests on: with the block as `init` wrote it, git says the
      // contract file is committable — so the failure below is the reordering and nothing else.
      assert.equal(await gitIgnores(dir, readme), false, `${readme} is already ignored before the edit`);

      const path = seedContentsRuleBelowNegation(dir, name);
      const broken = await runCli(dir, ['doctor']);

      assert.equal(broken.status, 1, `doctor exited 0 on a working tree that hides ${readme}\n${broken.stdout}\n${broken.stderr}`);
      assert.match(broken.stderr, failLine('ignore-rules'));
      // The path, because the operator has to know which contract file is untracked, and the file to
      // edit, because no re-run moves the line back for them.
      assert.ok(broken.stderr.includes(readme), `the failure does not name the hidden README:\n${broken.stderr}`);
      assert.ok(broken.stderr.includes(path), `the failure does not name the file to edit:\n${broken.stderr}`);
      // What the verdict is *about*, asked of git directly: the two must agree in this direction, or
      // the check is once more asserting a property it did not test.
      assert.equal(await gitIgnores(dir, readme), true, `doctor failed, but git does not ignore ${readme}`);

      writeFileSync(join(dir, GITIGNORE_FILE), intact, 'utf8');
      const repaired = await runCli(dir, ['doctor']);

      // The other direction of the same cross-check: one line moved back is the whole difference
      // between the two runs, so a check that failed everything would not survive this half.
      assert.equal(await gitIgnores(dir, readme), false, `${readme} is still ignored after the order was restored`);
      assert.equal(repaired.status, 0, `doctor exited ${repaired.status} on the repaired block\n${repaired.stdout}\n${repaired.stderr}`);
      assert.match(repaired.stdout, passLine('ignore-rules'));
      assert.doesNotMatch(repaired.stderr, warnLine('ignore-rules'));
    });
  }
});

test('a deleted README negation fails ignore-rules, and names the missing line as the remedy', async (t) => {
  for (const name of README_PAIR_DIRS) {
    await t.test(name, async (subtest) => {
      const dir = await wiredFixture(subtest);
      const readme = `${STATE_DIR}/${name}/README.md`;
      await untrack(dir, readme);

      assert.equal(await gitIgnores(dir, readme), false, `${readme} is already ignored before the edit`);

      const path = seedDeletedNegation(dir, name);
      const { status, stdout, stderr } = await runCli(dir, ['doctor']);

      // git first: the case is only about a check that agrees with the working tree, so the tree's
      // own answer is what the assertions below are graded against.
      assert.equal(await gitIgnores(dir, readme), true, `git does not ignore ${readme} after its negation was deleted`);
      assert.equal(status, 1, `doctor exited 0 on a working tree that hides ${readme}\n${stdout}\n${stderr}`);
      assert.match(stderr, failLine('ignore-rules'));
      assert.ok(stderr.includes(readme), `the failure does not name the hidden README:\n${stderr}`);
      assert.ok(stderr.includes(path), `the failure does not name the file to edit:\n${stderr}`);
      // The other remedy: there is no line to move back, so the message has to send the operator to
      // the re-run that merges the negation in rather than to an edit they cannot make.
      assert.match(stderr, /carries no `!<path>` negation/);
    });
  }
});

/** The scratch directory, whose pair is the half of the runner's contract git enforces. */
const SCRATCH_DIR_NAME = 'scratch';

/** A file of the kind that directory exists for: written to be run once and never committed. */
const SCRATCH_PROBE = 'probe.py';

test('the scratch pair is rendered contents-then-negation, and git hides a probe while leaving the README', async (t) => {
  // The pair-set cases above grade the check; this one grades the rules themselves, because the
  // scratch runner's contract is that a probe "can never reach a commit" — a claim about what git
  // does, which only git can settle. Asserting the rendered order as well as the effect is what says
  // *why* it holds, so a re-render that inverted the two lines fails here rather than at the commit
  // that takes a probe with it.
  const dir = await wiredFixture(t);
  const readme = `${STATE_DIR}/${SCRATCH_DIR_NAME}/README.md`;
  await untrack(dir, readme);

  const lines = readFileSync(join(dir, GITIGNORE_FILE), 'utf8').split('\n');
  const contentsAt = lines.indexOf(`${STATE_DIR}/${SCRATCH_DIR_NAME}/*`);
  const negationAt = lines.indexOf(`!${readme}`);
  assert.notEqual(contentsAt, -1, 'the managed block carries no contents rule for the scratch directory');
  assert.notEqual(negationAt, -1, "the managed block carries no negation for the scratch directory's README");
  assert.ok(
    contentsAt < negationAt,
    'the contents rule is below its own negation, so git resolves the README by the later pattern and hides it',
  );

  const probe = `${STATE_DIR}/${SCRATCH_DIR_NAME}/${SCRATCH_PROBE}`;
  writeFileSync(join(dir, probe), 'print("probe")\n', 'utf8');

  assert.equal(await gitIgnores(dir, probe), true, `git does not ignore ${probe}, so a probe can reach a commit`);
  assert.equal(await gitIgnores(dir, readme), false, `git ignores ${readme}, so the directory's contract is uncommittable`);
});

/**
 * The branch the config names, asserted to be a real branch in `dir` with a commit on it, and
 * returned — the state a wired repository is in as soon as `init`'s own first commit lands.
 *
 * It used to *make* that commit, with a `checkout -b`. It no longer can: `init` commits in any
 * repository it wires that has no commit, on the branch its own detection read off the unborn
 * `HEAD`, so the branch exists by the time a case here runs and `checkout -b` would collide with it.
 * Checking the precondition instead of creating it is what keeps the two cases below from silently
 * becoming tests of the *warn* path if `init` ever stops committing.
 *
 * The branch is read back **from the config** rather than written as a literal here: detection reads
 * the fixture's unborn `HEAD`, so which name that is is a property of the machine's git rather than
 * of the check under test, and a name spelled here would make the case pass or fail on the host
 * instead of on the check. Taking it from the file keeps the assertion about the check.
 */
async function configuredBranchWithCommit(dir) {
  const { defaultBranch } = readJson(join(dir, CONFIG_FILE));
  const { stdout } = await runGit(dir, ['rev-parse', '--verify', '--quiet', `refs/heads/${defaultBranch}`]);
  assert.notEqual(stdout.trim(), '', `init left no commit on the configured branch ${defaultBranch}`);
  return defaultBranch;
}

test('a repository with no commit yet warns about the default branch and leaves the exit status at 0', async (t) => {
  const dir = await wiredFixture(t);

  // Built here rather than taken from the fixture: `init` commits in a repository that has none, so
  // the commit-less state this case is about has to be returned to deliberately. Deleting the ref
  // `HEAD` points at puts the repository back on an unborn `HEAD` and leaves the worktree — which is
  // the state itself, reached without pretending git declined the commit for some other reason.
  await runGit(dir, ['update-ref', '-d', 'HEAD']);

  const { status, stdout, stderr } = await runCli(dir, ['doctor']);

  // The state every repository passes through between `git init` and its first commit — the one an
  // adopter is in whenever that commit was declined. Nothing resolves there, so the configured value
  // is unverifiable rather than wrong, and grading it a failure would turn a fixable state red.
  assert.equal(status, 0, `doctor exited ${status} on a condition that only warns\n${stdout}\n${stderr}`);
  assert.match(stderr, warnLine('default-branch'));
  assert.match(stderr, /no commit yet/);
  // `init` commits in any repository it wires that has none, so what reaches this warning is a run
  // whose commit was declined — most often for want of a commit identity. Naming only the commit
  // would point the adopter back at the act that just failed, so the identity remedy is asserted
  // here: a later re-wording cannot quietly drop the message back to a bare statement of fact.
  assert.match(stderr, /git config user\.email/);
  assert.match(stdout, CLEAN_SUMMARY);
});

test('the default-branch check passes once the configured branch exists', async (t) => {
  const dir = await wiredFixture(t);
  const branch = await configuredBranchWithCommit(dir);

  const { status, stdout, stderr } = await runCli(dir, ['doctor']);

  assert.equal(status, 0, `doctor exited ${status}\n${stdout}\n${stderr}`);
  assert.match(stdout, passLine('default-branch'));
  assert.ok(stdout.includes(branch), `the default-branch check does not name the branch it resolved:\n${stdout}`);
});

test('a configured default branch that resolves nowhere fails, and names what to run', async (t) => {
  const dir = await wiredFixture(t);
  // The precondition the grading turns on, checked rather than assumed: with no commit the check
  // warns instead of failing, so a fixture that had lost `init`'s commit would make this case green
  // against the wrong branch of the check entirely.
  await configuredBranchWithCommit(dir);

  // Through the CLI's own verb rather than a hand edit: this is the shape the failure's remediation
  // names, so a typo made this way is the case an adopter actually meets.
  const edit = await runCli(dir, ['config', 'set', 'defaultBranch', 'not-a-branch']);
  assert.equal(edit.status, 0, `config set exited ${edit.status}\n${edit.stdout}\n${edit.stderr}`);

  const { status, stderr } = await runCli(dir, ['doctor']);

  assert.equal(status, 1);
  assert.match(stderr, failLine('default-branch'));
  // The consequence, not the symptom: a value naming nothing does not error anywhere — the diff base
  // has no ref and the protected-branch guard matches no branch, so the gate stops nothing.
  assert.match(stderr, /diff base/);
  assert.match(stderr, /config set defaultBranch/);
});

/**
 * The `remote` check, which is the question `default-branch` above cannot answer.
 *
 * **The state these cases exist for is a report that was green about a repository nothing could run
 * in**: the adoption rehearsal's `doctor` said 18 pass, 1 warn, 0 fail, and the first drop into that
 * repository archived within seconds on `fatal: 'origin' does not appear to be a git repository`.
 * `default-branch` passed throughout, correctly — it resolves a *local* branch — so the pair below
 * asserts that the two questions stay distinct: the failing cases assert `default-branch` still
 * passes while `remote` goes red, which is exactly the combination that used to exit 0.
 *
 * Both failing arms are covered because the second is the one an operator is least likely to
 * diagnose: a remote *is* configured, so `git remote -v` reassures, and the ref
 * `create-worktree.sh` actually branches from is still not there.
 */
test('the remote check passes for a repository whose default branch is on origin', async (t) => {
  const dir = await wiredFixture(t);
  const branch = await configuredBranchWithCommit(dir);

  const { status, stdout, stderr } = await runCli(dir, ['doctor']);

  assert.equal(status, 0, `doctor exited ${status}\n${stdout}\n${stderr}`);
  assert.match(stdout, passLine('remote'));
  // The ref itself, not just the remote's name: a check that passed on `git remote` alone would be
  // green for the second failing arm below.
  assert.ok(
    stdout.includes(`origin/${branch}`),
    `the remote check does not name the tracking ref it resolved:\n${stdout}`,
  );
  assert.match(stdout, CLEAN_SUMMARY);
});

test('a repository the flow cannot create a checkout in fails, and names the script that would', async (t) => {
  await t.test('no remote at all', async (subtest) => {
    const dir = await wiredFixture(subtest, [], { remote: false });
    await configuredBranchWithCommit(dir);

    const { status, stdout, stderr } = await runCli(dir, ['doctor']);

    assert.equal(status, 1, `doctor exited ${status} on a repository no run can start in\n${stdout}\n${stderr}`);
    assert.match(stderr, failLine('remote'));
    // The precondition by name, so the reader is sent at the script rather than left to guess which
    // step of the flow wanted a remote.
    assert.match(stderr, /create-worktree\.sh/);
    assert.match(stderr, /git remote add origin/);
    // The whole point of the check: this is the line that was already green in the rehearsal.
    assert.match(stdout, passLine('default-branch'));
  });

  await t.test('a remote, but no origin/<defaultBranch> to branch from', async (subtest) => {
    const dir = await wiredFixture(subtest, [], { remote: false });
    const branch = await configuredBranchWithCommit(dir);
    // A remote that was added and never pushed to — the state `git remote -v` reassures about. The
    // URL is never contacted: the check reads refs, so it needs no reachable endpoint and no network.
    await runGit(dir, ['remote', 'add', 'origin', join(dir, 'no-such-origin.git')]);

    const { status, stdout, stderr } = await runCli(dir, ['doctor']);

    assert.equal(status, 1, `doctor exited ${status} with no ref for the flow to branch from\n${stdout}\n${stderr}`);
    assert.match(stderr, failLine('remote'));
    assert.match(stderr, new RegExp(`origin/${branch}`));
    assert.match(stderr, /create-worktree\.sh/);
    assert.match(stderr, new RegExp(`git push -u origin ${branch}`));
    assert.match(stdout, passLine('default-branch'));
  });
});

/**
 * Put `origin/<branch>` exactly where `<branch>` is, with no push and no network.
 *
 * The remote-tracking ref is written directly, because it is the only input the check reads and
 * writing it is what a fetch of a published branch leaves behind — the same move `helpers/fixture.mjs`
 * makes to give a commit-less repository an `origin/<branch>` at all. A real `git push` would reach
 * the fixture's bare origin through `init`'s own pre-push guard, which refuses a push whose target is
 * a protected branch, and these cases are about the state of the ref rather than about that guard.
 *
 * It is needed at all because the seeded `origin/<branch>` is a commit against the empty tree, made
 * while `HEAD` was unborn: it shares no history with the commit `init` then makes, so a wired fixture
 * is *ahead* of its own origin by construction and the passing state has to be built.
 */
async function alignRemoteTrackingRef(dir, branch) {
  await runGit(dir, ['update-ref', `refs/remotes/origin/${branch}`, `refs/heads/${branch}`]);
}

/** One commit on the checked-out branch that `origin/<branch>` does not have — the stale base itself. */
async function commitWithoutPublishing(dir) {
  writeFileSync(join(dir, 'NOTES.md'), '# a change that was never pushed\n', 'utf8');
  await runGit(dir, ['add', '-A']);
  await runGit(dir, ['commit', '-m', 'a change that was never pushed']);
}

/**
 * The `base-freshness` check, which is the one further question `remote` above leaves open.
 *
 * **The state these cases exist for is a repository every other line is green about**: `origin/<b>`
 * resolves, so `remote` passes, and it is behind the local branch — so `create-worktree.sh` cuts a
 * run's working copy from a base missing whatever was never pushed, and a whole planning phase is
 * paid for before anything discovers it. The warning is what says so before a prompt is dropped.
 *
 * Two properties are asserted beyond the grade, and each is a way this check could be worthless:
 * the warning **does not move the exit status** (this file's opening rule), and it names the
 * remedy for a working copy that already exists rather than only the one at the source.
 */
test('the base-freshness check passes when origin/<defaultBranch> has everything this checkout has', async (t) => {
  const dir = await wiredFixture(t);
  const branch = await configuredBranchWithCommit(dir);
  await alignRemoteTrackingRef(dir, branch);

  const { status, stdout, stderr } = await runCli(dir, ['doctor']);

  assert.equal(status, 0, `doctor exited ${status}\n${stdout}\n${stderr}`);
  assert.match(stdout, passLine('base-freshness'));
  assert.ok(
    stdout.includes(`origin/${branch}`),
    `the base-freshness check does not name the ref it compared against:\n${stdout}`,
  );
  assert.match(stdout, CLEAN_SUMMARY);
});

test('a commit the default branch has and origin does not warns, names both remedies, and leaves the exit status at 0', async (t) => {
  const dir = await wiredFixture(t);
  const branch = await configuredBranchWithCommit(dir);
  await alignRemoteTrackingRef(dir, branch);
  // The one hand edit the case is about, made after the refs agree so that the commit is the only
  // difference between them.
  await commitWithoutPublishing(dir);

  const { status, stdout, stderr } = await runCli(dir, ['doctor']);

  // A stale base is not a repository nothing can run in: the run starts, and parks. Failing here
  // would make a repository whose remote is a few commits behind a red one, which is a check nobody
  // keeps green.
  assert.equal(status, 0, `doctor exited ${status} on a condition that only warns\n${stdout}\n${stderr}`);
  assert.match(stderr, warnLine('base-freshness'));
  assert.match(stderr, new RegExp(`origin/${branch}`));
  assert.match(stderr, new RegExp(`git push origin ${branch}`));
  // The remedy for the working copy that is *already* stale, which is the state an operator reading
  // this from inside a run is in — and the one route the protected-branch guard permits.
  assert.match(stderr, /refresh-branch\.sh --local/);
  // The whole point of asking this separately: the ref exists, so `remote` is green throughout.
  assert.match(stdout, passLine('remote'));
  assert.match(stdout, CLEAN_SUMMARY);
});

test('a repository with no origin/<defaultBranch> reports base-freshness as not graded, not as a second failure', async (t) => {
  const dir = await wiredFixture(t, [], { remote: false });
  await configuredBranchWithCommit(dir);

  const { status, stdout, stderr } = await runCli(dir, ['doctor']);

  assert.equal(status, 1, `doctor exited ${status} on a repository no run can start in\n${stdout}\n${stderr}`);
  assert.match(stderr, failLine('remote'));
  // The finding this check must not duplicate. A FAIL or WARN line here would report one fault
  // twice, and the FAIL would also move the failing-check set `init`'s own `--git-init` case
  // asserts is exactly `['remote']`.
  assert.doesNotMatch(stderr, failLine('base-freshness'));
  assert.doesNotMatch(stderr, warnLine('base-freshness'));
  const reported = stdout.split('\n').find((line) => /^PASS\s+base-freshness\s/.test(line));
  assert.ok(
    reported?.includes('not graded'),
    `base-freshness did not report itself as not graded with no origin ref to compare:\n${stdout}`,
  );
});

/**
 * The `pre-push-guard` check, which grades the file rather than the value the other three grade.
 *
 * **The state these cases exist for is a `doctor`-green repository whose hook enforced the inverse of
 * its configuration**: the integration line was `trunk`, the hook still carried the branch `init` had
 * rendered it from, and so a push to `trunk` was allowed while an ordinary feature branch was
 * refused. `default-branch`, `remote` and `base-freshness` were all green about it, correctly — the
 * configured name resolves — so the first case below asserts they stay green while this one warns,
 * which is exactly the combination that used to report nothing at all.
 *
 * The divergence is a **warning**, so the exit status does not move: the flow runs, and what is wrong
 * is which branch is guarded. Every case asserts that alongside the grade.
 */

/** A branch at the same commit, with `origin/<branch>` beside it — a second integration line to move to. */
async function seedSecondBranch(dir, from, name) {
  assert.notEqual(from, name, `this host's git already names the branch ${name}, so the move below would be no move`);
  await runGit(dir, ['branch', name, from]);
  await alignRemoteTrackingRef(dir, name);
}

/** The WARN line this check emitted, for the assertions that are about what one line names. */
function warnDetail(stderr, id) {
  return stderr.split('\n').find((line) => new RegExp(`^! WARN\\s+${id}\\s`).test(line)) ?? '';
}

test('a config moved to another integration line without re-rendering the hook warns, names both sets, and leaves the exit status at 0', async (t) => {
  const dir = await wiredFixture(t);
  const rendered = await configuredBranchWithCommit(dir);
  await alignRemoteTrackingRef(dir, rendered);
  // The branch the configuration is about to name, made real so that the three checks above this one
  // stay green: the subject here is the hook, and a `trunk` that resolved nowhere would put
  // `default-branch` red and make the case a test of that check instead.
  await seedSecondBranch(dir, rendered, 'trunk');

  // The one hand edit: the correction every documented route makes to the config, and none of them
  // carries into the hook — which is `create-if-absent` and therefore still holds what `init` wrote.
  editJson(dir, CONFIG_FILE, (config) => {
    config.defaultBranch = 'trunk';
    config.protectedBranches = ['trunk'];
  });

  const before = await snapshotTree(dir);
  const { status, stdout, stderr } = await runCli(dir, ['doctor']);

  assert.equal(status, 0, `doctor exited ${status} on a condition that only warns\n${stdout}\n${stderr}`);
  assert.match(stderr, warnLine('pre-push-guard'));
  // Both sets, because the whole point of the finding is that they can be inverted: a line naming
  // only the configured one would leave the reader unable to tell what a push is actually judged by.
  const detail = warnDetail(stderr, 'pre-push-guard');
  assert.ok(detail.includes(rendered), `the warning does not name the set the hook enforces:\n${detail}`);
  assert.ok(detail.includes('trunk'), `the warning does not name the set the configuration resolves:\n${detail}`);
  assert.ok(detail.includes(HOOK_FILE), `the warning does not name the hook it read:\n${detail}`);
  // The cure, and the one route that must never be named here: `--reset-config` rebuilds the whole
  // configuration from detection, so an adopter clearing this divergence by it loses every hand-set
  // value — Task 8's re-render reaches that run on its own.
  assert.ok(detail.includes('init --force'), `the warning does not name the re-render that cures it:\n${detail}`);
  assert.doesNotMatch(detail, /--reset-config/);
  // The lines that were already green about this repository, and stay so.
  assert.match(stdout, passLine('default-branch'));
  assert.match(stdout, passLine('remote'));
  assert.match(stdout, passLine('base-freshness'));
  assert.match(stdout, CLEAN_SUMMARY);
  assert.deepEqual(await snapshotTree(dir), before, 'doctor wrote to the repository it was asked about');
});

test('the divergence clears once init --force re-renders the hook from the config in effect', async (t) => {
  const dir = await wiredFixture(t);
  const rendered = await configuredBranchWithCommit(dir);
  await alignRemoteTrackingRef(dir, rendered);
  await seedSecondBranch(dir, rendered, 'trunk');
  editJson(dir, CONFIG_FILE, (config) => {
    config.defaultBranch = 'trunk';
    config.protectedBranches = ['trunk'];
  });

  // The remedy the warning names, run as an adopter would: `--force` overwrites generated files and
  // never the config, so the hand-edited set is the one the hook is re-rendered from.
  const forced = await runCli(dir, ['init', '--force']);
  assert.equal(forced.status, 0, `init --force exited ${forced.status}\n${forced.stdout}\n${forced.stderr}`);

  const { status, stdout, stderr } = await runCli(dir, ['doctor']);

  assert.equal(status, 0, `doctor exited ${status}\n${stdout}\n${stderr}`);
  assert.match(stdout, passLine('pre-push-guard'));
  assert.doesNotMatch(stderr, warnLine('pre-push-guard'));
  assert.ok(
    readFileSync(join(dir, HOOK_FILE), 'utf8').includes('trunk)'),
    'init --force left the hook carrying a case label the configuration does not name',
  );
});

test('a deleted pre-push hook warns that nothing judges a push here, and names the re-run that writes it', async (t) => {
  const dir = await wiredFixture(t);
  const branch = await configuredBranchWithCommit(dir);
  await alignRemoteTrackingRef(dir, branch);

  await rm(join(dir, HOOK_FILE));

  const { status, stdout, stderr } = await runCli(dir, ['doctor']);

  assert.equal(status, 0, `doctor exited ${status} on a condition that only warns\n${stdout}\n${stderr}`);
  assert.match(stderr, warnLine('pre-push-guard'));
  const detail = warnDetail(stderr, 'pre-push-guard');
  assert.ok(detail.includes(HOOK_FILE), `the warning does not name the hook it looked for:\n${detail}`);
  // `create-if-absent` is what makes a plain re-run enough here, and the message has to say so —
  // sending an adopter to `--force` for a file that is not there would be a heavier remedy than the
  // state needs.
  assert.match(stderr, /create-if-absent/);
  assert.match(stdout, CLEAN_SUMMARY);
});

test('a hook whose case statement was edited away warns that what it protects cannot be read', async (t) => {
  const dir = await wiredFixture(t);
  const branch = await configuredBranchWithCommit(dir);
  await alignRemoteTrackingRef(dir, branch);

  // The hook is the adopter's to edit, and this is the edit that leaves the file running while
  // taking the label out of it: a guard that refuses nothing, which no comparison can read a set from.
  const hook = join(dir, HOOK_FILE);
  const written = readFileSync(hook, 'utf8');
  const stripped = written.replace(/ {2}case "\$target" in\n[\s\S]*?\n {2}esac\n/, '');
  assert.notEqual(stripped, written, 'the generated hook carries no case block for this case to remove');
  writeFileSync(hook, stripped, 'utf8');

  const { status, stdout, stderr } = await runCli(dir, ['doctor']);

  assert.equal(status, 0, `doctor exited ${status} on a condition that only warns\n${stdout}\n${stderr}`);
  assert.match(stderr, warnLine('pre-push-guard'));
  const detail = warnDetail(stderr, 'pre-push-guard');
  assert.ok(detail.includes('case label'), `the warning does not say what it failed to read:\n${detail}`);
  assert.ok(detail.includes(branch), `the warning does not name the set the configuration resolves:\n${detail}`);
  assert.match(stdout, CLEAN_SUMMARY);
});

/**
 * The `protected-set` check, which grades the configured list rather than the file `pre-push-guard`
 * grades.
 *
 * **The state these cases exist for is a guard permanently protecting a branch nobody will ever push
 * to again**: `config set defaultBranch trunk` changes only that key, so `protectedBranches` keeps
 * the abandoned name, the two are unioned, and the next `init --force` renders `feat_add_search|trunk`
 * into the hook. Nothing ages the entry out — the union is deliberate — so what is asserted below is
 * that it is *said*.
 *
 * The decision the check implements is asserted alongside every grade: a stale entry is **reported,
 * never removed**, so the warning does not move the exit status and `doctor` still writes nothing.
 * The two negative controls matter as much as the finding: a glob and the `defaultBranch` entry are
 * both skipped, and a check that nagged about either is a check an adopter turns into noise.
 *
 * One case is about the **wording** rather than the grade: the key is optional, so what is graded may
 * be its schema default rather than a line in the file, and a report saying the file "lists" an entry
 * it does not carry sends an adopter looking for one that is not there.
 */

/** The PASS line a check emitted, for the assertions that are about what one line names. */
function passDetail(stdout, id) {
  return stdout.split('\n').find((line) => new RegExp(`^PASS\\s+${id}\\s`).test(line)) ?? '';
}

test('the protected-set check passes on a wired repository, whose one listed entry is the default branch', async (t) => {
  const dir = await wiredFixture(t);
  const branch = await configuredBranchWithCommit(dir);
  await alignRemoteTrackingRef(dir, branch);

  // No edit at all: `init` writes `protectedBranches` from the same detection as `defaultBranch`, so
  // a freshly wired repository *is* the double-reporting case. If this check graded the union it
  // would look this name up here and `default-branch` would look it up four lines above.
  assert.deepEqual(
    readJson(join(dir, CONFIG_FILE)).protectedBranches,
    [branch],
    'init did not write the default branch as the one protected entry, so this case is not the one it names',
  );

  const { status, stdout, stderr } = await runCli(dir, ['doctor']);

  assert.equal(status, 0, `doctor exited ${status}\n${stdout}\n${stderr}`);
  assert.match(stdout, passLine('protected-set'));
  assert.doesNotMatch(stderr, warnLine('protected-set'));
  assert.doesNotMatch(stderr, failLine('protected-set'));
  // The reason, in the line: an entry silently absent from a report reads as an entry nobody checked.
  const detail = passDetail(stdout, 'protected-set');
  assert.ok(detail.includes('defaultBranch'), `the pass line does not say why the entry was left alone:\n${detail}`);
  assert.match(stdout, passLine('default-branch'));
  assert.match(stdout, CLEAN_SUMMARY);
});

test('a protectedBranches entry naming a branch this repository does not have warns, names the union, and leaves the exit status at 0', async (t) => {
  const dir = await wiredFixture(t);
  const rendered = await configuredBranchWithCommit(dir);
  await alignRemoteTrackingRef(dir, rendered);
  // The branch the configuration moves to, made real so the checks above stay green: the subject
  // here is the list that was left behind, not the value that moved.
  await seedSecondBranch(dir, rendered, 'trunk');

  // The measured state, as `config set defaultBranch trunk` leaves a repository that was wired from
  // a feature branch: that verb changes only its own key, so the list still names the branch that
  // has since been merged and deleted.
  editJson(dir, CONFIG_FILE, (config) => {
    config.defaultBranch = 'trunk';
    config.protectedBranches = ['feat_add_search'];
  });

  const before = await snapshotTree(dir);
  const { status, stdout, stderr } = await runCli(dir, ['doctor']);

  // Reported, never removed — and an over-wide set stops nothing, so the exit status does not move.
  assert.equal(status, 0, `doctor exited ${status} on a condition that only warns\n${stdout}\n${stderr}`);
  assert.match(stderr, warnLine('protected-set'));
  const detail = warnDetail(stderr, 'protected-set');
  assert.ok(detail.includes('feat_add_search'), `the warning does not name the entry that resolves nowhere:\n${detail}`);
  // The consequence, which is the whole finding: the union renders it into the guard on every
  // re-render, so a line naming only the entry would read as a typo rather than as a live guard.
  assert.ok(detail.includes('trunk'), `the warning does not name the value the list is unioned with:\n${detail}`);
  assert.ok(detail.includes('init --force'), `the warning does not name the re-render it survives:\n${detail}`);
  assert.ok(
    detail.includes('config set protectedBranches'),
    `the warning does not name the edit that takes the entry out:\n${detail}`,
  );
  // The decision itself: a reader left expecting the tool to have removed it would read this report
  // as a repair rather than as a finding.
  assert.match(stderr, /Nothing removed/);
  // The line that is green about this repository throughout, which is why nothing else reports it.
  assert.match(stdout, passLine('default-branch'));
  assert.match(stdout, CLEAN_SUMMARY);
  assert.deepEqual(await snapshotTree(dir), before, 'doctor wrote to the repository it was asked about');
});

/** Every ref of that name in the two places this check looks, listed by a command that exits 0 either way. */
async function refsNamed(dir, branch) {
  const { stdout } = await runGit(dir, [
    'for-each-ref',
    '--format=%(refname)',
    `refs/heads/${branch}`,
    `refs/remotes/origin/${branch}`,
  ]);
  return stdout.split('\n').filter((line) => line !== '');
}

test('an absent protectedBranches key is warned about as the schema default it stands at, not as a list the file carries', async (t) => {
  const dir = await wiredFixture(t);
  const rendered = await configuredBranchWithCommit(dir);
  await alignRemoteTrackingRef(dir, rendered);
  await seedSecondBranch(dir, rendered, 'trunk');
  // The integration line really is `trunk` here — HEAD included — so `default-branch` stays green and
  // the only thing left to word is the key that was never set.
  await runGit(dir, ['symbolic-ref', 'HEAD', 'refs/heads/trunk']);

  const [fallback] = DEFAULTS.protectedBranches;
  // The default has to name a branch this repository does not have, or there is no warning to word:
  // on a host whose git wires that very name, `init` wired the fixture from it.
  for (const ref of await refsNamed(dir, fallback)) {
    await runGit(dir, ['update-ref', '-d', ref]);
  }

  // The state itself, and a legitimate one: the key is optional, so a hand-written config may simply
  // not carry it — and the guards are still rendered from its schema default, so it is still graded.
  editJson(dir, CONFIG_FILE, (config) => {
    config.defaultBranch = 'trunk';
    delete config.protectedBranches;
  });

  const { status, stdout, stderr } = await runCli(dir, ['doctor']);

  assert.equal(status, 0, `doctor exited ${status} on a condition that only warns\n${stdout}\n${stderr}`);
  assert.match(stderr, warnLine('protected-set'));
  const detail = warnDetail(stderr, 'protected-set');
  assert.ok(detail.includes(fallback), `the warning does not name the default that is graded:\n${detail}`);
  // The finding: an adopter told the file "lists" this entry opens it and finds no such line, and
  // goes looking for one that is not there.
  assert.ok(
    !detail.includes('protectedBranches lists'),
    `the warning describes the file as carrying a line it does not:\n${detail}`,
  );
  assert.ok(
    detail.includes('protectedBranches is not set'),
    `the warning does not say where the graded value came from:\n${detail}`,
  );
  // The remedy is the same one either way, and it is the edit that closes this state too.
  assert.ok(
    detail.includes('config set protectedBranches'),
    `the warning does not name the edit that sets the key:\n${detail}`,
  );
  assert.match(stdout, passLine('default-branch'));
  assert.match(stdout, CLEAN_SUMMARY);
});

test('init --force renders the stale entry into the guard again, and protected-set keeps saying so', async (t) => {
  const dir = await wiredFixture(t);
  const rendered = await configuredBranchWithCommit(dir);
  await alignRemoteTrackingRef(dir, rendered);
  await seedSecondBranch(dir, rendered, 'trunk');
  editJson(dir, CONFIG_FILE, (config) => {
    config.defaultBranch = 'trunk';
    config.protectedBranches = ['feat_add_search'];
  });

  const forced = await runCli(dir, ['init', '--force']);
  assert.equal(forced.status, 0, `init --force exited ${forced.status}\n${forced.stdout}\n${forced.stderr}`);

  // **This is the correct outcome**, and asserting it is what pins the decision: the union is
  // deliberate, so a re-render puts the abandoned entry back into the case label rather than ageing
  // it out. Anything that dropped it here would be narrowing a protected set on a ref lookup.
  const label = readProtectedCaseLabel(readFileSync(join(dir, HOOK_FILE), 'utf8'));
  assert.ok(label, `init --force left ${HOOK_FILE} carrying no case label to read`);
  assert.deepEqual(
    [...label].sort(),
    ['feat_add_search', 'trunk'],
    'init --force did not render the configured protected set — list unioned with defaultBranch — into the hook',
  );

  const { status, stdout, stderr } = await runCli(dir, ['doctor']);

  // The hook now matches the configuration, so the check that grades the file is green — and the one
  // that grades the configuration is still the only thing in the report saying the entry is stale.
  assert.equal(status, 0, `doctor exited ${status} on a condition that only warns\n${stdout}\n${stderr}`);
  assert.match(stdout, passLine('pre-push-guard'));
  assert.match(stderr, warnLine('protected-set'));
  assert.ok(
    warnDetail(stderr, 'protected-set').includes('feat_add_search'),
    `the warning stopped naming the entry once the hook agreed with the configuration:\n${stderr}`,
  );
  assert.match(stdout, CLEAN_SUMMARY);
});

test('a glob entry is not looked up, so a namespace listed ahead of its first branch does not warn', async (t) => {
  const dir = await wiredFixture(t);
  const rendered = await configuredBranchWithCommit(dir);
  await alignRemoteTrackingRef(dir, rendered);
  // A second listed branch that really exists, so the passing arm is reached with something in it:
  // a case whose only gradable entry was the default branch would be green without looking anything
  // up, and would not show that the glob was the thing skipped.
  await seedSecondBranch(dir, rendered, 'staging');

  editJson(dir, CONFIG_FILE, (config) => {
    config.protectedBranches = [rendered, 'staging', 'release/*'];
  });

  const { status, stdout, stderr } = await runCli(dir, ['doctor']);

  // `release/*` resolves nowhere as a branch name, so a check that looked globs up would warn here —
  // about the one entry shape `protectedBranches` documents as its own feature.
  assert.equal(status, 0, `doctor exited ${status}\n${stdout}\n${stderr}`);
  assert.match(stdout, passLine('protected-set'));
  assert.doesNotMatch(stderr, warnLine('protected-set'));
  const detail = passDetail(stdout, 'protected-set');
  assert.ok(detail.includes('staging'), `the pass line does not name the entry it resolved:\n${detail}`);
  assert.ok(detail.includes('release/*'), `the pass line does not say the glob was left ungraded:\n${detail}`);
  assert.match(stdout, CLEAN_SUMMARY);
});

test('a repository with no commit reports protected-set as not graded, not as a list of missing branches', async (t) => {
  const dir = await wiredFixture(t);
  // The commit-less state, built the way the `default-branch` case above builds it: `init` commits
  // in a repository that has none, so it has to be returned to deliberately.
  await runGit(dir, ['update-ref', '-d', 'HEAD']);

  const { status, stdout, stderr } = await runCli(dir, ['doctor']);

  assert.equal(status, 0, `doctor exited ${status} on a condition that only warns\n${stdout}\n${stderr}`);
  // No branch resolves in such a repository, so every listed entry would look missing: the finding
  // is that there are no commits, and it is `default-branch`'s to report.
  assert.doesNotMatch(stderr, warnLine('protected-set'));
  assert.doesNotMatch(stderr, failLine('protected-set'));
  assert.ok(
    passDetail(stdout, 'protected-set').includes('not graded'),
    `protected-set did not report itself as not graded in a repository with no commit:\n${stdout}`,
  );
  assert.match(stderr, warnLine('default-branch'));
});

/**
 * The `jj-repository` check — and, in equal measure, its silence.
 *
 * **The state the first two cases exist for is a report that is green and generic about a repository
 * shape one of its own claims is false in**: a colocated repository returned 18 pass, 4 warn, 0 fail
 * with nothing in it saying that the committed `pre-push` hook is a git hook `jj git push` does not
 * run, and nothing saying that the detached `HEAD` jj leaves is what demoted the branch detection.
 *
 * **The third case is the other half of the same finding and is not optional**: a check that warned
 * about jj in every repository would be a line every adopter learns to skip, which is how the two
 * facts stop being read at all. It asserts the check id's own line is the *only* place `jj` is named.
 *
 * **The fourth case is the shape the probe cannot tell from the first**, and it is what holds the
 * report's wording to what was actually read. Measured on jj 0.44.0 and recorded in
 * `docs/cli.md` §7, the `jj-repository` bullet: a **non**-colocated repository's
 * `.jj/repo/store/git_target` holds `../../../.git` and `.jj/repo/store/git` does not exist, so it
 * too keeps a real non-bare `.git` at the working-copy root with `.jj/` beside it. The check therefore warns on it exactly as it warns
 * on a colocated one — that much is correct, since the hook gap and the session guard's bound are
 * properties of `jj git push` in either shape — and the case asserts it does **not** call the
 * repository colocated, and that the detection-rung clause carries the qualifier that makes it true
 * only of the shape where jj exports `HEAD` to git.
 *
 * Two properties are asserted alongside every grade. The warning **does not move the exit status** —
 * nothing about the flow stops, and both facts are standing properties of a repository shape — and
 * its coverage half is asserted **as bounded as it was measured**: the session guard refuses a push
 * that names a protected target, and the argument-less `jj git push` is refused by neither layer.
 *
 * **No `jj` binary is required and none is invoked.** What jj leaves on disk is a `.jj/` beside
 * `.git`, plus — on a colocated repository — git's `HEAD` holding a raw commit id, which is what
 * `jj new` leaves behind. Both are built here with git, `mkdir` and one written file, so these cases
 * answer the same on a host that has never heard of jj.
 */

/** What a jj-managed working copy keeps beside `.git`, and the whole of what the check probes for. */
const JJ_DIR = '.jj';

/** The store pointer jj writes, and the file whose absence the non-colocated measurement records. */
const JJ_GIT_TARGET = join(JJ_DIR, 'repo', 'store', 'git_target');
const JJ_STORE_GIT = join(JJ_DIR, 'repo', 'store', 'git');

/** A jj-managed working copy, made the only way the check can tell: the store directory beside `.git`. */
function seedColocated(dir) {
  mkdirSync(join(dir, JJ_DIR), { recursive: true });
}

/**
 * The **non**-colocated shape as jj 0.44.0 leaves it, per `docs/cli.md` §7, the `jj-repository`
 * bullet: the store pointing back at the working copy's own `.git` (`../../../.git`, resolved from
 * `.jj/repo/store/`) and no `.jj/repo/store/git` beside it. `HEAD` is left on its branch, because
 * jj exports nothing to git here.
 */
function seedNonColocated(dir) {
  mkdirSync(join(dir, dirname(JJ_GIT_TARGET)), { recursive: true });
  writeFileSync(join(dir, JJ_GIT_TARGET), '../../../.git');
}

/** git's `HEAD` pointed at a raw commit id — the state `jj new` leaves a colocated repository in. */
async function detachHead(dir) {
  const { stdout } = await runGit(dir, ['rev-parse', 'HEAD']);
  await runGit(dir, ['update-ref', '--no-deref', 'HEAD', stdout.trim()]);
}

test('a colocated jj repository is told what the committed hook does not cover, and the exit status does not move', async (t) => {
  const dir = await wiredFixture(t);
  const branch = await configuredBranchWithCommit(dir);
  await alignRemoteTrackingRef(dir, branch);
  seedColocated(dir);

  const before = await snapshotTree(dir);
  const { status, stdout, stderr } = await runCli(dir, ['doctor']);

  assert.equal(status, 0, `doctor exited ${status} on a condition that only warns\n${stdout}\n${stderr}`);
  assert.match(stderr, warnLine('jj-repository'));
  const detail = warnDetail(stderr, 'jj-repository');

  // (1) The gap itself, measured: the hook is a git hook, and `jj git push` runs no git hook.
  assert.ok(detail.includes(basename(HOOK_FILE)), `the warning does not name the hook it is about:\n${detail}`);
  assert.ok(detail.includes('jj git push'), `the warning does not name the push that misses it:\n${detail}`);
  assert.ok(detail.includes('runs no git hook'), `the warning does not say what does not happen:\n${detail}`);
  assert.ok(
    detail.includes('person at a terminal'),
    `the warning does not name the caller the hook leaves uncovered:\n${detail}`,
  );

  // (2) The half that must be there, carried no further than the measurement behind it: the session
  // guard refuses a `jj git push` that NAMES a protected target, and the argument-less form — which
  // carries no target token, on a shape where jj keeps HEAD detached — is refused by neither layer.
  // Both directions send an adopter wrong: "the run is unprotected" is a hole that is not there,
  // "the session guard covers jj" walks them past the only layer that covers the default push.
  assert.ok(detail.includes('PreToolUse'), `the warning does not name the guard that does cover it:\n${detail}`);
  assert.ok(
    detail.includes('NAMES a protected target'),
    `the warning does not bound the guard's cover to a push that names its target:\n${detail}`,
  );
  assert.ok(
    detail.includes('no bookmark argument'),
    `the warning does not name the push form the bound leaves out:\n${detail}`,
  );
  assert.ok(
    detail.includes('refused by neither layer'),
    `the warning does not say the argument-less push is covered by neither layer:\n${detail}`,
  );
  assert.ok(
    detail.includes('branch ruleset on the forge'),
    `the warning does not name the only layer that covers the argument-less push:\n${detail}`,
  );

  // (3) The rung, said of this checkout rather than of jj in general — HEAD is on a branch here.
  assert.ok(detail.includes(branch), `the warning does not say what HEAD names in this checkout:\n${detail}`);
  assert.doesNotMatch(detail, /HEAD is detached/);

  assert.match(stdout, CLEAN_SUMMARY);
  assert.deepEqual(await snapshotTree(dir), before, 'doctor wrote to the repository it was asked about');
});

test('a colocated repository whose HEAD is detached is told the detection condition is present now', async (t) => {
  const dir = await wiredFixture(t);
  const branch = await configuredBranchWithCommit(dir);
  await alignRemoteTrackingRef(dir, branch);
  seedColocated(dir);
  await detachHead(dir);

  const { status, stdout, stderr } = await runCli(dir, ['doctor']);

  assert.equal(status, 0, `doctor exited ${status} on a condition that only warns\n${stdout}\n${stderr}`);
  assert.match(stderr, warnLine('jj-repository'));
  const detail = warnDetail(stderr, 'jj-repository');
  assert.ok(
    detail.includes('HEAD is detached in this checkout right now'),
    `the warning asserts the condition in general rather than reporting the checkout it read:\n${detail}`,
  );
  // The configured name still resolves, so the line this one qualifies stays green: what is reported
  // here is the rung the detection lost, not a value that is wrong.
  assert.match(stdout, passLine('default-branch'));
  assert.match(stdout, CLEAN_SUMMARY);
});

test('an ordinary wired repository passes jj-repository, and no other report line mentions jj', async (t) => {
  const dir = await wiredFixture(t);
  const branch = await configuredBranchWithCommit(dir);
  await alignRemoteTrackingRef(dir, branch);
  assert.ok(!existsSync(join(dir, JJ_DIR)), `the fixture already carries a ${JJ_DIR}/, so this case is not the one it names`);

  const { status, stdout, stderr } = await runCli(dir, ['doctor']);

  assert.equal(status, 0, `doctor exited ${status}\n${stdout}\n${stderr}`);
  assert.match(stdout, passLine('jj-repository'));
  assert.doesNotMatch(stderr, warnLine('jj-repository'));
  assert.ok(
    passDetail(stdout, 'jj-repository').includes('not graded'),
    `jj-repository graded a plain git repository instead of reporting itself not graded:\n${stdout}`,
  );

  // The silence half of the finding's owed verification: an adopter who does not use jj reads the
  // word once, on the line that says it does not apply, and nowhere else in the report.
  const mentions = `${stdout}\n${stderr}`
    .split('\n')
    .filter((line) => /^(PASS|! WARN|!! FAIL)\s/.test(line))
    .filter((line) => line.includes('jj'));
  assert.equal(mentions.length, 1, `jj is named on more than its own report line:\n${mentions.join('\n')}`);
  assert.match(mentions[0], /^PASS\s+jj-repository\s/);
});

test('a non-colocated jj repository is warned without being called colocated, and the rung clause is qualified', async (t) => {
  const dir = await wiredFixture(t);
  const branch = await configuredBranchWithCommit(dir);
  await alignRemoteTrackingRef(dir, branch);
  seedNonColocated(dir);

  // The fixture is the measured shape and not the ambiguous one: the store points back at the
  // working copy's own `.git`, and the file an older jj kept beside it is absent.
  assert.equal(readFileSync(join(dir, JJ_GIT_TARGET), 'utf8'), '../../../.git');
  assert.ok(!existsSync(join(dir, JJ_STORE_GIT)), 'the fixture carries the store file the measurement records as absent');

  const { status, stdout, stderr } = await runCli(dir, ['doctor']);

  assert.equal(status, 0, `doctor exited ${status} on a condition that only warns\n${stdout}\n${stderr}`);
  assert.match(stderr, warnLine('jj-repository'));
  const detail = warnDetail(stderr, 'jj-repository');

  // The probe cannot separate the shapes, so warning here is correct — what it may not do is assert
  // the shape it did not read.
  assert.ok(
    detail.includes('managed by jj'),
    `the warning does not say what the probe actually established:\n${detail}`,
  );
  assert.doesNotMatch(
    detail,
    /this is a colocated/,
    `the warning calls a non-colocated repository colocated:\n${detail}`,
  );

  // Clause (1) is true of both shapes — `jj git push` runs no git hook in either — so it still lands.
  assert.ok(detail.includes('jj git push'), `the warning does not name the push that misses the hook:\n${detail}`);
  assert.ok(detail.includes('runs no git hook'), `the warning does not say what does not happen:\n${detail}`);

  // The rung is the colocated-only clause, and the qualifier has to precede the claim rather than
  // sit somewhere else in the paragraph.
  assert.match(
    detail,
    /colocated repository[^.]*defaultBranch detection loses a rung/i,
    `the detection-rung clause is not qualified to the shape that pays it:\n${detail}`,
  );

  // jj exports nothing here, so git keeps its own HEAD and the check reports the branch it names.
  assert.ok(detail.includes(branch), `the warning does not say what HEAD names in this checkout:\n${detail}`);
  assert.doesNotMatch(detail, /HEAD is detached/);
  assert.match(stdout, CLEAN_SUMMARY);
});

test('a missing marketplace entry warns and leaves the exit status at 0', async (t) => {
  const dir = await wiredFixture(t, ['--marketplace', FIXTURE_SLUG]);

  const settings = readJson(join(dir, SETTINGS_FILE));
  assert.ok(Object.hasOwn(settings, MARKETPLACES_KEY), `${SETTINGS_FILE} carries no ${MARKETPLACES_KEY} to remove`);
  editJson(dir, SETTINGS_FILE, (parsed) => {
    delete parsed[MARKETPLACES_KEY];
  });

  const { status, stdout, stderr } = await runCli(dir, ['doctor']);

  assert.equal(status, 0, `doctor exited ${status} on a condition that only warns\n${stdout}\n${stderr}`);
  assert.match(stderr, warnLine('plugin-wiring'));
  assert.match(stdout, CLEAN_SUMMARY);
});

/**
 * The control for the regression below: a wired repository whose entry `init` itself wrote passes.
 *
 * Without it the regression test is green for a repository the check would have warned about on
 * other grounds, and the pair would prove nothing about the shape.
 */
test('a marketplace entry init wrote passes plugin-wiring', async (t) => {
  const dir = await wiredFixture(t, ['--marketplace', FIXTURE_SLUG]);

  const { status, stdout, stderr } = await runCli(dir, ['doctor']);

  assert.equal(status, 0, `doctor exited ${status}\n${stdout}\n${stderr}`);
  assert.match(stdout, passLine('plugin-wiring'));
  assert.doesNotMatch(stderr, warnLine('plugin-wiring'));
});

/**
 * The entry hand-broken **back to the shape this release used to write** — `source` and `repo` at
 * the entry's own top level — which the agent runner ignores with a settings warning.
 *
 * This is the case the check shipped blind to: it tested the key's presence and then asserted, in
 * its pass line, that a clone resolves the plugin from the committed file. Both halves of the pair
 * matter — a check that only passes on good input is what shipped — and the assertions below go past
 * the grade to the **repair**, because `.claude/settings.json` is merged missing keys only: a bare
 * `init` re-run leaves an entry that is already there exactly as it found it, so a warning saying
 * only that the entry is malformed sends the adopter to a command that silently does nothing.
 *
 * It also holds on **this** machine, which already knows the marketplace at user scope: the check
 * reads the committed file and never the machine's own plugin registry, so the one machine that
 * cannot see the defect is still the one that reports it.
 */
test('an entry in the superseded flat shape warns, names the repair, and leaves the exit status at 0', async (t) => {
  const dir = await wiredFixture(t, ['--marketplace', FIXTURE_SLUG]);

  editJson(dir, SETTINGS_FILE, (parsed) => {
    const marketplaces = parsed[MARKETPLACES_KEY];
    const [name, entry] = Object.entries(marketplaces ?? {})[0] ?? [];
    assert.ok(name, `${SETTINGS_FILE} carries no ${MARKETPLACES_KEY} entry to break`);
    assert.ok(entry?.source?.repo, `the ${MARKETPLACES_KEY} entry is already flat, so this test would break nothing`);
    // Flattened from what `init` wrote rather than typed out: the fixture's own slug survives the
    // edit, so the only thing that changed is the nesting.
    marketplaces[name] = { source: entry.source.source, repo: entry.source.repo };
  });

  const { status, stdout, stderr } = await runCli(dir, ['doctor']);

  assert.equal(status, 0, `doctor exited ${status} on a condition that only warns\n${stdout}\n${stderr}`);
  assert.match(stderr, warnLine('plugin-wiring'));
  assert.doesNotMatch(stdout, passLine('plugin-wiring'));
  assert.match(stdout, CLEAN_SUMMARY);

  // The repair, asserted in both its halves. First: that a re-run is not one of them.
  assert.match(
    stderr,
    /missing keys only/,
    `the warning does not say that a re-run leaves the entry as it is:\n${stderr}`,
  );
  assert.match(stderr, /--marketplace/, `the warning names no route that writes a correct entry:\n${stderr}`);

  // Second: the entry it prints to paste is itself in the nested shape. Parsed and inspected rather
  // than string-compared, so this asserts the shape without re-encoding it here — a literal would be
  // one more copy of the thing that was wrong, which is how the old assertions stayed green.
  const printed = stderr.match(/edit it by hand to (\{.*?\}\})/);
  assert.ok(printed, `the warning prints no entry to paste:\n${stderr}`);
  const repair = JSON.parse(printed[1]);
  assert.equal(typeof repair.source, 'object', `the printed repair's source is not an object: ${printed[1]}`);
  assert.equal(typeof repair.source.repo, 'string', `the printed repair carries no nested repo: ${printed[1]}`);
  assert.ok(!Object.hasOwn(repair, 'repo'), `the printed repair is itself the flat shape: ${printed[1]}`);
});

/**
 * The **other** shape a `plugin marketplace add` writes: a `directory` source naming a clone, which
 * `docs/development.md` §1 makes the contributor route. The host tool accepts it, so the check has
 * to stop at the nesting rather than grade it against the `repo` field only a `github` source
 * carries — a warning here would send a contributor to replace working wiring with a placeholder
 * slug. This is the regression: the shape check shipped asserting `repo` unconditionally.
 */
test('a directory-source marketplace entry passes plugin-wiring', async (t) => {
  const dir = await wiredFixture(t, ['--marketplace', FIXTURE_SLUG]);

  editJson(dir, SETTINGS_FILE, (parsed) => {
    const marketplaces = parsed[MARKETPLACES_KEY];
    const [name] = Object.entries(marketplaces ?? {})[0] ?? [];
    assert.ok(name, `${SETTINGS_FILE} carries no ${MARKETPLACES_KEY} entry to rewrite`);
    marketplaces[name] = { source: { source: 'directory', path: '/some/clone' } };
  });

  const { status, stdout, stderr } = await runCli(dir, ['doctor']);

  assert.equal(status, 0, `doctor exited ${status}\n${stdout}\n${stderr}`);
  assert.match(stdout, passLine('plugin-wiring'));
  assert.doesNotMatch(stderr, warnLine('plugin-wiring'));
  assert.match(stdout, CLEAN_SUMMARY);
});

test('the interactive-test phase on a mobile driver passes browser-wiring, naming the driver', async (t) => {
  const dir = await wiredFixture(t, ['--qa', '--qa-driver', QA_DRIVER_MOBILE]);
  // The premise: `init` deliberately withholds the browser wiring for this driver. A fixture that
  // still had the file would let the assertion below pass for the wrong reason.
  assert.equal(existsSync(join(dir, MCP_FILE)), false, `init wrote ${MCP_FILE} for ${QA_DRIVER_MOBILE}`);

  const { status, stdout, stderr } = await runCli(dir, ['doctor']);

  assert.equal(status, 0, `doctor exited ${status}\n${stdout}\n${stderr}`);
  assert.match(stdout, passLine('browser-wiring'));
  assert.ok(stdout.includes(QA_DRIVER_MOBILE), `the browser-wiring check does not name the driver:\n${stdout}`);
  // The whole point of the check reading the generators' own condition: a warning about wiring `init`
  // withheld is one no adopter could clear, so nothing reported names the file that is absent by design.
  assert.doesNotMatch(stderr, /\.mcp\.json/);
  // And the rest of the report is unmoved by the driver — a mobile configuration is not a degraded one.
  assert.match(stdout, CLEAN_SUMMARY);
});

/**
 * The remedy `browser-wiring` prints for a profile that starts no server, driven end to end.
 *
 * The state is the one an adopter reaches by turning the phase on after the profile was generated:
 * any re-run merges `.mcp.json` in, while the create-if-absent profile is kept exactly as it was and
 * so starts none of the servers now declared. It is reproduced here as one hand edit to a wired
 * repository — the same shape as every other case in this file.
 *
 * The remedy is asserted twice over: that it names a **bare** `init --force`, and that running
 * exactly that clears the warning. `init` reads the config on every run and `--force` never
 * overwrites it, so the phase this check found on is the phase the regenerated profile is wired
 * from and no flag is needed to carry it — a remedy still naming `--qa` would be describing a
 * contract that no longer holds, and a remedy nobody can follow is the defect this pairing catches.
 */
test('a profile that starts no browser server warns, and the bare init --force it names clears it', async (t) => {
  const dir = await wiredFixture(t, ['--qa']);
  editJson(dir, PROFILE_FILE, (parsed) => {
    delete parsed[ENABLED_SERVERS_KEY];
  });

  const broken = await runCli(dir, ['doctor']);

  assert.equal(
    broken.status,
    0,
    `doctor exited ${broken.status} on a condition that only warns\n${broken.stdout}\n${broken.stderr}`,
  );
  assert.match(broken.stderr, warnLine('browser-wiring'));
  assert.match(
    broken.stderr,
    /`npx autonomous-sdlc-harness init --force`/,
    `the warning does not name the command that repairs it:\n${broken.stderr}`,
  );
  assert.doesNotMatch(
    broken.stderr,
    /init --force --qa/,
    `the warning still routes the repair through flags --force no longer rebuilds the config from:\n${broken.stderr}`,
  );

  const repair = await runCli(dir, ['init', '--force']);
  assert.equal(repair.status, 0, `the remedy exited ${repair.status}\n${repair.stdout}\n${repair.stderr}`);

  const fixed = await runCli(dir, ['doctor']);

  assert.equal(fixed.status, 0, `doctor exited ${fixed.status} after the remedy\n${fixed.stdout}\n${fixed.stderr}`);
  assert.match(fixed.stdout, passLine('browser-wiring'));
  assert.doesNotMatch(fixed.stderr, warnLine('browser-wiring'));
  assert.match(fixed.stdout, CLEAN_SUMMARY);
});

/** What the reachable stub answers `npm view <spec> version` with — a string nothing else prints. */
const STUB_REGISTRY_VERSION = '9.9.9-stub';

/** What the unreachable stub prints: npm's own shape for a package the registry does not carry. */
const STUB_REGISTRY_E404 = 'npm error code E404';

/**
 * A temp directory holding an `npm` that answers every invocation the same way, put **first** on
 * `PATH` — the `jq` stub's pattern, for the same reason it exists.
 *
 * The registry probe asks a real client on a real `PATH`, so each of its outcomes is driven by giving
 * the command a machine rather than by mocking the spawn. Prepending is what keeps every other check
 * answering exactly as it does elsewhere in this file, and it is also what makes these cases
 * **network-free**: the only `npm` the run can resolve is this script, so no case here reaches a
 * registry.
 *
 * @param {import('node:test').TestContext} t
 * @param {{ line: string, status: number, stream?: 'stdout' | 'stderr' }} answer what the stub
 *   prints, on which stream, and how it exits. The unreachable arm prints on **stderr**, because
 *   that is where `npm` writes registry errors — a stub answering on stdout would let the check
 *   pass the assertion below while discarding everything a real npm says.
 * @returns {Promise<string>} a `PATH` value with the stub ahead of everything else.
 */
async function npmStubPath(t, { line, status, stream = 'stdout' }) {
  const dir = await mkdtemp(join(tmpdir(), 'harness-npm-stub-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  const redirect = stream === 'stderr' ? ' >&2' : '';
  writeFileSync(join(dir, 'npm'), `#!/bin/sh\nprintf '%s\\n' ${JSON.stringify(line)}${redirect}\nexit ${status}\n`, {
    mode: 0o755,
  });
  return `${dir}${delimiter}${process.env.PATH ?? ''}`;
}

/**
 * A `PATH` where the launch command resolves but the registry client does **not** — an `npx` stub
 * beside symlinks to the real `git` and `jq`, and no `npm` anywhere on it.
 *
 * The state an `npx`-only wrapper or a corporate image produces, and the one the registry probe's
 * `no-client` outcome exists for. Built as its own directory rather than by filtering the machine's
 * `PATH` for the reason {@link pathWithoutJq} gives: `npm` and `npx` ship from the same install, so a
 * filter would take the launch command away with the client and the check would warn about an
 * unresolved server instead of answering the question this arranges.
 *
 * @param {import('node:test').TestContext} t
 * @returns {Promise<string>} a `PATH` holding only that directory.
 */
async function pathWithNpxButNoNpm(t) {
  const dir = await mkdtemp(join(tmpdir(), 'harness-nonpm-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  for (const name of ['git', 'jq']) {
    const real = resolveOnPath(name);
    assert.ok(real, `${name} does not resolve on PATH, so an environment without npm cannot be built for this test`);
    symlinkSync(real, join(dir, name));
  }
  writeFileSync(join(dir, 'npx'), '#!/bin/sh\nexit 0\n', { mode: 0o755 });
  return dir;
}

/**
 * The pinned package specs the generated wiring would fetch, read out of the fixture's own
 * `.mcp.json` rather than restated here: a pin raised in the template must not fail these cases, and
 * a spec spelled into a test is a second declaration of what the wiring carries.
 */
function pinnedSpecs(dir) {
  const servers = readJson(join(dir, MCP_FILE)).mcpServers ?? {};
  return Object.values(servers)
    .filter((server) => server.command === 'npx')
    .map((server) => (server.args ?? []).find((argument) => !argument.startsWith('-')))
    .filter((spec) => spec !== undefined);
}

/**
 * The sentence a probe-less run owes: `npx` resolving proves nothing about whether the pinned
 * packages can be **fetched**, and this run did not ask.
 *
 * Asserted on the default invocation — no flag, no stub, no network — because that is the run every
 * adopter makes, and the finding this closes is an adopter reading `PASS browser-wiring` as a promise
 * the first interactive-test dispatch will find its servers.
 */
test('a default doctor names the first-use fetch, the pinned specs and the flag that checks them', async (t) => {
  const dir = await wiredFixture(t, ['--qa']);
  const specs = pinnedSpecs(dir);
  assert.equal(specs.length, 2, `the wiring declares ${specs.length} npx-launched servers, not two`);

  const { status, stdout, stderr } = await runCli(dir, ['doctor']);

  assert.equal(status, 0, `doctor exited ${status}\n${stdout}\n${stderr}`);
  assert.match(stdout, passLine('browser-wiring'));
  const line = detailLine(stdout, /^PASS\s+browser-wiring\s/m);
  for (const spec of specs) assert.ok(line.includes(spec), `the pass text does not name ${spec}:\n${line}`);
  assert.match(line, /fetched from the registry on first use/);
  assert.match(line, /--check-registry/, `the pass text does not name the flag that checks them:\n${line}`);
  assert.match(stdout, CLEAN_SUMMARY);
});

test('--check-registry passes browser-wiring and names the version each pinned spec resolved to', async (t) => {
  const dir = await wiredFixture(t, ['--qa']);
  const specs = pinnedSpecs(dir);
  const PATH = await npmStubPath(t, { line: STUB_REGISTRY_VERSION, status: 0 });

  const { status, stdout, stderr } = await runCli(dir, ['doctor', '--check-registry'], { PATH });

  assert.equal(status, 0, `doctor exited ${status} with every pin reachable\n${stdout}\n${stderr}`);
  assert.match(stdout, passLine('browser-wiring'));
  const line = detailLine(stdout, /^PASS\s+browser-wiring\s/m);
  for (const spec of specs) assert.ok(line.includes(spec), `the pass text does not name ${spec}:\n${line}`);
  assert.ok(line.includes(STUB_REGISTRY_VERSION), `the pass text does not name the version reached:\n${line}`);
  assert.doesNotMatch(stderr, warnLine('browser-wiring'));
  assert.match(stdout, CLEAN_SUMMARY);
});

/**
 * The outcome the flag exists for: a registry that does not carry the pin, which is what an adopter
 * on a mirror or behind a proxy has. It **warns** — a package that cannot be fetched is the
 * interactive-test phase failing later, not this repository being unrunnable now — and the exit
 * status stays 0, which is the property every other warning in this file also holds to.
 */
test('--check-registry warns on an unreachable pin, names both specs, and still exits 0', async (t) => {
  const dir = await wiredFixture(t, ['--qa']);
  const specs = pinnedSpecs(dir);
  const PATH = await npmStubPath(t, { line: STUB_REGISTRY_E404, status: 1, stream: 'stderr' });

  const { status, stdout, stderr } = await runCli(dir, ['doctor', '--check-registry'], { PATH });

  assert.equal(status, 0, `an unreachable pin moved the exit status to ${status}\n${stdout}\n${stderr}`);
  assert.match(stderr, warnLine('browser-wiring'));
  const line = detailLine(stderr, warnLine('browser-wiring'));
  for (const spec of specs) assert.ok(line.includes(spec), `the warning does not name ${spec}:\n${line}`);
  assert.ok(line.includes('E404'), `the warning does not quote what npm printed:\n${line}`);
  assert.match(stdout, CLEAN_SUMMARY);
});

/**
 * The flag given on a machine that cannot put the question: `npm` is absent, every probe returns
 * `no-client`, and nothing was read. The pass line must say so once — the flag being present is not
 * the measurement, and a line claiming a metadata read is contradicted by the sentence beside it.
 */
test('--check-registry claims no registry read when npm does not resolve on PATH', async (t) => {
  const dir = await wiredFixture(t, ['--qa']);
  const PATH = await pathWithNpxButNoNpm(t);

  const { status, stdout, stderr } = await runCli(dir, ['doctor', '--check-registry'], { PATH });

  assert.equal(status, 0, `doctor exited ${status} with no registry client on PATH\n${stdout}\n${stderr}`);
  assert.match(stdout, passLine('browser-wiring'));
  const line = detailLine(stdout, /^PASS\s+browser-wiring\s/m);
  assert.doesNotMatch(line, /the registry was read/, `the pass text claims a read that never happened:\n${line}`);
  assert.match(line, /The registry probe ran nothing/, `the pass text does not say the question was not put:\n${line}`);
  assert.doesNotMatch(stderr, warnLine('browser-wiring'));
});

/**
 * A phase armed after the wiring run, with no `qa` section under it — the end state of the route
 * `docs/cli.md` §6 documents, reproduced here as the one hand edit that produces it.
 *
 * `init` writes a `qa` section only under `--qa`, and `init --force` regenerates the generated files
 * but never `harness.config.json`, so no re-run repairs this and `doctor` is the only thing that
 * sees it on every subsequent run. The `--force` step is in the case for that reason rather than as
 * setup: it is what shows the state survives the command an adopter would reach for.
 *
 * The exit status is asserted alongside the warning so the grade cannot be promoted silently — a
 * warning never fails `doctor` (`docs/cli.md` §7), and a check that started failing here would stop
 * every run in a repository whose only fault is an unanswered question.
 */
test('a qa phase armed by hand warns about the unchosen driver, and init --force does not clear it', async (t) => {
  const dir = await wiredFixture(t);
  editJson(dir, CONFIG_FILE, (config) => {
    config.phases.qa = true;
  });

  const armed = await runCli(dir, ['doctor']);

  assert.equal(armed.status, 0, `doctor exited ${armed.status} on a condition that only warns\n${armed.stdout}\n${armed.stderr}`);
  assert.match(armed.stderr, warnLine('config'));
  assert.match(armed.stderr, /qa\.driver/, `the config check does not name the unset driver:\n${armed.stderr}`);
  assert.doesNotMatch(armed.stdout, passLine('config'), 'the config check passed over a phase with no driver');

  const forced = await runCli(dir, ['init', '--force']);
  assert.equal(forced.status, 0, `init --force exited ${forced.status}\n${forced.stdout}\n${forced.stderr}`);

  const after = await runCli(dir, ['doctor']);

  assert.equal(after.status, 0, `doctor exited ${after.status} after init --force\n${after.stdout}\n${after.stderr}`);
  assert.match(after.stderr, warnLine('config'));
  assert.match(after.stderr, /qa\.driver/, `init --force silenced a warning it cannot repair:\n${after.stderr}`);
  assert.match(after.stdout, CLEAN_SUMMARY);
});

/** The machine-local settings file, spelled from its two parts as the CLI resolves them. */
const MACHINE_DIR = 'autonomous-sdlc-harness';
const PUSH_ENV_FILE = 'push.env';

/** The repository-side half of the same precedence, at the path a generated config seeds. */
const REPO_PUSH_ENV_PATH = '.claude/push-notify.env';

/** The two keys the notifier recognises, asserted by name because the report names them and not values. */
const PUSH_URL_KEY = 'HARNESS_PUSH_URL';
const PUSH_CMD_KEY = 'HARNESS_PUSH_CMD';

/**
 * The two values the cases below write, chosen so `assert.ok(!output.includes(…))` means what it
 * says: each is under `.invalid` or is a path segment appearing in no fixture path, no generated file
 * and no flag name, so a report that echoed one back has nowhere else the match could have come from.
 */
const PUSH_URL = 'https://example.invalid/t0p1c-appears-nowhere-else';
const PUSH_CMD = '/nonexistent/n0tifier-appears-nowhere-else';

/** The notifier `--test-notification` invokes, beside the watcher in the configured scriptsDir. */
const NOTIFY_FILE = 'autonomous-notify.sh';

/** The event word the test send carries — none of the watcher's seven, so it reads as no run's outcome. */
const TEST_EVENT = 'doctor-test';

/**
 * A throwaway directory to point `XDG_CONFIG_HOME` at, and the settings file that resolves under it.
 *
 * **Every case below passes one.** The subject is a file outside the repository, so a case that
 * forgot this would be reading the machine the tests run on — and the file it would read is the
 * operator's real credential file, whose presence or absence would then decide whether an assertion
 * about a fixture passes.
 */
async function machineHome(t) {
  const fixture = await createFixture({ git: false });
  t.after(fixture.cleanup);
  return {
    env: { XDG_CONFIG_HOME: fixture.dir },
    dir: join(fixture.dir, MACHINE_DIR),
    file: join(fixture.dir, MACHINE_DIR, PUSH_ENV_FILE),
  };
}

/** Write a settings file, creating the directory it lives in. */
function writePushEnv(path, lines) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${lines.join('\n')}\n`, 'utf8');
}

/**
 * Replace the generated notifier with a stub whose only act is a file, and return both paths.
 *
 * The real script's desktop arm posts a banner on whatever host runs these tests, which is why the
 * section below exercises no delivery. A stub makes the one question a `--dry-run` case has to answer
 * answerable from the outside: **the sentinel exists if and only if the notifier ran**, whatever the
 * report claimed. It records the argument vector it was called with, so the control run pins the
 * command the preview promised rather than only that something happened.
 *
 * The sentinel lands **outside the fixture**, so the "doctor wrote nothing to the repository"
 * comparison in the same case still means what it says.
 */
async function stubNotifier(t, dir) {
  const outside = await mkdtemp(join(tmpdir(), 'harness-notify-stub-'));
  t.after(() => rm(outside, { recursive: true, force: true }));

  const sentinel = join(outside, 'the-notifier-ran');
  const script = join(dir, 'scripts', NOTIFY_FILE);
  writeFileSync(script, `#!/usr/bin/env bash\nprintf '%s\\n' "$@" > ${JSON.stringify(sentinel)}\n`, 'utf8');
  return { script, sentinel };
}

/**
 * The notifications check: which of the two settings files is in effect, and the one property that
 * makes it safe to print at all.
 *
 * **That property is the third assertion in the second case.** The check reads a file holding a push
 * URL, which is a bearer credential for every endpoint worth pointing this at — so the report names
 * the path it read and the *key names* it found set, and never a value. The absence of the endpoint
 * from the whole of stdout and stderr is asserted explicitly, because it is the kind of property that
 * is only ever broken by a message someone made more helpful.
 *
 * Delivery itself is not exercised here: `--test-notification` runs the machine's own notifier, whose
 * desktop arm posts a real banner on the host running the tests. The two branches that send nothing —
 * an absent notifier, and a `--dry-run` invocation — are asserted below, the second against a stub
 * standing in for the notifier so that "nothing was sent" is read off the filesystem rather than off
 * the report. What the *shipped* notifier then does with that invocation — the POST to the endpoint
 * and the desktop banner — is exercised by neither this suite nor any documented hand step, and is
 * unverified until one is written.
 */
test('the notifications check reports which settings file is in effect, and never a value', async (t) => {
  await t.test('neither candidate present warns, leaves the exit status at 0, and creates nothing', async (subtest) => {
    const dir = await wiredFixture(subtest);
    const machine = await machineHome(subtest);
    const before = await snapshotTree(dir);

    const { status, stdout, stderr } = await runCli(dir, ['doctor'], machine.env);

    assert.equal(status, 0, `doctor exited ${status} on a condition that only warns\n${stdout}\n${stderr}`);
    assert.match(stderr, warnLine('notifications'));
    assert.match(stdout, CLEAN_SUMMARY);
    // The remedy is named, because "you get nothing and here is why" is the whole content of this
    // warning: notifications are optional, and the check may never fail over one nobody took.
    assert.match(stderr, /--notifications/);
    assert.ok(stderr.includes('--push-url <url-or-ntfy-topic>'), `the remedy does not name the shared destination placeholder\n${stderr}`);
    // A read that created the machine-local directory would make `doctor` a writer outside the
    // repository — the one place its "writes nothing" contract is hardest to notice being broken.
    assert.equal(existsSync(machine.dir), false, `${machine.dir} was created by a check that only reads`);
    assert.deepEqual(await snapshotTree(dir), before, 'doctor wrote to the repository it was asked about');
  });

  await t.test('a machine-local file with an endpoint passes, naming the path and the key', async (subtest) => {
    const dir = await wiredFixture(subtest);
    const machine = await machineHome(subtest);
    writePushEnv(machine.file, [`${PUSH_URL_KEY}=${PUSH_URL}`, `${PUSH_CMD_KEY}=`]);

    const { status, stdout, stderr } = await runCli(dir, ['doctor'], machine.env);

    assert.equal(status, 0, `doctor exited ${status}\n${stdout}\n${stderr}`);
    assert.match(stdout, passLine('notifications'));
    assert.ok(stdout.includes(machine.file), `the check does not name the file it read:\n${stdout}`);
    assert.ok(stdout.includes(PUSH_URL_KEY), `the check does not name the key that is set:\n${stdout}`);
    // The check's one security property, asserted over the whole of both streams rather than over the
    // one line, so a value reaching any other message here fails this case too.
    assert.ok(!stdout.includes(PUSH_URL), `the endpoint was printed back on stdout:\n${stdout}`);
    assert.ok(!stderr.includes(PUSH_URL), `the endpoint was printed back on stderr:\n${stderr}`);
    // The empty second arm is reported as unset rather than as configured: the file ships it empty.
    assert.doesNotMatch(stdout, new RegExp(`sets .*${PUSH_CMD_KEY}`));
  });

  await t.test('a repository-side file with no machine-local one passes, naming the repository path', async (subtest) => {
    const dir = await wiredFixture(subtest);
    const machine = await machineHome(subtest);
    const repositoryFile = join(dir, REPO_PUSH_ENV_PATH);
    writePushEnv(repositoryFile, [`${PUSH_CMD_KEY}="${PUSH_CMD}"`]);

    const { status, stdout, stderr } = await runCli(dir, ['doctor'], machine.env);

    assert.equal(status, 0, `doctor exited ${status}\n${stdout}\n${stderr}`);
    assert.match(stdout, passLine('notifications'));
    assert.ok(stdout.includes(repositoryFile), `the check does not name the file it read:\n${stdout}`);
    assert.ok(stdout.includes(PUSH_CMD_KEY), `the check does not name the key that is set:\n${stdout}`);
    assert.ok(!stdout.includes(PUSH_CMD), `the local command was printed back on stdout:\n${stdout}`);
    assert.ok(!stderr.includes(PUSH_CMD), `the local command was printed back on stderr:\n${stderr}`);
  });

  await t.test('both present: the machine-local one wins, and the report says the other is not read', async (subtest) => {
    const dir = await wiredFixture(subtest);
    const machine = await machineHome(subtest);
    const repositoryFile = join(dir, REPO_PUSH_ENV_PATH);
    writePushEnv(machine.file, [`${PUSH_URL_KEY}=${PUSH_URL}`]);
    writePushEnv(repositoryFile, [`${PUSH_CMD_KEY}="${PUSH_CMD}"`]);

    const { status, stdout, stderr } = await runCli(dir, ['doctor'], machine.env);

    // The only machine anybody asks this question about is the one with a file in both places, and
    // the answer the report gives has to be the answer the notifier's own loop would give.
    assert.equal(status, 0, `doctor exited ${status}\n${stdout}\n${stderr}`);
    assert.match(stdout, passLine('notifications'));
    const line = stdout.split('\n').find((entry) => entry.startsWith('PASS  notifications'));
    assert.ok(line.indexOf(machine.file) < line.indexOf(repositoryFile), `the report does not name the machine-local file as the one in effect:\n${line}`);
    assert.match(line, /not read/);
    // The repository-side file is the shadowed one, so its key must not be reported as configured.
    assert.ok(!line.includes(PUSH_CMD_KEY), `a shadowed file's key was reported as set:\n${line}`);
    assert.ok(!stdout.includes(PUSH_CMD) && !stdout.includes(PUSH_URL), `a value was printed back:\n${stdout}`);
  });

  await t.test('a config with no pushEnvPath reports only the machine-local candidate', async (subtest) => {
    const dir = await wiredFixture(subtest);
    const machine = await machineHome(subtest);
    // The key is schema-optional and `init` always writes it, so a hand edit is the only way here —
    // and the file at the path it used to name is left in place, complete, as the thing the report
    // must *not* name: `hr_push_env_files` prints no repository candidate for such a config, so the
    // notifier would never open this file and a report naming it would send an operator to a file
    // that changes nothing.
    editJson(dir, CONFIG_FILE, (config) => {
      delete config.pushEnvPath;
    });
    const repositoryFile = join(dir, REPO_PUSH_ENV_PATH);
    writePushEnv(repositoryFile, [`${PUSH_CMD_KEY}="${PUSH_CMD}"`]);

    const { status, stdout, stderr } = await runCli(dir, ['doctor'], machine.env);

    assert.equal(status, 0, `doctor exited ${status} on a condition that only warns\n${stdout}\n${stderr}`);
    assert.match(stderr, warnLine('notifications'));
    const line = stderr.split('\n').find((entry) => warnLine('notifications').test(entry));
    assert.ok(line.includes(machine.file), `the check does not name the candidate it looked at:\n${line}`);
    assert.ok(!line.includes(repositoryFile), `the check named a file the notifier would not read:\n${line}`);
    // One candidate is not "neither", and the remedy cannot be "fill the repository-side one" when
    // this config has none: it is the key that has to be set first.
    assert.doesNotMatch(line, /neither candidate/);
    assert.ok(line.includes('pushEnvPath') && line.includes(CONFIG_FILE), `the remedy does not name the key to set:\n${line}`);
  });

  await t.test('an unknown option is still refused, and names every flag doctor takes', async (subtest) => {
    const dir = await wiredFixture(subtest);

    const { status, stderr } = await runCli(dir, ['doctor', '--not-a-flag']);

    // The flags added by this release did not turn the parser into one that ignores what it does not
    // know: a mistyped option would otherwise produce a report answering a question nobody asked.
    assert.equal(status, 1, `doctor accepted an unknown option (exit ${status})`);
    assert.match(stderr, /--not-a-flag/);
    assert.match(stderr, /--test-notification/);
    // Both, because a refusal that names a subset sends an operator to `--help` for the rest.
    assert.match(stderr, /--check-registry/);
  });

  await t.test('--test-notification with no notifier warns, sends nothing and moves no exit status', async (subtest) => {
    const dir = await wiredFixture(subtest);
    const machine = await machineHome(subtest);
    await rm(join(dir, 'scripts', NOTIFY_FILE));
    const before = await snapshotTree(dir);

    const { status, stdout, stderr } = await runCli(dir, ['doctor', '--test-notification'], machine.env);

    assert.equal(status, 0, `--test-notification moved the exit status to ${status}\n${stdout}\n${stderr}`);
    assert.match(stderr, /--test-notification sent nothing/);
    assert.ok(stderr.includes(join(dir, 'scripts', NOTIFY_FILE)), `the warning does not name the notifier:\n${stderr}`);
    assert.deepEqual(await snapshotTree(dir), before, '--test-notification wrote to the repository');
  });

  await t.test('--test-notification under --dry-run previews the invocation and sends nothing', async (subtest) => {
    const dir = await wiredFixture(subtest);
    const machine = await machineHome(subtest);
    const { script, sentinel } = await stubNotifier(subtest, dir);
    // Read from the config rather than spelled here: `init`'s own first commit lands on the branch
    // its detection took from the unborn `HEAD`, so the checked-out branch and the configured value
    // are the same name — and which name that is is the host's git to decide, not this case's.
    const { defaultBranch } = readJson(join(dir, CONFIG_FILE));
    const before = await snapshotTree(dir);

    const dry = await runCli(dir, ['doctor', '--dry-run', '--test-notification'], machine.env);

    assert.equal(dry.status, 0, `--dry-run --test-notification exited ${dry.status}\n${dry.stdout}\n${dry.stderr}`);
    assert.ok(
      dry.stdout.includes(`would run: bash ${script} ${TEST_EVENT} ${defaultBranch}`),
      `the dry run did not preview the invocation it would have made:\n${dry.stdout}`,
    );
    assert.match(dry.stdout, /--test-notification sent nothing/);
    // The property the preview is worth nothing without, and the only one a report cannot be trusted
    // for: a delivery reaches a remote endpoint and a desktop banner, which is what --dry-run skips.
    assert.equal(existsSync(sentinel), false, 'the notifier ran under --dry-run');
    assert.deepEqual(await snapshotTree(dir), before, 'doctor --dry-run wrote to the repository');

    // The control, without which the assertion above could hold because the stub was never reachable:
    // the same command without the flag runs that script, with the argument vector just previewed.
    const real = await runCli(dir, ['doctor', '--test-notification'], machine.env);

    assert.equal(real.status, 0, `--test-notification exited ${real.status}\n${real.stdout}\n${real.stderr}`);
    assert.equal(existsSync(sentinel), true, 'the notifier did not run without --dry-run');
    assert.equal(readFileSync(sentinel, 'utf8'), `${TEST_EVENT}\n${defaultBranch}\n`);
  });
});

/**
 * The machine registry, spelled from its parts as `docs/watcher.md` §7 publishes them rather than
 * imported from `machine/registry.js`: a hand-seeded fixture below is then reading the contract, not
 * a restatement of the code that has to satisfy it. `MACHINE_DIR` is shared with the section above,
 * because both artifacts live under the one directory name the CLI addresses.
 */
const REGISTRY_FILE = 'repos.json';
const REGISTRY_SCHEMA = 1;

/** A label no generated one collides with, so a report carrying it carries *this* seeded entry. */
const SEEDED_LABEL = 'com.autonomous-sdlc-harness.watcher.seeded-by-the-doctor-suite';

/**
 * A throwaway `XDG_STATE_HOME`, the directory the registry resolves under, and the file itself.
 *
 * **Every case below passes one**, including the one asserting nothing was written: the subject is a
 * file outside the repository, so a case that forgot this would read — and, on the defect it exists
 * to catch, create under — the state directory of the account running the suite, whose real
 * registered daemons would then decide whether an assertion about a fixture passes.
 */
async function machineStateHome(t) {
  const fixture = await createFixture({ git: false });
  t.after(fixture.cleanup);
  return {
    env: { XDG_STATE_HOME: fixture.dir },
    root: fixture.dir,
    dir: join(fixture.dir, MACHINE_DIR),
    file: join(fixture.dir, MACHINE_DIR, REGISTRY_FILE),
  };
}

/** Write a registry by hand, in the published shape, creating the directory it lives in. */
function seedRegistry(machine, repos) {
  mkdirSync(dirname(machine.file), { recursive: true });
  writeFileSync(machine.file, `${JSON.stringify({ schema: REGISTRY_SCHEMA, repos }, null, 2)}\n`, 'utf8');
}

/** One registry row, with the fields §7 says it carries and nothing else. */
function entryFor(root, unitPath) {
  return {
    root,
    projectName: 'seeded-project',
    label: SEEDED_LABEL,
    backend: 'launchd',
    unitPath,
    registered_at: 1786575259,
  };
}

/** A file outside every repository standing in for an installed unit, so its path really exists. */
async function seededUnitFile(t) {
  const fixture = await createFixture({ git: false });
  t.after(fixture.cleanup);
  const path = join(fixture.dir, `${SEEDED_LABEL}.plist`);
  writeFileSync(path, '<!-- a unit file this test only needs to exist -->\n', 'utf8');
  return path;
}

/**
 * The repo-registry check: whether this checkout is armed on this machine, and whether what the
 * registry says about it is still true.
 *
 * **The grade never rises above a warning in any of these cases, and that is the point of the
 * exit-status assertion each of them carries.** `watcher.md` §5 states the registry is not consulted
 * before starting a run, so nothing found here can stop one — a repository with no daemon is the
 * ordinary state of one that runs in the foreground, and a stale row costs an operator accuracy in
 * `daemon list` rather than costing this repository anything.
 */
test('the repo-registry check answers for this checkout, and never above a warning', async (t) => {
  await t.test('a freshly wired repository with an empty registry warns, and creates nothing', async (subtest) => {
    const dir = await wiredFixture(subtest);
    const machine = await machineStateHome(subtest);
    const before = await snapshotTree(dir);

    const { status, stdout, stderr } = await runCli(dir, ['doctor'], machine.env);

    assert.equal(status, 0, `doctor exited ${status} on a condition that only warns\n${stdout}\n${stderr}`);
    assert.match(stderr, warnLine('repo-registry'));
    assert.match(stdout, CLEAN_SUMMARY);
    // The remedy is the whole content of this warning: nothing polls the inbox until a daemon is
    // installed from this checkout, and the command that does it is what the line has to name.
    assert.match(stderr, /daemon install/);
    // A read that created the machine-local directory would make `doctor` a writer outside the
    // repository — the half of its "writes nothing" contract the tree snapshot cannot see.
    assert.equal(existsSync(machine.dir), false, `${machine.dir} was created by a check that only reads`);
    assert.deepEqual(await readdir(machine.root), [], `doctor wrote under ${machine.root}`);
    assert.deepEqual(await snapshotTree(dir), before, 'doctor wrote to the repository it was asked about');
  });

  await t.test('an entry for this checkout whose unit is installed passes, naming what is armed', async (subtest) => {
    const dir = await wiredFixture(subtest);
    const machine = await machineStateHome(subtest);
    const unitPath = await seededUnitFile(subtest);
    seedRegistry(machine, { [repoSlug(dir)]: entryFor(dir, unitPath) });

    const { status, stdout, stderr } = await runCli(dir, ['doctor'], machine.env);

    assert.equal(status, 0, `doctor exited ${status}\n${stdout}\n${stderr}`);
    assert.match(stdout, passLine('repo-registry'));
    // "What is armed here" is answered without a second command, so all three identifying values
    // are compared whole rather than by pattern: two of them are paths.
    const line = stdout.split('\n').find((entry) => entry.startsWith('PASS  repo-registry'));
    assert.ok(line.includes(SEEDED_LABEL), `the check does not name the label:\n${line}`);
    assert.ok(line.includes(unitPath), `the check does not name the unit path:\n${line}`);
    assert.ok(line.includes('launchd'), `the check does not name the backend:\n${line}`);
  });

  await t.test('an entry whose unit file is gone warns, names the state and both remedies', async (subtest) => {
    const dir = await wiredFixture(subtest);
    const machine = await machineStateHome(subtest);
    const before = await snapshotTree(dir);
    seedRegistry(machine, { [repoSlug(dir)]: entryFor(dir, join(machine.root, 'a-unit-that-was-deleted.plist')) });

    const { status, stdout, stderr } = await runCli(dir, ['doctor'], machine.env);

    // Staleness is reported and never repaired by a read: the exit status does not move, and the
    // entry is still in the file afterwards — `daemon list --prune` is the only thing that drops one.
    assert.equal(status, 0, `a stale registry entry moved the exit status to ${status}\n${stdout}\n${stderr}`);
    assert.match(stderr, warnLine('repo-registry'));
    assert.match(stdout, CLEAN_SUMMARY);
    assert.match(stderr, /unit-missing/);
    assert.match(stderr, /daemon install/);
    assert.match(stderr, /daemon list --prune/);
    assert.ok(
      Object.hasOwn(JSON.parse(readFileSync(machine.file, 'utf8')).repos, repoSlug(dir)),
      'doctor pruned a stale entry a read may only report',
    );
    assert.deepEqual(await snapshotTree(dir), before, 'doctor wrote to the repository it was asked about');
  });
});

/**
 * The machine-local `watcher.env`, spelled from its parts the way the registry above is: this is
 * the file `autonomous-watcher.sh` sources for the cap every daemon on the machine inherits, so a
 * fixture written from the published name and key reads the contract rather than a restatement of
 * the code. It lives under `XDG_CONFIG_HOME`, not `XDG_STATE_HOME` — a different base from the
 * registry, which is why the cases below redirect both.
 */
const WATCHER_ENV_FILE = 'watcher.env';
const MAX_PARALLEL_RUNS_KEY = 'MAX_PARALLEL_RUNS';

/** A cap that is not the shipped `5`, so a hardcoded default cannot satisfy the assertion. */
const FOOTPRINT_CAP = '3';

/**
 * The shipped cap, read from the shell that declares it rather than spelled here.
 *
 * `MAX_PARALLEL_RUNS_DEFAULT` in the watcher template is the definition of record and the doctor
 * check carries a mirror of it, so the number is the one thing this case may not restate: a literal
 * would agree with the mirror and let the two halves drift apart in silence.
 */
function shippedParallelRunsDefault() {
  const template = readFileSync(join(PACKAGE_ROOT, 'templates', 'scripts', 'autonomous-watcher.sh'), 'utf8');
  const match = /^MAX_PARALLEL_RUNS_DEFAULT=([0-9]+)$/m.exec(template);
  assert.ok(match, 'the watcher template declares no MAX_PARALLEL_RUNS_DEFAULT, so nothing here is testable');
  return match[1];
}

/** A model that is not {@link DEFAULTS}`.agentModel`, for the same reason. */
const FOOTPRINT_MODEL = 'harness-fixture-model-appears-nowhere-else';

/** An effort level that is no schema default, for the field that has none. */
const FOOTPRINT_EFFORT = 'harness-fixture-effort-appears-nowhere-else';

/** What a field reads as when the read that would have answered it could not be made. */
const UNKNOWN_FIELD = 'unknown';

/** One repository's **run** registry, at `<stateDir>/autonomous_logs/registry.json`. */
const RUN_LOGS_DIR = 'autonomous_logs';
const RUN_REGISTRY_FILE = 'registry.json';

/** A pid no process holds, for the half of the live-run predicate that asks the kernel. */
const DEAD_PID = 999999;

/**
 * A machine for the footprint cases: a throwaway `XDG_STATE_HOME` for the registry **and** a
 * throwaway `XDG_CONFIG_HOME` for the `watcher.env` the cap cell is read from.
 *
 * **Both, in every case**, for {@link machineStateHome}'s reason applied to the second file: the
 * cap is read from outside the repository, so a case that left `XDG_CONFIG_HOME` alone would let
 * the operator's own `watcher.env` — or its absence — decide what a fixture's row says.
 *
 * @param {import('node:test').TestContext} t
 * @param {{ cap?: string }} [options] `cap` writes that value as the machine-local default; omitted,
 *   no file is written and the shipped default is in force.
 */
async function footprintMachine(t, { cap } = {}) {
  const machine = await machineStateHome(t);
  const config = await machineHome(t);
  if (cap !== undefined) {
    mkdirSync(config.dir, { recursive: true });
    writeFileSync(join(config.dir, WATCHER_ENV_FILE), `${MAX_PARALLEL_RUNS_KEY}=${cap}\n`, 'utf8');
  }
  return { ...machine, configDir: config.dir, env: { ...machine.env, ...config.env } };
}

/**
 * The one report line for this check, from whichever stream carried it.
 *
 * Both streams, because the grade is the subject of half these cases: a `pass` narrates on stdout
 * and a `warn` on stderr, and a case asserting on the line's *content* must not have to know which
 * of the two it got before it can read it.
 */
function footprintLine(stdout, stderr) {
  return `${stdout}\n${stderr}`.split('\n').find((line) => /^(?:PASS|! WARN)\s+machine-footprint\s/.test(line));
}

/** Write one repository's run registry, in the shape `autonomous-watcher.sh` keeps it. */
function seedRunRegistry(root, runs) {
  const dir = join(root, STATE_DIR, RUN_LOGS_DIR);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, RUN_REGISTRY_FILE), `${JSON.stringify({ runs }, null, 2)}\n`, 'utf8');
}

/**
 * The machine-footprint check: what this machine is armed to run, and at what settings.
 *
 * Two properties, and every case below is one of them. **It reports** — the slug, project, root,
 * model, effort, live-run count and per-repository cap of each registered repository, read from
 * each entry's own checkout rather than from this one. **It can neither fail nor write** — the
 * registry is not consulted before a run starts (`docs/watcher.md` §5), so nothing found here can
 * stop one, and every read is of a file this check may only report on: a stale row is named, never
 * pruned, and `machineStateDir()` is not brought into being by asking.
 */
test('the machine-footprint check reports the machine, and never fails or writes', { concurrency: CASE_CONCURRENCY }, async (t) => {
  const subtests = [];

  subtests.push(t.test('an armed machine is reported entry by entry, with each row read from its own checkout', async (subtest) => {
    const here = await wiredFixture(subtest);
    const other = await wiredFixture(subtest);
    const machine = await footprintMachine(subtest, { cap: FOOTPRINT_CAP });
    const unitPath = await seededUnitFile(subtest);
    // A model and an effort on one root only: a row that printed a hardcoded `opus` would satisfy
    // the other row's assertion and fail this one, which is the point of setting them on exactly one
    // of the two. Effort has no schema default, so the unset root exercises the bespoke
    // absence sentence while this one exercises the set value.
    editJson(other, CONFIG_FILE, (config) => {
      config.agentModel = FOOTPRINT_MODEL;
      config.agentEffort = FOOTPRINT_EFFORT;
    });
    seedRegistry(machine, {
      [repoSlug(here)]: { ...entryFor(here, unitPath), projectName: 'footprint-alpha' },
      [repoSlug(other)]: { ...entryFor(other, unitPath), projectName: 'footprint-beta' },
    });

    const { status, stdout, stderr } = await runCli(here, ['doctor'], machine.env);

    assert.equal(status, 0, `doctor exited ${status}\n${stdout}\n${stderr}`);
    assert.match(stdout, passLine('machine-footprint'));
    const line = footprintLine(stdout, stderr);
    for (const value of [
      repoSlug(here),
      repoSlug(other),
      'project=footprint-alpha',
      'project=footprint-beta',
      here,
      other,
      `model=${DEFAULTS.agentModel}`,
      `model=${FOOTPRINT_MODEL}`,
      `effort=${FOOTPRINT_EFFORT}`,
      "effort=unpinned, so the runtime's own default applies",
      'armed=2 stale=0',
    ]) {
      assert.ok(line.includes(value), `the check does not name ${value}:\n${line}`);
    }

    // The cap is per repository, so it is asserted per row rather than once in the sentence: a
    // single machine-scoped cell would assert a ceiling the tree does not have.
    const rows = line.split(' | ');
    assert.equal(rows.length, 2, `the report did not print one row per registered repository:\n${line}`);
    for (const row of rows) {
      assert.ok(row.includes(`cap=${FOOTPRINT_CAP}`), `a row carries no cap cell from the machine-local default:\n${row}`);
    }
  }));

  subtests.push(t.test('with no machine-local watcher.env, the cap cell reports the shipped default', async (subtest) => {
    const dir = await wiredFixture(subtest);
    // No `cap`, so no `watcher.env` is written at all: the only path that exercises the default the
    // shell's `:-` applies. Every other case here overrides it, which is what left this path
    // unasserted while three copies of the number accumulated.
    const machine = await footprintMachine(subtest);
    seedRegistry(machine, { [repoSlug(dir)]: entryFor(dir, await seededUnitFile(subtest)) });

    const { status, stdout, stderr } = await runCli(dir, ['doctor'], machine.env);

    assert.equal(status, 0, `doctor exited ${status}\n${stdout}\n${stderr}`);
    const line = footprintLine(stdout, stderr);
    assert.ok(
      line.includes(`cap=${shippedParallelRunsDefault()}`),
      `the row does not report the shipped default the watcher applies:\n${line}`,
    );
  }));

  subtests.push(t.test('a checkout whose configuration could not be read reads unknown, never the schema default', async (subtest) => {
    const here = await wiredFixture(subtest);
    const unwired = await wiredFixture(subtest);
    const machine = await footprintMachine(subtest, { cap: FOOTPRINT_CAP });
    const unitPath = await seededUnitFile(subtest);
    // Graded `ok` — root present, a repository, unit file installed — but with nothing to read the
    // run-shaped fields from. `loadConfig` reports that by RETURN, so a `try`/`catch` around it
    // never fires and the `??` defaults would print `model=opus` for a repository this process read
    // no model from at all. The row must say `unknown`, as the shell half's `—` does.
    await rm(join(unwired, CONFIG_FILE));
    seedRegistry(machine, {
      [repoSlug(here)]: { ...entryFor(here, unitPath), projectName: 'footprint-wired' },
      [repoSlug(unwired)]: { ...entryFor(unwired, unitPath), projectName: 'footprint-unwired' },
    });

    const { status, stdout, stderr } = await runCli(here, ['doctor'], machine.env);

    assert.equal(status, 0, `doctor exited ${status}\n${stdout}\n${stderr}`);
    const line = footprintLine(stdout, stderr);
    assert.ok(line.includes('armed=2 stale=0'), `the unwired entry was not graded ok:\n${line}`);
    const rows = line.split(' | ');
    const row = rows.find((candidate) => candidate.includes('project=footprint-unwired'));
    assert.ok(row !== undefined, `no row for the unwired checkout:\n${line}`);
    assert.ok(row.includes(`model=${UNKNOWN_FIELD}`), `an unreadable configuration did not read unknown:\n${row}`);
    assert.ok(row.includes(`effort=${UNKNOWN_FIELD}`), `an unreadable configuration did not read unknown:\n${row}`);
    assert.ok(
      !row.includes(`model=${DEFAULTS.agentModel}`),
      `the row reports the schema default as a value it read from that checkout:\n${row}`,
    );
    // The neighbour still reads its own, so the case cannot pass by degrading every row.
    const wiredRow = rows.find((candidate) => candidate.includes('project=footprint-wired'));
    assert.ok(
      wiredRow.includes(`model=${DEFAULTS.agentModel}`),
      `a readable configuration stopped being read:\n${wiredRow}`,
    );
  }));

  subtests.push(t.test('staleness is reported, never counted as armed and never repaired', async (subtest) => {
    const dir = await wiredFixture(subtest);
    const machine = await footprintMachine(subtest, { cap: FOOTPRINT_CAP });
    const gone = join(machine.root, 'a-checkout-that-was-removed');
    seedRegistry(machine, {
      [repoSlug(dir)]: entryFor(dir, join(machine.root, 'a-unit-that-was-deleted.plist')),
      [repoSlug(gone)]: entryFor(gone, await seededUnitFile(subtest)),
    });
    const seeded = readFileSync(machine.file, 'utf8');

    const { status, stdout, stderr } = await runCli(dir, ['doctor'], machine.env);

    assert.equal(status, 0, `a stale registry moved the exit status to ${status}\n${stdout}\n${stderr}`);
    assert.match(stderr, warnLine('machine-footprint'));
    assert.doesNotMatch(stderr, failLine('machine-footprint'));
    assert.match(stdout, CLEAN_SUMMARY);
    // Read off this check's own line: `repo-registry` reports the same checkout one line above, so
    // a whole-output match for either state word would pass on the neighbour's sentence.
    const line = footprintLine(stdout, stderr);
    for (const value of ['unit-missing', 'root-missing', 'armed=0 stale=2']) {
      assert.ok(line.includes(value), `the check does not name ${value}:\n${line}`);
    }
    // Pruning is `daemon list --prune`'s; a read may only report.
    assert.deepEqual(Object.keys(readJson(machine.file).repos).sort(), [repoSlug(dir), repoSlug(gone)].sort());
    assert.equal(readFileSync(machine.file, 'utf8'), seeded, 'doctor rewrote a registry it may only read');
  }));

  subtests.push(t.test('a registry that is absent, empty or unparseable warns identically and never fails', async (subtest) => {
    const dir = await wiredFixture(subtest);
    const machine = await footprintMachine(subtest);

    const absent = await runCli(dir, ['doctor'], machine.env);
    assert.equal(absent.status, 0, `doctor exited ${absent.status} with no registry\n${absent.stdout}\n${absent.stderr}`);
    assert.match(absent.stderr, warnLine('machine-footprint'));
    assert.doesNotMatch(absent.stderr, /^!! FAIL/m);

    // Fails open in every mode: an unreadable index and an empty one are the same answer, and the
    // exit status is the no-registry run's rather than merely being zero.
    for (const [label, body] of [['a zero-byte file', ''], ['a truncated object', '{']]) {
      mkdirSync(dirname(machine.file), { recursive: true });
      writeFileSync(machine.file, body, 'utf8');

      const { status, stdout, stderr } = await runCli(dir, ['doctor'], machine.env);

      assert.equal(status, absent.status, `${label} moved the exit status to ${status}\n${stdout}\n${stderr}`);
      assert.match(stderr, warnLine('machine-footprint'), `${label} did not warn\n${stderr}`);
      assert.doesNotMatch(stderr, /^!! FAIL/m, `${label} produced a failure\n${stderr}`);
      assert.match(stdout, CLEAN_SUMMARY);
    }
  }));

  subtests.push(t.test('it writes nothing — not the repository, not the registry, not the machine directory', async (subtest) => {
    const dir = await wiredFixture(subtest);
    const machine = await footprintMachine(subtest);
    const before = await snapshotTree(dir);

    const absent = await runCli(dir, ['doctor'], machine.env);

    assert.equal(absent.status, 0, `doctor exited ${absent.status}\n${absent.stdout}\n${absent.stderr}`);
    // The half of the "writes nothing" contract the repository snapshot cannot see: asking what
    // else is armed must not bring the machine-local directory into being.
    assert.equal(existsSync(machine.dir), false, `${machine.dir} was created by a check that only reads`);
    assert.deepEqual(await readdir(machine.root), [], `doctor wrote under ${machine.root}`);
    assert.deepEqual(await snapshotTree(dir), before, 'doctor wrote to the repository it was asked about');

    const unitPath = await seededUnitFile(subtest);
    seedRegistry(machine, { [repoSlug(dir)]: entryFor(dir, unitPath) });
    const seeded = readFileSync(machine.file, 'utf8');

    const seededRun = await runCli(dir, ['doctor'], machine.env);

    assert.equal(seededRun.status, 0, `doctor exited ${seededRun.status}\n${seededRun.stdout}\n${seededRun.stderr}`);
    assert.equal(readFileSync(machine.file, 'utf8'), seeded, 'doctor rewrote the registry it read');
    assert.deepEqual(await snapshotTree(dir), before, 'doctor wrote to the repository it was asked about');
  }));

  subtests.push(t.test('a live run is counted by status and by pid, not by pid alone', async (subtest) => {
    const dir = await wiredFixture(subtest);
    const machine = await footprintMachine(subtest, { cap: FOOTPRINT_CAP });
    const unitPath = await seededUnitFile(subtest);
    // Three records, one live. The third is what makes the case discriminate: a bare `kill -0` walk
    // — the watcher's own `running_count`, which applies no status filter — would report 2, so this
    // fails if either half of the predicate drops the `status === 'running'` condition.
    seedRunRegistry(dir, {
      'run-alive-and-running': { status: 'running', pid: process.pid },
      'run-running-but-dead': { status: 'running', pid: DEAD_PID },
      'run-alive-but-parked': { status: 'parked', pid: process.pid },
    });
    seedRegistry(machine, { [repoSlug(dir)]: entryFor(dir, unitPath) });

    const { status, stdout, stderr } = await runCli(dir, ['doctor'], machine.env);

    assert.equal(status, 0, `doctor exited ${status}\n${stdout}\n${stderr}`);
    assert.match(stdout, passLine('machine-footprint'));
    const line = footprintLine(stdout, stderr);
    for (const value of ['live=1', 'armed=1 stale=0 live=1']) {
      assert.ok(line.includes(value), `the check does not report ${value}:\n${line}`);
    }
  }));

  subtests.push(t.test('an unreadable configuration reports live=0 — the schema-default registry is never read', async (subtest) => {
    const here = await wiredFixture(subtest);
    const unwired = await wiredFixture(subtest);
    const machine = await footprintMachine(subtest, { cap: FOOTPRINT_CAP });
    const unitPath = await seededUnitFile(subtest);
    // A registry under the SCHEMA-DEFAULT stateDir, holding one record that is live by both halves
    // of the predicate — then the configuration naming that stateDir is removed. With no readable
    // config the directory is a guess at this checkout's layout, so neither consumer may read it:
    // `autonomous-watcher.sh`'s `footprint_live_runs` reaches it through `hr_state_path`, which
    // fails with the config read and prints `0`. A row reading `live=1` here is the two halves
    // reporting one machine differently. The subtest above uses a WIRED root and cannot see this.
    seedRunRegistry(unwired, { 'run-alive-and-running': { status: 'running', pid: process.pid } });
    await rm(join(unwired, CONFIG_FILE));
    seedRegistry(machine, {
      [repoSlug(here)]: { ...entryFor(here, unitPath), projectName: 'footprint-wired' },
      [repoSlug(unwired)]: { ...entryFor(unwired, unitPath), projectName: 'footprint-unwired' },
    });

    const { status, stdout, stderr } = await runCli(here, ['doctor'], machine.env);

    assert.equal(status, 0, `doctor exited ${status}\n${stdout}\n${stderr}`);
    const line = footprintLine(stdout, stderr);
    const row = line.split(' | ').find((candidate) => candidate.includes('project=footprint-unwired'));
    assert.ok(row !== undefined, `no row for the unwired checkout:\n${line}`);
    assert.ok(row.includes('live=0'), `the row counted a registry it could not locate:\n${row}`);
    // And into the summary, which is the number acceptance names: armed by the registry entry's
    // grade, live=0 by the unreadable configuration.
    assert.ok(line.includes('armed=2 stale=0 live=0'), `the summary does not report live=0:\n${line}`);
  }));

  await Promise.all(subtests);
});

/**
 * Where each backend loads a **user** unit from, relative to the account home.
 *
 * Spelled as literals for the reason the registry section above gives: these are the published
 * install locations (`docs/cli.md` §9), so a fixture written against them is written against the
 * contract rather than against a restatement of the code that has to satisfy it. Redirecting `HOME`
 * is what makes them a test's directories instead of the account's — a case that forgot it would
 * read, and on the defect it exists to catch install into, the real `LaunchAgents` of whoever runs
 * the suite.
 */
const UNIT_DIR = Object.freeze({
  launchd: ['Library', 'LaunchAgents'],
  systemd: ['.config', 'systemd', 'user'],
});

/** The `PATH` a launchd agent runs on when its unit carries no environment key — launchd's own. */
const SERVICE_MANAGER_DEFAULT_PATH = '/usr/bin:/bin:/usr/sbin:/sbin';

/** An agent binary no machine has, so what resolves it is a directory this test made. */
const FIXTURE_AGENT_CLI = 'harness-fixture-agent';

/**
 * Two project-toolchain binaries no machine has, for the cases that rewrite a wrapper's command line.
 *
 * **Neither name is a prefix of the other, and that is load-bearing**: the case asserting both are
 * named reads with `String.prototype.includes`, which a shared stem would satisfy from one hit.
 */
const FIXTURE_TOOLCHAIN_BINARY = 'harness-fixture-toolchain';
const FIXTURE_LINTER_BINARY = 'harness-fixture-linter';

/**
 * The variable the watcher reaches its agent binary through, and the name it falls back to when no
 * unit sets it — `autonomous-watcher.sh`'s `AGENT_CLI="${HARNESS_AGENT_CLI:-claude}"`.
 *
 * Spelled as literals for the reason the unit directories above are: these are the shipped script's
 * strings, so a fixture written against them is written against the contract rather than against a
 * restatement of the code that has to satisfy it. The default is what an unedited unit resolves —
 * `daemon/units.ts` choice 5 renders `PATH` and nothing else — so it is what these cases stub.
 */
const AGENT_CLI_VARIABLE = 'HARNESS_AGENT_CLI';
const DEFAULT_AGENT_CLI = 'claude';

/**
 * Add one environment variable to an installed unit by hand, in that backend's own shape.
 *
 * This is the only way a unit carries `HARNESS_AGENT_CLI` today, which is why it is written here
 * rather than asked of {@link renderUnit}: an operator's edit is the case under test. Both forms are
 * anchored on the rendered `PATH`, so the addition lands in the same stanza the service manager
 * reads — appended to a systemd file it would fall into `[Install]` and be ignored.
 */
function withUnitVariable(kind, text, key, value) {
  if (kind === 'launchd') {
    const anchor = '    <key>PATH</key>';
    assert.ok(text.includes(anchor), 'the rendered plist carries no PATH entry to add a variable beside');
    return text.replace(anchor, `    <key>${key}</key>\n    <string>${value}</string>\n${anchor}`);
  }
  const anchor = text.split('\n').find((line) => line.startsWith('Environment="PATH='));
  assert.ok(anchor, 'the rendered unit carries no PATH directive to add a variable beside');
  return text.replace(anchor, `${anchor}\nEnvironment="${key}=${value}"`);
}

/** A throwaway account home, so every path the CLI resolves under `~` is this test's. */
async function throwawayHome(t) {
  const home = await mkdtemp(join(tmpdir(), 'harness-home-'));
  t.after(() => rm(home, { recursive: true, force: true }));
  return home;
}

/** A directory of executable stubs — a toolchain that really resolves, at a path the test knows. */
async function toolchainDir(t, names) {
  const dir = await mkdtemp(join(tmpdir(), 'harness-toolchain-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  for (const name of names) writeFileSync(join(dir, name), '#!/bin/sh\nexit 0\n', { mode: 0o755 });
  return dir;
}

/**
 * Install a unit for this host's backend into a throwaway home, carrying a chosen `PATH`.
 *
 * Rendered through the CLI's own {@link renderUnit} rather than hand-written, because the two halves
 * under test are exactly the renderer and the reader: a check that parsed a shape the renderer does
 * not write would pass every hand-written fixture and grade no real unit.
 */
async function installUnitCarrying(t, dir, envPath) {
  const home = await throwawayHome(t);
  const unitDir = join(home, ...UNIT_DIR[BACKEND.kind]);
  const unit = renderUnit({
    backend: { kind: BACKEND.kind, reason: 'this host, with its unit directory redirected', unitPath: unitDir },
    config: readJson(join(dir, CONFIG_FILE)),
    repoRoot: dir,
    watcherPath: join(dir, 'scripts', WATCHER_FILE),
    envPath,
  });
  mkdirSync(unitDir, { recursive: true });
  writeFileSync(unit.targetPath, unit.text, 'utf8');
  return { home, unit };
}

/**
 * Rewrite the command line inside a wrapper `init` wrote, leaving the rest of the file alone.
 *
 * **It edits the generated file rather than composing one.** The rule `wrapperCommandLine` keys on is
 * the templates' own argument-forwarding convention, so a hand-written fixture would let the parse and
 * the render drift apart with every case still green — the same reason {@link installUnitCarrying}
 * renders through `renderUnit`. Rewriting that one line is the realistic state rather than a
 * contrivance: the wrappers are create-if-absent and `generators/scripts.ts`'s `writeWrapperScripts`
 * hands the raw command line to the adopter — *"the raw command line in each wrapper is the adopter's
 * to correct"*.
 *
 * The predicate is `generators/scripts.ts`'s `wrapperCommandLine`, spelled the same way — unindented,
 * not a comment, **containing** `"$@"` — and the rewrite splices at the match rather than replacing the
 * line, because `start-dev-server.sh` renders redirection and a `&` after the arguments.
 *
 * The single-match assertion is what stops a silent no-op: a template that stopped rendering the
 * forwarding line, or grew a second one, would otherwise leave the case grading the command `init`
 * derived from the fixture's `package.json`.
 */
function rewriteWrapperCommand(dir, file, command) {
  const path = join(dir, 'scripts', file);
  const lines = readFileSync(path, 'utf8').split('\n');
  const forwarding = lines
    .map((line, index) => ({ line, index }))
    .filter(({ line }) => !/^\s/.test(line) && !line.startsWith('#') && line.includes('"$@"'));
  assert.equal(forwarding.length, 1, `${file} carries ${forwarding.length} argument-forwarding lines, not one`);
  // Spliced by index rather than through `String.replace`, whose replacement string would read a `$`
  // in the command as a capture reference.
  const { line, index } = forwarding[0];
  lines[index] = command + line.slice(line.search(/\s*"\$@"/));
  writeFileSync(path, lines.join('\n'), 'utf8');
}

/** One report line by status and check id, whole, for an assertion that reads a detail rather than a grade. */
function reportLine(output, status, id) {
  const prefix = status === 'pass' ? 'PASS  ' : status === 'warn' ? '! WARN  ' : '!! FAIL  ';
  return output.split('\n').find((line) => line.startsWith(`${prefix}${id}`));
}

/**
 * The daemon-path check: whether the `PATH` in the **installed unit file** reaches the binaries an
 * unattended run invokes by name.
 *
 * **The asymmetry is the whole subject.** `doctor` runs in a login shell where the adopter's package
 * manager and agent CLI resolve by construction, so it can say nothing about the environment a
 * service manager gives the daemon — except by reading the file that environment comes from. Each
 * case below therefore fixes the unit's `PATH` and the shell's `PATH` **separately**, and asserts
 * against the first: a case that let them be the same value would pass whatever the check read.
 *
 * The grade never rises above a warning, which is what the exit-status assertion in each case is
 * for: a foreground run is unaffected by any of this, and the remedy is an operator step.
 */
test('the daemon-path check grades the installed unit, and never above a warning', { concurrency: CASE_CONCURRENCY }, async (t) => {
  const subtests = [];

  subtests.push(t.test('a unit whose PATH reaches every required binary passes', { skip: NO_BACKEND }, async (subtest) => {
    const dir = await wiredFixture(subtest);
    const toolchain = await toolchainDir(subtest, [DEFAULT_AGENT_CLI]);
    // The agent CLI is the one required binary no machine supplies, so it is supplied here — and the
    // unit is given the same directory the shell has, which is the state a fresh `daemon install`
    // leaves behind. It is stubbed under the *default* name because the unit sets no
    // `HARNESS_AGENT_CLI`, and the shell's value below is one no machine resolves: the check grades
    // what the daemon will launch, so this passes.
    const envPath = `${toolchain}${delimiter}${process.env.PATH ?? ''}`;
    const { home, unit } = await installUnitCarrying(subtest, dir, envPath);
    const before = await snapshotTree(dir);

    const env = { HOME: home, PATH: envPath, [AGENT_CLI_VARIABLE]: FIXTURE_AGENT_CLI };
    const { status, stdout, stderr } = await runCli(dir, ['doctor'], env);

    assert.equal(status, 0, `doctor exited ${status}\n${stdout}\n${stderr}`);
    assert.match(stdout, passLine('daemon-path'));
    const line = reportLine(stdout, 'pass', 'daemon-path');
    assert.ok(line.includes(unit.targetPath), `the check does not name the unit it graded:\n${line}`);
    assert.ok(line.includes(DEFAULT_AGENT_CLI), `the check does not name the agent binary it graded:\n${line}`);
    assert.deepEqual(await snapshotTree(dir), before, 'doctor wrote to the repository it was asked about');
  }));

  subtests.push(t.test('a unit left on the service manager\'s own directories warns and names what it cannot reach', { skip: NO_BACKEND }, async (subtest) => {
    const dir = await wiredFixture(subtest);
    const toolchain = await toolchainDir(subtest, [DEFAULT_AGENT_CLI]);
    const { home } = await installUnitCarrying(subtest, dir, SERVICE_MANAGER_DEFAULT_PATH);

    // The shell resolves the agent and the unit does not, which is the only configuration in which
    // the finding is the check's rather than the machine's. The shell's `HARNESS_AGENT_CLI` names a
    // third binary, which the daemon never sees and the warning must therefore never mention.
    const env = {
      HOME: home,
      PATH: `${toolchain}${delimiter}${process.env.PATH ?? ''}`,
      [AGENT_CLI_VARIABLE]: FIXTURE_AGENT_CLI,
    };
    const { status, stdout, stderr } = await runCli(dir, ['doctor'], env);

    assert.equal(status, 0, `doctor exited ${status} on a condition that only warns\n${stdout}\n${stderr}`);
    assert.match(stderr, warnLine('daemon-path'));
    assert.match(stdout, CLEAN_SUMMARY);
    const line = reportLine(stderr, 'warn', 'daemon-path');
    assert.ok(line.includes(DEFAULT_AGENT_CLI), `the warning does not name the binary the daemon cannot reach:\n${line}`);
    assert.ok(
      !line.includes(FIXTURE_AGENT_CLI),
      `the warning names the shell's agent CLI, which no daemon-launched run invokes:\n${line}`,
    );
    // Naming where it *does* live is what turns the warning into something an operator can act on
    // without a second command: the remedy is to re-render from a shell that holds this directory.
    assert.ok(line.includes(toolchain), `the warning does not name the directory that binary lives in:\n${line}`);
    assert.match(stderr, /daemon install --force/);
  }));

  subtests.push(t.test("the shell's agent CLI variable changes nothing that is graded", { skip: NO_BACKEND }, async (subtest) => {
    // The property, stated once: the daemon inherits the service manager's environment, so the
    // variable `doctor` was started with is not the one the watcher will read. Two runs that differ
    // only in it must produce the same line — the assertion that stops the next reader restoring a
    // `process.env` read, which would grade the shell doctor was typed at.
    const dir = await wiredFixture(subtest);
    const toolchain = await toolchainDir(subtest, [DEFAULT_AGENT_CLI]);
    const envPath = `${toolchain}${delimiter}${process.env.PATH ?? ''}`;
    const { home } = await installUnitCarrying(subtest, dir, envPath);

    // An empty value stands in for an unset one: `${HARNESS_AGENT_CLI:-claude}` reads them alike,
    // and it holds whether or not the account running this suite exports the variable.
    const base = { HOME: home, PATH: envPath };
    const unset = await runCli(dir, ['doctor'], { ...base, [AGENT_CLI_VARIABLE]: '' });
    const set = await runCli(dir, ['doctor'], { ...base, [AGENT_CLI_VARIABLE]: FIXTURE_AGENT_CLI });

    const line = reportLine(unset.stdout, 'pass', 'daemon-path');
    assert.ok(line, `the run without ${AGENT_CLI_VARIABLE} did not pass daemon-path\n${unset.stdout}\n${unset.stderr}`);
    assert.equal(set.status, unset.status, `${AGENT_CLI_VARIABLE} moved doctor's exit status\n${set.stdout}\n${set.stderr}`);
    assert.equal(
      reportLine(set.stdout, 'pass', 'daemon-path'),
      line,
      `${AGENT_CLI_VARIABLE} changed the daemon-path line:\n${set.stdout}\n${set.stderr}`,
    );
  }));

  subtests.push(t.test('a unit that sets the agent CLI variable is graded against the CLI it names', { skip: NO_BACKEND }, async (subtest) => {
    // The override the daemon actually honours, and the only way it exists: a hand edit to the
    // installed unit, because the renderer writes `PATH` and nothing else. Grading it is what keeps
    // the check reading the environment the watcher runs on rather than a name assumed here.
    const dir = await wiredFixture(subtest);
    const toolchain = await toolchainDir(subtest, [FIXTURE_AGENT_CLI]);
    const { home, unit } = await installUnitCarrying(subtest, dir, SERVICE_MANAGER_DEFAULT_PATH);
    writeFileSync(
      unit.targetPath,
      withUnitVariable(BACKEND.kind, readFileSync(unit.targetPath, 'utf8'), AGENT_CLI_VARIABLE, FIXTURE_AGENT_CLI),
      'utf8',
    );

    const env = { HOME: home, PATH: `${toolchain}${delimiter}${process.env.PATH ?? ''}` };
    const { status, stdout, stderr } = await runCli(dir, ['doctor'], env);

    assert.equal(status, 0, `doctor exited ${status} on a condition that only warns\n${stdout}\n${stderr}`);
    assert.match(stderr, warnLine('daemon-path'));
    const line = reportLine(stderr, 'warn', 'daemon-path');
    assert.ok(line.includes(FIXTURE_AGENT_CLI), `the warning does not name the CLI the unit launches:\n${line}`);
    assert.ok(!line.includes(DEFAULT_AGENT_CLI), `the warning grades the default the unit overrides:\n${line}`);
  }));

  subtests.push(t.test('a toolchain reached only through a wrapper is graded, and the warning says which wrapper', { skip: NO_BACKEND }, async (subtest) => {
    // Finding 66's first half, in miniature: the repository's toolchain is off the service manager's
    // PATH and resolves only from the shell `doctor` was typed at. `commands.test` holds the wrapper
    // invocation `init` writes, so the value's own head is `bash` — grading that is what answered
    // `PASS  daemon-path … git, jq, claude, bash` on a unit whose runs died at `command not found`.
    const dir = await wiredFixture(subtest);
    rewriteWrapperCommand(dir, 'test.sh', FIXTURE_TOOLCHAIN_BINARY);

    // Two directories, per this test's standing rule: the unit reaches the agent CLI and this
    // machine's own toolchain and *not* the fixture binary; the shell reaches the fixture binary.
    const unitToolchain = await toolchainDir(subtest, [DEFAULT_AGENT_CLI]);
    const shellToolchain = await toolchainDir(subtest, [FIXTURE_TOOLCHAIN_BINARY]);
    const { home } = await installUnitCarrying(subtest, dir, `${unitToolchain}${delimiter}${process.env.PATH ?? ''}`);

    const env = { HOME: home, PATH: `${shellToolchain}${delimiter}${process.env.PATH ?? ''}` };
    const { status, stdout, stderr } = await runCli(dir, ['doctor'], env);

    assert.equal(status, 0, `doctor exited ${status} on a condition that only warns\n${stdout}\n${stderr}`);
    assert.match(stderr, warnLine('daemon-path'));
    assert.match(stdout, CLEAN_SUMMARY);
    const line = reportLine(stderr, 'warn', 'daemon-path');
    assert.ok(line.includes(FIXTURE_TOOLCHAIN_BINARY), `the warning does not name the binary the wrapper runs:\n${line}`);
    assert.ok(
      line.includes(`${FIXTURE_TOOLCHAIN_BINARY} (commands.test → scripts/test.sh`),
      `the warning does not say which wrapper the binary was derived from:\n${line}`,
    );
    // Naming where it does resolve is what shows an operator that their shell and their daemon
    // disagree, which is the whole finding: the foreground command works and the run does not.
    assert.ok(line.includes(shellToolchain), `the warning does not name the directory the binary lives in:\n${line}`);
  }));

  subtests.push(t.test('the same repository passes once the unit reaches that toolchain, and the two states read differently', { skip: NO_BACKEND }, async (subtest) => {
    // Finding 66's second half — *"passes once the unit is re-rendered from a shell that reaches
    // it"* — on the same repository as the case above. What it measured there was a `daemon-path`
    // line that came back **byte-identical** across a working and a broken unit, so the assertion is
    // not only that this passes but that the pass names the binary and where it came from: the two
    // states have to be distinguishable by reading the report.
    const dir = await wiredFixture(subtest);
    rewriteWrapperCommand(dir, 'test.sh', FIXTURE_TOOLCHAIN_BINARY);

    const toolchain = await toolchainDir(subtest, [DEFAULT_AGENT_CLI, FIXTURE_TOOLCHAIN_BINARY]);
    const { home } = await installUnitCarrying(subtest, dir, `${toolchain}${delimiter}${process.env.PATH ?? ''}`);
    const before = await snapshotTree(dir);

    // The shell is left without either binary, so the grade is decided by the unit's value alone.
    const { status, stdout, stderr } = await runCli(dir, ['doctor'], { HOME: home, PATH: process.env.PATH ?? '' });

    assert.equal(status, 0, `doctor exited ${status}\n${stdout}\n${stderr}`);
    assert.match(stdout, passLine('daemon-path'));
    assert.match(stdout, CLEAN_SUMMARY);
    const line = reportLine(stdout, 'pass', 'daemon-path');
    assert.ok(
      line.includes(`${FIXTURE_TOOLCHAIN_BINARY} (commands.test → scripts/test.sh)`),
      `the pass does not name the binary it graded with the wrapper it came from:\n${line}`,
    );
    // This branch adds reads under `scriptsDir`, and a `readFileSync` on a missing path is the one
    // way a check of this shape starts repairing what it was asked about.
    assert.deepEqual(await snapshotTree(dir), before, 'doctor wrote to the repository it was asked about');
  }));

  subtests.push(t.test('a wrapper whose command line cannot be read is named as ungraded, not silently dropped', { skip: NO_BACKEND }, async (subtest) => {
    // The two ways an adopter's tree stops answering, on one fixture: a body this parse does not
    // recognise, and a file that is not there at all. Both are reports — an edited or deleted
    // wrapper must not throw, must not fail, and must not be quietly left out of a universal claim.
    // They are asserted *apart*, because their remedies are not interchangeable: the edited body is
    // repaired in place, and the deleted file has no line to reduce and nothing to read, so only
    // `init` clears it. Asserting merely that both are named is what let one remedy ship over both.
    const dir = await wiredFixture(subtest);
    writeFileSync(
      join(dir, 'scripts', 'test.sh'),
      '#!/usr/bin/env bash\nset -uo pipefail\necho "an adopter rewrote this and forwards nothing"\n',
      'utf8',
    );
    await rm(join(dir, 'scripts', 'typecheck.sh'), { force: true });

    const toolchain = await toolchainDir(subtest, [DEFAULT_AGENT_CLI]);
    const { home } = await installUnitCarrying(subtest, dir, `${toolchain}${delimiter}${process.env.PATH ?? ''}`);

    const { status, stdout, stderr } = await runCli(dir, ['doctor'], { HOME: home, PATH: process.env.PATH ?? '' });

    assert.equal(status, 0, `doctor exited ${status} over an edited and a deleted wrapper\n${stdout}\n${stderr}`);
    assert.match(stdout, passLine('daemon-path'));
    assert.match(stdout, CLEAN_SUMMARY);
    const line = reportLine(stdout, 'pass', 'daemon-path');
    const edited = line.indexOf('commands.test (scripts/test.sh)');
    const deleted = line.indexOf('commands.typecheck (scripts/typecheck.sh)');
    assert.ok(edited >= 0, `the unreadable body is not named as ungraded:\n${line}`);
    assert.ok(deleted >= 0, `the missing wrapper is not named as ungraded:\n${line}`);
    // The parenthesised form is unique to these clauses — a binary's source list spells the same key
    // without its path — and the absent clause is appended last, so each name bounds its own clause.
    assert.ok(edited < deleted, `the two clauses are not in the order these slices assume:\n${line}`);
    const editedClause = line.slice(edited, deleted);
    const deletedClause = line.slice(deleted);
    assert.ok(
      editedClause.includes('Reduce it to one unindented'),
      `the edited wrapper is not given the remedy that repairs a line in place:\n${editedClause}`,
    );
    assert.ok(
      deletedClause.includes('init'),
      `the deleted wrapper is not told the one step that writes it back:\n${deletedClause}`,
    );
    assert.ok(
      !deletedClause.includes('Reduce it to one unindented'),
      `a file that does not exist is told to reduce a line it does not have:\n${deletedClause}`,
    );
    // The universal claim is qualified in the same breath as the clause: a check that could not see
    // one of the files it grades has not graded every binary a run invokes and must not say it has.
    assert.ok(
      line.includes('that could be derived here'),
      `the pass still claims to have reached every binary while naming wrappers it could not read:\n${line}`,
    );
  }));

  subtests.push(t.test('a wrapper line headed by an environment assignment is graded on the binary behind it', { skip: NO_BACKEND }, async (subtest) => {
    // A shell strips a leading `VAR=value` before it resolves the command, and the check has to strip
    // it for the same reason: taking the first token unconditionally graded `HARNESS_FIXTURE_FLAG=1`
    // as a binary, found it on no `PATH`, and warned on a correct machine under a remedy — re-render
    // the unit — that cannot clear it. The templates invite this line: `start-dev-server.sh`'s own
    // comment tells the adopter a variable "has to be given that variable on the raw line below".
    const assignment = 'HARNESS_FIXTURE_FLAG=1';
    const dir = await wiredFixture(subtest);
    rewriteWrapperCommand(dir, 'test.sh', `${assignment} ${FIXTURE_TOOLCHAIN_BINARY}`);

    const toolchain = await toolchainDir(subtest, [DEFAULT_AGENT_CLI, FIXTURE_TOOLCHAIN_BINARY]);
    const { home } = await installUnitCarrying(subtest, dir, `${toolchain}${delimiter}${process.env.PATH ?? ''}`);

    const { status, stdout, stderr } = await runCli(dir, ['doctor'], { HOME: home, PATH: process.env.PATH ?? '' });

    assert.equal(status, 0, `doctor exited ${status} on a unit that reaches every binary\n${stdout}\n${stderr}`);
    assert.match(stdout, passLine('daemon-path'));
    const line = reportLine(stdout, 'pass', 'daemon-path');
    assert.ok(
      line.includes(`${FIXTURE_TOOLCHAIN_BINARY} (commands.test → scripts/test.sh)`),
      `the pass does not grade the binary behind the assignment, with the wrapper it came from:\n${line}`,
    );
    assert.ok(!line.includes(assignment), `the assignment prefix is graded as though it were a binary:\n${line}`);
  }));

  subtests.push(t.test('a compound wrapper line names no binary and is reported ungraded rather than guessed at', { skip: NO_BACKEND }, async (subtest) => {
    // `typecheck.sh`, `test.sh` and `deploy.sh` all warn that a compound is unsupported — *"keep that
    // line one command rather than a compound"* — so it is a state the templates anticipate. Its head
    // is a builtin no `PATH` holds: grading it warns about a binary that exists on no machine, and
    // naming the key ungraded is both the honest answer and the signal that the line is off-convention.
    const dir = await wiredFixture(subtest);
    rewriteWrapperCommand(dir, 'test.sh', 'cd app && npm test');

    const toolchain = await toolchainDir(subtest, [DEFAULT_AGENT_CLI]);
    const { home } = await installUnitCarrying(subtest, dir, `${toolchain}${delimiter}${process.env.PATH ?? ''}`);

    const { status, stdout, stderr } = await runCli(dir, ['doctor'], { HOME: home, PATH: process.env.PATH ?? '' });

    assert.equal(status, 0, `doctor exited ${status} over a compound wrapper line\n${stdout}\n${stderr}`);
    assert.match(stdout, passLine('daemon-path'));
    assert.match(stdout, CLEAN_SUMMARY);
    const line = reportLine(stdout, 'pass', 'daemon-path');
    assert.ok(line.includes('commands.test (scripts/test.sh)'), `the compound line is not named as ungraded:\n${line}`);
    assert.ok(!/\bcd \(/.test(line), `the shell builtin heading the line is graded as a binary:\n${line}`);
    assert.ok(
      line.includes('that could be derived here'),
      `the pass still claims every binary while naming a line it could not reduce:\n${line}`,
    );
  }));

  subtests.push(t.test('a repository whose commands are wrappers alone grades its toolchain, which is where the defect was measured', { skip: NO_BACKEND }, async (subtest) => {
    // The Python or Go shape, built out of a Node fixture. `build` and `depInstall` hold raw command
    // lines, which is Node's accidental exemption — they are why `npm` was graded at all on the
    // repository Finding 66 measured, while nothing a run executes through a wrapper was. With them
    // gone the derived set is `git`, `jq`, the agent CLI and `bash`: *"effective coverage … one
    // binary"*. This case pins fix direction 4 without a Python or Go toolchain on the host.
    const dir = await wiredFixture(subtest);
    editJson(dir, CONFIG_FILE, (config) => {
      config.commands = { typecheck: config.commands.typecheck, test: config.commands.test };
    });
    rewriteWrapperCommand(dir, 'typecheck.sh', FIXTURE_LINTER_BINARY);
    rewriteWrapperCommand(dir, 'test.sh', FIXTURE_TOOLCHAIN_BINARY);

    const toolchain = await toolchainDir(subtest, [DEFAULT_AGENT_CLI]);
    const { home } = await installUnitCarrying(subtest, dir, `${SERVICE_MANAGER_DEFAULT_PATH}${delimiter}${toolchain}`);

    const { status, stdout, stderr } = await runCli(dir, ['doctor'], { HOME: home, PATH: process.env.PATH ?? '' });

    assert.equal(status, 0, `doctor exited ${status} on a condition that only warns\n${stdout}\n${stderr}`);
    assert.match(stderr, warnLine('daemon-path'));
    assert.match(stdout, CLEAN_SUMMARY);
    const line = reportLine(stderr, 'warn', 'daemon-path');
    assert.ok(
      line.includes(`${FIXTURE_TOOLCHAIN_BINARY} (commands.test → scripts/test.sh`),
      `the warning does not name the binary commands.test reaches through its wrapper:\n${line}`,
    );
    assert.ok(
      line.includes(`${FIXTURE_LINTER_BINARY} (commands.typecheck → scripts/typecheck.sh`),
      `the warning does not name the binary commands.typecheck reaches through its wrapper:\n${line}`,
    );
  }));

  subtests.push(t.test('a checkout with no unit installed is not graded, and does not repeat the registry warning', async (subtest) => {
    const dir = await wiredFixture(subtest);
    const home = await throwawayHome(subtest);
    const before = await snapshotTree(dir);

    const { status, stdout, stderr } = await runCli(dir, ['doctor'], { HOME: home });

    assert.equal(status, 0, `doctor exited ${status} against a checkout with no daemon\n${stdout}\n${stderr}`);
    assert.match(stdout, passLine('daemon-path'));
    assert.doesNotMatch(stderr, warnLine('daemon-path'));
    // The absence of a daemon is `repo-registry`'s line, one above this one. A second warning about
    // it would double the report of every repository that runs in the foreground, which is most of
    // them — so this line carries no remedy at all.
    assert.match(stderr, warnLine('repo-registry'));
    const line = reportLine(stdout, 'pass', 'daemon-path');
    assert.ok(!line.includes('daemon install'), `the not-graded line repeats the repo-registry remedy:\n${line}`);
    assert.deepEqual(await snapshotTree(dir), before, 'doctor wrote to the repository it was asked about');
  }));

  await Promise.all(subtests);
});

/** A deploy toolchain no machine has, and no prefix of the two binaries above — the same rule. */
const FIXTURE_DEPLOY_BINARY = 'harness-fixture-deployer';

/** The clause each non-graded class of the command-resolves report is spelled with, in the singular. */
const NOT_GRADED_HERE_ONE = 'is **not** graded here';

/**
 * The `command-resolves` check: whether the command every configured line actually runs is installed
 * on the `PATH` this run was given.
 *
 * **The state it exists for is one the three checks above answer clean about.** A repository can hold
 * a valid config, the wrapper invocation in every wrapped key, and every permission entry those keys
 * imply — and still have wrappers that exit 127 on every invocation, because nothing asked whether
 * the command *inside* the wrapper is on the machine. The first case below is that repository.
 *
 * **The other four are the states it must not fire on**, which is the harder half: an unfilled
 * placeholder has no command to resolve, a compound line is headed by a builtin no `PATH` holds, and
 * a relative head is resolved by the filesystem rather than by `PATH`. Each is reported as *not
 * graded* rather than warned about, because a warning naming a binary no machine has comes with a
 * remedy nobody can perform. The last case is the scope boundary against `daemon-path`: the two
 * checks grade different sets of wrappers, and one run shows both answers.
 */
test('the command-resolves check grades what each configured line runs, and never above a warning', async (t) => {
  await t.test('a wrapper heading a binary this machine does not have warns, and leaves the exit status at 0', async (subtest) => {
    const dir = await wiredFixture(subtest);
    rewriteWrapperCommand(dir, 'test.sh', FIXTURE_TOOLCHAIN_BINARY);
    const before = await snapshotTree(dir);

    const { status, stdout, stderr } = await runCli(dir, ['doctor']);

    assert.equal(status, 0, `doctor exited ${status} on a condition that only warns\n${stdout}\n${stderr}`);
    assert.match(stderr, warnLine('command-resolves'));
    assert.match(stdout, CLEAN_SUMMARY);
    const line = reportLine(stderr, 'warn', 'command-resolves');
    assert.ok(
      line.includes(`${FIXTURE_TOOLCHAIN_BINARY} (commands.test → scripts/test.sh)`),
      `the warning does not name the head with the line it came from:\n${line}`,
    );
    // What it costs and what to do about it, both on the line: a warning an operator cannot act on is
    // the reason this state stayed invisible while `command-wrappers` and `command-permissions` passed.
    assert.ok(line.includes('command not found'), `the warning does not say what the missing head costs:\n${line}`);
    assert.ok(line.includes('install the tool'), `the warning does not name the first remedy:\n${line}`);
    // The neighbouring questions this check is not, answered clean on the same report.
    assert.match(stdout, passLine('command-wrappers'));
    assert.match(stdout, passLine('command-permissions'));
    assert.deepEqual(await snapshotTree(dir), before, 'doctor wrote to the repository it was asked about');
  });

  await t.test('a repository whose command keys are all placeholders is not graded, and says which line covers them', async (subtest) => {
    // No manifest, so `init` detected nothing and every command key holds the placeholder it wrote.
    // A placeholder is not a command line, so there is no head to resolve and nothing here to warn
    // about — the unfilled key is the config check's line, and this one must not restate it.
    const fixture = await createFixture({ files: { 'README.md': '# fixture\n' } });
    subtest.after(fixture.cleanup);
    const wired = await runCli(fixture.dir, ['init']);
    assert.equal(wired.status, 0, `init exited ${wired.status}\n${wired.stdout}\n${wired.stderr}`);
    const config = readJson(join(fixture.dir, CONFIG_FILE));
    assert.match(config.commands.test, /configure this/, 'the fixture does not hold a placeholder to grade');

    const { status, stdout, stderr } = await runCli(fixture.dir, ['doctor']);

    assert.equal(status, 0, `doctor exited ${status} on a placeholder, which only warns\n${stdout}\n${stderr}`);
    assert.match(stdout, passLine('command-resolves'));
    assert.doesNotMatch(stderr, warnLine('command-resolves'));
    const line = reportLine(stdout, 'pass', 'command-resolves');
    assert.ok(line.includes('not graded, because'), `the pass reads as coverage rather than as nothing graded:\n${line}`);
    assert.ok(line.includes('config check'), `the not-graded line does not name the check that covers an unfilled key:\n${line}`);
    assert.match(stderr, warnLine('config'));
  });

  await t.test('a compound wrapper line is reported not graded rather than warned about as a binary', async (subtest) => {
    // Its head is a shell builtin no `PATH` holds. Grading it would warn that `cd` is not installed,
    // under a remedy — install the tool — that cannot ever clear it.
    const dir = await wiredFixture(subtest);
    rewriteWrapperCommand(dir, 'test.sh', 'cd app && npm test');

    const { status, stdout, stderr } = await runCli(dir, ['doctor']);

    assert.equal(status, 0, `doctor exited ${status} over a compound wrapper line\n${stdout}\n${stderr}`);
    assert.match(stdout, passLine('command-resolves'));
    assert.doesNotMatch(stderr, warnLine('command-resolves'));
    const line = reportLine(stdout, 'pass', 'command-resolves');
    assert.ok(line.includes('commands.test (scripts/test.sh)'), `the compound line is not named as ungraded:\n${line}`);
    assert.ok(line.includes(NOT_GRADED_HERE_ONE), `the compound line is not reported as not graded:\n${line}`);
    assert.ok(!/\bcd \(/.test(line), `the builtin heading the line is graded as a binary:\n${line}`);
  });

  await t.test('a relative head is reported not graded, because no PATH decides it', async (subtest) => {
    // The wrapper form a Maven or Gradle adoption ships with. A shell resolves `./mvnw` against the
    // filesystem and the directory the command runs in, so this check has no question to ask about it
    // — and a repository whose wrapper is perfectly correct must not be warned about.
    const dir = await wiredFixture(subtest);
    rewriteWrapperCommand(dir, 'test.sh', './mvnw -q test');

    const { status, stdout, stderr } = await runCli(dir, ['doctor']);

    assert.equal(status, 0, `doctor exited ${status} over a relative wrapper head\n${stdout}\n${stderr}`);
    assert.match(stdout, passLine('command-resolves'));
    assert.doesNotMatch(stderr, warnLine('command-resolves'));
    const line = reportLine(stdout, 'pass', 'command-resolves');
    assert.ok(
      line.includes('./mvnw (commands.test → scripts/test.sh)'),
      `the relative head is not named with the line it came from:\n${line}`,
    );
    assert.ok(line.includes(NOT_GRADED_HERE_ONE), `the relative head is not reported as not graded:\n${line}`);
  });

  await t.test('a deploy command is graded here and not by daemon-path, in one run', { skip: NO_BACKEND }, async (subtest) => {
    // The two checks' scopes differ, and this is the case that shows the difference rather than
    // asserting it: `deploy.sh` is one of the four wrappers an adopter runs, so the shell `doctor` was
    // typed at is graded on it — while no daemon-launched run deploys, so the unit's own PATH is not.
    const dir = await wiredFixture(subtest);
    editJson(dir, CONFIG_FILE, (config) => {
      config.deploy = { command: `${FIXTURE_DEPLOY_BINARY} --only hosting` };
    });

    // The unit reaches the agent CLI and this machine's toolchain, so `daemon-path` grades a unit it
    // is otherwise happy with: a "not graded, no unit installed" line would name nothing either way
    // and would show no scope difference at all.
    const toolchain = await toolchainDir(subtest, [DEFAULT_AGENT_CLI]);
    const envPath = `${toolchain}${delimiter}${process.env.PATH ?? ''}`;
    const { home } = await installUnitCarrying(subtest, dir, envPath);

    const { status, stdout, stderr } = await runCli(dir, ['doctor'], { HOME: home, PATH: envPath });

    assert.equal(status, 0, `doctor exited ${status} on a condition that only warns\n${stdout}\n${stderr}`);
    assert.match(stderr, warnLine('command-resolves'));
    assert.match(stdout, CLEAN_SUMMARY);
    const resolves = reportLine(stderr, 'warn', 'command-resolves');
    assert.ok(
      resolves.includes(`${FIXTURE_DEPLOY_BINARY} (deploy.command)`),
      `the warning does not name the deploy head under the key it lives on:\n${resolves}`,
    );

    const daemon = reportLine(stdout, 'pass', 'daemon-path');
    assert.ok(daemon, `daemon-path did not pass on a unit reaching every binary it grades\n${stdout}\n${stderr}`);
    assert.ok(
      !daemon.includes(FIXTURE_DEPLOY_BINARY),
      `daemon-path grades a binary only a deploy invokes:\n${daemon}`,
    );
    assert.ok(!daemon.includes('deploy.command'), `daemon-path names the key it skips:\n${daemon}`);
  });
});

/**
 * The parse `daemon-path` reads a unit's `PATH` with, against the renderer that wrote it.
 *
 * **The property is a round trip, and neither half can show it alone.** `daemon/units.ts` escapes
 * the value for the destination it lands in — XML in the plist, `%`-doubled and, inside the quoting
 * of `Environment="PATH=…"`, backslash-escaped on systemd — and `unitEnvValue` claims to be the exact
 * inverse. Where it is not, `daemon-path` grades a truncated or mangled `PATH` and warns that
 * binaries the daemon does reach are unreachable.
 *
 * Both backends are rendered here whatever this host runs, unlike the cases above: nothing is
 * installed and no service manager is asked anything, so the systemd arm — the one with the quoting
 * — is covered on a macOS box too.
 */
test('the PATH parsed out of a unit is the PATH that was rendered into it, for both backends', () => {
  // Every character either escape is hostile to, in one value: `"` and `\` against the systemd
  // quoting, `%` against specifier expansion, `&` against XML.
  const envPath = '/home/ada/say "hi"/bin:/opt/a\\b/bin:/home/ada/100%-mine/bin:/opt/a&b/bin';
  const repoRoot = '/Users/ada/Work/checkout';

  for (const kind of ['launchd', 'systemd']) {
    const unit = renderUnit({
      backend: { kind, reason: `${kind}, as this test asked for`, unitPath: join('/unit-dir', kind) },
      config: { projectName: 'fixture-project', stateDir: STATE_DIR },
      repoRoot,
      watcherPath: join(repoRoot, 'scripts', WATCHER_FILE),
      envPath,
    });

    assert.equal(
      unitEnvValue(kind, unit.text, 'PATH'),
      envPath,
      `the ${kind} unit's PATH does not read back as the value it was rendered from:\n${unit.text}`,
    );
  }
});

/**
 * The always-loaded project file, and the four contract literals the setup-analysis check reads.
 *
 * Spelled here rather than imported from the compiled generator for the reason the registry section
 * above spells its shape by hand: a fixture edited through the same constant the check reads would
 * assert only that one module agrees with itself. These are the strings the shipped templates
 * actually carry, so an edit made with them is the edit an adopter makes.
 */
const CLAUDE_MD_FILE = '.claude/CLAUDE.md';
const UNFILLED_MARKER = '<!-- harness:unfilled -->';
const GUIDANCE_MARKER = '**What belongs here**';
const SETUP_PENDING_OPEN = '<!-- harness:setup-pending -->';
const SETUP_PENDING_CLOSE = '<!-- /harness:setup-pending -->';

/** The analyze command, as both remedies name it. */
const ANALYZE_COMMAND = '/autonomous-sdlc-harness:harness-analyze';

/**
 * The conventions documents the wired config points at.
 *
 * Read from `layers[]` rather than spelled, because which documents a fixture gets is detection's
 * answer rather than this file's. Every preset's `general` layer points at the shared cross-layer
 * document, so this list carries it for the fixtures here — the check adds it whether or not a layer
 * does, and the missing-document case below is what covers that half.
 */
function conventionsDocuments(dir) {
  const { layers } = readJson(join(dir, CONFIG_FILE));
  const documents = [...new Set(layers.map((layer) => layer.conventions))];
  assert.ok(documents.length > 0, 'the wired config points at no conventions document, so nothing here is testable');
  return documents;
}

/** One report line, whole, so an assertion about a detail cannot be satisfied by another check's. */
function detailLine(output, matcher) {
  const line = output.split('\n').find((entry) => matcher.test(entry));
  assert.ok(line, `no line matching ${matcher} in:\n${output}`);
  return line;
}

/** Replace one substring in a fixture file, asserting it was there so the edit cannot be a no-op. */
function replaceInFile(dir, relativePath, from, to) {
  const path = join(dir, relativePath);
  const original = readFileSync(path, 'utf8');
  assert.ok(
    original.includes(from),
    `${relativePath} does not carry ${JSON.stringify(from)}, so this edit would prove nothing`,
  );
  writeFileSync(path, original.replace(from, to), 'utf8');
}

/** The hand-written document an adopter who declined the offer produces: the guidance block gone. */
function writeConventionsByHand(dir, relativePath, { keepMarker = true } = {}) {
  replaceInFile(dir, relativePath, GUIDANCE_MARKER, '**The rules of this project, written by hand**');
  if (!keepMarker) replaceInFile(dir, relativePath, UNFILLED_MARKER, '');
}

/** Delete the setup-pending block by hand — the disposal the banner's own wording names. */
function deleteSetupBanner(dir) {
  const path = join(dir, CLAUDE_MD_FILE);
  const original = readFileSync(path, 'utf8');
  const start = original.indexOf(SETUP_PENDING_OPEN);
  const end = original.indexOf(SETUP_PENDING_CLOSE);
  assert.ok(start >= 0 && end > start, `${CLAUDE_MD_FILE} carries no setup-pending block to delete`);
  writeFileSync(path, original.slice(0, start) + original.slice(end + SETUP_PENDING_CLOSE.length), 'utf8');
}

/**
 * The setup-analysis check: the four deterministic facts about setup's judgement half.
 *
 * **Every case here asserts the exit status stays 0**, because that is the grade the check is
 * defined by: a repository that was wired correctly and has not been analyzed yet is not broken, and
 * promoting any of these to a failure would make every freshly wired repository exit non-zero for
 * the one condition `init` cannot resolve on its own.
 *
 * **And every warning is walked as the adopter who declined the offer.** Each of the four states
 * has a remedy that does not require the command — replace the guidance block, delete the banner
 * block, run `init`, correct the configured path or create the directory it names — so the cases
 * assert the hand remedies are in the text, and the "clean report" cases reach a `PASS` without the
 * command ever running.
 */
test('the setup-analysis check reports what is unfilled, and never above a warning', async (t) => {
  await t.test('a freshly wired repository warns about the skeletons and the banner, and exits 0', async (subtest) => {
    const dir = await wiredFixture(subtest);
    const before = await snapshotTree(dir);

    const { status, stdout, stderr } = await runCli(dir, ['doctor']);

    assert.equal(status, 0, `doctor exited ${status} on a condition that only warns\n${stdout}\n${stderr}`);
    assert.match(stderr, warnLine('setup-analysis'));
    assert.match(stdout, CLEAN_SUMMARY);

    const line = detailLine(stderr, warnLine('setup-analysis'));
    // Both facts in one line, each with its documents named: a count alone leaves an adopter with
    // nothing to open.
    assert.match(line, /untouched skeleton/);
    for (const document of conventionsDocuments(dir)) {
      assert.ok(line.includes(document), `the warning does not name the unfilled document ${document}:\n${line}`);
    }
    assert.ok(line.includes(CLAUDE_MD_FILE), `the warning does not name the file carrying the banner:\n${line}`);
    // The remedies an adopter who declined the offer can still take, both of them.
    assert.ok(line.includes('by hand'), `the warning offers no remedy but the command:\n${line}`);
    assert.ok(line.includes(ANALYZE_COMMAND), `the warning does not name the command that clears it:\n${line}`);
    // The check reads three files and writes none — the module's contract, re-asserted with the new
    // check registered so a later reader is not left comparing this to the first case in the file.
    assert.deepEqual(await snapshotTree(dir), before, 'doctor wrote to the repository it was asked about');
  });

  await t.test('filled documents and a deleted banner pass, with the command never run', async (subtest) => {
    const dir = await wiredFixture(subtest);
    // The state the adopter who took neither offer reaches by writing the rules themselves: both
    // halves of the untouched-skeleton test gone from every document, and the block deleted as its
    // own wording says to. It is the control for every warning above.
    for (const document of conventionsDocuments(dir)) writeConventionsByHand(dir, document, { keepMarker: false });
    deleteSetupBanner(dir);

    const { status, stdout, stderr } = await runCli(dir, ['doctor']);

    assert.equal(status, 0, `doctor exited ${status}\n${stdout}\n${stderr}`);
    assert.match(stdout, passLine('setup-analysis'));
    assert.doesNotMatch(stderr, warnLine('setup-analysis'));
  });

  await t.test('a hand-written document that kept its marker is not counted unfilled', async (subtest) => {
    const dir = await wiredFixture(subtest);
    // One hand edit, and the one this check would get wrong if it graded on the marker alone: the
    // footer tells a hand-writer to replace everything above it, so the guidance block goes and the
    // trailing HTML comment plausibly stays. Reported as unfilled, this document would warn in every
    // run for the life of the repository with only the declined command on offer.
    const documents = conventionsDocuments(dir);
    for (const document of documents) writeConventionsByHand(dir, document);

    const { status, stdout, stderr } = await runCli(dir, ['doctor']);

    assert.equal(status, 0, `doctor exited ${status} on a condition that only warns\n${stdout}\n${stderr}`);
    // The banner is untouched, so the check still warns — about that alone.
    const line = detailLine(stderr, warnLine('setup-analysis'));
    assert.doesNotMatch(line, /untouched skeleton/);
    for (const document of documents) {
      assert.ok(!line.includes(document), `a hand-written document was reported as unfilled:\n${line}`);
    }
    assert.ok(line.includes(CLAUDE_MD_FILE), `the remaining finding is not the banner:\n${line}`);
  });

  await t.test('a conventions path pointing at nothing is named, with both ways to correct it', async (subtest) => {
    const dir = await wiredFixture(subtest);
    const missing = '.claude/context/a-document-nothing-writes.md';
    editJson(dir, CONFIG_FILE, (config) => {
      config.layers[0].conventions = missing;
    });

    const { status, stdout, stderr } = await runCli(dir, ['doctor']);

    assert.equal(status, 0, `doctor exited ${status} on a condition that only warns\n${stdout}\n${stderr}`);
    const line = detailLine(stderr, warnLine('setup-analysis'));
    assert.ok(line.includes(missing), `the warning does not name the path that resolves to nothing:\n${line}`);
    // A configured path has two ways of being wrong, and the remedies differ: the value, or the tree.
    assert.match(line, /npx autonomous-sdlc-harness config set layers/);
    assert.match(line, /npx autonomous-sdlc-harness init/);
    assert.match(stdout, CLEAN_SUMMARY);
  });

  await t.test('a layer path pointing at no directory names the layer, and creating it clears the line', async (subtest) => {
    const dir = await wiredFixture(subtest);
    const layerName = 'data';
    const scope = 'src/data';
    // One hand edit, and the one an adopter actually makes: a layer scoped by hand to a directory
    // that is not in this checkout. Added rather than repointed, because `init` writes the catch-all
    // row and moving *it* off `.` is the config check's finding instead of this one's. Its
    // conventions value is a document that is there, so the only new finding is the path.
    editJson(dir, CONFIG_FILE, (config) => {
      config.layers.unshift({ name: layerName, path: scope, conventions: config.layers[0].conventions });
    });

    const { status, stdout, stderr } = await runCli(dir, ['doctor']);

    assert.equal(status, 0, `doctor exited ${status} on a condition that only warns\n${stdout}\n${stderr}`);
    assert.match(stdout, CLEAN_SUMMARY);
    const line = detailLine(stderr, warnLine('setup-analysis'));
    // The layer as well as the path: `layers[].path` is the scope a dispatch is handed, and an
    // adopter fixing it edits the row rather than searching the file for a string.
    assert.ok(line.includes(layerName), `the warning does not name the layer whose scope is missing:\n${line}`);
    assert.ok(line.includes(scope), `the warning does not name the directory that is not there:\n${line}`);
    assert.match(line, /npx autonomous-sdlc-harness config set layers/);

    // The same repository with the directory created — and the states `init` leaves warning cleared
    // as the control case above clears them — reaches the pass line, which is what shows this is
    // measuring the path rather than something correlated with it.
    mkdirSync(join(dir, scope), { recursive: true });
    for (const document of conventionsDocuments(dir)) writeConventionsByHand(dir, document, { keepMarker: false });
    deleteSetupBanner(dir);

    const corrected = await runCli(dir, ['doctor']);

    assert.equal(corrected.status, 0, `doctor exited ${corrected.status}\n${corrected.stdout}\n${corrected.stderr}`);
    assert.match(corrected.stdout, passLine('setup-analysis'));
    assert.doesNotMatch(corrected.stderr, warnLine('setup-analysis'));
  });

  await t.test('the shared cross-layer document, missing with no layer naming it, routes to init alone', async (subtest) => {
    const dir = await wiredFixture(subtest);
    // The one member of the set that is not in `layers[]`: it is expected whether or not a layer
    // points at it, so a message asserting a configured layer path for every missing document would
    // send this adopter to a value that does not exist. Reached in one edit by pointing the layer
    // elsewhere — at a document that *is* there — and deleting the shared one.
    const [shared] = conventionsDocuments(dir);
    const elsewhere = '.claude/context/domain.md';
    writeFileSync(join(dir, elsewhere), `# hand-written\n`, 'utf8');
    editJson(dir, CONFIG_FILE, (config) => {
      config.layers[0].conventions = elsewhere;
    });
    await rm(join(dir, shared));

    const { status, stdout, stderr } = await runCli(dir, ['doctor']);

    assert.equal(status, 0, `doctor exited ${status} on a condition that only warns\n${stdout}\n${stderr}`);
    const line = detailLine(stderr, warnLine('setup-analysis'));
    assert.ok(line.includes(shared), `the warning does not name the shared document that is gone:\n${line}`);
    assert.match(line, /no layer points at it/);
    assert.match(line, /npx autonomous-sdlc-harness init/);
    assert.match(stdout, CLEAN_SUMMARY);
  });

  await t.test('the decliner keeps both remedies, and clearing them by hand reaches a clean report', async (subtest) => {
    // Wired through `init --no-analyze`, the one route that writes the declined banner wording: the
    // adopter this case is about is the one who turned the command down, so a fixture wired any
    // other way would be asserting the remedies of an adopter who did not need them.
    const dir = await wiredFixture(subtest, ['--no-analyze']);

    const declined = await runCli(dir, ['doctor']);

    assert.equal(declined.status, 0, `doctor exited ${declined.status} on a condition that only warns\n${declined.stderr}`);
    const line = detailLine(declined.stderr, warnLine('setup-analysis'));
    // Both remedies, named in the same line: the command for an adopter who changes their mind, and
    // the block's own delimiters for the one who does not.
    assert.ok(line.includes(ANALYZE_COMMAND), `the warning does not name the command:\n${line}`);
    assert.ok(line.includes(SETUP_PENDING_OPEN), `the warning does not name the block to delete:\n${line}`);
    assert.ok(line.includes(SETUP_PENDING_CLOSE), `the warning names no end to the block to delete:\n${line}`);

    for (const document of conventionsDocuments(dir)) writeConventionsByHand(dir, document, { keepMarker: false });
    deleteSetupBanner(dir);

    const cleared = await runCli(dir, ['doctor']);

    // The property this whole check is graded against: nothing it reports is reachable only through
    // the command, so an adopter who declined it can reach a clean report.
    assert.equal(cleared.status, 0, `doctor exited ${cleared.status}\n${cleared.stdout}\n${cleared.stderr}`);
    assert.match(cleared.stdout, passLine('setup-analysis'));
    assert.doesNotMatch(cleared.stderr, warnLine('setup-analysis'));
  });
});

/**
 * The rules file the always-loaded file's change-request fence points at, spelled as an adopter's
 * tree carries it rather than imported: a fixture edited through the constant the check reads would
 * assert only that one module agrees with itself.
 */
const TASK_OFFER_FILE = '.claude/harness-task-offer.md';

test('a freshly wired repository passes the task-offer-rules check', async (t) => {
  const dir = await wiredFixture(t);

  // The control for the case below, and the assertion that `init` wired both halves at once: the
  // fence is in the project file and the file it names is on disk.
  assert.ok(existsSync(join(dir, TASK_OFFER_FILE)), `init did not write ${TASK_OFFER_FILE}`);
  assert.ok(
    readFileSync(join(dir, CLAUDE_MD_FILE), 'utf8').includes(TASK_OFFER_FILE),
    `${CLAUDE_MD_FILE} does not name ${TASK_OFFER_FILE}, so this case proves nothing`,
  );

  const { status, stdout, stderr } = await runCli(dir, ['doctor']);

  assert.equal(status, 0, `doctor exited ${status}\n${stdout}\n${stderr}`);
  assert.match(stdout, passLine('task-offer-rules'));
  assert.doesNotMatch(stderr, warnLine('task-offer-rules'));
});

test('a deleted task-offer rules file warns, names the remedy, and leaves the exit status at 0', async (t) => {
  const dir = await wiredFixture(t);
  await rm(join(dir, TASK_OFFER_FILE));

  const { status, stdout, stderr } = await runCli(dir, ['doctor']);

  // The exit status is asserted rather than inferred: a warn that silently became a fail would
  // change every adopter's `doctor` exit code over a repository that runs fine — the fence fails
  // closed, so what is lost is the offer and not the work.
  assert.equal(status, 0, `doctor exited ${status} on a condition that only warns\n${stdout}\n${stderr}`);
  assert.match(stderr, warnLine('task-offer-rules'));
  assert.ok(stderr.includes(TASK_OFFER_FILE), `the warning does not name the file that is missing:\n${stderr}`);
  assert.match(stderr, /autonomous-sdlc-harness init/);
  assert.match(stdout, CLEAN_SUMMARY);
});

/** The heading of the fence section, as the always-loaded file carries it. */
const TASK_OFFER_SECTION = '## Where a change request runs';

/**
 * Turn a wired `.claude/CLAUDE.md` back into one written before this feature existed: the fence
 * section goes, and so does every other sentence naming the rules file — the check tests the whole
 * file for the path, so a fixture that dropped the section and left the layers table's mention of
 * it would still name the path and would prove nothing.
 */
function removeTaskOfferFence(dir) {
  const path = join(dir, CLAUDE_MD_FILE);
  const lines = readFileSync(path, 'utf8').split('\n');
  const start = lines.findIndex((line) => line.trim() === TASK_OFFER_SECTION);
  assert.notEqual(start, -1, `${CLAUDE_MD_FILE} carries no ${TASK_OFFER_SECTION} section, so this case proves nothing`);
  let end = start + 1;
  while (end < lines.length && lines[end].trim() !== '---') end += 1;

  const kept = [...lines.slice(0, start), ...lines.slice(Math.min(end + 1, lines.length))].map((line) =>
    line.includes(TASK_OFFER_FILE)
      ? line
          .split(/(?<=\.)\s+/)
          .filter((sentence) => !sentence.includes(TASK_OFFER_FILE))
          .join(' ')
      : line,
  );

  writeFileSync(path, kept.join('\n'));
  assert.ok(
    !readFileSync(path, 'utf8').includes(TASK_OFFER_FILE),
    `${CLAUDE_MD_FILE} still names ${TASK_OFFER_FILE} after the fence was removed, so this case proves nothing`,
  );
}

test('a rules file no fence names warns, names both remedies, and leaves the exit status at 0', async (t) => {
  const dir = await wiredFixture(t);
  removeTaskOfferFence(dir);

  // The reverse of the case above, and the state every already-wired repository comes out of an
  // unforced upgrade `init` in: the rules file is planned on every run, the project file is kept as
  // it stands, so the feature is inert and the only thing that can say so is this check.
  assert.ok(existsSync(join(dir, TASK_OFFER_FILE)), `${TASK_OFFER_FILE} is not there, so this case proves nothing`);

  const { status, stdout, stderr } = await runCli(dir, ['doctor']);

  assert.equal(status, 0, `doctor exited ${status} on a condition that only warns\n${stdout}\n${stderr}`);
  assert.match(stderr, warnLine('task-offer-rules'));
  assert.ok(stderr.includes(TASK_OFFER_FILE), `the warning does not name the orphaned file:\n${stderr}`);

  // Both remedies, because they cost different things and the adopter picks: the section added by
  // hand keeps everything `/autonomous-sdlc-harness:harness-analyze` filled, the forced re-render does not.
  assert.ok(stderr.includes(TASK_OFFER_SECTION), `the warning does not name the section to add by hand:\n${stderr}`);
  assert.match(stderr, /autonomous-sdlc-harness init --force/);
  assert.match(stdout, CLEAN_SUMMARY);
});

/**
 * The layer-profile contract literals, spelled here for the reason the section above spells its
 * own: a fixture edited through the constant the check reads would assert only that one module
 * agrees with itself. These are the values an adopter's file actually carries.
 */
const FALLBACK_PRESET = 'flat';
const LAYERS_TARGET = 'layers';
const REVIEW_KEY = 'detection.review';

/** The three layered source directories the detection table's layered row matches on. */
const LAYERED_DIRS = Object.freeze(['src/data', 'src/domain', 'src/presentation']);

/** The preset that layout is detected as, and so the one the passing line has to name. */
const LAYERED_PRESET = 'layered-clean-arch';

/** A minimal `pubspec.yaml`: enough for the `flutter` row to match, with no `lib/` beside it. */
const PUBSPEC = 'name: fixture\nenvironment:\n  sdk: ">=3.0.0 <4.0.0"\n';

/** The preset a manifest-only Flutter tree records, and the one whose source root did not resolve. */
const FLUTTER_PRESET = 'flutter';

/** The preset whose catch-all-only profile is a decision rather than an unresolved source root. */
const MONOREPO_PRESET = 'monorepo';

/** The catch-all row's path as a person writes the repository root by hand; it normalises to `"."`. */
const UNNORMALISED_CATCH_ALL = './';

/** The name on a second row an adopter adds for the repository root — schema-legal, and degenerate. */
const SECOND_CATCH_ALL_NAME = 'docs';

/** The review an adopter records by hand, in the shape `config set detection.review` takes. */
const REVIEW_VERDICT = 'considered-no-change';
const REVIEW_RATIONALE = 'one deployable, no layer boundary worth routing on';
const REVIEW_DATE = '2026-09-02';

/**
 * A layered repository `init` has wired: the same seed as {@link wiredFixture}, plus the three
 * directories the layered signal matches on, so detection reaches a preset rather than the fallback.
 */
async function wiredLayeredFixture(t) {
  const fixture = await createFixture({ files: nodeProjectFiles(), dirs: [...LAYERED_DIRS] });
  t.after(fixture.cleanup);

  const result = await runCli(fixture.dir, ['init']);
  assert.equal(result.status, 0, `init exited ${result.status}\n${result.stdout}\n${result.stderr}`);
  return fixture.dir;
}

/**
 * The `layer-profile` check: whether the profile a repository routes by was detected or reviewed,
 * or is the catch-all row `init` writes when it recognises nothing.
 *
 * **The subject is the disappearing signal**, which is why the first case runs `doctor` twice. Before
 * this check, the only trace that a `flat` fallback profile had never been examined was
 * `setup-analysis`'s skeleton warning — and `/autonomous-sdlc-harness:harness-analyze conventions` clears that by filling the
 * documents, without the profile having been looked at at all. The second run in case (a) is that
 * state, reached by hand: `setup-analysis` passes and this check still warns.
 *
 * **Every case asserts the exit status stays 0**, for `setup-analysis`' reason: an unreviewed profile
 * is a repository whose flow runs, with worse routing.
 */
test('the layer-profile check grades the fallback profile, and a review clears it', async (t) => {
  await t.test('a fallback profile warns, names the layers target, and exits 0', async (subtest) => {
    const dir = await wiredFixture(subtest);
    // The fixture's own record, asserted rather than assumed: this seed carries no workspaces key
    // and no layered directory, so detection falls back — and if that ever stops being true, this
    // case says so instead of passing for another reason.
    const { detection } = readJson(join(dir, CONFIG_FILE));
    assert.equal(detection.preset, FALLBACK_PRESET, `the fixture was not detected as the fallback: ${JSON.stringify(detection)}`);

    const { status, stdout, stderr } = await runCli(dir, ['doctor']);

    assert.equal(status, 0, `doctor exited ${status} on a condition that only warns\n${stdout}\n${stderr}`);
    assert.match(stderr, warnLine('layer-profile'));
    assert.match(stdout, CLEAN_SUMMARY);

    const line = detailLine(stderr, warnLine('layer-profile'));
    assert.ok(
      line.includes(`${ANALYZE_COMMAND} ${LAYERS_TARGET}`),
      `the warning does not name the target that clears it:\n${line}`,
    );
    // The remedy an adopter who declined the command can still take, which every warning here owes.
    assert.ok(line.includes(REVIEW_KEY), `the warning offers no remedy but the command:\n${line}`);
    // `detection` requires none of its sub-keys, so every interpolated value is optional — one
    // assertion covers the forced arm and the partly-absent record as a class.
    assert.ok(!line.includes('undefined'), `the warning printed an unrendered value:\n${line}`);

    // Finding 45's owed verification (a)+(b), and the whole point of the check: the edit that used to
    // take the last indirect trace away leaves this one standing.
    for (const document of conventionsDocuments(dir)) writeConventionsByHand(dir, document, { keepMarker: false });
    deleteSetupBanner(dir);

    const filled = await runCli(dir, ['doctor']);

    assert.equal(filled.status, 0, `doctor exited ${filled.status}\n${filled.stdout}\n${filled.stderr}`);
    assert.match(filled.stdout, passLine('setup-analysis'));
    assert.match(filled.stderr, warnLine('layer-profile'));
  });

  await t.test('a recorded review passes, and the report quotes the rationale', async (subtest) => {
    const dir = await wiredFixture(subtest);
    // One hand edit, in the shape `config set detection.review` writes: the decline the analyze
    // command's `layers` target records when it examines the profile and proposes nothing.
    editJson(dir, CONFIG_FILE, (config) => {
      config.detection.review = { verdict: REVIEW_VERDICT, rationale: REVIEW_RATIONALE, at: REVIEW_DATE };
    });

    const { status, stdout, stderr } = await runCli(dir, ['doctor']);

    assert.equal(status, 0, `doctor exited ${status}\n${stdout}\n${stderr}`);
    assert.match(stdout, passLine('layer-profile'));
    assert.doesNotMatch(stderr, warnLine('layer-profile'));

    const line = detailLine(stdout, passLine('layer-profile'));
    assert.ok(line.includes(REVIEW_VERDICT), `the pass line does not name the verdict:\n${line}`);
    // The finding's "the rationale is readable in a committed file" half: the reasoning, not only the
    // outcome, and read back off the file the adopter committed.
    assert.ok(line.includes(REVIEW_RATIONALE), `the pass line does not quote the rationale:\n${line}`);
    assert.ok(line.includes(REVIEW_DATE), `the pass line does not name when the review was recorded:\n${line}`);
  });

  await t.test('a record holding only a review, with no verdict and no preset, still warns', async (subtest) => {
    const dir = await wiredFixture(subtest);
    // The state an adopter reaches by following the warning's own by-hand remedy and omitting
    // `verdict`: `detection.review` declares no required key, so this record is schema-legal and
    // carries strictly no more about the layout than an absent record does.
    editJson(dir, CONFIG_FILE, (config) => {
      config.detection = { review: { rationale: REVIEW_RATIONALE, at: REVIEW_DATE } };
    });

    const { status, stdout, stderr } = await runCli(dir, ['doctor']);

    assert.equal(status, 0, `doctor exited ${status} on a condition that only warns\n${stdout}\n${stderr}`);
    assert.match(stderr, warnLine('layer-profile'));
    assert.doesNotMatch(stdout, passLine('layer-profile'));

    const line = detailLine(stderr, warnLine('layer-profile'));
    assert.ok(line.includes(REVIEW_KEY), `the warning offers no remedy but the command:\n${line}`);
    assert.ok(!line.includes('undefined'), `the warning printed an unrendered value:\n${line}`);
  });

  await t.test('a repository whose preset was detected never sees the warning', async (subtest) => {
    const dir = await wiredLayeredFixture(subtest);

    const { status, stdout, stderr } = await runCli(dir, ['doctor']);

    assert.equal(status, 0, `doctor exited ${status}\n${stdout}\n${stderr}`);
    assert.match(stdout, passLine('layer-profile'));
    assert.doesNotMatch(stderr, warnLine('layer-profile'));

    const line = detailLine(stdout, passLine('layer-profile'));
    assert.ok(line.includes(LAYERED_PRESET), `the pass line does not name the detected preset:\n${line}`);
    assert.ok(!line.includes('undefined'), `the pass line printed an unrendered value:\n${line}`);
  });

  await t.test('a preset whose source root was not found still warns, and the line names the preset', async (subtest) => {
    // Finding 6's state, and the one a recorded preset alone would clear: the `flutter` row matches
    // on the manifest, so detection records `flutter`, but the tree has no `lib/` for the preset to
    // name — so `presetLayers` writes the catch-all row alone. That is an unresolved source root, not
    // a chosen profile, and `buildPreset`'s init warning about it is never repeated.
    const fixture = await createFixture({ files: { 'pubspec.yaml': PUBSPEC, 'README.md': '# fixture project\n' } });
    subtest.after(fixture.cleanup);
    const init = await runCli(fixture.dir, ['init']);
    assert.equal(init.status, 0, `init exited ${init.status}\n${init.stdout}\n${init.stderr}`);

    // The fixture's own record, asserted rather than assumed, on both halves the case depends on.
    const config = readJson(join(fixture.dir, CONFIG_FILE));
    assert.equal(config.detection.preset, FLUTTER_PRESET, `the fixture was not detected as Flutter: ${JSON.stringify(config.detection)}`);
    assert.ok(
      config.layers.every((layer) => layer.path === '.'),
      `the fixture resolved a source root, so it is not the state under test: ${JSON.stringify(config.layers)}`,
    );

    const { status, stdout, stderr } = await runCli(fixture.dir, ['doctor']);

    assert.equal(status, 0, `doctor exited ${status} on a condition that only warns\n${stdout}\n${stderr}`);
    assert.match(stderr, warnLine('layer-profile'));
    assert.doesNotMatch(stdout, passLine('layer-profile'));

    const line = detailLine(stderr, warnLine('layer-profile'));
    assert.ok(line.includes(FLUTTER_PRESET), `the warning does not name the recorded preset:\n${line}`);
    assert.ok(
      line.includes(`${ANALYZE_COMMAND} ${LAYERS_TARGET}`),
      `the warning does not name the target that clears it:\n${line}`,
    );
    assert.ok(line.includes(REVIEW_KEY), `the warning offers no remedy but the command:\n${line}`);
    assert.ok(!line.includes('undefined'), `the warning printed an unrendered value:\n${line}`);
  });

  await t.test('a monorepo passes, because its catch-all-only profile is the preset table\'s decision', async (subtest) => {
    // The other side of the same arm: `monorepo` writes one catch-all row deliberately, because the
    // packages of a workspace are a judgement call the table declines to make. A check that warned
    // here would warn at every monorepo adopter forever.
    const fixture = await createFixture({
      files: { ...nodeProjectFiles(), 'package.json': { ...nodeProjectFiles()['package.json'], workspaces: ['packages/*'] } },
      dirs: ['packages/app'],
    });
    subtest.after(fixture.cleanup);
    const init = await runCli(fixture.dir, ['init']);
    assert.equal(init.status, 0, `init exited ${init.status}\n${init.stdout}\n${init.stderr}`);

    const config = readJson(join(fixture.dir, CONFIG_FILE));
    assert.equal(config.detection.preset, MONOREPO_PRESET, `the fixture was not detected as a monorepo: ${JSON.stringify(config.detection)}`);

    const { status, stdout, stderr } = await runCli(fixture.dir, ['doctor']);

    assert.equal(status, 0, `doctor exited ${status}\n${stdout}\n${stderr}`);
    assert.match(stdout, passLine('layer-profile'));
    assert.doesNotMatch(stderr, warnLine('layer-profile'));

    const line = detailLine(stdout, passLine('layer-profile'));
    assert.ok(line.includes(MONOREPO_PRESET), `the pass line does not name the detected preset:\n${line}`);
    assert.ok(!line.includes('undefined'), `the pass line printed an unrendered value:\n${line}`);

    // The half `init` holds, carried here so either command alone tells the adopter both facts: the
    // profile is one layer by design, and a per-package split is the analyze command's to propose.
    // Still a pass, so the next step is named without the `config set` remedy the warn arms carry.
    assert.ok(
      line.includes(ANALYZE_COMMAND),
      `the pass line does not name what would propose a per-package profile:\n${line}`,
    );
    assert.ok(
      line.includes('routed to that one layer'),
      `the pass line does not say what a catch-all-only profile means for dispatch:\n${line}`,
    );
    assert.ok(!line.includes(REVIEW_KEY), `the pass line offers a remedy, which is a warn arm's job:\n${line}`);
  });

  await t.test('a catch-all row written by hand as "./" is still the catch-all, so the pair does not both stand down', async (subtest) => {
    const dir = await wiredFixture(subtest);
    // One hand edit, and the spelling a person writes for the repository root. It is the same row
    // `init` wrote: `layer-drift` normalises before comparing, so this check has to as well, or each
    // member of the pair reads this repository as the other's to report and nobody reports it.
    editJson(dir, CONFIG_FILE, (config) => {
      config.layers[0].path = UNNORMALISED_CATCH_ALL;
    });

    const { status, stdout, stderr } = await runCli(dir, ['doctor']);

    // The value also fails the schema's catch-all clause, so `config` fails and the run exits 1.
    // Asserted rather than assumed: this state only ever arrives carrying that error.
    assert.equal(status, 1, `doctor exited ${status}\n${stdout}\n${stderr}`);
    assert.match(stderr, failLine('config'));

    // The property under test: the fallback profile is reported, once, by the check that owns it.
    assert.match(stderr, warnLine('layer-profile'));
    assert.doesNotMatch(stdout, passLine('layer-profile'));
    assert.match(stdout, passLine('layer-drift'));
    assert.match(detailLine(stdout, passLine('layer-drift')), /not graded, because/);
  });

  await t.test('a second catch-all row is still the generated profile, so the pair does not both stand down', async (subtest) => {
    const dir = await wiredFixture(subtest);
    // The shape the schema deliberately permits: `layers.contains` asserts *at least* one row at the
    // repository root and states no upper bound, so an adopter who adds a second rules document for
    // the root reaches this. The profile is still nothing but the row `init` generated, and a check
    // keyed on `layers.length` would read it as a profile somebody shaped.
    editJson(dir, CONFIG_FILE, (config) => {
      config.layers.push({ name: SECOND_CATCH_ALL_NAME, path: '.', conventions: config.layers[0].conventions });
    });

    const { status, stdout, stderr } = await runCli(dir, ['doctor']);

    assert.equal(status, 0, `doctor exited ${status} on a condition that only warns\n${stdout}\n${stderr}`);
    // The shape reaches the two checks rather than being refused upstream, which is what makes the
    // state below reachable at all.
    assert.match(stdout, passLine('config'));

    // The property under test, asserted on both members: a case asserting only the warning would not
    // measure that the pair partitions this repository rather than both declining it.
    assert.match(stderr, warnLine('layer-profile'));
    assert.doesNotMatch(stdout, passLine('layer-profile'));
    assert.match(stdout, passLine('layer-drift'));
    assert.match(detailLine(stdout, passLine('layer-drift')), /not graded, because/);
  });
});

/** The drifted sibling: a directory inside `src/` that no layer row was written for. */
const DRIFTED_DIR = 'src/platform';

/**
 * A build output: a directory under `appDir` the repository's **own** ignore rules already exclude,
 * and so one no adopter will ever write a layer row for.
 *
 * Spelled as an ordinary adopter's line rather than through any constant the check reads, because a
 * fixture ignored through the harness's own managed block would assert only that one module agrees
 * with itself.
 */
const IGNORED_DIR = 'dist';

/**
 * Put a build output in the tree the way a repository acquires one: on disk, and named by a rule in
 * the repository's own `.gitignore`.
 *
 * Prepended **above** the managed block rather than appended below it, so an adopter's line cannot
 * be absorbed into the run of lines the write engine maintains and read back as one of the harness's.
 */
function seedIgnoredDirectory(dir, name) {
  mkdirSync(join(dir, name), { recursive: true });
  const path = join(dir, GITIGNORE_FILE);
  writeFileSync(path, `${name}/\n\n${readFileSync(path, 'utf8')}`, 'utf8');
}

/** Source directories a `flat` repository carries, and which the drift check must name none of. */
const FLAT_DIRS = Object.freeze(['cmd', 'lib', 'pkg', 'tools', 'test']);

/**
 * The remedy a repository with **no** recorded review gets, spelled out here rather than matched by
 * fragment.
 *
 * It is this branch's regression on the half F73 does not change: the composer
 * (`core/layerGapRemedy.ts`) now writes both callers' remedy, so the no-record arm has to come back
 * byte-identical to the string this check emitted before it was extracted. A fragment match would
 * pass on a reworded sentence.
 */
const STANDING_GAP_REMEDY =
  'If any of them is a real layer, run `/autonomous-sdlc-harness:harness-analyze` in a session here and answer `skip` for every already-filled document; ' +
  'a no-argument run with `--yes` takes `merge` on all of them and rewrites documents nobody asked to touch. ' +
  'The profile itself is applied through `npx autonomous-sdlc-harness config set layers`';

/**
 * The directories a `layer-drift` warning listed, read back off the emitted detail.
 *
 * Parsed rather than substring-matched because every covered path this case asserts the *absence* of
 * is a substring of the one it asserts the presence of — `src` sits inside `src/platform` — so an
 * `includes` test would be green whatever the check listed.
 *
 * **Split on the verb-agnostic tail**: the warning conjugates on how many directories it lists —
 * `routes to the catch-all` for one, `route to the catch-all` for more — so a separator carrying the
 * verb reads back nothing at all from the single-directory report both callers below produce.
 */
function driftedDirs(line) {
  const [, listed] = line.split(' to the catch-all: ');
  assert.ok(listed, `the warning does not carry the list segment this test reads:\n${line}`);
  return listed.split(' — ')[0].split(', ');
}

/**
 * The `layer-drift` check: which source directories under `appDir` no layer covers.
 *
 * **The subject of case (a) is the depth the candidate set reaches.** `init` writes `appDir: "."`
 * with layer paths under `src/`, so `appDir`'s only child is `src` — a check that looked only there
 * would find `src` covered by its own child layers and report nothing, for ever. `src` is in the
 * look-in set as the proper ancestor of `src/data`, and that is the only reason a sibling inside
 * `src/` is ever a candidate. **It is also where the ignored-directory exclusion is measured**: the
 * same fixture carries a build output the repository's own rules exclude, so the one-element list
 * asserted below proves that candidate was dropped rather than never present.
 *
 * **The two recorded-review cases are F73**, and what they hold is that the record changes the
 * wording and nothing else: the same `WARN`, the same directory list and the same exit status as the
 * no-record case above, with the verdict and its date named and a remedy that does not send the
 * adopter to the command that re-derives the record. The second of them carries a verdict alone,
 * because every field of that record is optional and an absent one must not reach an adopter as a
 * token.
 *
 * **Case (c) is the degeneracy this check is gated against**, asserted as a property rather than
 * assumed: on a `flat` repository the profile is one catch-all row, every directory would qualify,
 * and the report would be the whole tree.
 */
test('the layer-drift check names the directories no layer covers, and is not graded on a flat profile', async (t) => {
  await t.test('a directory added inside src/ warns, names only itself, and exits 0', async (subtest) => {
    const dir = await wiredLayeredFixture(subtest);
    // One hand edit to a wired fixture, and the one an adopter's own tree makes: a new source
    // directory beside the three `init` wrote layer rows for.
    mkdirSync(join(dir, DRIFTED_DIR), { recursive: true });
    // The second thing an adopter's tree carries, and the one nobody ever writes a layer row for: a
    // build output its own `.gitignore` already declares is not source.
    seedIgnoredDirectory(dir, IGNORED_DIR);

    const { status, stdout, stderr } = await runCli(dir, ['doctor']);

    assert.equal(status, 0, `doctor exited ${status} on a condition that only warns\n${stdout}\n${stderr}`);
    assert.match(stdout, CLEAN_SUMMARY);
    assert.match(stderr, warnLine('layer-drift'));

    const line = detailLine(stderr, warnLine('layer-drift'));
    // Exactly the drifted directory: `src` is covered by its own child layers and each of the three
    // layer paths is covered by itself, so the coverage rule is measured here rather than assumed —
    // and the ignored build output is a candidate the check saw and dropped, not one that was absent.
    assert.deepEqual(driftedDirs(line), [DRIFTED_DIR], `the warning listed something other than the drifted directory:\n${line}`);
    assert.ok(line.includes(ANALYZE_COMMAND), `the warning does not name the command that resolves it:\n${line}`);
    // Finding 38 fix 5: the remedy names the skip-answering spelling, never the one measured to
    // rewrite every already-filled document in the repository. Grepped rather than read by eye, so a
    // later reword cannot reintroduce it silently.
    assert.ok(
      !line.includes(`${ANALYZE_COMMAND} --yes`),
      `the warning recommends the spelling that rewrites every filled document:\n${line}`,
    );
    assert.match(line, /answer `skip` for every already-filled document/);
    // F73's no-record half: the remedy this repository gets is unchanged by the composer extraction,
    // and unchanged is asserted as the whole sentence rather than a phrase from it.
    assert.ok(line.endsWith(STANDING_GAP_REMEDY), `the no-record remedy is not the standing one:\n${line}`);
  });

  await t.test('a recorded review does not silence it — a layer hand-added after the review still drifts', async (subtest) => {
    const dir = await wiredLayeredFixture(subtest);
    mkdirSync(join(dir, DRIFTED_DIR), { recursive: true });
    // The record `/autonomous-sdlc-harness:harness-analyze layers` writes, hand-added in the shape `config set
    // detection.review` takes. It clears `layer-profile` and nothing else: a verdict is a statement
    // about the profile at the moment it was reviewed, so a directory that appeared afterwards is
    // exactly Finding 38's entry 2 — "a layer is hand-added between runs".
    editJson(dir, CONFIG_FILE, (config) => {
      config.detection.review = { verdict: REVIEW_VERDICT, rationale: REVIEW_RATIONALE, at: REVIEW_DATE };
    });

    const { status, stdout, stderr } = await runCli(dir, ['doctor']);

    assert.equal(status, 0, `doctor exited ${status} on a condition that only warns\n${stdout}\n${stderr}`);
    assert.match(stderr, warnLine('layer-drift'));
    const line = detailLine(stderr, warnLine('layer-drift'));
    assert.deepEqual(driftedDirs(line), [DRIFTED_DIR]);
    // The contrast that makes the property readable: the same record leaves the neighbouring check
    // passing, which is the one it was written for.
    assert.match(stdout, passLine('layer-profile'));
    // F73: the warning names the record it does not obey — the verdict and the date it was recorded —
    // so the adopter is not told about a decision their own file already holds.
    assert.ok(line.includes(`verdict \`${REVIEW_VERDICT}\``), `the warning does not name the recorded verdict:\n${line}`);
    assert.ok(line.includes(`recorded ${REVIEW_DATE}`), `the warning does not name the date the review was recorded:\n${line}`);
    // And its remedy fits an already-declined profile: the direct route leads, and the standing
    // analyze-first sentence — the instruction that re-derives this very record — is gone.
    assert.ok(
      line.includes('add its row with `npx autonomous-sdlc-harness config set layers`'),
      `the remedy does not lead with the route that needs no session:\n${line}`,
    );
    assert.ok(!line.endsWith(STANDING_GAP_REMEDY), `the recorded-review remedy is the standing analyze-first one:\n${line}`);
    // Both arms stay off `init --reset-config`, which rebuilds the file from a fresh detection.
    assert.ok(!line.includes('--reset-config'), `the remedy names the flag that discards every hand-set value:\n${line}`);
  });

  await t.test('a review recorded with no date and no rationale still warns, and prints no undefined', async (subtest) => {
    const dir = await wiredLayeredFixture(subtest);
    mkdirSync(join(dir, DRIFTED_DIR), { recursive: true });
    // Every field of `detection.review` is optional (`config/model.ts`), so the verdict alone is a
    // legal record — and the arm that renders it must drop what is absent rather than interpolate it.
    editJson(dir, CONFIG_FILE, (config) => {
      config.detection.review = { verdict: REVIEW_VERDICT };
    });

    const { status, stdout, stderr } = await runCli(dir, ['doctor']);

    // (d): the grade and the exit status are what the two cases above report, on all three records.
    assert.equal(status, 0, `doctor exited ${status} on a condition that only warns\n${stdout}\n${stderr}`);
    assert.match(stderr, warnLine('layer-drift'));

    const line = detailLine(stderr, warnLine('layer-drift'));
    assert.deepEqual(driftedDirs(line), [DRIFTED_DIR]);
    assert.ok(line.includes(`verdict \`${REVIEW_VERDICT}\``), `the warning does not name the recorded verdict:\n${line}`);
    assert.ok(!line.includes('undefined'), `an absent review field reached the adopter as a token:\n${line}`);
    assert.ok(!line.includes('recorded undefined'), `the date clause was rendered from an absent field:\n${line}`);
  });

  await t.test('a flat profile is not graded, and none of its source directories is named', async (subtest) => {
    const fixture = await createFixture({ files: nodeProjectFiles(), dirs: [...FLAT_DIRS] });
    subtest.after(fixture.cleanup);
    const wired = await runCli(fixture.dir, ['init']);
    assert.equal(wired.status, 0, `init exited ${wired.status}\n${wired.stdout}\n${wired.stderr}`);
    // Asserted rather than assumed: none of these five directories carries a layer name or an API
    // route directory, so detection still falls back — and if that stops being true this case says so
    // instead of passing for another reason.
    const { detection } = readJson(join(fixture.dir, CONFIG_FILE));
    assert.equal(detection.preset, FALLBACK_PRESET, `the fixture was not detected as the fallback: ${JSON.stringify(detection)}`);

    const { status, stdout, stderr } = await runCli(fixture.dir, ['doctor']);

    assert.equal(status, 0, `doctor exited ${status}\n${stdout}\n${stderr}`);
    assert.match(stdout, passLine('layer-drift'));
    assert.doesNotMatch(stderr, warnLine('layer-drift'));

    const line = detailLine(stdout, passLine('layer-drift'));
    assert.match(line, /not graded, because/);
    assert.ok(line.includes('layer-profile'), `the pass line does not name the check that owns this state:\n${line}`);
    for (const name of FLAT_DIRS) {
      assert.ok(!line.includes(name), `the pass line names ${name}, which is the whole-tree report the gate exists to prevent:\n${line}`);
    }
  });
});

/**
 * The plugin's install root, as the agent runner records it — the directory a `plugins/` subtree
 * under `CLAUDE_CONFIG_DIR` names, and the key it is recorded under.
 */
const CLAUDE_PLUGINS_DIR = 'plugins';
const INSTALLED_PLUGINS_FILE = 'installed_plugins.json';
const KNOWN_MARKETPLACES_FILE = 'known_marketplaces.json';

/** A file in the plugin's `scripts/` directory that is not a helper, so the filter has something to drop. */
const NOT_A_HELPER = 'helpers.txt';

/** The relative `source` a marketplace manifest gives this plugin — the committed manifest's own value. */
const PLUGIN_SOURCE = './plugin';

/** Fill a plugin root's `scripts/` directory with the named helpers, and one file that is not one. */
function writeHelperScripts(root, scriptNames) {
  const scripts = join(root, 'scripts');
  mkdirSync(scripts, { recursive: true });
  for (const name of scriptNames) writeFileSync(join(scripts, name), '#!/bin/sh\nexit 0\n', { mode: 0o755 });
  writeFileSync(join(scripts, NOT_A_HELPER), 'not a script\n', 'utf8');
  return root;
}

/**
 * A throwaway plugin install root carrying the named helper scripts, and one file that is not one.
 *
 * The helper names are read off this directory by the check, never listed in it, so a fixture that
 * declared them any other way would be testing a list instead of the read.
 */
async function pluginInstallRootFixture(t, scriptNames) {
  const fixture = await createFixture({ git: false });
  t.after(fixture.cleanup);
  return writeHelperScripts(fixture.dir, scriptNames);
}

/**
 * A throwaway **marketplace install location** — the directory a `directory`-sourced marketplace is
 * read in place from — carrying its own `.claude-plugin/marketplace.json` and the plugin tree that
 * manifest's relative `source` points at.
 *
 * This is the shape that makes the two roots differ: the runner reads the manifest here while still
 * installing the plugin as a version-pinned snapshot elsewhere, and it is the runtime root that
 * `${CLAUDE_PLUGIN_ROOT}` was measured to resolve to in an agent definition body.
 */
async function marketplaceLocationFixture(t, scriptNames) {
  const fixture = await createFixture({ git: false });
  t.after(fixture.cleanup);
  mkdirSync(join(fixture.dir, '.claude-plugin'), { recursive: true });
  writeFileSync(
    join(fixture.dir, '.claude-plugin', 'marketplace.json'),
    `${JSON.stringify({ name: MARKETPLACE_NAME, plugins: [{ name: PLUGIN_NAME, source: PLUGIN_SOURCE }] }, null, 2)}\n`,
    'utf8',
  );
  return { location: fixture.dir, root: writeHelperScripts(join(fixture.dir, 'plugin'), scriptNames) };
}

/**
 * A throwaway `CLAUDE_CONFIG_DIR`, optionally carrying the runner's records of this plugin.
 *
 * **Every case below passes one**, the not-installed case included: the files read are outside every
 * repository, so a case that forgot it would grade the fixture against whatever the account running
 * the suite happens to have enabled.
 *
 * @param {readonly {scope: string, projectPath?: string, installPath: string}[]} rows
 *   the rows recorded for this plugin, in file order. An empty list writes no file at all, which is
 *   the machine where the plugin was never enabled.
 * @param {string | undefined} installLocation
 *   the marketplace's install location, written into `known_marketplaces.json` as a `directory`
 *   source. Omitted writes **no** such file, which is the machine where the two roots coincide —
 *   the fallback, and the state every case that does not name one is pinning.
 */
async function claudeConfigHome(t, rows = [], installLocation = undefined) {
  const fixture = await createFixture({ git: false });
  t.after(fixture.cleanup);
  const write = (name, value) => {
    mkdirSync(join(fixture.dir, CLAUDE_PLUGINS_DIR), { recursive: true });
    writeFileSync(join(fixture.dir, CLAUDE_PLUGINS_DIR, name), `${JSON.stringify(value, null, 2)}\n`, 'utf8');
  };
  if (rows.length > 0) write(INSTALLED_PLUGINS_FILE, { version: 2, plugins: { [PLUGIN_KEY]: rows } });
  if (installLocation !== undefined) {
    write(KNOWN_MARKETPLACES_FILE, {
      [MARKETPLACE_NAME]: { source: { source: 'directory', path: installLocation }, installLocation },
    });
  }
  return { env: { CLAUDE_CONFIG_DIR: fixture.dir }, root: fixture.dir };
}

/**
 * The helper-script `permissions.allow` entries the check requires at `root`, in the order it
 * requires them.
 *
 * One per helper script and **no read grant**: reads under the install root were measured to succeed
 * under a profile naming no rule over it, so a fixture that granted one here would let a check that
 * required it go on passing. The read grant a **runtime** root does require is
 * {@link pluginReadEntry}, added per case rather than folded in here.
 */
function pluginEntries(root, scriptNames = []) {
  return scriptNames.map((name) => `Bash(bash ${root}/scripts/${name}:*)`);
}

/** The read grant a runtime root requires, in the profile's own two-slash spelling. */
function pluginReadEntry(root) {
  return `Read(/${root}/**)`;
}

/** Add entries to the generated profile's allow list, the way an operator pasting them would. */
function allowInProfile(dir, entries) {
  editJson(dir, PROFILE_FILE, (profile) => {
    profile.permissions.allow.push(...entries);
  });
}

/** Every line of a report, so a pasteable entry can be asserted as a whole line rather than a substring. */
function reportLines(output) {
  return output.split('\n');
}

/**
 * The plugin-permissions check: the entries `init` cannot generate, and the lines to paste.
 *
 * **Every case asserts the exit status stays 0.** This is a machine-local gap with an operator
 * remedy, exactly like `repo-registry`, and a repository whose adopter has not pasted the entries
 * yet is one an operator can fix in a minute rather than one nothing can run in.
 *
 * **The pasteable lines are asserted verbatim, as whole lines**, because that is the entire value of
 * the check: an entry whose form drifted by one character matches nothing at run time and costs a
 * silent stall, and a substring assertion would go on passing through exactly that drift.
 */
test('the plugin-permissions check prints the entries to paste, and never above a warning', { concurrency: CASE_CONCURRENCY }, async (t) => {
  const subtests = [];

  const HELPERS = ['find-free-port.sh', 'reserve-qa-user.sh'];

  subtests.push(t.test('the interactive-test phase on, with none of the entries, warns and prints them all', async (subtest) => {
    const dir = await wiredFixture(subtest, ['--qa']);
    const root = await pluginInstallRootFixture(subtest, HELPERS);
    const home = await claudeConfigHome(subtest, [{ scope: 'user', installPath: root }]);
    const before = await snapshotTree(dir);

    const { status, stdout, stderr } = await runCli(dir, ['doctor'], home.env);

    assert.equal(status, 0, `doctor exited ${status} on a condition that only warns\n${stdout}\n${stderr}`);
    assert.match(stderr, warnLine('plugin-permissions'));
    assert.match(stdout, CLEAN_SUMMARY);

    const lines = reportLines(stderr);
    for (const entry of pluginEntries(root, HELPERS)) {
      assert.ok(lines.includes(entry), `the check did not print ${entry} as a line of its own:\n${stderr}`);
    }
    // The names come from reading the directory, so a file in it that is not a helper must not
    // become an entry — the assertion that separates a directory read from a hardcoded list.
    assert.ok(!stderr.includes(NOT_A_HELPER), `a file that is not a helper script produced an entry:\n${stderr}`);
    // No read grant is demanded here, and demanding one is the regression this pins: the sixteen
    // reads measured under the install root on 2026-08-26 succeeded under a profile naming no rule
    // over it, so an entry printed here would be one every correct adoption is warned at forever.
    assert.deepEqual(
      lines.filter((entry) => entry.startsWith('Read(')),
      [],
      `the check demanded a read grant at the install root:\n${stderr}`,
    );
    // The finding is the profile's, not the machine's: nothing is written anywhere.
    assert.deepEqual(await readdir(home.root), [CLAUDE_PLUGINS_DIR], `doctor wrote under ${home.root}`);
    assert.deepEqual(await snapshotTree(dir), before, 'doctor wrote to the repository it was asked about');
  }));

  subtests.push(t.test('the same repository with the entries pasted in passes, and says nothing on stderr', async (subtest) => {
    const dir = await wiredFixture(subtest, ['--qa']);
    const root = await pluginInstallRootFixture(subtest, HELPERS);
    const home = await claudeConfigHome(subtest, [{ scope: 'user', installPath: root }]);
    allowInProfile(dir, pluginEntries(root, HELPERS));

    const { status, stdout, stderr } = await runCli(dir, ['doctor'], home.env);

    assert.equal(status, 0, `doctor exited ${status}\n${stdout}\n${stderr}`);
    assert.match(stdout, passLine('plugin-permissions'));
    assert.doesNotMatch(stderr, warnLine('plugin-permissions'));

    // The install-root read grant is a note on the passing line rather than a requirement, and it is
    // printed in the generated profile's own two-slash spelling: a file rule anchors at the
    // filesystem root with `//` and the absolute path brings its own leading slash, while a `Bash`
    // rule is a command string and carries one. Pinning the printed form to the entries `init` itself
    // wrote is what makes normalising that double slash fail here, rather than pass because the check
    // and this file's expectation were changed together.
    const line = detailLine(stdout, passLine('plugin-permissions'));
    assert.ok(line.includes(`Read(/${root}/**)`), `the passing line did not name the read grant it does not require:\n${line}`);
    const generatedReads = readJson(join(dir, PROFILE_FILE)).permissions.allow.filter((entry) =>
      entry.startsWith('Read('),
    );
    assert.ok(generatedReads.length > 0, 'the generated profile carries no Read rule to take the spelling from');
    for (const entry of generatedReads) {
      assert.match(entry, /^Read\(\/\/[^/]/, `a file rule over an absolute path is not anchored at the filesystem root: ${entry}`);
    }
  }));

  subtests.push(t.test('a project-scope row for this repository is preferred over a user-scope one', async (subtest) => {
    const dir = await wiredFixture(subtest, ['--qa']);
    const here = await pluginInstallRootFixture(subtest, HELPERS);
    const elsewhere = await pluginInstallRootFixture(subtest, HELPERS);
    // The user row comes first in the file, so a check taking whichever it met first would take it.
    const home = await claudeConfigHome(subtest, [
      { scope: 'user', installPath: elsewhere },
      { scope: 'project', projectPath: dir, installPath: here },
    ]);

    const { stderr } = await runCli(dir, ['doctor'], home.env);

    const lines = reportLines(stderr);
    for (const entry of pluginEntries(here, HELPERS)) {
      assert.ok(lines.includes(entry), `the check did not resolve this repository's own row:\n${stderr}`);
    }
    assert.ok(!stderr.includes(elsewhere), `the check resolved the user-scope root over this repository's:\n${stderr}`);
  }));

  subtests.push(t.test('the interactive-test phase off grades nothing here, and a profile carrying nothing passes', async (subtest) => {
    const dir = await wiredFixture(subtest);
    const root = await pluginInstallRootFixture(subtest, HELPERS);
    const home = await claudeConfigHome(subtest, [{ scope: 'user', installPath: root }]);

    // Nothing has been pasted into this profile, and nothing needs to be: the helper scripts are the
    // interactive-test phase's alone, and no read grant is required at the install root — the sixteen
    // reads measured there on 2026-08-26 succeeded under a profile naming no rule over it. So the
    // check has an empty requirement set and says so, the way `daemon-path` does on a host with no
    // service manager, rather than warning at an adoption that is complete.
    const { status, stdout, stderr } = await runCli(dir, ['doctor'], home.env);

    assert.equal(status, 0, `doctor exited ${status}\n${stdout}\n${stderr}`);
    assert.match(stdout, passLine('plugin-permissions'));
    assert.doesNotMatch(stderr, warnLine('plugin-permissions'));

    const line = detailLine(stdout, passLine('plugin-permissions'));
    assert.match(line, /not graded/);
    assert.match(line, /phases\.qa is off/);
    for (const name of HELPERS) {
      assert.ok(!line.includes(name), `the passing line named a helper script with phases.qa off:\n${line}`);
    }
    // And no entry at all, of either kind — the read grant included: there is nothing to paste.
    assert.ok(!/Read\(|Bash\(bash /.test(line), `the check printed an entry with nothing graded:\n${line}`);
  }));

  subtests.push(t.test('a machine where the plugin is not enabled names the step and invents no path', async (subtest) => {
    const dir = await wiredFixture(subtest, ['--qa']);
    const home = await claudeConfigHome(subtest);

    const { status, stdout, stderr } = await runCli(dir, ['doctor'], home.env);

    assert.equal(status, 0, `doctor exited ${status} on a condition that only warns\n${stdout}\n${stderr}`);
    assert.match(stderr, warnLine('plugin-permissions'));
    assert.match(stdout, CLEAN_SUMMARY);

    const line = detailLine(stderr, warnLine('plugin-permissions'));
    // The step, so the warning is actionable...
    assert.match(line, /enable the plugin/);
    assert.match(line, /doctor/);
    // ...and no entry at all, because every entry it could print would carry a path it made up.
    assert.ok(!/Read\(/.test(line), `the check printed a read grant with no root to name:\n${line}`);
    assert.ok(!/Bash\(bash /.test(line), `the check printed a helper entry with no root to name:\n${line}`);
    assert.equal(reportLines(stderr).filter((entry) => entry.startsWith('Read(') || entry.startsWith('Bash(')).length, 0);
    // A read that created the runner's directory would make `doctor` a writer outside the repository.
    assert.deepEqual(await readdir(home.root), [], `doctor wrote under ${home.root}`);
  }));

  subtests.push(t.test('the same machine counts the entries it cannot grade, and still names none of them', async (subtest) => {
    const dir = await wiredFixture(subtest, ['--qa']);
    const home = await claudeConfigHome(subtest);
    // Both dictated forms, pasted while a root still answered. With no record to read this check
    // cannot call either stale or required — and `init --force` carries both forward unverified on
    // this same arm, so a disposition that said nothing at all would be silent about the file it
    // just declined to grade.
    const root = await pluginInstallRootFixture(subtest, HELPERS);
    const pasted = [...pluginEntries(root, [HELPERS[0]]), pluginReadEntry(root)];
    allowInProfile(dir, pasted);

    const { status, stdout, stderr } = await runCli(dir, ['doctor'], home.env);

    assert.equal(status, 0, `doctor exited ${status} on a condition that only warns\n${stdout}\n${stderr}`);
    assert.match(stderr, warnLine('plugin-permissions'));

    const line = detailLine(stderr, warnLine('plugin-permissions'));
    assert.match(
      line,
      /2 absolute-directory `permissions\.allow` entries/,
      `the check is silent about the entries it declined to grade:\n${line}`,
    );
    // Counted, never named: every path it could print here is one it made up.
    for (const entry of pasted) {
      assert.ok(!line.includes(entry), `the check named an entry no root on this machine answered for:\n${line}`);
    }
    assert.equal(reportLines(stderr).filter((entry) => entry.startsWith('Read(') || entry.startsWith('Bash(')).length, 0);
  }));

  subtests.push(t.test('a helper entry under no resolved root is named on the passing line, and a wrapper entry never is', async (subtest) => {
    const dir = await wiredFixture(subtest, ['--qa']);
    const root = await pluginInstallRootFixture(subtest, HELPERS);
    // A second plugin root nothing on this machine records: the shape an upgrade leaves behind,
    // since the install root carries the plugin version and the entries pasted against the previous
    // one stay in the profile.
    const stale = await pluginInstallRootFixture(subtest, HELPERS);
    const home = await claudeConfigHome(subtest, [{ scope: 'user', installPath: root }]);
    const staleEntry = pluginEntries(stale, [HELPERS[0]])[0];
    // A wrapper's own entry: repo-root-absolute, and byte-shaped exactly like a plugin helper's.
    const wrapperEntry = `Bash(bash ${dir}/scripts/test.sh:*)`;
    allowInProfile(dir, [...pluginEntries(root, HELPERS), staleEntry, wrapperEntry]);

    const { status, stdout, stderr } = await runCli(dir, ['doctor'], home.env);

    // The grade does not move: every required entry is there, and dead weight costs nothing at run
    // time — the remedy is a deletion the adopter owns.
    assert.equal(status, 0, `doctor exited ${status}\n${stdout}\n${stderr}`);
    assert.match(stdout, passLine('plugin-permissions'));
    assert.doesNotMatch(stderr, warnLine('plugin-permissions'));

    const line = detailLine(stdout, passLine('plugin-permissions'));
    assert.ok(line.includes(staleEntry), `the passing line did not name the entry no root resolves:\n${line}`);
    assert.ok(line.includes(stale), `the passing line did not name the directory that entry points at:\n${line}`);
    // The false positive the repo-root exclusion exists to prevent: reporting `init`'s own output
    // as dead weight would send an adopter to delete a wrapper grant their runs need.
    assert.ok(!line.includes(wrapperEntry), `a wrapper entry inside this checkout was reported as dead weight:\n${line}`);
  }));

  subtests.push(t.test('the same entry beside a missing one still warns, and is never one of the lines to paste', async (subtest) => {
    const dir = await wiredFixture(subtest, ['--qa']);
    const root = await pluginInstallRootFixture(subtest, HELPERS);
    const stale = await pluginInstallRootFixture(subtest, HELPERS);
    const home = await claudeConfigHome(subtest, [{ scope: 'user', installPath: root }]);
    const staleEntry = pluginEntries(stale, [HELPERS[0]])[0];
    const [absent, ...pasted] = pluginEntries(root, HELPERS);
    allowInProfile(dir, [...pasted, staleEntry]);

    const { status, stdout, stderr } = await runCli(dir, ['doctor'], home.env);

    assert.equal(status, 0, `doctor exited ${status} on a condition that only warns\n${stdout}\n${stderr}`);
    assert.match(stderr, warnLine('plugin-permissions'));

    const lines = reportLines(stderr);
    assert.ok(lines.includes(absent), `the warning stopped printing the missing line to paste:\n${stderr}`);
    const line = detailLine(stderr, warnLine('plugin-permissions'));
    assert.ok(line.includes(staleEntry), `the warning did not name the entry no root resolves:\n${line}`);
    // Named in the prose and never among the pasteable lines: those are what an operator copies, and
    // an entry to delete standing among them would be pasted straight back in.
    assert.ok(!lines.includes(staleEntry), `the entry to delete was printed as a line to paste:\n${stderr}`);
  }));

  subtests.push(t.test('with nothing graded here at all, the same entry is still named', async (subtest) => {
    const dir = await wiredFixture(subtest);
    const root = await pluginInstallRootFixture(subtest, HELPERS);
    const stale = await pluginInstallRootFixture(subtest, HELPERS);
    const home = await claudeConfigHome(subtest, [{ scope: 'user', installPath: root }]);
    const staleEntry = pluginEntries(stale, [HELPERS[0]])[0];
    allowInProfile(dir, [staleEntry]);

    const { status, stdout, stderr } = await runCli(dir, ['doctor'], home.env);

    // The disposition with nothing to require is the one an entry can hide behind: phases.qa is off,
    // so no line is owed at either root, and this is the only place the profile's dead weight is
    // reported at all.
    assert.equal(status, 0, `doctor exited ${status}\n${stdout}\n${stderr}`);
    assert.match(stdout, passLine('plugin-permissions'));
    const line = detailLine(stdout, passLine('plugin-permissions'));
    assert.match(line, /not graded/);
    assert.ok(line.includes(staleEntry), `the not-graded line did not name the entry no root resolves:\n${line}`);
  }));

  // The seven cases above write no `known_marketplaces.json`, so the runtime root falls back to the
  // install root and the two coincide — the git-sourced adoption, and the state their "no read
  // grant, five helper entries" assertions pin. The three below are the machine where they differ.

  /** A helper the runtime root ships and the install snapshot does not, so the union is not either listing. */
  const EXTRA_HELPER = 'poll-dev-server.sh';
  const UNION = [...HELPERS, EXTRA_HELPER].sort();

  subtests.push(t.test('a directory-sourced marketplace grades both roots, and only the runtime one carries a read grant', async (subtest) => {
    const dir = await wiredFixture(subtest, ['--qa']);
    const installed = await pluginInstallRootFixture(subtest, HELPERS);
    const sourced = await marketplaceLocationFixture(subtest, UNION);
    const home = await claudeConfigHome(subtest, [{ scope: 'user', installPath: installed }], sourced.location);

    const runtimeEntries = [pluginReadEntry(sourced.root), ...pluginEntries(sourced.root, UNION)];
    const installEntries = pluginEntries(installed, UNION);

    const { status, stdout, stderr } = await runCli(dir, ['doctor'], home.env);

    assert.equal(status, 0, `doctor exited ${status} on a condition that only warns\n${stdout}\n${stderr}`);
    assert.match(stderr, warnLine('plugin-permissions'));

    const lines = reportLines(stderr);
    for (const entry of [...runtimeEntries, ...installEntries]) {
      assert.ok(lines.includes(entry), `the check did not print ${entry} as a line of its own:\n${stderr}`);
    }
    // A name shipped under one root only is graded at both: the root set is what varies, and the
    // name set is the union of what the directories hold rather than either one's listing.
    assert.ok(lines.includes(`Bash(bash ${installed}/scripts/${EXTRA_HELPER}:*)`), `the graded names are not the union:\n${stderr}`);
    // Each group names the record its root was derived from, so an operator pasting can tell the
    // two apart rather than reading eleven lines as one list.
    assert.match(stderr, new RegExp(`${KNOWN_MARKETPLACES_FILE}`.replace('.', '\\.')));
    assert.match(stderr, new RegExp(`${INSTALLED_PLUGINS_FILE}`.replace('.', '\\.')));
    // The install root's own read grant is not required, and printing one is the regression the
    // measurement forbids: sixteen reads under it succeeded ungranted on 2026-08-26.
    assert.ok(!lines.includes(pluginReadEntry(installed)), `the check demanded a read grant at the install root:\n${stderr}`);

    // And the asymmetry in one assertion: the runtime root's read grant plus both roots' helper
    // entries, with **no** install-root read rule, is a complete profile.
    allowInProfile(dir, [...runtimeEntries, ...installEntries]);
    const pasted = await runCli(dir, ['doctor'], home.env);

    assert.equal(pasted.status, 0, `doctor exited ${pasted.status}\n${pasted.stdout}\n${pasted.stderr}`);
    assert.match(pasted.stdout, passLine('plugin-permissions'));
    assert.doesNotMatch(pasted.stderr, warnLine('plugin-permissions'));
  }));

  subtests.push(t.test("a profile carrying one root's entries warns naming the other root's, in both directions", async (subtest) => {
    const installed = await pluginInstallRootFixture(subtest, HELPERS);
    const sourced = await marketplaceLocationFixture(subtest, HELPERS);
    const home = await claudeConfigHome(subtest, [{ scope: 'user', installPath: installed }], sourced.location);
    const runtimeEntries = [pluginReadEntry(sourced.root), ...pluginEntries(sourced.root, HELPERS)];
    const installEntries = pluginEntries(installed, HELPERS);

    for (const [pasted, expected] of [
      [installEntries, runtimeEntries],
      [runtimeEntries, installEntries],
    ]) {
      const dir = await wiredFixture(subtest, ['--qa']);
      allowInProfile(dir, pasted);

      const { status, stdout, stderr } = await runCli(dir, ['doctor'], home.env);

      assert.equal(status, 0, `doctor exited ${status} on a condition that only warns\n${stdout}\n${stderr}`);
      assert.match(stderr, warnLine('plugin-permissions'));
      const lines = reportLines(stderr);
      for (const entry of expected) {
        assert.ok(lines.includes(entry), `the check did not print the other root's ${entry}:\n${stderr}`);
      }
      // The group whose entries are all satisfied is not printed at all, so nothing an operator has
      // already pasted comes back at them as work.
      for (const entry of pasted) {
        assert.ok(!lines.includes(entry), `the check reprinted an entry the profile already carries: ${entry}\n${stderr}`);
      }
    }
  }));

  subtests.push(t.test('with the interactive-test phase off, a differing runtime root still needs its read grant', async (subtest) => {
    const dir = await wiredFixture(subtest);
    const installed = await pluginInstallRootFixture(subtest, HELPERS);
    const sourced = await marketplaceLocationFixture(subtest, HELPERS);
    const home = await claudeConfigHome(subtest, [{ scope: 'user', installPath: installed }], sourced.location);

    const { status, stdout, stderr } = await runCli(dir, ['doctor'], home.env);

    assert.equal(status, 0, `doctor exited ${status} on a condition that only warns\n${stdout}\n${stderr}`);
    assert.match(stderr, warnLine('plugin-permissions'));

    const lines = reportLines(stderr);
    // The read rule sits outside the phase gate — instruction files and samples are read by every
    // run — while the helper entries stay inside it.
    assert.ok(lines.includes(pluginReadEntry(sourced.root)), `the read grant was gated on phases.qa:\n${stderr}`);
    assert.deepEqual(
      lines.filter((entry) => entry.startsWith('Bash(bash ')),
      [],
      `a helper entry was required with phases.qa off:\n${stderr}`,
    );
    assert.ok(!lines.includes(pluginReadEntry(installed)), `the check demanded a read grant at the install root:\n${stderr}`);

    allowInProfile(dir, [pluginReadEntry(sourced.root)]);
    const pastedRun = await runCli(dir, ['doctor'], home.env);

    assert.equal(pastedRun.status, 0, `doctor exited ${pastedRun.status}\n${pastedRun.stdout}\n${pastedRun.stderr}`);
    assert.match(pastedRun.stdout, passLine('plugin-permissions'));
    assert.doesNotMatch(pastedRun.stderr, warnLine('plugin-permissions'));
  }));

  await Promise.all(subtests);
});

/**
 * Acceptance 6 — the three docs-retrieval checks. With retrieval on, `retrieval-dependencies` fails
 * unless the runtime the `.mcp.json` launcher execs is installed at this CLI's version with its peers,
 * `retrieval-model-cache` fails unless the model files are cached, and `retrieval-index` fails unless
 * an index builds in memory. With retrieval off, all three pass saying nothing is expected.
 *
 * The fixture is not wired by `init`, whose retrieval setup would install the runtime, so these cases
 * assert the three report lines rather than a clean summary.
 */
const RETRIEVAL_CHECK_IDS = ['retrieval-dependencies', 'retrieval-model-cache', 'retrieval-index'];

const RETRIEVAL_OFF_TEXT = 'docs.retrieval is off (it needs phases.docs and docs.retrieval both true)';

const REMEDY = 'npx autonomous-sdlc-harness init';

/** A retrieval-on fixture with a one-file corpus, a planted model cache and, unless told not to, a planted runtime. */
async function retrievalDoctorFixture(t, { runtime = true, runtimeVersion } = {}) {
  const fixture = await createFixture({
    files: {
      'docs/guide.md': '# Guide\nIntro line.\n## Setup\nInstall the tool.\n',
      'conventions.md': '# Conventions\n## Rules\nA line about the rules.\n',
    },
  });
  t.after(fixture.cleanup);
  await writeRetrievalConfig(fixture.dir);
  const cacheHome = await realpath(await mkdtemp(join(tmpdir(), 'harness-doctor-retrieval-')));
  t.after(() => rm(cacheHome, { recursive: true, force: true }));
  await plantModelFiles(cacheHome);
  if (runtime) await plantRetrievalRuntime(cacheHome, runtimeVersion === undefined ? {} : { version: runtimeVersion });
  return { dir: fixture.dir, cacheHome, env: retrievalEnv(cacheHome) };
}

test('Acceptance 6 (a): with retrieval on and everything in place, the three retrieval checks pass and the tree is unchanged', async (t) => {
  const { dir, env } = await retrievalDoctorFixture(t);
  const before = await snapshotTree(dir);

  const { stdout, stderr } = await runCli(dir, ['doctor'], env);

  for (const id of RETRIEVAL_CHECK_IDS) {
    assert.match(stdout, passLine(id), `${id} did not pass\n${stdout}\n${stderr}`);
  }
  assert.ok(
    detailLine(stdout, passLine('retrieval-index')).includes('docs index: 2 files'),
    `the index check did not quote the build line:\n${stdout}`,
  );
  assert.deepEqual(await snapshotTree(dir), before);
});

test('Acceptance 6 (b): with the model cache removed, the model and index checks fail and doctor exits non-zero', async (t) => {
  const { dir, cacheHome, env } = await retrievalDoctorFixture(t);
  await rm(join(cacheHome, 'autonomous-sdlc-harness', 'retrieval', 'models'), { recursive: true, force: true });

  const { status, stdout, stderr } = await runCli(dir, ['doctor'], env);

  assert.notEqual(status, 0);
  assert.match(stderr, failLine('retrieval-model-cache'), stdout);
  assert.match(stderr, failLine('retrieval-index'), stdout);
  assert.ok(detailLine(stderr, failLine('retrieval-model-cache')).includes(REMEDY), stderr);
});

test('Acceptance 6 (c): with phases.docs off, the three retrieval checks pass with the off sentence', async (t) => {
  const dir = await wiredFixture(t);

  const { stdout, stderr } = await runCli(dir, ['doctor']);

  for (const id of RETRIEVAL_CHECK_IDS) {
    assert.ok(detailLine(stdout, passLine(id)).includes(RETRIEVAL_OFF_TEXT), `${id}:\n${stdout}\n${stderr}`);
  }
});

test('Acceptance 6 (d): with no runtime installed, or one at another version, retrieval-dependencies fails', async (t) => {
  for (const [label, options] of [
    ['no runtime', { runtime: false }],
    ['runtime at another version', { runtimeVersion: '0.0.0-other' }],
  ]) {
    await t.test(label, async (subtest) => {
      const { dir, env } = await retrievalDoctorFixture(subtest, options);

      const { status, stdout, stderr } = await runCli(dir, ['doctor'], env);

      assert.notEqual(status, 0);
      assert.match(stderr, failLine('retrieval-dependencies'), stdout);
      const line = detailLine(stderr, failLine('retrieval-dependencies'));
      assert.ok(line.includes('autonomous-sdlc-harness'), line);
      assert.ok(line.includes(REMEDY), line);
    });
  }
});

/**
 * The child prints its coverage warnings on stderr and still exits 0, so this asserts the one thing
 * `execFileSync` cannot deliver: a *passing* build whose corpus was truncated says so. Without it,
 * "the documentation catalog was never indexed" reads as a pass with a smaller file count, on the one
 * check an adopter runs to answer whether retrieval is set up correctly.
 */
test('Acceptance 6 (e): a passing index check quotes the coverage warning the build printed', async (t) => {
  const { dir, env } = await retrievalDoctorFixture(t);
  await rm(join(dir, 'docs'), { recursive: true, force: true });

  const { stdout, stderr } = await runCli(dir, ['doctor'], env);

  assert.match(stdout, passLine('retrieval-index'), `${stdout}\n${stderr}`);
  const line = detailLine(stdout, passLine('retrieval-index'));
  assert.ok(line.includes('docs index: 1 files'), line);
  assert.ok(line.includes('docs.root docs is not a directory'), line);
});

});

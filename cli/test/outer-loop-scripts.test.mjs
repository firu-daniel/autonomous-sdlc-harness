/**
 * The outer-loop scripts `init` writes into the configured `scriptsDir`, against a repository the
 * test builds and throws away.
 *
 * **The rule these tests exist to enforce: an outer-loop script lands where the config says, byte
 * for byte, and a re-run never rewrites one the adopter edited.** These files mutate repositories —
 * they commit, push, remove worktrees and delete branches — so the two failures worth catching
 * early are a copy that arrives changed (a template rendered when it should have been copied) and a
 * second `init` silently reverting a local fix to one of them.
 *
 * These run against the **compiled** CLI at `dist/cli.js`, so `npm run build` precedes `npm test`;
 * `runCli` refuses with that sentence rather than leaving a module-resolution error to explain it.
 *
 * **The library's shared readers and writers answer the contract their consumers call.**
 * `hr_execution_target` is the family's one reader of `execution.target`: the schema default `local`
 * when the key is absent, the value when it is in the enum, and exit 2 — never a guess — when it is
 * not. The run registry's primitives are shared by every script that touches the registry, so one
 * write followed by one read must round-trip through a fresh `{"runs": {…}}` file. The remote state
 * bundle is the format every remote-execution consumer shares, so each file must land where the
 * format says after a write and a restore, and an unrecognised bundle must change nothing.
 *
 * ## Four non-obvious choices, and where each comes from
 *
 * 1. **The written file is compared against the shipped template's bytes.** Everywhere else in this
 *    suite an assertion names the contract literally rather than importing what generated it —
 *    comparing output to its own source usually proves only self-consistency. Here the *contract is*
 *    "copied verbatim, with no substitution at all", so the byte comparison is the whole assertion,
 *    and it is stronger than a no-surviving-token check: these files legitimately discuss tokens in
 *    their own prose, and a renderer let loose on one would be caught by the bytes rather than by a
 *    scan for `{{`.
 * 2. **The relocated-`scriptsDir` case seeds its own config before the first `init`**, rather than
 *    running `init` and editing the config afterwards. A repository wired at the default first
 *    would still hold the copy that run wrote, so "written there and nowhere else" could not be
 *    asserted over the tree.
 * 3. **The library is executed, not just read.** It is sourced by every other outer-loop script and
 *    ships non-executable for that reason; running it directly must define its functions and do
 *    nothing else, which is the one behaviour a mis-ported top-level statement would break.
 * 4. **The scratch runner is driven with arguments, and its refusals are the assertions.** It is the
 *    one row that executes what it is *given*, so "written, and executable" says nothing about
 *    whether allowing an agent to run it is safe — the refusal cases are what that row's
 *    `agentInvocable: true` is worth. They assert the message shape and a non-zero status rather
 *    than a helper name: the script defines no `harness_fail`, which belongs to the rendered wrapper
 *    templates and is not in the shared library. The symlink and character-class rows are not
 *    spelling variants of the containment rows beside them: they are the two branches the script's
 *    own `THE REFUSAL IS THE WHOLE OF THE SAFETY` paragraph rests on — `[ -L "$target" ]`, which is
 *    what stops a file in the scratch directory naming any target on the machine, and the
 *    `*[!A-Za-z0-9._/-]*` test, which is what keeps an unexpanded `$`, a quote, a glob or a space
 *    out of the argument before anything is resolved. Dropping either leaves the containment rows
 *    green. What every one of them bounds is **which file runs**, never what that file does: the
 *    runner's own `WHAT THIS DOES NOT CONTAIN` paragraph states that reach, and no case here
 *    measures it.
 */

import assert from 'node:assert/strict';
import { execFile, execFileSync, spawn } from 'node:child_process';
import {
  accessSync,
  appendFileSync,
  chmodSync,
  constants as fsConstants,
  mkdirSync,
  readdirSync,
  readFileSync,
  statSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { lstat } from 'node:fs/promises';
import { delimiter, join } from 'node:path';
import test from 'node:test';

import {
  PYTHON_BACKEND_UNAVAILABLE_EXIT,
  PYTHON_DATABASE_URL_VARIABLE,
  PYTHON_DEFAULT_DATABASE_URL,
  PYTHON_RETRIEVAL_COMMAND,
  PYTHON_SERVE_SUB_COMMAND,
} from '../dist/retrieval/pythonBackend.js';
import { createFixture, plantRetrievalRuntime, runBash, runCli, runGit, snapshotTree, PACKAGE_ROOT } from './helpers/fixture.mjs';

/** The default `scriptsDir`, and the library's path under it — the contract, spelled out once. */
const SCRIPTS_DIR = 'scripts';
const LIB_SUBDIR = 'lib';
const LIB_FILE = 'harness-run-lib.sh';
const LIB_PATH = `${SCRIPTS_DIR}/${LIB_SUBDIR}/${LIB_FILE}`;

/** A `scriptsDir` that is neither the default nor a single segment, so a naive join would show. */
const RELOCATED_SCRIPTS_DIR = 'tools/harness';

/** Sourced, never executed: an executable bit here invites a caller to run it instead. */
const LIB_MODE = 0o644;

/**
 * The scratch runner: the one row that executes an ARGUMENT, so its safety is in the script rather
 * than in its table row and the cases below are its own.
 */
const SCRATCH_FILE = 'scratch-run.sh';
const SCRATCH_PATH = `${SCRIPTS_DIR}/${SCRATCH_FILE}`;
const SCRATCH_MODE = 0o755;

/**
 * The docs-retrieval server launcher, and the runtime entry it `exec`s under a machine cache
 * directory, spelled out as the contract.
 */
const LAUNCHER_FILE = 'docs-search-server.sh';
const LAUNCHER_PATH = `${SCRIPTS_DIR}/${LAUNCHER_FILE}`;
const LAUNCHER_TEMPLATE = join(PACKAGE_ROOT, 'templates', SCRIPTS_DIR, LAUNCHER_FILE);
const RUNTIME_ENTRY = [
  'autonomous-sdlc-harness',
  'retrieval',
  'runtime',
  'node_modules',
  'autonomous-sdlc-harness',
  'dist',
  'cli.js',
];

/** The state directory a default `init` writes, and the one directory a file may be run out of. */
const STATE_DIR = 'sdlc-harness';
const SCRATCH_DIR = `${STATE_DIR}/scratch`;

/** The shipped template the written copy must equal byte for byte. */
const LIB_TEMPLATE = join(PACKAGE_ROOT, 'templates', SCRIPTS_DIR, LIB_SUBDIR, LIB_FILE);

/** A repository whose stack detection resolves every command — the seed `init`'s own tests use. */
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
 * A hand-written config `init` will keep and generate against, carrying one non-default value.
 *
 * Minimal on purpose: the schema's five required keys plus the one under test. A config assembled
 * from more than that would make a failure ambiguous between the key being read and the file being
 * accepted at all.
 */
function seededConfig(overrides) {
  return {
    version: 1,
    defaultBranch: 'main',
    stateDir: 'sdlc-harness/',
    layers: [{ name: 'general', path: '.', conventions: '.claude/context/conventions.md' }],
    commands: { typecheck: 'echo typecheck', test: 'echo test' },
    ...overrides,
  };
}

/** Build a fixture, register its teardown against the test, and return its directory. */
async function fixtureFor(t, options) {
  const fixture = await createFixture(options);
  t.after(fixture.cleanup);
  return fixture.dir;
}

/** Run `init` and fail with the CLI's own output when it did not exit 0. */
async function initOk(dir, args = []) {
  const result = await runCli(dir, ['init', ...args]);
  assert.equal(result.status, 0, `init exited ${result.status}\n${result.stdout}\n${result.stderr}`);
  return result;
}

/** The file's text. */
function text(dir, relativePath) {
  return readFileSync(join(dir, relativePath), 'utf8');
}

/** Every snapshot key naming a file with this basename, whatever directory it sits in. */
function copiesOf(snapshot, name) {
  return Object.keys(snapshot).filter((key) => key === name || key.endsWith(`/${name}`));
}

/** Source the written library and call one of its readers against the fixture, in one shell. */
function sourceAndCall(dir, reader) {
  return new Promise((resolve, reject) => {
    const script = `. "$1"; ${reader} "$2"`;
    execFile('bash', ['-c', script, '_', join(dir, LIB_PATH), dir], { cwd: dir, encoding: 'utf8' }, (error, out, err) => {
      if (error !== null && typeof error.code !== 'number') reject(error);
      else resolve({ status: error === null ? 0 : error.code, stdout: out, stderr: err });
    });
  });
}

/**
 * Source the written library and call a reader in a CONTROLLED environment, so a case can state the
 * `PATH` and `HOME` the caller inherits.
 *
 * Separate from `sourceAndCall` rather than a widening of it: that one passes the fixture directory
 * as `$2` and sets no environment, and adding an `env` there would disturb every existing caller.
 *
 * `/bin/bash` by absolute path on purpose — a case below inherits an EMPTY `PATH`, and a bare `bash`
 * would then fail to resolve, making the refusal the spawn's rather than the library's.
 */
function sourceAndCallWithEnv(dir, reader, env) {
  return new Promise((resolve, reject) => {
    const script = `. "$1"; ${reader}`;
    const options = { cwd: dir, encoding: 'utf8', env };
    execFile('/bin/bash', ['-c', script, '_', join(dir, LIB_PATH)], options, (error, out, err) => {
      if (error !== null && typeof error.code !== 'number') reject(error);
      else resolve({ status: error === null ? 0 : error.code, stdout: out, stderr: err });
    });
  });
}

/**
 * The printed `PATH`, as entries — the form every assertion below reads it in. Split on a literal
 * colon rather than the platform delimiter: the library's separator is `:` in every environment it
 * runs in, and these cases drive it through `bash`.
 */
function pathEntries(stdout) {
  return stdout.trim().split(':');
}

/** Call the PATH policy with an inherited `PATH` and `HOME`, and fail with its stderr if it did not. */
async function pathWithFallbacks(dir, env) {
  const { status, stdout, stderr } = await sourceAndCallWithEnv(dir, 'hr_path_with_fallbacks', env);
  assert.equal(status, 0, `hr_path_with_fallbacks exited ${status}: ${stderr}`);
  return stdout;
}

/**
 * The fixed fallback directories absent from every inherited value the cases below feed in; the
 * third, `$HOME/.local/bin`, is named from each case's own fixture `HOME` rather than listed here.
 */
const ABSENT_FALLBACKS = ['/opt/homebrew/bin', '/usr/local/bin'];

test('a first init writes the shared library under scriptsDir, verbatim and non-executable', async (t) => {
  const dir = await fixtureFor(t, { files: nodeProjectFiles() });

  await initOk(dir);

  assert.equal(text(dir, LIB_PATH), readFileSync(LIB_TEMPLATE, 'utf8'), `${LIB_PATH} is not the template's bytes`);

  const mode = (await lstat(join(dir, LIB_PATH))).mode & 0o777;
  assert.equal(mode, LIB_MODE, `${LIB_PATH} is mode ${mode.toString(8)}, not ${LIB_MODE.toString(8)}`);
});

test('the library is sourced-only: running it directly does nothing and exits 0', async (t) => {
  const dir = await fixtureFor(t, { files: nodeProjectFiles() });

  await initOk(dir);

  const { status, stdout, stderr } = await new Promise((resolve, reject) => {
    execFile('bash', [join(dir, LIB_PATH)], { cwd: dir, encoding: 'utf8' }, (error, out, err) => {
      if (error !== null && typeof error.code !== 'number') reject(error);
      else resolve({ status: error === null ? 0 : error.code, stdout: out, stderr: err });
    });
  });

  assert.equal(status, 0, `running ${LIB_FILE} exited ${status}: ${stderr}`);
  assert.equal(stdout, '', `running ${LIB_FILE} printed to stdout, so it does something at top level`);
  assert.equal(stderr, '', `running ${LIB_FILE} printed to stderr, so it does something at top level`);
});

test("the library's typed reader answers from the configured file", async (t) => {
  const set = await fixtureFor(t, {
    files: { ...nodeProjectFiles(), 'harness.config.json': seededConfig({ agentEffort: 'xhigh' }) },
  });
  await initOk(set);

  const configured = await sourceAndCall(set, 'hr_agent_effort');
  // Exit 2 is the reader's "could not reach the configuration at all", which it reports with an empty
  // stderr — distinguish it first, or a missing `jq` reads as a wrong answer rather than a missing tool.
  assert.notEqual(
    configured.status,
    2,
    'hr_agent_effort could not resolve the configuration at all — `jq` 1.5+ must be on PATH for this gate',
  );
  assert.equal(configured.status, 0, `hr_agent_effort exited ${configured.status}: ${configured.stderr}`);
  assert.equal(configured.stdout, 'xhigh\n', 'hr_agent_effort did not print the configured level');

  // The key omitted. The branch above is what a missing `jq` projection line breaks — an unprojected
  // key reads as unset from every document — and this one is what a reader given a default breaks,
  // so the pair pins the shape neither assertion pins alone.
  const unset = await fixtureFor(t, {
    files: { ...nodeProjectFiles(), 'harness.config.json': seededConfig() },
  });
  await initOk(unset);

  const absent = await sourceAndCall(unset, 'hr_agent_effort');
  assert.equal(absent.status, 1, `hr_agent_effort exited ${absent.status} for an unset key: ${absent.stderr}`);
  assert.equal(absent.stdout, '', 'hr_agent_effort printed a value for an unset key with no default');
});

test('hr_execution_target applies the schema default, reads the enum and refuses a value outside it', async (t) => {
  const dir = await fixtureFor(t, {
    files: { ...nodeProjectFiles(), 'harness.config.json': seededConfig() },
  });
  await initOk(dir);

  // Each call is its own `bash`, so the per-process cache is cold and reads the file as rewritten.
  const withExecution = (execution) =>
    writeFileSync(
      join(dir, 'harness.config.json'),
      `${JSON.stringify(execution === undefined ? seededConfig() : seededConfig({ execution }))}\n`,
    );

  withExecution(undefined);
  const absent = await sourceAndCall(dir, 'hr_execution_target');
  assert.notEqual(absent.status, 2, 'hr_execution_target could not resolve the configuration — `jq` 1.5+ must be on PATH');
  assert.equal(absent.status, 0, `hr_execution_target exited ${absent.status} with the key absent: ${absent.stderr}`);
  assert.equal(absent.stdout, 'local\n', 'hr_execution_target did not apply the schema default');

  withExecution({ target: 'github-actions' });
  const remote = await sourceAndCall(dir, 'hr_execution_target');
  assert.equal(remote.status, 0, `hr_execution_target exited ${remote.status}: ${remote.stderr}`);
  assert.equal(remote.stdout, 'github-actions\n', 'hr_execution_target did not print the configured target');

  withExecution({ target: 'gitlab' });
  const unknown = await sourceAndCall(dir, 'hr_execution_target');
  assert.equal(unknown.status, 2, `hr_execution_target exited ${unknown.status} for a value outside the enum`);
  assert.equal(unknown.stdout, '', 'hr_execution_target printed a value for a target outside the enum');
});

test('hr_forge reads the enum, reports an absent key as undecided and refuses a value outside it', async (t) => {
  const dir = await fixtureFor(t, {
    files: { ...nodeProjectFiles(), 'harness.config.json': seededConfig() },
  });
  await initOk(dir);

  // Each call is its own `bash`, so the per-process cache is cold and reads the file as rewritten.
  const withForge = (forge) =>
    writeFileSync(
      join(dir, 'harness.config.json'),
      `${JSON.stringify(forge === undefined ? seededConfig() : seededConfig({ forge }))}\n`,
    );

  withForge(undefined);
  const absent = await sourceAndCall(dir, 'hr_forge');
  assert.notEqual(absent.status, 2, 'hr_forge could not resolve the configuration — `jq` 1.5+ must be on PATH');
  assert.equal(absent.status, 1, `hr_forge exited ${absent.status} with the key absent: ${absent.stderr}`);
  assert.equal(absent.stdout, '', 'hr_forge printed a value for an absent key, which has no default');

  withForge('github');
  const github = await sourceAndCall(dir, 'hr_forge');
  assert.equal(github.status, 0, `hr_forge exited ${github.status}: ${github.stderr}`);
  assert.equal(github.stdout, 'github\n', 'hr_forge did not print the configured forge');

  withForge('bitbucket');
  const unknown = await sourceAndCall(dir, 'hr_forge');
  assert.equal(unknown.status, 2, `hr_forge exited ${unknown.status} for a value outside the enum`);
  assert.equal(unknown.stdout, '', 'hr_forge printed a value for a forge outside the enum');
});

test('hr_docs_retrieval_backend applies the schema default, reads the enum and refuses a value outside it', async (t) => {
  const dir = await fixtureFor(t, {
    files: { ...nodeProjectFiles(), 'harness.config.json': seededConfig() },
  });
  await initOk(dir);

  // Each call is its own `bash`, so the per-process cache is cold and reads the file as rewritten.
  const withDocs = (docs) =>
    writeFileSync(
      join(dir, 'harness.config.json'),
      `${JSON.stringify(docs === undefined ? seededConfig() : seededConfig({ docs }))}\n`,
    );

  withDocs(undefined);
  const absent = await sourceAndCall(dir, 'hr_docs_retrieval_backend');
  assert.notEqual(absent.status, 2, 'hr_docs_retrieval_backend could not resolve the configuration — `jq` 1.5+ must be on PATH');
  assert.equal(absent.status, 0, `hr_docs_retrieval_backend exited ${absent.status} with the key absent: ${absent.stderr}`);
  assert.equal(absent.stdout, 'typescript\n', 'hr_docs_retrieval_backend did not apply the schema default');

  withDocs({ retrievalBackend: 'python' });
  const python = await sourceAndCall(dir, 'hr_docs_retrieval_backend');
  assert.equal(python.status, 0, `hr_docs_retrieval_backend exited ${python.status}: ${python.stderr}`);
  assert.equal(python.stdout, 'python\n', 'hr_docs_retrieval_backend did not print the configured backend');

  withDocs({ retrievalBackend: 'java' });
  const unknown = await sourceAndCall(dir, 'hr_docs_retrieval_backend');
  assert.equal(unknown.status, 2, `hr_docs_retrieval_backend exited ${unknown.status} for a value outside the enum`);
  assert.equal(unknown.stdout, '', 'hr_docs_retrieval_backend printed a value for a backend outside the enum');

  // A wrong-typed `docs` parent nulls the key alone in `hr_config_load`, so it reads as absent.
  withDocs('x');
  const wrongParent = await sourceAndCall(dir, 'hr_docs_retrieval_backend');
  assert.equal(wrongParent.status, 0, `hr_docs_retrieval_backend exited ${wrongParent.status} for a string \`docs\`: ${wrongParent.stderr}`);
  assert.equal(wrongParent.stdout, 'typescript\n', 'hr_docs_retrieval_backend did not read a string `docs` as an absent key');

  writeFileSync(join(dir, 'harness.config.json'), '{ not json\n');
  const unparsable = await sourceAndCall(dir, 'hr_docs_retrieval_backend');
  assert.equal(unparsable.status, 2, `hr_docs_retrieval_backend exited ${unparsable.status} for a config jq cannot parse`);
  assert.equal(unparsable.stdout, '', 'hr_docs_retrieval_backend printed a value for a config jq cannot parse');
});

test('hr_docs_retrieval_applies answers through its status alone, mirroring retrievalApplies', async (t) => {
  const dir = await fixtureFor(t, {
    files: { ...nodeProjectFiles(), 'harness.config.json': seededConfig() },
  });
  await initOk(dir);

  // Each call is its own `bash`, so the per-process cache is cold and reads the file as rewritten.
  const rows = [
    { name: 'docs on, retrieval on', overrides: { phases: { docs: true }, docs: { retrieval: true } }, status: 0 },
    { name: 'docs on, retrieval off', overrides: { phases: { docs: true }, docs: { retrieval: false } }, status: 1 },
    { name: 'docs on, retrieval absent', overrides: { phases: { docs: true } }, status: 1 },
    { name: 'docs off, retrieval on', overrides: { phases: { docs: false }, docs: { retrieval: true } }, status: 1 },
    { name: 'docs on, retrieval a string', overrides: { phases: { docs: true }, docs: { retrieval: 'true' } }, status: 2 },
  ];
  for (const row of rows) {
    writeFileSync(join(dir, 'harness.config.json'), `${JSON.stringify(seededConfig(row.overrides))}\n`);
    const result = await sourceAndCall(dir, 'hr_docs_retrieval_applies');
    assert.equal(result.status, row.status, `hr_docs_retrieval_applies exited ${result.status} for ${row.name}: ${result.stderr}`);
    assert.equal(result.stdout, '', `hr_docs_retrieval_applies printed to stdout for ${row.name}`);
  }

  writeFileSync(join(dir, 'harness.config.json'), '{ not json\n');
  const unparsable = await sourceAndCall(dir, 'hr_docs_retrieval_applies');
  assert.equal(unparsable.status, 2, `hr_docs_retrieval_applies exited ${unparsable.status} for a config jq cannot parse`);
  assert.equal(unparsable.stdout, '', 'hr_docs_retrieval_applies printed to stdout for a config jq cannot parse');
});

test('hr_inbox_route_var routes each suffix to its engine and branch and refuses anything else', async (t) => {
  const dir = await fixtureFor(t, { files: nodeProjectFiles() });
  await initOk(dir);

  // `sourceAndCall` appends the fixture directory as one argument; the wrapper ignores it.
  const route = async (fname) => {
    const reader = `route() { hr_inbox_route_var '${fname}'; printf '%s|%s|%s' "$?" "$HR_INBOX_KIND" "$HR_INBOX_BRANCH"; }; route`;
    const { status, stdout, stderr } = await sourceAndCall(dir, reader);
    assert.equal(status, 0, `routing ${fname} exited ${status}: ${stderr}`);
    return stdout;
  };

  assert.equal(await route('foo_review_task_prompt.md'), '0|task|foo_review');
  assert.equal(await route('foo_task_prompt_review.md'), '0|user_review|foo_task_prompt');
  assert.equal(await route('foo_review_2.md'), '0|user_review|foo');
  assert.equal(await route('foo_review_2_review.md'), '0|user_review|foo_review_2');
  assert.equal(await route('foo_docs.md'), '0|docs|foo');
  assert.equal(await route('notes.txt'), '1||', 'an unroutable name did not return 1 with both variables empty');
});

test('hr_registry_set then hr_registry_get round-trips a value through a fresh registry file', async (t) => {
  const dir = await fixtureFor(t, { files: nodeProjectFiles() });
  await initOk(dir);

  const registry = join(dir, 'registry.json');
  const { status, stdout, stderr } = await new Promise((resolve, reject) => {
    const script = '. "$1"; hr_registry_set "$2" feat/x status running && hr_registry_get "$2" feat/x status';
    execFile('bash', ['-c', script, '_', join(dir, LIB_PATH), registry], { cwd: dir, encoding: 'utf8' }, (error, out, err) => {
      if (error !== null && typeof error.code !== 'number') reject(error);
      else resolve({ status: error === null ? 0 : error.code, stdout: out, stderr: err });
    });
  });

  assert.equal(status, 0, `the registry round-trip exited ${status}: ${stderr}`);
  assert.equal(stdout, 'running\n', 'hr_registry_get did not return the value hr_registry_set wrote');
  const record = JSON.parse(readFileSync(registry, 'utf8'));
  assert.deepEqual(Object.keys(record), ['runs'], 'the registry file is not shaped {"runs": {…}}');
  assert.equal(record.runs['feat/x'].status, 'running');
  assert.equal(record.runs['feat/x'].branch, 'feat/x', 'the write did not stamp `branch`');
  assert.equal(typeof record.runs['feat/x'].updated_at, 'string', 'the write did not stamp `updated_at`');
});

/** Source the written library, then run `script` with the remaining values as `$1`, `$2`, …. */
function libCall(dir, script, args = [], env = {}) {
  return runBash(dir, ['-c', `. "$1"; shift; ${script}`, '_', join(dir, LIB_PATH), ...args], env);
}

test('the artifact placement commits one path once, skips an identical re-drop and reads landed off origin', async (t) => {
  const dir = await fixtureFor(t, { files: nodeProjectFiles() });
  await initOk(dir);
  await runGit(dir, ['checkout', '--quiet', '-b', 'feat_x']);
  plant(dir, 'watcher-test/prompt.md', 'do the thing\n');
  plant(dir, 'watcher-test/push-nothing.sh', '#!/bin/sh\nexit 0\n');
  chmodSync(join(dir, 'watcher-test/push-nothing.sh'), 0o755);
  const commits = async () => Number((await runGit(dir, ['rev-list', '--count', 'HEAD'])).stdout.trim());

  const rel = (await libCall(dir, 'hr_task_prompt_rel "$@"', [`${STATE_DIR}/`, 'feat_x'])).stdout.trim();
  assert.equal(rel, `${STATE_DIR}/task_prompts/feat_x_task_prompt.md`);
  const place = [
    'hr_place_artifact "$PWD" watcher-test/prompt.md "$1" || exit 10',
    'hr_commit_placed "$PWD/scripts/commit-on-branch.sh" "$PWD" "$1" "$(hr_task_prompt_subject feat_x)"',
  ].join('; ');

  const before = await commits();
  const first = await libCall(dir, place, [rel]);
  assert.equal(first.status, 0, `the first placement exited ${first.status}: ${first.stderr}`);
  assert.equal(await commits(), before + 1);
  assert.equal((await runGit(dir, ['log', '-1', '--format=%s'])).stdout, 'chore: add task prompt for feat_x\n');
  assert.equal((await runGit(dir, ['show', '--name-only', '--format=', 'HEAD'])).stdout.trim(), rel);

  const again = await libCall(dir, place, [rel]);
  assert.equal(again.status, 3, `an identical re-drop exited ${again.status}: ${again.stderr}`);
  assert.equal(await commits(), before + 1, 'an identical re-drop made a commit');

  const landed = 'hr_push_landed "$1" "$PWD" feat_x';
  const stub = await libCall(dir, landed, [join(dir, 'watcher-test/push-nothing.sh')]);
  assert.equal(stub.status, 1, 'a push wrapper that pushed nothing read as landed');
  const pushed = await libCall(dir, landed, [join(dir, SCRIPTS_DIR, 'push-branch.sh')]);
  assert.equal(pushed.status, 0, `the real push did not land: ${pushed.stdout}${pushed.stderr}`);
  assert.equal(
    (await runGit(dir, ['rev-parse', 'refs/remotes/origin/feat_x'])).stdout,
    (await runGit(dir, ['rev-parse', 'HEAD'])).stdout,
  );
});

test('hr_remote_record_init writes a remote record\'s starting fields, leaves status to its caller and resets the counters', async (t) => {
  const dir = await fixtureFor(t, { files: nodeProjectFiles() });
  await initOk(dir);
  const registry = join(dir, 'registry.json');
  const init = 'hr_remote_record_init "$1" feat_x /tmp/wt /tmp/wt.log task';
  const record = () => JSON.parse(readFileSync(registry, 'utf8')).runs.feat_x;
  const expected = {
    worktree: '/tmp/wt',
    log_path: '/tmp/wt.log',
    engine: 'task',
    execution: 'github-actions',
    pid: '',
    remote_dispatched_at: '',
    stall_warned: '',
    stall_killing: '',
    paused_by: '',
    usage_resume_at: '',
    resume_kind: '',
    stall_restarts: '0',
    park_loop_cycles: '0',
  };

  const first = await libCall(dir, init, [registry]);
  assert.equal(first.status, 0, `hr_remote_record_init exited ${first.status}: ${first.stderr}`);
  for (const [key, value] of Object.entries(expected)) assert.equal(record()[key], value, `\`${key}\` was not written as ${JSON.stringify(value)}`);
  assert.match(record().started_at, /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/, 'started_at is not in the watcher\'s date form');
  assert.ok(!('status' in record()), 'hr_remote_record_init wrote a status');

  const parked = await libCall(dir, 'hr_registry_set "$1" feat_x status parked stall_restarts 2 park_loop_cycles 3', [registry]);
  assert.equal(parked.status, 0, `hr_registry_set exited ${parked.status}: ${parked.stderr}`);
  const again = await libCall(dir, init, [registry]);
  assert.equal(again.status, 0, `the second hr_remote_record_init exited ${again.status}: ${again.stderr}`);
  assert.equal(record().status, 'parked', 'a second call changed status');
  assert.equal(record().stall_restarts, '0', 'a second call did not reset stall_restarts');
  assert.equal(record().park_loop_cycles, '0', 'a second call did not reset park_loop_cycles');
});

/** A slashed branch, so a path built with `${branch%/*}` or a basename would show. */
const REMOTE_BRANCH = 'feat/x';

/** Every path under `<state_dir>` the bundle format names, spelled out as the contract. */
const REMOTE = {
  registry: `${STATE_DIR}/autonomous_logs/registry.json`,
  status: `${STATE_DIR}/autonomous_logs/remote_status.json`,
  superseded: `${STATE_DIR}/autonomous_logs/remote_superseded/`,
  clarify: `${STATE_DIR}/clarifications/${REMOTE_BRANCH}`,
  pause: `${STATE_DIR}/PAUSE_PROGRESS.md`,
  walker: `${STATE_DIR}/.flow_walker_state`,
  log: `${STATE_DIR}/autonomous_logs/${REMOTE_BRANCH}.log`,
};

/** Plant `relativePath` under `dir` with `content`, creating its parents. */
function plant(dir, relativePath, content) {
  mkdirSync(join(dir, relativePath, '..'), { recursive: true });
  writeFileSync(join(dir, relativePath), content);
}

test('the remote state bundle carries a run through a job restore and a mirror restore, and places no run log', async (t) => {
  const source = await fixtureFor(t, { files: nodeProjectFiles() });
  await initOk(source);

  const registry = join(source, REMOTE.registry);
  for (const [key, value] of [['status', 'paused'], ['engine', 'task'], ['pause_reason', 'usage'], ['park_loop_cycles', '2']]) {
    const set = await libCall(source, 'hr_registry_set "$@"', [registry, REMOTE_BRANCH, key, value]);
    assert.equal(set.status, 0, `hr_registry_set ${key} exited ${set.status}: ${set.stderr}`);
  }
  plant(source, `${REMOTE.clarify}/question_1.md`, 'q1\n');
  plant(source, `${REMOTE.clarify}/answer_1.md`, 'a1\n');
  plant(source, `${REMOTE.clarify}/answered/question_0.md`, 'q0\n');
  plant(source, REMOTE.pause, 'pause note\n');
  plant(source, REMOTE.walker, 'step=3\n');
  plant(source, REMOTE.log, 'run log\n');

  const provenance = {
    GITHUB_RUN_ID: '42',
    GITHUB_SERVER_URL: 'https://github.example',
    GITHUB_REPOSITORY: 'owner/repo',
    HARNESS_INPUT_CHAIN: '3',
  };
  const writeStatus = () =>
    libCall(source, 'hr_remote_status_write "$@"', [registry, REMOTE_BRANCH, join(source, REMOTE.status), 'continue', 'one\nline'], provenance);

  const first = await writeStatus();
  assert.equal(first.status, 0, `hr_remote_status_write exited ${first.status}: ${first.stderr}`);
  assert.equal(first.stdout, '', 'hr_remote_status_write echoed a value to stdout');
  const firstInode = statSync(join(source, REMOTE.status)).ino;
  const second = await writeStatus();
  assert.equal(second.status, 0, `the second hr_remote_status_write exited ${second.status}: ${second.stderr}`);
  // A rename installs a new inode; an in-place rewrite would keep the old one, and a reader could see it half-written.
  assert.notEqual(statSync(join(source, REMOTE.status)).ino, firstInode, 'status.json was rewritten in place, not replaced by rename');
  assert.deepEqual(
    readdirSync(join(source, REMOTE.status, '..')).filter((name) => name.includes('.tmp.')),
    [],
    'hr_remote_status_write left a temp file beside status.json',
  );

  const status = JSON.parse(text(source, REMOTE.status));
  assert.equal(status.schema, '1');
  assert.equal(status.branch, REMOTE_BRANCH);
  assert.equal(status.status, 'paused');
  assert.equal(status.pause_reason, 'usage');
  assert.equal(status.park_loop_cycles, '2');
  assert.equal(status.chain, '3', '`chain` is not the job\'s own HARNESS_INPUT_CHAIN');
  assert.equal(status.run_id, '42');
  assert.equal(status.run_url, 'https://github.example/owner/repo/actions/runs/42');
  assert.equal(status.detail, 'one line', '`detail` is not one line');
  for (const [key, value] of Object.entries(status)) assert.equal(typeof value, 'string', `status.json key ${key} is not a string`);

  const decision = await libCall(source, 'hr_remote_status_get "$@"', [join(source, REMOTE.status), 'decision']);
  assert.equal(decision.status, 0, `hr_remote_status_get exited ${decision.status}: ${decision.stderr}`);
  assert.equal(decision.stdout, 'continue\n');
  const absent = await libCall(source, 'hr_remote_status_get "$@"', [join(source, REMOTE.status), 'no_such_key']);
  assert.equal(absent.status, 1, `hr_remote_status_get exited ${absent.status} for an absent key`);

  const bundle = join(source, 'bundle-out');
  const written = await libCall(source, 'hr_remote_bundle_write "$@"', [source, REMOTE_BRANCH, registry, bundle]);
  assert.equal(written.status, 0, `hr_remote_bundle_write exited ${written.status}: ${written.stderr}`);
  assert.deepEqual(
    Object.keys(await snapshotTree(bundle)),
    [
      'PAUSE_PROGRESS.md',
      'clarifications',
      'clarifications/feat',
      'clarifications/feat/x',
      'clarifications/feat/x/answer_1.md',
      'clarifications/feat/x/answered',
      'clarifications/feat/x/answered/question_0.md',
      'clarifications/feat/x/question_1.md',
      'flow_walker_state',
      'run.log',
      'status.json',
    ],
    'the bundle does not hold exactly the format of record',
  );
  assert.equal(readFileSync(join(bundle, 'status.json'), 'utf8'), text(source, REMOTE.status), 'the bundle did not carry the job\'s own status');

  const job = await fixtureFor(t, { files: nodeProjectFiles() });
  await initOk(job);
  const intoJob = await libCall(job, 'hr_remote_bundle_restore "$@"', [bundle, job, REMOTE_BRANCH, 'job']);
  assert.equal(intoJob.status, 0, `the job restore exited ${intoJob.status}: ${intoJob.stderr}`);
  assert.equal(text(job, `${REMOTE.clarify}/answer_1.md`), 'a1\n');
  assert.equal(text(job, `${REMOTE.clarify}/answered/question_0.md`), 'q0\n');
  assert.equal(text(job, REMOTE.pause), 'pause note\n');
  assert.equal(text(job, REMOTE.walker), 'step=3\n', 'the job restore did not put the walker state back under its dotted name');
  assert.equal(text(job, REMOTE.status), text(source, REMOTE.status), 'the job restore did not place status.json');
  const jobTree = Object.keys(await snapshotTree(job));
  assert.deepEqual(jobTree.filter((key) => key.endsWith('.log')), [], 'the job restore placed the run log');

  const mirror = await fixtureFor(t, { files: nodeProjectFiles() });
  await initOk(mirror);
  plant(mirror, `${REMOTE.clarify}/answer_9.md`, 'stale\n');
  const intoMirror = await libCall(mirror, 'hr_remote_bundle_restore "$@"', [bundle, mirror, REMOTE_BRANCH, 'mirror']);
  assert.equal(intoMirror.status, 0, `the mirror restore exited ${intoMirror.status}: ${intoMirror.stderr}`);
  assert.equal(text(mirror, `${REMOTE.clarify}/question_1.md`), 'q1\n');
  assert.equal(text(mirror, REMOTE.pause), 'pause note\n');
  const mirrorTree = Object.keys(await snapshotTree(mirror));
  assert.ok(!mirrorTree.includes(`${REMOTE.clarify}/answer_9.md`), 'a stale answer survived the mirror restore');
  assert.equal(
    mirrorTree.filter((key) => key.startsWith(REMOTE.superseded) && key.endsWith('/answer_9.md')).length,
    1,
    'the stale answer was not moved aside under remote_superseded/',
  );
  assert.ok(!mirrorTree.includes(REMOTE.walker), 'the mirror restore placed the walker state');
  assert.ok(!mirrorTree.includes(REMOTE.status), 'the mirror restore placed status.json');
  assert.deepEqual(mirrorTree.filter((key) => key.endsWith('.log')), [], 'the mirror restore placed the run log');
});

test('the remote state bundle carries the planning drafts, and a job restore places them only where nothing exists', async (t) => {
  // A draft never overwrites the checkout's copy, never reaches a mirror, and never lands outside the planning paths.
  const source = await fixtureFor(t, { files: nodeProjectFiles() });
  await initOk(source);
  const registry = join(source, REMOTE.registry);
  const set = await libCall(source, 'hr_registry_set "$@"', [registry, REMOTE_BRANCH, 'status', 'paused']);
  assert.equal(set.status, 0, `hr_registry_set exited ${set.status}: ${set.stderr}`);

  const drafts = {
    [`story_plans/${REMOTE_BRANCH}_story_plan.md`]: 'draft index\n',
    [`task_plans/${REMOTE_BRANCH}/task_1_plan.md`]: 'task 1\n',
    [`task_plan_reviews/${REMOTE_BRANCH}/review_0.md`]: 'review 0\n',
  };
  for (const [path, content] of Object.entries(drafts)) plant(source, `${STATE_DIR}/${path}`, content);

  const bundle = join(source, 'bundle-out');
  const written = await libCall(source, 'hr_remote_bundle_write "$@"', [source, REMOTE_BRANCH, registry, bundle]);
  assert.equal(written.status, 0, `hr_remote_bundle_write exited ${written.status}: ${written.stderr}`);
  const bundleTree = await snapshotTree(bundle);
  const bundleFiles = Object.keys(bundleTree).filter((key) => statSync(join(bundle, key)).isFile());
  assert.deepEqual(
    bundleFiles.filter((key) => key.startsWith('planning/')),
    Object.keys(drafts).map((path) => `planning/${path}`).sort(),
    'the bundle does not carry exactly the planted drafts under planning/',
  );
  assert.deepEqual(
    bundleFiles.filter((key) => !key.startsWith('planning/')),
    ['status.json'],
    'the planning drafts changed the bundle\'s top-level entries',
  );

  const job = await fixtureFor(t, { files: nodeProjectFiles() });
  await initOk(job);
  const committed = `${STATE_DIR}/story_plans/${REMOTE_BRANCH}_story_plan.md`;
  plant(job, committed, 'committed index\n');
  const intoJob = await libCall(
    job,
    'hr_remote_bundle_restore "$@" || exit $?; printf "%s %s\\n" "$HR_REMOTE_PLANNING_PLACED" "$HR_REMOTE_PLANNING_KEPT"',
    [bundle, job, REMOTE_BRANCH, 'job'],
  );
  assert.equal(intoJob.status, 0, `the job restore exited ${intoJob.status}: ${intoJob.stderr}`);
  assert.equal(text(job, `${STATE_DIR}/task_plans/${REMOTE_BRANCH}/task_1_plan.md`), 'task 1\n');
  assert.equal(text(job, `${STATE_DIR}/task_plan_reviews/${REMOTE_BRANCH}/review_0.md`), 'review 0\n');
  assert.equal(text(job, committed), 'committed index\n', 'the job restore overwrote the checkout\'s committed story index');
  assert.equal(intoJob.stdout, '2 1\n', 'HR_REMOTE_PLANNING_PLACED / HR_REMOTE_PLANNING_KEPT are not 2 / 1');

  const mirror = await fixtureFor(t, { files: nodeProjectFiles() });
  await initOk(mirror);
  const beforeMirror = await snapshotTree(mirror);
  const intoMirror = await libCall(
    mirror,
    'hr_remote_bundle_restore "$@" || exit $?; printf "%s %s\\n" "$HR_REMOTE_PLANNING_PLACED" "$HR_REMOTE_PLANNING_KEPT"',
    [bundle, mirror, REMOTE_BRANCH, 'mirror'],
  );
  assert.equal(intoMirror.status, 0, `the mirror restore exited ${intoMirror.status}: ${intoMirror.stderr}`);
  assert.equal(intoMirror.stdout, '0 0\n', 'the mirror restore counted a planning draft');
  const mirrorNew = Object.keys(await snapshotTree(mirror)).filter((key) => !(key in beforeMirror));
  for (const path of Object.keys(drafts)) {
    assert.ok(!mirrorNew.includes(`${STATE_DIR}/${path}`), `the mirror restore placed ${path}`);
  }

  // A `..` segment cannot be created as a file name, so the escape is attempted through a symlink instead.
  plant(source, `bundle-out/planning/story_plans/other_story_plan.md`, 'outside the set\n');
  mkdirSync(join(bundle, 'planning', 'task_plans', REMOTE_BRANCH), { recursive: true });
  plant(source, 'outside-target.md', 'escaped\n');
  symlinkSync(join(source, 'outside-target.md'), join(bundle, 'planning', 'task_plans', REMOTE_BRANCH, 'linked.md'));
  const hostile = await fixtureFor(t, { files: nodeProjectFiles() });
  await initOk(hostile);
  const intoHostile = await libCall(
    hostile,
    'hr_remote_bundle_restore "$@" || exit $?; printf "%s %s\\n" "$HR_REMOTE_PLANNING_PLACED" "$HR_REMOTE_PLANNING_KEPT"',
    [bundle, hostile, REMOTE_BRANCH, 'job'],
  );
  assert.equal(intoHostile.status, 0, `the hostile restore exited ${intoHostile.status}: ${intoHostile.stderr}`);
  const hostileTree = Object.keys(await snapshotTree(hostile));
  assert.ok(!hostileTree.some((key) => key.endsWith('other_story_plan.md')), 'a file outside the planning set was placed');
  assert.ok(!hostileTree.some((key) => key.endsWith('linked.md')), 'a symlinked bundle entry was placed');
  assert.equal(intoHostile.stdout, '3 0\n', 'the hostile entries were counted');
});

test('a bundle whose status.json carries an unrecognised schema restores nothing and exits 2', async (t) => {
  const bundle = await fixtureFor(t, {
    git: false,
    files: {
      'status.json': { schema: '9', branch: REMOTE_BRANCH },
      'PAUSE_PROGRESS.md': 'pause note\n',
      'flow_walker_state': 'step=3\n',
      [`clarifications/${REMOTE_BRANCH}/answer_1.md`]: 'a1\n',
    },
  });
  const target = await fixtureFor(t, { files: nodeProjectFiles() });
  await initOk(target);
  plant(target, `${REMOTE.clarify}/answer_9.md`, 'local\n');

  const before = await snapshotTree(target);
  const restored = await libCall(target, 'hr_remote_bundle_restore "$@"', [bundle, target, REMOTE_BRANCH, 'job']);
  assert.equal(restored.status, 2, `the restore exited ${restored.status} for an unrecognised schema: ${restored.stderr}`);
  assert.deepEqual(await snapshotTree(target), before, 'a restore of an unrecognised bundle changed the tree');
});

test('a second init leaves an edited outer-loop script exactly as the adopter left it', async (t) => {
  const dir = await fixtureFor(t, { files: nodeProjectFiles() });

  await initOk(dir);
  appendFileSync(join(dir, LIB_PATH), '\n# This line was added by hand.\n', 'utf8');
  const before = await snapshotTree(dir);

  await initOk(dir);

  assert.deepEqual(await snapshotTree(dir), before, 'a re-run rewrote a script the adopter had edited');
  assert.match(text(dir, LIB_PATH), /# This line was added by hand\./);
});

test('--force regenerates an edited outer-loop script only after leaving its content in a .bak', async (t) => {
  const dir = await fixtureFor(t, { files: nodeProjectFiles() });

  await initOk(dir);
  appendFileSync(join(dir, LIB_PATH), '\n# This line was added by hand.\n', 'utf8');
  const edited = text(dir, LIB_PATH);

  await initOk(dir, ['--force']);

  assert.equal(text(dir, `${LIB_PATH}.bak`), edited, `--force did not preserve the previous ${LIB_FILE} in a .bak`);
  assert.equal(text(dir, LIB_PATH), readFileSync(LIB_TEMPLATE, 'utf8'), `--force did not regenerate ${LIB_PATH}`);
});

test('a configured scriptsDir is where the outer-loop scripts land, and the only place', async (t) => {
  const dir = await fixtureFor(t, {
    files: { ...nodeProjectFiles(), 'harness.config.json': seededConfig({ scriptsDir: RELOCATED_SCRIPTS_DIR }) },
  });

  await initOk(dir);

  const relocated = `${RELOCATED_SCRIPTS_DIR}/${LIB_SUBDIR}/${LIB_FILE}`;
  assert.equal(text(dir, relocated), readFileSync(LIB_TEMPLATE, 'utf8'), `${relocated} is not the template's bytes`);
  assert.deepEqual(
    copiesOf(await snapshotTree(dir), LIB_FILE),
    [relocated],
    `${LIB_FILE} was written somewhere other than the configured scriptsDir`,
  );
});

test('--dry-run writes no outer-loop script and says it would have', async (t) => {
  const dir = await fixtureFor(t, { files: nodeProjectFiles() });
  const before = await snapshotTree(dir);

  const { stdout } = await initOk(dir, ['--dry-run']);

  assert.deepEqual(await snapshotTree(dir), before, '--dry-run wrote to the repository');
  for (const path of [LIB_PATH, SCRATCH_PATH]) {
    assert.match(stdout, new RegExp(`^\\+ would create\\s+${path.replace(/[.]/g, '\\.')}$`, 'm'));
  }
});

test('the scratch runner is written directly in scriptsDir, executable, and a re-run leaves it as it is', async (t) => {
  const dir = await fixtureFor(t, { files: nodeProjectFiles() });

  await initOk(dir);

  // Found by basename over the whole tree rather than read at a path spelled here, so this is
  // "written there and nowhere else" — the assertion the relocated-scriptsDir case above makes.
  const first = await snapshotTree(dir);
  assert.deepEqual(copiesOf(first, SCRATCH_FILE), [SCRATCH_PATH], `${SCRATCH_FILE} was not written into ${SCRIPTS_DIR}/`);

  // Executable, because an agent is dispatched to run this one — the row's `agentInvocable: true`
  // and this bit are the two halves of that, and neither implies the other.
  const mode = (await lstat(join(dir, SCRATCH_PATH))).mode & 0o777;
  assert.equal(mode, SCRATCH_MODE, `${SCRATCH_PATH} is mode ${mode.toString(8)}, not ${SCRATCH_MODE.toString(8)}`);

  await initOk(dir);

  assert.equal((await snapshotTree(dir))[SCRATCH_PATH], first[SCRATCH_PATH], 'a second init rewrote the scratch runner');
});

/**
 * The flow walker and the two files it reads from its own directory, as paths under `scriptsDir`
 * with the mode each must land with: the walker is run, the gate library is sourced and the graph
 * is data.
 */
const WALKER_FILES = [
  ['flow-walker.sh', 0o755],
  ['lib/flow-walker-gates.sh', 0o644],
  ['flows/task_plan_writing.graph.json', 0o644],
];

test('the flow walker, its gate library and its graph land verbatim under scriptsDir, and a re-run keeps them', async (t) => {
  for (const [name, scriptsDir, config] of [
    ['the default scriptsDir', SCRIPTS_DIR, undefined],
    ['a relocated scriptsDir', RELOCATED_SCRIPTS_DIR, seededConfig({ scriptsDir: RELOCATED_SCRIPTS_DIR })],
  ]) {
    await t.test(name, async (subtest) => {
      const files = config === undefined ? nodeProjectFiles() : { ...nodeProjectFiles(), 'harness.config.json': config };
      const dir = await fixtureFor(subtest, { files });

      await initOk(dir);
      const first = await snapshotTree(dir);

      for (const [relative, expectedMode] of WALKER_FILES) {
        const path = `${scriptsDir}/${relative}`;
        const template = readFileSync(join(PACKAGE_ROOT, 'templates', SCRIPTS_DIR, ...relative.split('/')), 'utf8');
        assert.equal(text(dir, path), template, `${path} is not the template's bytes`);
        assert.deepEqual(
          copiesOf(first, relative.split('/').pop()),
          [path],
          `${relative} was written somewhere other than ${scriptsDir}/`,
        );
        const mode = (await lstat(join(dir, path))).mode & 0o777;
        assert.equal(mode, expectedMode, `${path} is mode ${mode.toString(8)}, not ${expectedMode.toString(8)}`);
      }

      await initOk(dir);

      const second = await snapshotTree(dir);
      for (const [relative] of WALKER_FILES) {
        const path = `${scriptsDir}/${relative}`;
        assert.equal(second[path], first[path], `a second init rewrote ${path}`);
      }
    });
  }
});

/** The Run gates phase's test-suite runner: run by the orchestrating session, so executable. */
const TEST_SUITE_RUNNER = 'run-test-suite.sh';
const TEST_SUITE_RUNNER_MODE = 0o755;

test('the test-suite runner lands verbatim under scriptsDir, and a re-run keeps it', async (t) => {
  for (const [name, scriptsDir, config] of [
    ['the default scriptsDir', SCRIPTS_DIR, undefined],
    ['a relocated scriptsDir', RELOCATED_SCRIPTS_DIR, seededConfig({ scriptsDir: RELOCATED_SCRIPTS_DIR })],
  ]) {
    await t.test(name, async (subtest) => {
      const files = config === undefined ? nodeProjectFiles() : { ...nodeProjectFiles(), 'harness.config.json': config };
      const dir = await fixtureFor(subtest, { files });
      const path = `${scriptsDir}/${TEST_SUITE_RUNNER}`;

      await initOk(dir);
      const first = await snapshotTree(dir);

      const template = readFileSync(join(PACKAGE_ROOT, 'templates', SCRIPTS_DIR, TEST_SUITE_RUNNER), 'utf8');
      assert.equal(text(dir, path), template, `${path} is not the template's bytes`);
      assert.deepEqual(copiesOf(first, TEST_SUITE_RUNNER), [path], `${TEST_SUITE_RUNNER} was written somewhere other than ${scriptsDir}/`);
      const mode = (await lstat(join(dir, path))).mode & 0o777;
      assert.equal(mode, TEST_SUITE_RUNNER_MODE, `${path} is mode ${mode.toString(8)}, not ${TEST_SUITE_RUNNER_MODE.toString(8)}`);

      await initOk(dir);

      assert.equal((await snapshotTree(dir))[path], first[path], `a second init rewrote ${path}`);
    });
  }
});

/**
 * A wired repository holding the paths the refusal cases below need to **exist**: a file in another
 * state directory, a sibling directory whose name is a prefix of `scratch`, a file inside the
 * scratch directory whose extension the interpreter table does not carry, and the two symlinks the
 * script's physical-resolution branches exist for.
 *
 * Each one exists on purpose. The runner tests containment before it tests presence, so a case
 * driven against a path that is simply not there would be refused either way — and would go on
 * passing against a runner that had stopped fencing the directory at all.
 */
async function scratchFixture(t) {
  const dir = await fixtureFor(t, { files: nodeProjectFiles() });
  await initOk(dir);

  mkdirSync(join(dir, STATE_DIR, 'scratchy'), { recursive: true });
  writeFileSync(join(dir, STATE_DIR, 'scratchy', 'x.py'), 'print("ran")\n', 'utf8');
  writeFileSync(join(dir, STATE_DIR, 'story_plans', 'x.py'), 'print("ran")\n', 'utf8');
  writeFileSync(join(dir, SCRATCH_DIR, 'x.pl'), 'print "ran";\n', 'utf8');
  // A shell script inside the scratch directory: `.sh` is the extension the table drops on purpose,
  // so it is refused by the same branch as `.pl` rather than run under `bash`. Planted so the case
  // below is a table decision and not the absent-file one.
  writeFileSync(join(dir, SCRATCH_DIR, 'x.sh'), 'echo ran\n', 'utf8');

  // A file inside the scratch directory that points out of it: the branch `[ -L "$target" ]` exists
  // for. Planted rather than described, because a target that is not there is refused either way.
  symlinkSync(join(dir, 'harness.config.json'), join(dir, SCRATCH_DIR, 'link.py'));
  // A directory inside it that points out of it: the branch `pwd -P` on both sides exists for, and
  // the file beneath it is real, so a refusal cannot be the absent-file one wearing another name.
  symlinkSync(join(dir, STATE_DIR, 'story_plans'), join(dir, SCRATCH_DIR, 'elsewhere'));
  writeFileSync(join(dir, STATE_DIR, 'story_plans', 'y.py'), 'print("ran")\n', 'utf8');
  return dir;
}

/** Run the written scratch runner with the caller's own arguments. */
function runScratch(dir, args) {
  return runBash(dir, [join(dir, SCRATCH_PATH), ...args]);
}

/**
 * Exit 68 is the runner's "the run-time context could not be established", which a machine without
 * `jq` answers with for every case here. Distinguished first, wherever a case reads a status, or an
 * unwired machine reads as a runner that refuses and runs exactly as it should.
 */
function assertContextEstablished(status, stderr) {
  assert.notEqual(
    status,
    68,
    `the runner could not resolve its own context — \`jq\` 1.5+ must be on PATH for this gate:\n${stderr}`,
  );
}

/**
 * Every path the runner must refuse, with the substring its message has to carry: the reason, never
 * a helper name. The path test is the shared library's `hr_scratch_path_var`, and the refusal contract
 * still names no helper: one `scratch-run.sh: <reason>` line on stderr followed by a non-zero exit.
 */
const REFUSED = [
  ['a path in another state directory', [`${STATE_DIR}/story_plans/x.py`], /outside/],
  ['a path outside the repository altogether', ['/tmp/x.py'], /outside/],
  ['a path reaching out through ..', [`${SCRATCH_DIR}/../../x.py`], /'\.\.'/],
  ['a sibling whose name is only a prefix of the scratch directory', [`${STATE_DIR}/scratchy/x.py`], /outside/],
  ['a file inside the scratch directory that is a symlink', [`${SCRATCH_DIR}/link.py`], /is a symlink/],
  ['a symlinked directory inside it, resolved physically', [`${SCRATCH_DIR}/elsewhere/y.py`], /outside/],
  ['an argument carrying a character outside the class', [`${SCRATCH_DIR}/$x.py`], /outside A-Za-z0-9/],
  ['an extension the interpreter table does not carry', [`${SCRATCH_DIR}/x.pl`], /no interpreter for extension/],
  ['a shell script, the extension the table omits on purpose', [`${SCRATCH_DIR}/x.sh`], /no interpreter for extension/],
  ['no argument at all', [], /no file argument/],
  ['the scratch directory itself', [`${SCRATCH_DIR}/.`], /scratch directory itself/],
];

test('the scratch runner refuses every path that is not a file inside the scratch directory', async (t) => {
  const dir = await scratchFixture(t);

  for (const [name, args, reason] of REFUSED) {
    await t.test(name, async () => {
      const { status, stdout, stderr } = await runScratch(dir, args);

      assertContextEstablished(status, stderr);
      assert.notEqual(status, 0, `${args.join(' ') || '<no argument>'} was accepted:\n${stdout}`);
      assert.match(stderr, /^scratch-run\.sh: /m, `the refusal is not one \`scratch-run.sh: …\` line:\n${stderr}`);
      assert.match(stderr, reason, `the refusal does not say what was refused:\n${stderr}`);
      // Nothing on stdout, because the file's own output is the only thing that ever appears there —
      // so an empty stdout is the evidence that nothing was executed.
      assert.equal(stdout, '', `something ran before the refusal:\n${stdout}`);
    });
  }
});

/** Where a name resolves to on this machine's `PATH`, and whether it resolves at all. */
function onPath(name) {
  for (const entry of (process.env.PATH ?? '').split(delimiter)) {
    if (entry === '') continue;
    try {
      accessSync(join(entry, name), fsConstants.X_OK);
      return true;
    } catch {
      // Not here; keep looking.
    }
  }
  return false;
}

/**
 * One probe per interpreter these cases cover, each printing its first argument and exiting 7.
 *
 * The status is 7 rather than 0 because 0 is what a runner that swallowed the file's status would
 * also return, and the argument is echoed because a runner that dropped it would still exit 7.
 */
const PROBES = [
  ['probe.py', 'python3', 'import sys\nprint(sys.argv[1])\nsys.exit(7)\n'],
  ['probe.js', 'node', 'console.log(process.argv[2]);\nprocess.exit(7);\n'],
  ['probe.mjs', 'node', 'console.log(process.argv[2]);\nprocess.exit(7);\n'],
  ['probe.dart', 'dart', "import 'dart:io';\nvoid main(List<String> a) {\n  print(a[0]);\n  exit(7);\n}\n"],
  ['probe.php', 'php', '<?php\necho $argv[1], "\\n";\nexit(7);\n'],
];

/** The argument a probe has to receive, distinctive enough that nothing else could have printed it. */
const PROBE_ARG = 'forwarded-argument';

test("the scratch runner runs a file in its extension's interpreter, forwards the rest and returns its status", async (t) => {
  const dir = await scratchFixture(t);

  for (const [file, interpreter, body] of PROBES) {
    await t.test(`${file} under ${interpreter}`, async (subtest) => {
      // Skipped rather than failed: the table is a fixed set and no machine is required to hold
      // every interpreter in it, so a host without python3, dart or php must not turn this suite red.
      if (!onPath(interpreter)) {
        subtest.skip(`${interpreter} is not on PATH on this machine, so ${file} cannot be driven here`);
        return;
      }

      writeFileSync(join(dir, SCRATCH_DIR, file), body, 'utf8');
      const { status, stdout, stderr } = await runScratch(dir, [`${SCRATCH_DIR}/${file}`, PROBE_ARG]);

      assertContextEstablished(status, stderr);
      assert.equal(status, 7, `the file's own exit status did not come back:\n${stderr}`);
      assert.equal(stdout.trim(), PROBE_ARG, `the trailing argument did not reach ${file}:\n${stdout}`);
    });
  }
});

/**
 * The `PATH` policy, driven with an inherited environment the case states.
 *
 * The first two cases are the two halves F59 requires to hold AT ONCE, and neither implies the
 * other. The shims-first case asserts PRECEDENCE: a `$HOME`-rooted version-manager shims directory
 * the caller put first is still first, which is the whole of the fix — under an unconditional
 * prepend of the fallback list the printed first entry is `/opt/homebrew/bin` and the case cannot
 * hold. The bare-`PATH` case asserts REACHABILITY, which is what the prepend existed for: a
 * service-manager unit with no environment key runs on `/usr/bin:/bin:/usr/sbin:/sbin` alone, and
 * `jq`, a Homebrew toolchain and an agent CLI under `~/.local/bin` are in none of those four, so
 * appending REACHES each just as prepending did; what it does not do is prefer a Homebrew copy over
 * a `/usr/bin` name that also exists, and no case here asserts that it does.
 * The edge cases below them pin the empty
 * `PATH`, empty `HOME` and idempotence behaviour the function's own header states.
 */
test('the PATH policy keeps an inherited shims directory first and still reaches the fallbacks', async (t) => {
  const dir = await fixtureFor(t, { files: nodeProjectFiles() });
  await initOk(dir);

  // Named from the fixture, never from the machine this runs on.
  const home = join(dir, 'home');
  const localBin = `${home}/.local/bin`;

  await t.test('a shims-first inherited PATH keeps its order, and the absent fallbacks are appended', async () => {
    const shims = `${home}/.rbenv/shims`;
    const inherited = [shims, '/usr/bin', '/bin', '/usr/sbin', '/sbin'];
    const entries = pathEntries(await pathWithFallbacks(dir, { PATH: inherited.join(':'), HOME: home }));

    assert.equal(entries[0], shims, `the inherited shims directory is no longer first: ${entries.join(':')}`);
    assert.deepEqual(entries.slice(0, inherited.length), inherited, 'the inherited entries were reordered');
    assert.equal(entries.filter((entry) => entry === '/usr/bin').length, 1, '/usr/bin was re-added');
    assert.ok(entries.indexOf('/usr/bin') > 0, '/usr/bin was promoted ahead of the shims directory');
    for (const added of [...ABSENT_FALLBACKS, localBin]) {
      assert.ok(
        entries.indexOf(added) >= inherited.length,
        `${added} was inserted among the inherited entries rather than appended: ${entries.join(':')}`,
      );
    }
  });

  await t.test('a bare service-manager PATH gains the fallbacks it lacks, after what it inherited', async () => {
    const inherited = ['/usr/bin', '/bin', '/usr/sbin', '/sbin'];
    const entries = pathEntries(await pathWithFallbacks(dir, { PATH: inherited.join(':'), HOME: home }));

    // Presence, not position: none of these three is in `/usr/bin`, so each is still resolved
    // through the appended directory.
    for (const added of [...ABSENT_FALLBACKS, localBin]) {
      assert.ok(entries.includes(added), `${added} is unreachable from a bare PATH: ${entries.join(':')}`);
    }
    assert.deepEqual(entries.slice(0, inherited.length), inherited, 'the inherited entries were reordered');
    assert.equal(entries.filter((entry) => entry === '/usr/bin').length, 1, '/usr/bin was re-added');
  });

  await t.test('an empty inherited PATH yields the fallback list alone, with no empty entry', async () => {
    const printed = (await pathWithFallbacks(dir, { PATH: '', HOME: home })).trim();

    assert.ok(!printed.startsWith(':'), `the result has a leading empty entry: ${printed}`);
    assert.ok(!printed.endsWith(':'), `the result has a trailing empty entry: ${printed}`);
    assert.ok(!printed.includes('::'), `the result has a doubled colon: ${printed}`);
    assert.deepEqual(pathEntries(printed), [...ABSENT_FALLBACKS, '/usr/bin', '/bin', '/usr/sbin', '/sbin', localBin]);
  });

  await t.test('an empty HOME skips the .local/bin entry rather than rendering a bare one', async () => {
    const entries = pathEntries(await pathWithFallbacks(dir, { PATH: '/usr/bin:/bin', HOME: '' }));

    for (const entry of entries) {
      assert.notEqual(entry, '/.local/bin', 'an empty HOME was rendered as a bare /.local/bin');
      assert.ok(!entry.endsWith('/.local/bin'), `a .local/bin entry appeared with no HOME to root it: ${entry}`);
    }
  });

  await t.test('the policy is idempotent: its own result fed back in is unchanged', async () => {
    const env = { PATH: `${home}/.rbenv/shims:/usr/bin:/bin:/usr/sbin:/sbin`, HOME: home };
    const first = (await pathWithFallbacks(dir, env)).trim();
    const second = (await pathWithFallbacks(dir, { PATH: first, HOME: home })).trim();

    assert.equal(second, first, 'a second pass changed the value');
  });
});

/** The written watcher, which the cases below drive rather than read. */
const WATCHER_FILE = 'autonomous-watcher.sh';
const WATCHER_PATH = `${SCRIPTS_DIR}/${WATCHER_FILE}`;

/**
 * The fixed fallback directories the library appends — `$HOME/.local/bin` excluded, because every
 * case below points `HOME` at its fixture and nothing is installed under it.
 */
const FALLBACK_DIRS = ['/opt/homebrew/bin', '/usr/local/bin', '/usr/bin', '/bin', '/usr/sbin', '/sbin'];

/**
 * `bash`, resolved ONCE in this process's own unscrubbed environment.
 *
 * A case below hands the watcher an EMPTY `PATH`. A child's executable is resolved by name against
 * the CHILD's `PATH`, so a bare `bash` there fails to spawn and the case would measure the spawn
 * instead of the bootstrap. Empty when nothing answered, which the cases skip on.
 */
const BASH = (() => {
  try {
    return execFileSync('/bin/sh', ['-c', 'command -v bash'], { encoding: 'utf8' }).trim();
  } catch {
    return '';
  }
})();

/** Whether a name is executable in one of the fallback directories, ignoring this machine's `PATH`. */
function inFallbackDirs(name) {
  return FALLBACK_DIRS.some((entry) => {
    try {
      accessSync(join(entry, name), fsConstants.X_OK);
      return true;
    } catch {
      return false;
    }
  });
}

/**
 * Run the WRITTEN watcher's `status` verb in an environment the case states completely.
 *
 * Nothing of `process.env` is carried in, because the subject is what the watcher does with what it
 * inherits. `HOME` is a fixture path and `GIT_CONFIG_NOSYSTEM` closes the system scope, which is the
 * whole of the git-configuration isolation these cases need — the per-user file is already out of
 * reach once `HOME` is the fixture.
 */
function runWatcher(dir, env) {
  return new Promise((settle, reject) => {
    const options = { cwd: dir, encoding: 'utf8', env: { GIT_CONFIG_NOSYSTEM: '1', ...env } };
    execFile(BASH, [join(dir, WATCHER_PATH), 'status'], options, (error, out, err) => {
      if (error !== null && typeof error.code !== 'number') reject(error);
      else settle({ status: error === null ? 0 : error.code, stdout: out, stderr: err });
    });
  });
}

/**
 * The shipped watcher, DRIVEN — the two halves F59 requires to hold AT ONCE, and the one behaviour
 * this branch changes.
 *
 * The first case is the wiring rather than the copy: which line comes first is what makes the rest
 * possible, and a re-order that left both lines present would pass a `includes` pair.
 *
 * The second and third are the halves. The bare-environment case is REACHABILITY — the daemon whose
 * unit renders no `PATH` key at all — and it is what the prepend existed for; the decoy-`git` case
 * is PRECEDENCE, and it is the behaviour `docs/outer-loop-verification.md` §2.4 records as
 * impossible ("the watcher prepends … and the real `git` wins"). Appending is what makes the fixture
 * directory keep position 1 whatever else the machine's `PATH` holds, so that case needs no probe
 * for `/opt/homebrew/bin` and no assumption about it.
 *
 * NONE OF THIS STANDS IN FOR THE SHIPPED-FIXTURE SWEEP. `run-as-daemon.sh preset-ruby` drives a real
 * service manager against fixtures outside this repository; it is a supervised gate beyond this
 * suite's reach, and these cases claim nothing about it.
 */
test('the written watcher starts on a bare environment and lets the caller keep the front of PATH', async (t) => {
  const dir = await fixtureFor(t, { files: nodeProjectFiles() });
  await initOk(dir);

  const home = join(dir, 'home');
  const decoyDir = join(dir, 'decoy-bin');

  await t.test('it sources the library before it settles PATH, and names no fallback itself', () => {
    const watcher = text(dir, WATCHER_PATH);

    assert.ok(!watcher.includes('/opt/homebrew/bin'), 'the watcher still spells a fallback directory itself');
    assert.ok(watcher.includes('hr_path_with_fallbacks'), 'the watcher does not call the shared PATH policy');

    const sourced = watcher.indexOf('. "$hr_lib"');
    const settled = watcher.indexOf('PATH="$(hr_path_with_fallbacks)"');
    assert.notEqual(sourced, -1, `the watcher does not source ${LIB_FILE}`);
    assert.notEqual(settled, -1, 'the watcher does not assign PATH from the policy');
    assert.ok(sourced < settled, 'the library is sourced AFTER PATH is settled, so the call cannot resolve');
  });

  await t.test('an empty inherited PATH still reaches the tools the run needs', async (subtest) => {
    // Skipped rather than failed, in this file's own idiom: the case asserts that the FALLBACKS are
    // what rescued the run, so a machine holding neither tool there cannot measure it.
    for (const tool of ['git', 'jq']) {
      if (!inFallbackDirs(tool)) {
        subtest.skip(`${tool} is not in the fallback directories on this machine, so ${WATCHER_FILE} cannot be driven here`);
        return;
      }
    }
    if (BASH === '') {
      subtest.skip(`bash did not resolve in this process, so ${WATCHER_FILE} cannot be driven here`);
      return;
    }

    const { status, stdout, stderr } = await runWatcher(dir, { PATH: '', HOME: home });

    assert.equal(status, 0, `the watcher refused to start on an empty PATH:\n${stderr}`);
    assert.match(stdout, /^tunables: MAX_PARALLEL_RUNS=/m, `the watcher printed no tunables:\n${stdout}`);
  });

  await t.test('a decoy git the caller put first on PATH is the one that runs', async (subtest) => {
    if (BASH === '') {
      subtest.skip(`bash did not resolve in this process, so ${WATCHER_FILE} cannot be driven here`);
      return;
    }

    // Inside the fixture, never on the machine's real PATH. It answers nothing useful, so the
    // repository-root resolution fails and the watcher's own refusal is the evidence it ran.
    mkdirSync(decoyDir, { recursive: true });
    writeFileSync(join(decoyDir, 'git'), '#!/bin/sh\nexit 1\n', { encoding: 'utf8', mode: 0o755 });

    const inherited = process.env.PATH ?? '';
    const decoyed = await runWatcher(dir, { PATH: `${decoyDir}${delimiter}${inherited}`, HOME: home });

    assert.notEqual(decoyed.status, 0, `the decoy git did not win:\n${decoyed.stdout}`);
    assert.match(
      decoyed.stderr,
      /^autonomous-watcher\.sh: .* is not inside a git repository/m,
      `the watcher did not refuse the way a failed root resolution makes it refuse:\n${decoyed.stderr}`,
    );
    assert.match(decoyed.stderr, /refusing to start/, `the refusal is not the start-up one:\n${decoyed.stderr}`);
    assert.equal(decoyed.stdout, '', `the watcher got past the refusal:\n${decoyed.stdout}`);

    // The control runs on this process's own PATH and asserts the watcher STARTS, which needs a
    // working git and a jq at the 1.5 floor. Skipped rather than failed on a machine without them,
    // in this file's own idiom: the decoy half above is already measured and needs neither.
    for (const tool of ['git', 'jq']) {
      if (!onPath(tool)) {
        subtest.skip(`${tool} does not resolve on this process's PATH, so the control cannot be driven here`);
        return;
      }
    }

    // The control, so the case measures the ORDERING and not the fixture: the same run without that
    // one directory on PATH starts.
    const plain = await runWatcher(dir, { PATH: inherited, HOME: home });
    assert.equal(plain.status, 0, `the same run without the decoy directory also failed:\n${plain.stderr}`);
    assert.match(plain.stdout, /^tunables: MAX_PARALLEL_RUNS=/m, `the watcher printed no tunables:\n${plain.stdout}`);
  });
});

test('the docs-retrieval server launcher is written verbatim, executable, and a re-run leaves it as it is', async (t) => {
  const dir = await fixtureFor(t, { files: nodeProjectFiles() });

  await initOk(dir);

  const first = await snapshotTree(dir);
  assert.deepEqual(copiesOf(first, LAUNCHER_FILE), [LAUNCHER_PATH], `${LAUNCHER_FILE} was not written into ${SCRIPTS_DIR}/`);
  assert.equal(text(dir, LAUNCHER_PATH), readFileSync(LAUNCHER_TEMPLATE, 'utf8'), `${LAUNCHER_PATH} is not the template's bytes`);
  const mode = (await lstat(join(dir, LAUNCHER_PATH))).mode & 0o777;
  assert.equal(mode, 0o755, `${LAUNCHER_PATH} is mode ${mode.toString(8)}, not 755`);

  await initOk(dir);

  assert.equal((await snapshotTree(dir))[LAUNCHER_PATH], first[LAUNCHER_PATH], 'a second init rewrote the launcher');
});

test('remote-run.sh is written verbatim and executable under scriptsDir', async (t) => {
  const dir = await fixtureFor(t, { files: nodeProjectFiles() });
  const path = `${SCRIPTS_DIR}/remote-run.sh`;

  await initOk(dir);

  assert.equal(text(dir, path), readFileSync(join(PACKAGE_ROOT, 'templates', SCRIPTS_DIR, 'remote-run.sh'), 'utf8'), `${path} is not the template's bytes`);
  const mode = (await lstat(join(dir, path))).mode & 0o777;
  assert.equal(mode, 0o755, `${path} is mode ${mode.toString(8)}, not 755`);
});

test('the docs-retrieval server launcher refuses with an empty stdout when no runtime is installed', async (t) => {
  const dir = await fixtureFor(t, { files: nodeProjectFiles() });
  await initOk(dir);
  const cacheHome = join(dir, 'empty-cache');
  mkdirSync(cacheHome, { recursive: true });

  const { status, stdout, stderr } = await runBash(dir, [join(dir, LAUNCHER_PATH)], { XDG_CACHE_HOME: cacheHome });

  assert.equal(status, 1, `the launcher exited ${status}:\n${stderr}`);
  // Stdout is the MCP transport: a refusal written there would be a malformed frame.
  assert.equal(stdout, '', `the launcher wrote to stdout:\n${stdout}`);
  assert.match(stderr, /npx autonomous-sdlc-harness init/, `the refusal does not name the remedy:\n${stderr}`);
  assert.ok(stderr.includes(join(cacheHome, ...RUNTIME_ENTRY)), `the refusal does not name the entry path:\n${stderr}`);
});

test("the docs-retrieval server launcher execs the runtime's docs serve for its own checkout", async (t) => {
  const dir = await fixtureFor(t, { files: nodeProjectFiles() });
  await initOk(dir);
  const cacheHome = join(dir, 'cache');
  await plantRetrievalRuntime(cacheHome);
  // The planted entry replaced by one reporting its argv on stderr, so stdout stays the transport's.
  writeFileSync(
    join(cacheHome, ...RUNTIME_ENTRY),
    'process.stderr.write(JSON.stringify(process.argv.slice(2)));\nprocess.exit(0);\n',
    'utf8',
  );

  // Invoked from outside the checkout, so the root is the script's own and not the caller's.
  const { status, stdout, stderr } = await runBash(cacheHome, [join(dir, LAUNCHER_PATH)], { XDG_CACHE_HOME: cacheHome });

  assert.equal(status, 0, `the launcher exited ${status}:\n${stderr}`);
  assert.equal(stdout, '', `the launcher wrote to stdout:\n${stdout}`);
  assert.deepEqual(JSON.parse(stderr), ['docs', 'serve', '--cwd', dir]);
});

/**
 * A launcher fixture: `init`, then `harness.config.json` rewritten with the `docs` / `phases.docs`
 * values the case states, a planted TypeScript runtime that reports its argv on stderr, and —
 * unless `fake` is `false` — a fake `harness-docs-retrieval` first on `PATH` that reports its argv
 * and database variable as JSON on stderr, after an optional prelude line, and exits `fake.status`.
 * `HOME` is a fixture directory, so `~/.local/bin` cannot supply a real backend.
 */
async function launcherFixture(t, { docs, phasesDocs = true, fake = { status: 0 } }) {
  const dir = await fixtureFor(t, { files: nodeProjectFiles() });
  await initOk(dir);
  writeFileSync(
    join(dir, 'harness.config.json'),
    `${JSON.stringify(seededConfig({ phases: { docs: phasesDocs }, docs }))}\n`,
  );
  const cacheHome = join(dir, 'cache');
  await plantRetrievalRuntime(cacheHome);
  writeFileSync(
    join(cacheHome, ...RUNTIME_ENTRY),
    "process.stderr.write(JSON.stringify(process.argv.slice(2)) + '\\n');\nprocess.exit(0);\n",
    'utf8',
  );
  const home = join(dir, 'home');
  mkdirSync(home, { recursive: true });
  const bin = join(dir, 'fake-bin');
  mkdirSync(bin, { recursive: true });
  if (fake !== false) {
    const prelude = fake.prelude === undefined ? '' : `process.stderr.write(${JSON.stringify(`${fake.prelude}\n`)});\n`;
    const fakePath = join(bin, PYTHON_RETRIEVAL_COMMAND);
    writeFileSync(
      fakePath,
      '#!/usr/bin/env node\n' +
        prelude +
        `process.stderr.write(JSON.stringify({ argv: process.argv.slice(2), url: process.env.${PYTHON_DATABASE_URL_VARIABLE} }) + '\\n');\n` +
        `process.exit(${fake.status});\n`,
      'utf8',
    );
    chmodSync(fakePath, 0o755);
  }
  const env = {
    XDG_CACHE_HOME: cacheHome,
    HOME: home,
    PATH: `${bin}${delimiter}${process.env.PATH ?? ''}`,
    [PYTHON_DATABASE_URL_VARIABLE]: '',
  };
  return { dir, env };
}

/** The JSON lines a planted runtime or fake backend wrote to stderr, parsed; other lines dropped. */
function jsonLines(stderr) {
  return stderr
    .split('\n')
    .filter((line) => line.startsWith('{') || line.startsWith('['))
    .map((line) => JSON.parse(line));
}

test('the launcher execs the TypeScript runtime when retrieval is off, whatever docs.retrievalBackend holds', async (t) => {
  const { dir, env } = await launcherFixture(t, { docs: { retrieval: false, retrievalBackend: 'python' } });

  const { status, stdout, stderr } = await runBash(dir, [join(dir, LAUNCHER_PATH)], env);

  assert.equal(status, 0, `the launcher exited ${status}:\n${stderr}`);
  assert.equal(stdout, '', `the launcher wrote to stdout:\n${stdout}`);
  assert.deepEqual(jsonLines(stderr), [['docs', 'serve', '--cwd', dir]], `the Python backend was reached:\n${stderr}`);
});

test('the launcher execs the TypeScript runtime when docs.retrievalBackend is typescript', async (t) => {
  const { dir, env } = await launcherFixture(t, { docs: { retrieval: true, retrievalBackend: 'typescript' } });

  const { status, stdout, stderr } = await runBash(dir, [join(dir, LAUNCHER_PATH)], env);

  assert.equal(status, 0, `the launcher exited ${status}:\n${stderr}`);
  assert.equal(stdout, '', `the launcher wrote to stdout:\n${stdout}`);
  assert.deepEqual(jsonLines(stderr), [['docs', 'serve', '--cwd', dir]]);
});

test('the launcher starts the Python backend with the default database URL when docs.retrievalBackend is python', async (t) => {
  const { dir, env } = await launcherFixture(t, { docs: { retrieval: true, retrievalBackend: 'python' } });

  const { status, stdout, stderr } = await runBash(dir, [join(dir, LAUNCHER_PATH)], env);

  assert.equal(status, 0, `the launcher exited ${status}:\n${stderr}`);
  assert.equal(stdout, '', `the launcher wrote to stdout:\n${stdout}`);
  assert.deepEqual(jsonLines(stderr), [{ argv: [PYTHON_SERVE_SUB_COMMAND, '--repo', dir], url: PYTHON_DEFAULT_DATABASE_URL }]);
});

test('the launcher passes an inherited database URL to the Python backend unchanged', async (t) => {
  const { dir, env } = await launcherFixture(t, { docs: { retrieval: true, retrievalBackend: 'python' } });
  const url = 'postgresql://someone:else@db.example:6543/elsewhere';

  const { status, stdout, stderr } = await runBash(dir, [join(dir, LAUNCHER_PATH)], { ...env, [PYTHON_DATABASE_URL_VARIABLE]: url });

  assert.equal(status, 0, `the launcher exited ${status}:\n${stderr}`);
  assert.equal(stdout, '', `the launcher wrote to stdout:\n${stdout}`);
  assert.deepEqual(jsonLines(stderr), [{ argv: [PYTHON_SERVE_SUB_COMMAND, '--repo', dir], url }]);
});

test('the launcher exits 3 when the Python backend is selected and its command does not resolve', async (t) => {
  if (onPath(PYTHON_RETRIEVAL_COMMAND) || inFallbackDirs(PYTHON_RETRIEVAL_COMMAND)) {
    t.skip(`${PYTHON_RETRIEVAL_COMMAND} is installed on this machine, so its absence cannot be staged`);
    return;
  }
  const { dir, env } = await launcherFixture(t, { docs: { retrieval: true, retrievalBackend: 'python' }, fake: false });

  const { status, stdout, stderr } = await runBash(dir, [join(dir, LAUNCHER_PATH)], env);

  assert.equal(status, PYTHON_BACKEND_UNAVAILABLE_EXIT, `the launcher exited ${status}:\n${stderr}`);
  assert.equal(stdout, '', `the launcher wrote to stdout:\n${stdout}`);
  assert.ok(stderr.includes(PYTHON_RETRIEVAL_COMMAND), `the refusal does not name the command:\n${stderr}`);
  assert.match(stderr, /doctor/, `the refusal does not name doctor:\n${stderr}`);
});

test('the launcher exits 3 and keeps the backend\'s own reason when the Python backend fails', async (t) => {
  const reason = `${PYTHON_RETRIEVAL_COMMAND}: could not connect to the database`;
  const { dir, env } = await launcherFixture(t, {
    docs: { retrieval: true, retrievalBackend: 'python' },
    fake: { status: 1, prelude: reason },
  });

  const { status, stdout, stderr } = await runBash(dir, [join(dir, LAUNCHER_PATH)], env);

  assert.equal(status, PYTHON_BACKEND_UNAVAILABLE_EXIT, `the launcher exited ${status}:\n${stderr}`);
  assert.equal(stdout, '', `the launcher wrote to stdout:\n${stdout}`);
  assert.ok(stderr.includes(reason), `the backend's own line is missing:\n${stderr}`);
  assert.match(stderr, /^docs-search-server: .*status 1.*doctor/m, `the launcher's own line is missing:\n${stderr}`);
});

test('the launcher passes an INT on to the Python backend as TERM', async (t) => {
  const { dir, env } = await launcherFixture(t, { docs: { retrieval: true, retrievalBackend: 'python' }, fake: false });
  const fakePath = join(dir, 'fake-bin', PYTHON_RETRIEVAL_COMMAND);
  writeFileSync(
    fakePath,
    '#!/usr/bin/env node\n' +
      "process.on('SIGTERM', () => { process.stderr.write(JSON.stringify({ got: 'SIGTERM' }) + '\\n'); process.exit(0); });\n" +
      "process.stderr.write('ready\\n');\n" +
      'setInterval(() => {}, 1000);\n',
    'utf8',
  );
  chmodSync(fakePath, 0o755);

  const child = spawn('bash', [join(dir, LAUNCHER_PATH)], { cwd: dir, env: { ...process.env, ...env }, stdio: ['pipe', 'pipe', 'pipe'] });
  let stdout = '';
  let stderr = '';
  let signalled = false;
  child.stdout.on('data', (chunk) => { stdout += chunk; });
  child.stderr.on('data', (chunk) => {
    stderr += chunk;
    if (!signalled && stderr.includes('ready')) {
      signalled = true;
      child.kill('SIGINT');
    }
  });
  let timer;
  const status = await Promise.race([
    new Promise((resolve) => child.on('close', (code) => resolve(code))),
    new Promise((_, reject) => {
      timer = setTimeout(() => {
        child.kill('SIGKILL');
        reject(new Error(`the launcher did not exit within 10 s of an INT:\n${stderr}`));
      }, 10_000);
    }),
  ]).finally(() => clearTimeout(timer));

  assert.equal(status, 0, `the launcher exited ${status}:\n${stderr}`);
  assert.equal(stdout, '', `the launcher wrote to stdout:\n${stdout}`);
  assert.deepEqual(jsonLines(stderr), [{ got: 'SIGTERM' }], `the backend did not receive TERM:\n${stderr}`);
});

test('the launcher refuses a docs.retrievalBackend outside the enum with exit 1', async (t) => {
  const { dir, env } = await launcherFixture(t, { docs: { retrieval: true, retrievalBackend: 'java' } });

  const { status, stdout, stderr } = await runBash(dir, [join(dir, LAUNCHER_PATH)], env);

  assert.equal(status, 1, `the launcher exited ${status}:\n${stderr}`);
  assert.equal(stdout, '', `the launcher wrote to stdout:\n${stdout}`);
  assert.match(stderr, /docs\.retrievalBackend/, `the refusal does not name the key:\n${stderr}`);
  assert.deepEqual(jsonLines(stderr), [], `a backend was started:\n${stderr}`);
});

test('the launcher template carries every Python backend literal it mirrors', () => {
  const template = readFileSync(LAUNCHER_TEMPLATE, 'utf8');
  for (const literal of [
    PYTHON_RETRIEVAL_COMMAND,
    PYTHON_SERVE_SUB_COMMAND,
    PYTHON_DATABASE_URL_VARIABLE,
    PYTHON_DEFAULT_DATABASE_URL,
    `exit ${PYTHON_BACKEND_UNAVAILABLE_EXIT}`,
  ]) {
    assert.ok(template.includes(literal), `${LAUNCHER_FILE} does not carry ${literal}`);
  }
});

test('hr_cache_dir resolves the machine cache directory the way machineCacheDir() does', async (t) => {
  const dir = await fixtureFor(t, { files: nodeProjectFiles() });
  await initOk(dir);
  const home = join(dir, 'home');

  const empty = await sourceAndCallWithEnv(dir, 'hr_cache_dir', { XDG_CACHE_HOME: '', HOME: home });
  assert.equal(empty.status, 0, `hr_cache_dir exited ${empty.status}: ${empty.stderr}`);
  assert.equal(empty.stdout, `${home}/.cache/autonomous-sdlc-harness\n`, 'an empty XDG_CACHE_HOME did not fall back to $HOME/.cache');

  const slashed = await sourceAndCallWithEnv(dir, 'hr_cache_dir', { XDG_CACHE_HOME: '/x/', HOME: home });
  assert.equal(slashed.status, 0, `hr_cache_dir exited ${slashed.status}: ${slashed.stderr}`);
  assert.equal(slashed.stdout, '/x/autonomous-sdlc-harness\n', 'one trailing slash was not stripped');
});

/**
 * The sweep's fetch is BOUNDED, and the bound releases the output pipe as well as the child.
 *
 * `autonomous-watcher.sh` runs `cleanup-merged-worktrees.sh` synchronously inside its watch loop
 * and reads what it prints, so a fetch that HANGS — rather than one that fails, which the script
 * has always handled — stalls the whole loop: no inbox pass, no drop picked up, nothing appended
 * to `watcher.log`, and a watcher that still looks alive in `ps`. That is not hypothetical; it is
 * what this test was written from.
 *
 * TWO ASSERTIONS, AND THE SECOND IS THE ONE THAT BITES. Printing the verdict on time is not the
 * contract — EXITING is. `git fetch` spawns its transport (`ssh`, `git-remote-https`) as a child
 * of its own, and that grandchild inherits the script's stdout; a ceiling that signals only the
 * direct child leaves the transport holding the write end of the pipe, so the reader blocks on a
 * sweep that already said its piece. A child-only kill measured 144 s against a 3 s ceiling here
 * while printing its message at 3 s, which is why `run_bounded` signals the process GROUP and why
 * the wall clock is asserted rather than the message alone. `runBash` resolving at all is half the
 * proof: `execFile` does not call back while a descendant holds the pipe.
 *
 * The fake `git` hangs ONLY on `fetch` and delegates every other subcommand to the real one, so
 * the script's own repository probing is untouched and the ceiling is the only thing under test.
 */
const HANGING_GIT = [
  '#!/usr/bin/env bash',
  'for a in "$@"; do [ "$a" = "fetch" ] && { sleep 300; exit 0; }; done',
  'exec %REAL_GIT% "$@"',
  '',
].join('\n');

test('the sweep bounds a hanging fetch and releases its output pipe', async (t) => {
  const dir = await fixtureFor(t, { files: nodeProjectFiles() });
  await initOk(dir);

  const realGit = execFileSync('/bin/sh', ['-c', 'command -v git'], { encoding: 'utf8' }).trim();
  const shims = join(dir, 'shims');
  mkdirSync(shims, { recursive: true });
  writeFileSync(join(shims, 'git'), HANGING_GIT.replace('%REAL_GIT%', realGit), { mode: 0o755 });

  const ceiling = 3;
  const started = Date.now();
  const { stdout } = await runBash(dir, [join(dir, `${SCRIPTS_DIR}/cleanup-merged-worktrees.sh`)], {
    PATH: `${shims}:${process.env.PATH ?? ''}`,
    HARNESS_FETCH_TIMEOUT: String(ceiling),
  });
  const elapsed = (Date.now() - started) / 1000;

  assert.match(
    stdout,
    /fetch --prune failed \(offline, unreachable or timed out\); skipping this round/,
    `the sweep did not report the bounded fetch:\n${stdout}`,
  );
  // The ceiling plus the TERM→KILL escalation, and generous room over that for a loaded machine.
  // A child-only kill does not come in under this; it waits for the orphan.
  assert.ok(
    elapsed < ceiling + 20,
    `the sweep took ${elapsed.toFixed(1)}s against a ${ceiling}s ceiling — the fetch's transport is still holding the pipe`,
  );
});

test('a HARNESS_FETCH_TIMEOUT that is not a usable ceiling falls back to the default, never to unbounded', async (t) => {
  const dir = await fixtureFor(t, { files: nodeProjectFiles() });
  await initOk(dir);

  // The clause is read out of the SHIPPED script rather than restated here, and it is then driven
  // through the SAME `[ "$waited" -ge "$limit" ]` comparison `run_bounded` makes of it. Asserting
  // the resolved string alone is what let two values ship that the script's own prose calls
  // impossible: a 19-digit number is all digits, and the comparison against it ERRORS rather than
  // returning false, so the timeout branch never fires — a ceiling that reads as `99999…` looks
  // fine as a string and is unbounded in use. `00` is the mirror image: it reads as a number and
  // fires on the first poll, disabling the sweep for good. Both are in the table below.
  const sweep = text(dir, `${SCRIPTS_DIR}/cleanup-merged-worktrees.sh`);
  const clause = sweep.match(/^fetch_timeout=.*?^fi$/ms);
  assert.ok(clause, 'the sweep carries no HARNESS_FETCH_TIMEOUT validation clause');

  // `probe` reports the resolved ceiling AND what the loop's own test says about it at waited=0:
  // `fires` means a ceiling that expires immediately, `never` a ceiling that can never expire.
  const probe = `${clause[0]}
if [ 0 -ge "$fetch_timeout" ] 2>/dev/null; then verdict=fires; elif [ 1 -ge "$fetch_timeout" ] 2>/dev/null || [ "$fetch_timeout" -ge 1 ] 2>/dev/null; then verdict=bounded; else verdict=never; fi
printf '%s %s' "$fetch_timeout" "$verdict"`;

  for (const value of ['', 'abc', '0', '00', '000', '-5', '4x', '99999999999999999999', '3601']) {
    const { stdout } = await runBash(dir, ['-c', probe], { HARNESS_FETCH_TIMEOUT: value });
    assert.equal(
      stdout,
      '60 bounded',
      `HARNESS_FETCH_TIMEOUT='${value}' resolved to '${stdout}' instead of the bounded 60s default`,
    );
  }

  for (const value of ['1', '5', '3600']) {
    const { stdout } = await runBash(dir, ['-c', probe], { HARNESS_FETCH_TIMEOUT: value });
    assert.equal(stdout, `${value} bounded`, `a usable ceiling of ${value}s was not honoured: '${stdout}'`);
  }
});

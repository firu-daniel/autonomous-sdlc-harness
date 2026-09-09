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
import { execFile, execFileSync } from 'node:child_process';
import {
  accessSync,
  appendFileSync,
  constants as fsConstants,
  mkdirSync,
  readFileSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { lstat } from 'node:fs/promises';
import { delimiter, join } from 'node:path';
import test from 'node:test';

import { createFixture, runBash, runCli, snapshotTree, PACKAGE_ROOT } from './helpers/fixture.mjs';

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
 * a helper name — the script defines none, and its refusal contract is one `scratch-run.sh: <reason>`
 * line on stderr followed by a non-zero exit.
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

/**
 * Gate 6a's check: `scripts/check-machine-paths.sh`, which `scripts/run-gates.sh` runs from the
 * repository root (`docs/development.md` §5, gate 6).
 *
 * **The rule this suite enforces: gate 6a prints every `$HOME` hit and every `grep` error but one —
 * `Permission denied` on a character device, the `/dev/null` placeholder the launcher's `bwrap`
 * vector mounts `nodev` at an absent protected path, which holds no bytes**
 * (`docs/sandbox-verification.md` §5 F11). Its excluded places stay silent, and a gate that cannot
 * make its temporary file prints a line and exits 1 rather than reading as silent.
 *
 * Every case runs the script from a throwaway tree under `os.tmpdir()` with `HOME` set to a fake
 * path the tree names; `WORKSPACE_ROOT` is only where the script is read from.
 *
 * Deliberately not covered: a real `nodev` mount, which no suite can make without privilege. The
 * `F11: …` case's `grep` stub stands in for it, emitting the error lines a `nodev` placeholder
 * produces in front of the real `grep`'s output.
 */

import assert from 'node:assert/strict';
import { chmod, mkdir, mkdtemp, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import test from 'node:test';

import { runBash, WORKSPACE_ROOT } from './helpers/fixture.mjs';

const SCRIPT = join(WORKSPACE_ROOT, 'scripts', 'check-machine-paths.sh');
const FAKE_HOME = '/fake-home/check-machine-paths-user';
const HIT_TEXT = `config lives at ${FAKE_HOME}/.config`;

/** A throwaway directory under `os.tmpdir()`, removed when the case ends. */
async function scratchDir(t) {
  const dir = await mkdtemp(join(tmpdir(), 'check-machine-paths-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  return dir;
}

/** Writes each `path → text` entry under `root`, creating parent directories. */
async function writeTree(root, files) {
  for (const [path, text] of Object.entries(files)) {
    await mkdir(dirname(join(root, path)), { recursive: true });
    await writeFile(join(root, path), text, 'utf8');
  }
}

function runCheck(tree, env = {}) {
  return runBash(tree, [SCRIPT], { HOME: FAKE_HOME, ...env });
}

/** POSIX single-quoting, so a path is one word in the stub's `exec` line. */
function shellQuote(value) {
  return `'${value.replaceAll("'", `'\\''`)}'`;
}

test('(a) a file naming the home prints in grep -rn form, and the status is 0', async (t) => {
  const tree = await scratchDir(t);
  await writeTree(tree, { 'notes.txt': `first line\n${HIT_TEXT}\n` });
  const run = await runCheck(tree);
  assert.equal(run.status, 0, run.stderr);
  assert.equal(run.stdout, `./notes.txt:2:${HIT_TEXT}\n`);
  assert.equal(run.stderr, '');
});

test('(b) the excluded places print nothing, while the clarifications README still prints', async (t) => {
  const tree = await scratchDir(t);
  const silent = [
    'node_modules/pkg/index.js',
    'dist/out.js',
    '.git/config',
    'harness-runs/test_run_logs/gates.log',
    'harness-runs/scratch/probe.py',
    '__pycache__/mod.pyc',
    'harness-runs/clarifications/some_branch/answer.md',
  ];
  await writeTree(tree, {
    ...Object.fromEntries(silent.map((path) => [path, `${HIT_TEXT}\n`])),
    'harness-runs/clarifications/README.md': `${HIT_TEXT}\n`,
  });
  const run = await runCheck(tree);
  assert.equal(run.status, 0, run.stderr);
  assert.equal(run.stdout, `./harness-runs/clarifications/README.md:1:${HIT_TEXT}\n`);
  assert.equal(run.stderr, '');
});

test('(c) a tree with no hit prints nothing', async (t) => {
  const tree = await scratchDir(t);
  await writeTree(tree, { 'notes.txt': 'nothing machine-local here\n', 'sub/other.md': '# none\n' });
  const run = await runCheck(tree);
  assert.equal(run.status, 0, run.stderr);
  assert.equal(run.stdout, '');
  assert.equal(run.stderr, '');
});

test('F11: a Permission denied line on a character device is dropped, any other grep error is printed', async (t) => {
  const root = await scratchDir(t);
  const tree = join(root, 'tree');
  const bin = join(root, 'bin');
  await mkdir(tree);
  await mkdir(bin);

  // Resolved before the stub is placed, so the stub can exec it.
  const which = await runBash(root, ['-c', 'command -v grep']);
  assert.equal(which.status, 0, which.stderr);
  const realGrep = which.stdout.trim();
  assert.ok(realGrep.startsWith('/'), `grep did not resolve to a path: ${JSON.stringify(which.stdout)}`);

  const deviceLine = 'grep: ./.vscode: Permission denied';
  const fileLine = 'grep: ./secret.txt: Permission denied';
  const otherLine = 'grep: ./odd: Input/output error';
  const stub = [
    '#!/bin/sh',
    'for arg in "$@"; do',
    '  if [ "$arg" = "-rn" ]; then',
    `    printf '%s\\n' '${deviceLine}' '${fileLine}' '${otherLine}' >&2`,
    '    break',
    '  fi',
    'done',
    `exec ${shellQuote(realGrep)} "$@"`,
    '',
  ].join('\n');
  await writeFile(join(bin, 'grep'), stub, 'utf8');
  await chmod(join(bin, 'grep'), 0o755);

  // `.vscode` is a character device through the link, so `[ -c ]` holds without privilege; `odd` is absent.
  await symlink('/dev/null', join(tree, '.vscode'));
  await writeTree(tree, { 'secret.txt': 'nothing machine-local here\n' });

  const run = await runCheck(tree, { PATH: `${bin}:${process.env.PATH}` });
  assert.equal(run.status, 0, run.stderr);
  const output = `${run.stdout}${run.stderr}`.split('\n');
  assert.ok(output.includes(fileLine), `the regular-file error was dropped: ${JSON.stringify(output)}`);
  assert.ok(output.includes(otherLine), `the non-permission error was dropped: ${JSON.stringify(output)}`);
  assert.ok(!output.includes(deviceLine), `the character-device error was printed: ${JSON.stringify(output)}`);
});

// `mktemp`'s own diagnostic precedes the script's line on stderr, so the case asserts the script's
// one line rather than a one-line total.
test('(e) a temporary file that cannot be made prints one line and exits 1', async (t) => {
  const tree = await scratchDir(t);
  await writeTree(tree, { 'regular-file': 'not a directory\n' });
  const run = await runCheck(tree, { TMPDIR: join(tree, 'regular-file', 'below') });
  assert.equal(run.status, 1, `${run.stdout}\n${run.stderr}`);
  assert.equal(run.stdout, '');
  const own = run.stderr.split('\n').filter((line) => line.startsWith('check-machine-paths: '));
  assert.equal(own.length, 1, run.stderr);
  assert.ok(own[0].length > 'check-machine-paths: '.length, run.stderr);
});

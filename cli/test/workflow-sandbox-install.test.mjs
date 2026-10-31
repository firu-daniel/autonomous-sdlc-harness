/**
 * The `Install the sandbox prerequisites` step of the `harness-run.yml` template, pinned and run.
 *
 * **The rule these tests enforce: the step installs exactly the owner's packages and writes exactly
 * the owner's profile, before the preflight.** The owner is `cli/src/doctor/sandboxPrerequisites.ts`;
 * every expected value here is read from its exports, never retyped. The step's `run: |` body is
 * taken from the template's own text and run with `bash -eo pipefail` (the workflow's
 * `shell: bash`) under a `PATH` holding only a stub directory, so no case installs anything, needs
 * root or reads the host's AppArmor state.
 */

import assert from 'node:assert/strict';
import { accessSync, chmodSync, constants, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { delimiter, join } from 'node:path';
import test from 'node:test';

import { PACKAGE_ROOT, runBash } from './helpers/fixture.mjs';
import { WORKFLOW_RUN_FILE, WORKFLOW_TEMPLATE_DIR } from '../dist/remote/githubActions.js';
import {
  APPARMOR_RELOAD_COMMAND,
  APPARMOR_USERNS_SYSCTL_PATH,
  BWRAP_APPARMOR_PROFILE_PATH,
  SANDBOX_HOST_BINARIES,
  SANDBOX_INSTALLERS,
  bwrapAppArmorProfile,
} from '../dist/doctor/sandboxPrerequisites.js';

const STEP = 'Install the sandbox prerequisites';
const PREFLIGHT = 'Preflight with doctor';
const LINES = readFileSync(join(PACKAGE_ROOT, 'templates', WORKFLOW_TEMPLATE_DIR, WORKFLOW_RUN_FILE), 'utf8').split('\n');
const PACKAGES = SANDBOX_HOST_BINARIES.map((entry) => entry.package);
const INSTALL_TOOLS = SANDBOX_INSTALLERS.map((installer) => installer.command.replace(/^sudo /, '').replace(/ install$/, ''));
const [RELOAD_TOOL, ...RELOAD_ARGS] = APPARMOR_RELOAD_COMMAND.replace(/^sudo /, '').split(' ');

const indentOf = (line) => line.length - line.trimStart().length;

/** The `run: |` body of the step named `name`, de-indented; a local copy of workflow-plugin-pin's. */
function stepBody(name) {
  const start = LINES.findIndex((l) => l.trim() === `- name: ${name}`);
  assert.notEqual(start, -1, `the template carries the step ${name}`);
  const stepIndent = indentOf(LINES[start]);
  let runAt = -1;
  for (let i = start + 1; i < LINES.length && (LINES[i].trim() === '' || indentOf(LINES[i]) > stepIndent); i++) {
    if (LINES[i].trim() === 'run: |') runAt = i;
  }
  assert.notEqual(runAt, -1, `the step ${name} has a run: | body`);
  const base = indentOf(LINES[runAt]);
  const body = [];
  for (let i = runAt + 1; i < LINES.length; i++) {
    if (LINES[i].trim() !== '' && indentOf(LINES[i]) <= base) break;
    body.push(LINES[i]);
  }
  const cut = Math.min(...body.filter((l) => l.trim() !== '').map(indentOf));
  return body.map((l) => l.slice(cut)).join('\n');
}

/** The first executable named `name` on this process's `PATH`, or `''`. */
function onPath(name) {
  for (const dir of (process.env.PATH ?? '').split(delimiter)) {
    if (dir === '') continue;
    const candidate = join(dir, name);
    try {
      accessSync(candidate, constants.X_OK);
      return candidate;
    } catch {
      // not here
    }
  }
  return '';
}

const REAL = Object.fromEntries(['bash', 'cat', 'grep', 'tee'].map((name) => [name, onPath(name)]));
const UNRESOLVED = Object.keys(REAL).filter((name) => REAL[name] === '');
const SKIP = UNRESOLVED.length > 0 ? `${UNRESOLVED.join(', ')} did not resolve on PATH, so the step cannot be run here` : false;

/**
 * A stub world: temp sysctl and profile paths, and a bin directory that is the run's whole `PATH`.
 *
 * @param {{ sysctl: string, present?: string[], installers?: string[] }} options
 */
function world(t, { sysctl, present = [], installers = [INSTALL_TOOLS[0]] }) {
  const root = mkdtempSync(join(tmpdir(), 'sandbox-install-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const bin = join(root, 'bin');
  const state = join(root, 'state');
  const etc = join(root, 'etc');
  for (const dir of [bin, state, etc]) mkdirSync(dir);
  for (const [name, path] of Object.entries(REAL)) symlinkSync(path, join(bin, name));
  const stub = (name, body) => {
    writeFileSync(join(bin, name), `#!${REAL.bash}\n${body}\n`);
    chmodSync(join(bin, name), 0o755);
  };
  const recorder = (name) => stub(name, `printf '%s\\n' "$*" >> '${join(state, name)}'`);
  stub('uname', 'echo Linux');
  stub('id', 'echo 1000');
  stub('sudo', '[ "$1" = -n ] || exit 1\nshift\n"$@"');
  for (const name of [...installers, RELOAD_TOOL]) recorder(name);
  for (const binary of present) stub(binary, 'exit 0');
  const sysctlFile = join(root, 'apparmor_restrict_unprivileged_userns');
  writeFileSync(sysctlFile, `${sysctl}\n`);
  const profile = join(etc, 'bwrap');
  const lines = stepBody(STEP).split('\n');
  lines[0] = `sysctl_file='${sysctlFile}'`;
  lines[1] = `profile='${profile}'`;
  const script = join(root, 'step.sh');
  writeFileSync(script, lines.join('\n'));
  return { root, bin, state, profile, script };
}

function runStep(w) {
  return runBash(w.root, ['--noprofile', '--norc', '-eo', 'pipefail', w.script], { PATH: w.bin });
}

/** Each recorded invocation of `name`, one argument string per line; `[]` when it never ran. */
function recorded(w, name) {
  const file = join(w.state, name);
  return existsSync(file) ? readFileSync(file, 'utf8').trimEnd().split('\n') : [];
}

/** The package arguments of each recorded `install` invocation of `name`. */
function installs(w, name) {
  return recorded(w, name)
    .map((line) => line.split(' '))
    .filter((args) => args[0] === 'install')
    .map((args) => args.slice(1).filter((arg) => !arg.startsWith('-')));
}

test('(a) the step sits directly before the preflight in the run job', () => {
  const names = LINES.filter((l) => /^ {6}- name: /.test(l)).map((l) => l.trim().slice('- name: '.length));
  const at = names.indexOf(STEP);
  assert.notEqual(at, -1, `a step is named ${STEP}`);
  assert.equal(names[at + 1], PREFLIGHT);
});

test('(b) the DECLARED MIRRORS block names the owner', () => {
  const start = LINES.findIndex((l) => l.startsWith('# DECLARED MIRRORS'));
  assert.notEqual(start, -1);
  const end = LINES.findIndex((l, i) => i > start && l.trim() === '#');
  assert.ok(end > start);
  assert.ok(LINES.slice(start, end).some((l) => l.includes('cli/src/doctor/sandboxPrerequisites.ts')));
});

test("(c) the body's first two lines are the owner's two paths", () => {
  const [first, second] = stepBody(STEP).split('\n');
  assert.equal(first, `sysctl_file=${APPARMOR_USERNS_SYSCTL_PATH}`);
  assert.equal(second, `profile=${BWRAP_APPARMOR_PROFILE_PATH}`);
});

test('(d) a restricting sysctl and no binaries: installs the packages, writes the profile, reloads', { skip: SKIP }, async (t) => {
  const w = world(t, { sysctl: '1' });
  const result = await runStep(w);
  assert.equal(result.status, 0, result.stdout + result.stderr);
  assert.deepEqual(installs(w, INSTALL_TOOLS[0]), [PACKAGES]);
  assert.equal(readFileSync(w.profile, 'utf8'), bwrapAppArmorProfile());
  assert.deepEqual(recorded(w, RELOAD_TOOL), [RELOAD_ARGS.join(' ')]);
});

test('(e) a clear sysctl and both binaries present: nothing installed or written', { skip: SKIP }, async (t) => {
  const w = world(t, { sysctl: '0', present: SANDBOX_HOST_BINARIES.map((entry) => entry.binary) });
  const result = await runStep(w);
  assert.equal(result.status, 0, result.stdout + result.stderr);
  assert.deepEqual(recorded(w, INSTALL_TOOLS[0]), []);
  assert.deepEqual(recorded(w, RELOAD_TOOL), []);
  assert.equal(existsSync(w.profile), false);
});

test("(f) the installers are tried in the owner's family order", async (t) => {
  const body = stepBody(STEP);
  const firsts = INSTALL_TOOLS.map((tool) => body.indexOf(`${tool} install`));
  for (const [i, tool] of INSTALL_TOOLS.entries()) assert.notEqual(firsts[i], -1, `the body installs through ${tool}`);
  assert.deepEqual([...firsts].sort((a, b) => a - b), firsts);

  await t.test('with every installer present, only the first installs', { skip: SKIP }, async (sub) => {
    const w = world(sub, { sysctl: '0', installers: INSTALL_TOOLS });
    const result = await runStep(w);
    assert.equal(result.status, 0, result.stdout + result.stderr);
    assert.deepEqual(installs(w, INSTALL_TOOLS[0]), [PACKAGES]);
    for (const tool of INSTALL_TOOLS.slice(1)) assert.deepEqual(installs(w, tool), [], tool);
  });

  await t.test('without the first, the next installs the packages', { skip: SKIP }, async (sub) => {
    const w = world(sub, { sysctl: '0', installers: INSTALL_TOOLS.slice(1) });
    const result = await runStep(w);
    assert.equal(result.status, 0, result.stdout + result.stderr);
    assert.deepEqual(installs(w, INSTALL_TOOLS[1]), [PACKAGES]);
  });
});

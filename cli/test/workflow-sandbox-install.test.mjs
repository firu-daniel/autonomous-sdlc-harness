/**
 * The `Install the sandbox prerequisites` step of the `harness-run.yml` template, pinned and run.
 *
 * **The rule these tests enforce: the step installs exactly the owner's packages, applies exactly
 * the owner's stock-profile remedy, writes and loads exactly the owner's profile, then always
 * verifies with the owner's nested user-namespace check on Linux and fails before the session when
 * that check fails** — case (l) holds the job to stopping there. The owner is
 * `cli/src/doctor/sandboxPrerequisites.ts`; every expected value here is read from its exports,
 * never retyped. The step's `run: |` body is taken from the template's own text and run with
 * `bash -eo pipefail` (the workflow's `shell: bash`) under a `PATH` holding only a stub directory,
 * so no case installs anything, needs root, spawns a real `bwrap` or reads the host's AppArmor
 * state.
 */

import assert from 'node:assert/strict';
import { accessSync, chmodSync, constants, existsSync, lstatSync, mkdirSync, mkdtempSync, readFileSync, readlinkSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { delimiter, join } from 'node:path';
import test from 'node:test';

import { load } from 'js-yaml';

import { PACKAGE_ROOT, runBash } from './helpers/fixture.mjs';
import { WORKFLOW_RUN_FILE, WORKFLOW_TEMPLATE_DIR } from '../dist/remote/githubActions.js';
import {
  APPARMOR_DISABLE_DIR,
  APPARMOR_LOAD_COMMAND,
  APPARMOR_USERNS_SYSCTL_PATH,
  BWRAP_APPARMOR_PROFILE_PATH,
  BWRAP_USERNS_RESTRICT_PROFILE_PATH,
  NESTED_USERNS_HELPER,
  NESTED_USERNS_PROBE,
  SANDBOX_HOST_BINARIES,
  SANDBOX_INSTALLERS,
  bwrapAppArmorProfile,
  bwrapUsernsRestrictRemedy,
} from '../dist/doctor/sandboxPrerequisites.js';

const STEP = 'Install the sandbox prerequisites';
const PREFLIGHT = 'Preflight with doctor';
const HARNESS = 'Run the harness';
const PRESENT_LINE = 'The sandbox prerequisites are present.';
const ATTR_READING = 'bwrap//&unpriv_bwrap (enforce)';
const UID_MAP_ERROR = 'unshare: write failed /proc/self/uid_map: Operation not permitted';
const TEMPLATE = readFileSync(join(PACKAGE_ROOT, 'templates', WORKFLOW_TEMPLATE_DIR, WORKFLOW_RUN_FILE), 'utf8');
const LINES = TEMPLATE.split('\n');
const PACKAGES = SANDBOX_HOST_BINARIES.map((entry) => entry.package);
const BINARIES = SANDBOX_HOST_BINARIES.map((entry) => entry.binary);
const INSTALL_TOOLS = SANDBOX_INSTALLERS.map((installer) => installer.command.replace(/^sudo /, '').replace(/ install$/, ''));
const LOAD_TOOL = APPARMOR_LOAD_COMMAND.replace(/^sudo /, '').split(' ')[0];
const PROBE_ARGS = NESTED_USERNS_PROBE.slice(1).join(' ');

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

const REAL = Object.fromEntries(['bash', 'cat', 'grep', 'tee', 'mkdir', 'ln'].map((name) => [name, onPath(name)]));
const UNRESOLVED = Object.keys(REAL).filter((name) => REAL[name] === '');
const SKIP = UNRESOLVED.length > 0 ? `${UNRESOLVED.join(', ')} did not resolve on PATH, so the step cannot be run here` : false;

/** Single-quotes `value` for a stub's shell source. */
const sq = (value) => `'${value.replaceAll("'", `'\\''`)}'`;

/**
 * The recording `bwrap` stub: it appends its arguments to `calls`, then passes, or fails the way a
 * capability-restricted child does — except for the confinement read, which answers {@link ATTR_READING}.
 */
function bwrapStub(nested, calls) {
  const record = `printf '%s\\n' "$*" >> ${sq(calls)}`;
  if (nested === 'pass') return `${record}\nexit 0`;
  return [
    record,
    'case " $* " in',
    `  *" cat /proc/self/attr/current "*) echo ${sq(ATTR_READING)}; exit 0 ;;`,
    'esac',
    `echo ${sq(UID_MAP_ERROR)} >&2`,
    'exit 1',
  ].join('\n');
}

/**
 * A stub world: temp sysctl, profile, stock-profile and disable-directory paths, and a bin
 * directory that is the run's whole `PATH`.
 *
 * @param {{ sysctl: string, present?: string[], installers?: string[], stock?: boolean,
 *   nested?: 'pass' | 'fail', helper?: boolean, uname?: string, sudo?: boolean, optedOut?: boolean }} options
 */
function world(t, { sysctl, present = [], installers = [INSTALL_TOOLS[0]], stock = false, nested = 'pass', helper = true, uname = 'Linux', sudo = true, optedOut = false }) {
  const root = mkdtempSync(join(tmpdir(), 'sandbox-install-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const bin = join(root, 'bin');
  const state = join(root, 'state');
  const etc = join(root, 'etc');
  for (const dir of [bin, state, etc]) mkdirSync(dir);
  for (const [name, path] of Object.entries(REAL)) symlinkSync(path, join(bin, name));
  const write = (path, body) => {
    writeFileSync(path, `#!${REAL.bash}\n${body}\n`);
    chmodSync(path, 0o755);
  };
  const stub = (name, body) => write(join(bin, name), body);
  const bwrapCalls = join(state, 'bwrap.calls');
  // What an installer lays down for `bubblewrap`: the recording stub in its passing form.
  const bwrapPass = join(root, 'bwrap-pass');
  write(bwrapPass, bwrapStub('pass', bwrapCalls));
  const record = (name) => `printf '%s\\n' "$*" >> ${sq(join(state, name))}`;
  stub('uname', `echo ${uname}`);
  stub('id', 'echo 1000');
  stub('sudo', sudo ? '[ "$1" = -n ] || exit 1\nshift\n"$@"' : 'exit 1');
  for (const name of installers) {
    stub(name, `${record(name)}\ncase " $* " in\n  *" bubblewrap "*) ln -sf ${sq(bwrapPass)} ${sq(join(bin, 'bwrap'))} ;;\nesac`);
  }
  stub(LOAD_TOOL, record(LOAD_TOOL));
  for (const binary of present) if (binary !== 'bwrap') stub(binary, 'exit 0');
  if (present.includes('bwrap')) stub('bwrap', bwrapStub(nested, bwrapCalls));
  if (helper && uname === 'Linux') stub(NESTED_USERNS_HELPER, 'exit 0');
  const sysctlFile = join(root, 'apparmor_restrict_unprivileged_userns');
  writeFileSync(sysctlFile, `${sysctl}\n`);
  const profile = join(etc, 'bwrap');
  const stockFile = join(etc, 'bwrap-userns-restrict');
  if (stock) writeFileSync(stockFile, 'profile bwrap /usr/bin/bwrap {}\n');
  const disableDir = join(etc, 'disable');
  let scriptsDir = '';
  if (optedOut) {
    scriptsDir = join(root, 'scripts');
    mkdirSync(join(scriptsDir, 'lib'), { recursive: true });
    writeFileSync(join(scriptsDir, 'lib', 'harness-run-lib.sh'), 'hr_sandbox_opted_out() { return 0; }\n');
  }
  const lines = stepBody(STEP).split('\n');
  lines[0] = `sysctl_file=${sq(sysctlFile)}`;
  lines[1] = `profile=${sq(profile)}`;
  lines[2] = `stock=${sq(stockFile)}`;
  lines[3] = `disable_dir=${sq(disableDir)}`;
  const script = join(root, 'step.sh');
  writeFileSync(script, lines.join('\n'));
  return { root, bin, state, profile, stockFile, disableDir, bwrapCalls, scriptsDir, script };
}

function runStep(w) {
  return runBash(w.root, ['--noprofile', '--norc', '-eo', 'pipefail', w.script], { PATH: w.bin, SCRIPTS_DIR: w.scriptsDir });
}

/** Each recorded invocation of `name`, one argument string per line; `[]` when it never ran. */
function recorded(w, name) {
  const file = join(w.state, name);
  return existsSync(file) ? readFileSync(file, 'utf8').trimEnd().split('\n') : [];
}

/** Each recorded `bwrap` invocation; `[]` when the record file is absent or empty. */
function bwrapCalls(w) {
  return existsSync(w.bwrapCalls) ? readFileSync(w.bwrapCalls, 'utf8').split('\n').filter((l) => l !== '') : [];
}

/** The package arguments of each recorded `install` invocation of `name`. */
function installs(w, name) {
  return recorded(w, name)
    .map((line) => line.split(' '))
    .filter((args) => args[0] === 'install')
    .map((args) => args.slice(1).filter((arg) => !arg.startsWith('-')));
}

/** The owner's command `command` with `sudo ` dropped and every owner path swapped for the world's. */
function localised(w, command) {
  return command
    .replace(/^sudo /, '')
    .replaceAll(BWRAP_USERNS_RESTRICT_PROFILE_PATH, w.stockFile)
    .replaceAll(APPARMOR_DISABLE_DIR, w.disableDir)
    .replaceAll(BWRAP_APPARMOR_PROFILE_PATH, w.profile);
}

const outputLines = (result) => `${result.stdout}${result.stderr}`.split('\n');
const annotated = (result, kind) => outputLines(result).filter((l) => l.startsWith(`::${kind}::`));

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

test("(c) the body's first four lines are the owner's four paths", () => {
  const [first, second, third, fourth] = stepBody(STEP).split('\n');
  assert.equal(first, `sysctl_file=${APPARMOR_USERNS_SYSCTL_PATH}`);
  assert.equal(second, `profile=${BWRAP_APPARMOR_PROFILE_PATH}`);
  assert.equal(third, `stock=${BWRAP_USERNS_RESTRICT_PROFILE_PATH}`);
  assert.equal(fourth, `disable_dir=${APPARMOR_DISABLE_DIR}`);
});

test('(d) a restricting sysctl and no binaries: installs the packages, writes the profile, loads it', { skip: SKIP }, async (t) => {
  const w = world(t, { sysctl: '1' });
  const result = await runStep(w);
  assert.equal(result.status, 0, result.stdout + result.stderr);
  assert.deepEqual(installs(w, INSTALL_TOOLS[0]), [PACKAGES]);
  assert.equal(readFileSync(w.profile, 'utf8'), bwrapAppArmorProfile());
  assert.deepEqual(recorded(w, LOAD_TOOL), [localised(w, APPARMOR_LOAD_COMMAND).split(' ').slice(1).join(' ')]);
  assert.equal(bwrapCalls(w)[0], PROBE_ARGS);
});

test('(e) a clear sysctl and both binaries present: nothing installed or written, still verified', { skip: SKIP }, async (t) => {
  const w = world(t, { sysctl: '0', present: BINARIES, nested: 'pass' });
  const result = await runStep(w);
  assert.equal(result.status, 0, result.stdout + result.stderr);
  assert.deepEqual(recorded(w, INSTALL_TOOLS[0]), []);
  assert.deepEqual(recorded(w, LOAD_TOOL), []);
  assert.equal(existsSync(w.profile), false);
  assert.deepEqual(bwrapCalls(w), [PROBE_ARGS]);
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
    assert.equal(bwrapCalls(w)[0], PROBE_ARGS);
  });

  await t.test('without the first, the next installs the packages', { skip: SKIP }, async (sub) => {
    const w = world(sub, { sysctl: '0', installers: INSTALL_TOOLS.slice(1) });
    const result = await runStep(w);
    assert.equal(result.status, 0, result.stdout + result.stderr);
    assert.deepEqual(installs(w, INSTALL_TOOLS[1]), [PACKAGES]);
    assert.equal(bwrapCalls(w)[0], PROBE_ARGS);
  });
});

test("(g) the stock profile present: the owner's remedy is applied in order, then verified", { skip: SKIP }, async (t) => {
  const w = world(t, { sysctl: '1', present: BINARIES, stock: true, nested: 'pass' });
  const result = await runStep(w);
  assert.equal(result.status, 0, result.stdout + result.stderr);

  const remedy = bwrapUsernsRestrictRemedy().map((command) => localised(w, command).split(' '));
  const [mkdir, ln, ...parser] = remedy;
  assert.deepEqual(mkdir.slice(0, 2), ['mkdir', '-p']);
  assert.ok(lstatSync(mkdir[2]).isDirectory(), `${mkdir[2]} was created`);
  assert.deepEqual(ln.slice(0, 2), ['ln', '-sf']);
  assert.equal(readlinkSync(ln[3]), ln[2]);
  assert.equal(ln[3], join(w.disableDir, 'bwrap-userns-restrict'));
  assert.equal(ln[2], w.stockFile);
  for (const command of parser) assert.equal(command[0], LOAD_TOOL);
  assert.deepEqual(recorded(w, LOAD_TOOL), parser.map((command) => command.slice(1).join(' ')));
  assert.deepEqual(recorded(w, LOAD_TOOL), [`-R ${w.stockFile}`, `-r ${w.profile}`]);
  assert.equal(readFileSync(w.profile, 'utf8'), bwrapAppArmorProfile());

  assert.equal(NESTED_USERNS_PROBE[0], 'bwrap');
  assert.deepEqual(bwrapCalls(w), [PROBE_ARGS]);
  assert.ok(result.stdout.includes("Ubuntu's bwrap-userns-restrict was disabled"), result.stdout);
});

test('(h) the nested check fails: one ::error:: carrying the confinement reading and the stderr', { skip: SKIP }, async (t) => {
  const w = world(t, { sysctl: '1', present: BINARIES, nested: 'fail' });
  const result = await runStep(w);
  assert.notEqual(result.status, 0, result.stdout + result.stderr);
  const errors = annotated(result, 'error');
  assert.equal(errors.length, 1, result.stdout + result.stderr);
  assert.ok(errors[0].includes(ATTR_READING), errors[0]);
  assert.ok(errors[0].includes(UID_MAP_ERROR), errors[0]);
});

test('(i) the present path still verifies', async (t) => {
  await t.test('and fails when the nested check fails', { skip: SKIP }, async (sub) => {
    const w = world(sub, { sysctl: '0', present: BINARIES, nested: 'fail' });
    const result = await runStep(w);
    assert.notEqual(result.status, 0, result.stdout + result.stderr);
    assert.ok(outputLines(result).includes(PRESENT_LINE), result.stdout);
    assert.equal(annotated(result, 'error').length, 1, result.stdout + result.stderr);
    assert.equal(bwrapCalls(w)[0], PROBE_ARGS);
  });

  await t.test('and, without root or sudo, passes with no warning', { skip: SKIP }, async (sub) => {
    const w = world(sub, { sysctl: '0', present: BINARIES, nested: 'pass', sudo: false });
    const result = await runStep(w);
    assert.equal(result.status, 0, result.stdout + result.stderr);
    const lines = outputLines(result).filter((l) => l !== '');
    assert.equal(lines[0], PRESENT_LINE);
    assert.ok(lines[1].includes('the nested user-namespace check inside bwrap passed'), result.stdout);
    assert.equal(lines.length, 2, result.stdout + result.stderr);
    assert.deepEqual(annotated(result, 'warning'), []);
  });
});

test('(i2) the present path on a non-Linux runner prints the present line only', { skip: SKIP }, async (t) => {
  const w = world(t, { sysctl: '0', present: BINARIES, uname: 'Darwin' });
  const result = await runStep(w);
  assert.equal(result.status, 0, result.stdout + result.stderr);
  assert.deepEqual(outputLines(result).filter((l) => l !== ''), [PRESENT_LINE]);
  assert.deepEqual(bwrapCalls(w), []);
});

test('(j) a failed check with sandbox.optOut taken warns and passes', { skip: SKIP }, async (t) => {
  const w = world(t, { sysctl: '0', present: BINARIES, nested: 'fail', optedOut: true });
  const result = await runStep(w);
  assert.equal(result.status, 0, result.stdout + result.stderr);
  assert.equal(annotated(result, 'warning').length, 1, result.stdout + result.stderr);
  assert.ok(annotated(result, 'warning')[0].includes('sandbox.optOut'));
  assert.deepEqual(annotated(result, 'error'), []);
});

// (j) stubs the library, so this is the case that fails when the real function is renamed.
test('(j2) the function the opt-out arm calls is defined in the real run library', () => {
  const call = stepBody(STEP).match(/\/lib\/harness-run-lib\.sh" && (\w+) /);
  assert.ok(call, 'the step sources the run library and calls one function from it');
  const library = readFileSync(join(PACKAGE_ROOT, 'templates', 'scripts', 'lib', 'harness-run-lib.sh'), 'utf8');
  assert.match(library, new RegExp(`^${call[1]}\\(\\) \\{$`, 'm'));
});

test('(k) a non-Linux runner with something missing makes no bwrap call', { skip: SKIP }, async (t) => {
  const w = world(t, { sysctl: '0', uname: 'Darwin' });
  const result = await runStep(w);
  assert.equal(result.status, 0, result.stdout + result.stderr);
  assert.equal(annotated(result, 'warning').length, 1, result.stdout + result.stderr);
  assert.deepEqual(bwrapCalls(w), []);
});

test("(k2) without the nested check's helper on PATH the step fails without running bwrap", { skip: SKIP }, async (t) => {
  const w = world(t, { sysctl: '0', present: BINARIES, helper: false });
  const result = await runStep(w);
  assert.notEqual(result.status, 0, result.stdout + result.stderr);
  const errors = annotated(result, 'error');
  assert.equal(errors.length, 1, result.stdout + result.stderr);
  assert.ok(errors[0].includes(`${NESTED_USERNS_HELPER} not on PATH`), errors[0]);
  assert.deepEqual(bwrapCalls(w), []);
});

test('(l) a failed install step stops the job before its session, and the job still reports', () => {
  const jobs = load(TEMPLATE).jobs;
  const steps = jobs.run.steps;
  const at = steps.findIndex((s) => s.name === STEP);
  const harness = steps.findIndex((s) => s.name === HARNESS);
  assert.ok(at !== -1 && harness > at, `${STEP} precedes ${HARNESS}`);
  assert.notEqual(steps[at]['continue-on-error'], true);
  for (const step of steps.slice(at, harness + 1)) {
    assert.equal(typeof step.if, 'string', `${step.name} has an if:`);
    assert.doesNotMatch(step.if, /always\(\)|failure\(\)|cancelled\(\)/, step.name);
  }
  for (const name of ['Push the branch', 'Save the state bundle', 'Upload the state bundle', 'Open the pull request and report', 'Continue, wait or stop']) {
    const step = steps.find((s) => s.name === name);
    assert.ok(step, `the run job has the step ${name}`);
    assert.ok(step.if.includes("env.SCRIPTS_DIR != ''"), `${name}: ${step.if}`);
    assert.ok(step.if.includes('always()') || step.if.includes('!cancelled()'), `${name}: ${step.if}`);
  }
  const collect = jobs.collect;
  assert.ok([collect.needs].flat().includes('run'), 'collect needs run');
  assert.ok(collect.if.includes('!cancelled()'), collect.if);
  assert.doesNotMatch(collect.if, /success\(\)|needs\.run\.result/, collect.if);
});

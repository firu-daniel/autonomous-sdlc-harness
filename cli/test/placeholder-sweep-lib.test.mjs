/**
 * The run library's placeholder primitives — `hr_placeholder_host_probe_var`,
 * `hr_placeholder_manifest_write`, `hr_run_profile_absent_files`, `hr_job_absent_file`,
 * `hr_job_absent_files`, `hr_placeholder_leftover_var` and
 * `hr_placeholder_sweep_var` in `cli/templates/scripts/lib/harness-run-lib.sh`.
 *
 * **The rule this suite enforces: the sweep removes only a 0-byte, read-only regular file owned by
 * this user at a path a manifest recorded as absent.** Every keep case is asserted on the bytes and
 * the mode on disk, not on the reason string alone.
 *
 * Each case copies the library into its own throwaway directory under `os.tmpdir()`, sources it
 * from there in one `bash` process, and removes the directory in process. The probe's host facts
 * come from a `uname` stub placed first on `PATH`; the host's own `uname` is never consulted.
 */

import assert from 'node:assert/strict';
import { chmod, copyFile, lstat, mkdir, mkdtemp, readFile, realpath, rm, stat, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import { PACKAGE_ROOT, runBash } from './helpers/fixture.mjs';

const LIB_TEMPLATE = join(PACKAGE_ROOT, 'templates', 'scripts', 'lib', 'harness-run-lib.sh');

const exists = (path) =>
  lstat(path).then(
    () => true,
    () => false,
  );

/** A fresh directory holding a copy of the library, removed after the case. */
async function fixture(t) {
  const root = await realpath(await mkdtemp(join(tmpdir(), 'placeholder-sweep-')));
  t.after(() => rm(root, { recursive: true, force: true }));
  const lib = join(root, 'harness-run-lib.sh');
  await copyFile(LIB_TEMPLATE, lib);
  /** Source the copied library, then run `script` with the remaining values as `$1`, `$2`, …. */
  const call = (script, args = [], env = {}) => runBash(root, ['-c', `. "$1" || exit 99; shift; ${script}`, '_', lib, ...args], env);
  return { root, call };
}

/** Write `content` at `path` and set its mode; returns the path. */
async function plant(path, content, mode) {
  await writeFile(path, content);
  await chmod(path, mode);
  return path;
}

/** The bytes and the permission bits on disk, for an unchanged-file assertion. */
async function onDisk(path) {
  const info = await lstat(path);
  return { mode: info.mode & 0o777, bytes: info.isFile() ? await readFile(path, 'utf8') : null, kind: info.isSymbolicLink() ? 'link' : info.isDirectory() ? 'dir' : 'file' };
}

test('hr_placeholder_host_probe_var answers 1 on Linux and WSL2, 0 on Darwin and when uname fails', async (t) => {
  const f = await fixture(t);
  const stubs = join(f.root, 'stubs');
  await mkdir(stubs);
  await writeFile(
    join(stubs, 'uname'),
    '#!/bin/sh\n[ "${STUB_UNAME_FAIL-}" = 1 ] && exit 1\ncase "$1" in -s) echo "$STUB_UNAME_S" ;; -r) echo "$STUB_UNAME_R" ;; esac\n',
  );
  await chmod(join(stubs, 'uname'), 0o755);
  const cases = [
    ['Linux, generic kernel', { STUB_UNAME_S: 'Linux', STUB_UNAME_R: '6.8.0-45-generic' }, '1'],
    ['Linux, WSL2 kernel', { STUB_UNAME_S: 'Linux', STUB_UNAME_R: '5.15.153.1-microsoft-standard-WSL2' }, '1'],
    ['Darwin', { STUB_UNAME_S: 'Darwin', STUB_UNAME_R: '24.6.0' }, '0'],
    ['failing uname', { STUB_UNAME_S: 'Linux', STUB_UNAME_R: '6.8.0-45-generic', STUB_UNAME_FAIL: '1' }, '0'],
  ];
  for (const [label, env, expected] of cases) {
    const r = await f.call('PATH="$1:$PATH"; HR_PLACEHOLDER_HOST=stale; hr_placeholder_host_probe_var; printf "%s|%s\\n" "$?" "$HR_PLACEHOLDER_HOST"', [stubs], env);
    assert.equal(r.stderr, '', `${label}: ${r.stderr}`);
    assert.equal(r.stdout.trim(), `0|${expected}`, label);
  }
});

test('hr_placeholder_manifest_write lists only the absent arguments, at mode 600 in a 700 directory', async (t) => {
  const f = await fixture(t);
  const present = await plant(join(f.root, 'present'), 'x', 0o644);
  const dangling = join(f.root, 'dangling');
  await symlink(join(f.root, 'no-such-target'), dangling);
  const absentA = join(f.root, 'absent-a');
  const absentB = join(f.root, 'sub', 'absent-b');
  const withNewline = join(f.root, 'absent\nnewline');
  const manifest = join(f.root, 'lane', 'run-profiles', 'slug', 'feat_x.absent');

  const r = await f.call('hr_placeholder_manifest_write "$@"; echo "status=$?"', [manifest, present, absentA, dangling, withNewline, absentB]);
  assert.equal(r.stdout.trim(), 'status=0', r.stderr);
  assert.equal(await readFile(manifest, 'utf8'), `${absentA}\n${absentB}\n`);
  assert.equal((await stat(manifest)).mode & 0o777, 0o600);
  assert.equal((await stat(join(f.root, 'lane', 'run-profiles', 'slug'))).mode & 0o777, 0o700);

  const again = await f.call('hr_placeholder_manifest_write "$@"; echo "status=$?"', [manifest, present]);
  assert.equal(again.stdout.trim(), 'status=0', again.stderr);
  assert.equal(await readFile(manifest, 'utf8'), '', 'a rewrite with no absent argument did not replace the manifest');
});

test('hr_run_profile_absent_files lists only the regular .absent files, and refuses an unanchorable lane', async (t) => {
  const f = await fixture(t);
  const state = join(f.root, 'state');
  const env = { XDG_STATE_HOME: state };
  const list = (slug, extra = env) => f.call('hr_run_profile_absent_files "$1"; printf "status=%s\\n" "$?"', [slug], extra);

  const missing = await list('slug');
  assert.equal(missing.stdout, 'status=0\n', `no directory yet: ${missing.stderr}`);
  assert.equal(await exists(join(state, 'autonomous-sdlc-harness')), false, 'the enumerator created the lane');

  const dir = join(state, 'autonomous-sdlc-harness', 'run-profiles', 'slug');
  await mkdir(dir, { recursive: true });
  const empty = await list('slug');
  assert.equal(empty.stdout, 'status=0\n', `empty directory: ${empty.stderr}`);

  const a = await plant(join(dir, 'feat-a.absent'), '', 0o600);
  const b = await plant(join(dir, 'main.absent'), '/x\n', 0o600);
  await plant(join(dir, 'feat-a.json'), '{}', 0o600);
  await symlink(a, join(dir, 'linked.absent'));
  await mkdir(join(dir, 'a-dir.absent'));
  const mixed = await list('slug');
  assert.equal(mixed.stderr, '');
  assert.deepEqual(mixed.stdout.split('\n').filter(Boolean).sort(), [a, b, 'status=0'].sort());

  const unanchored = await list('slug', { XDG_STATE_HOME: '', HOME: '' });
  assert.equal(unanchored.stdout, 'status=1\n', `unanchorable lane: ${unanchored.stderr}`);
  const noSlug = await list('');
  assert.equal(noSlug.stdout, 'status=1\n', `empty slug: ${noSlug.stderr}`);
});

test('hr_job_absent_file names the manifest under an absolute RUNNER_TEMP, and refuses an empty or relative one', async (t) => {
  const f = await fixture(t);
  const runnerTemp = join(f.root, 'runner-temp');
  const name = (branch, env) => f.call('hr_job_absent_file "$1"; printf "status=%s\\n" "$?"', [branch], env);

  const named = await name('feat/x', { RUNNER_TEMP: `${runnerTemp}/` });
  assert.equal(named.stdout, `${runnerTemp}/autonomous-sdlc-harness-placeholders/feat-x.absent\nstatus=0\n`, named.stderr);
  assert.equal(await exists(runnerTemp), false, 'the namer created a directory');

  for (const [label, env] of [
    ['empty', { RUNNER_TEMP: '' }],
    ['relative', { RUNNER_TEMP: 'runner-temp' }],
  ]) {
    const refused = await name('feat_x', env);
    assert.equal(refused.stdout, 'status=1\n', `${label} RUNNER_TEMP: ${refused.stderr}`);
  }
  const noBranch = await name('', { RUNNER_TEMP: runnerTemp });
  assert.equal(noBranch.stdout, 'status=1\n', `empty branch: ${noBranch.stderr}`);
});

test('hr_job_absent_files lists only the regular, non-link .absent files under RUNNER_TEMP', async (t) => {
  const f = await fixture(t);
  const runnerTemp = join(f.root, 'runner-temp');
  const env = { RUNNER_TEMP: runnerTemp };
  const list = (extra = env) => f.call('hr_job_absent_files; printf "status=%s\\n" "$?"', [], extra);

  const missing = await list();
  assert.equal(missing.stdout, 'status=0\n', `no directory yet: ${missing.stderr}`);
  assert.equal(await exists(runnerTemp), false, 'the enumerator created a directory');

  const dir = join(runnerTemp, 'autonomous-sdlc-harness-placeholders');
  await mkdir(dir, { recursive: true });
  const a = await plant(join(dir, 'feat-a.absent'), '', 0o600);
  const b = await plant(join(dir, 'main.absent'), '/x\n', 0o600);
  await plant(join(dir, 'feat-a.json'), '{}', 0o600);
  await symlink(a, join(dir, 'linked.absent'));
  await mkdir(join(dir, 'a-dir.absent'));
  const mixed = await list();
  assert.equal(mixed.stderr, '');
  assert.deepEqual(mixed.stdout.split('\n').filter(Boolean).sort(), [a, b, 'status=0'].sort());

  const unset = await list({ RUNNER_TEMP: '' });
  assert.equal(unset.stdout, 'status=1\n', `empty RUNNER_TEMP: ${unset.stderr}`);
});

/** The four non-leftover shapes of the predicate, each with the reason it must report. */
async function keepShapes(root) {
  const content = await plant(join(root, 'with-content'), 'planted commondir\n', 0o444);
  const writable = await plant(join(root, 'writable-empty'), '', 0o644);
  const target = await plant(join(root, 'link-target'), '', 0o444);
  const link = join(root, 'a-link');
  await symlink(target, link);
  const dir = join(root, 'a-dir');
  await mkdir(dir);
  return [
    [content, 'has content'],
    [writable, 'writable'],
    [link, 'not a regular file'],
    [dir, 'not a regular file'],
  ];
}

test('hr_placeholder_leftover_var: 0 for a 0444 empty file, 1 with the first failed reason otherwise, touching nothing', async (t) => {
  const f = await fixture(t);
  const leftover = await plant(join(f.root, 'leftover'), '', 0o444);
  const shapes = await keepShapes(f.root);
  const probe = 'HR_PLACEHOLDER_REASON=stale; hr_placeholder_leftover_var "$1"; printf "%s|%s\\n" "$?" "$HR_PLACEHOLDER_REASON"';

  const before = await onDisk(leftover);
  const ok = await f.call(probe, [leftover]);
  assert.equal(ok.stdout, '0|\n', ok.stderr);
  assert.deepEqual(await onDisk(leftover), before, 'the predicate changed the leftover');

  for (const [path, reason] of shapes) {
    const was = await onDisk(path);
    const r = await f.call(probe, [path]);
    assert.equal(r.stdout, `1|${reason}\n`, `${path}: ${r.stderr}`);
    assert.deepEqual(await onDisk(path), was, `the predicate changed ${path}`);
  }
});

test('hr_placeholder_sweep_var removes a listed 0444 empty file and keeps every other listed shape with its reason', async (t) => {
  const f = await fixture(t);
  const leftover = await plant(join(f.root, 'leftover'), '', 0o444);
  const shapes = await keepShapes(f.root);
  const absent = join(f.root, 'never-planted');
  const manifest = join(f.root, 'run.absent');
  await writeFile(manifest, `${[leftover, ...shapes.map(([p]) => p), absent].join('\n')}\n`);
  const before = new Map();
  for (const [path] of shapes) before.set(path, await onDisk(path));

  const r = await f.call(
    'hr_placeholder_sweep_var "$1"; s=$?; printf "status=%s\\n---\\n%s\\n---\\n%s\\n" "$s" "$HR_PLACEHOLDER_REMOVED" "$HR_PLACEHOLDER_KEPT"',
    [manifest],
  );
  assert.equal(r.stderr, '');
  const [status, removed, kept] = r.stdout.replace(/\n$/, '').split('\n---\n');
  assert.equal(status, 'status=0');
  assert.equal(removed, leftover);
  assert.deepEqual(kept.split('\n'), shapes.map(([p, reason]) => `${p}: ${reason}`));
  assert.equal(await exists(leftover), false, 'the leftover was not removed');
  for (const [path] of shapes) assert.deepEqual(await onDisk(path), before.get(path), `the sweep changed ${path}`);
  assert.equal(await exists(join(f.root, 'link-target')), true, 'the sweep followed the link to its target');
  assert.equal(await exists(absent), false);
});

test('hr_placeholder_sweep_var leaves a 0444 empty file no manifest lists, and returns 1 with no readable manifest', async (t) => {
  const f = await fixture(t);
  const unlisted = await plant(join(f.root, 'unlisted'), '', 0o444);
  const manifest = join(f.root, 'run.absent');
  await writeFile(manifest, `${join(f.root, 'other')}\n`);

  const r = await f.call('hr_placeholder_sweep_var "$1" "$2"; printf "%s|%s|%s\\n" "$?" "$HR_PLACEHOLDER_REMOVED" "$HR_PLACEHOLDER_KEPT"', [manifest, join(f.root, 'missing.absent')]);
  assert.equal(r.stdout, '0||\n', r.stderr);
  assert.deepEqual(await onDisk(unlisted), { mode: 0o444, bytes: '', kind: 'file' });

  const none = await f.call('hr_placeholder_sweep_var "$1"; printf "%s\\n" "$?"', [join(f.root, 'missing.absent')]);
  assert.equal(none.stdout, '1\n', none.stderr);
  assert.deepEqual(await onDisk(unlisted), { mode: 0o444, bytes: '', kind: 'file' });
});

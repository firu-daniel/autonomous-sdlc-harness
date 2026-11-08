/**
 * The run library's credential check, push-refusal record, `sandbox.passEnv` reader, profile
 * credential-name reader and job push-credential marker — `hr_credential_values_var`,
 * `hr_text_has_credential`, `hr_stream_has_credential`, `hr_push_refusal_*`,
 * `hr_session_pass_env`, `hr_profile_env_var_names` and `hr_push_credential_is_job_token` in
 * `cli/templates/scripts/lib/harness-run-lib.sh`.
 *
 * **The rule this suite enforces: one credential check, and it never puts a value on a command
 * line.** The last case guards the source rather than the behaviour, because a child's argument
 * vector cannot be observed reliably from a test: it asserts the stream scan feeds `grep` through a
 * process substitution of `printf`, and that no `grep -e`, `echo` or file redirection appears in
 * the credential functions.
 *
 * Each case copies the library into its own throwaway directory under `os.tmpdir()`, with a fake
 * `HOME`, a fake `XDG_CONFIG_HOME` and a throwaway repository, sources it from there in one `bash`
 * process under `set -u`, and removes the directory in process. Every credential variable the
 * library reads is cleared for each call, so the host's own tokens never reach a case.
 */

import assert from 'node:assert/strict';
import { copyFile, lstat, mkdir, mkdtemp, readdir, readFile, realpath, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import { PACKAGE_ROOT, runBash, runGit } from './helpers/fixture.mjs';

const LIB_TEMPLATE = join(PACKAGE_ROOT, 'templates', 'scripts', 'lib', 'harness-run-lib.sh');

const exists = (path) =>
  lstat(path).then(
    () => true,
    () => false,
  );

const b64 = (value) => Buffer.from(`x-access-token:${value}`).toString('base64');

/** A fresh directory holding a copy of the library, a fake home, a fake XDG root and a repository. */
async function fixture(t) {
  const root = await realpath(await mkdtemp(join(tmpdir(), 'credential-scan-')));
  t.after(() => rm(root, { recursive: true, force: true }));
  const lib = join(root, 'harness-run-lib.sh');
  await copyFile(LIB_TEMPLATE, lib);
  const home = join(root, 'home');
  const xdg = join(root, 'xdg');
  const repo = join(root, 'repo');
  const outside = join(root, 'outside');
  await Promise.all([mkdir(home), mkdir(xdg), mkdir(repo), mkdir(outside)]);
  await runGit(repo, ['init', '-q']);
  const baseEnv = {
    HOME: home,
    XDG_CONFIG_HOME: xdg,
    GH_TOKEN: '',
    GITHUB_TOKEN: '',
    HARNESS_PR_TOKEN: '',
    HARNESS_GIT_TOKEN: '',
    GITHUB_ACTIONS: '',
  };
  /** Source the copied library, then run `script` under `set -u` with the remaining values as `$1`, `$2`, …. */
  const call = (script, args = [], env = {}) =>
    runBash(root, ['-c', `. "$1" || exit 99; shift; set -u; ${script}`, '_', lib, ...args], { ...baseEnv, ...env });
  /** `hr_credential_values_var <repo> [extras…]`, then scan `TEXT` both ways; `<status>|<label>|<form>` each. */
  const scan = (text, env = {}, extras = []) =>
    call(
      'hr_credential_values_var "$@"; hr_text_has_credential "$TEXT"; printf "%s|%s|%s\\n" "$?" "$HR_CREDENTIAL_HIT_LABEL" "$HR_CREDENTIAL_HIT_FORM"; ' +
        'hr_stream_has_credential < <(printf "%s" "$TEXT"); printf "%s|%s|%s\\n" "$?" "$HR_CREDENTIAL_HIT_LABEL" "$HR_CREDENTIAL_HIT_FORM"',
      [repo, ...extras],
      { ...env, TEXT: text },
    );
  return { root, repo, home, xdg, outside, call, scan };
}

/** Both scans' lines must be `expected`; returns nothing. */
function assertBoth(r, expected, label) {
  assert.equal(r.stderr, '', `${label}: ${r.stderr}`);
  assert.deepEqual(r.stdout.trim().split('\n'), [expected, expected], label);
}

test('each source is found raw and in base64, labelled by where it came from', async (t) => {
  const f = await fixture(t);
  const envSources = [
    ['GH_TOKEN', 'ghs_jobtoken0001', 'the job token'],
    ['GITHUB_TOKEN', 'ghs_jobtoken0002', 'the job token'],
    ['HARNESS_PR_TOKEN', 'github_pat_pr0003', 'HARNESS_GIT_TOKEN'],
    ['HARNESS_GIT_TOKEN', 'github_pat_git0004', 'HARNESS_GIT_TOKEN'],
  ];
  for (const [name, value, label] of envSources) {
    assertBoth(await f.scan(`diff +${value} tail`, { [name]: value }), `0|${label}|raw`, `${name} raw`);
    assertBoth(await f.scan(`x ${b64(value)} y`, { [name]: value }), `0|${label}|base64`, `${name} base64`);
  }

  const header = `AUTHORIZATION: basic ${b64('ghs_persisted0005')}`;
  await runGit(f.repo, ['config', 'http.https://github.com/.extraheader', header]);
  assertBoth(await f.scan(`+${header}`), '0|the persisted extraheader|raw', 'extraheader raw');
  assertBoth(await f.scan(`+${b64(header)}`), '0|the persisted extraheader|base64', 'extraheader base64');

  await writeFile(join(f.home, '.git-credentials'), 'https://user:homepass0006@example.com\n');
  assertBoth(await f.scan('a homepass0006 b'), '0|a stored git credential|raw', '.git-credentials raw');
  assertBoth(await f.scan(b64('homepass0006')), '0|a stored git credential|base64', '.git-credentials base64');

  await mkdir(join(f.xdg, 'git'));
  await writeFile(join(f.xdg, 'git', 'credentials'), 'https://user:xdgpass0007@example.com\n');
  assertBoth(await f.scan('xdgpass0007'), '0|a stored git credential|raw', 'XDG credentials raw');
  assertBoth(await f.scan(b64('xdgpass0007')), '0|a stored git credential|base64', 'XDG credentials base64');

  assertBoth(await f.scan('saved-oauth-0008', {}, ['saved-oauth-0008']), '0|a saved credential|raw', 'extra value raw');
  assertBoth(await f.scan(b64('saved-oauth-0008'), {}, ['saved-oauth-0008']), '1||', 'an extra value is recorded raw only');
});

test('an extraheader `basic <b64>` yields the token it decodes', async (t) => {
  const f = await fixture(t);
  await runGit(f.repo, ['config', 'http.https://github.com/.extraheader', `AUTHORIZATION: basic ${b64('ghs_decoded0009')}`]);
  assertBoth(await f.scan('leak ghs_decoded0009 here'), '0|the persisted extraheader|raw', 'decoded token');
  assertBoth(await f.scan(`only ${b64('ghs_decoded0009')}`), '0|the persisted extraheader|raw', 'the <b64> itself');
});

test('a `store --file <absolute path>` helper in .git/config yields that file; any other helper shape adds nothing', async (t) => {
  const f = await fixture(t);
  const store = join(f.outside, 'job-credentials');
  await writeFile(store, 'https://x-access-token:ghs_st%2Fored0010@github.com\n');
  const relative = join(f.repo, 'relative-store');
  await writeFile(relative, 'https://u:relativepass0011@github.com\n');

  await runGit(f.repo, ['config', 'credential.https://github.com/owner/repo.helper', 'store']);
  await runGit(f.repo, ['config', '--add', 'credential.https://github.com/owner/repo.helper', 'store --file relative-store']);
  assertBoth(await f.scan('relativepass0011'), '1||', 'plain `store` and a relative --file add nothing');

  await runGit(f.repo, ['config', '--add', 'credential.https://github.com/owner/repo.helper', `store --file ${store}`]);
  assert.equal(await exists(join(f.home, '.git-credentials')), false, 'the fake HOME holds no credential file');
  assertBoth(await f.scan('+ghs_st/ored0010'), '0|a stored git credential|raw', 'the named file, percent-decoded');
  assertBoth(await f.scan(b64('ghs_st/ored0010')), '0|a stored git credential|base64', 'the named file, base64');
});

test('a password shorter than 8 characters is skipped in the home files only', async (t) => {
  const f = await fixture(t);
  await writeFile(join(f.home, '.git-credentials'), 'https://u:abcd@short.example\nhttps://u:abcdefgh@long.example\n');
  assertBoth(await f.scan('the abcd patch'), '1||', 'a 4-character home password is not recorded');
  assertBoth(await f.scan(b64('abcd')), '1||', 'nor its base64 form');
  assertBoth(await f.scan('x abcdefgh y'), '0|a stored git credential|raw', 'an 8-character home password is');

  const store = join(f.outside, 'store');
  await writeFile(store, 'https://u:wxyz@github.com\n');
  await runGit(f.repo, ['config', 'credential.https://github.com.helper', `store --file ${store}`]);
  assertBoth(await f.scan('a wxyz b'), '0|a stored git credential|raw', 'a 4-character password in the named store file is');
});

test('a stream holding no credential returns 1, one holding one returns 0, and an empty set returns 1', async (t) => {
  const f = await fixture(t);
  const env = { GH_TOKEN: 'ghs_streamtoken0012' };
  const big = `${'clean line\n'.repeat(5000)}`;
  assertBoth(await f.scan(big, env), '1||', 'a clean stream');
  assertBoth(await f.scan(`${big}+ghs_streamtoken0012\n${big}`, env), '0|the job token|raw', 'a stream carrying the token');

  const r = await f.call(
    'hr_credential_values_var ""; printf "%s\\n" "${#HR_CREDENTIAL_VALUES[@]}"; hr_stream_has_credential < <(printf "anything\\n"); printf "%s|%s\\n" "$?" "$HR_CREDENTIAL_HIT_LABEL"',
  );
  assert.equal(r.stderr, '');
  assert.equal(r.stdout, '0\n1|\n', 'an empty value set');
});

test('a push-refusal record round-trips, matching the branch exactly', async (t) => {
  const f = await fixture(t);
  const dir = join(f.repo, '.git', 'harness-push-refusals');
  const r = await f.call(
    'hr_push_refusal_dir "$1"; hr_push_refusal_record "$1" feat/x "a workflow file"; echo "rec=$?"; hr_push_refusal_record "$1" feat/x2 "other"; echo "rec=$?"; ' +
      'hr_push_refusals_for_var "$1" feat/x; echo "for=$? n=${#HR_PUSH_REFUSAL_FILES[@]} reason=$HR_PUSH_REFUSAL_REASON"; ' +
      'hr_push_refusal_handled "${HR_PUSH_REFUSAL_FILES[0]}"; echo "handled=$?"; ' +
      'hr_push_refusals_for_var "$1" feat/x; echo "again=$?"; hr_push_refusals_for_var "$1" feat/x2; echo "x2=$? reason=$HR_PUSH_REFUSAL_REASON"',
    [f.repo],
  );
  assert.equal(r.stderr, '');
  assert.equal(
    r.stdout,
    `${dir}\nrec=0\nrec=0\nfor=0 n=1 reason=a workflow file\nhandled=0\nagain=1\nx2=0 reason=other\n`,
  );
  const handled = await readdir(join(dir, 'handled'));
  assert.equal(handled.length, 1);
  assert.match(handled[0], /^[0-9]+-[0-9]+\.refusal$/);
  assert.equal(await readFile(join(dir, 'handled', handled[0]), 'utf8'), 'branch=feat/x\nreason=a workflow file\n');
  const left = (await readdir(dir)).filter((name) => name !== 'handled');
  assert.equal(left.length, 1, `only the feat/x2 record is left: ${left}`);
});

test('a reason or branch carrying a newline is refused, with nothing written', async (t) => {
  const f = await fixture(t);
  const r = await f.call(
    'hr_push_refusal_record "$1" feat/x "$2"; echo "reason=$?"; hr_push_refusal_record "$1" "$2" ok; echo "branch=$?"',
    [f.repo, 'line one\nline two'],
  );
  assert.equal(r.stdout, 'reason=1\nbranch=1\n');
  assert.equal(await exists(join(f.repo, '.git', 'harness-push-refusals')), false);
});

test('hr_session_pass_env prints the valid names and refuses an unreadable configuration', async (t) => {
  const f = await fixture(t);
  const config = join(f.repo, 'harness.config.json');
  const read = () => f.call('hr_session_pass_env "$1"; echo "status=$?"', [f.repo]);
  const cases = [
    [
      'a list with bad entries',
      JSON.stringify({ defaultBranch: 'main', sandbox: { passEnv: ['FOO', '_BAR9', '9BAD', 'has-dash', true, 'A\nB', ''] } }),
      'FOO\n_BAR9\nstatus=0\n',
    ],
    ['an absent key', JSON.stringify({ defaultBranch: 'main' }), 'status=0\n'],
    ['a non-array value', JSON.stringify({ defaultBranch: 'main', sandbox: { passEnv: 'FOO' } }), 'status=0\n'],
    ['an unparsable file', '{"defaultBranch":', 'status=2\n'],
    [
      'a two-document file',
      `${JSON.stringify({ defaultBranch: 'main' })}${JSON.stringify({ defaultBranch: 'main', sandbox: { passEnv: ['FOO'] } })}`,
      'status=2\n',
    ],
  ];
  for (const [label, content, expected] of cases) {
    await writeFile(config, content);
    const r = await read();
    assert.equal(r.stderr, '', label);
    assert.equal(r.stdout, expected, label);
  }
  await rm(config);
  assert.equal((await read()).stdout, 'status=2\n', 'a missing harness.config.json');
});

test('hr_profile_env_var_names prints the valid names in file order and refuses a bad profile', async (t) => {
  const f = await fixture(t);
  const profile = join(f.root, 'settings.json');
  const read = (path = profile) => f.call('hr_profile_env_var_names "$1"; echo "status=$?"', [path]);
  const envVars = [{ name: 'GH_TOKEN' }, 'bare', { name: 7 }, { name: '' }, { name: 'A\nB' }, { name: 'NPM_TOKEN' }];
  const cases = [
    ['a mixed list', { sandbox: { credentials: { envVars } } }, 'GH_TOKEN\nNPM_TOKEN\nstatus=0\n'],
    ['an absent envVars', { sandbox: { credentials: {} } }, 'status=0\n'],
    ['an object envVars', { sandbox: { credentials: { envVars: { name: 'X' } } } }, 'status=1\n'],
  ];
  for (const [label, content, expected] of cases) {
    await writeFile(profile, JSON.stringify(content));
    const r = await read();
    assert.equal(r.stderr, '', label);
    assert.equal(r.stdout, expected, label);
  }
  await writeFile(profile, '{"sandbox":');
  assert.equal((await read()).stdout, 'status=1\n', 'an unparsable profile');
  assert.equal((await read(join(f.root, 'missing.json'))).stdout, 'status=1\n', 'a missing profile');
  assert.equal((await read('')).stdout, 'status=1\n', 'an empty argument');
});

test('hr_push_credential_is_job_token reads the main .git/config marker, never the environment', async (t) => {
  const f = await fixture(t);
  const probe = (env = {}) => f.call('hr_push_credential_is_job_token "$1"; echo "$?"', [f.repo], env);
  assert.equal((await probe()).stdout, '1\n', 'the key absent');
  assert.equal((await probe({ GITHUB_ACTIONS: 'true' })).stdout, '1\n', 'the key absent under GITHUB_ACTIONS=true');
  assert.equal((await f.call('hr_push_credential_is_job_token ""; echo "$?"')).stdout, '1\n', 'an empty main_top');

  const set = (suffix) =>
    f.call(`git config --file "$1/.git/config" "$HR_PUSH_CREDENTIAL_KEY" "\${HR_PUSH_CREDENTIAL_JOB_TOKEN}${suffix}"`, [f.repo]);
  const setX = await set('x');
  assert.equal(setX.status, 0, setX.stderr);
  assert.equal((await probe()).stdout, '1\n', 'another value');
  assert.equal((await set('')).status, 0);
  assert.equal((await probe()).stdout, '0\n', 'the marker set through the constants');
  assert.equal((await f.call('printf "%s|%s|%s" "$HR_PUSH_CREDENTIAL_KEY" "$HR_PUSH_CREDENTIAL_JOB_TOKEN" "$HR_REMOTE_WORKFLOWS_DIR"')).stdout, 'harness.pushCredential|job-token|.github/workflows');
});

test('no credential value reaches a command line or a file (source guard)', async () => {
  const source = await readFile(LIB_TEMPLATE, 'utf8');
  const body = (name) => {
    const start = source.indexOf(`\n${name}() {\n`);
    assert.ok(start >= 0, `${name} is not defined`);
    const end = source.indexOf('\n}\n', start);
    return source
      .slice(start, end)
      .split('\n')
      .filter((line) => !line.trimStart().startsWith('#'))
      .join('\n');
  };
  assert.ok(
    body('hr_stream_has_credential').includes(`-f <(printf '%s\\n' "\${HR_CREDENTIAL_VALUES[@]}")`),
    'the stream scan feeds grep its patterns through a process substitution of printf',
  );
  const credentialFunctions = [
    'hr_credential_add',
    'hr_percent_decode_var',
    'hr_credential_file_add',
    'hr_credential_values_var',
    'hr_text_has_credential',
    'hr_stream_has_credential',
  ];
  for (const name of credentialFunctions) {
    const text = body(name);
    assert.doesNotMatch(text, /\bgrep\b[^\n]*\s-[A-Za-z]*e\b/, `${name} passes a pattern to grep with -e`);
    assert.doesNotMatch(text, /\becho\b/, `${name} echoes`);
    assert.doesNotMatch(text, /(^|[^0-9<])>(?!\s*\/dev\/null)/m, `${name} redirects output into a file`);
  }
});

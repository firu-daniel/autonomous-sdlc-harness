/**
 * `remote-run.sh push-credential store|erase`, the `run` job's push credential.
 *
 * **The rule these tests exist to enforce: the stored entry pushes, and nothing else in the operator's
 * store is touched.** `store` writes one path-scoped entry first in `$HOME/.git-credentials`, mode
 * `0600`, and sets the checkout's `useHttpPath`, its path-scoped `helper` naming that file by absolute
 * path, and the job push-credential marker; `erase` removes exactly that entry and the three keys. The
 * marker is graded by the reader `push-branch.sh` uses — the fixture's own copy of
 * `lib/harness-run-lib.sh` → `hr_push_credential_is_job_token` — never by a literal of this file's.
 *
 * The fixture is an adopted repository under the system temp directory whose `origin` is rewritten to an
 * `https://` URL on a fake `GITHUB_SERVER_URL` host, with a fake `HOME` already holding the operator's
 * entries for that host: one with no path and one for another path. Assertions read the files on disk
 * and the checkout's config, never the exit status alone. No case reaches the network: `git credential
 * fill` answers from the store file alone, with prompts off.
 */

import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import { MAIN_REPO_ANCHOR_VARIABLE } from '../dist/core/mainRepoAnchor.js';
import { createFixture, INIT_SCRIPTS_DIR, runBash, runCli } from './helpers/fixture.mjs';

const SCRIPT = `${INIT_SCRIPTS_DIR}/remote-run.sh`;
const HOST = 'git.example.test';
const SERVER = `https://${HOST}`;
const REPO_PATH = 'octo/fixture.git';
const ORIGIN = `${SERVER}/${REPO_PATH}`;
const OTHER_URL = `${SERVER}/other/repo.git`;
const TOKEN = 'ghs_jobPushToken0123456789';
const OPERATOR_STORE = `https://operator:operator-host-secret@${HOST}\nhttps://operator:operator-other-secret@${HOST}/other/repo.git\n`;
const USE_HTTP_PATH_KEY = `credential.${SERVER}.useHttpPath`;
const HELPER_KEY = `credential.${ORIGIN}.helper`;

/**
 * Run git with a fixed argument vector, prompts off and no system configuration; never throws.
 *
 * @param {string} cwd
 * @param {string[]} args
 * @param {{ env?: Record<string, string>, input?: string }} [options]
 */
function git(cwd, args, { env = {}, input } = {}) {
  const result = spawnSync('git', args, {
    cwd,
    input,
    encoding: 'utf8',
    env: {
      ...process.env,
      [MAIN_REPO_ANCHOR_VARIABLE]: '',
      GIT_CONFIG_NOSYSTEM: '1',
      GIT_CONFIG_SYSTEM: '/dev/null',
      GIT_TERMINAL_PROMPT: '0',
      GIT_ASKPASS: '',
      SSH_ASKPASS: '',
      ...env,
    },
  });
  return { status: result.status, stdout: result.stdout ?? '', stderr: result.stderr ?? '' };
}

/**
 * An adopted fixture whose origin is `ORIGIN`, and a fake `HOME` holding the operator's store.
 *
 * @param {import('node:test').TestContext} t
 * @param {{ homePrefix?: string, origin?: string }} [options]
 */
async function credentialFixture(t, { homePrefix = 'push-credential-home-', origin = ORIGIN } = {}) {
  const fixture = await createFixture({
    files: { 'package.json': { name: 'fixture-project', private: true, version: '0.0.0', scripts: { test: 'echo test' } } },
  });
  t.after(fixture.cleanup);
  const { dir } = fixture;
  const init = await runCli(dir, ['init']);
  assert.equal(init.status, 0, `init exited ${init.status}\n${init.stdout}\n${init.stderr}`);
  assert.equal(git(dir, ['remote', 'set-url', 'origin', origin]).status, 0);

  const home = mkdtempSync(join(tmpdir(), homePrefix));
  t.after(() => rmSync(home, { recursive: true, force: true }));
  const store = join(home, '.git-credentials');
  writeFileSync(store, OPERATOR_STORE, { mode: 0o644 });
  // The operator's own global helper, so a query this checkout's helper does not answer reaches their store.
  const globalConfig = join(home, 'gitconfig');
  writeFileSync(globalConfig, '[credential]\n\thelper = store\n');
  const gitEnv = { HOME: home, XDG_CONFIG_HOME: join(home, '.config'), GIT_CONFIG_GLOBAL: globalConfig };
  const lib = join(dir, INIT_SCRIPTS_DIR, 'lib', 'harness-run-lib.sh');

  return {
    dir,
    home,
    store,
    /** @param {'store' | 'erase'} action @param {Record<string, string>} [env] */
    run: (action, env = {}) =>
      runBash(dir, [SCRIPT, 'push-credential', action], { HOME: home, GITHUB_SERVER_URL: SERVER, GH_TOKEN: TOKEN, ...env }),
    /** @param {string} key */
    configGet: (key) => {
      const got = git(dir, ['config', '--local', '--get', key]);
      return got.status === 0 ? got.stdout.replace(/\n$/, '') : null;
    },
    /** The marker as `push-branch.sh` reads it: 0 when set to the job token, else 1. */
    markerStatus: async () => {
      const read = await runBash(dir, ['-c', '. "$1" && hr_push_credential_is_job_token "$2"', 'marker', lib, dir]);
      return read.status;
    },
    /** @param {string} url @param {string} cwd */
    fill: (url, cwd = dir) => git(cwd, ['credential', 'fill'], { env: gitEnv, input: `url=${url}\n\n` }),
  };
}

/** @param {{ stdout: string }} filled */
const passwordOf = (filled) => (filled.stdout.split('\n').find((line) => line.startsWith('password=')) ?? '').slice('password='.length);

test('store writes the path-scoped entry first, mode 0600, and the three keys; it pushes and the token is in no output line', async (t) => {
  const f = await credentialFixture(t);
  const result = await f.run('store');
  assert.equal(result.status, 0, result.stderr);
  const lines = readFileSync(f.store, 'utf8').split('\n').filter(Boolean);
  assert.equal(lines[0], `https://x-access-token:${TOKEN}@${HOST}/${REPO_PATH}`);
  assert.deepEqual(lines.slice(1).join('\n') + '\n', OPERATOR_STORE);
  assert.equal(statSync(f.store).mode & 0o777, 0o600);
  assert.equal(f.configGet(USE_HTTP_PATH_KEY), 'true');
  assert.equal(f.configGet(HELPER_KEY), `store --file ${f.store}`);
  assert.equal(await f.markerStatus(), 0);
  assert.match(result.stdout, new RegExp(`${HOST}/${REPO_PATH.replace('.', '\\.')}`));
  for (const line of `${result.stdout}\n${result.stderr}`.split('\n')) assert.ok(!line.includes(TOKEN), line);

  assert.equal(passwordOf(f.fill(ORIGIN)), TOKEN);
  const other = f.fill(OTHER_URL);
  assert.equal(passwordOf(other), 'operator-other-secret');
  assert.ok(!other.stdout.includes(TOKEN));
});

test('erase removes only the path-scoped entry and all three keys', async (t) => {
  const f = await credentialFixture(t);
  assert.equal((await f.run('store')).status, 0);
  const result = await f.run('erase', { GH_TOKEN: '' });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(readFileSync(f.store, 'utf8'), OPERATOR_STORE);
  assert.equal(f.configGet(USE_HTTP_PATH_KEY), null);
  assert.equal(f.configGet(HELPER_KEY), null);
  assert.equal(await f.markerStatus(), 1);
  assert.doesNotMatch(result.stdout, /::warning::/);
  // Outside the checkout, a host-wide query reaches the operator's host entry again.
  assert.equal(passwordOf(f.fill(`${SERVER}/anything.git`, f.home)), 'operator-host-secret');
});

test('a HOME whose path carries a space stores nothing and sets no key', async (t) => {
  const f = await credentialFixture(t, { homePrefix: 'push credential home-' });
  const result = await f.run('store');
  assert.equal(result.status, 0, result.stderr);
  assert.equal(readFileSync(f.store, 'utf8'), OPERATOR_STORE);
  assert.equal(f.configGet(USE_HTTP_PATH_KEY), null);
  assert.equal(f.configGet(HELPER_KEY), null);
  assert.equal(await f.markerStatus(), 1);
  assert.match(result.stdout, /nothing written/);
});

test('without GH_TOKEN nothing is written and no marker is set', async (t) => {
  const f = await credentialFixture(t);
  const result = await f.run('store', { GH_TOKEN: '' });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(readFileSync(f.store, 'utf8'), OPERATOR_STORE);
  assert.equal(f.configGet(HELPER_KEY), null);
  assert.equal(await f.markerStatus(), 1);
  assert.match(result.stdout, /GH_TOKEN is not set; nothing written/);
});

test('a non-https origin writes nothing and sets no marker', async (t) => {
  const f = await credentialFixture(t, { origin: `git@${HOST}:${REPO_PATH}` });
  const result = await f.run('store');
  assert.equal(result.status, 0, result.stderr);
  assert.equal(readFileSync(f.store, 'utf8'), OPERATOR_STORE);
  assert.equal(f.configGet(USE_HTTP_PATH_KEY), null);
  assert.equal(await f.markerStatus(), 1);
  assert.match(result.stdout, /origin is not https:\/\/git\.example\.test\/<path>; nothing written/);
});

test('a missing or unknown action, or --repo, is a usage error that writes nothing', async (t) => {
  const f = await credentialFixture(t);
  for (const args of [[], ['save'], ['store', '--repo', f.dir], ['store', 'extra']]) {
    const result = await runBash(f.dir, [SCRIPT, 'push-credential', ...args], { HOME: f.home, GITHUB_SERVER_URL: SERVER, GH_TOKEN: TOKEN });
    assert.equal(result.status, 1, `${args.join(' ')}\n${result.stdout}\n${result.stderr}`);
  }
  assert.equal(readFileSync(f.store, 'utf8'), OPERATOR_STORE);
  assert.equal(await f.markerStatus(), 1);
  assert.ok(!existsSync(join(f.dir, '.git', 'harness-push-refusals')));
});

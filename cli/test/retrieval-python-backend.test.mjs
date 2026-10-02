/**
 * `cli/src/retrieval/pythonBackend.ts`'s parser and resolution helpers.
 *
 * **The rule these tests exist to enforce: every name the Python backend is reached by is spelled in
 * that module once, and each copy outside the compiler is a declared mirror** — so the self-check
 * parser reads exactly `CheckLine.render`'s shape and nothing looser, and `launcherSearchPath` answers
 * what `hr_path_with_fallbacks` prints.
 *
 * The library is spawned through `/bin/bash` by absolute path, not `runBash`: a case inherits an
 * EMPTY `PATH`, under which a bare `bash` would fail at spawn before the library is reached
 * (`cli/test/outer-loop-scripts.test.mjs` → `sourceAndCallWithEnv`).
 */

import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { join } from 'node:path';
import test from 'node:test';

import {
  launcherSearchPath,
  PYTHON_DATABASE_URL_VARIABLE,
  PYTHON_DEFAULT_DATABASE_URL,
  parseSelfCheck,
  pythonDatabaseUrl,
  SELF_CHECK_INDEX_NOT_ATTEMPTED,
} from '../dist/retrieval/pythonBackend.js';
import { PACKAGE_ROOT } from './helpers/fixture.mjs';

const LIB = join(PACKAGE_ROOT, 'templates', 'scripts', 'lib', 'harness-run-lib.sh');

const ALL_OK = [
  'ok   packages: python 3.12.4, every package resolves',
  'ok   weights: present in /cache/models',
  'ok   index: 12 documents, 80 chunks',
  '',
].join('\n');

test('parseSelfCheck reads the all-ok shape', () => {
  const parsed = parseSelfCheck(ALL_OK);
  assert.ok(parsed !== undefined);
  assert.deepEqual([...parsed.keys()], ['packages', 'weights', 'index']);
  assert.deepEqual(parsed.get('packages'), {
    question: 'packages',
    ok: true,
    detail: 'python 3.12.4, every package resolves',
  });
  assert.equal(parsed.get('index').detail, '12 documents, 80 chunks');
});

for (const failing of ['packages', 'weights', 'index']) {
  test(`parseSelfCheck reads a FAIL on ${failing}`, () => {
    const lines = ALL_OK.split('\n').map((line) =>
      line.startsWith(`ok   ${failing}:`) ? `FAIL ${failing}: broken` : line,
    );
    const parsed = parseSelfCheck(lines.join('\n'));
    assert.ok(parsed !== undefined);
    for (const [question, line] of parsed) {
      assert.equal(line.ok, question !== failing, question);
    }
    assert.equal(parsed.get(failing).detail, 'broken');
  });
}

test('parseSelfCheck reads the index line that was not attempted', () => {
  const parsed = parseSelfCheck(
    [
      'FAIL packages: missing torch',
      'FAIL weights: /cache/models is missing model.safetensors',
      'FAIL index: not attempted, because packages failed',
    ].join('\n'),
  );
  assert.ok(parsed !== undefined);
  assert.deepEqual(parsed.get('index'), {
    question: 'index',
    ok: false,
    detail: 'not attempted, because packages failed',
  });
});

for (const stoppedBy of ['packages', 'weights']) {
  test(`SELF_CHECK_INDEX_NOT_ATTEMPTED names ${stoppedBy} as the question that stopped the index`, () => {
    assert.equal(
      SELF_CHECK_INDEX_NOT_ATTEMPTED.exec(`not attempted, because ${stoppedBy} failed`)?.[1],
      stoppedBy,
    );
  });
}

const UNREADABLE = {
  'two lines': ['ok   packages: a', 'ok   weights: b'],
  'four lines': ['ok   packages: a', 'ok   weights: b', 'ok   index: c', 'ok   index: d'],
  'reordered questions': ['ok   weights: b', 'ok   packages: a', 'ok   index: c'],
  'an unknown question': ['ok   packages: a', 'ok   models: b', 'ok   index: c'],
  'a missing prefix': ['ok   packages: a', 'weights: b', 'ok   index: c'],
};

for (const [name, lines] of Object.entries(UNREADABLE)) {
  test(`parseSelfCheck answers undefined for ${name}`, () => {
    assert.equal(parseSelfCheck(lines.join('\n')), undefined);
  });
}

test('pythonDatabaseUrl answers the default unless the server env holds a non-empty string', () => {
  for (const env of [undefined, {}, { [PYTHON_DATABASE_URL_VARIABLE]: '' }, { [PYTHON_DATABASE_URL_VARIABLE]: 5432 }]) {
    assert.equal(pythonDatabaseUrl(env), PYTHON_DEFAULT_DATABASE_URL, JSON.stringify(env));
  }
  const url = 'postgresql://someone@db.internal:6543/docs';
  assert.equal(pythonDatabaseUrl({ [PYTHON_DATABASE_URL_VARIABLE]: url }), url);
});

/** `hr_path_with_fallbacks`'s stdout under a controlled `PATH` and `HOME`, newline stripped. */
function libraryPath(path, home) {
  return new Promise((resolve, reject) => {
    const options = { encoding: 'utf8', env: { PATH: path, HOME: home } };
    execFile('/bin/bash', ['-c', '. "$1"; hr_path_with_fallbacks', '_', LIB], options, (error, out, err) => {
      if (error !== null) reject(new Error(`hr_path_with_fallbacks failed: ${err}`));
      else resolve(out.replace(/\n$/, ''));
    });
  });
}

test('launcherSearchPath matches hr_path_with_fallbacks under an empty PATH', async () => {
  const home = '/tmp/harness home';
  assert.equal(launcherSearchPath('', home), await libraryPath('', home));
});

test('launcherSearchPath matches hr_path_with_fallbacks under an inherited PATH', async () => {
  const home = '/tmp/harness-home/';
  const inherited = '/custom/bin::/usr/bin:/tmp/harness-home/.local/bin:/bin';
  assert.equal(launcherSearchPath(inherited, home), await libraryPath(inherited, home));
});
